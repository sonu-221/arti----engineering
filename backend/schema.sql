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
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Data (Optional)
INSERT INTO users (name, email, password) VALUES
('Admin User', 'admin@artieng.com', 'hashed_password_123'),
('John Doe', 'john@example.com', 'hashed_password_456');
