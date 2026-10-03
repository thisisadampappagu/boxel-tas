#!/bin/bash
cd /home/claude/boxel-tas/sim
for O in 16.5 17.5 15.5 18.5 14.5 19.5 13.5; do
 R=$(LEVEL="../levels/Campaign Level 39.json" timeout 150 node --max-old-space-size=2800 mcbeam.js K=400 T=550 log=100 bx=1 bv=0.25 akey=10 cap=60 smargin=1 maps=../maps/s39c_p phase=2 aim=-824 aimoff=$O aimkw=0.3 xboost=6.8 fin=-184,1144 seed=../runs/l39e_673.json seedT=505 psave=1 out=../results/s2_$O.json 2>&1 | grep -E "BOOST")
 echo "O=$O $R"; done
