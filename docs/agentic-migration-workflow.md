# Agentic Migration Workflow

This document defines the operating process for migrating the reference
Invest4Fun product into this repository without copying the old AI-generated
structure. The goal is to move product behavior, not implementation debt.

## Operating Principles

- This repository is the only writable codebase.
- `../investmade.fun` is a read-only reference for behavior and UI.
- Every feature starts from observed user-facing behavior and ends in this
  repository's architecture boundaries.
- Browser code never owns provider secrets, sponsorship policy, execution
  authority, or durable product decisions.
- API contracts are validated with Zod in `packages/contracts`.
- Database changes are additive and migration-based.
- Workers own retries, polling, provider events, and reconciliation.
- Real mainnet transactions, sponsor spending, withdrawal changes, and
  production credentials are out of scope unless explicitly authorized.

## Roles

### Release Lead

The main ChatGPT/Codex thread acts as release lead.

Responsibilities:

- Select the next release from `docs/release-acceptance-plan.md`.
- Break the release into task-manager tickets.
- Decide task sequencing and parallelization.
- Start subagents only for bounded, non-overlapping work.
- Review every subagent result before integration.
- Run required checks before release acceptance.
- Keep the final release notes and residual risks up to date.

### Implementation Agent

An implementation agent owns one vertical slice with a narrow write set.

Responsibilities:

- Read `AGENTS.md` and the relevant docs before editing.
- Inspect the reference implementation only for behavior.
- Edit files directly in its own workspace.
- Keep changes focused and reversible.
- Add or update tests for touched behavior.
- Return changed files, behavior implemented, checks run, and risks.

### Review Agent

A review agent audits a finished slice or release candidate.

Responsibilities:

- Use a code-review stance.
- Prioritize bugs, regressions, missing states, missing validation, and missing
  tests.
- Verify that ownership boundaries are respected.
- Report findings with file and line references.
- Do not perform broad rewrites while reviewing.

### Task Manager

The task manager is the canonical planning board. It can be Notion or any
equivalent tracker, but it must preserve the schema in
`docs/task-manager-schema.md`.

Responsibilities:

- Track releases, tasks, dependencies, status, acceptance criteria, owner, and
  evidence.
- Keep one ticket per reviewable unit of work.
- Store links to PRs, checks, screenshots, logs, and follow-up decisions.

## Release Loop

1. Select exactly one target release.
2. Re-read the relevant roadmap and product journey sections.
3. Inspect the reference product files for user-visible behavior.
4. Define tickets using the task schema.
5. Mark dependencies and choose the smallest complete vertical slice.
6. Create a focused branch with the `codex/` prefix.
7. Assign bounded parallel tasks only when write sets do not overlap.
8. Implement local changes on the critical path.
9. Integrate subagent outputs after review.
10. Run focused checks during development.
11. Run the full required checks before acceptance:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

12. Update release notes, acceptance evidence, and residual risks.
13. Open a PR when the release candidate passes.

## Handoff Template

Use this prompt when handing off an implementation ticket to a subagent:

```text
Use /Users/lidia/Documents/projects2026/investmade as the only writable repo.
Use /Users/lidia/Documents/projects2026/investmade.fun only as a read-only
reference for behavior and UI. Follow AGENTS.md and the docs relevant to this
ticket.

Ticket:
- Release:
- Objective:
- Scope:
- Explicit non-goals:
- Expected write set:
- Reference files to inspect:
- New repo files likely affected:
- Acceptance criteria:
- Required checks:

Rules:
- Do not modify main.
- Do not commit secrets.
- Do not send real blockchain transactions.
- Keep provider calls behind trusted API/provider boundaries.
- Validate inputs and provider responses at the boundary.
- Make commands idempotent where the behavior crosses API/database boundaries.
- Return changed files, checks run, assumptions, and remaining risks.
```

## Review Template

Use this prompt when handing off a review:

```text
Review the current release candidate for:
- User-visible behavior regressions.
- Architecture boundary violations.
- Missing loading, empty, error, retry, or refresh states.
- Missing Zod validation at transport boundaries.
- Missing idempotency for commands.
- Unsafe provider, wallet, blockchain, or sponsorship behavior.
- Missing tests or insufficient release evidence.

Lead with findings ordered by severity. Include file and line references.
Do not rewrite unrelated code.
```

## Task State Rules

- `Backlog`: not ready for implementation.
- `Ready`: scoped, acceptance criteria defined, dependencies clear.
- `In Progress`: one owner is actively changing it.
- `Blocked`: cannot continue without a decision, credential, provider, or prior
  task.
- `Review`: implementation complete, awaiting review.
- `Needs Changes`: review found required fixes.
- `Accepted`: criteria met and evidence attached.
- `Released`: included in a passing release candidate.

No task can move to `Accepted` without explicit acceptance evidence.

## Parallelization Rules

Parallelize when:

- Tasks touch disjoint files or packages.
- One task is read-only research and another is implementation.
- One task adds tests for an already stable surface.
- Review can run against a completed branch while the lead prepares release
  notes.

Do not parallelize when:

- Two tasks modify the same contract schema.
- A database migration shape is still being decided.
- API response shapes are not stable.
- The frontend depends on unresolved backend ownership or status names.
- Security, wallet, withdrawal, or sponsorship decisions are ambiguous.

## Release Gate

A release candidate is acceptable only when:

- All release tasks are `Accepted`.
- Required checks pass or each failure has an explicit accepted reason.
- User-facing screens have loading, empty, error, retry, and refresh behavior
  where applicable.
- Cross-boundary inputs and outputs are validated.
- No provider secret or privileged decision was moved into browser code.
- Database and operation state changes are durable and idempotent.
- Release notes include shipped behavior, changed files, test evidence,
  assumptions, and remaining risks.
