# Release Acceptance Plan

This plan turns the migration roadmap into reviewable releases. Each release
should be small enough to verify and large enough to produce visible product
progress.

The practical migration path is:

```text
R0 process -> R1 foundation/auth -> R2 asset catalog -> R3 feed -> R4 ideas
-> R5 basket/review -> R6 devnet execution -> R7 reconciliation/portfolio
-> R8 funding skeleton -> R9 sell/withdraw/production readiness
```

## R0 Migration Control Plane

Objective: establish the repeatable process for agentic migration work.

Tasks:

- `R0-OPS-01`: Create the agentic migration workflow.
- `R0-OPS-02`: Define the task-manager schema.
- `R0-OPS-03`: Define release acceptance gates.
- `R0-REVIEW-01`: Have a review agent verify release ordering and risks.

Acceptance criteria:

- Workflow, handoff, review, and task-state rules are documented.
- Release and task schemas can be mirrored into Notion or another tracker.
- Future implementation tasks can be created from the templates without
  additional process design.
- Release ordering accounts for authentication, catalog, and provider-boundary
  dependencies before higher-risk product flows.

Checks:

- Documentation review.

Risks:

- Notion API is not connected in this environment yet.

## R1 Foundation, Identity, And Wallet Bootstrap

Objective: make the application safe for migration work and keep Privy as an
auth/wallet provider while Invest4Fun owns the internal user model.

Tasks:

- `R1-FOUNDATION-01`: Verify package boundaries, env schemas, request IDs,
  structured API errors, readiness checks, and migration/test DB workflow.
- `R1-API-01`: Ensure auth bootstrap derives the internal user only from a
  verified Privy token.
- `R1-DATABASE-01`: Persist internal users, identities, and wallet role mapping.
- `R1-WEB-01`: Restore authenticated account state after refresh.
- `R1-WEB-02`: Display wallet roles and bootstrap/re-auth failure states.
- `R1-TEST-01`: Cover identity upsert, duplicate prevention, forged access, and
  wallet roles.
- `R1-REVIEW-01`: Review security and identity ownership.

Acceptance criteria:

- Same Privy subject maps to one internal Invest4Fun user.
- Different login methods do not create duplicate internal users.
- Embedded and external wallets are displayed with role and provider.
- External wallets do not become portfolio wallets.
- Sign-out, failed bootstrap, provider unavailable, and re-authentication states
  are explicit.
- Provider secrets, sponsor policy, private keys, and Privy secrets are absent
  from the web bundle.

Checks:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Secret-like bundle/env review.

Risks:

- Real Privy credentials must stay out of the repository.
- If auth is weak, later portfolio, basket, and funding work can attach to the
  wrong user.

Parallelization:

- Web account states can proceed alongside API tests after the bootstrap shape
  is stable.
- Foundation/env review can run alongside identity persistence if migrations
  are coordinated.

## R2 Canonical Asset Catalog And Provider Layer

Objective: separate what can be shown or bought from the old curated/static
list and keep provider details behind trusted boundaries.

Tasks:

- `R2-PRODUCT-01`: Inspect reference catalog, market, and Feed data behavior.
- `R2-DOMAIN-01`: Define canonical asset IDs, symbol ambiguity handling, price
  normalization, provider error normalization, and eligibility decisions.
- `R2-CONTRACTS-01`: Define asset metadata, source evidence, market freshness,
  stale data, and non-tradable schemas.
- `R2-DATABASE-01`: Add additive asset, eligibility, and provider snapshot
  migrations if needed for the selected slice.
- `R2-INTEGRATIONS-01`: Implement server-side market-data provider boundary with
  TTL, stale-on-error, and deterministic local fallback.
- `R2-API-01`: Expose validated asset catalog and market-data responses.
- `R2-TEST-01`: Cover canonical IDs, duplicate symbols, provider failures,
  caching, and schema validation.
- `R2-REVIEW-01`: Review provider leakage and executable-asset safety.

