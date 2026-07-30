import { escapeHtml, pageHeader, getAvatarUrl } from "./utils.js";

const EMOJIS = [
  "😀", "😎", "🤓", "🤠", "👽", "🤖", "👑", "🧔", "🧑", "👩", "👨", "👱‍♀️", 
  "🦁", "🐯", "🦊", "🐻", "🐼", "🐨", "🐙", "🦄", "🦅", "🦖", "🦈",
  "🏋️", "🏃", "🧘", "🚴", "🥊", "🤸", "🧗", "⚽", "🏀", "🏆", "🥇", 
  "💪", "⚡", "🔥", "❤️", "⭐", "🚀", "🍕", "🥑", "🎧", "🎨", "🎯"
];

const BACKGROUNDS = [
  ["Solid Black", "#000000"],
  ["Solid White", "#ffffff"],
  ["Crimson Red", "#e63946"],
  ["Hot Pink", "#ff007f"],
  ["Neon Orange", "#f77f00"],
  ["Sunshine Yellow", "#fcbf49"],
  ["Emerald Green", "#2a9d8f"],
  ["Mint Green", "#8ac926"],
  ["Ocean Teal", "#00b4db"],
  ["Royal Blue", "#0077b6"],
  ["Electric Indigo", "#3f37c9"],
  ["Deep Purple", "#7209b7"],
  ["Slate Gray", "#4a5568"],
  ["Coral Sunset", "#ff9068,#fd746c"],
  ["Mint Green", "#11998e,#38ef7d"],
  ["Neon Cyan", "#00c6ff,#0072ff"],
  ["Berry Blast", "#8a2387,#e94057"],
  ["Sunfire", "#f12711,#f5af19"],
  ["Violet Magenta", "#7f00ff,#e100ff"],
  ["Cool Blue", "#3a7bd5,#3a6073"],
  ["Lavender Pink", "#4568dc,#b06ab8"],
  ["Ocean Green", "#0575e6,#00f260"],
  ["Deep Space", "#1d2671,#c33764"]
];

