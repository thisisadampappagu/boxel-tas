// Frame-by-frame beam search for Mountain Climb (exact clones, distance-map heuristic).
const fs = require('fs');
const { Game, cloneGame, Matter } = require('./sim2.js');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const K = +(args.K || 1000), TMAX = +(args.T || 800), BX = +(args.bx || 8), BV = +(args.bv || 1.0);
const LOOK = +(args.look || 8), OUT = args.out || 'mcbeam_out.json', LOG = +(args.log || 25);
const ANG = (args.angles || '0,20,40,60,70,80,90,100,110,120,140,160,180').split(',').map(Number);
const MP = args.maps || 'mc_dist_p'; const meta = JSON.parse(fs.readFileSync(MP + 'meta.json'));
const PH = meta.phases, NP = PH.length;
const DM = PH.map((_, k) => new Float32Array(fs.readFileSync(`${MP}${k}.f32`).buffer.slice(0)));
const JRB = +(args.jrb || 50); const CELL = +(args.cell || 32), CAP = +(args.cap || Math.max(4, Math.floor(K / 25)));
function Dk(k, x, y) {
  const c0 = Math.floor((x - meta.X0) / meta.RES), r0 = Math.floor((meta.Y1 - y) / meta.RES);
  let best = -1;
  const RADC = Math.ceil(14 / meta.RES);
  for (let rad = 0; rad <= RADC && best < 0; rad++)
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) != rad) continue;
      const r = r0 + dr, c = c0 + dc; if (c < 0 || r < 0 || c >= meta.W || r >= meta.H) continue;
      const v = DM[k][r * meta.W + c]; if (v >= 0 && (best < 0 || v < best)) best = v;
    }
  return best < 0 ? -1 : best + (best > 0 ? 0 : 0);
}
const OFF = new Array(NP).fill(0);
for (let k = NP - 2; k >= 0; k--) { const g = PH[k].rect; let mx = 0;
  for (let x = g[0]; x <= g[2]; x += 4) for (let y = g[1]; y <= g[3]; y += 4) { const v = Dk(k + 1, x, y); if (v > mx) mx = v; }
  OFF[k] = OFF[k + 1] + mx + 1; }
console.log('phase offsets', OFF.map(v => v.toFixed(0)).join(' '));
function inRect(r, x, y) { return x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]; }
const EUC = args.euclid ? args.euclid.split(',').map(Number) : null;
function heurPhase(g) { const b = g.player.body, x = b.position.x, y = -b.position.y; while (g.phase < NP - 1 && inRect(PH[g.phase].rect, x, y)) g.phase++; return g.phase; }

const TRK = args.track ? JSON.parse(fs.readFileSync(args.track)) : null; const TW = +(args.tw || 6);
function trackH(g) { const b = g.player.body, x = b.position.x, y = -b.position.y; const k0 = g.trackK || 0; let best = 1e9, bk = k0;
  for (let k = Math.max(0, k0 - 30); k < Math.min(TRK.length, k0 + 150); k++) { const d = Math.hypot(x - TRK[k][0], y - TRK[k][1]); if (d < best) { best = d; bk = k; } }
  best = best * 2 + TW * (TRK.length - bk);
  g.trackK = bk; return best - (g.player.jumpReady ? JRB : 0) - (args.hs ? +args.hs * Math.hypot(b.velocity.x, b.velocity.y) : 0); }
