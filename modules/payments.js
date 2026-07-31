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
  const receipt = window.open("", "receipt", "width=460,height=680");
  const currency = settings?.currency || "INR";
  receipt.document.write(`
    <title>${payment.receiptNumber || "Receipt"}</title>
    <style>
      body {
        font-family: 'Montserrat', 'Inter', sans-serif;
        background: #f4f7f5;
        margin: 0;
        padding: 30px;
        color: #121212;
        display: flex;
        justify-content: center;
      }
      .invoice-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 30px;
        width: 100%;
        max-width: 380px;
        box-shadow: 6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff;
        box-sizing: border-box;
      }
      .header {
        border-bottom: 2px dashed #e0e3e1;
        padding-bottom: 20px;
        margin-bottom: 20px;
        text-align: center;
      }
      .gym-name {
        font-size: 1.5rem;
        font-weight: 800;
        color: #0d9488;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .receipt-no {
        font-size: 0.8rem;
        color: #6b716e;
        margin: 6px 0 0 0;
        font-weight: 600;
      }
      .table {
        margin: 20px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        padding-bottom: 8px;
        border-bottom: 1px solid #eceeec;
        font-size: 0.9rem;
      }
      .row:last-of-type {
        border-bottom: none;
      }
      .label {
        color: #6b716e;
        font-weight: 500;
      }
      .value {
        font-weight: 700;
        text-align: right;
      }
      .total-row {
        border-top: 2px solid #e0e3e1;
        font-weight: 800;
        font-size: 1.25rem;
        color: #0d9488;
        padding-top: 15px;
        margin-top: 10px;
      }
      .notes-box {
        background: #f8f8f8;
        border-radius: 8px;
        padding: 12px;
        font-size: 0.8rem;
        margin-top: 20px;
        border-left: 4px solid #00c2ff;
        text-align: left;
        color: #2d3130;
        line-height: 1.4;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 0.8rem;
        color: #6b716e;
        font-weight: 500;
      }
      @media print {
        body { background: #ffffff; padding: 0; }
        .invoice-card { box-shadow: none; border: none; padding: 0; }
      }
    </style>
    <div class="invoice-card">
      <div class="header">
        <h1 class="gym-name">${escapeHtml(settings?.gymName || "GymFlow")}</h1>
        <p class="receipt-no">Receipt: ${escapeHtml(payment.receiptNumber || payment.id)}</p>
      </div>
      <div class="table">
        <div class="row"><span class="label">Member</span><span class="value">${escapeHtml(member?.fullName || "-")}</span></div>
        <div class="row"><span class="label">Plan</span><span class="value">${escapeHtml(plan?.planName || "-")}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${dateLabel(payment.date)}</span></div>
        <div class="row"><span class="label">Method</span><span class="value">${escapeHtml(payment.method)}</span></div>
        <div class="row"><span class="label">Status</span><span class="value">${escapeHtml(payment.status)}</span></div>
        <div class="row total-row"><span class="label">Amount</span><span class="value">${money(payment.amount, currency)}</span></div>
      </div>
      ${payment.notes ? `<div class="notes-box"><strong>Remarks:</strong><br>${escapeHtml(payment.notes)}</div>` : ""}
      <div class="footer">Thank you for your payment!</div>
    </div>
  `);
  receipt.document.close();
  receipt.focus();
  receipt.print();
}

