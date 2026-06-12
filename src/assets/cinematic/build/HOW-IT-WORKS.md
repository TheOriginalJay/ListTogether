# How the Pipeline Works
> Desktop App Edition — you talk to Claude, Claude does everything else.

---

## The Setup

One interface: the Claude desktop app.

The browser extension is connected inside every session as a tool Claude can reach for silently. You don't operate it separately. Claude Code runs builds in the background. You never open a terminal, never touch Vercel or Supabase directly, never manage a handoff between tools.

You give Claude a client name and some URLs. Claude figures out what to browse, what to build, and when to switch between them. The plan sidebar shows you every step in real time.

---

## What Happens in One Session

Claude runs a 9-step pipeline visible in the sidebar.

**Steps 1–4 are research.** Claude uses the browser extension to visit the client's existing site, Instagram, Google Maps, and reference design sources. It reads pages directly — no screenshots needed from you. It fills the intake form as it goes, saves it to `handoff/intake-filled.md`, downloads reference images, and scores them against a 4-point framework.

**Steps 5–9 are building.** Claude switches to code — generates the full Next.js 14 codebase from the reference image and real client data, refines it in a surgical second pass, integrates free professional APIs, builds the client portal on Supabase, and deploys to Vercel.

You have two moments where Claude pauses and waits for you:
- **Step 5** — review Pass 1 at localhost:3000 before building continues
- **Step 9** — confirm the production deploy before anything goes live

Everything else runs without you.

---

## How to Start a Build

Double-click `START-PIPELINE.bat` on your Desktop. The Claude app opens alongside the pipeline folder.

In the app, say something like:

> "run PIPELINE-START.md — new client, Mila's Wine Bar Melbourne, site is milaswine.com.au, Instagram @milaswine"

That's it. Walk away.

---

## Full Example — Mila's Wine Bar, Melbourne

You type:
> "run PIPELINE-START.md — Mila's wine bar Melbourne. milaswine.com.au, @milaswine on Instagram."

Claude sets up the plan sidebar. Step 1 goes active.

---

**Steps 1–4: Claude browses (15–25 min, you do nothing)**

Claude opens milaswine.com.au via the browser extension. Reads the hero copy ("Wine, food, and good company in the heart of South Yarra"), the About section, inspects the computed styles to extract hex colors (`#F5F0E8` background, `#C8A08A` accent), notes the site's weak points: stock hero image, default system fonts, no motion, no personality.

Opens @milaswine on Instagram. Reads the grid — moody, warm, candlelit, exposed brick, low light. Writes five adjectives: intimate, candlelit, editorial, warm, European. Pulls the dominant palette from the grid photos.

Searches Google Maps for the business. Finds it. Pulls the full address, opening hours, 4.7 stars from 312 reviews. Copies the top 5 reviews verbatim — these become testimonials.

Goes to Behance via the browser extension. Searches "editorial wine bar website." Finds three candidates. Scores each:
- Copenhagen restaurant site: 4/4 — downloads to `handoff/references/ref-01-score4.png`
- Dribbble shot with no watermark: 3/4 — saves as backup
- Print mockup: 2/4 — skipped

Saves `handoff/intake-filled.md`. Steps 1–4 marked done.

---

**Step 5: Pass 1 (Claude pauses for your review)**

Claude fills the Pass 1 prompt with everything it gathered — real copy, real hex values, real adjectives, real section structure, real testimonials. Feeds the Behance reference into the model alongside the prompt. Generates the full Next.js 14 codebase. Runs `npm install && npm run dev`.

Plan sidebar marks Step 5 done and pauses:
> "Pass 1 running at localhost:3000. Ready for your review."

You check it. The layout matches the reference feel — full-bleed hero, editorial grid, warm palette, Mila's real copy in every section. You say "looks good, continue."

---

**Steps 6–8: Claude builds (40–60 min, you do nothing)**

Pass 2: hero z-index corrected, scroll parallax on the wine bottle foreground element, staggered card reveals for the menu sections, Lenis smooth scroll, custom cursor, hover lift states on every card.

APIs: Cal.com for reservations (no OpenTable commission), Google Maps embed with the Chapel St address, Resend for the newsletter.

CMS: Supabase schema deployed. Admin dashboard. Client portal where Mila logs in, edits her menu copy and photos, hits Publish — can't touch layout or code.

Sidebar updates after each step.

---

**Step 9: Deploy (Claude flags you)**

> "FLAGGED: Ready to deploy to production. This will make the site live at milaswine.vercel.app. Confirm?"

You say yes. Claude pushes to GitHub, runs `vercel --prod`, links the domain, tests the portal login and Publish button end-to-end.

> **Pipeline complete.**
> **Mila's is live at milaswine.vercel.app**
> Client portal: milaswine-portal.vercel.app
> Portal password: [provided]

---

## Time Breakdown

| Phase | Time | You |
|-------|------|-----|
| Give the brief | 30 seconds | Typing |
| Steps 1–4, browsing | ~20 min | Nothing |
| Review Pass 1 at Step 5 | 2 min | Looking |
| Steps 6–8, building | ~50 min | Nothing |
| Confirm deploy at Step 9 | 10 seconds | One word |
| **Your total involvement** | **~5 min** | |
| **Total elapsed** | **~75 min** | |

---

## Good to Know

**The plan sidebar is how you stay in control without babysitting it.** Glance at it any time to see exactly where the build is. You can interrupt and redirect at any step without canceling the run.

**The handoff folder is a working directory.** Claude writes the filled intake there so data persists across steps. If the session crashes mid-build, restart it — Claude re-reads the intake and picks up from Step 5 without re-browsing.

**You can skip the browsing steps if you already know the brand.** Say "skip to Step 5, I'll give you the data directly" and give Claude the information verbally. It fills the intake from what you say.

**For clients with no web presence at all:** Claude uses the business name, industry, and location to infer an aesthetic direction and search for similar businesses to establish the visual brief.

**The browser extension must be installed and signed in** before the pipeline can use it. The installer opens the Chrome Web Store and waits for you to confirm it's done before continuing.

---

*End of HOW-IT-WORKS.md*
