# Invest4Fun Application Implementation Plan

## Purpose

This document is the implementation source of truth for moving Invest4Fun from
its current foundation into an end-to-end Solana application. It translates the
current product journey into code ownership, data boundaries, delivery phases,
API contracts, background jobs, tests, and release gates.

The plan deliberately separates:

- Product state owned by Invest4Fun.
- Authentication and wallet custody delegated to Privy.
- Live blockchain state read from Solana.
- Market and execution data received from external providers.
- Temporary browser state that may be discarded safely.

The first target is a coherent devnet-capable product slice. Fiat withdrawals,
fully automated recurring investment, and advanced rebalancing follow after the
core purchase and reconciliation path is reliable.

## Product Vocabulary

Use these terms consistently in code, database records, API responses, and UI:

| Term | Meaning |
|---|---|
| User | The internal Invest4Fun account. It is not a Privy user or wallet address. |
| Identity | A provider subject linked to a User, initially a Privy user ID. |
| Wallet | A chain address linked to a User with an explicit role. |
| Embedded wallet | The Invest4Fun Solana wallet whose supported holdings form the portfolio. |
| External wallet | A funding source or withdrawal destination; it is not merged into the portfolio. |
| Asset | A supported Solana token identified canonically by chain and mint address. |
| Feed session | One generated presentation of eligible assets for a user at a point in time. |
| Feed item | One asset shown in a feed session, including ranking and explanation evidence. |
| Idea | A versioned composition of assets and target weights. It can be curated or user-created. |
| Basket | A temporary purchase draft containing assets or Ideas before confirmation. |
| Order | A confirmed user intent with immutable input amounts and attribution. |
| Execution | The attempt to settle an Order through one or more blockchain transactions. |
| Fill | A confirmed asset output produced by an execution leg. |
| Lot | Product attribution that connects a confirmed fill to an Idea or direct asset purchase. |
| Portfolio | The aggregate supported holdings of the embedded wallet, enriched with Invest4Fun attribution. |
| Operation | A user-facing lifecycle record for deposit, purchase, sale, or withdrawal. |
| Reconciliation | Comparing intended product state, provider results, and final onchain state. |

## Architecture Target

```text
apps/landing-page
  Public, indexable marketing site

apps/web
  React UI
  -> authenticates with Privy
  -> calls only the Invest4Fun API for product commands
  -> asks the embedded wallet to sign when the selected custody flow requires it

apps/api
  Stateless HTTP boundary
  -> verifies Privy access tokens
  -> resolves the internal User and Wallet
  -> validates commands and permissions
  -> creates durable operations
  -> calls provider adapters for synchronous quote/prepare steps

apps/worker
  Horizontally scalable background processing
  -> confirms deposits and transactions
  -> processes provider webhooks
  -> retries transient provider failures
  -> reconciles orders, fills, lots, and cached portfolio views

packages/contracts
  Zod schemas for HTTP inputs and outputs only

packages/domain
  Pure product rules, state transitions, allocation, money, and portfolio attribution

packages/integrations
  Server-only provider adapters: Jupiter, market data, Ideas, Solana RPC/indexer,
  on-ramp, off-ramp, and sponsorship

packages/database
  PostgreSQL connection, migrations, repositories, transactions, and job claiming
```

Business code must be grouped by product domain. Provider names belong only
inside `packages/integrations` or provider configuration. For example, Feed is
not a `jupiter` feature: Feed may consume a Jupiter discovery adapter, a market
data adapter, and an Invest4Fun ranking service.

## Source Layout To Build

```text
apps/web/src/
  app/                    routing, providers, global error boundaries
  auth/                   Privy bridge and authenticated API session
  components/             reusable product and UI components
  screens/
    FeedScreen.tsx
    IdeasScreen.tsx
    BasketReviewScreen.tsx
    PortfolioScreen.tsx
    ActivityScreen.tsx
    AccountScreen.tsx
  state/                  basket draft and other cross-screen client workflows
  services/               typed API client only
  styles/                 tokens, global rules, and component styles

apps/api/src/
  app.ts                  Express composition only
  middleware/             auth, request IDs, errors, rate limits
  modules/
    users/
    wallets/
    preferences/
    feed/
    ideas/
    baskets/
    orders/
    portfolio/
    funding/
    activity/
  providers.ts            integration dependency construction

apps/worker/src/
  index.ts
  jobs/
    confirm-deposit.ts
    confirm-transaction.ts
    reconcile-order.ts
    refresh-market-data.ts
    process-provider-event.ts
  runner/                 claiming, retry, backoff, and shutdown

packages/domain/src/
  assets/
  feed/
  ideas/
  orders/
  operations/
  portfolio/
  funding/

packages/integrations/src/
  jupiter/
  market-data/
  cesto/
  solana/
  alchemy/
  ramps/
  sponsorship/

packages/database/src/
  repositories/
  transactions.ts
  jobs.ts
```

