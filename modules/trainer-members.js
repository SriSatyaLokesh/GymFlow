import { collections, dateLabel, emptyState, escapeHtml, findName, formData, optionList, pageHeader, showMemberProfileModal, today, withButtonLoading, getExercisesList } from "./utils.js";
import { canUseWorkoutTemplate, renderTemplateExercises } from "./workouts.js";

export const trainerMembersModule = {
  render(context) {
    const me = context.myTrainer;
    if (!me) {
      return `
        ${pageHeader("My Clients")}
        ${emptyState("Profile being set up", "Once your gym finalises your trainer profile your clients will appear here.")}
      `;
    }

    const myMembers = (context.data.members || []).filter((member) => member.assignedTrainer === me.id);
    const assignments = context.data.workout_assignments || [];
    const templates = (context.data.workout_templates || []).filter((template) => canUseWorkoutTemplate(template, context));
    const exercisesList = getExercisesList().sort((a, b) => a.name.localeCompare(b.name));

    function currentTemplateName(member) {
      const memberAssignments = assignments.filter((assignment) => assignment.memberId === member.id);
      memberAssignments.sort((a, b) => String(b.assignedAt || "").localeCompare(String(a.assignedAt || "")));
      const current = memberAssignments[0];
      return findName(templates, current?.templateId, "No module assigned");
    }

    return `
      ${pageHeader("My Clients")}
      <div class="work-grid">
        <div class="stack">
          <form class="panel stack" id="session-form">
            <div class="panel-heading"><h2>Write Today's Session</h2></div>
            <div class="form-grid">
              <div class="wide stack" style="gap: 6px;">
                <label style="font-weight: 600;">Clients</label>
                <div class="client-check-list" style="max-height: 150px; overflow-y: auto; border: 1px solid var(--line); border-radius: var(--r-sm); padding: 8px; background: var(--bg-alt); display: flex; flex-direction: column; gap: 8px;">
                  ${myMembers.length 
                    ? myMembers.map(m => `
                      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; user-select: none;">
                        <input type="checkbox" name="memberIds" value="${escapeHtml(m.id)}" style="width:18px; height:18px; cursor:pointer;" />
                        <span>${escapeHtml(m.fullName)}</span>
                      </label>
                    `).join("")
                    : `<span style="font-size:0.85rem; color:var(--text-muted);">No clients assigned to you.</span>`
                  }
                </div>
              </div>
              <label>Date
                <input type="date" name="date" value="${escapeHtml(today())}" />
              </label>
              <label>Base Module
                <select name="templateId" data-preview-source="session">
                  <option value="">None</option>
                  ${optionList(templates, "name")}
                </select>
              </label>
              <div class="wide module-preview" data-module-preview="session">${modulePreview(null)}</div>
              <label class="wide">Exercises
                <textarea name="exercises" rows="7" placeholder="Bench press - 3 sets x 10 reps"></textarea>
              </label>
              <div class="wide" style="display:flex; gap:8px; align-items:center; margin-top: -5px; margin-bottom: 10px;">
                <select id="trainer-add-exercise-select" style="flex:1; padding: 6px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--bg-alt); color: var(--text);">
                  <option value="">Choose exercise to add...</option>
                  ${exercisesList.map(ex => `<option value="${escapeHtml(ex.name)}">${escapeHtml(ex.name)}</option>`).join("")}
                </select>
                <button class="ghost-button compact" type="button" id="trainer-insert-exercise-btn" style="white-space:nowrap; padding: 6px 12px; height: 36px; display: flex; align-items: center; justify-content: center;">+ Insert</button>
              </div>
              <label class="wide">Notes
                <textarea name="notes" rows="2"></textarea>
              </label>
            </div>
            <button class="primary-button" type="submit">Save today's session</button>
          </form>

          <form class="panel stack" id="bulk-assign-form">
            <div class="panel-heading"><h2>Assign Module to Clients</h2></div>
            <label>Module
              <select name="templateId" data-preview-source="bulk" required>
                <option value="">Select module...</option>
                ${optionList(templates, "name")}
              </select>
            </label>
            <div class="module-preview" data-module-preview="bulk">${modulePreview(null)}</div>
            ${
              myMembers.length
                ? `<div class="client-check-list">
                    ${myMembers.map((member) => `
                      <label class="check-row">
                        <input type="checkbox" name="memberIds" value="${escapeHtml(member.id)}" />
                        <span>${escapeHtml(member.fullName)}</span>
                      </label>
                    `).join("")}
                  </div>`
                : emptyState("No clients available", "Assigned clients will appear here.")
            }
            <button class="primary-button" type="submit">Assign to selected clients</button>
          </form>
        </div>

        <section class="panel">
          <div class="panel-heading">
            <h2>Assigned Clients</h2>
            <span>${myMembers.length} clients</span>
          </div>
          ${
            myMembers.length
              ? `<div class="card-grid">${myMembers.map((member) => memberCard(member, currentTemplateName(member), templates)).join("")}</div>`
              : emptyState("No clients assigned", "Clients are assigned to you from their member profile.")
          }
        </section>
      </div>
    `;
  },

  bind(root, context) {
    const me = context.myTrainer;
    if (!me) return;

    const templates = (context.data.workout_templates || []).filter((template) => canUseWorkoutTemplate(template, context));
    const form = root.querySelector("#session-form");
    if (form) {
      const templateSelect = form.querySelector("select[name='templateId']");
      const exercisesTextarea = form.querySelector("textarea[name='exercises']");
      templateSelect?.addEventListener("change", () => {
        const template = templates.find((t) => t.id === templateSelect.value);
        if (template) {
          let text = "";
          if (template.exercisesStructured) {
            const rawStructured = typeof template.exercisesStructured === "string" ? JSON.parse(template.exercisesStructured) : template.exercisesStructured;
            text = (rawStructured || []).map(ex => `${ex.name} - ${ex.sets} sets x ${ex.reps} reps${ex.weight ? ` @ ${ex.weight}` : ""}`).join("\n");
          } else if (template.exercises) {
            text = template.exercises;
          }
          exercisesTextarea.value = text;
        }
      });

      const insertSelect = form.querySelector("#trainer-add-exercise-select");
      const insertBtn = form.querySelector("#trainer-insert-exercise-btn");
      insertBtn?.addEventListener("click", () => {
        const exName = insertSelect.value;
        if (exName) {
          const currentVal = exercisesTextarea.value.trim();
          const appendText = `${exName} - 3 sets x 10 reps`;
          exercisesTextarea.value = currentVal ? `${currentVal}\n${appendText}` : appendText;
          insertSelect.value = "";
        }
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const memberIds = Array.from(form.querySelectorAll("input[name='memberIds']:checked")).map(input => input.value);
        if (!memberIds.length) {
          context.toast("Select at least one client.");
          return;
        }
        await withButtonLoading(form.querySelector("[type='submit']"), async () => {
          const rawPayload = formData(form);
          
          const savedSessions = await Promise.all(memberIds.map(async (memberId) => {
            const payload = {
              memberId,
              trainerId: me.id,
              date: rawPayload.date || today(),
              templateId: rawPayload.templateId || "",
              exercises: rawPayload.exercises || "",
              notes: rawPayload.notes || ""
            };
            return await context.services.data.save(collections.workoutSessions, payload);
          }));

          context.toast(`Session saved for ${memberIds.length} clients.`);
          form.reset();
          const dateInput = form.querySelector("[name='date']");
          if (dateInput) dateInput.value = today();
          updatePreview(root, templates, "session", "");
          savedSessions.forEach(saved => context.applyChange(collections.workoutSessions, saved));
        });
      });
    }

    root.querySelectorAll("[data-preview-source]").forEach((select) => {
      select.addEventListener("change", () => updatePreview(root, templates, select.dataset.previewSource, select.value));
    });

    root.querySelectorAll("[data-template-select]").forEach((select) => {
      select.addEventListener("change", () => updateCardPreview(select, templates));
    });

    root.querySelectorAll("[data-assign-selected]").forEach((button) => {
      button.addEventListener("click", async () => {
        const memberId = button.dataset.assignSelected;
        const select = root.querySelector(`[data-template-select="${selectorEscape(memberId)}"]`);
        const templateId = select?.value;
        if (!templateId) {
          context.toast("Select a module first.");
          return;
        }
        await withButtonLoading(button, async () => {
          const saved = await context.services.data.save(collections.assignments, {
            memberId,
            trainerId: me.id,
            templateId,
            assignedAt: today()
          });
          context.toast("Module assigned.");
          context.applyChange(collections.assignments, saved);
        }, "Assigning...");
      });
    });

    const bulkForm = root.querySelector("#bulk-assign-form");
    bulkForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const templateId = bulkForm.templateId.value;
      const memberIds = Array.from(bulkForm.querySelectorAll("input[name='memberIds']:checked")).map((input) => input.value);
      if (!templateId) {
        context.toast("Select a module first.");
        return;
      }
      if (!memberIds.length) {
        context.toast("Select at least one client.");
        return;
      }
      await withButtonLoading(bulkForm.querySelector("[type='submit']"), async () => {
        const savedAssignments = await Promise.all(memberIds.map((memberId) =>
          context.services.data.save(collections.assignments, {
            memberId,
            trainerId: me.id,
            templateId,
            assignedAt: today()
          })
        ));
        savedAssignments.forEach((assignment) => context.applyChange(collections.assignments, assignment));
        context.toast(`Module assigned to ${memberIds.length} clients.`);
        bulkForm.reset();
        updatePreview(root, templates, "bulk", "");
      }, "Assigning...");
    });

    root.querySelectorAll(".view-client-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const member = context.data.members.find((item) => item.id === button.dataset.clientId);
        if (member) {
          showMemberProfileModal(member, context);
        }
      });
    });
  }
};

