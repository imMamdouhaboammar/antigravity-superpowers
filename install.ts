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

export async function installSuperpowers(options: InstallOptions = {}) {
  const rootDir = path.resolve(__dirname);
  const homeDir = os.homedir();
  const globalPluginsDir = path.join(homeDir, ".gemini", "config", "plugins");
  const globalSkillsDir = path.join(homeDir, ".gemini", "config", "skills");
  const localAgentsSkillsDir = path.resolve(options.targetDir || process.cwd(), ".agents", "skills");

  console.log(`${colors.cyan}${colors.bright}⚡ Antigravity Superpowers Installer v1.0.0${colors.reset}\n`);

  // 1. Install Plugins Globally (~/.gemini/config/plugins/)
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

  // 2. Install Skills Globally (~/.gemini/config/skills/)
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

  // 3. Install Skills to Project Local (.agents/skills/)
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

  console.log(`\n${colors.green}${colors.bright}🎉 Antigravity Superpowers & Specialized Division Skills installed successfully!${colors.reset}`);
  console.log(`${colors.cyan}All 91+ skills, protocols, and plugins are ready for zero-prompt auto-injection.${colors.reset}\n`);
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
