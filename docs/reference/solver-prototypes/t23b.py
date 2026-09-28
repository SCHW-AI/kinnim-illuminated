from kinnim import *
import pickle, time
groups = {str(i):(i,i) for i in range(1,8)}
W = pickle.load(open('w23r1.pkl','rb'))
def project(W, keep):
    out={}
    for wk in W:
        w=mk(wk); w2={p:(w[p] if p in keep else Counter()) for p in w}
        out[world_key(w2)]=1
    return list(out)
def run(W, active, seq, mish, label):
    W = project(W, active)
    for s,d in seq:
        W = fly(W,s,d); W = project(W, active)
    print(label,'worlds',len(W))
    caps={p:min(sum(mk(wk)[p].values()) for wk in W) for p in active}
    t=time.time()
    best,A = max_side(W, groups, active, 'a', caps)
    print(' logic max above', best, round(time.time()-t,1),'s')
    print(' mishnah vector', mish, 'safe?', side_ok(W,groups,mish,'a'))
    return W
act2=['3','4','5','6','7']
seq2=[('3','4'),('4','5'),('5','6'),('6','7'),('7','6'),('6','5'),('5','4'),('4','3')]
W2=run(W, act2, seq2, {'3':0,'4':0,'5':1,'6':2,'7':5}, 'round2')
act3=['5','6','7']
seq3=[('5','6'),('6','7'),('7','6'),('6','5')]
W3=run(W2, act3, seq3, {'5':0,'6':0,'7':4}, 'round3')
print(' yesh omrim vector 7:5 safe?', side_ok(W3,groups,{'5':0,'6':0,'7':5},'a'))
