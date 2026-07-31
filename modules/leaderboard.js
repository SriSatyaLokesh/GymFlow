import { escapeHtml, memberStatus, pageHeader } from "./utils.js";

// ── Persistent session state ──────────────────────────────────────────────────
const lb = {
  activeTab:         "points",
  filterGender:      "All",
  filterAgeGroup:    "All",
  filterWeightClass: "All",
};

// ── Age group definitions ─────────────────────────────────────────────────────
const AGE_GROUPS = [
  { id: "All",     label: "All Ages"     },
  { id: "teen",    label: "Teen (<18)"   },
  { id: "youth",   label: "Youth 18–25"  },
  { id: "adult",   label: "Adult 26–40"  },
  { id: "senior",  label: "Senior 41–55" },
  { id: "master",  label: "Master 55+"   },
  { id: "unknown", label: "Age Unknown"  },
];

// ── Age & group helpers ───────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function getAgeGroupId(age) {
  if (age === null) return "unknown";
  if (age < 18)  return "teen";
  if (age <= 25) return "youth";
  if (age <= 40) return "adult";
  if (age <= 55) return "senior";
  return "master";
}

// ── Rank display helpers — use CSS token names so light/dark both pass WCAG ──
const RANK_STYLES = [
  { colorVar: "var(--gold-ink)",   shadowRgb: "255,215,0",   bgVar: "var(--gold-bg)",   borderVar: "rgba(255,215,0,0.3)",   icon: "military_tech" },
  { colorVar: "var(--silver-ink)", shadowRgb: "192,192,192", bgVar: "var(--silver-bg)", borderVar: "rgba(192,192,192,0.25)", icon: "military_tech" },
  { colorVar: "var(--bronze-ink)", shadowRgb: "205,127,50",  bgVar: "var(--bronze-bg)", borderVar: "rgba(205,127,50,0.25)",  icon: "military_tech" },
];

