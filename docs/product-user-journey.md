# Invest4Fun Product User Journey

This document captures the current product interpretation of the user journey
based on the latest product feedback. It separates decisions that are currently
usable for architecture work from questions that still require product approval.

The journey describes the first usable product slice. It does not assume that
recurring investment, rebalancing, every asset class, or every fiat provider is
fully specified yet.

## Core Model

An Invest4Fun user account and an external crypto wallet are separate things.
The user account owns the Invest4Fun identity and the embedded Solana wallet.
The embedded wallet owns the assets shown in the Invest4Fun portfolio.

External wallets such as Phantom or Backpack are not merged into the account or
portfolio. They are external funding sources and possible withdrawal
destinations.

```text
User account
  -> Identity and authentication method
  -> Invest4Fun embedded Solana wallet
      -> Invest4Fun portfolio
          -> Assets held by that wallet

External wallet
  -> Deposit source or withdrawal destination
  -> Not merged into the Invest4Fun portfolio
```

## Full User Journey

### 1. Registration

The user opens the application and creates an Invest4Fun account.

The system:

1. Creates the internal user record.
2. Creates or links the user's authentication identity.
3. Creates an embedded Solana wallet for the Invest4Fun account.
4. Keeps the internal user identifier independent from the authentication provider.
5. Shows an empty Invest4Fun portfolio until funds or assets arrive.

The user may later connect an external wallet, but that wallet remains separate
from the embedded wallet.

### 2. Deposit

The user chooses how to fund the Invest4Fun wallet:

- Crypto transfer from an external wallet.
- Fiat deposit through a card or bank transfer flow.

The deposit is one product step. Fiat-to-crypto conversion is a subflow of the
fiat deposit, not a separate top-level user journey step.

#### Crypto deposit

```text
External wallet
  -> User signs and sends a transfer
  -> User pays the network fee for the outgoing transfer
  -> Invest4Fun observes the transaction
  -> Invest4Fun credits the deposit after confirmation
```

The API must create a pending deposit record before or while the transfer is
being initiated. A worker later confirms the transaction from the chain and
advances the deposit state.

#### Fiat deposit

```text
User country
  -> Available on-ramp providers
  -> Provider rate and quote
  -> User completes the provider flow
  -> Provider converts fiat to crypto
  -> Provider sends crypto to the Invest4Fun wallet
  -> Invest4Fun observes and confirms the deposit
```

The application needs a country-aware provider layer. Provider data may include:

- Supported countries and currencies.
- Supported payment methods.
- Supported assets and destination networks.
- Rate or quote details.
- Fees, limits, expiration time, and quote status.
- Provider checkout or redirect information.
- Provider transfer identifiers and webhook events.

### 3. Balance Becomes Available

After the deposit is confirmed, the user's Invest4Fun wallet has an available
balance for investing.

The system should distinguish at least:

- Deposit initiated.
- Deposit waiting for the provider.
- Deposit waiting for blockchain confirmation.
- Deposit credited.
- Deposit failed or expired.

The portfolio view should be derived from the embedded wallet and confirmed
Invest4Fun operations. An external wallet balance is not included.

### 4. AI Feed and Ideas

The user describes their goals and constraints. The current product direction
is to collect information such as:

- Investment goal.
- Risk tolerance.
- Investment horizon.
- Relevant restrictions or preferences.

The system then presents two related but distinct product surfaces:

- **Feed**: individual asset cards.
- **Ideas**: bundles, portfolios, or other prepared investment ideas.

The first version may use a curated or preconfigured asset universe. Each Feed
item should include a clear explanation of why the asset is being shown. The
system must not present the output as regulated financial advice until the
legal/product language and data sources are approved.

The user can accept or reject individual Feed positions. The user can also
select an Idea as a group rather than selecting every underlying asset manually.

### 5. Basket Review and Confirmation

Accepted Feed positions and selected Ideas are assembled into a basket.

The current working interpretation is:

- A basket is a temporary selection before execution.
- It may contain individual assets, Ideas, or both.
- It contains the selected amounts or allocation inputs.
- It is not automatically a long-term strategy.
- A draft basket can initially live in client state.
- A confirmed basket or order must be persisted by the backend.

The user reviews the basket and confirms the purchase. The API then:

