import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanAndDynamizePaths } from "./privacy_path_dynamizer";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "privacy-dynamizer-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("scanAndDynamizePaths", () => {
  test("does not print the home path, username, or matching source content", () => {
    const root = createTempDir();
    const homeDir = "/home/private-user";
    const secretLine = `${homeDir}/project token=do-not-print`;
    fs.writeFileSync(path.join(root, "config.txt"), secretLine);
    const messages: string[] = [];

    const result = scanAndDynamizePaths({
      targetDir: root,
      homeDir,
      username: "private-user",
      log: (message) => messages.push(message),
    });

    expect(result.issuesCount).toBe(1);
    const output = messages.join("\n");
    expect(output).not.toContain(homeDir);
    expect(output).not.toContain("private-user");
    expect(output).not.toContain("do-not-print");
    expect(output).toContain("config.txt:1");
  });

  test("preserves valid JSON while replacing an exact local-home prefix", () => {
    const root = createTempDir();
    const homeDir = "/Users/private-user";
    const filePath = path.join(root, "config.json");
    fs.writeFileSync(filePath, JSON.stringify({ workspace: `${homeDir}/repo` }, null, 2));

    const result = scanAndDynamizePaths({
      targetDir: root,
      homeDir,
      username: "private-user",
      fix: true,
      log: () => {},
    });

    expect(result.fixedCount).toBe(1);
    expect(JSON.parse(fs.readFileSync(filePath, "utf-8"))).toEqual({ workspace: "~/repo" });
  });

  test("skips symlinks and binary files", () => {
    const root = createTempDir();
    const outside = createTempDir();
    const homeDir = "/home/private-user";
    const outsideFile = path.join(outside, "outside.txt");
    fs.writeFileSync(outsideFile, `${homeDir}/outside`);
    fs.symlinkSync(outsideFile, path.join(root, "linked.txt"));
    fs.writeFileSync(path.join(root, "binary.bin"), Buffer.from([0, 1, 2, ...Buffer.from(homeDir)]));

    const result = scanAndDynamizePaths({
      targetDir: root,
      homeDir,
      username: "private-user",
      fix: true,
      log: () => {},
    });

    expect(result.issuesCount).toBe(0);
    expect(fs.readFileSync(outsideFile, "utf-8")).toBe(`${homeDir}/outside`);
  });
});
