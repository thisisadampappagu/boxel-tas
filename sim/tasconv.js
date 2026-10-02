// Convert per-frame actions [{t,h,j,r}] into a Boxel 3D TAS v2.1.1 input list with exact timing.
function commandsFor(acts) {
  // returns [{t, cmds:[...]}] tracking held control state like the TAS
  let left = 0, right = 0; const ev = [];
  for (const a of acts) {
    const cmds = [];
    if (a.h !== undefined) {
      const wantL = a.h < 0 ? -1 : 0, wantR = a.h > 0 ? 1 : 0;
      if (left !== wantL) { cmds.push(wantL ? 'a' : 'A'); left = wantL; }
      if (right !== wantR) { cmds.push(wantR ? 'd' : 'D'); right = wantR; }
    }
    if (a.j) cmds.push('j');
    if (a.r === 'G') cmds.push('G'); else if (a.r !== undefined && a.r !== null) cmds.push('g' + a.r);
    if (cmds.length) ev.push({ t: a.t, cmds });
  }
  return ev;
}
// exact mock of consumeInputs(): returns [[step, cmd], ...]
function simulateConsumer(tokens, maxSteps) {
  const temp = [...tokens], out = [];
  for (let s = 1; s <= maxSteps && temp.length; s++) {
    for (let i = 0; i < 4; i++) {
      if (temp.length == 0) break;
      const n = temp[0];
      if (typeof n == 'number') { if (n == 0) { temp.splice(0, 1); continue; } temp[0]--; break; }
      temp.splice(0, 1); out.push([s, n]);
    }
  }
  return out;
}
function build(acts, tailWait = 600) {
  const ev = commandsFor(acts);
  for (const e of ev) if (e.cmds.length > 3) throw new Error('too many commands at ' + e.t);
  const tokens = [];
  for (let k = 0; k < ev.length; k++) {
    // choose wait w so that commands fire exactly at ev[k].t; search small window around formula
    const prevT = k ? ev[k - 1].t : 0, prevN = k ? ev[k - 1].cmds.length : 3;
    let base = k == 0 ? ev[0].t - 1 : (prevN <= 2 ? ev[k].t - prevT : ev[k].t - prevT - 1);
    let ok = false;
    for (const w of [base, base - 1, base + 1, base - 2, base + 2]) {
      if (w < 0) continue;
      const trial = [...tokens, w, ...ev[k].cmds];
      const sim = simulateConsumer(trial, ev[k].t + 5);
      const fired = sim.slice(-ev[k].cmds.length);
      if (sim.length == trial.filter(x => typeof x != 'number').length && fired.every(f => f[0] == ev[k].t)) { tokens.push(w, ...ev[k].cmds); ok = true; break; }
    }
    if (!ok) throw new Error('cannot schedule event at ' + ev[k].t);
  }
  tokens.push(tailWait);
  // final full check
  const sim = simulateConsumer(tokens, (ev.length ? ev[ev.length - 1].t : 0) + 5);
  const flat = []; for (const e of ev) for (const c of e.cmds) flat.push([e.t, c]);
  if (sim.length != flat.length || sim.some((x, i) => x[0] != flat[i][0] || x[1] != flat[i][1])) throw new Error('verification failed');
  return tokens;
}
module.exports = { build, commandsFor, simulateConsumer };
// Commands derived from the real control state during a replay (handles resets that clear held keys)
function commandsFromReplay(acts, maxT) {
  const { makeGame } = require('./replay.js');
  const g = makeGame(); const byT = new Map(acts.map(a => [a.t, a])); const ev = [];
  const orig = g.afterUpdate[0];
  g.afterUpdate = [function (gg) {
    const a = gg.pending; if (!a) return;
    const P = gg.player, cmds = [];
    if (a.h !== undefined) {
      const wantL = a.h < 0 ? -1 : 0, wantR = a.h > 0 ? 1 : 0;
      if (P.controls.left !== wantL) cmds.push(wantL ? 'a' : 'A');
      if (P.controls.right !== wantR) cmds.push(wantR ? 'd' : 'D');
    }
    if (a.j) cmds.push('j');
    if (a.r === 'G') cmds.push('G'); else if (a.r !== undefined && a.r !== null) cmds.push('g' + a.r);
    if (cmds.length) ev.push({ t: gg.stepNo, cmds });
    orig(gg);
  }];
  for (let t = 1; t <= maxT; t++) { g.pending = byT.get(t) || null; g.stepNo = t; g.step(); if (g.finished || g.dead) break; }
  return ev;
}
function buildFromReplay(acts, maxT, tailWait = 600) {
  const ev = commandsFromReplay(acts, maxT);
  const fake = []; // re-use build() scheduling by feeding pre-computed events
  const tokens = [];
  for (let k = 0; k < ev.length; k++) {
    if (ev[k].cmds.length > 3) throw new Error('too many commands at ' + ev[k].t);
    const prevT = k ? ev[k - 1].t : 0, prevN = k ? ev[k - 1].cmds.length : 3;
    const base = k == 0 ? ev[0].t - 1 : (prevN <= 2 ? ev[k].t - prevT : ev[k].t - prevT - 1);
    let ok = false;
    for (const w of [base, base - 1, base + 1, base - 2, base + 2]) {
      if (w < 0) continue;
      const trial = [...tokens, w, ...ev[k].cmds];
      const sim = simulateConsumer(trial, ev[k].t + 5);
      const fired = sim.slice(-ev[k].cmds.length);
      if (sim.length == trial.filter(x => typeof x != 'number').length && fired.every(f => f[0] == ev[k].t)) { tokens.push(w, ...ev[k].cmds); ok = true; break; }
    }
    if (!ok) throw new Error('cannot schedule event at ' + ev[k].t);
  }
  tokens.push(tailWait);
  return tokens;
}
module.exports.buildFromReplay = buildFromReplay;
