import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(__dirname, "..");
const geminiConfig = path.join(os.homedir(), ".gemini", "config");
const geminiBuiltin = path.join(os.homedir(), ".gemini", "antigravity", "builtin", "skills");

import os from "node:os";

function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function assembleRepository() {
  console.log("🚀 Assembling Antigravity Superpowers Module Repository...");

  // 1. Antigravity Superpowers Plugin
  const superpowersPluginDir = path.join(rootDir, "plugins", "antigravity-superpowers");
  fs.mkdirSync(superpowersPluginDir, { recursive: true });

  fs.writeFileSync(
    path.join(superpowersPluginDir, "plugin.json"),
    JSON.stringify(
      {
        name: "antigravity-superpowers",
        version: "1.0.0",
        description:
          "Antigravity Autonomous Superpowers & Divisions Plugin - Predictive Simulation, Omniscient AST Telepathy, Self-Healing, Bun Native Orchestration, Engineering, Security, Testing & QA, and Design Divisions.",
        author: { name: "Antigravity Engineering" },
        license: "MIT",
        keywords: [
          "antigravity",
          "superpowers",
          "skills",
          "hooks",
          "auto-injection",
          "engineering-division",
          "security-division",
          "testing-division",
          "design-division",
        ],
      },
      null,
      2
    ) + "\n"
  );

  // Copy protocols and scripts for superpowers plugin
  const srcProtocols = path.join(geminiConfig, "plugins", "antigravity-superpowers", "skills", "protocols");
  const destProtocols = path.join(superpowersPluginDir, "skills", "protocols");
  copyDirRecursive(srcProtocols, destProtocols);

  const srcScripts = path.join(geminiConfig, "plugins", "antigravity-superpowers", "skills", "scripts");
  const destScripts = path.join(superpowersPluginDir, "skills", "scripts");
  copyDirRecursive(srcScripts, destScripts);

  // Copy core superpower skill to root skills/
  const rootSkillsDir = path.join(rootDir, "skills");
  fs.mkdirSync(rootSkillsDir, { recursive: true });
  copyDirRecursive(
    path.join(superpowersPluginDir, "skills"),
    path.join(rootSkillsDir, "antigravity-superpowers")
  );

  // 2. Antigravity Divisions Plugin
  const divisionsPluginDir = path.join(rootDir, "plugins", "antigravity-divisions");
  fs.mkdirSync(divisionsPluginDir, { recursive: true });

  fs.writeFileSync(
    path.join(divisionsPluginDir, "plugin.json"),
    JSON.stringify(
      {
        name: "antigravity-divisions",
        version: "1.0.0",
        description: "Specialized Division Skills Plugin - 88 Engineering, Security, Testing, and Design Skills",
        author: { name: "Antigravity Engineering" },
        license: "MIT",
      },
      null,
      2
    ) + "\n"
  );

  const srcDivisionSkills = path.join(rootDir, ".agents", "skills");
  const destDivisionSkills = path.join(divisionsPluginDir, "skills");
  copyDirRecursive(srcDivisionSkills, destDivisionSkills);

  // Copy division skills to root skills/
  if (fs.existsSync(srcDivisionSkills)) {
    const entries = fs.readdirSync(srcDivisionSkills, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        copyDirRecursive(
          path.join(srcDivisionSkills, entry.name),
          path.join(rootSkillsDir, entry.name)
        );
      }
    }
  }

  // 3. Google Antigravity SDK Plugin
  const sdkPluginDir = path.join(rootDir, "plugins", "google-antigravity-sdk");
  fs.mkdirSync(sdkPluginDir, { recursive: true });

  fs.writeFileSync(
    path.join(sdkPluginDir, "plugin.json"),
    JSON.stringify(
      {
        name: "google-antigravity-sdk",
        version: "1.0.0",
        description: "Google Antigravity SDK & Sitemaps Plugin for AGY 2.0, IDE, and Gemini CLI",
        author: { name: "Antigravity Engineering" },
        license: "MIT",
      },
      null,
      2
    ) + "\n"
  );

  const srcSdkSkill = path.join(geminiConfig, "plugins", "google-antigravity-sdk", "skills", "google-antigravity-sdk");
  const destSdkSkill = path.join(sdkPluginDir, "skills", "google-antigravity-sdk");
  copyDirRecursive(srcSdkSkill, destSdkSkill);
  if (fs.existsSync(srcSdkSkill)) {
    copyDirRecursive(srcSdkSkill, path.join(rootSkillsDir, "google-antigravity-sdk"));
  }

  const srcGuideSkill = path.join(geminiBuiltin, "antigravity_guide");
  const destGuideSkill = path.join(sdkPluginDir, "skills", "antigravity-guide");
  copyDirRecursive(srcGuideSkill, destGuideSkill);
  if (fs.existsSync(srcGuideSkill)) {
    copyDirRecursive(srcGuideSkill, path.join(rootSkillsDir, "antigravity-guide"));
  }

  console.log("✅ Repository assembly complete!");
}

assembleRepository().catch(console.error);
