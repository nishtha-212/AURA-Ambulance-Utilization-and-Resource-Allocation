import React from 'react';
import {
  Ambulance,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 shadow-md shadow-rose-500/20 dark:shadow-rose-950/50 border border-rose-400/40">
              <Ambulance className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  <span className="text-rose-600 dark:text-rose-500 font-extrabold tracking-wider">AURA</span>
                  <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
                  <span className="text-slate-800 dark:text-slate-200 hidden sm:inline text-sm md:text-base font-semibold">
                    Ambulance Utilization &amp; Routing Assistant
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Emergency Dispatch Optimization &bull; Shortest-Path City Navigation
              </p>
            </div>
          </div>

          {/* Controls: Reset Sample Data & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System Status Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Ready
            </span>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-amber-400 dark:border-slate-700 transition shadow-2xs flex items-center justify-center"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
