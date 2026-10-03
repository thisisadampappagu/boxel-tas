// grid probe: shift dx,dy and set angle; hold right; report max vx within 6 frames
const fs=require('fs');const {makeGame}=require('./replay.js');const {cloneGame,Matter}=require('./sim2.js');const {Body}=Matter;
process.env.LEVEL='../levels/Campaign Level 39.json';
const d=JSON.parse(fs.readFileSync(process.argv[2]));const T=+process.argv[3];const g=makeGame();const byT=new Map(d.acts.map(a=>[a.t,a]));
for(let t=1;t<=T;t++){g.pending=byT.get(t)||null;g.stepNo=t;g.step();}
const vy0=+(process.argv[4]||-8.9);
for(let ang=0;ang<1.57;ang+=0.157){let row='ang '+ang.toFixed(2)+': ';
 for(let dy=0;dy>-10;dy-=1){let hits=[];for(let dx=-24;dx<=0;dx+=0.5){const c=cloneGame(g);const b=c.player.body;Body.setPosition(b,{x:b.position.x+dx,y:b.position.y-dy});Body.setAngle(b,ang);Body.setVelocity(b,{x:4,y:-vy0});c.player.controls.right=1;
  let mv=0;for(let k=1;k<=6;k++){c.pending=null;c.stepNo=T+k;c.step();if(c.dead)break;mv=Math.max(mv,c.player.body.velocity.x);}
  if(mv>6)hits.push((b.position.x).toFixed(1)+':'+mv.toFixed(1));}
 row+=' |dy'+dy+' '+hits.length+(hits.length?'['+hits[0]+'..'+hits[hits.length-1]+']':'');}
 console.log(row);}
