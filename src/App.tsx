import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, ClipboardCheck, Search, Database, Users, 
  Trash2, RefreshCw, Eye, BookOpen, HelpCircle, Activity,
  Info, CheckCircle, Sliders, CalendarClock,
  LayoutGrid, Grid, Briefcase, LineChart, FileText, Settings, LogOut, FileCheck,
  CalendarDays, Edit
} from "lucide-react";

import { dbStore, processAttendance, formatCurrency } from "./dbStore";
import { Employee, Attendance, AttendanceWithEmployee, ActivityLog } from "./types";

import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import AnalyticsCharts from "./components/AnalyticsCharts";
import EmployeeModal from "./components/EmployeeModal";
import AttendanceModal from "./components/AttendanceModal";
import EmployeeProfileView from "./components/EmployeeProfileView";
import ReportsSection from "./components/ReportsSection";
import AttendanceHistory from "./components/AttendanceHistory";

const avatarColors = [
  "bg-indigo-500",
  "bg-fuchsia-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-violet-500",
  "bg-teal-500",
];

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Database States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Navigation and active view states
  const [activeTab, setActiveTab] = useState<"operations" | "reports" | "analytics" | "history">("operations");
  const [subTab, setSubTab] = useState<"attendance" | "employees">("attendance");
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState<Employee | null>(null);

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<Attendance | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Global Search
  const [searchQuery, setSearchQuery] = useState("");
  
  // Doc accordion state
  const [isDocOpen, setIsDocOpen] = useState(false);

  // User details
  const userEmail = "veer.ud.1012@gmail.com";

  // Initialize DB on mount
  useEffect(() => {
    setEmployees(dbStore.getEmployees());
    setAttendance(dbStore.getAttendance());
    setLogs(dbStore.getLogs());
  }, []);

  // Synchronize Dark Mode class to document body
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [darkMode]);

  // Derived Processed Attendance list (Calculating dynamic cumulative SOS)
  const processedAttendance = useMemo(() => {
    return processAttendance(attendance, employees);
  }, [attendance, employees]);

  // Derived Dashboard statistics
  const dashboardStats = useMemo(() => {
    return dbStore.getDashboardSummary(processedAttendance, employees);
  }, [processedAttendance, employees]);

  // Search filter across processed attendance (Name, ID, Date, Address)
  const filteredAttendance = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return processedAttendance;

    return processedAttendance.filter((rec) => {
      const emp = employees.find((e) => e.employee_id === rec.employee_id);
      return (
        rec.employee_name.toLowerCase().includes(query) ||
        rec.employee_id.toLowerCase().includes(query) ||
        rec.date.includes(query) ||
        (emp && emp.address.toLowerCase().includes(query))
      );
    });
  }, [processedAttendance, searchQuery, employees]);

  // Search filter across Employees
  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return employees;

    return employees.filter((emp) => {
      return (
        emp.employee_name.toLowerCase().includes(query) ||
        emp.employee_id.toLowerCase().includes(query) ||
        emp.address.toLowerCase().includes(query)
      );
    });
  }, [employees, searchQuery]);

  // Save new or updated employee profile
  const handleSaveEmployee = (newEmp: Omit<Employee, "employee_id" | "avatar_color" | "created_at">) => {
    if (editingEmployee) {
      const updatedEmployees = employees.map((emp) => {
        if (emp.employee_id === editingEmployee.employee_id) {
          return {
            ...emp,
            ...newEmp,
          };
        }
        return emp;
      });
      setEmployees(updatedEmployees);
      dbStore.saveEmployees(updatedEmployees);

      if (selectedEmployeeProfile && selectedEmployeeProfile.employee_id === editingEmployee.employee_id) {
        setSelectedEmployeeProfile({
          ...selectedEmployeeProfile,
          ...newEmp,
        });
      }

      // Record Action Log
      const logMsg = `Updated Profile [${editingEmployee.employee_id}] for ${newEmp.employee_name}.`;
      dbStore.addLog("Profile Updated", logMsg, "info");
      setLogs(dbStore.getLogs());
      setEditingEmployee(null);
    } else {
      // Generate unique EMP-ID
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const empId = `EMP-${randomNum}`;

      // Select color for avatar
      const colorClass = avatarColors[employees.length % avatarColors.length];

      const finalEmployee: Employee = {
        ...newEmp,
        employee_id: empId,
        avatar_color: colorClass,
        created_at: new Date().toISOString(),
      };

      const updatedEmployees = [...employees, finalEmployee];
      setEmployees(updatedEmployees);
      dbStore.saveEmployees(updatedEmployees);

      // Record Action Log
      const logMsg = `Registered Profile [${empId}] for ${newEmp.employee_name}. Monthly Salary: ${formatCurrency(newEmp.monthly_salary)}`;
      dbStore.addLog("Profile Enrolled", logMsg, "success");
      setLogs(dbStore.getLogs());
    }
  };

  // Save or update daily attendance record
  const handleSaveAttendance = (newAtt: Omit<Attendance, "attendance_id" | "created_at">) => {
    if (editingAttendanceRecord) {
      const updatedAttendance = attendance.map((att) => {
        if (att.attendance_id === editingAttendanceRecord.attendance_id) {
          return {
            ...att,
            ...newAtt,
            updated_at: new Date().toISOString(),
          };
        }
        return att;
      });
      setAttendance(updatedAttendance);
      dbStore.saveAttendance(updatedAttendance);

      const empName = employees.find((e) => e.employee_id === newAtt.employee_id)?.employee_name || "Employee";
      dbStore.addLog("Attendance Updated", `Updated attendance & OT log for ${empName} on ${newAtt.date}.`, "info");
      setLogs(dbStore.getLogs());
      setEditingAttendanceRecord(null);
    } else {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const attId = `ATT-${randomNum}`;

      const finalAttendance: Attendance = {
        ...newAtt,
        attendance_id: attId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedAttendance = [...attendance, finalAttendance];
      setAttendance(updatedAttendance);
      dbStore.saveAttendance(updatedAttendance);

      const empName = employees.find((e) => e.employee_id === newAtt.employee_id)?.employee_name || "Employee";

      // Record Action Log
      const logMsg = `Logged ${newAtt.status} for ${empName} on ${newAtt.date}. Overtime: ${newAtt.overtime_hours}h.`;
      dbStore.addLog("Attendance Recorded", logMsg, "info");
      setLogs(dbStore.getLogs());
    }
  };

  // Delete attendance record (automatically triggers SOS recalculation)
  const handleDeleteAttendance = (attId: string) => {
    const recordToDelete = attendance.find((a) => a.attendance_id === attId);
    if (!recordToDelete) return;

    const updatedAttendance = attendance.filter((a) => a.attendance_id !== attId);
    setAttendance(updatedAttendance);
    dbStore.saveAttendance(updatedAttendance);

    const empName = employees.find((e) => e.employee_id === recordToDelete.employee_id)?.employee_name || "Employee";

    // Log deletion
    dbStore.addLog(
      "Record Deleted",
      `Removed attendance record for ${empName} on ${recordToDelete.date}. Smart Engine recalculated cumulative salaries.`,
      "warning"
    );
    setLogs(dbStore.getLogs());
  };

  // Quick update attendance from table
  const handleQuickAttendance = (attId: string, status: "Present" | "Absent") => {
    const today = new Date().toISOString().split('T')[0];
    const updatedAttendance = attendance.map((att) => {
      if (att.attendance_id === attId) {
        return {
          ...att,
          date: today,
          status: status,
          updated_at: new Date().toISOString(),
        };
      }
      return att;
    });
    setAttendance(updatedAttendance);
    dbStore.saveAttendance(updatedAttendance);
    
    const rec = attendance.find(a => a.attendance_id === attId);
    if (rec) {
      const empName = employees.find((e) => e.employee_id === rec.employee_id)?.employee_name || "Employee";
      dbStore.addLog("Quick Attendance", `Marked ${status} for ${empName} on ${today}.`, "info");
      setLogs(dbStore.getLogs());
    }
  };

  const handleInlineOvertimeUpdate = (attId: string, hours: number, earnings?: number) => {
    const updatedAttendance = attendance.map((att) => {
      if (att.attendance_id === attId) {
        return {
          ...att,
          overtime_hours: hours,
          overtime_earnings: earnings !== undefined ? earnings : att.overtime_earnings,
          updated_at: new Date().toISOString(),
        };
      }
      return att;
    });
    setAttendance(updatedAttendance);
    dbStore.saveAttendance(updatedAttendance);
  };

  // Delete employee profile (removes profile & all related attendance entries)
  const handleDeleteEmployee = (empId: string) => {
    const emp = employees.find((e) => e.employee_id === empId);
    if (!emp) return;

    const updatedEmployees = employees.filter((e) => e.employee_id !== empId);
    const updatedAttendance = attendance.filter((a) => a.employee_id !== empId);

    setEmployees(updatedEmployees);
    setAttendance(updatedAttendance);
    dbStore.saveEmployees(updatedEmployees);
    dbStore.saveAttendance(updatedAttendance);

    if (selectedEmployeeProfile?.employee_id === empId) {
      setSelectedEmployeeProfile(null);
    }

    dbStore.addLog(
      "Profile Terminated",
      `Deleted ${emp.employee_name}'s profile and purged ${updatedAttendance.length - attendance.length} related sessions.`,
      "danger"
    );
    setLogs(dbStore.getLogs());
  };

  // Delete all attendance logs at once
  const handleClearAllAttendance = () => {
    setAttendance([]);
    dbStore.saveAttendance([]);
    dbStore.addLog(
      "Ledger Purged",
      "Successfully cleared all daily check-in and overtime ledger logs.",
      "danger"
    );
    setLogs(dbStore.getLogs());
    setIsClearAllConfirmOpen(false);
  };

  // Full Database Seed / Reset
  const handleResetDatabase = () => {
    if (window.confirm("This will overwrite current data and restore the initial enterprise demo profiles. Continue?")) {
      localStorage.removeItem("sm_employees");
      localStorage.removeItem("sm_attendance");
      localStorage.removeItem("sm_logs");

      setEmployees(dbStore.getEmployees());
      setAttendance(dbStore.getAttendance());
      setSelectedEmployeeProfile(null);

      dbStore.addLog("Database Reset", "Restored initial system mock database with pre-calculated balances.", "warning");
      setLogs(dbStore.getLogs());
    }
  };

  // Clear system activity logs
  const handleClearLogs = () => {
    const initialLog: ActivityLog = {
      id: "LOG-CLR",
      timestamp: new Date().toISOString(),
      action: "Log Purged",
      details: "Audit history cleared by user command.",
      type: "info",
    };
    dbStore.saveLogs([initialLog]);
    setLogs([initialLog]);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 relative overflow-hidden flex ${
      darkMode ? "bg-gradient-to-b from-[#060816] via-[#090c1d] to-[#0e1224] text-stone-200" : "bg-warm-bg text-stone-900"
    }`}>
      
      {/* Immersive UI Background Glows */}
      {darkMode && (
        <>
          <div className="absolute top-[-10%] left-[5%] w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none z-0"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none z-0"></div>
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-[#00d48a]/3 rounded-full blur-[150px] pointer-events-none z-0"></div>
        </>
      )}

      {/* Left Navigation Sidebar */}
      <aside className={`hidden md:flex flex-col items-center justify-between py-6 w-16 border shrink-0 h-[calc(100vh-2rem)] my-4 ml-4 rounded-[22px] sticky top-4 z-30 transition-all ${
        darkMode 
          ? "bg-[#12192d]/55 border-white/8 backdrop-blur-[25px] shadow-[0_15px_45px_rgba(0,0,0,0.55)] shadow-indigo-500/5" 
          : "bg-white border-warm-border shadow-sm"
      }`}>
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo Group */}
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(109,40,255,0.4)] overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          
          {/* Nav Items */}
          <div className="flex flex-col gap-4 mt-4 w-full px-2">
            <button
              id="sidebar-home-btn"
              onClick={() => {
                setActiveTab("operations");
                setSubTab("attendance");
                setSelectedEmployeeProfile(null);
              }}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "operations" && subTab === "attendance" && !selectedEmployeeProfile
                  ? darkMode 
                    ? "bg-[#6d28ff] text-white shadow-[0_0_18px_#8b5cf6] border border-[#9b5dff]/50 hover:scale-105" 
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm font-bold"
                  : darkMode
                    ? "text-white/45 hover:text-white hover:bg-white/5 hover:shadow-[0_0_12px_rgba(0,207,255,0.3)] hover:border-purple-500/30 border border-transparent"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent"
              }`}
              title="Daily Attendance Ledger"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              id="sidebar-workforce-btn"
              onClick={() => {
                setActiveTab("operations");
                setSubTab("employees");
                setSelectedEmployeeProfile(null);
              }}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "operations" && subTab === "employees" && !selectedEmployeeProfile
                  ? darkMode 
                    ? "bg-[#6d28ff] text-white shadow-[0_0_18px_#8b5cf6] border border-[#9b5dff]/50 hover:scale-105" 
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm font-bold"
                  : darkMode
                    ? "text-white/45 hover:text-white hover:bg-white/5 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:border-purple-500/30 border border-transparent"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent"
              }`}
              title="Registered Workforce"
            >
              <Users className="w-4.5 h-4.5" />
            </button>
            <button
              id="sidebar-reports-btn"
              onClick={() => {
                setActiveTab("reports");
                setSelectedEmployeeProfile(null);
              }}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "reports" && !selectedEmployeeProfile
                  ? darkMode 
                    ? "bg-[#6d28ff] text-white shadow-[0_0_18px_#8b5cf6] border border-[#9b5dff]/50 hover:scale-105" 
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm font-bold"
                  : darkMode
                    ? "text-white/45 hover:text-white hover:bg-white/5 hover:shadow-[0_0_12px_rgba(14,165,233,0.3)] hover:border-purple-500/30 border border-transparent"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent"
              }`}
              title="Financial Reports"
            >
              <FileText className="w-4.5 h-4.5" />
            </button>
            <button
              id="sidebar-analytics-btn"
              onClick={() => {
                setActiveTab("analytics");
                setSelectedEmployeeProfile(null);
              }}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "analytics" && !selectedEmployeeProfile
                  ? darkMode 
                    ? "bg-[#6d28ff] text-white shadow-[0_0_18px_#8b5cf6] border border-[#9b5dff]/50 hover:scale-105" 
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm font-bold"
                  : darkMode
                    ? "text-white/45 hover:text-white hover:bg-white/5 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] hover:border-purple-500/30 border border-transparent"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent"
              }`}
              title="Analytics"
            >
              <LineChart className="w-4.5 h-4.5" />
            </button>
            <button
              id="sidebar-history-btn"
              onClick={() => {
                setActiveTab("history");
                setSelectedEmployeeProfile(null);
                setSearchQuery("");
              }}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "history" && !selectedEmployeeProfile
                  ? darkMode 
                    ? "bg-[#6d28ff] text-white shadow-[0_0_18px_#8b5cf6] border border-[#9b5dff]/50 hover:scale-105" 
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm font-bold"
                  : darkMode
                    ? "text-white/45 hover:text-white hover:bg-white/5 hover:shadow-[0_0_12px_rgba(20,184,166,0.3)] hover:border-teal-500/30 border border-transparent"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent"
              }`}
              title="Attendance History"
            >
              <CalendarDays className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Bottom items */}
        <div className="flex flex-col gap-4 w-full px-2">
          <button className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            darkMode
              ? "text-white/45 hover:text-white hover:bg-white/5 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:border-purple-500/30 border border-transparent"
              : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
          }`}>
            <Settings className="w-4.5 h-4.5" />
          </button>
          <button className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            darkMode
              ? "text-white/45 hover:text-white hover:bg-white/5 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:border-purple-500/30 border border-transparent"
              : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
          }`}>
            <HelpCircle className="w-4.5 h-4.5" />
          </button>
          <button className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            darkMode
              ? "text-white/45 hover:text-white hover:bg-white/5 hover:shadow-[0_0_12px_rgba(255,43,94,0.3)] hover:border-rose-500/30 border border-transparent"
              : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
          }`}>
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* 1. Brand Navigation Header */}
        <div className="relative z-10">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} userEmail={userEmail} />
        </div>

        {/* Main Body Stage */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">
        
        {/* If an individual employee folder is open, show the profile sheet and skip stats/tabs */}
        {selectedEmployeeProfile ? (
          <EmployeeProfileView
            employee={selectedEmployeeProfile}
            processedAttendance={processedAttendance}
            onBack={() => setSelectedEmployeeProfile(null)}
            onDeleteAttendance={handleDeleteAttendance}
            handleInlineOvertimeUpdate={handleInlineOvertimeUpdate}
            onEditEmployee={(emp) => {
              setEditingEmployee(emp);
              setIsEmployeeModalOpen(true);
            }}
            darkMode={darkMode}
          />
        ) : (
          <>
            {/* 2. Top Summary Stat Cards */}
            <DashboardStats stats={dashboardStats} darkMode={darkMode} />

            {/* 3. App Feature Navigation Tabs */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-1 border-b ${
              darkMode ? "border-white/5" : "border-stone-200"
            }`}>
              
              {/* Tab Toggles */}
              <div className={`flex md:hidden p-1 rounded-2xl ${
                darkMode ? "bg-white/5 border border-white/5" : "bg-[#EAE6DF]/40 border border-[#EAE6DF]/30"
              }`}>
                <button
                  id="tab-operations-btn"
                  onClick={() => setActiveTab("operations")}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === "operations"
                      ? darkMode
                        ? "bg-[#0b0f24] text-white border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                        : "bg-white text-stone-900 border border-[#eae6df] shadow-sm font-bold"
                      : darkMode 
                        ? "text-gray-400 hover:text-gray-200" 
                        : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Sliders className="w-4 h-4 text-brand-indigo" />
                  Core Operations
                </button>
                <button
                  id="tab-reports-btn"
                  onClick={() => setActiveTab("reports")}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === "reports"
                      ? darkMode
                        ? "bg-[#051322] text-white border border-blue-500/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                        : "bg-white text-stone-900 border border-[#eae6df] shadow-sm font-bold"
                      : darkMode 
                        ? "text-gray-400 hover:text-gray-200" 
                        : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <CalendarClock className="w-4 h-4 text-brand-blue" />
                  Financial Reports
                </button>
                <button
                  id="tab-analytics-btn"
                  onClick={() => setActiveTab("analytics")}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === "analytics"
                      ? darkMode
                        ? "bg-[#140a25] text-white border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "bg-white text-stone-900 border border-[#eae6df] shadow-sm font-bold"
                      : darkMode 
                        ? "text-gray-400 hover:text-gray-200" 
                        : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Activity className="w-4 h-4 text-brand-purple" />
                  Analytics Nodes
                </button>
              </div>

              {/* Toolbar action buttons for active operations tab */}
              {activeTab === "operations" && (
                <div className="flex flex-wrap items-center gap-2.5 w-full">
                  
                  {/* Dynamic search input */}
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e97af]" />
                    <input
                      id="global-search-bar"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        subTab === "attendance"
                          ? "Search check-ins..."
                          : "Search employees..."
                      }
                      className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-full border focus:outline-none transition-all duration-300 ${
                        darkMode
                          ? "bg-[#12192d]/55 border-[#8b5cf6]/20 text-white placeholder-[#8e97af] focus:border-[#8b5cf6] focus:bg-[#161f36]/75 focus:shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 shadow-sm"
                      }`}
                    />
                  </div>

                  {/* Add Employee Button - Violet gradient glow */}
                  <button
                    id="trigger-add-employee-btn"
                    onClick={() => setIsEmployeeModalOpen(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer btn-glow-purple ${darkMode ? "text-white" : "text-[#2f00ff]"}`}
                    style={{ fontSize: '15px' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Employee
                  </button>

                  {/* Add Attendance Button - Cyan gradient glow */}
                  <button
                    id="trigger-add-attendance-btn"
                    onClick={() => setIsAttendanceModalOpen(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer btn-glow-blue ${darkMode ? "text-white" : "text-[#2f00ff]"}`}
                    style={{ fontSize: '15px' }}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Add Attendance
                  </button>

                  {/* DB Reset Button */}
                  <button
                    id="db-reset-btn"
                    onClick={handleResetDatabase}
                    title="Reset to pre-seeded dataset"
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      darkMode
                        ? "bg-[#0a0d24] border-white/5 text-gray-400 hover:text-white hover:border-white/15"
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-sm"
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                </div>
              )}

            </div>

            {/* 4. Tab Contents rendering */}
            <AnimatePresence mode="wait">
            
            {/* Tab: Operations */}
            {activeTab === "operations" && (
              <motion.div
                key="operations"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Main Operations List Grid */}
                <div className="col-span-1 lg:col-span-12 space-y-6">
                  
                  {/* Internal Subtab Switcher */}
                  <div className={`rounded-2xl p-1.5 border flex md:hidden justify-between items-center ${
                    darkMode ? "bg-[#12192d]/50 border-white/8 backdrop-blur-[20px]" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex gap-2">
                      <button
                        id="subtab-attendance-btn"
                        onClick={() => {
                          setSubTab("attendance");
                          setSearchQuery("");
                        }}
                        className={`px-4.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                          subTab === "attendance"
                            ? darkMode
                              ? "bg-brand-blue/15 text-[#2bdfff] border border-[#00cfff]/30 shadow-[0_0_15px_rgba(0,207,255,0.15)]"
                              : "bg-indigo-50 text-indigo-600 border border-indigo-100 font-extrabold shadow-sm"
                            : darkMode
                              ? "text-[#8e97af] hover:text-white"
                              : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        📅 Daily Attendance Logs
                      </button>
                      <button
                        id="subtab-employees-btn"
                        onClick={() => {
                          setSubTab("employees");
                          setSearchQuery("");
                        }}
                        className={`px-4.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                          subTab === "employees"
                            ? darkMode
                              ? "bg-brand-purple/15 text-[#c084fc] border border-[#9b5dff]/30 shadow-[0_0_15px_rgba(155,93,255,0.15)]"
                              : "bg-indigo-50 text-indigo-600 border border-indigo-100 font-extrabold shadow-sm"
                            : darkMode
                              ? "text-[#8e97af] hover:text-white"
                              : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        👥 Registered Workforce ({employees.length})
                      </button>
                    </div>

                    <span className={`hidden sm:inline text-[9px] font-mono font-black tracking-wider px-3 py-1 rounded-lg border ${
                      darkMode 
                        ? "bg-[#00d48a]/10 text-[#3cffb6] border-[#00d48a]/20 shadow-[0_0_12px_rgba(0,212,138,0.15)] animate-pulse" 
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}>
                      SMART ENGINE ACTIVE
                    </span>
                  </div>

                  {/* Subtab 1: Daily Attendance table list */}
                  {subTab === "attendance" ? (
                    <div className={`rounded-3xl border overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-300 ${
                      darkMode ? "bg-[#12192d]/45 border-white/10" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className={`px-6 py-5 border-b flex flex-col sm:flex-row gap-3 justify-between sm:items-center ${
                        darkMode ? "border-white/10 bg-[#161f36]/40" : "border-stone-100 bg-stone-50"
                      }`}>
                        <h3 className={`text-base font-extrabold font-display tracking-tight ${darkMode ? "text-white" : "text-stone-900"}`}>
                          Daily Check-In & Overtime Ledger
                        </h3>
                        <div className="flex items-center gap-2">
                          {attendance.length > 0 && (
                            <button
                              id="clear-all-attendance-btn"
                              onClick={() => setIsClearAllConfirmOpen(true)}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all duration-200 cursor-pointer ${
                                darkMode 
                                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-[#ff4a7a] border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_12px_rgba(255,46,99,0.25)]"
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300"
                              }`}
                              style={{ fontSize: '15px' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete All Rows
                            </button>
                          )}
                          <span 
                            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
                              darkMode 
                                ? "bg-white/5 text-[#b9c2d9] border-white/10" 
                                : "bg-stone-100 text-stone-600 border-stone-200"
                            }`}
                            style={{ fontSize: '15px' }}
                          >
                            {filteredAttendance.length} records mapped
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`text-[10px] uppercase tracking-wider font-extrabold font-mono whitespace-nowrap ${
                              darkMode ? "bg-[#161f36]/75 border-b border-white/10 text-[#8e97af]" : "bg-slate-50 border-b border-slate-200 text-slate-500"
                            }`}>
                              <th className="py-3 px-3">#</th>
                              <th className="py-3 px-3 text-center" style={{ fontSize: '13px' }}>Employee Image</th>
                              <th className="py-3 px-3" style={{ fontSize: '13px' }}>Employee Name</th>
                              <th className="py-3 px-3" style={{ fontSize: '13px', textAlign: 'center' }}>Date</th>
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
                                <td colSpan={9} className="py-16 text-center text-xs text-slate-500 font-mono">
                                  No attendance logs found. Modify search or click <strong>Record Attendance</strong> to begin.
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
                                    <div 
                                      className="mx-auto flex items-center justify-center" 
                                      style={{ 
                                        width: index === 0 ? '50px' : '40px', 
                                        height: index === 0 ? '50px' : '40px' 
                                      }}
                                    >
                                      {(() => {
                                        const emp = employees.find((e) => e.employee_id === rec.employee_id);
                                        return emp?.employee_image ? (
                                          <img 
                                            src={emp.employee_image} 
                                            referrerPolicy="no-referrer"
                                            className="rounded-full object-cover border border-slate-200 shadow-sm w-full h-full" 
                                            alt="Avatar" 
                                          />
                                        ) : (
                                          <div 
                                            className="rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-[#6d28ff] to-[#9b5dff] shadow-sm border border-[#9b5dff]/30 w-full h-full" 
                                            style={{ fontSize: index === 0 ? '12px' : '10px' }}
                                          >
                                            {rec.employee_name.split(" ").map(n => n[0]).join("")}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div>
                                      <button
                                        id={`view-profile-from-table-${rec.attendance_id}`}
                                        onClick={() => {
                                          const emp = employees.find((e) => e.employee_id === rec.employee_id);
                                          if (emp) setSelectedEmployeeProfile(emp);
                                        }}
                                        className={`font-bold hover:underline text-left transition-all ${
                                          darkMode ? "text-white hover:text-[#2bdfff]" : "text-stone-900 hover:text-indigo-600"
                                        }`}
                                        style={{ fontSize: index === 0 ? '17px' : '14px' }}
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
                                        style={{ fontSize: index === 0 ? '15px' : undefined }}
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
                                        style={{ fontSize: index === 0 ? '15px' : undefined }}
                                      />
                                    </div>
                                  </td>
                                  <td 
                                    className={`py-3 px-3 font-mono font-black text-center whitespace-nowrap ${darkMode ? "text-white" : "text-stone-900"}`} 
                                    style={{ fontSize: index === 0 ? '15px' : '14px' }}
                                  >
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
                                        style={{ fontSize: index === 0 ? '12px' : undefined }}
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
                                        style={{ fontSize: index === 0 ? '12px' : undefined }}
                                      >
                                        Absent
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    <div className="flex justify-end items-center gap-2">
                                      <button
                                        id={`edit-attendance-row-btn-${rec.attendance_id}`}
                                        onClick={() => {
                                          setEditingAttendanceRecord(rec);
                                          setIsAttendanceModalOpen(true);
                                        }}
                                        className="flex items-center justify-center rounded-lg text-[#8e97af] hover:text-[#00cfff] hover:bg-[#00cfff]/10 hover:shadow-[0_0_10px_rgba(0,207,255,0.3)] transition-all cursor-pointer"
                                        style={{ 
                                          width: '26px', 
                                          height: '26px', 
                                          fontSize: index === 0 ? '12px' : undefined 
                                        }}
                                        title="Edit Attendance & Overtime"
                                      >
                                        <Edit 
                                          className="w-3.5 h-3.5" 
                                          style={{ fontSize: index === 0 ? '12px' : undefined }}
                                        />
                                      </button>
                                      <button
                                        id={`delete-attendance-row-btn-${rec.attendance_id}`}
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
                        </table>
                      </div>
                    </div>
                  ) : (
                    
                    /* Subtab 2: Registered Personnel cards list */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredEmployees.length === 0 ? (
                        <div className={`col-span-full py-12 text-center rounded-2xl border ${
                          darkMode ? "bg-brand-card border-white/5" : "bg-white border-slate-200"
                        }`}>
                          <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No personnel profiles matched search.</p>
                        </div>
                      ) : (
                        filteredEmployees.map((emp) => {
                          // Compute overall statistics specifically for card view
                          const empAtts = processedAttendance.filter((a) => a.employee_id === emp.employee_id);
                          const earned = empAtts.length > 0 ? empAtts[empAtts.length - 1].cumulative_salary : 0;
                          const presentDays = empAtts.filter((a) => a.status === "Present").length;
                          return (
                            <div
                              key={emp.employee_id}
                              id={`emp-card-${emp.employee_id}`}
                              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                                darkMode 
                                  ? "bg-[#12192d]/55 border-white/10 backdrop-blur-[25px] hover:border-indigo-500/40 hover:bg-[#161f36]/75 hover:shadow-[0_0_20px_rgba(109,40,255,0.25)] shadow-lg" 
                                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                              }`}
                            >
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    {emp.employee_image ? (
                                      <img 
                                        src={emp.employee_image} 
                                        referrerPolicy="no-referrer"
                                        className="w-11 h-11 rounded-xl object-cover border border-[#9b5dff]/30 shadow-md"
                                        alt="Avatar" 
                                      />
                                    ) : (
                                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-tr from-[#6d28ff] to-[#9b5dff] shadow-[0_0_12px_rgba(139,92,246,0.35)] border border-[#9b5dff]/30`}>
                                        {emp.employee_name.split(" ").map(n => n[0]).join("")}
                                      </div>
                                    )}
                                    <div>
                                      <h4 className={`font-bold font-display text-sm leading-tight ${darkMode ? "text-white" : "text-slate-800"}`}>
                                        {emp.employee_name}
                                      </h4>
                                      <span className="text-[10px] font-mono text-[#8e97af]">{emp.employee_id}</span>
                                    </div>
                                  </div>

                                  <button
                                    id={`delete-emp-card-btn-${emp.employee_id}`}
                                    onClick={() => setEmployeeToDelete(emp)}
                                    className="p-1.5 rounded-lg text-[#8e97af] hover:text-[#ff2e63] hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(255,46,99,0.3)] transition-all cursor-pointer"
                                    title="Delete Employee Profile"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs border-y border-white/5 py-3 font-mono">
                                  <div>
                                    <p className="text-[10px] text-[#8e97af] uppercase font-bold tracking-wider">Base Salary</p>
                                    <p className={`font-bold mt-0.5 ${darkMode ? "text-white" : "text-slate-800"}`}>{formatCurrency(emp.monthly_salary)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#8e97af] uppercase font-bold tracking-wider">Overtime Rate</p>
                                    <p className={`font-bold mt-0.5 ${darkMode ? "text-white" : "text-slate-800"}`}>
                                      {emp.overtime_hours_rule}h = {formatCurrency(emp.overtime_amount_rule)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between items-center mt-4">
                                <div className="text-xs">
                                  <span className="text-[10px] uppercase font-bold tracking-wider block text-[#8e97af]">
                                    Earned pay to date
                                  </span>
                                  <span className="text-sm font-extrabold text-[#2bdfff] font-mono drop-shadow-[0_0_4px_rgba(0,207,255,0.25)]">
                                    {formatCurrency(earned)}
                                  </span>
                                </div>
                                <button
                                  id={`view-profile-card-btn-${emp.employee_id}`}
                                  onClick={() => setSelectedEmployeeProfile(emp)}
                                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer hover:scale-105 ${
                                    darkMode
                                      ? "bg-[#6d28ff] hover:bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(109,40,255,0.4)]"
                                      : "bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700"
                                  }`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Folder
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 5. Smart payroll engine documentation block */}
                  <div className={`rounded-[22px] border p-5 ${
                    darkMode ? "bg-[#12192d]/45 border-white/8 backdrop-blur-md" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <button
                      id="doc-accordion-toggle"
                      onClick={() => setIsDocOpen(!isDocOpen)}
                      className="flex items-center justify-between w-full text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5 text-[#2bdfff]" />
                        <div>
                          <h4 className={`font-bold font-display text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>
                            Smart Payroll Calculation Matrix
                          </h4>
                          <p className={`text-[11px] mt-0.5 ${darkMode ? "text-[#b9c2d9]" : "text-gray-500"}`}>
                            Review formulation guidelines & compensation rules
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-[#9b5dff] font-bold">
                        {isDocOpen ? "Collapse [-]" : "Expand [+]"}
                      </span>
                    </button>

                    {isDocOpen && (
                      <div className="mt-5 border-t border-gray-500/10 pt-4 text-xs space-y-4 font-mono leading-relaxed text-[#b9c2d9] animate-slide-up">
                        <div>
                          <p className="font-bold text-[#9b5dff] uppercase text-[10px] tracking-wider">1. Daily Salary Derivation</p>
                          <p className="mt-1">
                            Daily salary is derived by dividing the monthly base salary by the total calendar days of the month of the attendance record.
                          </p>
                          <div className={`p-3 rounded-xl mt-1.5 text-[11px] border ${darkMode ? "bg-[#161f36]/40 border-white/5 text-[#b9c2d9]" : "bg-slate-100 text-slate-700"}`}>
                            Formula: <strong>Daily Wage = Base Monthly Salary / Days In Month</strong>
                            <br />
                            Example: 30,000 / 31 (for July) = ₹967.74 / day present.
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-brand-purple uppercase text-[10px]">2. Overtime Pay Coefficient</p>
                          <p className="mt-1">
                            Overtime wages are calculated proportionately based on the hours rule registered on the employee profile.
                          </p>
                          <div className={`p-2 rounded-lg mt-1 text-[11px] ${darkMode ? "bg-brand-black/50" : "bg-slate-100 text-slate-700"}`}>
                            Formula: <strong>OT Earnings = (Hours Logged / Target Rule Hours) * Rule Payout Rate</strong>
                            <br />
                            Example: 3 Hours Logged on a 2 Hr = ₹200 rule. (3 / 2) * 200 = ₹300 OT reward.
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-brand-blue uppercase text-[10px]">3. SOS (Sum Of Salary) Accumulator</p>
                          <p className="mt-1">
                            SOS calculates the running total of all daily salaries and overtime earnings, arranged in chronological order.
                          </p>
                          <div className={`p-2 rounded-lg mt-1 text-[11px] ${darkMode ? "bg-brand-black/50" : "bg-slate-100 text-slate-700"}`}>
                            Formula: <strong>SOS on Date N = SOS on Date N-1 + Present Daily Wage + OT Earnings</strong>
                            <br />
                            Note: If marked "Absent", base contribution is ₹0, and overtime is disabled. Remaining balance matches the previous entry.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
              </motion.div>
            )}

            {/* Tab: Reports Section */}
            {activeTab === "reports" && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
              <ReportsSection
                processedAttendance={processedAttendance}
                employees={employees}
                darkMode={darkMode}
                onClearAllAttendance={() => setIsClearAllConfirmOpen(true)}
              />
              </motion.div>
            )}

            {/* Tab: Analytics Dashboard Charts */}
            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
              <AnalyticsCharts
                processedAttendance={processedAttendance}
                employees={employees}
                darkMode={darkMode}
              />
              </motion.div>
            )}

            {/* Tab: Attendance History */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
              <AttendanceHistory
                darkMode={darkMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredAttendance={filteredAttendance}
                employees={employees}
                setSelectedEmployeeProfile={setSelectedEmployeeProfile}
                handleQuickAttendance={handleQuickAttendance}
                setEditingAttendanceRecord={setEditingAttendanceRecord}
                setIsAttendanceModalOpen={setIsAttendanceModalOpen}
                handleDeleteAttendance={handleDeleteAttendance}
                handleInlineOvertimeUpdate={handleInlineOvertimeUpdate}
              />
              </motion.div>
            )}
            </AnimatePresence>

          </>
        )}

      </main>

      {/* 5. Modals Area */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        darkMode={darkMode}
        initialData={editingEmployee}
      />

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setEditingAttendanceRecord(null);
        }}
        onSave={handleSaveAttendance}
        employees={employees}
        existingAttendance={attendance}
        darkMode={darkMode}
        editingRecord={editingAttendanceRecord}
      />

      {/* 6. Custom Clear All Confirmation Modal */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsClearAllConfirmOpen(false)}
          />
          
          {/* Content Card */}
          <div className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl overflow-hidden transform scale-100 transition-all duration-300 ${
            darkMode 
              ? "bg-[#161616]/95 border-rose-500/20 text-stone-200" 
              : "bg-white border-stone-200 text-stone-900"
          }`}>
            {/* Visual warning accent glow inside card */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />
            
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  darkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600"
                }`}>
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="clear-all-modal-title" className="text-base font-bold font-display leading-tight">
                    Purge All Attendance Records?
                  </h3>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-rose-500 font-bold mt-0.5">
                    Irreversible Operation
                  </p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${darkMode ? "text-stone-400" : "text-stone-600"}`}>
                Are you absolutely sure you want to delete all daily check-in and overtime ledger entries? 
                This will clear the database entirely and reset all employee earned cumulative salaries back to zero.
              </p>

              <div className={`p-3 rounded-2xl border flex items-start gap-2.5 text-[11px] font-mono leading-tight ${
                darkMode 
                  ? "bg-rose-500/5 border-rose-500/10 text-rose-400" 
                  : "bg-rose-50/50 border-rose-100 text-rose-700"
              }`}>
                <span className="font-bold">⚠️ Notice:</span>
                <span>All registered employee profiles will remain intact, but their calculated payroll logs to date will be permanently deleted.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="confirm-cancel-clear-btn"
                  onClick={() => setIsClearAllConfirmOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    darkMode 
                      ? "bg-white/5 border-white/10 text-stone-300 hover:bg-white/10" 
                      : "bg-[#eae6df]/30 border-stone-200 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  No, Cancel
                </button>
                <button
                  id="confirm-action-clear-btn"
                  onClick={handleClearAllAttendance}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Yes, Clear Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Custom Employee Deletion Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-[#020205]/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all ${
            darkMode 
              ? "bg-[#0b0f24] border-white/5 shadow-rose-500/5 text-stone-200" 
              : "bg-white border-stone-200 text-stone-900"
          }`}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display">Delete Employee Profile?</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Purge operations for {employeeToDelete.employee_name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                This will terminate the profile for <strong className="text-white">{employeeToDelete.employee_name}</strong> ({employeeToDelete.employee_id}) and permanently delete all their daily attendance logs and payroll entries.
              </p>

              <div className={`p-3 rounded-2xl border flex items-start gap-2.5 text-[11px] font-mono leading-tight ${
                darkMode 
                  ? "bg-rose-500/5 border-rose-500/10 text-rose-400" 
                  : "bg-rose-50/50 border-rose-100 text-rose-700"
              }`}>
                <span className="font-bold">⚠️ Warning:</span>
                <span>This action is completely irreversible. Data will be purged instantly from local store.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="cancel-delete-emp-btn"
                  onClick={() => setEmployeeToDelete(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    darkMode 
                      ? "bg-white/5 border-white/10 text-stone-300 hover:bg-white/10" 
                      : "bg-[#eae6df]/30 border-stone-200 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-emp-btn"
                  onClick={() => {
                    handleDeleteEmployee(employeeToDelete.employee_id);
                    setEmployeeToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Yes, Terminate Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global App Footer */}
      <footer className={`py-8 text-center text-[11px] font-mono border-t mt-12 transition-all ${
        darkMode ? "bg-brand-black/40 border-white/5 text-gray-500" : "bg-white border-slate-200 text-slate-400"
      }`}>
        <p>© 2026 ATTENDIX // HR Dashboard Solution.</p>
        <p className="mt-1.5 text-brand-purple">Built for veer.ud.1012@gmail.com</p>
      </footer>

      </div> {/* This closes the Main Panel Content Area */}
    </div>
  );
}
