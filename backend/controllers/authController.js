const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const ADMIN_AUTH_KEY = process.env.ADMIN_AUTH_KEY || 'ARRKPAPA';
const SITE_MANAGER_AUTH_KEY = process.env.SITE_MANAGER_AUTH_KEY || 'SITE2026';

// ==================== SIGNUP ====================
exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      mobile,
      workType,
      age,
      aadharNumber,
      role = 'MEMBER',
    } = req.body;

    // Only MEMBER role allowed for signup (Worker registration)
    // Admin accounts must be pre-registered - no admin signup allowed
    if (role && String(role).toUpperCase() !== 'MEMBER') {
      return res.status(403).json({ 
        error: 'Admin registration is not available. Only workers/members can register. Admin accounts must be pre-registered.' 
      });
    }

    if (!name || !email || !password || !confirmPassword || !mobile || !workType || !age || !aadharNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const ageValue = Number(age);
    if (Number.isNaN(ageValue) || ageValue <= 0) {
      return res.status(400).json({ error: 'Please provide a valid age' });
    }

    const connection = await pool.getConnection();

    // Check if user already exists by email or Aadhar
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? OR aadhar_number = ?',
      [email, aadharNumber]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email or Aadhar already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Always register as MEMBER with PENDING status
    const userRole = 'MEMBER';
    const userStatus = 'PENDING';
    const defaultSalary = 0.00;

    const [result] = await connection.query(
      `INSERT INTO users
        (name, email, password, role, status, mobile, work_type, age, aadhar_number, daily_salary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, hashedPassword, userRole, userStatus, mobile, workType, ageValue, aadharNumber, defaultSalary]
    );

    connection.release();

    res.status(201).json({
      message: 'Worker registration received. Awaiting admin approval.',
      user: {
        id: result.insertId,
        name,
        email,
        role: userRole,
        status: userStatus,
        mobile,
        workType,
        age: ageValue,
        aadharNumber,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, name, email, password, role, status, mobile, work_type, age, aadhar_number, daily_salary, profile_photo, created_at FROM users WHERE email = ?',
      [email]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (role && user.role !== String(role).toUpperCase()) {
      return res.status(403).json({ error: 'This account does not have the requested access role' });
    }

    // Return user data (without password)
    const createdAt = user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString();
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'MEMBER',
        status: user.status || 'PENDING',
        mobile: user.mobile || '',
        workType: user.work_type || '',
        age: user.age || 0,
        aadharNumber: user.aadhar_number || '',
        dailySalary: parseFloat(user.daily_salary || 0),
        profilePhoto: user.profile_photo || '',
        createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== RESET PASSWORD ====================
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.query('UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?', [hashedPassword, email]);

    const [updatedRows] = await connection.query(
      'SELECT id, name, email, role, status, mobile, work_type, age, aadhar_number, daily_salary, profile_photo, created_at FROM users WHERE email = ?',
      [email]
    );

    connection.release();

    const updatedUser = updatedRows[0];
    const createdAt = updatedUser.created_at ? new Date(updatedUser.created_at).toISOString() : new Date().toISOString();
    res.status(200).json({
      message: 'Password reset successful',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role || 'MEMBER',
        status: updatedUser.status || 'PENDING',
        mobile: updatedUser.mobile || '',
        workType: updatedUser.work_type || '',
        age: updatedUser.age || 0,
        aadharNumber: updatedUser.aadhar_number || '',
        dailySalary: parseFloat(updatedUser.daily_salary || 0),
        profilePhoto: updatedUser.profile_photo || '',
        createdAt,
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== CHECK EMAIL EXISTENCE ====================
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, email FROM users WHERE email = ?', [email]);
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.status(200).json({ message: 'Email exists', email: users[0].email });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: error.message });
  }
};
