import json,math,sys
# usage: lead.py A_states REF_states [step]
A=json.load(open(sys.argv[1]));R=json.load(open(sys.argv[2]));step=int(sys.argv[3]) if len(sys.argv)>3 else 50
k=0;out=[]
for t,s in enumerate(A):
  lo=max(0,k-150);hi=min(len(R),k+400)
  best=min(range(lo,hi),key=lambda i:(R[i][0]-s[0])**2+(R[i][1]-s[1])**2)
  d=math.hypot(R[best][0]-s[0],R[best][1]-s[1]);k=best
  out.append((t,best,best-t,d))
for t,b,l,d in out[::step]: print(t,round(A[t][0]),round(A[t][1]),'ref',b,'lead',l,'dist',round(d))
