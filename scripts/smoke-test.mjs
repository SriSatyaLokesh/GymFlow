import { execSync } from "child_process";
import { dashboardModule } from "../modules/dashboard.js";
import { membersModule } from "../modules/members.js";
import { membershipsModule } from "../modules/memberships.js";
import { paymentsModule } from "../modules/payments.js";
import { renewalsModule } from "../modules/renewals.js";
import { remindersModule } from "../modules/reminders.js";
import { trainersModule } from "../modules/trainers.js";
import { attendanceModule } from "../modules/attendance.js";
import { workoutsModule } from "../modules/workouts.js";
import { progressModule } from "../modules/progress.js";
import { reportsModule } from "../modules/reports.js";
import { settingsModule } from "../modules/settings.js";
import { myMembershipModule } from "../modules/my-membership.js";
import { myPaymentsModule } from "../modules/my-payments.js";
import { trainerCheckinModule } from "../modules/trainer-checkin.js";
import { trainerMembersModule } from "../modules/trainer-members.js";
import { myWorkoutModule } from "../modules/my-workout.js";

function makeData() {
  return {
    members: [],
    trainers: [],
    membership_plans: [],
    payments: [],
    attendance: [],
    trainer_attendance: [],
    workout_templates: [],
    workout_assignments: [],
    workout_sessions: [],
    progress_records: [],
    reminders: [],
    membership_pauses: []
  };
}

const ownerContext = {
  profile: { name: "Owner", role: "owner", uid: "owner-uid" },
  settings: { gymName: "Smoke Gym", currency: "INR", gymCode: "SMOK-1234" },
  services: { mode: "local" },
  data: makeData(),
  myMember: null,
  myMemberId: null
};
ownerContext.data.workout_templates = [
  {
    id: "trainer-basic",
    name: "Trainer Basic Module",
    goal: "Mobility",
    category: "Mobility",
    difficulty: "Beginner",
    exercisesStructured: [{ name: "Cat Cow", sets: "2", reps: "10", rest: "30 sec", notes: "Slow control" }],
    visibility: "basic",
    status: "active",
    createdByRole: "trainer",
    createdByUid: "trainer-uid",
    trainerId: "t1"
  }
];

// A member with no roster doc (membership-being-set-up path) and with one.
const memberContext = {
  profile: { name: "Member", role: "member", uid: "member-uid" },
  settings: { gymName: "Smoke Gym", currency: "INR" },
  services: { mode: "local" },
  data: makeData(),
  myMember: { id: "m1", uid: "member-uid", fullName: "Member", status: "Active", endDate: "2099-01-01" },
  myMemberId: "m1"
};
memberContext.data.members = [memberContext.myMember];
memberContext.data.workout_templates = [
  {
    id: "basic-1",
    name: "Basic Strength",
    goal: "Strength",
    category: "Strength",
    difficulty: "Beginner",
    equipment: "Bodyweight",
    durationMinutes: 30,
    exercises: "Squat - 3 x 10",
    exercisesStructured: [{ name: "Squat", sets: "3", reps: "10", weight: "Bodyweight", rest: "60 sec" }],
    notes: "Move with control.",
    visibility: "basic",
    status: "active"
  }
];

const ownerModules = [
  dashboardModule, membersModule, membershipsModule, paymentsModule, renewalsModule,
  remindersModule, trainersModule, attendanceModule, workoutsModule, progressModule,
  reportsModule, settingsModule
];

const memberModules = [
  dashboardModule, attendanceModule, progressModule, myMembershipModule, myPaymentsModule, myWorkoutModule
];

