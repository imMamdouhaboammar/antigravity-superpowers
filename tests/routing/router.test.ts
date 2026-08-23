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

  test("does not over-route security words inside documentation-only tasks", () => {
    const decision = routeTask("Fix typo in security documentation");
    expect(decision.skills).toEqual(["engineering-minimal-change-engineer"]);
    expect(decision.complexity).toBe("trivial");
  });

  test("does not match auth inside unrelated words such as author", () => {
    const decision = routeTask("Update author bio copy");
    expect(decision.skills).toEqual(["engineering-minimal-change-engineer"]);
    expect(decision.skills).not.toContain("security-appsec-engineer");
  });

  test("routes failing tests to debugging and test verification", () => {
    const decision = routeTask("Debug failing test in the installer");
    expect(decision.complexity).toBe("standard");
    expect(decision.skills).toEqual(["engineering-senior-developer", "testing-test-automation-engineer"]);
  });

  test("routes major features through architecture implementation review and verification", () => {
    const decision = routeTask("Design and implement major feature for host adapters");
    expect(decision.complexity).toBe("complex");
    expect(decision.skills).toEqual(["engineering-software-architect", "engineering-senior-developer", "testing-test-automation-engineer", "engineering-code-reviewer"]);
  });

  test("always includes explicit security review for sensitive changes", () => {
    const decision = routeTask("Change OAuth permission handling and secret storage");
    expect(decision.complexity).toBe("high-risk");
    expect(decision.skills).toContain("security-appsec-engineer");
    expect(decision.skills).toContain("testing-test-automation-engineer");
    expect(decision.skills).toContain("engineering-code-reviewer");
  });

  test("keeps read-only security audits focused", () => {
    const decision = routeTask("Audit OAuth permission handling for security issues");
    expect(decision.complexity).toBe("high-risk");
    expect(decision.skills).toEqual(["security-appsec-engineer"]);
  });

  test("routes read-only code review to the reviewer instead of an implementation owner", () => {
    const decision = routeTask("Review React component state handling");
    expect(decision.complexity).toBe("standard");
    expect(decision.skills).toEqual(["engineering-code-reviewer"]);
  });

  test("keeps recommendation-only fixes inside the review workflow", () => {
    const decision = routeTask("Review React component and suggest fixes");
    expect(decision.complexity).toBe("standard");
    expect(decision.skills).toEqual(["engineering-code-reviewer"]);
  });

  test("keeps recommendation article forms inside the review workflow", () => {
    for (const task of [
      "Review React component and recommend a fix",
      "Review React component and propose an update",
      "Review React component and suggest the changes",
    ]) {
      const decision = routeTask(task);
      expect(decision.complexity).toBe("standard");
      expect(decision.skills).toEqual(["engineering-code-reviewer"]);
      expect(decision.skills).not.toContain("engineering-frontend-developer");
      expect(decision.skills).not.toContain("testing-test-automation-engineer");
    }
  });

  test("still treats imperative fixes as mutation work", () => {
    const decision = routeTask("Review React component and fix state handling");
    expect(decision.skills).toContain("engineering-frontend-developer");
    expect(decision.skills).not.toEqual(["engineering-code-reviewer"]);
  });

  test("keeps architecture inspection read-only when no mutation is requested", () => {
    const decision = routeTask("Inspect architecture of the host adapters");
    expect(decision.complexity).toBe("standard");
    expect(decision.skills).toEqual(["engineering-code-reviewer"]);
  });

  test("does not add test automation to a read-only bug assessment", () => {
    const decision = routeTask("Assess React component for potential bugs");
    expect(decision.skills).toEqual(["engineering-code-reviewer"]);
  });

  test("does not add design specialists to plain frontend implementation", () => {
    const decision = routeTask("Fix React component state update");
    expect(decision.skills).toEqual(["engineering-frontend-developer"]);
  });

  test("adds a design specialist only when UI work explicitly includes design", () => {
    const decision = routeTask("Implement React UI layout from the new design system");
    expect(decision.skills).toEqual(["engineering-frontend-developer", "design-ui-designer"]);
  });

  test("does not route an empty request", () => {
    expect(routeTask("   ").skills).toEqual([]);
  });

  test("never emits duplicate skills", () => {
    const decision = routeTask("Design and implement major security feature for auth permissions");
    expect(new Set(decision.skills).size).toBe(decision.skills.length);
  });
});
