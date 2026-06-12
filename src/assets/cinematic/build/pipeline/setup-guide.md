# Setup Guide
> Step-by-step installation for every tool in the stack.
> Requirements: Windows or Mac. Claude Code installed. Node.js installed. Python 3.10+.

---

## Tool 1 — Headroom (Token Compression)

Headroom sits between Claude Code and the LLM, compressing all context (tool outputs, logs, files, conversation history) before it hits the model. 60–95% token reduction with no quality loss.

### Install

```bash
pip install "headroom-ai[all]"
```

The `[all]` flag includes the proxy, MCP server, ML compression models, and Claude Code wrapper — everything you need in one shot.

### Run

```bash
headroom wrap claude
```

This wraps Claude Code with Headroom. Every session started via `headroom wrap claude` has compression active. That's it — no other config needed.

### Verification

After running the command, start a Claude Code session and run any task. Headroom prints compression stats in the output — you'll see token counts before and after. Expect 47–92% reduction depending on workload.

```bash
headroom perf   # shows compression stats for the last session
headroom stats  # shows cumulative savings
```

**Baseline test (do this once after install):**
1. Run a session without Headroom — note the token count on a medium-sized task
2. Run the same task with `headroom wrap claude` — compare
3. Record the baseline in your notes

### Modes Available

| Mode | Command | Use When |
|------|---------|----------|
| Agent wrap (recommended) | `headroom wrap claude` | Everyday Claude Code use |
| Proxy (any tool) | `headroom proxy --port 8787` | Point any OpenAI-compatible client at localhost:8787 |
| MCP server | `headroom mcp install` | Tool-use integrations, exposes headroom_compress / headroom_retrieve / headroom_stats |
| Library | `from headroom import compress` | Building custom agents |
| Learn mode | `headroom learn` | Teaching Headroom your codebase patterns |

**GitHub:** https://github.com/chopratejas/headroom

---

## Tool 2 — Graphify (Codebase Navigation)

Graphify creates a knowledge graph of any codebase so Claude navigates by map instead of re-reading every file. Up to 71x token reduction on large projects. Activate on any project with more than ~20 files.

### Install

Graphify is a Claude Code skill — one command installs it:

```bash
claude skill add safishamsi/graphify
```

That's the complete install. No cloning, no npm install, no config files.

### How It Works

Once installed, Graphify runs as a skill inside Claude Code. It processes your codebase locally via tree-sitter AST (zero tokens in default mode — pure structural analysis). No source code leaves your machine.

Languages supported: Python, JavaScript, TypeScript, Go, Rust, Java, C, C++, Ruby, C#, Kotlin, Scala, PHP, Swift, Lua, Zig, and more (20+ via tree-sitter).

### Activate on a Project

```bash
# Inside your project directory, tell Claude:
/graphify
```

Or just tell Claude: "Use Graphify to map this project before we start." Claude runs it and uses the resulting graph for all navigation — answering questions from the map rather than re-reading source files.

### When to Activate

- Any project with more than ~20 files
- When picking up a repo you haven't worked in before
- Starting a new session on a project built over multiple days
- Before making changes to a complex part of the codebase

For this pipeline specifically: activate Graphify at the start of every Pass 2 session, since by then you have a full Next.js project with 30–50+ files.

### Deep Mode (Optional)

```bash
graphify --deep
```

Adds semantic edges via LLM (uses tokens). Use for unfamiliar codebases where structural relationships aren't enough. Default mode (no flag) is zero tokens and covers 90% of use cases.

**GitHub:** https://github.com/safishamsi/graphify (install via `claude skill add safishamsi/graphify`)

---

## Tool 3 — Playwright (Browser Automation — Skeleton Key)

Playwright controls a browser programmatically. Primary use in this pipeline: reading client brand data from live sites, scraping reference designs, and extracting business info. Claude Code can also invoke it directly via the browser extension for live tab access.

### Install

```bash
npm install playwright
npx playwright install
```

This installs Playwright and downloads browser binaries for Chromium, Firefox, and WebKit.

### Verification Test

