/**
 * Computed data resolved during the data cascade.
 *
 * Eleventy 3.x parallel rendering causes `page.url`, `page.fileSlug`,
 * and `page.inputPath` to return values from OTHER pages being processed
 * concurrently. This affects both templates and eleventyComputed functions.
 *
 * IMPORTANT: Only `permalink` is computed here, because it reads from the
 * file's own frontmatter data (per-file, immune to race conditions).
 * OG image lookups are done in templates using the `permalink` data value
 * and Nunjucks filters (see base.njk).
 *
 * NEVER use `page.url`, `page.fileSlug`, or `page.inputPath` here.
 *
 * See: https://github.com/11ty/eleventy/issues/3183
 */

export default {
  eleventyComputed: {
    // Compute permalink from file path for posts without explicit frontmatter permalink.
    // Pattern: content/{type}/{yyyy}-{MM}-{dd}-{slug}.md → /{type}/{yyyy}/{MM}/{dd}/{slug}/
    permalink: (data) => {
      // Convert stale /content/ permalinks from pre-beta.37 posts to canonical format
      if (data.permalink && typeof data.permalink === "string") {
        const contentMatch = data.permalink.match(
          /^\/content\/([^/]+)\/(\d{4})-(\d{2})-(\d{2})-(.+?)\/?$/
        );
        if (contentMatch) {
          const [, type, year, month, day, slug] = contentMatch;
          return `/${type}/${year}/${month}/${day}/${slug}/`;
        }
        // Valid non-/content/ permalink — use as-is
        return data.permalink;
      }

      // No frontmatter permalink — compute from file path
      // NOTE: data.page.inputPath may be wrong due to parallel rendering,
      // but posts without frontmatter permalink are rare (only pre-beta.37 edge cases)
      const inputPath = data.page?.inputPath || "";
      const match = inputPath.match(
        /content\/([^/]+)\/(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/
      );
      if (match) {
        const [, type, year, month, day, slug] = match;
        return `/${type}/${year}/${month}/${day}/${slug}/`;
      }

      // For non-matching files (pages, root files), let Eleventy decide
      return data.permalink;
    },
  },
};
