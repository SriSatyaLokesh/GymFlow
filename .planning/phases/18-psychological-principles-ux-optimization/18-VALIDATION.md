---
phase: 18
slug: psychological-principles-ux-optimization
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-11
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom Node.js Assertions / JSDOM |
| **Config file** | none |
| **Quick run command** | `node scripts/smoke-test.mjs` |
| **Full suite command** | `node scripts/smoke-test.mjs` |
| **Estimated runtime** | ~2 seconds |

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
| 18-01-01 | 01 | 1 | REQ-18-01 (Smart Defaults) | — | N/A | unit | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | REQ-18-02 (Guest Router & State) | — | N/A | unit | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |
| 18-02-01 | 02 | 2 | REQ-18-03 (Goal Gradient Checklist) | — | N/A | unit | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |
| 18-02-02 | 02 | 2 | REQ-18-04 (Contrast Anchor Settings) | — | N/A | unit | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |
| 18-02-03 | 02 | 2 | REQ-18-05 (Loss Aversion Warnings) | — | N/A | unit | `node scripts/smoke-test.mjs` | ✅ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `scripts/test-psychology.mjs` — stubs for testing guest local state & defaults
- [ ] Update `scripts/smoke-test.mjs` to import and run psychology checks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Guest Browser Exit Warning | REQ-18-05 | Browser security restrictions on `beforeunload` | Launch guest mode, click browser close / reload, verify native confirmation warning displays. |
| Visual Contrast Layout | REQ-18-04 | Visual rendering style check | Go to guest My Membership tab, inspect that the premium plan is highlighted at the top with a distinct border and VIP badge. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
