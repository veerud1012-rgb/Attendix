import React from 'react';
import { formatCurrency } from '../dbStore';
import { AttendanceWithEmployee, Employee } from '../types';

interface AttendanceRecordCardProps {
  rec: AttendanceWithEmployee;
  employees: Employee[];
  darkMode: boolean;
  handleQuickAttendance: (id: string, status: "Present" | "Absent") => void;
  handleInlineOvertimeUpdate: (id: string, hours: number, earnings?: number) => void;
  handleInlineNarrationUpdate: (id: string, narration: string) => void;
  onViewProfile: (empId: string) => void;
}

export const AttendanceRecordCard: React.FC<AttendanceRecordCardProps> = ({ 
  rec, 
  employees, 
  darkMode, 
  handleQuickAttendance, 
  handleInlineOvertimeUpdate, 
  handleInlineNarrationUpdate,
  onViewProfile 
}) => {
  const emp = employees.find((e) => e.employee_id === rec.employee_id);

  return (
    <div className={`p-4 mb-3.5 rounded-2xl border transition-all duration-300 ${
      darkMode 
        ? "bg-slate-900/40 border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]" 
        : "bg-white border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
    }`}>
      <div className="flex justify-between items-center mb-3">
        {/* Left Side: Avatar/Photo & Name Info */}
        <div className="flex items-center gap-2.5">
          {emp?.employee_image ? (
            <img 
              src={emp.employee_image} 
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" 
              alt="Avatar" 
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 text-xs ${emp?.avatar_color || 'bg-indigo-500'}`}>
              {rec.employee_name.split(" ").map(n => n[0]).join("")}
            </div>
          )}
          <div className="text-left">
            <button 
              onClick={() => onViewProfile(rec.employee_id)} 
              className={`font-extrabold text-xs hover:underline block leading-tight text-left ${
                darkMode ? "text-white hover:text-indigo-400" : "text-stone-900 hover:text-indigo-600"
              }`}
            >
              {rec.employee_name}
            </button>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{rec.employee_id}</span>
          </div>
        </div>

        {/* Right Side: Status Badge */}
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border tracking-wider ${
          rec.status === "Present" 
            ? (darkMode ? "bg-emerald-500/10 text-[#3cffb6] border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200") 
            : (darkMode ? "bg-rose-500/10 text-[#ff4a7a] border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200")
        }`}>
          {rec.status}
        </span>
      </div>
      
      <div className={`grid grid-cols-2 gap-2 text-xs mb-3.5 p-2.5 rounded-xl ${
        darkMode ? "bg-white/2" : "bg-slate-50"
      }`}>
        <div>
          <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Date</span> 
          <span className={`font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{rec.date.split('-').reverse().join('-')}</span>
          {(rec.updated_at || rec.created_at) && (
            <span className={`block text-[9px] mt-0.5 font-mono leading-none ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              ⏰ {new Date(rec.updated_at || rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div>
          <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Cumulative</span> 
          <span className="font-bold text-brand-indigo">{formatCurrency(rec.cumulative_salary)}</span>
        </div>
        <div className="col-span-2 pt-1 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-between">
          <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Overtime Hrs</span> 
          <div className="flex items-center gap-1">
            <input 
              type="number" 
              min="0"
              value={rec.overtime_hours} 
              onChange={(e) => handleInlineOvertimeUpdate(rec.attendance_id, parseFloat(e.target.value) || 0, rec.overtime_earnings)} 
              className={`w-10 px-1 py-0.5 text-center border rounded-md text-xs font-bold outline-none transition-all ${
                darkMode ? "bg-[#1e293b] border-slate-700 text-[#c084fc]" : "bg-white border-slate-200 text-purple-700"
              }`}
            />
            <span className="text-slate-500 font-mono text-[10px]">=</span>
            <input 
              type="number" 
              min="0"
              value={rec.overtime_earnings} 
              onChange={(e) => handleInlineOvertimeUpdate(rec.attendance_id, rec.overtime_hours, parseFloat(e.target.value))} 
              className={`w-16 px-1 py-0.5 text-center border rounded-md text-xs font-bold outline-none transition-all ${
                darkMode ? "bg-[#1e293b] border-slate-700 text-[#c084fc]" : "bg-white border-slate-200 text-purple-700"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-200/80 dark:border-white/10 pt-3">
        <div className="text-xs mb-3 flex items-center gap-2 w-full">
          <span className="text-slate-500 font-semibold whitespace-nowrap">Narration:</span> 
          <input 
            type="text"
            placeholder="Regular Shift"
            value={rec.narration || ""}
            onChange={(e) => handleInlineNarrationUpdate(rec.attendance_id, e.target.value)}
            className={`flex-1 min-w-0 px-2 py-1 italic rounded-md text-xs border shadow-sm outline-none transition-all ${
              darkMode 
                ? "bg-[#1e293b] border-slate-700 text-slate-300 focus:border-[#2bdfff] focus:text-white placeholder-slate-600" 
                : "bg-white border-slate-200 text-slate-600 focus:border-indigo-500 focus:text-slate-900 placeholder-slate-400"
            }`}
          />
        </div>
        <div className="flex gap-2.5">
          {/* Present Button with dynamic design and press animation */}
          <button 
            onClick={() => handleQuickAttendance(rec.attendance_id, "Present")} 
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 active:opacity-90 flex items-center justify-center gap-1.5 border shadow-sm ${
              darkMode 
                ? "bg-emerald-500/10 border-emerald-500/30 text-[#3cffb6] hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]" 
                : "bg-emerald-50 hover:bg-[#d1fae5] border-emerald-200 text-emerald-700"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Present
          </button>

          {/* Absent Button with dynamic design and press animation */}
          <button 
            onClick={() => handleQuickAttendance(rec.attendance_id, "Absent")} 
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 active:opacity-90 flex items-center justify-center gap-1.5 border shadow-sm ${
              darkMode 
                ? "bg-rose-500/10 border-rose-500/30 text-[#ff4a7a] hover:bg-rose-500/20 hover:shadow-[0_0_12px_rgba(244,63,94,0.25)]" 
                : "bg-rose-50 hover:bg-[#ffe4e6] border-rose-200 text-rose-700"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Absent
          </button>
        </div>
      </div>
    </div>
  );
};
