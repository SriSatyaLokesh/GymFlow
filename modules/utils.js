export const collections = {
  members: "members",
  trainers: "trainers",
  plans: "membership_plans",
  payments: "payments",
  attendance: "attendance",
  workouts: "workout_templates",
  assignments: "workout_assignments",
  workoutSessions: "workout_sessions",
  progress: "progress_records",
  reminders: "reminders",
  trainerAttendance: "trainer_attendance",
  membershipPauses: "membership_pauses",
  exerciseLibrary: "exercise_library",
  workoutLogs: "workout_logs",
  workoutSchedules: "workout_schedules",
  badges: "badges"
};

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function money(value, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function dateLabel(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(value, days) {
  const date = value ? new Date(value) : new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

export function daysUntil(value) {
  if (!value) return 0;
  const now = new Date();
  const target = new Date(value);
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}

export function memberStatus(member) {
  // Stored statuses that override date-derived status.
  if (member.status === "Pending")   return "Pending";
  if (member.status === "Paused")    return "Paused";
  if (member.status === "Suspended") return "Suspended";
  const remaining = daysUntil(member.endDate);
  if (remaining < 0)   return "Expired";
  if (remaining <= 15) return "Expiring Soon";
  return "Active";
}

export function statusClass(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "-");
}

export function optionList(items, labelKey, selectedId = "") {
  return items
    .map(
      (item) =>
        `<option value="${escapeHtml(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item[labelKey] || item.name || item.fullName)}</option>`
    )
    .join("");
}

export function byName(a, b) {
  return String(a.fullName || a.name || a.planName || "").localeCompare(String(b.fullName || b.name || b.planName || ""));
}

export function findName(items, id, fallback = "-") {
  const item = items.find((candidate) => candidate.id === id);
  return item?.fullName || item?.name || item?.planName || fallback;
}

export function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function pageHeader(title, actions = "") {
  return `
    <div class="page-header">
      <div>
        <h1>${escapeHtml(title)}</h1>
      </div>
      <div class="page-actions">${actions}</div>
    </div>
  `;
}

export function emptyState(title, body) {
  return `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(body)}</span>
    </div>
  `;
}

export function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const SHEETJS_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
let sheetJsPromise = null;

export function loadSheetJs() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (sheetJsPromise) return sheetJsPromise;

  sheetJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SHEETJS_URL;
    script.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error("SheetJS failed to initialise.")));
    script.onerror = () => {
      sheetJsPromise = null;
      reject(new Error("Could not load the Excel export library. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return sheetJsPromise;
}

export async function exportToExcel(filename, sheets) {
  const XLSX = await loadSheetJs();
  const workbook = XLSX.utils.book_new();
  sheets
    .filter((sheet) => sheet && sheet.rows)
    .forEach((sheet) => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.rows.length ? sheet.rows : [{}]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
    });
  XLSX.writeFile(workbook, filename);
}

export function normalizePhone(value = "") {
  return String(value).replace(/[^\d+]/g, "");
}

export function normalizePhone10(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.slice(-10);
}

export function whatsappUrl(member, message) {
  const phone = normalizePhone(member.mobile);
  return `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(message)}`;
}

export function initials(name = "") {
  const parsed = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
  return parsed || "--";
}

export const CARTOON_AVATARS = [
  // 30 Women Avatars
  ...Array.from({ length: 30 }, (_, i) => {
    return `https://avatar.iran.liara.run/public/girl?username=female-gym-${i + 1}`;
  }),
  // 70 Men Avatars
  ...Array.from({ length: 70 }, (_, i) => {
    return `https://avatar.iran.liara.run/public/boy?username=male-gym-${i + 1}`;
  })
];

export function nameCell(name, sub = "", avatarUrl = "") {
  const avatarContent = avatarUrl 
    ? `<img src="${escapeHtml(avatarUrl)}" alt="" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
    : escapeHtml(initials(name));

  return `
    <span class="name-cell">
      <span class="avatar small">${avatarContent}</span>
      <span class="name-cell-text">
        <strong>${escapeHtml(name || "-")}</strong>
        ${sub ? `<small>${escapeHtml(sub)}</small>` : ""}
      </span>
    </span>
  `;
}

/**
 * Styled confirmation dialog. Replaces window.confirm() with markup that matches
 * the app theme. Resolves true on confirm, false on cancel/backdrop/escape.
 */
export function confirmDialog({ title = "Are you sure?", body = "", confirmText = "Confirm", danger = true } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h2>${escapeHtml(title)}</h2>
        ${body ? `<p>${escapeHtml(body)}</p>` : ""}
        <div class="button-row modal-actions">
          <button class="ghost-button" data-modal="cancel" type="button">Cancel</button>
          <button class="${danger ? "danger-button" : "primary-button"}" data-modal="ok" type="button">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    function close(result) {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      resolve(result);
    }
    function onKey(event) {
      if (event.key === "Escape") close(false);
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(false);
    });
    overlay.querySelector("[data-modal='cancel']").addEventListener("click", () => close(false));
    overlay.querySelector("[data-modal='ok']").addEventListener("click", () => close(true));
    document.addEventListener("keydown", onKey);

    document.body.appendChild(overlay);
    overlay.querySelector("[data-modal='ok']").focus();
  });
}

/**
 * Wrap an async form/button handler so the button shows a busy state and can't
 * be double-submitted. `button` may be the submit button or any clickable.
 */
export async function withButtonLoading(button, action, busyLabel = "Saving...") {
  if (!button) return action();
  const original = button.innerHTML;
  button.disabled = true;
  button.dataset.loading = "true";
  button.innerHTML = `<span class="spinner"></span>${escapeHtml(busyLabel)}`;
  try {
    return await action();
  } finally {
    button.disabled = false;
    delete button.dataset.loading;
    button.innerHTML = original;
  }
}

/**
 * Lightweight sparkline/trend chart (inline SVG) for a numeric series.
 * points: array of { label, value }. Returns an SVG string.
 */
export function trendChart(points, { color = "var(--teal)", height = 160 } = {}) {
  const clean = points.filter((p) => Number.isFinite(Number(p.value)));
  if (clean.length < 2) {
    return `<div class="table-empty">Add at least two records to see a trend.</div>`;
  }
  const width = 320;
  const pad = 8;
  const values = clean.map((p) => Number(p.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (clean.length - 1);
  const coords = clean.map((p, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((Number(p.value) - min) / span) * (height - pad * 2);
    return [x, y];
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height - pad} L${coords[0][0].toFixed(1)},${height - pad} Z`;
  const dots = coords.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}" />`).join("");

  return `
    <div class="trend-chart">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img">
        <path d="${area}" fill="${color}" opacity="0.12" />
        <path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        ${dots}
      </svg>
      <div class="trend-labels">
        <span>${escapeHtml(clean[0].label)}</span>
        <span>${escapeHtml(clean[clean.length - 1].label)}</span>
      </div>
      <div class="trend-range"><small>Low ${min}</small><small>High ${max}</small></div>
    </div>
  `;
}

