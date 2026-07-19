import React from "react";
import { Search, Trash2, Edit } from "lucide-react";
import { Employee, AttendanceWithEmployee } from "../types";
import { formatCurrency } from "../dbStore";
import { AttendanceRecordCard } from "./AttendanceRecordCard";

interface Props {
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredAttendance: AttendanceWithEmployee[];
  employees: Employee[];
  setSelectedEmployeeProfile: (emp: Employee) => void;
  handleQuickAttendance: (attId: string, status: "Present" | "Absent") => void;
  setEditingAttendanceRecord: (rec: AttendanceWithEmployee) => void;
  setIsAttendanceModalOpen: (isOpen: boolean) => void;
  handleDeleteAttendance: (attId: string) => void;
  handleInlineOvertimeUpdate: (attId: string, hours: number, earnings?: number) => void;
}

export default function AttendanceHistory({
  darkMode,
  searchQuery,
  setSearchQuery,
  filteredAttendance,
  employees,
  setSelectedEmployeeProfile,
  handleQuickAttendance,
  setEditingAttendanceRecord,
  setIsAttendanceModalOpen,
  handleDeleteAttendance,
  handleInlineOvertimeUpdate
}: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Bar for history */}
      <div className="flex flex-wrap items-center gap-2.5 w-full">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e97af]" />
          <input
            id="history-search-bar"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search historical attendance data by name, ID, or date..."
            className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-full border focus:outline-none transition-all duration-300 ${
              darkMode
                ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white placeholder-[#8e97af] focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 shadow-sm"
            }`}
          />
        </div>
      </div>

      <div className={`rounded-3xl border overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-300 ${
        darkMode ? "bg-[#12192d]/45 border-white/10" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className={`px-6 py-5 border-b flex flex-col sm:flex-row gap-3 justify-between sm:items-center ${
          darkMode ? "border-white/10 bg-[#161f36]/40" : "border-stone-100 bg-stone-50"
        }`}>
          <h3 className={`text-base font-extrabold font-display tracking-tight ${darkMode ? "text-white" : "text-stone-900"}`}>
            All Past Attendance Data
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
              darkMode 
                ? "bg-white/5 text-[#b9c2d9] border-white/10" 
                : "bg-stone-100 text-stone-600 border-stone-200"
            }`}>
              {filteredAttendance.length} records mapped
            </span>
          </div>
        </div>

        {/* Mobile-responsive Card View */}
        <div className="block sm:hidden p-4 space-y-4">
          {filteredAttendance.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No historical attendance logs found.
            </div>
          ) : (
            filteredAttendance.map((rec) => (
              <AttendanceRecordCard
                key={rec.attendance_id}
                rec={rec}
                employees={employees}
                darkMode={darkMode}
                handleQuickAttendance={handleQuickAttendance}
                handleInlineOvertimeUpdate={handleInlineOvertimeUpdate}
                onViewProfile={(empId) => {
                  const emp = employees.find((e) => e.employee_id === empId);
                  if (emp) setSelectedEmployeeProfile(emp);
                }}
              />
            ))
          )}

          {filteredAttendance.length > 0 && (
            <div className={`p-4 rounded-2xl border mb-6 transition-all duration-300 ${
              darkMode 
                ? "bg-slate-950/70 border-[#8b5cf6]/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]" 
                : "bg-indigo-50/50 border-indigo-100 shadow-[0_4px_12px_rgba(99,102,241,0.03)]"
            }`}>
              <h4 className={`text-[10px] font-extrabold uppercase tracking-widest mb-3.5 flex items-center gap-1.5 ${
                darkMode ? "text-indigo-400" : "text-indigo-800"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Cumulative Summary ({filteredAttendance.length} records)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Total Overtime</span>
                  <span className={`font-mono font-bold ${darkMode ? "text-[#c084fc]" : "text-purple-700"}`}>
                    {filteredAttendance.reduce((sum, r) => sum + (r.overtime_hours || 0), 0)} Hrs
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">OT Earnings</span>
                  <span className={`font-mono font-bold ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                    {formatCurrency(filteredAttendance.reduce((sum, r) => sum + (r.overtime_earnings || 0), 0))}
                  </span>
                </div>
                <div className="col-span-2 pt-2.5 border-t border-dashed border-slate-200/60 dark:border-white/10 flex justify-between items-center">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">Cumulative Sum</span>
                  <span className={`font-mono font-black text-sm ${darkMode ? "text-[#2bdfff]" : "text-indigo-600"}`}>
                    {formatCurrency(filteredAttendance.reduce((sum, r) => {
                      const base = r.status === "Present" ? (r.daily_salary || 0) : 0;
                      const ot = r.overtime_earnings || 0;
                      return sum + base + ot;
                    }, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[10px] uppercase tracking-wider font-extrabold font-mono whitespace-nowrap ${
                darkMode ? "bg-[#161f36]/75 border-b border-white/10 text-[#8e97af]" : "bg-slate-50 border-b border-slate-200 text-slate-500"
              }`}>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3 text-center" style={{ fontSize: '13px' }}>Employee Image</th>
                <th className="py-3 px-3" style={{ fontSize: '13px' }}>Employee Name</th>
                <th className="py-3 px-3" style={{ fontSize: '13px' }}>Date</th>
                <th className="py-3 px-3 text-center" style={{ fontSize: '13px' }}>P/A Status</th>
                <th className="py-3 px-3" style={{ fontSize: '13px' }}>Overtime</th>
                <th className="py-3 px-3 text-center" style={{ fontSize: '13px' }}>Sum Of Salary (SOS)</th>
                <th className="py-3 px-3" style={{ fontSize: '13px' }}>Narration</th>
                <th className="py-3 px-3 text-center" style={{ fontSize: '13px' }}>Attendance</th>
                <th className="py-3 px-3 text-right" style={{ fontSize: '13px' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-xs font-medium">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-xs text-slate-500 font-mono">
                    No historical attendance logs found.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec, index) => {
                  const isPresent = rec.status === "Present";
                  return (
                    <tr
                      key={rec.attendance_id}
                      className={`transition-all duration-300 relative border-l-4 border-transparent ${
                        isPresent
                          ? darkMode
                            ? "hover:bg-emerald-500/5 hover:border-[#3cffb6] hover:shadow-[0_0_20px_rgba(0,212,138,0.18)] text-[#b9c2d9]"
                            : "hover:bg-emerald-50/60 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.12)] text-slate-700"
                          : darkMode
                            ? "hover:bg-rose-500/5 hover:border-[#ff4a7a] hover:shadow-[0_0_20px_rgba(255,46,99,0.18)] text-[#b9c2d9]"
                            : "hover:bg-rose-50/60 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.12)] text-slate-700"
                      }`}
                    >
                    <td className="py-3 px-3 text-[#8e97af] font-mono">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {(() => {
                        const emp = employees.find((e) => e.employee_id === rec.employee_id);
                        return emp?.employee_image ? (
                          <img 
                            src={emp.employee_image} 
                            referrerPolicy="no-referrer"
                            className="rounded-full object-cover border border-slate-200 shadow-sm mx-auto" 
                            style={{ width: '40px', height: '40px' }}
                            alt="Avatar" 
                          />
                        ) : (
                          <div className="rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-[#6d28ff] to-[#9b5dff] shadow-sm border border-[#9b5dff]/30 mx-auto" style={{ fontSize: '10px', width: '40px', height: '40px' }}>
                            {rec.employee_name.split(" ").map(n => n[0]).join("")}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => {
                            const emp = employees.find((e) => e.employee_id === rec.employee_id);
                            if (emp) setSelectedEmployeeProfile(emp);
                          }}
                          className={`font-bold hover:underline text-left transition-all ${
                            darkMode ? "text-white hover:text-[#2bdfff]" : "text-stone-900 hover:text-indigo-600"
                          }`}
                          style={{ fontSize: '14px' }}
                        >
                          {rec.employee_name}
                        </button>
                        <p className="text-[10px] text-[#8e97af] font-mono">{rec.employee_id}</p>
                      </div>
                    </td>
                    <td className={`py-3 px-3 font-semibold font-mono whitespace-nowrap ${darkMode ? "text-[#b9c2d9]" : "text-slate-700"}`} style={{ fontSize: '14px' }}>
                      <div>{rec.date.split('-').reverse().join('-')}</div>
                      {(rec.updated_at || rec.created_at) && (
                        <div className={`text-[10px] mt-0.5 ${darkMode ? "text-[#8e97af]" : "text-slate-500"}`}>
                          {new Date(rec.updated_at || rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-lg font-extrabold uppercase border transition-all duration-300 ${
                        rec.status === "Present"
                          ? darkMode
                            ? "bg-emerald-500/10 text-[#3cffb6] border-emerald-500/30 shadow-[0_0_10px_rgba(0,212,138,0.2)]"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : darkMode
                            ? "bg-rose-500/10 text-[#ff4a7a] border-rose-500/30 shadow-[0_0_10px_rgba(255,46,99,0.2)]"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                      }`} style={{ fontSize: '13px' }}>
                        {rec.status}
                      </span>
                    </td>
                    <td className={`py-3 px-3 font-mono font-bold whitespace-nowrap ${
                      darkMode 
                        ? "text-[#c084fc]" 
                        : "text-purple-700"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="number"
                          min="0"
                          step="1"
                          value={rec.overtime_hours}
                          onChange={(e) => handleInlineOvertimeUpdate(rec.attendance_id, parseFloat(e.target.value) || 0, rec.overtime_earnings)}
                          className={`w-12 px-1 py-0.5 text-center rounded-md text-xs border shadow-sm outline-none transition-all ${
                            darkMode 
                              ? "bg-[#1e293b] border-slate-700 text-[#c084fc] focus:border-[#c084fc]" 
                              : "bg-white border-slate-200 text-purple-700 focus:border-purple-500"
                          }`}
                        />
                        <span className="text-[#8e97af] font-medium text-xs">=</span>
                        <input 
                          type="number"
                          min="0"
                          step="1"
                          value={rec.overtime_earnings}
                          onChange={(e) => handleInlineOvertimeUpdate(rec.attendance_id, rec.overtime_hours, e.target.value ? parseFloat(e.target.value) : undefined)}
                          className={`w-16 px-1 py-0.5 text-center rounded-md text-xs border shadow-sm outline-none transition-all ${
                            darkMode 
                              ? "bg-[#1e293b] border-slate-700 text-[#b9c2d9] focus:border-[#b9c2d9]" 
                              : "bg-white border-slate-200 text-slate-700 focus:border-slate-400"
                          }`}
                        />
                      </div>
                    </td>
                    <td className={`py-3 px-3 font-mono font-black text-center whitespace-nowrap ${darkMode ? "text-white" : "text-stone-900"}`} style={{ fontSize: '14px' }}>
                      {formatCurrency(rec.cumulative_salary)}
                    </td>
                    <td className={`py-3 px-3 italic max-w-[120px] truncate ${darkMode ? "text-[#8e97af]" : "text-slate-600"}`} style={{ fontSize: '13px' }} title={rec.narration || "Regular Shift"}>
                      {rec.narration || "Regular Shift"}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleQuickAttendance(rec.attendance_id, "Present")}
                          className={`px-2 py-1 rounded-md font-bold text-[10px] transition-all duration-200 cursor-pointer active:scale-95 ${
                            darkMode
                              ? "bg-emerald-500/10 text-[#3cffb6] border border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-[0_0_12px_rgba(0,212,138,0.3)]"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleQuickAttendance(rec.attendance_id, "Absent")}
                          className={`px-2 py-1 rounded-md font-bold text-[10px] transition-all duration-200 cursor-pointer active:scale-95 ${
                            darkMode
                              ? "bg-rose-500/10 text-[#ff4a7a] border border-rose-500/20 hover:bg-rose-500/20 hover:shadow-[0_0_12px_rgba(255,46,99,0.3)]"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAttendanceRecord(rec);
                            setIsAttendanceModalOpen(true);
                          }}
                          className="flex items-center justify-center rounded-lg text-[#8e97af] hover:text-[#00cfff] hover:bg-[#00cfff]/10 hover:shadow-[0_0_10px_rgba(0,207,255,0.3)] transition-all cursor-pointer"
                          style={{ width: '26px', height: '26px' }}
                          title="Edit Attendance & Overtime"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttendance(rec.attendance_id)}
                          className="flex items-center justify-center rounded-lg text-[#8e97af] hover:text-[#ff2e63] hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(255,46,99,0.3)] transition-all cursor-pointer"
                          style={{ width: '26px', height: '26px' }}
                          title="Delete & Recalculate Ledger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
            {filteredAttendance.length > 0 && (
              <tfoot className={`border-t-2 font-mono text-xs font-bold ${
                darkMode ? "bg-[#161f36]/40 border-white/10 text-[#8e97af]" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-left font-sans font-extrabold uppercase tracking-wider text-[11px]">
                    Total Summary ({filteredAttendance.length} records)
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mb-1">Total Overtime</div>
                    <div className={`font-black ${darkMode ? "text-[#c084fc]" : "text-purple-700"}`}>
                      {filteredAttendance.reduce((sum, r) => sum + (r.overtime_hours || 0), 0)} Hrs = {formatCurrency(filteredAttendance.reduce((sum, r) => sum + (r.overtime_earnings || 0), 0))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mb-1">Cumulative Sum</div>
                    <div className={`font-black text-sm ${darkMode ? "text-[#2bdfff]" : "text-indigo-600"}`}>
                      {formatCurrency(filteredAttendance.reduce((sum, r) => {
                        const base = r.status === "Present" ? (r.daily_salary || 0) : 0;
                        const ot = r.overtime_earnings || 0;
                        return sum + base + ot;
                      }, 0))}
                    </div>
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right">
                    <span className="text-[10px] text-slate-500">Filtered Payroll: </span>
                    <strong className={darkMode ? "text-white" : "text-stone-900"}>
                      {formatCurrency(filteredAttendance.reduce((sum, r) => {
                        const base = r.status === "Present" ? (r.daily_salary || 0) : 0;
                        const ot = r.overtime_earnings || 0;
                        return sum + base + ot;
                      }, 0))}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
