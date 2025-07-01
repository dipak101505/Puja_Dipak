# solver.py

import heapq
from collections import deque

GOAL_STATE = (1,2,3,4,5,6,7,8,0)  # Represent the blank as 0

# Precompute goal positions for Manhattan heuristic
GOAL_POS = { val: (i // 3, i % 3) for i, val in enumerate(GOAL_STATE) }

def manhattan_distance(state):
    """
    Sum of Manhattan distances of each tile from its goal.
    state: a tuple of length 9 (0..8), where 0 is blank.
    """
    distance = 0
    for idx, tile in enumerate(state):
        if tile == 0:
            continue
        cur_r, cur_c = divmod(idx, 3)
        goal_r, goal_c = GOAL_POS[tile]
        distance += abs(cur_r - goal_r) + abs(cur_c - goal_c)
    return distance

def get_neighbors(state):
    """
    Given a state (tuple of length 9), return a list of (new_state, move) pairs.
    move is a string: 'Up', 'Down', 'Left', 'Right'.
    The move indicates which tile moves into the blank space.
    """
    neighbors = []
    zero_idx = state.index(0)
    r, c = divmod(zero_idx, 3)
    directions = []
    if r < 2: directions.append((1, 0, "Up"))    # Tile below moves up
    if r > 0: directions.append((-1, 0, "Down")) # Tile above moves down
    if c < 2: directions.append((0, 1, "Left"))  # Tile right moves left
    if c > 0: directions.append((0, -1, "Right")) # Tile left moves right

    for dr, dc, action in directions:
        new_r, new_c = r + dr, c + dc
        new_idx = new_r * 3 + new_c
        new_list = list(state)
        # swap blank (0) with tile at new position
        new_list[zero_idx], new_list[new_idx] = new_list[new_idx], new_list[zero_idx]
        neighbors.append((tuple(new_list), action))
    return neighbors

def astar(start_state):
    """
    A* search from start_state (tuple of length 9) to GOAL_STATE.
    Returns a list of moves (e.g., ['Up','Left',...]) if solvable; else None.
    """
    if start_state == GOAL_STATE:
        return []

    # Priority queue: (f_score, g_score, state, path_of_moves)
    open_set = []
    g_scores = { start_state: 0 }
    f_scores = { start_state: manhattan_distance(start_state) }
    heapq.heappush(open_set, (f_scores[start_state], start_state, []))

    visited = set()
    nodes_explored = 0

    while open_set:
        current_f, current_state, path = heapq.heappop(open_set)
        if current_state in visited:
            continue
        visited.add(current_state)
        nodes_explored += 1
        
        if nodes_explored % 1000 == 0:
            print(f"A*: Explored {nodes_explored} nodes, current path length: {len(path)}")

        if current_state == GOAL_STATE:
            print(f"A*: Found solution after exploring {nodes_explored} nodes")
            return path

        g_curr = g_scores[current_state]
        for neighbor_state, action in get_neighbors(current_state):
            if neighbor_state in visited:
                continue
            tentative_g = g_curr + 1
            if neighbor_state not in g_scores or tentative_g < g_scores[neighbor_state]:
                g_scores[neighbor_state] = tentative_g
                f_scores[neighbor_state] = tentative_g + manhattan_distance(neighbor_state)
                heapq.heappush(
                    open_set,
                    (f_scores[neighbor_state], neighbor_state, path + [action])
                )
    
    print(f"A*: No solution found after exploring {nodes_explored} nodes")
    return None  # unsolvable or ran out of memory/time

def bfs(start_state):
    """
    Breadth-first search (uninformed) – returns a list of moves or None.
    Primarily for demonstration/comparison. Not used as default solver.
    """
    if start_state == GOAL_STATE:
        return []
    queue = deque([(start_state, [])])
    visited = {start_state}

    while queue:
        state, path = queue.popleft()
        for neighbor_state, action in get_neighbors(state):
            if neighbor_state in visited:
                continue
            if neighbor_state == GOAL_STATE:
                return path + [action]
            visited.add(neighbor_state)
            queue.append((neighbor_state, path + [action]))
    return None

def dfs(start_state, depth_limit=50):
    """
    Depth-first search with a depth limit (default 50). Returns the first solution found (not guaranteed shortest).
    """
    visited = set()
    nodes_explored = 0

    def _dfs(state, path, depth):
        nonlocal nodes_explored
        nodes_explored += 1
        if nodes_explored % 1000 == 0:
            print(f"DFS: Explored {nodes_explored} nodes, current depth: {len(path)}")
        if state == GOAL_STATE:
            print(f"DFS: Found solution after exploring {nodes_explored} nodes")
            return path
        if depth == 0:
            return None
        visited.add(state)
        for neighbor_state, action in get_neighbors(state):
            if neighbor_state in visited:
                continue
            result = _dfs(neighbor_state, path + [action], depth - 1)
            if result is not None:
                return result
        return None

    result = _dfs(start_state, [], depth_limit)
    if result is None:
        print(f"DFS: No solution found after exploring {nodes_explored} nodes")
    return result
