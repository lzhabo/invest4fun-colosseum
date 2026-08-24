# Invest4Fun web-next

`web-next` is the parallel, AI-readable frontend migration workspace. The current
`apps/web` application remains the read-only behavior and visual reference until
each route is migrated and verified.

## Run

From the repository root:

```bash
npm run dev:api
npm run dev:web-next
```

The new app runs on `http://localhost:5174`; the current app remains on port
`5173`.

## Source map

- `app/`: provider composition and route registration only.
- `screens/<Feature>/`: route boundary, screen-local VM, and feature components.
- `stores/`: one flat store collection, composed by `RootStore` and exposed
  through `stores/index.tsx`.
- `services/`: HTTP and browser persistence boundaries.
- `components/`: one flat collection of atomic UI components: buttons, text,
  cards, modals, inputs, and layout primitives.
- `theme/`: typed visual tokens and global styles.
- `tests/`: one separate, flat collection of frontend tests.

Do not add `components` folders inside screens and do not add generic `features`,
`ui`, or `views` directories. A route moves from `apps/web` only as a complete
vertical slice with loading, error, empty, retry, cleanup, and tests where
behavior warrants them.

## Migration status

| Route | Status | Notes |
|---|---|---|
| Ideas | Migrated foundation | Typed service, `IdeasVM`, swipe actions, cleanup, basket integration |
| Activity | Static parity | Empty state only; no operation API exists yet |
| Feed | Pending | Still served by `apps/web` |
| Portfolio | Static foundation | Embedded-wallet boundary and honest empty state; portfolio API is pending |
| Account/Auth | Migrated foundation | MobX `AccountStore`, Privy bridge, API bootstrap, wallets, retry and logout |

The temporary workspace should replace `apps/web` only after all routes pass the
parity checklist. That cutover must be a separate, reviewable change.
