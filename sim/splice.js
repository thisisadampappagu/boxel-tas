// splice.js ours.json T_ours orig.json F out.json -> ours acts (t<=T) + orig acts (t>F) shifted by T-F; reports divergence vs orig
const fs=require('fs');const {replay}=require('./replay.js');
const [A,T,B,F,OUT]=process.argv.slice(2);const t0=+T,f0=+F,D=f0-t0;
const a=JSON.parse(fs.readFileSync(A)).acts.filter(x=>x.t<=t0);const b=JSON.parse(fs.readFileSync(B)).acts;
let h=0;for(const x of b){if(x.t>f0)break;if(x.h!==undefined)h=x.h;}
const out=[...a];const tail=b.filter(x=>x.t>f0).map(x=>({...x,t:x.t-D}));
if(!tail.length||tail[0].t!=t0+1)out.push({t:t0+1,h});else if(tail[0].h===undefined)tail[0].h=h;
out.push(...tail);
const S=JSON.parse(fs.readFileSync(process.argv[7]||'st_mcb3.json'));let div=null;
const r=replay(out,4200,(t,g)=>{if(t>t0&&div===null){const o=S[t+D-1];if(!o)return;const d=Math.hypot(g.player.body.position.x-o[0],-g.player.body.position.y-o[1]);if(d>10)div=t;}});
console.log('result',r.r,r.t,'diverge(>10px) at',div,'= orig frame',div&&div+D);
fs.writeFileSync(OUT,JSON.stringify({t:r.t,acts:out}));
