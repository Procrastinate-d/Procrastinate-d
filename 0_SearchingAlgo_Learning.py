from time import sleep


# Basic DFS (no shortest path end)
g = {0:{1,3}, 1:{}, 2:{4}, 3:{1}, 4:{}} # if you eliminate 0:3 see what happens
n = len(g)
group = 0
components = {}
visited = [False, False, False, False, False]  # size n
groupList = {}

def findComponents():
    global group
    i = 0
    while (i<n):
        if not visited[i]:
            print("group", group)
            group+=1
            dfs(i)
        i+=1
    return [group, components, groupList]

def dfs(at):
    visited[at] = True
    components[at] = group
    if not bool(groupList.get(group)):
        groupList[group] = []
    groupList[group].append(at)
    for next in g[at]:
        if not visited[next]:
            dfs(next)
# print(findComponents())
# ----------------------------------------------------
# Basic BFS
g = {0:{7, 9, 11}, 1:{8, 10}, 2:{3, 12}, 3:{2, 4, 7}, 4:{3}, 5:{6}, 6:{5,7}, 7:{0, 3, 6, 11}, 8:{1,9,12}, 9:{0, 8, 10}, 10:{1, 9}, 11:{0, 7}, 12:{2, 8}}
# this one's two-way. Would one way should still work? (Remove 6:5 but keep 5:6)
# g = {0:{}, 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{}, 7:{}, 8:{}, 9:{}, 10:{}, 11:{}, 12:{}}
n = len(g)

def bfs(s, e):
    prev = solve(s)
    print(prev)
    return reconstructPath(s,e,prev)

def solve(s):
    q = []
    q.append(s)  # enqueue
    # visited = [False, False, False, False, False, False, False, False, False, False, False, False, False] # size n
    visited = [False] * n
    # https://stackoverflow.com/questions/10712002/create-an-empty-list-with-certain-size-in-python
    visited[s] = True # prevent 0 from being added
    # prev = [None, None, None, None, None, None, None, None, None, None, None, None, None] # size n
    prev = [None] * n
    while len(q) != 0: # list not empty
        # print(q)
        node = q.pop(0)  # dequeue
        neighbours = g.get(node)  # is this g[node]
        # Ex: s0 e3 [None, 8, 3, 7, 3, 6, 7, 0, 9, 0, 9, 0, 8]
        for next in neighbours:
            if not visited[next]:
                q.append(next)  # enqueue
                visited[next] = True
                prev[next] = node  # keeps track of previous node from start (0)
    return prev

def reconstructPath(s, e, prev):
    path = []
    at = e
    while at != None:
        path.append(at)
        at = prev[at]  # goes to previous of each number until None (0)
    path.reverse()

    if path[0] == s:  # if s & e connected, return path
        return path
    return []

# print(bfs(0, 5))
# ----------------------------------------------------
# Dijkstra (Eager - saves visited) and A*
# g = {0: [[1,4], [2,1]], 1: [[3,1]], 2:[[1,2], [3,5]], 3:[[4,3]], 4:[]}
"""
Ex expected pq
[0,0]
    [1,4]
    [2,1]*
        [1,3] (1+2)
        [3,6] (1+5)
        -----
        [3,4] (1+2+1) woah
            [4,7] (1+2+1+3)

Result: ([0, 3, 1, 4, 7], [None, 2, 0, 1, 3])
"""
# g = {0: [[3,5], [2,1]], 1: [[1,1]], 2:[[2,1], [3,1]], 3:[]}  # Testing eager
# g = {0: [[1,5], [2,1]], 1: [[2,2], [3, 3], [4, 20]], 2:[[1,3], [4,12]], 3:[[2,3], [4,2], [5,6]], 4:[[5,1]], 5:[]}  # Sample 2
# Expected dist = [0, 4, 1, 7, 9, 13], path [0,2,1,3,4,5]

# A* Test case from https://www.youtube.com/watch?v=h3Zi5NxjVXA
# Did not work lol
# A0 B1 C2 D3 E4 F5 G6 H7 I8 J9
# g = {0: [[5, 3], [1, 6]], 1: [[3, 2], [2, 3]], 2: [[3, 1], [4, 5]],
#      3: [[4, 8], [2, 1]], 4: [[9,5], [8,5]], 5: [[6,1], [7,7]],
#      6: [[5,1], [8,3]], 7: [[5,7], [8,2]], 8: [[4,5], [9, 3]], 9: [[4,5]]}
# h = [10,8,5,7,3,6,5,7,1,0]
# (0 to 9) this took 14 loops.

