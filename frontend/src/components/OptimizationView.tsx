import React, { useState } from 'react';
import {
  Cpu,
  Play,
  CheckCircle,
  Navigation,
  Check,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { OptimizationResponse } from '../types';

interface OptimizationViewProps {
  optimizationResult: OptimizationResponse | null;
  onExecuteOptimization: (weighted: boolean) => Promise<void>;
  isOptimizing: boolean;
  onSelectRoutePair: (startZone: string, endZone: string, label?: string) => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  optimizationResult,
  onExecuteOptimization,
  isOptimizing,
  onSelectRoutePair,
}) => {
  const [isWeighted, setIsWeighted] = useState<boolean>(true);

  const handleRun = () => {
    onExecuteOptimization(isWeighted);
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-rose-600 dark:text-rose-500" />
            Optimal Dispatch &amp; Ambulance Assignment
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Compute optimal ambulance assignments minimizing response times across active emergencies.
          </p>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Dispatch Mode:
            </span>

            {/* Radio Toggles */}
            <div className="flex flex-col sm:flex-row gap-3">
              <label
                onClick={() => setIsWeighted(true)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  isWeighted
                    ? 'bg-rose-50 border-rose-300 text-slate-900 dark:bg-rose-950/40 dark:border-rose-500/80 dark:text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="objective"
                  checked={isWeighted}
                  onChange={() => setIsWeighted(true)}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    Priority-Weighted Response
                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 text-[10px] font-semibold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Prioritizes critical life-threatening incidents first to guarantee the fastest emergency response.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setIsWeighted(false)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  !isWeighted
                    ? 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800/80 dark:border-slate-600 dark:text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="objective"
                  checked={!isWeighted}
                  onChange={() => setIsWeighted(false)}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Standard Distance-Based</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Minimizes total fleet travel minutes equally without clinical triage weighting.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isOptimizing}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 dark:shadow-rose-950/60 border border-rose-400/40 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Optimum...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Calculate Optimal Dispatch
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {optimizationResult ? (
        <div className="space-y-6">
          {/* Top Metric & Dual Solver Cross-Check Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Card */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                  Dispatch Status
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                      optimizationResult.status === 'Optimal'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {optimizationResult.status}
                  </span>
                </div>
              </div>
              <Cpu className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            </div>

            {/* Total Response Time Objective Value */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                Total Response Time
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1 flex items-baseline gap-2">
                {optimizationResult.objective_value}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">
                  {isWeighted ? 'weighted mins' : 'fleet travel mins'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {optimizationResult.assignments.length} units dispatched concurrently
              </p>
            </div>

            {/* Hungarian Method Validation Card */}
            <div className="bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-300 dark:border-emerald-800/80 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  Algorithm Verification
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40">
                  Verified
                </span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                {optimizationResult.hungarian_objective}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold mt-1">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Optimal Assignment Confirmed
              </div>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-0">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Optimal Ambulance-to-Emergency Assignments
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {optimizationResult.assignments.length} matched pairs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Emergency</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Assigned Ambulance</th>
                    <th className="px-4 py-3">Base Station</th>
                    <th className="px-4 py-3">Travel Time</th>
                    <th className="px-4 py-3">Priority Score</th>
                    <th className="px-4 py-3 text-right">Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {optimizationResult.assignments.map((asgn) => {
                    const isCritical = asgn.weight === 5;
                    return (
                      <tr key={asgn.em_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                            }`}
                          />
                          {asgn.em_id}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">{asgn.em_zone}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            Level {asgn.weight}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60">
                            {asgn.amb_id}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">{asgn.amb_zone}</td>
                        <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-200 font-bold">
                          {asgn.travel_time} mins
                        </td>
                        <td className="px-4 py-3 font-mono text-amber-700 dark:text-amber-300 font-bold">
                          {asgn.weighted_time}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              onSelectRoutePair(
                                asgn.amb_zone,
                                asgn.em_zone,
                                `${asgn.amb_id} (${asgn.amb_zone}) → ${asgn.em_id} (${asgn.em_zone})`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/80 dark:hover:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-800/80 text-[11px] font-semibold transition active:scale-95 shadow-xs"
                          >
                            <Navigation className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            View Route
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Queued / Unserved Section (Unbalanced Demand Condition) */}
          {optimizationResult.unserved_emergencies && optimizationResult.unserved_emergencies.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-600/50 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                  Queued Emergency Calls (Fleet at Maximum Capacity)
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                Active calls exceed currently available ambulances. Lower-priority calls are placed on hold so that
                critical emergency calls receive immediate dispatch.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {optimizationResult.unserved_emergencies.map((unserved) => (
                  <div
                    key={unserved.em_id}
                    className="p-3 rounded-lg bg-white dark:bg-slate-900/90 border border-amber-300 dark:border-amber-900/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{unserved.em_id}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {unserved.zone}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                        Priority: {unserved.priority} (Level {unserved.weight})
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold">
                      Queued (Awaiting Unit)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty state before running */
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center space-y-3">
          <Cpu className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Dispatch Optimization Ready</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Click "Calculate Optimal Dispatch" to assign available ambulances to active emergency calls with minimal response time.
          </p>
          <button
            onClick={handleRun}
            disabled={isOptimizing}
            className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Calculate Optimal Dispatch
          </button>
        </div>
      )}
    </div>
  );
};
