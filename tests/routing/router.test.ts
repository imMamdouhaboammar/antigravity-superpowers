import { describe, expect, test } from "bun:test";
import { routeTask } from "../../src/routing/router";

describe("routeTask", () => {
  test("keeps README typo fixes minimal", () => {
    expect(routeTask("Fix README typo")).toEqual({
      complexity: "trivial",
      skills: ["engineering-minimal-change-engineer"],
      reasons: ["Documentation-only task: keep the workflow intentionally small."],
    });
  });

  test("routes failing tests to debugging and test verification", () => {
    const decision = routeTask("Debug failing test in the installer");
    expect(decision.complexity).toBe("standard");
    expect(decision.skills).toEqual([
      "engineering-senior-developer",
      "testing-test-automation-engineer",
    ]);
  });

  test("routes major features through architecture implementation review and verification", () => {
    const decision = routeTask("Design and implement major feature for host adapters");
    expect(decision.complexity).toBe("complex");
    expect(decision.skills).toEqual([
      "engineering-software-architect",
      "engineering-senior-developer",
      "testing-test-automation-engineer",
      "engineering-code-reviewer",
    ]);
  });

  test("always includes explicit security review for sensitive changes", () => {
    const decision = routeTask("Change OAuth permission handling and secret storage");
    expect(decision.complexity).toBe("high-risk");
    expect(decision.skills).toContain("security-appsec-engineer");
    expect(decision.skills).toContain("testing-test-automation-engineer");
    expect(decision.skills).toContain("engineering-code-reviewer");
  });

  test("does not add design specialists to plain frontend implementation", () => {
    const decision = routeTask("Fix React component state update");
    expect(decision.skills).toEqual(["engineering-frontend-developer"]);
    expect(decision.skills).not.toContain("design-ui-designer");
  });

  test("adds a design specialist only when UI work explicitly includes design", () => {
    const decision = routeTask("Implement React UI layout from the new design system");
    expect(decision.skills).toEqual([
      "engineering-frontend-developer",
      "design-ui-designer",
    ]);
  });

  test("does not route an empty request", () => {
    expect(routeTask("   ").skills).toEqual([]);
  });

  test("never emits duplicate skills", () => {
    const decision = routeTask("Design and implement major security feature for auth permissions");
    expect(new Set(decision.skills).size).toBe(decision.skills.length);
  });
});
