# CLAUDE.md

This file provides guidance to Claude Code when working with the Indiekit Eleventy theme.

## Project Overview

This is an Eleventy theme designed for use with Indiekit, supporting IndieWeb post types (notes, articles, bookmarks, likes, replies, reposts, photos). It's used as a **Git submodule** in the `indiekit-cloudron` deployment repository.

**Live Site:** https://rmendes.net
**Parent Repo:** `/home/rick/code/indiekit-dev/indiekit-cloudron` (Cloudron deployment)

## Submodule Relationship

```
indiekit-dev/                             # Workspace root
└── indiekit-cloudron/                    # Cloudron deployment repo
    └── eleventy-site/                    # THIS REPO as submodule
        ├── _includes/
        ├── _data/
        ├── content -> /app/data/content  # Symlink at runtime
        └── ...
```

## CRITICAL: Submodule Sync Workflow

**After ANY changes to this repo, you MUST also update the parent repo's submodule reference.**

### Step-by-Step Process

1. **Make changes in this repo** (indiekit-eleventy-theme)
2. **Commit and push** this repo
3. **Update the submodule** in indiekit-cloudron:

```bash
# After pushing changes to this theme repo:
cd /home/rick/code/indiekit-dev/indiekit-cloudron
git submodule update --remote eleventy-site
git add eleventy-site
git commit -m "chore: update eleventy-site submodule"
git push origin main
```

4. **Redeploy Cloudron** to apply changes:

```bash
cloudron build --no-cache
cloudron update --app rmendes.net
```

### Automated Reminder

If you forget to update the submodule, the changes will NOT appear on the live site. Always complete both steps.

## Commands

```bash
# Install dependencies (for local development)
npm install

# Build site locally
npm run build

# Development server with hot reload
npm run dev
```

## Architecture

### Post Types & Collections

| Collection | Path | Description |
|------------|------|-------------|
| posts | `content/**/*.md` | All content combined |
| notes | `content/notes/**/*.md` | Short posts |
| articles | `content/articles/**/*.md` | Long-form articles |
| bookmarks | `content/bookmarks/**/*.md` | Saved links |
| photos | `content/photos/**/*.md` | Photo posts |
| likes | `content/likes/**/*.md` | Liked content |
| replies | `content/replies/**/*.md` | Reply posts |
| reposts | `content/reposts/**/*.md` | Reposted content |

### IndieWeb Property Names

**IMPORTANT:** The Indiekit Eleventy preset uses `camelcaseKeys` to convert Microformat properties:

| Microformat | Indiekit Frontmatter | Template Variable |
|-------------|---------------------|-------------------|
| `bookmark-of` | `bookmarkOf` | `bookmarkOf` or `bookmark_of` |
| `like-of` | `likeOf` | `likeOf` or `like_of` |
| `in-reply-to` | `inReplyTo` | `inReplyTo` or `in_reply_to` |
| `repost-of` | `repostOf` | `repostOf` or `repost_of` |

All templates support BOTH camelCase (from Indiekit) and underscore names (legacy) for backwards compatibility:

```nunjucks
{% set bookmarkedUrl = bookmarkOf or bookmark_of %}
{% if bookmarkedUrl %}
  <a href="{{ bookmarkedUrl }}">{{ bookmarkedUrl }}</a>
{% endif %}
```

### Key Templates

| File | Purpose |
|------|---------|
| `_includes/layouts/post.njk` | Individual post layout, Bridgy syndication |
| `_includes/components/reply-context.njk` | Displays bookmark/like/reply/repost context |
| `bookmarks.njk` | Bookmarks collection page |
| `likes.njk` | Likes collection page |
| `replies.njk` | Replies collection page |
| `reposts.njk` | Reposts collection page |

### Bridgy Syndication

The `post.njk` layout includes syndication content for Bridgy (Bluesky/Mastodon):

```nunjucks
{# Interaction posts include target URL in syndication #}
<p class="p-summary e-bridgy-mastodon-content e-bridgy-bluesky-content hidden">
  🔖 {{ bookmarkedUrl }} - {{ description }}
</p>
```

## Code Style

- ESM modules (`"type": "module"` in package.json)
- Nunjucks templates (`.njk`)
- Tailwind CSS for styling
- `markdownTemplateEngine: false` to prevent parsing `{{` in content

## Common Tasks

### Adding a New Post Type

1. Create collection in `eleventy.config.js`
2. Create collection page (e.g., `newtype.njk`)
3. Update `reply-context.njk` if it has a target URL property
4. Update `post.njk` Bridgy content if needed
5. **Commit, push, and update submodule in indiekit-cloudron**

### Fixing Template Issues

1. Check property names match Indiekit output (camelCase)
2. Support both camelCase and underscore for compatibility
3. Test locally with `npm run dev`
4. **Commit, push, and update submodule in indiekit-cloudron**

## Workspace Context

This repo is part of the Indiekit development workspace at `/home/rick/code/indiekit-dev/`. See the workspace CLAUDE.md for the full repository map.

## Related Repositories (all under `/home/rick/code/indiekit-dev/`)

- **indiekit-cloudron/** - Cloudron deployment, contains this as submodule at `eleventy-site/`
- **indiekit/** - Upstream Indiekit fork (Lerna monorepo)

## Anti-Patterns

1. ❌ Forgetting to update submodule in indiekit-cloudron after changes
2. ❌ Using only underscore property names (Indiekit uses camelCase)
3. ❌ Using `markdownTemplateEngine: "njk"` (breaks code samples)
4. ❌ CommonJS syntax in ESM project
5. ❌ Hardcoding URLs instead of using site data