let exercisesPromise = null;
let exercisesList = [];

export function getExercises() {
  if (!exercisesPromise) {
    exercisesPromise = fetch("./lib/exercises-pruned.json")
      .then((res) => res.json())
      .then((data) => {
        exercisesList = data;
        return data;
      })
      .catch((err) => {
        console.error("Failed to load exercises:", err);
        return [];
      });
  }
  return exercisesPromise;
}

export function getExercisesList() {
  return exercisesList;
}

export function showExerciseModal(exercise) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  
  const gifUrl = exercise.gif 
    ? `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${exercise.gif}`
    : '';
  
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" style="width: min(540px, 100%);">
      <div class="panel-heading" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 10px; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 1.35rem;">${escapeHtml(exercise.name)}</h2>
        <button class="ghost-button" data-modal="close" style="min-width: unset; padding: 4px; border: none; background: transparent; cursor: pointer;" title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto;">
        ${gifUrl ? `
          <div style="display: flex; justify-content: center; background: #fff; border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; max-height: 280px; padding: 10px;">
            <img src="${gifUrl}" alt="${escapeHtml(exercise.name)}" style="max-width: 100%; height: auto; object-fit: contain;" />
          </div>
        ` : ''}
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span style="background: var(--surface-light, rgba(255,255,255,0.05)); border: 1px solid var(--line); padding: 4px 8px; border-radius: var(--r-sm); font-size: 0.85em;">Category: <strong>${escapeHtml(exercise.category)}</strong></span>
          <span style="background: var(--surface-light, rgba(255,255,255,0.05)); border: 1px solid var(--line); padding: 4px 8px; border-radius: var(--r-sm); font-size: 0.85em;">Target: <strong>${escapeHtml(exercise.target)}</strong></span>
          <span style="background: var(--surface-light, rgba(255,255,255,0.05)); border: 1px solid var(--line); padding: 4px 8px; border-radius: var(--r-sm); font-size: 0.85em;">Equipment: <strong>${escapeHtml(exercise.equipment)}</strong></span>
        </div>
        <div style="border-top: 1px solid var(--line); padding-top: 10px;">
          <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 1.1rem;">Instructions</h3>
          <ol style="padding-left: 20px; margin: 0; line-height: 1.55; color: var(--text);">
            ${exercise.steps.map(step => `<li style="margin-bottom: 8px;">${escapeHtml(step)}</li>`).join('')}
          </ol>
        </div>
      </div>
    </div>
  `;

  function close() {
    document.removeEventListener("keydown", onKey);
    overlay.remove();
  }
  function onKey(event) {
    if (event.key === "Escape") close();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelectorAll("[data-modal='close']").forEach(btn => btn.addEventListener("click", close));
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
}

export function showMemberProfileModal(member, context) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const plans = context.data.membership_plans || [];
  const trainers = context.data.trainers || [];
  const templates = context.data.workout_templates || [];
  const mySchedules = (context.data.workout_schedules || []).filter(s => s.memberId === member.id);
  const customRoutines = mySchedules.filter(s => s.type === "routine");
  const weeklyScheduleDoc = mySchedules.find(s => s.type === "schedule") || { schedule: {} };
  const logs = (context.data.workout_logs || [])
    .filter(l => l.memberId === member.id)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const planName = findName(plans, member.planId);
  const trainerName = findName(trainers, member.assignedTrainer, "Unassigned");
  const avatarInitials = (member.fullName || "M").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "M";

  const METRICS = [
    { key: "weight", label: "Weight (kg)", color: "var(--teal)" },
    { key: "bmi", label: "BMI", color: "var(--primary-strong)" },
    { key: "bodyFat", label: "Body Fat %", color: "#c36f2d" },
    { key: "waist", label: "Waist (cm)", color: "var(--ink-soft)" },
    { key: "chest", label: "Chest (cm)", color: "var(--accent)" },
    { key: "hip", label: "Hip (cm)", color: "var(--primary)" },
    { key: "bicep", label: "Bicep (cm)", color: "var(--success)" },
    { key: "thigh", label: "Thigh (cm)", color: "var(--warning)" },
    { key: "height", label: "Height (cm)", color: "var(--ink-soft)" }
  ];

  const chartForMember = (records, metricKey) => {
    const metric = METRICS.find((m) => m.key === metricKey) || METRICS[0];
    const series = records
      .filter((r) => r[metric.key] !== "" && r[metric.key] != null)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((r) => ({ label: dateLabel(r.date), value: Number(r[metric.key]) }));
    return trendChart(series, { color: metric.color });
  };

  overlay.innerHTML = `
    <div class="modal stack" role="dialog" aria-modal="true" style="width: min(650px, 95%); max-height: 85vh; display: flex; flex-direction: column; padding: 20px;">
      <div class="panel-heading" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 12px;">
        <div style="display:flex; gap:12px; align-items:center;">
          <div class="avatar" style="width:44px; height:44px; border-radius:50%; background:var(--primary); color:var(--on-primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.1rem;">
            ${avatarInitials}
          </div>
          <div>
            <h2 style="margin: 0; font-size: 1.25rem;">${escapeHtml(member.fullName)}</h2>
            <small style="opacity: 0.85;">${escapeHtml(planName)} • Trainer: ${escapeHtml(trainerName)}</small>
          </div>
        </div>
        <button class="ghost-button" data-modal="close" style="min-width: unset; padding: 4px; border: none; background: transparent; cursor: pointer;" title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="tabs-header modal-tabs" style="margin-bottom: 12px;">
        <button class="tab-btn active" data-modal-tab="info">Bio & Medical</button>
        <button class="tab-btn" data-modal-tab="logs">Workout Logs (${logs.length})</button>
        <button class="tab-btn" data-modal-tab="progress">Progress Timeline</button>
        <button class="tab-btn" data-modal-tab="achievements">Achievements</button>
      </div>

      <div style="flex: 1; overflow-y: auto; display:flex; flex-direction:column; gap: 15px;" id="modal-tab-content">
        <!-- Tab contents dynamic -->
      </div>
    </div>
  `;

  const contentEl = overlay.querySelector("#modal-tab-content");
  let activeTab = "info";

  function renderTab() {
    if (activeTab === "info") {
      contentEl.innerHTML = `
        <div class="stack" style="gap: 15px;">
          <section class="stack" style="gap: 8px;">
            <h3 style="margin:0; border-bottom: 1px solid var(--line); padding-bottom:4px; font-size: 1rem; color:var(--accent);">Personal Info</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.9rem;">
              <span><strong>Email:</strong> ${escapeHtml(member.email || "—")}</span>
              <span><strong>Mobile:</strong> ${escapeHtml(member.mobile || "—")}</span>
              <span><strong>Gender:</strong> ${escapeHtml(member.gender || "—")}</span>
              <span><strong>DOB:</strong> ${escapeHtml(member.dateOfBirth ? dateLabel(member.dateOfBirth) : "—")}</span>
              <span style="grid-column: span 2;"><strong>Address:</strong> ${escapeHtml(member.address || "—")}</span>
            </div>
          </section>

          <section class="stack" style="gap: 8px;">
            <h3 style="margin:0; border-bottom: 1px solid var(--line); padding-bottom:4px; font-size: 1rem; color:var(--accent);">Emergency Contact</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.9rem;">
              <span><strong>Name:</strong> ${escapeHtml(member.emergencyName || "—")}</span>
              <span><strong>Relationship:</strong> ${escapeHtml(member.emergencyRelationship || "—")}</span>
              <span><strong>Phone:</strong> ${escapeHtml(member.emergencyPhone || "—")}</span>
            </div>
          </section>

          <section class="stack" style="gap: 8px;">
            <h3 style="margin:0; border-bottom: 1px solid var(--line); padding-bottom:4px; font-size: 1rem; color:var(--accent);">Background & Metrics</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.9rem;">
              <span><strong>Blood Group:</strong> ${escapeHtml(member.bloodGroup || "—")}</span>
              <span><strong>Occupation:</strong> ${escapeHtml(member.occupation || "—")}</span>
              <span><strong>Activity Level:</strong> ${escapeHtml(member.activityLevel || "—")}</span>
              <span><strong>Experience:</strong> ${escapeHtml(member.fitnessExperience || "—")}</span>
              <span><strong>Gym Goal:</strong> ${escapeHtml(member.gymGoal || "—")}</span>
              <span><strong>WhatsApp Consent:</strong> ${member.whatsappOptIn ? "Yes" : "No"}</span>
            </div>
          </section>

          <section class="stack" style="gap: 8px;">
            <h3 style="margin:0; border-bottom: 1px solid var(--line); padding-bottom:4px; font-size: 1rem; color:var(--accent);">Health & Medical</h3>
            <div style="display:flex; flex-direction:column; gap:8px; font-size:0.9rem;">
              <div><strong>Medical Conditions:</strong><p style="margin:4px 0; opacity:0.9;">${escapeHtml(member.medicalConditions || "None declared")}</p></div>
              <div><strong>Current Medications:</strong><p style="margin:4px 0; opacity:0.9;">${escapeHtml(member.currentMedications || "None")}</p></div>
              <div><strong>Allergies:</strong><p style="margin:4px 0; opacity:0.9;">${escapeHtml(member.allergies || "None")}</p></div>
              <div><strong>Limitations / Injuries:</strong><p style="margin:4px 0; opacity:0.9;">${escapeHtml(member.physicalLimitations || "None")}</p></div>
            </div>
          </section>
        </div>
      `;
    } else if (activeTab === "logs") {
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const scheduleHtml = weekdays.map(day => {
        const id = weeklyScheduleDoc.schedule?.[day];
        let name = "Rest Day";
        if (id) {
          const r = customRoutines.find(cr => cr.id === id);
          const t = templates.find(bt => bt.id === id);
          if (r) name = r.name;
          else if (t) name = t.name;
        }
        return `
          <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed var(--line);">
            <span style="font-weight:600;">${day}</span>
            <span style="opacity:0.85;">${escapeHtml(name)}</span>
          </div>
        `;
      }).join("");

      const routinesHtml = customRoutines.length
        ? customRoutines.map(r => `
            <div style="padding:8px; border:1px solid var(--line); border-radius:var(--r-sm); background:var(--bg); margin-bottom:6px;">
              <strong style="font-size:0.9rem; color:var(--accent);">${escapeHtml(r.name)}</strong>
              <div style="font-size:0.8rem; opacity:0.8; margin-top:4px; padding-left:4px; display:flex; flex-direction:column; gap:2px;">
                ${(r.exercisesStructured || []).map(ex => `
                  <div><strong>${escapeHtml(ex.name)}</strong>: ${ex.sets} sets x ${ex.reps} reps</div>
                `).join("")}
              </div>
            </div>
          `).join("")
        : `<div style="text-align:center; opacity:0.7; padding:10px;">No custom routines defined.</div>`;

      contentEl.innerHTML = `
        <div class="stack" style="gap: 15px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; border-bottom: 1px solid var(--line); padding-bottom: 15px;">
            <div class="panel stack" style="padding: 12px; font-size: 0.85rem; background: var(--bg-alt); border-radius: var(--r-md); border:1px solid var(--line);">
              <h4 style="margin: 0 0 10px 0; color: var(--accent); font-size: 0.95rem; border-bottom: 1px solid var(--line); padding-bottom: 4px;">Weekly Schedule</h4>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${scheduleHtml}
              </div>
            </div>
            <div class="panel stack" style="padding: 12px; font-size: 0.85rem; background: var(--bg-alt); border-radius: var(--r-md); border:1px solid var(--line);">
              <h4 style="margin: 0 0 10px 0; color: var(--accent); font-size: 0.95rem; border-bottom: 1px solid var(--line); padding-bottom: 4px;">Custom Routines</h4>
              <div style="display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto;">
                ${routinesHtml}
              </div>
            </div>
          </div>

          <h3 style="margin: 5px 0 0 0; font-size: 1.1rem; color: var(--accent);">Completed Workout Logs</h3>
          <div class="stack" style="gap: 12px;">
            ${logs.length 
              ? logs.map(log => `
                  <div class="panel" style="padding:12px; border:1px solid var(--line); border-radius:var(--r-md); background:var(--bg-alt);">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:4px; margin-bottom:8px;">
                      <strong style="font-size:1rem; color:var(--accent);">${escapeHtml(log.routineName || "Workout")}</strong>
                      <small style="opacity:0.8;">${dateLabel(log.date)} • ${log.durationMinutes || 0} mins</small>
                    </div>
                    ${log.notes ? `<p style="font-style:italic; font-size:0.85rem; margin:4px 0;">"${escapeHtml(log.notes)}"</p>` : ""}
                    <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px;">
                      ${(log.exercises || []).map(ex => `
                        <div style="font-size:0.85rem;">
                          <strong>${escapeHtml(ex.name)}</strong>
                          <span style="opacity:0.8; padding-left:6px;">
                            ${(ex.sets || []).map((s, idx) => `${idx + 1}: ${s.weight}kg x ${s.reps}`).join(" / ")}
                          </span>
                        </div>
                      `).join("")}
                    </div>
                  </div>
                `).join("")
              : `<div class="table-empty">No workouts logged yet.</div>`
            }
          </div>
        </div>
      `;
    } else if (activeTab === "progress") {
      const records = (context.data.progress_records || [])
        .filter((r) => r.memberId === member.id)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      contentEl.innerHTML = `
        <div class="stack" style="gap: 15px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0; font-size:1.1rem; color:var(--accent);">Trend Chart</h3>
            <select id="modal-metric-select" style="padding:4px 8px; border-radius:var(--r-sm); border:1px solid var(--line); background:var(--bg-alt); color:var(--text);">
              ${METRICS.map(m => `<option value="${m.key}">${m.label}</option>`).join("")}
            </select>
          </div>
          <div id="modal-chart-container">
            ${chartForMember(records, "weight")}
          </div>

          <h3 style="margin:10px 0 0 0; font-size:1.1rem; color:var(--accent);">Measurement History</h3>
          <div class="stack" style="gap: 10px; max-height:280px; overflow-y:auto; padding-right:5px;">
            ${records.length ? records.map(r => `
              <div class="panel" style="padding:10px; border:1px solid var(--line); border-radius:var(--r-sm); background:var(--bg-alt); font-size:0.9rem;">
                <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:6px; border-bottom:1px dashed var(--line); padding-bottom:4px;">
                  <span>${dateLabel(r.date)}</span>
                  <span style="font-size:0.8rem; opacity:0.8;">${escapeHtml(r.notes || "Measurement")}</span>
                </div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
                  ${r.weight ? `<span><strong>Weight:</strong> ${escapeHtml(r.weight)} kg</span>` : ""}
                  ${r.bmi ? `<span><strong>BMI:</strong> ${escapeHtml(r.bmi)}</span>` : ""}
                  ${r.bodyFat ? `<span><strong>Body Fat:</strong> ${escapeHtml(r.bodyFat)}%</span>` : ""}
                  ${r.waist ? `<span><strong>Waist:</strong> ${escapeHtml(r.waist)} cm</span>` : ""}
                  ${r.chest ? `<span><strong>Chest:</strong> ${escapeHtml(r.chest)} cm</span>` : ""}
                  ${r.hip ? `<span><strong>Hip:</strong> ${escapeHtml(r.hip)} cm</span>` : ""}
                  ${r.bicep ? `<span><strong>Bicep:</strong> ${escapeHtml(r.bicep)} cm</span>` : ""}
                  ${r.thigh ? `<span><strong>Thigh:</strong> ${escapeHtml(r.thigh)} cm</span>` : ""}
                  ${r.height ? `<span><strong>Height:</strong> ${escapeHtml(r.height)} cm</span>` : ""}
                </div>
              </div>
            `).join("") : `<div class="table-empty">No measurements recorded.</div>`}
          </div>
        </div>
      `;

      const selectEl = contentEl.querySelector("#modal-metric-select");
      const chartContainer = contentEl.querySelector("#modal-chart-container");
      selectEl?.addEventListener("change", () => {
        chartContainer.innerHTML = chartForMember(records, selectEl.value);
      });
    } else if (activeTab === "achievements") {
      const badges = context.data.badges || [];
      const unlockedBadgeIds = member.unlockedBadges || [];
      const personalRecords = member.personalRecords || {};
      const prList = Object.entries(personalRecords);
      const myLogsCount = logs.length;
      const currentStreak = member.currentStreak || 0;

      contentEl.innerHTML = `
        <div class="stack" style="gap: 15px;">
          <section class="stack" style="gap: 8px;">
            <h3 style="margin:0; border-bottom: 1px solid var(--line); padding-bottom:4px; font-size: 1rem; color:var(--accent);">Points Summary</h3>
            <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent);">
              ${member.points || 0} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">total points earned</span>
            </div>
          </section>

          <section class="stack" style="gap: 8px;">
            <h3 style="margin:0; border-bottom: 1px solid var(--line); padding-bottom:4px; font-size: 1rem; color:var(--accent);">Unlocked Badges (${unlockedBadgeIds.length} / ${badges.length})</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap: 10px; margin-top: 5px;">
              ${badges.map(badge => {
                const isUnlocked = unlockedBadgeIds.includes(badge.id);
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
                      <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); margin-bottom: 2px;">
                        <span>Progress</span>
                        <span>${currentVal}/${threshold} ${unit}</span>
                      </div>
                      <div style="width: 100%; height: 4px; background: var(--line); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${pct}%; height: 100%; background: var(--text-muted); border-radius: 2px;"></div>
                      </div>
                    </div>
                  `;
                }

                return `
                  <div style="${getBadgeCss(badge.id, isUnlocked)} flex-direction: column; align-items: flex-start; gap: 6px; box-sizing: border-box;">
                    <div style="display: flex; gap: 10px; align-items: center; width: 100%;">
                      <span class="material-symbols-outlined" style="font-size: 2.2rem; ${isUnlocked ? 'color: inherit;' : 'color: var(--text-muted);'}">${badge.icon}</span>
                      <div style="text-align: left; flex: 1;">
                        <strong style="font-size: 0.85rem; color: inherit; display: block;">${escapeHtml(badge.name)}</strong>
                        <div style="font-size: 0.7rem; color: inherit; opacity: 0.85; line-height: 1.25;">${escapeHtml(badge.description)}</div>
                      </div>
                    </div>
                    ${progressHtml}
                  </div>
                `;
              }).join("")}
            </div>
          </section>

          <section class="stack" style="gap: 8px;">
            <h3 style="margin:0; border-bottom: 1px solid var(--line); padding-bottom:4px; font-size: 1rem; color:var(--accent);">Personal Records</h3>
            ${prList.length ? `
              <div class="data-table">
                <div class="table-head"><span>Exercise</span><span>Max Weight</span></div>
                ${prList.map(([exercise, weight]) => `
                  <div class="table-row" style="grid-template-columns: 1fr 1fr;">
                    <span data-label="Exercise" style="font-weight: 600;">${escapeHtml(exercise)}</span>
                    <span data-label="Max Weight" style="color: var(--accent); font-weight: 700;">${weight} kg</span>
                  </div>
                `).join("")}
              </div>
            ` : `<div class="table-empty">No personal records logged yet.</div>`}
          </section>
        </div>
      `;
    }
  }

  // Bind Tab clicks
  overlay.querySelectorAll("[data-modal-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      overlay.querySelectorAll("[data-modal-tab]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.modalTab;
      renderTab();
    });
  });

  function close() {
    document.removeEventListener("keydown", onKey);
    overlay.remove();
  }
  function onKey(event) {
    if (event.key === "Escape") close();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelectorAll("[data-modal='close']").forEach(btn => btn.addEventListener("click", close));
  document.addEventListener("keydown", onKey);

  renderTab();
  document.body.appendChild(overlay);
}

