import React from "react";
import { User, MapPin, Calendar, IndianRupee, Clock, ArrowLeft, Trash2, CalendarDays, Percent } from "lucide-react";
import { Employee, AttendanceWithEmployee } from "../types";
import { formatCurrency } from "../dbStore";

interface EmployeeProfileViewProps {
  employee: Employee;
  processedAttendance: AttendanceWithEmployee[];
  onBack: () => void;
  onDeleteAttendance: (attId: string) => void;
  handleInlineOvertimeUpdate: (attId: string, hours: number, earnings?: number) => void;
  onEditEmployee: (employee: Employee) => void;
  darkMode: boolean;
}

export default function EmployeeProfileView({
  employee,
  processedAttendance,
  onBack,
  onDeleteAttendance,
  handleInlineOvertimeUpdate,
  onEditEmployee,
  darkMode,
}: EmployeeProfileViewProps) {
  // Filter attendance records specifically for this employee
  const empAttendance = processedAttendance.filter((a) => a.employee_id === employee.employee_id)
    .sort((a, b) => b.date.localeCompare(a.date)); // reverse chronological

  // Calculations
  const totalPresent = empAttendance.filter((a) => a.status === "Present").length;
  const totalAbsent = empAttendance.filter((a) => a.status === "Absent").length;
  const totalDays = empAttendance.length || 1;
  const presentRate = Math.round((totalPresent / totalDays) * 100);

  const totalOvertimeHours = empAttendance.reduce((acc, a) => acc + a.overtime_hours, 0);
  const totalOvertimeEarnings = empAttendance.reduce((acc, a) => acc + a.overtime_earnings, 0);

  // Latest cumulative salary recorded is their current earned balance
  const currentEarnedSalary = empAttendance.length > 0 
    ? empAttendance[0].cumulative_salary 
    : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          id="profile-back-btn"
          onClick={onBack}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
            darkMode 
              ? "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
              : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <span className="text-[11px] font-mono uppercase text-slate-500 font-bold">
          Personnel Folder // {employee.employee_id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Avatar and Info Card - Optimized to split horizontally into 2 containers on mobile/tablet */}
        <div className={`col-span-1 lg:col-span-4 rounded-3xl p-5 sm:p-6 border shadow-2xl ${
          darkMode ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-white border-warm-border shadow-[0_8px_30px_rgba(44,37,32,0.03)]"
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 sm:gap-6 items-stretch">
            
            {/* Left Container: Avatar Block */}
            <div className={`flex flex-col items-center justify-center text-center p-4 sm:p-6 rounded-2xl border ${
              darkMode ? "bg-white/2 border-white/5" : "bg-slate-50/50 border-slate-100"
            }`}>
              <div className="relative">
                {employee.employee_image ? (
                  <img 
                    src={employee.employee_image} 
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-indigo-200/50 shadow-lg"
                    alt="Avatar" 
                  />
                ) : (
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-3xl sm:text-4xl font-bold font-display shadow-lg ${employee.avatar_color}`}>
                    {employee.employee_name.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-white px-1.5 py-0.5 rounded-lg text-[9px] font-mono uppercase tracking-wider border border-white/10 font-bold shadow-sm">
                  Active
                </div>
              </div>
              <h3 className={`text-lg sm:text-xl font-bold font-display mt-4 leading-none ${darkMode ? "text-white" : "text-slate-800"}`}>
                {employee.employee_name}
              </h3>
              <p className="text-xs font-mono text-brand-blue mt-1.5">{employee.employee_id}</p>
            </div>

            {/* Right Container: Details, Balance & Actions */}
            <div className="flex flex-col justify-between space-y-4">
              
              {/* Core details list */}
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-xs flex items-center gap-1.5 shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <MapPin className="w-3.5 h-3.5" /> Address:
                  </span>
                  <span className={`font-medium text-right text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none ${darkMode ? "text-white" : "text-slate-800"}`} title={employee.address}>
                    {employee.address}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={`text-xs flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <Calendar className="w-3.5 h-3.5" /> Enrolled:
                  </span>
                  <span className={`font-mono text-xs ${darkMode ? "text-white" : "text-slate-800"}`}>{employee.joining_date}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={`text-xs flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <IndianRupee className="w-3.5 h-3.5" /> Base Pay:
                  </span>
                  <span className="font-bold text-brand-indigo font-mono text-xs sm:text-sm">{formatCurrency(employee.monthly_salary)}/mo</span>
                </div>

                <div className="flex justify-between items-start">
                  <span className={`text-xs flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <Clock className="w-3.5 h-3.5" /> Overtime Matrix:
                  </span>
                  <div className="text-right">
                    <span className={`font-semibold font-mono text-xs ${darkMode ? "text-white" : "text-slate-800"}`}>
                      {employee.overtime_hours_rule} Hrs = {formatCurrency(employee.overtime_amount_rule)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Balance & Edit button */}
              <div className="space-y-3 pt-2 sm:pt-0">
                <div className={`p-3 rounded-xl text-center border ${
                  darkMode ? "bg-white/5 border-white/5" : "bg-indigo-50 border-indigo-100"
                }`}>
                  <p className={`text-[9px] uppercase font-bold tracking-wider ${darkMode ? "text-gray-400" : "text-indigo-600"}`}>
                    Current Earned Balance
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono text-gradient bg-gradient-to-r from-brand-indigo to-brand-blue mt-0.5">
                    {formatCurrency(currentEarnedSalary)}
                  </p>
                  <span className="text-[8px] text-gray-500 block mt-0.5">Base + Overtime Salary</span>
                </div>

                <button
                  onClick={() => onEditEmployee(employee)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    darkMode
                      ? "bg-[#6d28ff]/20 text-[#c084fc] hover:bg-[#6d28ff]/30 border border-[#8b5cf6]/30"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  Edit Profile Details
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Right Side: Analytical Grids and Personal Logs */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          
          {/* Internal Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Stat 1 */}
            <div className={`p-4 rounded-xl border text-center ${
              darkMode ? "bg-brand-card border-white/5" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <CalendarDays className="w-4 h-4 mx-auto text-emerald-400 mb-1.5" />
              <p className={`text-[10px] uppercase font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Present Days</p>
              <p className={`text-lg font-bold font-mono mt-1 ${darkMode ? "text-white" : "text-slate-800"}`}>{totalPresent} Days</p>
            </div>

            {/* Stat 2 */}
            <div className={`p-4 rounded-xl border text-center ${
              darkMode ? "bg-brand-card border-white/5" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <CalendarDays className="w-4 h-4 mx-auto text-rose-400 mb-1.5" />
              <p className={`text-[10px] uppercase font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Absent Days</p>
              <p className={`text-lg font-bold font-mono mt-1 ${darkMode ? "text-white" : "text-slate-800"}`}>{totalAbsent} Days</p>
            </div>

            {/* Stat 3 */}
            <div className={`p-4 rounded-xl border text-center ${
              darkMode ? "bg-brand-card border-white/5" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <Percent className="w-4 h-4 mx-auto text-brand-blue mb-1.5" />
              <p className={`text-[10px] uppercase font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Presence rate</p>
              <p className={`text-lg font-bold font-mono mt-1 text-brand-blue`}>{presentRate}%</p>
            </div>

            {/* Stat 4 */}
            <div className={`p-4 rounded-xl border text-center ${
              darkMode ? "bg-brand-card border-white/5" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <Clock className="w-4 h-4 mx-auto text-brand-purple mb-1.5" />
              <p className={`text-[10px] uppercase font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overtime Pay</p>
              <p className={`text-lg font-bold font-mono mt-1 text-brand-purple`}>{formatCurrency(totalOvertimeEarnings)}</p>
              <span className="text-[8px] font-mono text-gray-500">{totalOvertimeHours} hrs logged</span>
            </div>

          </div>

          {/* Detailed ledger table */}
          <div className={`rounded-3xl border overflow-hidden shadow-2xl ${
            darkMode ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-white border-warm-border shadow-[0_8px_30px_rgba(44,37,32,0.03)]"
          }`}>
            <div className={`px-6 py-5 border-b flex justify-between items-center ${
              darkMode ? "border-white/10 bg-black/20" : "border-stone-100 bg-stone-50"
            }`}>
              <h4 className={`text-base font-bold font-display ${darkMode ? "text-white" : "text-stone-900"}`}>
                Historical Attendance Ledger
              </h4>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
                darkMode 
                  ? "bg-white/5 text-slate-400 border-white/5" 
                  : "bg-stone-100 text-stone-600 border-stone-200"
              }`}>
                {empAttendance.length} records found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-xs uppercase tracking-wider font-bold font-mono ${
                    darkMode ? "bg-[#0c0c0c] border-b border-white/5 text-slate-500" : "bg-slate-50 border-b border-slate-200 text-slate-500"
                  }`}>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Overtime</th>
                    <th className="py-4 px-6">Daily Wage</th>
                    <th className="py-4 px-6">Cumulative Sum (SOS)</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {empAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-gray-500 font-mono">
                        No attendance records logged for this employee yet.
                      </td>
                    </tr>
                  ) : (
                    empAttendance.map((item) => (
                      <tr 
                        key={item.attendance_id}
                        className={`transition-colors ${
                          darkMode ? "hover:bg-white/5 text-slate-300" : "hover:bg-slate-50/50 text-slate-700"
                        }`}
                      >
                        <td className={`py-4 px-6 font-semibold font-mono whitespace-nowrap ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                          <div>{item.date.split('-').reverse().join('-')}</div>
                          {(item.updated_at || item.created_at) && (
                            <div className={`text-[10px] mt-0.5 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>
                              {new Date(item.updated_at || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${
                            item.status === "Present"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className={`py-4 px-6 font-mono font-bold ${darkMode ? "text-purple-400" : "text-purple-600"}`}>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number"
                              min="0"
                              step="1"
                              value={item.overtime_hours}
                              onChange={(e) => handleInlineOvertimeUpdate(item.attendance_id, parseFloat(e.target.value) || 0, item.overtime_earnings)}
                              className={`w-12 px-1 py-0.5 text-center rounded-md text-[11px] border shadow-sm outline-none transition-all ${
                                darkMode 
                                  ? "bg-[#1e293b] border-slate-700 text-[#c084fc] focus:border-[#c084fc]" 
                                  : "bg-white border-slate-200 text-purple-700 focus:border-purple-500"
                              }`}
                            />
                            <span className="text-[#8e97af] font-medium text-[10px]">=</span>
                            <input 
                              type="number"
                              min="0"
                              step="1"
                              value={item.overtime_earnings}
                              onChange={(e) => handleInlineOvertimeUpdate(item.attendance_id, item.overtime_hours, e.target.value ? parseFloat(e.target.value) : undefined)}
                              className={`w-16 px-1 py-0.5 text-center rounded-md text-[11px] border shadow-sm outline-none transition-all ${
                                darkMode 
                                  ? "bg-[#1e293b] border-slate-700 text-[#b9c2d9] focus:border-[#b9c2d9]" 
                                  : "bg-white border-slate-200 text-slate-700 focus:border-slate-400"
                              }`}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-emerald-400 font-semibold">
                          {item.status === "Present" ? formatCurrency(item.daily_salary) : "₹0"}
                        </td>
                        <td className="py-4 px-6 font-mono text-white font-extrabold">
                          {formatCurrency(item.cumulative_salary)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            id={`delete-att-btn-${item.attendance_id}`}
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this attendance record? This will instantly trigger a full salary recalculation.")) {
                                onDeleteAttendance(item.attendance_id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete this record & recalculate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
