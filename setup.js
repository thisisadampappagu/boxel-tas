// setup.js — cross-platform version of setup.sh (works on Windows): unpacks maps/*.f32.gz
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const dir = path.join(__dirname, 'maps');
for (const f of fs.readdirSync(dir)) if (f.endsWith('.f32.gz')) {
  const out = path.join(dir, f.slice(0, -3));
  if (!fs.existsSync(out)) { fs.writeFileSync(out, zlib.gunzipSync(fs.readFileSync(path.join(dir, f)))); console.log('unpacked', f); }
}
console.log('maps ready');