Do not add a generic frontend `features` directory. Screens compose several
capabilities; reusable state and service boundaries stay independently visible.

## State Ownership

| State | Canonical owner | Browser behavior |
|---|---|---|
| Login session and linked login methods | Privy | Privy restores its session after refresh. |
| Internal user and product settings | PostgreSQL | Refetch after auth bootstrap. |
| Embedded and external wallet links | Privy plus PostgreSQL role mapping | Refetch and reconcile after login or wallet changes. |
| Draft basket | Browser initially | Persist a versioned draft locally; it may be reset without changing money. |
| Confirmed order | PostgreSQL | Never reconstruct it from local state. |
| Transaction status | Solana, reflected in PostgreSQL | Poll the API or consume future server events. |
| Token balances | Solana | Display indexed/cached values with freshness metadata. |
| Idea attribution and cost basis | PostgreSQL | Read from portfolio APIs. |
| Market price and charts | Market provider cache | Display source and `asOf`; never use chart price as an execution quote. |
| Execution quote | Execution provider plus PostgreSQL evidence | Treat as expiring; require refresh after expiry. |

React local state is sufficient for isolated controls. Use a small reducer and
context for the cross-screen basket workflow. Add a server-state library only
when caching, invalidation, and concurrent mutations become repetitive; do not
put server-authoritative operations into a MobX store.

## Data Model

Implement migrations additively. Use UUID primary keys generated by the server
or database, `timestamptz` timestamps, explicit status constraints, foreign
keys, and unique provider references. Monetary token quantities are integer
base-unit strings at API boundaries and `numeric(78, 0)` or validated text in
PostgreSQL. Fiat values use integer minor units plus ISO currency.

### Identity and preferences

1. `app.users`
   - Internal account ID, lifecycle status, country/locale, timestamps.
   - Must not use the Privy user ID or wallet address as the primary key.
2. `app.auth_identities`
   - User ID, provider, external subject, timestamps.
   - Unique on `(provider, external_subject)`.
   - Store no password, passkey secret, OAuth token, or Privy access token.
3. `app.wallets`
   - User ID, chain, address, role (`embedded`, `external`), custody/provider,
     active state, timestamps.
   - Normalize addresses by chain before uniqueness checks.
4. `app.user_preferences`
   - Goal, risk tolerance, horizon, asset-class restrictions, Feed controls,
     investment period, spending limit, disclosure version, timestamps.
   - Nullable fields are allowed until onboarding is complete.
5. `app.spending_periods`
   - User ID, period boundaries, configured limit, confirmed spend, reserved
     spend, and status.

### Catalog, Feed, and Ideas

1. `app.assets`
   - Canonical asset ID, chain, mint, symbol, name, decimals, asset class,
     issuer/type labels, eligibility state, metadata source, timestamps.
   - Unique on `(chain, mint)`; symbol is never an identifier.
2. `app.asset_eligibility`
   - Asset ID, decision, reason codes, policy version, checked timestamp.
3. `integration.provider_snapshots`
   - Provider, cache key, payload, `as_of`, expiry, and refresh status.
4. `app.feed_sessions`
   - User ID, preference snapshot/version, ranking version, universe version,
     creation time, expiry, and status.
5. `app.feed_items`
   - Feed session, asset, rank, explanation, evidence references, market-data
     timestamp, and interaction state.
6. `app.ideas`
   - Stable Idea identity, source type (`curated`, `partner`, `user`), source
     reference, title, status, and ownership when user-created.
7. `app.idea_versions`
   - Immutable version, description, risk label, effective timestamp, source
     snapshot, and total target weight.
8. `app.idea_components`
   - Idea version, asset, target weight in basis points, and ordering.

Partner Ideas must be imported as versioned Invest4Fun records. Never depend on
a partner response to reconstruct a past purchase.

### Basket, order, and execution

1. `app.baskets`
   - User ID, wallet ID, draft/confirmed status, settlement asset, timestamps.
2. `app.basket_items`
   - Direct asset or Idea version reference, requested amount/allocation, and
     display ordering. Exactly one source reference must be present.
3. `app.orders`
   - Immutable confirmed intent, user/wallet, idempotency key, input amount,
     settlement mint, policy versions, status, and timestamps.
4. `app.order_items`
   - Flattened executable asset leg plus original Basket/Idea attribution.
5. `app.quote_snapshots`
   - Provider, quote request/response evidence, input/output base units,
     slippage, route, expiry, and received timestamp.
6. `app.executions`
   - Order, attempt number, provider, status, submission mode, and error code.
