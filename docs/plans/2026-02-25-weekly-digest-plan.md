# Weekly Digest Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a weekly digest feature that aggregates posts by ISO week into HTML pages and a dedicated RSS feed.

**Architecture:** Eleventy collection (`weeklyDigests`) groups all published non-reply posts by ISO week. Three Nunjucks templates paginate over this collection to produce individual digest pages, a paginated index, and an RSS feed. Discovery links added to the base layout.

**Tech Stack:** Eleventy collections, Nunjucks templates, `@11ty/eleventy-plugin-rss` filters, Tailwind CSS classes (existing theme).

**Design doc:** `docs/plans/2026-02-25-weekly-digest-design.md`

---

## Task 1: Add `weeklyDigests` Collection

**Files:**
- Modify: `eleventy.config.js` (insert after `recentPosts` collection, ~line 767)

**Step 1: Write the collection code**

Add the following collection after the `recentPosts` collection (after line 767) in `eleventy.config.js`:

```javascript
  // Weekly digests — posts grouped by ISO week for digest pages and RSS feed
  eleventyConfig.addCollection("weeklyDigests", function (collectionApi) {
    const allPosts = collectionApi
      .getFilteredByGlob("content/**/*.md")
      .filter(isPublished)
      .filter((item) => {
        // Exclude replies
        return !(item.data.inReplyTo || item.data.in_reply_to);
      })
      .sort((a, b) => b.date - a.date);

    // Group by ISO week
    const weekMap = new Map(); // "YYYY-WNN" -> { year, week, posts[] }

    for (const post of allPosts) {
      const d = new Date(post.date);
      // ISO week calculation
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1;
      const jan4DayOfWeek = (jan4.getDay() + 6) % 7; // Mon=0
      const weekNum = Math.floor((dayOfYear + jan4DayOfWeek - 1) / 7) + 1;

      // ISO year can differ from calendar year at year boundaries
      let isoYear = d.getFullYear();
      if (weekNum < 1) {
        isoYear--;
      } else if (weekNum > 52) {
        const dec31 = new Date(d.getFullYear(), 11, 31);
        const dec31Day = (dec31.getDay() + 6) % 7;
        if (dec31Day < 3) {
          // This week belongs to next year
          isoYear++;
        }
      }

      // Use a more reliable ISO week calculation
      const getISOWeek = (date) => {
        const d2 = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d2.getUTCFullYear(), 0, 1));
        return Math.ceil(((d2 - yearStart) / 86400000 + 1) / 7);
      };
      const getISOYear = (date) => {
        const d2 = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay() || 7));
        return d2.getUTCFullYear();
      };

      const week = getISOWeek(d);
      const year = getISOYear(d);
      const key = `${year}-W${String(week).padStart(2, "0")}`;

      if (!weekMap.has(key)) {
        // Calculate Monday (start) and Sunday (end) of ISO week
        const simple = new Date(Date.UTC(year, 0, 4));
        const dayOfWeek = simple.getUTCDay() || 7;
        simple.setUTCDate(simple.getUTCDate() - dayOfWeek + 1); // Monday of week 1
        const monday = new Date(simple);
        monday.setUTCDate(monday.getUTCDate() + (week - 1) * 7);
        const sunday = new Date(monday);
        sunday.setUTCDate(sunday.getUTCDate() + 6);

        weekMap.set(key, {
          year,
          week,
          slug: `${year}/W${String(week).padStart(2, "0")}`,
          label: `Week ${week}, ${year}`,
          startDate: monday.toISOString().slice(0, 10),
          endDate: sunday.toISOString().slice(0, 10),
          posts: [],
        });
      }

      weekMap.get(key).posts.push(post);
    }

    // Build byType for each week and convert to array
    const typeDetect = (post) => {
      if (post.data.likeOf || post.data.like_of) return "likes";
      if (post.data.bookmarkOf || post.data.bookmark_of) return "bookmarks";
      if (post.data.repostOf || post.data.repost_of) return "reposts";
      if (post.data.photo && post.data.photo.length) return "photos";
      if (post.data.title) return "articles";
      return "notes";
    };

    const digests = [...weekMap.values()].map((entry) => {
      const byType = {};
      for (const post of entry.posts) {
        const type = typeDetect(post);
        if (!byType[type]) byType[type] = [];
        byType[type].push(post);
      }
      return { ...entry, byType };
    });

    // Sort newest-week-first
    digests.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

    return digests;
  });
```

