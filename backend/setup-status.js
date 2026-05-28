const pool = require('./config/db');

(async () => {
  try {
    const connection = await pool.getConnection();
    
    // Add status column if it doesn't exist
    try {
      await connection.query('ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT "PENDING"');
      console.log('✅ Status column added');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('✅ Status column already exists');
      } else {
        throw err;
      }
    }
    
    // Set ADMINS to APPROVED status
    await connection.query('UPDATE users SET status = "APPROVED" WHERE role = "ADMIN"');
    console.log('✅ All admins set to APPROVED');
    
    // New workers/members should be PENDING
    console.log('✅ New workers will default to PENDING status');
    
    connection.release();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit();
})();
