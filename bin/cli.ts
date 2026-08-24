#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { installSuperpowers } from "../install.ts";
import { scanAndDynamizePaths } from "../scripts/privacy_path_dynamizer.ts";
import { routeTask } from "../src/routing/router.ts";
import { detectInstalledAgents, getAllAdapters } from "../src/adapters/index.ts";
import { generateSkillsManifest } from "../scripts/generate_manifest.ts";
import skillsHandler from "../api/skills.ts";
import manifestHandler from "../api/manifest.ts";
import installHandler from "../api/install.ts";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function printBanner() {
  console.log(`\n${colors.cyan}${colors.bright}Antigravity Superpowers${colors.reset}\n${colors.yellow}Autonomous Superpowers & Specialized Division Skills for AI Agents${colors.reset}\n`);
}

export function inspectInstallation(homeDir = os.homedir()) {
  const globalPluginsDir = path.join(homeDir, ".gemini", "config", "plugins");
  const globalSkillsDir = path.join(homeDir, ".gemini", "config", "skills");
  const requiredPlugins = ["antigravity-superpowers", "antigravity-divisions", "google-antigravity-sdk"];
  const requiredSkills = [
    "antigravity-superpowers",
    "antigravity-guide",
    "google-antigravity-sdk",
    "engineering-software-architect",
    "engineering-senior-developer",
    "engineering-code-reviewer",
    "engineering-minimal-change-engineer",
    "security-appsec-engineer",
    "security-secrets-credential-engineer",
    "testing-test-automation-engineer",
    "testing-reality-checker",
  ];

  const missingPlugins = requiredPlugins.filter((name) => !fs.existsSync(path.join(globalPluginsDir, name)));
  const missingSkills = requiredSkills.filter((name) => !fs.existsSync(path.join(globalSkillsDir, name, "SKILL.md")));
  const skillCount = fs.existsSync(globalSkillsDir)
    ? fs.readdirSync(globalSkillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
    : 0;

  return { globalPluginsDir, globalSkillsDir, requiredPlugins, requiredSkills, missingPlugins, missingSkills, skillCount };
}

function verifyInstallation() {
  console.log(`${colors.yellow}Verifying Antigravity Superpowers installation...${colors.reset}\n`);
  const report = inspectInstallation();

  for (const plugin of report.requiredPlugins) {
    const missing = report.missingPlugins.includes(plugin);
    console.log(`  ${missing ? colors.red + "x" : colors.green + "✓"}${colors.reset} Plugin: ${plugin}`);
  }
  for (const skill of report.requiredSkills) {
    const missing = report.missingSkills.includes(skill);
    console.log(`  ${missing ? colors.red + "x" : colors.green + "✓"}${colors.reset} Required skill: ${skill}`);
  }

  console.log(`\n  ${report.skillCount} skill directories detected in ${report.globalSkillsDir}`);
  if (report.missingPlugins.length === 0 && report.missingSkills.length === 0) {
    console.log(`\n${colors.green}${colors.bright}STATUS: Healthy. Required plugins and baseline capabilities are present.${colors.reset}\n`);
    return true;
  }

  console.log(`\n${colors.red}STATUS: Incomplete installation.${colors.reset}`);
  if (report.missingPlugins.length) console.log(`Missing plugins: ${report.missingPlugins.join(", ")}`);
  if (report.missingSkills.length) console.log(`Missing skills: ${report.missingSkills.join(", ")}`);
  console.log(`Run 'antigravity-superpowers install' to repair.\n`);
  return false;
}

function listSkills() {
  const rootDir = path.resolve(import.meta.dir, "..");
  const skillsDir = path.join(rootDir, "skills");
  if (!fs.existsSync(skillsDir)) {
    console.log(`${colors.red}Skills directory not found.${colors.reset}`);
    return;
  }
  const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const categories: Record<string, string[]> = { Core: [], Engineering: [], Security: [], Testing: [], Design: [], Guides: [], Other: [] };
  for (const skill of skills) {
    if (skill.startsWith("engineering-")) categories.Engineering.push(skill);
    else if (skill.startsWith("security-")) categories.Security.push(skill);
    else if (skill.startsWith("testing-")) categories.Testing.push(skill);
    else if (skill.startsWith("design-")) categories.Design.push(skill);
    else if (skill === "antigravity-superpowers") categories.Core.push(skill);
    else if (skill.includes("sdk") || skill.includes("guide")) categories.Guides.push(skill);
    else categories.Other.push(skill);
  }
  for (const [category, items] of Object.entries(categories)) {
    if (items.length) console.log(`${colors.cyan}${category} (${items.length})${colors.reset}\n  ${items.join(", ")}\n`);
  }
  console.log(`${colors.green}Total skills: ${skills.length}${colors.reset}\n`);
}

function listAgents() {
  console.log(`${colors.cyan}${colors.bright}Supported AI Agent Adapters & Local Status${colors.reset}\n`);
  const detections = detectInstalledAgents();

  for (const item of detections) {
    const statusIcon = item.detection.detected ? `${colors.green}✓ Detected${colors.reset}` : `${colors.dim}○ Supported${colors.reset}`;
    console.log(`  ${colors.bright}${item.adapter.displayName}${colors.reset} [${item.adapter.name}]`);
    console.log(`    Status: ${statusIcon}`);
    if (item.detection.details) console.log(`    Details: ${item.detection.details}`);
    if (item.detection.globalPath) console.log(`    Global: ${item.detection.globalPath}`);
    if (item.detection.projectPath) console.log(`    Project: ${item.detection.projectPath}`);
    console.log();
  }

  console.log(`Install to any agent using: ${colors.cyan}antigravity-superpowers install --agent <name>${colors.reset}`);
  console.log(`Install to all agents using: ${colors.cyan}antigravity-superpowers install --all-agents${colors.reset}\n`);
}

function printRoutingDecision(task: string) {
  const decision = routeTask(task);
  console.log(`${colors.cyan}Routing decision${colors.reset}`);
  console.log(`  Complexity: ${decision.complexity}`);
  console.log(`  Skills: ${decision.skills.length ? decision.skills.join(", ") : "none"}`);
  for (const reason of decision.reasons) console.log(`  - ${reason}`);
}

function exportBrewFormula() {
  const rootDir = path.resolve(import.meta.dir, "..");
  const formulaPath = path.join(rootDir, "Formula", "antigravity-superpowers.rb");
  if (fs.existsSync(formulaPath)) {
    console.log(fs.readFileSync(formulaPath, "utf-8"));
  } else {
    console.error(`${colors.red}Formula file not found at ${formulaPath}${colors.reset}`);
  }
}

function exportManifest() {
  const rootDir = path.resolve(import.meta.dir, "..");
  const manifest = generateSkillsManifest(rootDir);
  console.log(JSON.stringify(manifest, null, 2));
}

async function startServer(port = 3000) {
  const rootDir = path.resolve(import.meta.dir, "..");
  const publicDir = path.join(rootDir, "public");

  console.log(`${colors.cyan}${colors.bright}⚡ Starting Antigravity Superpowers & Skills.sh Catalog Server on http://localhost:${port}...${colors.reset}`);

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname.startsWith("/api/skills")) {
        return skillsHandler(req);
      }
      if (url.pathname === "/api/manifest" || url.pathname === "/skills.json") {
        return manifestHandler(req);
      }
      if (url.pathname === "/api/install" || url.pathname === "/install.sh") {
        return installHandler(req);
      }

      // Serve static files from public/
      let filePath = path.join(publicDir, url.pathname === "/" ? "index.html" : url.pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeTypes: Record<string, string> = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".svg": "image/svg+xml",
          ".png": "image/png",
        };
        const contentType = mimeTypes[ext] || "text/plain";
        return new Response(fs.readFileSync(filePath), {
          headers: { "Content-Type": contentType },
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });
}

