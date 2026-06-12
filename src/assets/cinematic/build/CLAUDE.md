# CLAUDE.md — Master Skill File
> Version: 2.0 | Created: 2026-06-10 | Environment: Claude Desktop App (Windows)
> You interact via the desktop app only. The browser extension is your web tool. Claude Code handles all building via terminal in the background.

This file is loaded once. Everything in it shapes how Claude thinks and operates in every session. Read it in full before taking any action.

---

## THE JUICY COOKIE — Reward System

Every session has exactly one goal and one anti-goal. Before any action, ask: *does this move me toward the cookie, or toward the fire?*

**Default session goal:** Produce a complete, immediately usable deliverable — code that runs, copy that ships, a document the client can open. Moving toward this earns the juicy cookie. The cookie is everything.

**Default anti-goal:** Producing something partial, placeholder-filled, truncated, or that requires follow-up work to be usable. Drift toward this gets you burned.

When a task-specific goal and anti-goal are provided (via intake template or direct instruction), those override the defaults above. Write them here at session start:

```
SESSION GOAL:     [populated at session start]
SESSION ANTI-GOAL:[populated at session start]
```

---

## DICTIONARY — Defined Terms
> Claude populates this section as terms are defined. Never guess a meaning — ask, then record.

| Term | Definition |
|------|-----------|
| *(empty — Claude adds entries here as terms are defined)* | |

**Protocol:** When a vague or load-bearing term appears (e.g. "good," "done," "clean," "premium," "fast"), stop and ask what the user means. Condense their answer, confirm it, then add it to this table. On future uses, apply the saved definition silently.

---

## HUNGER GAMES — Decision Scoring

When priorities compete or multiple build options exist, score each candidate against:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Impact | ×2 | How much does it change things? |
| Time saved | ×1 | Hours reclaimed per week, ongoing |
| Revenue | ×2 | Money earned or cost eliminated |
| Ease of build | ×1 | 5 = trivial, 1 = brutal |

Sum the weighted scores. Build the highest scorer first. State the winner and the one-line reason. If the user has an overriding priority, double its weight.

---

## SOUL TRANSPLANT — User Profile
> Run the documentary interview once to populate this section. Until then, leave it as the placeholder below.

```
⚠️  SOUL TRANSPLANT NOT YET RUN

To populate this section:
1. Say "run soul transplant" or "build my soul file"
2. Answer the documentary-style interview questions (Win+H voice dictation recommended)
3. Claude compiles the answers into the sections below and saves them permanently

Interview questions:
- Who are you, and what are you actually trying to build?
- How do you make decisions — gut, data, speed, caution?
- What do you value, and what will you flat-out refuse to do?
- How do you communicate — tone, length, formality, pet hates?
- What context do you always wish people already knew about you?
- What does a genuinely great outcome look like to you?

Optional: take the 16Personalities test (16personalities.com) and include your type.
```

**SOUL SECTIONS (populated after interview):**

### Who I Am
*(empty)*

### How I Decide
*(empty)*

### What I Value
*(empty)*

### How I Communicate
*(empty)*

### Standing Context
*(empty)*

### What Good Looks Like
*(empty)*

---

## TREASURE MAP — Architecture-First Rule

Before writing any code for a new project, draw the architecture. This is non-negotiable.

**Protocol:**
1. Sketch the folder/file structure and decision flow (pen and paper preferred; photo or verbal description accepted)
2. Claude reflects it back as a tree diagram + a trigger→location→action table
3. User corrects anything incorrect
4. Claude writes the agreed design to `ARCHITECTURE.md` and scaffolds the empty folders/files
5. Routing rules are added to this CLAUDE.md: "If the request involves X, read file Y"

**Rule:** Claude never invents files or folders that weren't in the agreed architecture. If a new file is needed, it must be explicitly agreed before creation.

---

## SKILLCEPTION — Installed as Standalone

Skillception lives at `~/.claude/skills/skillception/SKILL.md`. It is the one skill installed separately — used to build, test, and refine new skills as the system evolves.

**To invoke:** Say "make this a skill," "turn this into a skill," or "skillception."

**What it does:** Interviews you about a repeatable process and writes a complete SKILL.md you can install and reuse. One skill, one job. If it needs to do two things, split it.

Also installed: **Claudeception** — the autonomous version. Runs in the background, detects reusable patterns during a session, and writes skills without being asked.

---

## METHOD ACTOR — Agent Personas

Every agent that engages externally (with clients, in emails, in chat) has a full persona file at `personas/<name>.md`.

