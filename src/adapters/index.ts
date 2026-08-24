import path from "node:path";
import os from "node:os";
import type { AgentAdapter, AgentType, InstallContext, AdapterInstallResult, AdapterDetectionResult } from "./types.ts";
import { AntigravityAdapter } from "./antigravity.ts";
import { ClaudeAdapter } from "./claude.ts";
import { CursorAdapter } from "./cursor.ts";
import { OpenCodeAdapter } from "./opencode.ts";
import { WindsurfAdapter } from "./windsurf.ts";
import { ClineAdapter } from "./cline.ts";
import { UniversalAdapter } from "./universal.ts";

export * from "./types.ts";
export * from "./utils.ts";
export {
  AntigravityAdapter,
  ClaudeAdapter,
  CursorAdapter,
  OpenCodeAdapter,
  WindsurfAdapter,
  ClineAdapter,
  UniversalAdapter,
};

const ALL_ADAPTERS: AgentAdapter[] = [
  new AntigravityAdapter(),
  new ClaudeAdapter(),
  new CursorAdapter(),
  new OpenCodeAdapter(),
  new WindsurfAdapter(),
  new ClineAdapter(),
  new UniversalAdapter(),
];

export function getAllAdapters(): AgentAdapter[] {
  return [...ALL_ADAPTERS];
}

export function getAdapter(name: string): AgentAdapter | undefined {
  const normalized = name.toLowerCase().trim();
  return ALL_ADAPTERS.find(
    (adapter) => adapter.name === normalized || adapter.name.includes(normalized)
  );
}

export function detectInstalledAgents(
  homeDir: string = os.homedir(),
  projectDir: string = process.cwd()
): Array<{ adapter: AgentAdapter; detection: AdapterDetectionResult }> {
  return ALL_ADAPTERS.map((adapter) => ({
    adapter,
    detection: adapter.detect(homeDir, projectDir),
  }));
}

export interface MultiAgentInstallOptions {
  agents?: string[];
  allAgents?: boolean;
  global?: boolean;
  project?: boolean;
  targetDir?: string;
  rootDir?: string;
  dryRun?: boolean;
  force?: boolean;
}

export async function installToAgents(
  options: MultiAgentInstallOptions = {}
): Promise<AdapterInstallResult[]> {
  const homeDir = os.homedir();
  const projectDir = path.resolve(options.targetDir || process.cwd());
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, "..", ".."));

  const context: InstallContext = {
    rootDir,
    homeDir,
    projectDir,
    dryRun: options.dryRun,
    force: options.force,
  };

  const installGlobal = options.global !== false;
  const installProject = options.project !== false;

  let targetAdapters: AgentAdapter[] = [];

  if (options.allAgents) {
    targetAdapters = getAllAdapters();
  } else if (options.agents && options.agents.length > 0) {
    for (const name of options.agents) {
      if (name.toLowerCase() === "all") {
        targetAdapters = getAllAdapters();
        break;
      }
      const adapter = getAdapter(name);
      if (adapter) {
        targetAdapters.push(adapter);
      } else {
        console.warn(`⚠ Unknown agent adapter: ${name}`);
      }
    }
  } else {
    // Default: Antigravity + detected agents or Antigravity default
    const antigravity = getAdapter("antigravity");
    if (antigravity) targetAdapters.push(antigravity);
  }

  const results: AdapterInstallResult[] = [];

  for (const adapter of targetAdapters) {
    const installedFiles: string[] = [];
    let installedSkillsCount = 0;

    if (installGlobal) {
      const globalRes = await adapter.installGlobal(context);
      installedFiles.push(...globalRes.installedFiles);
      installedSkillsCount = Math.max(installedSkillsCount, globalRes.installedSkillsCount);
    }

    if (installProject) {
      const projectRes = await adapter.installProject(context);
      installedFiles.push(...projectRes.installedFiles);
      installedSkillsCount = Math.max(installedSkillsCount, projectRes.installedSkillsCount);
    }

    results.push({
      agent: adapter.name,
      displayName: adapter.displayName,
      installedFiles,
      installedSkillsCount,
    });
  }

  return results;
}