# Example here: https://www.youtube.com/watch?v=i0x5fj4PqP4
g = {0:[[1,1], [2,1], [3,1], [4,1], [5,1], [6,1]],
     1:[[2,1], [6,1]], 2:[[1,1], [3,1]], 3:[[2,1],[4,1]], 4:[[3,1], [5,1]],
     5:[[4,1], [6,1], [7,1], [8,1], [9,1]], 6:[[7,1], [6,1]],
     7:[[8,1],[12,1]],
     8:[[7,1], [11,1], [12,1]],
     9:[[8,1],[10,1]],
     10:[[11,1]],
     11:[[11,1],[12,1], [13,1]],
     12:[[11,1]],
     13:[]}
''''''
h = [4, 5, 5, 5, 4, 3, 4, 3, 2, 3, 2, 1, 2, 0]
# expected: [0, 5, 8, 11, 13]
# dijkstra 23 but A* 16 loops. (s = 0, e = 13)

# Infinite Loop check: it will remove itself from pq, but add the next negative going to infinity...
# Example from https://stackoverflow.com/questions/20123076/can-dijkstras-single-source-shortest-path-algorithm-detect-an-infinite-cycle-in
# g = {0:[[1,1]], 1:[[2, -2]], 2:[[3, -3]], 3:[[4,1], [1,4]], 4:[]}
# this should work if you remove the "visited" feature. (Set visitCheck false)
visitCheck = True

n = len(g)
s = 0
e = 4
t = None
# Ex: "lazy" always 6, but "eager" gives: 2, 5, 4, 6, 6


def dijkstra(g, n, s, e, Amode):
    vis = [False] * n
    prev = [None] * n
    dist = [float('inf')] * n
    dist[s] = 0
    pq = list()  # []
    pq.append([s, 0])

    loops = 0
    while len(pq) != 0:  # While queue is not empty...
        index, minVal, savedCopyVal = None, None, None
        for key, val in pq:  # Poll pq. Choose the one with minVal. (Supposed to be a heap but idk what that is lol)
            if minVal is None:  # (None first case)
                minVal = val
                index = key
                savedCopyVal = val + h[key]

            copyVal = val
            if Amode is True:
                copyVal += h[key]  # A* case: delete!!! heuristic
                # print('Choosing', key, copyVal, "vs", key, savedCopyVal)

            if savedCopyVal > copyVal:  # minVal > val
                # print("updating")
                savedCopyVal = copyVal
                minVal = val
                index = key
        print("\nPQ:", pq)
        print("Now:", index, minVal)
        pq.remove([index, minVal])  # Remove chosen from queue. I added this but I may be missing the point
        vis[index] = True
        if dist[index] < minVal:
            # print("Skip1")
            continue  # [Skips if this path to index is greater. (Already done before.) ] (ex: [1,4] and [3,6])
        print("Edges:", g[index])
        for edge in g[index]:  # Loop through each path. edge = [index, distance]
            if vis[edge[0]] and visitCheck:  # what is this for exactly
                # print("Skip2")
                continue  # [Skip any repeat of node]
            # print("E:", edge)
            loops += 1

            newDist = dist[index] + edge[1]  # The minimum total distance from start. (cost)

            if newDist < dist[edge[0]]:  # If it is a shorter path
                dist[edge[0]] = newDist  # ! Update dist
                prev[edge[0]] = index    # (For the shortest path chain)
                pq.append([edge[0], newDist])
        # Finished going through each edge
        # sleep(1)
        if e is not None and index == e:
            return dist, prev, loops
    return dist, prev, loops  # (Dead end nodes have inf.)

def findShortestPath(g, n, s, e, eager):
    var = None
    if eager is not None:
        var = e
    dist, prev, loops = dijkstra(g, n, s, var, False)
    print(dist, prev)
    print("Loops:", loops)
    path = list()
    if dist[e] == float('inf'):
        return path  # no path
    at = e                  # Start at last node
    while at is not None:
        path.append(at)
        at = prev[at]       # Go to previous node until None (0)
    path.reverse()
    return path


# how about a closed list?
def findShortestPathA(g, n, s, e):
    dist, prev, loops = dijkstra(g, n, s, e, True)
    # print(dist, prev)
    print("Loops:", loops)
    path = list()
    if dist[e] == float('inf'):
        return path  # no path
    at = e                  # Start at last node
    while at is not None:
        path.append(at)
        at = prev[at]       # Go to previous node until None (0)
    path.reverse()
    return path

# print(findShortestPath(g, n, s, e, t))
# print('\n\n\n\n\n\n')
print(findShortestPathA(g, n, s, e))


