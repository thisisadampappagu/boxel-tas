#!/bin/bash
# usage: run.sh tag "variant"
cd /home/claude/boxel-tas/sim
LEVEL="../levels/Campaign Level 32.json" node --max-old-space-size=2800 mcbeam.js T=397 log=10 jrb=10 bx=2 bv=0.25 akey=15 cap=60 smargin=1 psave=25 maps=../maps/s32_p phase=0 vis=1 visfrom=12 track=../tracks/trk32.json angles=-60,-50,-40,-30,-25,-15,-10,0,10,20,30,40,60,70,80,90,100,110,120,140,160,180,195,210 $2 out=../results/l32c_$1.json > ../results/l32c_$1.log 2>&1
