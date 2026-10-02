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

## Mountain Climb: how the current best (3051) is built
The level is played in phases; each later phase was re-searched from a state the earlier phase produced.
1. Frames 0–680: original route up the first slope (`runs/mcb_p4.json` prefix).
2. ~700–770: instead of jumping around on the small platform, the cube gets WEDGED in the corner between
   the big slope and the spike block at (1880,1268) — the one resting state in the run — then jumps to the bounce pad.
3. Big beam (K=1500, map heuristic `maps=../maps/mcb3_p phase=0 vis=1 hs=2 jrb=20`) got through the bounce-pad
   launch at ~1200 (the place where narrow searches always lost time).
4. 1200–2150: `track=../tracks/mcb_trk_full.json tkeep=1 tw=4 hs=6 K=1000` (`runs/mcy4_partial_2150.json`).
5. 2150–2750: `fol=1 st=../runs/st_mcb3.json folo=189 fw=2 fth=30 fahead=200` (state-following of the old run,
   189 frames ahead of it) → `runs/mcy7_partial_2750.json`.
6. Grapple entry: from 2750, `goalmode=grapple pruneg=6` (enter grapple block while moving up faster than 6 px/f;
   entering with no upward speed costs ~100 frames later) → entry at 2869 (`runs/mcg_e46.json`).
7. Ending 2869→3051: `track=../tracks/mcb_trk_full.json tkeep=1 tw=8 hs=5 vis=1 K=500` + angles
   (`runs/mch2.json`). The swing reaches 20+ px/f, climbs the wall at x≈10660 at ~20 px/f, flies over the top
   and grapple-kicks to 70 px/f into the finish (it grapples the finish cube itself on frame 3049).
   Partials: `runs/mch2_partial_2900/2950/3000.json`; per-frame states: `runs/st_mc_best.json`.
Key facts: the ending is very sensitive — reruns with slightly different params often get stuck slowly climbing
the wall at x≈10655 (y 4000→4400) and finish 3100+. A run that reaches y>4300 at x≈10670 before frame ~3000 is
on track. Gains elsewhere require re-searching everything after them (chaotic physics), so the cheapest wins are
in steps 6–7.
Useful seed points if you want to work earlier: `runs/mcy7_partial_2700/2750.json`, `runs/mcy4_partial_2150.json`.

## Mountain Climb: the beginning (frames 0–1200)
- Old route frames 0–680 is in `runs/mcb_p4.json` (it wastes ~40 frames at the very start going left).
- The wedge: the old run (states `runs/st_mcb3.json`) comes to rest wedged in the corner at (1880.5, 1268.5) at
  frame 961. `runs/wedge_769.json` reaches that state at frame 769 (seed from mcb_p4 at 680, `fol=1 st=../runs/st_mcb3.json
  folo=0 fw=1 fth=30 fahead=300 rejoin=961 rtp=1 rtv=0.2 rta=0.02 rtw=0.02 K=1000`). Replaying old inputs after it
  only holds ~14 frames, so everything after must be re-searched.
- `runs/escape_800.json` (frame 800) is a different, also-fast escape (reached the plank above the bounce pad at ~820).
- From escape_800, a K=1500 map-heuristic beam (`maps=../maps/mcb3_p phase=0 vis=1 jrb=20 hs=2`) got through the
  second bounce-pad launch: `runs/mcy1_partial_1200.json` at frame 1200 is ~193 frames ahead of the old run
  (it is at the state the old run had at frame ~1393). Narrow beams (K≤600) always lost the lead at that launch (~1200).
- Lead measure: for a state at time t, find the nearest point of the old run's trajectory (`st_mcb3` x,y) → frame k;
  lead = k − t. Current chain: lead ≈190 at 1200, ≈196 at 2130, ≈202 at 2780.
