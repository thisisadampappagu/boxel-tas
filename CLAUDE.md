# Boxel 3D TAS search toolkit

This repo is a headless, frame-exact simulator of Boxel 3D (Matter.js 0.19, fixed 1000/60 ms
steps) plus a beam-search tool for finding fast tool-assisted runs. Agents working here run
search jobs and save their best action files. A coordinator verifies results in the real game.

## Setup (once per machine)
    ./setup.sh            # unpacks maps/*.f32.gz
Node 18+ and nothing else is needed. Run everything from `sim/`.
Check how many cores you have (`nproc`) and run at most that many searches at once, each with
`--max-old-space-size=2800` or less. Too many processes run the machine out of memory.

## Files
- `levels/` level JSONs (Mountain Climb = the built-in version).
- `maps/` distance maps used by the search heuristic (`maps=../maps/mcb3_p`, `../maps/s32_p`, `../maps/s39c_p`).
- `runs/` current best action files (`{t, acts:[{t,h,j,r}]}`) and per-frame state files (`st_*.json`).
- `tracks/` reference paths (arrays of [x,y], 4 px spacing) for the `track=` heuristic.
- `sim/mcbeam.js` beam search. `sim/check.sh`-style replay: `../check.sh LEVEL ACTS [max]`.

Action format: per frame `{t, h:-1|0|1 (control mode left/right), j:1 (jump), r:<angle deg>|'G' (grapple at angle / release)}`.
Angles: 0 = right, 90 = up, negative = down-right.

## mcbeam.js options (key=value)
- `K` beam width, `T` last frame, `log`, `psave=N` (saves `<out>_partial_<t>.json` every N frames), `out=`.
- `seed=file.json seedT=N` replay that file's first N frames, then search.
- Heuristics:
  - `maps=PREFIX phase=K` distance-map heuristic (phases are waypoints). `hs=` speed reward, `hx=` x-speed reward, `jrb=` bonus for having a jump ready.
  - `track=file tw=W` follow a reference path, rewarding progress along it (W per 4 px). Add `tkeep=1` when seeding mid-run.
  - `fol=1 st=STATEFILE folo=OFFSET fw= fth= fahead=` follow a reference run's full per-frame state, rewarding matching a LATER frame (skips loops). OFFSET = (reference frame) − (current frame) at the seed point.
  - `rejoin=F st=STATEFILE rtp= rtv= rta= rtw=` stop as soon as a state matches frame F of the reference.
  - `goalmode=grapple [goalvy=V] [pruneg=V]` stop when grapple mode is entered (optionally while moving up faster than V).
- `vis=1 [visfrom=N]` never revisit a coarse state seen at an earlier frame (kills dithering; set visfrom≈12 for grapple levels whose first frames are idle).
- `smargin=1` stay ≥1 px from spike sensors (keep this on).
- `angles=` grapple angle set. Use `-60,-40,-25,-10,0,20,40,60,70,80,90,100,110,120,140,160,180,195,210`.
- `bx bv akey cap` dedup granularity / diversity; good defaults: `bx=2 bv=0.25 akey=15 cap=60`.

## What has worked
- Grapple "kick": grappling for 1–2 frames onto a surface 50–100 px ahead, then releasing (`G`), adds several px/frame. Chained, it reaches 30–80 px/frame (Level 33: 240 frames; Mountain Climb ending).
- Mountain Climb end: from `runs/mcg_e46.json` (grapple entered at 2869 moving up),
  `track=../tracks/mcb_trk_full.json tkeep=1 tw=8 hs=5 vis=1 jrb=10 K=500` + angles above finished at 3051.
- Level 32: `track=../tracks/trk32.json tw=4 hs=20 vis=1 visfrom=12 K=500` + angles → 404 frames.
- Results vary a lot between parameter choices. Run several variants (tw 2–8, hs 3–30, K 500–1500) rather than one.

## Targets
- Mountain Climb: best 3051 frames. Goal < 3000 (50 s).
- Campaign Level 32: best 404. World record 395 (6.580 s). Goal ≤ 394.
- Campaign Level 39: best 781 (`runs/level39_best_tokens.txt`, token format). World record 698.

## Example (Mountain Climb ending)
    cd sim
    LEVEL="../levels/Mountain Climb.json" node --max-old-space-size=2800 mcbeam.js K=500 T=3100 log=10 \
      track=../tracks/mcb_trk_full.json tkeep=1 tw=8 hs=5 jrb=10 bx=2 bv=0.25 akey=15 cap=60 smargin=1 \
      psave=25 maps=../maps/mcb3_p phase=4 vis=1 seed=../runs/mcg_e46.json seedT=2869 \
      angles=-60,-40,-25,-10,0,20,40,60,70,80,90,100,110,120,140,160,180,195,210 out=../results/NAME.json

## Reporting results
Put every finishing action file in `results/<level>_<frames>_<agent>.json`. Confirm it with
`../check.sh "<level file>" <file>`. Commit it on your own branch (`agent/<name>`) and push.
Include a one-line note in the commit message with the exact command that produced it.
