#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { installSuperpowers } from "../install.ts";
import { scanAndDynamizePaths } from "../scripts/privacy_path_dynamizer.ts";
import { routeTask } from "../src/routing/router.ts";

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

function getGlobalGeminiDir(): string {
  return path.join(os.homedir(), ".gemini");
}

function verifyInstallation() {
  console.log(`\n${colors.magenta}${colors.bright}⚡ ANTIGRAVITY SUPERPOWERS STATUS${colors.reset}\n`);

  const globalGeminiDir = getGlobalGeminiDir();
  const checks = [
    {
      name: "Superpowers Plugin",
      path: path.join(globalGeminiDir, "extensions", "superpowers"),
    },
    {
      name: "Specialized Divisions",
      path: path.join(globalGeminiDir, "skills", "specialized-divisions"),
    },
    {
      name: "Privacy Path Dynamizer",
      path: path.join(globalGeminiDir, "antigravity", "scripts", "privacy_path_dynamizer.ts"),
    },
    {
      name: "Global Hook Configuration",
      path: path.join(globalGeminiDir, "antigravity", "hooks.json"),
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    const exists = fs.existsSync(check.path);
    if (!exists) allPassed = false;
    console.log(
      `${exists ? colors.green + "✓" : colors.red + "✗"}${colors.reset} ${check.name}`,
    );
  }

  console.log("");
  if (allPassed) {
    console.log(`${colors.green}${colors.bright}All systems operational.${colors.reset}`);
  } else {
    console.log(
      `${colors.yellow}Some components are missing. Run 'antigravity-superpowers install'.${colors.reset}`,
    );
  }
}

function listSkills() {
  console.log(`\n${colors.cyan}${colors.bright}Available Specialized Divisions${colors.reset}\n`);
  const divisions = [
    ["Engineering", "22 skills"],
    ["Security", "14 skills"],
    ["Testing & QA", "13 skills"],
    ["Design", "12 skills"],
    ["Product", "10 skills"],
    ["Data & AI", "9 skills"],
    ["Leadership", "7 skills"],
    ["Business", "4 skills"],
  ];

  for (const [name, count] of divisions) {
    console.log(`  ${colors.bright}${name.padEnd(20)}${colors.reset}${colors.dim}${count}${colors.reset}`);
  }
  console.log("");
}

function printRoutingDecision(task: string) {
  const decision = routeTask(task);
  console.log(`${colors.cyan}Routing decision${colors.reset}`);
  console.log(`  Complexity: ${decision.complexity}`);
  console.log(`  Skills: ${decision.skills.length ? decision.skills.join(", ") : "none"}`);
  for (const reason of decision.reasons) console.log(`  - ${reason}`);
}

async function main() {
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
      if (result.issuesCount > 0) process.exit(1);
      break;
    }
    case "help":
    default:
      console.log(`Usage: antigravity-superpowers [command]

Commands:
  install        Install all plugins, skills, and privacy hooks globally and locally
  verify         Verify installation status and active skills
  list           List available skills by division
  route <task>   Explain the minimal specialist workflow selected for a task
  sanitize       Replace exact local-home path prefixes with '~' and preserve surrounding text
  check-privacy  Check for hardcoded local user paths without modifying files (fails if issues found)
  help           Display this help message
`);
      break;
  }
}

main().catch(console.error);
