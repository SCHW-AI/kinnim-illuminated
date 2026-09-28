# Possible-worlds + adversarial safety model for Kinnim ch.1-2 (research check, not repo code)
from collections import Counter
from itertools import product
import sys

# bird types: ('S',g) stumah of group g ; 'FC' fixed chatas ; 'FO' fixed olah ; 'DEAD'
def world_key(w):  # w: dict pile->Counter
    return tuple(sorted((p, tuple(sorted(c.items()))) for p, c in w.items()))

def mk(w):
    return {p: Counter(dict(c)) for p, c in w}

def fly(worlds, src, dst):
    out = {}
    for wk in worlds:
        w = mk(wk)
        for t, n in list(w[src].items()):
            if n <= 0: continue
            w2 = {p: Counter(c) for p, c in w.items()}
            w2[src][t] -= 1
            if w2[src][t] == 0: del w2[src][t]
            w2[dst][t] += 1
            out[world_key(w2)] = 1
    return list(out)

def side_ok(worlds, groups, vec, side):
    # vec: dict pile->count offered on this side ; side 'a' (above) or 'b' (below)
    for wk in worlds:
        w = mk(wk)
        use = Counter()
        for p, c in w.items():
            k = vec.get(p, 0)
            if k == 0: continue
            for t, n in c.items():
                if t == 'DEAD': return False
                if t == 'FC' and side == 'a': return False
                if t == 'FO' and side == 'b': return False
                if t.startswith('S:'):
                    use[t[2:]] += min(n, k)
        for g, u in use.items():
            slots = groups[g][1] if side == 'a' else groups[g][0]  # (chatasSlots, olahSlots)
            if u > slots: return False
    return True

def max_side(worlds, groups, piles, side, caps):
    best = [-1, None]
    allsafe = []
    def dfs(i, vec):
        if i == len(piles):
            s = sum(vec.values())
            allsafe.append(dict(vec))
            if s > best[0]: best[0], best[1] = s, dict(vec)
            return
        p = piles[i]
        for k in range(0, caps[p] + 1):
            vec[p] = k
            if not side_ok(worlds, groups, vec, side):
                del vec[p]; break
            dfs(i + 1, vec)
            del vec[p]
    dfs(0, {})
    return best, allsafe

def solve(worlds, groups, piles):
    N = {p: max(sum(mk(wk)[p].values()) for wk in worlds) for p in piles}
    Nmin = {p: min(sum(mk(wk)[p].values()) for wk in worlds) for p in piles}
    ba, A = max_side(worlds, groups, piles, 'a', Nmin)
    bb, B = max_side(worlds, groups, piles, 'b', Nmin)
    # combine with coupling a_p+b_p<=Nmin_p
    best = (-1, None, None)
    Amax = [a for a in A if not any(all(a2[p] >= a[p] for p in piles) and a2 != a for a2 in A)]
    Bmax = [b for b in B if not any(all(b2[p] >= b[p] for p in piles) and b2 != b for b2 in B)]
    for a in Amax:
        for b in Bmax:
            bb2 = {p: min(b[p], Nmin[p] - a[p]) for p in piles}
            s = sum(a.values()) + sum(bb2.values())
            if s > best[0]: best = (s, a, bb2)
    return best

def init(piles_content):
    w = {p: Counter(c) for p, c in piles_content.items()}
    return [world_key(w)]
