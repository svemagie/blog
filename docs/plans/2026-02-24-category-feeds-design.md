# Per-Category RSS and JSON Feeds — Design

## Goal

Generate `/categories/{slug}/feed.xml` (RSS 2.0) and `/categories/{slug}/feed.json` (JSON Feed 1.1) for every category, so readers and AI agents can subscribe to specific topics.

## Architecture

Pre-built `categoryFeeds` collection in `eleventy.config.js` groups posts by category in a single O(posts) pass. Two pagination templates iterate over this collection to produce feed files. No filtering happens in Nunjucks — templates receive pre-sorted, pre-limited post arrays.

## Components

### 1. Data Layer — `categoryFeeds` Collection

New collection in `eleventy.config.js`. Single pass over all published posts, grouping by category slug. Each entry:

```
{ name: "IndieWeb", slug: "indieweb", posts: [post1, post2, ...] }
```

- Posts sorted newest-first, limited to 50 per category
- Uses the existing `slugify` logic from the `categories` collection
- Independent from the existing `categories` collection (which stays untouched)

### 2. Feed Templates

**`category-feed.njk`** — RSS 2.0

- Pagination: `collections.categoryFeeds`, size 1, alias `categoryFeed`
- Permalink: `/categories/{{ categoryFeed.slug }}/feed.xml`
- Channel title: `"{{ site.name }} — {{ categoryFeed.name }}"`
- Self link: category feed URL
- WebSub hub link: `https://websubhub.com/hub`
- Items: iterate `categoryFeed.posts` — same structure as main `feed.njk`
- `eleventyExcludeFromCollections: true`
- `eleventyImport.collections: [categoryFeeds]`

**`category-feed-json.njk`** — JSON Feed 1.1

- Same pagination setup, permalink `.json`
- Same structure as main `feed-json.njk` with category-specific title/feed_url
- Includes textcasting support, attachments, image fallback chain

### 3. Discovery — Link Tags in `base.njk`

Conditional `<link rel="alternate">` tags for category pages:

```nunjucks
{% if category and page.url.startsWith('/categories/') and page.url != '/categories/' %}
<link rel="alternate" type="application/rss+xml"
      href="/categories/{{ category | slugify }}/feed.xml"
      title="{{ category }} — RSS Feed">
<link rel="alternate" type="application/json"
      href="/categories/{{ category | slugify }}/feed.json"
      title="{{ category }} — JSON Feed">
{% endif %}
```

The `category` variable flows from the `categories.njk` pagination alias through the data cascade into the layout.

### 4. WebSub Notifications

Extend the existing `eleventy.after` hook:

- After full builds (non-incremental), scan `categories/*/feed.xml` in the output directory
- Notify `https://websubhub.com/hub` for each discovered category feed URL (both RSS and JSON)
- Batch into a single POST request where possible
- Same incremental guard as existing notifications

### 5. Incremental Build Behavior

No special handling required:

- Templates declare `eleventyImport.collections: [categoryFeeds]`
- Eleventy 3.x rebuilds all dependent pages when the collection changes
- All category feeds regenerate on any post change (acceptable — feed templates are cheap text, no image processing)
- WebSub notifications only fire on full builds (same as current behavior)

## Files Changed

| File | Change |
|------|--------|
| `eleventy.config.js` | Add `categoryFeeds` collection; extend WebSub notification in `eleventy.after` |
| `category-feed.njk` | New — RSS 2.0 pagination template |
| `category-feed-json.njk` | New — JSON Feed 1.1 pagination template |
| `_includes/layouts/base.njk` | Add conditional `<link rel="alternate">` for category pages |

## Not Changed

- Main feeds (`feed.njk`, `feed-json.njk`) — untouched
- Category HTML pages (`categories.njk`, `categories-index.njk`) — untouched
- nginx/Caddy config — static files served automatically
- Deployment repos — no config changes needed
- Pagefind, markdown-agents — no interaction

## Constraints

- 50 items per category feed
- RSS 2.0 and JSON Feed 1.1 formats matching existing main feeds
- WebSub hub: `https://websubhub.com/hub`
