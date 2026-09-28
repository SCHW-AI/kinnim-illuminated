from kinnim import *
import time
groups = {str(i):(i,i) for i in range(1,8)}
content = {str(i):{'S:'+str(i):2*i} for i in range(1,8)}
W = init(content)
seq = [(str(i),str(i+1)) for i in range(1,7)] + [(str(i+1),str(i)) for i in range(6,0,-1)]
for s,d in seq: W = fly(W,s,d)
print('worlds', len(W))
piles = [str(i) for i in range(1,8)]
t=time.time()
best, A = max_side(W, groups, piles, 'a', {p:min(sum(mk(wk)[p].values()) for wk in W) for p in piles})
print('max above', best, 'nsafe', len(A), time.time()-t)
mish = {'1':0,'2':0,'3':1,'4':2,'5':3,'6':4,'7':6}
print('mishnah vector safe (above)?', side_ok(W, groups, mish, 'a'))
# per pile maximal individually given others per mishnah
for p in piles:
    v=dict(mish)
    while True:
        v[p]+=1
        if not side_ok(W,groups,v,'a'): v[p]-=1; break
    print(p, 'mishnah', mish[p], 'max holding others at mishnah', v[p])
import pickle; pickle.dump(W, open('w23r1.pkl','wb'))
