# Homepage UI/UX Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve homepage scannability by adding post card color-coded borders, collapsible project accordion, and collapsible sidebar widgets.

**Architecture:** Three independent rendering changes in the Eleventy theme's Nunjucks templates + Tailwind CSS. No data model changes. Alpine.js handles all interactivity (already loaded). localStorage persists sidebar widget collapse state.

**Tech Stack:** Nunjucks templates, Tailwind CSS (arbitrary values), Alpine.js, localStorage

**Design doc:** `docs/plans/2026-02-24-homepage-ui-ux-design.md`

---

## Task 1: Post Card Color-Coded Left Borders

**Files:**
- Modify: `_includes/components/sections/recent-posts.njk`

This is the simplest change — add a `border-l-[3px]` class with a type-specific color to each `<article>` element. The template already branches by post type (like, bookmark, repost, reply, photo, article, note), so each branch gets its own color.

**Color mapping (from design doc):**
| Post Type | Classes |
|-----------|---------|
| Like | `border-l-[3px] border-l-red-400 dark:border-l-red-500` |
| Bookmark | `border-l-[3px] border-l-amber-400 dark:border-l-amber-500` |
| Repost | `border-l-[3px] border-l-green-400 dark:border-l-green-500` |
| Reply | `border-l-[3px] border-l-primary-400 dark:border-l-primary-500` |
| Photo | `border-l-[3px] border-l-purple-400 dark:border-l-purple-500` |
| Article | `border-l-[3px] border-l-surface-300 dark:border-l-surface-600` |
| Note | `border-l-[3px] border-l-surface-300 dark:border-l-surface-600` |

### Step 1: Implement the color-coded borders

The `<article>` tag on **line 19** is shared by ALL post types. The type detection happens INSIDE the article (lines 22-27 set variables, lines 28-226 branch by type). Since we need different border colors per type, we must move the `<article>` tag inside each branch, OR use a Nunjucks variable to set the border class before the article opens.

**Approach:** Set a border class variable before the `<article>` tag using Nunjucks `{% set %}` blocks. This keeps the single `<article>` tag and avoids duplicating it 7 times.

In `_includes/components/sections/recent-posts.njk`, replace the block from line 18 through line 28 (the `{% for %}`, type detection variables, and `<article>` opening) with this version that sets a border class variable:

**Current (lines 18-19):**
```nunjucks
    {% for post in collections.posts | head(maxItems) %}
    <article class="h-entry p-4 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
```

**After:** Insert the type detection BEFORE the `<article>` tag, set a `borderClass` variable, and add it to the article's class list:

```nunjucks
    {% for post in collections.posts | head(maxItems) %}

      {# Detect post type for color-coded left border #}
      {% set likedUrl = post.data.likeOf or post.data.like_of %}
      {% set bookmarkedUrl = post.data.bookmarkOf or post.data.bookmark_of %}
      {% set repostedUrl = post.data.repostOf or post.data.repost_of %}
      {% set replyToUrl = post.data.inReplyTo or post.data.in_reply_to %}
      {% set hasPhotos = post.data.photo and post.data.photo.length %}

      {% if likedUrl %}
        {% set borderClass = "border-l-[3px] border-l-red-400 dark:border-l-red-500" %}
      {% elif bookmarkedUrl %}
        {% set borderClass = "border-l-[3px] border-l-amber-400 dark:border-l-amber-500" %}
      {% elif repostedUrl %}
        {% set borderClass = "border-l-[3px] border-l-green-400 dark:border-l-green-500" %}
      {% elif replyToUrl %}
        {% set borderClass = "border-l-[3px] border-l-primary-400 dark:border-l-primary-500" %}
      {% elif hasPhotos %}
        {% set borderClass = "border-l-[3px] border-l-purple-400 dark:border-l-purple-500" %}
      {% else %}
        {% set borderClass = "border-l-[3px] border-l-surface-300 dark:border-l-surface-600" %}
      {% endif %}

    <article class="h-entry p-4 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 {{ borderClass }} hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
```