7. `app.blockchain_transactions`
   - Execution, sequence, chain, unsigned message commitment, signature,
     blockhash validity, status, slot, fee, priority fee, and timestamps.
8. `app.fills`
   - Order item, transaction, asset, confirmed output amount, price/cost
     evidence, and status.
9. `app.lots`
   - Fill, user, wallet, asset, Idea version or direct-purchase attribution,
     acquired amount, remaining amount, and cost basis.
10. `app.sponsorship_charges`
    - Operation/transaction, sponsor, base fee, priority fee, account rent,
      retry cost, status, and policy decision.

### Funding, withdrawal, and evidence

1. `app.ramp_providers`
   - Provider identity and operational status.
2. `app.ramp_coverage`
   - Provider, country, fiat currency, payment method, network, asset, limits,
     and availability timestamps.
3. `app.provider_quotes`
   - User, provider, direction, fiat minor units, crypto base units, fees,
     exchange rate evidence, expiry, and external reference.
4. `app.deposits`
   - User, wallet, source type, provider/transaction references, expected and
     settled amounts, lifecycle status, and timestamps.
5. `app.withdrawals`
   - User, source wallet, destination, crypto/off-ramp type, amounts, provider
     reference, lifecycle status, and timestamps.
6. `integration.webhook_events`
   - Provider, external event ID, payload, received/processed timestamps,
     processing status, and error. Unique on `(provider, external_event_id)`.
7. `app.operations`
   - Common user-facing timeline record referencing the specific deposit,
     order, sale, or withdrawal record.
8. `integration.jobs`
   - Job type, entity reference, payload, attempts, run time, lock owner,
     last error, and terminal status.

## Provider Boundaries

Every external provider must implement a narrow interface and return normalized
domain values. Provider-specific response types must not leak into route handlers
or React components.

### Privy

Owns authentication, login methods, linked wallets, embedded-wallet custody, and
session restoration. The API verifies tokens and upserts the internal User,
Identity, and Wallet role mapping. The browser never sends an authoritative user
ID; the API derives it from the verified token.

### Feed candidate and ranking pipeline

```text
Eligible asset universe
  -> shared discovery snapshot
  -> fresh market enrichment
  -> policy and liquidity filters
  -> user preference filtering
  -> deterministic or approved AI ranking
  -> persisted Feed session and explanations
```

The first implementation should use a controlled allowlist plus provider
discovery. Reuse the existing concepts of candidate discovery, market
enrichment, deterministic ranking, and eligibility checks, but replace
wallet-scoped weekly sessions with user-scoped Feed sessions.

Freshness classes must be separate:

- Static metadata: configurable multi-hour TTL.
- Discovery and eligibility metadata: configurable minute-level TTL.
- Feed market metrics: short TTL with explicit `asOf` timestamps.
- Execution price/route: never taken from Feed; obtain a new expiring quote.

Use request coalescing so concurrent users do not trigger identical upstream
requests. Cache shared market snapshots by asset, not by user.

### Cesto and prepared Ideas

Reuse the catalog normalization, weight normalization, minimum allocation, and
Idea history concepts. Import partner compositions into `ideas`,
`idea_versions`, and `idea_components`. Preserve source attribution and source
timestamps. If a component is not executable, show the Idea as unavailable or
create a clearly versioned eligible composition; never silently change a past
Idea version.

### CoinGecko and GeckoTerminal

Use for metadata, market enrichment, asset details, and chart history. Keep
timeouts, validation, cache deduplication, fallback behavior, and `asOf` values.
Do not call these services directly from the browser. A missing chart is a
degraded read experience, not a reason to make purchase execution fail.

### Jupiter

Use for Solana token discovery where approved, executable route checks, quotes,
swap transaction preparation, submission where applicable, status checks, and
output reconciliation. Tokenized equities such as xStocks are Solana assets;
Jupiter is the execution route when a valid route exists.

Reuse the provider error normalization, transaction commitment checks, quote
validation, transaction status, and balance-delta reconciliation concepts.
Re-audit instruction merging before reuse. Solana transaction size, account-key,
compute, blockhash, and provider-route constraints must be enforced after actual
message compilation and simulation.

One product confirmation does not guarantee one Solana transaction. Model one
Order with one or more transaction groups. The UI presents one operation and a
per-leg result. A one-signature experience requires a separately approved Privy
delegated/session signing and sponsorship design; it must not be simulated by
hiding additional wallet prompts.

### Alchemy and Solana RPC

Use as read/indexing infrastructure for wallet token balances, transaction
lookup, and metadata when it improves reliability. Solana remains canonical.
Alchemy responses are not execution authorization and are not a durable product
ledger. The API returns normalized portfolio snapshots with provider and
freshness metadata.

