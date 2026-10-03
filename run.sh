#!/bin/bash
# usage: run.sh tag variant...
tag=$1; shift
cd /home/claude/boxel-tas/sim
LEVEL="../levels/Mountain Climb.json" node --max-old-space-size=2800 mcbeam.js T=2999 log=10 jrb=10 bx=2 bv=0.25 akey=15 cap=60 smargin=1 psave=25 maps=../maps/mcb3_p phase=4 vis=1 seed=../partials/entry139_2743.json seedT=2743 angles=-60,-50,-40,-30,-25,-15,-10,0,10,20,30,40,60,70,80,90,100,110,120,140,160,180,195,210 "$@" out=../results/e2_$tag.json > ../results/e2_$tag.log 2>&1