**Step 2: Verify the build still succeeds**

Run: `cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme && npx @11ty/eleventy --dryrun 2>&1 | tail -20`

Expected: Build completes with no errors. The `weeklyDigests` collection is created but not yet used by any template.

**Step 3: Commit**

```bash
git add eleventy.config.js
git commit -m "feat: add weeklyDigests collection for digest feature"
```

---

## Task 2: Create Individual Digest Page Template

**Files:**
- Create: `digest.njk`

**Step 1: Create the template**

Create `digest.njk` in the theme root:

```nunjucks
---
layout: layouts/base.njk
withSidebar: true
eleventyExcludeFromCollections: true
eleventyImport:
  collections:
    - weeklyDigests
pagination:
  data: collections.weeklyDigests
  size: 1
  alias: digest
eleventyComputed:
  title: "{{ digest.label }}"
permalink: "digest/{{ digest.slug }}/"
---
<article class="h-feed">
  <h1 class="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2">
    {{ digest.label }}
  </h1>
  <p class="text-surface-600 dark:text-surface-400 mb-6 sm:mb-8">
    {{ digest.startDate | dateDisplay }} &ndash; {{ digest.endDate | dateDisplay }}
    <span class="text-sm">({{ digest.posts.length }} post{% if digest.posts.length != 1 %}s{% endif %})</span>
  </p>

  {# Type display order #}
  {% set typeOrder = [
    { key: "articles", label: "Articles" },
    { key: "notes", label: "Notes" },
    { key: "photos", label: "Photos" },
    { key: "bookmarks", label: "Bookmarks" },
    { key: "likes", label: "Likes" },
    { key: "reposts", label: "Reposts" }
  ] %}

  {% for typeInfo in typeOrder %}
    {% set typePosts = digest.byType[typeInfo.key] %}
    {% if typePosts and typePosts.length %}
    <section class="mb-8">
      <h2 class="text-lg sm:text-xl font-semibold text-surface-800 dark:text-surface-200 mb-4 border-b border-surface-200 dark:border-surface-700 pb-2">
        {{ typeInfo.label }}
        <span class="text-sm font-normal text-surface-500 dark:text-surface-400">({{ typePosts.length }})</span>
      </h2>
      <ul class="space-y-4">
        {% for post in typePosts %}
        <li class="h-entry">
          {% if typeInfo.key == "likes" %}
            {# Like: "Liked: target-url" #}
            {% set targetUrl = post.data.likeOf or post.data.like_of %}
            <div class="flex items-start gap-2">
              <span class="text-red-500 flex-shrink-0">&#x2764;</span>
              <div>
                <a href="{{ targetUrl }}" class="text-primary-600 dark:text-primary-400 hover:underline break-all">{{ targetUrl }}</a>
                <div class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  <time class="dt-published" datetime="{{ post.date | isoDate }}">{{ post.date | dateDisplay }}</time>
                  &middot; <a href="{{ post.url }}" class="hover:underline">Permalink</a>
                </div>
              </div>
            </div>

          {% elif typeInfo.key == "bookmarks" %}
            {# Bookmark: "Bookmarked: target-url" #}
            {% set targetUrl = post.data.bookmarkOf or post.data.bookmark_of %}
            <div class="flex items-start gap-2">
              <span class="text-amber-500 flex-shrink-0">&#x1F516;</span>
              <div>
                {% if post.data.title %}
                  <a href="{{ post.url }}" class="font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400">{{ post.data.title }}</a>
                {% else %}
                  <a href="{{ targetUrl }}" class="text-primary-600 dark:text-primary-400 hover:underline break-all">{{ targetUrl }}</a>
                {% endif %}
                <div class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  <time class="dt-published" datetime="{{ post.date | isoDate }}">{{ post.date | dateDisplay }}</time>
                  &middot; <a href="{{ post.url }}" class="hover:underline">Permalink</a>
                </div>
              </div>
            </div>

          {% elif typeInfo.key == "reposts" %}
            {# Repost: "Reposted: target-url" #}
            {% set targetUrl = post.data.repostOf or post.data.repost_of %}
            <div class="flex items-start gap-2">
              <span class="text-green-500 flex-shrink-0">&#x1F501;</span>
              <div>
                <a href="{{ targetUrl }}" class="text-primary-600 dark:text-primary-400 hover:underline break-all">{{ targetUrl }}</a>
                <div class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  <time class="dt-published" datetime="{{ post.date | isoDate }}">{{ post.date | dateDisplay }}</time>
                  &middot; <a href="{{ post.url }}" class="hover:underline">Permalink</a>
                </div>
              </div>
            </div>

          {% elif typeInfo.key == "photos" %}
            {# Photo: thumbnail + caption #}
            <div>
              {% if post.data.photo and post.data.photo[0] %}
                {% set photoUrl = post.data.photo[0].url or post.data.photo[0] %}
                {% if photoUrl and photoUrl[0] != '/' and 'http' not in photoUrl %}
                  {% set photoUrl = '/' + photoUrl %}
                {% endif %}
                <a href="{{ post.url }}" class="block mb-2">
                  <img src="{{ photoUrl }}" alt="{{ post.data.photo[0].alt | default('Photo') }}" class="rounded max-h-48 object-cover" loading="lazy" eleventy:ignore>
                </a>
              {% endif %}
              {% if post.data.title %}
                <a href="{{ post.url }}" class="font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400">{{ post.data.title }}</a>
              {% elif post.templateContent %}
                <p class="text-surface-700 dark:text-surface-300 text-sm">{{ post.templateContent | striptags | truncate(120) }}</p>
              {% endif %}
              <div class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                <time class="dt-published" datetime="{{ post.date | isoDate }}">{{ post.date | dateDisplay }}</time>
                &middot; <a href="{{ post.url }}" class="hover:underline">Permalink</a>
              </div>
            </div>

          {% elif typeInfo.key == "articles" %}
            {# Article: title + excerpt #}
            <div>
              <a href="{{ post.url }}" class="font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400">
                {{ post.data.title | default("Untitled") }}
              </a>
              {% if post.templateContent %}
              <p class="text-surface-700 dark:text-surface-300 text-sm mt-1">{{ post.templateContent | striptags | truncate(200) }}</p>
              {% endif %}
              <div class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                <time class="dt-published" datetime="{{ post.date | isoDate }}">{{ post.date | dateDisplay }}</time>
                &middot; <a href="{{ post.url }}" class="hover:underline">Permalink</a>
              </div>
            </div>

          {% else %}
            {# Note: content excerpt #}
            <div>
              <p class="text-surface-700 dark:text-surface-300">{{ post.templateContent | striptags | truncate(200) }}</p>
              <div class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                <time class="dt-published" datetime="{{ post.date | isoDate }}">{{ post.date | dateDisplay }}</time>
                &middot; <a href="{{ post.url }}" class="hover:underline">Permalink</a>
              </div>
            </div>
          {% endif %}
        </li>
        {% endfor %}
      </ul>
    </section>
    {% endif %}
  {% endfor %}

  {# Previous/Next digest navigation #}
  {% set allDigests = collections.weeklyDigests %}
  {% set currentIndex = -1 %}
  {% for d in allDigests %}
    {% if d.slug == digest.slug %}
      {% set currentIndex = loop.index0 %}
    {% endif %}
  {% endfor %}

  <nav class="flex justify-between items-center mt-8 pt-6 border-t border-surface-200 dark:border-surface-700" aria-label="Digest navigation">
    {% if currentIndex > 0 %}
      {% set newer = allDigests[currentIndex - 1] %}
      <a href="/digest/{{ newer.slug }}/" class="text-primary-600 dark:text-primary-400 hover:underline">
        &larr; {{ newer.label }}
      </a>
    {% else %}
      <span></span>
    {% endif %}
    {% if currentIndex < allDigests.length - 1 %}
      {% set older = allDigests[currentIndex + 1] %}
      <a href="/digest/{{ older.slug }}/" class="text-primary-600 dark:text-primary-400 hover:underline">
        {{ older.label }} &rarr;
      </a>
    {% else %}
      <span></span>
    {% endif %}
  </nav>
</article>
```