### Ramps and sponsorship

Define interfaces before selecting providers:

```ts
interface OnRampProvider {
  coverage(input: CountryAndCurrency): Promise<RampOption[]>;
  quote(input: RampQuoteRequest): Promise<RampQuote>;
  checkout(input: RampCheckoutRequest): Promise<RampCheckout>;
  parseWebhook(request: RawWebhookRequest): Promise<VerifiedProviderEvent>;
}

interface TransactionSponsor {
  evaluate(input: SponsorshipRequest): Promise<SponsorshipDecision>;
  prepare(input: ApprovedTransaction): Promise<SponsoredTransaction>;
}
```

Webhook signatures must be verified against the raw request body. All provider
events and command endpoints require idempotency.

## Portfolio Model

Portfolio APIs must return two compatible views:

1. Holdings view: aggregate by canonical Asset across the embedded wallet.
2. Ideas view: attribute remaining lots to direct purchases or Idea versions.

Example:

```text
Idea A owns attribution for 2 SOL
Idea B owns attribution for 1 SOL
Onchain wallet balance is 3 SOL
```

The chain does not preserve Idea attribution. Confirmed fills create lots in the
database. Reconciliation compares the sum of remaining lots with supported
onchain balances and records differences. Before implementing sales, product and
engineering must choose how reductions are assigned when an asset belongs to
multiple Ideas: explicit Idea sale, FIFO, or pro-rata. Never invent attribution
after an unmatched external transfer.

Initial portfolio analytics:

- Total current value and value timestamp.
- Net deposits and withdrawals.
- Total unrealized and realized P&L when cost evidence is available.
- Allocation by asset and asset class.
- Current value and P&L by Idea version.
- Activity timeline linked to blockchain explorer transactions.
- Reconciliation warning when chain balance and tracked lots differ.

## API Surface

All authenticated routes derive `userId` from middleware and validate request,
params, and response with `@invest4fun/contracts` schemas.

### Identity and account

- `POST /api/auth/bootstrap`: verify Privy token; idempotently create/update User,
  Identity, and wallet mappings; return the internal account summary.
- `GET /api/me`: return profile, embedded wallet, external wallet references,
  preferences, onboarding state, and current spending-period summary.
- `PATCH /api/me/preferences`: update validated product preferences.
- `POST /api/me/wallets/sync`: reconcile linked Privy wallets after a link/unlink.

### Feed and Ideas

- `POST /api/feed/sessions`: create or return an idempotent fresh Feed session.
- `GET /api/feed/sessions/:id`: paginate items and include market freshness.
- `POST /api/feed/sessions/:id/items/:itemId/decision`: record accept/reject/save.
- `GET /api/ideas`: list current available Idea versions.
- `GET /api/ideas/:id`: return composition, availability, history, and source.
- `POST /api/ideas/from-basket`: create a reusable user Idea after a confirmed
  purchase, only when this product behavior is approved.

### Basket and purchase

- `POST /api/baskets`: optionally persist a cross-device draft.
- `PUT /api/baskets/:id/items`: replace validated draft items.
- `POST /api/baskets/:id/review`: flatten Ideas, merge duplicate assets, apply
  minimums and spending limits, and return an indicative review.
- `POST /api/orders`: confirm a reviewed Basket with an idempotency key.
- `POST /api/orders/:id/quote`: obtain and persist fresh executable quotes.
- `POST /api/orders/:id/prepare`: simulate and prepare transaction groups.
- `POST /api/executions/:id/submissions`: accept signed transaction evidence or
  initiate an approved delegated/sponsored submission.
- `GET /api/orders/:id`: return Order, transaction, fill, and reconciliation state.

### Portfolio and activity

- `GET /api/portfolio/summary`: totals and freshness.
- `GET /api/portfolio/holdings`: aggregated Asset view.
- `GET /api/portfolio/ideas`: Idea attribution view.
- `GET /api/activity`: paginated user-facing operations.
- `GET /api/assets/:id/history`: normalized market history.
- `GET /api/ideas/:id/history`: partner or calculated Idea history.

### Funding

- `GET /api/ramps/options?country=&currency=`: eligible provider/payment options.
- `POST /api/ramp-quotes`: obtain and persist a provider quote.
- `POST /api/deposits/fiat`: create a Deposit and provider checkout.
- `POST /api/deposits/crypto`: create a monitored Deposit intent.
- `GET /api/deposits/:id`: return lifecycle and confirmations.
- `POST /api/webhooks/:provider`: verify, deduplicate, persist, and enqueue events.

Sales and withdrawals should mirror the Order/Execution lifecycle and are added
after purchase settlement and lot attribution are reliable.

