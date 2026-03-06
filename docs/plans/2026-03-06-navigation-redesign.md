# Navigation Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the unusable 22-item "/" dropdown with a curated header nav (Home, About, Now, Blog dropdown, Pages dropdown, Interactions, Dashboard, Search, Theme), update the footer to match the approved design, and refactor /slashes/ into a comprehensive site map covering all three page sources.

**Architecture:** Three files change — `base.njk` (header desktop nav, mobile nav, footer), `slashes.njk` (add Site Pages section), and `tailwind.css` (no structural CSS changes needed, existing nav component styles are reused). The "/" dropdown becomes a "Pages" dropdown with 4 curated items. CV and Digest move to footer only. /slashes/ gains a hardcoded "Site Pages" section for theme .njk pages.

**Tech Stack:** Nunjucks templates, Tailwind CSS utility classes, Alpine.js (dropdowns, auth-gated Dashboard link)

---

### Task 1: Replace desktop header nav in base.njk

**Files:**
- Modify: `_includes/layouts/base.njk:154-221` (desktop nav inside `.site-nav` and search/dashboard area)

**Step 1: Replace the desktop nav links and dropdowns**

Replace lines 154-221 of `base.njk` (from `<nav class="site-nav"` through the closing `</div>` of `.header-actions` before the mobile nav) with:

```nunjucks
        <nav class="site-nav" id="site-nav">
          <a href="/">Home</a>
          <a href="/about/">About</a>
          <a href="/now/">Now</a>
          {# Blog dropdown #}
          <div class="nav-dropdown" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false">
            <a href="/blog/" class="nav-dropdown-trigger">
              Blog
              <svg class="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </a>
            <div class="nav-dropdown-menu" x-show="open" x-transition x-cloak>
              <a href="/blog/">All Posts</a>
              {% for pt in enabledPostTypes %}
              <a href="{{ pt.path }}">{{ pt.label }}</a>
              {% endfor %}
            </div>
          </div>
          {# Pages dropdown #}
          <div class="nav-dropdown" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false">
            <a href="/slashes/" class="nav-dropdown-trigger">
              Pages
              <svg class="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </a>
            <div class="nav-dropdown-menu" x-show="open" x-transition x-cloak>
              {% if blogrollStatus and blogrollStatus.source == "indiekit" %}<a href="/blogroll/">Blogroll</a>{% endif %}
              {% if podrollStatus and podrollStatus.source == "indiekit" %}<a href="/podroll/">Podroll</a>{% endif %}
              {% if newsActivity and newsActivity.source == "indiekit" %}<a href="/news/">News</a>{% endif %}
              <a href="/slashes/">All Pages</a>
            </div>
          </div>
          <a href="/interactions/">Interactions</a>
          <a href="/dashboard"
             x-data="{ show: false }"
             x-show="show"
             x-cloak
             x-transition
             @indiekit:auth.window="show = $event.detail.loggedIn"
             class="admin-nav-link">
            <svg class="w-4 h-4 inline -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </a>
        </nav>
        <a href="/search/" aria-label="Search" title="Search" class="p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </a>
        <button id="theme-toggle" type="button" class="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
```

**Key changes from current:**
- Removed: CV direct link, Digest direct link, the "/" dropdown with 22+ items
- Added: Now direct link, "Pages" dropdown (Blogroll, Podroll, News, All Pages)
- Kept: Blog dropdown (unchanged), Interactions, Dashboard (auth-only), Search icon, Theme toggle
- The `hasPluginPages` variable is no longer needed in the header — plugin checks are inline in the Pages dropdown

**Step 2: Verify the edit didn't break the surrounding HTML structure**

Check that `<div class="header-actions">` still wraps the nav, search icon, and theme toggle. Check the closing `</div>` for `.header-container` is still in place at around line 237.

---

### Task 2: Replace mobile nav in base.njk

**Files:**
- Modify: `_includes/layouts/base.njk:240-309` (mobile nav `<nav class="mobile-nav">`)

**Step 1: Replace the mobile nav**

Replace the entire `<nav class="mobile-nav" ...>` block (lines 240-309) with:

