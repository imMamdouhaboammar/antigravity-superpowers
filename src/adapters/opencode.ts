import fs from "node:fs";
import path from "node:path";
import type { AgentAdapter, InstallContext, AdapterInstallResult, AdapterDetectionResult, AdapterVerifyResult } from "./types.ts";
import { copySkillTree, writeSafely, generateSuperpowersAgentPrompt } from "./utils.ts";

export class OpenCodeAdapter implements AgentAdapter {
  readonly name = "opencode" as const;
  readonly displayName = "OpenCode AI";

  detect(homeDir: string, projectDir: string): AdapterDetectionResult {
    const globalOpenCode = path.join(homeDir, ".config", "opencode");
    const projectOpenCode = path.join(projectDir, ".opencode");

    const detected = fs.existsSync(globalOpenCode) || fs.existsSync(projectOpenCode);
    return {
      detected,
      globalPath: globalOpenCode,
      projectPath: projectOpenCode,
      details: detected ? "OpenCode configuration detected" : "Standard path ~/.config/opencode",
    };
  }

  async installGlobal(context: InstallContext): Promise<AdapterInstallResult> {
    const globalSkillsDir = path.join(context.homeDir, ".config", "opencode", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const { count: installedSkillsCount, files: installedFiles } = copySkillTree(
      srcSkillsDir,
      globalSkillsDir,
      context.dryRun
    );

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async installProject(context: InstallContext): Promise<AdapterInstallResult> {
    const projectOpenCodeDir = path.join(context.projectDir, ".opencode");
    const projectSkillsDir = path.join(projectOpenCodeDir, "skills");
    const instructionsPath = path.join(projectOpenCodeDir, "superpowers.md");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const installedFiles: string[] = [];

    const { count: installedSkillsCount, files: skillFiles } = copySkillTree(
      srcSkillsDir,
      projectSkillsDir,
      context.dryRun
    );
    installedFiles.push(...skillFiles);

    writeSafely(instructionsPath, generateSuperpowersAgentPrompt(), context.dryRun);
    installedFiles.push(instructionsPath);

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async verify(homeDir: string, projectDir: string): Promise<AdapterVerifyResult> {
    const globalSkillsDir = path.join(homeDir, ".config", "opencode", "skills");
    const projectSkillsDir = path.join(projectDir, ".opencode", "skills");

    const missingItems: string[] = [];
    const presentItems: string[] = [];

    const hasGlobal = fs.existsSync(globalSkillsDir);
    const hasProject = fs.existsSync(projectSkillsDir);

    if (hasGlobal) presentItems.push("global-skills:~/.config/opencode/skills");
    else missingItems.push("global-skills:~/.config/opencode/skills");

    if (hasProject) presentItems.push("project-skills:.opencode/skills");

    const skillCount = hasGlobal
      ? fs.readdirSync(globalSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length
      : (hasProject ? fs.readdirSync(projectSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length : 0);

    return {
      healthy: hasGlobal || hasProject,
      missingItems,
      presentItems,
      skillCount,
    };
  }
}
