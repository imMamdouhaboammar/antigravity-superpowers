import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  getAllAdapters,
  getAdapter,
  detectInstalledAgents,
  installToAgents,
  AntigravityAdapter,
  ClaudeAdapter,
  CursorAdapter,
  OpenCodeAdapter,
  WindsurfAdapter,
  ClineAdapter,
  UniversalAdapter,
} from "../src/adapters/index.ts";

const FIXTURE_ROOT = path.resolve(__dirname, "..");

describe("Multi-Agent Adapters Framework", () => {
  let tempHome: string;
  let tempProject: string;

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "agent-home-"));
    tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "agent-project-"));
  });

  afterEach(() => {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempProject, { recursive: true, force: true });
  });

  it("registers all supported AI agents", () => {
    const adapters = getAllAdapters();
    expect(adapters.length).toBeGreaterThanOrEqual(7);
    const names = adapters.map((a) => a.name);
    expect(names).toContain("antigravity");
    expect(names).toContain("claude");
    expect(names).toContain("cursor");
    expect(names).toContain("opencode");
    expect(names).toContain("windsurf");
    expect(names).toContain("cline");
    expect(names).toContain("universal");
  });

  it("resolves adapters by name case-insensitively", () => {
    expect(getAdapter("Claude")?.name).toBe("claude");
    expect(getAdapter("CURSOR")?.name).toBe("cursor");
    expect(getAdapter("antigravity")?.name).toBe("antigravity");
    expect(getAdapter("nonexistent")).toBeUndefined();
  });

  it("detects agent environment signatures accurately", () => {
    const claudeDir = path.join(tempHome, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });

    const detections = detectInstalledAgents(tempHome, tempProject);
    const claudeDetection = detections.find((d) => d.adapter.name === "claude");
    expect(claudeDetection?.detection.detected).toBe(true);

    const cursorDetection = detections.find((d) => d.adapter.name === "cursor");
    expect(cursorDetection?.detection.detected).toBe(false);
  });

  it("installs Claude Code adapter global and project configurations", async () => {
    const adapter = new ClaudeAdapter();
    const result = await adapter.installProject({
      rootDir: FIXTURE_ROOT,
      homeDir: tempHome,
      projectDir: tempProject,
    });

    expect(result.installedSkillsCount).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(tempProject, ".claude", "skills"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, "CLAUDE.md"))).toBe(true);

    const claudeMd = fs.readFileSync(path.join(tempProject, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("antigravity-superpowers");

    const verify = await adapter.verify(tempHome, tempProject);
    expect(verify.healthy).toBe(true);
  });

  it("installs Cursor adapter project rules and mdc file", async () => {
    const adapter = new CursorAdapter();
    const result = await adapter.installProject({
      rootDir: FIXTURE_ROOT,
      homeDir: tempHome,
      projectDir: tempProject,
    });

    expect(result.installedSkillsCount).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(tempProject, ".cursor", "rules", "antigravity-superpowers.mdc"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, ".cursorrules"))).toBe(true);

    const cursorRules = fs.readFileSync(path.join(tempProject, ".cursorrules"), "utf-8");
    expect(cursorRules).toContain("antigravity-superpowers");

    const verify = await adapter.verify(tempHome, tempProject);
    expect(verify.healthy).toBe(true);
  });

  it("installs OpenCode adapter configurations", async () => {
    const adapter = new OpenCodeAdapter();
    await adapter.installProject({
      rootDir: FIXTURE_ROOT,
      homeDir: tempHome,
      projectDir: tempProject,
    });

    expect(fs.existsSync(path.join(tempProject, ".opencode", "skills"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, ".opencode", "superpowers.md"))).toBe(true);

    const verify = await adapter.verify(tempHome, tempProject);
    expect(verify.healthy).toBe(true);
  });

  it("installs Windsurf and Cline adapters", async () => {
    const windsurf = new WindsurfAdapter();
    await windsurf.installProject({
      rootDir: FIXTURE_ROOT,
      homeDir: tempHome,
      projectDir: tempProject,
    });
    expect(fs.existsSync(path.join(tempProject, ".windsurfrules"))).toBe(true);

    const cline = new ClineAdapter();
    await cline.installProject({
      rootDir: FIXTURE_ROOT,
      homeDir: tempHome,
      projectDir: tempProject,
    });
    expect(fs.existsSync(path.join(tempProject, ".clinerules"))).toBe(true);
  });

  it("installs Universal adapter (AGENTS.md + Copilot)", async () => {
    const adapter = new UniversalAdapter();
    await adapter.installProject({
      rootDir: FIXTURE_ROOT,
      homeDir: tempHome,
      projectDir: tempProject,
    });

    expect(fs.existsSync(path.join(tempProject, ".agents", "skills"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, ".github", "copilot-instructions.md"))).toBe(true);
  });

  it("supports batch installation across all agents with --all-agents", async () => {
    const results = await installToAgents({
      allAgents: true,
      project: true,
      global: false,
      rootDir: FIXTURE_ROOT,
      targetDir: tempProject,
    });

    expect(results.length).toBe(7);
    expect(fs.existsSync(path.join(tempProject, "CLAUDE.md"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, ".cursorrules"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, ".windsurfrules"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, ".clinerules"))).toBe(true);
    expect(fs.existsSync(path.join(tempProject, "AGENTS.md"))).toBe(true);
  });

  it("respects dry-run mode without modifying filesystem", async () => {
    const results = await installToAgents({
      allAgents: true,
      project: true,
      global: true,
      dryRun: true,
      rootDir: FIXTURE_ROOT,
      targetDir: tempProject,
    });

    expect(results.length).toBe(7);
    expect(fs.existsSync(path.join(tempProject, "CLAUDE.md"))).toBe(false);
    expect(fs.existsSync(path.join(tempProject, ".cursorrules"))).toBe(false);
  });
});
