#!/bin/bash
# usage: run.sh NAME args...
cd /home/claude/boxel-tas/sim
N=$1; shift
LEVEL="../levels/Mountain Climb.json" nohup node --max-old-space-size=2800 mcbeam.js "$@" out=../results/mc2/$N.json > ../results/mc2/$N.log 2>&1 &