Acceptance criteria:

- Asset identity is based on `chain + mint`, not symbol.
- Duplicate symbols remain distinct assets.
- Invalid or unverified assets do not become executable.
- Every market response includes source, `asOf`, and degraded/stale state where
  applicable.
- Feed/chart prices are never treated as execution quotes.
- Placeholder assets such as `CLMT` are explicit non-tradable records.

Checks:

- Full required check suite.
- Provider timeout/stale-data tests.

Risks:

- Provider-specific DTOs can leak into React or API routes if boundaries are
  not enforced.
- External market provider availability and rate limits.

Parallelization:

- Pure domain tests and provider adapter mocks can run in parallel.
- UI consumers should wait until contract shapes are stable.

## R3 Feed Pipeline And Controlled AI Migration

Objective: replace static Feed behavior with deterministic, evidence-backed
server-side feed sessions.

Tasks:

- `R3-PRODUCT-01`: Inspect reference Feed behavior and record parity
  expectations.
- `R3-CONTRACTS-01`: Define Feed session, Feed item, ranking version,
  explanation evidence, session expiry, and decision schemas.
- `R3-DATABASE-01`: Add Feed session/item/decision migrations if durable
  sessions are in scope for the slice.
- `R3-API-01`: Implement feed session generation from the canonical catalog.
- `R3-API-02`: Add eligibility, preference filtering, deterministic ranking,
  explanation evidence, refresh, and expiry behavior.
- `R3-WEB-01`: Update Feed UI to consume API feed sessions.
- `R3-WEB-02`: Add loading, empty, stale, degraded, error, retry, refresh, and
  session-expiry states.
- `R3-TEST-01`: Cover orchestration, deterministic ranking, API contracts, and
  Feed UI states.
- `R3-REVIEW-01`: Review architecture boundaries, parity, and AI/ranking safety.

Acceptance criteria:

- Feed content is generated by the API, not hardcoded in the screen.
- A feed session is deterministic until expiry or explicit refresh.
- Every item is traceable to universe, policy, market, and ranking versions.
- AI/ranking output is not treated as authoritative financial advice.
- Provider outage degrades only to approved cached or curated data.
- No provider secret or authoritative product rule lives in the browser.

Checks:

- Full required check suite.
- Responsive visual check for Feed.

Risks:

- Legal/product language around AI recommendations needs explicit approval.
- AI must not bypass eligibility rules for executable assets.

Parallelization:

- Product/reference inspection can run alongside contract drafting.
- UI state work should wait until API response shape is stable.

## R4 Prepared Ideas

Objective: make Ideas first-class versioned product records instead of live
partner responses or browser-only data.

Tasks:

- `R4-PRODUCT-01`: Inspect reference Ideas behavior and define parity.
- `R4-CONTRACTS-01`: Define Idea, version, holdings, weights, risk, source,
  source URL, and performance schemas.
- `R4-DATABASE-01`: Add additive migrations for Ideas, Idea versions,
  components, and snapshots.
- `R4-DOMAIN-01`: Implement weight normalization, minimum allocation, duplicate
  leg merge, and availability rules.
- `R4-API-01`: Implement normalized idea catalog provider boundary.
- `R4-WEB-01`: Implement Ideas loading, empty, error, details, history, and
  add-to-basket behavior.
- `R4-TEST-01`: Cover import idempotency, idea normalization, snapshots,
  availability, and UI states.
- `R4-REVIEW-01`: Review idea/source attribution and basket behavior.

Acceptance criteria:

- A user can select an individual asset or a complete Idea.
- Idea versions are immutable after import.
- Basket entries preserve the selected Idea allocation snapshot.
- Unexecutable components make an Idea unavailable or produce an explicitly new
  eligible version.
- Idea charts and holdings are sourced from API responses.

Checks:

- Full required check suite.
- Responsive visual check for Ideas and basket interaction.

Risks:

