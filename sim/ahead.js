const fs=require('fs');const T=require('./mcb_trk_full.json'),F=require('./mcb_trk_full_frames.json');
for(const f of process.argv.slice(2)){const L=fs.readFileSync(f,'utf8').trim().split('\n').filter(l=>l.startsWith('t='));const l=L[L.length-1];if(!l){console.log(f,'none');continue;}
const t=+l.match(/t=(\d+)/)[1];const m=l.match(/pos=\((-?\d+),(-?\d+)\)/);const x=+m[1],y=+m[2];let b=1e9,bk=0;for(let k=0;k<T.length;k++){const d=Math.hypot(x-T[k][0],y-T[k][1]);if(d<b){b=d;bk=k;}}
console.log(f,'t',t,'pos',x,y,'~orig frame',F[bk],'ahead',F[bk]-t,'(d',b.toFixed(0)+')',l.match(/mode=\w+/)[0]);}
