"""
AURA Main Application: main.py
FastAPI server exposing REST API endpoints for ambulance dispatch,
operations research optimization, Dijkstra routing, and KPI benchmarking.
"""
import pandas as pd
import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from utils.data_loader import (
    ZONES,
    load_and_validate_data,
    filter_available_ambulances,
    get_prototype_ambulances,
    get_prototype_emergencies,
    get_prototype_travel_matrix,
    save_prototype_csv_files,
    get_default_road_graph
)
from optimization.assignment import solve_assignment_pulp
from optimization.transportation import (
    aggregate_zone_supply_and_demand,
    balance_transportation_problem,
    solve_transportation_pulp
)
from routing.shortest_path import find_shortest_route, compute_consistent_travel_matrix
from utils.kpis import solve_baseline_greedy, compute_performance_kpis
from networkx import dijkstra_path, dijkstra_path_length


# ---------------------------------------------------------------------------
# FastAPI Initialization & CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AURA - Ambulance Utilization & Routing Assistant",
    description="Operations Research Emergency Dispatch and Routing Optimization API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# In-Memory Operational State (Initialized from Prototype Data)
# ---------------------------------------------------------------------------
fleet_df = get_prototype_ambulances()
calls_df = get_prototype_emergencies()
travel_matrix_df = get_prototype_travel_matrix()
road_graph = get_default_road_graph()


# ---------------------------------------------------------------------------
# Pydantic Schemas for Validation
# ---------------------------------------------------------------------------
class AmbulanceCreate(BaseModel):
    amb_id: str = Field(..., example="A6")
    zone: str = Field(..., example="Zone B")
    type: str = Field("BLS", example="BLS")
    status: str = Field("Available", example="Available")

class AmbulanceStatusUpdate(BaseModel):
    status: str = Field(..., example="Busy")

class EmergencyCreate(BaseModel):
    em_id: str = Field(..., example="E6")
    zone: str = Field(..., example="Zone C")
    priority: str = Field("High", example="High")
    weight: Optional[int] = Field(None, example=3)

class EmergencyStatusUpdate(BaseModel):
    status: str = Field(..., example="Completed")

class OptimizeRequest(BaseModel):
    weighted: bool = Field(True, description="True for priority-weighted min time, False for unweighted")

class RouteRequest(BaseModel):
    start_zone: str = Field(..., example="Zone A")
    end_zone: str = Field(..., example="Zone E")


# ---------------------------------------------------------------------------
# Core REST Endpoints (React / Google AI Studio Contract)
# ---------------------------------------------------------------------------

@app.get("/ambulances")
def list_ambulances() -> List[Dict[str, Any]]:
    """Returns the full fleet of ambulances."""
    return fleet_df.to_dict(orient="records")


@app.post("/ambulances")
def add_ambulance(payload: AmbulanceCreate) -> Dict[str, Any]:
    """Adds a new ambulance to the operational fleet."""
    global fleet_df
    if payload.amb_id in fleet_df["amb_id"].values:
        raise HTTPException(status_code=400, detail=f"Ambulance '{payload.amb_id}' already exists.")
    new_row = payload.model_dump()
    fleet_df = pd.concat([fleet_df, pd.DataFrame([new_row])], ignore_index=True)
    return {"message": "Ambulance added successfully", "ambulance": new_row}


@app.patch("/ambulances/{amb_id}/status")
def update_ambulance_status(amb_id: str, payload: AmbulanceStatusUpdate) -> Dict[str, Any]:
    """Updates the availability status of an ambulance ('Available' or 'Busy')."""
    global fleet_df
    idx = fleet_df.index[fleet_df["amb_id"] == amb_id].tolist()
    if not idx:
        raise HTTPException(status_code=404, detail=f"Ambulance '{amb_id}' not found.")
    fleet_df.at[idx[0], "status"] = payload.status
    return {"message": f"Ambulance {amb_id} status updated to {payload.status}"}


