// tok2acts.js — convert a loadInputs([...]) token file into an acts file {t, acts:[{t,h,j}]}
// usage: node tok2acts.js tokens.txt out.json [offset]
const fs = require('fs'); const { simulateConsumer } = require('./tasconv.js');
const txt = fs.readFileSync(process.argv[2], 'utf8'); const tok = JSON.parse(txt.slice(txt.indexOf('['), txt.lastIndexOf(']') + 1));
const off = +(process.argv[4] || 0); const ev = simulateConsumer(tok, 100000);
const by = new Map(); for (const [s, c] of ev) { if (!by.has(s)) by.set(s, []); by.get(s).push(c); }
let L = 0, R = 0, ph = 0; const acts = []; const last = ev.length ? ev[ev.length - 1][0] : 0;
for (let s = 1; s <= last; s++) { const cs = by.get(s) || []; let j = 0, r;
  for (const c of cs) { if (c == 'a') L = 1; else if (c == 'A') L = 0; else if (c == 'd') R = 1; else if (c == 'D') R = 0; else if (c == 'j') j = 1; else if (c == 'G') r = 'G'; else if (c[0] == 'g') r = +c.slice(1); }
  const a = { t: s + off }; if (R - L !== ph) { a.h = R - L; ph = a.h; } if (j) a.j = 1; if (r !== undefined) a.r = r; if (Object.keys(a).length > 1) acts.push(a); }
fs.writeFileSync(process.argv[3], JSON.stringify({ t: last + off, acts })); console.log('acts', acts.length);
