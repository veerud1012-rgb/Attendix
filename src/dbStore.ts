import { Employee, Attendance, AttendanceWithEmployee, ActivityLog } from "./types";

// Helper to get actual days in a month for a specific date (YYYY-MM-DD)
export function getDaysInMonth(dateStr: string): number {
  try {
    const parts = dateStr.split("-");
    if (parts.length < 2) return 30;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-indexed (e.g., 07 for July)
    if (isNaN(year) || isNaN(month)) return 30;
    return new Date(year, month, 0).getDate();
  } catch (e) {
    return 30;
  }
}

// Format currency in Indian Rupees (₹)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Default initial employees if local storage is empty
const defaultEmployees: Employee[] = [
  {
    employee_id: "EMP-1024",
    employee_name: "Rahul Sharma",
    address: "Delhi",
    monthly_salary: 30000,
    overtime_hours_rule: 2,
    overtime_amount_rule: 200,
    joining_date: "2026-07-01",
    avatar_color: "bg-indigo-500",
    created_at: "2026-07-01T09:00:00Z",
  },
  {
    employee_id: "EMP-1025",
    employee_name: "Priya Patel",
    address: "Mumbai",
    monthly_salary: 45000,
    overtime_hours_rule: 1,
    overtime_amount_rule: 150,
    joining_date: "2026-07-01",
    avatar_color: "bg-fuchsia-500",
    created_at: "2026-07-01T09:30:00Z",
  },
  {
    employee_id: "EMP-1026",
    employee_name: "Amit Verma",
    address: "Bangalore",
    monthly_salary: 60000,
    overtime_hours_rule: 2,
    overtime_amount_rule: 300,
    joining_date: "2026-07-01",
    avatar_color: "bg-cyan-500",
    created_at: "2026-07-01T10:00:00Z",
  },
  {
    employee_id: "EMP-1027",
    employee_name: "Neha Gupta",
    address: "Pune",
    monthly_salary: 25000,
    overtime_hours_rule: 3,
    overtime_amount_rule: 150,
    joining_date: "2026-07-02",
    avatar_color: "bg-emerald-500",
    created_at: "2026-07-02T11:00:00Z",
  },
  {
    employee_id: "EMP-1028",
    employee_name: "Vikram Malhotra",
    address: "Hyderabad",
    monthly_salary: 35000,
    overtime_hours_rule: 2,
    overtime_amount_rule: 250,
    joining_date: "2026-07-03",
    avatar_color: "bg-amber-500",
    created_at: "2026-07-03T09:15:00Z",
  }
];

