# The Desk — working agreement

## Branches

Work goes to **`test`**. Push there as soon as a change is built and
verified — no need to ask first; that is the point of the branch. The
owner reviews it running on `test` and says when to promote.

**Never push to `main` without being asked.** Promotion to `main` is
always an explicit instruction, never inferred from a change being done.

Every change gets committed and pushed to `test` in the same pass that
builds it, so nothing sits uncommitted between turns.

## The app

`index.html` is the entire application — markup, CSS and all the
JavaScript in one inline `<script>`, around 32,000 lines. There is no
framework. Vite is only a static dev server and bundler. See README.md
for the layout, the nav, the Sleeper endpoints and the design tokens.

## Verifying changes

ESPN (`site.api.espn.com`) and Sleeper (`api.sleeper.app`) are both
blocked from the cloud sandbox, so live data cannot be used there. What
works instead:

- Extract the inline `<script>` and `node --check` it, then unit-test
  individual functions by `eval`-ing them out of the file in node. The
  play-by-play parser and the scoring line are both tested this way.
- Drive the real page in Chromium (Playwright is installed globally;
  point `executablePath` at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).
  Assert zero uncaught page errors and tour all six nav sections.
- Inject synthetic markup into the live page to check CSS for panels
  that cannot draw without data.
- `npm run build` must succeed.

Say plainly what could not be verified rather than implying it was.

## Scoring

Anything not specific to one league uses the house line
(`SB_HOUSE_SCORING`): 5pt passing TD, −2 interception, −2 fumble lost
(a fumble recovered by his own side is worth nothing), full PPR, tight
end premium +0.5 so a TE catch is 1.5. Where a single real matchup is at
stake, that league's own `scoring_settings` governs instead.