export const leaderboardModule = {
  render(context) {
    const { data } = context;
    const members    = data.members    || [];
    const attendance = data.attendance || [];
    const gymId      = context.profile?.gymId || "";

    // ── Eligible members (not Pending, not private) ───────────────────────────
    const eligible = members.filter(
      (m) => m.gymId === gymId && m.status !== "Pending" && !m.privateLeaderboard
    );

    // ── Latest weight helper ──────────────────────────────────────────────────
    const getWeight = (memberId) => {
      const recs = (data.progress_records || []).filter((r) => r.memberId === memberId);
      if (!recs.length) return 0;
      return Number([...recs].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0].weight || 0);
    };

    const currentMonth = new Date().toISOString().slice(0, 7);

    // ── Build enriched list ───────────────────────────────────────────────────
    const allRanked = eligible.map((m) => {
      const weight = getWeight(m.id);
      let weightClass = "Under 65kg";
      if (weight >= 85)      weightClass = "85kg+";
      else if (weight >= 75) weightClass = "75-85kg";
      else if (weight >= 65) weightClass = "65-75kg";

      const allCheckins     = attendance.filter((r) => r.memberId === m.id);
      const monthlyCheckins = allCheckins.filter((r) => String(r.date || "").startsWith(currentMonth)).length;
      const age             = calcAge(m.dateOfBirth);

      return {
        id: m.id,
        fullName:       m.fullName || "—",
        gender:         m.gender   || "Not specified",
        age,
        ageGroupId:     getAgeGroupId(age),
        points:         Number(m.points || 0),
        streak:         Number(m.currentStreak || 0),
        monthlyCheckins,
        totalCheckins:  allCheckins.length,
        weightClass,
        computedStatus: memberStatus(m),
      };
    });

    // ── Filter ────────────────────────────────────────────────────────────────
    let filtered = [...allRanked];
    if (lb.filterGender !== "All")       filtered = filtered.filter((m) => m.gender === lb.filterGender);
    if (lb.filterAgeGroup !== "All")     filtered = filtered.filter((m) => m.ageGroupId === lb.filterAgeGroup);
    if (lb.filterWeightClass !== "All")  filtered = filtered.filter((m) => m.weightClass === lb.filterWeightClass);

    // ── Sort per tab ──────────────────────────────────────────────────────────
    let displayKey  = "points";
    let displayUnit = "pts";
    let subKey      = "streak";
    let subUnit     = "d streak";

    if (lb.activeTab === "points") {
      filtered.sort((a, b) => b.points - a.points || a.fullName.localeCompare(b.fullName));
      displayKey = "points"; displayUnit = "pts"; subKey = "streak"; subUnit = "d streak";
    } else if (lb.activeTab === "consistency") {
      filtered.sort((a, b) => b.streak - a.streak || b.monthlyCheckins - a.monthlyCheckins || a.fullName.localeCompare(b.fullName));
      displayKey = "streak"; displayUnit = "days"; subKey = "monthlyCheckins"; subUnit = "check-ins/mo";
    } else if (lb.activeTab === "checkins") {
      filtered.sort((a, b) => b.monthlyCheckins - a.monthlyCheckins || b.totalCheckins - a.totalCheckins || a.fullName.localeCompare(b.fullName));
      displayKey = "monthlyCheckins"; displayUnit = "this mo."; subKey = "totalCheckins"; subUnit = "total";
    }

    const maxVal = Math.max(...filtered.map((m) => m[displayKey]), 1);

    // ── Filter label for display ──────────────────────────────────────────────
    const isFiltered = lb.filterGender !== "All" || lb.filterAgeGroup !== "All" || lb.filterWeightClass !== "All";
    const filterParts = [
      lb.filterGender !== "All" ? lb.filterGender : null,
      lb.filterAgeGroup !== "All" ? (AGE_GROUPS.find((g) => g.id === lb.filterAgeGroup)?.label) : null,
      lb.filterWeightClass !== "All" ? lb.filterWeightClass : null,
    ].filter(Boolean);

    // ── Available options in eligible list (only show what exists) ────────────
    const gendersPresent     = [...new Set(allRanked.map((m) => m.gender).filter(Boolean))].sort();
    const ageGroupsPresent   = [...new Set(allRanked.map((m) => m.ageGroupId))];
    const weightClassesPresent = [...new Set(allRanked.map((m) => m.weightClass))];

    const WEIGHT_CLASSES = ["Under 65kg", "65-75kg", "75-85kg", "85kg+"];

    // ── Summary stats for current filtered view ───────────────────────────────
    const champion   = filtered[0];
    const byStreak   = [...filtered].sort((a, b) => b.streak - a.streak)[0];
    const byActive   = [...filtered].sort((a, b) => b.monthlyCheckins - a.monthlyCheckins)[0];
    const totalPts   = filtered.reduce((s, m) => s + m.points, 0);

    // ── Render full list rows ─────────────────────────────────────────────────
    const rows = filtered.map((m, idx) => {
      const rank   = idx + 1;
      const rs     = RANK_STYLES[rank - 1] || null;
      const val    = m[displayKey];
      const subVal = m[subKey];
      const barW   = maxVal > 0 ? Math.max(2, Math.round((val / maxVal) * 100)) : 0;
      const ageStr = m.age !== null ? `${m.age}y` : "";

      const rankCell = rs
        ? `<span class="material-symbols-outlined" style="font-size:1.4rem; color:${rs.colorVar}; font-variation-settings:'FILL' 1;">${rs.icon}</span>`
        : `<span style="font-size:0.82rem; font-weight:800; color:var(--text-muted); display:inline-block; width:24px; text-align:center; font-variant-numeric:tabular-nums;">#${rank}</span>`;

      const rowBg     = rs ? rs.bgVar : "transparent";
      const rowBorder = rs ? rs.borderVar : "var(--line)";

      return `
        <div class="lb-list-row" style="
          display: grid;
          grid-template-columns: 44px 1fr minmax(80px,140px);
          align-items: center;
          gap: 12px;
          padding: 11px 16px;
          border-radius: var(--r-md);
          margin-bottom: 5px;
          background: ${rowBg};
          border: 1px solid ${rowBorder};
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.15s ease;
          cursor: default;
        ">
          <!-- Rank -->
          <div style="display:flex; justify-content:center; align-items:center; flex-shrink:0;">
            ${rankCell}
          </div>

          <!-- Name + meta tags -->
          <div style="min-width:0;">
            <div style="font-weight:700; font-size:0.93rem; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${escapeHtml(m.fullName)}
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:3px; flex-wrap:wrap;">
              ${m.gender && m.gender !== "Not specified" ? `<span class="lb-tag">${m.gender}</span>` : ""}
              ${ageStr ? `<span class="lb-tag lb-tag-teal">${ageStr}</span>` : ""}
              <span class="lb-tag">${m.weightClass}</span>
              <span style="font-size:0.73rem; color:var(--text-muted); margin-left:2px;">${subVal} ${subUnit}</span>
            </div>
          </div>

          <!-- Score + bar -->
          <div style="text-align:right;">
            <div style="display:flex; justify-content:flex-end; align-items:baseline; gap:3px; margin-bottom:5px;">
              <span style="font-weight:900; font-size:1rem; color:${rs ? rs.colorVar : "var(--text)"}; font-variant-numeric:tabular-nums; letter-spacing:-0.3px;">
                ${Number(val).toLocaleString()}
              </span>
              <small style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${displayUnit}</small>
            </div>
            <div style="height:3px; background:var(--line); border-radius:99px; overflow:hidden;">
              <div style="height:100%; width:${barW}%; border-radius:99px;
                background:${rs ? rs.colorVar : "var(--teal-text);"};
              "></div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // ── Tab builder ───────────────────────────────────────────────────────────
    const TAB_ITEMS = [
      { id: "points",      icon: "emoji_events",         label: "Points"    },
      { id: "consistency", icon: "local_fire_department", label: "Streak"    },
      { id: "checkins",    icon: "how_to_reg",            label: "Check-ins" },
    ];
    const tabsHtml = TAB_ITEMS.map(({ id, icon, label }) => {
      const active = lb.activeTab === id;
      return `
        <button data-lb-tab="${id}" style="
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:var(--r-pill);
          font-weight:700; font-size:0.82rem; letter-spacing:0.3px;
          cursor:pointer; transition:all 0.2s ease; white-space:nowrap;
          border:1.5px solid ${active ? "var(--primary)" : "var(--line)"};
          background:${active ? "var(--primary)" : "transparent"};
          color:${active ? "var(--on-primary,#121212)" : "var(--text-muted)"};
          box-shadow:${active ? "0 0 14px var(--primary-glow,rgba(204,255,0,0.25))" : "none"};
        ">
          <span class="material-symbols-outlined" style="font-size:0.95rem; font-variation-settings:'FILL' ${active ? "1" : "0"};">${icon}</span>
          ${label}
        </button>
      `;
    }).join("");

    // ── Filter bar (single horizontal row of selects) ─────────────────────────
    const selectStyle = `
      padding: 7px 10px; padding-right: 28px;
      border-radius: var(--r-sm);
      background: var(--surface);
      border: 1.5px solid var(--line);
      color: var(--text);
      font-size: 0.83rem;
      font-weight: 600;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
      min-width: 120px;
    `;

    const activeStyle = `border-color: var(--teal) !important; box-shadow: 0 0 0 2px rgba(0,194,255,0.15) !important;`;

    const genderOptions = [
      `<option value="All">All Genders</option>`,
      ...gendersPresent.map((g) => `<option value="${g}" ${lb.filterGender === g ? "selected" : ""}>${g}</option>`),
    ].join("");

    const ageOptions = [
      `<option value="All">All Ages</option>`,
      ...AGE_GROUPS.slice(1).filter((g) => ageGroupsPresent.includes(g.id)).map((g) =>
        `<option value="${g.id}" ${lb.filterAgeGroup === g.id ? "selected" : ""}>${g.label}</option>`
      ),
    ].join("");

    const weightOptions = [
      `<option value="All">All Weights</option>`,
      ...WEIGHT_CLASSES.filter((wc) => weightClassesPresent.includes(wc)).map((wc) =>
        `<option value="${wc}" ${lb.filterWeightClass === wc ? "selected" : ""}>${wc}</option>`
      ),
    ].join("");

    const filterBar = `
      <div style="
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding: 12px 16px;
        background: var(--surface-soft);
        border: 1px solid var(--line);
        border-radius: var(--r-md);
        margin-bottom: 16px;
      ">
        <span class="material-symbols-outlined" style="font-size:1rem; color:var(--text-muted); flex-shrink:0;">filter_list</span>

        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; flex:1;">
          <!-- Gender -->
          <label style="display:flex; align-items:center; gap:6px; font-size:0.77rem; font-weight:700; color:var(--text-muted); white-space:nowrap;">
            <span class="material-symbols-outlined" style="font-size:0.85rem;">person</span>
            <select id="lb-gender" style="${selectStyle} ${lb.filterGender !== "All" ? activeStyle : ""}">
              ${genderOptions}
            </select>
          </label>

          <div style="width:1px; height:20px; background:var(--line); flex-shrink:0;"></div>

          <!-- Age -->
          <label style="display:flex; align-items:center; gap:6px; font-size:0.77rem; font-weight:700; color:var(--text-muted); white-space:nowrap;">
            <span class="material-symbols-outlined" style="font-size:0.85rem;">cake</span>
            <select id="lb-age" style="${selectStyle} ${lb.filterAgeGroup !== "All" ? activeStyle : ""}">
              ${ageOptions}
            </select>
          </label>

          <div style="width:1px; height:20px; background:var(--line); flex-shrink:0;"></div>

          <!-- Weight -->
          <label style="display:flex; align-items:center; gap:6px; font-size:0.77rem; font-weight:700; color:var(--text-muted); white-space:nowrap;">
            <span class="material-symbols-outlined" style="font-size:0.85rem;">fitness_center</span>
            <select id="lb-weight" style="${selectStyle} ${lb.filterWeightClass !== "All" ? activeStyle : ""}">
              ${weightOptions}
            </select>
          </label>
        </div>

        <!-- Active filter chip + clear -->
        ${isFiltered ? `
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0; flex-wrap:wrap;">
            <span style="
              display:inline-flex; align-items:center; gap:5px;
              padding:4px 10px; border-radius:var(--r-pill);
              background:var(--primary-text-bg); border:1px solid rgba(204,255,0,0.3);
              font-size:0.75rem; font-weight:700; color:var(--primary-ink);
            ">
              <span class="material-symbols-outlined" style="font-size:0.8rem;">filter_alt</span>
              ${escapeHtml(filterParts.join(" · "))}
            </span>
            <button data-lb-reset style="
              display:inline-flex; align-items:center; gap:4px;
              padding:4px 10px; border-radius:var(--r-pill); cursor:pointer;
              background:transparent; border:1px solid var(--line);
              font-size:0.75rem; font-weight:700; color:var(--text-muted);
              transition:all 0.18s ease;
            ">
              <span class="material-symbols-outlined" style="font-size:0.8rem;">close</span>
              Clear
            </button>
          </div>
        ` : `
          <span style="font-size:0.77rem; color:var(--text-muted); flex-shrink:0;">
            ${filtered.length} of ${allRanked.length} members
          </span>
        `}
      </div>
    `;

    return `
      <style>
        .lb-list-row:hover {
          background: var(--surface-strong, rgba(255,255,255,0.04)) !important;
          border-color: rgba(0,194,255,0.3) !important;
          transform: translateX(2px) !important;
        }
        .lb-tag {
          display: inline-block;
          padding: 1px 7px;
          border-radius: var(--r-pill);
          font-size: 0.7rem;
          font-weight: 700;
          background: var(--surface-strong, rgba(255,255,255,0.06));
          color: var(--text-muted);
          border: 1px solid var(--line);
          white-space: nowrap;
        }
        .lb-tag.lb-tag-teal {
          color: var(--teal-ink);
          background: rgba(0,194,255,0.08);
          border-color: rgba(0,194,255,0.2);
        }
        #lb-gender:focus, #lb-age:focus, #lb-weight:focus {
          outline: none;
          border-color: var(--teal);
          box-shadow: 0 0 0 2px rgba(0,194,255,0.15);
        }
        [data-lb-reset]:hover {
          background: var(--surface) !important;
          color: var(--danger) !important;
          border-color: var(--danger) !important;
        }
      </style>

      ${pageHeader(
        "Gym Leaderboard",
        `<span style="color:var(--text-muted); font-size:0.85rem; font-weight:600; display:flex; align-items:center; gap:6px;">
          <span class="material-symbols-outlined" style="font-size:1rem;">group</span>
          ${eligible.length} participants
        </span>`
      )}

      <!-- Summary Cards -->
      <div class="metric-grid" style="margin-bottom:24px;">
        <article class="metric" style="border-top:3px solid var(--gold-ink);">
          <span style="display:flex; align-items:center; gap:5px;">
            <span class="material-symbols-outlined" style="font-size:1rem; color:var(--gold-ink); font-variation-settings:'FILL' 1;">emoji_events</span>
            Points Champion
          </span>
          <strong style="color:var(--text);">${escapeHtml(champion?.fullName || "—")}</strong>
          <small style="color:var(--gold-ink); font-weight:700;">${(champion?.points || 0).toLocaleString()} pts</small>
        </article>
        <article class="metric" style="border-top:3px solid var(--warning);">
          <span style="display:flex; align-items:center; gap:5px;">
            <span class="material-symbols-outlined" style="font-size:1rem; color:var(--warning); font-variation-settings:'FILL' 1;">local_fire_department</span>
            Streak King
          </span>
          <strong>${escapeHtml(byStreak?.fullName || "—")}</strong>
          <small style="color:var(--warning); font-weight:700;">${byStreak?.streak || 0}d streak</small>
        </article>
        <article class="metric" style="border-top:3px solid var(--teal-text);">
          <span style="display:flex; align-items:center; gap:5px;">
            <span class="material-symbols-outlined" style="font-size:1rem; color:var(--teal-text); font-variation-settings:'FILL' 1;">how_to_reg</span>
            Most Active
          </span>
          <strong>${escapeHtml(byActive?.fullName || "—")}</strong>
          <small style="color:var(--teal-text); font-weight:700;">${byActive?.monthlyCheckins || 0} check-ins / month</small>
        </article>
        <article class="metric" style="border-top:3px solid var(--primary-ink);">
          <span>Category Points</span>
          <strong style="color:var(--primary-ink);">${totalPts.toLocaleString()}</strong>
          <small style="color:var(--text-muted);">${isFiltered ? filterParts.join(" · ") : `All ${filtered.length} members`}</small>
        </article>
      </div>

      <!-- Rankings Panel -->
      <section class="panel stack">
        <!-- Header row: title + ranking tabs -->
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <h2 style="margin:0; font-size:1.05rem; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-outlined" style="color:var(--primary-ink); font-size:1.2rem; font-variation-settings:'FILL' 1;">leaderboard</span>
            Rankings
            <span style="font-size:0.78rem; font-weight:600; color:var(--text-muted); margin-left:4px;">${filtered.length} members</span>
          </h2>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${tabsHtml}
          </div>
        </div>

        <!-- Compact filter bar -->
        ${filterBar}

        <!-- List -->
        ${filtered.length === 0
          ? `<div style="padding:40px 0; text-align:center;">
              <span class="material-symbols-outlined" style="font-size:2.5rem; color:var(--text-muted); display:block; margin-bottom:10px;">manage_search</span>
              <strong style="color:var(--text-muted);">No members match this category.</strong>
              <p style="font-size:0.85rem; color:var(--text-muted); margin-top:6px;">Try adjusting the filters above.</p>
             </div>`
          : `<div style="overflow-x:hidden;">
              <!-- Table head -->
              <div style="
                display:grid; grid-template-columns:44px 1fr minmax(80px,140px);
                gap:12px; padding:6px 16px 6px;
                font-size:0.7rem; font-weight:800; letter-spacing:0.8px; text-transform:uppercase;
                color:var(--text-muted); border-bottom:1.5px solid var(--line); margin-bottom:8px;
              ">
                <div style="text-align:center;">Rank</div>
                <div>Member</div>
                <div style="text-align:right;">Score</div>
              </div>
              ${rows}
            </div>`
        }
      </section>
    `;
  },

  bind(root, context) {
    // Ranking tabs
    root.querySelectorAll("[data-lb-tab]").forEach((btn) => {
      btn.addEventListener("click", () => { lb.activeTab = btn.dataset.lbTab; context.refreshView(); });
    });

    // Selects
    root.querySelector("#lb-gender")?.addEventListener("change", (e) => {
      lb.filterGender = e.target.value; context.refreshView();
    });
    root.querySelector("#lb-age")?.addEventListener("change", (e) => {
      lb.filterAgeGroup = e.target.value; context.refreshView();
    });
    root.querySelector("#lb-weight")?.addEventListener("change", (e) => {
      lb.filterWeightClass = e.target.value; context.refreshView();
    });

    // Clear all
    root.querySelector("[data-lb-reset]")?.addEventListener("click", () => {
      lb.filterGender = "All"; lb.filterAgeGroup = "All"; lb.filterWeightClass = "All";
      context.refreshView();
    });
  },
};
