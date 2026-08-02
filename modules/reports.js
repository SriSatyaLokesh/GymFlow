import { dateLabel, daysUntil, escapeHtml, exportToExcel, findName, memberStatus, money, pageHeader, statusClass, today } from "./utils.js";

export const reportsModule = {
  activeTab: "analytics", // Default tab: analytics
  revenueFilter: "monthly", // Default revenue toggle: monthly

  render(context) {
    const { data, settings } = context;
    const members = data.members || [];
    const payments = data.payments || [];
    const attendance = data.attendance || [];
    const plans = data.membership_plans || [];
    const currency = settings?.currency || "INR";

    const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const activeCount = members.filter((member) => memberStatus(member) === "Active").length;
    const inactive = members.filter((member) => memberStatus(member) !== "Active");
    const todayStr = today();

    // ── Build Tab Header & Title ───────────────────────────────────────────
    const headerHtml = pageHeader(
      "Reports & Analytics",
      this.activeTab === "overview" 
        ? `<div class="button-row">
            <button class="ghost-button" data-export="members" type="button">Members .xlsx</button>
            <button class="ghost-button" data-export="payments" type="button">Payments .xlsx</button>
            <button class="ghost-button" data-export="attendance" type="button">Attendance .xlsx</button>
            <button class="ghost-button" data-export="renewals" type="button">Renewals .xlsx</button>
            <button class="primary-button" data-export="all" type="button">Export all</button>
          </div>`
        : ""
    );

    const tabsSwitcherHtml = `
      <div class="tab-container" style="margin-bottom: 20px; border-bottom: 1.5px solid var(--line); display: flex; gap: 16px; flex-wrap: wrap;">
        <button class="tab-link ${this.activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics" style="padding: 10px 4px; font-weight: 700; font-size: 0.95rem; border-bottom: 3px solid ${this.activeTab === 'analytics' ? 'var(--primary)' : 'transparent'}; color: ${this.activeTab === 'analytics' ? 'var(--text)' : 'var(--text-muted)'}; background: none; border-top: none; border-left: none; border-right: none; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <span class="material-symbols-outlined" style="font-size:1.15rem;">analytics</span> Analytics &amp; Heatmap
        </button>
        <button class="tab-link ${this.activeTab === 'members-report' ? 'active' : ''}" data-tab="members-report" style="padding: 10px 4px; font-weight: 700; font-size: 0.95rem; border-bottom: 3px solid ${this.activeTab === 'members-report' ? 'var(--primary)' : 'transparent'}; color: ${this.activeTab === 'members-report' ? 'var(--text)' : 'var(--text-muted)'}; background: none; border-top: none; border-left: none; border-right: none; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <span class="material-symbols-outlined" style="font-size:1.15rem;">group</span> Members Report
        </button>
        <button class="tab-link ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview" style="padding: 10px 4px; font-weight: 700; font-size: 0.95rem; border-bottom: 3px solid ${this.activeTab === 'overview' ? 'var(--primary)' : 'transparent'}; color: ${this.activeTab === 'overview' ? 'var(--text)' : 'var(--text-muted)'}; background: none; border-top: none; border-left: none; border-right: none; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <span class="material-symbols-outlined" style="font-size:1.15rem;">export_notes</span> Overview &amp; Exports
        </button>
      </div>
    `;

    // ── Render Content based on activeTab ──────────────────────────────────
    if (this.activeTab === "members-report") {
      return renderMembersReport(headerHtml, tabsSwitcherHtml, members, attendance, plans, today());
    } else if (this.activeTab === "analytics") {
      // ── 1. Group Revenue Data for Charts ──────────────────────────────────
      let revLabels = [];
      let revValues = [];

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
        const d = new Date(record.date + "T" + (record.time || "08:00"));
        let dayIdx = d.getDay();
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1; // Mon=0, Sun=6

        const hour = parseInt((record.time || "08:00").split(":")[0], 10);
        timeBlocks.forEach((tb, tbIdx) => {
          if (hour >= tb.start && hour < tb.end) {
            heatmapData[dayIdx][tbIdx]++;
          }
        });
      });

      const maxHeat = Math.max(...heatmapData.flat(), 1);

      // ── 4. Plan Popularity ────────────────────────────────────────────────
      const activeMembers = members.filter(m => memberStatus(m) === "Active");
      const planStats = plans.map(p => {
        const count = activeMembers.filter(m => m.planId === p.id).length;
        const totalRevenue = payments
          .filter(pay => pay.planId === p.id && pay.status === "Paid")
          .reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
        return { name: p.planName, count, revenue: totalRevenue };
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

      const inactiveAlerts = members
        .filter(m => memberStatus(m) === "Active")
        .filter(member => {
          const memberCheckins = attendance.filter(a => a.memberId === member.id);
          if (memberCheckins.length === 0) {
            return (member.joinDate || member.startDate || "") < limitDateStr;
          }
          const latest = memberCheckins.reduce((lat, c) => c.date > lat ? c.date : lat, "");
          return latest < limitDateStr;
        });

      return `
        ${headerHtml}
        ${tabsSwitcherHtml}

        <!-- Upper Metric Summaries -->
        <div class="metric-grid" style="margin-bottom: 25px;">
          <article class="metric">
            <span>Forecasted Revenue (30d)</span>
            <strong>${money(projectedRevenue, currency)}</strong>
            <small style="color: var(--teal-ink); font-weight: 600;">${upcomingRenewals.length} renewals pending</small>
          </article>
          <article class="metric">
            <span>Inactive Clients</span>
            <strong>${inactiveAlerts.length}</strong>
            <small style="color: var(--danger); font-weight: 600;">No check-ins >14 days</small>
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
                          let levelClass = "";
                          if (val > 0) {
                            const ratio = val / maxHeat;
                            if (ratio <= 0.25) levelClass = "level-1";
                            else if (ratio <= 0.5) levelClass = "level-2";
                            else if (ratio <= 0.75) levelClass = "level-3";
                            else levelClass = "level-4";
                          }
                          return `
                            <td class="heatmap-cell ${levelClass}" title="${val} check-ins">
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
            <div class="list-table reports-plans-table" style="max-height: 270px; overflow-y: auto; overflow-x: hidden;">
              <div class="table-head">
                <span>Plan</span>
                <span style="text-align:right;">Members</span>
                <span style="text-align:right;">Revenue</span>
              </div>
              ${
                planStats.length
                  ? planStats.map(stat => `
                      <div class="table-row">
                        <span data-label="Plan"><strong>${escapeHtml(stat.name)}</strong></span>
                        <span data-label="Members" style="text-align:right; font-weight:600; color:var(--ink-soft);">${stat.count} active</span>
                        <span data-label="Revenue" style="text-align:right; font-weight:700; color:var(--teal-ink);">${money(stat.revenue, currency)}</span>
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
            <div class="list-table reports-renewals-table" style="max-height: 300px; overflow-y: auto; overflow-x: hidden;">
              <div class="table-head">
                <span>Member</span>
                <span style="text-align:right;">Plan Price</span>
                <span style="text-align:right;">Expires In</span>
              </div>
              ${
                upcomingRenewals.length
                  ? upcomingRenewals.map(m => {
                      const plan = plans.find(p => p.id === m.planId);
                      const expiresColor = m.daysLeft === 0 
                        ? "var(--danger)" 
                        : m.daysLeft <= 7 
                          ? "var(--warning)" 
                          : "var(--teal-ink)";
                      return `
                        <div class="table-row">
                          <span data-label="Member">
                            <strong>${escapeHtml(m.fullName)}</strong>
                            <small>${escapeHtml(plan?.planName || "Custom")}</small>
                          </span>
                          <span data-label="Plan Price" style="text-align:right; font-weight:700; color:var(--ink-soft);">${money(plan?.price || 0, currency)}</span>
                          <span data-label="Expires In" style="text-align:right; color: ${expiresColor}; font-weight:600;">${m.daysLeft === 0 ? "Today" : `${m.daysLeft} days`}</span>
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
            <div class="list-table reports-inactive-table" style="max-height: 300px; overflow-y: auto; overflow-x: hidden;">
              <div class="table-head">
                <span>Member</span>
                <span>Last Check-in</span>
                <span style="text-align:right;">Reach Out</span>
              </div>
              ${
                inactiveAlerts.length
                  ? inactiveAlerts.map(member => {
                      const memberCheckins = attendance.filter(a => a.memberId === member.id);
                      const latestDate = memberCheckins.reduce((lat, c) => c.date > lat ? c.date : lat, "");
                      const formattedDate = latestDate ? dateLabel(latestDate) : "Never";
                      
                      const phone = member.whatsapp || member.mobile || "";
                      const formattedPhone = phone.replace(/[^0-9]/g, "");
                      const message = `Hey ${member.fullName}! We missed you at ${settings?.gymName || "the gym"} lately. Hope everything is going well! Let us know when you plan to drop by next.`;
                      const waUrl = `https://wa.me/${formattedPhone ? formattedPhone : ""}?text=${encodeURIComponent(message)}`;

                      return `
                        <div class="table-row">
                          <span data-label="Member">
                            <strong>${escapeHtml(member.fullName)}</strong>
                            <small>${escapeHtml(phone)}</small>
                          </span>
                          <span data-label="Last Check-in" style="color: var(--ink-soft);">${formattedDate}</span>
                          <span data-label="Reach Out" style="text-align:right;">
                            <a href="${waUrl}" target="_blank" class="icon-button secondary" 
                               style="background:#25D366; border-color:#25D366; color:white; display:inline-flex; align-items:center; padding: 6px 12px; font-size:0.75rem; gap:6px; text-decoration:none; border-radius:var(--r-sm); font-weight:600;" 
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
    } else if (this.activeTab !== "members-report") {
      // ── Overview & Exports Content ─────────────────────────────────────────
      return `
        ${headerHtml}
        ${tabsSwitcherHtml}
        
        <div class="metric-grid">
          <article class="metric"><span>Total revenue</span><strong>${money(revenue, currency)}</strong></article>
          <article class="metric"><span>Active members</span><strong>${activeCount}</strong></article>
          <article class="metric"><span>Attendance records</span><strong>${attendance.length}</strong></article>
          <article class="metric"><span>Inactive members</span><strong>${inactive.length}</strong></article>
        </div>
        <div class="split-grid">
          <section class="panel">
            <div class="panel-heading"><h2>Inactive Members</h2></div>
            <div class="list-table compact">
              ${
                inactive.length
                  ? inactive
                      .map(
                        (member) => `
                          <div class="table-row">
                            <span data-label="Member"><strong>${escapeHtml(member.fullName)}</strong><small>${escapeHtml(member.mobile || "")}</small></span>
                            <span data-label="Expiry" style="text-align: right; font-weight: 600; color: var(--ink-soft);">${dateLabel(member.endDate)}</span>
                          </div>
                        `
                      )
                      .join("")
                  : `<div class="table-empty">No inactive members.</div>`
              }
            </div>
          </section>
          <section class="panel">
            <div class="panel-heading"><h2>Recent Payments</h2></div>
            <div class="list-table compact">
              ${
                payments.length
                  ? payments
                      .slice(0, 8)
                      .map(
                        (payment) => `
                          <div class="table-row">
                            <span data-label="Member"><strong>${escapeHtml(findName(members, payment.memberId))}</strong><small>${dateLabel(payment.date)}</small></span>
                            <span data-label="Amount" style="text-align: right; font-weight: 700; color: var(--teal-ink);">${money(payment.amount, currency)}</span>
                          </div>
                        `
                      )
                      .join("")
                  : `<div class="table-empty">No payments recorded.</div>`
              }
            </div>
          </section>
        </div>
      `;
    }
  },

  bind(root, context) {
    // Bind Tab Click Handlers
    root.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab = btn.dataset.tab;
        context.refreshView();
      });
    });

    if (this.activeTab === "analytics") {
      // Bind revenue filter toggles
      root.querySelectorAll("[data-rev-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
          this.revenueFilter = btn.dataset.revFilter;
          context.refreshView();
        });
      });
    } else if (this.activeTab === "members-report") {
      // Members Report tab has no special bindings currently
    } else if (this.activeTab === "overview") {
      // Bind Excel Export buttons
      root.querySelectorAll("[data-export]").forEach((button) => {
        button.addEventListener("click", async () => {
          const kind = button.dataset.export;
          const label = button.textContent;
          button.disabled = true;
          button.textContent = "Preparing...";
          try {
            const sheets = buildSheets(kind, context);
            await exportToExcel(filenameFor(kind, context.settings), sheets);
            context.toast("Excel export downloaded.");
          } catch (error) {
            context.toast(error.message || "Export failed.");
          } finally {
            button.disabled = false;
            button.textContent = label;
          }
        });
      });
    }
  }
};

// ── Members Report Tab ────────────────────────────────────────────────────────
function renderMembersReport(headerHtml, tabsSwitcherHtml, members, attendance, plans, todayStr) {
  // ── Pending Members ───────────────────────────────────────────────────────
  const pendingMembers = members
    .filter(m => m.status === "Pending")
    .map(m => {
      const joinDate = m.joinDate || m.startDate || "";
      let daysPending = 0;
      if (joinDate) {
        const diff = new Date(todayStr) - new Date(joinDate);
        daysPending = Math.max(0, Math.floor(diff / 86400000));
      }
      return { ...m, joinDate, daysPending };
    })
    .sort((a, b) => b.daysPending - a.daysPending);

  // ── Points Leaderboard ────────────────────────────────────────────────────
  const pointsLeaderboard = [...members]
    .map(m => ({
      ...m,
      pts: Number(m.points || 0),
      computedStatus: memberStatus(m)
    }))
    .sort((a, b) => b.pts - a.pts);

  const maxPts = Math.max(...pointsLeaderboard.map(m => m.pts), 1);

  const RANK_COLORS = ["#F97316", "#94A3B8", "#B45309"];
  const RANK_LABELS = ["1st", "2nd", "3rd"];

  // ── Summary metrics ───────────────────────────────────────────────────────
  const totalPts    = pointsLeaderboard.reduce((s, m) => s + m.pts, 0);
  const avgPts      = pointsLeaderboard.length ? (totalPts / pointsLeaderboard.length).toFixed(1) : 0;
  const topMember   = pointsLeaderboard[0];
  const pendingCount = pendingMembers.length;

  return `
    ${headerHtml}
    ${tabsSwitcherHtml}

    <!-- Summary Metrics -->
    <div class="metric-grid" style="margin-bottom: 25px;">
      <article class="metric">
        <span>Pending Activations</span>
        <strong style="color: ${pendingCount > 0 ? 'var(--warning)' : 'var(--teal-ink)'}">${pendingCount}</strong>
        <small style="color: var(--text-muted);">Members awaiting activation</small>
      </article>
      <article class="metric">
        <span>Points Leader</span>
        <strong>${escapeHtml(topMember?.fullName || "N/A")}</strong>
        <small style="color: var(--teal-ink); font-weight: 600;">${topMember?.pts.toLocaleString() || 0} pts</small>
      </article>
      <article class="metric">
        <span>Avg. Member Points</span>
        <strong>${Number(avgPts).toLocaleString()}</strong>
        <small style="color: var(--text-muted);">Across all ${members.length} members</small>
      </article>
      <article class="metric">
        <span>Total Points Issued</span>
        <strong>${totalPts.toLocaleString()}</strong>
        <small style="color: var(--text-muted);">Cumulative gym-wide</small>
      </article>
    </div>

    <!-- Main two-column grid -->
    <div class="split-grid" style="margin-bottom: 25px;">

      <!-- LEFT: Pending Members -->
      <section class="panel stack">
        <div class="panel-heading">
          <h2 style="display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-outlined" style="font-size:1.2rem; color:var(--warning);">pending_actions</span>
            Pending Members
          </h2>
          <span style="color:var(--warning); font-weight:700; font-size:0.9rem;">${pendingCount} pending</span>
        </div>
        <div class="list-table reports-pending-table" style="max-height: 420px; overflow-y: auto; overflow-x: hidden;">
          <div class="table-head">
            <span>Member</span>
            <span>Join Date</span>
            <span style="text-align:right;">Days Pending</span>
          </div>
          ${
            pendingMembers.length
              ? pendingMembers.map(m => `
                  <div class="table-row" style="border-left: 3px solid var(--warning);">
                    <span data-label="Member">
                      <strong>${escapeHtml(m.fullName || "-")}</strong>
                      <small style="color:var(--text-muted);">${escapeHtml(m.mobile || m.email || "-")}</small>
                    </span>
                    <span data-label="Join Date" style="color:var(--ink-soft);">${m.joinDate ? dateLabel(m.joinDate) : "-"}</span>
                    <span data-label="Days Pending" style="text-align:right;">
                      <mark style="background: ${m.daysPending >= 7 ? 'rgba(245,158,11,0.18)' : 'rgba(16,185,129,0.12)'}; color: ${m.daysPending >= 7 ? 'var(--warning)' : 'var(--teal-ink)'}; border-radius:12px; padding:3px 10px; font-size:0.8rem; font-weight:700;">${m.daysPending}d</mark>
                    </span>
                  </div>
                `).join("")
              : `<div class="table-empty" style="padding:32px 0; text-align:center;">
                  <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--teal); display:block; margin-bottom:8px;">check_circle</span>
                  <strong style="color:var(--teal-ink);">All clear!</strong>
                  <p style="color:var(--text-muted); font-size:0.9rem; margin-top:4px;">No members are currently pending activation.</p>
                </div>`
          }
        </div>
      </section>

      <!-- RIGHT: Points Leaderboard -->
      <section class="panel stack">
        <div class="panel-heading">
          <h2 style="display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-outlined" style="font-size:1.2rem; color:var(--primary);">leaderboard</span>
            Points Leaderboard
          </h2>
          <span style="color:var(--text-muted); font-size:0.85rem;">${members.length} members</span>
        </div>
        <div class="list-table reports-points-table" style="max-height: 420px; overflow-y: auto; overflow-x: hidden;">
          <div class="table-head">
            <span>Rank</span>
            <span>Member</span>
            <span>Points</span>
            <span style="text-align:right;">Status</span>
          </div>
          ${
            pointsLeaderboard.length
              ? pointsLeaderboard.map((m, idx) => {
                  const rank = idx + 1;
                  const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : "var(--text-muted)";
                  const rankLabel = rank <= 3 ? RANK_LABELS[rank - 1] : `#${rank}`;
                  const barPct = maxPts > 0 ? Math.max(2, Math.round((m.pts / maxPts) * 100)) : 0;
                  const sc = statusClass(m.computedStatus);
                  return `
                    <div class="table-row">
                      <span data-label="Rank" style="font-weight:800; font-size:0.85rem; color:${rankColor}; min-width:36px;">${rankLabel}</span>
                      <span data-label="Member">
                        <strong>${escapeHtml(m.fullName || "-")}</strong>
                        <small style="color:var(--text-muted);">${dateLabel(m.joinDate || m.startDate || "")}</small>
                      </span>
                      <span data-label="Points" style="min-width:90px;">
                        <span style="font-weight:700; font-size:0.9rem; color:var(--teal-ink);">${m.pts.toLocaleString()}</span>
                        <span style="display:block; height:5px; border-radius:99px; background:var(--surface-soft); margin-top:4px; overflow:hidden;">
                          <span style="display:block; height:100%; width:${barPct}%; border-radius:99px; background: ${rank === 1 ? 'var(--primary)' : rank <= 3 ? 'var(--warning)' : 'var(--teal)'}; transition: width 0.4s ease;"></span>
                        </span>
                      </span>
                      <span data-label="Status" style="text-align:right;">
                        <mark class="status ${sc}" style="font-size:0.75rem; font-weight:700; padding:3px 10px; border-radius:12px;">${escapeHtml(m.computedStatus)}</mark>
                      </span>
                    </div>
                  `;
                }).join("")
              : `<div class="table-empty">No member data yet.</div>`
          }
        </div>
      </section>

    </div>
  `;
}

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

  const areaD = points.length 
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
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
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--teal)" stop-opacity="0.25" />
            <stop offset="100%" stop-color="var(--teal)" stop-opacity="0.00" />
          </linearGradient>
        </defs>
        <style>
          .chart-tooltip { display: none; }
          .chart-point-group:hover .chart-tooltip { display: block; }
          .chart-point-group:hover circle { fill: var(--primary); r: 6; }
        </style>
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="var(--line-soft)" stroke-width="1" />
        <line x1="${paddingX}" y1="${paddingY}" x2="${paddingX}" y2="${height - paddingY}" stroke="var(--line-soft)" stroke-width="1" />
        ${areaD ? `<path d="${areaD}" fill="url(#chart-area-grad)" />` : ""}
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

  const barsHtml = values.map((val, idx) => {
    const x = paddingX + idx * spacing + (spacing - barWidth) / 2;
    const barHeight = (val / maxVal) * (height - 2 * paddingY - 15);
    const y = height - paddingY - barHeight;
    return `
      <g style="cursor: pointer;">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="3" class="chart-bar" style="fill: var(--primary); opacity: 0.85; transition: fill 0.2s, opacity 0.2s;" />
        <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="8px" font-weight="700" fill="var(--text)">${values[idx] || ""}</text>
        <text x="${x + barWidth/2}" y="${height - 5}" text-anchor="middle" font-size="8px" fill="var(--text-muted)" font-weight="500">${labels[idx]}</text>
      </g>
    `;
  }).join("");

  return `
    <div style="width: 100%; display: flex; justify-content: center; align-items: center; padding-top: 15px;">
      <svg viewBox="0 0 450 180" style="width:100%; height:auto; overflow:visible;">
        <style>
          .chart-bar:hover { fill: var(--teal) !important; opacity: 1; }
        </style>
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="var(--line-soft)" stroke-width="1" />
        ${barsHtml}
      </svg>
    </div>
  `;
}

function buildSheets(kind, context) {
  const builders = {
    members: () => [membersSheet(context)],
    payments: () => [paymentsSheet(context)],
    attendance: () => [attendanceSheet(context)],
    renewals: () => [renewalsSheet(context)],
    all: () => [membersSheet(context), paymentsSheet(context), attendanceSheet(context), renewalsSheet(context)]
  };
  return (builders[kind] || builders.all)();
}

function filenameFor(kind, settings) {
  const slug = String(settings?.gymName || "gymflow").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "gymflow";
  const date = new Date().toISOString().slice(0, 10);
  return `${slug}-${kind}-${date}.xlsx`;
}

function membersSheet({ data }) {
  const plans = data.membership_plans || [];
  const trainers = data.trainers || [];
  const rows = (data.members || []).map((member) => ({
    Name: member.fullName || "",
    Mobile: member.mobile || "",
    Email: member.email || "",
    Gender: member.gender || "",
    Plan: findName(plans, member.planId, ""),
    Trainer: findName(trainers, member.assignedTrainer, ""),
    "Join Date": member.joinDate || "",
    "Start Date": member.startDate || "",
    "End Date": member.endDate || "",
    Status: memberStatus(member)
  }));
  return { name: "Members", rows };
}

function paymentsSheet({ data, settings }) {
  const members = data.members || [];
  const plans = data.membership_plans || [];
  const rows = (data.payments || []).map((payment) => ({
    Receipt: payment.receiptNumber || payment.id || "",
    Member: findName(members, payment.memberId, ""),
    Plan: findName(plans, payment.planId, ""),
    Amount: Number(payment.amount || 0),
    Currency: settings?.currency || "INR",
    Date: payment.date || "",
    Method: payment.method || "",
    Status: payment.status || "",
    "Collected By": payment.collectedBy || ""
  }));
  return { name: "Payments", rows };
}

function attendanceSheet({ data }) {
  const members = data.members || [];
  const trainers = data.trainers || [];
  const rows = (data.attendance || []).map((record) => ({
    Member: findName(members, record.memberId, ""),
    Date: record.date || "",
    Time: record.time || "",
    Trainer: findName(trainers, record.trainerId, "")
  }));
  return { name: "Attendance", rows };
}

function renewalsSheet({ data }) {
  const plans = data.membership_plans || [];
  const rows = (data.members || [])
    .map((member) => ({ ...member, remaining: daysUntil(member.endDate), computedStatus: memberStatus(member) }))
    .filter((member) => member.remaining <= 30 || member.computedStatus === "Expired")
    .sort((a, b) => a.remaining - b.remaining)
    .map((member) => ({
      Member: member.fullName || "",
      Mobile: member.mobile || "",
      Plan: findName(plans, member.planId, ""),
      "End Date": member.endDate || "",
      "Days Left": member.remaining,
      Status: member.computedStatus
    }));
  return { name: "Renewals", rows };
}
