# Editable Identity via Homepage Plugin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all author identity fields editable from the Indiekit admin UI via a three-tab homepage dashboard with Identity CRUD.

**Architecture:** Extend `indiekit-endpoint-homepage` with URL-based tabs (Homepage Builder, Blog Sidebar, Identity). Identity data stored in `homepageConfig.identity` in MongoDB + `homepage.json`. Theme templates check identity data first, falling back to `site.author.*` env vars.

**Tech Stack:** Express.js, Nunjucks, @rmdes/indiekit-frontend components, MongoDB, Eleventy

---

### Task 1: Add tab navigation partial and new routes in index.js

**Files:**
- Create: `indiekit-endpoint-homepage/views/partials/tab-nav.njk`
- Modify: `indiekit-endpoint-homepage/index.js`

**Step 1: Create the tab navigation partial**

Create `views/partials/tab-nav.njk`:

```nunjucks
{# Tab navigation for homepage admin - server-rendered URL tabs #}
<style>
  .hp-tab-nav {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--color-outline-variant, #ddd);
    margin-block-end: var(--space-xl, 2rem);
  }
  .hp-tab-nav__item {
    padding: var(--space-s, 0.75rem) var(--space-m, 1.25rem);
    text-decoration: none;
    color: var(--color-on-offset, #666);
    font-weight: 500;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.2s, border-color 0.2s;
  }
  .hp-tab-nav__item:hover {
    color: var(--color-primary, #0066cc);
  }
  .hp-tab-nav__item--active {
    color: var(--color-primary, #0066cc);
    border-bottom-color: var(--color-primary, #0066cc);
    font-weight: 600;
  }
</style>
<nav class="hp-tab-nav" aria-label="Homepage settings">
  <a href="{{ homepageEndpoint }}"
     class="hp-tab-nav__item{% if activeTab == 'builder' %} hp-tab-nav__item--active{% endif %}">
    {{ __("homepageBuilder.tabs.builder") }}
  </a>
  <a href="{{ homepageEndpoint }}/blog-sidebar"
     class="hp-tab-nav__item{% if activeTab == 'blog-sidebar' %} hp-tab-nav__item--active{% endif %}">
    {{ __("homepageBuilder.tabs.blogSidebar") }}
  </a>
  <a href="{{ homepageEndpoint }}/identity"
     class="hp-tab-nav__item{% if activeTab == 'identity' %} hp-tab-nav__item--active{% endif %}">
    {{ __("homepageBuilder.tabs.identity") }}
  </a>
</nav>
```

**Step 2: Add new routes in index.js**

In the `get routes()` getter, after the existing routes (after `protectedRouter.get("/api/config", apiController.getConfig);`), add:

```javascript
    // Blog sidebar tab
    protectedRouter.get("/blog-sidebar", dashboardController.getBlogSidebar);
    protectedRouter.post("/save-blog-sidebar", dashboardController.saveBlogSidebar);

    // Identity tab
    protectedRouter.get("/identity", dashboardController.getIdentity);
    protectedRouter.post("/save-identity", dashboardController.saveIdentity);
```

**Step 3: Verify**

Run: `node -e "import('./index.js')"` from the plugin directory to check for syntax errors.

**Step 4: Commit**

```bash
git add views/partials/tab-nav.njk index.js
git commit -m "feat(homepage): add tab navigation partial and identity/blog-sidebar routes"
```

---

### Task 2: Add i18n strings for tabs and identity editor

**Files:**
- Modify: `indiekit-endpoint-homepage/locales/en.json`

**Step 1: Add the new i18n keys**

Add `"tabs"` block as a new top-level key inside `"homepageBuilder"`, and add `"identity"` block. Keep all existing keys unchanged.

Add under `"homepageBuilder"`:

```json
"tabs": {
  "builder": "Homepage",
  "blogSidebar": "Blog Sidebar",
  "identity": "Identity"
},
```

Add the `"identity"` block:

