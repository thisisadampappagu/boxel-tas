// tail beam: node tail.js T0 TF W STEP [acts]
// replay acts for frames < T0; free actions on frames T0..TF-1; success = finished by step TF.
const {mk,stepTo,cloneGame}=require('./bf.js');const fs=require('fs');
const [T0,TF,W,STEP]=process.argv.slice(2,6).map(Number);const file=process.argv[6]||'../runs/l32_397.json';
const acts=JSON.parse(fs.readFileSync(file)).acts;
const g=mk(); stepTo(g,acts.filter(a=>a.t<T0),T0-1);
const opts=[null,{r:'G'}]; for(let a=-180;a<180;a+=STEP) opts.push({r:a});
function anc(P){const n=P.rope.children.length;if(!n)return'';const j=P.rope.children[n-1],c=j.constraint,b=c.bodyB;return Math.round((b.position.x+c.pointB.x))+','+Math.round((b.position.y+c.pointB.y))+','+P.rope.children.map(q=>q.constraint.length.toFixed(1)).join('/');}
let beam=[{g,seq:[]}];const FX=3312;
for(let t=T0;t<=TF;t++){ const nb=[];const seen=new Set();
  for(const s of beam){ const hasRope=s.g.player.rope.children.length>0;
    for(const o of (t==TF?[null]:opts)){ if(o&&o.r==='G'&&!hasRope)continue; const c=cloneGame(s.g); c.pending=o?{t,...o}:null; c.stepNo=t;
      nb.push({s,o,c}); } }
  beam=[];
  for(const e of nb){ const c=e.c; c.step(); if(c.dead) continue; const b=c.player.body;
    if(c.finished){ console.log('FINISH at step',c.stepNo,JSON.stringify([...e.s.seq,e.o&&{t:c.stepNo,...e.o}])); process.exit(0);} 
    const rem=TF-c.stepNo; const est=b.position.x+8+b.velocity.x*rem; 
    const key=Math.round(b.position.x*2)+':'+Math.round(b.position.y*2)+':'+Math.round(b.velocity.x*4)+':'+Math.round(b.velocity.y*4)+':'+anc(c.player);
    if(seen.has(key))continue;seen.add(key);
    beam.push({g:c,seq:e.o?[...e.s.seq,{t:c.stepNo,...e.o}]:e.s.seq,est,x:b.position.x,vx:b.velocity.x,y:-b.position.y});}
  beam.sort((a,b)=>b.est-a.est); beam=beam.slice(0,W);
  const B=beam[0]; console.log('step',beam[0].g.stepNo,'n',nb.length,'best est',B.est.toFixed(1),'x',B.x.toFixed(1),'vx',B.vx.toFixed(2),'y',B.y.toFixed(1));
}
