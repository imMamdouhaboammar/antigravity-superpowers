import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const temporaryDirectories: string[] = [];
const installerPath = path.resolve(import.meta.dir, "..", "install.ts");

function makeTemporaryDirectory(prefix: string) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function runInstaller(args: string[]) {
  const home = makeTemporaryDirectory("antigravity-home-");
  const project = makeTemporaryDirectory("antigravity-project-");
  const result = spawnSync(process.execPath, ["run", installerPath, ...args], {
    cwd: project,
    env: { ...process.env, HOME: home },
    encoding: "utf-8",
  });

  expect(result.status).toBe(0);
  return { home, project };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("installer scope flags", () => {
  test("--global installs only global capabilities", () => {
    const { home, project } = runInstaller(["--global"]);

    expect(fs.existsSync(path.join(home, ".gemini", "config", "skills"))).toBe(true);
    expect(fs.existsSync(path.join(home, ".gemini", "config", "plugins"))).toBe(true);
    expect(fs.existsSync(path.join(project, ".agents"))).toBe(false);
  });

  test("--project installs only project capabilities", () => {
    const { home, project } = runInstaller(["--project"]);

    expect(fs.existsSync(path.join(project, ".agents", "skills"))).toBe(true);
    expect(fs.existsSync(path.join(home, ".gemini"))).toBe(false);
  });
});
