---
name: loopad-ctx-contract-sync-checker
description: Check whether loop-ad_context service context, workflow context, rules, and contract wording match the LoopAd GitHub org projects' remote main baseline or explicitly supplied local development paths. Use for sync/drift checks against implementation, README, endpoints, env, data flow, service responsibility boundaries, and cross-repo rules that intentionally live outside any single service repository.
---

# LoopAd Contract Sync Checker

## Overview

Use this skill only inside `loop-ad_context` to evaluate whether context/rules/contract wording
matches the actual managed LoopAd projects. This is separate from structure verification; run
`loopad-ctx-structure-verifier` or `npm run verify` only as a secondary check.

`loop-ad_context` exists to explain project relationships, shared contracts, cross-repo
workflows, and rules that every service should respect but that do not naturally belong to one
service repository. Do not evaluate this repository as if every context/rule sentence must be
duplicated or enforced in each service repository.

## Required Reading

1. `AGENTS.md`
2. `registry/services.md`
3. `registry/code-map.md`
4. Relevant `context/common/*`
5. Relevant `context/services/*`
6. Relevant `context/workflows/*`
7. Relevant `rules/*`

## Baseline Modes

### Remote Main Mode

Use this mode when the user does not provide a local path.

- Treat `registry/services.md` GitHub URLs as the source list.
- Use only repositories in the "사용하는 것" section as implementation evidence.
- Treat the remote `main` branch as the baseline.
- Prefer GitHub API or `gh api` to inspect README, CONTRIBUTING, package metadata, workflow files, and focused domain code.
- If remote access fails, do not infer; report the limitation.

### Local Development Mode

Use this mode only when the user explicitly provides one or more local paths.

- Verify each local path is a Git repository.
- Run `git fetch origin` in that path before comparing.
- Treat the path's current branch as the development state.
- Compare the current branch against `origin/main`.
- Inspect changed files and relevant unchanged context around them.
- Compare the changed implementation/README/contracts against `loop-ad_context` context/rules.
- If fetch fails, stop that path's comparison and report the limitation.

## What To Check

- Service responsibility: `역할`, `하지 않는 일`, dependencies, and public interfaces match implementation and README wording.
- Workflow flow: service-to-service data/call flow is not reversed or stale.
- Contract wording: endpoint names, public domains, env names, data sources, SDK/API responsibility, and storage responsibility are current.
- Rule packs: `RULE-*` sentences do not conflict with implementation or current README/CONTRIBUTING.
  Cross-repo rules may intentionally live only in `loop-ad_context`; do not require each related
  service repository to repeat or automate those rules unless the context explicitly says that the
  service repository owns or enforces them.
- Registry: used/unused repository classification matches the GitHub org state when relevant.
- Archived/unused repos: do not use them as current product evidence.
- Structure: optionally run `npm run verify` to ensure the context repo is well-formed, but do not treat structure pass as content sync.

## What Not To Report As Drift

- Do not report a finding merely because a cross-repo rule in `rules/*` is absent from a service
  repository's CI, README, or CONTRIBUTING.
- Do not report a finding merely because a service repository documents only its own local
  responsibility and not the full SDK, Collector, Kafka, ClickHouse, Dashboard, and Decision
  coordination workflow.
- Do not report missing automation for a context-level coordination rule unless the user explicitly
  asks for an enforcement audit or the context claims that automation already exists.
- Report drift only when the implementation, service README/CONTRIBUTING, or workflow file
  contradicts the context/rules, or when the context assigns ownership/enforcement to a service
  repository that the service does not actually provide.

## Evidence Rules

- Cite the context/rules file and the implementation/README file that support each finding.
- Clearly separate confirmed findings from uncertainty.
- Do not rely on local checkouts unless the user supplied their paths.
- Do not use generated output, lockfiles, or archived repos as primary evidence unless the user asks about them.
- When a rule is intentionally cross-repo/context-owned, mention it as scope context only if useful;
  do not list it under findings or recommended fixes.

## Output Rule

Return a conversation report only. Do not create findings files, patches, or documentation updates unless the user explicitly asks.
List only confirmed mismatches, stale contracts, or useful confirmations under findings. Exclude
the mere absence of context-owned cross-repo rules from individual service repositories.

Use this concise shape:

```md
검토 범위:
- context/rules
- remote main repositories or local paths/branches

발견:
- [severity] issue. 근거: context file + implementation file.

권장 조치:
- suggested context/rule/doc update or service confirmation.

구조 검증:
- npm run verify result, if run.

한계:
- network/auth/local path limitations.
```
