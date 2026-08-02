# Phase 17: Database Performance Optimization & Scoped Loading - Context

**Gathered:** 2026-08-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate the monolithic fetch-everything pattern and replace it with tab-scoped Firestore loading, optimistic local state updates (especially in the workout logger), and Firestore IndexedDB offline persistence. The app should feel instant for members logging sets and owners recording payments — without full-page reload spinners on every action.

Subcollection data-model migration is explicitly **out of scope** for this phase.

</domain>

<decisions>
## Implementation Decisions

### 1. Tab-Scoped Loading

- **D-01:** Always-loaded globals on boot: `settings`, `members`, `trainers`, `membership_plans`. Everything else is scoped per route. — **Reversibility:** costly — changing the global set later would require auditing every module that assumes a collection is pre-loaded.
- **D-02:** Scoped collections load on **every tab visit** (always fresh, no stale-while-revalidate complexity). Simplicity over micro-optimization.
- **D-03:** Tab scope map (from performance review + user confirmation):
  - `dashboard`: `payments`, `attendance`
  - `payments` / `my-payments`: `payments`
  - `workouts` / `my-workout`: `workout_templates`, `workout_assignments`, `workout_sessions`, `workout_logs`, `workout_log_entries`, `exercise_library`
  - `progress`: `progress_records`
  - `attendance` / `trainer-checkin`: `attendance`, `trainer_attendance`
  - `members`: *(already in globals)*
  - `renewals` / `reminders`: `membership_pauses`
  - `leaderboard`: `attendance`, `progress_records`
  - `reports`: `payments`, `attendance`, `progress_records`
  - `trainers`: `workout_assignments`, `workout_sessions`
  - `settings` / `backup-restore`: *(globals only)*

### 2. Optimistic Updates

- **D-04:** Priority order: `my-workout.js` first (47 `refreshView()` calls — 1–2s delays per set tap), then `payments.js`, `renewals.js`, and remaining modules in a follow-up sweep.
- **D-05:** `context.applyChange(collection, savedDoc)` is the canonical pattern. After every save, call `applyChange()` to update in-memory state and re-render locally. Do NOT call `refreshView()` after saves that don't require fresh data from other collections.
- **D-06:** In-flight save UX: show a subtle per-element spinner on the **specific element being saved** (the set row, the form button). Do NOT show the full-page "Syncing workspace..." loader for saves. Full-page loader is reserved for initial tab load only.

### 3. Firestore Offline Cache

- **D-07:** Enable `IndexedDB` persistence (`enableIndexedDbPersistence`) silently in `lib/firebase-init.js`. Catch `failed-precondition` (multiple tabs) and `unimplemented` (unsupported browser) — log to console only, continue online-only without any user-facing error. No UI indicator.

### 4. Subcollections (Deferred)

- **D-08:** Subcollection migration is **out of scope** for Phase 17. Use flat collections + `where('gymId', '==', gymId)` scoped queries with tab-scoped loading to address over-fetching. Revisit subcollections when/if billing becomes a concern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data Layer
- `app.js` — Contains `reloadData()`, `refreshView()`, `applyChange()`, `applyRemoval()`, route switching logic, and the `state` object. This is the primary target for scoped loading changes.
- `lib/firebase-init.js` — Firebase initialization and `createServices()` abstraction. Target for enabling IndexedDB persistence.

### Performance Analysis
- `C:/Users/SatyaK/.gemini/antigravity-ide/brain/7e313ba3-5a78-4506-a867-f05a53943709/firebase_performance_review.md` — Full bottleneck analysis, remediation roadmap with code examples, and projected performance gains table. Planner MUST read this.

### Project Decisions
- `.planning/PROJECT.md` §"Key Design Decisions" — D-3: "Optimistic local state — `applyChange()`/`applyRemoval()` update in-memory state after a save without a round-trip Firestore read." This phase implements the original intent.

### High-Priority Target Modules
- `modules/my-workout.js` — 47 `refreshView()` calls. Primary optimistic update target.
- `modules/payments.js` — Multiple `refreshView()` calls on payment save/cancel flows.
- `modules/renewals.js` — `refreshView()` on renewal, mark-renewed, and cancel actions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `context.applyChange(collection, savedDoc)` — Already defined in app.js. Replaces a Firestore round-trip with an in-memory update. Ready to use — just needs to be called instead of `refreshView()`.
- `context.applyRemoval(collection, id)` — Same pattern for deletes.
- `withButtonLoading(btn, fn)` in `modules/utils.js` — Adds spinner to a button during async ops. Extend this pattern for per-element row spinners.

### Established Patterns
- Dual mode (Firebase / localStorage demo): all changes must go through `context.services.data.*` — never call Firestore APIs directly from modules.
- Hash routing (`location.hash`) — route is already parsed as `state.route`. The scoped loader reads `state.route` to determine which collections to fetch.
- `gymId` isolation — every Firestore collection is already scoped by `gymId`. Tab-scoped loading doesn't break this.

### Integration Points
- `reloadData()` in `app.js` → break into `loadGlobalData()` (boot) + `loadScopedData(route)` (per tab) pattern.
- Route navigation handler in `app.js` → call `loadScopedData(newRoute)` before `render()`.
- `refreshView()` in modules → replace with `applyChange()` + local `render()` re-trigger where possible.

</code_context>

<specifics>
## Specific Ideas

- The performance review (canonical ref above) includes working code snippets for `reloadData()` scoped refactor, `applyChange()` usage, and `enableIndexedDbPersistence()` — planner should use these as starting implementations.
- Per-element spinner: apply a CSS class (e.g. `.saving`) to the row/element, show a spinner icon, remove on completion or error.

</specifics>

<deferred>
## Deferred Ideas

- **Subcollection migration** — nest `workout_logs`, `progress_records`, `workout_sessions` under `/members/{memberId}/...` for per-user scoping. Deferred from Phase 17 due to breaking data-model change and migration risk. Revisit in a future "Firestore v2" phase.
- **Server-side pagination** — Firestore `query(..., limit(20))` for large member/payment lists. Out of scope for Phase 17.
- **Full optimistic sweep** — `payments.js`, `renewals.js`, `members.js`, `trainers.js`, and remaining modules after `my-workout.js` is done. Plan as Phase 17b or Phase 18.

</deferred>

---

*Phase: 17-database-performance-optimization-scoped-loading*
*Context gathered: 2026-08-02*
