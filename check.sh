#!/bin/bash
# check.sh LEVELFILE ACTS.json [maxSteps] -> replays an action file in the sim and prints result (finish frame / dead / timeout)
cd "$(dirname "$0")/sim"
LEVEL="../levels/$1" node -e "
const fs=require('fs');const {buildFromReplay}=require('./tasconv.js');const {Game,runTAS}=require('./sim2.js');
const d=JSON.parse(fs.readFileSync('$2'));const tok=buildFromReplay(d.acts,${3:-4200});
const g=new Game(JSON.parse(fs.readFileSync(process.env.LEVEL)));const r=runTAS(g,tok,${3:-4200});console.log(r.r,r.steps)"
