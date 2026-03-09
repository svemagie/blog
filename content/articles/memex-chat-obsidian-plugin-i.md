---
date: 2026-03-09T14:38:59.721Z
title: "Memex Chat: Obsidian Plugin I built for myself"
summary: I've been using Obsidian for years as my primary thinking environment. At some point I got tired of switching between my notes and AI tools, copy-pasting context back and forth. So I built something that works the way I actually think.
category:
  - dev
  - AI
mpSyndicateTo:
  - https://blog.giersig.eu/
visibility: public
permalink: https://blog.giersig.eu/articles/memex-chat-obsidian-plugin-i/
ai:
  textLevel: "1"
  codeLevel: "3"
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
