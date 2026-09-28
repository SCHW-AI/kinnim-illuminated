from kinnim import *
def S(g,n): return {'S:'+g:n}
def run(name, content, groups, flights=()):
    W = init(content)
    for s,d in flights: W = fly(W, s, d)
    piles = list(content)
    r = solve(W, groups, piles)
    print(name, 'worlds',len(W),'max safe',r[0],'above',r[1],'below',r[2])
# 1:2 chatas + chovah of k kinnim (one group)
for k in (1,2,5):
    run(f'1:2 FC+{k}kinnim', {'X':{'FC':1, 'S:R':2*k}}, {'R':(k,k)})
    run(f'1:2 FO x3+{k}kinnim', {'X':{'FO':3, 'S:R':2*k}}, {'R':(k,k)})
run('1:2 FC x100 + 5 kinnim', {'X':{'FC':100, 'S:R':10}}, {'R':(5,5)})
run('1:2 FC+chovah 2 groups(1,1)', {'X':{'FC':1, 'S:R':2, 'S:L':2}}, {'R':(1,1),'L':(1,1)})
run('1:2 FC+FO', {'X':{'FC':1,'FO':50}}, {})
# 1:3
for a,b in ((1,1),(2,2),(3,3),(1,2),(1,3),(1,10),(10,100),(2,3)):
    run(f'1:3 {a} vs {b}', {'X':{'S:R':2*a, 'S:L':2*b}}, {'R':(a,a),'L':(b,b)})
# 2:1 flies among kreivos: kein R (1) into L pile of 5 kinnim
run('2:1 R1 -> L5', {'A':S('R',2),'B':S('L',10)}, {'R':(1,1),'L':(5,5)}, [('A','B')])
run('2:1 R1 -> DEAD pile', {'A':S('R',2),'B':{'DEAD':4}}, {'R':(1,1)}, [('A','B')])
# 2:2
run('2:2 go', {'A':S('R',4),'B':S('L',4)}, {'R':(2,2),'L':(2,2)}, [('A','B')])
run('2:2 go+return', {'A':S('R',4),'B':S('L',4)}, {'R':(2,2),'L':(2,2)}, [('A','B'),('B','A')])
run('2:2 go+ret x2', {'A':S('R',4),'B':S('L',4)}, {'R':(2,2),'L':(2,2)}, [('A','B'),('B','A')]*2)
run('2:2 go+ret x3', {'A':S('R',4),'B':S('L',4)}, {'R':(2,2),'L':(2,2)}, [('A','B'),('B','A')]*3)
# 2:4 stumah + mefureshes (M birds already indistinguishable = FC+FO)
run('2:4 S->M', {'S':S('R',2),'M':{'FC':1,'FO':1}}, {'R':(1,1)}, [('S','M')])
run('2:4 S->M, M->S', {'S':S('R',2),'M':{'FC':1,'FO':1}}, {'R':(1,1)}, [('S','M'),('M','S')])
run('2:4 M->S first', {'S':S('R',2),'M':{'FC':1,'FO':1}}, {'R':(1,1)}, [('M','S')])
# 2:5
C={'C':{'FC':3},'O':{'FO':3},'M':S('R',2)}
run('2:5 mid->sides', C, {'R':(1,1)}, [('M','C'),('M','O')])
run('2:5 +return to mid', C, {'R':(1,1)}, [('M','C'),('M','O'),('C','M'),('O','M')])
run('2:5 +return to mid + out again', C, {'R':(1,1)}, [('M','C'),('M','O'),('C','M'),('O','M'),('M','C'),('M','O')])
run('2:5 both mid->chatas side', C, {'R':(1,1)}, [('M','C'),('M','C')])
run('2:5 Rambam alt: mid->C then C->O', C, {'R':(1,1)}, [('M','C'),('C','O')])
