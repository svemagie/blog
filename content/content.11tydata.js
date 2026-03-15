const normalizePermalink = (permalink) => {
  if (typeof permalink !== "string") return permalink;

  if (/^https?:\/\//i.test(permalink)) {
    try {
      const { pathname } = new URL(permalink);
      if (!pathname) return "/";
      return pathname.endsWith("/") ? pathname : `${pathname}/`;
    } catch {
      return permalink;
    }
  }

  return permalink;
};

/** Valid garden stages — keep in sync with eleventy.config.js gardenStageInfo */
const GARDEN_STAGES = new Set([
  "plant", "cultivate", "evergreen", "question", "repot", "revitalize", "revisit",
]);

const GARDEN_PREFIX = "garden/";

/**
 * Derive gardenStage from nested tags/categories (e.g. "garden/cultivate")
 * if the post doesn't already have an explicit gardenStage frontmatter property.
 * Handles both string and array values for `category` and `tags`.
 * Works with or without a leading `#`.
 */
const deriveGardenStage = (data) => {
  if (data.gardenStage) return data.gardenStage;
  const fields = [data.category, data.tags].flat().filter(Boolean);
  for (const tag of fields) {
    const clean = String(tag).replace(/^#/, "");
    if (clean.startsWith(GARDEN_PREFIX)) {
      const stage = clean.slice(GARDEN_PREFIX.length);
      if (GARDEN_STAGES.has(stage)) return stage;
    }
  }
  return undefined;
};

export default {
  layout: "layouts/post.njk",
  eleventyComputed: {
    permalink: (data) => normalizePermalink(data.permalink),
    // Derive gardenStage from nested tags if not set explicitly in frontmatter.
    // A post with category: [garden/cultivate, dev] gets gardenStage: "cultivate"
    // automatically, with no other changes needed downstream.
    gardenStage: (data) => deriveGardenStage(data),
  },
};