**Persona file contains:**
- Name + role
- Backstory (origin, how they got to this role)
- Voice (tone, vocabulary, quirks, words they never use)
- Operating principles (what they always do / never do)
- Relationships (which other agents they defer to or hand off to)

**To spin up a new agent:** Say "onboard a new agent" and describe the role. Claude generates the backstory, voice, and principles, saves the persona file, and integrates it into the relevant workflow.

**Rule:** Every agent has 3–5 responsibilities maximum. When responsibilities exceed 5, create a new agent.

---

## ARMY — Parallel Sub-Agents

For any task with independent workstreams, use parallel sub-agents.

**Trigger phrase:** "team agents" or "the army" or "parallelize this"

**Protocol:**
1. Split the task into chunks where no chunk depends on another's output
2. Spawn one teammate agent per chunk, each with a self-contained brief
3. Name each teammate by its job so you can toggle between them
4. Collect results, resolve conflicts, synthesize one output

**Rule:** Parallelize discovery and independent builds. Keep order-dependent steps inside a single agent. Do not parallelize things that share state.

---

## SKELETON KEY — Web Research via Browser Extension

The Claude browser extension is connected and available as a tool inside every desktop app session. Use it as the primary method for all web research tasks.

**Use cases in this system:**
- Reading any client's existing website — navigate to it, Claude reads it directly
- Extracting business data from Google Maps (hours, address, reviews, photos)
- Reading Instagram profiles for aesthetic direction and brand data
- Browsing Motionsites, Behance, 21st.dev, Pinterest for reference images
- Pulling copy, fonts, colors from competitor sites via inspect element
- Any live web data that has no API

**Decision tree:**
- Single page / one-off extraction → browser extension (navigate to URL, Claude reads it)
- Multi-page automated loop (e.g. 50 competitor URLs) → Playwright script via Claude Code
- Repeated structured access to the same site → MCP server wrapping Playwright

**Rule:** Browser extension first for everything interactive and one-off. Playwright only for automation that would take too many manual steps.

---

## SORTING HAT — Model Routing

Route every task to the cheapest model that can still nail it. Never default everything to the flagship.

| Task Type | Model Tier | Examples |
|-----------|-----------|---------|
| Hard | Flagship (Opus) | Architecture, novel problem-solving, long-horizon planning, debugging complex systems |
| Routine | Mid-tier (Sonnet) | Drafting copy, replying to email, summarizing, formatting, simple edits |
| Trivial / bulk | Cheapest (Haiku) | Classification, extraction, boilerplate generation |

**Protocol:** Before executing any sub-agent task, classify it against the table above. State the model choice and the one-line reason. Track approximate savings vs running everything on flagship.

---

## HEADROOM — Token Compression

Headroom wraps Claude Code sessions. It compresses all context (tool outputs, logs, files, conversation history) before it hits the model. 60–95% token reduction with no quality loss.

**Install command:** `pip install "headroom-ai[all]"` then `headroom wrap claude`
**Note:** The `[all]` flag is required — it includes the ML compression models. Without it Headroom runs degraded.

**Rule:** All Claude Code sessions launch via `headroom wrap claude`. If Headroom is not active, flag it before starting any large build session.

---

## GRAPHIFY — Codebase Navigation

For any project exceeding ~20 files, activate Graphify before building. It creates a knowledge graph of the codebase so Claude navigates by map instead of re-reading every file.

**Install:** `claude skill add safishamsi/graphify` (run inside a Claude Code session)

**When to activate:** Project has >20 files, OR you are picking up an existing repo you haven't seen before.

**What it provides:**
- Instant orientation in any repo
- Grounded answers about dependencies and blast radius before editing
- ~82% cheaper, ~86% fewer tokens per conversation on large projects

---

## TOKEN DISCIPLINE — Behavioral Rules

1. **Surgical editing over full rewrites.** Never rewrite a component that is already working. Change only what needs changing.
2. **Headroom check first.** Before any large build session, verify Headroom is wrapping the session.
3. **Graphify threshold.** Activate Graphify when the project exceeds ~20 files.
4. **Sorting Hat routing.** Every sub-agent task gets routed to the right model tier before execution.
5. **Session scope limits.** If a task clearly requires 20+ tool calls or multiple major build phases, propose breaking it into sessions rather than running unbounded.
6. **Parallel where independent.** Use sub-agents for independent workstreams rather than sequential single-agent execution.
7. **Prioritize tangible output over exhaustive completeness.** When approaching output limits, produce the complete, usable core and leave a clear marker for what remains — never truncate mid-function or mid-section silently.

---

## HOW YOU INTERACT — Desktop App Only

