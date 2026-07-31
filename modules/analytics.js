import { collections, dateLabel, daysUntil, emptyState, escapeHtml, findName, memberStatus, money, pageHeader, today } from "./utils.js";

export const analyticsModule = {
  revenueFilter: "monthly", // Default: monthly

  render(context) {
    const { data, settings } = context;
    const members = data.members || [];
    const payments = data.payments || [];
    const attendance = data.attendance || [];
    const plans = data.membership_plans || [];
    const currency = settings?.currency || "INR";

    // ── 1. Group Revenue Data for Charts ────────────────────────────────────
    let revLabels = [];
    let revValues = [];
    const todayStr = today();

    if (this.revenueFilter === "daily") {
      // Last 15 Days
      const days = Array.from({ length: 15 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d.toISOString().slice(0, 10);
      });
      revValues = days.map(day => 
        payments
          .filter(p => p.date === day && p.status === "Paid")
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      );
      revLabels = days.map(day => {
        const parts = day.split("-");
        return `${parts[1]}/${parts[2]}`; // MM/DD
      });
    } else if (this.revenueFilter === "weekly") {
      // Last 8 Weeks
      const weeks = Array.from({ length: 8 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (7 * (7 - i)));
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay() + 1); // Monday
        const end = new Date(start);
        end.setDate(end.getDate() + 6); // Sunday
        return {
          label: `W${i + 1}`,
          start: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10)
        };
      });
      revValues = weeks.map(w => 
        payments
          .filter(p => p.date >= w.start && p.date <= w.end && p.status === "Paid")
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      );
      revLabels = weeks.map(w => w.label);
    } else {
      // Last 12 Months
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return d.toISOString().slice(0, 7);
      });
      revValues = months.map(m => 
        payments
          .filter(p => String(p.date || "").startsWith(m) && p.status === "Paid")
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      );
      revLabels = months.map(m => {
        const d = new Date(m + "-02");
        return d.toLocaleDateString("en-US", { month: "short" });
      });
    }

    // ── 2. Member Acquisition Data (Last 12 Months) ───────────────────────
    const growthMonths = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return d.toISOString().slice(0, 7);
    });
    const growthValues = growthMonths.map(m => 
      members.filter(mem => String(mem.joinDate || mem.startDate || "").startsWith(m)).length
    );
    const growthLabels = growthMonths.map(m => {
      const d = new Date(m + "-02");
      return d.toLocaleDateString("en-US", { month: "short" });
    });

    // ── 3. Heatmap Matrix Day-of-Week x Time-of-Day ────────────────────────
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const timeBlocks = [
      { label: "6AM - 10AM", start: 6, end: 10 },
      { label: "10AM - 2PM", start: 10, end: 14 },
      { label: "2PM - 6PM", start: 14, end: 18 },
      { label: "6PM - 10PM", start: 18, end: 22 }
    ];
    const heatmapData = Array.from({ length: 7 }, () => Array(4).fill(0));

    attendance.forEach(record => {
      if (!record.date) return;
      // Parse ISO date string safely
      const d = new Date(record.date + "T" + (record.time || "08:00"));
      let dayIdx = d.getDay(); // 0 is Sunday, 1 is Monday...
      dayIdx = dayIdx === 0 ? 6 : dayIdx - 1; // Map Sun to 6, Mon to 0

      const hour = parseInt((record.time || "08:00").split(":")[0], 10);
      timeBlocks.forEach((tb, tbIdx) => {
        if (hour >= tb.start && hour < tb.end) {
          heatmapData[dayIdx][tbIdx]++;
        }
      });
    });

    const maxHeat = Math.max(...heatmapData.flat(), 1);

    // ── 4. Plan Popularity Breakdown ────────────────────────────────────────
    const activeMembers = members.filter(m => memberStatus(m) === "Active");
    const planStats = plans.map(p => {
      const activeCount = activeMembers.filter(m => m.planId === p.id).length;
      const totalRevenue = payments
        .filter(pay => pay.planId === p.id && pay.status === "Paid")
        .reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
      return { name: p.planName, count: activeCount, revenue: totalRevenue };
    }).sort((a, b) => b.revenue - a.revenue);

    // ── 5. Forecasted Renewals (Next 30 Days) ──────────────────────────────
    const upcomingRenewals = members
      .map(m => ({ ...m, daysLeft: daysUntil(m.endDate), computedStatus: memberStatus(m) }))
      .filter(m => m.computedStatus !== "Paused" && m.daysLeft >= 0 && m.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const projectedRevenue = upcomingRenewals.reduce((sum, m) => {
      const plan = plans.find(p => p.id === m.planId);
      return sum + Number(plan?.price || 0);
    }, 0);

    // ── 6. Inactive Member Alerts (No check-in last 14 days) ─────────────────
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const limitDateStr = fourteenDaysAgo.toISOString().slice(0, 10);

    const inactiveMembers = members
      .filter(m => memberStatus(m) === "Active") // Only alert on active members who stopped coming
      .filter(member => {
        const memberCheckins = attendance.filter(a => a.memberId === member.id);
        if (memberCheckins.length === 0) {
          return (member.joinDate || member.startDate || "") < limitDateStr;
        }
        const latest = memberCheckins.reduce((lat, c) => c.date > lat ? c.date : lat, "");
        return latest < limitDateStr;
      });

    return `
      ${pageHeader("Analytics & Insights")}

      <!-- Upper Metric Summaries -->
      <div class="metric-grid" style="margin-bottom: 25px;">
        <article class="metric">
          <span>Forecasted Revenue (30d)</span>
          <strong>${money(projectedRevenue, currency)}</strong>
          <small style="color: var(--teal); font-weight: 600;">${upcomingRenewals.length} renewals pending</small>
        </article>
        <article class="metric">
          <span>Inactive Clients</span>
          <strong>${inactiveMembers.length}</strong>
          <small style="color: var(--primary); font-weight: 600;">No check-ins >14 days</small>
        </article>
        <article class="metric">
          <span>Active Plans</span>
          <strong>${activeMembers.length}</strong>
          <small style="color: var(--accent); font-weight: 600;">Total enrolled members</small>
        </article>
        <article class="metric">
          <span>Monthly Revenue (Actual)</span>
          <strong>${money(
            payments
              .filter(p => String(p.date || "").startsWith(todayStr.slice(0, 7)) && p.status === "Paid")
              .reduce((sum, p) => sum + Number(p.amount || 0), 0),
            currency
          )}</strong>
          <small style="color: var(--text-muted);">Current calendar month</small>
        </article>
      </div>

      <!-- Main Split Grid: Charts -->
      <div class="split-grid" style="margin-bottom: 25px;">
        <!-- Left: Revenue Trend -->
        <section class="panel stack">
          <div class="panel-heading" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h2>Revenue Trends</h2>
            <div class="button-row" style="margin: 0;">
              <button class="ghost-button compact ${this.revenueFilter === 'daily' ? 'active' : ''}" data-rev-filter="daily">Daily</button>
              <button class="ghost-button compact ${this.revenueFilter === 'weekly' ? 'active' : ''}" data-rev-filter="weekly">Weekly</button>
              <button class="ghost-button compact ${this.revenueFilter === 'monthly' ? 'active' : ''}" data-rev-filter="monthly">Monthly</button>
            </div>
          </div>
          ${renderLineChart(revLabels, revValues, currency)}
        </section>

        <!-- Right: Member Growth -->
        <section class="panel stack">
          <div class="panel-heading">
            <h2>Member Acquisition</h2>
            <span>Rolling 12-month signups</span>
          </div>
          ${renderBarChart(growthLabels, growthValues)}
        </section>
      </div>

      <!-- Second Split Grid: Heatmap & Plan Popularity -->
      <div class="split-grid" style="margin-bottom: 25px;">
        <!-- Left: Attendance Heatmap -->
        <section class="panel stack">
          <div class="panel-heading">
            <h2>Attendance Heatmap</h2>
            <span>Peak hour check-in density</span>
          </div>
          <div style="overflow-x: auto; padding: 10px 0;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 6px; font-size: 0.8rem; text-align: center;">
              <thead>
                <tr>
                  <th style="font-weight:600; color:var(--text-muted); text-align:left; padding-right:10px;">Day</th>
                  ${timeBlocks.map(tb => `<th style="font-weight:600; color:var(--text-muted);">${tb.label}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${dayNames.map((day, dayIdx) => {
                  return `
                    <tr>
                      <td style="font-weight:700; color:var(--text); text-align:left; padding-right:10px;">${day}</td>
                      ${heatmapData[dayIdx].map((val) => {
                        const intensity = val > 0 ? Math.min(0.2 + (val / maxHeat) * 0.8, 1) : 0;
                        const bgStyle = val > 0 
                          ? `background: rgba(16, 185, 129, ${intensity}); color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.3); font-weight:700;` 
                          : `background: var(--surface-soft); color: var(--text-muted); opacity: 0.4;`;
                        return `
                          <td style="border-radius:var(--r-sm); padding:10px 6px; min-width:80px; transition: transform 0.2s; ${bgStyle}" 
                              class="heatmap-cell" title="${val} check-ins">
                            ${val || "-"}
                          </td>
                        `;
                      }).join("")}
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Right: Plan Popularity -->
        <section class="panel stack">
          <div class="panel-heading">
            <h2>Membership Plan Analysis</h2>
            <span>Popularity and financial share</span>
          </div>
          <div class="list-table compact" style="max-height: 270px; overflow-y: auto;">
            <div class="table-head">
              <span>Plan</span>
              <span style="text-align:right;">Members</span>
              <span style="text-align:right;">Revenue</span>
            </div>
            ${
              planStats.length
                ? planStats.map(stat => `
                    <div class="table-row">
                      <span><strong>${escapeHtml(stat.name)}</strong></span>
                      <span style="text-align:right; font-weight:600; color:var(--text);">${stat.count} active</span>
                      <span style="text-align:right; font-weight:700; color:var(--teal);">${money(stat.revenue, currency)}</span>
                    </div>
                  `).join("")
                : `<div class="table-empty">No plan data available.</div>`
            }
          </div>
        </section>
      </div>

      <!-- Third Split Grid: Forecast & Inactive Alerts -->
      <div class="split-grid">
        <!-- Left: Renewals Forecast -->
        <section class="panel stack">
          <div class="panel-heading">
            <h2>Forecasted Renewals</h2>
            <span>Expected signups next 30 days</span>
          </div>
          <div class="list-table compact" style="max-height: 300px; overflow-y: auto;">
            <div class="table-head">
              <span>Member</span>
              <span>Plan Price</span>
              <span>Expires In</span>
            </div>
            ${
              upcomingRenewals.length
                ? upcomingRenewals.map(m => {
                    const plan = plans.find(p => p.id === m.planId);
                    return `
                      <div class="table-row">
                        <span>
                          <strong>${escapeHtml(m.fullName)}</strong>
                          <small>${escapeHtml(plan?.planName || "Custom")}</small>
                        </span>
                        <span style="font-weight:700; color:var(--text);">${money(plan?.price || 0, currency)}</span>
                        <span style="color: var(--primary); font-weight:600;">${m.daysLeft === 0 ? "Today" : `${m.daysLeft} days`}</span>
                      </div>
                    `;
                  }).join("")
                : `<div class="table-empty">No renewals projected in the next 30 days.</div>`
            }
          </div>
        </section>

        <!-- Right: Inactive Member Alerts -->
        <section class="panel stack">
          <div class="panel-heading">
            <h2>Inactive Member Alerts</h2>
            <span>Re-engage members missing for >14 days</span>
          </div>
          <div class="list-table compact" style="max-height: 300px; overflow-y: auto;">
            <div class="table-head">
              <span>Member</span>
              <span>Last Check-in</span>
              <span style="text-align:right;">Reach Out</span>
            </div>
            ${
              inactiveMembers.length
                ? inactiveMembers.map(member => {
                    const memberCheckins = attendance.filter(a => a.memberId === member.id);
                    const latestDate = memberCheckins.reduce((lat, c) => c.date > lat ? c.date : lat, "");
                    const formattedDate = latestDate ? dateLabel(latestDate) : "Never";
                    
                    // Compose Whatsapp Link
                    const phone = member.whatsapp || member.mobile || "";
                    const formattedPhone = phone.replace(/[^0-9]/g, "");
                    const message = `Hey ${member.fullName}! We missed you at ${settings?.gymName || "the gym"} lately. Hope everything is going well! Let us know when you plan to drop by next.`;
                    const waUrl = `https://wa.me/${formattedPhone ? formattedPhone : ""}?text=${encodeURIComponent(message)}`;

                    return `
                      <div class="table-row">
                        <span>
                          <strong>${escapeHtml(member.fullName)}</strong>
                          <small>${escapeHtml(phone)}</small>
                        </span>
                        <span style="color: var(--text-muted);">${formattedDate}</span>
                        <span style="text-align:right;">
                          <a href="${waUrl}" target="_blank" class="icon-button secondary" 
                             style="background:#25D366; border-color:#25D366; color:white; display:inline-flex; align-items:center; padding: 4px 8px; font-size:0.75rem; gap:4px; text-decoration:none; border-radius:var(--r-sm);" 
                             title="Reach out on WhatsApp">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">chat</span> Reach Out
                          </a>
                        </span>
                      </div>
                    `;
                  }).join("")
                : `<div class="table-empty">All active members are consistently checked in! 🎉</div>`
            }
          </div>
        </section>
      </div>
    `;
  },

  bind(root, context) {
    // Bind revenue filter toggles
    root.querySelectorAll("[data-rev-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.revenueFilter = btn.dataset.revFilter;
        context.refreshView();
      });
    });
  }
};

function renderLineChart(labels, values, currency) {
  const width = 450;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const maxVal = Math.max(...values, 1);

  const points = values.map((val, idx) => {
    const x = paddingX + (idx * (width - 2 * paddingX) / (values.length - 1));
    const y = height - paddingY - (val / maxVal * (height - 2 * paddingY));
    return { x, y };
  });

  const pathD = points.length 
    ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ") 
    : "";

  const labelsHtml = labels.map((l, idx) => {
    const x = paddingX + (idx * (width - 2 * paddingX) / (labels.length - 1));
    return `<text x="${x}" y="${height - 5}" text-anchor="middle" font-size="8px" fill="var(--text-muted)" font-weight="500">${l}</text>`;
  }).join("");

  const dotsHtml = points.map((p, idx) => {
    return `
      <g class="chart-point-group" style="cursor: pointer;">
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="var(--teal)" stroke="var(--surface)" stroke-width="2" />
        <circle cx="${p.x}" cy="${p.y}" r="10" fill="transparent" />
        <g class="chart-tooltip" style="opacity: 0.9; transition: opacity 0.2s;">
          <rect x="${p.x - 30}" y="${p.y - 25}" width="60" height="15" rx="3" fill="var(--accent)" />
          <text x="${p.x}" y="${p.y - 15}" text-anchor="middle" font-size="8px" font-weight="700" fill="#ffffff">${money(values[idx], currency)}</text>
        </g>
      </g>
    `;
  }).join("");

  return `
    <div style="width: 100%; display: flex; justify-content: center; align-items: center; padding-top: 15px;">
      <svg viewBox="0 0 450 180" class="gymflow-chart" style="width:100%; height:auto; overflow:visible;">
        <style>
          .chart-tooltip { display: none; }
          .chart-point-group:hover .chart-tooltip { display: block; }
          .chart-point-group:hover circle { fill: var(--primary); r: 6; }
        </style>
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="var(--line-soft)" stroke-width="1" />
        <line x1="${paddingX}" y1="${paddingY}" x2="${paddingX}" y2="${height - paddingY}" stroke="var(--line-soft)" stroke-width="1" />
        ${points.length ? `<path d="${pathD}" fill="none" stroke="var(--teal)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ""}
        ${dotsHtml}
        ${labelsHtml}
      </svg>
    </div>
  `;
}

