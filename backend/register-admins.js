const bcrypt = require('bcryptjs');
const pool = require('./config/db');

// Admin accounts to register
const adminAccounts = [
  { name: 'Rahul Admin', email: 'rahul@gmail.com', password: '12345678' },
  { name: 'Admin One', email: 'admin@arti.com', password: 'admin123456' },
  { name: 'Admin Two', email: 'manager@arti.com', password: 'manager1234' },
  { name: 'Site Admin', email: 'site@arti.com', password: 'site12345678' },
  { name: 'Super Admin', email: 'super@arti.com', password: 'super123456' }
];

(async () => {
  try {
    const connection = await pool.getConnection();

    for (const admin of adminAccounts) {
      try {
        // Check if user already exists
        const [existing] = await connection.query(
          'SELECT email FROM users WHERE email = ?',
          [admin.email]
        );

        if (existing.length > 0) {
          console.log(`✓ ${admin.email} already registered`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(admin.password, 10);

        // Insert admin
        await connection.query(
          'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
          [admin.name, admin.email, hashedPassword, 'ADMIN']
        );

        console.log(`✓ Registered: ${admin.email}`);
      } catch (err) {
        console.log(`✗ ${admin.email}: ${err.message}`);
      }
    }

    connection.release();
    console.log('\n✅ Admin registration complete!');
    console.log('\n📋 Registered Admin Accounts:');
    adminAccounts.forEach(admin => {
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${admin.password}\n`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit();
})();
