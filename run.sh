#!/bin/bash
# run.sh NAME args... : background mcbeam on L39, log to logs/NAME.log, out results/NAME.json
cd "$(dirname "$0")/sim"; N=$1; shift
LEVEL="../levels/Campaign Level 39.json" nohup node --max-old-space-size=2800 mcbeam.js "$@" out=../results/$N.json > ../logs/$N.log 2>&1 &
echo started $N