@app.get("/emergencies")
def list_emergencies() -> List[Dict[str, Any]]:
    """Returns all pending emergency calls."""
    return calls_df.to_dict(orient="records")


@app.post("/emergencies")
def add_emergency(payload: EmergencyCreate) -> Dict[str, Any]:
    """Injects a new emergency call into the pending queue."""
    global calls_df
    if payload.em_id in calls_df["em_id"].values:
        raise HTTPException(status_code=400, detail=f"Emergency '{payload.em_id}' already exists.")

    weight_map = {"Critical": 5, "High": 3, "Medium": 2, "Low": 1}
    assigned_weight = payload.weight or weight_map.get(payload.priority, 1)

    new_row = {
        "em_id": payload.em_id,
        "zone": payload.zone,
        "priority": payload.priority,
        "weight": assigned_weight,
        "status": "Pending"
    }
    calls_df = pd.concat([calls_df, pd.DataFrame([new_row])], ignore_index=True)
    return {"message": "Emergency logged successfully", "emergency": new_row}


@app.patch("/emergencies/{em_id}/status")
def update_emergency_status(em_id: str, payload: EmergencyStatusUpdate) -> Dict[str, Any]:
    """Updates the status of an emergency ('Pending', 'Dispatched', 'Completed')."""
    global calls_df
    idx = calls_df.index[calls_df["em_id"] == em_id].tolist()
    if not idx:
        raise HTTPException(status_code=404, detail=f"Emergency '{em_id}' not found.")
    calls_df.at[idx[0], "status"] = payload.status
    return {"message": f"Emergency {em_id} status updated to {payload.status}", "emergency": calls_df.iloc[idx[0]].to_dict()}


@app.post("/optimize")
def run_optimization(payload: OptimizeRequest = OptimizeRequest(weighted=True)) -> Dict[str, Any]:
    """
    Executes the PuLP Assignment Optimization and cross-checks with Hungarian Method.
    Filters out Busy units automatically.
    """
    global fleet_df, calls_df, travel_matrix_df, road_graph

    try:
        available_units = filter_available_ambulances(fleet_df)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    active_calls = calls_df[calls_df["status"] != "Completed"].copy() if "status" in calls_df.columns else calls_df.copy()
    if active_calls.empty:
        raise HTTPException(status_code=400, detail="No active emergencies to assign.")

    # Ensure travel matrix covers all current ambulances and emergencies
    current_matrix = compute_consistent_matrix_for_active_state(available_units, active_calls)

    res = solve_assignment_pulp(
        available_amb_df=available_units,
        emergencies_df=active_calls,
        travel_time_matrix=current_matrix,
        weighted=payload.weighted
    )
    return res


@app.post("/route")
def get_shortest_route(payload: RouteRequest) -> Dict[str, Any]:
    """Computes the Dijkstra shortest path and travel time between two zones."""
    return find_shortest_route(payload.start_zone, payload.end_zone, graph=road_graph)


@app.get("/analytics")
def get_analytics() -> Dict[str, Any]:
    """Returns comparative KPIs comparing Baseline (Greedy) with PuLP Optimization."""
    global fleet_df, calls_df
    try:
        available_units = filter_available_ambulances(fleet_df)
    except ValueError:
        return {"error": "No available ambulances to benchmark."}

    active_calls = calls_df[calls_df["status"] != "Completed"].copy() if "status" in calls_df.columns else calls_df.copy()
    if active_calls.empty:
        return {"error": "No active emergencies logged to benchmark."}

    current_matrix = compute_consistent_matrix_for_active_state(available_units, active_calls)

    base_res = solve_baseline_greedy(available_units, active_calls, current_matrix)
    opt_res = solve_assignment_pulp(available_units, active_calls, current_matrix, weighted=True)

    return compute_performance_kpis(base_res, opt_res, total_available_fleet=len(available_units))