Create a file `test-playwright.js`:

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const title = await page.title();
  console.log('Page title:', title);
  await browser.close();
})();
```

Run it:
```bash
node test-playwright.js
```

Expected output: `Page title: Example Domain`

### Use Cases in This Pipeline

1. **Reference scraping** — scrape Motionsites, 21st.dev, or Behance references before a build
2. **Business data extraction** — pull Google Maps hours, Instagram photos, existing site content
3. **GitHub/Vercel auth flows** — automate login sequences that don't have CLI support
4. **Repetitive data entry** — automate multi-step browser tasks

### Claude Browser Extension (Preferred for Live Tab Access)

The Claude browser extension gives Claude direct read access to your active tab — no Playwright script needed for one-off extractions:

1. Install the Claude browser extension (Chrome/Edge)
2. Open the target page in your browser
3. In Claude Code, say: "Read my active browser tab and extract [what you need]"

Claude reads the live page directly. Use Playwright scripts for automated/headless tasks; use the browser extension for interactive one-off extractions.

### To invoke via Claude Code (Skeleton Key):

Say: "use the skeleton key" or "build a Playwright script to [task]"

---

## Tool 4 — Skillception / Claudeception (Skill Builder)

Skillception is the meta-skill — the skill that builds skills. It watches what you're doing, identifies repeatable patterns, and writes new SKILL.md files you can install permanently. Two versions exist; install the one that fits your workflow.

### What Skills Are

A Claude Code skill is a folder containing a SKILL.md file. Claude Code loads skill names and descriptions at startup (~100 tokens each), matches your current task against them, and pulls in the relevant skill's full instructions. Skills are how you encode your workflow so Claude stops asking and starts doing.

### Option A — Skillception (Manual, Interview-Style)

The original from your pipeline. You invoke it deliberately, it interviews you about a process, and writes the skill.

```bash
# Create the skills directory
mkdir -p ~/.claude/skills/skillception

# Then create ~/.claude/skills/skillception/SKILL.md
# with the Skillception skill content (see the DS2 installer)
```

**To invoke:** Say "make this a skill," "turn this into a skill," or "skillception."

### Option B — Claudeception (Autonomous, Recommended)

A newer community skill that does the same thing but runs autonomously — it watches your session, notices when you've solved something reusable, and writes the skill without you needing to ask.

```bash
claude skill add blader/Claudeception
```

Once installed, it runs in the background. When it detects extractable knowledge during a session, it writes a new skill with a description optimized for future retrieval. No interview needed — it just learns.

**GitHub:** https://github.com/blader/Claudeception

### Best Practices (Both Versions)

- One skill = one job. If a skill does two things, split it.
- Name skills in kebab-case (e.g. `pass-1-generation`, `client-audit`, `api-integration`)
- Test the skill on a real task before relying on it
- Treat SKILL.md like code — commit it to your repo, document changes

### Skills Worth Installing Beyond Skillception

The skill ecosystem has exploded. A few worth adding for this pipeline:

```bash
# Karpathy behavioral guardrails (stops Claude charging ahead with wrong assumptions)
claude skill add karpathy-rules   # search for the current repo — very high stars

# Frontend design best practices
# Already in your stack as /mnt/skills/public/frontend-design/SKILL.md
```

---

## Tool 5 — GitHub CLI Authentication

GitHub CLI lets Claude commit, push, create repos, and manage branches without you touching the terminal. Alternatively, use GitHub Desktop for a GUI-based workflow.

### Option A — GitHub CLI (Claude Code-Native)

```bash
# macOS
brew install gh

