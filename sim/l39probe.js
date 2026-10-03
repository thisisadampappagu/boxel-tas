// l39probe.js ACTS T : at frame T, shift player x by offsets and vx, then hold right for 6 frames; report boost
const fs=require('fs');const {makeGame}=require('./replay.js');const {cloneGame,Matter}=require('./sim2.js');const {Body}=Matter;
process.env.LEVEL='../levels/Campaign Level 39.json';
const d=JSON.parse(fs.readFileSync(process.argv[2]));const T=+process.argv[3];const g=makeGame();const byT=new Map(d.acts.map(a=>[a.t,a]));
for(let t=1;t<=T;t++){g.pending=byT.get(t)||null;g.stepNo=t;g.step();}
const b0=g.player.body;console.log('base',b0.position.x.toFixed(2),(-b0.position.y).toFixed(2),b0.velocity.x.toFixed(2),(-b0.velocity.y).toFixed(2),'ang',(((b0.angle%(Math.PI/2))+Math.PI/2)%(Math.PI/2)).toFixed(2));
for(let dx=-30;dx<=10;dx+=0.5){const c=cloneGame(g);const b=c.player.body;Body.setPosition(b,{x:b.position.x+dx,y:b.position.y});Body.setVelocity(b,{x:4,y:b.velocity.y});c.player.controls.right=1;c.player.controls.left=0;
 let out='';for(let k=1;k<=6;k++){c.pending=null;c.stepNo=T+k;c.step();out+=` ${c.player.body.velocity.x.toFixed(1)},${(-c.player.body.velocity.y).toFixed(1)}`;if(c.dead){out+=' DEAD';break;}}
 console.log(dx.toFixed(1),(b0.position.x+dx).toFixed(1),out);}
