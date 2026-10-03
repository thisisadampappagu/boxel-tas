mc1 tools (Mountain Climb analysis)
- tools/lead.py A_states REF_states [step]  : lead (frames) of run A vs reference trajectory (nearest point).
- tools/leadacts.sh ACTS.json [step] [ref] [lines] : replay acts -> states -> lead vs runs/st_mc_3034.json.
- tools/plot.py out.png x0 x1 y0 y1 t0 t1 states... : level geometry (POLYS=/tmp/polys.json from `node sim/dumppolys.js level polys.json`) + trajectories with frame labels.
- tools/shiftsplice.js : prefix of A + time-shifted tail of B.
- sim/mcbeam.js new options: fin=X,Y (frames-to-target heuristic; fvmin fvmax fvy fyw fjr hs), goalvx=V (stop when vx>V, e.g. 20 = s48 pad hit).
