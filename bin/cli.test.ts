import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspectInstallation } from "./cli.ts";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "antigravity-verify-"));
  roots.push(root);
  return root;
}

describe("inspectInstallation", () => {
  test("reports baseline capabilities missing in an empty home", () => {
    const report = inspectInstallation(fixture());
    expect(report.missingPlugins).toEqual(report.requiredPlugins);
    expect(report.missingSkills).toEqual(report.requiredSkills);
    expect(report.skillCount).toBe(0);
  });

  test("does not treat an arbitrary high skill count as healthy", () => {
    const root = fixture();
    const skills = path.join(root, ".gemini", "config", "skills");
    fs.mkdirSync(skills, { recursive: true });
    for (let i = 0; i < 100; i++) fs.mkdirSync(path.join(skills, `unrelated-${i}`));
    const report = inspectInstallation(root);
    expect(report.skillCount).toBe(100);
    expect(report.missingSkills.length).toBe(report.requiredSkills.length);
  });

  test("accepts required plugins and required skill manifests regardless of total count", () => {
    const root = fixture();
    const initial = inspectInstallation(root);
    for (const plugin of initial.requiredPlugins) fs.mkdirSync(path.join(initial.globalPluginsDir, plugin), { recursive: true });
    for (const skill of initial.requiredSkills) {
      const dir = path.join(initial.globalSkillsDir, skill);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "SKILL.md"), "# fixture\n");
    }
    const report = inspectInstallation(root);
    expect(report.missingPlugins).toEqual([]);
    expect(report.missingSkills).toEqual([]);
    expect(report.skillCount).toBe(report.requiredSkills.length);
  });
});
