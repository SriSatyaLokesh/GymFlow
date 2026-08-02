import { collections, dateLabel, emptyState, escapeHtml, findName, formData, nameCell, optionList, pageHeader, today, trendChart, withButtonLoading, getBadgeCss, renderBadgeIcon, getMemberTier, getBadgeClass } from "./utils.js";

const METRICS = [
  { key: "weight", label: "Weight (kg)", color: "var(--teal)" },
  { key: "bmi", label: "BMI", color: "var(--primary-strong)" },
  { key: "bodyFat", label: "Body Fat %", color: "#c36f2d" },
  { key: "waist", label: "Waist (cm)", color: "var(--ink-soft)" }
];

export const progressModule = {
  activeTab: "metrics",
  render(context) {
    if (context.profile?.role === "member") {
      return renderMemberProgress(context);
    }
    const { data } = context;
    const records = data.progress_records || [];
    const members = data.members || [];
    const firstMember = members[0]?.id || "";

    return `
      ${pageHeader("Progress")}
      <div class="work-grid">
        <form class="panel stack" id="progress-form">
          <div class="panel-heading"><h2>Add Progress Record</h2></div>
          <div class="form-grid">
            <label>Member<select name="memberId" required><option value="">Select member</option>${optionList(members, "fullName")}</select></label>
            <label>Date<input name="date" type="date" value="${today()}" required /></label>
            <label>Weight kg<input name="weight" type="number" min="0" step="0.1" /></label>
            <label>BMI<input name="bmi" type="number" min="0" step="0.1" /></label>
            <label>Body fat %<input name="bodyFat" type="number" min="0" step="0.1" /></label>
            <label>Chest cm<input name="chest" type="number" min="0" step="0.1" /></label>
            <label>Waist cm<input name="waist" type="number" min="0" step="0.1" /></label>
            <label class="wide">Notes<textarea name="notes" rows="2"></textarea></label>
          </div>
          <button class="primary-button" type="submit"><span class="material-symbols-outlined">add</span>Save progress</button>
        </form>

        <section class="panel">
          <div class="panel-heading">
            <h2>Progress Chart</h2>
            <div class="button-row">
              <select data-chart-member>
                <option value="">Select member</option>
                ${optionList(members, "fullName", firstMember)}
              </select>
              <select data-chart-metric>
                ${METRICS.map((m) => `<option value="${m.key}">${m.label}</option>`).join("")}
              </select>
            </div>
          </div>
          <div data-chart>${chartFor(records, firstMember, "weight")}</div>
        </section>
      </div>

      <section class="panel" style="margin-top:18px">
        <div class="panel-heading"><h2>Progress History</h2><span>${records.length} records</span></div>
        ${
          records.length
            ? `<div class="data-table progress-history-table">
                <div class="table-head"><span>Member</span><span>Date</span><span>Weight</span><span>BMI</span><span>Notes</span></div>
                ${records.map((record) => row(record, members)).join("")}
              </div>`
            : emptyState("No progress records", "Track body measurements and notes over time.")
        }
      </section>
    `;
  },
  bind(root, context) {
    if (context.profile?.role === "member") {
      bindMemberProgress(root, context);
      return;
    }
    const form = root.querySelector("#progress-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withButtonLoading(form.querySelector("[type='submit']"), async () => {
        const saved = await context.services.data.save(collections.progress, formData(form));
        context.toast("Progress saved.");
        form.reset();
        form.date.value = today();
        context.applyChange(collections.progress, saved);
      });
    });

    const memberSel = root.querySelector("[data-chart-member]");
    const metricSel = root.querySelector("[data-chart-metric]");
    const chartBox = root.querySelector("[data-chart]");
    function redraw() {
      chartBox.innerHTML = chartFor(context.data.progress_records || [], memberSel.value, metricSel.value);
    }
    memberSel?.addEventListener("change", redraw);
    metricSel?.addEventListener("change", redraw);
  }
};

