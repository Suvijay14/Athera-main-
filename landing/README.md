# Landing page (work in progress)

All marketing landing code lives under this folder. The app entry point is still `app/page.tsx`, which renders `LandingMarketing`.

## Layout

| Path | Contents |
|------|----------|
| `landing/components/` | Page sections, demos, comparison tabs, feature demos |
| `landing/lib/` | Demo timing, comparison logic, analytics, mesh layout, persona packs |
| `landing/ui/` | Shared **athera-ui** primitives (Sidebar, ListView, SuggestionCard, etc.) |
| `landing/data/` | Persona demo data (`demoData.ts`) |
| `landing/brand/` | Logo, mark, wordmark components |
| `landing/server/` | Waitlist persistence (used by `app/api/waitlist`) |

## Static assets

Brand images stay in `public/brand/` (Next.js static files).

## API routes (thin wrappers in `app/`)

- `app/api/waitlist/route.ts` → `landing/server/waitlist.ts`
- `app/api/analytics/route.ts` → landing analytics events

## Import aliases (`tsconfig.json`)

Existing imports are unchanged:

- `@/components/landing/*` → `landing/components/*`
- `@/lib/landing/*` → `landing/lib/*`
- `@/demo-data` → `landing/data/demoData.ts`
- `@/src/components/athera-ui` → `landing/ui`
- `@/components/brand/*` → `landing/brand/*`
- `@/lib/server/waitlist` → `landing/server/waitlist.ts`

## Main entry

- `landing/components/LandingMarketing.tsx` — full page shell
