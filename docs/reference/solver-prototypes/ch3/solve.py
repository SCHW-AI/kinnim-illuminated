import itertools
from functools import lru_cache

# Model: "lots" of birds, each lot has a kind:
#   ('C', k)  k designated chataos     (valid iff below)
#   ('O', k)  k designated olos        (valid iff above)
#   ('S', p)  p unassigned pairs (2p birds, one owner-pool): valid = min(a,p)+min(2p-a,p)
# Kohen places A birds above, rest below. Unknown which birds are which (full bird-level mixture).
# Worst case = min over distributions (a_i above from lot i, sum a_i = A).
def lot_size(l): return l[1] if l[0] in 'CO' else 2*l[1]
def lot_valid(l,a):
    k,n=l; s=lot_size(l); b=s-a
    if k=='C': return b
    if k=='O': return a
    return min(a,n)+min(b,n)
def worst(lots,A):
    best=None; arg=None
    ranges=[range(0,lot_size(l)+1) for l in lots]
    for combo in itertools.product(*ranges):
        if sum(combo)!=A: continue
        v=sum(lot_valid(l,a) for l,a in zip(lots,combo))
        if best is None or v<best: best,arg=v,combo
    return best,arg
def safe_plan(lots):
    # nimlach: max (up,down) such that EVERY distribution is fully valid
    T=sum(lot_size(l) for l in lots); res=[]
    for up in range(T+1):
        for dn in range(T+1-up):
            ok=True
            ranges=[range(0,lot_size(l)+1) for l in lots]
            # distributions of up-birds and dn-birds among lots
            for ua in itertools.product(*ranges):
                if sum(ua)!=up: continue
                rem=[lot_size(l)-a for l,a in zip(lots,ua)]
                for da in itertools.product(*[range(0,r+1) for r in rem]):
                    if sum(da)!=dn: continue
                    for l,a,d in zip(lots,ua,da):
                        k,n=l
                        if k=='C' and a>0: ok=False
                        if k=='O' and d>0: ok=False
                        if k=='S' and (a>n or d>n): ok=False
                    if not ok: break
                if not ok: break
            if ok: res.append((up+dn,up,dn))
    return max(res)
def show(name,lots,A):
    T=sum(lot_size(l) for l in lots)
    w,arg=worst(lots,A)
    print(f"{name}: lots={lots} T={T} above={A} below={T-A} -> worst valid={w} (adversary a_i={arg})")

print("--- 3:1 equal pools, lo nimlach")
for n in (1,2,3):
    L=[('S',n),('S',n)]; T=4*n
    show(f"{n}+{n} all above",L,T); show(f"{n}+{n} all below",L,0); show(f"{n}+{n} half",L,T//2)
print("--- 3:2 unequal pools")
for m in (2,3,10,100):
    L=[('S',1),('S',m)] if m<=10 else [('S',10),('S',100)]
    T=sum(lot_size(l) for l in L)
    show(f"{L} all above",L,T); show(f"{L} half",L,T//2)
show("2+3 half",[('S',2),('S',3)],5)
show("1,2,3 three women half",[('S',1),('S',2),('S',3)],6)
show("1,2,4 three women half",[('S',1),('S',2),('S',4)],7)
print("--- nimlach safe plans (ch1 contrast)")
for L in ([('S',1),('S',1)],[('S',1),('S',2)],[('S',2),('S',3)],[('S',2),('S',2)]):
    print(L,"safe (total,up,down)=",safe_plan(L))
print("--- 3:3")
show("1C+1O all above",[('C',1),('O',1)],2); show("1C+1O half",[('C',1),('O',1)],1)
show("3C+3O half",[('C',3),('O',3)],3)
print("--- 3:4 (bird-level mixed) olahA, chatasB, sethumah pair, meforeshet (1C+1O)")
L=[('O',1),('C',1),('S',1),('O',1),('C',1)]
show("all above",L,6); show("all below",L,0); show("half",L,3)
print("--- 3:5 half/half readings (worst case)")
show("equal: 2C + 1 pair",[('C',2),('S',1)],2)
show("equal: 8C + 4 pairs (Riva ex.1)",[('C',8),('S',4)],8)
show("chova double: 2C + 2 pairs (R.Avraham)",[('C',2),('S',2)],3)
show("chova double: 4C + 4 pairs",[('C',4),('S',4)],6)
show("chatas double: 4C + 1 pair (R.Avraham)",[('C',4),('S',1)],3)
show("chatas double: 16C + 4 pairs (Riva ex.2)",[('C',16),('S',4)],12)
show("olah variant equal: 2O + 1 pair",[('O',2),('S',1)],2)
show("olah chova double 2O+2 pairs",[('O',2),('S',2)],3)
show("olah double 4O+1 pair",[('O',4),('S',1)],3)
print("safe plan 1C + 2 pairs (1:2 lechatchila)",safe_plan([('C',1),('S',2)]))
print("safe plan 2C + 1 pair",safe_plan([('C',2),('S',1)]))
