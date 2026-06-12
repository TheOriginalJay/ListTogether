# Cinematic Website Pipeline — Desktop App Edition
> Version 2.0 | You interact via Claude desktop app only. Claude does everything else.

---

## Structure

```
cinematic-pipeline/
├── INSTALL.bat              ← Run this once as Administrator. Sets up everything.
├── CLAUDE.md                ← Claude reads this automatically at session start.
├── PIPELINE-START.md        ← The trigger file. "run PIPELINE-START.md — [client] [URLs]"
├── HOW-IT-WORKS.md          ← Full explanation with worked example.
├── README.md                ← This file.
├── handoff/                 ← Claude writes intake-filled.md here. References land here.
│   └── references/          ← Reference images scored and saved per build.
├── personas/                ← Agent persona files live here.
└── pipeline/
    ├── intake-template.md
    ├── pass-1-prompt-template.md
    ├── pass-2-prompt-template.md
    ├── api-selection-guide.md
    ├── reference-scoring-checklist.md
    ├── client-portal-spec.md
    └── supabase-schema-template.sql
```

---

## Setup (One Time)

Right-click `INSTALL.bat` → Run as administrator. It installs everything and creates `START-PIPELINE.bat` on your Desktop.

After it finishes, do these three things once:

1. Open Claude desktop app in Code mode → run: `claude skill add safishamsi/graphify`
2. Same session → run: `claude skill add blader/Claudeception`
3. Any session → type: `run soul transplant`

---

## Starting a Build

Double-click `START-PIPELINE.bat` on your Desktop.

In the Claude app:
> "run PIPELINE-START.md — [client name] [any URLs you have]"

**Your two checkpoints:**
- **Step 5** — review the site at localhost:3000 before building continues
- **Step 9** — confirm the production deploy (Claude asks you first)

Everything else is automatic.

---

## What Gets Installed

| Tool | Purpose |
|------|---------|
| Node.js | Runs Next.js builds |
| Python | Required by Headroom and some npm packages |
| Git | Version control |
| Claude Desktop App | Your only interface |
| Headroom | 60–95% token compression on Claude Code sessions |
| Playwright | Headless browser automation for multi-step scraping |
| GitHub CLI | Claude commits and pushes without you touching terminal |
| Vercel CLI | Claude deploys without you touching terminal |
| Supabase CLI | Claude manages database schema without you touching terminal |
| Claude browser extension | Claude reads live web pages directly in sessions |

---

*Read HOW-IT-WORKS.md for the full picture and a worked example.*