async function main() {
  const command = process.argv[2] || "install";

  switch (command) {
    case "install": {
      const args = process.argv.slice(3);
      const isGlobal = args.includes("--global");
      const isProject = args.includes("--project");
      const isAllAgents = args.includes("--all-agents") || args.includes("--all");
      const isDryRun = args.includes("--dry-run");

      const agentIdx = args.indexOf("--agent");
      const agentList: string[] = [];
      if (agentIdx >= 0 && args[agentIdx + 1]) {
        agentList.push(...args[agentIdx + 1].split(","));
      }

      const hasExplicitScope = isGlobal || isProject;
      await installSuperpowers({
        global: hasExplicitScope ? isGlobal : true,
        project: hasExplicitScope ? isProject : true,
        allAgents: isAllAgents,
        agents: agentList.length > 0 ? agentList : undefined,
        dryRun: isDryRun,
      });
      break;
    }
    case "verify":
    case "status":
      if (!verifyInstallation()) process.exitCode = 1;
      break;
    case "list":
      listSkills();
      break;
    case "agents":
      listAgents();
      break;
    case "export-brew":
    case "brew":
      exportBrewFormula();
      break;
    case "manifest":
      exportManifest();
      break;
    case "serve": {
      const portArg = process.argv[3];
      const port = portArg ? parseInt(portArg, 10) : 3000;
      await startServer(port);
      break;
    }
    case "route": {
      const task = process.argv.slice(3).join(" ").trim();
      if (!task) {
        console.error(`${colors.red}Provide a task to classify, for example: antigravity-superpowers route "Debug failing test"${colors.reset}`);
        process.exitCode = 2;
        break;
      }
      printRoutingDecision(task);
      break;
    }
    case "sanitize":
    case "fix-privacy":
      scanAndDynamizePaths({ fix: true });
      break;
    case "check-privacy": {
      const result = scanAndDynamizePaths({ fix: false });
      if (result.issuesCount > 0) process.exitCode = 1;
      break;
    }
    case "help":
    default:
      console.log(`Usage: antigravity-superpowers [command] [options]

Commands:
  install                      Install skills and plugins (global + project default)
    --global                   Install only to global user configuration (~/.gemini/)
    --project                  Install only to current workspace (.agents/skills/)
    --all-agents               Install across all detected AI agents (Antigravity, Claude, Cursor, OpenCode, Windsurf, Cline)
    --agent <name>             Install to a specific agent (e.g. claude, cursor, opencode, windsurf, cline)
    --dry-run                  Preview operations without writing to disk
  verify                       Verify required plugins and baseline capabilities
  status                       Alias for verify
  list                         List available skills by division
  agents                       List supported AI agent adapters and environment detection status
  route <task>                 Explain the minimal specialist workflow selected for a task
  manifest                     Export Skills.sh registry manifest (skills.json)
  export-brew                  Export Homebrew Ruby formula
  serve [port]                 Launch local web catalog explorer & API server (default: 3000)
  sanitize                     Replace exact local-home path prefixes with '~' and preserve surrounding text
  check-privacy                Check for hardcoded local user paths without modifying files
  help                         Display this help message
`);
      break;
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
