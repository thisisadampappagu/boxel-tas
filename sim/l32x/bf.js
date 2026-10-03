// brute force tail: replay 397 run to frame T0 (actions < T0 applied normally), then enumerate actions for frames T0..395
const fs=require('fs');const {Game,cloneGame}=require('../sim2.js');
const LV=JSON.parse(fs.readFileSync('../levels/Campaign Level 32.json'));
function apply(g,a){ if(!a)return; const P=g.player;
  if(a.h!==undefined){P.controls.left=a.h<0?-1:0;P.controls.right=a.h>0?1:0;}
  if(a.j) g.jump();
  if(a.r==='G') g.removeRope(); else if(a.r!==undefined&&a.r!==null){const ang=a.r*Math.PI/180; g.ropeOk=g.addRope({x:P.position.x+Math.cos(ang),y:P.position.y+Math.sin(ang)});}}
function mk(){const g=new Game(LV);g.virtualTips=true;g.tasStart();g.player.jumpReady=false;g.player.position={x:g.player.body.position.x,y:-g.player.body.position.y,z:0};
 g.afterUpdate=[gg=>{apply(gg,gg.pending)}];g.stepNo=0;return g;}
function stepTo(g,acts,T){const by=new Map(acts.map(a=>[a.t,a]));for(let t=g.stepNo+1;t<=T;t++){g.pending=by.get(t)||null;g.stepNo=t;g.step();if(g.finished||g.dead)return;} }
module.exports={mk,apply,stepTo,cloneGame};