## Operation State Machines

State transitions belong in `packages/domain` and are enforced in database
transactions. Route handlers cannot set arbitrary status strings.

### Order

```text
DRAFT -> REVIEWED -> CONFIRMED -> QUOTED -> PREPARED
      -> AWAITING_SIGNATURE -> SUBMITTED
      -> SETTLED | PARTIAL | FAILED | EXPIRED
```

### Blockchain transaction

```text
PREPARED -> SIGNED -> SUBMITTED -> CONFIRMED | FAILED | EXPIRED
```

### Deposit

```text
CREATED -> AWAITING_PROVIDER -> AWAITING_PAYMENT
        -> AWAITING_CHAIN -> CONFIRMED
        -> FAILED | EXPIRED | REFUNDED
```

Every transition writes an operation event in the same database transaction.
Unknown or delayed provider states remain pending and are retried; they must not
be converted to success because an HTTP request timed out.

## Delivery Phases

### Phase 0: guardrails and runnable baseline

Tasks:

1. Keep the current workspace build, typecheck, lint, tests, and local compose green.
2. Add structured request IDs, normalized API errors, and process-level logging.
3. Add test database setup and migration tests.
4. Add `packages/domain` and `packages/integrations` without moving UI code.
5. Define environment schemas independently for web, API, and worker.
6. Ensure `.env.local`, provider secrets, and test wallet credentials are ignored.

Done when:

- A clean checkout can start PostgreSQL, migrate, run all services, and pass CI.
- API readiness fails when PostgreSQL is unavailable.
- No provider secret is present in a web bundle or API response.

### Phase 1: internal User, Identity, and Wallet bootstrap

Tasks:

1. Add identity/wallet migrations and repositories.
2. Extract reusable `requireUser` middleware around Privy token verification.
3. Make `/api/auth/bootstrap` idempotently upsert the internal records.
4. Configure and test the approved login methods (email, Google, passkey, and
   supported external wallets) in both the Privy dashboard and web provider.
5. Ensure every Invest4Fun User has an embedded Solana wallet even when the user
   originally authenticated with an external wallet. Wallet login must not turn
   that external address into the Invest4Fun portfolio wallet.
6. Classify the embedded Solana wallet separately from external linked wallets.
7. Return an internal account DTO; never expose database rows directly.
8. Make the web wait for both Privy readiness and API bootstrap before rendering
   authenticated product data.
9. Add wallet-link sync and account UI states: loading, incomplete wallet setup,
   ready, provider unavailable, and signed out.

Tests:

- First login creates exactly one User and Identity.
- Repeated login creates no duplicate records.
- Changing login method for the same Privy subject preserves the User.
- A second external wallet is linked but not selected as portfolio ownership.
- A forged wallet header cannot access another User.
- Refresh restores the Privy session and refetches the same internal account.

### Phase 2: canonical asset catalog and integration foundation

Tasks:

1. Add Asset, eligibility, and provider-snapshot migrations.
2. Define normalized discovery, enrichment, history, execution, indexer, and
   provider-cache interfaces.
3. Port pure Solana asset IDs, address validation, price parsing, deterministic
   shuffle/ranking, weight normalization, and normalized provider errors.
4. Adapt the market-data integration with timeouts, response validation,
   request coalescing, persistent cache, and stale-on-error policy.
5. Adapt Jupiter discovery and route eligibility without exposing execution yet.
6. Seed a small explicit allowlist for deterministic local/devnet behavior.
7. Add a worker job for shared metadata and market refresh.

Tests:

- Duplicate symbols with different mints remain distinct.
- Invalid or unverified assets cannot become executable.
- Cache keys include provider and chain.
- Concurrent identical lookups produce one upstream request.
- Stale market data is labeled and cannot become an execution quote.

### Phase 3: real Feed and prepared Ideas

Tasks:

1. Add Feed session/item and versioned Idea migrations.
2. Import curated Idea compositions through an idempotent importer.
3. Adapt Idea allocation, minimum investment, duplicate-leg merge, and history.
4. Build Feed orchestration: universe, enrichment, eligibility, preferences,
   ranking, explanation, persistence, pagination.
5. Replace the static API catalog with authenticated Feed session and Idea routes.
6. Split Feed and Ideas into clear UI surfaces while preserving the existing design.
7. Show market `asOf`, source, risk, executability, empty, stale, and degraded states.
8. Record user decisions without treating them as financial-advice acceptance.

Done when:

- A login creates a new Feed session from current eligible data.
- Refreshing the page returns the same session until the configured refresh rule;
  an explicit new-session command creates another session.
- An unavailable provider degrades gracefully to approved cached/curated data.
- Every shown asset can be traced to universe, policy, market snapshot, and ranking version.

