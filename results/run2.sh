#!/bin/bash
cd /home/claude/boxel-tas/sim
LEVEL="../levels/Campaign Level 39.json" node --max-old-space-size=2800 mcbeam.js T=$7 log=10 bx=2 bv=0.25 akey=15 cap=60 psave=25 maps=../maps/s39c_p phase=2 seed=../results/$2 seedT=$3 hx=$4 hs=5 jrb=$5 K=$6 smargin=0.3 out=../results/l39f_$1.json > ../results/l39f_$1.log 2>&1
