const fs=require('fs');const {buildFromReplay}=require('/home/claude/boxel-tas/sim/tasconv.js');const {Game,runTAS}=require('/home/claude/boxel-tas/sim/sim2.js');
const {makeGame}=require('/home/claude/boxel-tas/sim/replay.js');
const d=JSON.parse(fs.readFileSync('../results/e3_v2.json'));const N=1233;
const g=makeGame();const byT=new Map(d.acts.map(a=>[a.t,a]));const S1={};
const snap=(g)=>{const P=g.player,b=P.body;return JSON.stringify({x:b.position.x,y:b.position.y,vx:b.velocity.x,vy:b.velocity.y,a:b.angle,w:b.angularVelocity,jr:P.jumpReady,m:P.mode,l:P.controls.left,r:P.controls.right,fx:P.force.x,fy:P.force.y,gx:g.world.gravity.x,gy:g.world.gravity.y,rope:P.rope.children.length})};
for(let t=1;t<=N;t++){g.pending=byT.get(t)||null;g.stepNo=t;g.step();S1[t]=snap(g);}
const tok=buildFromReplay(d.acts,N);
const g2=new Game(JSON.parse(fs.readFileSync(process.env.LEVEL)));
runTAS(g2,tok,N,(s,gg)=>{if(s>=1228&&s<=1232&&S1[s]!==snap(gg)){console.log(s,'\n',S1[s],'\n',snap(gg));}});
