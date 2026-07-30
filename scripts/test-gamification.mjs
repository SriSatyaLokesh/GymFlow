import assert from "assert";
import { calculateStreak, awardPointsAndBadges } from "../modules/utils.js";

function relativeDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// -------------------------------------------------------------
// Test calculateStreak
// -------------------------------------------------------------
function testCalculateStreak() {
  console.log("Running calculateStreak tests...");

  // 1. Empty attendance
  assert.strictEqual(calculateStreak([]), 0);

  // 2. Single check-in today
  const todayStr = relativeDate(0);
  assert.strictEqual(calculateStreak([{ date: todayStr }]), 1);

  // 3. Single check-in yesterday
  const yesterdayStr = relativeDate(-1);
  assert.strictEqual(calculateStreak([{ date: yesterdayStr }]), 1);

  // 4. Broken streak (check-in 3 days ago)
  const threeDaysAgoStr = relativeDate(-3);
  assert.strictEqual(calculateStreak([{ date: threeDaysAgoStr }]), 0);

  // 5. Consecutive days streak
  assert.strictEqual(calculateStreak([
    { date: todayStr },
    { date: yesterdayStr },
    { date: relativeDate(-2) }
  ]), 3);

  // 6. Rest day Sunday grace
  let dates = [];
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = checkDate.toISOString().slice(0, 10);
    
    if (dayName === "Sunday") {
      // Skip Sunday check-in to test grace period
      continue;
    }
    dates.push({ date: dateStr });
  }
  const streak = calculateStreak(dates);
  assert.ok(streak > 0, "Streak should not be zero when Sunday is skipped");
  
  console.log("✅ calculateStreak tests passed.");
}

// -------------------------------------------------------------
// Test awardPointsAndBadges
// -------------------------------------------------------------
async function testAwardPointsAndBadges() {
  console.log("Running awardPointsAndBadges tests...");

  let toasts = [];

  // Mock global objects for execution in Node environment
  global.confetti = () => {};
  global.window = { confetti: () => {} };
  global.document = {
    createElement(tag) {
      return {
        style: {},
        querySelectorAll() { return []; },
        appendChild() {},
        remove() {}
      };
    },
    body: {
      appendChild() {}
    },
    addEventListener() {},
    removeEventListener() {}
  };

  const todayStr = relativeDate(0);

  const mockContext = {
    myMember: {
      id: "member-1",
      gymId: "gym-1",
      points: 0,
      unlockedBadges: [],
      personalRecords: {},
      currentStreak: 0
    },
    data: {
      attendance: [{ memberId: "member-1", date: todayStr }],
      workout_logs: [],
      badges: [
        { id: "streak-starter", type: "streak", threshold: 3, name: "Streak Starter", icon: "local_fire_department" },
        { id: "pr-hitter", type: "pr", threshold: 1, name: "Limit Breaker", icon: "fitness_center" }
      ],
      members: []
    },
    services: {
      data: {
        async save(collection, doc) {
          return doc;
        }
      }
    },
    applyChange(collection, savedDoc) {
      mockContext.myMember = savedDoc;
    },
    toast(msg) {
      toasts.push(msg);
    }
  };

  // 1. Check-in points check (+10)
  toasts = [];
  await awardPointsAndBadges(mockContext, "checkin");
  assert.strictEqual(mockContext.myMember.points, 10);
  assert.strictEqual(toasts[0], "Earned +10 Points!");

  // 2. Check-in anti-abuse cap (second check-in today does not award points)
  mockContext.data.attendance.push({ memberId: "member-1", date: todayStr });
  toasts = [];
  await awardPointsAndBadges(mockContext, "checkin");
  assert.strictEqual(mockContext.myMember.points, 10); // Points stay at 10

  // 3. Workout points check (+50)
  mockContext.data.workout_logs.push({ memberId: "member-1", date: todayStr, exercises: [] });
  toasts = [];
  await awardPointsAndBadges(mockContext, "workout", { workout: { exercises: [] } });
  assert.strictEqual(mockContext.myMember.points, 60); // 10 + 50 = 60

  // 4. Workout PR point check (+100 points per PR)
  mockContext.data.workout_logs.push({
    memberId: "member-1",
    date: todayStr,
    exercises: [{ name: "Squat", sets: [{ weight: 100, reps: 5 }] }]
  });
  toasts = [];
  await awardPointsAndBadges(mockContext, "workout", {
    workout: {
      exercises: [{ name: "Squat", sets: [{ weight: 100, reps: 5 }] }]
    }
  });
  // Points: 60 + 50 (workout) + 100 (PR) = 210
  assert.strictEqual(mockContext.myMember.points, 210);
  assert.strictEqual(mockContext.myMember.personalRecords["Squat"], 100);
  // Also should have unlocked "pr-hitter" badge
  assert.ok(mockContext.myMember.unlockedBadges.includes("pr-hitter"));

  // 5. Workout anti-abuse cap (3rd workout today does not award workout points)
  mockContext.data.workout_logs.push({ memberId: "member-1", date: todayStr, exercises: [] });
  mockContext.data.workout_logs.push({ memberId: "member-1", date: todayStr, exercises: [] });
  await awardPointsAndBadges(mockContext, "workout", { workout: { exercises: [] } });
  assert.strictEqual(mockContext.myMember.points, 210); // Still 210

  console.log("✅ awardPointsAndBadges tests passed.");
}

async function runAll() {
  try {
    testCalculateStreak();
    await testAwardPointsAndBadges();
    console.log("🎉 All gamification unit tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runAll();
