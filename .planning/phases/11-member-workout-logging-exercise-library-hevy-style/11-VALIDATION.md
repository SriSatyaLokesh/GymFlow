---
phase: 11
slug: member-workout-logging-exercise-library-hevy-style
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-28
---

# Phase 11 — Validation Strategy

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
| 11-01-01 | 01 | 1 | D-05 | — | Read-only render checks in member details modal | Smoke | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure (`scripts/smoke-test.mjs`) covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Member details modal contains a read-only view of member's weekly schedule & routines | D-05 | Visual layout confirmation | Open members directory, click a member, select "Workout Logs" tab, verify that their weekly schedule (Monday-Sunday) and custom routines are displayed correctly. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
