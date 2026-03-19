# svemagie and so on — personal blog

Personal IndieWeb blog for [blog.giersig.eu](https://blog.giersig.eu), built with [Eleventy](https://www.11ty.dev/) and [IndieKit](https://getindiekit.com/).

This is **svemagie's** instance of [`svemagie/blog-eleventy-indiekit`](https://github.com/svemagie/blog-eleventy-indiekit) (the shared theme), adapted and extended beyond the upstream.

---

## Tech stack

- **Eleventy 3** — static site generator
- **Tailwind CSS 3** + `@tailwindcss/typography` — styling
- **Alpine.js** — dropdowns, interactive UI
- **IndieKit** (Micropub) — post creation/editing via the `content/` symlink
- **Webmentions** — via `webmention.io` + `@chrisburnell/eleventy-cache-webmentions`
- **ActivityPub** — Fedify, handle `@svemagie@blog.giersig.eu`
- **OG images** — generated at build time with Satori + resvg-js
- **Pagefind** — client-side full-text search

---

## Local development

```bash
npm install
npm run dev          # Eleventy dev server with live reload
npm run build        # Production build → _site/
npm run build:css    # Rebuild Tailwind CSS only
```

Copy `.env` (or set the variables below) before building. The `.env` file is not committed.

---

## Environment variables

All site configuration is driven by env vars — no hardcoded values in source. Key ones:

| Variable | Description |
|---|---|
| `SITE_URL` | Full URL, no trailing slash (e.g. `https://blog.giersig.eu`) |
| `SITE_NAME` | Display name shown in header |
| `AUTHOR_NAME` | Used in h-card, OG images, feeds |
| `AUTHOR_BIO` | Short bio line |
| `AUTHOR_AVATAR` | Full URL to avatar image |
| `AUTHOR_EMAIL` | Contact email |
| `SITE_DESCRIPTION` | Meta description |
| `SITE_LOCALE` | BCP 47 locale (e.g. `de`) |
| `GITHUB_USERNAME` | Enables GitHub activity feed |
| `BLUESKY_HANDLE` | Enables Bluesky feed + webmention self-filter |
| `MASTODON_INSTANCE` / `MASTODON_USER` | Mastodon feed + rel=me |
| `ACTIVITYPUB_HANDLE` | ActivityPub actor name (Fedify) |
| `SITE_SOCIAL` | Pipe-and-comma encoded social links: `Name\|URL\|icon,...` |
| `WEBMENTION_IO_TOKEN` | webmention.io API token |
| `LASTFM_API_KEY` / `LASTFM_USERNAME` | Listening page |
| `SUPPORT_URL` etc. | Tip/support links in JSON Feed extension |
| `MARKDOWN_AGENTS_ENABLED` | Serve clean Markdown to AI agents (default `true`) |

---

## Content structure

```
content/              ← symlink → IndieKit-managed posts (gitignored)
  articles/
  notes/
  bookmarks/
  likes/
  replies/
  reposts/
  photos/
  pages/
```

Posts are created/updated via IndieKit's Micropub endpoint — not edited manually. The `content/` directory is gitignored but processed by Eleventy (`setUseGitIgnore(false)`).

---

## Custom systems (beyond upstream)

### Digital Garden
Posts can carry a `gardenStage` front-matter value (`seedling`, `budding`, `cultivating`, `evergreen`). Stages can also be derived from nested tags (`garden/cultivate`, etc.). The `garden-badge.njk` component renders a coloured pill in post lists and on individual posts. The `/garden/` page documents the stages.

### AI Disclosure
Posts declare their AI involvement level in front matter. The AI badge renders below the post content and (subtly) in list cards via `.p-ai-code-level`.

### Nested tags
Categories support Obsidian-style path notation (`lang/de`, `tech/programming`). The `nestedSlugify` function in `eleventy.config.js` preserves `/` separators during slug generation.

### Soft-delete filtering
Posts with `deleted: true` in frontmatter are excluded from all Eleventy collections. This supports ActivityPub soft-delete — the post disappears from the blog without the file being removed.

### Content warnings
Posts with `contentWarning` or `content_warning` in frontmatter get special handling:
- **Post page**: content is behind a collapsible `<details>` with an amber warning label
- **Listing pages**: content (and photos) replaced by a warning + "View post" link

### Upstream drift check
```bash
npm run check:upstream-widgets         # Report widget drift vs theme remote
npm run check:upstream-widgets:strict  # Exit 1 if any drift found
```

---

## Deploy

The site is hosted on Cloudron. Deployment is triggered by pushing to `main` — a GitHub Action builds the site and rsyncs `_site/` to the server. `content/.indiekit/` is excluded from rsync `--delete` to preserve IndieKit's internal state.

---

## Repository structure

```
_data/            JS data files (all env-var driven)
_includes/
  layouts/        Page layout templates
  components/     Reusable Nunjucks partials
content/          Symlink → IndieKit posts (gitignored)
css/              Tailwind source + compiled output
docs/plans/       Implementation plans
images/           Static assets
js/               Client-side scripts
lib/              Build-time utilities (OG, unfurl)
scripts/          Maintenance scripts
eleventy.config.js  Single monolithic Eleventy config
```

---

## Relationship to upstream

The theme remote is tracked as `theme` (`svemagie/blog-eleventy-indiekit`). This repo (`svemagie/blog`) is the live site and has diverged substantially — garden system, AI disclosure, nested tags, navigation redesign, Fedify ActivityPub, OG generation, and more. Upstream changes are selectively cherry-picked, not merged wholesale.