```json
"identity": {
  "title": "Identity",
  "description": "Configure your author profile, contact details, and social links. These override environment variable defaults.",
  "saved": "Identity saved successfully. Refresh your site to see changes.",
  "profile": {
    "legend": "Profile",
    "name": { "label": "Name", "hint": "Your display name" },
    "avatar": { "label": "Avatar URL", "hint": "URL to your avatar image" },
    "title": { "label": "Title", "hint": "Job title or subtitle" },
    "pronoun": { "label": "Pronoun", "hint": "e.g. he/him, she/her, they/them" },
    "bio": { "label": "Bio", "hint": "Short biography" },
    "description": { "label": "Site Description", "hint": "Description shown in the hero section" }
  },
  "location": {
    "legend": "Location",
    "locality": { "label": "City", "hint": "City or locality" },
    "country": { "label": "Country" },
    "org": { "label": "Organization", "hint": "Company or organization" }
  },
  "contact": {
    "legend": "Contact",
    "url": { "label": "URL", "hint": "Your personal website URL" },
    "email": { "label": "Email" },
    "keyUrl": { "label": "PGP Key URL", "hint": "URL to your public PGP key" }
  },
  "skills": {
    "legend": "Skills & Interests",
    "categories": { "label": "Categories", "hint": "Comma-separated skills, interests, or tags" }
  },
  "social": {
    "legend": "Social Links",
    "description": "Add links to your social profiles. These appear in the hero section and h-card.",
    "name": { "label": "Name" },
    "url": { "label": "URL" },
    "rel": { "label": "Rel" },
    "icon": { "label": "Icon" }
  }
}
```

**Step 2: Verify no JSON syntax errors**

Run: `node -e "JSON.parse(require('fs').readFileSync('locales/en.json','utf8')); console.log('OK')"`

**Step 3: Commit**

```bash
git add locales/en.json
git commit -m "feat(homepage): add i18n strings for tabs and identity editor"
```

---

### Task 3: Add dashboard controller methods for blog sidebar and identity

**Files:**
- Modify: `indiekit-endpoint-homepage/lib/controllers/dashboard.js`

**Step 1: Add `parseSocialLinks` helper function**

Add at the top of the file, after the existing imports:

```javascript
/**
 * Parse social links from form body.
 * Express parses social[0][name], social[0][url] etc. into nested objects.
 */
function parseSocialLinks(body) {
  const social = [];
  if (!body.social) return social;
  const entries = Array.isArray(body.social) ? body.social : Object.values(body.social);
  for (const entry of entries) {
    if (!entry || (!entry.name && !entry.url)) continue;
    social.push({
      name: entry.name || "",
      url: entry.url || "",
      rel: entry.rel || "me",
      icon: entry.icon || "",
    });
  }
  return social;
}
```

**Step 2: Update the existing `get` method**

Add `activeTab: "builder"` to the `response.render()` call.

**Step 3: Update the existing `save` method**

The save method must preserve blog sidebar and identity data that are no longer part of the homepage builder form. Read the current config first and merge:

```javascript
// Get current config to preserve fields not in this form
let currentConfig = await getConfig(application);

const config = {
  layout: layout || "single-column",
  hero: typeof hero === "string" ? JSON.parse(hero) : hero,
  sections: typeof sections === "string" ? JSON.parse(sections) : sections,
  sidebar: typeof sidebar === "string" ? JSON.parse(sidebar) : sidebar,
  blogListingSidebar: currentConfig?.blogListingSidebar || [],
  blogPostSidebar: currentConfig?.blogPostSidebar || [],
  footer: typeof footer === "string" ? JSON.parse(footer) : footer,
  identity: currentConfig?.identity || null,
};
```

**Step 4: Add `getBlogSidebar` controller method**

Renders `homepage-blog-sidebar` view with `activeTab: "blog-sidebar"`, current config, widgets, and blogPostWidgets.

**Step 5: Add `saveBlogSidebar` controller method**

Reads `blogListingSidebar` and `blogPostSidebar` from request body, preserves all other config fields, saves, redirects to `/homepage/blog-sidebar?saved=1`.

**Step 6: Add `getIdentity` controller method**

Reads `config.identity || {}`, renders `homepage-identity` view with `activeTab: "identity"`.

**Step 7: Add `saveIdentity` controller method**

Parses form fields (`identity-name`, `identity-bio`, etc.) and social links using `parseSocialLinks(body)`. Builds identity object, preserves all other config fields, saves, redirects to `/homepage/identity?saved=1`.

**Step 8: Verify**

Run: `node -e "import('./lib/controllers/dashboard.js')"` to check for syntax errors.

**Step 9: Commit**

```bash
git add lib/controllers/dashboard.js
git commit -m "feat(homepage): add blog sidebar and identity controller methods"
```

---

