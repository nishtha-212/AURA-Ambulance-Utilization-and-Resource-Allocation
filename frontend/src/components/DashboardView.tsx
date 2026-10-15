import React from 'react';
import {
  LayoutDashboard,
  Ambulance,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Activity,
  Cpu,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { Ambulance as AmbulanceType, Emergency } from '../types';

interface DashboardViewProps {
  ambulances: AmbulanceType[];
  emergencies: Emergency[];
  onRunOptimization: () => void;
  isOptimizing: boolean;
  onNavigateTab: (tab: 'ambulances' | 'emergencies' | 'optimization' | 'routing' | 'analytics') => void;
  onToggleAmbulanceStatus: (amb_id: string, currentStatus: 'Available' | 'Busy') => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  ambulances,
  emergencies,
  onRunOptimization,
  isOptimizing,
  onNavigateTab,
  onToggleAmbulanceStatus,
}) => {
  const totalAmbulances = ambulances.length;
  const availableAmbulances = ambulances.filter((a) => a.status === 'Available').length;
  const busyAmbulances = ambulances.filter((a) => a.status === 'Busy').length;

  const activeEmergencies = emergencies.filter((e) => e.status !== 'Completed');
  const criticalEmergencies = activeEmergencies.filter((e) => e.weight === 5).length;
  const pendingEmergencies = emergencies.filter((e) => e.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Module Title / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-rose-600 dark:text-rose-500" />
            Operations Overview Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time emergency monitoring, fleet availability, and automated Operations Research dispatch.
          </p>
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Ambulances */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Fleet</span>
            <Ambulance className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{totalAmbulances}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Dispersed in Zones A–F</p>
        </div>

        {/* Available Ambulances */}
        <div className="bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700/60 transition">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {availableAmbulances}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Ready for instant dispatch</p>
        </div>

        {/* Busy Ambulances */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Busy / En Route</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{busyAmbulances}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Currently engaged</p>
        </div>

        {/* Active Emergencies */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Calls</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{activeEmergencies.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{pendingEmergencies} pending dispatch</p>
        </div>

        {/* Critical Emergencies */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/60 dark:to-slate-900 border border-rose-300 dark:border-rose-800/80 rounded-xl p-4 shadow-xs hover:border-rose-400 dark:hover:border-rose-600 transition">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500 animate-ping" />
              Critical Priority
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400 font-mono">{criticalEmergencies}</div>
          <p className="text-[11px] text-rose-600/90 dark:text-rose-300/80 mt-1">Requires immediate response</p>
        </div>
      </div>

      {/* Operations Overview & Quick Dispatch Command Patch */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-700/60 relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                Operations Overview
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                MILP Optimization Engine Ready
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Emergency Dispatch &amp; Road Network Optimization
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Minimizing priority-weighted response times using PuLP Mixed-Integer Linear Programming cross-validated with the Hungarian algorithm. Shortest-path routing is computed dynamically across city Zones A through F via Dijkstra's algorithm.
            </p>

            {/* Quick Metrics Bar inside Overview Patch */}
            <div className="pt-1 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Fleet Availability:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {availableAmbulances} / {totalAmbulances} Units Ready
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Triage Queue:</span>
                <span className="font-mono font-semibold text-amber-400">
                  {pendingEmergencies} Pending Calls
                </span>
                {criticalEmergencies > 0 && (
                  <span className="font-mono font-semibold text-rose-400">
                    ({criticalEmergencies} Critical)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Network Grid:</span>
                <span className="font-mono font-semibold text-cyan-400">
                  6 City Zones Connected
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Dispatch Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={onRunOptimization}
              disabled={isOptimizing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              <Cpu className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Solving MILP Model...' : 'Run Optimal Dispatch'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('routing')}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>Route Map</span>
              </button>

              <button
                onClick={() => onNavigateTab('analytics')}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Live Status Summary: Split-Screen View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Emergencies */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Active Emergencies</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {emergencies.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('emergencies')}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 font-semibold transition"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 max-h-[380px] overflow-y-auto">
            {emergencies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No emergencies recorded.</div>
            ) : (
              emergencies.map((em) => {
                const isCritical = em.weight === 5;
                const isHigh = em.weight === 3;
                return (
                  <div
                    key={em.em_id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40'
                            : 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40'
                        }`}
                      >
                        {em.em_id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{em.priority}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            w={em.weight}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{em.zone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          em.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/60'
                            : em.status === 'Dispatched'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800/60'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60'
                        }`}
                      >
                        {em.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Ambulances */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Active Ambulances Fleet</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {ambulances.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('ambulances')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 font-semibold transition"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 max-h-[380px] overflow-y-auto">
            {ambulances.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No ambulances registered.</div>
            ) : (
              ambulances.map((amb) => {
                const isAvail = amb.status === 'Available';
                return (
                  <div
                    key={amb.amb_id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isAvail
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40'
                            : 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40'
                        }`}
                      >
                        {amb.amb_id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{amb.type}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Base: {amb.zone}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {amb.type === 'ALS' ? 'Advanced Life Support' : 'Basic Life Support'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleAmbulanceStatus(amb.amb_id, amb.status)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition active:scale-95 border ${
                          isAvail
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/80 dark:hover:bg-emerald-900/80'
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/80 dark:hover:bg-rose-900/80'
                        }`}
                        title="Click to toggle Available / Busy"
                      >
                        {amb.status}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
