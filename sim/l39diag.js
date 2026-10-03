// l39diag.js ACTS from to : per-frame player state, actions, player contacts, nearby dynamic spikes
const fs=require('fs');const {makeGame}=require('./replay.js');
process.env.LEVEL=process.env.LEVEL||'../levels/Campaign Level 39.json';
const d=JSON.parse(fs.readFileSync(process.argv[2]));const A=+process.argv[3],B=+process.argv[4];
const g=makeGame();const byT=new Map(d.acts.map(a=>[a.t,a]));
const f=n=>n.toFixed(2);
let starts=[];
require('./sim2.js').Matter.Events.on(g.engine,'collisionStart',e=>{for(const p of e.pairs){const a=p.bodyA.parent,b=p.bodyB.parent;if(a.class=='player'||b.class=='player'){const o=a.class=='player'?p.bodyB:p.bodyA;starts.push(o.parent.class+'/'+o.class+'@'+f(o.parent.position.x)+','+f(-o.parent.position.y));}}});
for(let t=1;t<=B;t++){g.pending=byT.get(t)||null;g.stepNo=t;starts=[];const pb=g.player.body;const v0={x:pb.velocity.x,y:pb.velocity.y};g.step();
 if(t<A)continue;const P=g.player,b=P.body;
 const act=[];for(const p of g.engine.pairs.list){if(!p.isActive)continue;const a=p.bodyA.parent,c=p.bodyB.parent;if(a.class=='player'||c.class=='player'){const o=a.class=='player'?p.bodyB:p.bodyA;act.push(o.parent.class+(o.isSensor?'S':'')+'@'+f(o.parent.position.x)+','+f(-o.parent.position.y)+' n=('+f(p.collision.normal.x)+','+f(-p.collision.normal.y)+') d='+f(p.collision.depth));}}
 const sp=g.children.filter(c=>c.body&&c.body.class=='spike'&&!c.isStatic()).map(c=>c.body).filter(s=>Math.abs(s.position.x-b.position.x)<80).map(s=>'spk('+f(s.position.x)+','+f(-s.position.y)+' v='+f(s.velocity.x)+','+f(-s.velocity.y)+')');
 console.log(t,JSON.stringify(byT.get(t)||{}),'pos',f(b.position.x),f(-b.position.y),'v',f(b.velocity.x),f(-b.velocity.y),'ang',f(b.angle),'w',f(b.angularVelocity),'jr',P.jumpReady?1:0,g.dead?'DEAD':'',g.finished?'FIN':'','\n   start:',starts.join(' '),'\n   active:',act.join(' | '),'\n  ',sp.join(' '));
 if(g.finished||g.dead)break;}
