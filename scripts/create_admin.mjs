import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined });

(async () => {
  try {
    // add role column if missing
    await pool.query("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher'");
    // relax schema constraints from older schema to allow inserting admin (make class_id nullable)
    try {
      await pool.query("ALTER TABLE teachers ALTER COLUMN class_id DROP NOT NULL");
    } catch (e) {
      // ignore if column missing or already nullable
    }

    const adminName = process.env.ADMIN_NAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
    const hashed = await bcrypt.hash(adminPassword, 10);

    // if a teacher with name 'admin' exists, update; else insert
    const existing = await pool.query('SELECT id FROM teachers WHERE name=$1 LIMIT 1', [adminName]);
    if (existing.rows.length > 0) {
      await pool.query('UPDATE teachers SET password=$1, role=$2 WHERE id=$3', [hashed, 'admin', existing.rows[0].id]);
      console.log('Updated existing admin user (id=', existing.rows[0].id, ')');
    } else {
      // insert with a UUID id if the id column expects text
      // try to generate UUID via pg function; fallback to random string in JS
      try {
        const res = await pool.query("INSERT INTO teachers (name, username, password, role) VALUES ($1,$2,$3,$4) RETURNING id", [adminName, 'admin', hashed, 'admin']);
        console.log('Inserted admin with id=', res.rows[0].id);
      } catch (err) {
        console.error('Insert failed, trying fallback id insertion:', err);
        const rnd = Math.random().toString(36).slice(2, 10);
        const res2 = await pool.query('INSERT INTO teachers (id, name, username, password, role) VALUES ($1,$2,$3,$4,$5) RETURNING id', [rnd, adminName, 'admin', hashed, 'admin']);
        console.log('Inserted admin with fallback id=', res2.rows[0].id);
      }
    }
  } catch (err) {
    console.error('Create admin error:', err);
  } finally {
    await pool.end();
  }
})();
