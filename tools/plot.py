import json,sys,matplotlib
matplotlib.use('Agg');import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
# plot.py out.png x0 x1 y0 y1 t0 t1 states1 [states2 ...]
out=sys.argv[1];x0,x1,y0,y1,t0,t1=map(float,sys.argv[2:8]);files=sys.argv[8:]
P=json.load(open(__import__('os').environ.get('POLYS','/tmp/polys.json')))
col={'cube':'#888','spike':'red','bounce':'lime','grapple':'magenta','direction':'orange','gravity':'cyan','checkpoint':'blue','control':'yellow','finish':'gold','reset':'black','tip':'none'}
fig,ax=plt.subplots(figsize=(12,12*(y1-y0)/(x1-x0) if (y1-y0)/(x1-x0)<2 else 24))
for p in P:
  c=col.get(p['cls'],'purple')
  if c=='none':continue
  ax.add_patch(Polygon(p['v'],closed=True,fc=c,ec='k' if p['sensor'] else c,alpha=0.35 if p['sensor'] else 0.7,lw=0.5))
cs=['b','r','g','m']
for fi,f in enumerate(files):
  s=json.load(open(f));T=range(int(t0),min(int(t1),len(s)))
  ax.plot([s[t][0] for t in T],[s[t][1] for t in T],'-',c=cs[fi],lw=1)
  for t in T:
    if t%20==0: ax.plot(s[t][0],s[t][1],'o',c=cs[fi],ms=2);ax.text(s[t][0],s[t][1],str(t),fontsize=6,c=cs[fi])
ax.set_xlim(x0,x1);ax.set_ylim(y0,y1);ax.set_aspect('equal');ax.grid(alpha=.3)
plt.savefig(out,dpi=110,bbox_inches='tight')
