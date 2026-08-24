# Roster Radar

A Sleeper-API-powered fantasy portfolio dashboard: syncs your leagues, combined
record, and cross-league player exposure. Read-only — same limits as the
Sleeper API itself (no trades/moves, see below).

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173).

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to vercel.com → New Project → import that repo.
3. Vercel auto-detects Vite — leave the defaults and click Deploy.

No environment variables or API keys needed — Sleeper's API is public.

## Why this didn't work as a Claude artifact

Claude's in-chat artifact preview runs in a sandboxed iframe that blocks
fetch requests to arbitrary external APIs. Sleeper's API itself works fine
from a browser — this project runs it in a normal browser context (localhost
or Vercel), so the "failed to fetch" issue goes away.

## Next ideas
- Waiver wire / transaction feed (`/v1/league/<id>/transactions/<round>`)
- Weekly matchups view (`/v1/league/<id>/matchups/<week>`)
- Trade calculator — needs your own player value model plugged in, since
  Sleeper doesn't provide valuations
