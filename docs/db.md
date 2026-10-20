# Database (Athera core)

## Tables

- `workspaces` — one row per owner (MVP); name, item label, onboarding answers
- `field_definitions` — custom field schema per workspace (immutable `key`)
- `work_items` — title, due_date, notes, plus `data` jsonb for custom values
- `view_definitions` — list / grouped / board views; optional FK to a field for grouping
- `recurrence_rules` — scheduled item templates
- `suggestions` — adaptation proposals and lifecycle status
- `change_log` — applied operations + inverse operations for undo
- `events` — append-only instrumentation

## RLS model

Every table is scoped by `workspace_id` (or `owner_id` on `workspaces`). Policies use the `is_workspace_owner(workspace_id)` security-definer helper so `auth.uid()` is evaluated once per query. Row level security is **enabled and forced** on all eight tables. The `anon` role has no privileges on them; `authenticated` users only see rows for workspaces they own.

## Migrations

```bash
# Local (requires Docker + supabase start)
supabase db reset

# Linked remote project (preferred over pasting SQL in the Dashboard)
supabase link
supabase db push
```

The core migration file is **idempotent** (safe to run whole file in the SQL Editor). Prefer `db push` for hosted projects when the CLI is linked.

New changes: add a **new** timestamped file under `supabase/migrations/`; never edit an applied migration after it is recorded in `supabase_migrations.schema_migrations`.

## Types

```bash
npm run db:types
```

Regenerates `lib/db/database.types.ts` from the local Supabase schema.

## RLS integration tests

Set in `.env.local` or CI:

- `SUPABASE_TEST_URL`
- `SUPABASE_TEST_ANON_KEY`
- `SUPABASE_TEST_SERVICE_KEY`

Then:

```bash
npm test
```

Without those variables, RLS tests are skipped with a clear message; unit tests still run.

## Adaptation apply/undo

`lib/adaptation/apply.ts` runs mutations inside a real Postgres transaction via the `pg` driver. Set **`SUPABASE_DB_URL`** (or `DATABASE_URL`) to the direct connection string from the Supabase dashboard. The Supabase JS client does not support multi-statement transactions; the `DbClient` argument is used for post-commit event logging and dismiss flows, not for the transactional writes.

Daily adaptation retention is documented in [cron.md](./cron.md) (`POST /api/cron/retention`, `CRON_SECRET`).
