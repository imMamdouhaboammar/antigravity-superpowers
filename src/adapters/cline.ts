import fs from "node:fs";
import path from "node:path";
import type { AgentAdapter, InstallContext, AdapterInstallResult, AdapterDetectionResult, AdapterVerifyResult } from "./types.ts";
import { copySkillTree, appendOrPrependBlock, generateSuperpowersAgentPrompt } from "./utils.ts";

export class ClineAdapter implements AgentAdapter {
  readonly name = "cline" as const;
  readonly displayName = "Cline & Roo-Code";

  detect(homeDir: string, projectDir: string): AdapterDetectionResult {
    const projectClineRules = path.join(projectDir, ".clinerules");
    const projectRooRules = path.join(projectDir, ".roomodes");
    const globalCline = path.join(homeDir, ".cline");

    const detected = fs.existsSync(projectClineRules) || fs.existsSync(projectRooRules) || fs.existsSync(globalCline);
    return {
      detected,
      globalPath: globalCline,
      projectPath: projectClineRules,
      details: detected ? "Cline / Roo-Code detected" : "Standard path .clinerules",
    };
  }

  async installGlobal(context: InstallContext): Promise<AdapterInstallResult> {
    const globalClineSkills = path.join(context.homeDir, ".cline", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const { count: installedSkillsCount, files: installedFiles } = copySkillTree(
      srcSkillsDir,
      globalClineSkills,
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
    const clineRulesPath = path.join(context.projectDir, ".clinerules");
    const projectSkillsDir = path.join(context.projectDir, ".cline", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const installedFiles: string[] = [];

    const { count: installedSkillsCount, files: skillFiles } = copySkillTree(
      srcSkillsDir,
      projectSkillsDir,
      context.dryRun
    );
    installedFiles.push(...skillFiles);

    appendOrPrependBlock(
      clineRulesPath,
      "antigravity-superpowers",
      generateSuperpowersAgentPrompt(),
      context.dryRun
    );
    installedFiles.push(clineRulesPath);

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async verify(homeDir: string, projectDir: string): Promise<AdapterVerifyResult> {
    const clineRulesPath = path.join(projectDir, ".clinerules");
    const projectSkillsDir = path.join(projectDir, ".cline", "skills");

    const missingItems: string[] = [];
    const presentItems: string[] = [];

    const hasRules = fs.existsSync(clineRulesPath);
    const hasSkills = fs.existsSync(projectSkillsDir);

    if (hasRules) presentItems.push("clinerules:.clinerules");
    else missingItems.push("clinerules:.clinerules");

    if (hasSkills) presentItems.push("cline-skills:.cline/skills");

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
