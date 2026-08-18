import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { routeTask } from "../../src/routing/router";

const root = path.resolve(import.meta.dir, "../..");
const scenarios = [
  "Fix README typo",
  "Debug failing test in the installer",
  "Design and implement major feature for host adapters",
  "Change OAuth permission handling and secret storage",
  "Audit OAuth permission handling for security issues",
  "Implement React UI layout from the new design system",
];

describe("routing skill resolution", () => {
  test("every routed skill exists in the packaged skills directory", () => {
    for (const scenario of scenarios) {
      const decision = routeTask(scenario);
      for (const skill of decision.skills) {
        const skillFile = path.join(root, "skills", skill, "SKILL.md");
        expect(fs.existsSync(skillFile), `${scenario} routed to missing ${skill}`).toBe(true);
      }
    }
  });

  test("core protocol does not reintroduce legacy agency-prefixed names", () => {
    const core = fs.readFileSync(path.join(root, "skills", "antigravity-superpowers", "SKILL.md"), "utf8");
    expect(core).not.toContain("agency-");
  });

  test("core protocol forbids activate-everything behavior", () => {
    const core = fs.readFileSync(path.join(root, "skills", "antigravity-superpowers", "SKILL.md"), "utf8");
    expect(core).toContain("Do not activate specialists merely because they are installed.");
    expect(core).not.toContain("utilized on EVERY task");
  });

  test("checked-in agent mirror matches the canonical core skill", () => {
    const canonical = fs.readFileSync(path.join(root, "skills", "antigravity-superpowers", "SKILL.md"), "utf8");
    const mirror = fs.readFileSync(path.join(root, ".agents", "skills", "antigravity-superpowers", "SKILL.md"), "utf8");
    expect(mirror).toBe(canonical);
  });
});
