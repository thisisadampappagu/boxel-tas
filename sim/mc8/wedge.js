// Canonical wedge rest state before the Mountain Climb grapple entry (mc8).
// usage (from sim/):
//   node mc8/wedge.js ref  <acts> <T>                      -> print full state at frame T (used to define the canonical state)
//   node mc8/wedge.js check <chainActs> <T0> <T1>          -> per frame distance to the canonical state, prints first exact match
//   node mc8/wedge.js splice <chainActs> <R'> <suffixActs> <R> <out.json>  -> chain acts (t<=R') + suffix acts (t>R) shifted by R'-R
process.env.LEVEL = process.env.LEVEL || '../levels/Mountain Climb.json';
const fs = require('fs'); const { replay } = require('../replay.js');
const CANON = { x: 8691.880155, y: 4000.119541, ang2pi: null, angle: 177.483520 };
function st(g) { const P = g.player, b = P.body; return { x: b.position.x, y: -b.position.y, vx: b.velocity.x, vy: -b.velocity.y, angle: b.angle, a2: ((b.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), w: b.angularVelocity, jr: P.jumpReady ? 1 : 0, mode: P.mode, L: P.controls.left, R: P.controls.right, rope: P.rope.children.length, gx: g.world.gravity.x, gy: g.world.gravity.y, fx: P.force.x, fy: P.force.y }; }
const ca2 = ((CANON.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
function dist(s) { let da = Math.abs(s.a2 - ca2); da = Math.min(da, 2 * Math.PI - da); return Math.max(Math.abs(s.x - CANON.x), Math.abs(s.y - CANON.y), Math.abs(s.vx) , Math.abs(s.vy), da, Math.abs(s.w)); }
const [cmd, f, A, B, C, D] = process.argv.slice(2);
const acts = JSON.parse(fs.readFileSync(f)).acts;
if (cmd == 'ref') { replay(acts, +A, (t, g) => { if (t == +A) console.log(JSON.stringify(st(g))); }); }
if (cmd == 'check') { let first = null; replay(acts, +B, (t, g) => { if (t < +A) return; const s = st(g); const d = dist(s); const ok = d < 1e-5 && s.jr == 1 && s.mode == 'control' && s.R == 1 && s.L == 0 && s.rope == 0 && s.gx == 0 && s.gy == 1;
  if (t % 5 == 0 || ok) console.log(t, s.x.toFixed(6), s.y.toFixed(6), 'v', s.vx.toExponential(1), s.vy.toExponential(1), 'a2', s.a2.toFixed(5), '(canon', ca2.toFixed(5) + ')', 'dist', d.toExponential(2), ok ? 'MATCH' : '');
  if (ok && first === null) first = t; }); console.log('first match', first); }
if (cmd == 'splice') { const Rp = +A, suf = JSON.parse(fs.readFileSync(B)).acts, R = +C; const out = acts.filter(a => a.t <= Rp).map(a => ({ ...a }));
  for (const a of suf) if (a.t > R) out.push({ ...a, t: a.t - R + Rp }); fs.writeFileSync(D, JSON.stringify({ t: Rp, acts: out })); console.log('wrote', D, out.length, 'acts'); }
