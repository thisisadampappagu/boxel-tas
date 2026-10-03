const fs=require('fs');const {buildFromReplay}=require('/home/claude/boxel-tas/sim/tasconv.js');const {Game,runTAS}=require('/home/claude/boxel-tas/sim/sim2.js');
const {makeGame}=require('/home/claude/boxel-tas/sim/replay.js');
const f=process.argv[2],N=+process.argv[3];
const d=JSON.parse(fs.readFileSync(f));
const g=makeGame();const byT=new Map(d.acts.map(a=>[a.t,a]));const P1=[];
const orig=g.afterUpdate[0];
for(let t=1;t<=N;t++){g.pending=byT.get(t)||null;g.stepNo=t;g.step();P1.push([g.player.body.position.x,g.player.body.position.y]);}
const tok=buildFromReplay(d.acts,N);
const g2=new Game(JSON.parse(fs.readFileSync(process.env.LEVEL)));const P2=[];
runTAS(g2,tok,N,(s,gg)=>P2.push([gg.player.body.position.x,gg.player.body.position.y]));
for(let i=0;i<N;i++){if(!P2[i]||Math.abs(P1[i][0]-P2[i][0])>1e-6||Math.abs(P1[i][1]-P2[i][1])>1e-6){console.log('diverge at',i+1,P1[i],P2[i]);break;}}
console.log('end',P1[N-1],P2[N-1]);
