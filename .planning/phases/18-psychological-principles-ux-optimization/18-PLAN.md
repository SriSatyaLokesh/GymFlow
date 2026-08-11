# Phase 18: Psychological Principles & UX Optimization - Plan

**Status:** Ready for execution
**Depends on:** Phase 17

---

## Plan Waves & Tasks

### Wave 1: Smart Defaults, Guest Router & Local Guest Storage

#### Task 18-01-01: Smart Defaults
- **File**: `modules/utils.js` (edit `renderSharedMemberFields`), `modules/members.js` (edit `renderMemberForm`), `modules/payments.js` (edit `render` in `activeView === "add"`).
- **Goal**: Pre-fill common defaults to combat decision fatigue.
  - Member form: default `bloodGroup` to `O+`, `activityLevel` to `Moderately Active`, `fitnessExperience` to `Beginner`, `gymGoal` to `General Fitness`, and `whatsappOptIn` to `true` (checked) for new members.
  - Payment form: default `method` to `UPI`, `status` to `Paid`, and `collectedBy` to the active profile name.
- **Verification**: Run `node scripts/smoke-test.mjs`. Open "Add Member" and "Record Payment" forms; check that default values are correctly pre-filled.

#### Task 18-01-02: Guest/Explorer Router & Local Persistence
- **File**: `app.js`, `modules/auth.js`.
- **Goal**: Enable frictionless entry (Reciprocity/Endowment) by letting users try the app as a guest.
  - In `auth.js`, add a prominent button/link: `Try GymFlow as a Guest`. When clicked, it sets the session profile as guest:
    `state.profile = { role: "guest", uid: "guest-user", name: "Guest Explorer", gymId: "guest-gym" }`
    and redirects to the dashboard.
  - In `app.js`, add `"guest"` role to the navigation structure for `dashboard`, `my-workout`, `progress`, `my-membership`, `profile` views.
  - In `app.js` `reloadData()`, if role is guest, skip DB requests and populate mock local data from `localStorage` under keys `gymflow.guest.*`.
  - In `app.js` `makeContext()`, wrap `services.data.save` and `services.data.remove` to save/delete locally for guest profiles.
  - Implement automated guest-to-permanent account migration on registration: check for guest local storage keys on signup, migrate templates and progress records, then clear keys.
- **Verification**: Run `node scripts/smoke-test.mjs`. Click "Try Guest Mode", verify redirection to dashboard, add a workout template, verify it saves locally and loads after reload.

---

### Wave 2: Onboarding Goal Gradient, Pricing Contrast Anchor, and Loss Aversion

#### Task 18-02-01: Onboarding Goal Gradient Checklist
- **File**: `modules/dashboard.js` (edit `renderMemberDashboard`).
- **Goal**: Build momentum (Goal Gradient Effect) via an interactive progress checklist.
  - Add a completeness checklist widget at the top of the dashboard.
  - Pre-check "Account Activated" (+20% progress) on load to avoid a 0% start.
  - Auto-check: "Complete Profile Details" (DOB & Address set), "Record Initial Measurements" (initWeight set), "Add Emergency Contact" (contact info set), and "Log Your First Workout" (at least 1 logged workout).
- **Verification**: Run `node scripts/smoke-test.mjs`. View Member Dashboard; verify progress bar shows 20% on fresh signup, and increments correctly as details are added.

#### Task 18-02-02: Contrast Effect Pricing Settings & Catalog Anchor
- **File**: `modules/settings.js`, `modules/my-membership.js`.
- **Goal**: Contrast Effect anchoring.
  - In settings page, add fields: `vipPlanName` (default: "VIP Personal Coaching Package"), `vipPlanPrice` (default: 5000), `vipPlanDescription` (default: "1-on-1 private trainer, customized nutrition and supplement guidelines, weekly body metrics tracking, and priority equipment booking."), and `vipPlanEnabled` (default: true).
  - In `modules/my-membership.js`, if the VIP plan is enabled, display it at the very top of the plans catalog with a premium visual design (shadow, badge, accent border) to anchor prices.
- **Verification**: Run `node scripts/smoke-test.mjs`. Log in as owner, customize VIP settings, log in as member/guest, check that the VIP plan is displayed at the top.

#### Task 18-02-03: Loss Aversion Warnings & Copy
- **File**: `app.js`, `modules/my-workout.js`, `modules/dashboard.js`, `modules/my-membership.js`.
- **Goal**: Prevent abandonment and encourage renewals (Loss Aversion).
  - In `app.js` logout, if guest role: show warning "⚠️ Loss Warning: You are about to lose your custom workout routines and BMI graphs. Register a free account now to protect your work!".
  - In `modules/my-workout.js` template/logging: check if there are unsaved edits. Confirm exit if they try to navigate away.
  - Update membership expiration alerts in `dashboard.js` and `my-membership.js` to highlight loss of streak and points: "⚠️ Expiry Warning: Your 15-day attendance streak and consistency points ledger will freeze. Renew today to protect your progress."
- **Verification**: Run `node scripts/smoke-test.mjs`. Try to log out from guest mode; verify dialog warning triggers. Try to navigate away during workout editing; verify warning.
