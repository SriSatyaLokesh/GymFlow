## RESEARCH COMPLETE

# Phase 17 Research — Database Performance & Scoped Loading

## 1. Current Data Loading Architecture (app.js)

### Full Collection List (16 collections fetched on every load)
```
members, trainers, membership_plans, payments, attendance,
workout_templates, workout_assignments, workout_sessions,
progress_records, reminders, trainer_attendance, membership_pauses,
exercise_library, workout_logs, workout_schedules, badges
```

### reloadData() — The Monolithic Fetch (app.js:219–235)
```javascript
async function reloadData() {
  try {
    const [settings, ...collections] = await Promise.all([
      state.services.data.getSettings(),
      ...collectionNames.map((name) => state.services.data.list(name))
    ]);
    state.settings = settings;
    state.data = Object.fromEntries(collectionNames.map((name, index) => [name, collections[index]]));
    state.error = "";
  } catch (error) {
    state.error = ...;
  }
}
```
**Impact:** Every single tab switch, form save, or user action that calls `refreshView()` triggers all 16 parallel Firestore reads.

### refreshData() — Full Reload with Loading Spinner (app.js:578–587)
```javascript
async function refreshData() {
  state.loading = true;
  state.error = "";
  render();                          // shows full loading screen
  await reloadData();                // fetches ALL 16 collections
  await seedGripGymPlansIfNeeded();
  await seedWorkoutTemplatesIfNeeded();
  state.loading = false;
  render();                          // re-renders full shell
}
```
Used on: auth change (login), retry button, member activation refresh.

### refreshView() — Scoped Re-render but Still Full Data Reload (app.js:591–598)
```javascript
async function refreshView() {
  await reloadData();       // ← still fetches ALL 16 collections!
  if (state.error) {
    render();
    return;
  }
  renderView();             // only re-renders the #view panel
}
```
**Key insight:** `refreshView()` avoids the shell flicker (no sidebar rebuild) but still downloads all 16 collections from Firestore. This is the source of the 1–2s delay on every save action in my-workout.js.

### applyChange() — Already Exists, Rarely Used (app.js:603–614)
```javascript
function applyChange(collectionName, savedDoc) {
  if (!savedDoc) return;
  const list = state.data[collectionName] || [];
  const index = list.findIndex((item) => item.id === savedDoc.id);
  if (index >= 0) {
    list[index] = { ...list[index], ...savedDoc };
  } else {
    list.unshift(savedDoc); // newest first
  }
  state.data[collectionName] = list;
  renderView();             // re-renders only the #view, 0 network reads
}
```
**Key insight:** `applyChange()` calls `renderView()` internally — no extra call needed after it. Just call `applyChange(collection, savedDoc)` and done.

### applyRemoval() — Mirror pattern for deletes (app.js:617–620)
```javascript
function applyRemoval(collectionName, id) {
  state.data[collectionName] = (state.data[collectionName] || []).filter((item) => item.id !== id);
  renderView();
}
```

### State Object Shape
```javascript
const state = {
  route: getRoute(),         // current hash route string e.g. "my-workout"
  profile: null,             // { uid, gymId, role, name, email, ... }
  services: null,            // { mode, auth, data }
  settings: null,            // gym_settings doc
  data: {},                  // { members: [...], payments: [...], ... }
  loading: true,
  authReady: false,
  error: "",
  toast: ""
};
```

### Route Switching (app.js:126–139)
Route changes via `hashchange` event. They call `render()` directly (not `refreshData()`) — so **tab switching does NOT currently trigger a data reload**. The full data is already in memory from the last `reloadData()` call. This means scoped loading must hook into the `hashchange` handler to load scoped data before rendering.

---

## 2. my-workout.js — refreshView Audit

### Total refreshView() calls: 47

