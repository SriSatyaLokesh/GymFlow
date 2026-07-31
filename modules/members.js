import { addDays, byName, collections, confirmDialog, dateLabel, emptyState, escapeHtml, findName, formData, memberStatus, nameCell, normalizePhone10, optionList, pageHeader, renderMemberProfileDetail, bindMemberProfileDetail, statusClass, today, withButtonLoading, cmToFeetInches, feetInchesToCm, calcBmi, bmiCategory, renderSharedMemberFields, bindSharedBmiEvents } from "./utils.js";

export const membersModule = {
  activeMemberId: null,

  render(context) {
    if (this.activeMemberId) {
      const member = context.data.members.find((item) => item.id === this.activeMemberId);
      if (member) {
        return renderMemberProfileDetail(member, context);
      } else {
        this.activeMemberId = null;
      }
    }

    const { data } = context;
    const members = [...(data.members || [])].sort(byName);
    const plans = data.membership_plans || [];
    const trainers = data.trainers || [];

    return `
      ${pageHeader("Members")}
      <div class="work-grid">
        <form class="panel stack" id="member-form">
          <input type="hidden" name="id" />
          <div class="panel-heading"><h2>Add Member</h2></div>
          <div class="form-grid">
            <label>Full name<input name="fullName" required maxlength="100" /></label>
            <label>Mobile
              <input name="mobile" required maxlength="10" />
              <span class="dup-warn hidden" data-dup-warn="mobile"></span>
            </label>
            <label>Email
              <input name="email" type="email" maxlength="100" />
              <span class="dup-warn hidden" data-dup-warn="email"></span>
            </label>
            <label>Join date<input name="joinDate" type="date" value="${today()}" /></label>
            <label>Membership plan
              <select name="planId" required>
                <option value="">Select plan</option>
                ${optionList(plans, "planName")}
              </select>
            </label>
            <label>Assigned trainer
              <select name="assignedTrainer">
                <option value="">Unassigned</option>
                ${optionList(trainers, "name")}
              </select>
            </label>
            <label>Start date<input name="startDate" type="date" value="${today()}" required /></label>
            <label>End date<input name="endDate" type="date" required /></label>
            <label>Status
              <select name="status">
                <option>Active</option>
                <option>Suspended</option>
              </select>
            </label>
            ${renderSharedMemberFields()}
          </div>
          <label class="wide checkbox-label">
            <input type="checkbox" name="whatsappOptIn" value="true" />
            Consent to WhatsApp reminders about membership &amp; renewals
          </label>
          <label class="wide checkbox-label">
            <input type="checkbox" name="privateLeaderboard" value="true" />
            Hide me from leaderboards (Private Profile)
          </label>
          <div class="button-row">
            <button class="primary-button" type="submit">Save member</button>
            <button class="ghost-button" type="reset" data-action="clear">Clear</button>
          </div>
        </form>

        <form class="panel stack hidden" id="pause-form">
          <input type="hidden" name="pauseId" />
          <input type="hidden" name="memberId" />
          <div class="panel-heading"><h2 data-pause-heading>Pause Membership</h2></div>
          <p class="panel-hint" data-pause-member-name style="font-weight:600"></p>
          <div class="form-grid" id="pause-fields">
            <label>Pause from<input name="pauseStart" type="date" required /></label>
            <label>Expected return<input name="returnDate" type="date" required /></label>
            <label class="wide">Reason<input name="reason" maxlength="120" placeholder="Injury, travel, etc." /></label>
          </div>
          <div class="form-grid hidden" id="resume-fields">
            <label class="wide">Actual return date<input name="actualReturn" type="date" /></label>
          </div>
          <div class="button-row">
            <button class="primary-button" type="submit" data-pause-submit>Confirm pause</button>
            <button class="ghost-button" type="button" data-action="cancel-pause">Cancel</button>
          </div>
        </form>

        <section class="panel">
          <div class="panel-heading"><h2>Member Directory</h2><span data-member-count>${members.length} total</span><button class="ghost-button compact mobile-only-btn" style="margin-left: auto;" data-scroll-to-form><span class="material-symbols-outlined" style="font-size:16px;">add</span> Add Member</button></div>
          ${
            members.length
              ? `
                <div class="filter-bar">
                  <label>Search
                    <span class="search-field">
                      <span class="material-symbols-outlined">search</span>
                      <input type="search" data-filter="search" placeholder="Name, mobile, or email" />
                    </span>
                  </label>
                  <label>Status
                    <select data-filter="status">
                      <option value="">All statuses</option>
                      <option>Pending</option>
                      <option>Active</option>
                      <option>Expiring Soon</option>
                      <option>Expired</option>
                      <option>Paused</option>
                      <option>Suspended</option>
                    </select>
                  </label>
                  <label>Plan
                    <select data-filter="plan">
                      <option value="">All plans</option>
                      ${optionList(plans, "planName")}
                    </select>
                  </label>
                  <label>Trainer
                    <select data-filter="trainer">
                      <option value="">All trainers</option>
                      ${optionList(trainers, "name")}
                    </select>
                  </label>
                </div>
                <div class="data-table members-table" data-member-list>
                  <div class="table-head"><span>Name</span><span>Plan</span><span>Expiry</span><span>Status</span><span></span></div>
                  ${members.map((member) => row(member, plans, trainers)).join("")}
                </div>`
              : emptyState("No members yet", "Add your first member to start tracking plans, payments, and renewals.")
          }
        </section>
      </div>
    `;
  },
  bind(root, context) {
    if (this.activeMemberId) {
      const member = context.data.members.find((item) => item.id === this.activeMemberId);
      if (member) {
        bindMemberProfileDetail(root, member, context, () => {
          this.activeMemberId = null;
          context.refreshView();
        });
      }
      return;
    }

    const form = root.querySelector("#member-form");

    form.planId.addEventListener("change", () => {
      const plan = context.data.membership_plans.find((item) => item.id === form.planId.value);
      if (plan && form.startDate.value) {
        form.endDate.value = addDays(form.startDate.value, plan.durationDays);
      }
    });

    form.startDate.addEventListener("change", () => {
      const plan = context.data.membership_plans.find((item) => item.id === form.planId.value);
      if (plan) form.endDate.value = addDays(form.startDate.value, plan.durationDays);
    });

    bindSharedBmiEvents(form);

    // ── Duplicate detection ─────────────────────────────────────────────────
    const dupWarnMobile = form.querySelector('[data-dup-warn="mobile"]');
    const dupWarnEmail  = form.querySelector('[data-dup-warn="email"]');

    function showDupWarn(el, member) {
      if (!el) return;
      if (member) {
        el.textContent = `⚠ Already registered: ${member.fullName} — tap to edit`;
        el.classList.remove("hidden");
        el.dataset.editTarget = member.id;
      } else {
        el.textContent = "";
        el.classList.add("hidden");
        delete el.dataset.editTarget;
      }
    }

    form.mobile?.addEventListener("blur", () => {
      const val    = normalizePhone10(form.mobile.value);
      const editId = form.elements['id']?.value || "";
      const match  = val
        ? context.data.members.find(m => normalizePhone10(m.mobile) === val && m.id !== editId)
        : null;
      showDupWarn(dupWarnMobile, match);
    });

    form.email?.addEventListener("blur", () => {
      const val    = form.email.value.trim().toLowerCase();
      const editId = form.elements['id']?.value || "";
      const match  = val
        ? context.data.members.find(m => m.email?.trim().toLowerCase() === val && m.id !== editId)
        : null;
      showDupWarn(dupWarnEmail, match);
    });

    [dupWarnMobile, dupWarnEmail].forEach(el => {
      el?.addEventListener("click", () => {
        if (!el.dataset.editTarget) return;
        const member = context.data.members.find(m => m.id === el.dataset.editTarget);
        if (!member) return;
        Object.entries(member).forEach(([key, value]) => {
          if (form.elements[key]) form.elements[key].value = value || "";
        });
        if (form.elements.whatsappOptIn) {
          form.elements.whatsappOptIn.checked = !!member.whatsappOptIn;
        }
        if (form.elements.privateLeaderboard) {
          form.elements.privateLeaderboard.checked = !!member.privateLeaderboard;
        }
        updateBmi();
        root.querySelector(".panel-heading h2").textContent = "Edit Member";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        showDupWarn(dupWarnMobile, null);
        showDupWarn(dupWarnEmail,  null);
      });
    });

    // ── WhatsApp number auto-sync ───────────────────────────────────────
    let lastMobileSync = "";
    form.mobile?.addEventListener("input", () => {
      const whatsappEl = form.elements.whatsappNumber;
      if (!whatsappEl) return;
      if (!whatsappEl.value || whatsappEl.value === lastMobileSync) {
        whatsappEl.value = form.mobile.value;
      }
      lastMobileSync = form.mobile.value;
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formData(form);
      if (payload.mobile) {
        payload.mobile = normalizePhone10(payload.mobile);
      }
      if (payload.whatsappNumber) {
        payload.whatsappNumber = normalizePhone10(payload.whatsappNumber);
      } else if (payload.mobile) {
        payload.whatsappNumber = payload.mobile;
      }
      if (!payload.email && payload.mobile) {
        payload.email = `${payload.mobile}@gymflow.app`;
      }
      payload.whatsappOptIn = payload.whatsappOptIn === "true";
      payload.privateLeaderboard = payload.privateLeaderboard === "true";
      if (payload.endDate && payload.startDate && payload.endDate < payload.startDate) {
        context.toast("End date can't be before the start date.");
        return;
      }
      const isNew = !payload.id;
      const measurements = {
        weight:  payload.initWeight  || "",
        bmi:     payload.initBmi     || "",
        bodyFat: payload.initBodyFat || "",
        waist:   payload.initWaist   || "",
        chest:   payload.initChest   || "",
        hip:     payload.initHip     || "",
        bicep:   payload.initBicep   || "",
        thigh:   payload.initThigh   || ""
      };
      const hasMeasurements = Object.values(measurements).some((v) => v !== "");
      payload.status = payload.status === "Suspended" ? "Suspended" : memberStatus(payload);
      await withButtonLoading(form.querySelector("[type='submit']"), async () => {
        const saved = await context.services.data.save(collections.members, payload);
        if (isNew && hasMeasurements) {
          const progressRecord = {
            memberId: saved.id,
            date:    payload.joinDate || today(),
            weight:  measurements.weight,
            bmi:     measurements.bmi,
            bodyFat: measurements.bodyFat,
            waist:   measurements.waist,
            chest:   measurements.chest,
            hip:     measurements.hip,
            bicep:   measurements.bicep,
            thigh:   measurements.thigh,
            notes:   "Initial admission measurement"
          };
          const savedProgress = await context.services.data.save(collections.progress, progressRecord);
          context.applyChange(collections.progress, savedProgress);
        }
        context.toast(payload.id ? "Member updated." : "Member added.");
        form.reset();
        form.joinDate.value = today();
        form.startDate.value = today();
        context.applyChange(collections.members, saved);
        if (isNew) {
          setTimeout(async () => {
            const ok = await confirmDialog({
              title: `Invite ${saved.fullName}?`,
              body: `Would you like to send a WhatsApp invitation to join GymFlow now?`,
              confirmText: "Send Invite",
              danger: false
            });
            if (ok) {
              const gymName = context.settings?.gymName || "our Gym";
              const gymCode = context.settings?.gymCode || "";
              const appUrl = window.location.origin + window.location.pathname;
              const normalizedMob = normalizePhone10(saved.mobile);
              const inviteText = `Hello ${saved.fullName}! Welcome to ${gymName}.\n\nTo register and access your workouts, schedules, and consistency points, please open the GymFlow App and set your password:\n${appUrl}#register?invite=${saved.id}&phone=${normalizedMob}&code=${gymCode}`;
              const waUrl = `https://wa.me/${encodeURIComponent(normalizedMob)}?text=${encodeURIComponent(inviteText)}`;
              window.open(waUrl, "_blank", "noopener,noreferrer");
            }
          }, 100);
        }
      });
    });

    bindFilters(root);

    root.querySelectorAll("[data-view-member]").forEach((button) => {
      button.addEventListener("click", () => {
        this.activeMemberId = button.dataset.viewMember;
        context.refreshView();
      });
    });

    root.querySelectorAll("[data-invite-member]").forEach((button) => {
      button.addEventListener("click", () => {
        const member = context.data.members.find((item) => item.id === button.dataset.inviteMember);
        if (!member) return;
        const gymName = context.settings?.gymName || "our Gym";
        const gymCode = context.settings?.gymCode || "";
        const appUrl = window.location.origin + window.location.pathname;
        const normalizedMob = normalizePhone10(member.mobile);
        const inviteText = `Hello ${member.fullName}! Welcome to ${gymName}.\n\nTo register and access your workouts, schedules, and consistency points, please open the GymFlow App and set your password:\n${appUrl}#register?invite=${member.id}&phone=${normalizedMob}&code=${gymCode}`;
        const waUrl = `https://wa.me/${encodeURIComponent(normalizedMob)}?text=${encodeURIComponent(inviteText)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
      });
    });

    root.querySelectorAll("[data-edit-member]").forEach((button) => {
      button.addEventListener("click", () => {
        const member = context.data.members.find((item) => item.id === button.dataset.editMember);
        if (!member) return;
        Object.entries(member).forEach(([key, value]) => {
          if (form.elements[key]) form.elements[key].value = value || "";
        });
        if (form.elements.whatsappOptIn) {
          form.elements.whatsappOptIn.checked = !!member.whatsappOptIn;
        }
        if (form.elements.privateLeaderboard) {
          form.elements.privateLeaderboard.checked = !!member.privateLeaderboard;
        }
        const { feet, inches } = cmToFeetInches(member.initHeight);
        if (form.heightFeet) form.heightFeet.value = feet != null ? String(feet) : "";
        if (form.heightInches) form.heightInches.value = inches != null ? String(inches) : "";
        form.heightFeet?.dispatchEvent(new Event("change"));
        root.querySelector(".panel-heading h2").textContent = "Edit Member";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    root.querySelectorAll("[data-approve-member]").forEach((button) => {
      button.addEventListener("click", async () => {
        const member = context.data.members.find((item) => item.id === button.dataset.approveMember);
        if (!member) return;
        await withButtonLoading(button, async () => {
          // Approve: clear Pending; recompute a date-based status (Active/Expiring/Expired).
          const next = { ...member, status: memberStatus({ ...member, status: "" }) };
          const saved = await context.services.data.save(collections.members, next);
          context.toast("Member approved.");
          context.applyChange(collections.members, saved);
        }, "Approving...");
      });
    });

    root.querySelectorAll("[data-delete-member]").forEach((button) => {
      button.addEventListener("click", async () => {
        const ok = await confirmDialog({
          title: "Delete this member?",
          body: "Related payments and attendance stay in your records for audit history.",
          confirmText: "Delete member"
        });
        if (!ok) return;
        await context.services.data.remove(collections.members, button.dataset.deleteMember);
        context.toast("Member deleted.");
        context.applyRemoval(collections.members, button.dataset.deleteMember);
      });
    });

    // ── Pause / Resume ──────────────────────────────────────────────────────
    const pauseForm     = root.querySelector("#pause-form");
    const pauseHeading  = root.querySelector("[data-pause-heading]");
    const pauseNameEl   = root.querySelector("[data-pause-member-name]");
    const pauseFields   = root.querySelector("#pause-fields");
    const resumeFields  = root.querySelector("#resume-fields");
    const pauseSubmit   = root.querySelector("[data-pause-submit]");

    function showPausePanel(mode) {
      pauseForm.classList.remove("hidden");
      const isPause = mode === "pause";
      pauseFields.classList.toggle("hidden", !isPause);
      resumeFields.classList.toggle("hidden", isPause);
      pauseHeading.textContent = isPause ? "Pause Membership" : "Resume Membership";
      pauseSubmit.textContent  = isPause ? "Confirm pause"   : "Confirm resume";
      pauseForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    root.querySelectorAll("[data-pause-member]").forEach((button) => {
      button.addEventListener("click", () => {
        const member = context.data.members.find((m) => m.id === button.dataset.pauseMember);
        if (!member) return;
        pauseForm.reset();
        pauseForm.memberId.value   = member.id;
        pauseForm.pauseStart.value = today();
        pauseNameEl.textContent    = member.fullName;
        showPausePanel("pause");
      });
    });

    root.querySelectorAll("[data-resume-member]").forEach((button) => {
      button.addEventListener("click", () => {
        const member = context.data.members.find((m) => m.id === button.dataset.resumeMember);
        if (!member) return;
        const pause = (context.data.membership_pauses || [])
          .find((p) => p.memberId === member.id && p.status === "active");
        pauseForm.reset();
        pauseForm.memberId.value      = member.id;
        pauseForm.pauseId.value       = pause?.id || "";
        pauseForm.actualReturn.value  = today();
        pauseNameEl.textContent       = member.fullName;
        showPausePanel("resume");
      });
    });

    root.querySelector("[data-action='cancel-pause']")?.addEventListener("click", () => {
      pauseForm.classList.add("hidden");
      pauseForm.reset();
    });

    pauseForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const mode     = pauseFields.classList.contains("hidden") ? "resume" : "pause";
      const memberId = pauseForm.memberId.value;
      const member   = context.data.members.find((m) => m.id === memberId);
      if (!member) return;

      if (mode === "pause") {
        const maxPausesPerYear = Number(context.settings?.maxPausesPerYear ?? 2);
        const maxPauseDays     = Number(context.settings?.maxPauseDays     ?? 30);
        const thisYear = new Date().getFullYear().toString();
        const yearPauses = (context.data.membership_pauses || [])
          .filter((p) => p.memberId === memberId && String(p.pauseStart || "").startsWith(thisYear));

        if (yearPauses.length >= maxPausesPerYear) {
          context.toast(`Pause limit reached — max ${maxPausesPerYear} pauses per year.`);
          return;
        }
        const pauseStart  = pauseForm.pauseStart.value;
        const returnDate  = pauseForm.returnDate.value;
        if (!pauseStart || !returnDate || returnDate <= pauseStart) {
          context.toast("Return date must be after the pause start date.");
          return;
        }
        const durationDays = Math.round((new Date(returnDate) - new Date(pauseStart)) / 86400000);
        if (durationDays > maxPauseDays) {
          context.toast(`Pause duration exceeds the ${maxPauseDays}-day limit.`);
          return;
        }

        await withButtonLoading(pauseSubmit, async () => {
          const pauseRecord = {
            memberId,
            gymId:       member.gymId || context.profile?.gymId,
            pauseStart,
            returnDate,
            reason:      pauseForm.reason.value,
            durationDays,
            status:      "active"
          };
          const savedPause = await context.services.data.save(collections.membershipPauses, pauseRecord);
          context.applyChange(collections.membershipPauses, savedPause);

          const updatedMember = { ...member, status: "Paused", endDate: addDays(member.endDate, durationDays) };
          const savedMember   = await context.services.data.save(collections.members, updatedMember);
          context.applyChange(collections.members, savedMember);

          context.toast(`${member.fullName}'s membership paused. End date extended by ${durationDays} days.`);
          pauseForm.classList.add("hidden");
          pauseForm.reset();
        });

      } else {
        const actualReturn = pauseForm.actualReturn.value || today();
        const pauseId      = pauseForm.pauseId.value;
        const pause        = (context.data.membership_pauses || []).find((p) => p.id === pauseId) || {};

        let unusedDays = 0;
        if (pause.returnDate && actualReturn < pause.returnDate) {
          unusedDays = Math.round((new Date(pause.returnDate) - new Date(actualReturn)) / 86400000);
        }

        await withButtonLoading(pauseSubmit, async () => {
          if (pauseId) {
            const updatedPause = { ...pause, status: "resumed", actualReturn };
            const savedPause   = await context.services.data.save(collections.membershipPauses, updatedPause);
            context.applyChange(collections.membershipPauses, savedPause);
          }

          const newEndDate    = unusedDays > 0 ? addDays(member.endDate, -unusedDays) : member.endDate;
          const updatedMember = { ...member, status: "", endDate: newEndDate };
          const savedMember   = await context.services.data.save(collections.members, updatedMember);
          context.applyChange(collections.members, savedMember);

          const msg = unusedDays > 0
            ? `Resumed. ${unusedDays} unused days refunded from end date.`
            : "Membership resumed.";
          context.toast(msg);
          pauseForm.classList.add("hidden");
          pauseForm.reset();
        });
      }
    });

    root.querySelector("[data-action='clear']")?.addEventListener("click", () => {
      root.querySelector(".panel-heading h2").textContent = "Add Member";
      showDupWarn(dupWarnMobile, null);
      showDupWarn(dupWarnEmail,  null);
    });
  }
};