const trainerContext = {
  profile: { name: "Trainer", role: "trainer", uid: "trainer-uid" },
  settings: { gymName: "Smoke Gym", currency: "INR" },
  services: { mode: "local" },
  data: makeData(),
  myTrainer: { id: "t1", uid: "trainer-uid", name: "Trainer", status: "Active" },
  myTrainerId: "t1"
};
trainerContext.data.trainers = [trainerContext.myTrainer];
trainerContext.data.members = [{ id: "tm1", uid: "trainer-client-uid", fullName: "Trainer Client", assignedTrainer: "t1", status: "Active", endDate: "2099-01-01" }];
trainerContext.data.workout_templates = [
  {
    id: "trainer-private",
    name: "Trainer Private Module",
    goal: "Muscle Gain",
    category: "Strength",
    difficulty: "Intermediate",
    equipment: "Dumbbells",
    durationMinutes: 45,
    exercises: "Bench press - 3 x 10",
    exercisesStructured: [{ name: "Bench press", sets: "3", reps: "10", weight: "60 kg", rest: "90 sec" }],
    visibility: "private",
    status: "active",
    createdByRole: "trainer",
    createdByUid: "trainer-uid",
    trainerId: "t1"
  },
  {
    id: "other-trainer-private",
    name: "Other Trainer Private Module",
    goal: "Strength",
    category: "Strength",
    difficulty: "Advanced",
    exercises: "Deadlift - 3 x 5",
    visibility: "private",
    status: "active",
    createdByRole: "trainer",
    createdByUid: "other-trainer-uid",
    trainerId: "t2"
  },
  {
    id: "basic-1",
    name: "Basic Strength",
    goal: "Strength",
    category: "Strength",
    difficulty: "Beginner",
    durationMinutes: 30,
    exercises: "Squat - 3 x 10",
    exercisesStructured: [{ name: "Squat", sets: "3", reps: "10", rest: "60 sec" }],
    visibility: "basic",
    status: "active"
  }
];

const trainerModules = [dashboardModule, trainerCheckinModule, trainerMembersModule, workoutsModule];

function checkRender(module, context, label) {
  const html = module.render(context);
  if (!html || typeof html !== "string") {
    throw new Error(`Module did not return HTML (${label}).`);
  }
}

for (const module of ownerModules) checkRender(module, ownerContext, "owner");
for (const module of memberModules) checkRender(module, memberContext, "member");
for (const module of trainerModules) checkRender(module, trainerContext, "trainer");

const trainerMembersHtml = trainerMembersModule.render(trainerContext);
if (!trainerMembersHtml.includes("My Clients") || trainerMembersHtml.includes("My Members")) {
  throw new Error("Trainer clients screen did not use the updated client wording.");
}
if (!trainerMembersHtml.includes("Trainer Private Module") || trainerMembersHtml.includes("Other Trainer Private Module")) {
  throw new Error("Trainer assignment module filtering is incorrect.");
}
if (!trainerMembersHtml.includes("Assign Module to Clients") || !trainerMembersHtml.includes("data-card-preview")) {
  throw new Error("Trainer clients screen did not render bulk assignment and preview UI.");
}

const memberWorkoutHtml = myWorkoutModule.render(memberContext);
if (!memberWorkoutHtml.includes("Basic Workouts") || !memberWorkoutHtml.includes("Basic Strength") || !memberWorkoutHtml.includes("data-basic-filter")) {
  throw new Error("Member workout screen did not render Basic workout modules.");
}

const trainerWorkoutsHtml = workoutsModule.render(trainerContext);
if (
  !trainerWorkoutsHtml.includes("Difficulty") ||
  !trainerWorkoutsHtml.includes("Duration minutes") ||
  !trainerWorkoutsHtml.includes("Structured exercises") ||
  !trainerWorkoutsHtml.includes("Bench press") ||
  !trainerWorkoutsHtml.includes("data-clone-template") ||
  trainerWorkoutsHtml.includes("Other Trainer Private Module")
) {
  throw new Error("Trainer workouts screen did not render metadata filters, clone action, or private filtering correctly.");
}

const ownerWorkoutsHtml = workoutsModule.render(ownerContext);
if (!ownerWorkoutsHtml.includes("Trainer Basic Module") || ownerWorkoutsHtml.includes("data-approve-basic") || !ownerWorkoutsHtml.includes("Cat Cow")) {
  throw new Error("Owner workouts screen did not render direct Basic modules and structured exercises correctly.");
}

