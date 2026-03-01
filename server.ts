import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { Pool } from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database selection: use Postgres when DATABASE_URL or NETLIFY_DATABASE_URL is present
const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '';
const usePostgres = !!databaseUrl;

let pool: Pool | null = null;
let sqliteDb: any = null;

if (usePostgres) {
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  console.log('Using PostgreSQL database');
} else {
  sqliteDb = new Database('cocobebe.db');
  sqliteDb.pragma('foreign_keys = ON');
  console.log('Using SQLite database');
}

// Initialize tables for Postgres and SQLite
async function initPostgresTables() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        join_date TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        password TEXT DEFAULT '1234',
        class_name TEXT,
        leave_adjustment INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
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

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES teachers(id) ON DELETE CASCADE
      );
    `);
  } catch (err) {
    console.error('Postgres table initialization error:', err);
  }
}

function initSqliteTables() {
  if (!sqliteDb) return;
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      join_date TEXT NOT NULL,
      role TEXT DEFAULT 'teacher',
      password TEXT DEFAULT '1234',
      class_name TEXT,
      leave_adjustment INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES teachers(id) ON DELETE CASCADE
    );
  `);
}

if (usePostgres) initPostgresTables();
else initSqliteTables();

// Seed admin
async function seedAdmin() {
  const adminName = process.env.ADMIN_NAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

  try {
    if (usePostgres && pool) {
      const { rows } = await pool.query('SELECT * FROM teachers WHERE role = $1', ['admin']);
      if (rows.length === 0) {
        await pool.query('INSERT INTO teachers (name, join_date, role, password) VALUES ($1, $2, $3, $4)', [adminName, '2020-01-01', 'admin', adminPassword]);
      } else {
        await pool.query('UPDATE teachers SET name=$1, password=$2 WHERE role=$3', [adminName, adminPassword, 'admin']);
      }
    } else if (sqliteDb) {
      const row = sqliteDb.prepare("SELECT * FROM teachers WHERE role = 'admin'").get();
      if (!row) {
        sqliteDb.prepare('INSERT INTO teachers (name, join_date, role, password) VALUES (?, ?, ?, ?)').run(adminName, '2020-01-01', 'admin', adminPassword);
      } else {
        sqliteDb.prepare("UPDATE teachers SET name = ?, password = ? WHERE role = 'admin'").run(adminName, adminPassword);
      }
    }
  } catch (err) {
    console.error('Admin seed error:', err);
  }
}

seedAdmin();