function bindFilters(root) {
  const list = root.querySelector("[data-member-list]");
  if (!list) return;
  const controls = {
    search: root.querySelector("[data-filter='search']"),
    status: root.querySelector("[data-filter='status']"),
    plan: root.querySelector("[data-filter='plan']"),
    trainer: root.querySelector("[data-filter='trainer']")
  };
  const rows = Array.from(list.querySelectorAll("[data-row]"));
  const count = root.querySelector("[data-member-count]");

  function apply() {
    const term = (controls.search?.value || "").trim().toLowerCase();
    const status = controls.status?.value || "";
    const plan = controls.plan?.value || "";
    const trainer = controls.trainer?.value || "";
    let visible = 0;

    rows.forEach((rowEl) => {
      const match =
        (!term || rowEl.dataset.search.includes(term)) &&
        (!status || rowEl.dataset.status === status) &&
        (!plan || rowEl.dataset.plan === plan) &&
        (!trainer || rowEl.dataset.trainer === trainer);
      rowEl.classList.toggle("hidden", !match);
      if (match) visible += 1;
    });

    if (count) count.textContent = `${visible} of ${rows.length}`;
    let empty = list.querySelector("[data-filter-empty]");
    if (visible === 0) {
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "table-empty";
        empty.dataset.filterEmpty = "true";
        empty.textContent = "No members match these filters.";
        list.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  Object.values(controls).forEach((el) => {
    el?.addEventListener("input", apply);
    el?.addEventListener("change", apply);
  });
}

function row(member, plans, trainers) {
  const status = memberStatus(member);
  const haystack = [member.fullName, member.mobile, member.email].filter(Boolean).join(" ").toLowerCase();
  return `
    <div class="table-row"
      data-row
      data-search="${escapeHtml(haystack)}"
      data-status="${escapeHtml(status)}"
      data-plan="${escapeHtml(member.planId || "")}"
      data-trainer="${escapeHtml(member.assignedTrainer || "")}">
      ${nameCell(member.fullName, member.mobile || member.email || "", member.avatarUrl || "")}
      <span data-label="Plan">${escapeHtml(findName(plans, member.planId))}</span>
      <span data-label="Expiry">${dateLabel(member.endDate)}</span>
      <span data-label="Status"><mark class="status ${statusClass(status)}">${escapeHtml(status)}</mark></span>
      <span class="row-actions">
        ${
          !member.uid
            ? `<button class="icon-button" data-invite-member="${escapeHtml(member.id)}" title="Send WhatsApp Invite" style="color: var(--success, #16a34a);"><span class="material-symbols-outlined">send</span></button>`
            : ""
        }
        ${
          member.status === "Pending"
            ? `<button class="icon-button" data-approve-member="${escapeHtml(member.id)}" title="Approve"><span class="material-symbols-outlined">check_circle</span></button>`
            : ""
        }
        ${
          (status === "Active" || status === "Expiring Soon")
            ? `<button class="icon-button" data-pause-member="${escapeHtml(member.id)}" title="Pause membership"><span class="material-symbols-outlined">pause_circle</span></button>`
            : ""
        }
        ${
          status === "Paused"
            ? `<button class="icon-button" data-resume-member="${escapeHtml(member.id)}" title="Resume membership"><span class="material-symbols-outlined">play_circle</span></button>`
            : ""
        }
        <button class="icon-button" data-view-member="${escapeHtml(member.id)}" title="View profile & logs"><span class="material-symbols-outlined">visibility</span></button>
        <button class="icon-button" data-edit-member="${escapeHtml(member.id)}" title="Edit"><span class="material-symbols-outlined">edit</span></button>
        <button class="icon-button danger" data-delete-member="${escapeHtml(member.id)}" title="Delete"><span class="material-symbols-outlined">delete</span></button>
      </span>
      <small class="table-note">Trainer: ${escapeHtml(findName(trainers, member.assignedTrainer, "Unassigned"))}</small>
    </div>
  `;
}
