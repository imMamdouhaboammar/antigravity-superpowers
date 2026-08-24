import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { compareSkillTrees } from "../scripts/check_skill_mirror";

function withFixture(run: (root: string) => void) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skill-mirror-"));
  try {
    run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function writeFile(root: string, relativePath: string, content: string) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

describe("skill mirror consistency", () => {
  test("reports missing, extra, and changed files deterministically", () => {
    withFixture((root) => {
      const primary = path.join(root, "skills");
      const mirror = path.join(root, ".agents", "skills");

      writeFile(primary, "same/SKILL.md", "same\n");
      writeFile(mirror, "same/SKILL.md", "same\n");
      writeFile(primary, "missing/SKILL.md", "primary only\n");
      writeFile(mirror, "extra/SKILL.md", "mirror only\n");
      writeFile(primary, "changed/SKILL.md", "primary\n");
      writeFile(mirror, "changed/SKILL.md", "mirror\n");

      expect(compareSkillTrees(primary, mirror)).toEqual({
        missingFromMirror: ["missing/SKILL.md"],
        extraInMirror: ["extra/SKILL.md"],
        changed: ["changed/SKILL.md"],
      });
    });
  });

  test("returns no differences for identical trees", () => {
    withFixture((root) => {
      const primary = path.join(root, "skills");
      const mirror = path.join(root, ".agents", "skills");

      writeFile(primary, "one/SKILL.md", "one\n");
      writeFile(mirror, "one/SKILL.md", "one\n");
      writeFile(primary, "nested/reference.md", "reference\n");
      writeFile(mirror, "nested/reference.md", "reference\n");

      expect(compareSkillTrees(primary, mirror)).toEqual({
        missingFromMirror: [],
        extraInMirror: [],
        changed: [],
      });
    });
  });
});
