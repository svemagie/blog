---
date: 2026-03-13T05:39:50.229Z
title: "Memex Chat: Obsidian Plugin I built for myself"
summary: Memex Chat is an Obsidian plugin that lets you chat with your vault using Claude AI with proper context retrieval, not just keyword search.
category:
  - on/dev
  - on/memex
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
      - target: https://bsky.app/intent/compose?text=Memex%20Chat%3A%20Obsidian%20Plugin%20I%20built%20for%20myself%20https%3A%2F%2Fblog.giersig.eu%2Farticles%2Fmemex-chat-obsidian-plugin-i%2F
        reason: No webmention endpoint found
      - target: https://share.joinmastodon.org/#text=Memex%20Chat%3A%20Obsidian%20Plugin%20I%20built%20for%20myself%20https%3A%2F%2Fblog.giersig.eu%2Farticles%2Fmemex-chat-obsidian-plugin-i%2F
        reason: No webmention endpoint found
      - target: https://www.last.fm/music/Saive/_/Home+(Mixed)
        reason: No webmention endpoint found
      - target: https://open.audio/federation/music/tracks/3367dbca-9144-461c-929d-6aa22d42819a
        reason: No webmention endpoint found
      - target: https://open.audio/federation/music/tracks/bc9db695-6e05-48e1-864e-1089f92a3da4
        reason: No webmention endpoint found
      - target: https://www.last.fm/music/Henry+Green/_/Outside+(Parra+for+Cuva+Remix)+%5BMixed%5D
        reason: No webmention endpoint found
      - target: https://troet.cafe/svemagie
        reason: No webmention endpoint found
      - target: https://getindiekit.com/
        reason: No webmention endpoint found
      - target: https://11ty.dev/
        reason: No webmention endpoint found
  timestamp: 2026-03-13T05:46:23.558Z
webmentionSent: true
syndication:
  - https://blog.giersig.eu/articles/memex-chat-obsidian-plugin-i/
updated: 2026-03-15T09:05:06.342Z
permalink: https://blog.giersig.eu/articles/memex-chat-obsidian-plugin-i/
ai:
  textLevel: "1"
  codeLevel: "2"
  aiTools: "Claude, Copilot"
  # aiDescription: "Optional disclosure about how AI was used"
---

What it does:

- Semantic vault search - a TF-IDF index over all your notes, no external API needed for retrieval
- Local embeddings — optional on-device semantic search using BGE Micro v2, fully offline after one model download (~22 MB)
- Auto context — relevant notes are automatically found and attached to your query before it even reaches Claude
- @ mentions — reference specific notes directly in your message with autocomplete
- Context preview — see and edit which notes are included before sending
- Related notes sidebar — always-on panel showing the most similar notes to whatever you have open, ranked by semantic similarity, frontmatter links, and shared tags
- Thread history — chats saved as Markdown in your vault, so nothing disappears
- Source links — every answer shows which notes were used as context
- Prompt buttons — configurable header buttons that extend Claude’s system prompt (e.g. draft check, monthly review)
- Installation is manual for now — download main.js, manifest.json, and styles.css from the latest release, drop them into .obsidian/plugins/memex-chat/, enable in Community Plugins, and add your Anthropic API key.

→ https://github.com/svemagie/obsidian-memex-chat
