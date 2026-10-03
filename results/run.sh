#!/bin/bash
# usage: run.sh tag seedT hx jrb smargin K [hs]
cd /home/claude/boxel-tas/sim
tag=$1; hs=${7:-5}
LEVEL="../levels/Campaign Level 39.json" node --max-old-space-size=2800 mcbeam.js T=720 log=10 bx=2 bv=0.25 akey=15 cap=60 psave=25 maps=../maps/s39c_p phase=2 seed=../runs/l39_708.json seedT=$2 hx=$3 hs=$hs jrb=$4 K=$6 smargin=$5 out=../results/l39f_$tag.json > ../results/l39f_$tag.log 2>&1