1. Validates the user, wallet, balance, asset allowlist, and amounts.
2. Requests current quotes from the execution provider.
3. Builds one or more Solana transactions.
4. Applies the approved gasless/sponsorship policy.
5. Sends the transaction flow for signing or sponsored execution.
6. Stores operation and transaction identifiers.
7. Waits for confirmation through the worker.
8. Reconciles the final wallet state with the intended result.

The user should not need to understand whether the execution required one or
several underlying transactions. The UI should present one purchase intent with
an understandable final result.

#### Price changes and partial execution

Quotes are time-sensitive. If the price changes within the accepted slippage
range, execution may continue. If it moves outside the allowed range, the
affected purchase should fail rather than silently execute at an unexpected
price.

The UI must support partial outcomes, for example:

- All transactions settled.
- Some transactions settled and some failed.
- No transactions settled.
- The result is still being confirmed.

The product feedback currently favors minimizing user signatures and showing a
clear settled/not-settled result for each relevant operation.

### 6. Gasless Execution

The product assumption is that a user should not need to hold SOL to perform
Invest4Fun operations inside the application.

```text
External wallet deposit
  -> User pays the outgoing network fee

Invest4Fun purchase / sale
  -> Invest4Fun applies the approved sponsorship policy
  -> Paymaster or sponsor pays eligible network costs
```

The platform must budget for more than the base transaction fee. The cost model
should include:

```text
users
* investment cycles
* transactions per basket
* average network and priority fees
* account/ATA rent where applicable
* retries and failed simulations
* RPC/provider costs
```

The backend should protect the sponsor with allowlists, simulation, per-user
and per-operation limits, monitoring, rate limits, and a circuit breaker.

### 7. Next Investment Cycle

The current product direction is closer to DCA than to a fully automated
portfolio manager.

The user may choose a period and a spending limit. Within that period, the user
may invest once or multiple times and may spend the full limit at once or in
parts.

The intended early behavior is therefore:

```text
User chooses a period and limit
  -> User can return during the period
  -> User reviews the current Feed or Ideas
  -> User buys one or more times
  -> The system tracks spend against the limit
```

This does not yet define whether the application automatically creates a new
Feed, continues an existing Idea, or rebalances the portfolio.

Recurring funding from a card or bank account is a separate automation problem
and must not be confused with the frequency of the user's investment decision.

### 8. Sell and Withdraw

The user can initiate a sale for:

- A single asset.
- Part of a basket.
- A complete basket.
- All supported assets in the Invest4Fun portfolio.

The sale converts the selected assets into an approved settlement asset, which
is currently expected to be USDC or SOL. The user can then choose:

- Crypto withdrawal to an external wallet.
- Fiat withdrawal through an off-ramp provider to a bank account.

```text
Invest4Fun portfolio
  -> User selects asset, basket, or all assets
  -> Sale quote and confirmation
  -> Solana execution
  -> Settlement asset becomes available
  -> Crypto withdrawal or fiat off-ramp
```

The current assumption is that the user may not have SOL for the sale, so
eligible sale transactions should also use the platform's gasless policy.

## Durable Data and Operation Evidence

The following records are likely required for the first end-to-end slice:

| Record | Purpose |
|---|---|
| User | Internal application owner of all Invest4Fun data |
| Identity | Authentication identity or login method linked to the user |
| Wallet | Embedded wallet and external wallet references with explicit roles |
| Asset | Supported asset metadata and chain identifiers |
| OnRampProvider | Country and payment-method availability |
| ProviderQuote | Rate, fee, limits, expiry, and provider reference |
| Deposit | Fiat or crypto funding lifecycle |
| FeedItem | Asset card shown to the user and its explanation/source reference |
| Idea | Prepared bundle, portfolio, or product idea |
| Basket | Confirmed selection or order intent |
| BasketItem | Asset, Idea, amount, or allocation within a basket |
| Operation | User-facing purchase, sale, deposit, or withdrawal intent |
| Transaction | One underlying blockchain transaction and its status |
| Withdrawal | Crypto or fiat payout lifecycle |
| WebhookEvent | Provider event received and deduplicated |

Draft basket state can initially remain client-side. Confirmed operations,
provider references, transaction identifiers, status transitions, and final
settlement amounts belong in durable storage.