**Step 2: Verify the build produces digest pages**

Run: `cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme && npx @11ty/eleventy --dryrun 2>&1 | grep digest | head -10`

Expected: Output shows `/digest/YYYY/WNN/` permalinks being generated.

**Step 3: Commit**

```bash
git add digest.njk
git commit -m "feat: add individual digest page template"
```

---

## Task 3: Create Paginated Digest Index

**Files:**
- Create: `digest-index.njk`

**Step 1: Create the template**

Create `digest-index.njk` in the theme root:

```nunjucks
---
layout: layouts/base.njk
title: Weekly Digest
withSidebar: true
eleventyExcludeFromCollections: true
eleventyImport:
  collections:
    - weeklyDigests
pagination:
  data: collections.weeklyDigests
  size: 20
  alias: paginatedDigests
permalink: "digest/{% if pagination.pageNumber > 0 %}page/{{ pagination.pageNumber + 1 }}/{% endif %}"
---
<div>
  <h1 class="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2">Weekly Digest</h1>
  <p class="text-surface-600 dark:text-surface-400 mb-6 sm:mb-8">
    A weekly summary of all posts. Subscribe via <a href="/digest/feed.xml" class="text-primary-600 dark:text-primary-400 hover:underline">RSS</a> for one update per week.
  </p>

  {% if paginatedDigests.length > 0 %}
  <ul class="space-y-4">
    {% for d in paginatedDigests %}
    <li class="p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
      <a href="/digest/{{ d.slug }}/" class="block">
        <h2 class="font-semibold text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400">
          {{ d.label }}
        </h2>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {{ d.startDate | dateDisplay }} &ndash; {{ d.endDate | dateDisplay }}
          &middot; {{ d.posts.length }} post{% if d.posts.length != 1 %}s{% endif %}
        </p>
        {% set typeLabels = [] %}
        {% for key, posts in d.byType %}
          {% set typeLabels = (typeLabels.push(key + " (" + posts.length + ")"), typeLabels) %}
        {% endfor %}
        {% if typeLabels.length %}
        <p class="text-xs text-surface-400 dark:text-surface-500 mt-1">
          {{ typeLabels | join(", ") }}
        </p>
        {% endif %}
      </a>
    </li>
    {% endfor %}
  </ul>

  {# Pagination controls #}
  {% if pagination.pages.length > 1 %}
  <nav class="pagination mt-8" aria-label="Digest pagination">
    <div class="pagination-info">
      Page {{ pagination.pageNumber + 1 }} of {{ pagination.pages.length }}
    </div>
    <div class="pagination-links">
      {% if pagination.href.previous %}
      <a href="{{ pagination.href.previous }}" class="pagination-link" aria-label="Previous page">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        Previous
      </a>
      {% else %}
      <span class="pagination-link disabled">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        Previous
      </span>
      {% endif %}

      {% if pagination.href.next %}
      <a href="{{ pagination.href.next }}" class="pagination-link" aria-label="Next page">
        Next
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </a>
      {% else %}
      <span class="pagination-link disabled">
        Next
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </span>
      {% endif %}
    </div>
  </nav>
  {% endif %}

  {% else %}
  <p class="text-surface-600 dark:text-surface-400">No digests yet. Posts will be grouped into weekly digests automatically.</p>
  {% endif %}
</div>
```

