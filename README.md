# Dynasty Tool

Dynasty Tool is a fantasy football team-management dashboard built on top of the **Sleeper API**. It's for people who run multiple dynasty (and redraft) leagues on Sleeper and want one place to see everything across all of them — roster strength, draft capital, trade activity, and player exposure — instead of clicking into each league one at a time.

It's loosely inspired by an existing tool called **Pure Potential**, which has this same "one dashboard for all your Sleeper leagues" structure. Dynasty Tool borrows that general idea (aggregate view, sidebar of tools, dense data panels) but is being built with its own distinct visual identity and isn't a clone of Pure Potential's branding or design.

## Status

Early stage. Right now there's a working **HTML/CSS mockup of the app shell** — the top nav, sidebar navigation, header utility bar, and an empty-state content panel — styled in the chosen visual direction. **No screens have real content or data yet.** Every tab currently renders a placeholder ("this section is being built") so the next phase of work is designing and building out each tab's actual content, then wiring up the Sleeper API.

No tech stack has been chosen yet (framework, hosting, auth, etc. are all open). The mockup is plain HTML/CSS/vanilla JS just to nail down the look and navigation before committing to a stack.

## App structure

**Top nav** (site-level sections):
- Launchpad — the main app, described below
- Team Reviews
- My Account

**Sidebar nav**, inside Launchpad (all currently placeholder screens):

| Tab | Intended purpose |
|---|---|
| Dashboard | Landing view — portfolio-wide summary across all connected leagues |
| Leagues | List/manage the individual Sleeper leagues connected to the account |
| Lineups | Set/review starting lineups |
| Waiver Wire | Waiver targets and pickups |
| Draft Room | Draft prep / live draft tooling |
| Exposures | Player exposure across all rostered teams |
| Trade History | Log of past trades |
| Record Book | Historical league records/stats |
| Trade Calculator | Trade value comparison tool |
| Trade Database | Searchable database of past trades (league-wide or community) |

**Header utility bar** (visible above the content panel on every tab): current username, a search box for looking up a Sleeper username or league ID, a "synced X minutes ago" status indicator, and aggregate stats across all connected leagues (total league count, combined record).

**Dashboard panels envisioned for the Dashboard tab** (from the Pure Potential-style reference, not yet built):
- **Portfolio Health** — three horizontal "Last → Median → First" tracks (Roster Value, Contending Rank, Last Season Placement) showing where each of the user's teams ranks against their league, plus draft-capital averages per pick round for the next few years.
- **Team Strength** — a scatter plot of all the user's teams, x-axis = Value Rank, y-axis = Contending Rank, split into quadrants (roughly: Favorite / Fragile / Upside / Rebuild) so you can see at a glance which teams are strong-and-safe vs. rebuilding.
- **Highest Exposures** — a grid of player cards showing which players the user is most exposed to across all their rosters (name, position, % of teams rostered on, how many of N leagues), filterable by a "Top N" selector.

## Design direction

Four quick visual directions were sketched (Bold Dark + Neon, Clean Light Editorial, Premium Minimal, Retro Sports Card) and **Retro Sports Card was chosen**. Key tokens:

- **Palette**: warm cream/vintage-paper background (`#f2e9d5`), cream card surface (`#fff9ea`), deep navy ink (`#1d3557`) for text/borders, jersey red (`#c8322d`) as the primary accent, gold (`#e8a13c`) as the secondary accent.
- **Type**: `Anton` for display/headings (condensed, bold, jersey-number energy), `Nunito` (600–900 weight) for body/UI text.
- **Shape language**: chunky rounded corners (14–22px radii), thick 2–3px navy borders, small hard drop-shadows (not soft/blurred) for a "sticker/trading-card" feel rather than a soft SaaS look.
- **Theme**: deliberately single-theme (no dark mode) — it's meant to feel like warm cardstock, not a trading-terminal dark UI.

## Data source

[Sleeper API](https://docs.sleeper.com/) — public, read-only, no auth/API key required. Needed endpoints will include user lookup, league(s) for a user, rosters, matchups, drafts, and transactions, aggregated across every league a user is in.

## Next steps

1. Pick a tech stack (framework, hosting, state management) — currently undecided.
2. Design and build out each sidebar tab's real content, starting with Dashboard (Portfolio Health, Team Strength, Highest Exposures).
3. Integrate the Sleeper API to replace placeholder/sample data.
4. Carry the Retro Sports Card design tokens above into whatever component system the chosen stack uses.