- External idea catalog provider may require product approval.
- Tokenized equities/xStocks scope may need a decision record.

## R5 Durable Basket And Review

Objective: turn swipes and Ideas into a reliable, reviewable order intent
without starting execution yet.

Tasks:

- `R5-CONTRACTS-01`: Define basket draft, entry, amount, allocation, review,
  unavailable leg, and status schemas.
- `R5-DATABASE-01`: Add or update basket/order migrations.
- `R5-DOMAIN-01`: Implement amount, allocation, minimum, duplicate, and idea
  flattening rules.
- `R5-API-01`: Implement authenticated basket draft persistence where in scope.
- `R5-API-02`: Implement idempotent review command with duplicate handling.
- `R5-WEB-01`: Move basket state from browser-only storage to API-backed or
  versioned local state according to the selected slice.
- `R5-WEB-02`: Show quote caveat, expiry, validation, unavailable legs, failure,
  retry, and refresh states.
- `R5-TEST-01`: Cover reducer behavior, persistence, review safety,
  idempotency, validation, and refresh.
- `R5-REVIEW-01`: Review money-state and duplicate-order risks.

Acceptance criteria:

- Basket survives refresh.
- Review clearly shows assets, Idea attribution, amounts, unavailable legs, and
  quote freshness caveat.
- Failed requests can be retried without duplicate baskets or orders.
- Browser state is never treated as authoritative for confirmed orders.
- Confirmed order is never reconstructed from local state.

Checks:

- Full required check suite.

Risks:

- Product decisions remain open for amount model, quote validity, minimums, and
  whether a basket is one-time or strategy-like.

## R6 Devnet Purchase Execution

Objective: convert a reviewed basket into a devnet-only execution intent with
durable transaction evidence.

Tasks:

- `R6-PRODUCT-01`: Confirm canonical settlement asset and sponsorship rules.
- `R6-CONTRACTS-01`: Define execution intent, quote, route, leg, fill,
  transaction, and outcome schemas.
- `R6-DOMAIN-01`: Implement order and execution state machines.
- `R6-API-01`: Build execution-intent creation with simulation and policy checks.
- `R6-INTEGRATIONS-01`: Add devnet-only execution adapter boundary.
- `R6-WORKER-01`: Add transaction confirmation and reconciliation job skeletons.
- `R6-WEB-01`: Render executing, partial, completed, and failed outcomes.
- `R6-TEST-01`: Cover idempotency, quote expiry, failed simulations, partial
  outcomes, and state transitions.
- `R6-REVIEW-01`: Review transaction safety and sponsorship policy.

Acceptance criteria:

- One reviewed order can produce one or more transaction groups.
- Quote, route, transaction signature, provider response, fills, and failures
  are persisted.
- Quote expiry and slippage are explicit.
- Failed, partial, and successful outcomes are modeled.
- Only approved devnet behavior is enabled.

Checks:

- Full required check suite.
- Devnet-only manual verification when credentials are explicitly provided.

Risks:

- Mainnet, sponsor funds, and withdrawal behavior remain blocked unless
  separately authorized.
- The UI must not hide required wallet prompts behind a fake one-step flow.

## R7 Reconciliation, Activity, And Portfolio

Objective: after execution, show durable truth instead of optimistic UI.

Tasks:

- `R7-CONTRACTS-01`: Define operation, activity, portfolio position, lot,
  freshness, and mismatch schemas.
- `R7-DATABASE-01`: Add fills, lots, operations, and status-history migrations.
- `R7-WORKER-01`: Implement transaction confirmation, order reconciliation, and
  portfolio refresh jobs.
- `R7-API-01`: Expose portfolio and activity APIs backed by durable records.
- `R7-WEB-01`: Render portfolio value, allocation, drilldown, stale-data,
  provider-unavailable, and activity states.
- `R7-TEST-01`: Cover worker retries, reconciliation mismatches, portfolio
  attribution, aggregation, and activity pagination.
