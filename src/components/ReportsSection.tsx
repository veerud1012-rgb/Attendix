import React, { useState, useMemo } from "react";
import { 
  FileText, Search, Download, Calendar, Filter, RefreshCw, 
  ChevronRight, ArrowUpDown, Table, FileSpreadsheet, Check, CheckCircle,
  Trash2
} from "lucide-react";
import { Employee, AttendanceWithEmployee } from "../types";
import { formatCurrency } from "../dbStore";

interface ReportsSectionProps {
  processedAttendance: AttendanceWithEmployee[];
  employees: Employee[];
  darkMode: boolean;
  onClearAllAttendance?: () => void;
}

export default function ReportsSection({ 
  processedAttendance, 
  employees, 
  darkMode,
  onClearAllAttendance 
}: ReportsSectionProps) {
  // Filter states
  const [selectedEmpId, setSelectedEmpId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overtimeFilter, setOvertimeFilter] = useState<string>("all"); // all, with_ot, no_ot

  // Sort states
  const [sortBy, setSortBy] = useState<"date" | "name" | "salary">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort the attendance lists
  const filteredRecords = useMemo(() => {
    let result = [...processedAttendance];

    // Filter by Employee
    if (selectedEmpId !== "all") {
      result = result.filter((r) => r.employee_id === selectedEmpId);
    }

    // Filter by Date Range
    if (startDate) {
      result = result.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      result = result.filter((r) => r.date <= endDate);
    }

    // Filter by Status
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Filter by Overtime
    if (overtimeFilter === "with_ot") {
      result = result.filter((r) => r.overtime_hours > 0);
    } else if (overtimeFilter === "no_ot") {
      result = result.filter((r) => r.overtime_hours === 0);
    }

    // Sort result
    result.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc" 
          ? a.date.localeCompare(b.date) 
          : b.date.localeCompare(a.date);
      } else if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.employee_name.localeCompare(b.employee_name)
          : b.employee_name.localeCompare(a.employee_name);
      } else if (sortBy === "salary") {
        return sortOrder === "asc"
          ? a.cumulative_salary - b.cumulative_salary
          : b.cumulative_salary - a.cumulative_salary;
      }
      return 0;
    });

    return result;
  }, [processedAttendance, selectedEmpId, startDate, endDate, statusFilter, overtimeFilter, sortBy, sortOrder]);

  // Aggregate stats on filtered subset
  const aggregates = useMemo(() => {
    const totalCount = filteredRecords.length;
    const presentCount = filteredRecords.filter((r) => r.status === "Present").length;
    const presenceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
    
    let totalWages = 0;
    let totalOTWages = 0;
    let totalOTHours = 0;

    filteredRecords.forEach((r) => {
      const dailyContribution = r.status === "Present" ? r.daily_salary : 0;
      totalWages += dailyContribution + r.overtime_earnings;
      totalOTWages += r.overtime_earnings;
      totalOTHours += r.overtime_hours;
    });

    return {
      totalCount,
      presenceRate,
      totalWages: Math.round(totalWages),
      totalOTWages: Math.round(totalOTWages),
      totalOTHours: Math.round(totalOTHours * 10) / 10,
    };
  }, [filteredRecords]);

  // Reset Filters handler
  const handleResetFilters = () => {
    setSelectedEmpId("all");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setOvertimeFilter("all");
  };

  // Toggle sorting
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Export to CSV Handler
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    // Build CSV Content
    const headers = ["S.NO", "Employee ID", "Employee Name", "Date", "Status", "Overtime (Hrs)", "Overtime Earnings (INR)", "Daily Base Salary (INR)", "Cumulative Salary (SOS) (INR)", "Narration"];
    const rows = filteredRecords.map((r, index) => [
      index + 1,
      r.employee_id,
      r.employee_name,
      r.date,
      r.status,
      r.overtime_hours,
      r.overtime_earnings,
      r.status === "Present" ? Math.round(r.daily_salary) : 0,
      Math.round(r.cumulative_salary),
      `"${r.narration.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payroll_Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON Handler
  const handleExportJSON = () => {
    if (filteredRecords.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredRecords, null, 2)
    )}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Payroll_Attendance_Report_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-extrabold font-display leading-none tracking-tight ${darkMode ? "text-white" : "text-slate-800"}`}>
            Financial Intelligence & Reports
          </h2>
          <p className={`text-xs mt-1 ${darkMode ? "text-[#8e97af]" : "text-gray-500"}`}>
            Configure multi-dimensional filters, review aggregates, and compile ledger exports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer ${
              filteredRecords.length === 0
                ? "opacity-35 cursor-not-allowed"
                : darkMode
                ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#3cffb6]" />
            Export CSV (.csv)
          </button>
          
          <button
            id="export-json-btn"
            onClick={handleExportJSON}
            disabled={filteredRecords.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer ${
              filteredRecords.length === 0
                ? "opacity-35 cursor-not-allowed"
                : darkMode
                ? "btn-glow-blue border-none text-white shadow-lg"
                : "bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
            }`}
          >
            <Download className="w-4 h-4 text-[#2bdfff]" />
            Export JSON
          </button>
        </div>
      </div>

      {/* 2. Filter Matrix Panel */}
      <div className={`rounded-[22px] p-6 border ${
        darkMode ? "bg-[#12192d]/65 border-white/12 backdrop-blur-[25px] shadow-lg" : "bg-white border-warm-border shadow-[0_8px_30px_rgba(44,37,32,0.03)]"
      }`}>
        <div className={`flex items-center justify-between mb-5 pb-3 border-b ${
          darkMode ? "border-white/8" : "border-stone-100"
        }`}>
          <div className="flex items-center gap-2.5 text-[#9b5dff]">
            <div className="p-1.5 bg-[#9b5dff]/10 rounded-lg">
              <Filter className="w-4 h-4" />
            </div>
            <h3 className={`text-xs font-black font-display uppercase tracking-wider ${darkMode ? "text-white" : "text-stone-800"}`}>
              Report Filters
            </h3>
          </div>
          <button
            id="reset-filters-btn"
            onClick={handleResetFilters}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all hover:underline cursor-pointer ${
              darkMode ? "text-[#c084fc] hover:text-[#d8b4fe]" : "text-indigo-600 hover:text-indigo-700"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Employee dropdown */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold text-[#8e97af]">Personnel Node</label>
            <select
              id="report-filter-employee"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                darkMode 
                  ? "bg-[#0c0f1d] border-[#8b5cf6]/20 text-white focus:border-[#8b5cf6] focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                  : "bg-stone-50/50 border-warm-border text-stone-900 focus:border-indigo-500 focus:bg-white"
              }`}
            >
              <option value="all" className="bg-[#12192d] text-white">All Workforce (Global)</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id} className="bg-[#12192d] text-white">
                  {emp.employee_name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold text-[#8e97af]">From Date</label>
            <input
              id="report-filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                darkMode 
                  ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white focus:border-[#8b5cf6] focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                  : "bg-stone-50/50 border-warm-border text-stone-900 focus:border-[#8b5cf6] focus:bg-white"
              }`}
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold text-[#8e97af]">To Date</label>
            <input
              id="report-filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                darkMode 
                  ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white focus:border-[#8b5cf6] focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                  : "bg-stone-50/50 border-warm-border text-stone-900 focus:border-[#8b5cf6] focus:bg-white"
              }`}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold text-[#8e97af]">Presence Status</label>
            <select
              id="report-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                darkMode 
                  ? "bg-[#0c0f1d] border-[#8b5cf6]/20 text-white focus:border-[#8b5cf6] focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                  : "bg-stone-50/50 border-warm-border text-stone-900 focus:border-[#8b5cf6] focus:bg-white"
              }`}
            >
              <option value="all" className="bg-[#12192d] text-white">All Statuses</option>
              <option value="Present" className="bg-[#12192d] text-white">Present Only</option>
              <option value="Absent" className="bg-[#12192d] text-white">Absent Only</option>
            </select>
          </div>

          {/* Overtime */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold text-[#8e97af]">Overtime hours</label>
            <select
              id="report-filter-overtime"
              value={overtimeFilter}
              onChange={(e) => setOvertimeFilter(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                darkMode 
                  ? "bg-[#0c0f1d] border-[#8b5cf6]/20 text-white focus:border-[#8b5cf6] focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                  : "bg-stone-50/50 border-warm-border text-stone-900 focus:border-[#8b5cf6] focus:bg-white"
              }`}
            >
              <option value="all" className="bg-[#12192d] text-white">All Hours</option>
              <option value="with_ot" className="bg-[#12192d] text-white">With Overtime (&gt; 0 Hrs)</option>
              <option value="no_ot" className="bg-[#12192d] text-white">Without Overtime (0 Hrs)</option>
            </select>
          </div>

        </div>
      </div>

      {/* 3. Subtotal Aggregates Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className={`p-4.5 rounded-[18px] border transition-all duration-300 hover:border-white/15 ${
          darkMode ? "bg-[#12192d]/45 border-white/8 shadow-md" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <p className="text-[10px] uppercase font-extrabold text-[#8e97af] tracking-wider">Logged Sessions</p>
          <p className={`text-xl font-bold font-mono mt-1 ${darkMode ? "text-white" : "text-slate-800"}`}>
            {aggregates.totalCount} Cycles
          </p>
        </div>

        {/* Metric 2 */}
        <div className={`p-4.5 rounded-[18px] border transition-all duration-300 hover:border-[#00cfff]/30 hover:shadow-[0_0_12px_rgba(0,207,255,0.08)] ${
          darkMode ? "bg-[#12192d]/45 border-white/8 shadow-md" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <p className="text-[10px] uppercase font-extrabold text-[#8e97af] tracking-wider">Aggregate Earned Pay</p>
          <p className="text-xl font-black font-mono mt-1 text-[#2bdfff] drop-shadow-[0_0_6px_rgba(43,223,255,0.25)]">
            {formatCurrency(aggregates.totalWages)}
          </p>
        </div>

        {/* Metric 3 */}
        <div className={`p-4.5 rounded-[18px] border transition-all duration-300 hover:border-[#9b5dff]/30 hover:shadow-[0_0_12px_rgba(155,93,255,0.08)] ${
          darkMode ? "bg-[#12192d]/45 border-white/8 shadow-md" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <p className="text-[10px] uppercase font-extrabold text-[#8e97af] tracking-wider">Overtime Output</p>
          <p className="text-xl font-black font-mono mt-1 text-[#c084fc] drop-shadow-[0_0_6px_rgba(168,85,247,0.25)]">
            {aggregates.totalOTHours} Hours
          </p>
          <span className="text-[9px] text-[#8e97af] font-mono leading-none">Pay: {formatCurrency(aggregates.totalOTWages)}</span>
        </div>

        {/* Metric 4 */}
        <div className={`p-4.5 rounded-[18px] border transition-all duration-300 hover:border-[#00e19a]/30 hover:shadow-[0_0_12px_rgba(0,225,154,0.08)] ${
          darkMode ? "bg-[#12192d]/45 border-white/8 shadow-md" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <p className="text-[10px] uppercase font-extrabold text-[#8e97af] tracking-wider">Average Attendance</p>
          <p className="text-xl font-black font-mono mt-1 text-[#3cffb6] drop-shadow-[0_0_6px_rgba(60,255,182,0.25)]">
            {aggregates.presenceRate}%
          </p>
        </div>

      </div>

      {/* 4. Filtered Ledger Records */}
      <div className={`rounded-[22px] border overflow-hidden shadow-2xl ${
        darkMode ? "bg-[#12192d]/55 border-white/12 backdrop-blur-[35px]" : "bg-white border-warm-border shadow-[0_8px_30px_rgba(44,37,32,0.03)]"
      }`}>
        
        {/* Table Title and Columns */}
        <div className={`px-6 py-5 border-b flex flex-col sm:flex-row gap-3 justify-between sm:items-center ${
          darkMode ? "border-white/10 bg-[#0e1224]/50" : "border-stone-100 bg-stone-50"
        }`}>
          <h4 className={`text-sm font-extrabold font-display leading-none ${darkMode ? "text-white" : "text-stone-900"}`}>
            Ledger Data Sheet
          </h4>
          <div className="flex items-center gap-2">
            {onClearAllAttendance && processedAttendance.length > 0 && (
              <button
                id="clear-all-attendance-reports-btn"
                onClick={onClearAllAttendance}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  darkMode 
                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-[#ff4a7a] border-rose-500/25 hover:border-[#ff4a7a]/50"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All Rows
              </button>
            )}
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
              darkMode 
                ? "bg-[#060816]/65 text-[#8e97af] border-white/8" 
                : "bg-stone-100 text-stone-600 border-stone-200"
            }`}>
              {filteredRecords.length} records match criteria
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs uppercase tracking-wider font-bold font-mono ${
                darkMode ? "bg-[#090c1d]/90 border-b border-white/8 text-slate-400" : "bg-slate-50 border-b border-slate-200 text-slate-500"
              }`}>
                <th className="py-4 px-6">#</th>
                <th className="py-4 px-6 text-center">Employee Image</th>
                <th 
                  className="py-4 px-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleSort("name")}
                >
                  <span className="flex items-center gap-1">
                    Employee Name <ArrowUpDown className="w-3 h-3 text-[#8e97af]" />
                  </span>
                </th>
                <th 
                  className="py-4 px-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleSort("date")}
                >
                  <span className="flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3 text-[#8e97af]" />
                  </span>
                </th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Base Earned</th>
                <th className="py-4 px-6 text-right">OT Hours</th>
                <th className="py-4 px-6 text-right">OT Earned</th>
                <th 
                  className="py-4 px-6 text-right cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleSort("salary")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Cumulative Pay (SOS) <ArrowUpDown className="w-3 h-3 text-[#8e97af]" />
                  </span>
                </th>
                <th className="py-4 px-6">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#8e97af] font-mono">
                    No matching attendance records found. Modify your filters above or add attendance records first.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  const isPresent = item.status === "Present";
                  return (
                    <tr 
                      key={item.attendance_id}
                      className={`transition-all duration-300 relative border-l-4 border-transparent ${
                        isPresent
                          ? darkMode
                            ? "hover:bg-emerald-500/5 hover:border-[#3cffb6] hover:shadow-[0_0_20px_rgba(0,212,138,0.18)] text-slate-300"
                            : "hover:bg-emerald-50/60 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.12)] text-slate-700"
                          : darkMode
                            ? "hover:bg-rose-500/5 hover:border-[#ff4a7a] hover:shadow-[0_0_20px_rgba(255,46,99,0.18)] text-slate-300"
                            : "hover:bg-rose-50/60 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.12)] text-slate-700"
                      }`}
                    >
                    <td className="py-4 px-6 text-[#8e97af] font-mono">{String(index + 1).padStart(2, "0")}</td>
                    <td className="py-4 px-6 text-center">
                      {(() => {
                        const emp = employees.find((e) => e.employee_id === item.employee_id);
                        return emp?.employee_image ? (
                          <img 
                             src={emp.employee_image} 
                             referrerPolicy="no-referrer"
                             className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm mx-auto" 
                             alt="Avatar" 
                           />
                        ) : (
                          <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white bg-gradient-to-tr from-[#6d28ff] to-[#9b5dff] shadow-sm border border-[#9b5dff]/30 mx-auto">
                            {item.employee_name.split(" ").map(n => n[0]).join("")}
                          </div>
                        );
                      })()}
                    </td>
                    <td className={`py-4 px-6 font-bold font-display ${darkMode ? "text-white" : "text-stone-900"}`}>{item.employee_name}</td>
                    <td className={`py-4 px-6 font-semibold font-mono ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{item.date}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border leading-none ${
                        item.status === "Present"
                          ? darkMode
                            ? "bg-emerald-500/10 text-[#3cffb6] border-emerald-500/20"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : darkMode
                            ? "bg-rose-500/10 text-[#ff4a7a] border-rose-500/20"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-mono font-semibold ${darkMode ? "text-[#3cffb6]" : "text-emerald-700"}`}>
                      {item.status === "Present" ? formatCurrency(item.daily_salary) : "₹0"}
                    </td>
                    <td className={`py-4 px-6 text-right font-mono font-semibold ${darkMode ? "text-[#8e97af]" : "text-slate-600"}`}>
                      {item.overtime_hours > 0 ? `${item.overtime_hours}.0h` : "-"}
                    </td>
                    <td className={`py-4 px-6 text-right font-mono font-semibold ${darkMode ? "text-[#c084fc]" : "text-purple-700"}`}>
                      {item.overtime_earnings > 0 ? formatCurrency(item.overtime_earnings) : "-"}
                    </td>
                    <td className={`py-4 px-6 text-right font-mono font-extrabold ${darkMode ? "text-[#2bdfff] drop-shadow-[0_0_6px_rgba(43,223,255,0.3)]" : "text-cyan-700"}`}>
                      {formatCurrency(item.cumulative_salary)}
                    </td>
                    <td className={`py-4 px-6 max-w-xs truncate italic ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {item.narration || "Regular Shift"}
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
  );
}
