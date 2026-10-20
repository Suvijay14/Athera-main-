# Component lab (Cut the Chaos → Athera)

## Flow

1. Open **Components** in the v2 sidebar (`/components`).
2. **Preview** a registered widget in isolation.
3. **Approve** to unlock it for:
   - **Dashboard** — use **+ Add component** on Overview (approved `dashboard` surfaces only).
   - **Sidebar** — approved `page` surfaces appear under **Pinned tools**.
4. **Revoke** removes approvals and drops the widget from dashboard / pins.

## Register a new component

1. Add a `ComponentId` and metadata in [`lib/components/registry-meta.ts`](../lib/components/registry-meta.ts).
2. Implement UI under [`components/ctc/`](../components/ctc/) or [`components/lab/widgets/`](../components/lab/widgets/).
3. Wire lazy import in [`lib/components/component-renderers.tsx`](../lib/components/component-renderers.tsx).
4. Run [`supabase/sql/component_lab.sql`](../supabase/sql/component_lab.sql) in Supabase (once) so catalog upserts succeed.

## Persistence

- **Profile:** `athera_profile_id` cookie (via `/api/profile/bootstrap`) + matching localStorage key.
- **Supabase tables:** `component_catalog`, `profile_component_approvals`, `profile_sidebar_pins`, `profile_dashboard_widgets`.
- If Supabase env vars are missing, state is stored in `localStorage` (`athera_component_lab_state_v1`).

## APIs

| Route | Method |
|-------|--------|
| `/api/profile/bootstrap` | GET, POST |
| `/api/components/catalog` | GET |
| `/api/components/approve` | POST |
| `/api/components/unapprove` | POST |
| `/api/components/dashboard-layout` | GET, PUT |
| `/api/components/sidebar-pins` | GET, PUT |
