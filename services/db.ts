
import { User, AttendanceRecord, SalaryPayment, UserRole, UserStatus, AttendanceStatus, DutyStatus, InventoryItem, Project } from '../types';
import bcrypt from 'bcryptjs';

const USERS_KEY = 'aarti_users';
const ATTENDANCE_KEY = 'aarti_attendance';
const PAYMENTS_KEY = 'aarti_payments';
const LOGS_KEY = 'aarti_logs';
const INVENTORY_KEY = 'aarti_inventory';
const PROJECTS_KEY = 'aarti_projects';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userId: string;
}

const initializeDB = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify([]));
    localStorage.setItem(LOGS_KEY, JSON.stringify([]));
    localStorage.setItem(INVENTORY_KEY, JSON.stringify([]));
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
  } else {
    if (!localStorage.getItem(ATTENDANCE_KEY)) localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
    if (!localStorage.getItem(PAYMENTS_KEY)) localStorage.setItem(PAYMENTS_KEY, JSON.stringify([]));
    if (!localStorage.getItem(LOGS_KEY)) localStorage.setItem(LOGS_KEY, JSON.stringify([]));
    if (!localStorage.getItem(INVENTORY_KEY)) localStorage.setItem(INVENTORY_KEY, JSON.stringify([]));
    if (!localStorage.getItem(PROJECTS_KEY)) localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
  }
};

export const db = {
  init: initializeDB,
  
  users: {
    getAll: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
    getById: (id: string): User | undefined => db.users.getAll().find(u => u.id === id),
    getByEmail: (email: string): User | undefined => db.users.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()),
    save: (user: User) => {
      const users = db.users.getAll();
      const existingIdx = users.findIndex(u => u.id === user.id);
      if (existingIdx > -1) users[existingIdx] = user;
      else users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      db.logs.add(`User ${user.fullName} (${user.role}) saved/created.`);
    },
    update: (id: string, updates: Partial<User>) => {
      const users = db.users.getAll();
      const idx = users.findIndex(u => u.id === id);
      if (idx > -1) {
        users[idx] = { ...users[idx], ...updates };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        db.logs.add(`User ${users[idx].fullName} status updated to ${updates.status || 'modified'}`);
      }
    },
    updatePasswordByEmail: (email: string, newPasswordPlain: string) => {
      const users = db.users.getAll();
      const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx > -1) {
        const hashedPassword = bcrypt.hashSync(newPasswordPlain, 10);
        users[idx].password = hashedPassword;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        db.logs.add(`Password reset successful for ${users[idx].fullName}`);
        return users[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const user = db.users.getById(id);
      const users = db.users.getAll().filter(u => u.id !== id);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      if (user) db.logs.add(`User ${user.fullName} deleted from system.`);
    }
  },

  attendance: {
    getAll: (): AttendanceRecord[] => JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '[]'),
    getByUser: (userId: string): AttendanceRecord[] => db.attendance.getAll().filter(a => a.userId === userId),
    getByDate: (date: string): AttendanceRecord[] => db.attendance.getAll().filter(a => a.date === date),
    save: (record: AttendanceRecord) => {
      const records = db.attendance.getAll();
      const existingIdx = records.findIndex(r => r.userId === record.userId && r.date === record.date);
      if (existingIdx > -1) records[existingIdx] = record;
      else records.push(record);
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
    },
    saveBulk: (newRecords: AttendanceRecord[]) => {
      const records = db.attendance.getAll();
      newRecords.forEach(record => {
        const existingIdx = records.findIndex(r => r.userId === record.userId && r.date === record.date);
        if (existingIdx > -1) records[existingIdx] = record;
        else records.push(record);
      });
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
    }
  },

  payments: {
    getAll: (): SalaryPayment[] => JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]'),
    getByUser: (userId: string): SalaryPayment[] => db.payments.getAll().filter(p => p.userId === userId),
    save: (payment: SalaryPayment) => {
      const payments = db.payments.getAll();
      payments.push(payment);
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
      const user = db.users.getById(payment.userId);
      db.logs.add(`Payment of ₹${payment.amount} recorded for ${user?.fullName}`);
    }
  },

  inventory: {
    getAll: (): InventoryItem[] => JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]'),
    save: (item: InventoryItem) => {
      const items = db.inventory.getAll();
      const existingIdx = items.findIndex(i => i.id === item.id);
      if (existingIdx > -1) items[existingIdx] = item;
      else items.push(item);
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
      if (existingIdx === -1) db.logs.add(`Inventory item ${item.name} added.`);
    },
    updateQuantity: (id: string, delta: number) => {
      const items = db.inventory.getAll();
      const idx = items.findIndex(i => i.id === id);
      if (idx > -1) {
        items[idx].quantity = Math.max(0, items[idx].quantity + delta);
        items[idx].lastUpdated = new Date().toISOString();
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
      }
    },
    delete: (id: string) => {
      const items = db.inventory.getAll().filter(i => i.id !== id);
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
    }
  },

  projects: {
    getAll: (): Project[] => JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'),
    save: (project: Project) => {
      const projects = db.projects.getAll();
      const existingIdx = projects.findIndex(p => p.id === project.id);
      if (existingIdx > -1) projects[existingIdx] = project;
      else projects.push(project);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      if (existingIdx === -1) db.logs.add(`Project ${project.name} created.`);
    },
    update: (id: string, updates: Partial<Project>) => {
      const projects = db.projects.getAll();
      const idx = projects.findIndex(p => p.id === id);
      if (idx > -1) {
        projects[idx] = { ...projects[idx], ...updates };
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      }
    },
    delete: (id: string) => {
      const projects = db.projects.getAll().filter(p => p.id !== id);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  },

  logs: {
    getAll: (): ActivityLog[] => JSON.parse(localStorage.getItem(LOGS_KEY) || '[]'),
    add: (details: string) => {
      const logs = db.logs.getAll();
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_EVENT',
        details,
        userId: 'SYSTEM'
      };
      logs.push(newLog);
      if (logs.length > 100) logs.shift();
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    }
  }
};
