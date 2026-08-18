# Skill overlap and routing audit

Date: 2026-08-17
Baseline: `62d620e4fc009d211dd53b34a3e722d22eb396f4`

## Inventory map

The canonical `skills/` tree is mirrored into `.agents/skills/` and plugin bundles. Roles group into Design, Engineering, Security, Testing, Core Superpowers, and Antigravity SDK/guide capabilities. The mirrors share blob SHAs today, so they should be treated as packaging outputs rather than independent sources of truth.

## Highest overlap clusters

| Cluster | Skills | Overlap risk | Routing rule |
| --- | --- | --- | --- |
| General engineering | senior-developer, software-architect, backend-architect, minimal-change-engineer | High | Select by task shape: architecture for design decisions, minimal-change for bounded fixes, senior-developer for implementation, backend only for server/data boundaries |
| Review | code-reviewer, ai-generated-code-auditor, reality-checker | Medium | Code reviewer owns maintainability/correctness, security auditor only for AI/security risk, reality checker verifies claims/evidence |
| Security | security-architect, appsec-engineer, senior-secops | High | Architect for threat/design work, AppSec for code/application changes, SecOps for operational controls |
| Testing | test-automation-engineer, test-results-analyzer, evidence-collector, reality-checker | Medium | Automation creates tests, analyzer interprets failures, collector records evidence, reality checker validates completion |
| Design UX | ui-designer, ux-architect, ux-researcher, persona-walkthrough | Medium | Research before requirements, architect for flows/information structure, designer for visual implementation, walkthrough for validation |

## Routing behavior

Current routing is prose-driven through division protocol files. The engineering router enumerates roles and asks the model to classify a task, select primary/secondary roles, dispatch, then verify. It has no executable scenario suite and contains a stale hard-coded claim of 57 engineering roles. This makes over-routing and stale inventory difficult to detect automatically.

## Stale or duplicated capabilities

1. Skill content is replicated under `skills/`, `.agents/skills/`, and plugin packaging paths. This is acceptable only if generated/synchronized; manual edits can drift.
2. The engineering router hard-codes an inventory count that can become stale.
3. CLI verification previously used `skillCount >= 80` as a health proxy, allowing 80 unrelated directories to pass while required capabilities were absent.
4. CLI help hard-coded `91+` skills, another stale-count surface.
5. Large specialist prompts create material context cost when routing is too broad.

## Top 10 improvements

1. Verify named baseline capabilities instead of skill-count thresholds. Implemented in this branch.
2. Add deterministic routing scenarios for minimal fix, debugging, major feature, and security-sensitive work.
3. Introduce a generated skill registry from canonical skill metadata and remove hard-coded role counts.
4. Add a mirror-drift check across canonical skills, `.agents`, and plugin bundles.
5. Add explicit trigger/non-goal/output/compatibility metadata checks for every skill.
6. Add over-routing assertions that cap specialists for simple tasks.
7. Add host capability detection for Antigravity/Gemini CLI before tool-specific instructions execute.
8. Add prompt-size budgets and duplicate-instruction detection.
9. Expand privacy tests for traversal, symlinks, shell metacharacters, and Windows paths.
10. Add CI that runs tests, privacy checks, packaging drift checks, and install fixtures.

## First initiative

Capability-aware installation verification was selected because it is user-visible, deterministic, low regression risk, and fixes a false-positive health condition. The verifier now checks required plugin directories plus required `SKILL.md` manifests. Total skill count remains diagnostic only and no longer determines health.
