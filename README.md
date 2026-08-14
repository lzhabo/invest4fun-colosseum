# Invest4Fun

Invest4Fun is a small workspace with explicit runtime boundaries:

- `apps/web` — React UI. It never holds provider secrets or makes authoritative decisions.
- `apps/landing-page` — static HTML landing page for `invest4.fun`.
- `apps/api` — trusted HTTP boundary for auth, providers and product commands.
- `apps/worker` — background runtime for future reconciliation and provider webhooks.
- `packages/contracts` — shared transport contracts only.
- `packages/database` — PostgreSQL connection and migrations.

Product entities are intentionally not defined yet. The first migration creates namespaces and the migration ledger only; user, wallet, funding, basket and execution tables will be added after their contracts are agreed with product.

## Local development

```bash
cp .env.example .env
npm install
npm run dev:infra
npm run db:migrate
npm run dev
```

Open `http://localhost:5173`. The API listens on `http://localhost:8787`.
The landing page runs separately at `http://localhost:4321` with `npm run dev:landing-page`.

To run the complete stack in containers:

```bash
docker compose up --build
```

See [docs/codebase-foundation.md](./docs/codebase-foundation.md) for the ownership rules and the decisions deliberately left open.
See [docs/product-user-journey.md](./docs/product-user-journey.md) for the current user journey, operation flow, data candidates, and open product decisions.
See [docs/privy-integration.md](./docs/privy-integration.md) for the Privy setup and authentication flow.
See [docs/application-implementation-plan.md](./docs/application-implementation-plan.md) for the detailed delivery phases, data model, provider boundaries, and completion criteria.
