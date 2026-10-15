import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  ArrowRight,
  AlertTriangle,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { RouteResponse, Assignment } from '../types';
import { ZONES, CITY_GRAPH } from '../services/graph';

interface RoutingViewProps {
  onComputeRoute: (startZone: string, endZone: string) => Promise<RouteResponse | null>;
  isComputing: boolean;
  preselectedPair?: { startZone: string; endZone: string; label?: string } | null;
  recentAssignments: Assignment[];
  isDarkMode?: boolean;
}

export const RoutingView: React.FC<RoutingViewProps> = ({
  onComputeRoute,
  isComputing,
  preselectedPair,
  recentAssignments,
  isDarkMode = false,
}) => {
  const [startZone, setStartZone] = useState<string>(preselectedPair?.startZone || 'Zone A');
  const [endZone, setEndZone] = useState<string>(preselectedPair?.endZone || 'Zone E');
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-compute route on initial mount or when preselected pair changes
  useEffect(() => {
    if (preselectedPair) {
      setStartZone(preselectedPair.startZone);
      setEndZone(preselectedPair.endZone);
      handleExecuteRoute(preselectedPair.startZone, preselectedPair.endZone);
    } else {
      handleExecuteRoute(startZone, endZone);
    }
  }, [preselectedPair]);

  const handleExecuteRoute = async (start = startZone, end = endZone) => {
    setErrorMsg(null);
    try {
      const res = await onComputeRoute(start, end);
      if (res) {
        setRouteResult(res);
        if (res.status === 'Disconnected') {
          setErrorMsg(`Zones ${start} and ${end} are disconnected. No road path available.`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to compute shortest path.');
    }
  };

  const handlePairSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [start, end] = val.split('::');
    if (start && end) {
      setStartZone(start);
      setEndZone(end);
      handleExecuteRoute(start, end);
    }
  };

  const handleNodeClick = (clickedZone: string) => {
    if (clickedZone === startZone) return;
    setEndZone(clickedZone);
    handleExecuteRoute(startZone, clickedZone);
  };

  // Node coordinates for interactive SVG City Network Map
  const nodePositions: Record<string, { x: number; y: number; label: string }> = {
    'Zone A': { x: 90, y: 80, label: 'Zone A (North-West)' },
    'Zone B': { x: 270, y: 70, label: 'Zone B (North)' },
    'Zone C': { x: 140, y: 220, label: 'Zone C (Central-West)' },
    'Zone D': { x: 330, y: 190, label: 'Zone D (Central-East)' },
    'Zone E': { x: 190, y: 340, label: 'Zone E (South-West)' },
    'Zone F': { x: 390, y: 320, label: 'Zone F (South-East)' },
  };

  // Determine if an edge is on the current path
  const isEdgeOnPath = (from: string, to: string): boolean => {
    if (!routeResult || !routeResult.path || routeResult.path.length < 2) return false;
    for (let i = 0; i < routeResult.path.length - 1; i++) {
      if (
        (routeResult.path[i] === from && routeResult.path[i + 1] === to) ||
        (routeResult.path[i] === to && routeResult.path[i + 1] === from)
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Navigation className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Routing & Shortest Path (Dijkstra)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time graph pathfinding computing exact minimal travel minutes across city zone topology.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Preset selector from assignments if available */}
        {recentAssignments && recentAssignments.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-cyan-200 dark:border-cyan-950/80 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 shrink-0 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Quick Select From Optimization:
            </span>
            <select
              onChange={handlePairSelect}
              className="w-full sm:flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Choose an assigned ambulance-emergency pair --</option>
              {recentAssignments.map((a) => (
                <option key={`${a.amb_id}-${a.em_id}`} value={`${a.amb_zone}::${a.em_zone}`}>
                  {a.amb_id} at {a.amb_zone} → {a.em_id} at {a.em_zone} ({a.travel_time} mins, w={a.weight})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Source Zone */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Origin Base Zone:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-2.5" />
              <select
                value={startZone}
                onChange={(e) => setStartZone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Zone */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Incident Destination Zone:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400 absolute left-3 top-2.5" />
              <select
                value={endZone}
                onChange={(e) => setEndZone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Compute Button */}
          <div>
            <button
              onClick={() => handleExecuteRoute()}
              disabled={isComputing}
              className="w-full px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 dark:shadow-cyan-950/50 border border-cyan-400 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Navigation className={`w-4 h-4 ${isComputing ? 'animate-spin' : ''}`} />
              {isComputing ? 'Computing Route...' : 'Compute Shortest Route'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Card if Disconnected */}
      {errorMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-300 dark:bg-rose-950/80 dark:border-rose-600 p-4 shadow-xs text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Route Results & Network Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Visual Path Display & Alternatives */}
        <div className="space-y-6">
          {routeResult ? (
            <>
              {/* Stepper / Breadcrumbs Node Path */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Computed Optimal Route
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800">
                    {routeResult.status}
                  </span>
                </div>

                {/* Node Stepper */}
                <div className="py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {routeResult.path.map((zone, index) => {
                      const isFirst = index === 0;
                      const isLast = index === routeResult.path.length - 1;
                      return (
                        <React.Fragment key={zone + index}>
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                              isFirst
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/80'
                                : isLast
                                ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/80'
                                : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isFirst
                                  ? 'bg-emerald-600 dark:bg-emerald-400'
                                  : isLast
                                  ? 'bg-rose-600 dark:bg-rose-400 animate-pulse'
                                  : 'bg-cyan-600 dark:bg-cyan-400'
                              }`}
                            />
                            {zone}
                          </div>

                          {!isLast && (
                            <div className="flex items-center text-slate-400 dark:text-slate-500">
                              <ArrowRight className="w-4 h-4 text-cyan-600 dark:text-cyan-500 animate-pulse" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Metric Summary */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Total Travel Duration:</span>
                  <span className="text-lg font-extrabold text-cyan-700 dark:text-cyan-400 font-mono">
                    {routeResult.total_time} minutes
                  </span>
                </div>
              </div>

              {/* Alternative Path Comparison Box */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Alternative Candidate Routes
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Route Comparison</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fastest path verified against alternate routes across the city network:
                </p>

                <div className="space-y-2 text-xs">
                  {/* Selected Optimal */}
                  <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        Selected Optimal Route:
                      </div>
                      <div className="font-mono text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                        {routeResult.path.join(' → ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-cyan-700 dark:text-cyan-400 font-bold font-mono text-sm">
                        {routeResult.total_time} min
                      </span>
                      <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Minimal</span>
                    </div>
                  </div>

                  {/* Alternative candidate paths */}
                  {routeResult.alternative_paths && routeResult.alternative_paths.length > 0 ? (
                    routeResult.alternative_paths.map((alt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-600 dark:text-slate-400"
                      >
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-300">
                            Candidate Route {idx + 1}:
                          </div>
                          <div className="font-mono text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                            {alt.path.join(' → ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-800 dark:text-slate-300 font-bold font-mono">
                            {alt.total_time} min
                          </span>
                          <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                            +{alt.difference} min slower
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 italic">
                      Direct adjacency connection or single-hop topology; no viable non-looping alternates exist.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 space-y-2">
              <Navigation className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-300">No route computed yet</p>
              <p className="text-xs text-slate-500">
                Select an origin and destination zone or pick an assigned pair above to compute shortest path.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive City Zone Road Network Graph (SVG) */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-500" />
                City Zone Road Network (Graph G)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any zone circle on the map to set as destination and re-route in real-time.
              </p>
            </div>
            {routeResult && (
              <span className="self-start sm:self-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                {routeResult.path.join(' → ')} ({routeResult.total_time}m)
              </span>
            )}
          </div>

          {/* SVG Map Container with adaptive colors */}
          <div className="relative bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 p-2 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 480 400" className="w-full h-auto max-h-[380px] select-none">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Draw Edges */}
              {Object.entries(CITY_GRAPH).flatMap(([source, edges]) =>
                edges.map((edge) => {
                  if (source > edge.to) return null;
                  const p1 = nodePositions[source];
                  const p2 = nodePositions[edge.to];
                  if (!p1 || !p2) return null;

                  const active = isEdgeOnPath(source, edge.to);
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;

                  const inactiveStroke = isDarkMode ? '#334155' : '#cbd5e1';
                  const activeStroke = isDarkMode ? '#06b6d4' : '#0891b2';
                  const badgeBg = active
                    ? isDarkMode ? '#083344' : '#e0f2fe'
                    : isDarkMode ? '#0f172a' : '#ffffff';
                  const badgeBorder = active
                    ? isDarkMode ? '#06b6d4' : '#0284c7'
                    : isDarkMode ? '#475569' : '#cbd5e1';
                  const badgeText = active
                    ? isDarkMode ? '#67e8f9' : '#0369a1'
                    : isDarkMode ? '#94a3b8' : '#475569';

                  return (
                    <g key={`${source}-${edge.to}`}>
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={active ? activeStroke : inactiveStroke}
                        strokeWidth={active ? 4.5 : 2}
                        strokeDasharray={active ? 'none' : '4,4'}
                        filter={active && isDarkMode ? 'url(#glow)' : undefined}
                      />
                      {/* Edge weight badge */}
                      <rect
                        x={midX - 12}
                        y={midY - 9}
                        width="24"
                        height="18"
                        rx="4"
                        fill={badgeBg}
                        stroke={badgeBorder}
                        strokeWidth="1"
                      />
                      <text
                        x={midX}
                        y={midY + 4}
                        fill={badgeText}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {edge.weight}m
                      </text>
                    </g>
                  );
                })
              )}

              {/* Draw Nodes */}
              {Object.entries(nodePositions).map(([zone, pos]) => {
                const isSelectedStart = startZone === zone;
                const isSelectedEnd = endZone === zone;
                const isInRoute = routeResult?.path?.includes(zone);

                let fill = isDarkMode ? '#1e293b' : '#ffffff';
                let stroke = isDarkMode ? '#475569' : '#94a3b8';
                let textColor = isDarkMode ? '#cbd5e1' : '#1e293b';

                if (isSelectedStart) {
                  fill = isDarkMode ? '#065f46' : '#dcfce7';
                  stroke = '#16a34a';
                  textColor = isDarkMode ? '#6ee7b7' : '#14532d';
                } else if (isSelectedEnd) {
                  fill = isDarkMode ? '#881337' : '#ffe4e6';
                  stroke = '#e11d48';
                  textColor = isDarkMode ? '#fda4af' : '#9f1239';
                } else if (isInRoute) {
                  fill = isDarkMode ? '#155e75' : '#e0f2fe';
                  stroke = '#0284c7';
                  textColor = isDarkMode ? '#a5f3fc' : '#0369a1';
                }

                return (
                  <g
                    key={zone}
                    className="cursor-pointer group"
                    onClick={() => handleNodeClick(zone)}
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="22"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelectedStart || isSelectedEnd || isInRoute ? 3 : 1.5}
                      filter={isSelectedStart || isSelectedEnd ? (isDarkMode ? 'url(#glow)' : undefined) : undefined}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      fill={textColor}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {zone.replace('Zone ', '')}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 36}
                      fill={isDarkMode ? '#94a3b8' : '#64748b'}
                      fontSize="9"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {zone}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Origin Zone
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Destination Zone
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-1 bg-cyan-600 dark:bg-cyan-400" /> Active Dijkstra Path
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