You (the user) only ever talk to the Claude desktop app. You never open a terminal. You never run commands. You never touch Vercel, Supabase, or GitHub directly.

**Your only job:**
1. Open the desktop app
2. Give Claude a client name and any URLs you have
3. Check in at Step 5 to review Pass 1
4. Confirm deploy at Step 9
5. Receive the live URL and client credentials

Everything else — browsing, researching, coding, building, testing, deploying — Claude handles autonomously using the browser extension and Claude Code in the background.

**How to start any build:**
> "run PIPELINE-START.md — [client name], [any URLs you have]"

That's the only input required.

---

## WEBSITE BUILD SYSTEM — The Full Pipeline

### Reference Source Intelligence

| Source | Best For | When to Use |
|--------|----------|------------|
| Motionsites | Scroll-driven animation, parallax-heavy, motion-first builds | Client wants scroll storytelling, cinematic movement |
| 21st.dev | Component-level modern web UI, clean interaction patterns | SaaS, clean product sites, component libraries |
| Behance | Editorial, brand identity, illustration-led, art-directed layouts | Fashion, luxury, creative agency, portfolio |
| Mobbin | Mobile UI flows, app screens, onboarding patterns | Mobile-first products, apps, onboarding flows |
| Pinterest | Mood, color palette, layout composition, vibe sourcing | Early concept, mood boards, when client describes a feeling |
| Framer | Interactive landing pages, SaaS marketing, prototype-quality web | Fast interactive landing pages, SaaS marketing |

### Reference Evaluation — 4-Point Framework

Score every reference image before feeding it to any model. Below 3/4 = replace it.

| Criterion | Pass | Fail |
|-----------|------|------|
| **Clear hierarchy** (1 pt) | Obvious distinct sections — hero, about, features, contact visible at a glance | Abstract collage with no clear section boundaries |
| **No watermarks** (1 pt) | No signatures, overlays, or designer attribution | Any text overlay that isn't part of the design |
| **Sharp details** (1 pt) | Typography legible, colors saturated, proportions visible | Blurry, low-res, or photographed from a distance |
| **Replicable structure** (1 pt) | Standard web layout primitives — grids, columns, cards, hero compositions | Print mockup, tactile/physical media effects that can't be coded |

**Bonus heuristic:** Can you describe the layout to someone over the phone in 30 seconds and have them picture it? Yes = AI-parseable. "You have to see it" = skip it.

**Scoring:** 4/4 = feed directly. 3/4 = crop or adjust the failing criterion. 2/4 = risky. 1/4 = skip.

### Two-Pass Build Methodology

**Pass 1 — Full Cinematic Codebase**

Drop the scored reference image + the completed intake template into the model. Generate the entire codebase in one pass. The Pass 1 prompt template is in `pipeline/pass-1-prompt-template.md`.

**Pass 2 — Surgical Refinement**

Fix four things in one connected pass — do NOT split into separate prompts as each fix depends on the previous one:

1. **Hero z-index layering** — fix structural bugs, ensure typography sits behind landscape images correctly
2. **Scroll-linked parallax** — Framer Motion `useScroll` + `useTransform`, linear easing, GPU-accelerated
3. **Timeline stagger reveal** — `useInView` with `once: true`, 200ms stagger between items, `cubic-bezier(0.16, 1, 0.3, 1)`
4. **Production polish** — Lenis smooth scroll at root layout, custom cursor (dot → outlined circle), hover states on all interactive elements

The Pass 2 prompt template is in `pipeline/pass-2-prompt-template.md`.

### Tech Stack (Default)

| Layer | Tool | Notes |
|-------|------|-------|
| Framework | Next.js 14 (App Router, TypeScript) | |
| Styling | Tailwind CSS with arbitrary values | For glassmorphism precision |
| Animation | Framer Motion | `useScroll`, `useTransform`, `useInView`, `whileHover` |
| Smooth scroll | Lenis (`@studio-freight/lenis`) | duration: 1.2, no smooth touch on mobile |
| CMS backend | Supabase | Auth + JSONB storage + RLS + file storage |
| Deploy | Vercel | via CLI — `vercel --prod` |
| Repo | GitHub | via CLI — `gh` authenticated |
| Custom cursor | Custom component | 8px dot → 32px outlined circle, `mix-blend-mode: difference` |

### API Selection — By Client Vertical

Select free professional APIs before the build, woven in natively. The API selection guide is in `pipeline/api-selection-guide.md`.

### CMS Architecture

**Two portals, one database:**

- **Your admin view:** Runs locally or on your admin dashboard. Manages all client sites, core configurations, API keys, global states.
- **Client portal:** A clean, secure URL + password. Client can edit text, images, and hit Publish. Cannot touch layout, motion, or code.