**Step 2: Verify the build produces the index**

Run: `cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme && npx @11ty/eleventy --dryrun 2>&1 | grep "digest/" | head -5`

Expected: Output includes `/digest/` index page alongside individual digest pages.

**Step 3: Commit**

```bash
git add digest-index.njk
git commit -m "feat: add paginated digest index page"
```

---

## Task 4: Create Digest RSS Feed

**Files:**
- Create: `digest-feed.njk`

**Step 1: Create the template**

Create `digest-feed.njk` in the theme root. This follows the same pattern as `category-feed.njk` and `feed.njk`:

```nunjucks
---
eleventyExcludeFromCollections: true
eleventyImport:
  collections:
    - weeklyDigests
permalink: /digest/feed.xml
---
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{{ site.name }} — Weekly Digest</title>
    <link>{{ site.url }}/digest/</link>
    <description>Weekly summary of all posts on {{ site.name }}. One update per week.</description>
    <language>{{ site.locale | default('en') }}</language>
    <atom:link href="{{ site.url }}/digest/feed.xml" rel="self" type="application/rss+xml"/>
    <atom:link href="https://websubhub.com/hub" rel="hub"/>
    {%- set latestDigests = collections.weeklyDigests | head(20) %}
    {%- if latestDigests.length %}
    <lastBuildDate>{{ latestDigests[0].endDate | dateToRfc822 }}</lastBuildDate>
    {%- endif %}
    {%- for digest in latestDigests %}
    <item>
      <title>{{ digest.label }} ({{ digest.startDate | dateDisplay }} – {{ digest.endDate | dateDisplay }})</title>
      <link>{{ site.url }}/digest/{{ digest.slug }}/</link>
      <guid isPermaLink="true">{{ site.url }}/digest/{{ digest.slug }}/</guid>
      <pubDate>{{ digest.endDate | dateToRfc822 }}</pubDate>
      <description>{{ digest | digestToHtml(site.url) | escape }}</description>
    </item>
    {%- endfor %}
  </channel>
</rss>
```

