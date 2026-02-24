# Homepage UI/UX Improvements — Design Document

**Date:** 2026-02-24
**Scope:** indiekit-eleventy-theme (rendering layer only)
**Status:** APPROVED

## Context

The homepage at rmendes.net is a data-driven page controlled by the `indiekit-endpoint-homepage` plugin. The plugin's admin UI determines which sections and sidebar widgets appear. This design addresses rendering quality improvements to three areas without changing the data model or plugin architecture.

The homepage uses a `two-column` layout with a full-width hero, main content sections (Recent Posts, Personal Skills, Personal Interests, Personal Projects), and a sidebar with 7+ widgets (Search, Social Activity, Recent Comments, Webmentions, Blogroll, GitHub, Listening, Author h-card).

### Design principles

- Improve visual quality of existing templates, not content decisions
- Content selection stays with the user via the homepage plugin config
- All changes are in the Eleventy theme (Nunjucks templates + Tailwind CSS)
- Use Alpine.js for interactivity (already loaded throughout the theme)
- Respect the personal vs work data split (homepage = personal, /cv/ = work)
- Never remove IndieWeb infrastructure (h-card, webmentions, microformats)

## Change 1: Projects Accordion

### Problem

The `cv-projects` section renders full paragraph descriptions for every project. On the homepage, 5 projects with multi-line descriptions dominate the page, pushing sidebar content far below the viewport. The section reads like a resume rather than a scannable overview.

### Design

Convert project cards from always-expanded to an accordion pattern using Alpine.js.

**Collapsed state (default):** Single row showing:
- Project name (linked if URL exists)
- Status badge (active/maintained/archived/completed)
- Date range (e.g., "2022-02 – Present")
- Chevron toggle icon (right-aligned)

**Expanded state (on click):** Full card content:
- Description paragraph
- Technology tags
- Smooth reveal via `x-transition`

**File:** `_includes/components/sections/cv-projects.njk`

**Behavior:**
- All projects start collapsed on page load
- Click anywhere on the summary row to toggle
- Multiple projects can be open simultaneously (independent toggles, not mutual exclusion)
- The 2-column grid layout is preserved — each card in the grid is independently collapsible
- Chevron rotates 180deg when expanded

**Markup pattern:**
```html
<section x-data="{ expanded: {} }">
  <!-- For each project -->
  <div class="project-card">
    <button @click="expanded[index] = !expanded[index]">
      <h3>Name</h3> <span>status</span> <span>dates</span> <chevron :class="expanded[index] && 'rotate-180'">
    </button>
    <div x-show="expanded[index]" x-transition>
      <p>description</p>
      <div>tech tags</div>
    </div>
  </div>
</section>
```

**Visual details:**
- Summary row: `flex items-center justify-between` with `cursor-pointer`
- Hover: `hover:bg-surface-50 dark:hover:bg-surface-700/50` on the summary row
- Chevron: `w-4 h-4 text-surface-400 transition-transform duration-200`
- Transition: `x-transition:enter="transition ease-out duration-200"` with opacity + translate-y

### Impact

Reduces vertical space of the projects section by ~70% in collapsed state. Visitors can scan project names and drill into details on interest.

## Change 2: Sidebar Widget Collapsibility

### Problem

The sidebar has 7+ widgets stacked vertically, each fully expanded. The sidebar is longer than the main content area, and widgets below the fold (GitHub, Listening, Author h-card) are only reachable after significant scrolling.

### Design

Add a collapsible wrapper around each widget in `homepage-sidebar.njk`. Widget titles become clickable toggle buttons with a chevron indicator. Collapse state persists in `localStorage`.

**Default state (first visit):**
- First 3 widgets in the sidebar config: **open**
- Remaining widgets: **collapsed** (title + chevron visible)

**Return visits:** `localStorage` restores the user's last toggle state for each widget.

**Files changed:**
- `_includes/components/homepage-sidebar.njk` — add wrapper around each widget include
- `css/tailwind.css` — add `.widget-collapsible` styles
- Individual widget files — extract `<h3>` title to be passed as a variable OR keep title inside but hide it when the wrapper provides one

**Architecture decision:** The wrapper approach. Rather than modifying 10+ individual widget files, the sidebar dispatcher wraps each widget include in a collapsible container. This requires knowing the widget title at the dispatcher level.

**Title resolution:** Each widget type has a known title (Search, Social Activity, GitHub, Listening, Blogroll, etc.). The dispatcher maps `widget.type` to a display title, or uses `widget.config.title` if set. The individual widget files keep their own `<h3>` tags — the wrapper hides the inner title via CSS when the wrapper provides one, or we remove the inner `<h3>` from widget files and let the wrapper handle all titles uniformly.

**Recommended approach:** Remove `<h3>` from individual widget files and let the wrapper handle titles. This is cleaner and avoids duplicate headings. Each widget file keeps its content only.

**Markup pattern:**
```html
{% set widgetTitle = "Social Activity" %}
{% set widgetKey = "widget-social-activity" %}
{% set defaultOpen = loop.index0 < 3 %}

<div class="widget" x-data="{ open: localStorage.getItem('{{ widgetKey }}') !== null ? localStorage.getItem('{{ widgetKey }}') === 'true' : {{ defaultOpen }} }">
  <button
    class="widget-header"
    @click="open = !open; localStorage.setItem('{{ widgetKey }}', open)"
    aria-expanded="open"
  >
    <h3 class="widget-title">{{ widgetTitle }}</h3>
    <svg :class="open && 'rotate-180'" class="chevron">...</svg>
  </button>
  <div x-show="open" x-transition x-cloak>
    {% include "components/widgets/social-activity.njk" %}
  </div>
</div>
```

