const fs=require('fs');const {Game,runTAS}=require('./sim2.js');
const g=new Game(JSON.parse(fs.readFileSync(process.env.LEVEL)));const s=fs.readFileSync(process.argv[2],'utf8');const tok=JSON.parse(s.slice(s.indexOf('['),s.lastIndexOf(']')+1));
const tr=[];const o=g.step.bind(g);g.step=function(...a){const r=o(...a);const b=g.player.body;tr.push([b.position.x,b.position.y,b.velocity.x,b.velocity.y,g.player.mode]);return r;};
const r=runTAS(g,tok,+process.argv[4]||3000);console.log(r.r,r.steps);fs.writeFileSync(process.argv[3],JSON.stringify(tr));
