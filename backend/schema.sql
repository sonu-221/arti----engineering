-- ===================================================
-- ARTI ENGINEERING - CONSTRUCTION MANAGEMENT SYSTEM
-- Database Schema
-- ===================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS arti_db;
USE arti_db;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('MEMBER', 'ADMIN', 'SITE_MANAGER', 'SUPER_ADMIN') NOT NULL DEFAULT 'MEMBER',
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
  mobile VARCHAR(20) DEFAULT NULL,
  work_type VARCHAR(100) DEFAULT NULL,
  age INT DEFAULT NULL,
  aadhar_number VARCHAR(20) UNIQUE DEFAULT NULL,
  daily_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  profile_photo VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('PRESENT', 'ABSENT', 'HALF_DAY') NOT NULL DEFAULT 'PRESENT',
  duty_status ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
  duty_on_time VARCHAR(10) DEFAULT NULL,
  duty_off_time VARCHAR(10) DEFAULT NULL,
  overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  punch_in_photo TEXT DEFAULT NULL,
  punch_out_photo TEXT DEFAULT NULL,
  daily_salary_snapshot DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  work_type_snapshot VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance_record (user_id, date),
  INDEX idx_attendance_date (date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Salary Payments Table
CREATE TABLE IF NOT EXISTS salary_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  month VARCHAR(7) NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Inventory Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  location VARCHAR(200) NOT NULL,
  budget DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'PLANNING',
  progress INT NOT NULL DEFAULT 0,
  image TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Data (Optional)
INSERT INTO users (name, email, password, role, status, mobile, work_type, age, aadhar_number, daily_salary) VALUES
('Admin User', 'admin@artieng.com', 'hashed_password_123', 'ADMIN', 'APPROVED', '9999999999', 'Administrator', 35, '000011112222', 0.00),
('John Doe', 'john@example.com', 'hashed_password_456', 'MEMBER', 'APPROVED', '8888888888', 'Helper', 28, '111122223333', 350.00);