export function calculateStreak(attendanceRecords, restDay = "Sunday") {
  if (!attendanceRecords || attendanceRecords.length === 0) return 0;
  
  // Extract and sort unique dates descending
  const dates = [...new Set(attendanceRecords.map(r => r.date))].sort((a, b) => b.localeCompare(a));
  
  const todayStr = today();
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
  // If the last check-in is older than yesterday, the streak is broken
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;
  
  let streak = 1;
  let current = new Date(dates[0]);
  
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i]);
    const diffTime = Math.abs(current - prev);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      current = prev;
    } else if (diffDays === 2) {
      // Check if the skipped day is the restDay
      const skippedDate = new Date(current.getTime() - 86400000);
      const dayName = skippedDate.toLocaleDateString("en-US", { weekday: "long" });
      
      if (dayName === restDay) {
        // Rest day grace allowed (streak continues, date updated)
        streak++;
        current = prev;
      } else {
        break; // Streak broken
      }
    } else {
      break; // Streak broken
    }
  }
  return streak;
}

export async function awardPointsAndBadges(context, actionType, details = {}) {
  const me = context.myMember;
  if (!me) return;

  const todayStr = today();
  const allAttendance = context.data.attendance || [];
  const allLogs = context.data.workout_logs || [];
  const badges = context.data.badges || [];

  // Clone member to avoid mutating direct state before save
  const updatedMember = { ...me };
  updatedMember.points = Number(updatedMember.points || 0);
  updatedMember.unlockedBadges = [...(updatedMember.unlockedBadges || [])];
  updatedMember.personalRecords = { ...(updatedMember.personalRecords || {}) };

  let pointsEarned = 0;
  const newlyUnlockedBadges = [];
  const newlyHitPRs = [];

  if (actionType === "checkin") {
    // Anti-abuse: Max 1 check-in per day for points
    const checkinsToday = allAttendance.filter(r => r.memberId === me.id && r.date === todayStr);
    if (checkinsToday.length <= 1) {
      pointsEarned += 10;
    }
  } else if (actionType === "workout") {
    // Anti-abuse: Max 2 workouts logged per day for points
    const logsToday = allLogs.filter(r => r.memberId === me.id && r.date === todayStr);
    if (logsToday.length <= 2) {
      pointsEarned += 50;
    }

    // Process PRs
    const workout = details.workout;
    if (workout && workout.exercises) {
      workout.exercises.forEach(ex => {
        const maxWeight = Math.max(...ex.sets.map(s => Number(s.weight || 0)), 0);
        if (maxWeight > 0) {
          const previousPR = Number(updatedMember.personalRecords[ex.name] || 0);
          if (maxWeight > previousPR) {
            updatedMember.personalRecords[ex.name] = maxWeight;
            newlyHitPRs.push({ exercise: ex.name, weight: maxWeight });
            pointsEarned += 100;
          }
        }
      });
    }
  }

  // Update points
  updatedMember.points += pointsEarned;

  // Recalculate streak
  const myAttendance = allAttendance.filter(r => r.memberId === me.id);
  const currentStreak = calculateStreak(myAttendance);
  updatedMember.currentStreak = currentStreak;

  // Check Badge triggers
  const myLogsCount = allLogs.filter(l => l.memberId === me.id).length;

  badges.forEach(badge => {
    // If already unlocked, skip
    if (updatedMember.unlockedBadges.includes(badge.id)) return;

    let unlocked = false;
    if (badge.type === "streak" && currentStreak >= badge.threshold) {
      unlocked = true;
    } else if (badge.type === "workout_count" && myLogsCount >= badge.threshold) {
      unlocked = true;
    } else if (badge.type === "pr" && Object.keys(updatedMember.personalRecords).length >= badge.threshold) {
      unlocked = true;
    } else if (badge.type === "pr_weight") {
      const maxWeight = Math.max(...Object.values(updatedMember.personalRecords).map(Number), 0);
      if (maxWeight >= badge.threshold) {
        unlocked = true;
      }
    }

    if (unlocked) {
      updatedMember.unlockedBadges.push(badge.id);
      newlyUnlockedBadges.push(badge);
    }
  });

  // Save member
  if (pointsEarned > 0 || newlyUnlockedBadges.length > 0 || updatedMember.currentStreak !== me.currentStreak) {
    const saved = await context.services.data.save(collections.members, updatedMember);
    context.applyChange(collections.members, saved);

    // Celebrate!
    if (newlyUnlockedBadges.length > 0 || newlyHitPRs.length > 0) {
      showCelebrationModal(newlyUnlockedBadges, newlyHitPRs);
    } else if (pointsEarned > 0) {
      context.toast(`Earned +${pointsEarned} Points!`);
    }
  }
}

