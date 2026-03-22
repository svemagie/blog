/**
 * Funkwhale image caching utility.
 *
 * Funkwhale stores album art on Wasabi S3 with presigned URLs that expire
 * after ~1 hour. This module downloads images at build time and serves them
 * from a local cache so the HTML never contains expiring URLs.
 *
 * Cache key: URL path without query params (stable across re-signs)
 * Cache dir: .cache/funkwhale-images/  (copied to _site/images/funkwhale-cache/ via passthrough)
 * GC: after each build, files no longer referenced by any displayed item are deleted.
 */

import { createHash } from "crypto";
import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "fs";
import { resolve, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../.cache/funkwhale-images");
const PUBLIC_PATH = "/images/funkwhale-cache";

// Tracks every local filename produced during this build run
const _activeFilenames = new Set();

/**
 * Cache a Funkwhale cover image locally.
 *
 * @param {string|null} url - Presigned S3 URL (may be null)
 * @returns {Promise<string|null>} Local public path, or original URL as fallback
 */
export async function cacheFunkwhaleImage(url) {
  if (!url) return null;

  let stablePath;
  try {
    stablePath = new URL(url).pathname;
  } catch {
    return url;
  }

  // Derive a stable, filesystem-safe filename from the URL path
  const hash = createHash("md5").update(stablePath).digest("hex");
  const ext = extname(stablePath).replace(/^\./, "") || "jpg";
  const filename = `${hash}.${ext}`;
  const cachePath = resolve(CACHE_DIR, filename);

  // Return cached file if it already exists (no TTL — GC handles cleanup)
  if (existsSync(cachePath)) {
    _activeFilenames.add(filename);
    return `${PUBLIC_PATH}/${filename}`;
  }

  // Download using the full presigned URL (which is valid at build time)
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      console.warn(
        `[cache-funkwhale-image] HTTP ${response.status} for ${stablePath}`
      );
      return url;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(cachePath, buffer);
    _activeFilenames.add(filename);
    return `${PUBLIC_PATH}/${filename}`;
  } catch (err) {
    console.warn(`[cache-funkwhale-image] Failed to cache ${stablePath}: ${err.message}`);
    return url;
  }
}

/**
 * Delete cached images that are no longer referenced by any current item.
 * Call this once after all cacheCoverUrls() calls for the build are complete.
 */
export function gcFunkwhaleImages() {
  if (!existsSync(CACHE_DIR)) return;
  let deleted = 0;
  for (const file of readdirSync(CACHE_DIR)) {
    if (!_activeFilenames.has(file)) {
      rmSync(resolve(CACHE_DIR, file), { force: true });
      deleted++;
    }
  }
  if (deleted > 0) {
    console.log(`[cache-funkwhale-image] GC: removed ${deleted} unreferenced image(s)`);
  }
}

/**
 * Cache coverUrl on an array of track objects in-place (mutates copies).
 *
 * @param {Array<object>} items
 * @returns {Promise<Array<object>>}
 */
export async function cacheCoverUrls(items) {
  if (!items?.length) return items ?? [];
  return Promise.all(
    items.map(async (item) => {
      if (!item.coverUrl) return item;
      return { ...item, coverUrl: await cacheFunkwhaleImage(item.coverUrl) };
    })
  );
}
