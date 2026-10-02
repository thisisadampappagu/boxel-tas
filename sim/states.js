// dump per-frame full state summary of an acts run
const fs=require('fs');const {replay}=require('./replay.js');
const d=JSON.parse(fs.readFileSync(process.argv[2]));const S=[];
const r=replay(d.acts,+process.argv[3]||4200,(t,g)=>{const P=g.player,b=P.body;S.push([b.position.x,-b.position.y,b.velocity.x,-b.velocity.y,((b.angle%(Math.PI/2))+Math.PI/2)%(Math.PI/2),b.angularVelocity,P.jumpReady?1:0,P.mode,g.world.gravity.x,g.world.gravity.y,P.rope.children.length]);});
console.log(r.r,r.t);fs.writeFileSync(process.argv[4],JSON.stringify(S));
