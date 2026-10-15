// City Zone Network Graph and Dijkstra Shortest Path Engine for AURA

export interface Edge {
  to: string;
  weight: number;
}

export const CITY_GRAPH: Record<string, Edge[]> = {
  'Zone A': [
    { to: 'Zone B', weight: 4 },
    { to: 'Zone C', weight: 6 },
  ],
  'Zone B': [
    { to: 'Zone A', weight: 4 },
    { to: 'Zone C', weight: 5 },
    { to: 'Zone D', weight: 8 },
  ],
  'Zone C': [
    { to: 'Zone A', weight: 6 },
    { to: 'Zone B', weight: 5 },
    { to: 'Zone D', weight: 3 },
    { to: 'Zone E', weight: 7 },
  ],
  'Zone D': [
    { to: 'Zone B', weight: 8 },
    { to: 'Zone C', weight: 3 },
    { to: 'Zone E', weight: 4 },
    { to: 'Zone F', weight: 6 },
  ],
  'Zone E': [
    { to: 'Zone C', weight: 7 },
    { to: 'Zone D', weight: 4 },
    { to: 'Zone F', weight: 5 },
  ],
  'Zone F': [
    { to: 'Zone D', weight: 6 },
    { to: 'Zone E', weight: 5 },
  ],
};

export const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F'];

export interface ShortestPathResult {
  path: string[];
  totalTime: number;
  status: 'Connected' | 'Disconnected';
  alternatives?: {
    path: string[];
    total_time: number;
    difference: number;
  }[];
}

/**
 * Executes Dijkstra's algorithm to find shortest travel time between any two zones
 */
export function dijkstra(startZone: string, endZone: string): ShortestPathResult {
  if (startZone === endZone) {
    return {
      path: [startZone],
      totalTime: 0,
      status: 'Connected',
      alternatives: [],
    };
  }

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  for (const zone of ZONES) {
    distances[zone] = Infinity;
    previous[zone] = null;
    unvisited.add(zone);
  }

  distances[startZone] = 0;

  while (unvisited.size > 0) {
    let closestNode: string | null = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        closestNode = node;
      }
    }

    if (!closestNode || minDistance === Infinity) {
      break;
    }

    if (closestNode === endZone) {
      break;
    }

    unvisited.delete(closestNode);

    const neighbors = CITY_GRAPH[closestNode] || [];
    for (const edge of neighbors) {
      if (unvisited.has(edge.to)) {
        const alt = distances[closestNode] + edge.weight;
        if (alt < distances[edge.to]) {
          distances[edge.to] = alt;
          previous[edge.to] = closestNode;
        }
      }
    }
  }

  if (distances[endZone] === Infinity) {
    return {
      path: [],
      totalTime: -1,
      status: 'Disconnected',
    };
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = endZone;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  // Generate candidate alternative paths for comparison
  const alternatives = generateAlternativePaths(startZone, endZone, distances[endZone]);

  return {
    path,
    totalTime: distances[endZone],
    status: 'Connected',
    alternatives,
  };
}

function generateAlternativePaths(
  startZone: string,
  endZone: string,
  optimalTime: number
): { path: string[]; total_time: number; difference: number }[] {
  // Simple heuristic alternate paths through intermediate nodes
  const alts: { path: string[]; total_time: number; difference: number }[] = [];
  const candidateIntermediates = ZONES.filter((z) => z !== startZone && z !== endZone);

  for (const mid of candidateIntermediates) {
    const leg1 = dijkstraDirect(startZone, mid);
    const leg2 = dijkstraDirect(mid, endZone);
    if (leg1.time > 0 && leg2.time > 0) {
      const combinedPath = [...leg1.path.slice(0, -1), ...leg2.path];
      const time = leg1.time + leg2.time;
      if (time > optimalTime && !alts.some((a) => a.total_time === time)) {
        alts.push({
          path: combinedPath,
          total_time: time,
          difference: +(time - optimalTime).toFixed(1),
        });
      }
    }
  }

  return alts.sort((a, b) => a.total_time - b.total_time).slice(0, 2);
}

function dijkstraDirect(start: string, end: string): { path: string[]; time: number } {
  if (start === end) return { path: [start], time: 0 };
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(ZONES);

  for (const z of ZONES) distances[z] = Infinity;
  distances[start] = 0;

  while (unvisited.size > 0) {
    let closest: string | null = null;
    let min = Infinity;
    for (const n of unvisited) {
      if (distances[n] < min) {
        min = distances[n];
        closest = n;
      }
    }
    if (!closest || min === Infinity) break;
    if (closest === end) break;
    unvisited.delete(closest);

    for (const edge of CITY_GRAPH[closest] || []) {
      if (unvisited.has(edge.to)) {
        const alt = distances[closest] + edge.weight;
        if (alt < distances[edge.to]) {
          distances[edge.to] = alt;
          previous[edge.to] = closest;
        }
      }
    }
  }

  if (distances[end] === Infinity) return { path: [], time: -1 };
  const path: string[] = [];
  let curr: string | null = end;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }
  return { path, time: distances[end] };
}

// Precomputed all-pairs shortest distances matrix
export function getZoneTravelTime(fromZone: string, toZone: string): number {
  return dijkstraDirect(fromZone, toZone).time;
}
