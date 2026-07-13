import React from "react";
import { Terminal, ShieldCheck, Database, CalendarDays, RefreshCw } from "lucide-react";
import { ActivityLog } from "../types";

interface ActivityFeedProps {
  logs: ActivityLog[];
  darkMode: boolean;
  onClear: () => void;
}

export default function ActivityFeed({ logs, darkMode, onClear }: ActivityFeedProps) {
  const getBadgeStyle = (type: ActivityLog["type"]) => {
    switch (type) {
      case "success":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "danger":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-brand-indigo/10 text-indigo-400 border-indigo-500/20";
    }
  };

  const getIcon = (action: string) => {
    if (action.includes("Pre-Seeded") || action.includes("Reset")) return Database;
    if (action.includes("Attendance") || action.includes("Logged")) return CalendarDays;
    if (action.includes("Engine") || action.includes("Calculated")) return RefreshCw;
    return ShieldCheck;
  };

  return (
    <div className={`rounded-2xl border p-5 flex flex-col justify-between h-full ${
      darkMode ? "bg-brand-card border-white/5" : "bg-white border-slate-200 shadow-sm"
    }`}>
      
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-500/10">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-purple" />
            <h4 className={`font-semibold font-display ${darkMode ? "text-white" : "text-slate-800"}`}>
              Administrative Activity Log
            </h4>
          </div>
          <button
            id="clear-logs-btn"
            onClick={onClear}
            className="text-[10px] uppercase font-bold text-gray-500 hover:text-rose-500 transition-colors"
          >
            Clear Log
          </button>
        </div>

        {/* Scrollable list */}
        <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">No system logs recorded yet.</p>
          ) : (
            logs.map((log) => {
              const LogIcon = getIcon(log.action);
              return (
                <div key={log.id} className="flex gap-3 text-xs">
                  {/* Icon Bullet */}
                  <div className={`p-1.5 h-7 w-7 rounded-lg border shrink-0 flex items-center justify-center ${getBadgeStyle(log.type)}`}>
                    <LogIcon className="w-3.5 h-3.5" />
                  </div>

                  {/* Log description */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
                        {log.action}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-snug break-words ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {log.details}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer warning */}
      <div className={`mt-5 p-3 rounded-lg border text-[10px] leading-relaxed font-mono ${
        darkMode ? "bg-white/3 border-white/5 text-gray-400" : "bg-slate-50 border-slate-200 text-slate-500"
      }`}>
        🔒 Core security nodes active. All salary changes, overtime records, and employee accounts automatically recalculate balances using the <strong>Smart Payroll Engine v1.2</strong>.
      </div>

    </div>
  );
}
