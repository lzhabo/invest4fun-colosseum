# Invest4Fun Architecture and Solana Research

Date: 2026-08-12

## Executive recommendation

Invest4Fun should be built as a modular full-stack product with explicit trust and runtime boundaries.

The architecture should preserve several core safety properties:

- shared domain schemas and deterministic policy validation;
- provider adapters that run only on trusted server infrastructure;
- immutable prepared execution records bound to a plan commitment;
- client verification of the prepared plan before a wallet signature;
- settlement based on onchain evidence rather than a quote, HTTP success, or transaction hash alone.

The platform should move long-running provider calls, transaction polling, portfolio refreshes, and reconciliation into workers and queues. Short-lived quotes, token metadata, idempotency records, and distributed rate-limit state can use Redis or a similar system when load requires it.

Solana execution should be isolated behind a planner that measures transaction size, account count, compute units, route quality, and expected rent before choosing an execution mode.

For a Solana basket purchase, the preferred user experience is:

1. Attempt one atomic transaction.
2. Compact route and setup instructions if the first transaction does not fit.
3. If the basket still does not fit, use an explicitly controlled execution mode instead of presenting an unexpected series of wallet popups.

The controlled mode may use either:

- a user-authorized embedded-wallet flow with sponsored `signAndSendTransaction`; or
- a dedicated onchain program, vault, or session-authority design in which the user signs one bounded intent and execution can continue across multiple transactions within enforced limits.

The product must not promise one signature for an unlimited number of Jupiter swaps when an external wallet is used. A Solana wallet signature authorizes one transaction message. Several independent transaction messages normally require several wallet signatures unless delegated authority, session keys, or a program-level custody or escrow model is introduced.

## Solana architecture fundamentals

Solana is not simply a faster EVM network. Its execution and state model is different:

- **Accounts hold state.** Onchain state is stored in accounts addressed by 32-byte public keys.
- **Programs are stateless executable accounts.** A program resembles contract code, while mutable state is stored in separate accounts passed to its instructions.
- **Transactions contain instructions.** Instructions execute in order, and the complete transaction is atomic.
- **Every instruction declares its accounts in advance.** This enables parallel execution but makes routes that touch many pools and accounts physically larger.
- **Fees are paid in SOL.** The base fee is charged per signature, while the optional priority fee depends on requested compute units.
- **Program Derived Addresses are deterministic.** A PDA has no private key; its owning program can sign for it during a cross-program invocation.
- **Token balances live in token accounts.** An owner normally has a token account or Associated Token Account for each SPL token mint. Creating one requires a rent deposit.

### Solana Explorer

A transaction page in Solana Explorer shows the signature, slot, status, signers, account keys, instructions, logs, token balance changes, SOL balance changes, and compute usage.

Explorer is useful for support and debugging. Internal settlement must still rely on RPC or indexer reconciliation: terminal signature status plus the expected token and SOL balance changes.

### Smart account terminology

On EVM networks, a smart account usually means a contract wallet such as an ERC-4337 account or an EIP-7702-upgraded account.

Solana does not have the same universal wallet primitive. The closest practical equivalents are program-owned accounts, PDAs, multisig or program wallets such as Squads, session or delegation systems, and embedded-wallet infrastructure that abstracts signing.

For Solana, an embedded wallet and sponsored signing flow should not be described as an ERC-4337 equivalent. The authorization, fee payer, and state models remain Solana-native.

## Why Jupiter baskets hit transaction limits

The current maximum serialized size of a Solana legacy or v0 transaction is 1,232 bytes. The payload includes:

- signatures;
- message header;
- static account keys;
- recent blockhash;
- compiled instructions;
- instruction account indexes and data;
- Address Lookup Table metadata.

One signature consumes 64 bytes, and every static account key consumes 32 bytes. Address Lookup Tables replace many non-signer addresses with compact indexes, but they do not remove instruction data or all account overhead.

Jupiter swap routes can become large because a route may contain:

- compute budget instructions;
- Associated Token Account setup instructions;
- one or more swap instructions;
- wrapped SOL cleanup instructions;
- pool, token, oracle, vault, program, and user token accounts;
- Address Lookup Table references.

The main Jupiter controls for reducing size are limiting `maxAccounts` and removing no-op ATA setup instructions when the required accounts already exist. Lower account limits can reduce route quality or remove routes completely, so the trade-off must be measured for every route.

Solana has announced larger transaction-size work, but the application must continue to design for the 1,232-byte v0 limit until compatible network, RPC, SDK, and wallet support is demonstrably available.

## Recommended Solana basket strategy

Implement a `SolanaExecutionPlanner` with explicit execution modes:

- `atomic`: every basket leg is included in one v0 transaction;
- `atomic_compacted`: route account caps, no-op ATA pruning, compute-budget deduplication, and route exclusion heuristics are applied;
- `split_preapproved`: multiple transactions execute through bounded delegated or session authority;
- `split_wallet_signed`: a last-resort mode in which the user signs every transaction and the UI clearly communicates partial-settlement risk.

### Near-term implementation

