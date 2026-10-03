// try single-action substitutions at frame F in shifted run, report finish
const {mk}=require('./bf.js');const fs=require('fs');
const base=JSON.parse(fs.readFileSync(process.argv[2])).acts;const F=+process.argv[3];
const cands=[null,{r:'G'}];for(let a=-180;a<180;a+=0.5)cands.push({r:a});
let best=null;
for(const c of cands){const acts=base.filter(a=>a.t!==F);if(c)acts.push({t:F,...c});const by=new Map(acts.map(a=>[a.t,a]));
 const g=mk();let r='to';for(let t=1;t<=400;t++){g.pending=by.get(t)||null;g.stepNo=t;g.step();if(g.finished){r=t;break;}if(g.dead){r='dead';break;}}
 if(typeof r=='number'&&(!best||r<best.r)){best={r,c};console.log('F',F,JSON.stringify(c),'finish',r);} }
