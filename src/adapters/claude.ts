import fs from "node:fs";
import path from "node:path";
import type { AgentAdapter, InstallContext, AdapterInstallResult, AdapterDetectionResult, AdapterVerifyResult } from "./types.ts";
import { copySkillTree, appendOrPrependBlock, generateSuperpowersAgentPrompt } from "./utils.ts";

export class ClaudeAdapter implements AgentAdapter {
  readonly name = "claude" as const;
  readonly displayName = "Anthropic Claude Code";

  detect(homeDir: string, projectDir: string): AdapterDetectionResult {
    const globalClaude = path.join(homeDir, ".claude");
    const projectClaude = path.join(projectDir, ".claude");
    const claudeMd = path.join(projectDir, "CLAUDE.md");

    const detected = fs.existsSync(globalClaude) || fs.existsSync(projectClaude) || fs.existsSync(claudeMd);
    return {
      detected,
      globalPath: globalClaude,
      projectPath: projectClaude,
      details: detected ? "Claude Code configuration detected" : "Standard path ~/.claude",
    };
  }

  async installGlobal(context: InstallContext): Promise<AdapterInstallResult> {
    const globalClaudeSkills = path.join(context.homeDir, ".claude", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const { count: installedSkillsCount, files: installedFiles } = copySkillTree(
      srcSkillsDir,
      globalClaudeSkills,
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
    const projectClaudeSkills = path.join(context.projectDir, ".claude", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");
    const claudeMdPath = path.join(context.projectDir, "CLAUDE.md");

    const { count: installedSkillsCount, files: installedFiles } = copySkillTree(
      srcSkillsDir,
      projectClaudeSkills,
      context.dryRun
    );

    // Inject Superpowers into CLAUDE.md
    appendOrPrependBlock(
      claudeMdPath,
      "antigravity-superpowers",
      generateSuperpowersAgentPrompt(),
      context.dryRun
    );
    installedFiles.push(claudeMdPath);

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async verify(homeDir: string, projectDir: string): Promise<AdapterVerifyResult> {
    const globalSkillsDir = path.join(homeDir, ".claude", "skills");
    const projectSkillsDir = path.join(projectDir, ".claude", "skills");
    const claudeMdPath = path.join(projectDir, "CLAUDE.md");

    const missingItems: string[] = [];
    const presentItems: string[] = [];

    const hasGlobal = fs.existsSync(globalSkillsDir);
    const hasProject = fs.existsSync(projectSkillsDir);
    const hasClaudeMd = fs.existsSync(claudeMdPath);

    if (hasGlobal) presentItems.push("global-skills:~/.claude/skills");
    else missingItems.push("global-skills:~/.claude/skills");

    if (hasClaudeMd) presentItems.push("project-instructions:CLAUDE.md");
    if (hasProject) presentItems.push("project-skills:.claude/skills");

    const skillCount = hasGlobal
      ? fs.readdirSync(globalSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length
      : (hasProject ? fs.readdirSync(projectSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length : 0);

    return {
      healthy: hasGlobal || hasProject || hasClaudeMd,
      missingItems,
      presentItems,
      skillCount,
    };
  }
}
