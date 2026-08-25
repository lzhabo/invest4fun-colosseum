# Frontend Architecture Migration

## Decision

The frontend is migrated in parallel under `apps/web-next`. `apps/web` stays
unchanged and runnable as the behavior and visual reference. This avoids a long
period where half-migrated code is the only runnable frontend and gives every
migration task a stable comparison point.

`web-next` is intentionally temporary naming. Rename or replace `apps/web` only
after route parity is complete; do not keep two production frontends.

## Dependency flow

```text
main
  -> app providers + routes
  -> screen page/provider
  -> screen-local VM
  -> typed service / cross-screen store
  -> validated API contract / versioned browser storage
```

UI components receive typed props or one explicit VM/store. Services, stores,
and VMs do not render JSX. Only services access external boundaries. Each VM owns
and disposes its requests, timers, and subscriptions.

## Migration unit

A route is the smallest migration unit. For every route:

1. Record current behavior from `apps/web`.
2. Trace API, browser state, timers, and cross-screen dependencies.
3. Add a typed service or reuse an existing service boundary.
4. Put orchestration and derived screen state in a screen-local VM.
5. Keep page composition small and place atomic visual components in the single
   `src/components` directory.
6. Implement loading, empty, error, retry, and cleanup states.
7. Add focused VM/service tests and compare responsive behavior.
8. Mark the route migrated in `apps/web-next/README.md`.

## Cutover gate

- Every route and authenticated bootstrap scenario has behavior parity.
- Basket persistence and server synchronization survive refresh and retry.
- No provider secret or authoritative financial rule is present in the browser.
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass.
- A manual responsive comparison is complete for mobile and desktop.
- The cutover is isolated from feature work and remains reversible.