function renderBarChart(labels, values) {
  const width = 450;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const maxVal = Math.max(...values, 1);

  const barWidth = 16;
  const spacing = (width - 2 * paddingX) / labels.length;

  const barsHtml = labels.map((l, idx) => {
    const x = paddingX + idx * spacing + (spacing - barWidth) / 2;
    const barHeight = (values[idx] / maxVal) * (height - 2 * paddingY - 15);
    const y = height - paddingY - barHeight;
    return `
      <g style="cursor: pointer;">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="var(--primary)" rx="3" class="chart-bar" style="transition: fill 0.2s;" />
        <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="8px" font-weight="700" fill="var(--text)">${values[idx] || ""}</text>
        <text x="${x + barWidth/2}" y="${height - 5}" text-anchor="middle" font-size="8px" fill="var(--text-muted)" font-weight="500">${l}</text>
      </g>
    `;
  }).join("");

  return `
    <div style="width: 100%; display: flex; justify-content: center; align-items: center; padding-top: 15px;">
      <svg viewBox="0 0 450 180" style="width:100%; height:auto; overflow:visible;">
        <style>
          .chart-bar:hover { fill: var(--teal); }
        </style>
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="var(--line-soft)" stroke-width="1" />
        ${barsHtml}
      </svg>
    </div>
  `;
}
