---
date: 2026-03-15T00:00:00.000Z
title: Thinking in Public
summary: Thinking in Public is the practice of making your thinking process – not just finished conclusions – visible.
category:
  - on/phil
  - indie-web
gardenStage: plant
visibility: Public
permalink: https://blog.giersig.eu/articles/thinking-in-public/
ai:
  textLevel: "0"
  codeLevel: "0"
  # aiTools: "Claude, ChatGPT, Copilot"
  # aiDescription: "Optional disclosure about how AI was used"
---

## Core Concept

**Thinking in Public** is the practice of making your thinking process – not just finished conclusions – visible. It means:

*   Publish **seedling ideas**, not just polished essays
*   Show **uncertainty** and **open questions** explicitly
*   Make **iterations visible** (Garden Stages)
*   Allow **reader feedback** on incomplete thoughts
*   Treat your blog as an **extended mind**, not a portfolio

The opposite: perfectionism-driven publishing. “I only publish when it’s finished.” This is **risk-averse** and **isolating**.

* * *

## Why It Matters

### 1. Authenticity

Finished thoughts are often polished, sales-like, optimized. Unfinished thoughts are **real thoughts** – with questions, doubts, contradictions.

Readers can distinguish: “Okay, this is a well-considered opinion” vs. “This is an experiment, take a look.”

### 2. Faster Iteration Loop

If you have to wait until “finished”, the feedback latency is weeks or months. If you publish-while-thinking:

```
Day 1: Publish #garden/plant (seedling)
Day 3: Reader comment → new perspective
Day 5: Update to #garden/cultivate
Day 10: Publish #garden/revitalize (new insights)
Day 30: Promote to #garden/evergreen (stable, reference-worthy)
```

This is **resonance-driven**, not archive-driven.

### 3. Lower Barrier to Writing

> “A seedling thought shared is always better than a perfect thought kept private.”

Every additional requirement (“It must be finished”) is a **reason not to publish**. Thinking in Public removes this barrier.

### 4. Building in Public

Not just ideas, but **processes**: How I built the plugin, what problems I solved, which are still open.

Readers don’t just see “the result”, but also “how people actually develop.”

* * *

## The Garden Metaphor

