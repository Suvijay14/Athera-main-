# Dev Workflow

Single app, run from the repo root on port **3001**.

## Run

```bash
npm run dev
```

Open http://localhost:3001

## Gmail OAuth

Redirect URI in [Google Cloud Console](https://console.cloud.google.com):

```
http://localhost:3001/api/auth/gmail/callback
```

## bCourses (Canvas)

Setup → **Connect bCourses** → create a personal access token at
[bcourses.berkeley.edu/profile/settings](https://bcourses.berkeley.edu/profile/settings)
→ paste into Athera.

- Token stored locally at `.data/canvas-token.json` (gitignored)
- Expires after **90 days** — Setup and School page show days remaining
- Optional env override: `CANVAS_BASE_URL=https://bcourses.berkeley.edu`
- Active courses appear on the **School** home page sidebar

## Optional: experimental worktree

To try changes in isolation before merging to main:

```bash
git checkout -b dev/next
git worktree add ../athera-dev dev/next
# work in athera-dev on :3002 (npm run dev:next), then merge back:
git checkout main
git merge dev/next
```

## After code changes

Restart dev server. If behavior seems stale:

```bash
rm -rf .next && npm run dev
```
