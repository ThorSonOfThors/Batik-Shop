// src/scripts/createAdmin.ts
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  // dynamically import db.ts
  const { pool } = await import('../config/db.ts');

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'secret123';
  const ADMIN_ROLE = 'admin';

  try {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const res = await pool.query('SELECT * FROM users WHERE username = $1', [ADMIN_USERNAME]);
    if (res.rows.length > 0) {
      console.log('✅ Admin already exists.');
    } else {
      await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [ADMIN_USERNAME, hashedPassword, ADMIN_ROLE]
      );
      console.log('✅ Admin user created successfully.');
    }
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    await pool.end();
  }
}

createAdmin();
