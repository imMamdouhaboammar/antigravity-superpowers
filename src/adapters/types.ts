export type AgentType =
  | "antigravity"
  | "claude"
  | "cursor"
  | "opencode"
  | "windsurf"
  | "cline"
  | "universal";

export interface InstallContext {
  rootDir: string;
  homeDir: string;
  projectDir: string;
  dryRun?: boolean;
  force?: boolean;
}

export interface AdapterInstallResult {
  agent: AgentType;
  displayName: string;
  installedFiles: string[];
  installedSkillsCount: number;
  skipped?: boolean;
  warnings?: string[];
}

export interface AdapterDetectionResult {
  detected: boolean;
  globalPath?: string;
  projectPath?: string;
  details?: string;
}

export interface AdapterVerifyResult {
  healthy: boolean;
  missingItems: string[];
  presentItems: string[];
  skillCount: number;
}

export interface AgentAdapter {
  name: AgentType;
  displayName: string;
  detect(homeDir: string, projectDir: string): AdapterDetectionResult;
  installGlobal(context: InstallContext): Promise<AdapterInstallResult>;
  installProject(context: InstallContext): Promise<AdapterInstallResult>;
  verify(homeDir: string, projectDir: string): Promise<AdapterVerifyResult>;
}
