// What each real Sleeper reading implies about the spread it is pricing.
// With one side locked the arithmetic is exact: you win iff the opponent's
// remaining players fall short of your actual lead, so the sample pins the
// standard deviation of exactly those players and nothing else.
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'winprob-samples.json'), 'utf8'));

// inverse normal CDF (Acklam)
function probit(p) {
  const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.3577518672690,-30.66479806614716,2.506628277459239];
  const b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572];
  const c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783];
  const d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416];
  const pl=0.02425;
  if (p<pl){const q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  if (p>1-pl){const q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  const q=p-0.5, r=q*q;
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}

// A sample is only as good as its margin. Where both projections were read
// off the screen the margin is exact; where it was recovered by inverting our
// own rounded percentage it is soft, and is marked so it can be weighted less
// (or dropped) in a fit rather than passing as fact.
const num = (v) => (typeof v === 'number' && Number.isFinite(v)) ? v : null;

function marginOf(s) {
  const mine = num(s.my_proj), theirs = num(s.opp_proj);
  if (mine !== null && theirs !== null) return { margin: mine - theirs, exact: true };
  const stated = num(s.margin_inferred);
  if (stated !== null) return { margin: stated, exact: false };
  return { margin: null, exact: false };
}

console.log('league                 margin  left(me/opp)  sleeper  ours   implied sigma');
for (const s of data.samples) {
  const { margin, exact } = marginOf(s);
  if (margin === null) {
    console.log(s.league.padEnd(22), '  -- no margin recorded, unusable for fitting --');
    continue;
  }
  const z = probit(s.sleeper_pct / 100);
  const sigma = z !== 0 ? Math.abs(margin / z) : NaN;
  console.log(
    s.league.padEnd(22),
    (margin.toFixed(1) + (exact ? ' ' : '~')).padStart(7),
    `${s.my_left}/${s.opp_left}`.padStart(12),
    (s.sleeper_pct + '%').padStart(8),
    (s.ours_pct + '%').padStart(6),
    (sigma.toFixed(1) + (exact ? '' : ' (soft)')).padStart(14));

  const lead = (num(s.my_score) !== null && num(s.opp_score) !== null) ? s.my_score - s.opp_score : null;
  const remaining = (num(s.opp_proj) !== null && num(s.opp_score) !== null) ? s.opp_proj - s.opp_score : null;
  if (s.my_left === 0 && lead !== null && remaining !== null) {
    console.log(`   -> locked on your side: you win iff their ${s.opp_left} remaining scores under ${lead.toFixed(1)}`);
    console.log(`      they are expected to add ${remaining.toFixed(1)}, priced at ${s.sleeper_pct}%`);
  }
}
console.log('\n~ = margin recovered from our rounded display, not read off Sleeper. Soft.');