- Use the Jupiter build API when custom instruction composition is required.
- Fetch all expected output ATAs with a batched RPC call before composition.
- Remove idempotent ATA-creation instructions when the account already exists.
- Retry a measured sequence of `maxAccounts` limits for every basket size, for example 64, 56, 48, 40, 32, and 24.
- Reject a smaller route when its price impact, output amount, or safety properties are unacceptable.
- Score routes using `(fits, simulation result, price impact, output amount, account count, compute units)`.
- Limit basket complexity using measured serialized size rather than a fixed asset count.
- Show a basket-complexity guard before review when an atomic transaction is unlikely to fit.
- Store execution diagnostics such as `serializedBytes`, static account count, lookup table count, compute units, and route labels.

### Medium-term user experience

- Use sponsored embedded-wallet transactions for users who should not need to hold SOL.
- Allow external-wallet users to execute atomic transactions directly with their wallet.
- When an external-wallet basket requires splitting, either request several signatures or offer a separately explained managed or delegated mode.

If one signature for several transactions is a firm requirement, an Invest4Fun onchain program may be necessary:

- the user deposits USDC or authorizes a bounded vault or session;
- the signed intent contains maximum spend, allowed mints, slippage, expiry, and nonce;
- a backend executor performs several compatible Jupiter legs;
- the program enforces all limits and emits settlement events.

This design changes the custody and trust model and therefore requires a dedicated threat model, legal review, and a professional security audit.

## Identity and wallet model

Email-first onboarding is accessible to users who are new to crypto, while wallet-first onboarding is more natural for crypto-native users.

The initial choice should describe user intent rather than underlying technology:

- create an account and wallet with email or passkey;
- use an existing wallet.

An identity and wallet provider can remain the authentication layer while wallet login through SIWE or SIWS is enabled for existing-wallet users. Email or passkey can be linked later for recovery, notifications, and account continuity.

The internal model should keep these concepts separate:

- `userId`: the platform-owned user account identifier;
- `identity`: a verified login or linked identity from a provider;
- `executionWallet`: the wallet authorized to sign a prepared operation;
- `fundingWallet`: an external wallet used as a deposit source or withdrawal destination;
- `Invest4Fun wallet`: the embedded Solana wallet whose holdings form the in-app portfolio.

A user can have several identities and wallets. A prepared plan must always bind to one explicit execution wallet. The first wallet returned by an SDK must never be treated as an enduring product decision.

External wallets should not be merged into the Invest4Fun portfolio. In the current working product model, they are funding sources and withdrawal destinations only.

## Gasless architecture

Gasless means that the user authorizes an action while a sponsor account pays the Solana network fee. It does not mean the transaction is free to the product.

An initial sponsorship policy can distinguish between:

- inbound transfer from an external wallet: paid by the external wallet owner;
- internal purchase and sale: sponsored by Invest4Fun;
- crypto withdrawal: a product-policy decision with limits and abuse controls;
- fiat deposit or withdrawal: priced by the selected ramp provider and its blockchain flow.

### Cost model

The complete transaction cost can include:

- base fee per required signature;
- priority fee based on requested compute-unit limit and unit price;
- ATA rent deposits;
- failed attempts and bounded retries;
- swap, platform, RPC, wallet infrastructure, and provider fees.

A planning formula is:

```text
monthly sponsorship cost =
  active users
  × investment cycles per month
  × transactions per cycle
  × average sponsored transaction fee
  + ATA creation costs
  + failed attempts and retries
  + wallet and RPC infrastructure costs
```

Budgeting should use measured average and p95 values rather than the base fee alone. ATA creation can cost much more than the transaction fee, and the account owner may receive the rent refund even when the sponsor funded account creation.

### Sponsorship providers

#### Privy native sponsorship

Best suited when:

- Privy already provides authentication and embedded wallets;
- one product-level wallet and policy surface is preferred;
- sponsored transactions are sent through supported SDK or API flows;
- the required TEE execution path can be used.

Advantages:

- direct integration for embedded-wallet users;
- Solana React, REST, and Node flows support sponsored sending;
- one provider can cover identity, wallet, policy, and transaction management.

Trade-offs:

- strong coupling to supported wallet flows;
- external-wallet coverage depends on the signing and sending path;
- ATA rent and close-account behavior needs explicit abuse protection.

#### Alchemy Solana Gas Manager

Best suited when:

- sponsorship must support several Solana wallet types;
- fee-payer replacement and policy control should remain independent of the identity provider;
- the backend can validate serialized transactions before requesting sponsorship.

Advantages:

- can support external wallets;
- can sponsor network fees and supported rent flows;
- provides a separate policy layer when Alchemy is already used for RPC and indexing.

Trade-offs:

- adds another operational vendor and policy system;
- sponsorship may alter fee-payer or rent instructions, so message commitments must be computed after the sponsored message is final;
- rent prefunding is dangerous without strict program, mint, instruction, and amount allowlists.

#### Jupiter gasless execution

Best suited when a supported Jupiter-managed route meets the gasless requirements.

Advantages:

