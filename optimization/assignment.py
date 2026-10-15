"""
AURA Assignment Module: optimization/assignment.py
Formulates and solves the ambulance-to-emergency Assignment Problem
using PuLP (Binary Integer Programming) and cross-checks with
SciPy's Hungarian Method (linear_sum_assignment).
"""

from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
import pulp
from scipy.optimize import linear_sum_assignment


PENALTY_BIG_M = 10000.0


def solve_assignment_pulp(
    available_amb_df: pd.DataFrame,
    emergencies_df: pd.DataFrame,
    travel_time_matrix: pd.DataFrame,
    weighted: bool = True
) -> Dict[str, Any]:
    """
    Solves the Emergency Ambulance Assignment Problem via Binary Integer Programming.

    Mathematical Formulation:
      Decision Variable:
        x_ij in {0, 1} : 1 if available ambulance i serves emergency j, else 0
        u_j  in {0, 1} : 1 if emergency j is unserved (queued), else 0

      Objective Function:
        Min Z = sum_i sum_j (C_ij * x_ij) + sum_j (Penalty_j * u_j)
        where C_ij = w_j * t_ij (if weighted) or t_ij (if unweighted)
        and Penalty_j = PENALTY_BIG_M * (w_j if weighted else 1.0)

      Constraints:
        1. Each available ambulance assigned to at most one emergency:
           sum_j x_ij <= 1, for all i in Available_Ambulances
        2. Each emergency must be assigned or explicitly marked queued:
           sum_i x_ij + u_j == 1, for all j in Emergencies
        3. Binary restriction:
           x_ij, u_j in {0, 1}
    """
    amb_ids = available_amb_df["amb_id"].tolist()
    em_ids = emergencies_df["em_id"].tolist()

    if not amb_ids:
        raise ValueError("Cannot optimize: No available ambulances provided.")
    if not em_ids:
        raise ValueError("Cannot optimize: No active emergencies to assign.")

    # Metadata lookups
    weights: Dict[str, int] = dict(zip(emergencies_df["em_id"], emergencies_df["weight"]))
    priorities: Dict[str, str] = dict(zip(emergencies_df["em_id"], emergencies_df["priority"]))
    em_zones: Dict[str, str] = dict(zip(emergencies_df["em_id"], emergencies_df["zone"]))
    amb_zones: Dict[str, str] = dict(zip(available_amb_df["amb_id"], available_amb_df["zone"]))

    # PuLP Model
    model = pulp.LpProblem("AURA_Ambulance_Assignment", pulp.LpMinimize)

    # Decision variables
    x = pulp.LpVariable.dicts("assign", ((i, j) for i in amb_ids for j in em_ids), cat=pulp.LpBinary)
    u = pulp.LpVariable.dicts("unserved", em_ids, cat=pulp.LpBinary)

    # Cost coefficients
    def get_cost(i: str, j: str) -> float:
        t_ij = float(travel_time_matrix.loc[i, j])
        return (weights[j] * t_ij) if weighted else t_ij

    def get_penalty(j: str) -> float:
        return (PENALTY_BIG_M * weights[j]) if weighted else PENALTY_BIG_M

    # Objective
    model += (
        pulp.lpSum(get_cost(i, j) * x[i, j] for i in amb_ids for j in em_ids)
        + pulp.lpSum(get_penalty(j) * u[j] for j in em_ids)
    )

    # Constraint 1: Available ambulance fleet capacity
    for i in amb_ids:
        model += pulp.lpSum(x[i, j] for j in em_ids) <= 1, f"Ambulance_Capacity_{i}"

    # Constraint 2: Emergency demand fulfillment / queue tracking
    for j in em_ids:
        model += pulp.lpSum(x[i, j] for i in amb_ids) + u[j] == 1, f"Emergency_Demand_{j}"

    # Solve quietly using CBC
    solver = pulp.PULP_CBC_CMD(msg=False)
    status_code = model.solve(solver)
    status_label = pulp.LpStatus[status_code]

    if status_label != "Optimal":
        return {
            "status": status_label,
            "objective_value": 0.0,
            "assignments": [],
            "unserved": [],
            "cross_check_passed": False,
        }

    # Extract allocations
    assignments: List[Dict[str, Any]] = []
    total_travel_time = 0.0
    total_weighted_objective = 0.0

    for i in amb_ids:
        for j in em_ids:
            if pulp.value(x[i, j]) == 1:
                t_val = float(travel_time_matrix.loc[i, j])
                w_val = weights[j]
                wt_val = w_val * t_val
                total_travel_time += t_val
                total_weighted_objective += wt_val if weighted else t_val
                assignments.append({
                    "em_id": j,
                    "em_zone": em_zones[j],
                    "priority": priorities[j],
                    "weight": w_val,
                    "amb_id": i,
                    "amb_zone": amb_zones[i],
                    "travel_time": t_val,
                    "weighted_time": wt_val,
                })

    # Sort assignments by emergency ID
    assignments.sort(key=lambda item: item["em_id"])

    # Extract unserved calls
    unserved: List[Dict[str, Any]] = []
    for j in em_ids:
        if pulp.value(u[j]) == 1:
            unserved.append({
                "em_id": j,
                "zone": em_zones[j],
                "priority": priorities[j],
                "weight": weights[j],
                "reason": "Queued: Available fleet capacity fully exhausted",
            })

    # Cross-check with Hungarian Method
    hungarian_res = solve_assignment_hungarian(
        available_amb_df, emergencies_df, travel_time_matrix, weighted=weighted
    )

    diff = abs(total_weighted_objective - hungarian_res["objective_value"])
    cross_check_passed = bool(diff < 1e-4)

    return {
        "status": "Optimal",
        "objective_value": round(total_weighted_objective, 2),
        "total_travel_time": round(total_travel_time, 2),
        "hungarian_objective": round(hungarian_res["objective_value"], 2),
        "cross_check_passed": cross_check_passed,
        "assignments": assignments,
        "unserved": unserved,
    }


