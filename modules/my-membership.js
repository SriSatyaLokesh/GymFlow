import { dateLabel, daysUntil, emptyState, escapeHtml, findName, memberStatus, pageHeader, statusClass } from "./utils.js";
 
export const myMembershipModule = {
  render(context) {
    const isGuest = context.profile?.role === "guest";
    const me = context.myMember || (isGuest ? {
      status: "Guest Mode",
      fullName: "Guest Explorer",
      mobile: "-",
      email: "-",
      joinDate: new Date().toISOString().slice(0, 10),
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      assignedTrainer: null
    } : null);
 
    if (!me) {
      return `
        ${pageHeader("My Membership")}
        ${emptyState("Membership being set up", "Your gym is finalising your membership. Check back soon.")}
      `;
    }
 
    const plans = context.data.membership_plans || [];
    const trainers = context.data.trainers || [];
    const status = me.status === "Pending" ? "Pending" : memberStatus(me);
    const remaining = daysUntil(me.endDate);
 
    const settings = context.settings || {};
    const currencySymbol = settings.currencySymbol || "₹";
 
    // 1. If VIP plan is enabled, prepended as the anchor
    const vipEnabled = settings.vipPlanEnabled !== false;
    let vipCardHtml = "";
    if (vipEnabled) {
      const vipName = settings.vipPlanName || "VIP Personal Coaching Package";
      const vipPrice = settings.vipPlanPrice ?? 5000;
      const vipDesc = settings.vipPlanDescription || "1-on-1 private trainer, customized nutrition and supplement guidelines, weekly body metrics tracking, and priority equipment booking.";
      vipCardHtml = `
        <article class="membership-card vip-card" style="background: linear-gradient(135deg, var(--card-bg, #ffffff), rgba(99, 102, 241, 0.05)); border: 2px solid var(--accent, #6366f1); border-radius: 12px; padding: 20px; box-shadow: 0 10px 15px -3px rgba(99,102,241, 0.1), var(--shadow-small); position: relative; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
          <div class="vip-badge" style="position: absolute; top: -12px; right: 15px; background: linear-gradient(90deg, var(--accent, #6366f1), var(--teal, #14b8a6)); color: white; padding: 4px 10px; font-size: 0.7rem; font-weight: 800; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Most Elite</div>
          <div>
            <h3 style="margin: 0 0 6px 0; font-size: 1.2rem; color: var(--accent, #6366f1); font-weight: 700;">${escapeHtml(vipName)}</h3>
            <p style="font-size: 0.85rem; color: var(--muted); margin: 0 0 15px 0; line-height: 1.4;">${escapeHtml(vipDesc)}</p>
          </div>
          <div style="margin-top: auto;">
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--ink); margin-bottom: 12px;">
              ${currencySymbol}${vipPrice.toLocaleString()} <span style="font-size: 0.85rem; color: var(--muted); font-weight: 400;">/ month</span>
            </div>
            <a href="#/profile" class="primary-button" style="width: 100%; text-align: center; background: var(--accent, #6366f1); border-color: var(--accent, #6366f1);">Choose VIP Upgrade</a>
          </div>
        </article>
      `;
    }
 
    const plansHtml = `
      <section class="panel" style="margin-top: 20px;">
        <div class="panel-heading" style="margin-bottom: 15px;"><h2>Membership Plans &amp; Packages</h2></div>
        <div class="plans-matrix-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 15px;">
          ${vipCardHtml}
          ${plans.map(p => `
            <article class="membership-card" style="border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; padding: 20px; background: var(--card-bg, #ffffff); text-align: left; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-small);">
              <div>
                <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; color: var(--ink); font-weight: 700;">${escapeHtml(p.planName)}</h3>
                <p style="font-size: 0.85rem; color: var(--muted); margin: 0 0 15px 0; line-height: 1.4;">${escapeHtml(p.description || "Standard gym access and features.")}</p>
                ${p.benefits ? `
                  <ul style="font-size: 0.8rem; color: var(--muted); padding-left: 15px; margin: 0 0 15px 0; line-height: 1.4;">
                    ${p.benefits.split(",").map(b => `<li>${escapeHtml(b.trim())}</li>`).join("")}
                  </ul>
                ` : ""}
              </div>
              <div style="margin-top: auto;">
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--ink); margin-bottom: 12px;">
                  ${currencySymbol}${Number(p.price || 0).toLocaleString()} <span style="font-size: 0.8rem; color: var(--muted); font-weight: 400;">/ ${p.durationDays} days</span>
                </div>
                <a href="#/profile" class="primary-button" style="width: 100%; text-align: center;">Select Plan</a>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
 
    if (isGuest) {
      return `
        ${pageHeader("Membership Plans")}
        <div class="banner info-banner" style="background: rgba(99, 102, 241, 0.08); color: var(--accent, #6366f1); border: 1px solid rgba(99, 102, 241, 0.25); padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-start; text-align: left;">
          <span class="material-symbols-outlined" style="font-size:24px; flex-shrink: 0; color: var(--accent, #6366f1);">info</span>
          <div>
            <strong style="display:block; margin-bottom:2px;">Guest Mode Pricing Preview</strong>
            <span style="font-size:0.85rem; opacity:0.9;">Compare our standard packages against our premium 1-on-1 private trainer package. Create a free account to lock in your choice!</span>
          </div>
        </div>
        ${plansHtml}
      `;
    }
 
    return `
      ${pageHeader("My Membership")}
      ${
        me.status === "Pending"
          ? `<div class="panel-hint" style="margin-bottom:18px">Your membership is pending approval from the gym. Some details may be incomplete until then.</div>`
          : ""
      }
      <div class="metric-grid">
        <article class="metric"><span>Status</span><strong><mark class="status ${statusClass(status)}">${escapeHtml(status)}</mark></strong></article>
        <article class="metric"><span>Plan</span><strong>${escapeHtml(findName(plans, me.planId, "Not set"))}</strong></article>
        <article class="metric"><span>Expires</span><strong>${me.endDate ? dateLabel(me.endDate) : "-"}</strong></article>
        <article class="metric"><span>Days Left</span><strong>${me.endDate ? (remaining < 0 ? `${Math.abs(remaining)} overdue` : remaining) : "-"}</strong></article>
      </div>
      <div class="split-grid" style="margin-top: 20px; gap: 20px;">
        <section class="panel stack" style="flex: 1.2;">
          <div class="panel-heading"><h2>Details</h2></div>
          <div class="detail-grid">
            <div><span>Name</span><strong>${escapeHtml(me.fullName || "-")}</strong></div>
            <div><span>Mobile</span><strong>${escapeHtml(me.mobile || "-")}</strong></div>
            <div><span>Email</span><strong>${escapeHtml(me.email || "-")}</strong></div>
            <div><span>Join date</span><strong>${me.joinDate ? dateLabel(me.joinDate) : "-"}</strong></div>
            <div><span>Start date</span><strong>${me.startDate ? dateLabel(me.startDate) : "-"}</strong></div>
            <div><span>Assigned trainer</span><strong>${escapeHtml(findName(trainers, me.assignedTrainer, "Unassigned"))}</strong></div>
          </div>
        </section>
      </div>
      ${plansHtml}
    `;
  }
};
