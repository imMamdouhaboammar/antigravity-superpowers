export type TaskComplexity = "trivial" | "standard" | "complex" | "high-risk";

export interface RoutingDecision {
  complexity: TaskComplexity;
  skills: string[];
  reasons: string[];
}

const includesAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

const SECURITY_TERMS = [
  "security",
  "vulnerability",
  "auth",
  "oauth",
  "credential",
  "secret",
  "permission",
  "injection",
  "xss",
  "csrf",
  "path traversal",
  "sensitive",
];

const DEBUG_TERMS = ["debug", "failing test", "test failure", "stack trace", "traceback", "regression", "bug"];
const MAJOR_FEATURE_TERMS = [
  "major feature",
  "design and implement",
  "architecture",
  "new module",
  "new subsystem",
  "end-to-end",
  "enterprise grade",
];
const FRONTEND_TERMS = ["frontend", "react", "next.js", "nextjs", "vue", "angular", "component", "ui"];
const DESIGN_TERMS = ["ux", "visual design", "design system", "wireframe", "layout", "branding"];
const DOC_ONLY_TERMS = ["readme", "documentation", "docs", "typo", "spelling", "copy edit"];

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

export function routeTask(input: string): RoutingDecision {
  const text = input.trim().toLowerCase();

  if (!text) {
    return {
      complexity: "trivial",
      skills: [],
      reasons: ["Empty task: do not activate specialist skills."],
    };
  }

  const securitySensitive = includesAny(text, SECURITY_TERMS);
  const debugging = includesAny(text, DEBUG_TERMS);
  const majorFeature = includesAny(text, MAJOR_FEATURE_TERMS);
  const frontend = includesAny(text, FRONTEND_TERMS);
  const design = includesAny(text, DESIGN_TERMS);
  const docsOnly = includesAny(text, DOC_ONLY_TERMS) && !debugging && !majorFeature && !securitySensitive;

  if (docsOnly) {
    return {
      complexity: "trivial",
      skills: ["engineering-minimal-change-engineer"],
      reasons: ["Documentation-only task: keep the workflow intentionally small."],
    };
  }

  const skills: string[] = [];
  const reasons: string[] = [];

  if (securitySensitive) {
    skills.push("security-appsec-engineer");
    reasons.push("Security-sensitive language requires an explicit AppSec review path.");
  }

  if (majorFeature) {
    skills.push("engineering-software-architect", "engineering-senior-developer");
    reasons.push("Large implementation scope requires architecture before implementation.");
  } else if (frontend) {
    skills.push("engineering-frontend-developer");
    reasons.push("Frontend-specific implementation detected.");
  } else if (debugging) {
    skills.push("engineering-senior-developer");
    reasons.push("Debugging requires an implementation owner grounded in failing evidence.");
  } else {
    skills.push("engineering-minimal-change-engineer");
    reasons.push("Default to the smallest engineering role that can complete the task.");
  }

  if (design && frontend) {
    skills.push("design-ui-designer");
    reasons.push("UI implementation explicitly includes design or UX work.");
  }

  if (debugging || majorFeature || securitySensitive) {
    skills.push("testing-test-automation-engineer");
    reasons.push("Non-trivial or risky code changes require targeted verification.");
  }

  if (majorFeature || securitySensitive) {
    skills.push("engineering-code-reviewer");
    reasons.push("Complex or sensitive changes require independent code review.");
  }

  const complexity: TaskComplexity = securitySensitive
    ? "high-risk"
    : majorFeature
      ? "complex"
      : debugging || frontend
        ? "standard"
        : "trivial";

  return { complexity, skills: unique(skills), reasons };
}
