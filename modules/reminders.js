import { collections, dateLabel, daysUntil, emptyState, escapeHtml, memberStatus, nameCell, pageHeader, statusClass, whatsappUrl } from "./utils.js";
import { renewalsModule } from "./renewals.js";

export const remindersModule = {
  render({ data, settings }) {
    const reminders = data.reminders || [];
    const members = (data.members || [])
      .map((member) => {
        const memberReminders = reminders
          .filter(r => r.memberId === member.id && (r.state === "Sent" || r.status === "sent"))
          .sort((a, b) => String(b.sentAt || "").localeCompare(String(a.sentAt || "")));
        return {
          ...member,
          remaining: daysUntil(member.endDate),
          computedStatus: memberStatus(member),
          latestReminder: memberReminders[0] || null
        };
      })
      .filter((member) => member.remaining <= 30)
      .sort((a, b) => a.remaining - b.remaining);

    return `
      ${pageHeader("Payment Reminders")}
      <section class="panel">
        <div class="panel-heading"><h2>Reminder Dashboard</h2><span>${members.length} due</span></div>
        ${
          members.length
            ? `<div class="data-table reminder-table">
                <div class="table-head"><span>Member</span><span>Expiry</span><span>Status</span><span></span></div>
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
          channel: "Manual",
          sentVia: "manual",
          state: "Sent",
          status: "sent",
          sentAt: new Date().toISOString(),
          message: buildMessage(member, context.settings)
        });
        context.toast("Reminder marked as sent.");
        context.applyChange(collections.reminders, saved);
        context.refreshView();
      });
    });

    root.querySelectorAll("[data-reminder-undo]").forEach((button) => {
      button.addEventListener("click", async () => {
        const reminderId = button.dataset.reminderUndo;
        if (!reminderId) return;
        await context.services.data.remove(collections.reminders, reminderId);
        context.applyRemoval(collections.reminders, reminderId);
        context.toast("Reminder status reset.");
        context.refreshView();
      });
    });

    root.querySelectorAll("[data-whatsapp-sent]").forEach((link) => {
      link.addEventListener("click", async () => {
        const member = context.data.members.find((item) => item.id === link.dataset.whatsappSent);
        if (!member) return;
        const saved = await context.services.data.save(collections.reminders, {
          memberId: member.id,
          channel: "WhatsApp",
          sentVia: "whatsapp",
          state: "Sent",
          status: "sent",
          sentAt: new Date().toISOString(),
          message: buildMessage(member, context.settings)
        });
        context.applyChange(collections.reminders, saved);
        setTimeout(() => context.refreshView(), 500);
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
  const days = member.remaining;
  const daysLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d left`;
  const daysClass = days < 0 ? "danger" : days <= 7 ? "warn" : "ok";
  const reminder = member.latestReminder;

  let reminderBadge = "";
  if (reminder) {
    const isManual = reminder.sentVia === "manual" || reminder.channel === "Manual";
    const badgeBg = isManual ? "rgba(0, 194, 255, 0.15)" : "rgba(34, 197, 94, 0.15)";
    const badgeColor = isManual ? "var(--teal-ink)" : "var(--success, #15803d)";
    const badgeIcon = isManual ? "check" : "check_circle";
    const badgeText = isManual ? "Sent (Manual)" : `Sent (${escapeHtml(reminder.channel || "Auto")})`;
    reminderBadge = `
      <small class="row-meta" style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 700; padding: 2px 6px; border-radius: 12px; display: inline-flex; align-items: center; gap: 3px; margin-top: 3px;">
        <span class="material-symbols-outlined" style="font-size: 0.85rem;">${badgeIcon}</span>
        ${badgeText}
      </small>
    `;
  }

  return `
    <div class="table-row">
      ${nameCell(member.fullName, member.mobile || "", member.avatarUrl || "")}
      <span data-label="Expiry">
        ${dateLabel(member.endDate)}
        <small class="row-meta days-chip days-${daysClass}">${daysLabel}</small>
      </span>
      <span data-label="Status">
        <mark class="status ${statusClass(member.computedStatus)}">${escapeHtml(member.computedStatus)}</mark>
        ${reminderBadge}
      </span>
      <span class="row-actions">
        <a class="icon-btn" data-whatsapp-sent="${escapeHtml(member.id)}" href="${whatsappUrl(member, message)}" target="_blank" rel="noreferrer" title="Send WhatsApp Reminder"><span class="material-symbols-outlined">send</span></a>
        ${reminder ? `
          <button class="icon-btn danger" data-reminder-undo="${escapeHtml(reminder.id)}" title="Undo 'Mark as Sent'"><span class="material-symbols-outlined">undo</span></button>
        ` : `
          <button class="icon-btn" data-reminder-sent="${escapeHtml(member.id)}" title="Mark as Sent"><span class="material-symbols-outlined">done</span></button>
        `}
        <button class="icon-btn" data-action="quick-renew" data-member-id="${escapeHtml(member.id)}" title="Renew Membership"><span class="material-symbols-outlined">autorenew</span></button>
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
