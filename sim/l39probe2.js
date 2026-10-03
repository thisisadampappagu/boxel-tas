const fs=require('fs');const {makeGame}=require('./replay.js');const {cloneGame,Matter}=require('./sim2.js');const {Body,Events}=Matter;
process.env.LEVEL='../levels/Campaign Level 39.json';
const d=JSON.parse(fs.readFileSync(process.argv[2]));const T=+process.argv[3];const g=makeGame();const byT=new Map(d.acts.map(a=>[a.t,a]));
for(let t=1;t<=T;t++){g.pending=byT.get(t)||null;g.stepNo=t;g.step();}
for(const dx of process.argv[4].split(',').map(Number)){const c=cloneGame(g);const b=c.player.body;Body.setPosition(b,{x:b.position.x+dx,y:b.position.y});Body.setVelocity(b,{x:4,y:b.velocity.y});c.player.controls.right=1;
 console.log('dx',dx);
 for(let k=1;k<=4;k++){c.pending=null;c.stepNo=T+k;c.step();const B=c.player.body;
  const act=[];for(const p of c.engine.pairs.list){if(!p.isActive)continue;const a=p.bodyA.parent,e=p.bodyB.parent;if(a.class=='player'||e.class=='player'){const o=a.class=='player'?p.bodyB:p.bodyA;act.push(o.parent.class+(o.isSensor?'S':'')+'@'+o.parent.position.x.toFixed(1)+','+(-o.parent.position.y).toFixed(1)+' bounds x '+o.bounds.min.x.toFixed(1)+'..'+o.bounds.max.x.toFixed(1)+' y '+(-o.bounds.max.y).toFixed(1)+'..'+(-o.bounds.min.y).toFixed(1));}}
  console.log(' ',k,B.position.x.toFixed(1),(-B.position.y).toFixed(1),'v',B.velocity.x.toFixed(2),(-B.velocity.y).toFixed(2),'pb x',B.bounds.min.x.toFixed(1),B.bounds.max.x.toFixed(1),'y',(-B.bounds.max.y).toFixed(1),act.join(' | '));}}
