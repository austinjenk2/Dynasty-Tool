#!/usr/bin/env node
/*
 * Fits PP_SLOT_CURVE, the curve index.html uses to say what the pick at a
 * given draft slot is worth, in Base 1s.
 *
 * A Base 1 is a 1st in a vacuum -- a pick equally likely to land anywhere
 * from 1.01 to 1.12 -- and is worth 1.00 by definition. That is the unit
 * every player value in the Pure Potential rankings is already quoted in,
 * so it is also the one hard constraint on this curve: the twelve round-1
 * slots have to average exactly 1.00, or a player and a pick cannot be
 * compared in a trade.
 *
 * SLOT_LADDER below is what a real 1st is worth at each landing spot. As
 * written it averages 1.10, not 1.00, so it is normalized to the unit
 * before fitting -- the ladder sets the SHAPE, the definition sets the
 * SCALE. Set NORMALIZE to false to fit the ladder's raw numbers instead,
 * which keeps 1.01 at 2.25 and a Late 1 near 0.7 but leaves every pick
 * priced about 10% rich against the player values.
 *
 * The curve is v(n) = a * exp(-b * (n-1)^c) over the overall pick number
 * in a 12-team draft, fitted in log space so the cheap late picks matter
 * as much proportionally as the expensive early ones. One continuous
 * curve runs the whole draft rather than one per round, which is what
 * keeps a 2.01 worth less than a 1.12.
 *
 *   node calibration/pickcurve.cjs
 */

// What a 1st is worth at each slot it can land on, 1.01 through 1.12.
const SLOT_LADDER = [2.25, 1.75, 1.50, 1.25, 1.10, 1.00, 0.90, 0.82, 0.75, 0.68, 0.62, 0.58];
const NORMALIZE = true;
// The two units the whole scale hangs off: a base 1st is 1.00 and a base
// 2nd is 0.30. Both are enforced as heavily weighted terms in the fit
// rather than checked afterwards, because a curve that misses them is not
// measuring in Base 1s however well it traces the ladder.
const ROUND_MEANS = { 1: 1.00, 2: 0.30 };
const ROUND_MEAN_WEIGHT = 60;

const ladderMean = SLOT_LADDER.reduce((a, b) => a + b, 0) / SLOT_LADDER.length;
const scale = NORMALIZE ? 1 / ladderMean : 1;
const anchors = SLOT_LADDER.map((value, i) => [i + 1, value * scale]);

const v = (n, a, b, c) => a * Math.exp(-b * Math.pow(n - 1, c));
const roundMean = (round, a, b, c) => {
  let sum = 0;
  for (let slot = 1; slot <= 12; slot++) sum += v((round - 1) * 12 + slot, a, b, c);
  return sum / 12;
};
const sse = (a, b, c) => {
  let err = anchors.reduce((acc, [n, target]) =>
    acc + Math.pow(Math.log(v(n, a, b, c)) - Math.log(target), 2), 0);
  for (const [round, target] of Object.entries(ROUND_MEANS)) {
    err += ROUND_MEAN_WEIGHT * Math.pow(Math.log(roundMean(Number(round), a, b, c) / target), 2);
  }
  return err;
};

let best = null;
for (let a = 1.50; a <= 2.60; a += 0.005) {
  for (let b = 0.050; b <= 1.400; b += 0.002) {
    for (let c = 0.30; c <= 1.70; c += 0.01) {
      const err = sse(a, b, c);
      if (!best || err < best.err) best = { err, a, b, c };
    }
  }
}

const r3 = (x) => Math.round(x * 1000) / 1000;
console.log(`ladder averages ${ladderMean.toFixed(3)} Base 1s; ${NORMALIZE ? `scaled by ${scale.toFixed(4)} so a Base 1 is exactly 1.00` : 'used raw (a Base 1 is NOT 1.00)'}\n`);
console.log(`const PP_SLOT_CURVE = { a: ${r3(best.a)}, b: ${r3(best.b)}, c: ${r3(best.c)} };`);
console.log(`log SSE ${best.err.toFixed(5)} over ${anchors.length} anchors\n`);

console.log('slot   target   fitted    error');
anchors.forEach(([n, target]) => {
  const got = v(n, best.a, best.b, best.c);
  console.log(`1.${String(n).padStart(2, '0')}  ${target.toFixed(3).padStart(7)} ${got.toFixed(3).padStart(8)} ${((got / target - 1) * 100).toFixed(1).padStart(7)}%`);
});

// The constraint, checked rather than assumed -- plus what the same curve
// implies for the rounds the ladder says nothing about.
console.log('\nround averages (1 MUST be 1.000, 2 MUST be 0.300):');
for (let round = 1; round <= 4; round++) {
  const got = roundMean(round, best.a, best.b, best.c);
  const want = ROUND_MEANS[round];
  console.log(`  round ${round}: ${got.toFixed(3)}${want ? ` (target ${want.toFixed(2)})` : ''}`);
}
console.log(`\nthe seam: 1.12 = ${v(12, best.a, best.b, best.c).toFixed(3)}, 2.01 = ${v(13, best.a, best.b, best.c).toFixed(3)} -- a 2.01 must be worth less`);

// A base 1st should stay a base 1st whatever the league size.
console.log('\na base 1st by league size:');
for (const teams of [8, 10, 12, 14, 16]) {
  let sum = 0;
  for (let slot = 1; slot <= teams; slot++) sum += v((slot - 1) * (12 / teams) + 1, best.a, best.b, best.c);
  console.log(`  ${String(teams).padStart(2)}-team: ${(sum / teams).toFixed(3)}`);
}
