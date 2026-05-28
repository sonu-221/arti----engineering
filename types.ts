
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SITE_MANAGER = 'SITE_MANAGER',
  MEMBER = 'MEMBER'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY'
}

export enum DutyStatus {
  ON = 'ON',
  OFF = 'OFF'
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD'
}

export interface User {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  role: UserRole;
  workType: string;
  dailySalary: number;
  status: UserStatus;
  password?: string;
  createdAt: string;
  profilePhoto?: string; // Base64 encoded profile image
  hasSeenWelcome?: boolean;
  aadharNumber?: string;
  age?: number;
  // New Profile Fields
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  pancard?: string;
  state?: string;
  pincode?: string;
  village?: string;
  city?: string;
  district?: string;
  policeStation?: string;
  block?: string;
  // Bank Details
  accountNumber?: string;
  ifscCode?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // ISO String (YYYY-MM-DD)
  status: AttendanceStatus;
  dutyStatus: DutyStatus;
  dutyOnTime?: string; // e.g., "08:15"
  dutyOffTime?: string; // e.g., "18:05"
  overtimeHours: number;
  punchInPhoto?: string; // Base64 image
  punchOutPhoto?: string; // Base64 image
  
  // Historical Snapshots (For Promotions/Rate Changes)
  dailySalarySnapshot?: number; 
  workTypeSnapshot?: string;
}

export interface SalaryPayment {
  id: string;
  userId: string;
  amount: number;
  date: string;
  month: string; // e.g., "2023-10"
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unitType: string; // e.g., 'rolls', 'bags', 'kg'
  quantity: number;
  lowStockThreshold: number;
  unitPrice: number;
  lastUpdated: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  image?: string; // Base64
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
