---
phase: 12
slug: implement-pbl-gamification-strategy-points-badges-leaderboar
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-29
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js Custom Script |
| **Config file** | none |
| **Quick run command** | `node scripts/smoke-test.mjs` |
| **Full suite command** | `node scripts/smoke-test.mjs` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/smoke-test.mjs`
- **After every plan wave:** Run `node scripts/smoke-test.mjs`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | D-01 / D-06 | T-12-01 | Firestore rules enforce that members can only write their own points and badges, and sameGym rules are enforced. | Integration | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | D-11 | — | Tabbed Leaderboard Panel renders on Dashboard without crashes | Smoke | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | D-14 / D-15 | — | Achievements sections render on Member details and Progress tabs | Smoke | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure (`scripts/smoke-test.mjs`) covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Member points, badges, and PRs update correctly | D-01 / D-05 | Client-side database sync validation | Log a workout or check-in, verify that points increment in Firestore, and unlocked badges/PRs are stored on the member document. |
| Streaks computed with Sunday grace period | D-07 | Date manipulation testing | Seed check-in dates for Monday, Tuesday, Thursday. Verify Thursday check-in detects skipped Wednesday as breaking the streak, while skipped Sunday retains the streak. |
| Tabbed Leaderboard displays rankings correctly | D-11 | UI layout verification | Load dashboard, switch between Points, Consistency, and Weight Class tabs. Verify correct member rankings. |
| Private leaderboard toggle excludes member | D-12 | Privacy enforcement verification | Toggle 'Hide me from leaderboards' on member settings. Verify the member is removed from all rankings. |
| Confetti visual celebration modal triggers | D-16 | Visual animation verification | Trigger a new PR or milestone badge. Verify that the pop-up modal renders and confetti explodes. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
