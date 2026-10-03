#!/bin/bash
# leadacts.sh ACTS.json [step] [ref_states] [lines] : replay acts (Mountain Climb), print lead vs reference (default runs/st_mc_3034.json)
D="$(cd "$(dirname "$0")/.." && pwd)"; f=$(realpath "$1"); ref=$(realpath "${3:-$D/runs/st_mc_3034.json}"); out=/tmp/st_$(basename "$1")
T=$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(d.get('t') or d.get('finish') or 4200)" "$f")
cd "$D/sim"; export LEVEL="../levels/Mountain Climb.json"; node states.js "$f" $T "$out"
python3 ../tools/lead.py "$out" "$ref" "${2:-25}" | tail -${4:-8}