# Windows
winget install --id GitHub.cli

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh
```

**Authenticate:**
```bash
gh auth login
```

Select: GitHub.com → HTTPS → Yes → Login with a web browser

**Verification:**
```bash
gh auth status
# Expected: ✓ Logged in to github.com as [your-username]
```

### Option B — GitHub Desktop (GUI, No Terminal)

Download from desktop.github.com — useful for visual diff review before commits.

### How Claude Code Uses It

With `gh` authenticated, Claude can:
- Create private repos: `gh repo create [name] --private`
- Push code: `git add . && git commit -m "[message]" && git push`
- Check status: `gh repo view`

Claude commits and pushes to feature branches autonomously. Production deploys require your confirmation.

---

## Tool 6 — Vercel CLI Authentication

Vercel CLI lets Claude deploy sites, manage domains, and set environment variables without leaving the terminal.

### Install

```bash
npm install -g vercel
```

### Authenticate

```bash
vercel login
```

Opens a browser window. Sign in to your Vercel account and click "Confirm."

### Link to a Project

Run inside the project directory:
```bash
vercel link
```

### Verification

```bash
vercel --version
vercel whoami
```

### How Claude Code Uses It

- Preview deploy: `vercel` (creates a preview URL, not production)
- Production deploy: `vercel --prod` (Claude flags before running this)
- Set env vars: `vercel env add [KEY]`
- Domain management: `vercel domains`

---

## Tool 7 — Supabase CLI Authentication

Supabase CLI lets Claude manage database schemas, run migrations, and manage RLS policies.

### Install

```bash
npm install -g supabase
```

Or via Homebrew (Mac):
```bash
brew install supabase/tap/supabase
```

### Authenticate

```bash
supabase login
```

Opens a browser to generate an access token. Paste it back into the terminal when prompted.

### Link to a Project

```bash
supabase link --project-ref [your-project-ref]
```

Find your project ref in the Supabase dashboard under Settings → General.

### Verification

```bash
supabase projects list
```

### How Claude Code Uses It

- Run migrations: `supabase db push`
- Generate types: `supabase gen types typescript --local > types/supabase.ts`
- View logs: `supabase functions logs`
- Create functions: `supabase functions new [name]`

---

## Tool 8 — Soul Transplant Interview

Run the Soul Transplant interview once to populate the user profile section of `CLAUDE.md`. Until this is done, Claude uses generic defaults.

### How to Run It

1. Open Claude Code (with Headroom active)
2. Say: "Run soul transplant" or "Build my soul file"
3. Claude interviews you with documentary-style questions
4. Copy the compiled output into the Soul Transplant section of `CLAUDE.md`

### Recommended Setup Before the Interview

- **Voice dictation** — use your OS built-in dictation (Win+H on Windows, Fn+Fn or Dictation on Mac) to speak your answers directly into the terminal. Depth of answer matters more than speed of typing.
- **16Personalities test** (optional but recommended): 16personalities.com — take the test and include your type when asked "How do you communicate"

### What Gets Captured

- Who you are and what you're building
- How you make decisions (gut, data, speed, caution)
- What you value and what you won't do
- How you communicate (tone, length, formality, things that irritate you)
- Standing context (what you always wish Claude already knew)
- What a genuinely great outcome looks like for you

---

## Task — Token Baseline Verification

After Headroom is installed, run this one-time test to confirm compression is active.

1. Start a session WITHOUT Headroom: `claude`
2. Run a medium-sized task (e.g. "read this 200-line file and summarize its architecture")
3. Note the input + output token count from Claude Code's output
4. End the session

5. Start a session WITH Headroom: `headroom wrap claude`
6. Run the exact same task with the exact same file
7. Note the token count and calculate reduction: `(before - after) / before × 100 = % savings`

Record your baseline. This is useful for knowing whether Headroom is active in future sessions and estimating costs for large projects.

---

## Quick Reference — Install Sequence

Run these in order on a fresh machine:

```bash
# 1. Headroom
pip install "headroom-ai[all]"

# 2. Graphify (Claude Code skill — run inside Claude Code)
claude skill add safishamsi/graphify

# 3. Playwright
npm install playwright
npx playwright install

# 4. Claudeception (Claude Code skill)
claude skill add blader/Claudeception

# 5. GitHub CLI
gh auth login

# 6. Vercel CLI
npm install -g vercel
vercel login

# 7. Supabase CLI
npm install -g supabase
supabase login

# 8. Soul Transplant
# Open Claude Code → "run soul transplant"
```

---

*Version 2.0 | Verified June 2026 | Part of the cinematic website build pipeline*
