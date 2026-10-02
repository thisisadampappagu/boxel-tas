const fs=require('fs');const {makeGame}=require('./replay.js');const {cloneGame}=require('./sim2.js');
const d=JSON.parse(fs.readFileSync(process.argv[2]));const T=+process.argv[3];const by=new Map(d.acts.map(a=>[a.t,a]));
const g=makeGame();for(let t=1;t<=T;t++){g.pending=by.get(t)||null;g.stepNo=t;g.step();}
const b0=g.player.body;console.log('base',b0.position.x.toFixed(0),(-b0.position.y).toFixed(0),b0.velocity.x.toFixed(2),(-b0.velocity.y).toFixed(2));
const res=[];for(let a=-90;a<=270;a+=5)for(const hold of [1,2,3]){const c=cloneGame(g);c.ropeOk=true;let ok=true;for(let k=1;k<=hold+3;k++){c.pending=k==1?{r:a}:(k==hold+1?{r:'G'}:null);c.stepNo=T+k;c.step();if(k==1&&!c.ropeOk)ok=false;if(c.dead){ok=false;break;}}
 if(ok){const b=c.player.body;res.push([a,hold,b.velocity.x.toFixed(2),(-b.velocity.y).toFixed(2),Math.hypot(b.velocity.x,b.velocity.y).toFixed(2)]);}}
res.sort((x,y)=>y[2]-x[2]);console.log(res.slice(0,10).map(r=>r.join(' ')).join('\n'));
