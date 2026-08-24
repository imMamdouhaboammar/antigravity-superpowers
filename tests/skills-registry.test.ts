import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { generateSkillsManifest } from "../scripts/generate_manifest.ts";

describe("Skills.sh Registry & Manifest", () => {
  const rootDir = path.resolve(__dirname, "..");
  const manifest = generateSkillsManifest(rootDir);

  it("generates a valid manifest matching total skills count", () => {
    const skillsDir = path.join(rootDir, "skills");
    const actualSkillDirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory());

    expect(manifest.skillsCount).toBe(actualSkillDirs.length);
    expect(manifest.skills.length).toBe(actualSkillDirs.length);
  });

  it("assigns valid categories across all division skills", () => {
    const validCategories = ["Core", "Engineering", "Security", "Testing", "Design", "Guides", "Other"];

    for (const skill of manifest.skills) {
      expect(validCategories).toContain(skill.category);
      expect(skill.name).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(skill.path).toBe(`skills/${skill.name}/SKILL.md`);
      expect(skill.rawUrl).toContain(skill.name);
    }
  });

  it("skills.json file exists and is in sync with generated manifest", () => {
    const skillsJsonPath = path.join(rootDir, "skills.json");
    expect(fs.existsSync(skillsJsonPath)).toBe(true);

    const written = JSON.parse(fs.readFileSync(skillsJsonPath, "utf-8"));
    expect(written.skillsCount).toBe(manifest.skillsCount);
    expect(written.skills.length).toBe(manifest.skills.length);
  });
});