Then **remove** the duplicate type detection variables that currently exist inside the article (lines 22-26), since they've been moved above. The rest of the template still uses these same variable names in the `{% if likedUrl %}` / `{% elif %}` branches, so those continue to work — the variables are already set.

**Important:** The type detection variables (`likedUrl`, `bookmarkedUrl`, `repostedUrl`, `replyToUrl`, `hasPhotos`) are currently declared on lines 22-26 inside the `<article>`. After this change, they're declared before the `<article>`. Since they're still within the same `{% for %}` loop scope, all subsequent `{% if %}` checks on lines 28+ continue to reference them correctly. Remove lines 22-26 to avoid redeclaring the same variables.

### Step 2: Build and verify

Run:
```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
npm run build
```

Expected: Build completes with exit 0, no template errors.

### Step 3: Visual verification with playwright-cli

```bash
playwright-cli open https://rmendes.net
playwright-cli snapshot
```

Verify: Post cards in "Recent Posts" section have colored left borders (red for likes, green for reposts, etc.). Take a screenshot for evidence.

### Step 4: Commit

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
git add _includes/components/sections/recent-posts.njk
git commit -m "feat: add color-coded left borders to post cards by type"
```

---

## Task 2: Projects Accordion

**Files:**
- Modify: `_includes/components/sections/cv-projects.njk`

Convert the always-expanded 2-column project cards grid into an Alpine.js accordion. Each card shows a collapsed summary row (name + status badge + date range + chevron) and expands on click to reveal description + technology tags.

### Step 1: Implement the accordion

Replace the entire content of `_includes/components/sections/cv-projects.njk` with the accordion version.

**Current behavior:** Lines 16-58 render a `grid grid-cols-1 sm:grid-cols-2 gap-4` with each card showing name, status, dates, description, and tech tags all at once.

**New behavior:** Same grid layout, but each card has:
- A clickable summary row (always visible): project name (linked if URL), status badge, date range, chevron icon
- A collapsible detail section (hidden by default): description + tech tags, revealed with `x-show` + `x-transition`

**Full replacement for `cv-projects.njk`:**

```nunjucks
{#
  CV Projects Section - collapsible project cards (accordion)
  Data fetched from /cv/data.json via homepage plugin
#}

{% set sectionConfig = section.config or {} %}
{% set maxItems = sectionConfig.maxItems or 10 %}
{% set showTechnologies = sectionConfig.showTechnologies if sectionConfig.showTechnologies is defined else true %}

{% if cv and cv.projects and cv.projects.length %}
<section class="mb-8 sm:mb-12" id="projects" x-data="{ expanded: {} }">
  <h2 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 mb-4 sm:mb-6">
    {{ sectionConfig.title or "Projects" }}
  </h2>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {% for item in cv.projects | head(maxItems) %}
    <div class="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-600 transition-colors overflow-hidden">
      {# Summary row — always visible, clickable #}
      <button
        class="w-full p-4 flex items-center justify-between gap-2 cursor-pointer text-left hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
        @click="expanded[{{ loop.index0 }}] = !expanded[{{ loop.index0 }}]"
        :aria-expanded="expanded[{{ loop.index0 }}] ? 'true' : 'false'"
      >
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <h3 class="font-semibold text-surface-900 dark:text-surface-100 truncate">
            {% if item.url %}
            <a href="{{ item.url }}" class="hover:text-primary-600 dark:hover:text-primary-400" @click.stop>{{ item.name }}</a>
            {% else %}
            {{ item.name }}
            {% endif %}
          </h3>
          {% if item.status %}
          <span class="shrink-0 text-xs px-2 py-0.5 rounded-full capitalize
            {% if item.status == 'active' %}bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300
            {% elif item.status == 'maintained' %}bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
            {% elif item.status == 'archived' %}bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400
            {% else %}bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400{% endif %}">
            {{ item.status }}
          </span>
          {% endif %}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          {% if item.startDate %}
          <span class="text-xs text-surface-500 hidden sm:inline">
            {{ item.startDate }}{% if item.endDate %} – {{ item.endDate }}{% else %} – Present{% endif %}
          </span>
          {% endif %}
          <svg
            class="w-4 h-4 text-surface-400 transition-transform duration-200"
            :class="expanded[{{ loop.index0 }}] && 'rotate-180'"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      {# Detail section — collapsible #}
      <div
        x-show="expanded[{{ loop.index0 }}]"
        x-transition:enter="transition ease-out duration-200"
        x-transition:enter-start="opacity-0 -translate-y-1"
        x-transition:enter-end="opacity-100 translate-y-0"
        x-transition:leave="transition ease-in duration-150"
        x-transition:leave-start="opacity-100 translate-y-0"
        x-transition:leave-end="opacity-0 -translate-y-1"
        x-cloak
        class="px-4 pb-4"
      >
        {% if item.startDate %}
        <p class="text-xs text-surface-500 mb-1 sm:hidden">
          {{ item.startDate }}{% if item.endDate %} – {{ item.endDate }}{% else %} – Present{% endif %}
        </p>
        {% endif %}

        {% if item.description %}
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">{{ item.description }}</p>
        {% endif %}

        {% if showTechnologies and item.technologies and item.technologies.length %}
        <div class="flex flex-wrap gap-1">
          {% for tech in item.technologies %}
          <span class="text-xs px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded">
            {{ tech }}
          </span>
          {% endfor %}
        </div>
        {% endif %}
      </div>
    </div>
    {% endfor %}
  </div>
</section>
{% endif %}
```

**Key details:**
- `x-data="{ expanded: {} }"` on the `<section>` — object-based tracking, independent toggles
- `@click.stop` on the project name `<a>` link — prevents the button click handler from firing when clicking the link
- Date range shown in summary row on `sm:` screens, and duplicated inside the collapsible detail for mobile (`sm:hidden`)
- `x-cloak` hides detail sections during Alpine.js initialization
- `x-transition` with opacity + translate-y for smooth reveal
- Chevron rotates 180deg via `:class="expanded[index] && 'rotate-180'"`
- `aria-expanded` attribute for accessibility

### Step 2: Build and verify

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
npm run build
```

Expected: Exit 0.

### Step 3: Visual verification with playwright-cli

```bash
playwright-cli open https://rmendes.net
playwright-cli snapshot
```

Verify: Projects section shows collapsed cards with name + status + date + chevron. Click a project card to expand — description and tech tags appear with smooth animation.

### Step 4: Commit

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
git add _includes/components/sections/cv-projects.njk
git commit -m "feat: convert projects section to collapsible accordion"
```

---

## Task 3: Sidebar Widget Collapsibility

**Files:**
- Modify: `_includes/components/homepage-sidebar.njk` — add collapsible wrapper
- Modify: `css/tailwind.css` — add `.widget-header` and `.widget-collapsible` styles
- Modify: 10 widget files — remove `<h3>` titles (moved to sidebar wrapper)

This is the most complex change. The sidebar dispatcher wraps each widget in a collapsible Alpine.js container. The wrapper provides the `<h3>` title + chevron toggle, and a CSS rule hides the inner widget title to avoid duplication.

### Step 1: Add CSS classes for widget collapsibility

In `css/tailwind.css`, add these classes inside the existing `@layer components` block (after the `.widget-title` rule, around line 293):

```css
  /* Collapsible widget wrapper */
  .widget-header {
    @apply flex items-center justify-between cursor-pointer;
  }

  .widget-header .widget-title {
    @apply mb-0;
  }

  .widget-chevron {
    @apply w-4 h-4 text-surface-400 transition-transform duration-200 shrink-0;
  }

  /* Hide inner widget titles when the collapsible wrapper provides one */
  .widget-collapsible .widget .widget-title {
    @apply hidden;
  }

  /* Hide FeedLand's custom title in collapsible wrapper */
  .widget-collapsible .widget .fl-title {
    @apply hidden;
  }
```

### Step 2: Rewrite homepage-sidebar.njk with collapsible wrapper

Replace the entire content of `_includes/components/homepage-sidebar.njk`.

**Widget title map** (from design doc):

| widget.type | Title |
|-------------|-------|
| search | Search |
| social-activity | Social Activity |
| github-repos | GitHub |
| funkwhale | Listening |
| recent-posts | Recent Posts |
| blogroll | Blogroll |
| feedland | FeedLand |
| categories | Categories |
| webmentions | Webmentions |
| recent-comments | Recent Comments |
| fediverse-follow | Fediverse |
| author-card | Author |
| custom-html | (from widget.config.title or "Custom") |

**New `homepage-sidebar.njk`:**

```nunjucks
{# Homepage Builder Sidebar — renders widgets from homepageConfig.sidebar #}
{# Each widget is wrapped in a collapsible container with localStorage persistence #}
{% if homepageConfig.sidebar and homepageConfig.sidebar.length %}
  {% for widget in homepageConfig.sidebar %}

    {# Resolve widget title #}
    {% if widget.type == "search" %}{% set widgetTitle = "Search" %}
    {% elif widget.type == "social-activity" %}{% set widgetTitle = "Social Activity" %}
    {% elif widget.type == "github-repos" %}{% set widgetTitle = "GitHub" %}
    {% elif widget.type == "funkwhale" %}{% set widgetTitle = "Listening" %}
    {% elif widget.type == "recent-posts" %}{% set widgetTitle = "Recent Posts" %}
    {% elif widget.type == "blogroll" %}{% set widgetTitle = "Blogroll" %}
    {% elif widget.type == "feedland" %}{% set widgetTitle = "FeedLand" %}
    {% elif widget.type == "categories" %}{% set widgetTitle = "Categories" %}
    {% elif widget.type == "webmentions" %}{% set widgetTitle = "Webmentions" %}
    {% elif widget.type == "recent-comments" %}{% set widgetTitle = "Recent Comments" %}
    {% elif widget.type == "fediverse-follow" %}{% set widgetTitle = "Fediverse" %}
    {% elif widget.type == "author-card" %}{% set widgetTitle = "Author" %}
    {% elif widget.type == "custom-html" %}{% set widgetTitle = (widget.config.title if widget.config and widget.config.title) or "Custom" %}
    {% else %}{% set widgetTitle = widget.type %}
    {% endif %}

    {% set widgetKey = "widget-" + widget.type + "-" + loop.index0 %}
    {% set defaultOpen = "true" if loop.index0 < 3 else "false" %}

    {# Collapsible wrapper — Alpine.js handles toggle, localStorage persists state #}
    <div
      class="widget-collapsible mb-4"
      x-data="{ open: localStorage.getItem('{{ widgetKey }}') !== null ? localStorage.getItem('{{ widgetKey }}') === 'true' : {{ defaultOpen }} }"
    >
      <div class="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <button
          class="widget-header w-full p-4"
          @click="open = !open; localStorage.setItem('{{ widgetKey }}', open)"
          :aria-expanded="open ? 'true' : 'false'"
        >
          <h3 class="widget-title font-bold text-lg">{{ widgetTitle }}</h3>
          <svg
            class="widget-chevron"
            :class="open && 'rotate-180'"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <div
          x-show="open"
          x-transition:enter="transition ease-out duration-150"
          x-transition:enter-start="opacity-0"
          x-transition:enter-end="opacity-100"
          x-transition:leave="transition ease-in duration-100"
          x-transition:leave-start="opacity-100"
          x-transition:leave-end="opacity-0"
          x-cloak
        >
          {# Widget content — inner .widget provides padding, inner title hidden by CSS #}
          {% if widget.type == "author-card" %}
            {% include "components/widgets/author-card.njk" %}
          {% elif widget.type == "social-activity" %}
            {% include "components/widgets/social-activity.njk" %}
          {% elif widget.type == "github-repos" %}
            {% include "components/widgets/github-repos.njk" %}
          {% elif widget.type == "funkwhale" %}
            {% include "components/widgets/funkwhale.njk" %}
          {% elif widget.type == "recent-posts" %}
            {% include "components/widgets/recent-posts.njk" %}
          {% elif widget.type == "blogroll" %}
            {% include "components/widgets/blogroll.njk" %}
          {% elif widget.type == "feedland" %}
            {% include "components/widgets/feedland.njk" %}
          {% elif widget.type == "categories" %}
            {% include "components/widgets/categories.njk" %}
          {% elif widget.type == "search" %}
            <div class="widget">
              <div id="sidebar-search"></div>
              <script>initPagefind("#sidebar-search");</script>
            </div>
          {% elif widget.type == "webmentions" %}
            {% include "components/widgets/webmentions.njk" %}
          {% elif widget.type == "recent-comments" %}
            {% include "components/widgets/recent-comments.njk" %}
          {% elif widget.type == "fediverse-follow" %}
            {% include "components/widgets/fediverse-follow.njk" %}
          {% elif widget.type == "custom-html" %}
            {% set wConfig = widget.config or {} %}
            <div class="widget">
              {% if wConfig.content %}
              <div class="prose dark:prose-invert prose-sm max-w-none">
                {{ wConfig.content | safe }}
              </div>
              {% endif %}
            </div>
          {% else %}
            <!-- Unknown widget type: {{ widget.type }} -->
          {% endif %}
        </div>
      </div>
    </div>

  {% endfor %}
{% endif %}
```

**Key architecture decisions:**
- The wrapper provides the outer card styling (`bg-white`, `rounded-lg`, `border`, `shadow-sm`) and the title + chevron
- The inner widget files keep their `.widget` class, but the inner title is hidden via CSS `.widget-collapsible .widget .widget-title { display: none; }`
- The `search` widget was previously inline in the sidebar — it's now included directly (no separate file), with the inner `<h3>` removed since the wrapper provides it
- The `custom-html` widget's inner `<h3>` is removed — the wrapper uses `widget.config.title` or "Custom"
- The `<is-land on:visible>` wrappers remain inside the individual widget files — the collapsible wrapper is OUTSIDE `<is-land>`, so the toggle works immediately even before the lazy-loaded content initializes
- `widgetKey` uses `widget.type + "-" + loop.index0` to avoid localStorage key collisions if the same widget type appears twice
- First 3 widgets open by default (`loop.index0 < 3`), rest collapsed

**Note on widget `.widget` class and double borders:** The wrapper div already has `bg-white rounded-lg border shadow-sm`, and the inner `.widget` class also has those styles. To avoid double borders/shadows, we need to neutralize the inner `.widget` styling when inside `.widget-collapsible`. Add this to the CSS in Step 1:

```css
  /* Neutralize inner widget card styling when inside collapsible wrapper */
  .widget-collapsible .widget {
    @apply border-0 shadow-none rounded-none mb-0 bg-transparent;
  }
```

### Step 3: Build and verify

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
npm run build
```

Expected: Exit 0.

### Step 4: Visual verification with playwright-cli

```bash
playwright-cli open https://rmendes.net
playwright-cli snapshot
```

Verify:
- All sidebar widgets have a title + chevron header
- First 3 widgets are expanded, remaining are collapsed
- Click a collapsed widget title → it expands smoothly
- Click an expanded widget title → it collapses
- No duplicate titles visible (inner titles hidden)
- No double borders or shadows on widget cards

### Step 5: Test localStorage persistence

```bash
playwright-cli click <ref-of-a-widget-header>   # Toggle a widget
playwright-cli eval "localStorage.getItem('widget-social-activity-1')"
playwright-cli close
playwright-cli open https://rmendes.net
playwright-cli snapshot
```

Verify: The widget you toggled retains its state after page reload.

### Step 6: Verify dark mode

```bash
playwright-cli eval "document.documentElement.classList.add('dark')"
playwright-cli screenshot --filename=dark-mode-sidebar
```

Verify: Widget headers, chevrons, and collapsed/expanded states look correct in dark mode.

### Step 7: Verify mobile responsiveness

```bash
playwright-cli resize 375 812
playwright-cli snapshot
```

Verify: Sidebar stacks below main content, widgets are still collapsible.

### Step 8: Commit

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
git add _includes/components/homepage-sidebar.njk css/tailwind.css
git commit -m "feat: add collapsible sidebar widgets with localStorage persistence"
```

---

## Task 4: Deploy and Final Verification

**Files:** None (deployment commands only)

### Step 1: Push theme repo

```bash
cd /home/rick/code/indiekit-dev/indiekit-eleventy-theme
git push origin main
```

### Step 2: Update submodule in indiekit-cloudron

```bash
cd /home/rick/code/indiekit-dev/indiekit-cloudron
git submodule update --remote eleventy-site
git add eleventy-site
git commit -m "chore: update eleventy-site submodule (homepage UI/UX improvements)"
git push origin main
```

### Step 3: Build and deploy

```bash
cd /home/rick/code/indiekit-dev/indiekit-cloudron
make prepare
cloudron build --no-cache && cloudron update --app rmendes.net --no-backup
```

### Step 4: Final visual verification on live site

```bash
playwright-cli open https://rmendes.net
playwright-cli screenshot --filename=homepage-final
playwright-cli snapshot
```

Verify all three changes are live:
1. Post cards have color-coded left borders
2. Projects section is collapsible (all collapsed by default)
3. Sidebar widgets are collapsible (first 3 open, rest collapsed)
4. Dark mode works for all changes
5. h-card (Author widget) is present and contains proper microformat markup

---

## Risk Mitigation Notes

1. **`<is-land>` + Alpine.js interaction:** The collapsible wrapper's `x-data` is OUTSIDE `<is-land>`. Alpine.js initializes the toggle immediately. The `<is-land on:visible>` inside widget files handles lazy-loading the widget content. This means the toggle button works before the widget content loads — expanding an unloaded widget triggers `<is-land>` visibility, which then loads the content.

2. **FeedLand widget:** Uses custom `fl-title` instead of `widget-title`. The CSS rule `.widget-collapsible .widget .fl-title { display: none; }` handles this case.

3. **Author card widget:** Has no inner `<h3>` — it just includes `h-card.njk`. The CSS hiding rule won't find anything to hide, which is fine. The wrapper provides "Author" as the title.

4. **Search widget:** Was previously inline in the sidebar with its own `<is-land>` + `<h3>`. Now it's inline inside the collapsible wrapper with the `<h3>` removed. The `<is-land>` wrapper is preserved inside for lazy-loading Pagefind.

   **Wait — re-reading the new sidebar template:** The search widget was changed to NOT use `<is-land>` in the inline version. Let me note this: the search widget should keep its `<is-land on:visible>` wrapper inside the collapsible content div. Update the search case to:
   ```nunjucks
   {% elif widget.type == "search" %}
     <is-land on:visible>
     <div class="widget">
       <div id="sidebar-search"></div>
       <script>initPagefind("#sidebar-search");</script>
     </div>
     </is-land>
   ```

5. **Custom HTML widget:** Similarly should keep `<is-land on:visible>` wrapper:
   ```nunjucks
   {% elif widget.type == "custom-html" %}
     {% set wConfig = widget.config or {} %}
     <is-land on:visible>
     <div class="widget">
       {% if wConfig.content %}
       <div class="prose dark:prose-invert prose-sm max-w-none">
         {{ wConfig.content | safe }}
       </div>
       {% endif %}
     </div>
     </is-land>
   ```
