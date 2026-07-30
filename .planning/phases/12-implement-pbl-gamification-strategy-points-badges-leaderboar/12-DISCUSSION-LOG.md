# Phase 12: Implement PBL gamification strategy (points, badges, leaderboard, PRs, milestones) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-29
**Phase:** 12-implement-pbl-gamification-strategy-points-badges-leaderboar
**Areas discussed:** Points System & Firestore Storage, Badges & Milestone Triggers, Leaderboards & Categories, PR Achievements & Profile Integration

---

## Points System & Firestore Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Sync to Member Document | Store a running points total directly on the member's profile in Firestore (updated on each check-in, logged workout, or PR) | ✓ |
| Dynamic Calculation | Compute points on-the-fly by querying all past logs and attendance records when rendering the profile/dashboard | |
| You decide | The developer decides the optimal storage and calculation method | |

**User's choice:** Sync to Member Document

| Option | Description | Selected |
|--------|-------------|----------|
| Standard Balance | 10 points per check-in (attendance), 50 points per completed workout, 100 points per PR hit | ✓ |
| Workout-focused | 5 points per check-in, 100 points per completed workout, 50 points per PR hit | |
| Equal Weight | 25 points for all actions | |
| You decide | The developer sets standard point balances | |

**User's choice:** Standard Balance (10 pts check-in, 50 pts workout, 100 pts PR)

| Option | Description | Selected |
|--------|-------------|----------|
| Fully automated | Points are strictly system-earned; no manual adjustments are allowed | ✓ |
| Owner-only manual adjustments | Add a small adjustment form on the Member Details view for owners only (with a reason field) | |
| Owner and trainer adjustments | Both roles can award or deduct points manually | |
| You decide | The developer handles point adjustment capability | |

**User's choice:** Fully automated

| Option | Description | Selected |
|--------|-------------|----------|
| No limits | Members earn points for every logged action without restriction | |
| Simple anti-abuse caps | Limit check-ins to 1 per day and workouts logged to 2 per day | ✓ |
| Daily point cap | Limit a member to earning a maximum of 250 points in a single day | |
| You decide | The developer implements reasonable anti-abuse limits | |

**User's choice:** Simple anti-abuse caps

---

## Badges & Milestone Triggers

| Option | Description | Selected |
|--------|-------------|----------|
| Core Fitness Milestones | A curated set of badges: Workout counts (50, 100, 250), PR achievements (First PR, set >100kg), and Attendance streaks (3-day, 7-day) | ✓ |
| Simple counts only | Milestone workout counts (10, 50, 100, 250) and check-in counts (50, 100, 250) without PR or streak criteria | |
| Fully customizable settings | Allow the gym owner to create custom badges (name, description, emoji icon) in Settings | |
| You decide | The developer designs a standard set of default badges | |

**User's choice:** Core Fitness Milestones

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded Static List in Client | Define badges, criteria, and icons (using emojis or Google Material Symbols) as a static array in client code (clean, fast, offline-capable) | |
| Stored in Firestore settings | Save badge configs inside the global 'settings' document so description text or icons can be edited by owners in the future | |
| Dedicated badges collection | Store badge definitions in a new 'badges' Firestore collection | ✓ |
| You decide | The developer decides the best storage architecture for badge definitions | |

**User's choice:** Dedicated badges collection

| Option | Description | Selected |
|--------|-------------|----------|
| Consecutive days with rest-day grace period | Check for consecutive calendar days. If a day is missed, check if it's a Sunday or declared gym rest day to allow a 1-day grace period without breaking the streak | ✓ |
| Strict consecutive calendar days | Check if attendance records exist on successive calendar days with no exceptions or grace periods | |
| Weekly consistency streak | Define a streak as completing at least 3 workouts/check-ins in a calendar week | |
| You decide | The developer implements streak calculation logic | |

**User's choice:** Consecutive days with rest-day grace period

| Option | Description | Selected |
|--------|-------------|----------|
| Sync to Member Document | Store an array of unlocked badge IDs (e.g. unlockedBadges: ['consistency-50', 'pr-hitter']) directly on the member's profile document in Firestore | ✓ |
| Dedicated unlocked_badges collection | Create a separate Firestore collection mapping memberId to badgeId and include an unlockedAt date | |
| Calculate dynamically | Compute unlocked badges on-the-fly from workout and check-in history without storing them in a collection | |
| You decide | The developer decides the best storage method for unlocked badges | |

**User's choice:** Sync to Member Document

---

