# Parallel Dev Workflow

Two side-by-side instances: **stable** (reference) and **experimental** (new work).

| Instance       | Folder              | Port | Branch    |
|----------------|---------------------|------|-----------|
| Stable         | `/Users/suvijay/JARVIS`     | 3000 | `stable`  |
| Experimental   | `/Users/suvijay/JARVIS-dev` | 3002 | `dev/next`|

Shared: `.data/` (spaces, Gmail tokens, Kokoro models), Ollama (`11434`), Kokoro (`7532`).

## Run stable

```bash
cd /Users/suvijay/JARVIS
git checkout stable
npm run dev:stable
```

Open http://localhost:3000

## Run experimental

```bash
cd /Users/suvijay/JARVIS-dev
npm run dev:next
```

Open http://localhost:3002

**Edit code only in `JARVIS-dev`.** Keep `JARVIS` read-only unless applying a hotfix to stable.

## Promote experimental → stable

When `dev/next` is ready:

```bash
cd /Users/suvijay/JARVIS-dev
git add . && git commit -m "feat: describe your change"

cd /Users/suvijay/JARVIS
git merge dev/next
git tag v0.2-stable   # optional new baseline
```

## Reset experimental (discard bad work)

```bash
cd /Users/suvijay/JARVIS-dev
git checkout dev/next
git reset --hard stable
```

Stable folder is untouched.

## Gmail OAuth on experimental

If connecting Gmail on port 3002, add this redirect URI in [Google Cloud Console](https://console.cloud.google.com):

```
http://localhost:3002/api/auth/gmail/callback
```

## Notes

- Avoid heavy writes to shared `.data/` from both apps at the same time.
- Each worktree has its own `.next/` and `node_modules/`; run `npm install` in a new worktree once.
