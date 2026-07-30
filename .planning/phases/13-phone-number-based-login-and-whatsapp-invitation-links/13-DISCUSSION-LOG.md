# Phase 13: Phone number based login and WhatsApp invitation links - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-30
**Phase:** 13-phone-number-based-login-and-whatsapp-invitation-links
**Areas discussed:** Login UI & Flow, Country Code Handling, Onboarding & Password Policy

---

## Login UI & Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Unified Dynamic Field | Single input box; typing an '@' prompts for password, typing a number prompts for SMS OTP. | |
| Separate Tabs | Tabs at the top of the auth card to select between 'Email & Password' and 'Phone Number'. | |
| **Phone & Password Mapping** | **No SMS OTP required. Users type their Phone Number and Password directly to log in (like email/password). Under the hood, maps to synthetic email structure `[normalized_phone]@gymflow.local`.** | ✓ |

**User's choice:** Phone number and Password combination login (no OTP needed).
**Notes:** Custom mapping of phone numbers to synthetic email addresses avoids third-party SMS delivery fees and ensures 100% cost-free operation.

---

## Country Code Handling & Normalization

| Option | Description | Selected |
|--------|-------------|----------|
| Last 10 Digits | Strip all non-numeric characters and keep only the last 10 digits. This allows '+91 98765-43210' and '09876543210' to match. | ✓ |
| Strict Numeric Strip | Strip non-numeric characters but keep all digits exactly as typed (e.g. '919876543210'). | |

**User's choice:** Last 10 Digits normalization.
**Notes:** This ensures inputs like `09876543210`, `+91 98765-43210`, and `9876543210` all resolve to the same normalized key `9876543210`, preventing login failures.

---

## Onboarding & Password Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Member sets password | WhatsApp invitation link takes the member to a registration page with their phone number pre-filled, where they set their password. | ✓ |
| Owner sets password | Owner sets a default password when adding the member, which is sent directly in the WhatsApp message text. | |

**User's choice:** Member sets password via pre-filled registration form.
**Notes:** Promotes better security compliance and keeps the setup flow self-service.

---

## the agent's Discretion

- Visual styling of the unified input field and error messages on the Login screen.
- Layout of the WhatsApp invitation action buttons in the Member Details panel.

## Deferred Ideas

- Standard Firebase SMS OTP verification (deferred to keep system 100% free of charges).
