# Task Manager Schema

This schema is designed for Notion, but the same fields can be mirrored in
Trello, Asana, Todoist, Linear, or GitHub Projects.

## Databases

### Releases

| Property | Type | Required | Notes |
|---|---:|---:|---|
| Name | title | yes | Example: `R1 Feed Data Pipeline` |
| Status | select | yes | `Planned`, `Active`, `Review`, `Accepted`, `Released`, `Paused` |
| Objective | text | yes | One clear product outcome |
| Phase | select | yes | Roadmap phase name |
| Start Date | date | no | Planned or actual |
| Target Date | date | no | Planned |
| PR | url | no | Release PR |
| Checks | multi-select | yes | `typecheck`, `lint`, `test`, `build`, `visual` |
| Acceptance Summary | text | yes when accepted | Evidence-based summary |
| Residual Risks | text | no | Known risks and follow-ups |

### Tasks

| Property | Type | Required | Notes |
|---|---:|---:|---|
| Name | title | yes | Reviewable unit of work |
| Release | relation | yes | Parent release |
| Status | select | yes | See workflow task states |
| Owner | people/text | no | Human, Codex, or subagent nickname |
| Workstream | select | yes | `Product`, `Web`, `API`, `Contracts`, `Database`, `Worker`, `Integrations`, `Tests`, `Review`, `Ops` |
| Priority | select | yes | `P0`, `P1`, `P2`, `P3` |
| Dependencies | relation | no | Blocking tasks |
| Scope | text | yes | What changes |
| Non-goals | text | yes | What must not change |
| Reference Files | text | no | Read-only reference files |
| New Repo Files | text | no | Expected write set |
| Acceptance Criteria | text | yes | Checklist written before implementation |
| Evidence | text/url/files | yes when accepted | Test output, screenshots, PR, notes |
| Risks | text | no | Technical/product/security risks |

### Decisions

| Property | Type | Required | Notes |
|---|---:|---:|---|
| Name | title | yes | Decision name |
| Status | select | yes | `Open`, `Decided`, `Revisit` |
| Area | select | yes | Product or architecture area |
| Decision | text | yes when decided | The actual choice |
| Rationale | text | yes when decided | Why |
| Owner | people/text | no | Decision maker |
| Related Release | relation | no | Release relation |
| Related Tasks | relation | no | Task relation |

## Notion API Mapping

Use the official Notion API to create three databases with the properties
above. Store credentials outside the repository.

Required environment variables for a local sync script:

```bash
NOTION_TOKEN=
NOTION_PARENT_PAGE_ID=
NOTION_RELEASES_DB_ID=
NOTION_TASKS_DB_ID=
NOTION_DECISIONS_DB_ID=
```

Minimum API flow:

1. Create or locate the parent page.
2. Create the `Releases` database.
3. Create the `Tasks` database with relation to `Releases`.
4. Create the `Decisions` database with relations to both.
5. Upsert releases from `docs/release-acceptance-plan.md`.
6. Upsert tasks by stable task key.
7. Pull status/evidence back before every release review.

## Stable Task Key

Every task should include a stable key:

```text
R<release-number>-<workstream>-<sequence>
```

Examples:

- `R1-API-01`
- `R1-WEB-02`
- `R1-TEST-01`

The stable key is used for Notion API upserts and for handoff prompts.

## Acceptance Evidence Format

Each accepted task should include:

```text
Accepted on: YYYY-MM-DD
Reviewer:
Code reference:
Checks:
Screenshots/logs:
Known risks:
Follow-ups:
```

## Plugin Status

Notion is not currently available as an installed connector in this Codex
environment. Until it is connected externally, this repository documentation is
the source of truth and can be synced to Notion with a small script or a manual
import.
