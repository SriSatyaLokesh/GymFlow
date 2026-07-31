# Phase 16 Plan: Owner UX Enhancements

This plan outlines the technical design, codebase modifications, and verification plan for implementing Phase 16 (Owner UX Enhancements: payments capture, receipt sharing, visual dashboard, and member billing warnings).

## Proposed Changes

### 1. Styling Upgrades (CSS)
#### [MODIFY] [main.css](file:///d:/professional/code/SriSatyaLokesh/GymFlow/styles/main.css)
- Add utility styling for dashboard SVG charts (glows, grid lines, labels, hover transitions).
- Add custom styling for the neomorphic receipt/invoice view (`.invoice-card`, `.invoice-header`, `.invoice-table`).
- Add styling for the member dashboard billing alerts (`.billing-widget`, `.billing-due`, `.billing-overdue`, `.billing-active`).

### 2. Payments capture, invoice layout, and WhatsApp receipt share
#### [MODIFY] [payments.js](file:///d:/professional/code/SriSatyaLokesh/GymFlow/modules/payments.js)
- **Custom Amount/Notes fields**: Add a `Notes/Comments` field to the payment capture form (`#payment-form`) to allow custom transaction logs.
- **Redesigned Receipt Printout**: Replace `printReceipt` blank popup HTML with a gorgeous, high-fidelity neomorphic print invoice layout.
- **WhatsApp sharing**:
  - Add a WhatsApp sharing button to the payment history row actions.
  - On click, retrieve member mobile, planName, amount, and receipt details, and open a `https://wa.me/{phone}?text={message}` link prefilled with a structured receipt.

### 3. Member dashboard payment alerts & Owner telemetry dashboard
#### [MODIFY] [dashboard.js](file:///d:/professional/code/SriSatyaLokesh/GymFlow/modules/dashboard.js)
- **Member Payment Status Widget**:
  - Update `renderMemberDashboard` to show a payment status block.
  - Calculate status: if `endDate` is within **5 days**, display a warning status (`Due Soon` yellow card); if `endDate` is in the past, display `Overdue` (red card); otherwise display `Active` (green card).
- **Owner Dashboard SVG Charts**:
  - Replace the text-based bars helper in `renderBars` with three inline neomorphic SVG charts:
    1.  **Revenue Trend**: SVG line graph tracking last 6 months of payments.
    2.  **Plan Popularity**: SVG donut/pie chart showcasing plan distribution.
    3.  **Trainer Allocation**: SVG bar chart showing the active client count per trainer.

## Verification Plan

### Automated Tests
- Since this phase modifies dashboard display metrics and payment form controls, verify existing payment saving flows using unit tests:
  ```bash
  node scripts/test-gamification.mjs
  ```

### Manual Verification
1.  **Owner Payment Capture**:
    - Log in as Owner.
    - Go to Payments tab. Add a payment with custom amount, date, and description notes.
    - Verify that notes save to the Firestore database correctly.
2.  **Receipt Sharing**:
    - Click "Receipt" on any payment row. Verify the print layout is clean and formatted.
    - Click the WhatsApp Share icon on a payment row. Verify that the browser redirect link is generated with prefilled details.
3.  **Member Portal Alert**:
    - Log in as a member whose plan expires in 4 days.
    - Verify that a yellow "Payment Due" status card appears on their dashboard.
    - Log in as a member whose plan is expired. Verify that a red "Overdue" warning appears.
4.  **Owner Dashboard Visuals**:
    - Verify the three SVG charts render correctly under both Light and Dark themes, responding to resizing.