### Phase 4: basket workflow and review

Tasks:

1. Introduce a versioned browser Basket reducer with local persistence.
2. Support direct Assets and Idea versions in one draft.
3. Add amount inputs, allocation validation, duplicate merging preview, and removal.
4. Add a dedicated review screen rather than executing from a Feed card.
5. Implement server review that re-resolves current Idea versions and eligibility.
6. Enforce minimum amount, balance, asset allowlist, and spending-period rules.
7. Create immutable Orders using client-generated idempotency keys.
8. Clear the local Basket only after the API returns the durable Order.

Tests:

- Reload restores an unconfirmed Basket.
- Repeated confirmation requests create one Order.
- The same asset selected directly and through Ideas becomes one execution leg
  while retaining multiple attribution records.
- An Idea update does not mutate an already reviewed or confirmed Order.
- Client-modified prices, wallet IDs, or risk flags are ignored/rejected.

### Phase 5: embedded-wallet balances and portfolio reads

Tasks:

1. Add a Solana indexer/RPC adapter and normalized balance DTOs.
2. Resolve the embedded wallet from the authenticated User, never from a public
   route address for private portfolio endpoints.
3. Build portfolio summary and holdings APIs with freshness metadata.
4. Add chart history endpoints and frontend charts with loading/degraded states.
5. Implement zero-balance, unsupported-token, and externally transferred-token behavior.
6. Keep Idea view empty until confirmed lots exist; do not infer Ideas from balances.

Tests:

- External linked-wallet balances are excluded.
- Unsupported tokens cannot affect supported portfolio totals silently.
- Provider pagination is fully consumed.
- Large integer balances do not lose precision.
- Cached values are visibly timestamped and eventually refreshed.

### Phase 6: crypto deposits and activity

Tasks:

1. Add Operation, Deposit, event, and job migrations.
2. Show the embedded wallet address and safe copy/QR deposit interaction.
3. Create crypto Deposit intents where the product needs an expected source/amount.
4. Monitor signatures or wallet inflows through the worker.
5. Require configured confirmation/finality policy before crediting.
6. Add Activity API/UI based on operation events.
7. Link confirmed transactions to the Solana explorer for the active cluster.

Done when:

- A devnet transfer reaches pending, confirmed, and credited states without the
  browser remaining open.
- Duplicate observations do not double-credit a Deposit.
- Worker restart does not lose pending work.

### Phase 7: Jupiter purchase execution on devnet/test assets

Tasks:

1. Add Order, quote, execution, transaction, fill, and lot migrations.
2. Adapt Jupiter quote and preparation behind the normalized interface.
3. Compile, size-check, simulate, and validate each prepared Solana transaction.
4. Persist quote expiry, unsigned message commitment, expected balance changes,
   and transaction sequence before asking for a signature.
5. Implement wallet signing with Privy-supported Solana APIs.
6. Submit transactions and enqueue confirmation/reconciliation jobs.
7. Create fills and lots only from confirmed onchain evidence.
8. Expose one Order status with per-leg outcomes and partial-settlement UI.
9. Make expired blockhash/quote flows produce a new attempt without mutating old evidence.

Security gates:

- Server validates every mint, amount, destination, program, and expected output.
- Browser-supplied unsigned transactions are never trusted.
- Prepared-message commitment is checked before accepting signed bytes.
- Simulation failure blocks signing/submission.
- Retry cannot repeat a leg already proven settled.

### Phase 8: reconciliation and attributed Portfolio

Tasks:

1. Implement transaction status and token-balance delta reconciliation.
2. Advance `SUBMITTED` Orders to `SETTLED`, `PARTIAL`, or `FAILED` through worker jobs.
3. Add idempotent fill/lot creation in a database transaction.
4. Build aggregate holdings from chain snapshots and Ideas from remaining lots.
5. Record unmatched balance differences for review instead of fabricating attribution.
6. Add P&L calculations only where price and cost basis evidence is sufficient.
7. Add operational dashboards/alerts for old pending and reconciliation failures.

Done when:

- A successful purchase appears in Activity, Holdings, and the correct Idea view.
- Partial execution shows only confirmed fills and preserves failed legs for retry or closure.
- Re-running reconciliation produces no duplicate fills or lots.

### Phase 9: fiat on-ramp

Tasks:

1. Finalize launch countries, currencies, KYC ownership, settlement asset, and providers.
2. Implement country-aware coverage and quote adapters.
3. Persist quote evidence before redirect/widget checkout.
4. Verify webhooks using raw body and provider signature.
5. Deduplicate events and reconcile provider success with onchain settlement.
6. Separate provider payment success from blockchain-confirmed Deposit credit.
7. Add cancellation, expiry, fee, limit, KYC-required, and unsupported-country UX.