- `R7-REVIEW-01`: Review wallet ownership and portfolio truth boundaries.

Acceptance criteria:

- Refresh never loses in-flight operations.
- Activity shows deposits, purchases, failures, and pending states from durable
  records.
- Portfolio is derived from the embedded wallet plus confirmed Invest4Fun lots.
- Repeated assets aggregate while preserving lot/order attribution.
- Chain/product mismatches produce visible reconciliation warnings.

Checks:

- Full required check suite.

Risks:

- Chain data does not preserve Idea attribution; lots are the product
  attribution truth.
- Sale attribution policy must not be invented in this release.

## R8 Funding Skeleton

Objective: create safe durable deposit and withdrawal operation scaffolding
without enabling unsafe production money movement.

Tasks:

- `R8-PRODUCT-01`: Confirm allowed countries, providers, limits, KYC/AML, and
  retention assumptions.
- `R8-CONTRACTS-01`: Define crypto deposit, fiat ramp, withdrawal preparation,
  provider event, and operation status schemas.
- `R8-DATABASE-01`: Add operation, provider reference, webhook staging, and
  status-history migrations.
- `R8-API-01`: Implement pending crypto deposit creation and status read APIs.
- `R8-WORKER-01`: Add confirmation job skeleton with idempotent state
  transitions.
- `R8-WEB-01`: Render funding states: initiated, pending provider, pending
  chain, credited, failed, expired.
- `R8-REVIEW-01`: Review money movement safety.

Acceptance criteria:

- Every deposit or withdrawal operation has durable provider/status evidence.
- A deposit has a durable record before or while transfer starts.
- Provider callbacks are verified and deduped where a real provider is used.
- External wallet remains a funding source, not a portfolio wallet.
- No real withdrawal or mainnet spending is enabled by accident.

Checks:

- Full required check suite.
- Webhook raw-body verification tests where relevant.

Risks:

- KYC/AML/country/provider decisions are blockers for real fiat flows.
- Production funding paths require approved providers and secret handling.

## R9 Sell, Withdraw, And Production Readiness

Objective: expand operations only after purchase and reconciliation are
reliable.

Tasks:

- `R9-PRODUCT-01`: Decide sale attribution and settlement asset policy.
- `R9-CONTRACTS-01`: Define sale, withdrawal, sponsorship, and operator recovery
  schemas.
- `R9-DOMAIN-01`: Implement sale lifecycle and lot-reduction rules.
- `R9-API-01`: Implement sale and withdrawal preparation behind explicit guards.
- `R9-WORKER-01`: Add retry, stuck-operation, and provider recovery jobs.
- `R9-OPS-01`: Add structured logs, metrics, rate limits, circuit breakers,
  deployment smoke tests, and load tests.
- `R9-REVIEW-01`: Perform security review for secrets, webhooks, sponsorship,
  and withdrawal abuse.

Acceptance criteria:

- Sell and withdrawal operations have durable lifecycle and status history.
- Sponsorship can be disabled without breaking read-only portfolio.
- Operators can identify and recover stuck provider, chain, or database
  failures.
- No secret is required in the frontend bundle.
- Production deployment smoke tests and load tests pass.

Checks:

- Full required check suite.
- Load tests.
- Provider sandbox integration tests.
- Security review.

Risks:

- Withdrawal has the highest compliance and security blast radius.
- Sale lot-reduction policy requires explicit approval before implementation.

## Sequencing Rules

- R1 must precede authenticated Feed, Basket, Portfolio, and Funding.
- R2 must precede Feed and Ideas because both need canonical assets and provider
  boundaries.
- R3 and R4 must precede durable Basket review.
- R5 must precede execution because execution starts from a persisted reviewed
  intent.
- R6 must precede reconciliation and portfolio attribution because fills and lots
  need execution evidence.
- R7 must precede sell and withdrawal because reductions and withdrawals need
  trustworthy operation history.
- Production sponsorship, mainnet, and withdrawals require explicit product and
  security approval.
