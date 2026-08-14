# Privy Integration

The web app uses Privy for authentication and supports two entry paths:

- email login for users who do not have a crypto wallet;
- an existing Solana wallet for crypto-native users.

For users without a wallet, Privy is configured to create an embedded Solana
wallet on login. This wallet is a platform wallet identity; it is not merged
with an external wallet the user connects later.

## Environment

Copy `.env.example` to the local environment and set:

```env
VITE_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

`VITE_PRIVY_APP_ID` is public and is used by the browser. `PRIVY_APP_SECRET`
must only exist in the API environment and must never be exposed to Vite.

The Privy dashboard should allow email and Solana wallet login, with the local
origin enabled for development. Production origins will be added when the app
domain is configured.

## Request Flow

1. The browser opens the Privy login modal.
2. Privy returns an authenticated session and an access token.
3. The web app sends the token to `POST /api/auth/bootstrap`.
4. The API verifies the token with Privy's server SDK.
5. The API currently returns the verified Privy user ID. Persisting the
   internal Invest4Fun user, identity records, and wallets is the next step
   after the product data model is approved.
