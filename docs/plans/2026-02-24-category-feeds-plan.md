# Per-Category RSS and JSON Feeds — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate `/categories/{slug}/feed.xml` and `/categories/{slug}/feed.json` for every category so readers and AI agents can subscribe to specific topics.

**Architecture:** A pre-built `categoryFeeds` collection in `eleventy.config.js` groups posts by category in a single O(posts) pass. Two pagination templates iterate over this collection to produce feed files. WebSub notifications are extended to cover category feed URLs.

**Tech Stack:** Eleventy 3.x, Nunjucks, @11ty/eleventy-plugin-rss, WebSub

---

### Task 1: Add `categoryFeeds` collection to eleventy.config.js

**Files:**
- Modify: `eleventy.config.js:729` (after the existing `categories` collection, before `recentPosts`)

**Step 1: Add the collection**

Insert this code at `eleventy.config.js:730` (the blank line between the `categories` collection closing `});` and the `// Recent posts for sidebar` comment):

```javascript
  // Category feeds — pre-grouped posts for per-category RSS/JSON feeds
  eleventyConfig.addCollection("categoryFeeds", function (collectionApi) {
    const slugify = (str) => str.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
    const grouped = new Map(); // slug -> { name, slug, posts[] }

    collectionApi
      .getFilteredByGlob("content/**/*.md")
      .filter(isPublished)
      .sort((a, b) => b.date - a.date)
      .forEach((item) => {
        if (!item.data.category) return;
        const cats = Array.isArray(item.data.category) ? item.data.category : [item.data.category];
        for (const cat of cats) {
          if (!cat || typeof cat !== "string" || !cat.trim()) continue;
          const slug = slugify(cat.trim());
          if (!slug) continue;
          if (!grouped.has(slug)) {
            grouped.set(slug, { name: cat.trim(), slug, posts: [] });
          }
          const entry = grouped.get(slug);
          if (entry.posts.length < 50) {
            entry.posts.push(item);
          }
        }
      });

    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  });
```

**Step 2: Verify the collection builds**

Run:
```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
npx @11ty/eleventy --dryrun 2>&1 | head -20
```

Expected: No errors. The dryrun should complete without crashing. You won't see categoryFeeds output yet since no template uses it.

**Step 3: Commit**

```bash
git add eleventy.config.js
git commit -m "feat: add categoryFeeds collection for per-category RSS/JSON feeds"
```

---

### Task 2: Create RSS 2.0 category feed template

**Files:**
- Create: `category-feed.njk`

**Step 1: Create the template**

Create `category-feed.njk` in the project root (same level as `feed.njk`):

```nunjucks
---
eleventyExcludeFromCollections: true
eleventyImport:
  collections:
    - categoryFeeds
pagination:
  data: collections.categoryFeeds
  size: 1
  alias: categoryFeed
permalink: "categories/{{ categoryFeed.slug }}/feed.xml"
---
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>{{ site.name }} — {{ categoryFeed.name }}</title>
    <link>{{ site.url }}/categories/{{ categoryFeed.slug }}/</link>
    <description>Posts tagged with "{{ categoryFeed.name }}" on {{ site.name }}</description>
    <language>{{ site.locale | default('en') }}</language>
    <atom:link href="{{ site.url }}/categories/{{ categoryFeed.slug }}/feed.xml" rel="self" type="application/rss+xml"/>
    <atom:link href="https://websubhub.com/hub" rel="hub"/>
    <lastBuildDate>{{ categoryFeed.posts | getNewestCollectionItemDate | dateToRfc822 }}</lastBuildDate>
    {%- for post in categoryFeed.posts %}
    {%- set absolutePostUrl = site.url + post.url %}
    {%- set postImage = post.data.photo %}
    {%- if postImage %}
      {%- if postImage[0] and (postImage[0] | length) > 10 %}
        {%- set postImage = postImage[0] %}
      {%- endif %}
    {%- endif %}
    {%- if not postImage or postImage == "" %}
      {%- set postImage = post.data.image or (post.content | extractFirstImage) %}
    {%- endif %}
    <item>
      <title>{{ post.data.title | default(post.content | striptags | truncate(80)) | escape }}</title>
      <link>{{ absolutePostUrl }}</link>
      <guid isPermaLink="true">{{ absolutePostUrl }}</guid>
      <pubDate>{{ post.date | dateToRfc822 }}</pubDate>
      <description>{{ post.content | htmlToAbsoluteUrls(absolutePostUrl) | escape }}</description>
      {%- if postImage and postImage != "" and (postImage | length) > 10 %}
      {%- set imageUrl = postImage | url | absoluteUrl(site.url) %}
      <enclosure url="{{ imageUrl }}" type="image/jpeg" length="0"/>
      <media:content url="{{ imageUrl }}" medium="image"/>
      {%- endif %}
    </item>
    {%- endfor %}
  </channel>
</rss>
```

