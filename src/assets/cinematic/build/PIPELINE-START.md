# PIPELINE-START.md
> One file. One session. Give Claude a client name and URLs — walk away.
> Read this file in full, then begin.

---

## HOW THIS WORKS

You have two tools available:
- **Browser extension** — reads any live webpage, Instagram, Google Maps, reference sites. Use this for all research in Steps 1–4.
- **Claude Code (background)** — writes files, runs builds, commits to GitHub, deploys to Vercel. Use this for all building in Steps 5–9.

The user never opens a terminal. They never manage a handoff. They give you a client name and URLs — you decide what to browse, what to build, and when to switch between tools. The plan sidebar shows them every step in real time.

Run the full 9-step pipeline in a single session.

---

## WHAT THE USER GIVES YOU

- **Business name** — required. If missing, ask for this one thing only.
- **Any URLs** — existing site, Instagram, Google Maps, Yelp, anything. If they have nothing, you'll search.

---

## BEFORE STARTING

Set up the plan sidebar with all 9 steps visible:

```
Step 1 — Intake
Step 2 — Client Audit  [browser extension]
Step 3 — Reference Pull  [browser extension]
Step 4 — Reference Scoring
Step 5 — Pass 1 Generation  ← user reviews here
Step 6 — Pass 2 Refinement
Step 7 — API Integration
Step 8 — CMS Layer
Step 9 — Deploy  ← user confirms here
```

Update each step as you complete it. The user can interrupt and redirect from the sidebar at any point.

---

## STEP 1 — Intake

Open `pipeline/intake-template.md`. This is the form you are filling over Steps 1–4. You do not ask the user to fill it — you fill it yourself by browsing.

Mark Step 1 done.

---

## STEP 2 — Client Audit

**Use the browser extension.** Visit every URL the user gave you. If they gave you nothing useful for a data point (e.g. no Google Maps link), search for it yourself. If it genuinely doesn't exist, note it and move on.

**From any existing website:**
- Hero headline and subheading — exact text
- About / brand story — exact text or close paraphrase
- Services or offerings listed, in order
- Section structure — what sections exist and in what order
- Fonts — open browser devtools, check `font-family` on headings and body text
- Colors — check computed styles, pull hex values for background, text, accent
- What the site does badly — be specific, this informs the design direction

**From any Instagram profile:**
- Aesthetic in 3–5 adjectives
- Dominant colors across the feed
- Subject matter and visual patterns
- Caption tone and voice

**From any Google Maps / Yelp listing:**
- Full address and phone number
- Opening hours, all days
- Star rating and review count
- Top 3 highest-rated reviews — copy verbatim (these become testimonials)
- Top 3 most recent reviews — copy verbatim
- Recurring phrases across reviews — these reveal what customers actually value

**If the user gave no URLs:** Search Google for "[business name] [city]" and find their site, Maps listing, and social. If nothing exists, note it and use the business name and industry to infer aesthetic direction.

Save the completed intake to `handoff/intake-filled.md`.

Mark Step 2 done.

---

## STEP 3 — Reference Pull

**Use the browser extension.** Based on the aesthetic adjectives from Step 2, browse for 2–3 candidate reference images.

| Aesthetic | Where to browse |
|-----------|--------------  |
| Cinematic, scroll-driven, motion-heavy | motionsites.io |
| Editorial, luxury, brand identity | behance.net |
| Modern UI, clean SaaS | 21st.dev |
| Mood, color palette, layout | pinterest.com |
| Interactive landing page | framer.com |

For each candidate, save the image to `handoff/references/ref-[n]-candidate.png`.

Mark Step 3 done.

---

## STEP 4 — Reference Scoring

Open `pipeline/reference-scoring-checklist.md`. Score every candidate against all 4 criteria.

Save passing images as `handoff/references/ref-[n]-score[X].png`.

You need at least one image at 3/4 or higher to proceed. If nothing passes, go back to the browser and find a replacement.

Mark Step 4 done.

---

## STEP 5 — Pass 1 Generation

**Switch to Claude Code.**

Open `pipeline/pass-1-prompt-template.md`. Fill every placeholder from `handoff/intake-filled.md`:

