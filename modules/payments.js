import { collections, dateLabel, emptyState, escapeHtml, findName, formData, money, nameCell, optionList, pageHeader, statusClass, today, withButtonLoading } from "./utils.js";

export const paymentsModule = {
  render({ data, settings }) {
    const payments = data.payments || [];
    const members = data.members || [];
    const plans = data.membership_plans || [];
    const currency = settings?.currency || "INR";

    return `
      ${pageHeader("Payments")}
      <div class="work-grid">
        <form class="panel stack" id="payment-form">
          <input type="hidden" name="id" />
          <div class="panel-heading"><h2>Record Payment</h2></div>
          <div class="form-grid">
            <label>Member
              <select name="memberId" required>
                <option value="">Select member</option>
                ${optionList(members, "fullName")}
              </select>
            </label>
            <label>Membership plan
              <select name="planId" required>
                <option value="">Select plan</option>
                ${optionList(plans, "planName")}
              </select>
            </label>
            <label>Amount<input name="amount" type="number" min="0" step="1" required /></label>
            <label>Date<input name="date" type="date" value="${today()}" required /></label>
            <label>Method
              <select name="method">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
            </label>
            <label>Status
              <select name="status">
                <option>Paid</option>
                <option>Pending</option>
                <option>Partial</option>
                <option>Refunded</option>
              </select>
            </label>
            <label>Collected by<input name="collectedBy" value="Owner" maxlength="80" /></label>
            <label class="wide" style="grid-column: span 2;">Notes<textarea name="notes" rows="2" placeholder="Transaction remarks/details (e.g. UPI Ref ID, Cash change details)"></textarea></label>
          </div>
          <button class="primary-button" type="submit">Save payment</button>
        </form>
 
        <section class="panel">
          <div class="panel-heading"><h2>Payment History</h2><span>${payments.length} records</span></div>
          ${
            payments.length
              ? `<div class="data-table">
                  <div class="table-head"><span>Receipt</span><span>Member</span><span>Amount</span><span>Status</span><span></span></div>
                  ${payments.map((payment) => row(payment, members, plans, currency)).join("")}
                </div>`
              : emptyState("No payments yet", "Record fees, renewals, pending payments, and refunds.")
          }
        </section>
      </div>
    `;
  },
  bind(root, context) {
    const form = root.querySelector("#payment-form");
 
    form.planId.addEventListener("change", () => {
      const plan = context.data.membership_plans.find((item) => item.id === form.planId.value);
      if (plan) form.amount.value = plan.price || 0;
    });
 
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formData(form);
      payload.amount = Number(payload.amount);
      payload.receiptNumber = payload.receiptNumber || `RCPT-${Date.now().toString().slice(-8)}`;
      await withButtonLoading(form.querySelector("[type='submit']"), async () => {
        const saved = await context.services.data.save(collections.payments, payload);
        context.toast("Payment saved.");
        form.reset();
        form.date.value = today();
        form.collectedBy.value = "Owner";
        context.applyChange(collections.payments, saved);
      });
    });
 
    root.querySelectorAll("[data-receipt]").forEach((button) => {
      button.addEventListener("click", () => {
        const payment = context.data.payments.find((item) => item.id === button.dataset.receipt);
        const member = context.data.members.find((item) => item.id === payment?.memberId);
        const plan = context.data.membership_plans.find((item) => item.id === payment?.planId);
        printReceipt(payment, member, plan, context.settings);
      });
    });

    root.querySelectorAll("[data-share-receipt]").forEach((button) => {
      button.addEventListener("click", () => {
        const payment = context.data.payments.find((item) => item.id === button.dataset.shareReceipt);
        const member = context.data.members.find((item) => item.id === payment?.memberId);
        const plan = context.data.membership_plans.find((item) => item.id === payment?.planId);
        if (!payment || !member) return;
        
        const currency = context.settings?.currency || "INR";
        const phone = member.whatsapp || member.mobile || "";
        const formattedPhone = phone.replace(/[^0-9]/g, "");
        
        const text = `*Receipt from ${context.settings?.gymName || "GymFlow"}*\n\n` +
          `*Receipt No:* ${payment.receiptNumber || payment.id}\n` +
          `*Member:* ${member.fullName}\n` +
          `*Plan:* ${plan?.planName || "Custom"}\n` +
          `*Amount:* ${money(payment.amount, currency)}\n` +
          `*Date:* ${dateLabel(payment.date)}\n` +
          `*Payment Method:* ${payment.method}\n` +
          `*Status:* ${payment.status}\n` +
          `${payment.notes ? `*Remarks:* ${payment.notes}\n` : ""}\n` +
          `Thank you for your payment!`;

        const waUrl = `https://wa.me/${formattedPhone ? formattedPhone : ""}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, "_blank");
      });
    });
  }
};
 
function row(payment, members, plans, currency) {
  return `
    <div class="table-row">
      <span data-label="Receipt">
        <strong>${escapeHtml(payment.receiptNumber || payment.id)}</strong>
        <small>${dateLabel(payment.date)} via ${escapeHtml(payment.method)}</small>
      </span>
      <span data-label="Member">${nameCell(findName(members, payment.memberId), "", members.find(m => m.id === payment.memberId)?.avatarUrl || "")}</span>
      <span data-label="Amount">${money(payment.amount, currency)}</span>
      <span data-label="Status"><mark class="status ${statusClass(payment.status)}">${escapeHtml(payment.status)}</mark></span>
      <span class="row-actions" style="display:flex; gap:6px;">
        <button class="icon-button" data-receipt="${escapeHtml(payment.id)}" title="Print receipt"><span class="material-symbols-outlined">receipt_long</span>Receipt</button>
        <button class="icon-button secondary" data-share-receipt="${escapeHtml(payment.id)}" title="Share receipt on WhatsApp"><span class="material-symbols-outlined">share</span>Share</button>
      </span>
      <small class="table-note">Plan: ${escapeHtml(findName(plans, payment.planId))} ${payment.notes ? `• Remarks: ${escapeHtml(payment.notes)}` : ""}</small>
    </div>
  `;
}
 
function printReceipt(payment, member, plan, settings) {
  if (!payment) return;
  const currency = settings?.currency || "INR";
  
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay invoice-print-overlay";
  overlay.style.zIndex = "3000";
  
  const notesHtml = payment.notes ? `
    <div class="notes-box" style="background: var(--surface-soft); border-radius: var(--r-sm); padding: 12px; font-size: 0.8rem; margin-top: 15px; border-left: 4px solid var(--teal); text-align: left; color: var(--ink-soft); line-height: 1.4;">
      <strong>Remarks:</strong><br>${escapeHtml(payment.notes)}
    </div>
  ` : "";

  overlay.innerHTML = `
    <div class="modal-card invoice-modal stack animate-scale" style="max-width: 420px; position: relative;">
      <button class="modal-close" data-modal="close" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
      
      <div class="invoice-header">
        <div>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--accent); text-transform: uppercase; margin:0;">${escapeHtml(settings?.gymName || "GymFlow")}</h2>
          <small style="color: var(--muted); font-weight: 600; display:block; margin-top:2px;">INVOICE RECEIPT</small>
        </div>
        <div class="invoice-meta">
          <strong>Receipt No:</strong><br>${escapeHtml(payment.receiptNumber || payment.id)}
        </div>
      </div>
      
      <div class="invoice-table">
        <div class="invoice-row"><span class="label" style="color: var(--muted); font-weight:500;">Member</span><span class="value" style="font-weight:700;">${escapeHtml(member?.fullName || "-")}</span></div>
        <div class="invoice-row"><span class="label" style="color: var(--muted); font-weight:500;">Plan</span><span class="value" style="font-weight:700;">${escapeHtml(plan?.planName || "-")}</span></div>
        <div class="invoice-row"><span class="label" style="color: var(--muted); font-weight:500;">Date</span><span class="value" style="font-weight:700;">${dateLabel(payment.date)}</span></div>
        <div class="invoice-row"><span class="label" style="color: var(--muted); font-weight:500;">Method</span><span class="value" style="font-weight:700;">${escapeHtml(payment.method)}</span></div>
        <div class="invoice-row"><span class="label" style="color: var(--muted); font-weight:500;">Status</span><span class="value" style="font-weight:700; color: var(--accent);">${escapeHtml(payment.status)}</span></div>
        <div class="invoice-row total-row"><span class="label">Amount</span><span class="value">${money(payment.amount, currency)}</span></div>
      </div>
      
      ${notesHtml}
      
      <div class="invoice-actions" style="display: flex; gap: 10px; margin-top: 20px; width: 100%;">
        <button class="primary-button invoice-actions-btn" id="print-invoice-btn" style="flex:1;"><span class="material-symbols-outlined">print</span>Print Receipt</button>
        <button class="ghost-button invoice-actions-btn" data-modal="close" style="flex:1;">Close</button>
      </div>
    </div>
  `;
  
  function close() {
    overlay.remove();
  }
  
  overlay.querySelector("#print-invoice-btn").addEventListener("click", () => {
    window.print();
  });
  
  overlay.querySelectorAll("[data-modal='close']").forEach(btn => btn.addEventListener("click", close));
  document.body.appendChild(overlay);
}

