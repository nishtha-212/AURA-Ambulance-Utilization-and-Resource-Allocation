"""
AURA Data Layer: utils/data_loader.py
Handles loading, validation, and conversion of fleet data,
emergencies, road network topology, and travel-time matrices.
"""

import os
from typing import Dict, List, Tuple
import networkx as nx
import pandas as pd


# Default Operational Zones
ZONES: List[str] = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Zone F"]

# Priority mapping from medical triage to numerical weight (w_j)
PRIORITY_WEIGHT_MAP: Dict[str, int] = {
    "Critical": 5,
    "High": 3,
    "Medium": 2,
    "Low": 1,
}

# Calibrated road network edges matching guide topology:
# A <-> B (5m), B <-> D (6m), D <-> E (3m) => Path A-B-D-E = 14m
# A <-> C (8m), C <-> E (4m) => Path A-C-E = 12m (Dijkstra optimal)
# Connected to D <-> F (6m), C <-> F (9m), B <-> C (7m)
DEFAULT_EDGES: List[Tuple[str, str, float]] = [
    ("Zone A", "Zone B", 5.0),
    ("Zone A", "Zone C", 8.0),
    ("Zone B", "Zone C", 7.0),
    ("Zone B", "Zone D", 6.0),
    ("Zone C", "Zone E", 4.0),
    ("Zone D", "Zone E", 3.0),
    ("Zone D", "Zone F", 6.0),
    ("Zone C", "Zone F", 9.0),
]


def get_default_road_graph() -> nx.Graph:
    """Builds and returns the connected weighted road graph."""
    graph = nx.Graph()
    for u, v, weight in DEFAULT_EDGES:
        graph.add_edge(u, v, weight=weight)
    return graph


def compute_all_pairs_travel_times(graph: nx.Graph) -> pd.DataFrame:
    """Computes an all-pairs travel-time matrix using NetworkX Dijkstra shortest paths."""
    nodes = sorted(list(graph.nodes()))
    matrix = pd.DataFrame(index=nodes, columns=nodes, dtype=float)
    for u in nodes:
        lengths = nx.single_source_dijkstra_path_length(graph, u, weight="weight")
        for v in nodes:
            matrix.loc[u, v] = float(lengths.get(v, float("inf")))
    return matrix


def get_prototype_ambulances() -> pd.DataFrame:
    """
    Returns the standard prototype fleet from the project guide:
    A1 (Zone A, BLS, Available)
    A2 (Zone B, BLS, Available)
    A3 (Zone C, ALS, Busy)  <-- Must be filtered out in OR models
    A4 (Zone D, ALS, Available)
    A5 (Zone E, BLS, Available)
    """
    data = [
        {"amb_id": "A1", "zone": "Zone A", "type": "BLS", "status": "Available"},
        {"amb_id": "A2", "zone": "Zone B", "type": "BLS", "status": "Available"},
        {"amb_id": "A3", "zone": "Zone C", "type": "ALS", "status": "Busy"},
        {"amb_id": "A4", "zone": "Zone D", "type": "ALS", "status": "Available"},
        {"amb_id": "A5", "zone": "Zone E", "type": "BLS", "status": "Available"},
    ]
    return pd.DataFrame(data)


def get_prototype_emergencies() -> pd.DataFrame:
    """
    Returns the standard prototype emergencies from the project guide:
    E1 (Zone B, Critical, w=5)
    E2 (Zone F, High, w=3)
    E3 (Zone A, Medium, w=2)
    E4 (Zone D, Critical, w=5)
    E5 (Zone C, High, w=3)
    """
    data = [
        {"em_id": "E1", "zone": "Zone B", "priority": "Critical", "weight": 5, "status": "Pending"},
        {"em_id": "E2", "zone": "Zone F", "priority": "High", "weight": 3, "status": "Pending"},
        {"em_id": "E3", "zone": "Zone A", "priority": "Medium", "weight": 2, "status": "Pending"},
        {"em_id": "E4", "zone": "Zone D", "priority": "Critical", "weight": 5, "status": "Pending"},
        {"em_id": "E5", "zone": "Zone C", "priority": "High", "weight": 3, "status": "Pending"},
    ]
    return pd.DataFrame(data)


