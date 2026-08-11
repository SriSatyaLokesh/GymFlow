# Phase 18: Psychological Principles & UX Optimization - Research

**Date:** 2026-08-11
**Status:** Completed

---

## 1. Guest Mode Architecture & Scope

To implement **Reciprocity** and **IKEA/Endowment Effects**, we must enable Guest Mode without authentication.

### Local Mocking of Data Layer
Instead of fetching data from Firebase Firestore or creating a local mock account in the backend database, we will intercept requests at the `app.js` context level inside `makeContext()`.

#### app.js Integration Points:
- Route registration: Add `"guest"` role to nav items `dashboard`, `my-workout`, `progress`, `my-membership`, `profile`.
- In `reloadData(targetRoute)`:
  If `state.profile.role === "guest"`, do not invoke Firebase or Local Services. Instead, populate `state.data` from `localStorage` under keys `gymflow.guest.{collection}`.
- In `makeContext()`:
  Wrap `save()` and `remove()` methods on the services.data object to intercept calls if `state.profile.role === "guest"`. They will write directly to `localStorage` and update `state.data` in-memory.

#### Guest Mode Signup & Data Migration:
- On registration, if guest data exists in `localStorage`, we migrate it:
  1. Retrieve `gymflow.guest.workout_templates` and `gymflow.guest.progress_records`.
  2. For each record, replace placeholder guest owner ID with the new user's `uid` and target `gymId`.
  3. Execute standard `save()` commands to upload them to Firestore or the local DB.
  4. Clear the localStorage guest keys.

---

## 2. Goal Gradient Checklist Logic

The member dashboard (`modules/dashboard.js` -> `renderMemberDashboard`) will calculate and display a profile completeness indicator.

### Calculations:
```javascript
const checklist = [
  { label: "Account Activated", completed: true },
  { label: "Complete Profile Details", completed: !!(me.dateOfBirth && me.address) },
  { label: "Record Initial Measurements", completed: !!(me.initWeight) },
  { label: "Add Emergency Contact", completed: !!(me.emergencyName && me.emergencyPhone) },
  { label: "Log Your First Workout", completed: (context.data.workout_logs || []).length > 0 }
];
const completedCount = checklist.filter(c => c.completed).length;
const completionPercentage = completedCount * 20; // 20% to 100%
```
The progress bar will render using standard CSS styles:
```html
<div class="progress-bar-container" style="background:var(--line); border-radius:var(--r-sm); height:8px; overflow:hidden;">
  <div class="progress-bar-fill" style="width:${completionPercentage}%; height:100%; background:linear-gradient(90deg, var(--accent), var(--teal)); transition:width 0.4s ease;"></div>
</div>
```

---

## 3. Contrast Effect Pricing Anchor Settings

To support owner-configured VIP pricing:
- Add a new "VIP Pricing Anchor" card in Gym Settings (`modules/settings.js`).
- Fields:
  - `vipPlanName` (text, default: "VIP Personal Coaching Package")
  - `vipPlanPrice` (number, default: 5000)
  - `vipPlanDescription` (textarea, default: "1-on-1 private trainer, customized nutrition and supplement guidelines, weekly body metrics tracking, and priority equipment booking.")
  - `vipPlanEnabled` (checkbox, default: true)
- In `modules/my-membership.js`, if the VIP plan is enabled, display it at the very top of the plans catalog with a premium visual design (shadow, badge, accent border) to anchor prices.

---

## 4. Loss Aversion Event Hooks

 we will frame warnings as losing progress:
1. **Guest Mode Exits**:
   Intercept hash change to `#/logout` or click on Sign Out in `app.js` if role is guest:
   Show dialog: "⚠️ Loss Warning: You are about to lose your custom workout routines and BMI graphs. Register a free account now to protect your work!"
2. **Unsaved Workout Progress**:
   In `modules/my-workout.js`, track active workout edits. If the user tries to navigate away or close the tab while an active workout is logged in memory, show a confirmation prompt.
3. **Plan Expiration Warnings**:
   Update dashboard messages to emphasize loss of streaks and consistency points rather than just showing dates.

---

## Validation Architecture

Downstream validation will verify:
1. Form defaults are set correctly.
2. Guest mode local storage updates correctly and prevents Firestore API writes.
3. Onboarding progress bar matches state completeness.
4. Loss warnings trigger under correct user actions.
