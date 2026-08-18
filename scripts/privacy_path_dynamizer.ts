import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ScanOptions {
  fix?: boolean;
  verbose?: boolean;
  targetDir?: string;
  homeDir?: string;
  username?: string;
  log?: (message: string) => void;
}

export interface FlaggedFile {
  file: string;
  line: number;
}

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
]);

const SCOPED_IGNORE_DIRS = new Set([
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

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function replaceLocalPaths(line: string, homeRegex: RegExp, userPathRegex: RegExp): string {
  homeRegex.lastIndex = 0;
  userPathRegex.lastIndex = 0;
  return line.replace(homeRegex, "~").replace(userPathRegex, "~");
}

function atomicWrite(filePath: string, content: string): void {
  const tempPath = `${filePath}.antigravity-superpowers.tmp-${process.pid}`;
  const mode = fs.statSync(filePath).mode;
  try {
    fs.writeFileSync(tempPath, content, { encoding: "utf-8", mode });
    fs.renameSync(tempPath, filePath);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

export function scanAndDynamizePaths(options: ScanOptions = {}) {
  const targetDir = path.resolve(options.targetDir || process.cwd());
  const homeDir = options.homeDir ?? os.homedir();
  const username = options.username ?? os.userInfo().username ?? process.env.USER ?? "";
  const log = options.log ?? console.log;

  log(`${colors.cyan}${colors.bright}Antigravity Privacy & Path Dynamizer${colors.reset}`);
  log(`Scanning repository root without printing local identity details.`);

  if (!homeDir || homeDir === "/" || !username) {
    log(`${colors.yellow}Home directory or username could not be determined. Path scan skipped.${colors.reset}`);
    return { issuesCount: 0, fixedCount: 0, flaggedFiles: [] as FlaggedFile[] };
  }

  const homeRegex = new RegExp(`${escapeRegExp(homeDir)}(?=$|[/\\\\])`, "g");
  const userPathRegex = new RegExp(
    `(?:/Users|/home)/${escapeRegExp(username)}(?=$|[/\\\\])`,
    "g",
  );

  let issuesCount = 0;
  let fixedCount = 0;
  const flaggedFiles: FlaggedFile[] = [];

  function processFile(filePath: string) {
    const relPath = path.relative(targetDir, filePath);
    if (IGNORE_FILES.has(path.basename(filePath))) return;
    if (filePath.endsWith("privacy_path_dynamizer.ts")) return;

    let content: string;
    try {
      const buffer = fs.readFileSync(filePath);
      if (buffer.includes(0)) return;
      content = buffer.toString("utf-8");
    } catch {
      if (options.verbose) log(`${colors.yellow}Skipped unreadable file:${colors.reset} ${relPath}`);
      return;
    }

    const lines = content.split("\n");
    let modified = false;
    const newLines = lines.map((line, index) => {
      homeRegex.lastIndex = 0;
      userPathRegex.lastIndex = 0;
      const matches = homeRegex.test(line) || userPathRegex.test(line);
      homeRegex.lastIndex = 0;
      userPathRegex.lastIndex = 0;

      if (!matches) return line;

      issuesCount++;
      flaggedFiles.push({ file: relPath, line: index + 1 });
      if (!options.fix) return line;

      const fixedLine = replaceLocalPaths(line, homeRegex, userPathRegex);
      if (fixedLine !== line) {
        modified = true;
        fixedCount++;
      }
      return fixedLine;
    });

    if (options.fix && modified) {
      atomicWrite(filePath, newLines.join("\n"));
      log(`${colors.green}Sanitized:${colors.reset} ${relPath}`);
    }
  }

  function walkDir(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      if (options.verbose) log(`${colors.yellow}Skipped unreadable directory.${colors.reset}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(targetDir, fullPath).split(path.sep).join("/");
      if (IGNORE_DIRS.has(entry.name) || SCOPED_IGNORE_DIRS.has(relativePath)) continue;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walkDir(fullPath);
      else if (entry.isFile()) processFile(fullPath);
    }
  }

  walkDir(targetDir);

  if (flaggedFiles.length > 0) {
    log(`${colors.yellow}Detected ${flaggedFiles.length} local-path occurrence(s):${colors.reset}`);
    for (const item of flaggedFiles.slice(0, 15)) {
      log(`  ${colors.red}${item.file}:${item.line}${colors.reset}`);
    }
    if (flaggedFiles.length > 15) log(`  ... and ${flaggedFiles.length - 15} more occurrence(s).`);

    if (!options.fix) {
      log(`${colors.red}Privacy check failed.${colors.reset} Run with --fix to replace exact local-home prefixes with '~'.`);
    } else {
      log(`${colors.green}Sanitized ${fixedCount} occurrence(s).${colors.reset} Review the diff before committing.`);
    }
  } else {
    log(`${colors.green}No matching local-home paths were detected by this scanner.${colors.reset}`);
  }

  return { issuesCount, fixedCount, flaggedFiles };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const isFix = args.includes("--fix");
  const isCheck = args.includes("--check");
  const verbose = args.includes("--verbose");

  const result = scanAndDynamizePaths({ fix: isFix, verbose });
  if (isCheck && result.issuesCount > 0 && !isFix) process.exit(1);
}
