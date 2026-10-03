import json,sys,matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
P=json.load(open(sys.argv[1]));st=json.load(open(sys.argv[2]));t0,t1=int(sys.argv[3]),int(sys.argv[4])
x0,x1,y0,y1=[float(v) for v in sys.argv[5].split(',')]
fig,ax=plt.subplots(figsize=(14,14*(y1-y0)/(x1-x0)))
col={'spike':'red','bounce':'green','direction':'cyan','checkpoint':'yellow','control':'orange','grapple':'purple','tip':'none'}
for p in P:
  xs=[v[0] for v in p['v']];ys=[v[1] for v in p['v']]
  if max(xs)<x0 or min(xs)>x1 or max(ys)<y0 or min(ys)>y1: continue
  c=col.get(p['cls'],'gray'); 
  if c=='none':continue
  ax.fill(xs,ys,color=c,alpha=0.3 if p['sensor'] else 0.7)
xs=[st[t][0] for t in range(t0,t1)];ys=[st[t][1] for t in range(t0,t1)]
ax.plot(xs,ys,'b.-',ms=3)
for t in range(t0,t1,10): ax.annotate(str(t),(st[t][0],st[t][1]),fontsize=7)
for extra in sys.argv[7:]:
  e=json.load(open(extra)); ax.plot([s[0] for s in e],[s[1] for s in e],'m.-',ms=2)
ax.set_xlim(x0,x1);ax.set_ylim(y0,y1);ax.set_aspect('equal');ax.grid(alpha=.3)
plt.savefig(sys.argv[6],dpi=80,bbox_inches='tight')
