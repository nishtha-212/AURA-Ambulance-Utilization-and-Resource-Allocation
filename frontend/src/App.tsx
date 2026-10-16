/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Tabs, TabId } from './components/Tabs';
import { DashboardView } from './components/DashboardView';
import { AmbulancesView } from './components/AmbulancesView';
import { EmergenciesView } from './components/EmergenciesView';
import { OptimizationView } from './components/OptimizationView';
import { RoutingView } from './components/RoutingView';
import { AnalyticsView } from './components/AnalyticsView';

import {
  Ambulance,
  Emergency,
  OptimizationResponse,
  RouteResponse,
  AnalyticsResponse,
  AmbulanceStatus,
  EmergencyStatus,
  EmergencyPriority,
} from './types';

import {
  getAmbulances,
  addAmbulance,
  updateAmbulanceStatus,
  getEmergencies,
  addEmergency,
  updateEmergencyStatus,
  optimizeFleet,
  computeRoute,
  getAnalytics,
  resetBackendData,
  DEFAULT_AMBULANCES,
  DEFAULT_EMERGENCIES,
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Theme State: Default to Light Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura-theme');
    if (saved) return saved === 'dark';
    return false; // Default to Light Mode
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aura-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aura-theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Core Data States
  const [ambulances, setAmbulances] = useState<Ambulance[]>(DEFAULT_AMBULANCES);
  const [emergencies, setEmergencies] = useState<Emergency[]>(DEFAULT_EMERGENCIES);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  // Routing preselected pair from Optimization view
  const [selectedRoutePair, setSelectedRoutePair] = useState<{
    startZone: string;
    endZone: string;
    label?: string;
  } | null>(null);

  // Loading States
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Load initial data seamlessly without error banners
  const loadInitialData = useCallback(async () => {
    setIsLoadingFleet(true);
    try {
      const [ambs, ems, anlys] = await Promise.all([
        getAmbulances(),
        getEmergencies(),
        getAnalytics(),
      ]);
      setAmbulances(ambs);
      setEmergencies(ems);
      setAnalytics(anlys);
    } catch {
      // Data is already loaded with prototype defaults
    } finally {
      setIsLoadingFleet(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Toggle Ambulance Status
  const handleToggleAmbulanceStatus = async (amb_id: string, currentStatus: AmbulanceStatus) => {
    const newStatus: AmbulanceStatus = currentStatus === 'Available' ? 'Busy' : 'Available';
    setAmbulances((prev) =>
      prev.map((a) => (a.amb_id === amb_id ? { ...a, status: newStatus } : a))
    );
    try {
      await updateAmbulanceStatus(amb_id, newStatus);
    } catch {
      // Local state is already updated
    }
  };

  // Add Ambulance
  const handleAddAmbulance = async (amb: Ambulance) => {
    const added = await addAmbulance(amb);
    setAmbulances((prev) => {
      if (prev.some((a) => a.amb_id === added.amb_id)) return prev;
      return [...prev, added];
    });
  };

  // Add Emergency
  const handleAddEmergency = async (em: {
    em_id: string;
    zone: string;
    priority: EmergencyPriority;
    weight: number;
  }) => {
    const added = await addEmergency(em);
    setEmergencies((prev) => {
      if (prev.some((e) => e.em_id === added.em_id)) return prev;
      return [...prev, added];
    });
  };

  // Update Emergency Status
  const handleUpdateEmergencyStatus = async (em_id: string, status: EmergencyStatus) => {
    setEmergencies((prev) =>
      prev.map((e) => (e.em_id === em_id ? { ...e, status } : e))
    );
    try {
      await updateEmergencyStatus(em_id, status);
    } catch {
      // Handled locally
    }
  };

  // Execute Optimization
  const handleExecuteOptimization = async (weighted: boolean) => {
    setIsOptimizing(true);
    try {
      const result = await optimizeFleet(weighted);
      setOptimizationResult(result);
      const anlys = await getAnalytics();
      setAnalytics(anlys);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Compute Shortest Path
  const handleComputeRoute = async (startZone: string, endZone: string): Promise<RouteResponse | null> => {
    setIsRouting(true);
    try {
      const result = await computeRoute(startZone, endZone);
      return result;
    } finally {
      setIsRouting(false);
    }
  };

  // Refresh Analytics
  const handleRefreshAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  // Preselect route pair and switch to Routing tab
  const handleSelectRoutePair = (startZone: string, endZone: string, label?: string) => {
    setSelectedRoutePair({ startZone, endZone, label });
    setActiveTab('routing');
  };

  // Quick Action from Dashboard
  const handleQuickOptimize = async () => {
    setActiveTab('optimization');
    await handleExecuteOptimization(true);
  };

  // Reset Operational Fleet and Emergency Queue
  const handleResetData = async () => {
    setIsLoadingFleet(true);
    try {
      await resetBackendData();
      const [ambs, ems, anlys] = await Promise.all([
        getAmbulances(),
        getEmergencies(),
        getAnalytics(),
      ]);
      setAmbulances(ambs);
      setEmergencies(ems);
      setAnalytics(anlys);
      setOptimizationResult(null);
    } catch {
      // Gracefully handled
    } finally {
      setIsLoadingFleet(false);
    }
  };

  // Counts for badges
  const availableAmbulanceCount = ambulances.filter((a) => a.status === 'Available').length;
  const activeEmergencies = emergencies.filter((e) => e.status !== 'Completed');
  const criticalEmergencyCount = activeEmergencies.filter((e) => e.weight === 5).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-rose-500/20 selection:text-rose-900 dark:selection:bg-rose-500/30 dark:selection:text-white">
      {/* Top Header with Brand & Student Project Attribution */}
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onResetData={handleResetData}
        isResetting={isLoadingFleet}
      />

      {/* Tabs Navigation */}
      <Tabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        availableAmbulanceCount={availableAmbulanceCount}
        activeEmergencyCount={activeEmergencies.length}
        criticalEmergencyCount={criticalEmergencyCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            ambulances={ambulances}
            emergencies={emergencies}
            onRunOptimization={handleQuickOptimize}
            isOptimizing={isOptimizing}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onToggleAmbulanceStatus={handleToggleAmbulanceStatus}
          />
        )}

        {activeTab === 'ambulances' && (
          <AmbulancesView
            ambulances={ambulances}
            onAddAmbulance={handleAddAmbulance}
            onToggleStatus={handleToggleAmbulanceStatus}
            isSubmitting={isLoadingFleet}
          />
        )}

        {activeTab === 'emergencies' && (
          <EmergenciesView
            emergencies={emergencies}
            onAddEmergency={handleAddEmergency}
            onUpdateStatus={handleUpdateEmergencyStatus}
            isSubmitting={isLoadingFleet}
          />
        )}

        {activeTab === 'optimization' && (
          <OptimizationView
            optimizationResult={optimizationResult}
            onExecuteOptimization={handleExecuteOptimization}
            isOptimizing={isOptimizing}
            onSelectRoutePair={handleSelectRoutePair}
          />
        )}

        {activeTab === 'routing' && (
          <RoutingView
            onComputeRoute={handleComputeRoute}
            isComputing={isRouting}
            preselectedPair={selectedRoutePair}
            recentAssignments={optimizationResult?.assignments || []}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            analytics={analytics}
            onRefreshAnalytics={handleRefreshAnalytics}
            isLoading={isAnalyticsLoading}
          />
        )}
      </main>

      {/* Project Footer with Student Attribution */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-5 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-200">AURA</span>
            <span>&bull;</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">Operational Research Mini Project</span>
          </div>

          <div className="text-slate-700 dark:text-slate-300 font-medium">
            Project By:{' '}
            <span className="font-bold text-slate-900 dark:text-white">Mannkumar Butani</span>,{' '}
            <span className="font-bold text-slate-900 dark:text-white">Nishtha Ghatiya</span> &amp;{' '}
            <span className="font-bold text-slate-900 dark:text-white">Harsh Savalia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
