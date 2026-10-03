#!/bin/bash
cd /home/claude/boxel-tas/sim
for C in "16.5 1" "17.5 1" "16.5 0.3" "15.5 1" "18 1"; do set -- $C
 R=$(LEVEL="../levels/Campaign Level 39.json" timeout 140 node --max-old-space-size=2800 mcbeam.js K=400 T=556 log=2 bx=1 bv=0.25 akey=10 cap=60 smargin=1 maps=../maps/s39c_p phase=2 aim=-824 aimoff=$1 aimkw=$2 aimvw=40 xboost=6.8 fin=-184,1144 seed=../runs/l39e_673.json seedT=505 psave=2 out=../results/s3_$1_$2.json 2>&1 | grep -E "BOOST|t=5[2-5][05] " | tr '\n' ' ' | cut -c1-600)
 echo "O=$1 kw=$2 $R"; done