@app.post("/reset")
def reset_to_prototype() -> Dict[str, Any]:
    """Resets the fleet and emergency queue to the default prototype dataset."""
    global fleet_df, calls_df, travel_matrix_df
    fleet_df = get_prototype_ambulances()
    calls_df = get_prototype_emergencies()
    travel_matrix_df = get_prototype_travel_matrix()
    return {"message": "Operational data reset to standard prototype successfully."}


# ---------------------------------------------------------------------------
# Endpoints for Single-Page Console Compatibility
# ---------------------------------------------------------------------------

@app.get("/api/state")
def get_full_state() -> Dict[str, Any]:
    """Aggregated state endpoint for single-page dashboard rendering."""
    avail_count = int((fleet_df["status"] == "Available").sum())
    busy_count = int((fleet_df["status"] == "Busy").sum())
    crit_count = int((calls_df["priority"] == "Critical").sum())

    return {
        "stats": {
            "total_ambulances": len(fleet_df),
            "available_ambulances": avail_count,
            "busy_ambulances": busy_count,
            "total_emergencies": len(calls_df),
            "critical_emergencies": crit_count
        },
        "ambulances": fleet_df.to_dict(orient="records"),
        "emergencies": calls_df.to_dict(orient="records"),
        "zones": ZONES
    }


@app.post("/api/ambulance/{amb_id}/toggle")
def toggle_ambulance(amb_id: str) -> Dict[str, Any]:
    """Toggles ambulance status between Available and Busy."""
    global fleet_df
    idx = fleet_df.index[fleet_df["amb_id"] == amb_id].tolist()
    if not idx:
        raise HTTPException(status_code=404, detail=f"Ambulance '{amb_id}' not found.")
    curr = fleet_df.at[idx[0], "status"]
    new_status = "Busy" if curr == "Available" else "Available"
    fleet_df.at[idx[0], "status"] = new_status
    return {"amb_id": amb_id, "new_status": new_status}


@app.post("/api/emergency")
def api_add_emergency(payload: EmergencyCreate) -> Dict[str, Any]:
    return add_emergency(payload)


@app.post("/api/optimize")
def api_run_optimization(payload: OptimizeRequest = OptimizeRequest(weighted=True)) -> Dict[str, Any]:
    return run_optimization(payload)


@app.post("/api/route")
def api_get_route(payload: RouteRequest) -> Dict[str, Any]:
    return get_shortest_route(payload)


@app.get("/api/analytics")
def api_get_analytics() -> Dict[str, Any]:
    return get_analytics()


@app.post("/api/reset")
def api_reset() -> Dict[str, Any]:
    return reset_to_prototype()


# ---------------------------------------------------------------------------
# Helper: Dynamic Matrix Construction from Network Graph
# ---------------------------------------------------------------------------
def compute_consistent_matrix_for_active_state(
    amb_df: pd.DataFrame,
    em_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Constructs an exact travel-time matrix using Dijkstra path lengths on the road graph.
    If default prototype entities (A1-A5 and E1-E5) are active, preserves the benchmark matrix.
    """
    amb_ids = amb_df["amb_id"].tolist()
    em_ids = em_df["em_id"].tolist()

    # Check if exact prototype IDs are queried
    is_proto_amb = set(amb_ids).issubset(set(travel_matrix_df.index))
    is_proto_em = set(em_ids).issubset(set(travel_matrix_df.columns))

    if is_proto_amb and is_proto_em:
        return travel_matrix_df.loc[amb_ids, em_ids].copy()

    # Otherwise compute via Dijkstra from road network
    amb_zones = dict(zip(amb_df["amb_id"], amb_df["zone"]))
    em_zones = dict(zip(em_df["em_id"], em_df["zone"]))

    mat = pd.DataFrame(index=amb_ids, columns=em_ids, dtype=float)
    for a in amb_ids:
        for e in em_ids:
            res = find_shortest_route(amb_zones[a], em_zones[e], graph=road_graph)
            mat.loc[a, e] = res["total_time"]
    return mat


# ---------------------------------------------------------------------------
# Serve Static Dashboard (if static/ folder exists)
# ---------------------------------------------------------------------------
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")