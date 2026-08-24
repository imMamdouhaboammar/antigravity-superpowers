import fs from "node:fs";
import path from "node:path";
import type { AgentAdapter, InstallContext, AdapterInstallResult, AdapterDetectionResult, AdapterVerifyResult } from "./types.ts";
import { copySkillTree, appendOrPrependBlock, writeSafely, generateSuperpowersAgentPrompt } from "./utils.ts";

export class CursorAdapter implements AgentAdapter {
  readonly name = "cursor" as const;
  readonly displayName = "Cursor IDE";

  detect(homeDir: string, projectDir: string): AdapterDetectionResult {
    const projectCursorDir = path.join(projectDir, ".cursor");
    const cursorRulesFile = path.join(projectDir, ".cursorrules");
    const globalCursor = path.join(homeDir, ".cursor");

    const detected = fs.existsSync(projectCursorDir) || fs.existsSync(cursorRulesFile) || fs.existsSync(globalCursor);
    return {
      detected,
      globalPath: globalCursor,
      projectPath: projectCursorDir,
      details: detected ? "Cursor configuration detected" : "Standard path .cursor / .cursorrules",
    };
  }

  async installGlobal(context: InstallContext): Promise<AdapterInstallResult> {
    const globalCursorSkills = path.join(context.homeDir, ".cursor", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const { count: installedSkillsCount, files: installedFiles } = copySkillTree(
      srcSkillsDir,
      globalCursorSkills,
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
    const cursorRulesDir = path.join(context.projectDir, ".cursor", "rules");
    const cursorRuleMdc = path.join(cursorRulesDir, "antigravity-superpowers.mdc");
    const cursorRulesPath = path.join(context.projectDir, ".cursorrules");
    const projectSkillsDir = path.join(context.projectDir, ".cursor", "skills");
    const srcSkillsDir = path.join(context.rootDir, "skills");

    const installedFiles: string[] = [];

    // 1. Copy project skills to .cursor/skills/
    const { count: installedSkillsCount, files: skillFiles } = copySkillTree(
      srcSkillsDir,
      projectSkillsDir,
      context.dryRun
    );
    installedFiles.push(...skillFiles);

    // 2. Create .cursor/rules/antigravity-superpowers.mdc rule file
    const mdcContent = `---
description: Autonomous Superpowers and Specialized Division Skills
globs: *
alwaysApply: true
---

${generateSuperpowersAgentPrompt()}
`;
    writeSafely(cursorRuleMdc, mdcContent, context.dryRun);
    installedFiles.push(cursorRuleMdc);

    // 3. Append / sync .cursorrules
    appendOrPrependBlock(
      cursorRulesPath,
      "antigravity-superpowers",
      generateSuperpowersAgentPrompt(),
      context.dryRun
    );
    installedFiles.push(cursorRulesPath);

    return {
      agent: this.name,
      displayName: this.displayName,
      installedFiles,
      installedSkillsCount,
    };
  }

  async verify(homeDir: string, projectDir: string): Promise<AdapterVerifyResult> {
    const cursorRulesPath = path.join(projectDir, ".cursorrules");
    const cursorRuleMdc = path.join(projectDir, ".cursor", "rules", "antigravity-superpowers.mdc");
    const projectSkillsDir = path.join(projectDir, ".cursor", "skills");

    const missingItems: string[] = [];
    const presentItems: string[] = [];

    const hasCursorRules = fs.existsSync(cursorRulesPath);
    const hasMdc = fs.existsSync(cursorRuleMdc);
    const hasSkills = fs.existsSync(projectSkillsDir);

    if (hasCursorRules) presentItems.push("cursorrules:.cursorrules");
    if (hasMdc) presentItems.push("cursor-mdc:.cursor/rules/antigravity-superpowers.mdc");
    if (hasSkills) presentItems.push("cursor-skills:.cursor/skills");

    if (!hasCursorRules && !hasMdc) {
      missingItems.push("cursor-rules:.cursorrules or .cursor/rules/antigravity-superpowers.mdc");
    }

    const skillCount = hasSkills
      ? fs.readdirSync(projectSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length
      : 0;

    return {
      healthy: hasCursorRules || hasMdc || hasSkills,
      missingItems,
      presentItems,
      skillCount,
    };
  }
}
