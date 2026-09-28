import itertools
SP=('T','P')
def feasible(new, need_v, vsp, ho, hc, rule):
    newup=[s for s,u in new if u]; newdn=[s for s,u in new if not u]
    for vsel in itertools.combinations(range(len(newup)),need_v):
        if vsp and any(newup[i]!=vsp for i in vsel): continue
        free=[newup[i] for i in range(len(newup)) if i not in vsel]
        if rule=='chatas':
            if hc is not None:
                if ho==hc or hc in free: return True
                continue
            for s in SP:
                if s in newdn and (ho==s or s in free): return True
        else:
            if ho is not None and hc is not None:
                if ho==hc: return True
                continue
            if ho is not None:
                if ho in newdn: return True
                continue
            if hc is not None:
                if hc in free: return True
                continue
            for s in SP:
                if s in newdn and s in free: return True
    return False
def scen_ok(new, scen, rule):
    birds, sv, repl = scen
    b=[x for x in birds if x['role']!='Z']
    ups=[x for x in b if x['up']]; dns=[x for x in b if not x['up']]
    hc_opts=sorted({x['sp'] for x in dns if x['role'] in 'HU'}) or [None]
    for hc in hc_opts:            # adversarial: which below-bird counted as her chatas
        ok=False
        Hup=[x['sp'] for x in ups if x['role']=='H']
        for k in range(3):
            for vset in itertools.combinations(range(len(ups)),k):
                if any(ups[i]['role']=='H' for i in vset): continue
                if sv and any(ups[i]['sp']!=sv for i in vset): continue
                rest=[ups[i] for i in range(len(ups)) if i not in vset]
                if Hup: ho_opts=[Hup[0]]           # designated obligation olah is forced
                else: ho_opts=[None]+[x['sp'] for x in rest if x['role']=='U']
                for ho in ho_opts:
                    if feasible(new,2-k,repl or sv,ho,hc,rule): ok=True;break
                if ok:break
            if ok:break
        if not ok: return False
    return True
def min_cover(scens, rule='chatas', maxn=9):
    cands=[(s,u) for s in SP for u in (True,False)]
    for n in range(maxn+1):
        sols=[c for c in itertools.combinations_with_replacement(cands,n) if all(scen_ok(list(c),sc,rule) for sc in scens)]
        if sols: return n,[' '.join(f"{s}{'^' if u else 'v'}" for s,u in c) for c in sols[:3]]
def build2(kin_species, svs, repl_mode='free', counts=(2,), vks=(0,1), design='desig'):
    scens=[]
    for (x,y) in kin_species:
        base=[x,x,y,y]
        for vk in (vks if design=='desig' else (None,)):
            for sv in svs:
                for c in counts:
                    for ups in itertools.combinations(range(4),c):
                        birds=[]
                        for i,s in enumerate(base):
                            kein=0 if i<2 else 1
                            role=('V' if kein==vk else 'H') if design=='desig' else 'U'
                            if role=='V' and sv and s!=sv: role='Z'
                            birds.append(dict(sp=s,role=role,up=(i in ups)))
                        repl=None
                        if repl_mode=='asDesignated': repl= base[0] if vk==0 else base[2]
                        scens.append((birds,sv,repl))
    return scens
same=[('T','T')]; two=[('T','P')]; allk=[('T','T'),('P','P'),('T','P')]
tests=[
("A  lo peirsha one sp             [text 1]", build2(same,[None],design='pool')),
("A' lo peirsha two sp             [text 2]", build2(two,[None],design='pool')),
("B  peirsha one sp, vk known      [text 3]", build2(same,[None],vks=(0,))),
("B' peirsha two sp, vk known,free [text 4]", build2(two,[None],vks=(0,))),
("B' peirsha two sp, vk known,asDesig [4]  ", build2(two,[None],'asDesignated',vks=(0,))),
("B' peirsha two sp, vk unknown,free  [4]  ", build2(two,[None],vks=(0,1))),
("C  kavah one sp, desig           [text 5]", build2(same,['T','P'],vks=(0,))),
("C  kavah one sp, pool (no desig) [text 5]", build2(same,['T','P'],design='pool')),
("C' kavah two sp, desig known     [text 6]", build2(two,['T','P'],vks=(0,))),
("D  natnasam pool 0/2/4           [text 7]", build2(allk,['T','P'],counts=(0,2,4),design='pool')),
("D  natnasam desig 0/2/4          [text 7]", build2(allk,['T','P'],counts=(0,2,4),vks=(0,1))),
("D  natnasam pool any 0..4        [text 7]", build2(allk,['T','P'],counts=(0,1,2,3,4),design='pool')),
]
for n,sc in tests: print(n,'->',min_cover(sc))
for n,sc in tests[-3:]: print(n.replace('[text 7]','[BenAzzai 8]'),'->',min_cover(sc,rule='first'))
