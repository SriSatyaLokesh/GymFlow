# Phase 18: Psychological Principles & UX Optimization - Context

**Gathered:** 2026-08-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement six core psychological principles across the GymFlow application:
1. **Smart Defaults**: Pre-fill common choices in forms to reduce cognitive load.
2. **The Goal Gradient Effect**: Implement a profile completion checklist starting at 20% to build momentum.
3. **Reciprocity / IKEA & Endowment Effects**: Introduce a local Guest Mode enabling BMI calculation and workout template building before signup, with automated data migration on registration.
4. **Loss Aversion**: Frame alerts and warnings around losing progress or streak metrics rather than gaining benefits.
5. **The Contrast Effect**: Display a high-value owner-configured VIP plan first in plans listings as an anchor.

Out of scope: Payment gateway processing, multi-branch scaling, or adding social feeds.

</domain>

<decisions>
## Implementation Decisions

### 1. Guest Mode Scope & Data Persistence
- **D-01:** Enable only the BMI Visual Meter (`progress.js`) and Workout Template Builder (`my-workout.js`) in Guest Mode. Other member pages (e.g. attendance, payments) are disabled or simulated.
- **D-02:** Persist guest templates and progress records indefinitely in `localStorage` under `gymflow.guest.*` namespaces so they survive tab closure.
- **D-03:** When a guest user completes registration (signup), automatically migrate their local guest workout templates and progress records into their new permanent Firestore/local databases and clear the guest localStorage keys.
  — **Reversibility:** costly — changing migration logic later requires database cleanups or profile adjustments.

### 2. Goal Gradient Checklist
- **D-04:** Add a "Profile Completeness & Readiness" checklist on the Member Dashboard.
- **D-05:** Pre-complete "Account Activated" by default, starting the progress bar at **20% momentum**.
- **D-06:** Checklist items increments:
  - Account Activated (20% - Pre-checked)
  - Complete Profile Details (20% - checks for DOB and Address)
  - Record Initial Measurements (20% - checks for initWeight)
  - Add Emergency Contact (20% - checks for emergencyName and emergencyPhone)
  - Log Your First Workout (20% - checks if `workout_logs` collection contains >=1 logs)

### 3. Contrast Effect & Pricing Anchor
- **D-07:** Add fields under Gym Settings (`settings.js` / `settings` module) to let the owner configure the VIP/Anchor plan details: `vipPlanName`, `vipPlanPrice`, `vipPlanDescription`, and `vipPlanEnabled`.
- **D-08:** Render this configured VIP plan as a prominent visual anchor card first in the plans list (for Guest Mode pricing preview and member view), followed by standard plans.

### 4. Loss Aversion & Alerts Copy
- **D-09:** Add warning dialogs framing loss when a Guest tries to leave/sign out without registering: "⚠️ Loss Warning: You are about to lose your custom workout routines and BMI graphs. Register a free account now to protect your work!"
- **D-10:** Frame member expiration warnings around losing streaks and points: "⚠️ Expiry Warning: Your 15-day attendance streak and consistency points ledger will freeze. Renew today to protect your progress."
- **D-11:** Frame unsaved workout session exits around data loss: "⚠️ You will lose your current workout log and active progress. Save now to log your consistency points!"

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navigation & Services
- `app.js` — Navigation routes, reloadData, and makeContext overriding layer.
- `lib/firebase-init.js` — Authentication states and database wrappers.

### Forms & Views
- `modules/auth.js` — Login page, signup templates, guest mode hook.
- `modules/dashboard.js` — Dashboard panels, member dashboard rendering.
- `modules/my-membership.js` — Plans visual catalog and upgrade anchors.
- `modules/payments.js` — Payment forms and default inputs.
- `modules/utils.js` — Form inputs, default selections, and shared fields.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `context.applyChange(collection, savedDoc)` — Updates local state without remote read; useful for saving guest state locally.
- `renderSharedMemberFields()` — Renders emergency, DOB, and measurements in utils.js. Update here to add defaults.
- `withButtonLoading()` — Reusable loader spinner wrapper in utils.js.

### Established Patterns
- State management: everything is rendered via components exporting `render` and `bind`.
- Hash routing: `location.hash` changes route state. Guest mode must intercept Hashchange or navigate gracefully.

</code_context>

<specifics>
## Specific Ideas

- When a user logs in as a guest, `state.profile` can be set to:
  `{ role: "guest", uid: "guest-user", name: "Guest Explorer", gymId: "guest-gym" }`
- Guest local storage keys: `gymflow.guest.workout_templates` and `gymflow.guest.progress_records`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-psychological-principles-ux-optimization*
*Context gathered: 2026-08-11*
