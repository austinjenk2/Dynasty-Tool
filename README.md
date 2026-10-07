# The Desk

The Desk is a fantasy football dashboard for people who run several dynasty (and
redraft) leagues on Sleeper and want one place to see all of them at once —
rosters, lineups, trades, draft capital, player exposure, playoff odds — instead
of clicking into each league one at a time.

It reads the public [Sleeper API](https://docs.sleeper.com/). There is no auth,
no API key, and no server-side database: you give it a Sleeper username and it
fetches everything live in the browser.

## Running it

```sh
npm install
npm run dev      # Vite dev server, bound to 0.0.0.0 so other devices on the LAN can load it
npm run build    # static build into dist/
npm run preview
```

Vite here is only a static dev server and bundler for a single page — there is no
framework and no component system. `index.html` is the whole application:
markup, CSS, and all of the JavaScript in one inline `<script>`. It is currently
about 32,000 lines. The only external runtime dependency is `html2canvas`,
loaded from a CDN for the Trade History image export.

## Layout of the repo

| Path | What it is |
|---|---|
| `index.html` | The entire app — styles, markup, and logic |
| `api/avatar.js` | Serverless function: a same-origin image proxy, locked to `sleepercdn.com`, so `html2canvas` can draw Sleeper headshots onto a canvas for the Trade History export (Sleeper's CDN sends no CORS headers) |
| `calibration/fit.cjs` | Fits a variance-aware win-probability model from hand-collected real Sleeper win% readings paired with full game state |
| `calibration/winprob-samples.json` | Those samples |
| `calibration/pickcurve.cjs` | Fits `PP_SLOT_CURVE`, the draft-slot value curve, in "Base 1s" (a 1st in a vacuum = 1.00 by definition) |

The calibration scripts are offline tools, run by hand with `node`. They produce
constants that get pasted into `index.html`; nothing in the app calls them at
runtime.

## Navigation

Six sections across the top, with the pages inside the open section on a second
row beneath it.

| Section | Pages |
|---|---|
| **Front Desk** | Front Desk (the landing view) |
| **Front Office** | Leagues · The Wire · On the Clock · Trade Desk |
| **The Book** | My Guys · The Receipts · Record · Tanking Tracker · Playoff Picture · The Ledger |
| **Game Day** | The Slate · Press Box · Weekly Sweats |
| **Price Guide** | The Board · Trade Desk |
| **Settings** | Settings |

Trade Desk is filed under two sections deliberately — it's the tool you reach for
mid-trade and the tool you reach for while reading the board.

## Sleeper endpoints used

`/state/nfl`, `/players/nfl`, `/players/nfl/trending/add`, `/user/{name}`,
`/user/{id}/leagues/nfl/{season}`, `/league/{id}`, `/league/{id}/rosters`,
`/league/{id}/users`, `/league/{id}/matchups/{week}`,
`/league/{id}/transactions/{week}`, `/league/{id}/traded_picks`,
`/league/{id}/drafts`, `/league/{id}/winners_bracket`, `/draft/{id}`,
`/draft/{id}/picks`.

Only the Sleeper username and a co-managed-leagues preference are persisted, in
`localStorage` (`dynastyToolSleeperUser`, `dynastyToolIncludeCoManaged`).

## Design direction

Retro Sports Card — warm cardstock and navy ink, deliberately single-theme (no
dark mode). The tokens live in `:root` at the top of `index.html`:

- **Palette**: vintage-paper background `#f2e9d5`, cream card surface `#fff9ea`,
  deep navy ink `#1d3557`, jersey red `#c8322d` as primary accent, gold
  `#b07a12` as secondary.
- **Type**: `Anton` for display/headings, `Source Sans 3` for UI text,
  `Source Serif 4` for editorial headings.
- **Shape**: chunky radii, thick navy borders, small hard drop-shadows — a
  sticker/trading-card feel rather than soft SaaS.

Known compromise: `--faint` clears about 3.3:1 on its background, under WCAG's
4.5 for small text. That's carried forward knowingly, not by accident.

## Not built yet

Three things the UI currently advertises but doesn't do:

- **WAR** (a sub-tab of On the Clock) — placeholder, "Wins Above Replacement
  scoring is being built".
- **My ADP** (also under On the Clock) — placeholder asking you to connect a
  Sleeper account.
- **Trade Desk scoring profile** — the sliders render but aren't wired into the
  values yet.
