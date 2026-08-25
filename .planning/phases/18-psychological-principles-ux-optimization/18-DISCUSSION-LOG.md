# Phase 18: Psychological Principles & UX Optimization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-11
**Phase:** 18-psychological-principles-ux-optimization
**Areas discussed:** Guest Mode Scope and Persistence, Goal Gradient Checklist Items, Contrast Effect Anchor Plan, Loss Aversion Alerts framing

---

## Guest Mode Scope and Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| A | Enable only the BMI Visual Meter (Progress) and Workout Template Builder (My Workout). | ✓ |
| B | Enable all member-facing dashboard features (self check-in history, payments overview) in a simulated local mode. | |

| Option | Description | Selected |
|--------|-------------|----------|
| A | Persist indefinitely in localStorage (gymflow.guest.*) until they clear browser cache or register. | ✓ |
| B | Store only in sessionStorage (deleted when the browser tab is closed). | |

**User's choice:** Enable only the BMI Visual Meter and Workout Template Builder, persisting indefinitely in localStorage.
**Notes:** Ensures guest mode has a focused scope of creating value (workout templates, BMI tracking) which they can subsequently migrate to a permanent account upon registration.

---

## Goal Gradient Checklist Items

| Option | Description | Selected |
|--------|-------------|----------|
| A | Yes, the 5 proposed checklist items (Account Activated, Complete Profile, Record Measurements, Emergency Contact, Log First Workout) are perfect. | ✓ |
| B | No, I want to change or add different items. | |

**User's choice:** The 5 proposed checklist items are perfect.
**Notes:** Pre-completing the first item (Account Activated) gives members a 20% momentum start, encouraging them to fill out details, measurements, contacts, and log a workout.

---

## Contrast Effect Anchor Plan

| Option | Description | Selected |
|--------|-------------|----------|
| A | Hardcode a premium "Elite VIP Personal Coaching & Nutrition Package" (5,000 INR / $150 per month) as the anchor. | |
| B | Automatically dynamic: Find the highest active plan price in the database and display a "VIP Upgrade" at 2.5x that price. | |
| C | Let the owner configure the VIP Anchor plan price and benefits under Gym Settings. | ✓ |

**User's choice:** Let the owner configure the VIP Anchor plan price and benefits under Gym Settings.
**Notes:** Provides maximum customizability for different gyms while establishing a premium anchor to make standard plans look cheap.

---

## Loss Aversion Alerts framing

| Option | Description | Selected |
|--------|-------------|----------|
| A | Yes, use the strong Loss-Aversion warning copy for guest exits, unsaved workouts, and member expirations. | ✓ |
| B | No, make the warnings more subtle/standard. | |

**User's choice:** Yes, use the strong Loss-Aversion warning copy.
**Notes:** Encourages user retention and renewal action by highlighting what will be lost (custom routines, BMI graphs, attendance streaks, consistency points).

---

## the agent's Discretion

- Automatic migration: Migrate local guest templates and progress records to Firestore/local DB on signup.

## Deferred Ideas

None — discussion stayed within phase scope.
