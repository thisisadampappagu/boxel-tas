#!/bin/bash
cd /home/claude/boxel-tas/sim
for S in 540 530; do for O in 12.5 13.5 14.5 15.5 16.5 11.5 17.5; do
 R=$(LEVEL="../levels/Campaign Level 39.json" timeout 200 node --max-old-space-size=2800 mcbeam.js K=300 T=592 log=100 bx=2 bv=0.25 akey=15 cap=40 smargin=1 maps=../maps/s39c_p phase=2 xprog=15 jrb=10 aim=-824,-720 aimoff=$O seed=../runs/l39_708.json seedT=$S out=../results/sw_${S}_$O.json 2>&1 | grep -E "BOOST|DONE")
 echo "S=$S O=$O $R"; done; done
