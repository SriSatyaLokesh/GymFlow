import { downloadJson, escapeHtml, formData, pageHeader, today } from "./utils.js";

export const settingsModule = {
  render({ settings, services }) {
    return `
      ${pageHeader("Settings")}
      <div class="work-grid">
        <form class="panel stack" id="settings-form">
          <div class="panel-heading"><h2>Gym Profile</h2><span>${services.mode === "firebase" ? "Live" : "Demo"}</span></div>
          <div class="form-grid">
            <label>Gym name<input name="gymName" value="${escapeHtml(settings?.gymName || "")}" required /></label>
            <label>Owner name<input name="ownerName" value="${escapeHtml(settings?.ownerName || "")}" /></label>
            <label>Contact email<input name="contactEmail" type="email" value="${escapeHtml(settings?.contactEmail || "")}" /></label>
            <label>Phone<input name="phone" value="${escapeHtml(settings?.phone || "")}" /></label>
            <label>Currency
              <select name="currency">
                ${["INR", "USD", "EUR", "GBP"].map((currency) => `<option ${settings?.currency === currency ? "selected" : ""}>${currency}</option>`).join("")}
              </select>
            </label>
            <label class="wide">Address<textarea name="address" rows="3">${escapeHtml(settings?.address || "")}</textarea></label>
          </div>
          <button class="primary-button" type="submit">Save settings</button>
        </form>
        <section class="panel stack">
          <div class="panel-heading"><h2>Gym Code</h2></div>
          <p class="panel-hint">Share this code so members can register and join your gym.</p>
          ${
            settings?.gymCode
              ? `<div class="code-row">
                  <code class="gym-code">${escapeHtml(settings.gymCode)}</code>
                  <button class="ghost-button" data-action="copy-code" type="button"><span class="material-symbols-outlined">content_copy</span>Copy</button>
                </div>`
              : `<p class="panel-hint">Your gym code will appear here after your next save.</p>`
          }
        </section>
        <section class="panel stack">
          <div class="panel-heading"><h2>Membership Pause Limits</h2></div>
          <p class="panel-hint">Global defaults applied when an owner pauses a member's membership.</p>
          <form id="pause-limits-form">
            <div class="form-grid">
              <label>Max pauses per year
                <input name="maxPausesPerYear" type="number" min="1" max="12"
                       value="${escapeHtml(String(settings?.maxPausesPerYear ?? 2))}" required />
              </label>
              <label>Max pause days (per pause)
                <input name="maxPauseDays" type="number" min="1" max="365"
                       value="${escapeHtml(String(settings?.maxPauseDays ?? 30))}" required />
              </label>
            </div>
            <button class="primary-button" type="submit">Save pause limits</button>
          </form>
        </section>
        <section class="panel stack">
          <div class="panel-heading"><h2>Backup &amp; Restore</h2></div>
          <p class="panel-hint">Download a full copy of your gym data, or restore from a previous export.</p>
          <div class="button-row">
            <button class="ghost-button" data-action="export" type="button">Export data</button>
            <label class="file-button">Import JSON<input type="file" accept="application/json" data-action="import" /></label>
          </div>
        </section>
        <section class="panel stack">
          <div class="panel-heading"><h2>Developer / Seeding Tools</h2></div>
          <p class="panel-hint">Seed your workspace with 50 realistic Indian members, 3 plans, 2 trainers, 3 workout schedules, payments, progress history, and check-in logs to show a complete working demo.</p>
          <div class="button-row">
            <button class="ghost-button" data-action="seed-demo-data" type="button">Seed 50 Demo Users & Workouts</button>
          </div>
          <div class="dup-warn hidden" data-seed-status style="font-size: 0.85rem; padding: 6px 12px; border-radius: var(--r-sm); background: rgba(204,255,0,0.1); border: 1px solid var(--line); line-height: 1.45;"></div>
        </section>
      </div>
    `;
  },
  bind(root, context) {
    const form = root.querySelector("#settings-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formData(form);
      // The gym name shows in the sidebar, so only a name change needs a full
      // shell re-render; everything else can use the lightweight scoped update.
      const nameChanged = (payload.gymName || "") !== (context.settings?.gymName || "");
      await context.services.data.saveSettings(payload);
      context.toast("Settings saved.");
      if (nameChanged) {
        await context.refresh();
      } else {
        await context.refreshView();
      }
    });

    root.querySelector("[data-action='copy-code']")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(context.settings?.gymCode || "");
        context.toast("Gym code copied.");
      } catch (error) {
        context.toast("Couldn't copy — select the code manually.");
      }
    });

    root.querySelector("[data-action='export']")?.addEventListener("click", async () => {
      const payload = await context.services.data.exportData();
      downloadJson("gymflow-export.json", payload);
      context.toast("Export ready.");
    });

    root.querySelector("[data-action='import']")?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const payload = JSON.parse(await file.text());
      await context.services.data.importData(payload);
      context.toast("Import complete.");
      await context.refresh();
    });

    const pauseLimitsForm = root.querySelector("#pause-limits-form");
    pauseLimitsForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formData(pauseLimitsForm);
      payload.maxPausesPerYear = Number(payload.maxPausesPerYear);
      payload.maxPauseDays     = Number(payload.maxPauseDays);
      await context.services.data.saveSettings(payload);
      context.toast("Pause limits saved.");
      await context.refreshView();
    });

    const seedButton = root.querySelector("[data-action='seed-demo-data']");
    const seedStatus = root.querySelector("[data-seed-status]");
    seedButton?.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to seed 50 demo members, workouts, and payment history? This is designed for testing and demo purposes.")) return;
      
      seedButton.disabled = true;
      seedStatus.classList.remove("hidden");
      seedStatus.textContent = "Starting seeding process...";
      
      try {
        await seedDemoData(context, (msg) => {
          seedStatus.textContent = msg;
        });
        context.toast("Seeding completed successfully.");
        seedStatus.textContent = "Successfully seeded 50 members, 3 plans, 2 trainers, 3 workout templates, payments, assignments, progress metrics, and attendance records!";
      } catch (error) {
        console.error(error);
        context.toast("Failed to seed demo data.");
        seedStatus.textContent = `Error: ${error.message}`;
        seedButton.disabled = false;
      }
    });
  }
};

