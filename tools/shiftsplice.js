// shiftsplice.js A.json TA B.json SHIFT out.json : acts of A for t<=TA, then B's acts with t' = t - SHIFT for t-SHIFT > TA
// also carries B's control state (h) at time TA+SHIFT
const fs=require('fs');const [A,TA,B,SH,OUT]=process.argv.slice(2);const ta=+TA,sh=+SH;
const a=JSON.parse(fs.readFileSync(A)).acts.filter(x=>x.t<=ta);const b=JSON.parse(fs.readFileSync(B)).acts;
// h state of A at ta and B at ta+sh
let hA=0,hB=0;for(const x of a) if(x.h!==undefined) hA=x.h;for(const x of b) if(x.t<=ta+sh&&x.h!==undefined) hB=x.h;
const out=[...a];const rest=b.filter(x=>x.t-sh>ta).map(x=>({...x,t:x.t-sh}));
if(hA!==hB){ if(rest.length&&rest[0].t==ta+1&&rest[0].h!==undefined); else rest.unshift({t:ta+1,h:hB}); }
out.push(...rest);fs.writeFileSync(OUT,JSON.stringify({acts:out}));console.log('acts',out.length,'hA',hA,'hB',hB);
