# Phase 13: Phone number based login and WhatsApp invitation links - Context

**Gathered:** 2026-07-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable users to register and log in to GymFlow using a phone number and password combination, mapping underneath to Firebase Auth's Email/Password provider using a synthetic email structure (`[normalized_phone]@gymflow.local`). Normalize phone numbers to the last 10 digits to eliminate country code formatting inconsistencies. Support registration of new members by gym owners, who will generate pre-filled WhatsApp invitation links containing query parameters (`?invite=MemberId&phone=PhoneNumber`) to take members directly to the password creation form.

</domain>

<decisions>
## Implementation Decisions

### Login UI & Dynamic Auth Mapping
- **D-01:** The sign-in form will present a unified input field for Email or Phone Number alongside a Password field. The PWA will dynamically detect if the input is a phone number (all non-digit characters stripped results in a number). For phone numbers, it will normalize the string to the last 10 digits, append `@gymflow.local`, and execute Firebase `signInWithEmailAndPassword`. — **Reversibility:** costly — migrating to Firebase SMS OTP authentication in the future would require deleting synthetic accounts or changing authentication handlers on the client side.
- **D-02:** Phone Number Normalization: All phone numbers submitted during registration, owner enrollment, or login are normalized by stripping non-digit characters and retaining only the last 10 digits. — **Reversibility:** costly — changing the normalization format later would require migrating all stored phone numbers in Firestore to avoid authentication mismatches.

### Onboarding & WhatsApp Invites
- **D-03:** Owner Registration Flow: The gym owner registers a new member with a Name and Phone Number. The member document is created in Firestore with status `Pending`. An "Invite Member" option is then presented to the owner.
- **D-04:** WhatsApp Invitation Generation: Clicking "Invite Member" opens a WhatsApp Web / App link to the member's normalized number pre-filling a pre-defined text:
  ```text
  Hello [Member Name]! Welcome to [Gym Name]. 

  To register and access your workouts, schedules, and consistency points, please open the GymFlow App and set your password:
  [AppURL]/#register?invite=[MemberId]&phone=[PhoneNumber]
  ```
- **D-05:** Password Set Up: When the member visits the invitation link, the PWA opens the registration screen with their phone number pre-filled and disabled. The member inputs their desired password. The app registers them in Firebase Auth under the email `[normalized_phone]@gymflow.local`, writes their UID to the Firestore member document, and sets their status to `Active`. — **Reversibility:** costly — switching to a temporary password flow would change the registration screen logic and invite payload.

### the agent's Discretion
- The exact layout styling of the unified input field and the "Invite Member" WhatsApp action button inside the Member details view.
- Centralizing the phone normalization utility inside `modules/utils.js` for reusability.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication & Forms
- `modules/auth.js` — Sign-in UI, login/register forms, and Firebase Auth interface.
- `modules/utils.js` — Helper utility functions.

### Gym Directory & Members Management
- `modules/members.js` — Member addition form, directory listings, and status indicators.

### Firebase Setup
- `lib/firebase-init.js` — Database and authentication configuration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Email/Password form validation inside `modules/auth.js`.
- Error banner styling inside `modules/auth.js`.

### Established Patterns
- Client-side views render HTML from template functions and bind actions in separate functions.
- Query parameter reading at app boot time inside `app.js` or page router.

### Integration Points
- Extending the login form action in `modules/auth.js` to detect and rewrite phone numbers.
- Injecting the "Invite Member" button inside `modules/members.js`.

</code_context>

<specifics>
## Specific Ideas

- When the member opens the app via the invitation link, the register tab should be pre-selected automatically, and the phone field should be locked so they cannot accidentally modify the invited phone number.

</specifics>

<deferred>
## Deferred Ideas

- Standard Firebase SMS OTP verification (postponed due to cost-free priority).

</deferred>

---

*Phase: 13-phone-number-based-login-and-whatsapp-invitation-links*
*Context gathered: 2026-07-30*
