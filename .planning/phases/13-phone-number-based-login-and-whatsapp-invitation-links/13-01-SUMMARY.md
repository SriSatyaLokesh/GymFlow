---
phase: 13-phone-number-based-login-and-whatsapp-invitation-links
plan: "01"
status: complete
completed: "2026-07-30"
files_changed:
  - lib/firebase-init.js
  - app.js
  - modules/auth.js
  - modules/members.js
  - modules/utils.js
  - modules/profile.js
  - scripts/test-phone-auth.mjs
---

# Phase 13 Plan 01 Summary: Phone Number Login & WhatsApp Invites

## What was built

Implemented a password-based phone authentication system and an onboarding flow featuring WhatsApp invitations. Under the hood, phone sign-ins are mapped to synthetic email addresses (`[normalized_phone]@gymflow.app`) to avoid third-party SMS OTP carrier fees. Gym owners can add members, auto-trigger pre-formatted WhatsApp invite messages, and members can set their own passwords on a pre-filled, readonly onboarding landing registration screen. Also refactored the edit profile interface from a modal popup into a dedicated tab/page route (`#/profile`) accessible to all user roles (owners, trainers, and members).

## Changes

### `lib/firebase-init.js`
- Added raw phone-to-synthetic-email mapping checks to `login` and `resetPassword` methods in both Firebase (live) and local storage (demo) mode services.

### `app.js`
- Registered the `profile` tab and `profileModule` as a standard route.
- Redirected the profile chip click handler in the layout shell to navigate to `#/profile` instead of launching a modal.
- Removed the deprecated `openProfileModal` function definition.

### `modules/auth.js`
- Updated the login input field label to "Email or Phone Number" and input type to `text`.
- Hooked the login submit handler to convert phone entries to synthetic emails.
- Configured onboarding route parameters (`?invite=...&phone=...&code=...`) to dynamically pre-fill the member registration form with readonly inputs and activate the Join Gym tab.
- Hooked the Join Gym submit handler to register the account with the synthetic email format.

### `modules/members.js`
- Configured member registration saving to automatically generate synthetic emails if the email field is left blank.
- Added a WhatsApp "Send Invite" action button for pending members (who lack linked accounts) to the roster directory.
- Configured the add member form to prompt the gym owner with an invitation dialog immediately after successfully saving a new member.

### `modules/utils.js`
- Implemented `normalizePhone10(value)` helper to format raw user inputs to their last 10 digits.

### `modules/profile.js` [NEW]
- Created a dedicated page module for editing name, cartoon avatar, and role-specific configurations (emergency contacts, body metrics, limitations, occupation, specialization, and certifications) as a tab view.

### `scripts/test-phone-auth.mjs` [NEW]
- Added a dedicated unit test suite verifying phone normalization and synthetic email mapping rules.

## Verification

- [x] Added `scripts/test-phone-auth.mjs` verifying phone number normalization and synthetic mapping against various formatting permutations.
- [x] Smoke tested app rendering and routing using `node scripts/smoke-test.mjs` with zero regressions.
- [x] Checked normalization logic with numbers like `+91 98765-43210` or `09876543210` mapping to `9876543210@gymflow.app`.
- [x] Verified profile tab page renders and saves correctly for all roles.
