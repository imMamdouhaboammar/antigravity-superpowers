import fs from "node:fs";
import path from "node:path";

export interface SkillEntry {
  name: string;
  description: string;
  category: "Core" | "Engineering" | "Security" | "Testing" | "Design" | "Guides" | "Other";
  triggers?: string[];
  path: string;
  rawUrl: string;
}

export interface SkillsManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  repository: string;
  homepage: string;
  skillsCount: number;
  categories: Record<string, number>;
  skills: SkillEntry[];
}

function parseFrontmatter(content: string): { name?: string; description?: string; triggers?: string[] } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = match[1];
  const result: { name?: string; description?: string; triggers?: string[] } = {};

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  if (descMatch) result.description = descMatch[1].trim();

  const triggersMatch = frontmatter.match(/triggers:\n((?:\s*-\s*.+\n?)*)/);
  if (triggersMatch) {
    result.triggers = triggersMatch[1]
      .split("\n")
      .map((line) => line.replace(/^\s*-\s*/, "").trim())
      .filter(Boolean);
  }

  return result;
}

export function determineCategory(name: string): SkillEntry["category"] {
  if (name === "antigravity-superpowers") return "Core";
  if (name.startsWith("engineering-")) return "Engineering";
  if (name.startsWith("security-")) return "Security";
  if (name.startsWith("testing-")) return "Testing";
  if (name.startsWith("design-")) return "Design";
  if (name.includes("sdk") || name.includes("guide")) return "Guides";
  return "Other";
}

export function generateSkillsManifest(rootDir = path.resolve(__dirname, "..")): SkillsManifest {
  const skillsDir = path.join(rootDir, "skills");
  const pkgPath = path.join(rootDir, "package.json");
  const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, "utf-8")) : {};

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const skills: SkillEntry[] = [];
  const categories: Record<string, number> = {
    Core: 0,
    Engineering: 0,
    Security: 0,
    Testing: 0,
    Design: 0,
    Guides: 0,
    Other: 0,
  };

  for (const entry of entries) {
    const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
    let description = "Specialized AI division skill";
    let triggers: string[] | undefined;

    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, "utf-8");
      const parsed = parseFrontmatter(content);
      if (parsed.description) description = parsed.description;
      if (parsed.triggers) triggers = parsed.triggers;
    }

    const category = determineCategory(entry.name);
    categories[category] = (categories[category] || 0) + 1;

    skills.push({
      name: entry.name,
      description,
      category,
      triggers,
      path: `skills/${entry.name}/SKILL.md`,
      rawUrl: `https://raw.githubusercontent.com/imMamdouhaboammar/antigravity-superpowers/master/skills/${entry.name}/SKILL.md`,
    });
  }

  return {
    name: pkg.name || "@mamdouh-aboammar/antigravity-superpowers",
    version: pkg.version || "1.1.0",
    description: pkg.description || "Autonomous Superpowers & Specialized Division Skills for AI Agents",
    author: typeof pkg.author === "string" ? pkg.author : "Antigravity Engineering",
    license: pkg.license || "MIT",
    repository: "https://github.com/imMamdouhaboammar/antigravity-superpowers",
    homepage: "https://github.com/imMamdouhaboammar/antigravity-superpowers#readme",
    skillsCount: skills.length,
    categories,
    skills,
  };
}

if (import.meta.main) {
  const rootDir = path.resolve(__dirname, "..");
  const manifest = generateSkillsManifest(rootDir);
  const targetPath = path.join(rootDir, "skills.json");

  fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  console.log(`✓ skills.json generated successfully with ${manifest.skillsCount} skills!`);
}