| Prompt placeholder | Source in intake |
|-------------------|-----------------|
| `[BUSINESS NAME]` | Section 1 — Business name |
| `[WHAT THEY DO + WHO THEY SERVE]` | Section 1 |
| `[3–5 ADJECTIVES]` | Section 2 — Aesthetic adjectives |
| `[ANTI-AESTHETIC]` | What the existing site does badly + Section 6 hard no's |
| `[LOCATION]` | Section 1 |
| `[INDUSTRY]` | Section 1 |
| `[CORE DIFFERENTIATOR]` | Section 1 |
| Color palette | Section 2 — hex values from audit |
| Typography | Section 5 — fonts identified in audit |
| Required sections | Section 3 — section order |
| `[EVOCATIVE DESCRIPTION]` | Derive from adjectives + industry |

For all copy: use the real scraped text from the audit. No lorem ipsum. No placeholder copy.
For testimonials: use the verbatim reviews from Google Maps / Yelp.
For map embed: use the address from the audit.

Drop `handoff/references/ref-01-score[X].png` into the vision model alongside the filled prompt. Generate the full Next.js 14 codebase. Run `npm install && npm run dev`. Verify it loads at localhost:3000.

**Pause here. Report to the user:**
> "Step 5 done. Pass 1 is running at localhost:3000. Ready for your review before I continue."

Wait for the user to confirm before proceeding to Step 6.

---

## STEP 6 — Pass 2 Refinement

Open `pipeline/pass-2-prompt-template.md`. Run as a single connected pass — do not split.

Four fixes in strict order:
1. Hero z-index layering — correct structural bugs, typography behind landscape images
2. Scroll-linked parallax — `useScroll` + `useTransform`, linear easing, `willChange: "transform"`
3. Stagger reveal — `useInView` `once: true`, 200ms stagger, `cubic-bezier(0.16, 1, 0.3, 1)`
4. Production polish — Lenis at root layout, custom cursor (8px dot → 32px outlined circle, `mix-blend-mode: difference`), hover states on all interactive elements

Mark Step 6 done.

---

## STEP 7 — API Integration

Open `pipeline/api-selection-guide.md`. Select free professional APIs for this client's vertical. Wire them in natively — no bolted-on widgets, no iframes unless specified.

Mark Step 7 done.

---

## STEP 8 — CMS Layer

Open `pipeline/client-portal-spec.md` and `pipeline/supabase-schema-template.sql`.

Build:
- **Admin view** — manages all client sites, configuration, API keys, deploy status
- **Client portal** — clean URL + password login, edit text/images/business data, Publish button, cannot touch layout or code

Publish flow: staged → validated → client hits Publish → Supabase snapshot → Vercel webhook redeploy.

Mark Step 8 done.

---

## STEP 9 — Deploy

**Flag before running. Never deploy without confirmation.**

Report to the user:
> "FLAGGED: Ready to deploy to production. This will make the site live. Confirm?"

On confirmation:
```bash
gh repo create [business-name-slug] --private --source=. --push
vercel --prod
```

Verify: live URL resolves, custom domain linked (if provided), client portal login works, Publish button tested end-to-end.

Mark Step 9 done.

---

## TECH STACK (default — do not deviate without explicit instruction)

| Layer | Tool |
|-------|------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS with arbitrary values |
| Animation | Framer Motion |
| Smooth scroll | Lenis (`@studio-freight/lenis`) |
| CMS backend | Supabase |
| Deploy | Vercel via `gh` + `vercel --prod` |
| Repo | GitHub via `gh` CLI |
| Cursor | Custom component — 8px dot → 32px outlined circle |

---

## AUTONOMY RULES

### Does without asking:
- Using the browser extension to browse any URL
- Reading and writing any file in the project
- Running `npm install`, `npm run dev`, builds, lints
- Filling all prompt templates from intake data
- Writing all code, components, config
- Committing and pushing to feature branches
- Activating Graphify when project exceeds ~20 files

### Flags before doing:
- `vercel --prod` — production deploy, always confirm
- Anything sent directly to a client
- Schema migrations on existing production data
- Any action touching live credentials or real money

### Reports after every step:
```
DONE: [what was done] → [result] → [next step]
FLAGGED: [what happened] → [decision needed]
```

---

## WHEN COMPLETE

> **Pipeline complete.**
>
> **[Business name] is live at:** [Vercel URL]
>
> **Summary:**
> - Browsed: [sources used in Steps 2–3]
> - References scored: [results]
> - Built: [Pass 1 description, Pass 2 fixes applied]
> - APIs wired: [list]
> - CMS: Supabase live — client portal at [URL]
> - Deploy: [Vercel URL] — custom domain [linked / pending]
>
> **Client credentials:**
> - Portal URL: [URL]
> - Login: [email]
> - Password: [password]

---

*End of PIPELINE-START.md*
