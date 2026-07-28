---
phase: 11-member-workout-logging-exercise-library-hevy-style
plan: "01"
status: complete
completed: "2026-07-28"
files_changed:
  - modules/utils.js
---

# Phase 11 Plan 01 Summary: Trainer & Owner Read UI for Member Workout Logs, Schedules, and Custom Routines

## What was built

Implemented read-only visibility for trainers and owners into members' weekly workout schedules and custom routines inside the Member Details modal popup in the Members Directory.

## Changes

### `modules/utils.js`

- Updated `showMemberProfileModal` to retrieve `workout_schedules` records matching the member's ID from `context.data`.
- Segmented the schedules into `customRoutines` (type === "routine") and `weeklyScheduleDoc` (type === "schedule").
- Added a responsive grid displaying the member's **Weekly Schedule** (Monday-Sunday daily mappings) and **Custom Routines** (list of routines with structured exercise names/sets/reps) in the "Workout Logs" tab.
- Re-labeled the completed log history header to **Completed Workout Logs** and displayed it cleanly below the active schedules/routines panel.

## Verification

- [x] Weekly schedule and custom routines are retrieved and filtered correctly.
- [x] Weekly schedule matches weekday IDs against routines/templates to render names.
- [x] Custom routines lists structured exercise rows.
- [x] Completed logs are cleanly presented under schedule section.
- [x] `node scripts/smoke-test.mjs` passes without errors.
- [x] Git changes committed successfully.