export const profileModule = {
  render(context) {
    const role = context.profile.role;
    const me = context.myMember || {};
    const tr = context.myTrainer || {};
    const selectedAvatar = context.profile.avatarUrl || "emoji:🧔:#3a7bd5,#3a6073";

    let currentEmoji = "🧔";
    let currentBg = "#3a7bd5,#3a6073";
    if (selectedAvatar.startsWith("emoji:")) {
      const parts = selectedAvatar.split(":");
      currentEmoji = parts[1] || "🧔";
      currentBg = parts[2] || "#3a7bd5,#3a6073";
    }

    let roleFields = "";
    if (role === "member") {
      roleFields = `
        <div class="form-grid">
          <label>Email (Read-only)
            <input name="email" type="email" value="${escapeHtml(context.profile.email)}" disabled style="opacity: 0.7;" />
          </label>
          <label>Mobile
            <input name="mobile" required maxlength="10" value="${escapeHtml(me.mobile || "")}" />
          </label>
          <label>WhatsApp Number
            <input name="whatsappNumber" maxlength="10" placeholder="Same as mobile" value="${escapeHtml(me.whatsappNumber || "")}" />
          </label>
          <label>Gender
            <select name="gender">
              <option value="Not specified" ${me.gender === "Not specified" ? "selected" : ""}>Not specified</option>
              <option value="Female" ${me.gender === "Female" ? "selected" : ""}>Female</option>
              <option value="Male" ${me.gender === "Male" ? "selected" : ""}>Male</option>
              <option value="Other" ${me.gender === "Other" ? "selected" : ""}>Other</option>
            </select>
          </label>
          <label>Date of Birth
            <input name="dateOfBirth" type="date" value="${escapeHtml(me.dateOfBirth || "")}" />
          </label>
          <label class="wide">Address
            <textarea name="address" rows="2">${escapeHtml(me.address || "")}</textarea>
          </label>

          <div class="form-section-heading">Emergency Contact</div>
          <label>Contact name
            <input name="emergencyName" maxlength="80" value="${escapeHtml(me.emergencyName || "")}" />
          </label>
          <label>Relationship
            <select name="emergencyRelationship">
              <option value="" ${!me.emergencyRelationship ? "selected" : ""}>Not specified</option>
              <option value="Spouse" ${me.emergencyRelationship === "Spouse" ? "selected" : ""}>Spouse</option>
              <option value="Parent" ${me.emergencyRelationship === "Parent" ? "selected" : ""}>Parent</option>
              <option value="Sibling" ${me.emergencyRelationship === "Sibling" ? "selected" : ""}>Sibling</option>
              <option value="Child" ${me.emergencyRelationship === "Child" ? "selected" : ""}>Child</option>
              <option value="Friend" ${me.emergencyRelationship === "Friend" ? "selected" : ""}>Friend</option>
              <option value="Other" ${me.emergencyRelationship === "Other" ? "selected" : ""}>Other</option>
            </select>
          </label>
          <label>Contact phone
            <input name="emergencyPhone" type="tel" maxlength="10" value="${escapeHtml(me.emergencyPhone || "")}" />
          </label>

          <div class="form-section-heading">Measurements</div>
          <label>Weight kg
            <input name="initWeight" type="number" min="0" step="0.1" value="${escapeHtml(me.initWeight != null ? String(me.initWeight) : "")}" />
          </label>
          <label>Height cm
            <input name="initHeight" type="number" min="0" step="0.1" value="${escapeHtml(me.initHeight != null ? String(me.initHeight) : "")}" />
          </label>
          <label>Body fat %
            <input name="initBodyFat" type="number" min="0" step="0.1" value="${escapeHtml(me.initBodyFat != null ? String(me.initBodyFat) : "")}" />
          </label>
          <label>Waist cm
            <input name="initWaist" type="number" min="0" step="0.1" value="${escapeHtml(me.initWaist != null ? String(me.initWaist) : "")}" />
          </label>
          <label>Chest cm
            <input name="initChest" type="number" min="0" step="0.1" value="${escapeHtml(me.initChest != null ? String(me.initChest) : "")}" />
          </label>
          <label>Hip cm
            <input name="initHip" type="number" min="0" step="0.1" value="${escapeHtml(me.initHip != null ? String(me.initHip) : "")}" />
          </label>
          <label>Bicep cm
            <input name="initBicep" type="number" min="0" step="0.1" value="${escapeHtml(me.initBicep != null ? String(me.initBicep) : "")}" />
          </label>
          <label>Thigh cm
            <input name="initThigh" type="number" min="0" step="0.1" value="${escapeHtml(me.initThigh != null ? String(me.initThigh) : "")}" />
          </label>
          <label class="wide">Gym goal
            <select name="gymGoal">
              <option value="" ${!me.gymGoal ? "selected" : ""}>Not specified</option>
              <option value="Weight Loss" ${me.gymGoal === "Weight Loss" ? "selected" : ""}>Weight Loss</option>
              <option value="Muscle Gain" ${me.gymGoal === "Muscle Gain" ? "selected" : ""}>Muscle Gain</option>
              <option value="General Fitness" ${me.gymGoal === "General Fitness" ? "selected" : ""}>General Fitness</option>
              <option value="Endurance / Cardio" ${me.gymGoal === "Endurance / Cardio" ? "selected" : ""}>Endurance / Cardio</option>
              <option value="Body Toning" ${me.gymGoal === "Body Toning" ? "selected" : ""}>Body Toning</option>
              <option value="Flexibility / Mobility" ${me.gymGoal === "Flexibility / Mobility" ? "selected" : ""}>Flexibility / Mobility</option>
              <option value="Rehabilitation" ${me.gymGoal === "Rehabilitation" ? "selected" : ""}>Rehabilitation</option>
            </select>
          </label>

          <div class="form-section-heading">Background</div>
          <label>Blood group
            <select name="bloodGroup">
              <option value="" ${!me.bloodGroup ? "selected" : ""}>Not specified</option>
              <option value="A+" ${me.bloodGroup === "A+" ? "selected" : ""}>A+</option>
              <option value="A-" ${me.bloodGroup === "A-" ? "selected" : ""}>A-</option>
              <option value="B+" ${me.bloodGroup === "B+" ? "selected" : ""}>B+</option>
              <option value="B-" ${me.bloodGroup === "B-" ? "selected" : ""}>B-</option>
              <option value="O+" ${me.bloodGroup === "O+" ? "selected" : ""}>O+</option>
              <option value="O-" ${me.bloodGroup === "O-" ? "selected" : ""}>O-</option>
              <option value="AB+" ${me.bloodGroup === "AB+" ? "selected" : ""}>AB+</option>
              <option value="AB-" ${me.bloodGroup === "AB-" ? "selected" : ""}>AB-</option>
            </select>
          </label>
          <label>Occupation
            <input name="occupation" maxlength="80" value="${escapeHtml(me.occupation || "")}" />
          </label>
          <label>Activity level
            <select name="activityLevel">
              <option value="" ${!me.activityLevel ? "selected" : ""}>Not specified</option>
              <option value="Sedentary" ${me.activityLevel === "Sedentary" ? "selected" : ""}>Sedentary</option>
              <option value="Lightly Active" ${me.activityLevel === "Lightly Active" ? "selected" : ""}>Lightly Active</option>
              <option value="Moderately Active" ${me.activityLevel === "Moderately Active" ? "selected" : ""}>Moderately Active</option>
              <option value="Very Active" ${me.activityLevel === "Very Active" ? "selected" : ""}>Very Active</option>
            </select>
          </label>
          <label>Fitness experience
            <select name="fitnessExperience">
              <option value="" ${!me.fitnessExperience ? "selected" : ""}>Not specified</option>
              <option value="Beginner" ${me.fitnessExperience === "Beginner" ? "selected" : ""}>Beginner</option>
              <option value="Intermediate" ${me.fitnessExperience === "Intermediate" ? "selected" : ""}>Intermediate</option>
              <option value="Advanced" ${me.fitnessExperience === "Advanced" ? "selected" : ""}>Advanced</option>
            </select>
          </label>

          <div class="form-section-heading">Health &amp; Medical</div>
          <label class="wide">Medical conditions
            <textarea name="medicalConditions" rows="2">${escapeHtml(me.medicalConditions || "")}</textarea>
          </label>
          <label class="wide">Current medications
            <textarea name="currentMedications" rows="2">${escapeHtml(me.currentMedications || "")}</textarea>
          </label>
          <label class="wide">Allergies
            <textarea name="allergies" rows="2">${escapeHtml(me.allergies || "")}</textarea>
          </label>
          <label class="wide">Limitations or injuries
            <textarea name="physicalLimitations" rows="2">${escapeHtml(me.physicalLimitations || "")}</textarea>
          </label>
        </div>
      `;
    } else if (role === "trainer") {
      roleFields = `
        <div class="form-grid">
          <label>Email (Read-only)
            <input name="email" type="email" value="${escapeHtml(context.profile.email)}" disabled style="opacity: 0.7;" />
          </label>
          <label>Mobile
            <input name="mobile" required maxlength="10" value="${escapeHtml(tr.mobile || "")}" />
          </label>
          <label>Specialization
            <input name="specialization" maxlength="80" value="${escapeHtml(tr.specialization || "")}" />
          </label>
          <label>Experience
            <input name="experience" maxlength="80" value="${escapeHtml(tr.experience || "")}" />
          </label>
          <label class="wide">Certifications
            <textarea name="certifications" rows="2">${escapeHtml(tr.certifications || "")}</textarea>
          </label>
        </div>
      `;
    } else if (role === "owner") {
      roleFields = `
        <div class="form-grid">
          <label>Email (Read-only)
            <input name="email" type="email" value="${escapeHtml(context.profile.email)}" disabled style="opacity: 0.7;" />
          </label>
          <label>Mobile
            <input name="mobile" maxlength="10" value="${escapeHtml(context.profile.mobile || "")}" />
          </label>
        </div>
      `;
    }

    return `
      ${pageHeader("My Profile")}
      <div class="work-grid">
        <form id="profile-edit-form" class="panel stack" style="gap: 16px;">
          <div class="panel-heading"><h2>Edit Profile Details</h2></div>
          
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 10px;">
            <div id="avatar-preview-container" style="width: 84px; height: 84px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primary); display: flex; align-items: center; justify-content: center; background: var(--bg-light); box-shadow: var(--shadow-md);"></div>
            <div class="stack" style="gap: 4px;">
              <label style="font-weight: 600; font-size: 1.1rem; margin: 0;">Avatar Creator</label>
              <span class="panel-hint">Design your custom avatar using any emoji and background color.</span>
            </div>
          </div>

          <label>Your Name
            <input name="name" value="${escapeHtml(context.profile.name)}" required style="width: 100%; margin-top: 6px;" />
          </label>
          
          <div class="form-grid" style="grid-template-columns: 1fr; gap: 16px; margin-top: 6px;">
            <label>Custom Emoji (Type or paste *any* emoji, e.g. 🦊)
              <input id="custom-emoji-input" maxlength="2" placeholder="Type or paste any emoji" style="width: 100%; margin-top: 6px;" value="${escapeHtml(currentEmoji)}" />
            </label>
          </div>

          <div>
            <label style="margin-bottom: 8px; display: block; font-weight: 500;">Quick Emojis</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 8px; max-height: 140px; overflow-y: auto; padding: 8px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-light, rgba(255,255,255,0.02));">
              ${EMOJIS.map(emoji => `
                <button type="button" class="emoji-option-btn" data-emoji="${escapeHtml(emoji)}" style="font-size: 1.75rem; border: none; background: transparent; padding: 4px; cursor: pointer; border-radius: var(--r-sm); transition: background 0.15s; display: flex; align-items: center; justify-content: center;">${emoji}</button>
              `).join("")}
            </div>
          </div>

          <div>
            <label style="margin-bottom: 8px; display: block; font-weight: 500;">Background Color / Gradient</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 10px; max-height: 180px; overflow-y: auto; padding: 8px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-light, rgba(255,255,255,0.02));">
              ${BACKGROUNDS.map(([name, value]) => {
                const isGradient = value.includes(",");
                let styleBg = value;
                if (isGradient) {
                  styleBg = `linear-gradient(135deg, ${value.split(",")[0]}, ${value.split(",")[1]})`;
                }
                const isSelected = currentBg === value;
                return `
                  <div class="color-option-wrapper" data-color-val="${escapeHtml(value)}" title="${escapeHtml(name)}" style="cursor: pointer; border-radius: 50%; width: 36px; height: 36px; border: 3px solid ${isSelected ? "var(--primary)" : "transparent"}; background: ${styleBg}; transition: border-color 0.2s; box-shadow: var(--shadow-sm);"></div>
                `;
              }).join("")}
            </div>
          </div>

          ${roleFields}
          
          <button class="primary-button" type="submit" style="margin-top: 10px; align-self: flex-start;">Save Changes</button>
        </form>
      </div>
    `;
  },

  bind(root, context) {
    const form = root.querySelector("#profile-edit-form");
    if (!form) return;

    const previewContainer = root.querySelector("#avatar-preview-container");
    const emojiInput = root.querySelector("#custom-emoji-input");
    const role = context.profile.role;

    let selectedAvatar = context.profile.avatarUrl || "emoji:🧔:#3a7bd5,#3a6073";
    let currentEmoji = "🧔";
    let currentBg = "#3a7bd5,#3a6073";
    
    if (selectedAvatar.startsWith("emoji:")) {
      const parts = selectedAvatar.split(":");
      currentEmoji = parts[1] || "🧔";
      currentBg = parts[2] || "#3a7bd5,#3a6073";
    }

    function renderPreview() {
      const spec = `emoji:${currentEmoji}:${currentBg}`;
      selectedAvatar = spec;
      const url = getAvatarUrl(spec);
      previewContainer.innerHTML = `<img src="${escapeHtml(url)}" style="width: 100%; height: 100%; object-fit: cover;" />`;
    }

    // Initialize preview
    renderPreview();

    // Listen to custom emoji keyboard inputs
    emojiInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (val) {
        currentEmoji = val;
        renderPreview();
      }
    });

    // Listen to quick emojis click
    root.querySelectorAll(".emoji-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentEmoji = btn.dataset.emoji;
        emojiInput.value = currentEmoji;
        renderPreview();
      });
    });

    // Listen to background colors selection
    root.querySelectorAll(".color-option-wrapper").forEach((el) => {
      el.addEventListener("click", () => {
        root.querySelectorAll(".color-option-wrapper").forEach((item) => {
          item.style.borderColor = "transparent";
        });
        el.style.borderColor = "var(--primary)";
        currentBg = el.dataset.colorVal;
        renderPreview();
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = form.querySelector("[type='submit']");
      const name = form.querySelector("[name='name']").value.trim();
      if (!name) return;

      submitBtn.disabled = true;
      try {
        const mobileVal = form.querySelector("[name='mobile']")?.value.trim() || "";
        await context.services.auth.updateProfile({
          name,
          avatarUrl: selectedAvatar,
          ...(role === "owner" ? { mobile: mobileVal } : {})
        });

        if (role === "member" && context.myMember) {
          const updatedMember = {
            ...context.myMember,
            fullName: name,
            avatarUrl: selectedAvatar,
            mobile: mobileVal,
            whatsappNumber: form.querySelector("[name='whatsappNumber']")?.value.trim() || "",
            gender: form.querySelector("[name='gender']")?.value || "Not specified",
            dateOfBirth: form.querySelector("[name='dateOfBirth']")?.value || "",
            address: form.querySelector("[name='address']")?.value.trim() || "",
            emergencyName: form.querySelector("[name='emergencyName']")?.value.trim() || "",
            emergencyRelationship: form.querySelector("[name='emergencyRelationship']")?.value || "",
            emergencyPhone: form.querySelector("[name='emergencyPhone']")?.value.trim() || "",
            gymGoal: form.querySelector("[name='gymGoal']")?.value || "",
            bloodGroup: form.querySelector("[name='bloodGroup']")?.value || "",
            occupation: form.querySelector("[name='occupation']")?.value.trim() || "",
            activityLevel: form.querySelector("[name='activityLevel']")?.value || "",
            fitnessExperience: form.querySelector("[name='fitnessExperience']")?.value || "",
            medicalConditions: form.querySelector("[name='medicalConditions']")?.value.trim() || "",
            currentMedications: form.querySelector("[name='currentMedications']")?.value.trim() || "",
            allergies: form.querySelector("[name='allergies']")?.value.trim() || "",
            physicalLimitations: form.querySelector("[name='physicalLimitations']")?.value.trim() || "",
            initWeight: form.querySelector("[name='initWeight']")?.value ? parseFloat(form.querySelector("[name='initWeight']").value) : "",
            initHeight: form.querySelector("[name='initHeight']")?.value ? parseFloat(form.querySelector("[name='initHeight']").value) : "",
            initBodyFat: form.querySelector("[name='initBodyFat']")?.value ? parseFloat(form.querySelector("[name='initBodyFat']").value) : "",
            initWaist: form.querySelector("[name='initWaist']")?.value ? parseFloat(form.querySelector("[name='initWaist']").value) : "",
            initChest: form.querySelector("[name='initChest']")?.value ? parseFloat(form.querySelector("[name='initChest']").value) : "",
            initHip: form.querySelector("[name='initHip']")?.value ? parseFloat(form.querySelector("[name='initHip']").value) : "",
            initBicep: form.querySelector("[name='initBicep']")?.value ? parseFloat(form.querySelector("[name='initBicep']").value) : "",
            initThigh: form.querySelector("[name='initThigh']")?.value ? parseFloat(form.querySelector("[name='initThigh']").value) : ""
          };

          const calcBmi = (weightKg, heightCm) => {
            const w = parseFloat(weightKg);
            const h = parseFloat(heightCm) / 100;
            if (!w || !h || h <= 0) return "";
            return (w / (h * h)).toFixed(1);
          };
          updatedMember.initBmi = calcBmi(updatedMember.initWeight, updatedMember.initHeight);

          const savedMember = await context.services.data.save("members", updatedMember);
          context.applyChange("members", savedMember);

          // Record measurements as per date for analytics
          const todayStr = new Date().toISOString().slice(0, 10);
          const progressRecords = context.data.progress_records || [];
          const existingTodayRecord = progressRecords.find(r => r.memberId === context.myMember.id && r.date === todayStr);

          const progressRecord = {
            ...(existingTodayRecord || {}),
            memberId: context.myMember.id,
            date: todayStr,
            weight: updatedMember.initWeight,
            bmi: updatedMember.initBmi,
            bodyFat: updatedMember.initBodyFat,
            waist: updatedMember.initWaist,
            chest: updatedMember.initChest,
            hip: updatedMember.initHip,
            bicep: updatedMember.initBicep,
            thigh: updatedMember.initThigh,
            notes: existingTodayRecord?.notes || "Profile update"
          };

          const hasMeasurements = Object.keys(progressRecord).some(key => 
            ["weight", "bodyFat", "waist", "chest", "hip", "bicep", "thigh"].includes(key) && progressRecord[key] !== ""
          );
          if (hasMeasurements) {
            const savedProgress = await context.services.data.save("progress_records", progressRecord);
            context.applyChange("progress_records", savedProgress);
          }
        }

        if (role === "trainer" && context.myTrainer) {
          const updatedTrainer = {
            ...context.myTrainer,
            name,
            avatarUrl: selectedAvatar,
            mobile: mobileVal,
            specialization: form.querySelector("[name='specialization']")?.value.trim() || "",
            experience: form.querySelector("[name='experience']")?.value.trim() || "",
            certifications: form.querySelector("[name='certifications']")?.value.trim() || ""
          };
          const savedTrainer = await context.services.data.save("trainers", updatedTrainer);
          context.applyChange("trainers", savedTrainer);
        }

        context.toast("Profile updated successfully.");
        await context.refresh();
      } catch (error) {
        console.error(error);
        context.toast("Failed to update profile.");
        submitBtn.disabled = false;
      }
    });
  }
};
