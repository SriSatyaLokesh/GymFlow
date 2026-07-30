import assert from "assert";
import { normalizePhone10 } from "../modules/utils.js";

function testNormalizePhone10() {
  console.log("Running normalizePhone10 tests...");
  assert.strictEqual(normalizePhone10("9876543210"), "9876543210");
  assert.strictEqual(normalizePhone10("+91 98765-43210"), "9876543210");
  assert.strictEqual(normalizePhone10("09876543210"), "9876543210");
  assert.strictEqual(normalizePhone10("123-456-7890"), "1234567890");
  assert.strictEqual(normalizePhone10(""), "");
  console.log("✅ normalizePhone10 tests passed.");
}

function testSyntheticEmailMapping() {
  console.log("Running synthetic email mapping tests...");
  
  function getSyntheticEmail(username) {
    let email = String(username || "").trim();
    const digitsOnly = email.replace(/\D/g, "");
    if (digitsOnly.length >= 10 && !email.includes("@")) {
      email = `${digitsOnly.slice(-10)}@gymflow.app`;
    }
    return email;
  }
  
  assert.strictEqual(getSyntheticEmail("9876543210"), "9876543210@gymflow.app");
  assert.strictEqual(getSyntheticEmail("+91 98765-43210"), "9876543210@gymflow.app");
  assert.strictEqual(getSyntheticEmail("john@example.com"), "john@example.com");
  assert.strictEqual(getSyntheticEmail("9876543210@gymflow.app"), "9876543210@gymflow.app");
  
  console.log("✅ synthetic email mapping tests passed.");
}

function runAll() {
  try {
    testNormalizePhone10();
    testSyntheticEmailMapping();
    console.log("🎉 All phone auth unit tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runAll();
