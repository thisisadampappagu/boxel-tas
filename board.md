02:55 COORDINATOR (from Adam): ROTATION — segment agents switch areas every 30 minutes so several agents look at each area.
  Segments: S2 backtrack before Unhelpful pull (1880–2060) | S3 start (0–770) | S4 bounce launch (700–1250) | S5 middle (1250–1900) | S6 unhelpful pull+gravity (2060–2750) | S7 grapple entry (2700–2870) | S8 ending (2869–finish)
  Order: S2→S3→S4→S5→S6→S7→S8→S2. Rotation times (UTC): 03:25, 03:55, 04:25, 04:55, 05:25, 05:55, 06:25. At each time every mcN of mc2..mc8 moves to the NEXT segment after the one it is on.
    from 03:25: mc2=S3 mc3=S4 mc4=S5 mc5=S6 mc6=S7 mc7=S8 mc8=S2
    from 03:55: mc2=S4 mc3=S5 mc4=S6 mc5=S7 mc6=S8 mc7=S2 mc8=S3   (and so on, one step each time)
  HANDOFF at each rotation: before switching, post "HANDOFF <segment>: best partial <file in partials/>, lead L, recipe <exact args>, what failed". After switching, read the previous owner's HANDOFF and try something DIFFERENT from what they tried (new seed frame, different heuristic/params, new idea) — fresh eyes is the point.
  Let a search that is clearly ahead finish before switching (post that you're doing so). mc1 (analyst) and mc9/mc10 (integrators) keep their roles.
02:54 mc6: S6 running fol=1 st_mc_3034 fahead=250 fw=2 fth=30 K=500 seed mc_3034@2060 (1 core here, ~2s/frame) | no result yet | -
02:58 mc8: S8 running mcbeam seed mc_3034@2950 track tw=4 hs=20 K=800 wide angles (1 core, ~7s/f) | none yet | 3034 ending wastes frames at x10640-10690 (vx<0 loop t2995-3005) and cruises only 17px/f at y3840 t2930-2966 — targets
02:57 COORDINATOR (from Adam): TEAM CUT TO 4 — mc3, mc4, mc5, mc6, mc7, mc10 are stopped. The ROTATION plan above is CANCELLED. Remaining: mc1 (analyst), mc2, mc8, mc9.
  New split: mc2 = everything up to the 'Unhelpful pull' checkpoint (start, launch, middle, the backtrack at 1880–2060 — attack the biggest loss mc1 identifies first);
  mc8 = everything after it (unhelpful pull/gravity 2060–2750, grapple entry, ending); mc9 = integrator (carry any partial that's ahead to a full finish); mc1 = analyst, pick targets for mc2/mc8 and build tools.
  Every 30 min mc2 and mc8 swap halves (03:25, 03:55, …) with a HANDOFF line, so both look at both halves.
