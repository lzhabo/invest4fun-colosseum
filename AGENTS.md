# Invest4Fun Agent Instructions

## Repository roles

- The current repository is the only repository where code changes are allowed.
- The local `investmade.fun` repository is a private reference implementation.
- Use the reference repository only to understand existing product behavior and UI.
- Do not modify the reference repository.
- Do not add the reference repository as a runtime dependency or copy its architecture blindly.
- Reimplement migrated behavior using the boundaries and patterns in this repository.

## Product goal

Continue migrating the reference product into this repository while preserving the
required user-facing behavior and improving maintainability, validation, and
operational safety.

The working migration order is documented in:

- `docs/feature-parity-roadmap.md`
- `docs/application-implementation-plan.md`
- `docs/product-user-journey.md`
- `docs/codebase-foundation.md`

Read the relevant documentation before changing a cross-cutting flow.

## Stack and workspace boundaries

- Node.js 22 or newer.
- npm workspaces.
- TypeScript with strict project boundaries.
- `apps/web`: React and Vite application. Owns rendering, routing, interaction
  state, and user-facing feedback. It must not hold provider secrets or make
  authoritative product decisions.
- `apps/landing-page`: public static landing page. Keep it independent from the
  authenticated application.
- `apps/api`: trusted Express HTTP boundary for authentication, validation,
  provider orchestration, and idempotent commands.
- `apps/worker`: background jobs, provider webhooks, retries, polling, and
  reconciliation.
- `packages/contracts`: shared request and response schemas. Use Zod at the
  transport boundary.
- `packages/database`: PostgreSQL connection and additive migrations.
- Use existing styled-component and component organization patterns in the web
  app. Keep screen-local components and handlers readable; extract a shared
  component only when it is genuinely reused.

## Implementation rules

1. Inspect the current code and relevant reference implementation before editing.
2. Preserve existing behavior where the product scope requires parity, but adapt
   the implementation to this repository's architecture.
3. Keep external provider calls behind API/provider boundaries. Do not call
   privileged providers directly from the browser.
4. Validate external input and provider responses at the boundary.
5. Make commands idempotent and model loading, empty, pending, failure, and retry
   states explicitly.
6. Keep blockchain data and provider data distinguishable from persisted product
   state. Never treat browser state as authoritative.
7. Do not send real mainnet transactions, spend sponsor funds, or change
   withdrawal behavior unless the task explicitly authorizes it and uses the
   approved environment.
8. Do not commit `.env`, `.env.local`, API keys, Privy secrets, private keys,
   wallet seeds, or production credentials.
9. Avoid unrelated refactors and generated output changes.
10. Do not introduce a generic folder or abstraction solely for symmetry. Follow
    the existing ownership boundaries and naming patterns.

## Git workflow

- Never push directly to `main`.
- Create one focused branch per task.
- Keep changes small enough to review.
- Run the relevant checks before opening a pull request.
- Summarize changed files, behavior, assumptions, and remaining risks in the PR.
- If requirements are ambiguous, document the assumption and choose the safest
  reversible behavior rather than inventing financial rules.

## Required checks

From the repository root, use:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

For a narrow change, run the smallest relevant checks during development, then
run the complete set before opening the pull request.

## Migration task template

For every feature migrated from the reference implementation:

1. Identify the reference files and user-visible behavior.
2. Identify the new repository boundaries that own the behavior.
3. Implement the smallest complete vertical slice.
4. Add loading, empty, error, retry, and refresh behavior where applicable.
5. Add or update contracts, tests, and migrations when the behavior crosses a
   boundary.
6. Verify responsive UI behavior if the feature is user-facing.
7. Run the required checks and open a pull request.

## Safe task prompt

When starting a remote task, use this context:

```text
Use this repository as the only writable repository.
Use the private investmade.fun repository only as a read-only reference.
Follow AGENTS.md and the current roadmap.
Create a focused branch, implement the requested feature, run the required
checks, and open a pull request. Do not modify main, commit secrets, or send
real blockchain transactions.
```
