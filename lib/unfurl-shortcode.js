import { unfurl } from "unfurl.js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";

const CACHE_DIR = resolve(import.meta.dirname, "..", ".cache", "unfurl");
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function getCachePath(url) {
  const hash = createHash("md5").update(url).digest("hex");
  return resolve(CACHE_DIR, `${hash}.json`);
}

function readCache(url) {
  const path = getCachePath(url);
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    if (Date.now() - data.cachedAt < CACHE_DURATION_MS) {
      return data.metadata;
    }
  } catch {
    // Corrupt cache file, ignore
  }
  return null;
}

function writeCache(url, metadata) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const path = getCachePath(url);
  writeFileSync(path, JSON.stringify({ cachedAt: Date.now(), metadata }));
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Register the {% unfurl "URL" %} shortcode on an Eleventy config.
 */
export default function registerUnfurlShortcode(eleventyConfig) {
  eleventyConfig.addAsyncShortcode("unfurl", async function (url) {
    if (!url) return "";

    // Check cache first
    let metadata = readCache(url);

    if (!metadata) {
      try {
        metadata = await unfurl(url, { timeout: 10000 });
        writeCache(url, metadata);
      } catch (err) {
        console.warn(`[unfurl] Failed to fetch ${url}: ${err.message}`);
        // Fallback: plain link
        const domain = escapeHtml(extractDomain(url));
        return `<a href="${escapeHtml(url)}" rel="noopener" target="_blank">${domain}</a>`;
      }
    }

    const og = metadata.open_graph || {};
    const tc = metadata.twitter_card || {};

    const title = og.title || tc.title || metadata.title || extractDomain(url);
    const description = og.description || tc.description || metadata.description || "";
    const image =
      og.images?.[0]?.url ||
      tc.images?.[0]?.url ||
      null;
    const favicon = metadata.favicon || null;
    const domain = extractDomain(url);

    // Truncate description
    const maxDesc = 160;
    const desc = description.length > maxDesc
      ? description.slice(0, maxDesc).trim() + "\u2026"
      : description;

    // Build card HTML
    const imgHtml = image
      ? `<div class="unfurl-card-image shrink-0">
          <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async"
               class="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-r-lg" />
        </div>`
      : "";

    const faviconHtml = favicon
      ? `<img src="${escapeHtml(favicon)}" alt="" class="inline-block w-4 h-4 mr-1 align-text-bottom" loading="lazy" />`
      : "";

    return `<div class="unfurl-card not-prose my-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 overflow-hidden hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
  <a href="${escapeHtml(url)}" rel="noopener" target="_blank" class="flex no-underline text-inherit hover:text-inherit">
    <div class="flex-1 p-3 sm:p-4 min-w-0">
      <p class="font-semibold text-sm sm:text-base text-surface-900 dark:text-surface-100 truncate m-0">${escapeHtml(title)}</p>
      ${desc ? `<p class="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1 m-0 line-clamp-2">${escapeHtml(desc)}</p>` : ""}
      <p class="text-xs text-surface-400 dark:text-surface-500 mt-2 m-0">${faviconHtml}${escapeHtml(domain)}</p>
    </div>
    ${imgHtml}
  </a>
</div>`;
  });
}
