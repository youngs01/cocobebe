import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined });

(async () => {
  try {
    console.log('Teachers columns:');
    const t = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='teachers' ORDER BY ordinal_position");
    console.table(t.rows);

    console.log('\nLeave_requests columns:');
    const l = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='leave_requests' ORDER BY ordinal_position");
    console.table(l.rows);

    console.log('\nSample teachers rows (first 10):');
    const s = await pool.query('SELECT id, name, username, password, phone FROM teachers LIMIT 10');
    console.table(s.rows);
  } catch (err) {
    console.error('Error querying schema:', err);
  } finally {
    await pool.end();
  }
})();
