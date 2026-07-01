---
name: loopad-structure-verifier
description: Verify the internal structure of the loop-ad_context repository. Use when checking AGENTS.md links, required files, service context sections, rule id uniqueness, registry shape, or npm run verify results. This skill does not compare context against service implementation.
---

# LoopAd Structure Verifier

## Overview

Use this skill only inside `loop-ad_context` to check whether the context repository itself is
well-formed. Do not use it to judge whether project descriptions match real service code; use
`loopad-contract-sync-checker` for that.

## Required Reading

1. `AGENTS.md`
2. `docs/reference_repository-structure.md`
3. `docs/process_context-maintenance.md`
4. `checks/verify-context.js`

## Workflow

1. Run `npm run verify` from the `loop-ad_context` root.
2. If it passes, report that structure verification passed.
3. If it fails, inspect the failing file or link and explain the structural problem.
4. If the user explicitly asks to fix it, edit the relevant repository document or verifier.
5. If the user did not ask for fixes, only report the result in conversation.

## Checks Covered

- Required files exist.
- `registry/services.md` has context links for used services.
- Service context files contain required sections.
- `AGENTS.md` internal links resolve.
- `rules/*.md` does not contain duplicate `RULE-*` ids.
- `registry/services.md` does not introduce a `Local Path` column.

## Non Goals

- Do not compare GitHub `main` or local branches against context/rules.
- Do not inspect service source code for semantic correctness.
- Do not create findings files unless the user explicitly asks.
