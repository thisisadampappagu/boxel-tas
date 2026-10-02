const { Game } = require('./sim2.js'); const fs = require('fs');
const g = new Game(JSON.parse(fs.readFileSync(process.argv[2]))); const out = [];
for (const b of g.world.bodies) { const e = b.object3D; if (!e || e === g.player) continue; if (e.isStaticOrigin === false) continue;
  for (let i = b.parts.length > 1 ? 1 : 0; i < b.parts.length; i++) { const p = b.parts[i]; out.push({ cls: b.class, sensor: !!p.isSensor, v: p.vertices.map(v => [v.x, -v.y]) }); } }
fs.writeFileSync(process.argv[3], JSON.stringify(out)); console.log(out.length, 'polys');
