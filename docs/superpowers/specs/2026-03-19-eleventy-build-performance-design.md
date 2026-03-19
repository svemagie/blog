# Eleventy Build Performance Optimization — Design Spec

**Date:** 2026-03-19
**Goal:** Reduce production build time (GitHub Actions deploy)
**Approach:** Measure first, fix known low-hanging fruit in the same pass

---

## Context

The blog runs Eleventy 3 with a monolithic `eleventy.config.js`. Two `eleventy.before` hooks run outside Eleventy's own timer:

1. **OG image generation** — spawns a subprocess loop using Satori + resvg; manifest-based so incremental, but the loop still initializes every build.
2. **Unfurl prefetch** — walks all content files, parses frontmatter, calls `prefetchUrl()` for every interaction URL (likes, bookmarks, replies, reposts). Network responses are disk-cached by `eleventy-fetch`, but the walk + parse + cache-hit overhead runs unconditionally on every build.

One filter is also a known repeated-work issue:

- **`hash` filter** — reads a file from disk and computes MD5 on every call. The same 2–3 paths are passed on every page render (hundreds of pages), with no caching.

Inspired by [rmendes.net — Optimizing Eleventy Build Performance](https://rmendes.net/articles/2026/03/10/optimizing-eleventy-build-performance/).

---

## Changes

### 1. Build timing instrumentation

**Purpose:** Establish a baseline and validate that fixes in changes 2 and 3 have real impact.

**Implementation:**
- Add `console.time("[og] image generation")` / `console.timeEnd(...)` around the OG `eleventy.before` hook body in `eleventy.config.js`.
- Add `console.time("[unfurl] prefetch")` / `console.timeEnd(...)` around the unfurl `eleventy.before` hook body.
- No logic is touched; labels are prefixed with `[og]` and `[unfurl]` to match existing log conventions.

**How to use:**
```bash
DEBUG=Eleventy:Benchmark* npm run build 2>&1 | grep -E "Benchmark|og|unfurl"
```

This captures both Eleventy's internal timings (collections, transforms, filters, rendering) and the two before-hook timings in a single build run.

**Note on OG subprocess output:** The OG hook uses `execFileSync` with `stdio: "inherit"`, which means the subprocess writes directly to the parent's stdout/stderr — its output bypasses any pipe or grep on the parent process. The `console.time("[og] image generation")` and `console.timeEnd(...)` calls on the parent process measure the full wall time of the entire subprocess-spawn loop and will appear in filtered output. Individual per-batch log lines from the subprocess itself (`[og] Generating...`) will appear unfiltered inline.

---

### 2. `hash` filter memoization

**Location:** `eleventy.config.js` — `addFilter("hash", ...)` at ~line 744

**Problem:** `readFileSync()` + MD5 on every call. With 500+ pages each calling `| hash` for 2–3 asset paths, this is ~1000+ redundant disk reads per build.

**Fix:** Wrap with a `Map` cache, cleared on `eleventy.before`. Declare `const _hashCache = new Map()` inside the config export function body, immediately before the `addFilter("hash", ...)` call — matching the placement of `_dateDisplayCache` at line 550 (not at module scope):

```js
const _hashCache = new Map();
eleventyConfig.on("eleventy.before", () => { _hashCache.clear(); });
eleventyConfig.addFilter("hash", (filePath) => {
  if (_hashCache.has(filePath)) return _hashCache.get(filePath);
  try {
    const fullPath = resolve(__dirname, filePath.startsWith("/") ? `.${filePath}` : filePath);
    const result = createHash("md5").update(readFileSync(fullPath)).digest("hex").slice(0, 8);
    _hashCache.set(filePath, result);
    return result;
  } catch {
    return Date.now().toString(36);
  }
});
```

**Properties:**
- Cache is per-build (cleared on `eleventy.before`), so a CSS change during `npm run dev` is always picked up on the next rebuild.
- Pattern is identical to existing `_dateDisplayCache` and `_isoDateCache`.

---

### 3. Unfurl prefetch manifest skip

**Location:** `eleventy.config.js` — the `async eleventy.before` hook at ~line 1421

**Problem:** The hook walks all content files and calls `prefetchUrl()` for every interaction URL on every build, even when no new interaction posts have been added since the last build.

**Fix:** A manifest file at `.cache/unfurl-manifest.json` tracks the set of previously prefetched URLs. On each build, only URLs absent from the manifest are prefetched. If no new URLs exist, the hook exits immediately after the walk.

**Manifest lifecycle:**
- **First build / cold cache:** no manifest → full prefetch → manifest written with all URLs.
- **Subsequent builds, no new posts:** manifest loaded → `newUrls` is empty → early return, no network calls.
- **New interaction post added:** manifest loaded → new URL detected → only that URL prefetched → manifest updated.
- **Manifest deleted / corrupted:** falls back to full prefetch (same as first build).

**Implementation sketch:**

```js
eleventyConfig.on("eleventy.before", async () => {
  const contentDir = resolve(__dirname, "content");
  if (!existsSync(contentDir)) return;

  // --- existing walk to collect `urls` Set (unchanged) ---

  if (urls.size === 0) return;

  // Load manifest of previously seen URLs
  const manifestPath = resolve(__dirname, ".cache", "unfurl-manifest.json");
  let seen = new Set();
  try {
    seen = new Set(JSON.parse(readFileSync(manifestPath, "utf-8")));
  } catch { /* first build */ }

  const newUrls = [...urls].filter(u => !seen.has(u));

  if (newUrls.length === 0) {
    console.log("[unfurl] No new URLs — skipping prefetch");
    return;
  }

  // Prefetch only new URLs using existing batch logic
  // (replace `urlArray` with `newUrls` in the batch loop)

  // Update manifest
  mkdirSync(resolve(__dirname, ".cache"), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify([...urls]));
});
```

**Properties:**
- Manifest stored in `.cache/` — same gitignore and passthrough-copy rules as existing unfurl cache.
- `writeFileSync` is used (not async) to guarantee the manifest is written even if the process exits unexpectedly mid-batch. On failure, next build falls back to full prefetch.
- The content walk still runs on every build (cheap: local FS reads of small frontmatter). Only the prefetch calls are skipped.
- Writing `[...urls]` (not `[...seen, ...newUrls]`) is intentional: it prunes URLs for soft-deleted posts on the next prefetch-triggering build, preventing unbounded manifest growth.

---

## Files changed

| File | Change |
|------|--------|
| `eleventy.config.js` | Add timing to 2 before-hooks; memoize `hash` filter; add manifest skip to unfurl hook |

No new files. No new dependencies.

---

## Success criteria

1. `console.time` output visible in production build logs.
2. `DEBUG=Eleventy:Benchmark*` output available for baseline comparison.
3. On a build with no new posts: `[unfurl] No new URLs — skipping prefetch` logged.
4. Hash filter: modify a referenced asset (e.g. `css/style.css`) between two builds and confirm the `?v=` query string changes in rendered HTML. No log output expected — verify via view-source or build diff.
5. No change to rendered output.
