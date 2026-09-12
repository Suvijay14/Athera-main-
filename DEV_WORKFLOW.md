# Dev Workflow

Single app at **`/Users/suvijay/JARVIS`** on port **3001**.

## Run

```bash
cd /Users/suvijay/JARVIS
npm run dev
```

Open http://localhost:3001

## Gmail OAuth

Redirect URI in [Google Cloud Console](https://console.cloud.google.com):

```
http://localhost:3001/api/auth/gmail/callback
```

## Optional: experimental worktree

To try changes in isolation before merging to stable:

```bash
cd /Users/suvijay/JARVIS
git checkout -b dev/next
git worktree add ../JARVIS-dev dev/next
# work in JARVIS-dev on :3002, then merge back:
git checkout stable
git merge dev/next
```

## After code changes

Restart dev server. If behavior seems stale:

```bash
rm -rf .next && npm run dev
```