// No-roster-doc yet (status setup path) for both member and trainer.
const pendingMember = { ...memberContext, myMember: null, myMemberId: null, data: makeData() };
for (const module of memberModules) checkRender(module, pendingMember, "member-pending");

const pendingTrainer = { ...trainerContext, myTrainer: null, myTrainerId: null, data: makeData() };
for (const module of trainerModules) checkRender(module, pendingTrainer, "trainer-pending");

// ===================================================================
// ENHANCED COMPLEX UX & MOBILE EDGE CASE VERIFICATIONS
// ===================================================================

console.log("Starting enhanced complex UX & mobile edge case verifications...");

// 1. Mobile responsive table data labels check
console.info("-> Validating mobile responsive table data-label attributes...");
const membersHtml = membersModule.render({
  data: {
    members: [{ id: "m1", fullName: "Test Member", mobile: "1234567890", planId: "p1", endDate: "2026-12-31", status: "Active" }],
    membership_plans: [{ id: "p1", planName: "Basic Plan" }],
    trainers: []
  }
});
if (!membersHtml.includes('data-label="Plan"') || !membersHtml.includes('data-label="Expiry"') || !membersHtml.includes('data-label="Status"')) {
  throw new Error("UX Validation Failed: Members table row is missing mobile responsive data-label attributes.");
}

const paymentsHtml = paymentsModule.render({
  data: {
    payments: [{ id: "pay1", receiptNumber: "REC-001", date: "2026-07-28", method: "Cash", memberId: "m1", amount: 500, status: "Paid", planId: "p1" }],
    members: [{ id: "m1", fullName: "Test Member" }],
    membership_plans: [{ id: "p1", planName: "Basic Plan" }]
  }
});
if (!paymentsHtml.includes('data-label="Receipt"') || !paymentsHtml.includes('data-label="Amount"') || !paymentsHtml.includes('data-label="Status"')) {
  throw new Error("UX Validation Failed: Payments table row is missing mobile responsive data-label attributes.");
}

const attendanceHtml = attendanceModule.render({
  data: {
    attendance: [{ id: "att1", memberId: "m1", date: "2026-07-28", time: "09:00", trainerId: "t1" }],
    members: [{ id: "m1", fullName: "Test Member" }],
    trainers: [{ id: "t1", name: "Trainer John" }]
  }
});
if (!attendanceHtml.includes('data-label="Member"') || !attendanceHtml.includes('data-label="Date"') || !attendanceHtml.includes('data-label="Time"')) {
  throw new Error("UX Validation Failed: Attendance table row is missing mobile responsive data-label attributes.");
}

const progressHtml = progressModule.render({
  data: {
    progress_records: [{ id: "prg1", memberId: "m1", date: "2026-07-28", weight: 70, bmi: 22.5, notes: "Feeling strong" }],
    members: [{ id: "m1", fullName: "Test Member" }]
  }
});
if (!progressHtml.includes('data-label="Weight"') || !progressHtml.includes('data-label="BMI"') || !progressHtml.includes('data-label="Notes"')) {
  throw new Error("UX Validation Failed: Progress table row is missing mobile responsive data-label attributes.");
}

const renewalsHtml = renewalsModule.render({
  data: {
    members: [{ id: "m1", fullName: "Test Member", mobile: "1234567890", planId: "p1", endDate: "2026-07-28", remaining: -5, computedStatus: "Expired" }],
    membership_plans: [{ id: "p1", planName: "Basic Plan", price: 1000 }]
  }
});
if (!renewalsHtml.includes('data-label="Plan"') || !renewalsHtml.includes('data-label="Expiry"') || !renewalsHtml.includes('data-label="Status"')) {
  throw new Error("UX Validation Failed: Renewals table row is missing mobile responsive data-label attributes.");
}