**Step 2: Add `digestToHtml` filter to `eleventy.config.js`**

Add after the existing `dateDisplay` filter (~line 347), or near the other custom filters:

```javascript
  // Digest-to-HTML filter for RSS feed descriptions
  eleventyConfig.addFilter("digestToHtml", (digest, siteUrl) => {
    const typeLabels = {
      articles: "Articles",
      notes: "Notes",
      photos: "Photos",
      bookmarks: "Bookmarks",
      likes: "Likes",
      reposts: "Reposts",
    };
    const typeOrder = ["articles", "notes", "photos", "bookmarks", "likes", "reposts"];
    let html = "";

    for (const type of typeOrder) {
      const posts = digest.byType[type];
      if (!posts || !posts.length) continue;

      html += `<h3>${typeLabels[type]}</h3><ul>`;
      for (const post of posts) {
        const postUrl = siteUrl + post.url;
        let label;
        if (type === "likes") {
          const target = post.data.likeOf || post.data.like_of;
          label = `Liked: ${target}`;
        } else if (type === "bookmarks") {
          const target = post.data.bookmarkOf || post.data.bookmark_of;
          label = post.data.title || `Bookmarked: ${target}`;
        } else if (type === "reposts") {
          const target = post.data.repostOf || post.data.repost_of;
          label = `Reposted: ${target}`;
        } else if (post.data.title) {
          label = post.data.title;
        } else {
          // Note or untitled: use content excerpt
          const content = post.templateContent || "";
          label = content.replace(/<[^>]*>/g, "").slice(0, 120).trim() || "Untitled";
        }
        html += `<li><a href="${postUrl}">${label}</a></li>`;
      }
      html += `</ul>`;
    }

    return html;
  });
```