# Bellman Ford
# Example from https://www.youtube.com/watch?v=obWXjtg0L64
g = {0:[[1,10], [5,8]], 1:[[3,2]],
     2:[[1,1]], 3:[[2,-2]], 4:[[1,-4], [3,-1]], 5:[[4,1]]}
# some nodes going backwards may not be considered as the node has already been known
# case 2: long chain
A = 0
B = 1
C = 2
D = 3
E = 4
g = {E:[[A,10]], D:[[E,10]], C:[[D,10]], B:[[C,10]], A:[[B,10], [C, 30]]}
# Behaves like this https://www.youtube.com/watch?v=cB2YP6vyqWY
# the moment you add A: [C,30], see the best previous of C being updated.
# case 3: somewhat complete graph (no infinities) where each path leads to a better distance
# g = {E: [],  # add as much as you want, it won't matter when s = 0.
#      D: [[E, 1]],
#      C: [[E, 3], [D, 1]],
#      B: [[E, 4], [D, 3], [C, 1]],
#      A: [[E, 5], [D, 4], [C, 3], [B, 1]]}
"""so the Order is:
0 [4,5] -> 0 [1,1]
iteration 2
1 [1,1]

"""
# g = {E: [],  # same?
#      D: [[E, 1]],
#      C: [[D, 1], [E, 3]],
#      B: [[D, 3], [C, 1], [E, 4]],
#      A: [[B, 1], [C, 3], [D, 4], [E, 5]]
#      }

"""Copy into https://csacademy.com/app/graph_editor/
0
1
2
3
4
3 4 1
2 4 3
2 3 1
1 4 4
1 3 3
1 2 1
0 4 5
0 3 4
0 2 3
0 1 1

Worst case is literally a straight line.

"""
# Done by 1 iteration
# g = {A: [[B, 1], [C, 3], [D, 4], [E, 5]],
#      B: [[D, 3], [C, 1], [E, 4]],
#      C: [[D, 1], [E, 3]],
#      D: [[E, 1]],
#      E: []
#      }

n = len(g)
s = 0
e = 4

def bf(g, n, s):
    prev = [None] * n
    dist = [float('inf')] * n
    dist[s] = 0
    # pq = list()  # []
    # pq.append([s, 0])

    # vertices = nodes
    i = 0
    # WHY V-1? because the path assumes you don't reuse a vertex/node.
    # Like how there are four spaces between your fingers,
    # there are four lines between five nodes.
    # If a (negative) path from 3rd to 1st exist, you would loop that to get an infinitely short distance.

    # How is the shortest path guaranteed?
    # A "worst" case is a straight line but you do the nodes in reverse order.
    # So each edge is guaranteed to be considered at least once.
    # Even worse is probably a "complete graph"

    last = 1  # let it start at 1 instead of 0
    while (i < n-1):
        print("\n\nIteration", i+1)
        for index in g.keys():
            print("Index", index)
            for edge in g[index]:  # for each edge in the graph
                if (dist[index] + edge[1] < dist[edge[0]]):  # from + cost to
                    dist[edge[0]] = dist[index] + edge[1]
                    prev[edge[0]] = index
                    last = i+1
                print(edge, dist, prev)
        i += 1
    # repeat for nodes in negative cycle
    # the above assumes we have found the shortest path. if it still updates,
    # then a negative cycle exists, which would have an infinitely "short" (small) path by looping.
    # do we really need to do it V-1 times though?
    # probably in the "worst case" where you don't find the edges in the optimal order, like backwards
    # https://www.youtube.com/watch?v=lyw4FaxrwHg
    # https://www.youtube.com/watch?v=SLABJ81T0fk but this says no
    i = 0
    while (i < n - 1):
        for index in g.keys():
            for edge in g[index]:
                # dist[u] + g[u][v] < dist[v]
                if (dist[index] + edge[1] < dist[edge[0]]):
                    dist[edge[0]] = -float('inf')  # ! Update dist
                    prev[edge[0]] = index  # (For the shortest path chain)
        i += 1

    return dist, prev, last

def findShortestPathBF(g, n, s, e):
    dist, prev, last_iteration = bf(g, n, s)
    print('result', dist, prev)
    print('iterations:', last_iteration)
    # print("Loops:", loops)
    path = list()
    if dist[e] == float('inf'):
        return path  # no path
    at = e                  # Start at last node
    while at is not None:
        path.append(at)
        at = prev[at]       # Go to previous node until None (0)
    path.reverse()
    return path

# print(findShortestPathBF(g,n,s,e))