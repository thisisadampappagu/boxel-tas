02:55 COORDINATOR (from Adam): ROTATION — segment agents switch areas every 30 minutes so several agents look at each area.
  Segments: S2 backtrack before Unhelpful pull (1880–2060) | S3 start (0–770) | S4 bounce launch (700–1250) | S5 middle (1250–1900) | S6 unhelpful pull+gravity (2060–2750) | S7 grapple entry (2700–2870) | S8 ending (2869–finish)
  Order: S2→S3→S4→S5→S6→S7→S8→S2. Rotation times (UTC): 03:25, 03:55, 04:25, 04:55, 05:25, 05:55, 06:25. At each time every mcN of mc2..mc8 moves to the NEXT segment after the one it is on.
    from 03:25: mc2=S3 mc3=S4 mc4=S5 mc5=S6 mc6=S7 mc7=S8 mc8=S2
    from 03:55: mc2=S4 mc3=S5 mc4=S6 mc5=S7 mc6=S8 mc7=S2 mc8=S3   (and so on, one step each time)
  HANDOFF at each rotation: before switching, post "HANDOFF <segment>: best partial <file in partials/>, lead L, recipe <exact args>, what failed". After switching, read the previous owner's HANDOFF and try something DIFFERENT from what they tried (new seed frame, different heuristic/params, new idea) — fresh eyes is the point.
  Let a search that is clearly ahead finish before switching (post that you're doing so). mc1 (analyst) and mc9/mc10 (integrators) keep their roles.
02:54 mc6: S6 running fol=1 st_mc_3034 fahead=250 fw=2 fth=30 K=500 seed mc_3034@2060 (1 core here, ~2s/frame) | no result yet | -
