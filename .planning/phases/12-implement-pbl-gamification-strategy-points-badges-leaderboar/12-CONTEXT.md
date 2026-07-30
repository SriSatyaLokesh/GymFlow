# Phase 12: Implement PBL gamification strategy (points, badges, leaderboard, PRs, milestones) - Context

**Gathered:** 2026-07-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a gamification system (PBL - Points, Badges, Leaderboards, PRs) for GymFlow to engage members. This includes automated point accumulation for gym attendance, completed workouts, and Personal Records (PRs), custom badges saved in a dedicated collection, leaderboards on the dashboard (segmented by gender, weight ranges, and consistency streaks), save-time PR detection, and profile pages showing achievements to members, trainers, and owners.

</domain>

<decisions>
## Implementation Decisions

### Points System & Firestore Storage
- **D-01:** Points are stored directly as a running total on the member's profile document in Firestore as `members.points`. — **Reversibility:** costly — changing the points calculation strategy later would require a database migration or a full recalculation of historical logs.
- **D-02:** Point allocation: 10 points per check-in (attendance), 50 points per completed workout log, and 100 points per exercise PR hit.
- **D-03:** Point updates are fully automated and event-driven. Manual administrative adjustments (manual point additions or deductions) are not allowed.
- **D-04:** Anti-abuse cap: a maximum of 1 check-in and 2 workouts logged will count for points per day.

### Badges & Milestone Triggers
- **D-05:** Core fitness milestones: Workout count milestones (50, 100, 250 workouts), PR achievements (First PR hit), and Attendance streaks (3-day, 7-day consecutive).
- **D-06:** Badge definitions (name, description, icon) are stored in a dedicated `badges` Firestore collection. — **Reversibility:** costly — altering the schema of badges or migrating definitions would affect multiple UI modules.
- **D-07:** Streaks are calculated using consecutive calendar days, allowing a 1-day grace period for Sundays or declared gym rest days (does not break the streak).
- **D-08:** Unlocked badges are stored as an array of badge IDs directly on the member's profile document as `members.unlockedBadges`. — **Reversibility:** costly — migrating unlocked badges to a separate mapping collection later would require database refactoring.

### Leaderboards & Categories
- **D-09:** Predefined weight categories: Under 65kg, 65-75kg, 75-85kg, and 85kg+. Weight is determined from the member's current weight.
- **D-10:** Consistency rankings are sorted by the member's current consecutive active day streak, with the total check-ins in the current calendar month as the tie-breaker.
- **D-11:** Leaderboards are rendered as a new Tabbed Leaderboard Panel on the main Dashboard, featuring tabs for 'Points', 'Consistency', and 'Weight Class' (auto-scoping the weight class view to the viewing member's category).
- **D-12:** Privacy option: a 'Hide me from leaderboards' toggle is added to the member's profile edit form (persisted as `privateLeaderboard: boolean`). Private profiles are excluded from leaderboards.

### PR Achievements & Profile Integration
- **D-13:** Personal Records (PRs) are tracked at save-time. When a workout log is saved, the set weights are checked against a `members.personalRecords` dictionary (maps exercise names to highest weights). If exceeded, the dictionary is updated, points are awarded, and badge eligibility is evaluated.
- **D-14:** Badges and PR achievements are displayed in a new 'Badges & PRs' tab/section on the member's Progress page.
- **D-15:** Trainers and owners can view a member's achievements (PRs and unlocked badges) in the Member Details view of the Members Directory.
- **D-16:** Confetti celebration modal displays the badge or PR details with an animated confetti burst when the workout is finished or check-in occurs.

### the agent's Discretion
- The exact visual styling of badges (using SVG emojis or Material Symbol icons) and the UI/layout design of the Tabbed Leaderboard Panel.
- Confetti library implementation (e.g. standard canvas-confetti CDN import or vanilla CSS animations).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Modules
- `modules/dashboard.js` — Main dashboard where the tabbed leaderboard panel will be rendered.
- `modules/my-workout.js` — Workout logging where save-time PR detection, point earning, and badge checking triggers are invoked.
- `modules/attendance.js` — Check-in where points and streak checks are triggered.
- `modules/progress.js` — Member progress tracking where the new 'Badges & PRs' tab will be added.
- `modules/members.js` — Directory and details view where private leaderboard toggle is added to edit form and Achievements section is added to Details view.

### Database & Security
- `lib/firebase-init.js` — Collection registrations for the new `badges` collection and local demo mode data structures.
- `firestore.rules` — Access security rules for the new `badges` collection and updated fields on `members`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tab styling patterns in `modules/my-workout.js` can be reused for the tabbed leaderboard on the Dashboard.
- `applyChange()` and `applyRemoval()` in `modules/utils.js` for local in-memory state updates.
- Avatar rendering patterns (e.g., `avatar-circle`) in `modules/dashboard.js`.

### Established Patterns
- All views are modules exporting `{ render(context), bind(root, context) }` structure.
- Navigation is driven by hash-routing (`location.hash`).
- Multi-tenant data isolation using the `gymId` field.

### Integration Points
- Updating the member model save/update points and unlocked badges inside `my-workout.js` (Finish Workout) and `attendance.js` (Check In).
- Inserting leaderboard markup in `dashboard.js`.
- Adding Achievements tab in `progress.js` and `members.js` details view.

</code_context>

<specifics>
## Specific Ideas

- Confetti effect can be imported via a CDN script tag in `index.html` (e.g., canvas-confetti) or built as a pure CSS micro-animation.

</specifics>

<deferred>
## Deferred Ideas

- Social interactions (likes/comments on leaderboard rankings or public activity feed items).
- Custom push notifications for other gym members' milestones.

</deferred>

---

*Phase: 12-implement-pbl-gamification-strategy-points-badges-leaderboar*
*Context gathered: 2026-07-29*
