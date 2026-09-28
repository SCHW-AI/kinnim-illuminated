def chain_rounds(ks, starts):
    birds = {i: 2*k for i,k in enumerate(ks,1)}
    out=[]
    n=len(ks)
    for s in starts:
        path=list(range(s,n+1))
        hops=[(path[i],path[i+1]) for i in range(len(path)-1)]
        hops+= [(b,a) for a,b in reversed(hops)]
        for a,b in hops:
            birds[a]=max(0,birds[a]-1); birds[b]=max(0,birds[b]-1)
        out.append({i:birds[i]/2 for i in birds})
    return out
for r in chain_rounds([1,2,3,4,5,6,7],[1,3,5]): print(r)
