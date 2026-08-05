import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  setupAntigravityHooksConfig,
  setupGitPrePushHook,
} from "../install";

const temporaryDirectories: string[] = [];

function makeTemporaryDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "antigravity-hooks-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("setupGitPrePushHook", () => {
  test("preserves an existing pre-push hook", () => {
    const project = makeTemporaryDirectory();
    const hooksDirectory = path.join(project, ".git", "hooks");
    fs.mkdirSync(hooksDirectory, { recursive: true });
    const hookPath = path.join(hooksDirectory, "pre-push");
    const existingHook = "#!/bin/sh\necho existing\n";
    fs.writeFileSync(hookPath, existingHook);

    expect(setupGitPrePushHook(project)).toBe(false);
    expect(fs.readFileSync(hookPath, "utf-8")).toBe(existingHook);
  });

  test("installs a non-mutating, quoted privacy check", () => {
    const root = makeTemporaryDirectory();
    const project = path.join(root, "project with spaces");
    fs.mkdirSync(path.join(project, ".git"), { recursive: true });

    expect(setupGitPrePushHook(project)).toBe(true);
    const hook = fs.readFileSync(path.join(project, ".git", "hooks", "pre-push"), "utf-8");

    expect(hook).toContain(" --check");
    expect(hook).not.toContain(" --fix");
    expect(hook).toContain("'" + path.join(project, "scripts", "privacy_path_dynamizer.ts") + "'");
    expect(hook).toContain("exit 1");
  });
});

describe("setupAntigravityHooksConfig", () => {
  test("creates missing parent directories and preserves unrelated hooks", () => {
    const home = makeTemporaryDirectory();
    const hooksPath = path.join(home, ".gemini", "config", "hooks.json");
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    fs.writeFileSync(
      hooksPath,
      JSON.stringify({ hooks: [{ name: "existing", events: ["SessionStart"], command: "echo ok" }], custom: true }),
    );

    setupAntigravityHooksConfig(home);

    const config = JSON.parse(fs.readFileSync(hooksPath, "utf-8"));
    expect(config.custom).toBe(true);
    expect(config.hooks.find((hook: { name: string }) => hook.name === "existing")).toBeDefined();
    const privacyHook = config.hooks.find(
      (hook: { name: string }) => hook.name === "antigravity-privacy-path-dynamizer",
    );
    expect(privacyHook.command).toContain(" --check");
    expect(privacyHook.command).not.toContain(" --fix");
  });

  test("fails safely instead of overwriting invalid JSON", () => {
    const home = makeTemporaryDirectory();
    const hooksPath = path.join(home, ".gemini", "config", "hooks.json");
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    const invalidJson = "{ definitely-not-json";
    fs.writeFileSync(hooksPath, invalidJson);

    expect(() => setupAntigravityHooksConfig(home)).toThrow("Refusing to overwrite invalid hooks configuration");
    expect(fs.readFileSync(hooksPath, "utf-8")).toBe(invalidJson);
  });
});