### Phase 10: gas sponsorship

Tasks:

1. Verify current Privy, Jupiter, and alternative sponsor capabilities against the
   exact embedded-wallet signing model before choosing a provider.
2. Define eligible operations and programs, per-user/day limits, global budget,
   supported mints, transaction-size limits, and priority-fee ceilings.
3. Simulate server-side and reject arbitrary instructions or destinations.
4. Persist each sponsorship decision and actual onchain cost.
5. Add retries with capped attempts and idempotent transaction tracking.
6. Add circuit breakers for spend rate, provider error rate, and suspicious users.
7. Expose internal cost metrics by operation, transaction, user cohort, and month.

The external-wallet deposit fee remains the sender's responsibility. Sponsorship
applies only to explicitly eligible Invest4Fun operations.

### Phase 11: sales, withdrawals, and Idea reduction

Tasks:

1. Finalize lot-reduction policy for asset sales across Ideas.
2. Implement sell quote/order/execution using the same evidence model as purchase.
3. Reduce lots only after confirmed fills.
4. Add crypto withdrawal allowlists, address checks, confirmation, and reconciliation.
5. Add off-ramp adapters only after launch-country/KYC rules are approved.
6. Maintain auditable links between sale proceeds and withdrawal requests.

### Phase 12: spending periods and return cycle

Tasks:

1. Implement spending-period creation and rollover.
2. Reserve spend at Order confirmation and convert reserve to confirmed spend at settlement.
3. Release reservations for failed/expired legs.
4. Show remaining limit in Feed, Basket, and Account.
5. Generate a new Feed according to explicit product refresh rules.
6. Keep automatic funding, automatic execution, and rebalancing out of scope until
   independently specified and authorized.

## Performance And Reliability For Approximately 20,000 Users

Twenty thousand registered users do not require microservices. Keep the API and
worker as separate deployable processes with modular code and scale them
horizontally.

1. API instances are stateless; sessions live in Privy and durable state in PostgreSQL.
2. Use bounded database pools per process and size total connections for the
   managed PostgreSQL limit.
3. Use indexed keyset pagination for Feed, Ideas, Activity, and operations.
4. Never fetch market data once per user. Refresh shared asset snapshots and rank
   from normalized cached data.
5. Coalesce identical provider requests and enforce timeouts, retries with jitter,
   concurrency limits, and provider-specific circuit breakers.
6. Claim background jobs with `FOR UPDATE SKIP LOCKED`; jobs must be idempotent and
   safe under multiple workers. Introduce a dedicated queue only when measurements
   show PostgreSQL jobs are the bottleneck.
7. Add Redis only when multi-instance hot-cache hit rate or distributed rate limits
   justify it; keep PostgreSQL as durable evidence.
8. Partition or archive high-volume operation events and provider snapshots based
   on measured growth, not before it is needed.
9. Serve the landing page and web static assets through a CDN with immutable hashed
   files. Lazy-load charts, wallet-heavy screens, and provider SDKs where practical.
10. Track web bundle budgets by route and fail CI on material regression after a
    baseline is established.
11. Use request IDs, structured logs, error tracking, provider latency/error metrics,
    queue age, reconciliation age, and sponsor-cost alerts.
12. Load-test auth bootstrap, Feed creation, portfolio reads, Order idempotency, and
    worker job claiming before production.

Initial service-level targets to validate with product and infrastructure:

- Read API p95 below 500 ms when served from internal/shared cache.
- Command API p95 below 1 second excluding explicit third-party checkout/signing.
- No lost durable operation after a successful command response.
- Provider degradation must not corrupt Orders or portfolio attribution.
- Reconciliation backlog and oldest pending age must be observable.

## Test Strategy

1. Unit tests: allocation, state transitions, money/base-unit conversion, policy,
   deterministic ranking, attribution, and provider error normalization.
2. Contract tests: every API schema and every provider adapter using captured,
   sanitized fixtures.
3. Repository tests: migrations, uniqueness, idempotency, row locking, and rollback.
4. API integration tests: authentication, ownership, validation, idempotency, and
   normalized failures against a test database.
5. Worker tests: retry/backoff, duplicate jobs, restart recovery, and terminal failure.
6. Solana integration tests: devnet/local-validator signing, submission, confirmation,
   expiry, failed simulation, partial execution, and balance reconciliation.
7. Browser tests: login restoration, Feed, Basket refresh, expired quote, signing,
   partial outcome, portfolio, and responsive layouts.
8. Security tests: forged identity/wallet, arbitrary transaction substitution,
   webhook replay, excessive sponsorship, object ownership, and rate limits.
