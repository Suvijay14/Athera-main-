# Athera

A local-first personal assistant: a Next.js app with voice, Gmail, calendar,
spaces/notes, file tools and bCourses (Canvas) integration. Everything runs on
your own machine — there is no hosted backend, and your data never leaves it.
See [Where your data lives](#where-your-data-lives).

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

## Where your data lives

Nothing is stored remotely, but not all of it is inside the repo:

| Location | What |
| --- | --- |
| `.data/` | Tokens, device settings, spaces, life notes. Gitignored — never commit. |
| `.data/kokoro/` | Downloaded TTS voice models (~315 MB). |
| `~/Documents/athera-notes/` | Notes written by the `create_note` tool. **Outside the repo** — deleting the project does not delete these. |

## Integrations

- **Gmail** — OAuth via Google Cloud; tokens land in `.data/gmail-token.json`
- **bCourses (Canvas)** — personal access token entered in Setup, stored in
  `.data/canvas-token.json`, expires after 90 days
- **Groq / Ollama** — cloud and local LLM providers, selected at runtime
- **Kokoro** — local TTS; first run downloads ~315 MB of voice models

## Upgrading from Athena

The project was renamed from Athena to Athera. If you ran an earlier build, two
things carry over automatically and need no action:

- **Widget layouts.** Saved sizes move from the old `athena-widget-sizes`
  browser key to the new one the first time you load the app.
- **Notes.** An install with an existing `~/Documents/athena-notes` keeps
  writing there, so notes are never split across two folders. Fresh installs
  use `athera-notes`.

To converge on the new name, move the folder once — after this the app finds it
under the current name and the fallback stops applying:

```bash
mv ~/Documents/athena-notes ~/Documents/athera-notes
```

This section is temporary and can be deleted once nobody is running a
pre-rename install.

See [DEV_WORKFLOW.md](DEV_WORKFLOW.md) for day-to-day workflow and
[COMMANDS.md](COMMANDS.md) for the voice/tool command test matrix.
