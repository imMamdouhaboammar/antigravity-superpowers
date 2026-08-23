import fs from "node:fs";
import path from "node:path";

export interface SkillTreeDiff {
  missingFromMirror: string[];
  extraInMirror: string[];
  changed: string[];
}

function listFiles(root: string) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`Skill tree directory not found: ${root}`);
  }

  const files: string[] = [];

  function visit(directory: string, relativeDirectory = "") {
    const entries = fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const relativePath = path.join(relativeDirectory, entry.name);
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath.split(path.sep).join("/"));
      }
    }
  }

  visit(root);
  return files;
}

export function compareSkillTrees(primaryDir: string, mirrorDir: string): SkillTreeDiff {
  const primaryFiles = listFiles(primaryDir);
  const mirrorFiles = listFiles(mirrorDir);
  const primarySet = new Set(primaryFiles);
  const mirrorSet = new Set(mirrorFiles);

  const missingFromMirror = primaryFiles.filter((file) => !mirrorSet.has(file));
  const extraInMirror = mirrorFiles.filter((file) => !primarySet.has(file));
  const changed = primaryFiles.filter((file) => {
    if (!mirrorSet.has(file)) return false;
    return !fs.readFileSync(path.join(primaryDir, file)).equals(
      fs.readFileSync(path.join(mirrorDir, file)),
    );
  });

  return { missingFromMirror, extraInMirror, changed };
}

function printDifferences(diff: SkillTreeDiff) {
  const groups: Array<[string, string[]]> = [
    ["Missing from .agents/skills", diff.missingFromMirror],
    ["Extra in .agents/skills", diff.extraInMirror],
    ["Content differs", diff.changed],
  ];

  for (const [label, files] of groups) {
    if (files.length === 0) continue;
    console.error(`${label}:`);
    for (const file of files) console.error(`  - ${file}`);
  }
}

if (import.meta.main) {
  const rootDir = path.resolve(import.meta.dir, "..");
  const diff = compareSkillTrees(
    path.join(rootDir, "skills"),
    path.join(rootDir, ".agents", "skills"),
  );
  const differenceCount =
    diff.missingFromMirror.length + diff.extraInMirror.length + diff.changed.length;

  if (differenceCount > 0) {
    console.error("Skill mirror drift detected.");
    printDifferences(diff);
    process.exit(1);
  }

  console.log("Skill mirror is in sync.");
}