// Pre-seeded attendance history to show immediate premium dashboard details
const defaultAttendance: Attendance[] = [
  // 2026-07-10
  {
    attendance_id: "ATT-001",
    employee_id: "EMP-1024",
    date: "2026-07-10",
    status: "Present",
    overtime_hours: 2,
    narration: "Night Shift support",
    created_at: "2026-07-10T18:00:00Z",
  },
  {
    attendance_id: "ATT-002",
    employee_id: "EMP-1025",
    date: "2026-07-10",
    status: "Present",
    overtime_hours: 3,
    narration: "Extra project deployment",
    created_at: "2026-07-10T18:05:00Z",
  },
  {
    attendance_id: "ATT-003",
    employee_id: "EMP-1026",
    date: "2026-07-10",
    status: "Present",
    overtime_hours: 4,
    narration: "Client support call",
    created_at: "2026-07-10T18:10:00Z",
  },
  {
    attendance_id: "ATT-004",
    employee_id: "EMP-1027",
    date: "2026-07-10",
    status: "Absent",
    overtime_hours: 0,
    narration: "Sick Leave",
    created_at: "2026-07-10T09:00:00Z",
  },
  {
    attendance_id: "ATT-005",
    employee_id: "EMP-1028",
    date: "2026-07-10",
    status: "Present",
    overtime_hours: 0,
    narration: "Normal shift",
    created_at: "2026-07-10T18:15:00Z",
  },
  // 2026-07-11
  {
    attendance_id: "ATT-006",
    employee_id: "EMP-1024",
    date: "2026-07-11",
    status: "Present",
    overtime_hours: 0,
    narration: "Standard duty",
    created_at: "2026-07-11T18:00:00Z",
  },
  {
    attendance_id: "ATT-007",
    employee_id: "EMP-1025",
    date: "2026-07-11",
    status: "Present",
    overtime_hours: 1,
    narration: "Late coverage",
    created_at: "2026-07-11T18:05:00Z",
  },
  {
    attendance_id: "ATT-008",
    employee_id: "EMP-1026",
    date: "2026-07-11",
    status: "Present",
    overtime_hours: 2,
    narration: "Server patching",
    created_at: "2026-07-11T18:10:00Z",
  },
  {
    attendance_id: "ATT-009",
    employee_id: "EMP-1027",
    date: "2026-07-11",
    status: "Present",
    overtime_hours: 3,
    narration: "Site visit to factory",
    created_at: "2026-07-11T18:15:00Z",
  },
  {
    attendance_id: "ATT-010",
    employee_id: "EMP-1028",
    date: "2026-07-11",
    status: "Absent",
    overtime_hours: 0,
    narration: "Weekend pass",
    created_at: "2026-07-11T09:15:00Z",
  },
  // 2026-07-12
  {
    attendance_id: "ATT-011",
    employee_id: "EMP-1024",
    date: "2026-07-12",
    status: "Absent",
    overtime_hours: 0,
    narration: "Personal work",
    created_at: "2026-07-12T09:30:00Z",
  },
  {
    attendance_id: "ATT-012",
    employee_id: "EMP-1025",
    date: "2026-07-12",
    status: "Present",
    overtime_hours: 0,
    narration: "Regular attendance",
    created_at: "2026-07-12T18:00:00Z",
  },
  {
    attendance_id: "ATT-013",
    employee_id: "EMP-1026",
    date: "2026-07-12",
    status: "Present",
    overtime_hours: 0,
    narration: "Office duty",
    created_at: "2026-07-12T18:05:00Z",
  },
  {
    attendance_id: "ATT-014",
    employee_id: "EMP-1027",
    date: "2026-07-12",
    status: "Present",
    overtime_hours: 0,
    narration: "Office duty",
    created_at: "2026-07-12T18:10:00Z",
  },
  {
    attendance_id: "ATT-015",
    employee_id: "EMP-1028",
    date: "2026-07-12",
    status: "Present",
    overtime_hours: 4,
    narration: "Sunday urgent support",
    created_at: "2026-07-12T18:15:00Z",
  }
];

const defaultActivityLogs: ActivityLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-07-10T10:00:00Z",
    action: "System Pre-Seeded",
    details: "Loaded initial enterprise demo database with 5 employee records.",
    type: "info",
  },
  {
    id: "LOG-002",
    timestamp: "2026-07-11T18:30:00Z",
    action: "Salary Engine Recalculated",
    details: "Calculated SOS for 10 historical attendance logs.",
    type: "success",
  },
  {
    id: "LOG-003",
    timestamp: "2026-07-13T09:30:00Z",
    action: "Dashboard Initialized",
    details: "Successfully powered HR analytic nodes and salary matrices.",
    type: "success",
  }
];

// Core calculation engine to transform raw attendance to cumulative records
export function processAttendance(
  attendanceList: Attendance[],
  employees: Employee[]
): AttendanceWithEmployee[] {
  // Sort attendance chronologically to properly calculate Sum Of Salary (SOS)
  const sorted = [...attendanceList].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.created_at.localeCompare(b.created_at);
  });

  // Keep track of cumulative salary per employee
  const cumulativeMap = new Map<string, number>();

  return sorted.map((att) => {
    const emp = employees.find((e) => e.employee_id === att.employee_id);
    const empName = emp ? emp.employee_name : "Unknown Employee";
    const monthlySalary = emp ? emp.monthly_salary : 0;
    
    // Days in Month (defaulting to 30)
    const daysInMonth = 30;
    
    // Daily Salary
    const dailySalary = monthlySalary / daysInMonth;
    
    // Status Salary Contribution
    const statusSalary = att.status === "Present" ? dailySalary : 0;

    // Overtime salary calculation
    let overtimeEarnings = 0;
    if (att.overtime_earnings !== undefined && att.overtime_earnings !== null) {
      overtimeEarnings = att.overtime_earnings;
    } else if (emp && att.overtime_hours > 0 && emp.overtime_hours_rule > 0) {
      overtimeEarnings = (att.overtime_hours / emp.overtime_hours_rule) * emp.overtime_amount_rule;
    }

    // Earnings for this day
    const dayEarnings = statusSalary + overtimeEarnings;

    // Fetch and update cumulative sum
    const previousCumulative = cumulativeMap.get(att.employee_id) || 0;
    const newCumulative = previousCumulative + dayEarnings;
    cumulativeMap.set(att.employee_id, newCumulative);

    return {
      ...att,
      employee_name: empName,
      monthly_salary: monthlySalary,
      daily_salary: Math.round(dailySalary * 100) / 100,
      overtime_earnings: Math.round(overtimeEarnings * 100) / 100,
      cumulative_salary: Math.round(newCumulative * 100) / 100,
    };
  });
}