def get_prototype_travel_matrix() -> pd.DataFrame:
    """
    Returns the exact 5x5 ambulance-to-emergency travel-time matrix (in minutes)
    specified in the project guide (Ambulances A1-A5 to Emergencies E1-E5).
    """
    matrix_data = {
        "E1": [7.0, 3.0, 8.0, 12.0, 10.0],
        "E2": [18.0, 14.0, 10.0, 6.0, 8.0],
        "E3": [4.0, 9.0, 12.0, 16.0, 11.0],
        "E4": [15.0, 13.0, 9.0, 4.0, 7.0],
        "E5": [11.0, 8.0, 4.0, 10.0, 6.0],
    }
    index = ["A1", "A2", "A3", "A4", "A5"]
    return pd.DataFrame(matrix_data, index=index)


def save_prototype_csv_files(data_dir: str = "data") -> None:
    """Saves the default prototype tables into CSV files for reproducible runs."""
    os.makedirs(data_dir, exist_ok=True)
    get_prototype_ambulances().to_csv(os.path.join(data_dir, "ambulances.csv"), index=False)
    get_prototype_emergencies().to_csv(os.path.join(data_dir, "emergencies.csv"), index=False)
    get_prototype_travel_matrix().to_csv(os.path.join(data_dir, "travel_times.csv"))


def load_and_validate_data(data_dir: str = "data") -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Loads ambulances, emergencies, and the travel matrix.
    Validates data integrity and creates prototype CSVs if files do not exist.
    """
    amb_file = os.path.join(data_dir, "ambulances.csv")
    em_file = os.path.join(data_dir, "emergencies.csv")
    tt_file = os.path.join(data_dir, "travel_times.csv")

    if not (os.path.exists(amb_file) and os.path.exists(em_file) and os.path.exists(tt_file)):
        save_prototype_csv_files(data_dir)

    amb_df = pd.read_csv(amb_file)
    em_df = pd.read_csv(em_file)
    tt_df = pd.read_csv(tt_file, index_col=0)

    # Validations
    required_amb_cols = {"amb_id", "zone", "type", "status"}
    if not required_amb_cols.issubset(amb_df.columns):
        raise ValueError(f"Ambulances CSV missing required columns: {required_amb_cols - set(amb_df.columns)}")

    required_em_cols = {"em_id", "zone", "priority", "weight"}
    if not required_em_cols.issubset(em_df.columns):
        raise ValueError(f"Emergencies CSV missing required columns: {required_em_cols - set(em_df.columns)}")

    if amb_df["amb_id"].duplicated().any():
        raise ValueError("Duplicate ambulance IDs detected in fleet dataset.")

    if em_df["em_id"].duplicated().any():
        raise ValueError("Duplicate emergency IDs detected in emergency queue.")

    if (tt_df < 0).any().any():
        raise ValueError("Negative travel times found in travel-time matrix.")

    return amb_df, em_df, tt_df


def filter_available_ambulances(amb_df: pd.DataFrame) -> pd.DataFrame:
    """
    Filters out Busy or In-Transit ambulances.
    Core OR Guardrail: Busy ambulances must NEVER enter the decision matrix.
    """
    available = amb_df[amb_df["status"].str.strip().str.capitalize() == "Available"].copy()
    if available.empty:
        raise ValueError("Zero ambulances currently available! All fleet units are busy.")
    return available


def parse_tamil_nadu_excel(file_path: str) -> pd.DataFrame:
    """
    Extracts and maps real emergency records from tamil_nadu_ambulance_data.xlsx.
    Converts triage classifications into project-standard priority tiers.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Excel file not found at: {file_path}")

    raw = pd.read_excel(file_path, sheet_name=0)
    emergencies = raw[raw["Emergency / IFT"] == "EMERGENCY"].copy()

    # Map triage to standard priority and weight
    def map_triage(row):
        t = str(row.get("triage", ""))
        is_crit = str(row.get("is_critical", "")).strip().lower()
        if "RED" in t or is_crit == "yes":
            return "Critical", 5
        elif "YELLOW(Urgent)" in t:
            return "High", 3
        elif "YELLOW" in t:
            return "Medium", 2
        return "Low", 1

    extracted = []
    for idx, row in emergencies.iterrows():
        p_label, weight = map_triage(row)
        extracted.append({
            "em_id": f"E_TN_{row['Case_ID']}",
            "caller_taluk": row.get("Caller Taluk", "Zone A"),
            "district": row.get("Caller District", "Madurai"),
            "priority": p_label,
            "weight": weight,
            "response_time_actual": row.get("Response Time", "00:14:30")
        })

    return pd.DataFrame(extracted)