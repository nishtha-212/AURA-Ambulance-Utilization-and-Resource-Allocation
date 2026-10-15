"""
AURA Routing Module: routing/shortest_path.py
Computes shortest routes using Dijkstra's algorithm on a weighted road network.
Handles disconnected/blocked networks gracefully and guarantees travel-time matrix consistency.
"""

from typing import Any, Dict, List, Optional
import networkx as nx
import pandas as pd
from utils.data_loader import DEFAULT_EDGES, get_default_road_graph


def build_road_network(edges: Optional[List[tuple]] = None) -> nx.Graph:
    """
    Constructs a weighted undirected NetworkX graph from a list of edges (u, v, weight).
    Defaults to the project guide's calibrated regional road network.
    """
    graph = nx.Graph()
    edge_list = edges if edges is not None else DEFAULT_EDGES
    for u, v, weight in edge_list:
        graph.add_edge(u, v, weight=float(weight))
    return graph


def find_shortest_route(
    start_zone: str,
    end_zone: str,
    graph: Optional[nx.Graph] = None
) -> Dict[str, Any]:
    """
    Executes Dijkstra's algorithm to compute the shortest path and travel time
    between two zones.

    Returns a clean dictionary with status, path list, and total minutes.
    Catches disconnected routes and unknown nodes without raising unhandled exceptions.
    """
    if graph is None:
        graph = get_default_road_graph()

    # Input validation
    if start_zone not in graph:
        return {
            "status": "Error",
            "path": [],
            "total_time": float("inf"),
            "message": f"Start zone '{start_zone}' not found in road network graph."
        }
    if end_zone not in graph:
        return {
            "status": "Error",
            "path": [],
            "total_time": float("inf"),
            "message": f"Destination zone '{end_zone}' not found in road network graph."
        }

    # Same zone check (immediate arrival)
    if start_zone == end_zone:
        return {
            "status": "Connected",
            "path": [start_zone],
            "total_time": 0.0,
            "message": "Ambulance is already stationed within the emergency zone."
        }

    try:
        path = nx.shortest_path(graph, source=start_zone, target=end_zone, weight="weight")
        total_time = nx.shortest_path_length(graph, source=start_zone, target=end_zone, weight="weight")

        # Extract corridor step durations
        step_breakdown = []
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            seg_time = graph[u][v]["weight"]
            step_breakdown.append(f"{u} ➔ {v} ({seg_time} mins)")

        return {
            "status": "Connected",
            "path": path,
            "total_time": round(float(total_time), 2),
            "step_breakdown": step_breakdown,
            "message": f"Shortest route found: {' ➔ '.join(path)} ({total_time} mins)"
        }

    except nx.NetworkXNoPath:
        return {
            "status": "Disconnected",
            "path": [],
            "total_time": float("inf"),
            "step_breakdown": [],
            "message": f"No traversable road corridor connects '{start_zone}' to '{end_zone}' (Route Blocked)."
        }


def compute_consistent_travel_matrix(
    graph: Optional[nx.Graph] = None,
    zones: Optional[List[str]] = None
) -> pd.DataFrame:
    """
    Computes all-pairs Dijkstra shortest travel times to ensure that the
    travel-time matrix fed into PuLP perfectly matches the routing graph.
    """
    if graph is None:
        graph = get_default_road_graph()

    node_list = zones if zones is not None else sorted(list(graph.nodes()))
    matrix = pd.DataFrame(index=node_list, columns=node_list, dtype=float)

    for u in node_list:
        for v in node_list:
            if u == v:
                matrix.loc[u, v] = 0.0
            elif nx.has_path(graph, u, v):
                matrix.loc[u, v] = float(nx.shortest_path_length(graph, u, v, weight="weight"))
            else:
                matrix.loc[u, v] = 999.0  # Big penalty for disconnected pairs

    return matrix