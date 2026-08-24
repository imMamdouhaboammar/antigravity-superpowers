import fs from "node:fs";
import path from "node:path";
import type { AgentAdapter, InstallContext, AdapterInstallResult, AdapterDetectionResult, AdapterVerifyResult } from "./types.ts";
import { copyDirRecursive, copySkillTree } from "./utils.ts";
import { setupAntigravityHooksConfig, setupGitPrePushHook } from "../../install.ts";

export class AntigravityAdapter implements AgentAdapter {
  readonly name = "antigravity" as const;
  readonly displayName = "Google Antigravity & Gemini CLI";

  detect(homeDir: string, projectDir: string): AdapterDetectionResult {
    const globalGemini = path.join(homeDir, ".gemini");
    const projectAgents = path.join(projectDir, ".agents");

    const detected = fs.existsSync(globalGemini) || fs.existsSync(projectAgents);
    return {
      detected,
      globalPath: globalGemini,
      projectPath: projectAgents,
      details: detected ? "Antigravity/Gemini environment detected" : "Standard path ~/.gemini",
    };
  }

  async installGlobal(context: InstallContext): Promise<AdapterInstallResult> {
    const globalPluginsDir = path.join(context.homeDir, ".gemini", "config", "plugins");
    const globalSkillsDir = path.join(context.homeDir, ".gemini", "config", "skills");
    const srcPluginsDir = path.join(context.rootDir, "plugins");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const installedFiles: string[] = [];

    // 1. Plugins
    if (fs.existsSync(srcPluginsDir)) {
      const plugins = fs.readdirSync(srcPluginsDir, { withFileTypes: true });
      for (const plugin of plugins) {
        if (plugin.isDirectory()) {
          const srcPluginPath = path.join(srcPluginsDir, plugin.name);
          const destPluginPath = path.join(globalPluginsDir, plugin.name);
          const copied = copyDirRecursive(srcPluginPath, destPluginPath, context.dryRun);
          installedFiles.push(...copied);
        }
      }
    }

    // 2. Skills
    const { count: installedSkillsCount, files: skillFiles } = copySkillTree(
      srcSkillsDir,
      globalSkillsDir,
      context.dryRun
    );
    installedFiles.push(...skillFiles);

    // 3. Privacy Hook
    if (!context.dryRun) {
      setupAntigravityHooksConfig(context.homeDir);
    }

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async installProject(context: InstallContext): Promise<AdapterInstallResult> {
    const localAgentsSkillsDir = path.join(context.projectDir, ".agents", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const { count: installedSkillsCount, files: installedFiles } = copySkillTree(
      srcSkillsDir,
      localAgentsSkillsDir,
      context.dryRun
    );

    // Project Git Pre-push hook
    if (!context.dryRun) {
      setupGitPrePushHook(context.projectDir);
    }

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async verify(homeDir: string, projectDir: string): Promise<AdapterVerifyResult> {
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
      "security-appsec-engineer",
      "testing-test-automation-engineer",
    ];

    const missingItems: string[] = [];
    const presentItems: string[] = [];

    for (const plugin of requiredPlugins) {
      if (fs.existsSync(path.join(globalPluginsDir, plugin))) {
        presentItems.push(`plugin:${plugin}`);
      } else {
        missingItems.push(`plugin:${plugin}`);
      }
    }

    for (const skill of requiredSkills) {
      if (fs.existsSync(path.join(globalSkillsDir, skill, "SKILL.md"))) {
        presentItems.push(`skill:${skill}`);
      } else {
        missingItems.push(`skill:${skill}`);
      }
    }

    const skillCount = fs.existsSync(globalSkillsDir)
      ? fs.readdirSync(globalSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length
      : 0;

    return {
      healthy: missingItems.length === 0,
      missingItems,
      presentItems,
      skillCount,
    };
  }
}