def solve_assignment_hungarian(
    available_amb_df: pd.DataFrame,
    emergencies_df: pd.DataFrame,
    travel_time_matrix: pd.DataFrame,
    weighted: bool = True
) -> Dict[str, Any]:
    """
    Cross-checks the assignment problem using the Kuhn-Munkres (Hungarian) algorithm.
    Pads the matrix with dummy rows or columns to construct a square matrix.
    """
    amb_ids = available_amb_df["amb_id"].tolist()
    em_ids = emergencies_df["em_id"].tolist()
    weights = emergencies_df["weight"].to_numpy()

    n_amb = len(amb_ids)
    n_em = len(em_ids)
    dim = max(n_amb, n_em)

    # Extract base cost matrix: rows = ambulances, cols = emergencies
    base_matrix = np.zeros((n_amb, n_em), dtype=float)
    for r_idx, i in enumerate(amb_ids):
        for c_idx, j in enumerate(em_ids):
            t_ij = float(travel_time_matrix.loc[i, j])
            base_matrix[r_idx, c_idx] = (t_ij * weights[c_idx]) if weighted else t_ij

    # Pad to square matrix with penalty rows/cols
    cost_matrix = np.full((dim, dim), PENALTY_BIG_M, dtype=float)
    cost_matrix[:n_amb, :n_em] = base_matrix

    # If more emergencies than ambulances, dummy rows represent leaving calls unserved
    if n_em > n_amb:
        for r in range(n_amb, dim):
            for c in range(n_em):
                cost_matrix[r, c] = PENALTY_BIG_M * (weights[c] if weighted else 1.0)

    # Solve via SciPy
    row_ind, col_ind = linear_sum_assignment(cost_matrix)

    matched_obj = 0.0
    for r, c in zip(row_ind, col_ind):
        if r < n_amb and c < n_em:
            matched_obj += base_matrix[r, c]

    return {"objective_value": round(matched_obj, 2)}