// Local Storage wrappers
export const dbStore = {
  getEmployees(): Employee[] {
    const data = localStorage.getItem("sm_employees");
    if (!data) {
      localStorage.setItem("sm_employees", JSON.stringify(defaultEmployees));
      return defaultEmployees;
    }
    return JSON.parse(data);
  },

  saveEmployees(employees: Employee[]): void {
    localStorage.setItem("sm_employees", JSON.stringify(employees));
  },

  getAttendance(): Attendance[] {
    const data = localStorage.getItem("sm_attendance");
    if (!data) {
      localStorage.setItem("sm_attendance", JSON.stringify(defaultAttendance));
      return defaultAttendance;
    }
    return JSON.parse(data);
  },

  saveAttendance(attendance: Attendance[]): void {
    localStorage.setItem("sm_attendance", JSON.stringify(attendance));
  },

  getLogs(): ActivityLog[] {
    const data = localStorage.getItem("sm_logs");
    if (!data) {
      localStorage.setItem("sm_logs", JSON.stringify(defaultActivityLogs));
      return defaultActivityLogs;
    }
    return JSON.parse(data);
  },

  saveLogs(logs: ActivityLog[]): void {
    localStorage.setItem("sm_logs", JSON.stringify(logs));
  },

  addLog(action: string, details: string, type: ActivityLog["type"] = "info"): void {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: "LOG-" + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      action,
      details,
      type,
    };
    this.saveLogs([newLog, ...logs].slice(0, 50)); // Keep last 50 logs
  },

  // Calculate full summaries for the dashboard
  getDashboardSummary(processedAttendanceList: AttendanceWithEmployee[], employees: Employee[]) {
    const totalEmployees = employees.length;

    // Get today's date formatted as YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0]; // e.g., "2026-07-13"

    // Filter attendance for today
    const todaysRecords = processedAttendanceList.filter((att) => att.date === today);
    const presentToday = todaysRecords.filter((att) => att.status === "Present").length;
    const absentToday = todaysRecords.filter((att) => att.status === "Absent").length;

    // Total Salary Paid is the sum of everyone's final cumulative salary (their earned total to date)
    // To calculate this correctly: we find the latest cumulative_salary for each employee
    const latestSalaryMap = new Map<string, number>();
    const latestOvertimeMap = new Map<string, number>();

    // Sort by date to make sure we traverse chronologically and get the correct final balance
    const sortedProcessed = [...processedAttendanceList].sort((a, b) => a.date.localeCompare(b.date));
    sortedProcessed.forEach((rec) => {
      latestSalaryMap.set(rec.employee_id, rec.cumulative_salary);
    });

    // Sum overtimes from all present days
    let totalOvertimeAmount = 0;
    processedAttendanceList.forEach((rec) => {
      totalOvertimeAmount += rec.overtime_earnings;
    });

    let totalSalaryPaid = 0;
    latestSalaryMap.forEach((val) => {
      totalSalaryPaid += val;
    });

    return {
      totalEmployees,
      presentToday,
      absentToday,
      totalSalaryPaid: Math.round(totalSalaryPaid),
      totalOvertimeAmount: Math.round(totalOvertimeAmount),
      todayDate: today,
    };
  }
};
