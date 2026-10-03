const fs=require('fs');const {makeGame}=require('./replay.js');
process.env.LEVEL='../levels/Campaign Level 39.json';
const d=JSON.parse(fs.readFileSync(process.argv[2]));const g=makeGame();const byT=new Map(d.acts.map(a=>[a.t,a]));
const sp=g.children.filter(c=>c.body&&c.body.class=='spike'&&!c.isStatic()).map(c=>c.body).sort((a,b)=>a.position.x-b.position.x);
for(let t=1;t<=700;t++){g.pending=byT.get(t)||null;g.stepNo=t;g.step();
 if(t>=470&&t%2==0)console.log(t,sp.map(s=>Math.round(-s.position.y-s.parent?0:0)+''+(-s.position.y).toFixed(0)).join(' '), ' P',g.player.body.position.x.toFixed(0),(-g.player.body.position.y).toFixed(0));}
