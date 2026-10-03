#!/bin/bash
# leadacts.sh ACTS.json [step] [ref_states] [lines] : replay acts (Mountain Climb), print lead vs reference (default runs/st_mc_3034.json)
cd "$(dirname "$0")/../sim"; f=$(realpath "$1"); out=/tmp/st_$(basename "$1")
LEVEL="../levels/Mountain Climb.json" node states.js "$f" 4200 "$out"
python3 ../tools/lead.py "$out" "${3:-../runs/st_mc_3034.json}" "${2:-25}" | tail -${4:-8}