// ===== Member read-only progress view =====
function renderMemberProgress(context) {
  const me = context.myMember;
  if (!me) {
    return `
      ${pageHeader("Progress")}
      ${emptyState("Membership being set up", "Your progress records will appear here once your gym adds them.")}
    `;
  }

  const activeTab = progressModule.activeTab || "metrics";

  const tabHeader = `
    <div class="tabs-header" style="margin-bottom: 18px; border-bottom: 1px solid var(--line); justify-content: flex-start; gap: 8px;">
      <button class="tab-btn ${activeTab === "metrics" ? "active" : ""}" data-progress-tab="metrics" style="padding: 8px 16px; font-size: 0.85rem;">
        Metrics & History
      </button>
      <button class="tab-btn ${activeTab === "badges" ? "active" : ""}" data-progress-tab="badges" style="padding: 8px 16px; font-size: 0.85rem;">
        Badges & PRs
      </button>
    </div>
  `;

  if (activeTab === "metrics") {
    const records = (context.data.progress_records || [])
      .filter((r) => r.memberId === me.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    return `
      ${pageHeader("Progress")}
      ${tabHeader}
      <section class="panel">
        <div class="panel-heading">
          <h2>My Trend</h2>
          <select data-chart-metric>
            ${METRICS.map((m) => `<option value="${m.key}">${m.label}</option>`).join("")}
          </select>
        </div>
        <div data-chart>${chartFor(records, me.id, "weight")}</div>
      </section>
      <section class="panel" style="margin-top:18px">
        <div class="panel-heading"><h2>History</h2><span>${records.length} records</span></div>
        ${
          records.length
            ? `<div class="data-table member-progress-history-table">
                <div class="table-head"><span>Date</span><span>Weight</span><span>BMI</span><span>Notes</span></div>
                ${records
                  .map(
                    (record) => `
                      <div class="table-row">
                        <span data-label="Date">${dateLabel(record.date)}</span>
                        <span data-label="Weight">${escapeHtml(record.weight || "-")} kg</span>
                        <span data-label="BMI">${escapeHtml(record.bmi || "-")}</span>
                        <span data-label="Notes"><small>${escapeHtml(record.notes || "")}</small></span>
                      </div>
                    `
                  )
                  .join("")}
              </div>`
            : emptyState("No progress records", "Your gym hasn't recorded any measurements yet.")
        }
      </section>
    `;
  } else {
    const badges = context.data.badges || [];
    const unlockedBadgeIds = me.unlockedBadges || [];
    const personalRecords = me.personalRecords || {};
    const myLogsCount = (context.data.workout_logs || []).filter(l => l.memberId === me.id).length;
    const currentStreak = me.currentStreak || 0;
    const tier = getMemberTier(me.points || 0);

    const levelSummaryHtml = `
      <section class="panel">
        <div class="panel-heading">
          <h2>Level & Rank</h2>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-soft); padding: 16px 20px; border-radius: var(--r-md); box-shadow: var(--shadow-card); margin-top: 12px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <span style="font-size: 0.85rem; color: var(--muted); font-weight:600;">Total Score</span>
            <strong style="font-size: 1.6rem; color: var(--accent);">${me.points || 0} <span style="font-size: 0.9rem; font-weight: normal; color: var(--muted);">Points</span></strong>
          </div>
          <div class="tier-badge ${tier.class}">
            <span class="material-symbols-outlined" style="font-size:18px;">${tier.icon}</span>
            ${tier.name} Tier
          </div>
        </div>
      </section>
    `;

    const badgesHtml = `
      <section class="panel" style="margin-top: 18px;">
        <div class="panel-heading">
          <h2>My Badges</h2>
          <span>${unlockedBadgeIds.length} / ${badges.length} unlocked</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 15px; margin-top: 15px;">
          ${badges.map(badge => {
            const isUnlocked = unlockedBadgeIds.includes(badge.id);
            const cardClass = getBadgeClass(badge.id, isUnlocked);
            let progressHtml = "";
            if (!isUnlocked) {
              let currentVal = 0;
              let threshold = badge.threshold;
              let unit = "";
              if (badge.type === "streak") {
                currentVal = currentStreak;
                unit = "days";
              } else if (badge.type === "workout_count") {
                currentVal = myLogsCount;
                unit = "workouts";
              } else if (badge.type === "pr") {
                currentVal = Object.keys(personalRecords).length;
                unit = "PR";
              } else if (badge.type === "pr_weight") {
                currentVal = Math.max(...Object.values(personalRecords).map(Number), 0);
                unit = "kg";
              }
              const pct = Math.min(100, Math.round((currentVal / threshold) * 100));
              progressHtml = `
                <div style="margin-top: 8px; width: 100%;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--muted); margin-bottom: 3px;">
                    <span>Progress</span>
                    <span>${currentVal}/${threshold} ${unit}</span>
                  </div>
                  <div class="nm-progress-track">
                    <div class="nm-progress-bar" style="width: ${pct}%;"></div>
                  </div>
                </div>
              `;
            }

            return `
              <div class="${cardClass}">
                <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                  ${renderBadgeIcon(badge.id, isUnlocked)}
                  <div style="text-align: left; flex: 1;">
                    <strong style="font-size: 0.9rem; color: inherit; display: block; font-weight:700;">${escapeHtml(badge.name)}</strong>
                    <div style="font-size: 0.72rem; color: inherit; opacity: 0.85; line-height: 1.3;">${escapeHtml(badge.description)}</div>
                  </div>
                </div>
                ${progressHtml}
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;

    const prList = Object.entries(personalRecords);
    const prsHtml = `
      <section class="panel" style="margin-top: 18px;">
        <div class="panel-heading">
          <h2>Personal Records</h2>
          <span>${prList.length} exercises</span>
        </div>
        ${prList.length ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr)); gap: 12px; margin-top: 15px;">
            ${prList.map(([exercise, weight]) => `
              <div style="background: var(--surface-soft); padding: 14px 16px; border-radius: var(--r-md); border-left: 4px solid var(--teal); box-shadow: var(--shadow-card); display:flex; flex-direction:column; gap:4px; text-align:left;">
                <span style="font-size: 0.75rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing:0.5px;">${escapeHtml(exercise)}</span>
                <strong style="font-size: 1.2rem; color: var(--ink-soft);">${weight} <span style="font-size: 0.85rem; font-weight:normal; color:var(--muted)">kg</span></strong>
              </div>
            `).join("")}
          </div>
        ` : `<div class="table-empty" style="margin-top:15px;">Log a workout with set weights to record your first PR!</div>`}
      </section>
    `;

    return `
      ${pageHeader("Progress")}
      ${tabHeader}
      ${levelSummaryHtml}
      ${badgesHtml}
      ${prsHtml}
    `;
  }
}

function bindMemberProgress(root, context) {
  const tabButtons = root.querySelectorAll("[data-progress-tab]");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      progressModule.activeTab = btn.dataset.progressTab;
      context.refreshView();
    });
  });

  const me = context.myMember;
  if (!me || progressModule.activeTab === "badges") return;

  const metricSel = root.querySelector("[data-chart-metric]");
  const chartBox = root.querySelector("[data-chart]");
  if (!metricSel || !chartBox) return;
  metricSel.addEventListener("change", () => {
    const records = (context.data.progress_records || []).filter((r) => r.memberId === me.id);
    chartBox.innerHTML = chartFor(records, me.id, metricSel.value);
  });
}

function chartFor(records, memberId, metricKey) {
  if (!memberId) return `<div class="table-empty">Select a member to see their trend.</div>`;
  const metric = METRICS.find((m) => m.key === metricKey) || METRICS[0];
  const series = records
    .filter((r) => r.memberId === memberId && r[metric.key] !== "" && r[metric.key] != null)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((r) => ({ label: dateLabel(r.date), value: Number(r[metric.key]) }));
  return trendChart(series, { color: metric.color });
}

function row(record, members) {
  return `
    <div class="table-row">
      <span data-label="Member">${nameCell(findName(members, record.memberId), "", members.find(m => m.id === record.memberId)?.avatarUrl || "")}</span>
      <span data-label="Date">${dateLabel(record.date)}</span>
      <span data-label="Weight">${escapeHtml(record.weight || "-")} kg</span>
      <span data-label="BMI">${escapeHtml(record.bmi || "-")}</span>
      <span data-label="Notes"><small>${escapeHtml(record.notes || "")}</small></span>
    </div>
  `;
}
