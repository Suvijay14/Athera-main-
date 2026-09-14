# Athera

A local-first personal assistant: a Next.js app with voice, Gmail, calendar,
spaces/notes, file tools and bCourses (Canvas) integration. Everything runs on
your own machine — there is no hosted backend, and user data stays in `.data/`.

> **Local use only.** The API routes assume a trusted single user on localhost:
> they read and open local files, read the clipboard, and spawn processes. Do
> not deploy this to a public host as-is.

## Requirements

- **Node 25** (see `.nvmrc`; `nvm use` will pick it up)
- **macOS** — several tools shell out to `osascript`, `pmset`, `networksetup`
  and `pbcopy`/`pbpaste`, with no fallback on other platforms
- **Python 3** — only if you want local text-to-speech (Kokoro)
- **Ollama** — optional, for local LLM inference instead of Groq

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3001>.

`.env.example` documents every variable the app reads. At minimum you need
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for Gmail and `GROQ_API_KEY` for
cloud inference. Note that `GOOGLE_REDIRECT_URI` must be set explicitly — its
in-code default points at port 3000, but the app runs on 3001.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3001 |
| `npm run dev:next` | Dev server on port 3002, for a second worktree |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |

## Layout

```
app/          Next.js App Router — pages and ~25 API routes
components/   React components
lib/          Shared types and client helpers
lib/server/   Server-only logic: LLM routing, Gmail, Canvas, tools, voice
scripts/      Python sidecar for Kokoro TTS
.data/        Local runtime state and tokens — gitignored, never commit
```

## Integrations

- **Gmail** — OAuth via Google Cloud; tokens land in `.data/gmail-token.json`
- **bCourses (Canvas)** — personal access token entered in Setup, stored in
  `.data/canvas-token.json`, expires after 90 days
- **Groq / Ollama** — cloud and local LLM providers, selected at runtime
- **Kokoro** — local TTS; first run downloads ~315 MB of voice models

See [DEV_WORKFLOW.md](DEV_WORKFLOW.md) for day-to-day workflow and
[COMMANDS.md](COMMANDS.md) for the voice/tool command test matrix.