### Task 4: Refactor homepage-dashboard.njk — remove blog sidebar, add tab nav

**Files:**
- Modify: `indiekit-endpoint-homepage/views/homepage-dashboard.njk`

**Step 1: Add tab nav include**

After the page header `</header>`, before the success message `{% if request.query.saved %}`, add:

```nunjucks
{% include "partials/tab-nav.njk" %}
```

**Step 2: Remove blog sidebar sections from HTML**

Remove the two `<section>` blocks:
- Blog Listing Sidebar (with `id="blog-listing-sidebar-list"` and `id="blog-listing-sidebar-json"`)
- Blog Post Sidebar (with `id="blog-post-sidebar-list"` and `id="blog-post-sidebar-json"`)

**Step 3: Remove blog sidebar JavaScript**

From the `<script>` block, remove:
- `var blogListingSidebar = ...` and `var blogPostSidebar = ...` parsing
- `.forEach` key assignment for both
- All `addBlogListingWidget`, `removeBlogListingWidget`, `editBlogListingWidget`, `updateBlogListingSidebar` functions
- All `addBlogPostWidget`, `removeBlogPostWidget`, `editBlogPostWidget`, `updateBlogPostSidebar` functions
- `syncBlogListingSidebarFromDom` and `syncBlogPostSidebarFromDom`
- SortableJS entries for `blog-listing-sidebar-list` and `blog-post-sidebar-list`
- Initial render calls `updateBlogListingSidebar()` and `updateBlogPostSidebar()`
- Event listeners for `[data-add-blog-listing-widget]` and `[data-add-blog-post-widget]`

**Step 4: Verify**

Navigate to `/homepage` in the admin UI. Tab nav appears. Blog sidebar sections are gone. Saving layout/hero/sections/sidebar/footer still works.

**Step 5: Commit**

```bash
git add views/homepage-dashboard.njk
git commit -m "refactor(homepage): extract blog sidebar from main dashboard, add tab nav"
```

---

### Task 5: Create blog sidebar tab view

**Files:**
- Create: `indiekit-endpoint-homepage/views/homepage-blog-sidebar.njk`

**Step 1: Create the view**

This view extends `document.njk`, includes the tab nav, and contains the Blog Listing Sidebar and Blog Post Sidebar sections extracted from the old homepage-dashboard.njk. It includes:

- Same CSS classes as the main dashboard (`hp-section`, `hp-sections-list`, `hp-section-item`, etc.)
- Tab nav include with `activeTab: "blog-sidebar"`
- Two sections: Blog Listing Sidebar and Blog Post Sidebar (same HTML structure as before)
- Hidden JSON inputs for `blogListingSidebar` and `blogPostSidebar`
- Form POSTs to `{{ homepageEndpoint }}/save-blog-sidebar`
- Inline JS for the blog sidebar functions (stripKeys, createDragHandle, createItemElement, renderList, add/remove/edit/update/sync functions, SortableJS init)

The shared JS utility functions (`stripKeys`, `createDragHandle`, `createItemElement`, `renderList`) are duplicated into this view, matching the existing inline JS pattern.

**Step 2: Verify**

Navigate to `/homepage/blog-sidebar`. Tab nav shows "Blog Sidebar" as active. Widgets render. Drag-drop works. Save persists data.

**Step 3: Commit**

```bash
git add views/homepage-blog-sidebar.njk
git commit -m "feat(homepage): add blog sidebar tab view"
```

---

### Task 6: Create identity editor tab view

**Files:**
- Create: `indiekit-endpoint-homepage/views/homepage-identity.njk`

**Step 1: Create the view**

This view extends `document.njk`, includes the tab nav, and contains the identity editor form. Uses standard Indiekit frontend macros (available globally from `default.njk`):

- `input()` for name, avatar URL, title, pronoun, locality, country, org, url, email, keyUrl
- `textarea()` for bio, description
- `tagInput()` for categories/skills
- Social links: inline JS with `createElement`/`textContent` for add/remove rows (safe DOM manipulation pattern matching existing dashboard)
- Each social link row has: name (text), url (text), rel (text, default "me"), icon (select: github/linkedin/bluesky/mastodon/activitypub)
- Form POSTs to `{{ homepageEndpoint }}/save-identity`

Social link form fields use the pattern `social[N][name]`, `social[N][url]`, `social[N][rel]`, `social[N][icon]` which Express parses into nested objects automatically.

