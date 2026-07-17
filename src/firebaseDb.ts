import { 
  collection, getDocs, doc, setDoc, deleteDoc, writeBatch, getDocFromServer 
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Employee, Attendance, ActivityLog } from "./types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection Validation on app boot as per Firebase Skill guidelines
export async function validateFirestoreConnection() {
  const testPath = "test/connection";
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or network status.");
    }
  }
}

// Fetch user employees
export async function fetchUserEmployees(userId: string): Promise<Employee[]> {
  const path = `users/${userId}/employees`;
  try {
    const snapshot = await getDocs(collection(db, "users", userId, "employees"));
    return snapshot.docs.map(doc => doc.data() as Employee);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Fetch user attendance
export async function fetchUserAttendance(userId: string): Promise<Attendance[]> {
  const path = `users/${userId}/attendance`;
  try {
    const snapshot = await getDocs(collection(db, "users", userId, "attendance"));
    return snapshot.docs.map(doc => doc.data() as Attendance);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Fetch user activity logs
export async function fetchUserLogs(userId: string): Promise<ActivityLog[]> {
  const path = `users/${userId}/logs`;
  try {
    const snapshot = await getDocs(collection(db, "users", userId, "logs"));
    const logs = snapshot.docs.map(doc => doc.data() as ActivityLog);
    // Sort logs descending by timestamp
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Save or Update user employee
export async function saveUserEmployee(userId: string, employee: Employee): Promise<void> {
  const path = `users/${userId}/employees/${employee.employee_id}`;
  try {
    // Sanitize to avoid "undefined" value errors in Firestore
    const dataToSave = { ...employee };
    if (dataToSave.employee_image === undefined) {
      delete dataToSave.employee_image;
    }
    await setDoc(doc(db, "users", userId, "employees", employee.employee_id), dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete user employee
export async function deleteUserEmployee(userId: string, employeeId: string): Promise<void> {
  const path = `users/${userId}/employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "employees", employeeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save or Update user attendance
export async function saveUserAttendance(userId: string, attendance: Attendance): Promise<void> {
  const path = `users/${userId}/attendance/${attendance.attendance_id}`;
  try {
    // Sanitize to avoid "undefined" value errors in Firestore
    const dataToSave = { ...attendance };
    if (dataToSave.overtime_earnings === undefined) {
      delete dataToSave.overtime_earnings;
    }
    if (dataToSave.updated_at === undefined) {
      delete dataToSave.updated_at;
    }
    await setDoc(doc(db, "users", userId, "attendance", attendance.attendance_id), dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete user attendance
export async function deleteUserAttendance(userId: string, attendanceId: string): Promise<void> {
  const path = `users/${userId}/attendance/${attendanceId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "attendance", attendanceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save user activity log
export async function saveUserLog(userId: string, log: ActivityLog): Promise<void> {
  const path = `users/${userId}/logs/${log.id}`;
  try {
    await setDoc(doc(db, "users", userId, "logs", log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Clear all logs for user
export async function clearUserLogs(userId: string, logIds: string[]): Promise<void> {
  const path = `users/${userId}/logs`;
  try {
    const batch = writeBatch(db);
    logIds.forEach(id => {
      batch.delete(doc(db, "users", userId, "logs", id));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bulk delete or clear attendance records
export async function clearUserAttendance(userId: string, attendanceIds: string[]): Promise<void> {
  const path = `users/${userId}/attendance`;
  try {
    const batch = writeBatch(db);
    attendanceIds.forEach(id => {
      batch.delete(doc(db, "users", userId, "attendance", id));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bulk delete employees
export async function clearUserEmployees(userId: string, employeeIds: string[]): Promise<void> {
  const path = `users/${userId}/employees`;
  try {
    const batch = writeBatch(db);
    employeeIds.forEach(id => {
      batch.delete(doc(db, "users", userId, "employees", id));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