**Step 3: Verify the build produces the feed**

Run: `cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme && npx @11ty/eleventy --dryrun 2>&1 | grep "feed.xml"`

Expected: Output includes `/digest/feed.xml` alongside `/feed.xml`.

**Step 4: Commit**

```bash
git add digest-feed.njk eleventy.config.js
git commit -m "feat: add weekly digest RSS feed with digestToHtml filter"
```

---

## Task 5: Add Discovery Links and Navigation

**Files:**
- Modify: `_includes/layouts/base.njk` (~line 94 for alternate link, ~lines 200/278/354 for navigation)

**Step 1: Add the alternate link for the digest feed**

In `_includes/layouts/base.njk`, after line 95 (after the JSON feed alternate link), add:

```nunjucks
  <link rel="alternate" type="application/rss+xml" href="/digest/feed.xml" title="Weekly Digest — RSS Feed">
```

This goes right after:
```nunjucks
  <link rel="alternate" type="application/json" href="/feed.json" title="JSON Feed">
```

**Step 2: Add "Digest" navigation item**

In the desktop navigation (after the "Interactions" link around line 205), the mobile navigation (around line 283), and the footer (around line 357), add a link to `/digest/`:

Desktop nav — after `<a href="/interactions/">Interactions</a>`:
```nunjucks
          <a href="/digest/">Digest</a>
```

Mobile nav — after `<a href="/interactions/">Interactions</a>`:
```nunjucks
      <a href="/digest/">Digest</a>
```

Footer "Content" section — after the Interactions `<li>`:
```nunjucks
            <li><a href="/digest/" class="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400">Digest</a></li>
```

**Step 3: Verify the build succeeds**

Run: `cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme && npx @11ty/eleventy --dryrun 2>&1 | tail -5`

Expected: Build completes successfully.

**Step 4: Commit**

```bash
git add _includes/layouts/base.njk
git commit -m "feat: add digest feed discovery link and navigation items"
```

---

## Task 6: Manual Verification

**Step 1: Run a full build (not dryrun)**

Run: `cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme && npx @11ty/eleventy`

Expected: Build succeeds, output shows digest pages generated.

**Step 2: Spot-check generated files**

Check a digest page exists:
```bash
ls _site/digest/ | head -5
```

Check the feed is valid XML:
```bash
head -30 _site/digest/feed.xml
```

Check the index page has content:
```bash
head -30 _site/digest/index.html
```

**Step 3: Push and update submodule**

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme && git push origin main
cd /home/rick/code/indiekit-dev/indiekit-cloudron && git submodule update --remote eleventy-site && git add eleventy-site && git commit -m "chore: update eleventy-site submodule (weekly digest feature)" && git push origin main
```

---

## Known Considerations

- **`dateDisplay` and `dateToRfc822` with date strings:** The `startDate`/`endDate` fields are ISO date strings like `"2026-02-23"`. The `dateDisplay` filter creates a `new Date()` from this, which works for date-only strings. The `dateToRfc822` filter uses `@11ty/eleventy-plugin-rss`'s `dateToRfc2822` which also accepts date strings. If either filter has issues with date-only strings (no time component), the fix is to append `T00:00:00Z` in the collection code.
- **Empty site:** If there are zero posts, the `weeklyDigests` collection is empty, so no digest pages or feed items are generated. The index page shows a fallback message.
- **Nunjucks `for...in` for objects:** The `{% for key, posts in d.byType %}` syntax in the index template uses Nunjucks object iteration. This works in Nunjucks but iteration order follows JS property insertion order.
