import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  ShieldAlert,
  Send,
  Check,
} from 'lucide-react';
import { Emergency, EmergencyPriority, EmergencyStatus, Zone } from '../types';
import { ZONES } from '../services/graph';
import { getPriorityWeight } from '../services/api';

interface EmergenciesViewProps {
  emergencies: Emergency[];
  onAddEmergency: (em: {
    em_id: string;
    zone: string;
    priority: EmergencyPriority;
    weight: number;
  }) => Promise<void>;
  onUpdateStatus: (em_id: string, status: EmergencyStatus) => Promise<void>;
  isSubmitting: boolean;
}

export const EmergenciesView: React.FC<EmergenciesViewProps> = ({
  emergencies,
  onAddEmergency,
  onUpdateStatus,
  isSubmitting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form states
  const [newId, setNewId] = useState('');
  const [newZone, setNewZone] = useState<Zone>('Zone B');
  const [newPriority, setNewPriority] = useState<EmergencyPriority>('Critical');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim()) {
      setFormError('Emergency ID is required.');
      return;
    }

    if (emergencies.some((em) => em.em_id.toUpperCase() === newId.trim().toUpperCase())) {
      setFormError(`Emergency with ID "${newId}" already exists.`);
      return;
    }

    setFormError(null);
    try {
      const weight = getPriorityWeight(newPriority);
      await onAddEmergency({
        em_id: newId.trim().toUpperCase(),
        zone: newZone,
        priority: newPriority,
        weight,
      });
      setNewId('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to report emergency.');
    }
  };

  const filteredEmergencies = emergencies.filter((em) => {
    if (!em || !em.em_id) return false;
    const emId = (em.em_id || '').toLowerCase();
    const emZone = (em.zone || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = emId.includes(query) || emZone.includes(query);
    const matchesZone = filterZone === 'ALL' || em.zone === filterZone;
    const matchesPriority = filterPriority === 'ALL' || em.priority === filterPriority;
    const matchesStatus = filterStatus === 'ALL' || em.status === filterStatus;
    return matchesSearch && matchesZone && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Priority distribution badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Emergency Incident Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Log and monitor active 911 calls, incident locations, triage priority levels, and dispatch states.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-semibold">
            {emergencies.filter((e) => e.weight === 5).length} Critical
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold">
            {emergencies.filter((e) => e.status === 'Pending').length} Pending
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Emergencies Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filters */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2.5 shadow-xs">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID or Zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Zones</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical (w=5)</option>
              <option value="High">High (w=3)</option>
              <option value="Medium">Medium (w=2)</option>
              <option value="Low">Low (w=1)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Emergency ID</th>
                    <th className="px-4 py-3">Location Zone</th>
                    <th className="px-4 py-3">Triage Priority</th>
                    <th className="px-4 py-3">Weight (w_j)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredEmergencies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                        No emergencies recorded for the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEmergencies.map((em) => {
                      const isCritical = em.weight === 5;
                      const isHigh = em.weight === 3;
                      const isMedium = em.weight === 2;

                      return (
                        <tr key={em.em_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isCritical ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                              }`}
                            />
                            {em.em_id}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700/60">
                              {em.zone}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                                  : isHigh
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                                  : isMedium
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {isCritical && <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                              {em.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                isCritical ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              w = {em.weight}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                em.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800/80'
                                  : em.status === 'Dispatched'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-400 dark:border-blue-800/80'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800/80'
                              }`}
                            >
                              {em.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {em.status === 'Pending' && (
                                <button
                                  onClick={() => onUpdateStatus(em.em_id, 'Dispatched')}
                                  className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950/80 dark:hover:bg-blue-900 dark:text-blue-300 dark:border-blue-800 text-[11px] font-semibold transition active:scale-95 flex items-center gap-1 shadow-xs"
                                  title="Mark Dispatched"
                                >
                                  <Send className="w-3 h-3" />
                                  Dispatch
                                </button>
                              )}
                              {em.status !== 'Completed' && (
                                <button
                                  onClick={() => onUpdateStatus(em.em_id, 'Completed')}
                                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-semibold transition active:scale-95 flex items-center gap-1 shadow-xs"
                                  title="Mark Completed"
                                >
                                  <Check className="w-3 h-3" />
                                  Complete
                                </button>
                              )}
                              {em.status === 'Completed' && (
                                <span className="text-[11px] text-slate-400 font-mono">Resolved</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Add Emergency Form */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Plus className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Log New Emergency Call</h3>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Emergency Incident ID:
              </label>
              <input
                type="text"
                placeholder="e.g. E6, EM-06"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Incident Zone:</label>
              <select
                value={newZone}
                onChange={(e) => setNewZone(e.target.value as Zone)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Triage Urgency Level:
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as EmergencyPriority)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Critical">Critical – Level 5 (Cardiac Arrest, Stroke, Major Trauma)</option>
                <option value="High">High – Level 3 (Severe Bleeding, Difficulty Breathing)</option>
                <option value="Medium">Medium – Level 2 (Fractures, Moderate Pain)</option>
                <option value="Low">Low – Level 1 (Minor Injury, Non-Urgent Transport)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="text-slate-800 dark:text-slate-300 font-medium block mb-1">Priority Weighting:</span>
              <p>
                Priority factor: <span className="font-bold text-amber-700 dark:text-amber-300">{newPriority}</span> (multiplier <span className="font-mono text-slate-900 dark:text-white font-bold">{getPriorityWeight(newPriority)}x</span>).
                The optimization solver automatically prioritizes this incident over less urgent calls.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Logging Call...' : 'Log Incident'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