function updatePreview(root, templates, key, templateId) {
  const target = root.querySelector(`[data-module-preview="${selectorEscape(key)}"]`);
  if (!target) return;
  target.innerHTML = modulePreview(templates.find((template) => template.id === templateId));
}

function updateCardPreview(select, templates) {
  const card = select.closest("[data-client-card]");
  const target = card?.querySelector("[data-card-preview]");
  if (!target) return;
  target.innerHTML = modulePreview(templates.find((template) => template.id === select.value));
}

function modulePreview(template) {
  if (!template) {
    return `<small>Select a module to preview exercises and notes.</small>`;
  }
  const meta = [template.goal || "General Fitness", template.category, template.difficulty, template.durationMinutes ? `${template.durationMinutes} min` : ""]
    .filter(Boolean)
    .join(" / ");
  return `
    <div class="preview-box">
      <strong>${escapeHtml(template.name)}</strong>
      <small>${escapeHtml(meta || "General")}</small>
      ${renderTemplateExercises(template)}
      ${template.notes ? `<small>${escapeHtml(template.notes)}</small>` : ""}
    </div>
  `;
}

function memberCard(member, templateName, templates) {
  return `
    <article class="item-card" data-client-card>
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <strong style="font-size:1.1rem; display:block;">${escapeHtml(member.fullName)}</strong>
          <span style="font-size:0.85rem; opacity:0.8;">${escapeHtml(member.goal || "General")}</span>
        </div>
        <button class="icon-button view-client-btn" data-client-id="${escapeHtml(member.id)}" type="button" title="View profile & logs">
          <span class="material-symbols-outlined">visibility</span>
        </button>
      </div>
      <p style="margin-top:10px;">${escapeHtml(templateName)}</p>
      <div class="stack">
        <select data-template-select="${escapeHtml(member.id)}">
          <option value="">Select module...</option>
          ${optionList(templates, "name")}
        </select>
        <div class="module-preview" data-card-preview>${modulePreview(null)}</div>
        <button class="ghost-button" type="button" data-assign-selected="${escapeHtml(member.id)}">Assign module</button>
      </div>
    </article>
  `;
}

function selectorEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
