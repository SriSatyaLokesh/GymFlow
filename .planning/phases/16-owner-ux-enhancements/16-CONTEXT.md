# Phase 16: Owner UX Enhancements — Context

## Goal
Elevate owner workflows, payments capturing, dashboard visuals, and reports to be highly user-friendly, and introduce clear billing status alerts for members.

## Domain Boundary
This phase focuses strictly on upgrading the owner's dashboard experience (revenue charts, plan popularity, trainer client counts), payments capturing capabilities (custom overrides, metadata notes, transaction status), custom WhatsApp receipt sharing, and adding a billing status warning banner inside the member portal.

## Decisions Captured

### 1. Payment Capturing & Customization
- **Payment Modes**: Support Cash, Card, UPI, and Bank Transfer.
- **Overrides**: Allow custom amounts, override billing dates, and add optional transaction description notes.
- **Design**: Redesign the receipt/invoice view into a clean, modern neomorphic modal that prints cleanly.

### 2. Receipt Sharing
- **Mechanism**: Generate a client-side WhatsApp `wa.me` template link prefilled with a structured text receipt containing: Date, Member Name, Amount Paid, Plan Name, Payment Mode, and Transaction ID.

### 3. Member Portal Billing Alerts
- **Warning Threshold**: Display a yellow "Payment Due" status alert on the member portal dashboard starting exactly **5 days** before the renewal date.
- **Overdue Threshold**: Display a red "Overdue" status if the renewal date has passed and no active plan is paid.
- **Billing Widget**: Prominently display the status (Active, Due, or Overdue) alongside their next billing/renewal date.

### 4. Owner Dashboard Visuals & Telemetry
- **Revenue Trends**: Render a neomorphic SVG line chart showing monthly revenue trends.
- **Plan Popularity**: Render a neomorphic SVG pie/donut chart representing the distribution of member plans.
- **Trainer Client Ratios**: Render a neomorphic SVG bar chart showing the active client count per trainer.

## Code Context
- Relevant files:
  - [progress.js](file:///d:/professional/code/SriSatyaLokesh/GymFlow/modules/progress.js) (member dashboard context and progress charts)
  - [utils.js](file:///d:/professional/code/SriSatyaLokesh/GymFlow/modules/utils.js) (receipt structures, modalling, and core calculation utilities)
  - [payments.js](file:///d:/professional/code/SriSatyaLokesh/GymFlow/modules/payments.js) (payments capture forms and table history)
  - [dashboard.js](file:///d:/professional/code/SriSatyaLokesh/GymFlow/modules/dashboard.js) (owner dashboard metric visuals)
  - [main.css](file:///d:/professional/code/SriSatyaLokesh/GymFlow/styles/main.css) (custom visual tokens, neomorphic styling, and keyframes)

## Deferred Ideas
- Split/multi-mode payment support (deferred to future phases).
- Installment tracking / partial outstanding balances (deferred to future phases).
- Automatic PDF server-side receipt generation (deferred to future phases).
