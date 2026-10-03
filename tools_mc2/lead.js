// node lead.js acts.json [every] -> prints t,x,y,vx,vy, nearest-ref-frame lead vs st_mc_3034
const fs=require('fs');const {replay}=require('../sim/replay.js');
const R=JSON.parse(fs.readFileSync(__dirname+'/../runs/st_mc_3034.json'));
const d=JSON.parse(fs.readFileSync(process.argv[2]));const ev=+(process.argv[3]||10);const T=d.t||d.finish||Math.max(...d.acts.map(a=>a.t));
const out=[];replay(d.acts,T,(t,g)=>{const b=g.player.body;out.push([t,b.position.x,-b.position.y,b.velocity.x,-b.velocity.y,g.player.mode,g.player.jumpReady]);});
for(const [t,x,y,vx,vy,m,jr] of out){ if(t%ev && t!=out[out.length-1][0]) continue; let bk=-1,bd=1e9; for(let k=Math.max(0,t-60);k<Math.min(R.length,t+400);k++){const dd=Math.hypot(R[k][0]-x,R[k][1]-y); if(dd<bd){bd=dd;bk=k+1;}}
 console.log(t,x.toFixed(1),y.toFixed(1),vx.toFixed(2),vy.toFixed(2),m,jr?1:0,'ref',bk,'d',bd.toFixed(1),'lead',bk-t);}
