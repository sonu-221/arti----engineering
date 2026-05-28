const pool = require('./config/db');

(async () => {
  try {
    const connection = await pool.getConnection();
    
    // Add role column if it doesn't exist
    try {
      await connection.query('ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT "USER"');
      console.log('✅ Role column added');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('✅ Role column already exists');
      }
    }
    
    // Set ADMIN role for rahul@gmail.com
    await connection.query('UPDATE users SET role = ? WHERE email = ?', ['ADMIN', 'rahul@gmail.com']);
    console.log('✅ Admin role assigned to rahul@gmail.com');
    
    connection.release();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit();
})();
