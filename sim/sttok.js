const fs=require('fs');const {Game,runTAS}=require('./sim2.js');
const g=new Game(JSON.parse(fs.readFileSync(process.env.LEVEL)));const s=fs.readFileSync(process.argv[2],'utf8');const tok=JSON.parse(s.slice(s.indexOf('['),s.lastIndexOf(']')+1));
const S=[];const o=g.step.bind(g);g.step=function(...a){const r=o(...a);const P=g.player,b=P.body;S.push([b.position.x,-b.position.y,b.velocity.x,-b.velocity.y,((b.angle%(Math.PI/2))+Math.PI/2)%(Math.PI/2),b.angularVelocity,P.jumpReady?1:0,P.mode,g.world.gravity.x,g.world.gravity.y,P.rope.children.length]);return r;};
const r=runTAS(g,tok,+process.argv[4]||3000);console.log(r.r,r.steps);fs.writeFileSync(process.argv[3],JSON.stringify(S));
