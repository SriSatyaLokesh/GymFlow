import { addDays, collections, dateLabel, daysUntil, emptyState, escapeHtml, findName, formData, memberStatus, money, optionList, pageHeader, statusClass, today, withButtonLoading } from "./utils.js";

export const renewalsModule = {
  activeView: "list",
  prefilledMemberId: null,

  render({ data, settings }) {
    this.activeView = this.activeView || "list";

    const members = data.members || [];
    const plans = data.membership_plans || [];
    const currency = settings?.currency || "INR";
    const watched = members
      .map((member) => ({ ...member, remaining: daysUntil(member.endDate), computedStatus: memberStatus(member) }))
      .filter((member) => member.computedStatus !== "Paused" && member.remaining <= 7)
      .sort((a, b) => a.remaining - b.remaining);

    if (this.activeView === "add") {
      return `
        ${pageHeader(
          "Renew Membership",
          `<button class="ghost-button" id="cancel-renew-btn" style="display:inline-flex; align-items:center; gap:6px; font-weight:600;">
            <span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_back</span> Back to Queue
          </button>`
        )}
        <form class="panel stack" id="renewal-form" style="max-width: 600px; margin: 20px auto;">
          <div class="panel-heading"><h2>Renew Membership</h2></div>
          <div class="form-grid">
            <label>Member
              <select name="memberId" required>
                <option value="">Select member</option>
                ${members.map(m => `<option value="${m.id}" ${this.prefilledMemberId === m.id ? "selected" : ""}>${escapeHtml(m.fullName)}</option>`).join("")}
              </select>
            </label>
            <label>Plan
              <select name="planId" required>
                <option value="">Select plan</option>
                ${plans.map(p => `<option value="${p.id}">${escapeHtml(p.planName)}</option>`).join("")}
              </select>
            </label>
            <label>Renewal date<input name="renewalDate" type="date" value="${today()}" required /></label>
            <label>Amount<input name="amount" type="number" min="0" step="1" required /></label>
            <label>Payment method
              <select name="method">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
            </label>
          </div>
          <div class="button-row" style="margin-top:15px;">
            <button class="primary-button" type="submit">Renew and record payment</button>
            <button class="ghost-button" type="button" id="cancel-renew-btn-2">Cancel</button>
          </div>
        </form>
      `;
    }

    return `
      ${pageHeader(
        "Renewals",
        `<button class="primary-button" id="show-renew-form-btn" style="display:inline-flex; align-items:center; gap:6px; font-weight:600;">
          <span class="material-symbols-outlined" style="font-size:1.2rem;">autorenew</span> Renew Member
        </button>`
      )}
      <section class="panel">
        <div class="panel-heading"><h2>Renewal Queue</h2><span>${watched.length} members</span></div>
        ${
          watched.length
            ? `<div class="data-table renewals-table">
                <div class="table-head"><span>Member</span><span>Plan</span><span>Expiry</span><span>Status</span><span></span></div>
                ${watched.map((member) => renewalRow(member, plans, currency)).join("")}
              </div>`
            : emptyState("No renewals due", "Members expiring within 7 days will appear here.")
        }
      </section>
    `;
  },
  bind(root, context) {
    if (this.activeView === "add") {
      const form = root.querySelector("#renewal-form");
      if (!form) return;

      const handleMemberChange = () => {
        const member = context.data.members.find((item) => item.id === form.memberId.value);
        if (member?.planId) form.planId.value = member.planId;
        setPlanAmount(form, context);
      };

      form.memberId.addEventListener("change", handleMemberChange);
      form.planId.addEventListener("change", () => setPlanAmount(form, context));

      // Prefilled logic
      if (this.prefilledMemberId) {
        handleMemberChange();
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formData(form);
        const member = context.data.members.find((item) => item.id === payload.memberId);
        const plan = context.data.membership_plans.find((item) => item.id === payload.planId);
        if (!member || !plan) {
          context.toast("Select a member and plan.");
          return;
        }

        const baseDate = daysUntil(member.endDate) > 0 ? member.endDate : payload.renewalDate;
        const nextEndDate = addDays(baseDate, plan.durationDays);
        await withButtonLoading(form.querySelector("[type='submit']"), async () => {
          const savedMember = await context.services.data.save(collections.members, {
            ...member,
            planId: plan.id,
            startDate: payload.renewalDate,
            endDate: nextEndDate,
            status: "Active"
          });

          const savedPayment = await context.services.data.save(collections.payments, {
            memberId: member.id,
            planId: plan.id,
            amount: Number(payload.amount),
            date: payload.renewalDate,
            method: payload.method,
            collectedBy: context.profile.name,
            status: "Paid",
            receiptNumber: `RCPT-${Date.now().toString().slice(-8)}`
          });

          context.toast("Membership renewed.");
          this.activeView = "list";
          this.prefilledMemberId = null;
          form.reset();
          context.applyChange(collections.members, savedMember);
          context.applyChange(collections.payments, savedPayment);
        }, "Renewing...");
      });

      const handleCancel = () => {
        this.activeView = "list";
        this.prefilledMemberId = null;
        context.refreshView();
      };

      root.querySelector("#cancel-renew-btn")?.addEventListener("click", handleCancel);
      root.querySelector("#cancel-renew-btn-2")?.addEventListener("click", handleCancel);
      return;
    }

    // List view bindings
    root.querySelector("#show-renew-form-btn")?.addEventListener("click", () => {
      this.activeView = "add";
      context.refreshView();
    });

    root.querySelectorAll("[data-renew-member]").forEach((button) => {
      button.addEventListener("click", () => {
        this.activeView = "add";
        this.prefilledMemberId = button.dataset.renewMember;
        context.refreshView();
      });
    });
  }
};

function setPlanAmount(form, context) {
  const plan = context.data.membership_plans.find((item) => item.id === form.planId.value);
  if (plan) form.amount.value = plan.price || 0;
}

function renewalRow(member, plans, currency) {
  return `
    <div class="table-row">
      <span data-label="Member">
        <strong>${escapeHtml(member.fullName)}</strong>
        <small>${escapeHtml(member.mobile || "")}</small>
      </span>
      <span data-label="Plan">${escapeHtml(findName(plans, member.planId))}</span>
      <span data-label="Expiry">${dateLabel(member.endDate)} <small>${member.remaining < 0 ? `${Math.abs(member.remaining)} days overdue` : `${member.remaining} days left`}</small></span>
      <span data-label="Status"><mark class="status ${statusClass(member.computedStatus)}">${escapeHtml(member.computedStatus)}</mark></span>
      <span class="row-actions">
        <button class="primary-button compact" data-renew-member="${escapeHtml(member.id)}">
          <span class="material-symbols-outlined" style="font-size:1rem;">autorenew</span>
          Renew (${money(plans.find((plan) => plan.id === member.planId)?.price || 0, currency)})
        </button>
      </span>
    </div>
  `;
}
