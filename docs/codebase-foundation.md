# Codebase Foundation

## Runtime ownership

| Runtime | Owns | Does not own |
|---|---|---|
| Web | Rendering, navigation, interaction state, and accessible feedback | Secrets, sponsorship decisions, or provider trust |
| Landing page | Public, indexable product content and the link into the app | Authentication, wallets, or product operations |
| API | Authentication boundary, validation, idempotent commands, and provider orchestration | Long-running polling inside HTTP requests |
| Worker | Reconciliation, webhook processing, retries, and scheduled jobs | User-facing rendering |
| PostgreSQL | Durable product state and operation evidence | Live blockchain truth by itself |

## Source layout

The frontend uses `app`, `screens`, `components`, and `services`. It intentionally avoids a generic `features` folder: one screen may combine several user capabilities, while reusable UI and external boundaries remain independently discoverable.

## Database status

Only infrastructure is currently defined:

- `_infra.schema_migrations` tracks applied migrations.
- `app` is reserved for product-owned records.
- `integration` is reserved for provider and webhook staging and deduplication.

No product fields or relationships are committed yet. Future migrations must be additive and based on the approved entity diagram, ownership rules, lifecycle states, and retention requirements.

## Current constraints

- The internal user identifier must not be owned by an authentication vendor.
- External wallets are funding sources or withdrawal destinations and are not merged into the in-app portfolio.
- Provider credentials and sponsorship policies remain on trusted server infrastructure.
- Background operation state is advanced by workers, not only by browser polling.
