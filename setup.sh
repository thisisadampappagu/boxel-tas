#!/bin/bash
# one-time setup: unpack distance maps
cd "$(dirname "$0")"
for f in maps/*.f32.gz; do [ -f "${f%.gz}" ] || gunzip -k "$f"; done
echo "maps ready"
