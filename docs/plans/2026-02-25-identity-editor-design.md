# Editable Identity via Homepage Plugin — Design

## Goal

Make all author identity fields (hero content, h-card data, social links) editable from the Indiekit admin UI, stored permanently in MongoDB via the homepage plugin's existing `identity` field.

## Architecture

Extend `indiekit-endpoint-homepage` with a three-tab admin interface and an `identity` data section. The theme templates check `homepageConfig.identity.*` first, falling back to `site.author.*` environment variables. No new plugin, no new data file — identity lives in the existing `homepage.json`.

## Tab Structure

### Tab 1: Homepage Builder (`/homepage`)

Existing functionality, reorganized. Contains:
- Layout selection (presets + radio options)
- Hero config (enabled, show social toggles)
- Content Sections (drag-drop)
- Homepage Sidebar (drag-drop)
- Footer (drag-drop)

### Tab 2: Blog Sidebar (`/homepage/blog-sidebar`)

Extracted from the current single-page dashboard:
- Blog Listing Sidebar (drag-drop widget list)
- Blog Post Sidebar (drag-drop widget list)

### Tab 3: Identity (`/homepage/identity`)

New form page with sections:

**Profile:**
- `name` — text input
- `avatar` — text input (URL)
- `title` — text input (job title / subtitle)
- `pronoun` — text input
- `bio` — textarea
- `description` — textarea (site description shown in hero)

**Location:**
- `locality` — text input (city)
- `country` — text input
- `org` — text input (organization)

**Contact:**
- `url` — text input (author URL)
- `email` — text input
- `keyUrl` — text input (PGP key URL)

**Skills:**
- `categories` — tag-input component (comma-separated skills/interests)

**Social Links:**
- Full CRUD list using add-another pattern
- Each entry: `name` (text), `url` (text), `rel` (text, default "me"), `icon` (select from: github, linkedin, bluesky, mastodon, activitypub)
- Add, remove, reorder

## Data Model

### MongoDB Document (`homepageConfig` collection)

The existing singleton document gains an `identity` field:

```javascript
{
  _id: "homepage",
  layout: "two-column",
  hero: { enabled: true, showSocial: true },
  sections: [...],
  sidebar: [...],
  blogListingSidebar: [...],
  blogPostSidebar: [...],
  footer: [...],
  identity: {
    name: "Ricardo Mendes",
    avatar: "https://...",
    title: "Middleware Engineer & DevOps Specialist",
    pronoun: "he/him",
    bio: "Building infrastructure, automating workflows...",
    description: "DevOps engineer, IndieWeb enthusiast...",
    locality: "Brussels",
    country: "Belgium",
    org: "",
    url: "https://rmendes.net",
    email: "rick@example.com",
    keyUrl: "https://...",
    categories: ["IndieWeb", "OSINT", "DevOps"],
    social: [
      { name: "GitHub", url: "https://github.com/rmdes", rel: "me", icon: "github" },
      { name: "Bluesky", url: "https://bsky.app/profile/rmendes.net", rel: "me atproto", icon: "bluesky" },
      ...
    ]
  },
  updatedAt: "ISO 8601 string"
}
```

### JSON File

Written to `content/.indiekit/homepage.json` on save (same as existing behavior). Eleventy file watcher triggers rebuild.

## Data Precedence

```
homepageConfig.identity.name  →  if truthy, use it
                               →  else fall back to site.author.name (env var)
```

Applied in the theme templates (hero.njk, h-card.njk) and anywhere else that reads `site.author.*` or `site.social`.

The simplest approach: create a computed `author` object in `_data/homepageConfig.js` that merges identity over site.author, so templates can use a single variable.

## Components Used (from @rmdes/indiekit-frontend)

| Field | Component |
|-------|-----------|
| Name, title, pronoun, locality, country, org, url, email, keyUrl | `input()` macro |
| Bio, description | `textarea()` macro |
| Categories/skills | `tag-input()` macro |
| Social links | `add-another()` macro wrapping input fields per entry |
| Icon selection | `select()` macro with predefined icon options |
| Form sections | `fieldset()` macro with legends |
| Save/cancel | `button()` macro (primary/secondary) |
| Errors | `errorSummary()` + field-level `errorMessage` |

## Tab Navigation

URL-based tabs using server-rendered pages (not client-side switching):

- `GET /homepage` — Homepage Builder tab
- `GET /homepage/blog-sidebar` — Blog Sidebar tab
- `GET /homepage/identity` — Identity tab

Each tab is a separate form with its own POST endpoint:
- `POST /homepage/save` — existing, handles layout/hero/sections/sidebar/footer
- `POST /homepage/save-blog-sidebar` — handles blogListingSidebar + blogPostSidebar
- `POST /homepage/save-identity` — handles identity fields

A shared tab navigation bar appears at the top of all three pages.

## Files Changed

### indiekit-endpoint-homepage (plugin)

| File | Change |
|------|--------|
| `index.js` | Add identity routes, identity configSchema |
| `lib/controllers/dashboard.js` | Split blog sidebar into separate GET handler, add identity GET/POST |
| `lib/controllers/api.js` | Add identity to public config endpoint |
| `lib/storage/config.js` | Handle identity save/merge |
| `views/homepage-dashboard.njk` | Remove blog sidebar sections, add tab nav |
| `views/homepage-blog-sidebar.njk` | New — extracted blog sidebar UI |
| `views/homepage-identity.njk` | New — identity editor form |
| `views/partials/tab-nav.njk` | New — shared tab navigation partial |
| `locales/en.json` | Add identity i18n strings |

### indiekit-eleventy-theme (theme)

| File | Change |
|------|--------|
| `_data/homepageConfig.js` | Merge identity over site.author, expose computed `author` object |
| `_includes/components/sections/hero.njk` | Use merged author data instead of raw site.author |
| `_includes/components/h-card.njk` | Use merged author data instead of raw site.author |

## Not Changed

- `_data/site.js` — env vars remain as fallback source, untouched
- Main feed templates — don't reference author data
- Post layout — uses site.author for meta tags (will get override via merged data)
- Other plugins — no changes needed

## Constraints

- Identity editor uses standard Indiekit frontend components (no custom JS beyond add-another)
- Social link icons limited to the set already defined in hero.njk/h-card.njk SVGs (github, linkedin, bluesky, mastodon, activitypub) — extensible later
- Avatar is a URL field, not file upload (avatar image hosting is separate)
- All dates stored as ISO 8601 strings
