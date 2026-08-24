import fs from "node:fs";
import path from "node:path";

export function copyDirRecursive(src: string, dest: string, dryRun = false): string[] {
  const copiedFiles: string[] = [];
  if (!fs.existsSync(src)) return copiedFiles;

  if (!dryRun) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copiedFiles.push(...copyDirRecursive(srcPath, destPath, dryRun));
    } else {
      if (!dryRun) {
        fs.copyFileSync(srcPath, destPath);
      }
      copiedFiles.push(destPath);
    }
  }

  return copiedFiles;
}

export function copySkillTree(srcSkillsDir: string, destSkillsDir: string, dryRun = false): { count: number; files: string[] } {
  if (!fs.existsSync(srcSkillsDir)) return { count: 0, files: [] };

  const files: string[] = [];
  let count = 0;
  const entries = fs.readdirSync(srcSkillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const srcSkillPath = path.join(srcSkillsDir, entry.name);
      const destSkillPath = path.join(destSkillsDir, entry.name);
      const copied = copyDirRecursive(srcSkillPath, destSkillPath, dryRun);
      files.push(...copied);
      count++;
    }
  }

  return { count, files };
}

export function writeSafely(filePath: string, content: string, dryRun = false): boolean {
  if (dryRun) return true;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
  return true;
}

export function appendOrPrependBlock(
  filePath: string,
  blockHeader: string,
  blockContent: string,
  dryRun = false
): boolean {
  if (dryRun) return true;

  let existing = "";
  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, "utf-8");
  }

  if (existing.includes(blockHeader)) {
    // Replace existing block
    const regex = new RegExp(`<!-- ${blockHeader}:start -->[\\s\\S]*?<!-- ${blockHeader}:end -->`, "g");
    if (regex.test(existing)) {
      const updated = existing.replace(regex, `<!-- ${blockHeader}:start -->\n${blockContent}\n<!-- ${blockHeader}:end -->`);
      fs.writeFileSync(filePath, updated, "utf-8");
      return true;
    }
  }

  const newContent = existing.length > 0
    ? `${existing.trim()}\n\n<!-- ${blockHeader}:start -->\n${blockContent}\n<!-- ${blockHeader}:end -->\n`
    : `<!-- ${blockHeader}:start -->\n${blockContent}\n<!-- ${blockHeader}:end -->\n`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, newContent, "utf-8");
  return true;
}

export function generateSuperpowersAgentPrompt(): string {
  return `# Antigravity Superpowers Core Instructions

You have access to 88+ Specialized Division Skills and 13 Binding Execution Protocols:
- **Engineering Division**: Architecture, RAG/LLMs, DevOps, Database Reliability, Mobile, Systems, Code Review, Minimal Changes.
- **Security Division**: AppSec, Threat Detection, Cloud Security, Pentesting, Secrets & Credentials Hygiene, Compliance.
- **QA & Testing Division**: Test Automation (Playwright/Cypress), API Testing, Reality Checking, Evidence Verification.
- **Design Division**: UI/UX Architecture, WCAG Accessibility, Persona Walkthroughs, Design Systems, Visual Storytelling.

## Core Rules
1. Classify task complexity and activate only relevant specialized roles (minimal routing).
2. Bun is the preferred runtime for JavaScript and TypeScript execution and testing.
3. Protect credentials, tokens, and private paths. Never leak local home paths or keys.
4. Verify all changes empirically before claiming completion.
`;
}