```nunjucks
    <nav class="mobile-nav hidden" id="mobile-nav" x-data="{ blogOpen: false, pagesOpen: false }">
      <a href="/">Home</a>
      <a href="/about/">About</a>
      <a href="/now/">Now</a>
      {# Blog section #}
      <div class="mobile-nav-section">
        <button type="button" class="mobile-nav-toggle" @click="blogOpen = !blogOpen">
          Blog
          <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': blogOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="mobile-nav-submenu" x-show="blogOpen" x-collapse>
          <a href="/blog/">All Posts</a>
          {% for pt in enabledPostTypes %}
          <a href="{{ pt.path }}">{{ pt.label }}</a>
          {% endfor %}
        </div>
      </div>
      {# Pages section #}
      <div class="mobile-nav-section">
        <button type="button" class="mobile-nav-toggle" @click="pagesOpen = !pagesOpen">
          Pages
          <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': pagesOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="mobile-nav-submenu" x-show="pagesOpen" x-collapse>
          {% if blogrollStatus and blogrollStatus.source == "indiekit" %}<a href="/blogroll/">Blogroll</a>{% endif %}
          {% if podrollStatus and podrollStatus.source == "indiekit" %}<a href="/podroll/">Podroll</a>{% endif %}
          {% if newsActivity and newsActivity.source == "indiekit" %}<a href="/news/">News</a>{% endif %}
          <a href="/slashes/">All Pages</a>
        </div>
      </div>
      <a href="/interactions/">Interactions</a>
      <a href="/search/">Search</a>
      <a href="/dashboard"
         x-data="{ show: false }"
         x-show="show"
         x-cloak
         @indiekit:auth.window="show = $event.detail.loggedIn">
        Dashboard
      </a>
      {# Mobile theme toggle #}
      <button type="button" class="mobile-theme-toggle" aria-label="Toggle dark mode">
        <span class="theme-label">Theme</span>
        <span class="theme-icons">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </span>
      </button>
    </nav>
```

**Key changes from current:**
- Removed: CV link, Digest link, the "/" accordion with 22+ items
- Added: Now direct link, "Pages" accordion (Blogroll, Podroll, News, All Pages)
- Renamed Alpine variable: `slashOpen` → `pagesOpen`
- Kept: Blog accordion (unchanged), Interactions, Search, Dashboard (auth-only), theme toggle

---

### Task 3: Update footer in base.njk

**Files:**
- Modify: `_includes/layouts/base.njk:339-386` (footer `<footer>` block)

**Step 1: Replace the footer grid**

Replace lines 339-386 (the entire `<footer>` element) with:

```nunjucks
  <footer class="border-t border-surface-200 dark:border-surface-700 mt-12 pt-8 pb-6">
    <div class="container">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        {# Navigate #}
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Navigate</h4>
          <ul class="space-y-2">
            <li><a href="/" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">Home</a></li>
            <li><a href="/about/" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">About</a></li>
            <li><a href="/cv/" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">CV</a></li>
            <li x-data="{ show: false }" x-show="show" x-cloak @indiekit:auth.window="show = $event.detail.loggedIn">
              <a href="/dashboard" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">Dashboard</a>
            </li>
          </ul>
        </div>
        {# Content #}
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Content</h4>
          <ul class="space-y-2">
            <li><a href="/blog/" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">Blog</a></li>
            {% for pt in enabledPostTypes %}
            <li><a href="{{ pt.path }}" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">{{ pt.label }}</a></li>
            {% endfor %}
            <li><a href="/digest/" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">Digest</a></li>
          </ul>
        </div>
        {# Connect #}
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Connect</h4>
          <ul class="space-y-2">
            {% for social in site.social %}
            <li><a href="{{ social.url }}" rel="{{ social.rel }}" target="_blank" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">{{ social.name }}</a></li>
            {% endfor %}
          </ul>
        </div>
        {# Meta #}
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Meta</h4>
          <ul class="space-y-2">
            <li><a href="/feed.xml" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">RSS Feed</a></li>
            <li><a href="/feed.json" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">JSON Feed</a></li>
            <li><a href="/changelog/" class="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:underline">Changelog</a></li>
          </ul>
        </div>
      </div>
      <p class="text-center text-sm text-surface-500 dark:text-surface-400">Powered by <a href="https://getindiekit.com" class="hover:text-surface-900 dark:hover:text-surface-100 hover:underline">Indiekit</a> + <a href="https://11ty.dev" class="hover:text-surface-900 dark:hover:text-surface-100 hover:underline">Eleventy</a></p>
    </div>
  </footer>
```

**Key changes from current:**
- Navigate: Removed Changelog (was duplicated in Meta), removed Search (header icon suffices), added Dashboard (auth-only via Alpine.js)
- Content: Removed Interactions, added Digest
- Connect: Unchanged (dynamic social links)
- Meta: Unchanged (RSS, JSON Feed, Changelog)

---

### Task 4: Add "Site Pages" section to slashes.njk

**Files:**
- Modify: `slashes.njk:143-153` (after Activity Feeds section, before inspiration box)

**Step 1: Add the Site Pages section**

