import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dir, "..");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"),
) as {
  main?: string;
  module?: string;
  bin?: Record<string, string>;
};

function resolvePackagePath(relativePath: string) {
  return path.resolve(rootDir, relativePath);
}

describe("package runtime contract", () => {
  test("all declared package entrypoints exist", () => {
    const entrypoints = [
      packageJson.main,
      packageJson.module,
      ...Object.values(packageJson.bin ?? {}),
    ].filter((value): value is string => Boolean(value));

    expect(entrypoints.length).toBeGreaterThan(0);
    for (const entrypoint of entrypoints) {
      expect(fs.existsSync(resolvePackagePath(entrypoint))).toBe(true);
    }
  });

  test("declared CLI bins explicitly require the Bun runtime", () => {
    const bins = Object.values(packageJson.bin ?? {});
    expect(bins.length).toBeGreaterThan(0);

    for (const bin of bins) {
      const binPath = resolvePackagePath(bin);
      const firstLine = fs.readFileSync(binPath, "utf-8").split(/\r?\n/, 1)[0];
      expect(firstLine).toBe("#!/usr/bin/env bun");
    }
  });

  test("declared CLI bins are executable in the packed source tree", () => {
    for (const bin of Object.values(packageJson.bin ?? {})) {
      const mode = fs.statSync(resolvePackagePath(bin)).mode;
      expect(mode & 0o111).not.toBe(0);
    }
  });
});
