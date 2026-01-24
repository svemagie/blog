# Indiekit Eleventy Theme

A modern, IndieWeb-native Eleventy theme designed for [Indiekit](https://getindiekit.com/)-powered personal websites. Own your content, syndicate everywhere.

## IndieWeb Features

This theme is built from the ground up for the IndieWeb:

### Microformats2 Support
- **h-card**: Complete author profile with photo, name, bio, location, social links
- **h-entry**: All post types properly marked up for parsing
- **h-feed**: Machine-readable feeds for readers and services
- **rel="me"**: Identity verification links for IndieAuth

### Post Types
Full support for IndieWeb post types via Indiekit:
- **Articles**: Long-form blog posts
- **Notes**: Short status updates (like tweets)
- **Photos**: Image posts with galleries
- **Bookmarks**: Save and share links
- **Likes**: Appreciate others' content
- **Replies**: Respond to posts across the web
- **Reposts**: Share others' content
- **RSVPs**: Respond to events

### Webmentions
- Receive and display webmentions via [webmention.io](https://webmention.io)
- Reply contexts for responses to external posts
- Grouped display: likes, reposts, and replies

### Syndication
Works with Indiekit's syndication plugins:
- Post to Bluesky and Mastodon from your site
- POSSE (Publish Own Site, Syndicate Elsewhere)

## Integration Plugins

This theme integrates with custom Indiekit endpoint plugins:

### [@rmdes/indiekit-endpoint-github](https://github.com/rmdes/indiekit-endpoint-github)
Display your GitHub activity:
- Recent commits across repositories
- Starred repositories
- Featured project showcase

**Configuration:**
```bash
GITHUB_USERNAME="your-username"
GITHUB_TOKEN="ghp_xxxx"
GITHUB_FEATURED_REPOS="user/repo1,user/repo2"
```

### [@rmdes/indiekit-endpoint-funkwhale](https://github.com/rmdes/indiekit-endpoint-funkwhale)
Share your listening activity from Funkwhale:
- Now playing / recently played
- Listening statistics
- Top artists and albums
- Favorite tracks

**Configuration:**
```bash
FUNKWHALE_INSTANCE="https://your-instance.com"
FUNKWHALE_USERNAME="your-username"
FUNKWHALE_TOKEN="your-api-token"
```

### [@rmdes/indiekit-endpoint-youtube](https://github.com/rmdes/indiekit-endpoint-youtube)
Display your YouTube channel(s):
- Channel info with subscriber counts
- Latest videos grid
- Live stream status (live/upcoming/offline)
- Multi-channel support

**Configuration:**
```bash
YOUTUBE_API_KEY="your-api-key"
YOUTUBE_CHANNELS="@channel1,@channel2"
```

## Social Feeds

The sidebar displays your social activity:

### Bluesky
```bash
BLUESKY_HANDLE="you.bsky.social"
```

### Mastodon
```bash
MASTODON_INSTANCE="https://mastodon.social"
MASTODON_USER="your-username"
```

## Installation

### As a Git Submodule (Recommended)

```bash
# In your Indiekit deployment repo
git submodule add https://github.com/rmdes/indiekit-eleventy-theme.git eleventy-site
git submodule update --init
```

### Standalone

```bash
git clone https://github.com/rmdes/indiekit-eleventy-theme.git
cd indiekit-eleventy-theme
npm install
```

## Configuration

All configuration is done via environment variables, making the theme fully portable.

### Required Variables

```bash
# Site basics
SITE_URL="https://your-site.com"
SITE_NAME="Your Site Name"
SITE_DESCRIPTION="A short description of your site"

# Author info (displayed in h-card)
AUTHOR_NAME="Your Name"
AUTHOR_BIO="A short bio about yourself"
AUTHOR_AVATAR="/images/avatar.jpg"
AUTHOR_TITLE="Your Title"           # Optional
AUTHOR_LOCATION="City, Country"     # Optional
AUTHOR_EMAIL="you@example.com"      # Optional
```

### Social Links

Format: `Name|URL|icon,Name|URL|icon`

```bash
SITE_SOCIAL="GitHub|https://github.com/you|github,Mastodon|https://mastodon.social/@you|mastodon,Bluesky|https://bsky.app/profile/you|bluesky"
```

### Full Configuration Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `SITE_URL` | Your site's full URL | `https://example.com` |
| `SITE_NAME` | Site title | `My IndieWeb Blog` |
| `SITE_DESCRIPTION` | Meta description | `An IndieWeb-powered blog` |
| `SITE_LOCALE` | Language code | `en` |
| `AUTHOR_NAME` | Your display name | `Blog Author` |
| `AUTHOR_BIO` | Short biography | - |
| `AUTHOR_AVATAR` | Path to avatar image | `/images/default-avatar.svg` |
| `AUTHOR_TITLE` | Job title or tagline | - |
| `AUTHOR_LOCATION` | Where you're based | - |
| `AUTHOR_EMAIL` | Contact email | - |
| `SITE_SOCIAL` | Social links (see format above) | - |
| `GITHUB_USERNAME` | GitHub username for activity | - |
| `GITHUB_TOKEN` | GitHub personal access token | - |
| `GITHUB_FEATURED_REPOS` | Comma-separated repos | - |
| `BLUESKY_HANDLE` | Bluesky handle | - |
| `MASTODON_INSTANCE` | Mastodon instance URL | - |
| `MASTODON_USER` | Mastodon username | - |
| `FUNKWHALE_INSTANCE` | Funkwhale instance URL | - |
| `FUNKWHALE_USERNAME` | Funkwhale username | - |
| `FUNKWHALE_TOKEN` | Funkwhale API token | - |
| `YOUTUBE_API_KEY` | YouTube Data API key | - |
| `YOUTUBE_CHANNELS` | Comma-separated channel handles | - |

## Directory Structure

```
├── _data/              # Data files (fetch from APIs, site config)
│   ├── site.js         # Site configuration from env vars
│   ├── blueskyFeed.js  # Bluesky posts fetcher
│   ├── mastodonFeed.js # Mastodon posts fetcher
│   ├── githubActivity.js
│   ├── funkwhaleActivity.js
│   └── youtubeChannel.js
├── _includes/
│   ├── layouts/        # Page layouts (base, home, post)
│   └── components/     # Reusable components (sidebar, h-card, etc.)
├── css/
│   └── tailwind.css    # Tailwind CSS source
├── images/             # Static images
├── *.njk               # Page templates
├── eleventy.config.js  # Eleventy configuration
└── package.json
```

## Customization

### Personal Overrides

When using as a submodule, place override files in your parent repo's `overrides/` directory:

```
your-repo/
├── overrides/
│   └── eleventy-site/
│       ├── _data/
│       │   └── cv.js       # Your CV data
│       └── images/
│           └── avatar.jpg  # Your photo
└── eleventy-site/          # This theme (submodule)
```

Override files are copied over the submodule during build.

### Styling

The theme uses Tailwind CSS. To customize:

1. Edit `tailwind.config.js` for colors, fonts, spacing
2. Edit `css/tailwind.css` for custom utilities
3. Run `npm run build:css` to regenerate

## Development

```bash
# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Build CSS only
npm run build:css
```

## Pages Included

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Recent posts with sidebar |
| About | `/about/` | Author h-card and bio |
| Blog | `/blog/` | All posts chronologically |
| Articles | `/articles/` | Long-form articles |
| Notes | `/notes/` | Short status updates |
| Photos | `/photos/` | Photo posts |
| Bookmarks | `/bookmarks/` | Saved links |
| Likes | `/likes/` | Liked posts |
| Replies | `/replies/` | Responses to others |
| Reposts | `/reposts/` | Shared content |
| Interactions | `/interactions/` | Combined social activity |
| GitHub | `/github/` | GitHub activity |
| Funkwhale | `/funkwhale/` | Listening history |
| YouTube | `/youtube/` | YouTube channel(s) |
| Categories | `/categories/` | Posts by category |
| RSS Feed | `/feed.xml` | RSS 2.0 feed |
| JSON Feed | `/feed.json` | JSON Feed 1.1 |

## License

MIT

## Credits

- Built for [Indiekit](https://getindiekit.com/) by Paul Robert Lloyd
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Part of the [IndieWeb](https://indieweb.org/) community
