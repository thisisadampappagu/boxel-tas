// from state at frame T of a run (rope released), grapple at angle a for d frames then G; report vx after d+2 frames
const {mk,cloneGame}=require('./bf.js');const fs=require('fs');
const acts=JSON.parse(fs.readFileSync(process.argv[2])).acts;const T=+process.argv[3];
const g=mk();const by=new Map(acts.map(a=>[a.t,a]));for(let t=1;t<T;t++){g.pending=by.get(t)||null;g.stepNo=t;g.step();}
g.pending={r:'G'};g.stepNo=T;g.step();
const b0=g.player.body;console.log('base',b0.position.x.toFixed(1),(-b0.position.y).toFixed(1),b0.velocity.x.toFixed(2),(-b0.velocity.y).toFixed(2));
const res=[];
for(let a=-90;a<=180;a+=5)for(const d of [1,2,3]){const c=cloneGame(g);let ok=null;
  for(let k=1;k<=d+3;k++){c.pending=k==1?{r:a}:(k==d+1?{r:'G'}:null);c.stepNo=T+k;c.step();if(k==1)ok=c.ropeOk;if(c.dead)break;}
  const b=c.player.body;if(!ok)continue;res.push([a,d,(b.velocity.x).toFixed(2),(-b.velocity.y).toFixed(2),(b.position.x-b0.position.x).toFixed(1),(-b.position.y).toFixed(1),ok.x.toFixed(0)+','+(-ok.y).toFixed(0),c.dead?'DEAD':'']);}
res.sort((p,q)=>q[2]-p[2]);for(const r of res.slice(0,25))console.log(r.join(' '));
// reference: no grapple
const c=cloneGame(g);for(let k=1;k<=6;k++){c.pending=null;c.stepNo=T+k;c.step();}console.log('none (6f)',c.player.body.velocity.x.toFixed(2),(c.player.body.position.x-b0.position.x).toFixed(1));
