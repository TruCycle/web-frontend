# AGENTS.md — TruCycle Frontend (Build Rules)

This repo is **Vite + TypeScript** with a **feature-first architecture**.
Agents must follow these rules to keep the codebase fast, modular, and easy to maintain.

---

## 1) Non-Negotiables
- **TypeScript strict stays ON.** No `any` unless unavoidable + explained with a comment.
- **No shortcuts that create tech debt.** If it breaks boundaries, refactor properly.
- **No secrets in the repo.** Never hardcode tokens, API keys, private URLs, or credentials.
- **Don’t paste internal code into public tools/spaces.** Keep company code private.

---

## 2) Folder Structure (Do Not Invent Random Folders)
```
  src/
    app/                  # routes + route shells/layout wiring
    features/             # product features (own UI + logic + api)
    shared/               # reusable building blocks used across features
      ui/                 # generic UI components (Button, Modal, Input, etc.)
      lib/                # plumbing: api client, websocket wrapper, config
      hooks/              # ONLY truly shared hooks (useDebounce, useMediaQuery)
      types/              # shared/global types
      utils/              # shared helpers (pure functions)
```

**Rule of thumb**
- Product-specific code → `features/` 
- Reusable generic code → `shared/` (e.g Buttons, Inputs, Forms, Checkboxes, etc.)
- Route wiring only → `app/`

---

## 3) Feature Ownership Rules (Most Important)
Each feature lives in `src/features/<feature>/` and owns its stuff.

Recommended structure inside a feature:
- `ui/` — feature UI components (not reusable outside the feature by default)
- `api/` — feature API calls (built on `shared/lib/api`)
- `types.ts` — feature types
- `hooks/` — feature hooks (ONLY for that feature)
- `state/` — only if the feature truly needs local state management

**Boundary rule**
- Avoid cross-feature imports.
- If two features need the same UI/component/helper → promote it to `shared/`.

---

## 4) API & Data Rules
- All HTTP is built on **one** client: `shared/lib/api` (base URL, auth header, interceptors).
- Feature API functions live in `features/<feature>/api`.
- Types must match backend responses. No guessing shapes.
- Handle:
  - loading (skeletons)
  - empty states
  - errors (clear messages, graceful fallback)

---

## 5) Performance Rules
- Lazy-load routes where possible.
- Keep components small; avoid unnecessary re-renders.
- Large lists must be paginated/virtualized (especially messaging).
- Don’t ship massive assets (compress images, avoid heavy libraries unless needed).

---

## 6) Messaging Rules (When Working on Messaging)
- WebSocket wrapper lives in `shared/lib/websocket` (single source of truth).
- UI components must not contain raw socket connection logic.
- Messaging must support:
  - smooth scrolling
  - stable reconnect
  - optimistic updates
  - consistent unread state

---

## 7) Notifications Rules
- Notifications are a dedicated feature: `features/notifications`.
- Must support persisted notifications + read/unread + badge count.
- Keep notification fetching/state inside the feature (not scattered across the app).

---

## 8) State Management Policy (Avoid Redux Too Early)
Default approach:
- Local component state first
- Feature-level state next
- Shared/global state only when proven necessary

If a global store is introduced, it must be documented and minimal (auth/session + UI shell state only).

---

## 9) PR Checklist (Before You Ship)
- ✅ Lint + typecheck pass
- ✅ No console errors on main flows
- ✅ No boundary violations (feature imports feature randomly)
- ✅ No secrets in code
- ✅ Clear commit/PR message describing the change

---

**Goal:** ship fast **without** creating future technical debt.
**Owner:** TruCycle Engineering
```