Replace lines 143-153 (from `{% endif %}` closing Activity Feeds through the inspiration `<div>`) with:

```nunjucks
  {% endif %}

  {# Site pages — theme-provided .njk pages not in collections.pages or activity feeds #}
  <div class="mb-8">
    <h2 class="text-lg font-semibold text-surface-800 dark:text-surface-200 mb-4">Site Pages</h2>
    <p class="text-surface-600 dark:text-surface-400 text-sm mb-4">
      Theme-provided pages for content aggregation, search, and site info.
    </p>
    <ul class="post-list">
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/blog/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/blog</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">All posts chronologically</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/cv/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/cv</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Curriculum vitae</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/changelog/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/changelog</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Site changes and updates</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/digest/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/digest</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Content digest</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/featured/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/featured</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Featured posts</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/graph/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/graph</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Content graph visualization</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/interactions/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/interactions</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Social interactions (likes, reposts, replies)</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/readlater/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/readlater</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Read later queue</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/search/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/search</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Full-text search</p>
      </li>
      <li class="post-card">
        <div class="post-header">
          <h3 class="text-xl font-semibold">
            <a href="/starred/" class="text-surface-900 dark:text-surface-100 hover:text-accent-600 dark:hover:text-accent-400">/starred</a>
          </h3>
        </div>
        <p class="text-surface-600 dark:text-surface-400 mt-2">Starred GitHub repositories</p>
      </li>
    </ul>
  </div>

  {# Inspiration section #}
  <div class="mt-8 p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
    <h2 class="text-lg font-semibold text-surface-800 dark:text-surface-200 mb-2">Want more slash pages?</h2>
    <p class="text-surface-600 dark:text-surface-400 text-sm">
      Check out <a href="https://slashpages.net" class="text-accent-600 dark:text-accent-400 hover:underline" target="_blank" rel="noopener">slashpages.net</a>
      for inspiration on pages like <code>/now</code>, <code>/uses</code>, <code>/colophon</code>, <code>/blogroll</code>, and more.
    </p>
  </div>
```

**Key additions:** /blog, /cv, /changelog, /digest, /featured, /graph, /interactions, /readlater, /search, /starred — all theme .njk pages that were previously invisible on /slashes/.

---

### Task 5: Verify the build locally

**Step 1: Build Eleventy and check for errors**

Run from the theme directory:
```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
npm run build 2>&1 | tail -20
```

Expected: Build completes with zero errors. Template syntax errors would fail the build.

**Step 2: Spot-check the output HTML**

```bash
# Check header nav has "Now" and "Pages" but not "CV" or "Digest"
grep -c 'href="/now/"' _site/index.html
# Expected: at least 1

grep 'nav-dropdown-trigger' _site/index.html | head -4
# Expected: "Blog" and "Pages" triggers, no "/" trigger

# Check footer has Dashboard with Alpine.js auth
grep 'Dashboard' _site/index.html | grep 'indiekit:auth'
# Expected: 1 match in footer

# Check /slashes/ has "Site Pages" section
grep 'Site Pages' _site/slashes/index.html
# Expected: 1 match
```

---

### Task 6: Commit, push, and update submodule

**Step 1: Commit the theme changes**

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
git add _includes/layouts/base.njk slashes.njk
git commit -m "feat: redesign navigation - curated header, updated footer, comprehensive /slashes/"
git push origin main
```

**Step 2: Update the submodule in indiekit-cloudron**

```bash
cd /home/rick/code/indiekit-dev/indiekit-cloudron
git submodule update --remote eleventy-site
git add eleventy-site
git commit -m "chore: update eleventy-site submodule (navigation redesign)"
git push origin main
```

**Step 3: Deploy**

```bash
cd /home/rick/code/indiekit-dev/indiekit-cloudron
make prepare
cloudron build --no-cache && cloudron update --app rmendes.net --no-backup
```

---

## Summary of Changes

| Before | After |
|--------|-------|
| "/" dropdown with 22+ items | "Pages" dropdown with 4 curated items |
| CV in header | CV in footer only |
| Digest in header | Digest in footer Content column |
| No "Now" in header | Now as direct link |
| Footer: Changelog in Navigate | Changelog in Meta only (no duplicate) |
| Footer: Search in Navigate | Search removed (header icon suffices) |
| Footer: Interactions in Content | Interactions removed from footer |
| Footer: No Dashboard | Dashboard in Navigate (auth-only) |
| Footer: No Digest | Digest in Content column |
| /slashes/: 2 sections (Pages + Activity) | 3 sections (Pages + Activity + Site Pages) |
| /slashes/: Missing 10+ theme pages | All theme .njk pages listed |
