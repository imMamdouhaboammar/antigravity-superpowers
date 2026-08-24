import fs from "node:fs";
import path from "node:path";
import type { AgentAdapter, InstallContext, AdapterInstallResult, AdapterDetectionResult, AdapterVerifyResult } from "./types.ts";
import { copySkillTree, appendOrPrependBlock, generateSuperpowersAgentPrompt } from "./utils.ts";

export class UniversalAdapter implements AgentAdapter {
  readonly name = "universal" as const;
  readonly displayName = "Universal Agents (.agents / AGENTS.md / Copilot)";

  detect(homeDir: string, projectDir: string): AdapterDetectionResult {
    const projectAgentsDir = path.join(projectDir, ".agents");
    const agentsMdPath = path.join(projectDir, "AGENTS.md");
    const copilotPath = path.join(projectDir, ".github", "copilot-instructions.md");

    const detected = fs.existsSync(projectAgentsDir) || fs.existsSync(agentsMdPath) || fs.existsSync(copilotPath);
    return {
      detected,
      projectPath: projectAgentsDir,
      details: detected ? "Universal agent environment detected" : "Standard path .agents/skills",
    };
  }

  async installGlobal(context: InstallContext): Promise<AdapterInstallResult> {
    const globalSkillsDir = path.join(context.homeDir, ".agents", "skills");
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
    const projectSkillsDir = path.join(context.projectDir, ".agents", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");
    const agentsMdPath = path.join(context.projectDir, "AGENTS.md");
    const copilotPath = path.join(context.projectDir, ".github", "copilot-instructions.md");

    const installedFiles: string[] = [];

    // 1. Copy skills to .agents/skills/
    const { count: installedSkillsCount, files: skillFiles } = copySkillTree(
      srcSkillsDir,
      projectSkillsDir,
      context.dryRun
    );
    installedFiles.push(...skillFiles);

    // 2. Append/sync AGENTS.md
    appendOrPrependBlock(
      agentsMdPath,
      "antigravity-superpowers",
      generateSuperpowersAgentPrompt(),
      context.dryRun
    );
    installedFiles.push(agentsMdPath);

    // 3. Append/sync .github/copilot-instructions.md
    appendOrPrependBlock(
      copilotPath,
      "antigravity-superpowers",
      generateSuperpowersAgentPrompt(),
      context.dryRun
    );
    installedFiles.push(copilotPath);

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async verify(homeDir: string, projectDir: string): Promise<AdapterVerifyResult> {
    const projectSkillsDir = path.join(projectDir, ".agents", "skills");
    const agentsMdPath = path.join(projectDir, "AGENTS.md");
    const copilotPath = path.join(projectDir, ".github", "copilot-instructions.md");

    const missingItems: string[] = [];
    const presentItems: string[] = [];

    const hasSkills = fs.existsSync(projectSkillsDir);
    const hasAgentsMd = fs.existsSync(agentsMdPath);
    const hasCopilot = fs.existsSync(copilotPath);

    if (hasSkills) presentItems.push("agents-skills:.agents/skills");
    else missingItems.push("agents-skills:.agents/skills");

    if (hasAgentsMd) presentItems.push("agents-md:AGENTS.md");
    if (hasCopilot) presentItems.push("copilot-instructions:.github/copilot-instructions.md");

    const skillCount = hasSkills
      ? fs.readdirSync(projectSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length
      : 0;

    return {
      healthy: hasSkills,
      missingItems,
      presentItems,
      skillCount,
    };
  }
}
