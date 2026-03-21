---
date: 2026-03-14T17:17:00.000Z
title: For the Love of Obsidian and IndieWeb
summary: "I spent a few hours building a bridge between my favourite writing tool and my self-hosted corner of the web. Here is what came out of it: an Obsidian Micropub plugin with IndieAuth, and a Digital Garden living alongside my blog."
category:
  - on/memex
  - smallweb/dev
  - indieweb
  - dev
visibility: Public
ai:
  - - 'textLevel: "0"'
    - 'codeLevel: "0"'
webmentionResults:
  sent: 2
  failed: 0
  skipped: 5
  details:
    sent:
      - target: https://www.w3.org/TR/micropub/
        endpoint: https://webmention.io/w3c/webmention
        type: webmention
        status: 201
      - target: https://maggieappleton.com/garden-history
        endpoint: https://webmention.io/maggieappleton.com/webmention
        type: webmention
        status: 201
    failed: []
    skipped:
      - target: https://getindiekit.com/
        reason: No webmention endpoint found
      - target: https://obsidian.md/
        reason: No webmention endpoint found
      - target: https://github.com/otaviocc/obsidian-microblog
        reason: No webmention endpoint found
      - target: https://github.com/svemagie/obsidian-micropub
        reason: No webmention endpoint found
      - target: https://indieauth.net/
        reason: No webmention endpoint found
  timestamp: 2026-03-14T17:24:52.339Z
webmentionSent: true
updated: 2026-03-21T13:19:54.058Z
syndication:
  - https://bsky.app/profile/did:plc:g4utqyolpyb5zpwwodmm3hht/post/3mh22kjy5d227
  - https://blog.giersig.eu/articles/for-the-love-of-obsidian/
gardenStage: evergreen
aiCodeLevel: "2"
aiDescription: Claude built the Obsidian Plugin
aiTextLevel: "1"
aiTools: Claude
mpUrl: https://blog.giersig.eu/articles/for-the-love-of-obsidian/
permalink: /articles/for-the-love-of-obsidian/
---

There is a version of the web that most people never see. No algorithms, no growth hacking, no engagement metrics. Just people writing on their own domains, linking to each other, publishing in open formats that anyone can read. It has a name **the IndieWeb** and once you find it, it is very hard to go back to anything else.

