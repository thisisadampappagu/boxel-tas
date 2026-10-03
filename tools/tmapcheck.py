import json,numpy as np,sys
pre=sys.argv[1];m=json.load(open(pre+'meta.json'));T=np.fromfile(pre+'.f32',np.float32).reshape(m['H'],m['W'])
s=json.load(open(sys.argv[2]));step=int(sys.argv[3]) if len(sys.argv)>3 else 50
def look(x,y):
  r=int((m['Y1']-y)/m['RES']);c=int((x-m['X0'])/m['RES']);best=-1
  for rad in range(0,4):
    for dr in range(-rad,rad+1):
      for dc in range(-rad,rad+1):
        if 0<=r+dr<m['H'] and 0<=c+dc<m['W']:
          v=T[r+dr,c+dc]
          if v>=0 and (best<0 or v<best): best=v
    if best>=0: return best
  return -1
for t in range(0,len(s),step):
  v=look(s[t][0],s[t][1]);print(t,round(s[t][0]),round(s[t][1]),'T',round(float(v)),'t+T',round(t+float(v)))
