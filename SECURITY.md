# Security Policy

## Supported Versions

The following table indicates the versions of **GymFlow** that currently receive security updates and bug fixes:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

We take the security of **GymFlow** and our users' data very seriously. If you discover a security vulnerability, we appreciate your efforts to responsibly disclose it to us before publishing it publicly.

### How to Report
Please **DO NOT** create a public GitHub Issue for security vulnerabilities. Instead, report security issues via one of the following methods:

- **Email:** Report directly to the repository maintainer or security lead.
- **Private Disclosure:** Create a [Draft Security Advisory](https://github.com/SriSatyaLokesh/GymFlow/security/advisories/new) on GitHub.

### What to Include in Your Report
To help us evaluate and address the issue efficiently, please include:
1. **Description:** A detailed explanation of the vulnerability and its potential impact.
2. **Steps to Reproduce:** Clear proof-of-concept (PoC) steps, code snippets, or HTTP request logs.
3. **Affected Components:** Specific files, modules, endpoints, or Firestore rules involved.
4. **Suggested Fix:** (Optional) Any recommendations for remediation.

### Response SLA
- **Initial Acknowledgment:** Within **24 to 48 hours**.
- **Assessment & Triage:** Within **3 to 5 business days**.
- **Patch Release:** High-severity issues will be prioritized for immediate hotfix deployment.

---

## Security Architecture & Data Protection

GymFlow implements multiple layers of defense to safeguard multi-tenant gym data, owner credentials, and member privacy:

### 1. Multi-Tenant Data Isolation
- Every document stored in Firestore is scoped to a specific `gymId`.
- Server-side **Firestore Security Rules** (`firestore.rules`) strictly enforce that users can only read, write, update, or delete records belonging to their assigned `gymId`.
- Cross-tenant queries are blocked at the database rule layer.

### 2. Role-Based Access Control (RBAC)
GymFlow enforces strict role hierarchy across three distinct login roles:
- **Owner:** Full administrative access to gym operations, financial reports, trainer rosters, member admissions, plans, and gym settings. Destructive actions (e.g., hard-deleting a gym) require password re-authentication and double confirmation.
- **Trainer:** Restricted access to assigned clients, workout library management, and trainer check-in logs. Financials, membership pricing, and gym settings are inaccessible.
- **Member:** Restricted to viewing personal dashboard stats, active workout routines, payment receipts, attendance logs, and performing self-checkin.

### 3. Client-Side XSS Protection & HTML Sanitization
- All dynamic user inputs (member names, notes, gym names, workout descriptions) are sanitized using an `escapeHtml()` utility before DOM rendering.
- Dangerous inline scripts and unescaped HTML injection points are systematically mitigated.

### 4. Authentication & Credentials Security
- **Firebase Auth Integration:** Passwords and token validations are handled through secure Firebase Authentication pipelines (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`). Passwords are never stored in plaintext.
- **Synthetic Mobile Login Mapping:** Phone number logins are converted into deterministic synthetic identifiers (`<phone>@gymflow.app`) to maintain auth layer compatibility without exposing sensitive plaintext credentials.
- **Re-Authentication Gates:** Sensitive actions like hard-deleting an entire gym require owner password re-verification against the Firebase Auth engine.

### 5. Local Storage & Offline Mode Hygiene
- Offline local mode (`gymflow.local.v1`) stores local workspace state isolated within the user's browser.
- Attendance check-in queries for Owners bypass local cache to guarantee direct live database validation.

---

## Security Best Practices for Self-Hosting & Deployment

When deploying GymFlow (e.g., to custom domains like `app.gripgym.in`):
1. **HTTPS Enforcement:** Always enforce HTTPS in your host settings (e.g., GitHub Pages Enforce HTTPS or Vercel SSL) to protect data in transit via TLS 1.3/1.2.
2. **Firebase Authorized Domains:** Ensure only trusted domains (e.g., `app.gripgym.in`, `localhost`) are listed in your Firebase Authentication Authorized Domains whitelist.
3. **Firestore Rule Deployment:** Always deploy `firestore.rules` via Firebase CLI (`firebase deploy --only firestore:rules`) to keep production rules in sync with the codebase.
