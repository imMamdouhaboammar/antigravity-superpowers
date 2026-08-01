import fs from "node:fs";
import path from "node:path";

export interface EngineeringSkill {
  name: string;
  folderName: string;
  path: string;
  description: string;
}

export function loadEngineeringSkills(baseDir = path.join(__dirname, "skills")): EngineeringSkill[] {
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const skills: EngineeringSkill[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(baseDir, entry.name, "SKILL.md");
      if (fs.existsSync(skillPath)) {
        const content = fs.readFileSync(skillPath, "utf-8");
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const descMatch = content.match(/^description:\s*(.+)$/m);

        skills.push({
          name: nameMatch ? nameMatch[1].trim() : entry.name,
          folderName: entry.name,
          path: skillPath,
          description: descMatch ? descMatch[1].trim() : "No description provided",
        });
      }
    }
  }

  return skills;
}

if (import.meta.main) {
  const skills = loadEngineeringSkills();
  console.log(`✅ Loaded ${skills.length} Engineering Division Skills from .agents/skills/`);
}
