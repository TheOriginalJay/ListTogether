# Client Portal Specification
> What clients can edit, what they can't touch, and how the Publish button works.

---

## Overview

The client portal is a clean, secure URL shared with each client alongside an access password. It is the only interface clients ever use to interact with their website. They never see code, never touch Vercel, and never contact you for routine content updates.

---

## What Clients CAN Edit

All editing is text and media only — never structure, motion, or code.

### Text Fields (editable inline)
- All headline copy
- All body paragraph copy
- Button labels and CTA text
- Navigation link labels
- Footer text (tagline, copyright, contact details)
- Form field labels and placeholder text
- Meta title and meta description (SEO fields, visible in a separate SEO tab)
- Alt text for images

### Media (upload only)
- Hero images and background photos
- Logo (replaces the existing logo; preserves size constraints)
- Team/staff photos
- Gallery images (can add, remove, reorder)
- Any client-specific imagery used in sections

### Business Data (structured fields)
- Phone number
- Email address
- Physical address
- Business hours (structured day/time picker, not free text)
- Social media links (URL fields per platform)
- Google Maps embed URL

### What clients CANNOT touch (locked):
- Page layout and section structure
- Typography (font family, weights, sizes)
- Color palette and CSS variables
- Animations, parallax, and motion timing
- Component architecture
- Any code file
- Vercel settings, domain settings, or API configurations
- The admin/master view

---

## Portal Interface Specification

### Login Screen
- Clean, minimal login form
- Fields: email + password
- No "forgot password" flow (admin handles password resets)
- Branding: neutral / your agency branding — not the client's branding

### Editor View
After login, client sees a single-page editor organized by section:

```
[SITE NAME] — Content Editor

  ▸ Hero
  ▸ About
  ▸ Services / Features
  ▸ Gallery
  ▸ Testimonials
  ▸ Contact
  ▸ Footer
  ▸ SEO Settings

[PUBLISH BUTTON — top right, always visible]
```

Each section expands to show editable fields. Fields are simple: text inputs, text areas, image upload zones, and structured data fields (hours, links). No rich text editor — inline formatting is not client-editable.

### Change Indicator
When a client has unsaved changes, a yellow dot appears next to the section name in the sidebar. The Publish button changes to "Publish Changes (N unsaved sections)."

### Preview Mode
A "Preview" button opens the site in an iframe with draft changes applied (not yet live). Client can review before publishing.

---

## Publish Button — How It Works

This is the critical flow. Nothing goes live until the client explicitly hits Publish.

```
STEP 1 — Client edits content
         All edits saved to Supabase site_content table
         is_published = false (staged, not live)

STEP 2 — Client clicks Publish
         Confirmation modal: "This will update your live website. Continue?"

STEP 3 — On confirm:
         a. Snapshot saved to content_snapshots (version history preserved)
         b. site_content rows updated: is_published = true, published_at = now()
         c. Vercel deploy webhook fires (triggers a new build)
         d. Site rebuilds from the newly published content
         e. Portal shows: "Published successfully — changes are now live"

STEP 4 — Vercel build completes (~30–60 seconds)
         Live site reflects the published content
```

### Rollback (Admin Only)
From the admin view, any previous snapshot can be restored. This is not exposed to the client. If a client asks to revert a change, the admin restores from the snapshot table and triggers a new deploy.

---

## Admin View (Your Master Dashboard)

Separate from the client portal. Runs locally or on your private admin URL.

### What you see:
- All client sites in one view (list with status, last published, domain)
- Per-site: full content editor (same as client, but with layout + config access)
- Per-site: snapshot history with one-click restore
- API key management (Vercel token, Supabase credentials, image API keys)
- Deploy log (last deploy time, status, Vercel URL)
- Client credentials manager (generate/reset client passwords)

### Admin-only capabilities:
- Modify section structure (add/remove sections)
- Change color palette or typography
- Edit JSONB schema for any content section
- Trigger manual deploys
- View and restore from any snapshot
- Manage media storage (bulk delete, organize)

---

## Technical Implementation Notes

### Authentication
- Supabase Auth (magic link or email/password)
- Row Level Security ensures clients can only access their own site's data
- Admin role set in `profiles.role` column

### Content Rendering
The Next.js site reads from Supabase at build time (SSG) or request time (ISR, recommended). When Vercel deploys after a Publish, it re-fetches all `is_published = true` content and rebuilds the static pages.

### Real-time (optional)
For a better client experience, the portal can use Supabase Realtime to show live save confirmations. Not required for v1.

### Recommended ISR config in Next.js:
```typescript
export const revalidate = 60; // revalidate every 60 seconds
// OR
// trigger on-demand revalidation via Vercel webhook on publish
```

---

## What You Tell Clients

> "Your website comes with a private editing portal. Log in with your email and password, and you can update text, photos, and business details whenever you want. When you're happy with your changes, hit Publish — your live site updates in about a minute. If you ever need layout changes, a new section, or anything structural, that's a separate request to me."

This framing:
- Sets clear expectations about what they can do independently
- Preserves your role for anything structural (recurring revenue opportunity)
- Eliminates support burden for routine content updates

---

*Version 1.0 | Part of the cinematic website build pipeline*
