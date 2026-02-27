# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** nexus-control
**Date:** 2026-02-27
**Type tags:** `[pypi]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 3/10 | Template SECURITY.md only, no threat model in README, no telemetry statement |
| B. Error Handling | 9/10 | Typed exceptions with deterministic error paths already implemented |
| C. Operator Docs | 4/10 | README exists but no CHANGELOG, no standard footer |
| D. Shipping Hygiene | 3/10 | No verify script, no Makefile, no CI workflow, no dep scanning, pre-1.0 version |
| E. Identity (soft) | 8/10 | Logo, translations, landing page, GitHub metadata all present |
| **Overall** | **27/50** | |

## Key Gaps

1. No CI workflow (no lint, typecheck, test, coverage, dep scanning)
2. SECURITY.md was template-only with no data scope or proper contact info
3. No CHANGELOG.md, no Makefile verify target
4. Pre-1.0 version (0.6.1) — needs promotion to 1.0.0
5. README missing Security & Data Scope section and scorecard

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Create CI workflow with lint, typecheck, coverage, dep-audit | 10 min |
| 2 | Rewrite SECURITY.md + add threat model to README | 5 min |
| 3 | Create CHANGELOG.md, Makefile, bump to 1.0.0 | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 3/10 | 10/10 |
| B. Error Handling | 9/10 | 10/10 |
| C. Operator Docs | 4/10 | 10/10 |
| D. Shipping Hygiene | 3/10 | 10/10 |
| E. Identity (soft) | 8/10 | 10/10 |
| **Overall** | 27/50 | 50/50 |
