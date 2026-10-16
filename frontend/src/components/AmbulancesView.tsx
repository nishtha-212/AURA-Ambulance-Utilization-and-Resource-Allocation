import React, { useState } from 'react';
import {
  Ambulance,
  Plus,
  Search,
  Shield,
} from 'lucide-react';
import { Ambulance as AmbulanceType, AmbulanceType as AmbType, AmbulanceStatus, Zone } from '../types';
import { ZONES } from '../services/graph';

interface AmbulancesViewProps {
  ambulances: AmbulanceType[];
  onAddAmbulance: (amb: AmbulanceType) => Promise<void>;
  onToggleStatus: (amb_id: string, currentStatus: AmbulanceStatus) => Promise<void>;
  isSubmitting: boolean;
}

export const AmbulancesView: React.FC<AmbulancesViewProps> = ({
  ambulances,
  onAddAmbulance,
  onToggleStatus,
  isSubmitting,
}) => {
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form states
  const [newId, setNewId] = useState('');
  const [newZone, setNewZone] = useState<Zone>('Zone A');
  const [newType, setNewType] = useState<AmbType>('ALS');
  const [newStatus, setNewStatus] = useState<AmbulanceStatus>('Available');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim()) {
      setFormError('Ambulance ID is required.');
      return;
    }

    if (ambulances.some((a) => a.amb_id.toUpperCase() === newId.trim().toUpperCase())) {
      setFormError(`Ambulance with ID "${newId}" already exists.`);
      return;
    }

    setFormError(null);
    try {
      await onAddAmbulance({
        amb_id: newId.trim().toUpperCase(),
        zone: newZone,
        type: newType,
        status: newStatus,
      });
      setNewId('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to add ambulance.');
    }
  };

  const filteredAmbulances = ambulances.filter((a) => {
    if (!a || !a.amb_id) return false;
    const ambId = (a.amb_id || '').toLowerCase();
    const ambZone = (a.zone || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = ambId.includes(query) || ambZone.includes(query);
    const matchesZone = filterZone === 'ALL' || a.zone === filterZone;
    const matchesType = filterType === 'ALL' || a.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    return matchesSearch && matchesZone && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Ambulance className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Ambulance Fleet Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage fleet units, base stations, life-support capabilities, and real-time availability status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 font-semibold">
            {ambulances.filter((a) => a.status === 'Available').length} Available
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-400 font-semibold">
            {ambulances.filter((a) => a.status === 'Busy').length} Busy
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ambulance Table */}
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
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-rose-500"
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="ALS">ALS (Advanced)</option>
              <option value="BLS">BLS (Basic)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Ambulance ID</th>
                    <th className="px-4 py-3">Base Zone</th>
                    <th className="px-4 py-3">Capability</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredAmbulances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                        No ambulances match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAmbulances.map((amb) => {
                      const isAvail = amb.status === 'Available';
                      return (
                        <tr key={amb.amb_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            {amb.amb_id}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700/60">
                              {amb.zone}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                amb.type === 'ALS'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800/70'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800/70'
                              }`}
                            >
                              <Shield className="w-3 h-3" />
                              {amb.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isAvail
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800/80'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-800/80'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvail ? 'bg-emerald-600 dark:bg-emerald-400 animate-pulse' : 'bg-rose-600 dark:bg-rose-500'
                                }`}
                              />
                              {amb.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => onToggleStatus(amb.amb_id, amb.status)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition active:scale-95 ${
                                isAvail
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {isAvail ? 'Set to Busy' : 'Set to Available'}
                            </button>
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

        {/* Right 1 Col: Add Ambulance Form */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Plus className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add New Ambulance</h3>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Ambulance ID:
              </label>
              <input
                type="text"
                placeholder="e.g. A6, AMB-06"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Base Station Zone:</label>
              <select
                value={newZone}
                onChange={(e) => setNewZone(e.target.value as Zone)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              >
                {ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Medical Capability:</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as AmbType)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="ALS">ALS – Advanced Life Support (Paramedic)</option>
                <option value="BLS">BLS – Basic Life Support (EMT)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Availability Status:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as AmbulanceStatus)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="Available">Available (Ready for Dispatch)</option>
                <option value="Busy">Busy (En Route / Out of Service)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Registering...' : 'Add Ambulance'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
