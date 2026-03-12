---
date: 2026-03-09T11:04:48.857Z
title: "Memex Chat: Obsidian Plugin I built for myself"
deleted: 2026-03-09T12:20:17.422Z
summary: I've been using Obsidian for years as my primary thinking environment. At some point I got tired of switching between my notes and AI tools, copy-pasting context back and forth. So I built something that works the way I actually think.
category:
  - dev
  - AI
visibility: public
updated: 2026-03-12T08:07:26.932Z
syndication:
  - https://blog.giersig.eu/articles/memex-chat-obsidian-plugin/
webmentionResults:
  sent: 1
  failed: 0
  skipped: 14
  details:
    sent:
      - target: https://indieweb.org/User:Blog.giersig.eu
        endpoint: https://webmention.io/indiewebcamp/webmention
        type: webmention
        status: 201
    failed: []
    skipped:
      - target: https://github.com/svemagie/memex-chat
        reason: No webmention endpoint found
      - target: https://keys.openpgp.org/vks/v1/by-fingerprint/38180708ACB8A61A1C53D170B9867870D8871475
        reason: No webmention endpoint found
      - target: https://troet.cafe/@svemagie
        reason: No webmention endpoint found
      - target: https://bsky.app/profile/svemagie.bsky.social
        reason: No webmention endpoint found
      - target: https://github.com/svemagie
        reason: No webmention endpoint found
      - target: https://bsky.app/intent/compose?text=Memex%20Chat%3A%20Obsidian%20Plugin%20I%20built%20for%20myself%20https%3A%2F%2Fblog.giersig.eu%2Farticles%2Fmemex-chat-obsidian-plugin%2F
        reason: No webmention endpoint found
      - target: https://share.joinmastodon.org/#text=Memex%20Chat%3A%20Obsidian%20Plugin%20I%20built%20for%20myself%20https%3A%2F%2Fblog.giersig.eu%2Farticles%2Fmemex-chat-obsidian-plugin%2F
        reason: No webmention endpoint found
      - target: https://open.audio/federation/music/tracks/2f21d772-cd85-4fa3-bb21-9204b5925460
        reason: No webmention endpoint found
      - target: https://open.audio/federation/music/tracks/4cb8a8e2-b477-4256-94e5-cb8f861e1e9f
        reason: No webmention endpoint found
      - target: https://www.last.fm/music/Son+Of+Robot/_/The+Turn
        reason: No webmention endpoint found
      - target: https://www.last.fm/music/Chris+Zabriskie/_/There%27s+a+Special+Place+for+Some+People
        reason: No webmention endpoint found
      - target: https://troet.cafe/svemagie
        reason: No webmention endpoint found
      - target: https://getindiekit.com/
        reason: No webmention endpoint found
      - target: https://11ty.dev/
        reason: No webmention endpoint found
  timestamp: 2026-03-12T08:00:17.293Z
webmentionSent: true
mpSyndicateTo:
  - https://blog.giersig.eu/
permalink: https://blog.giersig.eu/articles/memex-chat-obsidian-plugin/
ai:
  textLevel: "1"
  codeLevel: "1"
  aiTools: "Claude, Copilot"
  # aiDescription: "Optional disclosure about how AI was used"
---

Memex Chat is an Obsidian plugin that lets you chat with your vault using Claude AI with proper context retrieval, not just keyword search.

What it does:

- Semantic vault search — a TF-IDF index over all your notes, no external API needed for retrieval
- Local embeddings — optional on-device semantic search using BGE Micro v2, fully offline after one model download (~22 MB)
- Auto context — relevant notes are automatically found and attached to your query before it even reaches Claude
- @ mentions — reference specific notes directly in your message with autocomplete
- Context preview — see and edit which notes are included before sending
- Related notes sidebar — always-on panel showing the most similar notes to whatever you have open, ranked by semantic similarity, frontmatter links, and shared tags
- Thread history — chats saved as Markdown in your vault, so nothing disappears
- Source links — every answer shows which notes were used as context
- Prompt buttons — configurable header buttons that extend Claude's system prompt (e.g. draft check, monthly review)

Installation is manual for now — download main.js, manifest.json, and styles.css from the latest release, drop them into .obsidian/plugins/memex-chat/, enable in Community Plugins, and add your Anthropic API key.

→ https://github.com/svemagie/memex-chat
