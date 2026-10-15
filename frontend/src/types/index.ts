export type Zone = 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D' | 'Zone E' | 'Zone F';

export type AmbulanceType = 'BLS' | 'ALS';
export type AmbulanceStatus = 'Available' | 'Busy';

export interface Ambulance {
  amb_id: string;
  zone: string;
  type: AmbulanceType;
  status: AmbulanceStatus;
}

export type EmergencyPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type EmergencyStatus = 'Pending' | 'Dispatched' | 'Completed';

export interface Emergency {
  em_id: string;
  zone: string;
  priority: EmergencyPriority;
  weight: number; // 5 for Critical, 3 for High, 2 for Medium, 1 for Low
  status: EmergencyStatus;
}

export interface Assignment {
  em_id: string;
  amb_id: string;
  amb_zone: string;
  em_zone: string;
  travel_time: number;
  weight: number;
  weighted_time: number;
}

export interface UnservedEmergency {
  em_id: string;
  zone: string;
  priority: EmergencyPriority;
  weight: number;
  reason?: string;
}

export interface OptimizationResponse {
  status: 'Optimal' | 'Infeasible' | 'Suboptimal' | 'Error';
  objective_value: number;
  hungarian_objective: number;
  cross_check_passed: boolean;
  assignments: Assignment[];
  unserved_emergencies: UnservedEmergency[];
}

export interface RouteResponse {
  path: string[];
  total_time: number;
  status: 'Connected' | 'Disconnected' | 'Error';
  alternative_paths?: {
    path: string[];
    total_time: number;
    difference: number;
  }[];
}

export interface PerformanceMetrics {
  total_time: number;
  avg_time: number;
  critical_avg: number;
  max_time: number;
  utilization: number;
}

export interface AnalyticsResponse {
  baseline: PerformanceMetrics;
  optimized: PerformanceMetrics;
  improvement_pct: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'simulated';
