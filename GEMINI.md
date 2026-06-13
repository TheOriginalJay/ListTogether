# ListTogether - Project Mandates

This project is a collaborative shopping list application built with React, Vite, and Supabase.

## Tech Stack
- **Frontend:** React 19 (TypeScript), Vite 7
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, DB, Realtime)
- **State/Offline:** Dexie (IndexedDB)
- **Validation:** Zod, React Hook Form
- **Navigation:** React Router 7

## Coding Standards
- Follow React 19 best practices (e.g., using `useActionState` if applicable, though we use `react-hook-form`).
- Use `lucide-react` for icons.
- Maintain a clean separation between UI components (`src/components/ui`) and business logic.
- Ensure type safety across the application using TypeScript.
- All database interactions should go through `src/lib/db.ts` or `src/lib/supabase.ts`.

## Project Goals (V1)
- User authentication (Email/Google) + Subscription (Whop).
- Real-time collaborative list editing.
- Offline-first capability with IndexedDB.
- Natural language parsing for item entry.
- Three layout modes: Compact, Standard, Visual.
- Brand kit: Warm amber primary, deep charcoal text, cream backgrounds.

## Session Initialization
On startup, always read the following files immediately to establish current project state and requirements:
- `PRD.md` (located in `./`)
- `PROJECT_STATE.md` (located in `../`)

**Confirmation:** After reading these files, explicitly state "I've initialized the project" before answering any user queries.

## Special Instructions
- **Conflict Resolution:** Detect duplicates within a list and prompt user to merge.
- **Voice Input:** Deferred until a suitable free API is identified.
- **Persistence:** Layout preferences and other UI states should be persisted locally.