### Category A: Pure UI State Changes — NO data needed (safe to replace with renderView())
These calls update module-level flags then re-render. No Firestore interaction at all.
- `context.refreshView()` after tab switch (line 653)
- `context.refreshView()` after `editingSchedule = true` (lines 660, 677)
- `context.refreshView()` after `editingSchedule = false` (line 665)
- `context.refreshView()` after `selectedDay = pill.dataset.day` (line 671)
- `context.refreshView()` after `startWorkoutFromTemplate(t)` — sets local state (lines 723, 779, 801)
- `context.refreshView()` after `startEmptyWorkout()` (line 730)
- `context.refreshView()` after `editingRoutine = {...}` (lines 736, 745)
- `context.refreshView()` after `startWorkoutFromRoutine(r)` (lines 767, 790, 800)
- `context.refreshView()` after `repeatWorkout(log)` (line 811)

**Fix:** Replace with `renderView()` call directly (no data fetch). The module should expose a `renderSelf()` helper, or `context.refreshView()` can be replaced by a lightweight `renderView()` that reads from already-loaded state.

### Category B: After applyChange/applyRemoval — REDUNDANT (remove the refreshView call)
`applyChange()` and `applyRemoval()` already call `renderView()` internally.
- Line 701: `context.applyChange(...)` then `await context.refreshView()` — remove the refreshView
- Line 756: `context.applyRemoval(...)` then `await context.refreshView()` — remove the refreshView

### Category C: After save — Replace with applyChange (safe, same-collection saves)
- Schedule form save (line 703): already calls `applyChange()` then redundantly calls `refreshView()` — remove refreshView
- Delete routine (line 757): calls `applyRemoval()` then `refreshView()` — remove refreshView
- Set toggle saves: save `workout_logs` → `applyChange("workout_logs", saved)`
- Note saves: save `workout_logs` → `applyChange("workout_logs", saved)`
- Exercise add/remove: save `workout_logs` → `applyChange("workout_logs", saved)`
- Workout start/end: save `workout_logs` → `applyChange("workout_logs", saved)`

### Category D: Cross-collection saves — Need careful review (may still need scoped reload)
- Saving `workout_log_entries` when also referencing `workout_logs` state — if both are in scope for `my-workout` route, `applyChange()` for each collection works fine
- Saving badge/points changes that trigger leaderboard recalculation — these touch `badges` collection which is in globals; `applyChange("badges", saved)` works

### Save Pattern Used in my-workout.js
```javascript
const saved = await context.services.data.save(collections.workoutLogs, logDoc);
context.applyChange(collections.workoutLogs, saved);
// WRONG pattern: context.refreshView() immediately after ^
```
The `collections` object maps to collection name strings (e.g., `collections.workoutLogs === "workout_logs"`).

---

## 3. Firebase Offline Persistence

### SDK Version
Firebase **v10.12.5** (Modular/Functional API — NOT compat). Loaded via CDN:
```javascript
import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
```

### Current Initialization (lib/firebase-init.js:57–67)
```javascript
async function createFirebaseServices(firebaseConfig) {
  const [{ initializeApp }, authApi, firestoreApi] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);

  const app = initializeApp(firebaseConfig);
  const auth = authApi.getAuth(app);
  const db = firestoreApi.getFirestore(app);  // ← plain getFirestore, no persistence
  // ...
}
```
No offline persistence currently configured.

### Correct API for Firebase v10 (Modular)
For v10 modular SDK, `enableIndexedDbPersistence` is deprecated. The correct approach is `initializeFirestore` with `localCache`:

```javascript
// Import persistentLocalCache + persistentMultipleTabManager from firestore
const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = firestoreApi;

let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()  // supports multiple tabs
    })
  });
} catch (err) {
  // Fallback to plain Firestore if persistence fails
  db = firestoreApi.getFirestore(app);
  console.warn("Firestore persistence not available:", err.code || err.message);
}
```

**Why `persistentMultipleTabManager`:** This is the v10 answer to the old `failed-precondition` multi-tab issue — it natively supports multiple tabs sharing the same IndexedDB cache. No need for try/catch on `failed-precondition` separately.

**Alternative (simpler):** Use `enableIndexedDbPersistence` from the `firebase/firestore` compat path — but this is officially deprecated in v10+. Use `initializeFirestore` approach above.

