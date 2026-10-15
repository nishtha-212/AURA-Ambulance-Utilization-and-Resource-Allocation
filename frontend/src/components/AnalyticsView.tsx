import React from 'react';
import {
  BarChart2,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { AnalyticsResponse } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsResponse | null;
  onRefreshAnalytics: () => Promise<void>;
  isLoading: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  onRefreshAnalytics,
  isLoading,
}) => {
  if (!analytics) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center space-y-3">
        <BarChart2 className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Analytics Loaded</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Query the analytics engine to compare PuLP optimal dispatch against the greedy baseline model.
        </p>
        <button
          onClick={onRefreshAnalytics}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Computing Benchmarks...' : 'Load Analytics'}
        </button>
      </div>
    );
  }

  const { baseline, optimized, improvement_pct } = analytics;

  // Differences for comparison
  const totalDiff = +(baseline.total_time - optimized.total_time).toFixed(1);
  const avgDiff = +(baseline.avg_time - optimized.avg_time).toFixed(1);
  const critDiff = +(baseline.critical_avg - optimized.critical_avg).toFixed(1);
  const maxDiff = +(baseline.max_time - optimized.max_time).toFixed(1);

  // Normalization for visual progress bars
  const maxScaleTime = Math.max(baseline.total_time, optimized.total_time, 80);
  const maxPerCallTime = Math.max(baseline.max_time, optimized.max_time, 25);

  return (
    <div className="space-y-6">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Analytics &amp; Performance Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Comparative performance benchmarks: Optimized Dispatch vs Standard Dispatch.
          </p>
        </div>
        <button
          onClick={onRefreshAnalytics}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-2 transition self-start sm:self-auto disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Benchmarks
        </button>
      </div>

      {/* Prominent Improvement Highlight Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-950/80 dark:via-slate-900 dark:to-cyan-950/70 border border-emerald-500/40 dark:border-emerald-600/50 p-6 shadow-md text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 dark:bg-emerald-500/20 text-white dark:text-emerald-300 border border-white/30 dark:border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-300 dark:text-emerald-400" />
              Efficiency Benchmark Result
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Optimized allocation reduced emergency response time by{' '}
              <span className="text-amber-200 dark:text-emerald-400 underline decoration-white/60 dark:decoration-emerald-500/60 decoration-2 underline-offset-4">
                {improvement_pct.toFixed(1)}%
              </span>{' '}
              compared to standard dispatch.
            </h3>
            <p className="text-xs text-emerald-50 dark:text-slate-300 max-w-2xl leading-relaxed">
              Smart dispatch evaluates all calls concurrently so critical emergency calls receive the fastest nearby response.
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-4xl sm:text-5xl font-black text-white dark:text-emerald-400 font-mono tracking-tight">
              -{improvement_pct.toFixed(1)}%
            </div>
            <span className="text-xs font-medium text-emerald-100 dark:text-slate-400">Response Time Reduction</span>
          </div>
        </div>
      </div>

      {/* 5 Summary KPI Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Total Response Time */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            1. Total Response Time
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{optimized.total_time}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">min</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              -{totalDiff}m
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Standard:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{baseline.total_time} min</span>
          </div>
        </div>

        {/* Metric 2: Average Response Time per Call */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            2. Avg Time / Call
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{optimized.avg_time}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">min</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              -{avgDiff}m
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Standard:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{baseline.avg_time} min</span>
          </div>
        </div>

        {/* Metric 3: Critical Priority Average Time */}
        <div className="bg-rose-50 dark:bg-gradient-to-br dark:from-rose-950/40 dark:to-slate-900 border border-rose-200 dark:border-rose-800/80 rounded-xl p-4 shadow-xs hover:border-rose-300 dark:hover:border-rose-600 transition">
          <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500" />
            3. Critical Calls Avg
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 font-mono">{optimized.critical_avg}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">min</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              -{critDiff}m
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Baseline:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{baseline.critical_avg} min</span>
          </div>
        </div>

        {/* Metric 4: Maximum Single-Call Response Time */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            4. Max Single Time
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{optimized.max_time}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">min</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              -{maxDiff}m
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Baseline:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{baseline.max_time} min</span>
          </div>
        </div>

        {/* Metric 5: Ambulance Fleet Utilization */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            5. Fleet Utilization
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-400 font-mono">
                {Math.round(optimized.utilization * 100)}%
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">
              {Math.round(baseline.utilization * 100)}% base
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Available Units:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">Balanced</span>
          </div>
        </div>
      </div>

      {/* Visual Comparison Progress & Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric Bar Comparison Chart */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Comparative Response Times (Minutes)
            </h4>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-slate-400 dark:bg-slate-600 inline-block" /> Baseline
              </span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600 dark:bg-emerald-500 inline-block" /> Optimized (PuLP)
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Total Time Bar */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                <span>Total Objective Response Time</span>
                <span className="font-mono font-semibold">
                  {optimized.total_time}m vs {baseline.total_time}m
                </span>
              </div>
              <div className="space-y-1.5">
                {/* Baseline bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-transparent">
                  <div
                    className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (baseline.total_time / maxScaleTime) * 100)}%` }}
                  />
                </div>
                {/* Optimized bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-transparent">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs shadow-emerald-500/50"
                    style={{ width: `${Math.min(100, (optimized.total_time / maxScaleTime) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Average Time Bar */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                <span>Average Response Time per Call</span>
                <span className="font-mono font-semibold">
                  {optimized.avg_time}m vs {baseline.avg_time}m
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-transparent">
                  <div
                    className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(baseline.avg_time / maxPerCallTime) * 100}%` }}
                  />
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-transparent">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(optimized.avg_time / maxPerCallTime) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Critical Average Time Bar */}
            <div>
              <div className="flex justify-between text-rose-800 dark:text-rose-300 font-bold mb-1">
                <span>Critical Incident Average (w=5)</span>
                <span className="font-mono">
                  {optimized.critical_avg}m vs {baseline.critical_avg}m
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-transparent">
                  <div
                    className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(baseline.critical_avg / maxPerCallTime) * 100}%` }}
                  />
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-transparent">
                  <div
                    className="bg-rose-600 dark:bg-rose-500 h-full rounded-full transition-all duration-500 shadow-xs shadow-rose-500/50"
                    style={{ width: `${(optimized.critical_avg / maxPerCallTime) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Maximum Time Bar */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                <span>Maximum Single-Incident Time (Worst-Case)</span>
                <span className="font-mono font-semibold">
                  {optimized.max_time}m vs {baseline.max_time}m
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-transparent">
                  <div
                    className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(baseline.max_time / maxPerCallTime) * 100}%` }}
                  />
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-transparent">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(optimized.max_time / maxPerCallTime) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Comparative KPI Table */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-0">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Comparative Benchmark Matrix
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">PuLP vs Greedy</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Greedy Baseline</th>
                  <th className="px-4 py-3 text-emerald-700 dark:text-emerald-400">PuLP Optimized</th>
                  <th className="px-4 py-3 text-right">Net Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Total Response Objective</td>
                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{baseline.total_time} min</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{optimized.total_time} min</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    -{improvement_pct.toFixed(1)}%
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Average Response / Call</td>
                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{baseline.avg_time} min</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{optimized.avg_time} min</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">-{avgDiff} min</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 bg-rose-50/50 dark:bg-rose-950/10">
                  <td className="px-4 py-3 font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500" /> Critical Average (w=5)
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{baseline.critical_avg} min</td>
                  <td className="px-4 py-3 font-mono font-bold text-rose-700 dark:text-rose-400">{optimized.critical_avg} min</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">-{critDiff} min</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Maximum Single Call</td>
                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{baseline.max_time} min</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{optimized.max_time} min</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">-{maxDiff} min</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Fleet Utilization</td>
                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                    {Math.round(baseline.utilization * 100)}%
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    {Math.round(optimized.utilization * 100)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400">Even</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
            <span className="font-semibold text-slate-800 dark:text-slate-300 block">Operations Research Analysis:</span>
            <p>
              Greedy dispatch suffers from the classic "myopic hazard": the first arriving ambulance is assigned to
              the closest call regardless of severity, stranding high-triage critical calls with distant units.
              AURA's linear programming model guarantees global Pareto optimality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
