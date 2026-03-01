import { Client } from 'pg';

// Usage: set DATABASE_URL env var, e.g. in PowerShell:
// $env:DATABASE_URL='postgresql://...'; $env:DB_SSL='true'; node scripts/init-db.mjs

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set. Aborting.');
  process.exit(1);
}

const useSsl = process.env.DB_SSL === 'true' || true; // prefer SSL by default for managed DB

const client = new Client({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

async function init() {
  try {
    await client.connect();
    console.log('Connected to Postgres, initializing schema...');

    // Drop dependent tables first
    await client.query('DROP TABLE IF EXISTS notifications');
    await client.query('DROP TABLE IF EXISTS leave_requests');
    await client.query('DROP TABLE IF EXISTS teachers');

    // Recreate tables
    await client.query(`
      CREATE TABLE teachers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        join_date TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        password TEXT DEFAULT '1234',
        class_name TEXT,
        leave_adjustment INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE leave_requests (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        reason TEXT,
        processed_by TEXT,
        processed_at TEXT,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES teachers(id) ON DELETE CASCADE
      );
    `);

    // Seed admin
    const adminName = process.env.ADMIN_NAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
    await client.query(
      'INSERT INTO teachers (name, join_date, role, password) VALUES ($1, $2, $3, $4)',
      [adminName, '2020-01-01', 'admin', adminPassword]
    );

    console.log('Database initialized and admin seeded.');
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

init();
