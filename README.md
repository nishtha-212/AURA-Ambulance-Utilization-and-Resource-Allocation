# AURA: Ambulance Utilization and Resource Allocation

AURA (Ambulance Utilization and Resource Allocation) is an Operations Research (OR) emergency fleet dispatch, optimization, and city routing platform. The system formulates emergency dispatch as a Binary Integer Linear Programming (BILP) assignment problem, solves it using PuLP (CBC Solver), cross-verifies results with the Hungarian Algorithm (Kuhn-Munkres via SciPy), and computes real-time shortest routes using Dijkstra's algorithm on NetworkX road graphs.

---

## Key Capabilities

- Binary Integer Programming Dispatch: Optimal multi-unit ambulance assignment minimizing emergency response times across city sectors.
- Algorithmic Verification: Dual-solver validation comparing PuLP branch-and-bound against the Hungarian method to guarantee global optimality.
- Triage-Weighted Optimization: Clinical priority weighting (Critical = 5, High = 3, Medium = 2, Low = 1) ensuring life-threatening cases receive nearest available life-support units.
- Shortest-Path Navigation: Dijkstra pathfinding with corridor step breakdowns, travel time calculations, and alternate route evaluation.
- KPI Benchmarking: Live comparison between standard first-come first-served (Greedy heuristic) dispatch and PuLP optimization.
- Fleet and Incident Management: Dynamic creation, zone allocation, and availability tracking of Advanced Life Support (ALS) and Basic Life Support (BLS) units.

---

## Mathematical Formulation

### 1. Decision Variables
- `x_ij` in {0, 1}: 1 if available ambulance `i` is dispatched to emergency `j`, else 0.
- `u_j` in {0, 1}: 1 if emergency `j` is queued (unserved due to fleet capacity exhaustion), else 0.

### 2. Objective Function
Minimize total priority-weighted response time plus queuing penalty:

```
Minimize Z = sum_i sum_j (C_ij * x_ij) + sum_j (Penalty_j * u_j)
```

Where:
- `C_ij = w_j * t_ij` (in Priority-Weighted mode) or `t_ij` (in Standard mode).
- `w_j`: Triage weight of emergency `j`.
- `t_ij`: Shortest path travel time between ambulance base station `i` and incident zone `j`.
- `Penalty_j`: Big-M penalty ensuring queued calls are only deferred when available fleet units are exhausted.

### 3. Constraints
- Fleet Capacity: Each available ambulance can be assigned to at most one incident:
  ```
  sum_j x_ij <= 1, for all available ambulances i
  ```
- Demand Fulfillment: Each active emergency must either be assigned an ambulance or marked as queued:
  ```
  sum_i x_ij + u_j == 1, for all active emergencies j
  ```
- Busy Unit Exclusion: Busy or in-transit ambulances are strictly excluded prior to decision matrix formulation.

---

## Project Structure

```
.
|-- data/                          # Operational datasets and prototype matrices
|   |-- ambulances.csv
|   |-- emergencies.csv
|   `-- travel_times.csv
|-- frontend/                      # React 19 + TypeScript + Vite frontend
|   |-- src/
|   |   |-- components/            # UI modules (Dashboard, Ambulances, Emergencies, Optimization, Routing, Analytics)
|   |   |-- services/              # REST API client and graph pathfinding engine
|   |   |-- types/                 # TypeScript interfaces and domain models
|   |   |-- App.tsx                # Main application orchestrator
|   |   |-- index.css              # Global styling
|   |   `-- main.tsx               # Application bootstrap
|   |-- package.json
|   |-- tsconfig.json
|   `-- vite.config.ts
|-- optimization/                  # Operations Research solvers
|   |-- assignment.py              # PuLP BILP assignment and Hungarian method cross-check
|   `-- transportation.py          # Zone-aggregate transportation model
|-- routing/                       # Network graph and pathfinding
|   `-- shortest_path.py           # Dijkstra shortest path algorithms on NetworkX graph
|-- utils/                         # Data loading and KPI benchmarking
|   |-- data_loader.py             # Prototype data loaders, network edges, and CSV handlers
|   `-- kpis.py                    # Greedy baseline heuristic and comparative KPI benchmarks
|-- main.py                        # FastAPI backend REST API server
|-- requirements.txt               # Python package dependencies
`-- README.md
```

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ambulances` | List all fleet ambulances |
| POST | `/ambulances` | Register a new ambulance unit |
| PATCH | `/ambulances/{amb_id}/status` | Update ambulance status (`Available` or `Busy`) |
| GET | `/emergencies` | List active emergency calls |
| POST | `/emergencies` | Log a new incoming emergency call |
| PATCH | `/emergencies/{em_id}/status` | Update incident status (`Pending`, `Dispatched`, `Completed`) |
| POST | `/optimize` | Execute PuLP assignment and Hungarian verification |
| POST | `/route` | Compute shortest path between two zones via Dijkstra |
| GET | `/analytics` | Retrieve comparative KPIs (Greedy Baseline vs PuLP Optimal) |
| POST | `/reset` | Reset state back to prototype benchmark dataset |

---

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher with npm

### 1. Backend Setup
Clone the repository and install the Python dependencies:

```bash
git clone https://github.com/nishtha-212/AURA-Ambulance-Utilization-and-Resource-Allocation.git
cd AURA-Ambulance-Utilization-and-Resource-Allocation

pip install -r requirements.txt
```

Start the FastAPI application:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The API interactive Swagger documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
In a new terminal, navigate to the `frontend` folder and install dependencies:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Verification and Testing

To verify the solver and backend endpoints:

```bash
python -c "import main; print('Backend loaded successfully')"
```

To run TypeScript verification and bundle build on the frontend:

```bash
cd frontend
npm run lint
npm run build
```

---

## Technical Stack

- Backend: FastAPI, PuLP (CBC Solver), SciPy, NetworkX, Pandas, Uvicorn
- Frontend: React 19, TypeScript, TailwindCSS, Lucide Icons, Vite
- Mathematical Methods: Binary Integer Programming, Hungarian Method (Kuhn-Munkres), Dijkstra Shortest Path, Greedy Baseline Heuristic