I have been running my own site for a while. Powered by [Indiekit](https://getindiekit.com/), it receives posts via the [Micropub](https://www.w3.org/TR/micropub/) protocol, stores them as Markdown files, and publishes them through Eleventy. I can write from any Micropub-capable client, publish to my own domain first, and syndicate out to Bluesky or Mastodon afterwards. POSSE “Publish on your Own Site, Syndicate Elsewhere” as the IndieWeb calls it.

The missing piece was my beloved [Obsidian](https://obsidian.md/).

## Where I Actually Write

Obsidian is where my thinking lives. Notes, drafts, research, half-formed ideas, links I want to remember, an archive of articles, podcasts, movies I enjoyed - all of it ends up in a local vault of Markdown files. I have been using it long enough that it has become genuinely hard to think outside of it. The graph view, the backlinks, the way you can just follow a thread of thought without worrying about structure fits the way my brain works.

The problem is that publishing from Obsidian to an IndieWeb blog involves too many steps. Copy text, paste it somewhere, add frontmatter, upload images, submit. Every extra step is a reason not to publish. Friction kills to flow of writing.

There is an [existing plugin called obsidian-microblog](https://github.com/otaviocc/obsidian-microblog) that publishes to Micro.blog specifically. But Micro.blog, while lovely, is not my stack. I wanted something that would talk to any Micropub endpoint - including my own Indiekit instance, of course.

## Building the Plugin

The plugin lives at [github.com/svemagie/obsidian-micropub](https://github.com/svemagie/obsidian-micropub). It is written in TypeScript, uses the Obsidian plugin API, and implements the full Micropub spec for creating and updating posts. The Plugin is fully Co-Authored by Claude, I just assisted.

The core of it is straightforward: read a note’s frontmatter, map the properties to Micropub’s vocabulary, POST them to your endpoint. The interesting parts were the edges.

**Image handling.** When a note contains local images — `![[photo.jpg]]` syntax — the plugin finds them, uploads them to your media endpoint first, replaces the local references with the returned URLs, and only then sends the post. You never have to think about it.

**Post types.** Micropub supports a whole vocabulary of post types beyond just articles. A bookmark has `bookmark-of`. A like has `like-of`. A reply has `in-reply-to`. The plugin reads these from frontmatter in either camelCase (`bookmarkOf`) or hyphenated (`bookmark-of`) and builds the right Micropub payload for each type. The entire range of IndieWeb post types is covered: articles, notes, photos, bookmarks, likes, replies, reposts.

**Updates.** Once a post is published, the plugin writes the resulting URL back into the note’s frontmatter as `mp-url`. Publish the same note again and it sends an update request instead of creating a duplicate. The note stays the canonical source of truth.

## The Authentication Problem

This was the hard part.

Logging into an IndieWeb site uses [IndieAuth](https://indieauth.net/), an OAuth 2.0 profile built on top of your own domain. The flow looks like this: you enter your site URL, the client discovers your authorization endpoint, opens a browser window, you log in with your blog password, and get redirected back with an access token. The same flow iA Writer uses when you connect it to a Micropub endpoint.

Implementing this in a desktop app (Obsidian runs on Electron) runs into a fundamental problem: OAuth requires a redirect URI — a URL the auth server will send the code back to. On the web, that is easy. In a desktop app, you need somewhere for the browser to redirect *back to*.

The naive approach is to spin up a local HTTP server on a random port (`http://127.0.0.1:PORT/callback`). But it fails immediately when the auth server is remote: Indiekit fetches your `client_id` URL server-side to get app metadata, and `127.0.0.1` is not reachable from the cloud. The auth server returns an error before the user even sees the login screen.

The solution was a GitHub Pages relay. The plugin’s `client_id` is `https://svemagie.github.io/obsidian-micropub/` - a real, publicly accessible URL that Indiekit can fetch to get the app name and icon. The `redirect_uri` is `https://svemagie.github.io/obsidian-micropub/callback` - same host, which satisfies Indiekit’s validation. The callback page is a few lines of JavaScript that reads `?code=…&state=…` from the URL and immediately forwards to `obsidian://micropub-auth?code=…&state=…`.

Obsidian handles custom URI schemes natively. The plugin registers `obsidian://micropub-auth` as a protocol handler, receives the code, exchanges it for a token via PKCE, and the sign-in is complete. The whole flow takes about ten seconds and feels exactly like signing in to iA Writer.

## A Digital Garden in the Blog

While working on the plugin, it made sense to also add something I had been wanting for a while: a [Digital Garden](https://maggieappleton.com/garden-history).

A garden is a different metaphor from a blog. A blog is like a stream: posts flow past in reverse chronological order, finished and sealed. A garden is a space you tend over time. Notes are planted, cultivated, questioned, repotted when they need restructuring. The emphasis shifts from *when* something was written to *how developed* the thinking is.

I use Obsidian tags for this: `#garden/plant`, `#garden/cultivate`, `#garden/question`, `#garden/repot`, `#garden/revitalize`, `#garden/revisit`. The plugin maps these to a `garden-stage` Micropub property, and the blog renders them as colourful badges: a small seedling icon for a newly planted thought, a question mark for something still open, a refresh icon for something that needs revisiting.

There is a dedicated `/garden/` page that groups posts by stage, so you can see what is actively growing, what is dormant, and what is being actively restructured. It fits well alongside the chronological blog - the same posts, but viewed through a different perspective.

The two things together - publishing directly from Obsidian with a single command, and being able to mark a post as a living document rather than a finished one - change how I think about writing publicly. The bar is lower, which is good. A seedling thought shared is always better than a perfect thought kept private.

## What It Feels Like

I am writing this post in Obsidian. It is the first post using this Ecosystem :-)

The frontmatter at the top has a `gardenStage: cultivate` field, because this is an idea I am actively working through rather than a finished piece. When I run the publish command, it will go to my Indiekit instance, get saved as Markdown, and appear on the blog. If I add something later, I run the command again and it updates the existing post.

This is what the IndieWeb promises: you own the tools, the data, and the publishing pipeline. You are not dependent on any platform’s continued existence or willingness to keep hosting your old posts. The words live on your server, in your format, under your control.

It took a few hours of work, fighting OAuth edge cases, debugging IndieKit’s endpoint discovery, figuring out Eleventy’s Tailwind JIT pipeline for the garden badges. The usual stuff. But on the other side of it is a workflow that genuinely gets out of the way and lets me think and write.

That is worth a lot.

* * *

The plugin is open source: [github.com/svemagie/obsidian-micropub](https://github.com/svemagie/obsidian-micropub). It works with any Micropub endpoint, not just Indiekit. If you run your own IndieWeb site and use Obsidian, I would be happy to hear whether it works for you. If you want to develop it, too!