const remindersHtml = remindersModule.render({
  data: {
    members: [{ id: "m1", fullName: "Test Member", mobile: "1234567890", endDate: "2026-07-28", computedStatus: "Expired" }],
    settings: { whatsappReminderTemplate: "Hello {name}, your plan expires on {date}." }
  }
});
if (!remindersHtml.includes('data-label="Expiry"') || !remindersHtml.includes('data-label="Status"') || !remindersHtml.includes('data-label="Message"')) {
  throw new Error("UX Validation Failed: Reminders table row is missing mobile responsive data-label attributes.");
}

const trainersAssignmentsHtml = trainersModule.render({
  data: {
    workout_assignments: [{ id: "a1", memberId: "m1", trainerId: "t1", templateId: "temp1", assignedAt: "2026-07-28" }],
    members: [{ id: "m1", fullName: "Test Member" }],
    trainers: [{ id: "t1", name: "Trainer John" }],
    workout_templates: [{ id: "temp1", name: "Full Body workout" }]
  }
});
if (!trainersAssignmentsHtml.includes('data-label="Member"') || !trainersAssignmentsHtml.includes('data-label="Template"') || !trainersAssignmentsHtml.includes('data-label="Assigned"')) {
  throw new Error("UX Validation Failed: Trainers workout assignments table row is missing mobile responsive data-label attributes.");
}

// 2. Mobile form usability and constraints validation
console.info("-> Validating form fields constraints and placeholders for mobile usability...");
membersModule.activeView = "add";
const membersFormHtml = membersModule.render({
  data: {
    members: [{ id: "m1", fullName: "Test Member", mobile: "1234567890", planId: "p1", endDate: "2026-12-31", status: "Active" }],
    membership_plans: [{ id: "p1", planName: "Basic Plan" }],
    trainers: []
  }
});
membersModule.activeView = "list"; // reset back

if (!membersFormHtml.includes('maxlength="10"') || !membersFormHtml.includes('name="mobile"') || !membersFormHtml.includes('name="whatsappNumber"')) {
  throw new Error("UX Validation Failed: Form mobile number fields do not enforce maximum length constraint of 10.");
}
if (!membersFormHtml.includes('placeholder="Same as mobile"') || !membersFormHtml.includes('data-bmi-meter')) {
  throw new Error("UX Validation Failed: Member form is missing clear UX placeholders or BMI Meter layout wrapper.");
}

// 3. Member Hevy-Style workout logger checks
console.info("-> Validating workout active logger classes for custom mobile alignment...");
// Mock localStorage globally to simulate an active workout session in Node environment
global.localStorage = {
  getItem(key) {
    if (key === "gymflow.active_workout") {
      return JSON.stringify({
        templateId: "basic-1",
        name: "Active Session",
        startTime: new Date().toISOString(),
        exercises: [{ name: "Squats", sets: [{ done: false, weight: 60, reps: 10, rpe: 8 }] }]
      });
    }
    return null;
  },
  setItem() {},
  removeItem() {}
};
const activeWorkoutHtml = myWorkoutModule.render(memberContext);
delete global.localStorage; // Clean up mock
if (!activeWorkoutHtml.includes("logger-table-head") || !activeWorkoutHtml.includes("logger-set-row")) {
  throw new Error("UX Validation Failed: Member workout logger is missing custom logger-table-head or logger-set-row layout classes.");
}

// 4. Edge-case data rendering checks
console.info("-> Validating edge-case data rendering (missing notes, null values)...");
const edgeCaseContext = {
  data: {
    members: [{ id: "m1", fullName: "Edge Member", mobile: null, email: null, planId: null, endDate: null, status: "Pending" }],
    membership_plans: [],
    trainers: []
  }
};
const edgeCaseMembersHtml = membersModule.render(edgeCaseContext);
if (!edgeCaseMembersHtml.includes("Unassigned") || !edgeCaseMembersHtml.includes("Pending")) {
  throw new Error("UX Validation Failed: Members list did not gracefully handle null/empty fields.");
}

console.log("-> Running gamification unit tests...");
execSync("node scripts/test-gamification.mjs", { stdio: "inherit" });

console.log("Smoke render and enhanced complex UX verification tests completed successfully!");
