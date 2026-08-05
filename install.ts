import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface InstallOptions {
  global?: boolean;
  project?: boolean;
  targetDir?: string;
  force?: boolean;
}

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

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

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function setupGitPrePushHook(targetDir: string) {
  const gitDir = path.join(targetDir, ".git");
  const gitHooksDir = path.join(gitDir, "hooks");
  if (!fs.existsSync(gitDir)) return false;

  fs.mkdirSync(gitHooksDir, { recursive: true });
  const hookPath = path.join(gitHooksDir, "pre-push");

  if (fs.existsSync(hookPath)) {
    console.warn(
      `  ${colors.yellow}⚠ Existing Git pre-push hook preserved:${colors.reset} ${hookPath}`,
    );
    return false;
  }

  const scannerPath = path.join(targetDir, "scripts", "privacy_path_dynamizer.ts");
  const hookScript = `#!/usr/bin/env bash
# Antigravity Privacy & Path Dynamizer Pre-Push Security Guard
echo "🛡️ Running Antigravity privacy path pre-push check..."

if command -v bun >/dev/null 2>&1; then
  bun run ${shellQuote(scannerPath)} --check
else
  echo "❌ Bun runtime not detected; privacy path check cannot run." >&2
  exit 1
fi
`;

  fs.writeFileSync(hookPath, hookScript, { encoding: "utf-8", flag: "wx" });
  fs.chmodSync(hookPath, "755");
  console.log(`  ${colors.green}✓ Git Pre-Push Hook installed:${colors.reset} ${hookPath}`);
  return true;
}

interface HooksConfig {
  hooks: Array<{ name: string; events: string[]; command: string }>;
  [key: string]: unknown;
}

function parseHooksConfig(content: string, hooksJsonPath: string): HooksConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Refusing to overwrite invalid hooks configuration: ${hooksJsonPath}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { hooks?: unknown }).hooks)
  ) {
    throw new Error(`Refusing to overwrite unsupported hooks configuration: ${hooksJsonPath}`);
  }

  return parsed as HooksConfig;
}

export function setupAntigravityHooksConfig(homeDir: string) {
  const hooksJsonPath = path.join(homeDir, ".gemini", "config", "hooks.json");
  const hooksDir = path.dirname(hooksJsonPath);
  fs.mkdirSync(hooksDir, { recursive: true });

  let hooksConfig: HooksConfig = { hooks: [] };
  if (fs.existsSync(hooksJsonPath)) {
    hooksConfig = parseHooksConfig(fs.readFileSync(hooksJsonPath, "utf-8"), hooksJsonPath);
  }

  const dynamizerHookName = "antigravity-privacy-path-dynamizer";
  const existingIndex = hooksConfig.hooks.findIndex((hook) => hook.name === dynamizerHookName);
  const dynamizerHookEntry = {
    name: dynamizerHookName,
    events: ["PreToolUse", "SessionStart"],
    command: `bun run ${shellQuote(path.join(__dirname, "scripts", "privacy_path_dynamizer.ts"))} --check`,
  };

  if (existingIndex >= 0) {
    hooksConfig.hooks[existingIndex] = dynamizerHookEntry;
  } else {
    hooksConfig.hooks.push(dynamizerHookEntry);
  }

  const temporaryPath = `${hooksJsonPath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, JSON.stringify(hooksConfig, null, 2) + "\n", {
    encoding: "utf-8",
    flag: "wx",
  });
  fs.renameSync(temporaryPath, hooksJsonPath);
  console.log(`  ${colors.green}✓ Antigravity Privacy Hook registered:${colors.reset} ${hooksJsonPath}`);
}

export async function installSuperpowers(options: InstallOptions = {}) {
  const rootDir = path.resolve(__dirname);
  const homeDir = os.homedir();
  const globalPluginsDir = path.join(homeDir, ".gemini", "config", "plugins");
  const globalSkillsDir = path.join(homeDir, ".gemini", "config", "skills");
  const currentDir = path.resolve(options.targetDir || process.cwd());
  const localAgentsSkillsDir = path.join(currentDir, ".agents", "skills");

  console.log(`${colors.cyan}${colors.bright}⚡ Antigravity Superpowers Installer v1.0.0${colors.reset}\n`);

  console.log(`${colors.yellow}📦 Installing Antigravity Plugins...${colors.reset}`);
  const srcPluginsDir = path.join(rootDir, "plugins");

  if (fs.existsSync(srcPluginsDir)) {
    const plugins = fs.readdirSync(srcPluginsDir, { withFileTypes: true });
    for (const plugin of plugins) {
      if (plugin.isDirectory()) {
        const srcPluginPath = path.join(srcPluginsDir, plugin.name);
        const destPluginPath = path.join(globalPluginsDir, plugin.name);
        copyDirRecursive(srcPluginPath, destPluginPath);
        console.log(`  ${colors.green}✓ Plugin installed:${colors.reset} ${plugin.name} -> ${destPluginPath}`);
      }
    }
  }

  console.log(`\n${colors.yellow}🧠 Installing Skills Globally (~/.gemini/config/skills/)...${colors.reset}`);
  const srcSkillsDir = path.join(rootDir, "skills");
  let installedGlobalCount = 0;

  if (fs.existsSync(srcSkillsDir)) {
    const skills = fs.readdirSync(srcSkillsDir, { withFileTypes: true });
    for (const skill of skills) {
      if (skill.isDirectory()) {
        const srcSkillPath = path.join(srcSkillsDir, skill.name);
        const destSkillPath = path.join(globalSkillsDir, skill.name);
        copyDirRecursive(srcSkillPath, destSkillPath);
        installedGlobalCount++;
      }
    }
    console.log(`  ${colors.green}✓ ${installedGlobalCount} Skills installed globally.${colors.reset}`);
  }

  if (options.project !== false) {
    console.log(`\n${colors.yellow}🎯 Syncing Skills to Local Workspace (${localAgentsSkillsDir})...${colors.reset}`);
    let installedProjectCount = 0;
    if (fs.existsSync(srcSkillsDir)) {
      const skills = fs.readdirSync(srcSkillsDir, { withFileTypes: true });
      for (const skill of skills) {
        if (skill.isDirectory()) {
          const srcSkillPath = path.join(srcSkillsDir, skill.name);
          const destSkillPath = path.join(localAgentsSkillsDir, skill.name);
          copyDirRecursive(srcSkillPath, destSkillPath);
          installedProjectCount++;
        }
      }
      console.log(`  ${colors.green}✓ ${installedProjectCount} Skills synced to workspace .agents/skills/!${colors.reset}`);
    }
  }

  console.log(`\n${colors.yellow}🛡️ Installing Privacy & Path Dynamizer Hooks...${colors.reset}`);
  setupGitPrePushHook(currentDir);
  setupAntigravityHooksConfig(homeDir);

  console.log(`\n${colors.green}${colors.bright}🎉 Antigravity Superpowers & Specialized Division Skills installed successfully!${colors.reset}`);
  console.log(`${colors.cyan}All 91+ skills, protocols, and privacy hooks are active.${colors.reset}\n`);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const isGlobal = args.includes("--global");
  const isProject = args.includes("--project");

  installSuperpowers({
    global: isGlobal || (!isGlobal && !isProject),
    project: true,
  }).catch((err) => {
    console.error(`${colors.red}❌ Installation failed:${colors.reset}`, err);
    process.exit(1);
  });
}