const FIRST_NAMES = ["Amit", "Priya", "Rohan", "Sneha", "Vikram", "Anjali", "Karan", "Deepika", "Rajesh", "Kiran", "Sanjay", "Neelam", "Vijay", "Aisha", "Aditya", "Meera", "Rahul", "Pooja", "Arjun", "Kriti", "Manish", "Divya", "Suresh", "Ritu", "Alok", "Kavita", "Abhishek", "Shalini", "Sunil", "Preeti", "Harish", "Jyoti", "Kartik", "Tanvi", "Pranav", "Shruti", "Gaurav", "Nisha", "Sameer", "Swati", "Varun", "Rhea", "Akash", "Payal", "Yash", "Ishita", "Siddharth", "Aanchal", "Mayank", "Nidhi"];
const LAST_NAMES = ["Patel", "Sharma", "Gupta", "Reddy", "Malhotra", "Verma", "Joshi", "Singh", "Nair", "Rao", "Kumar", "Choudhury", "Mehta", "Bose", "Sen", "Das", "Mishra", "Pandey", "Iyer", "Pillai", "Deshmukh", "Kulkarni", "Jadhav", "Saxena", "Trivedi", "Shah", "Gole", "Somani", "Kapoor", "Khanna", "Bajaj", "Goel", "Aggarwal", "Chawla", "Sareen", "Gill", "Sandhu", "Dhillon", "Sidhu", "Vance", "Roy", "Chatterjee", "Banerjee", "Dutta", "Mukherjee", "Paul", "Sarkar", "Gaur", "Yadav", "Tripathi"];