**Step 2: Verify the template generates feed files**

Run:
```bash
npx @11ty/eleventy --dryrun 2>&1 | grep "category-feed.njk" | head -5
```

Expected: Lines showing `Writing ... /categories/<slug>/feed.xml from ./category-feed.njk` for multiple categories.

**Step 3: Commit**

```bash
git add category-feed.njk
git commit -m "feat: add RSS 2.0 per-category feed template"
```

---

### Task 3: Create JSON Feed 1.1 category feed template

**Files:**
- Create: `category-feed-json.njk`

**Step 1: Create the template**

Create `category-feed-json.njk` in the project root:

```nunjucks
---
eleventyExcludeFromCollections: true
eleventyImport:
  collections:
    - categoryFeeds
pagination:
  data: collections.categoryFeeds
  size: 1
  alias: categoryFeed
permalink: "categories/{{ categoryFeed.slug }}/feed.json"
---
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "{{ site.name }} — {{ categoryFeed.name }}",
  "home_page_url": "{{ site.url }}/categories/{{ categoryFeed.slug }}/",
  "feed_url": "{{ site.url }}/categories/{{ categoryFeed.slug }}/feed.json",
  "hubs": [
    {
      "type": "WebSub",
      "url": "https://websubhub.com/hub"
    }
  ],
  "description": "Posts tagged with \"{{ categoryFeed.name }}\" on {{ site.name }}",
  "language": "{{ site.locale | default('en') }}",
  "authors": [
    {
      "name": "{{ site.author.name | default(site.name) }}",
      "url": "{{ site.url }}/"
    }
  ],
  "_textcasting": {
    "version": "1.0",
    "about": "https://textcasting.org/"
    {%- set hasSupport = site.support and (site.support.url or site.support.stripe or site.support.lightning or site.support.paymentPointer) %}
    {%- if hasSupport %},
    "support": {{ site.support | textcastingSupport | jsonEncode | safe }}
    {%- endif %}
  },
  "items": [
    {%- for post in categoryFeed.posts %}
    {%- set absolutePostUrl = site.url + post.url %}
    {%- set postImage = post.data.photo %}
    {%- if postImage %}
      {%- if postImage[0] and (postImage[0] | length) > 10 %}
        {%- set postImage = postImage[0] %}
      {%- endif %}
    {%- endif %}
    {%- if not postImage or postImage == "" %}
      {%- set postImage = post.data.image or (post.content | extractFirstImage) %}
    {%- endif %}
    {
      "id": "{{ absolutePostUrl }}",
      "url": "{{ absolutePostUrl }}",
      "title": {% if post.data.title %}{{ post.data.title | jsonEncode | safe }}{% else %}null{% endif %},
      "content_html": {{ post.content | htmlToAbsoluteUrls(absolutePostUrl) | jsonEncode | safe }},
      "content_text": {{ post.content | striptags | jsonEncode | safe }},
      "date_published": "{{ post.date | dateToRfc3339 }}",
      "date_modified": "{{ (post.data.updated or post.date) | dateToRfc3339 }}"
      {%- if postImage and postImage != "" and (postImage | length) > 10 %},
      "image": "{{ postImage | url | absoluteUrl(site.url) }}"
      {%- endif %}
      {%- set attachments = post.data | feedAttachments %}
      {%- if attachments.length > 0 %},
      "attachments": {{ attachments | jsonEncode | safe }}
      {%- endif %}
    }{% if not loop.last %},{% endif %}
    {%- endfor %}
  ]
}
```

**Step 2: Verify the template generates feed files**

Run:
```bash
npx @11ty/eleventy --dryrun 2>&1 | grep "category-feed-json.njk" | head -5
```

Expected: Lines showing `Writing ... /categories/<slug>/feed.json from ./category-feed-json.njk` for multiple categories.

**Step 3: Commit**

```bash
git add category-feed-json.njk
git commit -m "feat: add JSON Feed 1.1 per-category feed template"
```

---

### Task 4: Add discovery link tags in base.njk

**Files:**
- Modify: `_includes/layouts/base.njk:98` (after the markdown alternate link block, before the authorization_endpoint link)

**Step 1: Add the conditional link tags**

In `_includes/layouts/base.njk`, find this line (currently line 98):

```nunjucks
  {% endif %}
  <link rel="authorization_endpoint" href="{{ site.url }}/auth">
```

Insert the category feed links between `{% endif %}` (closing the markdown agents block) and the authorization_endpoint link:

```nunjucks
  {% endif %}
  {% if category and page.url and page.url.startsWith('/categories/') and page.url != '/categories/' %}
  <link rel="alternate" type="application/rss+xml" href="/categories/{{ category | slugify }}/feed.xml" title="{{ category }} — RSS Feed">
  <link rel="alternate" type="application/json" href="/categories/{{ category | slugify }}/feed.json" title="{{ category }} — JSON Feed">
  {% endif %}
  <link rel="authorization_endpoint" href="{{ site.url }}/auth">
```

