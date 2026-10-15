import React from 'react';
import {
  LayoutDashboard,
  Ambulance,
  AlertTriangle,
  Cpu,
  Navigation,
  BarChart2,
} from 'lucide-react';

export type TabId = 'dashboard' | 'ambulances' | 'emergencies' | 'optimization' | 'routing' | 'analytics';

interface TabItem {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

interface TabsProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  availableAmbulanceCount: number;
  activeEmergencyCount: number;
  criticalEmergencyCount: number;
}

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onSelectTab,
  availableAmbulanceCount,
  activeEmergencyCount,
  criticalEmergencyCount,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'ambulances',
      label: 'Ambulance Fleet',
      shortLabel: 'Fleet',
      icon: Ambulance,
      badge: `${availableAmbulanceCount} Avail`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
    },
    {
      id: 'emergencies',
      label: 'Emergency Calls',
      shortLabel: 'Calls',
      icon: AlertTriangle,
      badge: criticalEmergencyCount > 0 ? `${criticalEmergencyCount} Crit` : `${activeEmergencyCount}`,
      badgeColor:
        criticalEmergencyCount > 0
          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 font-bold'
          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 'optimization',
      label: 'Optimal Dispatch',
      shortLabel: 'Dispatch',
      icon: Cpu,
    },
    {
      id: 'routing',
      label: 'Route Navigation',
      shortLabel: 'Routing',
      icon: Navigation,
    },
    {
      id: 'analytics',
      label: 'Performance Analytics',
      shortLabel: 'Analytics',
      icon: BarChart2,
    },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 relative ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-xs dark:bg-slate-800/90 dark:text-white dark:border-slate-700/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>
                  <span className="md:inline hidden">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>
                </span>

                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono border ${
                      tab.badgeColor || 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}

                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
