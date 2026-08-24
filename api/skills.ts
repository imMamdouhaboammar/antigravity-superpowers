import fs from "node:fs";
import path from "node:path";
import { generateSkillsManifest } from "../scripts/generate_manifest.ts";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || url.pathname.split("/").pop();
  const query = (url.searchParams.get("q") || "").toLowerCase().trim();
  const category = (url.searchParams.get("category") || "").trim();
  const raw = url.searchParams.get("raw") === "true";

  const rootDir = path.resolve(__dirname, "..");
  const manifest = generateSkillsManifest(rootDir);

  // Single skill requested
  if (name && name !== "skills" && name !== "api") {
    const skill = manifest.skills.find((s) => s.name === name);
    if (!skill) {
      return new Response(JSON.stringify({ error: `Skill '${name}' not found` }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const fullSkillPath = path.join(rootDir, "skills", skill.name, "SKILL.md");
    const markdown = fs.existsSync(fullSkillPath) ? fs.readFileSync(fullSkillPath, "utf-8") : "";

    if (raw) {
      return new Response(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(
      JSON.stringify({
        ...skill,
        content: markdown,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  // Filter skills list
  let filteredSkills = manifest.skills;

  if (category && category.toLowerCase() !== "all") {
    filteredSkills = filteredSkills.filter(
      (s) => s.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (query) {
    filteredSkills = filteredSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        (s.triggers && s.triggers.some((t) => t.toLowerCase().includes(query)))
    );
  }

  return new Response(
    JSON.stringify({
      total: manifest.skillsCount,
      filtered: filteredSkills.length,
      categories: manifest.categories,
      skills: filteredSkills,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    }
  );
}
