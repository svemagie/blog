# Weekly Digest Feature Design

**Date:** 2026-02-25
**Status:** APPROVED

## Overview

A weekly digest that aggregates all posts from a given ISO week into a single summary page and RSS feed item. Subscribers get one update per week instead of per-post — a "slow RSS" feed.

## Requirements

- **Included post types:** All except replies (articles, notes, photos, bookmarks, likes, reposts)
- **Format:** Summary list — title + link + short excerpt for each post, grouped by type
- **Likes/bookmarks (no title):** Show target URL as label (e.g. "Liked: https://example.com/post")
- **Week definition:** ISO 8601 weeks (Monday–Sunday)
- **Empty weeks:** Skipped entirely (no page or feed item generated)
- **Output:**
  - HTML page per week at `/digest/YYYY/WNN/`
  - Paginated index at `/digest/`
  - RSS feed at `/digest/feed.xml`

## Approach

Eleventy collection + pagination (same pattern as `categoryFeeds`). Pure build-time, no plugins, no external data sources.

## Design

### 1. Collection: `weeklyDigests`

Added in `eleventy.config.js`. Groups all published posts (excluding replies) by ISO week number.

Each entry in the collection:

```javascript
{
  year: 2026,
  week: 9,
  slug: "2026/W09",
  label: "Week 9, 2026",
  startDate: "2026-02-23",   // Monday
  endDate: "2026-03-01",     // Sunday
  posts: [ /* all posts, newest-first */ ],
  byType: {
    articles: [...],
    notes: [...],
    photos: [...],
    bookmarks: [...],
    likes: [...],
    reposts: [...]
  }
}
```

- `byType` is pre-computed so templates don't filter
- Post type detection reuses blog.njk logic (check likeOf, bookmarkOf, repostOf, inReplyTo, photo, title)
- Empty types omitted from `byType`
- Collection sorted newest-week-first

### 2. Templates

**`digest.njk`** — Individual digest page

- Paginated over `weeklyDigests` collection
- Permalink: `/digest/2026/W09/`
- Layout: `base.njk` with sidebar
- Heading: "Week 9, 2026 — Feb 23 – Mar 1"
- Sections per type present that week:
  - Articles/notes: title or content excerpt + date + permalink
  - Photos: thumbnail + caption excerpt + permalink
  - Bookmarks: "Bookmarked: https://target-url" + date + permalink
  - Likes: "Liked: https://target-url" + date + permalink
  - Reposts: "Reposted: https://target-url" + date + permalink
- Previous/next digest navigation at bottom

**`digest-index.njk`** — Paginated index

- Permalink: `/digest/` (paginated: `/digest/page/2/`)
- Lists: week label, date range, post count, link to digest page
- 20 digests per page

**`digest-feed.njk`** — RSS feed

- Permalink: `/digest/feed.xml`
- Each `<item>` = one week's digest
- Title: "Week 9, 2026 (Feb 23 – Mar 1)"
- Description: HTML summary list (grouped by type, same as HTML page)
- pubDate: Sunday (end of week)
- Latest 20 digests

### 3. Discovery

- `<link rel="alternate">` for digest feed in `base.njk`
- "Digest" navigation item (conditional on digests existing)

### 4. Files Changed

| File | Change |
|------|--------|
| `eleventy.config.js` | Add `weeklyDigests` collection |
| `digest.njk` | New — individual digest page |
| `digest-index.njk` | New — paginated index |
| `digest-feed.njk` | New — RSS feed |
| `_includes/layouts/base.njk` | Add alternate link for digest feed |

No new dependencies. No data files. No Indiekit plugin changes.
