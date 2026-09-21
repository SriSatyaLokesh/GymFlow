import { escapeHtml, pageHeader, getAvatarUrl, renderSharedMemberFields, bindSharedBmiEvents, cmToFeetInches, calcBmi, CARTOON_AVATARS, initials } from "./utils.js";

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

    const emailVal = context.profile.email || "";
    const isSyntheticEmail = emailVal.endsWith("@gymflow.app");

    // Role-specific View Mode HTML
    let roleDetailsView = "";
    if (role === "member") {
      const { feet: fVal, inches: iVal } = cmToFeetInches(me.initHeight);
      const heightDisplay = fVal ? `${fVal} ft ${iVal} in` : "--";

      roleDetailsView = `
        <div><strong>WhatsApp Number</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.whatsappNumber) || "--"}</p></div>
        <div><strong>Gender</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.gender) || "--"}</p></div>
        <div><strong>Date of Birth</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.dateOfBirth) || "--"}</p></div>
        <div class="wide"><strong>Address</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.address) || "--"}</p></div>
        
        <div class="form-section-heading wide" style="margin-top: 15px;">Emergency Contact</div>
        <div><strong>Contact Name</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.emergencyName) || "--"}</p></div>
        <div><strong>Relationship</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.emergencyRelationship) || "--"}</p></div>
        <div><strong>Contact Phone</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.emergencyPhone) || "--"}</p></div>
        
        <div class="form-section-heading wide" style="margin-top: 15px;">Initial Measurements</div>
        <div><strong>Weight</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${me.initWeight != null ? me.initWeight + " kg" : "--"}</p></div>
        <div><strong>Height</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${heightDisplay}</p></div>
        <div><strong>Body Fat</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${me.initBodyFat != null ? me.initBodyFat + " %" : "--"}</p></div>
        <div><strong>Waist</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${me.initWaist != null ? me.initWaist + " cm" : "--"}</p></div>
        <div><strong>Chest</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${me.initChest != null ? me.initChest + " cm" : "--"}</p></div>
        <div><strong>Hip</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${me.initHip != null ? me.initHip + " cm" : "--"}</p></div>
        
        <div class="form-section-heading wide" style="margin-top: 15px;">Medical &amp; Background</div>
        <div><strong>Blood Group</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.bloodGroup) || "--"}</p></div>
        <div><strong>Occupation</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.occupation) || "--"}</p></div>
        <div class="wide"><strong>Medical Conditions</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(me.medicalConditions) || "--"}</p></div>
      `;
    } else if (role === "trainer") {
      roleDetailsView = `
        <div><strong>Specialization</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(tr.specialization) || "--"}</p></div>
        <div><strong>Experience</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(tr.experience) || "--"}</p></div>
        <div class="wide"><strong>Certifications</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(tr.certifications) || "--"}</p></div>
      `;
    }

    // Role-specific Edit Mode Form HTML with synthetic email handling
    let roleFields = "";
    let emailFieldHtml = "";

    if (isSyntheticEmail) {
      emailFieldHtml = `
        <label class="wide">Email
          <input name="email" type="text" value="Phone Authentication (No Email)" disabled style="opacity: 0.7;" />
          <p class="panel-hint" style="margin-top: 4px; font-size: 0.8rem; color: var(--text-muted);">As your account uses phone number authentication, you do not have a linked email address.</p>
        </label>
      `;
    } else {
      emailFieldHtml = `
        <label>Email (Read-only)
          <input name="email" type="email" value="${escapeHtml(emailVal)}" disabled style="opacity: 0.7;" />
        </label>
      `;
    }

    if (role === "member") {
      roleFields = `
        <div class="form-grid">
          ${emailFieldHtml}
          <label>Mobile
            <input name="mobile" required maxlength="10" value="${escapeHtml(me.mobile || "")}" />
          </label>
          ${renderSharedMemberFields(me)}
        </div>
      `;
    } else if (role === "trainer") {
      roleFields = `
        <div class="form-grid">
          ${emailFieldHtml}
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
          ${emailFieldHtml}
          <label>Mobile
            <input name="mobile" maxlength="10" value="${escapeHtml(context.profile.mobile || "")}" />
          </label>
        </div>
      `;
    }

    const emailDisplay = isSyntheticEmail ? "Phone Authentication (No Email)" : emailVal;

    return `
      ${pageHeader("My Profile")}
      <div class="stack" style="max-width: 800px; margin: 0 auto; width: 100%; gap: 20px;">
        <!-- View Mode Panel -->
        <div id="profile-view-section" class="panel stack" style="gap: 20px;">
          <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 20px;">
            <div id="view-avatar-trigger" style="position: relative; width: 84px; height: 84px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primary); display: flex; align-items: center; justify-content: center; background: var(--bg-light); flex-shrink: 0; cursor: pointer; transition: transform 0.2s;" title="Click to change profile picture / avatar">
              <img src="${escapeHtml(getAvatarUrl(selectedAvatar))}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.textContent='${escapeHtml(initials(context.profile.name))}';" />
              <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: #fff;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                <span class="material-symbols-outlined" style="font-size: 20px;">photo_camera</span>
                <span style="font-size: 0.62rem; font-weight: 700; letter-spacing: 0.05em; margin-top: 2px;">CHANGE</span>
              </div>
            </div>
            <div class="stack" style="gap: 4px; flex: 1;">
              <h2 style="margin: 0; font-size: 1.5rem; word-break: break-all; overflow-wrap: break-word;">${escapeHtml(context.profile.name)}</h2>
              <span class="badge" style="align-self: flex-start; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">${context.profile.role}</span>
            </div>
            <button id="start-edit-btn" class="ghost-button" type="button" style="display: flex; align-items: center; gap: 6px;">
              <span class="material-symbols-outlined" style="font-size: 1.25rem;">edit</span>
              Edit Profile
            </button>
          </div>
          
          <div class="form-grid" style="margin-top: 10px;">
            <div><strong>Email</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.9rem; word-break: break-all; overflow-wrap: break-word; font-style: ${isSyntheticEmail ? 'italic' : 'normal'};">${escapeHtml(emailDisplay)}</p></div>
            <div><strong>Mobile</strong><p style="margin: 4px 0 0 0; color: var(--text-muted); word-break: break-all; overflow-wrap: break-word;">${escapeHtml(role === "owner" ? context.profile.mobile : (role === "member" ? me.mobile : tr.mobile)) || "--"}</p></div>
            ${roleDetailsView}
          </div>
        </div>

        <!-- Edit Mode Panel (Hidden by default) -->
        <form id="profile-edit-form" class="panel stack" style="gap: 20px; display: none;">
          <div class="panel-heading"><h2>Edit Profile Details</h2></div>
          
          <!-- Avatar Section -->
          <div class="stack" style="gap: 16px; border-bottom: 1px solid var(--line); padding-bottom: 20px; margin-bottom: 10px;">
            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
              <div id="avatar-preview-container" style="width: 84px; height: 84px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primary); display: flex; align-items: center; justify-content: center; background: var(--bg-light); box-shadow: var(--shadow-md); flex-shrink: 0;"></div>
              <div class="stack" style="gap: 4px; flex: 1; min-width: 220px;">
                <h3 style="margin: 0; font-size: 1.15rem;">Profile Avatar & Photo</h3>
                <span class="panel-hint">Upload your photo or customize an avatar.</span>
                <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                  <label class="ghost-button compact" style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">upload</span> Upload Photo
                    <input type="file" id="photo-file-input" accept="image/*" style="display: none;" />
                  </label>
                  <button type="button" class="ghost-button compact" id="reset-emoji-avatar-btn" style="display: inline-flex; align-items: center; gap: 4px;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">face</span> Design Emoji
                  </button>
                </div>
              </div>
            </div>

            <!-- Quick Presets -->
            <div>
              <label style="margin-bottom: 6px; display: block; font-weight: 600; font-size: 0.85rem; color: var(--text);">Preset Cartoon Avatars</label>
              <div style="display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px; scrollbar-width: none;">
                ${CARTOON_AVATARS.map((svg, idx) => `
                  <button type="button" class="preset-avatar-btn" data-preset-index="${idx}" style="border: 2px solid transparent; background: transparent; padding: 2px; cursor: pointer; border-radius: 50%; width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: border-color 0.15s;" title="Avatar ${idx + 1}">
                    <img src="${escapeHtml(svg)}" style="width: 100%; height: 100%; border-radius: 50%;" />
                  </button>
                `).join("")}
              </div>
            </div>
            
            <div id="emoji-creator-panel" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
              <div class="stack" style="gap: 12px;">
                <label>Custom Emoji (Type or paste *any* emoji)
                  <input id="custom-emoji-input" maxlength="2" placeholder="Type or paste any emoji" style="width: 100%; margin-top: 6px;" value="${escapeHtml(currentEmoji)}" />
                </label>
                <div>
                  <label style="margin-bottom: 6px; display: block; font-weight: 500;">Quick Emojis</label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 6px; max-height: 100px; overflow-y: auto; padding: 6px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-light, rgba(255,255,255,0.02));">
                    ${EMOJIS.map(emoji => `
                      <button type="button" class="emoji-option-btn" data-emoji="${escapeHtml(emoji)}" style="font-size: 1.5rem; border: none; background: transparent; padding: 2px; cursor: pointer; border-radius: var(--r-sm); transition: background 0.15s; display: flex; align-items: center; justify-content: center;">${emoji}</button>
                    `).join("")}
                  </div>
                </div>
              </div>
              
              <div>
                <label style="margin-bottom: 6px; display: block; font-weight: 500;">Background Color / Gradient</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(32px, 1fr)); gap: 8px; max-height: 154px; overflow-y: auto; padding: 6px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-light, rgba(255,255,255,0.02));">
                  ${BACKGROUNDS.map(([name, value]) => {
                    const isGradient = value.includes(",");
                    let styleBg = value;
                    if (isGradient) {
                      styleBg = `linear-gradient(135deg, ${value.split(",")[0]}, ${value.split(",")[1]})`;
                    }
                    const isSelected = currentBg === value;
                    return `
                      <div class="color-option-wrapper" data-color-val="${escapeHtml(value)}" title="${escapeHtml(name)}" style="cursor: pointer; border-radius: 50%; width: 32px; height: 32px; border: 3px solid ${isSelected ? "var(--primary)" : "transparent"}; background: ${styleBg}; transition: border-color 0.2s; box-shadow: var(--shadow-sm); flex-shrink: 0;"></div>
                    `;
                  }).join("")}
                </div>
              </div>
            </div>
          </div>

          <label style="margin-bottom: 10px; display: block; width: 100%;">Your Name
            <input name="name" value="${escapeHtml(context.profile.name)}" required style="width: 100%; margin-top: 6px;" />
          </label>

          ${roleFields}
          
          <div class="button-row" style="margin-top: 15px; display: flex; gap: 10px;">
            <button id="cancel-edit-btn" class="ghost-button" type="button">Cancel</button>
            <button class="primary-button" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    `;
  },

  bind(root, context) {
    const viewSection = root.querySelector("#profile-view-section");
    const editForm = root.querySelector("#profile-edit-form");
    const startEditBtn = root.querySelector("#start-edit-btn");
    const cancelEditBtn = root.querySelector("#cancel-edit-btn");

    if (!editForm) return;

    const previewContainer = root.querySelector("#avatar-preview-container");
    const emojiInput = root.querySelector("#custom-emoji-input");
    const photoInput = root.querySelector("#photo-file-input");
    const viewAvatarTrigger = root.querySelector("#view-avatar-trigger");
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
      const url = getAvatarUrl(selectedAvatar);
      previewContainer.innerHTML = `<img src="${escapeHtml(url)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.textContent='${escapeHtml(initials(context.profile.name))}';" />`;
    }

    // Direct click on avatar in view mode triggers edit mode
    viewAvatarTrigger?.addEventListener("click", () => {
      startEditBtn?.click();
    });

    // Toggle Edit Mode
    startEditBtn?.addEventListener("click", () => {
      viewSection.style.display = "none";
      editForm.style.display = "block";
      renderPreview();
    });

    cancelEditBtn?.addEventListener("click", () => {
      editForm.style.display = "none";
      viewSection.style.display = "block";
    });

    // Handle Photo File Upload
    photoInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        context.toast("Please select an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (re) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 256;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          selectedAvatar = canvas.toDataURL("image/jpeg", 0.85);
          renderPreview();
          context.toast("Photo loaded. Click 'Save Changes' to apply.");
        };
        img.src = re.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Listen to quick cartoon presets click
    root.querySelectorAll(".preset-avatar-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        root.querySelectorAll(".preset-avatar-btn").forEach((b) => (b.style.borderColor = "transparent"));
        btn.style.borderColor = "var(--primary)";
        const idx = Number(btn.dataset.presetIndex);
        if (CARTOON_AVATARS[idx]) {
          selectedAvatar = CARTOON_AVATARS[idx];
          renderPreview();
        }
      });
    });

    // Switch/Reset to Emoji Avatar Creator
    root.querySelector("#reset-emoji-avatar-btn")?.addEventListener("click", () => {
      selectedAvatar = `emoji:${currentEmoji}:${currentBg}`;
      renderPreview();
      root.querySelector("#emoji-creator-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Listen to custom emoji keyboard inputs
    emojiInput?.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (val) {
        currentEmoji = val;
        selectedAvatar = `emoji:${currentEmoji}:${currentBg}`;
        renderPreview();
      }
    });

    // Listen to quick emojis click
    root.querySelectorAll(".emoji-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentEmoji = btn.dataset.emoji;
        if (emojiInput) emojiInput.value = currentEmoji;
        selectedAvatar = `emoji:${currentEmoji}:${currentBg}`;
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
        selectedAvatar = `emoji:${currentEmoji}:${currentBg}`;
        renderPreview();
      });
    });

    bindSharedBmiEvents(editForm);

    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = editForm.querySelector("[type='submit']");
      const name = editForm.querySelector("[name='name']").value.trim();
      if (!name) return;

      submitBtn.disabled = true;
      try {
        const mobileVal = editForm.querySelector("[name='mobile']")?.value.trim() || "";
        await context.services.auth.updateProfile({
          name,
          avatarUrl: selectedAvatar,
          ...(role === "owner" ? { mobile: mobileVal } : {})
        });
        if (context.profile) {
          context.profile.name = name;
          context.profile.avatarUrl = selectedAvatar;
          if (role === "owner") context.profile.mobile = mobileVal;
        }

        if (role === "member" && context.myMember) {
          const updatedMember = {
            ...context.myMember,
            fullName: name,
            avatarUrl: selectedAvatar,
            mobile: mobileVal,
            whatsappNumber: editForm.querySelector("[name='whatsappNumber']")?.value.trim() || "",
            gender: editForm.querySelector("[name='gender']")?.value || "Not specified",
            dateOfBirth: editForm.querySelector("[name='dateOfBirth']")?.value || "",
            address: editForm.querySelector("[name='address']")?.value.trim() || "",
            emergencyName: editForm.querySelector("[name='emergencyName']")?.value.trim() || "",
            emergencyRelationship: editForm.querySelector("[name='emergencyRelationship']")?.value || "",
            emergencyPhone: editForm.querySelector("[name='emergencyPhone']")?.value.trim() || "",
            gymGoal: editForm.querySelector("[name='gymGoal']")?.value || "",
            bloodGroup: editForm.querySelector("[name='bloodGroup']")?.value || "",
            occupation: editForm.querySelector("[name='occupation']")?.value.trim() || "",
            activityLevel: editForm.querySelector("[name='activityLevel']")?.value || "",
            fitnessExperience: editForm.querySelector("[name='fitnessExperience']")?.value || "",
            medicalConditions: editForm.querySelector("[name='medicalConditions']")?.value.trim() || "",
            currentMedications: editForm.querySelector("[name='currentMedications']")?.value.trim() || "",
            allergies: editForm.querySelector("[name='allergies']")?.value.trim() || "",
            physicalLimitations: editForm.querySelector("[name='physicalLimitations']")?.value.trim() || "",
            initWeight: editForm.querySelector("[name='initWeight']")?.value ? parseFloat(editForm.querySelector("[name='initWeight']").value) : "",
            initHeight: editForm.querySelector("[name='initHeight']")?.value ? parseFloat(editForm.querySelector("[name='initHeight']").value) : "",
            initBodyFat: editForm.querySelector("[name='initBodyFat']")?.value ? parseFloat(editForm.querySelector("[name='initBodyFat']").value) : "",
            initWaist: editForm.querySelector("[name='initWaist']")?.value ? parseFloat(editForm.querySelector("[name='initWaist']").value) : "",
            initChest: editForm.querySelector("[name='initChest']")?.value ? parseFloat(editForm.querySelector("[name='initChest']").value) : "",
            initHip: editForm.querySelector("[name='initHip']")?.value ? parseFloat(editForm.querySelector("[name='initHip']").value) : "",
            initBicep: editForm.querySelector("[name='initBicep']")?.value ? parseFloat(editForm.querySelector("[name='initBicep']").value) : "",
            initThigh: editForm.querySelector("[name='initThigh']")?.value ? parseFloat(editForm.querySelector("[name='initThigh']").value) : ""
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
            specialization: editForm.querySelector("[name='specialization']")?.value.trim() || "",
            experience: editForm.querySelector("[name='experience']")?.value.trim() || "",
            certifications: editForm.querySelector("[name='certifications']")?.value.trim() || ""
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
