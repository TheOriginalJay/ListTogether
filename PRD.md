# Collaborative Shopping List — Product Requirements Document

**Status:** Finalized - Ready for Build
**Last updated:** 2026-06-11

## Overview
A collaborative shopping list web app for households. The list manager (subscriber) creates and maintains shared grocery lists; co-shoppers edit in real time; view-only collaborators access via link without an account.

## Features — V1 Scope

### Core Functionality
1. **User Authentication + Subscription:** Email/password + Google OAuth signup via Supabase. Whop integration for subscriptions (deferred).
2. **List Management:** Create/edit/delete multiple lists. Privacy settings: Private, Invite-Only, Link-Sharing.
3. **Real-time Collaboration:** Simultaneous editing via Supabase Realtime.
4. **Offline-First:** Local-first mutations queued in IndexedDB (Dexie), synced on reconnect.
5. **Item Entry:** Natural language parser for structured item entry.
6. **Layouts:** Compact, Standard, and Visual modes.
7. **Brand Kit:** Warm amber primary (#F59E0B), deep charcoal text (#1F2937), cream backgrounds (#FFFBEB).

### Refined Logic
- **Conflict Resolution:** Detect duplicates within a list and prompt the user to merge instead of overwriting.
- **Voice Input:** Removed from V1 scope.
- **Editable Lists:** All lists are fully editable by authorized users at all times.

## Build Plan Refinement
1. **Step 1:** Verify scaffold and folder structure. (Current status: Mostly complete)
2. **Step 2:** Finalize Database schema and RLS policies.
3. **Step 3:** Implement List CRUD and Invite system.
4. **Step 4:** Core Real-time editing with optimistic UI.
5. **Step 5:** Offline-first logic with Dexie.
6. **Step 6:** Natural Language parser and Layout modes.
7. **Step 7:** Whop Integration (later phase).
8. **Step 8:** Branding and UI Polish.
