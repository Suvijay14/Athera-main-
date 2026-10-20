# Scheduled jobs

## Adaptation retention (`POST /api/cron/retention`)

Evaluates accepted workspace changes that are at least **14 days old** and logs `adaptation_retained` or `adaptation_abandoned` (once per suggestion). Safe to re-run: skips suggestions that already have a retention decision event.

### Auth

Send the shared secret as a Bearer token (same value as `CRON_SECRET` in `.env.local`):

```bash
curl -sS -X POST "http://localhost:3001/api/cron/retention" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Requests without a valid header receive **401** and perform **no database reads**.

### Scheduling in production

This must run **daily** even when no one has the app open. Options:

1. **Vercel Cron** — add to `vercel.json`:

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/retention",
         "schedule": "0 6 * * *"
       }
     ]
   }
   ```

   Set `CRON_SECRET` in the Vercel project env. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when configured via their docs (or use a middleware-compatible header you document for your deploy).

2. **External scheduler** — GitHub Actions, cron on a VPS, or Supabase Edge scheduled function hitting your deployed URL with the Bearer header above.

3. **Local dev** — run the curl command manually; do not rely on OS cron for production data.

### Response

JSON summary with per-workspace `{ evaluated, retained, abandoned, skippedNotYet, skippedAlreadyLogged, errors }`.
