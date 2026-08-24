import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const temporaryDirectories: string[] = [];
const installerPath = path.resolve(import.meta.dir, "..", "install.ts");
const cliPath = path.resolve(import.meta.dir, "..", "bin", "cli.ts");

function makeTemporaryDirectory(prefix: string) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function runCommand(entryPath: string, args: string[]) {
  const home = makeTemporaryDirectory("antigravity-home-");
  const project = makeTemporaryDirectory("antigravity-project-");
  fs.mkdirSync(path.join(project, ".git"), { recursive: true });

  const result = spawnSync(process.execPath, ["run", entryPath, ...args], {
    cwd: project,
    env: { ...process.env, HOME: home },
    encoding: "utf-8",
  });

  expect(result.status).toBe(0);
  return { home, project };
}

function expectGlobalOnly(home: string, project: string) {
  expect(fs.existsSync(path.join(home, ".gemini", "config", "skills"))).toBe(true);
  expect(fs.existsSync(path.join(home, ".gemini", "config", "plugins"))).toBe(true);
  expect(fs.existsSync(path.join(home, ".gemini", "config", "hooks.json"))).toBe(true);
  expect(fs.existsSync(path.join(project, ".agents"))).toBe(false);
  expect(fs.existsSync(path.join(project, ".git", "hooks", "pre-push"))).toBe(false);
}

function expectProjectOnly(home: string, project: string) {
  expect(fs.existsSync(path.join(project, ".agents", "skills"))).toBe(true);
  expect(fs.existsSync(path.join(project, ".git", "hooks", "pre-push"))).toBe(true);
  expect(fs.existsSync(path.join(home, ".gemini"))).toBe(false);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("installer scope flags", () => {
  test("direct installer --global installs only global capabilities", () => {
    const { home, project } = runCommand(installerPath, ["--global"]);
    expectGlobalOnly(home, project);
  });

  test("direct installer --project installs only project capabilities", () => {
    const { home, project } = runCommand(installerPath, ["--project"]);
    expectProjectOnly(home, project);
  });

  test("packaged CLI --global installs only global capabilities", () => {
    const { home, project } = runCommand(cliPath, ["install", "--global"]);
    expectGlobalOnly(home, project);
  });

  test("packaged CLI --project installs only project capabilities", () => {
    const { home, project } = runCommand(cliPath, ["install", "--project"]);
    expectProjectOnly(home, project);
  });
});
