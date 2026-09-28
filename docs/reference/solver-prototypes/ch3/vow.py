import itertools
SP = ('T', 'P')

def credit_states(birds, sv):
    birds = [b for b in birds if b['role'] != 'Z']
    ups = [b for b in birds if b['up']]
    dns = [b for b in birds if not b['up']]
    iu = range(len(ups))
    seen = set()
    for k in range(0, 3):
        for vset in itertools.combinations(iu, k):
            if any(ups[i]['role'] == 'H' for i in vset): continue
            if sv and any(ups[i]['sp'] != sv for i in vset): continue
            rest = [i for i in iu if i not in vset]
            for ho in [None] + rest:
                if ho is not None and ups[ho]['role'] == 'V': continue
                for hc in [None] + list(range(len(dns))):
                    if hc is not None and dns[hc]['role'] == 'V': continue
                    st = (k, ups[ho]['sp'] if ho is not None else None,
                          dns[hc]['sp'] if hc is not None else None)
                    if st not in seen:
                        seen.add(st); yield st

def feasible(new, need_v, vsp, ho, hc, rule):
    newup = [s for s, u in new if u]
    newdn = [s for s, u in new if not u]
    for vsel in itertools.combinations(range(len(newup)), need_v):
        if vsp and any(newup[i] != vsp for i in vsel): continue
        free = [newup[i] for i in range(len(newup)) if i not in vsel]
        if rule == 'chatas':          # Chachamim: species follows the chatas
            if hc is not None and (ho == hc or hc in free): return True
            for s in SP:               # fresh chatas s (+ olah s unless old olah is s)
                if s in newdn and (ho == s or s in free): return True
        else:                          # Ben Azzai: follows the first offered (old before new)
            if ho is not None and hc is not None and ho == hc: return True
            if ho is not None and hc is None and ho in newdn: return True
            if hc is not None and ho is None and hc in free: return True
            if ho is None and hc is None:
                for s in SP:
                    if s in newdn and s in free: return True
    return False

def scen_ok(new, scen, rule):
    birds, sv, repl = scen
    for (vh, ho, hc) in credit_states(birds, sv):
        if feasible(new, 2 - vh, repl or sv, ho, hc, rule): return True
    return False

def min_cover(scens, rule='chatas', maxn=9):
    cands = [(s, u) for s in SP for u in (True, False)]
    for n in range(maxn + 1):
        sols = [c for c in itertools.combinations_with_replacement(cands, n)
                if all(scen_ok(list(c), sc, rule) for sc in scens)]
        if sols:
            return n, [' '.join(f"{s}{'^' if u else 'v'}" for s, u in c) for c in sols[:3]]

def build(kin_species, design, svs, repl_mode='free', counts=(2,)):
    scens = []
    for (x, y) in kin_species:
        base = [x, x, y, y]
        for vk in ([None] if design == 'pool' else [0, 1]):
            for sv in svs:
                for c in counts:
                    for ups in itertools.combinations(range(4), c):
                        birds = []
                        for i, s in enumerate(base):
                            kein = 0 if i < 2 else 1
                            role = 'U' if design == 'pool' else ('V' if kein == vk else 'H')
                            if role == 'V' and sv and s != sv: role = 'Z'
                            birds.append(dict(sp=s, role=role, up=(i in ups)))
                        repl = None
                        if repl_mode == 'asDesignated' and design == 'desig':
                            repl = base[0] if vk == 0 else base[2]
                        scens.append((birds, sv, repl))
    return scens

same = [('T', 'T')]; two = [('T', 'P')]
R = [
 ("A  lo peirsha, one species                ", build(same, 'pool', [None])),
 ("A' lo peirsha, two species                ", build(two, 'pool', [None])),
 ("B  peirsha, one species                   ", build(same, 'desig', [None])),
 ("B' peirsha, two species, vow repl free    ", build(two, 'desig', [None])),
 ("B' peirsha, two species, repl=as designated", build(two, 'desig', [None], 'asDesignated')),
 ("C  kav'ah (sp forgotten), one species     ", build(same, 'desig', ['T', 'P'])),
 ("C' kav'ah (sp forgotten), two species     ", build(two, 'desig', ['T', 'P'])),
]
allk = [('T', 'T'), ('P', 'P'), ('T', 'P')]
R += [
 ("D  natnasam: pool, vow sp unknown, kinnim unknown, 0/2/4 up", build(allk, 'pool', ['T', 'P'], counts=(0, 2, 4))),
 ("D  natnasam: vow kein designated, same              ", build(allk, 'desig', ['T', 'P'], counts=(0, 2, 4))),
 ("D  natnasam: pool, any placement 0..4 up           ", build(allk, 'pool', ['T', 'P'], counts=(0, 1, 2, 3, 4))),
]
for name, sc in R:
    print(name, '->', min_cover(sc))
print("D  Ben Azzai (pool)  ->", min_cover(build(allk, 'pool', ['T', 'P'], counts=(0, 2, 4)), rule='first'))
print("D  Ben Azzai (desig) ->", min_cover(build(allk, 'desig', ['T', 'P'], counts=(0, 2, 4)), rule='first'))