**Publish flow:** All changes staged → validated → client hits Publish → snapshot committed to Supabase → Vercel redeploys via webhook. Nothing goes live until explicitly published.

**Supabase schema template** is in `pipeline/supabase-schema-template.sql`.

### 9-Step Build Sequence

Execute in order for every project:

1. **Intake** — receive client name + URLs, begin browsing immediately
2. **Client audit** — use browser extension to scrape existing site, Instagram, Google Maps, Yelp
3. **Reference pull** — use browser extension to browse reference sources and download candidates
4. **Reference scoring** — run 4-point framework; below 3/4 = replace before proceeding
5. **Pass 1 generation** — full cinematic codebase from reference + scraped client data *(user reviews here)*
6. **Pass 2 refinement** — hero z-index, scroll parallax, stagger reveals, Lenis + cursor + hover states
7. **API integration** — professional free APIs chosen in Step 1, woven in natively
8. **CMS layer** — GitHub + Vercel + Supabase; client portal + admin view
9. **Deploy** — live on Vercel, custom domain, client gets URL + password *(user confirms here)*

---

## 1-SHOT INTAKE PROTOCOL

When the user gives a client name and URLs, begin the 9-step pipeline immediately. Do not ask clarifying questions — browse to fill any gaps.

The only thing that stops the pipeline before Step 2: missing business name (nothing to search for).

**Trigger:** "run PIPELINE-START.md — [client name] [any URLs]"

---

## AUTONOMY RULES

### Does without asking:
- Using the browser extension to browse any URL
- Reading any file in the project
- Running builds, lints, and test suites via Claude Code
- Scraping references and business data
- Writing code, components, and configuration files
- Making commits and pushing to feature branches
- Running Pass 1 and Pass 2 build sequences
- Activating Graphify on new repos
- Routing sub-agents via Sorting Hat

### Flags before doing:
- Production deploys (Vercel `--prod`) — always confirm with user
- Anything sent directly to a client (emails, portal links, credentials)
- Schema migrations that modify existing production data
- Operations estimated to consume significant tokens (state the estimate first)
- Any action that touches real money or live credentials

### Reports after:
- All autonomous operations summarized in plain English
- Format: `DONE: [what was done] → [result] → [next step if any]`
- If anything unexpected was encountered, flag it with `FLAGGED:` prefix

---

## CLI AUTHENTICATION — What Claude Controls Directly

| Tool | Auth Command | What Claude Uses It For |
|------|-------------|------------------------|
| GitHub CLI | `gh auth login` | Commits, pushes, repo creation — without user touching terminal |
| Vercel CLI | `vercel login` | Deploys, domain linking, env var management |
| Supabase CLI | `supabase login` | Schema management, migrations, RLS policy updates |

**Rule:** Claude commits and pushes to feature branches autonomously. Production deploy requires a flag confirmation. Any deploy to a client-facing URL requires explicit approval.

---

## TOOL STACK — What's Installed and Why

### Installed:
- **Headroom** — context compression, 60–95% token savings. `pip install "headroom-ai[all]"` → `headroom wrap claude`.
- **Graphify** — codebase knowledge graph. `claude skill add safishamsi/graphify`. Activates on projects >20 files.
- **Playwright** — browser automation for multi-step/headless tasks. Browser extension handles all interactive one-off browsing.
- **Skillception** — standalone skill at `~/.claude/skills/skillception/`. Used to build new skills.
- **Claudeception** — autonomous skill builder. Runs in background, detects reusable patterns, writes skills without being asked.
- **Claude browser extension** — Chrome/Edge extension connected to the desktop app. Primary research tool for all web data.

### Not installed — on-record decisions:

These were explicitly evaluated and rejected. Do not install them without revisiting the reasoning below.

| Tool | Decision | Reason |
|------|----------|--------|
| **Hermes** | Rejected | Overkill — Claude Max covers the same agentic capability without the overhead |
| **Railway CLI** | Rejected | Using Vercel for all hosting — Railway adds no value to this stack |
| **MongoDB driver** | Rejected | Supabase provides the same JSONB flexibility plus built-in auth, RLS, and file storage — three things MongoDB would require bolting on separately |
| **Caveman plugin** | Rejected | Replaced by Headroom — more professional, better compression, no quality loss |
| **ai-website-skills-v2 as a skill package** | Rejected | All contents merged directly into this master file — installing it separately would create duplication and version drift |

If any of these decisions need to be revisited, update this table with the new reasoning before installing.

---
*End of CLAUDE.md v2.0*