**Visual details:**
- Widget header: `flex items-center justify-between cursor-pointer`
- Chevron: `w-4 h-4 text-surface-400 transition-transform duration-200`
- No visual change when open — widget looks exactly as it does today
- When collapsed: only the header row (title + chevron) is visible, with the existing widget border/background
- Smooth transition: `x-transition:enter="transition ease-out duration-150"`

**Widget title map:**

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

### Impact

Reduces initial sidebar scroll length. Visitors see all widget titles at a glance and expand what interests them. First-time visitors get a curated view (top 3 open), returning visitors get their preferred configuration.

## Change 3: Post Card Color-Coded Left Borders

### Problem

All post cards in the `recent-posts` section use identical styling (white bg, gray border, rounded-lg). When scrolling a mixed feed of notes, reposts, replies, likes, bookmarks, and photos, the only way to distinguish post types is by reading the small icon + label text inside each card. There's no scannable visual signal at the card level.

### Design

Add a `border-l-3` (3px left border) to each `<article>` in `recent-posts.njk`, colored by post type. The colors match the existing SVG icon colors already used inside the cards.

**Color mapping:**

| Post Type | Left Border Color | Matches Existing |
|-----------|------------------|-----------------|
| Like | `border-l-red-400` | `text-red-500` heart icon |
| Bookmark | `border-l-amber-400` | `text-amber-500` bookmark icon |
| Repost | `border-l-green-400` | `text-green-500` repost icon |
| Reply | `border-l-primary-400` | `text-primary-500` reply icon |
| Photo | `border-l-purple-400` | `text-purple-500` camera icon |
| Article | `border-l-surface-300 dark:border-l-surface-600` | Neutral, matches header text weight |
| Note | `border-l-surface-300 dark:border-l-surface-600` | Neutral, matches header text weight |

**File:** `_includes/components/sections/recent-posts.njk`

**Implementation:** Add the border class to each `<article>` element. The template already branches by post type (like, bookmark, repost, reply, photo, article, note) so each branch gets its specific border color.

**Before:**
```html
<article class="h-entry p-4 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
```

**After (example for repost):**
```html
<article class="h-entry p-4 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 border-l-3 border-l-green-400 dark:border-l-green-500 hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
```

**Visual details:**
- `border-l-3` (3px) is enough to be noticeable without being heavy
- The left border color is constant (doesn't change on hover) — the top/right/bottom borders still change to primary on hover
- Dark mode uses slightly brighter variants (400 in light, 500 in dark) for visibility
- `rounded-lg` still applies — the left border gets a subtle radius at top-left and bottom-left corners

**Tailwind note:** `border-l-3` is not a default Tailwind class. Options:
1. Use `border-l-4` (4px, default Tailwind) — slightly thicker but no config change
2. Add `borderWidth: { 3: '3px' }` to `tailwind.config.js` extend — exact 3px
3. Use arbitrary value `border-l-[3px]` — works without config change

**Recommendation:** Use `border-l-[3px]` (arbitrary value). No config change needed, exact width desired.

### Impact

Instant visual scanability of the feed. Visitors can quickly identify post types by color without reading text labels. The feed feels more alive and differentiated.

## Files Modified (Summary)

| File | Change |
|------|--------|
| `_includes/components/sections/cv-projects.njk` | Alpine.js accordion with collapsed summary rows |
| `_includes/components/sections/recent-posts.njk` | Add `border-l-[3px]` with type-specific colors to each article |
| `_includes/components/homepage-sidebar.njk` | Collapsible wrapper around each widget with localStorage persistence |
| `_includes/components/widgets/*.njk` (10+ files) | Remove `<h3>` widget titles (moved to sidebar wrapper) |
| `css/tailwind.css` | Add `.widget-header` and `.widget-collapsible` styles |

## Files NOT Modified

- `tailwind.config.js` — no config changes needed (using arbitrary values)
- `_data/*.js` — no data changes
- `eleventy.config.js` — no config changes
- `indiekit-endpoint-homepage/` — no plugin changes
- `indiekit-endpoint-cv/` — no plugin changes

## Testing

1. Verify homepage renders correctly with all three changes
2. Test accordion open/close on projects section
3. Test sidebar collapse/expand and localStorage persistence (close browser, reopen, verify state)
4. Test dark mode for all color-coded borders
5. Test mobile responsiveness (sidebar stacks to full-width, widgets should still be collapsible)
6. Verify h-card microformat markup is preserved in the author-card widget
7. Verify the /cv/ page is unaffected (cv-projects on /cv/ uses a different template or the same template — if same, accordion applies there too, which is acceptable)
8. Visual check with playwright-cli on the live site after deployment

## Risks

- **Widget title extraction:** Moving titles from individual widget files to the wrapper requires updating 10+ files. Risk of missing one or breaking a title.
- **localStorage key collisions:** Using `widget-{type}` as keys. If the same widget type appears twice in the sidebar config, they'd share state. Mitigate by using `widget-{index}` or `widget-{type}-{index}`.
- **Alpine.js load order:** Widgets wrapped in `<is-land on:visible>` may not have Alpine.js available when the wrapper tries to initialize. Solution: the wrapper's `x-data` is outside `<is-land>`, so Alpine handles the toggle, and `<is-land>` handles lazy-loading the widget content inside.
