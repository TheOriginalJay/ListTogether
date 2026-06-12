# Pass 1 — Generation Prompt Template
> Feed this to a vision-aware model (Kimi K2, GPT-4V, Claude with vision) along with the scored reference image.
> Drop the reference image first, then paste this prompt below it.

---

## Instructions for Use

1. Score your reference image using the Reference Scoring Checklist. It must score 3/4 or higher.
2. Complete the intake template for the client.
3. Drop the reference image into the model's chat window.
4. Fill in all `[PLACEHOLDERS]` below from the intake template data.
5. Paste the filled prompt immediately after the image.

---

## THE PROMPT

```markdown
Design and code a refined, atmospheric, deeply cinematic landing page for 
[BUSINESS NAME] — [ONE SENTENCE: what they do and who they serve].

The aesthetic direction: [3–5 ADJECTIVES FROM INTAKE, e.g. "editorial, warm, minimal, luxury"]. 
The reference image establishes the visual language — honor its hierarchy, composition, 
and depth. Do not copy it. Use it as a creative direction.

Zero [ANTI-AESTHETIC, e.g. "stock-photo corporate energy" or "generic template feel"]. 
Every visual surface should feel intentional and art-directed.

---

BRAND CONTEXT

Business: [BUSINESS NAME]
Location: [CITY, COUNTRY if relevant]
Industry: [INDUSTRY]
Primary audience: [WHO THEY SERVE — be specific]
Core differentiator: [WHAT MAKES THEM DIFFERENT — one sentence]
Brand voice: [e.g. "warm and approachable" or "authoritative and premium"]
Existing site to avoid resembling: [URL OR "none"]

COLOR PALETTE
Primary: [HEX]
Secondary: [HEX]
Background: [HEX]
Text: [HEX]
Accent/CTA: [HEX]
[If no palette provided: "Extract from the reference aesthetic and brand voice above"]

TYPOGRAPHY
Display/heading: [FONT NAME OR "match reference aesthetic"]
Body: [FONT NAME OR "Inter or equivalent clean sans"]
Accent/editorial: [FONT NAME OR "none"]

---

REQUIRED SECTIONS (in order)

[LIST ALL REQUIRED SECTIONS FROM INTAKE, e.g.:]

HERO
[Describe the hero: full-bleed, layered z-index depth. What is the headline? What is the CTA?
What imagery? What supporting elements?]

[SECTION NAME]
[Description of content, layout, and purpose]

[SECTION NAME]
[Description of content, layout, and purpose]

[Repeat for all required sections]

FOOTER
[Navigation items, contact details, social links, legal text if needed]

---

REQUIRED FEATURES

[LIST FROM INTAKE, e.g.:]
- [Booking/contact form with fields: name, email, phone, message]
- [Gallery or portfolio section]
- [Map embed at [ADDRESS]]
- [Any API integrations to include natively]

---

COLOR PALETTE (final)

[BACKGROUND COLOR] — primary background
[CREAM/LIGHT COLOR] — warm border / accent backgrounds  
[TEXT COLOR] — primary text
[ACCENT COLOR] — emphasis, focus states, hover
[SECONDARY ACCENT] — used sparingly
[MUTED COLOR] — captions, fine print

---

TYPOGRAPHY

Display headings: [font] — for section titles and hero text
Body: [font] — regular, 400 weight
Small caps/nav: [font] with tracked-out letter-spacing, uppercase, 12px
Editorial/accent: [font], light weight — for quotes and pull text

---

MOTION SYSTEM

Smooth scroll: Lenis wrapper on the entire page
Hero parallax: Background at 0.3x scroll, headline at 0.5x, foreground element fixed
Section reveals: Framer Motion useInView, fade + slide from y=40px, once: true
Stagger (when applicable): 200ms between sequential items
Card hover: lift 4–6px, cubic-bezier(0.16, 1, 0.3, 1), 300ms
Custom cursor: 8px dot → 32px outlined circle on interactive elements
Easing standard: cubic-bezier(0.16, 1, 0.3, 1) — confident, exhaled, never abrupt

---

TECH STACK

Next.js 14 (App Router, TypeScript)
Tailwind CSS (with arbitrary values for glassmorphism)
Framer Motion (useScroll, useTransform, useInView, whileHover)
Lenis (@studio-freight/lenis) for smooth scroll
Next/Image for all image optimization
No external UI libraries — pure custom components

---

PERFORMANCE & FEEL

Every image lazy-loaded with 0.4s fade-in. Generous whitespace. Considered pacing.
The site should feel like [EVOCATIVE DESCRIPTION MATCHING THE BRAND, e.g. 
"flipping through a leather-bound travel journal" or "walking into a flagship boutique"].
Nothing decorative. Nothing extra.

---

CRITICAL IMPLEMENTATION NOTES

1. Z-index layering in the hero is non-negotiable. If typography is meant to sit behind 
   a landscape or image layer, implement this with correct z-index stacking and masking.
   
2. Glassmorphism only works with proper backdrop-blur. All glass panels need 
   backdrop-filter: blur() AND a semi-transparent background.

3. The timeline or stagger reveal (if applicable) is the centerpiece animation. 
   Get this right — viewport-triggered, sequential, smooth.

4. Build the full Next.js project with all sections. Output complete, 
   production-ready code with no placeholders.
```

---

## After Pass 1 Is Complete

1. Copy the output into your project directory
2. Run `npm install` and `npm run dev`
3. Verify the visual structure matches the reference intent
4. Note the four Pass 2 fix points: hero z-index, scroll parallax, stagger reveals, production polish
5. Proceed to Pass 2 using the Pass 2 prompt template

---

*Version 1.0 | Part of the cinematic website build pipeline*
