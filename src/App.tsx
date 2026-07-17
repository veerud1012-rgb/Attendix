import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, ClipboardCheck, Search, Database, Users, 
  Trash2, RefreshCw, Eye, BookOpen, HelpCircle, Activity,
  Info, CheckCircle, Sliders, CalendarClock,
  LayoutGrid, Grid, Briefcase, LineChart, FileText, Settings, LogOut, FileCheck,
  CalendarDays, Edit, Check, X, User as UserIcon, Mail, Lock
} from "lucide-react";

import { dbStore, processAttendance, formatCurrency } from "./dbStore";
import { Employee, Attendance, AttendanceWithEmployee, ActivityLog } from "./types";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { 
  fetchUserEmployees, fetchUserAttendance, fetchUserLogs,
  saveUserEmployee, deleteUserEmployee, saveUserAttendance,
  deleteUserAttendance, saveUserLog, clearUserLogs,
  clearUserAttendance, clearUserEmployees, validateFirestoreConnection
} from "./firebaseDb";

import Header from "./components/Header";
const logo = "https://cdn.phototourl.com/free/2026-07-17-012f8326-edf9-4a6e-a714-050ed57bbe19.png";
import DashboardStats from "./components/DashboardStats";
import AnalyticsCharts from "./components/AnalyticsCharts";
import EmployeeModal from "./components/EmployeeModal";
import AttendanceModal from "./components/AttendanceModal";
import EmployeeProfileView from "./components/EmployeeProfileView";
import ReportsSection from "./components/ReportsSection";
import AttendanceHistory from "./components/AttendanceHistory";
import AuthModal from "./components/AuthModal";
import AuthPage from "./components/AuthPage";

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
  const [activeTab, setActiveTab] = useState<"operations" | "reports" | "analytics" | "history" | "profile" | "auth">("operations");
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
  
  // Attendance Filter
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "present" | "absent" | "overtime">("all");
  
  // Bulk Selection State
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<string[]>([]);

  // Reset bulk selection on navigation/search change
  useEffect(() => {
    setSelectedAttendanceIds([]);
  }, [activeTab, subTab, searchQuery, attendanceFilter]);
  
  // Doc accordion state
  const [isDocOpen, setIsDocOpen] = useState(false);

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Initialize DB and connection validation
  useEffect(() => {
    validateFirestoreConnection();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (currentUser) {
        setIsDbLoading(true);
        try {
          const emps = await fetchUserEmployees(currentUser.uid);
          const atts = await fetchUserAttendance(currentUser.uid);
          const lgs = await fetchUserLogs(currentUser.uid);
          setEmployees(emps);
          setAttendance(atts);
          setLogs(lgs);
        } catch (err) {
          console.error("Failed to load user data from Firestore:", err);
        } finally {
          setIsDbLoading(false);
        }
      } else {
        setEmployees(dbStore.getEmployees());
        setAttendance(dbStore.getAttendance());
        setLogs(dbStore.getLogs());
      }
    }
    loadData();
  }, [currentUser]);

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

  // Search filter across processed attendance (Name, ID, Date, Address, Status/Overtime)
  const filteredAttendance = useMemo(() => {
    let list = processedAttendance;

    // Apply quick filters
    if (attendanceFilter === "present") {
      list = list.filter((rec) => rec.status === "Present");
    } else if (attendanceFilter === "absent") {
      list = list.filter((rec) => rec.status === "Absent");
    } else if (attendanceFilter === "overtime") {
      list = list.filter((rec) => rec.overtime_hours > 0);
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return list;

    return list.filter((rec) => {
      const emp = employees.find((e) => e.employee_id === rec.employee_id);
      return (
        rec.employee_name.toLowerCase().includes(query) ||
        rec.employee_id.toLowerCase().includes(query) ||
        rec.date.includes(query) ||
        (emp && emp.address.toLowerCase().includes(query))
      );
    });
  }, [processedAttendance, searchQuery, employees, attendanceFilter]);

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

  // Helper to record activity log locally or in Firestore
  const recordLog = async (action: string, details: string, type: ActivityLog["type"] = "info") => {
    const newLog: ActivityLog = {
      id: "LOG-" + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      action,
      details,
      type,
    };
    if (currentUser) {
      try {
        await saveUserLog(currentUser.uid, newLog);
        const freshLogs = await fetchUserLogs(currentUser.uid);
        setLogs(freshLogs);
      } catch (e) {
        console.error("Failed to write activity log to Firestore", e);
      }
    } else {
      dbStore.addLog(action, details, type);
      setLogs(dbStore.getLogs());
    }
  };

  // Save new or updated employee profile
  const handleSaveEmployee = async (newEmp: Omit<Employee, "employee_id" | "avatar_color" | "created_at">) => {
    if (editingEmployee) {
      const updatedEmp: Employee = {
        ...editingEmployee,
        ...newEmp,
      };
      const updatedEmployees = employees.map((emp) =>
        emp.employee_id === editingEmployee.employee_id ? updatedEmp : emp
      );
      setEmployees(updatedEmployees);

      if (currentUser) {
        try {
          await saveUserEmployee(currentUser.uid, updatedEmp);
        } catch (e) {
          console.error("Failed to update employee in Firestore", e);
        }
      } else {
        dbStore.saveEmployees(updatedEmployees);
      }

      if (selectedEmployeeProfile && selectedEmployeeProfile.employee_id === editingEmployee.employee_id) {
        setSelectedEmployeeProfile(updatedEmp);
      }

      // Record Action Log
      const logMsg = `Updated Profile [${editingEmployee.employee_id}] for ${newEmp.employee_name}.`;
      await recordLog("Profile Updated", logMsg, "info");
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

      if (currentUser) {
        try {
          await saveUserEmployee(currentUser.uid, finalEmployee);
        } catch (e) {
          console.error("Failed to save new employee to Firestore", e);
        }
      } else {
        dbStore.saveEmployees(updatedEmployees);
      }

      // Record Action Log
      const logMsg = `Registered Profile [${empId}] for ${newEmp.employee_name}. Monthly Salary: ${formatCurrency(newEmp.monthly_salary)}`;
      await recordLog("Profile Enrolled", logMsg, "success");
    }
  };

  // Save or update daily attendance record
  const handleSaveAttendance = async (newAtt: Omit<Attendance, "attendance_id" | "created_at">) => {
    if (editingAttendanceRecord) {
      const updatedAtt: Attendance = {
        ...editingAttendanceRecord,
        ...newAtt,
        updated_at: new Date().toISOString(),
      };
      const updatedAttendance = attendance.map((att) =>
        att.attendance_id === editingAttendanceRecord.attendance_id ? updatedAtt : att
      );
      setAttendance(updatedAttendance);

      if (currentUser) {
        try {
          await saveUserAttendance(currentUser.uid, updatedAtt);
        } catch (e) {
          console.error("Failed to update attendance in Firestore", e);
        }
      } else {
        dbStore.saveAttendance(updatedAttendance);
      }

      const empName = employees.find((e) => e.employee_id === newAtt.employee_id)?.employee_name || "Employee";
      await recordLog("Attendance Updated", `Updated attendance & OT log for ${empName} on ${newAtt.date}.`, "info");
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

      if (currentUser) {
        try {
          await saveUserAttendance(currentUser.uid, finalAttendance);
        } catch (e) {
          console.error("Failed to save attendance to Firestore", e);
        }
      } else {
        dbStore.saveAttendance(updatedAttendance);
      }

      const empName = employees.find((e) => e.employee_id === newAtt.employee_id)?.employee_name || "Employee";

      // Record Action Log
      const logMsg = `Logged ${newAtt.status} for ${empName} on ${newAtt.date}. Overtime: ${newAtt.overtime_hours}h.`;
      await recordLog("Attendance Recorded", logMsg, "info");
    }
  };

  // Delete attendance record (automatically triggers SOS recalculation)
  const handleDeleteAttendance = async (attId: string) => {
    const recordToDelete = attendance.find((a) => a.attendance_id === attId);
    if (!recordToDelete) return;

    const updatedAttendance = attendance.filter((a) => a.attendance_id !== attId);
    setAttendance(updatedAttendance);

    if (currentUser) {
      try {
        await deleteUserAttendance(currentUser.uid, attId);
      } catch (e) {
        console.error("Failed to delete attendance from Firestore", e);
      }
    } else {
      dbStore.saveAttendance(updatedAttendance);
    }

    const empName = employees.find((e) => e.employee_id === recordToDelete.employee_id)?.employee_name || "Employee";

    // Log deletion
    await recordLog(
      "Record Deleted",
      `Removed attendance record for ${empName} on ${recordToDelete.date}. Smart Engine recalculated cumulative salaries.`,
      "warning"
    );
  };

  // Quick update attendance from table
  const handleQuickAttendance = async (attId: string, status: "Present" | "Absent") => {
    const today = new Date().toISOString().split('T')[0];
    const rec = attendance.find(a => a.attendance_id === attId);
    if (!rec) return;

    const updatedRecord: Attendance = {
      ...rec,
      date: today,
      status: status,
      updated_at: new Date().toISOString(),
    };

    const updatedAttendance = attendance.map((att) =>
      att.attendance_id === attId ? updatedRecord : att
    );
    setAttendance(updatedAttendance);

    if (currentUser) {
      try {
        await saveUserAttendance(currentUser.uid, updatedRecord);
      } catch (e) {
        console.error("Failed to update quick attendance in Firestore", e);
      }
    } else {
      dbStore.saveAttendance(updatedAttendance);
    }
    
    const empName = employees.find((e) => e.employee_id === rec.employee_id)?.employee_name || "Employee";
    await recordLog("Quick Attendance", `Marked ${status} for ${empName} on ${today}.`, "info");
  };

  // Bulk update attendance from table
  const handleBulkAttendance = async (status: "Present" | "Absent") => {
    if (selectedAttendanceIds.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const updatedAttendance = attendance.map((att) => {
      if (selectedAttendanceIds.includes(att.attendance_id)) {
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

    if (currentUser) {
      try {
        for (const attId of selectedAttendanceIds) {
          const found = updatedAttendance.find(a => a.attendance_id === attId);
          if (found) {
            await saveUserAttendance(currentUser.uid, found);
          }
        }
      } catch (e) {
        console.error("Failed to save bulk attendance to Firestore", e);
      }
    } else {
      dbStore.saveAttendance(updatedAttendance);
    }

    const updatedCount = selectedAttendanceIds.length;
    await recordLog(
      "Bulk Attendance",
      `Bulk marked ${status} for ${updatedCount} personnel records on ${today}.`,
      "info"
    );
    setSelectedAttendanceIds([]);
  };

  const handleInlineOvertimeUpdate = async (attId: string, hours: number, earnings?: number) => {
    const rec = attendance.find(a => a.attendance_id === attId);
    if (!rec) return;

    const updatedRecord: Attendance = {
      ...rec,
      overtime_hours: hours,
      overtime_earnings: earnings !== undefined ? earnings : rec.overtime_earnings,
      updated_at: new Date().toISOString(),
    };

    const updatedAttendance = attendance.map((att) =>
      att.attendance_id === attId ? updatedRecord : att
    );
    setAttendance(updatedAttendance);

    if (currentUser) {
      try {
        await saveUserAttendance(currentUser.uid, updatedRecord);
      } catch (e) {
        console.error("Failed to update inline overtime in Firestore", e);
      }
    } else {
      dbStore.saveAttendance(updatedAttendance);
    }
  };

  // Delete employee profile (removes profile & all related attendance entries)
  const handleDeleteEmployee = async (empId: string) => {
    const emp = employees.find((e) => e.employee_id === empId);
    if (!emp) return;

    const updatedEmployees = employees.filter((e) => e.employee_id !== empId);
    const updatedAttendance = attendance.filter((a) => a.employee_id !== empId);

    setEmployees(updatedEmployees);
    setAttendance(updatedAttendance);

    if (currentUser) {
      try {
        await deleteUserEmployee(currentUser.uid, empId);
        const relatedAtts = attendance.filter(a => a.employee_id === empId);
        const relatedIds = relatedAtts.map(a => a.attendance_id);
        if (relatedIds.length > 0) {
          await clearUserAttendance(currentUser.uid, relatedIds);
        }
      } catch (e) {
        console.error("Failed to delete employee from Firestore", e);
      }
    } else {
      dbStore.saveEmployees(updatedEmployees);
      dbStore.saveAttendance(updatedAttendance);
    }

    if (selectedEmployeeProfile?.employee_id === empId) {
      setSelectedEmployeeProfile(null);
    }

    await recordLog(
      "Profile Terminated",
      `Deleted ${emp.employee_name}'s profile and purged ${attendance.length - updatedAttendance.length} related sessions.`,
      "danger"
    );
  };

  // Delete all attendance logs at once
  const handleClearAllAttendance = async () => {
    const attIds = attendance.map(a => a.attendance_id);
    setAttendance([]);

    if (currentUser) {
      try {
        if (attIds.length > 0) {
          await clearUserAttendance(currentUser.uid, attIds);
        }
      } catch (e) {
        console.error("Failed to clear attendance in Firestore", e);
      }
    } else {
      dbStore.saveAttendance([]);
    }

    await recordLog(
      "Ledger Purged",
      "Successfully cleared all daily check-in and overtime ledger logs.",
      "danger"
    );
    setIsClearAllConfirmOpen(false);
  };

  // Full Database Seed / Reset
  const handleResetDatabase = async () => {
    if (window.confirm("This will overwrite current data and restore the initial enterprise demo profiles. Continue?")) {
      if (currentUser) {
        setIsDbLoading(true);
        try {
          const currentEmpIds = employees.map(e => e.employee_id);
          const currentAttIds = attendance.map(a => a.attendance_id);
          const currentLogIds = logs.map(l => l.id);

          await clearUserEmployees(currentUser.uid, currentEmpIds);
          await clearUserAttendance(currentUser.uid, currentAttIds);
          await clearUserLogs(currentUser.uid, currentLogIds);

          const defaultEmps = dbStore.getEmployees();
          const defaultAtts = dbStore.getAttendance();
          const defaultLgs = dbStore.getLogs();

          for (const emp of defaultEmps) {
            await saveUserEmployee(currentUser.uid, emp);
          }
          for (const att of defaultAtts) {
            await saveUserAttendance(currentUser.uid, att);
          }
          for (const lg of defaultLgs) {
            await saveUserLog(currentUser.uid, lg);
          }

          setEmployees(defaultEmps);
          setAttendance(defaultAtts);
          setLogs(defaultLgs);
        } catch (e) {
          console.error("Failed to reset Firestore database", e);
        } finally {
          setIsDbLoading(false);
        }
      } else {
        localStorage.removeItem("sm_employees");
        localStorage.removeItem("sm_attendance");
        localStorage.removeItem("sm_logs");

        setEmployees(dbStore.getEmployees());
        setAttendance(dbStore.getAttendance());
      }
      setSelectedEmployeeProfile(null);

      await recordLog("Database Reset", "Restored initial system mock database with pre-calculated balances.", "warning");
    }
  };

  // Clear system activity logs
  const handleClearLogs = async () => {
    const initialLog: ActivityLog = {
      id: "LOG-CLR",
      timestamp: new Date().toISOString(),
      action: "Log Purged",
      details: "Audit history cleared by user command.",
      type: "info",
    };
    if (currentUser) {
      try {
        const logIds = logs.map(l => l.id);
        await clearUserLogs(currentUser.uid, logIds);
        await saveUserLog(currentUser.uid, initialLog);
        setLogs([initialLog]);
      } catch (e) {
        console.error("Failed to clear logs in Firestore", e);
      }
    } else {
      dbStore.saveLogs([initialLog]);
      setLogs([initialLog]);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 relative overflow-hidden flex ${
      darkMode ? "bg-gradient-to-b from-[#060816] via-[#090c1d] to-[#0e1224] text-stone-200" : "bg-warm-bg text-stone-900"
    }`}>
      
      {isDbLoading && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border animate-pulse bg-indigo-600 border-indigo-500 text-white dark:bg-indigo-950 dark:border-indigo-800">
          <RefreshCw className="w-4 h-4 animate-spin text-white" />
          <span className="text-xs font-semibold">Syncing with Firestore...</span>
        </div>
      )}
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
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
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
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto pb-20 md:pb-0">
        {/* 1. Brand Navigation Header */}
        <div className="relative z-10">
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            currentUser={currentUser}
            onSignInClick={() => setActiveTab("auth")}
            onProfileClick={() => setActiveTab("profile")}
          />
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
        ) : activeTab === "auth" ? (
          <AuthPage
            darkMode={darkMode}
            onSuccess={() => setActiveTab("operations")}
            onCancel={() => setActiveTab("operations")}
          />
        ) : (
          <>
            {/* 2. Top Summary Stat Cards */}
            <DashboardStats stats={dashboardStats} darkMode={darkMode} />

            {/* 3. App Feature Navigation Tabs */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-1 border-b ${
              darkMode ? "border-white/5" : "border-stone-200"
            }`}>

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

                  {/* Add Employee and Attendance Actions Row - Designed to match horizontal single row on mobile perfectly */}
                  <div className="flex flex-row items-center gap-2 sm:gap-3 w-full md:w-auto overflow-x-auto scrollbar-none">
                    
                    <button
                      id="trigger-add-employee-btn"
                      onClick={() => setIsEmployeeModalOpen(true)}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 flex-1 sm:flex-initial whitespace-nowrap ${
                        darkMode 
                          ? "btn-glow-purple text-white border border-purple-500/30" 
                          : "bg-[#faf5ff] hover:bg-[#f3e8ff] text-[#2f00ff] border border-[#e9d5ff]/85 shadow-[0_2px_8px_rgba(168,85,247,0.03)]"
                      }`}
                      style={{ fontSize: '13px' }}
                    >
                      <Plus className={`w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5px] ${darkMode ? "text-white" : "text-[#2f00ff]"}`} />
                      Add Employee
                    </button>

                    <button
                      id="trigger-add-attendance-btn"
                      onClick={() => setIsAttendanceModalOpen(true)}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 flex-1 sm:flex-initial whitespace-nowrap ${
                        darkMode 
                          ? "btn-glow-blue text-white border border-blue-500/30" 
                          : "bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#2f00ff] border border-[#bae6fd]/85 shadow-[0_2px_8px_rgba(59,130,246,0.03)]"
                      }`}
                      style={{ fontSize: '13px' }}
                    >
                      <ClipboardCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2px] ${darkMode ? "text-white" : "text-[#2f00ff]"}`} />
                      Add Attendance
                    </button>

                    <button
                      id="db-reset-btn"
                      onClick={handleResetDatabase}
                      title="Reset to pre-seeded dataset"
                      className={`p-2.5 sm:p-3 rounded-[15px] sm:rounded-[18px] border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 shrink-0 ${
                        darkMode
                          ? "bg-[#0a0d24] border-white/5 text-gray-400 hover:text-white hover:border-white/15"
                          : "bg-white border-slate-200/80 text-[#64748b] hover:text-slate-800 hover:bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2px]" />
                    </button>

                  </div>

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

                      {/* Quick-Filter Buttons - Optimized to fit horizontally on mobile exactly like Image 2 */}
                      <div className={`px-4 sm:px-6 py-3.5 sm:py-4.5 border-b flex flex-wrap items-center gap-2.5 sm:gap-3.5 ${
                        darkMode ? "bg-[#161f36]/25 border-white/5" : "bg-white border-slate-100/80"
                      }`}>
                        <span className="text-xs font-bold text-slate-500 dark:text-[#8e97af] mr-1.5 uppercase tracking-wider font-mono hidden sm:inline">Quick Filter:</span>
                        <button
                          onClick={() => setAttendanceFilter("all")}
                          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2.5 border ${
                            attendanceFilter === "all"
                              ? darkMode
                                ? "bg-indigo-600/25 text-indigo-300 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                                : "bg-white border-indigo-200 text-indigo-700 shadow-[0_2px_10px_rgba(99,102,241,0.06)] font-extrabold scale-[1.01]"
                              : darkMode
                                ? "bg-white/5 hover:bg-white/10 text-stone-300 border border-white/5"
                                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            attendanceFilter === "all" 
                              ? "bg-indigo-500 shadow-[0_0_10px_#6366f1,0_0_4px_#6366f1]" 
                              : "bg-slate-400"
                          }`} />
                          All Records
                        </button>
                        <button
                          onClick={() => setAttendanceFilter("present")}
                          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2.5 border ${
                            attendanceFilter === "present"
                              ? darkMode
                                ? "bg-emerald-600/25 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                                : "bg-white border-emerald-200 text-[#047857] shadow-[0_3px_12px_rgba(16,185,129,0.08)] font-extrabold scale-[1.02]"
                              : darkMode
                                ? "bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/5 opacity-60 hover:opacity-100"
                                : "bg-white hover:bg-slate-50 text-[#047857]/80 border-slate-200 shadow-sm opacity-85 hover:opacity-100"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full bg-emerald-500 transition-all duration-300 ${
                            attendanceFilter === "present"
                              ? "shadow-[0_0_10px_#10b981,0_0_4px_#10b981]"
                              : "shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                          }`} />
                          Present Only
                        </button>
                        <button
                          onClick={() => setAttendanceFilter("absent")}
                          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2.5 border ${
                            attendanceFilter === "absent"
                              ? darkMode
                                ? "bg-rose-600/25 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                                : "bg-white border-rose-200 text-[#be123c] shadow-[0_3px_12px_rgba(244,63,94,0.08)] font-extrabold scale-[1.02]"
                              : darkMode
                                ? "bg-white/5 hover:bg-white/10 text-rose-400 border border-white/5 opacity-60 hover:opacity-100"
                                : "bg-white hover:bg-slate-50 text-[#be123c]/80 border-slate-200 shadow-sm opacity-85 hover:opacity-100"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full bg-rose-500 transition-all duration-300 ${
                            attendanceFilter === "absent"
                              ? "shadow-[0_0_10px_#f43f5e,0_0_4px_#f43f5e]"
                              : "shadow-[0_0_5px_rgba(244,63,94,0.5)]"
                          }`} />
                          Absent Only
                        </button>
                        <button
                          onClick={() => setAttendanceFilter("overtime")}
                          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2.5 border ${
                            attendanceFilter === "overtime"
                              ? darkMode
                                ? "bg-amber-600/25 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                                : "bg-white border-amber-200 text-[#b45309] shadow-[0_3px_12px_rgba(245,158,11,0.08)] font-extrabold scale-[1.02]"
                              : darkMode
                                ? "bg-white/5 hover:bg-white/10 text-amber-400 border border-white/5 opacity-60 hover:opacity-100"
                                : "bg-white hover:bg-slate-50 text-[#b45309]/80 border-slate-200 shadow-sm opacity-85 hover:opacity-100"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full bg-amber-500 transition-all duration-300 ${
                            attendanceFilter === "overtime"
                              ? "shadow-[0_0_10px_#f59e0b,0_0_4px_#f59e0b]"
                              : "shadow-[0_0_5px_rgba(245,158,11,0.5)]"
                          }`} />
                          Overtime Only
                        </button>
                      </div>

                      {/* Bulk Actions Bar */}
                      {selectedAttendanceIds.length > 0 && (
                        <div className={`px-6 py-3 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between animate-fade-in ${
                          darkMode ? "bg-indigo-950/40 border-white/10 text-indigo-200" : "bg-indigo-50/80 border-slate-200 text-indigo-900"
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className={`flex items-center justify-center rounded-full font-extrabold ${
                              darkMode ? "bg-indigo-500/20 text-[#3cffb6]" : "bg-indigo-100 text-indigo-700"
                            }`} style={{ width: '24px', height: '24px', fontSize: '12px' }}>
                              {selectedAttendanceIds.length}
                            </div>
                            <span className="text-xs font-semibold">record(s) selected for bulk updates:</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleBulkAttendance("Present")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer active:scale-95 ${
                                darkMode 
                                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-[#3cffb6] border-emerald-500/20 hover:border-emerald-500/40"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Mark Present
                            </button>
                            
                            <button
                              onClick={() => handleBulkAttendance("Absent")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer active:scale-95 ${
                                darkMode 
                                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-[#ff4a7a] border-rose-500/20 hover:border-rose-500/40"
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              Mark Absent
                            </button>

                            <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></span>

                            <button
                              onClick={() => setSelectedAttendanceIds([])}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                                darkMode 
                                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`text-[10px] uppercase tracking-wider font-extrabold font-mono whitespace-nowrap ${
                              darkMode ? "bg-[#161f36]/75 border-b border-white/10 text-[#8e97af]" : "bg-slate-50 border-b border-slate-200 text-slate-500"
                            }`}>
                              <th className="py-3 px-3 text-center w-10">
                                <input
                                  type="checkbox"
                                  checked={filteredAttendance.length > 0 && filteredAttendance.every(r => selectedAttendanceIds.includes(r.attendance_id))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAttendanceIds(filteredAttendance.map(r => r.attendance_id));
                                    } else {
                                      setSelectedAttendanceIds([]);
                                    }
                                  }}
                                  className={`w-4 h-4 rounded border transition-all cursor-pointer focus:ring-offset-0 focus:ring-0 ${
                                    darkMode 
                                      ? "bg-slate-800 border-slate-700 text-indigo-500 accent-indigo-500" 
                                      : "bg-white border-slate-300 text-indigo-600 accent-indigo-600"
                                  }`}
                                />
                              </th>
                              <th className="py-3 px-3" style={{ fontSize: '13px' }}>#</th>
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
                                <td colSpan={11} className="py-16 text-center text-xs text-slate-500 font-mono">
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
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedAttendanceIds.includes(rec.attendance_id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedAttendanceIds(prev => [...prev, rec.attendance_id]);
                                        } else {
                                          setSelectedAttendanceIds(prev => prev.filter(id => id !== rec.attendance_id));
                                        }
                                      }}
                                      className={`w-4 h-4 rounded border transition-all cursor-pointer focus:ring-offset-0 focus:ring-0 ${
                                        darkMode 
                                          ? "bg-slate-800 border-slate-700 text-indigo-500 accent-indigo-500" 
                                          : "bg-white border-slate-300 text-indigo-600 accent-indigo-600"
                                      }`}
                                    />
                                  </td>
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
                                        style={{ fontSize: '17px' }}
                                      >
                                        {rec.employee_name}
                                      </button>
                                      <p className="text-[10px] text-[#8e97af] font-mono">{rec.employee_id}</p>
                                    </div>
                                  </td>
                                  <td className={`py-3 px-3 font-semibold font-mono whitespace-nowrap ${darkMode ? "text-[#b9c2d9]" : "text-slate-700"}`} style={{ fontSize: '14px' }}>
                                    <div>{rec.date.split('-').reverse().join('-')}</div>
                                    {(rec.updated_at || rec.created_at) && (
                                      <div 
                                        className={`text-[10px] mt-0.5 ${darkMode ? "text-[#8e97af]" : "text-slate-500"}`}
                                        style={{ fontSize: '15px' }}
                                      >
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
                                    }`} style={{ fontSize: '12px' }}>
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
                                        style={{ fontSize: '15px' }}
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
                                        style={{ fontSize: '15px' }}
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
                                        style={{ fontSize: '12px' }}
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
                                        style={{ fontSize: '12px' }}
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
                                          fontSize: '12px' 
                                        }}
                                        title="Edit Attendance & Overtime"
                                      >
                                        <Edit 
                                          className="w-3.5 h-3.5" 
                                          style={{ fontSize: '12px' }}
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

            {/* Tab: User Profile View */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                {currentUser ? (
                  <div className={`rounded-[28px] border overflow-hidden p-8 transition-all duration-300 relative ${
                    darkMode 
                      ? "bg-[#111625]/85 border-white/10 text-white shadow-2xl shadow-indigo-950/20" 
                      : "bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-100"
                  }`}>
                    {/* Background glowing effects inside profile */}
                    {darkMode && (
                      <div className="absolute top-[-50px] right-[-50px] w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
                    )}
                    
                    {/* Header profile title */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-dashed border-slate-200 dark:border-white/10 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                          <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold tracking-tight font-sans">System Profile Center</h2>
                          <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            Your personalized administrative dashboard credentials
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={async () => {
                          await signOut(auth);
                          setActiveTab("operations");
                          dbStore.addLog("Sign Out", "User signed out from Firebase Auth services.", "info");
                          setLogs(dbStore.getLogs());
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
                          darkMode 
                            ? "bg-rose-500/10 hover:bg-rose-500/20 text-[#ff4a7a] border-rose-500/20 hover:border-rose-500/40"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                        }`}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: User Card */}
                      <div className={`p-6 rounded-2xl border flex flex-col items-center text-center justify-center ${
                        darkMode ? "bg-slate-900/40 border-white/8" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="relative mb-4">
                          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md"></div>
                          {currentUser.photoURL ? (
                            <img 
                              src={currentUser.photoURL} 
                              alt="Profile Image" 
                              className="w-24 h-24 rounded-full object-cover relative border-2 border-indigo-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-lg relative">
                              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U")}
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-bold">{currentUser.displayName || "Administrator"}</h3>
                        <p className="text-xs text-indigo-500 font-mono font-bold mt-1">
                          {currentUser.email}
                        </p>
                        
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            Active Session
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-100 text-indigo-800"
                          }`}>
                            {currentUser.providerData[0]?.providerId === "google.com" ? "Google Auth" : "Email Login"}
                          </span>
                        </div>
                      </div>

                      {/* Center: System Credentials & Stats - Optimized to match Image 3 perfectly */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className={`p-4 pb-5 sm:p-6 sm:pb-7 rounded-[18px] sm:rounded-[22px] border ${
                            darkMode ? "bg-slate-900/20 border-white/8" : "bg-white border-[#1e293b] shadow-[0_2px_12px_rgba(30,41,59,0.01)]"
                          }`}>
                            <span className={`text-[9px] sm:text-[11px] md:text-[12px] font-extrabold tracking-widest uppercase block mb-1.5 sm:mb-2.5 ${darkMode ? "text-slate-400" : "text-[#5c6e8d]"}`}>
                              TOTAL PERSONNEL COUNT
                            </span>
                            <div className="flex items-baseline gap-1.5 sm:gap-2">
                              <span className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${darkMode ? "text-white" : "text-[#0f172a]"}`}>{employees.length}</span>
                              <span className={`text-xs sm:text-sm md:text-base font-semibold ${darkMode ? "text-slate-400" : "text-[#5c6e8d]"}`}>registered</span>
                            </div>
                          </div>
                          
                          <div className={`p-4 pb-5 sm:p-6 sm:pb-7 rounded-[18px] sm:rounded-[22px] border ${
                            darkMode ? "bg-slate-900/20 border-white/8" : "bg-white border-[#1e293b] shadow-[0_2px_12px_rgba(30,41,59,0.01)]"
                          }`}>
                            <span className={`text-[9px] sm:text-[11px] md:text-[12px] font-extrabold tracking-widest uppercase block mb-1.5 sm:mb-2.5 ${darkMode ? "text-slate-400" : "text-[#5c6e8d]"}`}>
                              LEDGER LOGS RECORDED
                            </span>
                            <div className="flex items-baseline gap-1.5 sm:gap-2">
                              <span className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${darkMode ? "text-white" : "text-[#0f172a]"}`}>{attendance.length}</span>
                              <span className={`text-xs sm:text-sm md:text-base font-semibold ${darkMode ? "text-slate-400" : "text-[#5c6e8d]"}`}>logs</span>
                            </div>
                          </div>
                        </div>

                        {/* Account Details */}
                        <div className={`p-6 rounded-2xl border ${
                          darkMode ? "bg-slate-900/20 border-white/8" : "bg-white border-slate-200"
                        }`}>
                          <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Account Verification & Security
                          </h4>
                          
                          <div className="space-y-3.5 text-xs">
                            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                              <span className="text-slate-500">User UID</span>
                              <span className="font-mono text-[11px] text-[#2bdfff] bg-[#2bdfff]/5 px-2 py-0.5 rounded">
                                {currentUser.uid}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                              <span className="text-slate-500">Email Verified</span>
                              <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                                currentUser.emailVerified 
                                  ? "text-emerald-500 bg-emerald-500/10" 
                                  : "text-amber-500 bg-amber-500/10"
                              }`}>
                                {currentUser.emailVerified ? "Verified" : "Pending Verification"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-slate-500">Created / Signed Up</span>
                              <span className="text-slate-400">
                                {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleString() : "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-[28px] border overflow-hidden p-12 text-center transition-all duration-300 ${
                    darkMode ? "bg-[#111625]/85 border-white/10" : "bg-white border-slate-200"
                  }`}>
                    <div className="inline-flex p-4 bg-indigo-500/10 text-indigo-500 rounded-3xl mb-4">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold">Unauthenticated Access</h2>
                    <p className={`text-sm mt-1.5 max-w-md mx-auto ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      You are currently viewing this page in guest mode. Please sign in or create an account to access customized profiles and database sync logs.
                    </p>
                    <button
                      onClick={() => setActiveTab("auth")}
                      className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer font-sans"
                    >
                      Sign In Now
                    </button>
                  </div>
                )}
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
        <p>© 2026 ATTENDEXA // HR Dashboard Solution.</p>
        <p className="mt-1.5 text-brand-purple">Built for veer.ud.1012@gmail.com</p>
      </footer>

      </div> {/* This closes the Main Panel Content Area */}

      {/* Sticky Mobile Footer Menu */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t px-4 py-2 backdrop-blur-[30px] transition-all duration-300 ${
        darkMode 
          ? "bg-[#0d1222]/90 border-white/8 text-[#8e97af] shadow-[0_-10px_35px_rgba(0,0,0,0.6)]" 
          : "bg-white/95 border-slate-200 text-slate-500 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
      }`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              setActiveTab("operations");
              setSubTab("attendance");
              setSelectedEmployeeProfile(null);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === "operations" && subTab === "attendance" && !selectedEmployeeProfile
                ? darkMode
                  ? "bg-[#6d28ff]/15 text-[#9b5dff] shadow-[0_0_12px_rgba(155,93,255,0.25)]"
                  : "bg-indigo-50 text-indigo-600 font-bold"
                : "text-slate-400 hover:text-indigo-500"
            }`}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className={`text-[9px] mt-0.5 tracking-tight ${
              activeTab === "operations" && subTab === "attendance" && !selectedEmployeeProfile
                ? "font-bold text-[#9b5dff]"
                : "font-medium text-slate-400"
            }`}>Logs</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("operations");
              setSubTab("employees");
              setSelectedEmployeeProfile(null);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === "operations" && subTab === "employees" && !selectedEmployeeProfile
                ? darkMode
                  ? "bg-[#6d28ff]/15 text-[#9b5dff] shadow-[0_0_12px_rgba(155,93,255,0.25)]"
                  : "bg-indigo-50 text-indigo-600 font-bold"
                : "text-slate-400 hover:text-indigo-500"
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[9px] mt-0.5 tracking-tight ${
              activeTab === "operations" && subTab === "employees" && !selectedEmployeeProfile
                ? "font-bold text-[#9b5dff]"
                : "font-medium text-slate-400"
            }`}>Workforce</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("reports");
              setSelectedEmployeeProfile(null);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === "reports" && !selectedEmployeeProfile
                ? darkMode
                  ? "bg-[#6d28ff]/15 text-[#9b5dff] shadow-[0_0_12px_rgba(155,93,255,0.25)]"
                  : "bg-indigo-50 text-indigo-600 font-bold"
                : "text-slate-400 hover:text-indigo-500"
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className={`text-[9px] mt-0.5 tracking-tight ${
              activeTab === "reports" && !selectedEmployeeProfile
                ? "font-bold text-[#9b5dff]"
                : "font-medium text-slate-400"
            }`}>Reports</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("analytics");
              setSelectedEmployeeProfile(null);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === "analytics" && !selectedEmployeeProfile
                ? darkMode
                  ? "bg-[#6d28ff]/15 text-[#9b5dff] shadow-[0_0_12px_rgba(155,93,255,0.25)]"
                  : "bg-indigo-50 text-indigo-600 font-bold"
                : "text-slate-400 hover:text-indigo-500"
            }`}>
              <LineChart className="w-5 h-5" />
            </div>
            <span className={`text-[9px] mt-0.5 tracking-tight ${
              activeTab === "analytics" && !selectedEmployeeProfile
                ? "font-bold text-[#9b5dff]"
                : "font-medium text-slate-400"
            }`}>Analytics</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              setSelectedEmployeeProfile(null);
              setSearchQuery("");
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeTab === "history" && !selectedEmployeeProfile
                ? darkMode
                  ? "bg-[#6d28ff]/15 text-[#9b5dff] shadow-[0_0_12px_rgba(155,93,255,0.25)]"
                  : "bg-indigo-50 text-indigo-600 font-bold"
                : "text-slate-400 hover:text-indigo-500"
            }`}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className={`text-[9px] mt-0.5 tracking-tight ${
              activeTab === "history" && !selectedEmployeeProfile
                ? "font-bold text-[#9b5dff]"
                : "font-medium text-slate-400"
            }`}>History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
