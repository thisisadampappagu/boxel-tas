#!/bin/bash
cd /home/claude/boxel-tas/sim
export LEVEL="../levels/Campaign Level 32.json"
A=-60,-50,-40,-30,-25,-15,-10,0,10,20,30,40,60,70,80,90,100,110,120,140,160,180,195,210
exec node --max-old-space-size=2800 mcbeam.js T=410 log=10 bx=2 bv=0.25 akey=15 cap=60 smargin=1 psave=25 maps=../maps/s32_p phase=0 angles=$A K=400 fol=1 st=../runs/st_l32.json folo=0 fw=3 fth=30 fahead=60 rwv=3 rwa=2 rww=10 hs=4 jrb=0 seed=../runs/m32_v3.json seedT=100 out=../results/l32b_v1.json
