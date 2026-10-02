// runpc.js — run many beam searches in parallel on your own PC (Windows/Mac/Linux).
// Usage (from the sim/ folder):   node runpc.js <level> [parallel]
//   level: l32 | l39 | mc        parallel: how many searches at once (default 12)
// Results: ../results/pc_<level>_<n>.json (+ .log). Anything faster than the current best is
// copied to ../results/BEST_<level>_<frames>.json — send/push those files.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const level = process.argv[2];
const PAR = +(process.argv[3] || 12);
const MEM = '--max-old-space-size=2000';
const WIDE = 'angles=-60,-50,-40,-30,-25,-15,-10,0,10,20,30,40,60,70,80,90,100,110,120,140,160,180,195,210';

const LV = {
  l32: { file: '../levels/Campaign Level 32.json', best: 404, T: 410,
    base: `T=410 log=10 jrb=10 bx=2 bv=0.25 akey=15 cap=60 smargin=1 psave=25 maps=../maps/s32_p phase=0 ${WIDE}` },
  l39: { file: '../levels/Campaign Level 39.json', best: 781, T: 790,
    base: 'T=790 log=10 bx=2 bv=0.25 akey=15 cap=60 smargin=1 psave=25 maps=../maps/s39c_p' },
  mc:  { file: '../levels/Mountain Climb.json', best: 3034, T: 3045,
    base: `T=3045 log=10 track=../tracks/mcb_trk_full.json tkeep=1 jrb=10 bx=2 bv=0.25 akey=15 cap=60 smargin=1 psave=25 maps=../maps/mcb3_p phase=4 vis=1 ${WIDE}` },
};

function jobs(lv) {
  const J = [];
  if (lv === 'l32') {
    for (const K of [600, 1000, 1500]) for (const [tw, hs] of [[4, 20], [3, 30], [5, 16], [4, 26]]) for (const trk of ['trk32', 'trk32b'])
      J.push(`K=${K} track=../tracks/${trk}.json tw=${tw} hs=${hs} vis=1 visfrom=12`);
    for (const K of [800, 1200]) for (const fw of [2, 3, 4]) for (const hs of [4, 10])
      J.push(`K=${K} fol=1 st=../runs/st_l32.json folo=0 fw=${fw} fth=30 fahead=60 rwv=3 rwa=2 rww=10 hs=${hs} jrb=0`);
    for (const sm of [0.3, 0.5]) J.push(`K=800 track=../tracks/trk32b.json tw=4 hs=20 vis=1 visfrom=12 smargin=${sm}`);
  } else if (lv === 'l39') {
    for (const K of [800, 1200, 1800]) for (const fw of [2, 3, 4, 5]) J.push(`phase=2 fol=1 st=../runs/st_l39.json folo=0 fth=30 rwv=4 rwa=5 rww=30 jrb=0 K=${K} fw=${fw} fahead=150`);
    for (const K of [1000, 2000]) for (const hs of [0, 3, 6]) J.push(`phase=0 vis=1 visfrom=5 jrb=20 K=${K} hs=${hs}`);
    for (const K of [1000, 1500]) for (const [tw, hs] of [[6, 4], [3, 8], [8, 2]]) J.push(`phase=2 track=../tracks/trk39.json tw=${tw} hs=${hs} jrb=10 vis=1 visfrom=5 K=${K}`);
  } else if (lv === 'mc') {
    for (const S of [2950, 3000]) for (const K of [800, 1200]) for (const [tw, hs] of [[4, 20], [4, 26], [3, 20], [5, 24], [4, 16]])
      J.push(`seed=../runs/mch2_partial_${S}.json seedT=${S} K=${K} tw=${tw} hs=${hs}`);
  }
  return J;
}

if (!LV[level]) { console.log('usage: node runpc.js l32|l39|mc [parallel]'); process.exit(1); }
const L = LV[level];
const list = jobs(level);
fs.mkdirSync('../results', { recursive: true });
console.log(`${list.length} searches for ${level}, ${PAR} at a time. Current best ${L.best}.`);
let next = 0, running = 0, best = L.best;

function check(out) {
  try {
    const { buildFromReplay } = require('./tasconv.js'); const { Game, runTAS } = require('./sim2.js');
    const d = JSON.parse(fs.readFileSync(out)); const tok = buildFromReplay(d.acts, L.T + 300);
    const r = runTAS(new Game(JSON.parse(fs.readFileSync(L.file))), tok, L.T + 300);
    return r.r === 'finish' ? r.steps : null;
  } catch (e) { return null; }
}

function start() {
  while (running < PAR && next < list.length) {
    const i = next++; const args = list[i];
    const out = `../results/pc_${level}_${i}.json`, log = `../results/pc_${level}_${i}.log`;
    const argv = [MEM, 'mcbeam.js', ...L.base.split(' '), ...args.split(' '), `out=${out}`];
    const fd = fs.openSync(log, 'w');
    const p = spawn(process.execPath, argv, { env: { ...process.env, LEVEL: L.file }, stdio: ['ignore', fd, fd] });
    running++;
    console.log(`[start ${i}] ${args}`);
    p.on('exit', () => {
      running--;
      const txt = fs.readFileSync(log, 'utf8'); const m = txt.match(/DONE finish= (\d+)/);
      const n = m ? +m[1] : null;
      let msg = `[done ${i}] finish=${n}`;
      if (n && n < best) {
        const v = check(out);
        if (v === n) { best = n; fs.copyFileSync(out, `../results/BEST_${level}_${n}.json`); msg += `  *** NEW BEST ${n} -> results/BEST_${level}_${n}.json`; }
        else msg += ` (failed re-check: ${v})`;
      }
      console.log(msg + `  (${list.length - next} queued, ${running} running)`);
      if (next >= list.length && running === 0) console.log(`ALL DONE. Best: ${best}`);
      start();
    });
  }
}
start();