## Leaderboards & Categories

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined Ranges using current Weight | Group members using weight ranges: Under 65kg, 65-75kg, 75-85kg, 85kg+ (best for relative strength comparisons) | ✓ |
| BMI Category Ranges | Group members by their WHO BMI categories (Underweight, Healthy, Overweight, Obese) using their latest progress records | |
| No Weight Categories | Keep the leaderboard simple and only categorize by gender and consistency (overall points) | |
| You decide | The developer designs the leaderboard categorization strategy | |

**User's choice:** Predefined Ranges using current Weight

| Option | Description | Selected |
|--------|-------------|----------|
| Current Streak + Tie-Breaker | Sort members by their current consecutive active day streak (with rest-day grace), and use total check-ins in the current calendar month as a tie-breaker | ✓ |
| Monthly Check-in Count | Sort purely by the total number of gym check-ins in the current calendar month | |
| Total Workouts Logged | Sort by the total count of workouts logged since the member joined | |
| You decide | The developer decides the consistency metric and sorting logic | |

**User's choice:** Current Streak + Tie-Breaker

| Option | Description | Selected |
|--------|-------------|----------|
| Tabbed Leaderboard Panel | A new panel on the main Dashboard page with tabs for 'Points', 'Consistency', and 'Weight Class' (auto-scoping the weight class view to the viewing member's category) | ✓ |
| Dedicated Leaderboards Page | Create a new route and navigation sidebar option '#/leaderboard' to display all rankings and categories in detail | |
| Simple Top-3 Widget | Display a small widget showing only the Top 3 members in points and consistency directly on the dashboard sidebar | |
| You decide | The developer decides the layout and location of the leaderboards | |

**User's choice:** Tabbed Leaderboard Panel

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, private leaderboard toggle | Add a 'Hide me from leaderboards' toggle in the member's self-edit profile form (persisting as privateLeaderboard: boolean). Private profiles are excluded from leaderboards | ✓ |
| No, public rankings for all | All active members are ranked automatically on the leaderboard based on their stats | |
| Opt-in only | Members are excluded by default and must explicitly opt-in to appear on the leaderboards | |
| You decide | The developer handles the leaderboard privacy toggle | |

**User's choice:** Yes, private leaderboard toggle

---

## PR Achievements & Profile Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Save-time PR detection | When saving a workout log, check if the weight for any exercise set is greater than the member's current PR stored in a 'personalRecords' dictionary on their member document. If it is, update the record and trigger the point award/badge check | ✓ |
| Scan history on save | Query past logs for the specific exercise to verify if the new set is a PR, then write the record to a dedicated 'personal_records' collection | |
| Compute dynamically on-the-fly | Scan all past logs in memory when loading the profile page to list the highest weight hit for each exercise | |
| You decide | The developer decides the PR tracking and update method | |

**User's choice:** Save-time PR detection

| Option | Description | Selected |
|--------|-------------|----------|
| My Profile / Progress page tab | Add a 'Badges & PRs' section on the Progress page (keeping all fitness trend and milestone metrics in one place) | ✓ |
| Member Dashboard Panel | Display unlocked badges and top PRs in a dedicated section directly on the Member Dashboard for high visibility | |
| Sidebar Profile Chip | Render badges as small icons directly beneath the member's avatar in the navigation sidebar | |
| You decide | The developer decides where to integrate the achievements view | |

**User's choice:** My Profile / Progress page tab

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, in Member Details | Add an 'Achievements' section to the Member Details view in the Members Directory so owners/trainers can track member progress and milestones | ✓ |
| No, achievements are private to members | Only members can see their own PRs and badges on their profiles | |
| Only owners can view | Exclude trainers from seeing member achievements | |
| You decide | The developer decides the visibility rules for achievements | |

**User's choice:** Yes, in Member Details

| Option | Description | Selected |
|--------|-------------|----------|
| Celebratory modal with confetti | Display an interactive modal showing the badge or PR details with a fun visual confetti burst when the workout is finished or check-in occurs | ✓ |
| Toast notification | Display a standard in-app toast message (e.g. '🏅 Badge Unlocked: Century Club!') without blocking the UI | |
| Quiet update | Update the stats and profile views quietly without any pop-ups or toasts | |
| You decide | The developer decides the celebration UI effect | |

**User's choice:** Celebratory modal with confetti

---

## the agent's Discretion

- Styling of the badges (emoji/Material Symbols) and layout of the Tabbed Leaderboard Panel on the Dashboard.
- Confetti library implementation (e.g. standard canvas-confetti CDN import or vanilla CSS animations).

## Deferred Ideas

- Social interactions (likes/comments on leaderboard rankings or public activity feed items).
- Custom push notifications for other gym members' milestones.