// Express app
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.get('/api/db-test', async (req, res) => {
  try {
    if (usePostgres && pool) {
      const result = await pool.query('SELECT NOW()');
      return res.json({ ok: true, time: result.rows[0] });
    } else if (sqliteDb) {
      const row = sqliteDb.prepare('SELECT datetime("now") as now').get();
      return res.json({ ok: true, time: row.now });
    }
    res.status(500).json({ ok: false, error: 'no database configured' });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/api/admin', async (req, res) => {
  const { name = 'admin', password = 'admin1234' } = req.body || {};
  try {
    if (usePostgres && pool) {
      await pool.query('UPDATE teachers SET name=$1, password=$2 WHERE role=$3', [name, password, 'admin']);
    } else if (sqliteDb) {
      sqliteDb.prepare("UPDATE teachers SET name = ?, password = ? WHERE role = 'admin'").run(name, password);
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/api/teachers', async (req, res) => {
  try {
    if (usePostgres && pool) {
      const result = await pool.query('SELECT * FROM teachers ORDER BY id ASC');
      return res.json(result.rows);
    } else if (sqliteDb) {
      const teachers = sqliteDb.prepare('SELECT * FROM teachers').all();
      return res.json(teachers);
    }
    res.status(500).json({ error: 'no database' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const actorRoleHeader = req.headers['x-user-role'];
    const actorRole = Array.isArray(actorRoleHeader) ? actorRoleHeader[0] : (actorRoleHeader || '');
    if (actorRole !== 'admin') return res.status(403).json({ error: '권한이 없습니다' });

    const { name, join_date, role, password, class_name } = req.body;
    if (usePostgres && pool) {
      const result = await pool.query('INSERT INTO teachers (name, join_date, role, password, class_name) VALUES ($1,$2,$3,$4,$5) RETURNING id', [name, join_date, role || 'teacher', password || '1234', class_name]);
      return res.json({ id: result.rows[0].id });
    } else if (sqliteDb) {
      const r = sqliteDb.prepare('INSERT INTO teachers (name, join_date, role, password, class_name) VALUES (?,?,?,?,?)').run(name, join_date, role || 'teacher', password || '1234', class_name);
      return res.json({ id: r.lastInsertRowid });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch('/api/teachers/:id', async (req, res) => {
  try {
    const { password, class_name, leave_adjustment } = req.body;
    const id = req.params.id;
    if (usePostgres && pool) {
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (password !== undefined) { updates.push(`password = $${idx++}`); values.push(password); }
      if (class_name !== undefined) { updates.push(`class_name = $${idx++}`); values.push(class_name); }
      if (leave_adjustment !== undefined) { updates.push(`leave_adjustment = $${idx++}`); values.push(leave_adjustment); }
      if (updates.length > 0) { values.push(id); await pool.query(`UPDATE teachers SET ${updates.join(', ')} WHERE id = $${idx}`, values); }
      return res.json({ success: true });
    } else if (sqliteDb) {
      const sets: string[] = []; const vals: any[] = [];
      if (password !== undefined) { sets.push('password = ?'); vals.push(password); }
      if (class_name !== undefined) { sets.push('class_name = ?'); vals.push(class_name); }
      if (leave_adjustment !== undefined) { sets.push('leave_adjustment = ?'); vals.push(leave_adjustment); }
      if (sets.length > 0) { vals.push(id); sqliteDb.prepare(`UPDATE teachers SET ${sets.join(', ')} WHERE id = ?`).run(...vals); }
      return res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    if (usePostgres && pool) {
      await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM leave_requests WHERE teacher_id = $1', [id]);
      await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
      return res.json({ success: true });
    } else if (sqliteDb) {
      sqliteDb.prepare('DELETE FROM notifications WHERE user_id = ?').run(id);
      sqliteDb.prepare('DELETE FROM leave_requests WHERE teacher_id = ?').run(id);
      const r = sqliteDb.prepare('DELETE FROM teachers WHERE id = ?').run(id);
      if (r.changes === 0) return res.status(404).json({ error: 'Teacher not found' });
      return res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/teachers/:id/reset-password', async (req, res) => {
  try {
    const id = req.params.id;
    const newPwd = req.body.password || '1234';
    if (usePostgres && pool) {
      await pool.query('UPDATE teachers SET password = $1 WHERE id = $2', [newPwd, id]);
    } else if (sqliteDb) {
      sqliteDb.prepare('UPDATE teachers SET password = ? WHERE id = ?').run(newPwd, id);
    }
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/leave-requests', async (req, res) => {
  try {
    if (usePostgres && pool) {
      const result = await pool.query('SELECT lr.*, t.name as teacher_name FROM leave_requests lr JOIN teachers t ON lr.teacher_id = t.id ORDER BY lr.start_date DESC');
      return res.json(result.rows);
    } else if (sqliteDb) {
      const rows = sqliteDb.prepare('SELECT lr.*, t.name as teacher_name FROM leave_requests lr JOIN teachers t ON lr.teacher_id = t.id ORDER BY lr.start_date DESC').all();
      return res.json(rows);
    }
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post('/api/leave-requests', async (req, res) => {
  try {
    const { teacher_id, type, start_date, end_date, reason } = req.body;
    if (usePostgres && pool) {
      const r = await pool.query('INSERT INTO leave_requests (teacher_id, type, start_date, end_date, reason) VALUES ($1,$2,$3,$4,$5) RETURNING id', [teacher_id, type, start_date, end_date, reason]);
      const admins = await pool.query("SELECT id FROM teachers WHERE role IN ('admin','director')");
      const teacher = await pool.query('SELECT name FROM teachers WHERE id = $1', [teacher_id]);
      if (teacher.rows.length) {
        const now = new Date().toISOString();
        for (const a of admins.rows) {
          await pool.query('INSERT INTO notifications (user_id, message, created_at) VALUES ($1,$2,$3)', [a.id, `${teacher.rows[0].name} 선생님이 연차를 신청했습니다.`, now]);
        }
      }
      return res.json({ id: r.rows[0].id });
    } else if (sqliteDb) {
      const r = sqliteDb.prepare('INSERT INTO leave_requests (teacher_id, type, start_date, end_date, reason) VALUES (?,?,?,?,?)').run(teacher_id, type, start_date, end_date, reason);
      const admins = sqliteDb.prepare("SELECT id FROM teachers WHERE role IN ('admin','director')").all();
      const teacher = sqliteDb.prepare('SELECT name FROM teachers WHERE id = ?').get(teacher_id);
      const now = new Date().toISOString();
      for (const a of admins) {
        sqliteDb.prepare('INSERT INTO notifications (user_id, message, created_at) VALUES (?,?,?)').run(a.id, `${teacher.name} 선생님이 연차를 신청했습니다.`, now);
      }
      return res.json({ id: r.lastInsertRowid });
    }
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.patch('/api/leave-requests/:id', async (req, res) => {
  try {
    const { status, processed_by } = req.body;
    const processed_at = new Date().toISOString();
    if (usePostgres && pool) {
      await pool.query('UPDATE leave_requests SET status=$1, processed_by=$2, processed_at=$3 WHERE id=$4', [status, processed_by, processed_at, req.params.id]);
      if (status === 'approved') {
        const request = await pool.query('SELECT teacher_id FROM leave_requests WHERE id = $1', [req.params.id]);
        if (request.rows.length) await pool.query('INSERT INTO notifications (user_id, message, created_at) VALUES ($1,$2,$3)', [request.rows[0].teacher_id, '신청하신 연차가 승인되었습니다.', processed_at]);
      }
      return res.json({ success: true });
    } else if (sqliteDb) {
      sqliteDb.prepare('UPDATE leave_requests SET status = ?, processed_by = ?, processed_at = ? WHERE id = ?').run(status, processed_by, processed_at, req.params.id);
      if (status === 'approved') {
        const request = sqliteDb.prepare('SELECT teacher_id FROM leave_requests WHERE id = ?').get(req.params.id);
        sqliteDb.prepare('INSERT INTO notifications (user_id, message, created_at) VALUES (?,?,?)').run(request.teacher_id, '신청하신 연차가 승인되었습니다.', processed_at);
      }
      return res.json({ success: true });
    }
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.delete('/api/leave-requests/:id', async (req, res) => {
  try {
    if (usePostgres && pool) { await pool.query('DELETE FROM leave_requests WHERE id = $1', [req.params.id]); return res.json({ success: true }); }
    if (sqliteDb) { sqliteDb.prepare('DELETE FROM leave_requests WHERE id = ?').run(req.params.id); return res.json({ success: true }); }
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get('/api/notifications/:userId', async (req, res) => {
  try {
    if (usePostgres && pool) { const r = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [req.params.userId]); return res.json(r.rows); }
    if (sqliteDb) { const rows = sqliteDb.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.userId); return res.json(rows); }
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.patch('/api/notifications/:id', async (req, res) => {
  try {
    if (usePostgres && pool) { await pool.query('UPDATE notifications SET is_read = 1 WHERE id = $1', [req.params.id]); return res.json({ success: true }); }
    if (sqliteDb) { sqliteDb.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id); return res.json({ success: true }); }
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.delete('/api/notifications/:userId', async (req, res) => {
  try {
    if (usePostgres && pool) { await pool.query('DELETE FROM notifications WHERE user_id = $1', [req.params.userId]); return res.json({ success: true }); }
    if (sqliteDb) { sqliteDb.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.params.userId); return res.json({ success: true }); }
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// start server when run locally (or via `npm run dev`).
// we only disable listening in serverless environments; with bundle
// wrappers like the Netlify function the platform will invoke the
// exported `app` rather than letting us call `.listen` ourselves.
const isServerless = process.env.NETLIFY_FUNCTION_PATH || process.env.AWS_REGION || process.env.VERCEL;
if (!isServerless) {
  const port = parseInt(process.env.PORT || '3000', 10);
  app.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}`));
}

export default app;
