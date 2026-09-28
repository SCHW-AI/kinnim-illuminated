from kinnim import *
def S(g,n): return {'S:'+g:n}
def run(name, content, groups, flights=()):
    W = init(content)
    for s,d in flights: W = fly(W, s, d)
    r = solve(W, groups, list(content))
    print(name, 'worlds',len(W),'max safe',r[0],'above',r[1],'below',r[2])
g={'R':(1,1),'L':(2,2)}
c={'A':S('R',2),'B':S('L',4)}
run('R1->L2 go', c, g, [('A','B')])
run('L2->R1 go', c, g, [('B','A')])
run('R1,L2 go+ret', c, g, [('A','B'),('B','A')])
run('R1,L2 go+ret x2', c, g, [('A','B'),('B','A')]*2)
g={'R':(3,3),'L':(3,3)}; c={'A':S('R',6),'B':S('L',6)}
for n in (1,2,3,4):
    run(f'3v3 go+ret x{n}', c, g, [('A','B'),('B','A')]*n)
g={'R':(2,2),'L':(3,3)}; c={'A':S('R',4),'B':S('L',6)}
for n in (1,2,3):
    run(f'2v3 go+ret x{n}', c, g, [('A','B'),('B','A')]*n)
# unbalanced chovah (Rambam: 2 chataos 1 olah owed) with FC
run('unbal chovah c=2,o=1 + FO', {'X':{'S:R':3,'FO':1}}, {'R':(2,1)})
run('unbal chovah c=2,o=1 + FC', {'X':{'S:R':3,'FC':1}}, {'R':(2,1)})
# R' Yose partnership: merged pool
run('RYose 1+2 merged', {'X':S('RL',6)}, {'RL':(3,3)})
