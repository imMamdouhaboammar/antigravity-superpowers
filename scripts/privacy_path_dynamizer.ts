import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ScanOptions {
  fix?: boolean;
  verbose?: boolean;
  targetDir?: string;
}

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",  red: "\x1b[31m",
};

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".gemini/antigravity/brain",
  ".gemini/antigravity/logs",
]);

const IGNORE_FILES = new Set([
  "bun.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  ".DS_Store",
]);

export function scanAndDynamizePaths(options: ScanOptions = {}) {
  const targetDir = path.resolve(options.targetDir || process.cwd());
  const homeDir = os.homedir();
  const username = os.userInfo().username || process.env.USER || "";

  console.log(`${colors.cyan}${colors.bright}🛡️ Antigravity Privacy & Path Dynamizer Engine${colors.reset}`);
  console.log(`Target Directory: ${targetDir}`);
  console.log(`Detected Home Dir: ${homeDir}`);
  console.log(`Detected Username: ${username}\n`);

  if (!homeDir || homeDir === "/" || !username) {
    console.log(`${colors.yellow}⚠️ Home directory or username undetermined. Skipping path scan.${colors.reset}`);
    return { issuesCount: 0, fixedCount: 0 };
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const homeRegex = new RegExp(escapeRegExp(homeDir), "g");
  const userPathRegex = new RegExp(`/Users/${escapeRegExp(username)}|/home/${escapeRegExp(username)}`, "g");

  let issuesCount = 0;
  let fixedCount = 0;
  const flaggedFiles: { file: string; line: number; content: string }[] = [];

  function processFile(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    const relPath = path.relative(targetDir, filePath);

    // Skip ignored files
    if (IGNORE_FILES.has(path.basename(filePath))) return;

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      let modified = false;
      const newLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (homeRegex.test(line) || userPathRegex.test(line)) {
          // Reset regex state
          homeRegex.lastIndex = 0;
          userPathRegex.lastIndex = 0;

          // Ignore self-references in this privacy dynamizer script itself
          if (filePath.endsWith("privacy_path_dynamizer.ts")) {
            newLines.push(line);
            continue;
          }

          issuesCount++;
          flaggedFiles.push({ file: relPath, line: i + 1, content: line.trim() });

          if (options.fix) {
            let fixedLine = line;
            if (ext === ".ts" || ext === ".js" || ext === ".json") {
              fixedLine = fixedLine.replace(homeRegex, `path.join(os.homedir())`);
              fixedLine = fixedLine.replace(userPathRegex, `os.homedir()`);
            } else if (ext === ".sh" || ext === ".bash") {
              fixedLine = fixedLine.replace(homeRegex, `"$HOME"`);
              fixedLine = fixedLine.replace(userPathRegex, `"$HOME"`);
            } else if (ext === ".md") {
              fixedLine = fixedLine.replace(homeRegex, `~`);
              fixedLine = fixedLine.replace(userPathRegex, `~`);
            } else {
              fixedLine = fixedLine.replace(homeRegex, `$HOME`);
              fixedLine = fixedLine.replace(userPathRegex, `$HOME`);
            }

            if (fixedLine !== line) {
              modified = true;
              fixedCount++;
              newLines.push(fixedLine);
            } else {
              newLines.push(line);
            }
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      }

      if (options.fix && modified) {
        fs.writeFileSync(filePath, newLines.join("\n"), "utf-8");
        console.log(`  ${colors.green}✓ Dynamized paths in:${colors.reset} ${relPath}`);
      }
    } catch (e) {
      // Ignore binary files or unreadable files
    }
  }

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        processFile(fullPath);
      }
    }
  }

  walkDir(targetDir);

  if (flaggedFiles.length > 0) {
    console.log(`${colors.yellow}⚠️ Detected ${flaggedFiles.length} hardcoded local user paths across repository:${colors.reset}\n`);
    for (const item of flaggedFiles.slice(0, 15)) {
      console.log(`  ${colors.red}${item.file}:${item.line}${colors.reset} -> ${item.content}`);
    }
    if (flaggedFiles.length > 15) {
      console.log(`  ... and ${flaggedFiles.length - 15} more instances.`);
    }

    if (!options.fix) {
      console.log(`\n${colors.red}❌ PRE-PUSH CHECK FAILED:${colors.reset} Hardcoded local paths found!`);
      console.log(`${colors.yellow}Run 'bun run scripts/privacy_path_dynamizer.ts --fix' or 'antigravity-superpowers sanitize' to automatically convert them to dynamic paths.${colors.reset}\n`);
    } else {
      console.log(`\n${colors.green}✅ FIXED:${colors.reset} Dynamized ${fixedCount} hardcoded paths! Repository is clean and safe for GitHub Public release.\n`);
    }
  } else {
    console.log(`${colors.green}✅ PERFECT:${colors.reset} Zero hardcoded personal user paths detected! Repository is 100% clean and dynamic for GitHub Public release.\n`);
  }

  return { issuesCount, fixedCount, flaggedFiles };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const isFix = args.includes("--fix");
  const isCheck = args.includes("--check");

  const result = scanAndDynamizePaths({ fix: isFix });

  if (isCheck && result.issuesCount > 0 && !isFix) {
    process.exit(1);
  }
}
