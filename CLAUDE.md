# CLAUDE.md — svemagie/blog

This is svemagie's personal IndieWeb blog at **blog.giersig.eu**.
Stack: Eleventy 3 · Tailwind CSS 3 · Alpine.js · IndieKit (Micropub) · Self hosting.

The theme lives in a separate repo (`svemagie/blog-eleventy-indiekit`, tracked as the `theme` remote). This repo is the live site and has diverged significantly from that upstream — treat them as related but independent.

---

## Architecture

### Core files
- `eleventy.config.js` — monolithic config: all plugins, filters, shortcodes, collections, passthrough copies
- `_data/site.js` — all site config driven by env vars; no hardcoded personal values in source
- `_data/*.js` — individual data files for feeds (GitHub, Bluesky, Mastodon, Last.fm, etc.)
- `_includes/layouts/` — page layout templates (`base.njk`, `post.njk`, etc.)
- `_includes/components/` — reusable Nunjucks partials
- `lib/` — build-time JS utilities (`og.js`, `unfurl-shortcode.js`, `data-fetch.js`)
- `scripts/` — maintenance scripts (`check-upstream-widget-drift.mjs`)

### Content
`content/` is a **symlink** to IndieKit's managed content directory — it is gitignored but Eleventy processes it via `setUseGitIgnore(false)`. Never edit posts in `content/` directly; they are created and updated via IndieKit's Micropub endpoint.

Post types: `articles`, `notes`, `bookmarks`, `likes`, `replies`, `reposts`, `photos`, `pages`.

### Build output
`_site/` — generated site, not committed. Also excluded from Eleventy processing to prevent loops.

---

## Key custom systems

### Digital Garden (`gardenStage`)
Posts carry a `gardenStage` front-matter value: `seedling`, `budding`, `cultivating`, or `evergreen`. Stage can also be derived from nested tags (`garden/cultivate` → `cultivating`, etc.).

**Garden badge component** (`_includes/components/garden-badge.njk`):
- In post-list templates, set `gardenStage` from `post.data.gardenStage` before including, or rely on the component's own fallback.
- The badge is included **once per post-type branch** (`{% if post.type == "article" %}...{% elif %}...{% endif %}`). Do not add it outside those branches — it will render for every post regardless of type and produce duplicate badges.

### AI Disclosure
Posts declare AI involvement level in front matter (e.g. `aiCode: T1/C2`). Rendered as a badge below post content and as a hidden `.p-ai-code-level` span in list cards.

### Nested tags
Categories use Obsidian-style path notation (`lang/de`, `tech/programming`). The `nestedSlugify()` function in `eleventy.config.js` preserves `/` separators during slug generation. Slugification is applied per segment.

### Unfurl shortcode
`{% unfurl url %}` generates a rich link preview card with caching. Cache lives in `.cache/unfurl/`. The shortcode is registered from `lib/unfurl-shortcode.js`.

### OG image generation
`lib/og.js` + `lib/og-cli.js` — generates Open Graph images at build time using Satori and resvg-js. Avatar is pulled from `AUTHOR_AVATAR` env var.

### Upstream drift check
```bash
npm run check:upstream-widgets         # Report widget drift vs theme remote
npm run check:upstream-widgets:strict  # Exit 1 if any drift found
```

---

## Templates — things to know

### `blog.njk`
The main blog listing. Each post type (article, note, bookmark, like, repost, reply, photo) has its own `{% if/elif %}` branch. The AI badge and pagination are **outside** those branches at the `<li>` / `<nav>` level. Garden badge must stay **inside** each branch.

### `base.njk`
Site-wide layout. Header nav uses Alpine.js for dropdowns (`x-data="{ open: false }"`). Dashboard link is auth-gated. Mobile nav mirrors desktop nav.

### `_data/site.js`
All values come from env vars. The `SITE_SOCIAL` env var uses pipe-and-comma encoding: `"Name|URL|icon,Name|URL|icon"`. If not set, social links are auto-derived from feed env vars (GITHUB_USERNAME, BLUESKY_HANDLE, etc.).

---

## Deploy workflow

1. Push to `main` on `github.com:svemagie/blog`
2. GitHub Action runs `npm install && npm run build`
3. Rsync pushes `_site/` to Indiekit server
4. `content/.indiekit/` is excluded from `--delete` to preserve IndieKit state

The build runs with all env vars injected from GitHub Secrets / Cloudron app settings.

---

## Common tasks

**Add a new Nunjucks filter:** Register in `eleventy.config.js` with `eleventyConfig.addFilter(...)`.

**Add a new post type:** Create the template page + add a branch in `blog.njk` + add to `_data/enabledPostTypes.js`.

**Check what's drifted from theme upstream:**
```bash
npm run check:upstream-widgets
```

**Rebuild CSS only:**
```bash
npm run build:css
```

**Local dev:**
```bash
npm run dev   # Eleventy + live reload on localhost:8080
```

---

## Env vars (quick ref)

See `README.md` for the full table. Essential ones:

```
SITE_URL          https://blog.giersig.eu
SITE_NAME         giersig.
AUTHOR_NAME       svemagie
SITE_LOCALE       de
ACTIVITYPUB_HANDLE  svemagie
GITHUB_USERNAME   svemagie
BLUESKY_HANDLE    svemagie
```

---

## What's diverged from upstream (summary)

- **Digital Garden system** — gardenStage, badges, /garden/ page, nested garden/* tags
- **AI disclosure** — aiCode front matter, badge component, p-ai-code-level
- **Nested tags** — Obsidian-style path categories
- **Navigation redesign** — curated header nav with Alpine.js dropdowns; footer restructured
- **Fedify ActivityPub** — own AP actor at `@svemagie@blog.giersig.eu`
- **OG image generation** — Satori + resvg build-time generation
- **Webmention self-filter** — own Bluesky account filtered from interactions
- **Markdown Agents** — clean Markdown served to AI crawlers
- **Mermaid diagrams** — `eleventy-plugin-mermaid` integrated
- **Upstream drift check script** — `scripts/check-upstream-widget-drift.mjs`
