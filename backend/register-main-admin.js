const bcrypt = require('bcryptjs');
const pool = require('./config/db');

(async () => {
  try {
    const connection = await pool.getConnection();

    const adminData = {
      name: 'Admin User',
      email: 'thelegist5665@gmail.com',
      password: '1235678',
      role: 'ADMIN',
      status: 'APPROVED'
    };

    console.log('🔧 Registering admin account...\n');

    // Check if admin already exists
    const [existing] = await connection.query(
      'SELECT email FROM users WHERE email = ?',
      [adminData.email]
    );

    if (existing.length > 0) {
      console.log(`⚠️  Admin with email ${adminData.email} already exists`);
      console.log('Updating password...\n');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      // Update existing admin
      await connection.query(
        'UPDATE users SET password = ?, role = ?, status = ? WHERE email = ?',
        [hashedPassword, adminData.role, adminData.status, adminData.email]
      );
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // Insert new admin
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [adminData.name, adminData.email, hashedPassword, adminData.role, adminData.status]
      );

      console.log(`✅ Admin registered successfully with ID: ${result.insertId}\n`);
    }

    console.log('📋 Admin Account Details:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Role: ${adminData.role}`);
    console.log(`   Status: ${adminData.status}`);
    console.log('\n✅ Admin account is ready for login!\n');

    connection.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  process.exit();
})();
