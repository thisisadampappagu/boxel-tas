// node mkres.js base.json T0 log.txt out.json  -> base acts t<T0 + FINISH seq from log
const fs=require('fs');const [base,T0,log,out]=process.argv.slice(2);
const d=JSON.parse(fs.readFileSync(base));const line=fs.readFileSync(log,'utf8').split('\n').find(l=>l.startsWith('FINISH'));
const seq=JSON.parse(line.slice(line.indexOf('['))).filter(Boolean);const step=+line.match(/step (\d+)/)[1];
d.acts=d.acts.filter(a=>a.t<+T0).concat(seq);d.t=step;fs.writeFileSync(out,JSON.stringify(d));console.log('wrote',out,step,d.acts.length);
