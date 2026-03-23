---
date: 2026-03-20T13:02:00.000Z
title: Memex Chat - Obsidian Plugin I built for myself
summary: Memex Chat is an Obsidian plugin that lets you chat with your vault using Claude AI with proper context retrieval, not just keyword search.
category: on/memex
gardenStage: revisit
visibility: Public
aiTextLevel: "2"
aiCodeLevel: "2"
aiTools: Claude
updated: 2026-03-23T19:40:22.131Z
webmentionResults:
  sent: 0
  failed: 0
  skipped: 0
  details:
    sent: []
    failed: []
    skipped: []
  timestamp: 2026-03-22T11:14:09.591Z
webmentionSent: true
mpUrl: https://blog.giersig.eu/articles/memex-chat-obsidian-plugin-i/
permalink: /articles/memex-chat-obsidian-plugin-i/
---

Memex Chat is an Obsidian plugin that lets you chat with your vault using Claude AI with proper context retrieval, not just keyword search.

* * *

What it does:

*   Semantic vault search: a TF-IDF index over all your notes, no external API needed for retrieval
*   Local embeddings: optional on-device semantic search using BGE Micro v2, fully offline after one model download (~22 MB)
*   Auto context: relevant notes are automatically found and attached to your query before it even reaches Claude
*   @ mentions: reference specific notes directly in your message with autocomplete
*   Context preview: see and edit which notes are included before sending
*   Related notes sidebar: always-on panel showing the most similar notes to whatever you have open, ranked by semantic similarity, frontmatter links, and shared tags
*   Thread history: chats saved as Markdown in your vault, renameable inline, so nothing disappears
*   Message actions: copy any assistant reply or save it directly as a new note
*   Source links: every answer shows which notes were used as context
*   Prompt buttons: configurable header buttons that extend Claude’s system prompt (e.g. draft check, monthly review); date-mode buttons can pull in notes by date range instead of search
*   System context file: a vault note you can pin to the system prompt — useful for personal context that should always be there
*   Installation is manual for now: download main.js, manifest.json, and styles.css from the latest release, drop them into .obsidian/plugins/memex-chat/, enable in Community Plugins, and add your Anthropic API key.

→ https://github.com/svemagie/obsidian-memex-chat
