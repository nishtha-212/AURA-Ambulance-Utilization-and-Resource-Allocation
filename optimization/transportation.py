"""
AURA Transportation Module: optimization/transportation.py
Models regional ambulance distribution across zones as a Transportation Problem.
Computes initial basic feasible solutions (Northwest Corner, VAM)
and optimal distributions with a clear tableau representation.
"""

from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
import pulp


def aggregate_zone_supply_and_demand(
    available_amb_df: pd.DataFrame,
    emergencies_df: pd.DataFrame,
    zones: List[str]
) -> Tuple[Dict[str, int], Dict[str, int]]:
    """
    Aggregates available ambulances (supply) and active calls (demand) by zone.
    """
    supply: Dict[str, int] = {z: 0 for z in zones}
    demand: Dict[str, int] = {z: 0 for z in zones}

    # Count available ambulances per base zone
    for z in available_amb_df["zone"]:
        if z in supply:
            supply[z] += 1

    # Count pending emergencies per zone
    for z in emergencies_df["zone"]:
        if z in demand:
            demand[z] += 1

    return supply, demand


def balance_transportation_problem(
    supply: Dict[str, int],
    demand: Dict[str, int],
    cost_matrix: pd.DataFrame
) -> Tuple[Dict[str, int], Dict[str, int], pd.DataFrame, bool, str]:
    """
    Checks if total supply equals total demand.
    Adds a Dummy Source or Dummy Destination if unbalanced.
    """
    total_supply = sum(supply.values())
    total_demand = sum(demand.values())
    balanced_cost = cost_matrix.copy()
    balanced_supply = dict(supply)
    balanced_demand = dict(demand)

    is_balanced = (total_supply == total_demand)
    dummy_note = "Problem is balanced."

    if total_supply < total_demand:
        shortage = total_demand - total_supply
        dummy_name = "Dummy Source"
        balanced_supply[dummy_name] = shortage
        # Dummy cost is 0 for unserved demand, or high penalty if modeling shortage
        dummy_row = pd.Series(0.0, index=balanced_cost.columns, name=dummy_name)
        balanced_cost = pd.concat([balanced_cost, pd.DataFrame([dummy_row])])
        dummy_note = f"Unbalanced (Demand > Supply). Added '{dummy_name}' with supply = {shortage} units."

    elif total_supply > total_demand:
        surplus = total_supply - total_demand
        dummy_name = "Dummy Destination"
        balanced_demand[dummy_name] = surplus
        dummy_col = pd.Series(0.0, index=balanced_cost.index, name=dummy_name)
        balanced_cost[dummy_name] = dummy_col
        dummy_note = f"Unbalanced (Supply > Demand). Added '{dummy_name}' with demand = {surplus} units."

    return balanced_supply, balanced_demand, balanced_cost, is_balanced, dummy_note


def solve_transportation_pulp(
    supply: Dict[str, int],
    demand: Dict[str, int],
    cost_matrix: pd.DataFrame
) -> Dict[str, Any]:
    """
    Solves the balanced Transportation Problem using Linear Programming (PuLP).
    Returns optimal allocations, total zone transit time, and formatted tableau.
    """
    sources = [s for s, val in supply.items() if val > 0]
    destinations = [d for d, val in demand.items() if val > 0]

    if not sources or not destinations:
        raise ValueError("Cannot solve: supply or demand is completely empty.")

    # Model definition
    model = pulp.LpProblem("AURA_Zone_Transportation", pulp.LpMinimize)

    # Decision variables: y[i, j] >= 0 integer
    y = pulp.LpVariable.dicts("flow", ((i, j) for i in sources for j in destinations), lowBound=0, cat=pulp.LpInteger)

    # Objective: Minimize total travel time across all zone flows
    model += pulp.lpSum(float(cost_matrix.loc[i, j]) * y[i, j] for i in sources for j in destinations)

    # Supply constraints
    for i in sources:
        model += pulp.lpSum(y[i, j] for j in destinations) == supply[i], f"Supply_Constraint_{i}"

    # Demand constraints
    for j in destinations:
        model += pulp.lpSum(y[i, j] for i in sources) == demand[j], f"Demand_Constraint_{j}"

    # Solve
    solver = pulp.PULP_CBC_CMD(msg=False)
    model.solve(solver)

    status_label = pulp.LpStatus[model.status]
    allocations: List[Dict[str, Any]] = []
    total_cost = 0.0

    tableau_df = pd.DataFrame(0, index=sources, columns=destinations)

    for i in sources:
        for j in destinations:
            flow_val = int(pulp.value(y[i, j]) or 0)
            tableau_df.loc[i, j] = flow_val
            if flow_val > 0:
                unit_cost = float(cost_matrix.loc[i, j])
                flow_cost = flow_val * unit_cost
                total_cost += flow_cost
                allocations.append({
                    "from_zone": i,
                    "to_zone": j,
                    "ambulances_transferred": flow_val,
                    "unit_travel_time": unit_cost,
                    "total_travel_time": flow_cost,
                    "is_dummy": ("Dummy" in i or "Dummy" in j)
                })

    return {
        "status": status_label,
        "total_cost": round(total_cost, 2),
        "allocations": allocations,
        "tableau": tableau_df
    }


def compute_northwest_corner(
    supply: Dict[str, int],
    demand: Dict[str, int],
    cost_matrix: pd.DataFrame
) -> Tuple[pd.DataFrame, float]:
    """
    Computes an Initial Basic Feasible Solution (IBFS) using the Northwest Corner Rule.
    Essential for viva demonstrations and step-by-step reporting.
    """
    sources = [s for s, val in supply.items() if val > 0]
    destinations = [d for d, val in demand.items() if val > 0]

    s_rem = {s: supply[s] for s in sources}
    d_rem = {d: demand[d] for d in destinations}

    alloc_df = pd.DataFrame(0, index=sources, columns=destinations)
    total_cost = 0.0

    i = 0
    j = 0
    while i < len(sources) and j < len(destinations):
        src = sources[i]
        dst = destinations[j]
        qty = min(s_rem[src], d_rem[dst])

        alloc_df.loc[src, dst] = qty
        total_cost += qty * float(cost_matrix.loc[src, dst])
        s_rem[src] -= qty
        d_rem[dst] -= qty

        if s_rem[src] == 0 and d_rem[dst] == 0:
            i += 1
            j += 1
        elif s_rem[src] == 0:
            i += 1
        else:
            j += 1

    return alloc_df, round(total_cost, 2)