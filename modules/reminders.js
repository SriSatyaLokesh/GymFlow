import { collections, dateLabel, daysUntil, emptyState, escapeHtml, memberStatus, nameCell, pageHeader, statusClass, whatsappUrl } from "./utils.js";
import { renewalsModule } from "./renewals.js";

export const remindersModule = {
  render({ data, settings }) {
    const members = (data.members || [])
      .map((member) => ({ ...member, remaining: daysUntil(member.endDate), computedStatus: memberStatus(member) }))
      .filter((member) => member.remaining <= 30)
      .sort((a, b) => a.remaining - b.remaining);

    return `
      ${pageHeader("Payment Reminders")}
      <section class="panel">
        <div class="panel-heading"><h2>Reminder Dashboard</h2><span>${members.length} due</span></div>
        ${
          members.length
            ? `<div class="data-table reminder-table">
                <div class="table-head"><span>Member</span><span>Expiry</span><span>Status</span><span>Message</span><span></span></div>
                ${members.map((member) => row(member, settings)).join("")}
              </div>`
            : emptyState("No reminders due", "Upcoming renewals and expired memberships will appear here.")
        }
      </section>
    `;
  },
  bind(root, context) {
    root.querySelectorAll("[data-reminder-sent]").forEach((button) => {
      button.addEventListener("click", async () => {
        const member = context.data.members.find((item) => item.id === button.dataset.reminderSent);
        if (!member) return;
        const saved = await context.services.data.save(collections.reminders, {
          memberId: member.id,
          channel: "WhatsApp",
          state: "Sent",
          sentAt: new Date().toISOString(),
          message: buildMessage(member, context.settings)
        });
        context.toast("Reminder marked as sent.");
        context.applyChange(collections.reminders, saved);
      });
    });

    root.querySelectorAll("[data-action='quick-renew']").forEach((button) => {
      button.addEventListener("click", () => {
        renewalsModule.activeView = "add";
        renewalsModule.prefilledMemberId = button.dataset.memberId;
        context.navigate("renewals");
      });
    });
  }
};

function row(member, settings) {
  const message = buildMessage(member, settings);
  return `
    <div class="table-row">
      ${nameCell(member.fullName, member.mobile || "", member.avatarUrl || "")}
      <span data-label="Expiry">${dateLabel(member.endDate)}</span>
      <span data-label="Status"><mark class="status ${statusClass(member.computedStatus)}">${escapeHtml(member.computedStatus)}</mark></span>
      <span data-label="Message"><small>${escapeHtml(message)}</small></span>
      <span class="row-actions" style="display:flex; gap:6px;">
        <a class="primary-button" href="${whatsappUrl(member, message)}" target="_blank" rel="noreferrer"><span class="material-symbols-outlined">send</span>Send</a>
        <button class="icon-button" data-reminder-sent="${escapeHtml(member.id)}" title="Mark as Sent"><span class="material-symbols-outlined">done</span></button>
        <button class="icon-button" data-action="quick-renew" data-member-id="${escapeHtml(member.id)}" title="Renew Membership"><span class="material-symbols-outlined">autorenew</span>Renew</button>
      </span>
    </div>
  `;
}

function buildMessage(member, settings) {
  const expiry = dateLabel(member.endDate);
  const gymName = settings?.gymName || "your gym";
  if (daysUntil(member.endDate) < 0) {
    return `Hello ${member.fullName}, your ${gymName} membership expired on ${expiry}. Please renew to continue accessing gym facilities. Thank you.`;
  }
  return `Hello ${member.fullName}, your ${gymName} membership expires on ${expiry}. Please renew your membership to continue accessing gym facilities. Thank you.`;
}