const RJ = args.rejoin ? +args.rejoin : 0; const RSALL = RJ ? JSON.parse(fs.readFileSync(args.st || 'st_mcb3.json')) : null; const RS = RJ ? RSALL[RJ - 1] : null;
const RJF = args.rjfrom !== undefined ? +args.rjfrom : null, RJT = args.rjt0 !== undefined ? +args.rjt0 : null;
const RWV = +(args.rwv || 6), RWA = +(args.rwa || 10), RWW = +(args.rww || 60);
function rjDiff(g, R) { R = R || RS; const P = g.player, b = P.body; const dp = Math.hypot(b.position.x - R[0], -b.position.y - R[1]); const dv = Math.hypot(b.velocity.x - R[2], -b.velocity.y - R[3]);
  const a = ((b.angle % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2); let da = Math.abs(a - R[4]); da = Math.min(da, Math.PI / 2 - da); const dw = Math.abs(b.angularVelocity - R[5]);
  return { dp, dv, da, dw, jr: (P.jumpReady ? 1 : 0) == R[6] && P.mode == R[7] && P.rope.children.length == R[10] && g.world.gravity.x == R[8] && g.world.gravity.y == R[9] }; }
const FOL = args.fol ? JSON.parse(fs.readFileSync(args.st || 'st_mcb3.json')) : null; const FW = +(args.fw || 3), FAHEAD = +(args.fahead || 120);
function folDiff(g, R) { const P = g.player, b = P.body; const dp = Math.hypot(b.position.x - R[0], -b.position.y - R[1]); const dv = Math.hypot(b.velocity.x - R[2], -b.velocity.y - R[3]);
  const a = ((b.angle % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2); let da = Math.abs(a - R[4]); da = Math.min(da, Math.PI / 2 - da); const dw = Math.abs(b.angularVelocity - R[5]);
  const ok = (P.jumpReady ? 1 : 0) == R[6]; const ok2 = P.mode == R[7] && P.rope.children.length == R[10] && g.world.gravity.x == R[8] && g.world.gravity.y == R[9];
  return dp + RWV * dv + RWA * da + RWW * dw + (ok ? 0 : 10) + (ok2 ? 0 : 200); }
function heurFol(g) { const t = g.stepNo; let o = g.folO; const k0 = t + o; let best = 1e9, bk = k0;
  const TH = +(args.fth || 25);
  for (let k = Math.max(1, k0 - 3); k <= Math.min(FOL.length, k0 + FAHEAD); k++) { const d = folDiff(g, FOL[k - 1]); if (k > k0 && d > TH) continue; const c = d - FW * (k - t); if (c < best) { best = c; bk = k; } }
  g.folO = bk - t; return best - (args.hs ? +args.hs * Math.hypot(g.player.body.velocity.x, g.player.body.velocity.y) : 0); }
const ENT = args.entry ? args.entry.split(',').map(Number) : null; // EX,EY,YMIN,BONUS
const XEST = args.xest ? args.xest.split(',').map(Number) : null; // TF[,ywant,yw]
function heur(g) {
  if (XEST) { const b = g.player.body, x = b.position.x, y = -b.position.y; const rem = Math.max(0, XEST[0] - g.stepNo); let h = -(x + Math.max(0, b.velocity.x) * rem); if (XEST.length > 2) h += XEST[2] * Math.abs(y - XEST[1]); return h; }
  if (ENT) { const b = g.player.body, x = b.position.x, y = -b.position.y; let h = Math.hypot(x - ENT[0], y - ENT[1]); if (g.player.jumpReady && y > ENT[2]) h -= ENT[3]; if (args.hx) h -= +args.hx * b.velocity.x; return h; }
  if (FOL) { if (g.stepNo + (g.folO || 0) < FOL.length - 3) return heurFol(g); return -1e5 + heurMap(g); }
  if (RS && RJF !== null) { const k = Math.max(1, Math.min(RJ, RJF + (g.stepNo - RJT))); const r = rjDiff(g, RSALL[k - 1]); const r2 = rjDiff(g); return Math.min(r.dp + RWV * r.dv + RWA * r.da + RWW * r.dw + (r.jr ? 0 : 15), r2.dp + RWV * r2.dv + RWA * r2.da + RWW * r2.dw + (r2.jr ? 0 : 15)); }
  if (RS) { const r = rjDiff(g); return r.dp + RWV * r.dv + RWA * r.da + RWW * r.dw + (r.jr ? 0 : 15); }
  if (TRK && (g.trackK || 0) < TRK.length - 8) { const v = trackH(g); if ((g.trackK || 0) < TRK.length - 8) return v; }
  if (TRK) return -1e5 + heurMap(g);
  return heurMap(g);
}
function heurMap(g) {
  if (args.chase) { const f = g.children.find(c => c.body && c.body.class == 'finish'); const b = g.player.body;
    let h = Math.hypot(b.position.x - f.body.position.x, b.position.y - f.body.position.y);
    if (args.pushw) { const w = g.children.find(c => c.body && !c.isStatic() && c !== g.player && c.body.class == 'cube' && Math.abs(c.positionOrigin.x - 1448) < 1 && Math.abs(c.positionOrigin.y) < 1); if (w) h -= +args.pushw * Math.min(40, w.body.position.x - 1448) + (+args.pushw) * Math.min(0, 0); }
    if (args.bigw && g.player.scale.x < 32) h += +args.bigw;
    if (args.smallw && g.player.scale.x > 16 && g.stepNo > 60) h += +args.smallw;
    if (g.player.jumpReady) h -= JRB; if (args.hx) h -= +args.hx * b.velocity.x; if (args.hs) h -= +args.hs * Math.hypot(b.velocity.x, b.velocity.y); return h; }
  const EUP = args.euclidPhase !== undefined ? +args.euclidPhase : -1;
  if (EUC && (EUP < 0 || (heurPhase(g) >= EUP))) { const b = g.player.body, x = b.position.x, y = -b.position.y; const lx = x + b.velocity.x * LOOK, ly = y - b.velocity.y * LOOK;
    return Math.min(Math.hypot(x - EUC[0], y - EUC[1]), Math.hypot(lx - EUC[0], ly - EUC[1]) + 2 * LOOK); }
  const b = g.player.body, x = b.position.x, y = -b.position.y, vx = b.velocity.x, vy = -b.velocity.y;
  while (g.phase < NP - 1 && inRect(PH[g.phase].rect, x, y)) g.phase++;
  const k = g.phase;
  const d0 = Dk(k, x, y);
  // look-ahead along velocity, truncated at the first blocked cell (never jump across walls)
  let lx = x, ly = y; const steps = Math.ceil(Math.hypot(vx, vy) * LOOK / 3);
  for (let i = 1; i <= steps; i++) { const px = x + vx * LOOK * i / steps, py = y + vy * LOOK * i / steps;
    const c = Math.floor((px - meta.X0) / meta.RES), r = Math.floor((meta.Y1 - py) / meta.RES);
    if (c < 0 || r < 0 || c >= meta.W || r >= meta.H || DM[k][r * meta.W + c] < 0) break; lx = px; ly = py; }
  const dl = Dk(k, lx, ly);
  let h = d0 < 0 ? 1e5 : d0;
  if (dl >= 0) h = Math.min(h, dl + 4 * LOOK * Math.hypot(lx - x, ly - y) / Math.max(1e-9, Math.hypot(vx, vy) * LOOK));
  if (g.player.jumpReady && (g.player.mode == 'control' || g.player.mode == 'jump')) h -= JRB;
  if (args.smallw && g.player.scale.x > 16 && g.stepNo > 60) h += +args.smallw;
  if (args.hx && (!args.hxafter || g.stepNo > +args.hxafter)) h -= +args.hx * vx;
  if (args.hs) h -= +args.hs * Math.hypot(vx, vy);
  return OFF[k] + h;
}
// root
const lvl = JSON.parse(fs.readFileSync(process.env.LEVEL || '/home/claude/boxel/mc.json'));
let root = new Game(lvl); root.virtualTips = args.vt == 1; // vt=1 is FASTER but WRONG after a tip is hidden (pair-order drift vs real game)
root.tasStart(); root.player.jumpReady = false;
root.player.position = { x: root.player.body.position.x, y: -root.player.body.position.y, z: 0 };
root.pending = null; root.stepNo = 0; root.phase = +(args.phase || 0); root.folO = +(args.folo || 0);
root.afterUpdate = [function (g) { const a = g.pending; if (!a) return; const P = g.player;
  if (a.h !== undefined) { P.controls.left = a.h < 0 ? -1 : 0; P.controls.right = a.h > 0 ? 1 : 0; }
  if (a.j) g.jumpOk = g.jump();
  if (a.r === 'G') g.removeRope();
  else if (a.r !== undefined && a.r !== null) { const ang = a.r * Math.PI / 180; g.ropeOk = g.addRope({ x: P.position.x + Math.cos(ang), y: P.position.y + Math.sin(ang) }); }
}];
// Seed: optionally replay a prefix of actions from a file
let states = [{ g: root, node: null, h: heur(root) }];
let T0 = 0;
if (args.seed) { const sd = JSON.parse(fs.readFileSync(args.seed)); T0 = +(args.seedT || sd.t); const byT = new Map(sd.acts.map(a => [a.t, a]));
  let node = null;
  for (let t = 1; t <= T0; t++) { const a = byT.get(t) || null; root.pending = a; root.stepNo = t; root.step(); heur(root); if (a) node = { p: node, t, a }; }
  root.pending = null; if (!args.tkeep) root.trackK = 0; else if (TRK) { let b=1e9; const x=root.player.body.position.x, y=-root.player.body.position.y; for (let k=0;k<TRK.length;k++){const d=Math.hypot(x-TRK[k][0],y-TRK[k][1]); if(d<b){b=d;root.trackK=k;}} } if (FOL) root.folO = +(args.folo || 0); states = [{ g: root, node, h: heur(root) }];
  console.log('seeded to', T0, 'pos', root.player.body.position.x.toFixed(0), (-root.player.body.position.y).toFixed(0), 'phase', root.phase); }

function polySep(A, B) { let best = -1e9;
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; let nx = b.y - a.y, ny = a.x - b.x; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const v of A) { const d = v.x * nx + v.y * ny; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
    for (const v of B) { const d = v.x * nx + v.y * ny; b0 = Math.min(b0, d); b1 = Math.max(b1, d); } best = Math.max(best, Math.max(b0 - a1, a0 - b1)); }
  return best; }
const SMARGIN = args.smargin ? +args.smargin : 0;
function tooClose(g) { if (!SMARGIN) return false; const pv = g.player.body.parts.length > 1 ? g.player.body.parts[1].vertices : g.player.body.vertices;
  for (const c of g.children) { if (!c.body || c.body.class != "spike" || c.position.z != 0) continue; const sp = c.body.parts.filter(q => q.isSensor && q !== c.body); for (const q of sp) { if (args.fastsm) { const A = g.player.body.bounds, B = q.bounds; const gap = Math.max(B.min.x - A.max.x, A.min.x - B.max.x, B.min.y - A.max.y, A.min.y - B.max.y); if (gap > 40 + SMARGIN) continue; } if (polySep(pv, q.vertices) < SMARGIN) return true; } }
  return false; }
function ropeAnchor(P) { const n = P.rope.children.length; if (!n) return ''; const j = P.rope.children[n - 1], c = j.constraint, b = c.bodyB;
  return Math.round((b.position.x + c.pointB.x) / 8) + ':' + Math.round((b.position.y + c.pointB.y) / 8); }
function key(g) {
  const P = g.player, b = P.body;
  return [Math.floor(b.position.x / BX), Math.floor(b.position.y / BX), Math.round(b.velocity.x / BV), Math.round(b.velocity.y / BV),
    P.jumpReady ? 1 : 0, P.mode, P.controls.left + P.controls.right, g.world.gravity.x, g.world.gravity.y, P.force.x.toFixed(6), P.force.y.toFixed(6), P.rope.children.length, ropeAnchor(P), args.akey ? Math.round(((b.angle % (Math.PI/2)) + Math.PI/2) % (Math.PI/2) / (+args.akey * Math.PI / 180)) + ':' + Math.round(b.angularVelocity * 100) : ''].join(',');
}
const VIS = args.vis ? new Map() : null; const VBX = +(args.vbx || 6), VBV = +(args.vbv || 0.75), VANG = +(args.vang || 15) * Math.PI / 180;
function vkey(g) { const P = g.player, b = P.body;
  return [Math.floor(b.position.x / VBX), Math.floor(b.position.y / VBX), Math.round(b.velocity.x / VBV), Math.round(b.velocity.y / VBV), P.jumpReady ? 1 : 0, P.mode, g.world.gravity.x, g.world.gravity.y, P.rope.children.length, ropeAnchor(P),
    Math.round(((b.angle % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2) / VANG), Math.round(b.angularVelocity * 20)].join(','); }
function actionsFor(g) {
  const P = g.player, out = [];
  const cur = P.controls.left + P.controls.right;
  if (P.mode == 'control') { for (const h of [-1, 0, 1]) { out.push({ h, j: 0 }); out.push({ h, j: 1 }); if (P.rope.children.length) out.push({ h, r: 'G' }); } }
  else if (P.mode == 'jump') { out.push({}); out.push({ j: 1 }); }
  else if (P.mode == 'grapple') { out.push({}); out.push({ r: 'G' }); for (const a of ANG) out.push({ r: a }); }
  else out.push({});
  return out;
}
const GRID = new Map(); let GRIDW = null; const GC = 32;
function gridFor(world) { if (GRIDW) return; GRIDW = true;
  for (const b of world.bodies) if (b.isStatic) { const B = b.bounds; for (let cx = Math.floor(B.min.x / GC); cx <= Math.floor(B.max.x / GC); cx++) for (let cy = Math.floor(B.min.y / GC); cy <= Math.floor(B.max.y / GC); cy++) { const k = cx * 100003 + cy; let l = GRID.get(k); if (!l) GRID.set(k, l = []); l.push(b); } } }
function bodyHas(body, pt) { if (!Matter.Bounds.contains(body.bounds, pt)) return false; const P = body.parts;
  for (let j = P.length === 1 ? 0 : 1; j < P.length; j++) { const q = P[j]; if (Matter.Bounds.contains(q.bounds, pt) && Matter.Vertices.contains(q.vertices, pt)) return true; } return false; }
// returns {i (index in world.bodies), point} exactly as addRope would hit, or null
function rayHit(g, px, py, mx, my, ctx) { const P = g.player; if (P.isFrozen()) return null; gridFor(g.world);
  if (!ctx.idx) { ctx.idx = new Map(); ctx.dyn = []; g.world.bodies.forEach((b, i) => { ctx.idx.set(b, i); if (!b.isStatic) ctx.dyn.push(b); }); }
  const length = 400, dx = mx - px, dy = my - py, dist = Math.sqrt(dx * dx + dy * dy);
  const p1x = px, p1y = -py, p2x = px + dx * length / dist, p2y = -(py + dy * length / dist);
  for (let i = 0; i < length; i += 4) { const pc = i / length, pt = { x: p1x + (p2x - p1x) * pc, y: p1y + (p2y - p1y) * pc };
    let best = null, bi = 1e9; const l = GRID.get(Math.floor(pt.x / GC) * 100003 + Math.floor(pt.y / GC));
    if (l) for (const b of l) { const bx = ctx.idx.get(b); if (bx < bi && bodyHas(b, pt)) { bi = bx; best = b; } }
    for (const b of ctx.dyn) { const bx = ctx.idx.get(b); if (bx < bi && bodyHas(b, pt)) { bi = bx; best = b; } }
    if (best && best.class != 'player') { const o = g.byName.get(best.name); if (o && o.visible == true && o.position.z == 0 && !(g.virtualTips && g.hiddenTips[o.name])) return { i: bi, point: pt }; } }
  return null; }
function actsOf(node) { const acts = []; while (node) { acts.push({ t: node.t, ...node.a }); node = node.p; } return acts.reverse(); }
const t0 = Date.now();
let finish = null;
const progress = [];
for (let t = T0 + 1; t <= TMAX && !finish; t++) {
  const next = new Map();
  for (const st of states) {
    let base = null, preX = 0, preY = 0; const ctx = {};
    const fastG = args.fastg && st.g.player.mode == 'grapple';
    if (fastG) { preX = st.g.player.position.x; preY = st.g.player.position.y; base = cloneGame(st.g); base.pending = null; base.jumpOk = true; base.ropeOk = true; base.stepNo = t; base.step(); }
    const AL = actionsFor(st.g); if (fastG) AL.push(AL.shift());
    for (const a of AL) {
      let c;
      if (fastG && base.player.mode == 'grapple' && !base.dead && !base.finished) {
        if (a.r === undefined) c = base;
        else if (a.r === 'G') { if (!base.player.rope.children.length) continue; c = cloneGame(base); c.removeRope(); }
        else { const ang = a.r * Math.PI / 180; const hit = rayHit(base, preX, preY, preX + Math.cos(ang), preY + Math.sin(ang), ctx);
          if (!hit && args.fastcheck) { const d = cloneGame(base); const post = d.player.position; d.player.position = { x: preX, y: preY, z: post.z }; const r = d.addRope({ x: preX + Math.cos(ang), y: preY + Math.sin(ang) }); if (r) console.log('FASTCHECK MISS', t, a.r); }
          if (!hit) continue;
          c = cloneGame(base); c.removeRope(); c.player.rope.addJoints(c, c.player.body, c.world.bodies[hit.i], hit.point); c.player.rope.updateJoints(); c.ropeOk = hit.point;
          if (args.fastcheck) { const d = cloneGame(base); const post = d.player.position; d.player.position = { x: preX, y: preY, z: post.z }; const r = d.addRope({ x: preX + Math.cos(ang), y: preY + Math.sin(ang) }); d.player.position = post; if (!r || r.x !== hit.point.x || r.y !== hit.point.y) console.log('FASTCHECK MISMATCH', t, a.r, JSON.stringify(r), JSON.stringify(hit.point)); } }
        c.pending = a; c.stepNo = t;
      } else {
      c = cloneGame(st.g); c.pending = a; c.jumpOk = true; c.ropeOk = true; c.stepNo = t;
      c.step(); }
      if (a.j && !c.jumpOk) continue;          // jump did nothing -> duplicate of no-jump
      if (a.r !== undefined && a.r !== 'G' && !c.ropeOk) continue; // grapple missed
      if (c.dead || tooClose(c)) continue;
      if (args.nograv && (c.world.gravity.x != 0 || c.world.gravity.y != 1)) continue;
      const node = { p: st.node, t, a };
      if (c.finished) { if (!finish) finish = { t, node }; continue; }
      if (args.wedgegoal && !finish) { const P = c.player, b = P.body; const a2 = ((b.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), ca = ((177.483520 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); let da = Math.abs(a2 - ca); da = Math.min(da, 2 * Math.PI - da);
        if (Math.max(Math.abs(b.position.x - 8691.880155), Math.abs(-b.position.y - 4000.119541), Math.abs(b.velocity.x), Math.abs(b.velocity.y), da, Math.abs(b.angularVelocity)) < 1e-5 && P.jumpReady && P.mode == 'control' && P.controls.right == 1 && P.controls.left == 0) { finish = { t, node }; console.log('WEDGE at', t); } }
      if (args.pruneg && c.player.mode == 'grapple' && !(-c.player.body.velocity.y > +args.pruneg)) continue;
      if (args.goalmode && c.player.mode == args.goalmode && !finish && (!args.goalvy || -c.player.body.velocity.y > +args.goalvy)) { finish = { t, node }; console.log('GOALMODE at', t); }
      if (RS) { const r = rjDiff(c); if (r.dp < +(args.rtp || 2) && r.dv < +(args.rtv || 0.3) && r.da < +(args.rta || 0.06) && r.dw < +(args.rtw || 0.02) && r.jr && !finish) { finish = { t, node }; console.log('REJOIN at', t, JSON.stringify(r)); } }
      const h = heur(c);
      const k = key(c), cur = next.get(k);
      if (!cur || h < cur.h) next.set(k, { g: c, node, h });
    }
  }
  let arr = [...next.values()];
  if (VIS && t > +(args.visfrom || 0)) arr = arr.filter(s => { const v = VIS.get(vkey(s.g)); return v === undefined || v >= t; });
  arr.sort((a, b) => a.h - b.h);
  const cellCount = new Map(); const kept = []; const taken = new Set();
  // elites: best state per coarse cell (novelty), up to ELITE share of K
  const EC = +(args.ecell || 48), EMAX = Math.floor(K * +(args.elite || 0.4));
  const eliteSeen = new Set();
  for (const s of arr) { const b = s.g.player.body; const ek = Math.floor(b.position.x / EC) + ',' + Math.floor(b.position.y / EC) + ',' + s.g.phase + ',' + s.g.player.mode;
    if (eliteSeen.has(ek)) continue; eliteSeen.add(ek); kept.push(s); taken.add(s); if (kept.length >= EMAX) break; }
  for (const s of arr) { if (taken.has(s)) continue; const b = s.g.player.body; const ck = Math.floor(b.position.x / CELL) + ',' + Math.floor(b.position.y / CELL) + ',' + s.g.phase;
    const n = cellCount.get(ck) || 0; if (n >= CAP) continue; cellCount.set(ck, n + 1); kept.push(s); if (kept.length >= K) break; }
  states = kept;
  if (VIS) for (const s of kept) { const k = vkey(s.g); if (!VIS.has(k)) VIS.set(k, t); }
  if (!states.length) { console.log('all states died at', t); break; }
  if (t % LOG == 0 || finish) {
    const b = states[0].g.player.body;
    const line = `t=${t} n=${states.length} buckets=${next.size} bestD=${states[0].h.toFixed(0)} pos=(${b.position.x.toFixed(0)},${(-b.position.y).toFixed(0)}) v=(${b.velocity.x.toFixed(1)},${(-b.velocity.y).toFixed(1)}) mode=${states[0].g.player.mode} phase=${states[0].g.phase} lead=${states[0].g.folO} ${((Date.now() - t0) / 1000).toFixed(0)}s`;
    console.log(line);
    progress.push({ t, h: states[0].h, x: b.position.x, y: -b.position.y, phase: states[0].g.phase });
    if (t % (+(args.psave || 250)) == 0) fs.writeFileSync(OUT.replace('.json', '_partial_' + t + '.json'), JSON.stringify({ t, acts: actsOf(states[0].node), progress }));
    if (t % 250 == 0) fs.writeFileSync(OUT.replace('.json', '_partial.json'), JSON.stringify({ t, acts: actsOf(states[0].node), progress }));
    if (args.diag && t % +args.diag == 0) { const top = states.slice(0, 400).map(s => [Math.round(s.g.player.body.position.x), Math.round(-s.g.player.body.position.y), Math.round(s.h), s.g.player.jumpReady ? 'R' : '-']);
      const hi = [...top].sort((a, b) => b[1] - a[1]).slice(0, 8); console.log('  top-by-h', JSON.stringify(top.slice(0, 6)), '\n  highest', JSON.stringify(hi)); }
  }
}
const best = finish ? finish.node : (states[0] ? states[0].node : null);
fs.writeFileSync(OUT, JSON.stringify({ finish: finish && finish.t, acts: actsOf(best), progress }));
console.log('DONE finish=', finish && finish.t);
