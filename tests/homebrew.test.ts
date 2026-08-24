import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

describe("Homebrew Formula", () => {
  const rootDir = path.resolve(__dirname, "..");
  const formulaPath = path.join(rootDir, "Formula", "antigravity-superpowers.rb");

  it("exists at Formula/antigravity-superpowers.rb", () => {
    expect(fs.existsSync(formulaPath)).toBe(true);
  });

  it("contains required Homebrew formula attributes", () => {
    const content = fs.readFileSync(formulaPath, "utf-8");
    expect(content).toContain("class AntigravitySuperpowers < Formula");
    expect(content).toContain('desc "');
    expect(content).toContain('homepage "');
    expect(content).toContain('url "');
    expect(content).toContain('license "MIT"');
    expect(content).toContain('def install');
    expect(content).toContain('bin/"antigravity-superpowers"');
    expect(content).toContain('bin/"agy-superpowers"');
    expect(content).toContain('test do');
  });
});