**Fallback contract (from discussion decisions):** If `initializeFirestore` throws for any reason (unsupported browser, e.g. Safari private mode, or environment issues), catch the error, log to console, and fall back to `firestoreApi.getFirestore(app)`. This is silent — no UI indicator.

---

## 4. payments.js & renewals.js Audit

### payments.js — 5+ refreshView() calls (lines 393, 434, 441, 452, 458)
Key patterns:
- Line 393: After recording a payment → save `payments` → should use `applyChange("payments", saved)`
- Line 434: After deleting payment → `applyRemoval("payments", id)` already present? Check if redundant
- Line 441: After marking refund → save `payments` → `applyChange`
- Line 452/458: After cancel/close → pure UI state change → `renderView()` only

### renewals.js — 3 refreshView() calls (lines 143, 154, 161)
Key patterns:
- Line 143: After renewal save (writes to `payments` + updates `members`) → cross-collection; needs `applyChange` for both
- Line 154: After "mark renewed" → save `members` → `applyChange("members", saved)`
- Line 161: After cancel → pure UI state → `renderView()` only

---

## 5. withButtonLoading() — Per-Row Spinner Extension

### Current Implementation
```javascript
// From withButtonLoading usage in my-workout.js:
await withButtonLoading(submitBtn, async () => {
  // async work
}, "Saving...");
```
`withButtonLoading` exists in `modules/utils.js` and adds a loading state to a button element.

### Extension Approach for Per-Row Spinners
Since rows are HTML string-rendered (not component instances), the per-row spinner approach:

```javascript
// In bind() handlers, before the save:
function setRowSaving(row, isSaving) {
  if (!row) return;
  if (isSaving) {
    row.classList.add("saving");
    const actions = row.querySelector(".row-actions");
    if (actions) actions.dataset.prevContent = actions.innerHTML;
    // Insert spinner icon into actions
    const spinner = row.querySelector(".row-actions");
    if (spinner) spinner.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span>';
  } else {
    row.classList.remove("saving");
    const actions = row.querySelector(".row-actions");
    if (actions && actions.dataset.prevContent) {
      actions.innerHTML = actions.dataset.prevContent;
    }
  }
}
```

Add CSS to main.css:
```css
.table-row.saving { opacity: 0.7; pointer-events: none; }
.spin-icon { animation: spin 0.8s linear infinite; display: inline-block; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
```

**Simpler alternative:** Use a CSS-only approach: add `.saving` class to the row, hide the action buttons, show a `sync` icon from `::after` pseudo-element. The bind handler does `const row = btn.closest(".table-row"); row?.classList.add("saving")` before the save, and the class auto-removes when `applyChange()` triggers `renderView()` (which rebuilds the HTML).

---

## 6. Scoped Loading — Implementation Architecture

### Route-to-Collections Map (from CONTEXT.md decisions)
```javascript
const GLOBAL_COLLECTIONS = ["members", "trainers", "membership_plans"];
// settings is always loaded via getSettings()

const SCOPED_COLLECTIONS = {
  dashboard:         ["payments", "attendance"],
  members:           [],  // already in globals
  leaderboard:       ["attendance", "progress_records"],
  plans:             [],  // membership_plans in globals
  payments:          ["payments"],
  renewals:          ["membership_pauses"],
  reminders:         ["membership_pauses"],
  trainers:          ["workout_assignments", "workout_sessions"],
  attendance:        ["attendance", "trainer_attendance"],
  workouts:          ["workout_templates", "workout_assignments", "workout_sessions", "workout_logs", "workout_log_entries", "exercise_library", "badges"],
  progress:          ["progress_records"],
  reports:           ["payments", "attendance", "progress_records"],
  "my-membership":   [],  // only needs members (globals)
  "my-payments":     ["payments"],
  "trainer-checkin": ["trainer_attendance"],
  "my-checkins":     ["trainer_attendance"],
  "trainer-members": ["workout_assignments", "workout_sessions", "workout_templates"],
  "my-workout":      ["workout_templates", "workout_assignments", "workout_sessions", "workout_logs", "workout_schedules", "exercise_library", "badges"],
  profile:           [],
  settings:          []
};
```

