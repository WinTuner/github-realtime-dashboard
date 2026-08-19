# GitHub Realtime Dashboard

Real-time GitHub metrics dashboard for **WinTuner** — live profile stats, contribution calendar, pinned repos, language analytics, repository showcase, and an event-stream terminal. Built with React 19 + Vite + TypeScript, deployed on Vercel with a serverless API proxy.

## Features

- **Server-side API proxy** (`/api/github`) — GitHub requests run on Vercel, not the browser. No rate-limit popups, no client tokens.
- **Contribution calendar** — last year of commits via GitHub GraphQL.
- **Pinned repositories** — fetched via GraphQL.
- **Live event feed** — terminal-style stream of pushes, PRs, forks, stars, issues.
- **Language analytics** — size-weighted breakdown with GitHub language colors.
- **Repo showcase** — search, filter, sort, star/fork/size stats.
- **Coding habits** — peak hour, most active day, commit counts.
- Auto-refresh every 60s.

## Setup

```bash
npm install
npm run dev
```

## Environment Variables (Vercel)

| Variable | Required | Description |
|---|---|---|
| `GITHUB_USERNAME` | No | Defaults to `WinTuner`. |
| `GITHUB_TOKEN` | Yes* | GitHub PAT. Enables pinned repos + contribution calendar and removes rate limits. |

\* Without `GITHUB_TOKEN`, profile/repos/events still work (REST, unauthenticated); pinned repos and contribution calendar are skipped.

Set them in Vercel: **Project → Settings → Environment Variables**.

## Deploy

```bash
vercel
```

The `api/` folder auto-deploys as serverless functions on Vercel.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview production build |