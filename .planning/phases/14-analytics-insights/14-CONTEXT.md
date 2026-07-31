# Phase 14: Analytics & Insights Context

## Scope
Give gym owners actionable business intelligence to grow, monitor, and retain members via charts, forecasts, heatmaps, and re-engagement tools.

## Success Criteria
1. Revenue trend chart with monthly/weekly/daily toggle works
2. Member growth chart (12-month view of new signups) renders
3. Attendance heatmap (day-of-week x time-of-day) renders
4. Plan popularity bar chart renders
5. Inactive member alert with one-click WhatsApp works
6. Revenue forecasting shows next 30-day projected renewals

## Technical Strategy
*   Use pure inline SVG for charts to avoid external dependencies.
*   Enforce absolute dark/light mode CSS compatibility on SVG fills/strokes.
*   Implement day-of-week vs. hour-of-day cell grids using relative opacity colors representing count weight.
*   Retrieve data dynamically using memory collections (`context.data`).