### Proposed loadScopedData(route) Implementation
```javascript
async function loadScopedData(route = state.route) {
  const scoped = SCOPED_COLLECTIONS[route] || [];
  if (!scoped.length) return; // globals already loaded
  try {
    const results = await Promise.all(scoped.map(name => state.services.data.list(name)));
    scoped.forEach((name, i) => { state.data[name] = results[i]; });
    state.error = "";
  } catch (error) {
    console.error("Failed to load scoped data for route:", route, error);
    state.error = /offline|unavailable|network/i.test(error?.message || "")
      ? "Can't reach the database. Check your connection, then retry."
      : error?.message || "Could not load workspace data.";
  }
}

async function loadGlobalData() {
  try {
    const [settings, ...results] = await Promise.all([
      state.services.data.getSettings(),
      ...GLOBAL_COLLECTIONS.map(name => state.services.data.list(name))
    ]);
    state.settings = settings;
    GLOBAL_COLLECTIONS.forEach((name, i) => { state.data[name] = results[i]; });
    state.error = "";
  } catch (error) { /* same pattern */ }
}
```

### hashchange Hook Integration
```javascript
window.addEventListener("hashchange", async () => {
  state.route = getRoute();
  // ... reset module state ...
  await loadScopedData(state.route);  // ← add this before render
  render();
});
```

---

## 7. Implementation Risks & Notes

### Risk 1: workout_log_entries Collection
`workout_log_entries` appears in `SCOPED_COLLECTIONS.workouts` but NOT in the original `collectionNames` array in app.js. It needs to be added to the scoped map carefully — if the collection doesn't exist yet, `data.list()` returns `[]` which is safe.

### Risk 2: applyChange for Cross-Collection Saves (renewals)
Renewal saves write to both `payments` and `members`. Both can use `applyChange()` independently:
```javascript
const savedPayment = await context.services.data.save("payments", paymentDoc);
const savedMember = await context.services.data.save("members", memberDoc);
context.applyChange("payments", savedPayment);
context.applyChange("members", savedMember);
// Note: applyChange calls renderView() each time. Second call wins (but both state updates land).
```

### Risk 3: my-workout.js Pure UI refreshView Calls
Many `refreshView()` calls in my-workout.js are purely for local state transitions (tab switch, start workout, edit routine) — these set module-level properties then need a re-render. These should call `renderView()` directly (no data fetch). However, `renderView()` is defined in `app.js` scope and not exposed via `context`. Two options:
1. Expose `context.renderView = renderView` in `makeContext()` (cleanest)
2. Use `context.applyChange` with no-op (hacky)
3. Replace with `context.refreshView()` but upgrade `refreshView()` to be smarter: only reload scoped data if a flag is set

**Recommendation:** Add `renderView` to `makeContext()` as `context.renderView = renderView`. This allows modules to trigger a re-render without any data fetch.

### Risk 4: Seeding Functions
`refreshData()` calls `seedGripGymPlansIfNeeded()` and `seedWorkoutTemplatesIfNeeded()` after `reloadData()`. These must remain in `refreshData()` (the boot/login flow) but should NOT run on every tab switch.

### Risk 5: Firebase Persistence — experimentalForceLongPolling
The current app uses `experimentalForceLongPolling: true` to handle VPN/ad-blocker issues. This may conflict with IndexedDB persistence initialization in some environments. Test offline persistence carefully.

### Risk 6: workout_schedules vs workout_logs Dependency
`my-workout.js` uses both `workout_schedules` and `workout_logs` in the same view. Both must be in the same scoped batch load. Current plan handles this correctly.

### Risk 7: reminders Collection
`reminders` is in `collectionNames` but used only in the `reminders` route. The performance review's proposed scope map omits it. Include `reminders` in the `reminders` route scoped collections.
