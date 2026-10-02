const fs=require('fs');const tr=JSON.parse(fs.readFileSync(process.argv[2])).map(p=>[p[0],-p[1]]);const out=[tr[0]];
for(const p of tr){let l=out[out.length-1];let d=Math.hypot(p[0]-l[0],p[1]-l[1]);while(d>=4){const t=4/d;const n=[l[0]+(p[0]-l[0])*t,l[1]+(p[1]-l[1])*t];out.push(n);l=n;d=Math.hypot(p[0]-l[0],p[1]-l[1]);}}
fs.writeFileSync(process.argv[3],JSON.stringify(out.map(p=>[+p[0].toFixed(1),+p[1].toFixed(1)])));console.log(out.length);