## Gasless Cost and Safety Controls

The platform should track sponsored execution separately from the user's
investment amount. For each sponsored operation, record enough evidence to
answer:

- Which user and wallet initiated it?
- Which operation was sponsored?
- Which transactions were included?
- What fee, priority fee, and rent were paid?
- Did simulation pass?
- Did the operation settle, fail, or partially settle?
- Was a retry used?

The application should be able to stop sponsorship without stopping read-only
portfolio access if provider costs, abuse, or failure rates exceed a limit.

## Open Product Decisions

These items should be explicitly answered before their fields and lifecycle
states become part of a production migration.

### AI and Feed

- Which exact data sources supply asset prices, metadata, risk information, and explanations?
- Is the first Feed curated, rules-based, AI-generated, or a combination?
- What does the AI output: descriptions, ranked options, questions, or recommendations?
- What legal language and disclosures are required?
- What does the AI do when it lacks sufficient user information?
- Is a Feed personalized once, or recalculated whenever the user returns?
- Are Feed items versioned so the user can see what data produced an explanation?
- Which asset classes are included in the first release?

### Basket and Purchase

- Is a basket only a one-time order, or can it become a reusable strategy?
- Is an Idea copied into the basket as individual items, or referenced as an Idea?
- Can a basket contain both individual assets and Ideas?
- Does the user set an amount per asset, an allocation percentage, or both?
- Is the draft basket stored only on the client, or synchronized across devices?
- When does a draft become a confirmed order?
- How long are quotes valid?
- What is the allowed slippage per asset or per basket?
- What is the exact UX when only some transactions settle?
- Are confirmed basket revisions required, or is operation history sufficient?

### DCA and Recurring Funding

- Is the investment period weekly, monthly, user-defined, or only a spending window?
- Is a spending limit separate from the investment schedule?
- Does each cycle produce a new Feed or continue an existing Idea?
- Is the user required to confirm every investment?
- Can recurring card or bank payments run automatically?
- Does recurring funding require a separate mandate, consent, or provider capability?
- Is target allocation part of the first version?
- Is rebalancing part of the first version?
- How is progress calculated and displayed?
- Which provider supplies the historical prices and portfolio chart data?

### Selling and Withdrawal

- Can the user sell one asset, part of a basket, a full basket, or all assets in one action?
- What is the canonical settlement asset: USDC, SOL, or an internal fiat balance?
- Which off-ramp providers and countries are supported first?
- What fees, limits, and exchange-rate details must be shown before confirmation?
- Who pays network fees and provider fees for each withdrawal path?
- What KYC/AML checks and thresholds apply?
- Which withdrawal statuses must be exposed to the user?
- Which history records are legally or operationally required to retain?
- What data can the user delete?

### Wallets, Sponsorship, and Security

- Which actions are gasless for the embedded wallet?
- Can an external wallet ever be used to sign an Invest4Fun operation, or only to deposit and withdraw?
- What sponsor budget is allowed per user, operation, and day?
- Which assets, programs, and instructions are allowlisted?
- What happens when a sponsored transaction fails after the user has confirmed?
- Who owns the reconciliation decision when provider data and chain data disagree?
- What monitoring and circuit-breaker thresholds disable sponsorship?

### Compliance and Product Scope

- Which jurisdictions are supported at launch?
- Are tokenized equities or other regulated assets included in the first release?
- What is the exact distinction between education, product explanation, and investment advice?
- What disclosures must appear before Feed, Basket, Purchase, Sale, and Withdrawal actions?
- What business model is being tested in the hackathon MVP?
- Which part of the user journey must be fully real on devnet, and which parts may be simulated?

## Recommended First Implementation Slice

The smallest coherent slice from the current answers is:

```text
Create account
  -> Create embedded devnet wallet
  -> Fund wallet from an external devnet wallet
  -> Show curated Feed and Ideas
  -> Accept positions
  -> Build and confirm a Basket
  -> Execute one supported purchase flow on Solana
  -> Reconcile the result
  -> Show the resulting Invest4Fun portfolio
```

Selling can be added as the second end-to-end operation. Fiat on-ramp,
off-ramp, recurring card payments, AI personalization, rebalancing, and
production gas sponsorship should remain explicit follow-up slices until their
product and compliance decisions are approved.