9. Load tests: shared Feed cache, 20k-user account dataset, portfolio concurrency,
   Order idempotency bursts, and worker backlog recovery.

Every migrated pure function should bring its focused tests. Provider code must
not be considered migrated until its responses are validated and failure modes
are covered.

## Reuse, Rewrite, And Exclude

### Adapt and reuse

- Solana address and canonical asset helpers.
- Jupiter discovery, quote, preparation, submission, status, and reconciliation
  concepts after security review.
- CoinGecko/GeckoTerminal validation, enrichment, history, cache, and fallback concepts.
- Cesto catalog normalization and historical chart adapter.
- Idea weight normalization, minimum allocation, flattening, and duplicate-leg merging.
- Deterministic ranking and deterministic shuffle as an auditable fallback.
- Quote expiry, slippage, provider error normalization, and transaction commitment checks.
- Pure frontend formatting/chart utilities and visual components that match the new UI.
- Focused tests for the reused pure and provider behaviors.

### Rewrite around the new model

- Authentication middleware: resolve internal User, not only a wallet owner.
- Persistence: replace wallet-keyed preferences and weekly sessions with the data model above.
- Feed orchestration: user Feed sessions with freshness evidence, not execution-provider sessions.
- Portfolio: authenticated embedded wallet plus chain state and lots, not arbitrary address reads.
- Execution routes: thin modules and worker-driven state transitions, not one large route file.
- Client navigation and Basket state: explicit screens and a durable Order handoff.
- Configuration: Solana-first providers and per-runtime environment validation.

### Do not carry forward

- Robinhood-chain, EVM smart-wallet, 0x, Uniswap, World ID, and Substreams code unless
  a separately approved product requirement restores them.
- Demo settlement endpoints in any production build.
- In-memory stores as a non-test fallback.
- Wallet address as User ID or authorization proof.
- Provider response shapes inside database records without normalized columns and versioning.
- A single giant Express module or a single giant React component.
- Browser-controlled execution status, prices, eligibility, or sponsorship decisions.
- A five-minute execution price cache.

## MVP Critical Path

For the first credible Solana product demo, implement in this order:

1. Internal account bootstrap and embedded-wallet mapping.
2. Small safe Asset catalog plus current market data.
3. Real Feed sessions and imported prepared Ideas.
4. Basket review with amount allocation and immutable Order creation.
5. Embedded-wallet balance and crypto deposit monitoring on devnet.
6. Jupiter-compatible devnet/test execution path, or an explicit local-validator
   execution harness when provider routes are unavailable on devnet.
7. Worker confirmation, reconciliation, fills, and lots.
8. Portfolio Holdings/Ideas and Activity with explorer evidence.
9. Gas sponsorship only after the transaction authority model is verified.
10. Fiat on-ramp only after launch geography and provider contracts are approved.

The demo must distinguish simulated provider data from real devnet transactions.
Never label a mocked fill as settled onchain.

## Decisions That Still Block Specific Phases

These decisions do not block Phases 0-6, but they block the named later work:

| Decision | Blocks |
|---|---|
| Exact launch asset universe and memecoin eligibility policy | Production Feed and execution |
| Whether a purchased custom Basket automatically becomes a reusable user Idea | User Idea creation |
| Sale attribution policy when one Asset belongs to multiple Ideas | Sales and realized P&L |
| Launch countries, currencies, KYC owner, and on-ramp providers | Fiat funding |
| Settlement asset for purchases, sales, and withdrawals | Final execution and withdrawal contracts |
| Embedded-wallet delegated signing and sponsor provider/policy | One-approval gasless UX |
| Legal wording, disclosures, and retention periods | Production onboarding and history retention |

Until a decision is finalized, keep the boundary behind an interface, feature
flag, nullable configuration, or disabled UI state. Do not encode a temporary
answer as an irreversible schema assumption.

## Definition Of Done For The Core Application

The core application is complete when a new user can:

1. Sign in through Privy and receive one stable internal Invest4Fun account.
2. Obtain an embedded Solana wallet while keeping external wallets separate.
3. View a traceable, fresh Feed and prepared Ideas.
4. Build and review a Basket with current eligibility and amount validation.
5. Fund the embedded wallet with a devnet crypto transfer.
6. Confirm an Order and sign the approved Solana transaction flow.
7. Close the browser while the worker confirms and reconciles settlement.
8. Return to see accurate Activity, aggregate Holdings, and Idea attribution.
9. See explicit pending, expired, failed, and partial states without false success.
10. Repeat requests and worker jobs without duplicate Users, Orders, Deposits,
    fills, lots, or credits.

Production release additionally requires approved legal/compliance behavior,
provider contracts, secret management, monitoring, backups, incident procedures,
load tests, security review, and sponsorship budget controls.
