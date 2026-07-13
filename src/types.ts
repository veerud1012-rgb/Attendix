export interface Employee {
  employee_id: string; // e.g., "EMP-1024"
  employee_name: string;
  address: string;
  monthly_salary: number; // e.g., 30000
  overtime_hours_rule: number; // e.g., 2 (meaning every 2 hours adds X amount)
  overtime_amount_rule: number; // e.g., 200 (amount added for every X hours)
  joining_date: string; // YYYY-MM-DD
  avatar_color: string; // Tailwind bg color class for avatar styling
  created_at: string;
  employee_image?: string; // Optional Base64 or uploaded image URL
}

export interface Attendance {
  attendance_id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  status: "Present" | "Absent";
  overtime_hours: number; // e.g., 3
  overtime_earnings?: number; // allow custom overtime earnings override
  narration: string; // e.g., "Night Shift"
  created_at: string;
  updated_at?: string; // Optional time of last update
}

export interface AttendanceWithEmployee extends Attendance {
  employee_name: string;
  monthly_salary: number;
  daily_salary: number;
  overtime_earnings: number;
  cumulative_salary: number; // SOS (Sum Of Salary) up to this date
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: "info" | "success" | "warning" | "danger";
}