Form is organized into sections:
- Profile (name, avatar, title, pronoun, bio, description)
- Location (locality, country, org)
- Contact (url, email, keyUrl)
- Skills (categories via tag-input)
- Social Links (CRUD list)

**Step 2: Verify**

Navigate to `/homepage/identity`. All fields render. Fill in data, submit. Data saves to MongoDB. Reload — data persists.

**Step 3: Commit**

```bash
git add views/homepage-identity.njk
git commit -m "feat(homepage): add identity editor tab with social links CRUD"
```

---

### Task 7: Verify API controller includes identity field

**Files:**
- Verify: `indiekit-endpoint-homepage/lib/controllers/api.js`

**Step 1: Check the `getConfigPublic` method**

Verify that `identity: config.identity` is included in the public API response. The current code at line 96 already includes this. If not, add it.

**Step 2: Verify**

Hit `GET /homepage/api/config.json` and confirm the response includes the `identity` field with saved data.

**Step 3: Commit (only if changes were needed)**

```bash
git add lib/controllers/api.js
git commit -m "chore(homepage): ensure identity field in public API response"
```

---

### Task 8: Update theme templates to prefer identity data over env vars

**Files:**
- Modify: `indiekit-eleventy-theme/_includes/components/sections/hero.njk`
- Modify: `indiekit-eleventy-theme/_includes/components/h-card.njk`

**Step 1: Update hero.njk**

After `{% set heroConfig = homepageConfig.hero or {} %}`, add identity resolution variables:

```nunjucks
{% set id = homepageConfig.identity if (homepageConfig and homepageConfig.identity) else {} %}
{% set authorName = id.name or site.author.name %}
{% set authorAvatar = id.avatar or site.author.avatar %}
{% set authorTitle = id.title or site.author.title %}
{% set authorBio = id.bio or site.author.bio %}
{% set siteDescription = id.description or site.description %}
{% set socialLinks = id.social if (id.social and id.social.length) else site.social %}
```

Replace all references:
- `site.author.name` → `authorName`
- `site.author.avatar` → `authorAvatar`
- `site.author.title` → `authorTitle`
- `site.author.bio` → `authorBio`
- `site.description` → `siteDescription`
- `site.social` → `socialLinks`

**Step 2: Update h-card.njk**

Add identity resolution at the top:

```nunjucks
{% set id = homepageConfig.identity if (homepageConfig and homepageConfig.identity) else {} %}
{% set authorName = id.name or site.author.name %}
{% set authorAvatar = id.avatar or site.author.avatar %}
{% set authorTitle = id.title or site.author.title %}
{% set authorBio = id.bio or site.author.bio %}
{% set authorUrl = id.url or site.author.url %}
{% set authorPronoun = id.pronoun or site.author.pronoun %}
{% set authorLocality = id.locality or site.author.locality %}
{% set authorCountry = id.country or site.author.country %}
{% set authorLocation = site.author.location %}
{% set authorOrg = id.org or site.author.org %}
{% set authorEmail = id.email or site.author.email %}
{% set authorKeyUrl = id.keyUrl or site.author.keyUrl %}
{% set authorCategories = id.categories if (id.categories and id.categories.length) else site.author.categories %}
{% set socialLinks = id.social if (id.social and id.social.length) else site.social %}
```

Replace all `site.author.*` and `site.social` references with the corresponding variables.

**Step 3: Verify**

Run Eleventy build locally (dryrun) to confirm no template errors:

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
npx @11ty/eleventy --dryrun 2>&1 | tail -5
```

**Step 4: Commit**

```bash
git add _includes/components/sections/hero.njk _includes/components/h-card.njk
git commit -m "feat(theme): prefer identity data over env vars in hero and h-card"
```

---

### Task Summary

| # | Task | Repo | Depends On |
|---|------|------|-----------|
| 1 | Tab nav partial + routes | plugin | — |
| 2 | i18n strings | plugin | — |
| 3 | Dashboard controller methods | plugin | 1, 2 |
| 4 | Refactor homepage-dashboard.njk | plugin | 1, 3 |
| 5 | Create blog sidebar view | plugin | 1, 2, 3 |
| 6 | Create identity editor view | plugin | 1, 2, 3 |
| 7 | Verify API includes identity | plugin | 3 |
| 8 | Theme: identity over env vars | theme | all plugin tasks |