- convenient for supported swap flows;
- may cover network, priority, and ATA costs in eligible modes.

Trade-offs:

- eligibility depends on router, route, wallet SOL balance, trade size, and current product support;
- it is not a general application-wide sponsorship layer;
- custom multi-leg basket composition may not fit the managed flow.

### Recommended provider policy

- Primary path: Privy sponsorship for embedded-wallet transactions.
- Secondary path: Alchemy sponsorship when external-wallet support or independent fee policy is required.
- Jupiter gasless support: an opportunistic route optimization rather than the product foundation.

Before sponsorship, the backend must validate and simulate the final transaction. Policies should restrict programs, mints, instruction types, maximum spend, rent, slippage, compute price, transaction count, and rate per user or wallet. Monitoring must include spend, failures, retries, abnormal ATA creation, and sponsor-wallet runway, with automatic circuit breakers.

## Architecture for approximately 20,000 users

Twenty thousand registered users is moderate web traffic. The likely bottlenecks are provider APIs, RPC quotas, wallet infrastructure, transaction confirmation, and retries rather than React or PostgreSQL alone.

Recommended runtime boundaries:

- `web`: React application with route-level lazy loading and no provider secrets;
- `api`: authentication, validation, idempotent commands, provider orchestration, and status reads;
- `worker`: transaction submission, provider webhooks, retries, and reconciliation;
- `postgres`: durable users, identities, wallets, funding records, plans, executions, settlement evidence, and audit records after their schemas are approved;
- `redis` or equivalent, when needed: quote cache, metadata cache, idempotency locks, rate-limit buckets, and job queues;
- `observability`: structured logs and traces by `executionId`, provider metrics, spend dashboards, and alerts.

Separate workers can be introduced when traffic or operational ownership justifies them:

- execution and reconciliation worker;
- market data and token-universe worker;
- portfolio indexing and snapshot worker.

### Frontend bundle guidance

- Keep blockchain SDKs out of the initial route whenever possible.
- Load wallet, Solana, Jupiter, and provider-specific chunks only when their workflow starts.
- Lazy-load portfolio charting instead of including a large chart library in first paint.
- Use a server-state library only when server-state complexity justifies it.
- Optimize fonts and media and avoid embedding large base64 assets in JavaScript.
- Measure gzip and parsed JavaScript size in CI.

### Backend scalability guidance

- Do not rely on browser polling to advance reconciliation.
- Use idempotency keys for prepare, submit, and reconcile operations.
- Store provider response hashes and the evidence needed for audit without logging credentials or unnecessary sensitive payloads.
- Apply bounded retries, exponential backoff, per-provider concurrency limits, and circuit breakers.
- Separate read-heavy market endpoints from write-heavy execution commands.
- Cache token metadata and portfolio snapshots with explicit TTLs.
- Scale stateless API and worker processes horizontally before introducing microservices.

## Repository structure

```text
apps/
  web/                    # React UI, screens, components and API client
  api/                    # Trusted HTTP boundary
  worker/                 # Background processing runtime
packages/
  contracts/              # Shared transport schemas and types
  database/               # PostgreSQL connection and migrations
docs/                     # Architecture and product research
```

The frontend uses `app`, `screens`, `components`, and `services` rather than a generic `features` directory. A screen can combine several user capabilities, while reusable UI and external service boundaries remain easy to find.

## Delivery sequence

1. Establish the workspace, service probes, PostgreSQL migrations, and CI checks.
2. Confirm the product entity map for users, identities, wallets, countries, ramp providers, quotes, funding, recommendations, baskets, executions, and withdrawals.
3. Add database tables only after ownership, lifecycle, and retention questions are answered.
4. Implement the identity model and explicit embedded-wallet selection.
5. Add country-aware on-ramp provider discovery and quote contracts.
6. Implement atomic Solana purchase planning with transaction diagnostics.
7. Add sponsorship behind a policy-controlled feature flag.
8. Add worker-owned submission and reconciliation.
9. Add portfolio and exits after the purchase and settlement models are stable.
10. Load-test provider-facing paths with mocked providers before generating real RPC or vendor traffic.

## Source links

- Solana core concepts: https://solana.com/docs/core
- Solana transactions and the 1,232-byte limit: https://github.com/solana-foundation/developer-content/blob/main/docs/core/transactions.md
- Solana fees and compute limits: https://solana.com/docs/core/fees
- Solana accounts: https://solana.com/docs/core/accounts
- Solana PDAs: https://solana.com/docs/core/pda
- Solana larger transaction sizes: https://solana.com/upgrades/larger-transaction-sizes
- Jupiter transaction-size guidance: https://developers.jup.ag/docs/swap/advanced/reduce-transaction-size
- Jupiter gasless support: https://developers.jup.ag/docs/ultra/gasless
- Privy wallet login: https://docs.privy.io/authentication/user-authentication/login-methods/wallet
- Privy gas sponsorship: https://docs.privy.io/wallets/gas-and-asset-management/gas/setup
- Alchemy Solana sponsorship: https://www.alchemy.com/docs/wallets/transactions/solana/sponsor-gas
