// Replay an action list (per-frame actions) in a fresh sim; print/save trajectory
const fs = require('fs');
const { Game } = require('./sim2.js');
function makeGame(virtual = true) {
  const g = new Game(JSON.parse(fs.readFileSync(process.env.LEVEL || '/home/claude/boxel/mc.json'))); g.virtualTips = virtual;
  g.tasStart(); g.player.jumpReady = false; g.player.position = { x: g.player.body.position.x, y: -g.player.body.position.y, z: 0 };
  g.pending = null;
  g.afterUpdate = [function (g) { const a = g.pending; if (!a) return; const P = g.player;
    if (a.h !== undefined) { P.controls.left = a.h < 0 ? -1 : 0; P.controls.right = a.h > 0 ? 1 : 0; }
    if (a.j) g.jumpOk = g.jump();
    if (a.r === 'G') g.removeRope();
    else if (a.r !== undefined && a.r !== null) { const ang = a.r * Math.PI / 180; g.ropeOk = g.addRope({ x: P.position.x + Math.cos(ang), y: P.position.y + Math.sin(ang) }); } }];
  return g;
}
function replay(acts, maxT, cb) {
  const g = makeGame(); const byT = new Map(acts.map(a => [a.t, a]));
  for (let t = 1; t <= maxT; t++) { g.pending = byT.get(t) || null; g.stepNo = t; g.step(); if (cb) cb(t, g); if (g.finished || g.dead) return { g, t, r: g.finished ? 'finish' : 'dead' }; }
  return { g, t: maxT, r: 'timeout' };
}
module.exports = { makeGame, replay };
if (require.main === module) {
  const d = JSON.parse(fs.readFileSync(process.argv[2]));
  const traj = [];
  const last = d.acts.length ? d.acts[d.acts.length - 1].t : 0;
  const r = replay(d.acts, +process.argv[3] || last, (t, g) => { const b = g.player.body; traj.push([+b.position.x.toFixed(1), +(-b.position.y).toFixed(1)]); });
  fs.writeFileSync(process.argv[2].replace('.json', '_traj.json'), JSON.stringify(traj));
  console.log(r.r, r.t, traj[traj.length - 1]);
}
