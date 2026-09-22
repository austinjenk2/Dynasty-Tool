#!/usr/bin/env node
/*
 * Fits PP_SLOT_CURVE, the curve index.html uses to say what the pick at a
 * given draft slot is worth.
 *
 * The curve is v(n) = a * exp(-b * (n-1)^c), where n is the overall pick
 * number in a 12-team draft. It is fitted, in log space so the cheap late
 * picks matter as much proportionally as the expensive early ones, to the
 * anchors below: where the comparable rookie-class assets actually sit in
 * the Pure Potential Base 1 Value rankings that the rest of the app prices
 * players on. Both sides of the app therefore read on one scale, which is
 * the only reason a pick and a player can be compared in a trade at all.
 *
 * Re-run this whenever the rankings move enough that the anchors are
 * stale, and paste the printed constants into PP_SLOT_CURVE.
 *
 *   node calibration/pickcurve.cjs
 */

// [overall pick number in a 12-team draft, Base 1 Value]
const ANCHORS = [
  [1, 2.45], [2, 2.20], [3, 1.95], [6, 1.35], [9, 1.05], [12, 0.80],
  [13, 0.68], [18, 0.45], [24, 0.28], [30, 0.15], [36, 0.09], [42, 0.05], [48, 0.03],
];

const v = (n, a, b, c) => a * Math.exp(-b * Math.pow(n - 1, c));
const sse = (a, b, c) => ANCHORS.reduce((acc, [n, target]) =>
  acc + Math.pow(Math.log(v(n, a, b, c)) - Math.log(target), 2), 0);

let best = null;
for (let a = 2.00; a <= 3.40; a += 0.02) {
  for (let b = 0.050; b <= 0.900; b += 0.005) {
    for (let c = 0.50; c <= 1.30; c += 0.02) {
      const err = sse(a, b, c);
      if (!best || err < best.err) best = { err, a, b, c };
    }
  }
}

const r = (x) => Math.round(x * 100) / 100;
console.log(`const PP_SLOT_CURVE = { a: ${r(best.a)}, b: ${Math.round(best.b * 1000) / 1000}, c: ${r(best.c)} };`);
console.log(`log SSE ${best.err.toFixed(5)} over ${ANCHORS.length} anchors\n`);
console.log('pick  target   fitted   error');
for (const [n, target] of ANCHORS) {
  const got = v(n, best.a, best.b, best.c);
  console.log(String(n).padStart(4), target.toFixed(2).padStart(7), got.toFixed(3).padStart(8),
    ((got / target - 1) * 100).toFixed(1).padStart(7) + '%');
}
