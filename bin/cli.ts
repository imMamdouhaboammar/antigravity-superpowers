#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { installSuperpowers } from "../install.ts";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function printBanner() {
  console.log(`
${colors.cyan}${colors.bright}
   _   _  _ _____ ___  ___  ___    _  _   _____ _____   __
  /_\\ | \\| |_   _|_ _|/ __|/ _ \\  /_\\| | / /_ _|_   _| /  \\
 / _ \\| .\` | | |  | || (_ | (_) |/ _ \\ |/ / | |  | |  | () |
/_/ \\_\\_|\\_| |_| |___|\\___|\\___//_/ \\_\\___/ |___| |_|   \\__/
${colors.reset}
${colors.yellow}   Autonomous Superpowers & Specialized Division Skills for Antigravity ${colors.reset}
`);
}

function verifyInstallation() {
  console.log(`${colors.yellow}🔍 Verifying Antigravity Superpowers Installation...${colors.reset}\n`);

  const homeDir = os.homedir();
  const globalPluginsDir = path.join(homeDir, ".gemini", "config", "plugins");
  const globalSkillsDir = path.join(homeDir, ".gemini", "config", "skills");

  const requiredPlugins = ["antigravity-superpowers", "antigravity-divisions", "google-antigravity-sdk"];
  let pluginOk = 0;

  for (const plugin of requiredPlugins) {
    const pPath = path.join(globalPluginsDir, plugin);
    if (fs.existsSync(pPath)) {
      console.log(`  ${colors.green}✓ Plugin verified:${colors.reset} ${plugin}`);
      pluginOk++;
    } else {
      console.log(`  ${colors.red}✗ Plugin missing:${colors.reset} ${plugin}`);
    }
  }

  let skillCount = 0;
  if (fs.existsSync(globalSkillsDir)) {
    const entries = fs.readdirSync(globalSkillsDir, { withFileTypes: true });
    skillCount = entries.filter((e) => e.isDirectory()).length;
  }

  console.log(`\n  ${colors.green}✓ ${skillCount} Global Skills detected in ~/.gemini/config/skills/${colors.reset}`);

  if (pluginOk === requiredPlugins.length && skillCount >= 80) {
    console.log(`\n${colors.green}${colors.bright}✅ STATUS: Perfect! All Antigravity Superpowers & Division Skills are fully active.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠️ STATUS: Partial installation detected. Run 'antigravity-superpowers install' to fix.${colors.reset}\n`);
  }
}

function listSkills() {
  const rootDir = path.resolve(__dirname, "..");
  const skillsDir = path.join(rootDir, "skills");

  console.log(`${colors.yellow}📋 Listing All Available Antigravity Superpowers & Division Skills:${colors.reset}\n`);

  if (!fs.existsSync(skillsDir)) {
    console.log(`${colors.red}Skills directory not found. Run 'bun run scripts/setup.ts' first.${colors.reset}`);
    return;
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const categories: Record<string, string[]> = {
    "⚡ Core Superpowers": [],
    "💻 Engineering Division": [],
    "🛡️ Security Division": [],
    "🧪 Testing & QA Division": [],
    "🎨 Design Division": [],
    "📚 Guides & SDK": [],
    "📦 Other": [],
  };

  for (const skill of skills) {
    if (skill.startsWith("engineering-")) categories["💻 Engineering Division"].push(skill);
    else if (skill.startsWith("security-")) categories["🛡️ Security Division"].push(skill);
    else if (skill.startsWith("testing-")) categories["🧪 Testing & QA Division"].push(skill);
    else if (skill.startsWith("design-")) categories["🎨 Design Division"].push(skill);
    else if (skill === "antigravity-superpowers") categories["⚡ Core Superpowers"].push(skill);
    else if (skill.includes("sdk") || skill.includes("guide")) categories["📚 Guides & SDK"].push(skill);
    else categories["📦 Other"].push(skill);
  }

  for (const [cat, items] of Object.entries(categories)) {
    if (items.length > 0) {
      console.log(`${colors.cyan}${cat} (${items.length}):${colors.reset}`);
      console.log(`  ${items.join(", ")}\n`);
    }
  }

  console.log(`${colors.green}Total Skills Available: ${skills.length}${colors.reset}\n`);
}

async function main() {
  printBanner();
  const command = process.argv[2] || "install";

  switch (command) {
    case "install":
      await installSuperpowers();
      break;
    case "verify":
    case "status":
      verifyInstallation();
      break;
    case "list":
      listSkills();
      break;
    case "help":
    default:
      console.log(`Usage: antigravity-superpowers [command]

Commands:
  install     Install all plugins and skills globally and locally
  verify      Verify system status and active skills
  list        List all 91+ available skills by division
  help        Display this help message
`);
      break;
  }
}

main().catch(console.error);
