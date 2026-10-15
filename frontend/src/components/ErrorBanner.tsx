import React from 'react';
import { AlertTriangle, Terminal, Play, RefreshCw, X } from 'lucide-react';
import { getApiBaseUrl } from '../services/api';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
  onRetry: () => void;
  onEnableSimulation: () => void;
  isSimulated: boolean;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  onRetry,
  onEnableSimulation,
  isSimulated,
}) => {
  if (!error) return null;

  const isNetworkFailure =
    error.toLowerCase().includes('failed to fetch') ||
    error.toLowerCase().includes('networkerror') ||
    error.toLowerCase().includes('offline') ||
    error.toLowerCase().includes('connection refused');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      <div className="rounded-xl bg-rose-50 border border-rose-300 dark:bg-gradient-to-r dark:from-rose-950/80 dark:via-slate-900 dark:to-amber-950/60 dark:border-rose-600/40 p-4 shadow-sm text-slate-800 dark:text-slate-200 transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 shrink-0 border border-rose-200 dark:border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                  {isNetworkFailure ? 'Local FastAPI Server Unreachable' : 'API Request Notification'}
                </h4>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {getApiBaseUrl()}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {isNetworkFailure ? (
                  <>
                    Could not connect to FastAPI at <span className="font-mono font-medium text-rose-700 dark:text-rose-300">{getApiBaseUrl()}</span>.
                    Ensure the backend is running with:{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 dark:bg-slate-950 dark:text-amber-300 font-mono text-xs border border-slate-700 inline-flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-slate-400" /> uvicorn main:app --reload --port 8000
                    </code>{' '}
                    and has CORS middleware enabled (<span className="font-mono text-slate-700 dark:text-slate-400">allow_origins=["*"]</span>).
                  </>
                ) : (
                  error
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {!isSimulated && (
              <button
                onClick={onEnableSimulation}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Switch to Demo Mode
              </button>
            )}
            <button
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
