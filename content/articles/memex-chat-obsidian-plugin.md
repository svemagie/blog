---
date: 2026-03-09T11:04:48.857Z
title: "Memex Chat: Obsidian Plugin I built for myself"
deleted: 2026-03-13T05:59:16.621Z
summary: Memex Chat is an Obsidian plugin that lets you chat with your vault using Claude AI with proper context retrieval, not just keyword search.
category:
  - dev
  - on/memex
mpSyndicateTo:
  - https://blog.giersig.eu/
visibility: public
updated: 2026-03-20T12:57:43.955Z
mpUrl: https://blog.giersig.eu/articles/memex-chat-obsidian-plugin/
permalink: /articles/memex-chat-obsidian-plugin/
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
