import fs from "node:fs";
import path from "node:path";
import type { AgentAdapter, InstallContext, AdapterInstallResult, AdapterDetectionResult, AdapterVerifyResult } from "./types.ts";
import { copySkillTree, appendOrPrependBlock, generateSuperpowersAgentPrompt } from "./utils.ts";

export class WindsurfAdapter implements AgentAdapter {
  readonly name = "windsurf" as const;
  readonly displayName = "Codeium Windsurf";

  detect(homeDir: string, projectDir: string): AdapterDetectionResult {
    const projectWindsurf = path.join(projectDir, ".windsurf");
    const windsurfRules = path.join(projectDir, ".windsurfrules");
    const globalCodeium = path.join(homeDir, ".codeium");

    const detected = fs.existsSync(projectWindsurf) || fs.existsSync(windsurfRules) || fs.existsSync(globalCodeium);
    return {
      detected,
      globalPath: globalCodeium,
      projectPath: projectWindsurf,
      details: detected ? "Windsurf / Codeium detected" : "Standard path .windsurfrules",
    };
  }

  async installGlobal(context: InstallContext): Promise<AdapterInstallResult> {
    const globalWindsurfSkills = path.join(context.homeDir, ".codeium", "windsurf", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const { count: installedSkillsCount, files: installedFiles } = copySkillTree(
      srcSkillsDir,
      globalWindsurfSkills,
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
    const windsurfRulesPath = path.join(context.projectDir, ".windsurfrules");
    const projectSkillsDir = path.join(context.projectDir, ".windsurf", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const installedFiles: string[] = [];

    const { count: installedSkillsCount, files: skillFiles } = copySkillTree(
      srcSkillsDir,
      projectSkillsDir,
      context.dryRun
    );
    installedFiles.push(...skillFiles);

    appendOrPrependBlock(
      windsurfRulesPath,
      "antigravity-superpowers",
      generateSuperpowersAgentPrompt(),
      context.dryRun
    );
    installedFiles.push(windsurfRulesPath);

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async verify(homeDir: string, projectDir: string): Promise<AdapterVerifyResult> {
    const windsurfRulesPath = path.join(projectDir, ".windsurfrules");
    const projectSkillsDir = path.join(projectDir, ".windsurf", "skills");

    const missingItems: string[] = [];
    const presentItems: string[] = [];

    const hasRules = fs.existsSync(windsurfRulesPath);
    const hasSkills = fs.existsSync(projectSkillsDir);

    if (hasRules) presentItems.push("windsurfrules:.windsurfrules");
    else missingItems.push("windsurfrules:.windsurfrules");

    if (hasSkills) presentItems.push("windsurf-skills:.windsurf/skills");

    const skillCount = hasSkills
      ? fs.readdirSync(projectSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length
      : 0;

    return {
      healthy: hasRules || hasSkills,
      missingItems,
      presentItems,
      skillCount,
    };
  }
}