export function showCelebrationModal(newlyUnlockedBadges = [], newlyHitPRs = []) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style.zIndex = "3000";

  let badgesHtml = "";
  if (newlyUnlockedBadges.length > 0) {
    badgesHtml = `
      <div style="margin-bottom: 20px; width: 100%;">
        <h3 style="color: var(--accent); margin-bottom: 12px;">🏅 Badges Unlocked!</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; width: 100%;">
          ${newlyUnlockedBadges.map(badge => `
            <div style="${getBadgeCss(badge.id, true)} width: 100%; max-width: 320px;">
              <span class="material-symbols-outlined" style="font-size: 2.5rem; color: inherit;">${badge.icon}</span>
              <div style="text-align: left;">
                <strong style="font-size: 1.05rem; color: inherit;">${escapeHtml(badge.name)}</strong>
                <div style="font-size: 0.75rem; color: inherit; opacity: 0.85;">${escapeHtml(badge.description)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  let prsHtml = "";
  if (newlyHitPRs.length > 0) {
    prsHtml = `
      <div style="margin-bottom: 20px; width: 100%;">
        <h3 style="color: var(--accent); margin-bottom: 12px;">🔥 New Personal Records!</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; width: 100%;">
          ${newlyHitPRs.map(pr => `
            <div style="background: var(--bg-alt); padding: 12px 16px; border-radius: var(--r-sm); border-left: 4px solid var(--accent); width: 100%; max-width: 320px; text-align: left; box-shadow: 0 4px 10px rgba(var(--accent-rgb, 13, 148, 136), 0.15);">
              <strong style="color: var(--text);">${escapeHtml(pr.exercise)}</strong>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent); margin-top: 4px;">${pr.weight} kg</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="modal-card stack animate-scale" style="max-width: 420px; text-align: center; padding: 30px; position: relative; border: 2px solid var(--primary); box-shadow: 0 10px 40px rgba(var(--primary-rgb, 217, 119, 6), 0.25);">
      <button class="modal-close" data-modal="close" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
      <div style="font-size: 4.5rem; margin-bottom: 10px; animation: bounce 1s infinite alternate;">🏆</div>
      <h2 style="font-size: 1.80rem; margin: 0 0 10px 0; color: var(--text); font-weight: 800; letter-spacing: -0.5px;">Congratulations!</h2>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">You've hit new milestones and earned points!</p>
      
      ${badgesHtml}
      ${prsHtml}
      
      <button class="primary-button" data-modal="close" style="margin-top: 10px; width: 100%; font-weight: 700; letter-spacing: 0.5px; border-radius: var(--r-md);">AWESOME!</button>
    </div>
  `;

  function close() {
    overlay.remove();
  }

  overlay.querySelectorAll("[data-modal='close']").forEach(btn => btn.addEventListener("click", close));
  document.body.appendChild(overlay);

  // Trigger confetti!
  if (typeof confetti === "function") {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } });
    }, 250);
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } });
    }, 400);
  }
}

export function getBadgeCss(badgeId, isUnlocked) {
  if (!isUnlocked) {
    return `background: var(--bg-alt); opacity: 0.45; filter: grayscale(100%); border: 1px dashed var(--line); color: var(--text-muted); padding: 12px 18px; border-radius: var(--r-md); display: flex; gap: 12px; align-items: center; text-align: left; transition: all 0.3s ease;`;
  }
  
  const levels = {
    "streak-starter": "bronze",
    "consistency-50": "bronze",
    "unstoppable": "silver",
    "consistency-100": "silver",
    "pr-hitter": "silver",
    "consistency-250": "gold",
    "heavy-lifter": "gold"
  };

  const level = levels[badgeId] || "bronze";
  if (level === "gold") {
    return `background: linear-gradient(135deg, #FFE082 0%, #FFB300 50%, #FF8F00 100%); color: #3E2723; box-shadow: 0 4px 15px rgba(255, 179, 0, 0.45); border: 2px solid #FFE57F; padding: 12px 18px; border-radius: var(--r-md); display: flex; gap: 12px; align-items: center; text-align: left; transition: all 0.3s ease; font-weight: 600;`;
  }
  if (level === "silver") {
    return `background: linear-gradient(135deg, #ECEFF1 0%, #90A4AE 50%, #546E7A 100%); color: #263238; box-shadow: 0 4px 15px rgba(144, 164, 174, 0.45); border: 2px solid #CFD8DC; padding: 12px 18px; border-radius: var(--r-md); display: flex; gap: 12px; align-items: center; text-align: left; transition: all 0.3s ease; font-weight: 600;`;
  }
  // bronze
  return `background: linear-gradient(135deg, #FFCCBC 0%, #D84315 50%, #BF360C 100%); color: #FFF; box-shadow: 0 4px 15px rgba(216, 67, 21, 0.45); border: 2px solid #FF8A65; padding: 12px 18px; border-radius: var(--r-md); display: flex; gap: 12px; align-items: center; text-align: left; transition: all 0.3s ease; font-weight: 600;`;
}