Implemented with [Digital Garden](app://obsidian.md/Digital%20Garden)  stages:

```
🌱 #garden/plant      → Brand new thought, just emerged
🌿 #garden/cultivate  → Active thinking, developing
❓ #garden/question   → Unresolved, asking for input
⚙️  #garden/repot     → Restructuring, reframing
🔄 #garden/revitalize → Old idea, new life
🌲 #garden/evergreen  → Mature, stable, foundational (reference material)
```

This makes **development stage visible** without saying “this is bad” or “this is good”.

An old idea can become relevant again. A seedling can lie dormant for years. A cultivated thought can mature into **evergreen reference material**. That’s **okay and transparent**.

* * *

## Understanding the Stages

### 🌱 Plant

A brand new thought, barely formed. Hypothesis-stage. “I’m wondering about…”

**Characteristics**:

*   Low barrier to publish
*   Likely to change significantly
*   Invites early feedback and discussion
*   Short half-life

### 🌿 Cultivate

Active development. You’re thinking through it, refining, testing against reality.

**Characteristics**:

*   Regular updates
*   Growing clarity but still evolving
*   Reader input shapes direction
*   “Works in progress” feeling

### ❓ Question

Deliberately unresolved. You’re asking for help, missing pieces, or exploring contradictions.

**Characteristics**:

*   Explicitly unfinished
*   Invites expertise
*   May stay this way indefinitely (that’s okay)
*   High reader engagement potential

### ⚙️ Repot

Restructuring. The idea was good but needs new framing, different context, or fundamental reorganization.

**Characteristics**:

*   Shows evolution of thinking
*   Breaks old patterns
*   Vulnerable moment (might fail)
*   Growth through friction

### 🔄 Revitalize

Returning to an old idea with fresh perspective. New relevance, new connections, new maturity.

**Characteristics**:

*   Acknowledges time passing
*   Shows how thinking evolved
*   Often triggered by external event
*   Second (or third) life for an idea

### 🌲 Evergreen

Mature, stable, foundational. Reference material. This thought has been tested, refined, and stands on its own merit.

**Characteristics**:

*   Unlikely to change fundamentally
*   Serves as reference/foundation for other ideas
*   High evergreen value (useful months or years later)
*   Can still be updated, but updates are minor refinements
*   Often becomes a “hub” for related posts
*   Attracts consistent traffic and citations

**When to promote to Evergreen**:

*   Thought has been through plant → cultivate → revitalize cycle
*   Stability: hasn’t needed major updates in 3+ months
*   Utility: others reference it, it appears in multiple contexts
*   Maturity: feels foundational, not provisional
*   Clarity: explanations are clear enough for newcomers

* * *

## How It Changes Reader Relationship

**Traditional Blog**: “Author publishes finished thought. Reader reads. Maybe comments. Static.”

**Thinking in Public**: “Author works in public. Reader watches process. Reader contributes. Post evolves. Reader sees their input mattered. Some thoughts become trusted reference material.”

This isn’t just technically different. It’s **culturally** different:

*   Less “author as authority”
*   More “author + reader as collaborative thinking”
*   Posts are **conversations**, not broadcasts
*   Some conversations crystallize into **reference material**

* * *

## Practical Mechanics

### In Obsidian + obsidian-micropub

```yaml
---
title: Some Half-Formed Idea
tag: garden/cultivate
excerpt: "I'm exploring..."
---

## Initial Thoughts
[...]

## Questions
- What about X?
- Does this connect to Y?
- Still unclear: Z
```

**Publish** → Blog shows with 🌱 badge. RSS reader sees `garden-stage: plant`.

Later:

```yaml
tag: garden/cultivate
```

**Update** → Post evolves. History visible.

Eventually:

```yaml
tag: garden/evergreen
excerpt: "A foundational exploration of..."
```

**Promotion** → Visual indicator changes, post moves to reference section.

### In the Blog Template

*   Post shows **clear stage indicator**
*   Maybe: “Last updated X days ago”
*   Maybe: “Open questions” section highlighted
*   Evergreen posts: Prominent placement, “Related posts” section
*   Maybe: Toggle to show **edit history**
*   Maybe: “Promoted to evergreen on [date]”

### Filtering & Discovery

Readers might want:

```
/blog/all            → All stages mixed
/blog/seeds          → Only plants (emerging ideas)
/blog/cultivating    → Active thinking
/blog/evergreen      → Reference material only
/blog/timeless       → Evergreen + question posts (always relevant)
```

* * *

## Tensions & Trade-offs

### “Won’t this make me look less authoritative?”

**Short answer: No.** The opposite:

*   Transparency builds trust
*   Showing uncertainty is **more credible** than false certainty
*   Readers respect “I’m thinking through this” more than “Here’s the truth”
*   Having **evergreen material** shows maturity and reliability

**Long answer**: Authority doesn’t come from “I never change my mind”. It comes from “I think carefully and adjust when I learn something. And some of my thinking stands the test of time.”

### “What if someone quotes my half-formed idea out of context?”

**Risk**: Yes. **Mitigation**:

*   Clear garden stage badges
*   License/note: “This is work-in-progress thinking”
*   If it matters, you update the post and readers see the change
*   **Evergreen posts have explicit “stable” indicator** – these are safe to quote

**Real mitigation**: The garden stage IS the context.

### “Doesn’t this create noise?”

Fair question. If you publish **everything**, yes.

But you filter by stage. A reader interested in “reference material” sees only evergreens. A reader interested in “emerging ideas” sees only plants.

**It’s signal, not noise – because it’s labeled.**

### “When should I promote to evergreen?”

Don’t rush. A thought becomes evergreen through:

*   **Time passing** (stability test)
*   **Repeated usefulness** (does it serve you and others?)
*   **Standing up to challenge** (did criticism refine it or break it?)
*   **Foundational role** (does it anchor other ideas?)

Some thoughts never become evergreen. That’s okay. Not all thinking needs to be permanent.

* * *

## Historical Context

*   **My Blog** (2000s): “Publish when finished”
*   **Twitter** (2010s): “Publish everything instantly”
*   **Thinking in Public** (2020s): “Publish with context about development stage”
*   **Thinking in Public + Evergreen** (2025+): “…and let the best thinking crystallize”

It’s a **synthesis**:

*   Blogger rigor (think before publish)
*   Twitter immediacy (don’t wait for perfect)
*   Garden transparency (show the state)
*   **Librarian wisdom** (some things deserve to last)

* * *

## Examples in the Wild

*   [For the Love of Obsidian and IndieWeb](app://obsidian.md/For%20the%20Love%20of%20Obsidian%20and%20IndieWeb) was published as `#garden/cultivate` at first, then updated to `#garden/evergreen`
*   Some posts on IndieKit might be `#garden/evergreen` – foundational documentation
*   Explorations of **Digital Garden** metaphor are themselves thinking-in-public
*   IndieKit debugging posts are likely `#garden/question` – “Here’s what I’m stuck on”

* * *

## Connection to Other Concepts

### [MYOG](app://obsidian.md/MYOG)

Thinking in Public requires **infrastructure you control**. Can’t do this on Medium or Twitter (no garden stages, no update control). Need your own site. Yes, you could use elaborate tagging system on Mastodon like some do, but thats too confusing imho.

### [Resonance-Driven Publishing](app://obsidian.md/Resonance-Driven%20Publishing)

Thinking in Public **creates resonance**. Public thinking invites response. Response informs next iteration. Best thinking crystallizes into evergreen material. Loop.

### [For the Love of Obsidian and IndieWeb](app://obsidian.md/For%20the%20Love%20of%20Obsidian%20and%20IndieWeb)

The plugin removes friction that would prevent thinking-in-public. If publishing took 10 steps, you’d only publish “finished” work. Frictionless → more plants, more gardens, more evergreens over time.

* * *

## Open Questions

*   How does the garden metaphor scale? (100 posts? 1000?)
*   Should there be **automatic archiving** (old plants → delete or revitalize)?
*   Can readers filter by garden stage in RSS?
*   Does thinking-in-public work for **all topics**? (Personal, technical, political?)
*   How do you handle **“I was wrong” posts**? Demote evergreen?
*   What’s the incentive structure for **keeping old plants alive**?
*   **NEW**: How do you celebrate promotion to evergreen? Special notification?
*   **NEW**: Should evergreen posts have a section that shows the journey (plant → cultivate → evergreen)? Would it be a “related” section?

* * *

## Status

**[#garden/cultivate](app://obsidian.md/index.html#garden/cultivate)** – Actively exploring the evergreen concept. The stage ladder is becoming clearer through practice.

* * *

## Next Steps

*   [x] Implement garden stage filtering in 11ty templates ✅ 2026-03-15
*   [x] Add evergreen filtering and discovery ✅ 2026-03-15
*   [ ] Add garden view to RSS feed (with stage indicators)
*   [ ] Document which posts are actively cultivated vs. dormant vs. evergreen
*   [ ] Public “Thinking in Progress” dashboard (with evergreen section)
*   [ ] Consider “promotion ceremony” for posts moving to evergreen
*   [ ] Revisit: Does the plant/cultivate/question/repot/revitalize/evergreen vocabulary fit?
*   [ ] Track post lifecycle: when was it planted? When promoted to evergreen?
