import React, { useState } from "react";
import { X, UserPlus, Shield, IndianRupee, MapPin, Sparkles } from "lucide-react";
import { Employee } from "../types";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Omit<Employee, "employee_id" | "avatar_color" | "created_at">) => void;
  darkMode: boolean;
  initialData?: Employee | null;
}

export default function EmployeeModal({ isOpen, onClose, onSave, darkMode, initialData }: EmployeeModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("2");
  const [overtimeAmount, setOvertimeAmount] = useState("200");
  const [joiningDate, setJoiningDate] = useState(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [error, setError] = useState("");
  const [employeeImage, setEmployeeImage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.employee_name);
      setAddress(initialData.address);
      setMonthlySalary(initialData.monthly_salary.toString());
      setOvertimeHours(initialData.overtime_hours_rule.toString());
      setOvertimeAmount(initialData.overtime_amount_rule.toString());
      setJoiningDate(initialData.joining_date);
      setEmployeeImage(initialData.employee_image || "");
    } else {
      setName("");
      setAddress("");
      setMonthlySalary("");
      setOvertimeHours("2");
      setOvertimeAmount("200");
      setJoiningDate(new Date().toISOString().split("T")[0]);
      setEmployeeImage("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setEmployeeImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("Only image files are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setEmployeeImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("Only image files are supported.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Field Valdiation
    if (!name.trim()) {
      setError("Please provide a valid employee name.");
      return;
    }
    if (!address.trim()) {
      setError("Please provide a residential address.");
      return;
    }
    
    const salary = parseFloat(monthlySalary);
    if (isNaN(salary) || salary <= 0) {
      setError("Monthly salary must be a positive number.");
      return;
    }

    const otHrs = parseFloat(overtimeHours);
    if (isNaN(otHrs) || otHrs <= 0) {
      setError("Overtime Hours setting must be greater than 0.");
      return;
    }

    const otAmt = parseFloat(overtimeAmount);
    if (isNaN(otAmt) || otAmt < 0) {
      setError("Overtime payment rate must be a non-negative number.");
      return;
    }

    // Save and reset
    onSave({
      employee_name: name.trim(),
      address: address.trim(),
      monthly_salary: salary,
      overtime_hours_rule: otHrs,
      overtime_amount_rule: otAmt,
      joining_date: joiningDate,
      employee_image: employeeImage || undefined,
    });

    setName("");
    setAddress("");
    setMonthlySalary("");
    setOvertimeHours("2");
    setOvertimeAmount("200");
    setJoiningDate(new Date().toISOString().split("T")[0]);
    setEmployeeImage("");
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
      <div className={`relative w-full max-w-lg rounded-[22px] overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] transition-all duration-300 transform scale-100 ${
        darkMode ? "bg-[#12192d]/90 border border-white/12 backdrop-blur-[35px] text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]" : "bg-white text-slate-800 border border-slate-200 shadow-xl"
      }`}>
        
        {/* Banner header decoration */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#6d28ff] via-[#00cfff] to-[#4cffbd]" />

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6d28ff]/15 rounded-xl text-[#9b5dff] shadow-[0_0_10px_rgba(155,93,255,0.2)]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display leading-none tracking-tight">
                {initialData ? "Edit Employee" : "Register New Employee"}
              </h3>
              <p className={`text-[11px] mt-1.5 ${darkMode ? "text-[#8e97af]" : "text-gray-500"}`}>
                {initialData ? "Update custom payroll tracking & rules" : "Initialize custom payroll tracking & rules"}
              </p>
            </div>
          </div>
          <button 
            id="close-employee-modal-btn"
            onClick={onClose} 
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              darkMode ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {error && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Employee Image Upload */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold tracking-wider uppercase ${
                darkMode ? "text-[#8e97af]" : "text-slate-600"
              }`}>
                Employee Image
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-3 transition-all duration-200 text-center relative ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-500/10"
                    : employeeImage
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : darkMode
                    ? "border-white/10 bg-[#12192d]/55 hover:border-[#8b5cf6]/40"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-500/40 hover:bg-white"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {employeeImage ? (
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="relative">
                      <img
                        src={employeeImage}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setEmployeeImage("")}
                        className="absolute -top-1 right-[-4px] bg-rose-500 hover:bg-rose-600 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-bold leading-none shadow-md transition-colors"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[9px] text-emerald-600 font-bold">Image selected successfully!</p>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="text-lg">📸</div>
                    <p className={`text-xs font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                      Drag & drop or <span className="text-indigo-600 underline hover:text-indigo-700">click to upload</span>
                    </p>
                    <p className={`text-[9px] ${darkMode ? "text-[#8e97af]" : "text-slate-400"}`}>
                      Supports PNG, JPG, JPEG (Max 1MB)
                    </p>
                  </label>
                )}
              </div>
            </div>

            {/* Side-by-side Name & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee Name */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold tracking-wider uppercase ${
                  darkMode ? "text-[#8e97af]" : "text-slate-600"
                }`}>
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    👤
                  </span>
                  <input
                    id="employee-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                      darkMode 
                        ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white placeholder-[#8e97af] focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 focus:bg-white"
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold tracking-wider uppercase ${
                  darkMode ? "text-[#8e97af]" : "text-slate-600"
                }`}>
                  Residential Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e97af]" />
                  <input
                    id="employee-address-input"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Delhi, India"
                    className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                      darkMode 
                        ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white placeholder-[#8e97af] focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 focus:bg-white"
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Side-by-side Joining Date & Monthly Salary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Joining Date */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold tracking-wider uppercase ${
                  darkMode ? "text-[#8e97af]" : "text-slate-600"
                }`}>
                  Joining Date
                </label>
                <input
                  id="employee-joining-date-input"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                    darkMode 
                      ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                  }`}
                  required
                />
              </div>

              {/* Base Salary */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold tracking-wider uppercase ${
                  darkMode ? "text-[#8e97af]" : "text-slate-600"
                }`}>
                  Monthly Salary (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e97af]" />
                  <input
                    id="employee-salary-input"
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="30000"
                    min="0"
                    className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border focus:outline-none transition-all duration-300 ${
                      darkMode 
                        ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white placeholder-[#8e97af] focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 focus:bg-white"
                    }`}
                    required
                  />
                </div>
                <p className="text-[9px] text-[#2bdfff] font-medium leading-tight font-mono">
                  Daily wage: Approx ₹{monthlySalary ? Math.round(Number(monthlySalary) / 30) : 0}/day.
                </p>
              </div>
            </div>

            {/* Overtime Settings Rule */}
            <div className={`p-3.5 rounded-[18px] border space-y-2.5 ${
              darkMode ? "bg-[#12192d]/45 border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-1.5 text-[#c084fc] drop-shadow-[0_0_4px_rgba(168,85,247,0.4)]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider">Overtime Compensation Matrix</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-[#8e97af]">Target Hours</label>
                  <input
                    id="employee-ot-hours-input"
                    type="number"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(e.target.value)}
                    placeholder="2"
                    min="0.5"
                    step="0.5"
                    className={`w-full px-2.5 py-1 rounded-lg text-xs border focus:outline-none transition-all ${
                      darkMode 
                        ? "bg-[#060816] border-white/10 text-white focus:border-[#9b5dff]" 
                        : "bg-white border-slate-200 text-slate-800 focus:border-[#9b5dff]"
                    }`}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-[#8e97af]">Payout Rate (₹)</label>
                  <input
                    id="employee-ot-amount-input"
                    type="number"
                    value={overtimeAmount}
                    onChange={(e) => setOvertimeAmount(e.target.value)}
                    placeholder="200"
                    min="0"
                    className={`w-full px-2.5 py-1 rounded-lg text-xs border focus:outline-none transition-all ${
                      darkMode 
                        ? "bg-[#060816] border-white/10 text-white focus:border-[#9b5dff]" 
                        : "bg-white border-slate-200 text-slate-800 focus:border-[#9b5dff]"
                    }`}
                    required
                  />
                </div>
              </div>
              
              <p className={`text-[9.5px] leading-relaxed ${darkMode ? "text-[#b9c2d9]" : "text-gray-500"}`}>
                Every completed <strong className="text-[#9b5dff]">{overtimeHours} hours</strong> of registered overtime triggers a compensation of <strong className="text-[#9b5dff]">₹{overtimeAmount}</strong>. Lesser ratios pay proportionately.
              </p>
            </div>
          </div>

          {/* Action buttons (pinned at bottom) */}
          <div className={`px-6 py-4.5 border-t flex justify-end gap-3 flex-shrink-0 ${
            darkMode ? "bg-[#0d1222]/80 border-white/8" : "bg-slate-50 border-slate-100"
          }`}>
            <button
              id="cancel-employee-save-btn"
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
              id="save-employee-btn"
              type="submit"
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                darkMode 
                  ? "btn-glow-purple border-none text-white shadow-lg" 
                  : "bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              Save Employee Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
