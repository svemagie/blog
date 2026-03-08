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

export default {
  layout: "layouts/post.njk",
  eleventyComputed: {
    permalink: (data) => normalizePermalink(data.permalink),
  },
};
