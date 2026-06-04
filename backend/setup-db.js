const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
  try {
    console.log('🔧 Setting up database...\n');

    // First, create connection without selecting a database to create the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '@Sonu1234',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      multipleStatements: true
    });

    console.log('✓ Connected to MySQL\n');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    // Remove comments
    schema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    try {
      await connection.query(schema);
      console.log('✓ Database and tables created successfully');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✓ Database and tables already exist');
      } else {
        console.error('Error executing schema:', err.message);
      }
    }

    await connection.end();
    console.log('\n✅ Database setup complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