async function seedDemoData(context, onProgress) {
  const now = new Date();
  const gymId = context.settings?.gymId;
  if (!gymId) throw new Error("Gym settings not loaded yet.");

  // 1. Seed Plans if not exists
  const existingPlans = context.data.membership_plans || [];
  let plans = [];
  if (existingPlans.length === 0) {
    const plansData = [
      { planName: "Monthly Basic", durationDays: 30, price: 1500, description: "Standard gym floor access" },
      { planName: "Quarterly Pro", durationDays: 90, price: 3999, description: "Three months access with fitness review" },
      { planName: "Personal Training Elite", durationDays: 30, price: 7000, description: "One-on-one customized personal training" }
    ];
    for (const p of plansData) {
      const saved = await context.services.data.save("membership_plans", p);
      plans.push(saved);
      context.applyChange("membership_plans", saved);
    }
  } else {
    plans = existingPlans;
  }

  // 2. Seed Trainers if not exists
  const existingTrainers = context.data.trainers || [];
  let trainers = [];
  if (existingTrainers.length === 0) {
    const trainersData = [
      { name: "Rahul Mehta", mobile: "+91 90000 10001", email: "rahul@example.com", specialization: "Strength & Conditioning", experience: "5 years", status: "Active" },
      { name: "Anika Rao", mobile: "+91 90000 10002", email: "anika@example.com", specialization: "Weight Management & Yoga", experience: "4 years", status: "Active" }
    ];
    for (const t of trainersData) {
      const saved = await context.services.data.save("trainers", t);
      trainers.push(saved);
      context.applyChange("trainers", saved);
    }
  } else {
    trainers = existingTrainers;
  }

  // 3. Seed Workout Templates if not exists
  const existingTemplates = context.data.workout_templates || [];
  let templates = [];
  if (existingTemplates.length === 0) {
    const templatesData = [
      {
        name: "Beginner Full Body",
        goal: "General Fitness",
        category: "Beginner",
        difficulty: "Beginner",
        equipment: "Mixed",
        durationMinutes: 45,
        visibility: "basic",
        status: "active",
        exercisesStructured: [
          { name: "Goblet Squat", sets: "3", reps: "12", weight: "10kg", rest: "60s", notes: "Focus on depth" },
          { name: "Pushups", sets: "3", reps: "10", weight: "Bodyweight", rest: "60s", notes: "Maintain flat back" },
          { name: "Lat Pulldown", sets: "3", reps: "12", weight: "30kg", rest: "60s", notes: "Squeeze shoulder blades" },
          { name: "Dumbbell Shoulder Press", sets: "3", reps: "12", weight: "7.5kg", rest: "60s", notes: "Control the descent" },
          { name: "Plank", sets: "3", reps: "45s", weight: "Bodyweight", rest: "45s", notes: "Keep core tight" }
        ]
      },
      {
        name: "Upper Body Hypertrophy",
        goal: "Muscle Gain",
        category: "Strength",
        difficulty: "Intermediate",
        equipment: "Mixed",
        durationMinutes: 60,
        visibility: "basic",
        status: "active",
        exercisesStructured: [
          { name: "Incline Dumbbell Bench Press", sets: "4", reps: "10", weight: "17.5kg", rest: "90s", notes: "45 degree incline" },
          { name: "One-Arm Dumbbell Row", sets: "4", reps: "10", weight: "20kg", rest: "90s", notes: "Keep elbow close to body" },
          { name: "Barbell Overhead Press", sets: "3", reps: "8", weight: "35kg", rest: "90s", notes: "Strict press, no leg drive" },
          { name: "Cable Lateral Raise", sets: "3", reps: "15", weight: "5kg", rest: "60s", notes: "Focus on side delts" },
          { name: "Incline Dumbbell Curl", sets: "3", reps: "12", weight: "10kg", rest: "60s", notes: "Full stretch at bottom" },
          { name: "Triceps Pushdown", sets: "3", reps: "12", weight: "15kg", rest: "60s", notes: "Keep elbows pinned to side" }
        ]
      },
      {
        name: "Cardio Conditioning",
        goal: "Weight Loss",
        category: "Cardio",
        difficulty: "Intermediate",
        equipment: "Bodyweight",
        durationMinutes: 30,
        visibility: "basic",
        status: "active",
        exercisesStructured: [
          { name: "Jumping Jacks", sets: "4", reps: "45s", weight: "Bodyweight", rest: "15s", notes: "High tempo" },
          { name: "Burpees", sets: "4", reps: "30s", weight: "Bodyweight", rest: "30s", notes: "Add pushup if possible" },
          { name: "Mountain Climbers", sets: "4", reps: "45s", weight: "Bodyweight", rest: "15s", notes: "Keep hips low" },
          { name: "Kettlebell Swing", sets: "4", reps: "20", weight: "16kg", rest: "30s", notes: "Hinge at hips" }
        ]
      }
    ];
    for (const t of templatesData) {
      const saved = await context.services.data.save("workout_templates", t);
      templates.push(saved);
      context.applyChange("workout_templates", saved);
    }
  } else {
    templates = existingTemplates;
  }

  // 4. Seed 50 Members
  for (let i = 0; i < 50; i++) {
    onProgress(`Seeding member ${i + 1}/50...`);
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const mobile = `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const trainer = Math.random() > 0.4 ? trainers[Math.random() > 0.5 ? 0 : 1] : null;
    
    // Join date between 90 and 5 days ago
    const joinDaysAgo = Math.floor(5 + Math.random() * 85);
    const joinDate = new Date(now.getTime() - joinDaysAgo * 86400000).toISOString().slice(0, 10);
    
    // Plan end date based on duration
    const startDate = joinDate;
    const endDate = new Date(new Date(startDate).getTime() + plan.durationDays * 86400000).toISOString().slice(0, 10);
    const endDaysDiff = (new Date(endDate).getTime() - now.getTime()) / 86400000;
    const computedStatus = endDaysDiff < 0 ? "Expired" : "Active";

    const memberData = {
      fullName: name,
      mobile,
      email,
      whatsappNumber: mobile,
      gender: Math.random() > 0.5 ? "Male" : "Female",
      joinDate,
      planId: plan.id,
      assignedTrainer: trainer ? trainer.id : "",
      startDate,
      endDate,
      status: computedStatus,
      address: `${Math.floor(10 + Math.random() * 90)}, Park Street, Near Metro, City Center`,
      initWeight: (60 + Math.random() * 30).toFixed(1),
      initHeight: (155 + Math.random() * 30).toFixed(1),
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=adventurer-seed-${Math.floor(1 + Math.random() * 30)}`
    };

    const savedMember = await context.services.data.save("members", memberData);
    context.applyChange("members", savedMember);

    // 5. Seed Progress Record
    const hMetric = parseFloat(memberData.initHeight) / 100;
    const bmiVal = (parseFloat(memberData.initWeight) / (hMetric * hMetric)).toFixed(1);
    const progressData = {
      memberId: savedMember.id,
      date: startDate,
      weight: memberData.initWeight,
      bmi: bmiVal,
      notes: "Admission check-in measurement."
    };
    const savedProgress = await context.services.data.save("progress_records", progressData);
    context.applyChange("progress_records", savedProgress);

    // 6. Seed Payment
    const paymentData = {
      memberId: savedMember.id,
      amount: plan.price,
      date: startDate,
      method: ["UPI", "Cash", "Card"][Math.floor(Math.random() * 3)],
      planId: plan.id,
      collectedBy: context.profile?.name || "Owner",
      status: "Paid",
      receiptNumber: `REC-${1000 + i}`
    };
    const savedPayment = await context.services.data.save("payments", paymentData);
    context.applyChange("payments", savedPayment);

    // 7. Seed Workouts Assignments
    const template = templates[Math.floor(Math.random() * templates.length)];
    const assignmentData = {
      memberId: savedMember.id,
      templateId: template.id,
      assignedAt: startDate
    };
    const savedAssignment = await context.services.data.save("workout_assignments", assignmentData);
    context.applyChange("workout_assignments", savedAssignment);

    // 8. Seed Attendance (3-4 check-ins for active members)
    if (computedStatus === "Active") {
      const checkinCount = Math.floor(3 + Math.random() * 4);
      for (let c = 0; c < checkinCount; c++) {
        const checkinDaysAgo = Math.floor(1 + Math.random() * Math.min(joinDaysAgo, 30));
        const checkinDate = new Date(now.getTime() - checkinDaysAgo * 86400000).toISOString().slice(0, 10);
        const attendanceData = {
          memberId: savedMember.id,
          date: checkinDate,
          time: `0${6 + Math.floor(Math.random() * 4)}:${Math.floor(10 + Math.random() * 50)}`,
          trainerId: trainer ? trainer.id : ""
        };
        const savedAttendance = await context.services.data.save("attendance", attendanceData);
        context.applyChange("attendance", savedAttendance);
      }
    }
  }

  onProgress("Seeding complete! Refreshing database views...");
  await context.refresh();
}