**Step 2: Verify the link tags appear on a category page**

Run a full build and check a category page:

```bash
npx @11ty/eleventy 2>&1 | tail -3
```

Then inspect a generated category page:

```bash
grep -A1 'category.*RSS Feed' _site/categories/indieweb/index.html
```

Expected: The two `<link rel="alternate">` tags with correct category slug in the href.

**Step 3: Commit**

```bash
git add _includes/layouts/base.njk
git commit -m "feat: add RSS/JSON feed discovery links on category pages"
```

---

### Task 5: Extend WebSub notifications for category feeds

**Files:**
- Modify: `eleventy.config.js:876-893` (the WebSub notification block inside `eleventy.after`)

**Step 1: Replace the WebSub notification block**

Find the existing WebSub block (starts at line 874):

```javascript
    // WebSub hub notification — skip on incremental rebuilds
    if (incremental) return;
    const hubUrl = "https://websubhub.com/hub";
    const feedUrls = [
      `${siteUrl}/`,
      `${siteUrl}/feed.xml`,
      `${siteUrl}/feed.json`,
    ];
    for (const feedUrl of feedUrls) {
      try {
        const res = await fetch(hubUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `hub.mode=publish&hub.url=${encodeURIComponent(feedUrl)}`,
        });
        console.log(`[websub] Notified hub for ${feedUrl}: ${res.status}`);
      } catch (err) {
        console.error(`[websub] Hub notification failed for ${feedUrl}:`, err.message);
      }
    }
```

Replace with:

```javascript
    // WebSub hub notification — skip on incremental rebuilds
    if (incremental) return;
    const hubUrl = "https://websubhub.com/hub";
    const feedUrls = [
      `${siteUrl}/`,
      `${siteUrl}/feed.xml`,
      `${siteUrl}/feed.json`,
    ];

    // Discover category feed URLs from build output
    const outputDir = directories?.output || dir.output;
    const categoriesDir = resolve(outputDir, "categories");
    try {
      for (const entry of readdirSync(categoriesDir, { withFileTypes: true })) {
        if (entry.isDirectory() && existsSync(resolve(categoriesDir, entry.name, "feed.xml"))) {
          feedUrls.push(`${siteUrl}/categories/${entry.name}/feed.xml`);
          feedUrls.push(`${siteUrl}/categories/${entry.name}/feed.json`);
        }
      }
    } catch {
      // categoriesDir may not exist on first build — ignore
    }

    console.log(`[websub] Notifying hub for ${feedUrls.length} URLs...`);
    for (const feedUrl of feedUrls) {
      try {
        const res = await fetch(hubUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `hub.mode=publish&hub.url=${encodeURIComponent(feedUrl)}`,
        });
        console.log(`[websub] Notified hub for ${feedUrl}: ${res.status}`);
      } catch (err) {
        console.error(`[websub] Hub notification failed for ${feedUrl}:`, err.message);
      }
    }
```

Note: `readdirSync`, `existsSync`, and `resolve` are already imported at the top of `eleventy.config.js` (line 14-15).

**Step 2: Verify no syntax errors**

Run:
```bash
npx @11ty/eleventy --dryrun 2>&1 | tail -5
```

Expected: No errors. Dryrun completes normally.

**Step 3: Commit**

```bash
git add eleventy.config.js
git commit -m "feat: extend WebSub notifications to include category feed URLs"
```

---

### Task 6: Full build and end-to-end verification

**Files:** None (verification only)

**Step 1: Run a full Eleventy build**

```bash
npx @11ty/eleventy 2>&1 | tail -5
```

Expected: Build completes with increased file count (2 extra files per category). Look for the `Wrote NNNN files` summary line — it should be noticeably higher than the previous build count of ~2483.

**Step 2: Verify RSS feed content**

```bash
head -15 _site/categories/indieweb/feed.xml
```

Expected: Valid RSS 2.0 XML with `<title>` containing the site name and category name, `<atom:link>` self and hub references, and `<item>` entries.

**Step 3: Verify JSON feed content**

```bash
head -20 _site/categories/indieweb/feed.json
```

Expected: Valid JSON Feed 1.1 with `title`, `feed_url`, `hubs`, and `items` array.

**Step 4: Count generated category feeds**

```bash
find _site/categories/ -name "feed.xml" | wc -l
find _site/categories/ -name "feed.json" | wc -l
```

Expected: Both counts should be equal and match the number of categories on the site.

**Step 5: Verify discovery links in HTML**

```bash
grep 'category.*feed.xml\|category.*feed.json' _site/categories/indieweb/index.html
```

Expected: Two `<link rel="alternate">` tags — one RSS, one JSON — with correct category slug URLs.

**Step 6: Commit all work (if any uncommitted changes remain)**

```bash
git status
```

If clean, no action needed. Otherwise commit any remaining changes.
