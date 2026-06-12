# Reference Scoring Checklist
> Standalone tool. Use before feeding any reference image to a vision-aware coding model.

---

## When to Use This

Before every website build. Score the reference image against the four criteria below. If it scores below 3/4, find a better reference — do not proceed with a weak one.

A bad reference is the most common reason a build fails before it starts.

---

## The 4-Point Scoring Framework

For each criterion, award 1 point (pass) or 0 points (fail). No half points.

---

### Criterion 1 — Clear Hierarchy
**Question:** Can you visually segment the design into distinct sections (hero, about, features, contact) without ambiguity?

| Pass ✓ | Fail ✗ |
|--------|--------|
| Obvious, distinct sections visible at a glance | Abstract collage with no clear section boundaries |
| A developer could identify where each section starts and ends | Design is one continuous flow with no natural breakpoints |

**Why it matters:** The model needs to identify and code each section separately. If it can't segment the image, it will hallucinate a structure.

---

### Criterion 2 — No Watermarks
**Question:** Is the image free of any text overlays, signatures, or designer attribution?

| Pass ✓ | Fail ✗ |
|--------|--------|
| Clean image — only the design itself is present | Watermark, signature, logo, or overlay text visible anywhere |

**Why it matters:** Vision models read watermarks as text and attempt to code them into the hero as actual design elements (e.g., inserting "Dribbble" or a designer's name as a heading).

---

### Criterion 3 — Sharp Details
**Question:** Is the typography legible, are colors saturated, and are spacing/proportions visible?

| Pass ✓ | Fail ✗ |
|--------|--------|
| Typography readable at normal viewing distance | Blurry, low-resolution, or overly compressed |
| Colors are saturated and distinguishable | Colors are washed out, muted, or ambiguous |
| Spacing and layout proportions are visible | Photographed from a distance or shot at an angle |

**Why it matters:** The model reads these details to replicate them. Poor image quality means guessed colors, wrong font weights, and incorrect spacing — all things you'll spend Pass 2 fixing.

---

### Criterion 4 — Replicable Structure
**Question:** Does the design use standard web layout primitives (grids, columns, sections, cards, hero compositions)?

| Pass ✓ | Fail ✗ |
|--------|--------|
| Layout built from recognizable web components | Print mockup relying on physical media (paper texture, bleed, die-cut) |
| Sections map to standard HTML/CSS patterns | Hand-drawn, illustrated, or tactile elements that can't be coded |
| Design could be described as "sections and containers" | Design requires physical production to exist |

**Why it matters:** If the design relies on effects that don't exist in code (ink bleeds, paper grain, letterpress), the model will either hallucinate substitutes or produce something that looks nothing like the reference.

---

## Score Table

| Criterion | Your Score (0 or 1) |
|-----------|-------------------|
| 1. Clear Hierarchy | |
| 2. No Watermarks | |
| 3. Sharp Details | |
| 4. Replicable Structure | |
| **TOTAL** | **/4** |

---

## Decision Guide

| Score | Decision |
|-------|----------|
| **4/4** | Premium reference. Feed it directly to the model. |
| **3/4** | Good reference. Identify the failing criterion and crop or adjust if possible, then proceed. |
| **2/4** | Risky. Find a better reference. The output will likely need significant rework. |
| **1/4 or below** | Skip entirely. The output will be unusable. |

---

## Bonus Heuristic — The Phone Test

> Can you describe the layout to someone over the phone in 30 seconds and have them accurately picture it?

**Yes** → The reference is AI-parseable. Proceed.

**"You have to see it"** → The design communicates in ways that can't be verbalized, which means it can't be reliably converted to code. Skip it.

---

## Reference Source Intelligence

| Source | Best For |
|--------|----------|
| **Motionsites** | Scroll-driven animation, parallax-heavy, motion-first builds |
| **21st.dev** | Component-level modern web UI, clean interaction patterns |
| **Behance** | Editorial, brand identity, illustration-led, art-directed layouts |
| **Mobbin** | Mobile UI flows, app screens, onboarding patterns |
| **Pinterest** | Mood, color palette, layout composition, vibe sourcing |
| **Framer** | Interactive landing pages, SaaS marketing sites, prototype-quality web |

**Multiple references:** Only use more than one when each contributes something distinct that the others don't. If two references are similar in style, use the higher-scoring one.

---

*Version 1.0 | Part of the cinematic website build pipeline*
