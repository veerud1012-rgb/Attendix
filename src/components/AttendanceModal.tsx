import React, { useState, useEffect } from "react";
import { X, Calendar, ClipboardCheck, Clock, AlignLeft, AlertTriangle } from "lucide-react";
import { Employee, Attendance } from "../types";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (attendance: Omit<Attendance, "attendance_id" | "created_at">) => void;
  employees: Employee[];
  existingAttendance: Attendance[];
  darkMode: boolean;
  editingRecord?: Attendance | null;
}

const standardRemarks = [
  "Normal Shift",
  "Late Arrival",
  "Half Shift",
  "Site Visit",
  "Holiday Duty",
  "Extra Work",
  "Night Shift",
  "Remote Duty",
];

export default function AttendanceModal({
  isOpen,
  onClose,
  onSave,
  employees,
  existingAttendance,
  darkMode,
  editingRecord,
}: AttendanceModalProps) {
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [date, setDate] = useState(() => {
    return new Date().toISOString().split("T")[0]; // Default to YYYY-MM-DD
  });
  const [status, setStatus] = useState<"Present" | "Absent">("Present");
  const [overtimeHours, setOvertimeHours] = useState("0");
  const [narration, setNarration] = useState("Normal Shift");
  const [error, setError] = useState("");

  // Populate form fields if editing, or reset them if adding a new record
  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setSelectedEmpId(editingRecord.employee_id);
        setDate(editingRecord.date);
        setStatus(editingRecord.status);
        setOvertimeHours(String(editingRecord.overtime_hours));
        setNarration(editingRecord.narration);
        setError("");
      } else {
        if (employees.length > 0) {
          setSelectedEmpId(employees[0].employee_id);
        } else {
          setSelectedEmpId("");
        }
        setDate(new Date().toISOString().split("T")[0]);
        setStatus("Present");
        setOvertimeHours("0");
        setNarration("Normal Shift");
        setError("");
      }
    }
  }, [isOpen, editingRecord, employees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedEmpId) {
      setError("Please select a registered employee first.");
      return;
    }

    if (!date) {
      setError("Please select a valid date.");
      return;
    }

    // Check for duplicate attendance prevention (same employee, same date)
    const isDuplicate = existingAttendance.some(
      (att) => att.employee_id === selectedEmpId && att.date === date && (!editingRecord || att.attendance_id !== editingRecord.attendance_id)
    );

    if (isDuplicate) {
      const empName = employees.find((emp) => emp.employee_id === selectedEmpId)?.employee_name || "Employee";
      setError(`Attendance record already exists for ${empName} on ${date}. Try editing the existing record instead.`);
      return;
    }

    const otHrs = status === "Present" ? parseFloat(overtimeHours) : 0;
    if (isNaN(otHrs) || otHrs < 0) {
      setError("Overtime hours must be 0 or positive.");
      return;
    }

    onSave({
      employee_id: selectedEmpId,
      date,
      status,
      overtime_hours: otHrs,
      narration: narration.trim() || (status === "Present" ? "Regular attendance" : "Absent log"),
    });

    // Reset some fields
    setOvertimeHours("0");
    setNarration("Normal Shift");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-lg rounded-[22px] overflow-hidden transition-all duration-300 transform scale-100 ${
        darkMode ? "bg-[#12192d]/90 border border-white/12 backdrop-blur-[35px] text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]" : "bg-white text-slate-800 border border-slate-200 shadow-xl"
      }`}>
        
        <div className="h-1.5 w-full bg-gradient-to-r from-[#00cfff] via-[#6d28ff] to-[#4cffbd]" />

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#00cfff]/15 rounded-xl text-[#2bdfff] shadow-[0_0_10px_rgba(0,207,255,0.2)]">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display leading-none tracking-tight">
                {editingRecord ? "Edit Attendance Record" : "Record Daily Attendance"}
              </h3>
              <p className={`text-[11px] mt-1 ${darkMode ? "text-[#8e97af]" : "text-gray-500"}`}>
                {editingRecord ? "Modify daily salary & overtime logs" : "Auto-calculate daily salary & overtime logs"}
              </p>
            </div>
          </div>
          <button 
            id="close-attendance-modal-btn"
            onClick={onClose} 
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              darkMode ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        {employees.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white">No Employees Registered</h4>
              <p className={`text-xs max-w-xs mx-auto mt-2 ${darkMode ? "text-[#8e97af]" : "text-gray-500"}`}>
                Attendance logs must map to an active profile. Please register an employee first.
              </p>
            </div>
            <button
              id="attendance-modal-create-emp-btn"
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2.5 bg-[#6d28ff] hover:bg-[#8b5cf6] text-white text-xs font-bold rounded-full shadow-lg transition duration-200"
            >
              Close and Add Employee First
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Employee Selector */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold tracking-wider uppercase ${
                darkMode ? "text-[#8e97af]" : "text-slate-600"
              }`}>
                Select Employee
              </label>
              <select
                id="attendance-employee-select"
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                  darkMode 
                    ? "bg-[#0c0f1d] border-[#8b5cf6]/25 text-white focus:border-[#8b5cf6] focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                }`}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id} className="bg-[#12192d] text-white">
                    {emp.employee_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold tracking-wider uppercase ${
                darkMode ? "text-[#8e97af]" : "text-slate-600"
              }`}>
                Attendance Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e97af] pointer-events-none" />
                <input
                  id="attendance-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                    darkMode 
                      ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                  }`}
                  required
                />
              </div>
              <p className="text-[10px] text-[#2bdfff] font-mono leading-none">
                Auto-calculated days in current calendar month: {date ? new Date(date.split("-")[0] as any, date.split("-")[1] as any, 0).getDate() : 30} days.
              </p>
            </div>

            {/* Presence Status Toggle */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold tracking-wider uppercase ${
                darkMode ? "text-[#8e97af]" : "text-slate-600"
              }`}>
                Presence Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="attendance-status-present-btn"
                  type="button"
                  onClick={() => setStatus("Present")}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer ${
                    status === "Present"
                      ? darkMode
                        ? "bg-emerald-500/15 border-emerald-500/40 text-[#3cffb6] shadow-[0_0_12px_rgba(0,212,138,0.25)]"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                      : darkMode
                      ? "bg-white/5 border-white/5 text-[#8e97af] hover:bg-white/10"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  🟢 Present
                </button>
                <button
                  id="attendance-status-absent-btn"
                  type="button"
                  onClick={() => {
                    setStatus("Absent");
                    setOvertimeHours("0"); // Auto-reset OT on absent
                    setNarration("Absent Log"); // Preset narration
                  }}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer ${
                    status === "Absent"
                      ? darkMode
                        ? "bg-rose-500/15 border-rose-500/40 text-[#ff4a7a] shadow-[0_0_12px_rgba(255,46,99,0.25)]"
                        : "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                      : darkMode
                      ? "bg-white/5 border-white/5 text-[#8e97af] hover:bg-white/10"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  🔴 Absent
                </button>
              </div>
            </div>

            {/* Overtime (Only shown if Present) */}
            {status === "Present" && (
              <div className="space-y-1.5 animate-slide-up">
                <div className="flex justify-between items-center">
                  <label className={`text-[10px] font-bold tracking-wider uppercase ${
                    darkMode ? "text-[#8e97af]" : "text-slate-600"
                  }`}>
                    Overtime Logged (Hours)
                  </label>
                  <span className="text-[10px] text-[#9b5dff] font-mono font-bold drop-shadow-[0_0_4px_rgba(155,93,255,0.3)]">
                    {(() => {
                      const emp = employees.find((e) => e.employee_id === selectedEmpId);
                      if (emp && emp.overtime_hours_rule > 0) {
                        return `Multiplier: ${emp.overtime_hours_rule}h = ₹${emp.overtime_amount_rule}`;
                      }
                      return "";
                    })()}
                  </span>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e97af]" />
                  <input
                    id="attendance-overtime-input"
                    type="number"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(e.target.value)}
                    placeholder="e.g. 3"
                    min="0"
                    step="0.5"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                      darkMode 
                        ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white placeholder-[#8e97af] focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 focus:bg-white"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Narration */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold tracking-wider uppercase ${
                darkMode ? "text-[#8e97af]" : "text-slate-600"
              }`}>
                Narration / Activity Remarks
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3.5 top-3 w-4 h-4 text-[#8e97af]" />
                <textarea
                  id="attendance-narration-input"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="e.g., Night Shift, Holiday Duty..."
                  rows={2}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                    darkMode 
                      ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white placeholder-[#8e97af] focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 focus:bg-white"
                  }`}
                />
              </div>

              {/* Quick Select Remarks (Chips) */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {standardRemarks.map((rem) => (
                  <button
                    key={rem}
                    type="button"
                    onClick={() => setNarration(rem)}
                    className={`text-[9px] px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer font-bold uppercase tracking-wider ${
                      narration === rem
                        ? darkMode
                          ? "bg-indigo-600/20 border-indigo-500/40 text-[#c084fc] shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                          : "bg-indigo-100 border-indigo-300 text-indigo-700"
                        : darkMode
                        ? "bg-white/5 border-white/5 text-[#8e97af] hover:bg-white/10 hover:text-white"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {rem}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                id="cancel-attendance-save-btn"
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  darkMode 
                    ? "bg-[#12192d]/50 hover:bg-[#161f36]/70 text-slate-300 border border-white/8" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                id="save-attendance-btn"
                type="submit"
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  darkMode 
                    ? "btn-glow-blue border-none text-white shadow-lg" 
                    : "bg-gradient-to-r from-brand-blue to-brand-indigo text-white shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {editingRecord ? "Update Record" : "Record Session"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
