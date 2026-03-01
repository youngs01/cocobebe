import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client, Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Setup
// Prefer explicit `USE_POSTGRES=true`, but fall back to using Postgres when a DATABASE_URL (or Netlify's NETLIFY_DATABASE_URL) is present.
const usePostgres = process.env.USE_POSTGRES === 'true' || !!process.env.DATABASE_URL || !!process.env.NETLIFY_DATABASE_URL;
const useSupabase = !usePostgres && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

let db: any = null;
let pool: any = null;
let supabase: any = null;

if (usePostgres) {
  // PostgreSQL Setup
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  console.log('Using PostgreSQL database');
} else if (useSupabase) {
  // Supabase Setup
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Using Supabase database');
} else {
  // SQLite Setup
  db = new Database('cocobebe.db');
  db.pragma('foreign_keys = ON');
  console.log('Using SQLite database');
}

// Initialize Database (SQLite or PostgreSQL)
if (usePostgres && pool) {
  // PostgreSQL table initialization
  pool.query(`
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
  `, (err: any) => {
    if (err) console.error('PostgreSQL table initialization error:', err);
  });
} else if (!supabase) {
  // SQLite table initialization
  db.exec(`
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

  // Migration: Add leave_adjustment to teachers if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(teachers)").all();
    if (!tableInfo.some((col: any) => col.name === 'leave_adjustment')) {
      db.prepare("ALTER TABLE teachers ADD COLUMN leave_adjustment INTEGER DEFAULT 0").run();
    }
  } catch (e) {
    // Migration may have already been applied
  }

  // Migration: Add processed_by, processed_at to leave_requests if they don't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(leave_requests)").all();
    if (!tableInfo.some((col: any) => col.name === 'processed_by')) {
      db.prepare("ALTER TABLE leave_requests ADD COLUMN processed_by TEXT").run();
    }
    if (!tableInfo.some((col: any) => col.name === 'processed_at')) {
      db.prepare("ALTER TABLE leave_requests ADD COLUMN processed_at TEXT").run();
    }
  } catch (e) {
    // Migration may have already been applied
  }
}

// Seed or Update Admin
if (usePostgres && pool) {
  const adminName = process.env.ADMIN_NAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  
  pool.query('SELECT * FROM teachers WHERE role = $1', ['admin'], (err: any, result: any) => {
    if (!err) {
      if (result.rows.length === 0) {
        pool.query(
          'INSERT INTO teachers (name, join_date, role, password) VALUES ($1, $2, $3, $4)',
          [adminName, '2020-01-01', 'admin', adminPassword]
        );
      } else {
        pool.query(
          'UPDATE teachers SET name = $1, password = $2 WHERE role = $3',
          [adminName, adminPassword, 'admin']
        );
      }
    }
  });
} else if (!supabase && db) {
  // SQLite
  const adminName = process.env.ADMIN_NAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  const existingAdmin = db.prepare("SELECT * FROM teachers WHERE role = 'admin'").get();

  if (!existingAdmin) {
    db.prepare("INSERT INTO teachers (name, join_date, role, password) VALUES (?, ?, ?, ?)").run(adminName, '2020-01-01', 'admin', adminPassword);
  } else {
    db.prepare("UPDATE teachers SET name = ?, password = ? WHERE role = 'admin'").run(adminName, adminPassword);
  }
}

// create the Express app and configure it; we export it for both serverless and local use
const app = express();
// allow cross-origin requests from Netlify frontend (or any origin during development)
app.use(cors({ origin: '*' }));
app.use(express.json());

// Seed Admin (Supabase)
async function seedAdminSupabase() {
  const adminName = process.env.ADMIN_NAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  const { data: existingAdmin } = await supabase
    .from('teachers')
    .select('*')
    .eq('role', 'admin')
    .single();

  if (!existingAdmin) {
    await supabase
      .from('teachers')
      .insert([{ name: adminName, join_date: '2020-01-01', role: 'admin', password: adminPassword }]);
  } else {
    await supabase
      .from('teachers')
      .update({ name: adminName, password: adminPassword })
      .eq('role', 'admin');
  }
}

// API Routes
// simple database connectivity check
app.get('/api/db-test', async (req, res) => {
  try {
    if (usePostgres && pool) {
      const result = await pool.query('SELECT NOW()');
      return res.json({ ok: true, time: result.rows[0] });
    } else if (supabase) {
      const { data, error } = await supabase.from('teachers').select('id').limit(1);
      if (error) throw error;
      return res.json({ ok: true, sample: data });
    } else if (db) {
      const row = db.prepare('SELECT datetime("now") as now').get();
      return res.json({ ok: true, time: row.now });
    }
    res.status(500).json({ ok: false, error: 'no database configured' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err });
  }
});

  // convenience endpoint: reset or update admin account
  app.post('/api/admin', async (req, res) => {
    const { name = 'admin', password = 'admin1234' } = req.body || {};
    try {
      if (usePostgres && pool) {
        await pool.query(
          'UPDATE teachers SET name=$1, password=$2 WHERE role=$3',
          [name, password, 'admin']
        );
      } else if (supabase) {
        await supabase
          .from('teachers')
          .update({ name, password })
          .eq('role', 'admin');
      } else if (db) {
        db.prepare("UPDATE teachers SET name = ?, password = ? WHERE role = 'admin'").run(name, password);
      }
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err });
    }
  });


  app.get('/api/teachers', async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('teachers').select('*').order('id', { ascending: true });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      } else if (usePostgres && pool) {
        const result = await pool.query('SELECT * FROM teachers ORDER BY id ASC');
        return res.json(result.rows);
      } else {
        const teachers = db.prepare("SELECT * FROM teachers").all();
        return res.json(teachers);
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.post('/api/teachers', async (req, res) => {
    try {
      // Simple authorization: only admin role may create teachers
      const actorRoleHeader = req.headers['x-user-role'];
      const actorRole = Array.isArray(actorRoleHeader) ? actorRoleHeader[0] : (actorRoleHeader || '');
      if (actorRole !== 'admin') {
        return res.status(403).json({ error: '권한이 없습니다. 관리자만 교직원을 등록할 수 있습니다.' });
      }
      const { name, join_date, role, password, class_name } = req.body;
      if (supabase) {
        const { data, error } = await supabase
          .from('teachers')
          .insert([{ name, join_date, role: role || 'teacher', password: password || '1234', class_name }])
          .select();
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ id: data[0].id });
      } else if (usePostgres && pool) {
        const result = await pool.query(
          'INSERT INTO teachers (name, join_date, role, password, class_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [name, join_date, role || 'teacher', password || '1234', class_name]
        );
        res.json({ id: result.rows[0].id });
      } else {
        const result = db.prepare("INSERT INTO teachers (name, join_date, role, password, class_name) VALUES (?, ?, ?, ?, ?)").run(name, join_date, role || 'teacher', password || '1234', class_name);
        res.json({ id: result.lastInsertRowid });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.patch('/api/teachers/:id', async (req, res) => {
    try {
      const { password, class_name, leave_adjustment } = req.body;
      const id = req.params.id;

      if (supabase) {
        const updateData: any = {};
        if (password !== undefined) updateData.password = password;
        if (class_name !== undefined) updateData.class_name = class_name;
        if (leave_adjustment !== undefined) updateData.leave_adjustment = leave_adjustment;

        const { error } = await supabase
          .from('teachers')
          .update(updateData)
          .eq('id', id);
        
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      } else if (usePostgres && pool) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (password !== undefined) {
          updates.push(`password = $${paramCount}`);
          values.push(password);
          paramCount++;
        }
        if (class_name !== undefined) {
          updates.push(`class_name = $${paramCount}`);
          values.push(class_name);
          paramCount++;
        }
        if (leave_adjustment !== undefined) {
          updates.push(`leave_adjustment = $${paramCount}`);
          values.push(leave_adjustment);
          paramCount++;
        }

        if (updates.length > 0) {
          values.push(id);
          await pool.query(`UPDATE teachers SET ${updates.join(", ")} WHERE id = $${paramCount}`, values);
        }
        res.json({ success: true });
      } else {
        const updates = [];
        const values = [];
        if (password !== undefined) {
          updates.push("password = ?");
          values.push(password);
        }
        if (class_name !== undefined) {
          updates.push("class_name = ?");
          values.push(class_name);
        }
        if (leave_adjustment !== undefined) {
          updates.push("leave_adjustment = ?");
          values.push(leave_adjustment);
        }

        if (updates.length > 0) {
          values.push(id);
          db.prepare(`UPDATE teachers SET ${updates.join(", ")} WHERE id = ?`).run(...values);
        }
        res.json({ success: true });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.delete('/api/teachers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid teacher ID' });
      }

      if (supabase) {
        // Delete notifications first, then leave_requests, then teacher
        await supabase.from('notifications').delete().eq('user_id', id);
        await supabase.from('leave_requests').delete().eq('teacher_id', id);
        const { error } = await supabase.from('teachers').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      } else if (usePostgres && pool) {
        // Delete notifications first, then leave_requests, then teacher
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM leave_requests WHERE teacher_id = $1', [id]);
        const result = await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Teacher not found' });
        }
        return res.json({ success: true });
      } else {
        // SQLite: Delete notifications first, then leave_requests, then teacher
        db.prepare("DELETE FROM notifications WHERE user_id = ?").run(id);
        db.prepare("DELETE FROM leave_requests WHERE teacher_id = ?").run(id);
        const teacherResult = db.prepare("DELETE FROM teachers WHERE id = ?").run(id);
        
        if (teacherResult.changes === 0) {
          return res.status(404).json({ error: 'Teacher not found' });
        }
        return res.json({ success: true });
      }
    } catch (error) {
      console.error('Delete teacher error:', error);
      res.status(500).json({ error: 'Failed to delete teacher' });
    }
  });

  // reset teacher password (admin use)
  app.post('/api/teachers/:id/reset-password', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newPwd = req.body.password || '1234';
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid teacher ID' });

      if (supabase) {
        const { error } = await supabase.from('teachers').update({ password: newPwd }).eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
      } else if (usePostgres && pool) {
        await pool.query('UPDATE teachers SET password = $1 WHERE id = $2', [newPwd, id]);
      } else {
        db.prepare('UPDATE teachers SET password = ? WHERE id = ?').run(newPwd, id);
      }
      return res.json({ success: true });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.get('/api/leave-requests', async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('leave_requests')
          .select(`
            *,
            teachers (
              name
            )
          `)
          .order('start_date', { ascending: false });
        
        if (error) return res.status(500).json({ error: error.message });
        
        const formatted = data.map((r: any) => ({
          ...r,
          teacher_name: r.teachers?.name
        }));
        
        return res.json(formatted);
      } else if (usePostgres && pool) {
        const result = await pool.query(`
          SELECT lr.*, t.name as teacher_name 
          FROM leave_requests lr 
          JOIN teachers t ON lr.teacher_id = t.id
          ORDER BY lr.start_date DESC
        `);
        return res.json(result.rows);
      } else {
        const requests = db.prepare(`
          SELECT lr.*, t.name as teacher_name 
          FROM leave_requests lr 
          JOIN teachers t ON lr.teacher_id = t.id
          ORDER BY lr.start_date DESC
        `).all();
        return res.json(requests);
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.post('/api/leave-requests', async (req, res) => {
    try {
      const { teacher_id, type, start_date, end_date, reason } = req.body;
      if (supabase) {
        const { data, error } = await supabase
          .from('leave_requests')
          .insert([{ teacher_id, type, start_date, end_date, reason }])
          .select();
        if (error) return res.status(500).json({ error: error.message });
        
        // Notify admins
        const { data: admins } = await supabase.from('teachers').select('id').in('role', ['admin', 'director']);
        const { data: teacherData } = await supabase.from('teachers').select('name').eq('id', teacher_id).single();
        const now = new Date().toISOString();
        if (admins && teacherData) {
          const notifications = admins.map((admin: any) => ({
            user_id: admin.id,
            message: `${teacherData.name} 선생님이 연차를 신청했습니다.`,
            created_at: now
          }));
          await supabase.from('notifications').insert(notifications);
        }
        
        return res.json({ id: data[0].id });
      } else if (usePostgres && pool) {
        const result = await pool.query(
          'INSERT INTO leave_requests (teacher_id, type, start_date, end_date, reason) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [teacher_id, type, start_date, end_date, reason]
        );
        
        // Notify Admins/Directors
        const admins = await pool.query("SELECT id FROM teachers WHERE role IN ('admin', 'director')");
        const teacher = await pool.query("SELECT name FROM teachers WHERE id = $1", [teacher_id]);
        
        if (teacher.rows.length > 0) {
          const now = new Date().toISOString();
          const notifications = admins.rows.map((admin: any) => [
            admin.id,
            `${teacher.rows[0].name} 선생님이 연차를 신청했습니다.`,
            now
          ]);
          
          for (const notif of notifications) {
            await pool.query(
              'INSERT INTO notifications (user_id, message, created_at) VALUES ($1, $2, $3)',
              notif
            );
          }
        }
        
        return res.json({ id: result.rows[0].id });
      } else {
        const result = db.prepare("INSERT INTO leave_requests (teacher_id, type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)").run(teacher_id, type, start_date, end_date, reason);
        
        // Notify Director/Admin
        const admins = db.prepare("SELECT id FROM teachers WHERE role IN ('admin', 'director')").all();
        const teacher = db.prepare("SELECT name FROM teachers WHERE id = ?").get(teacher_id);
        const now = new Date().toISOString();
        admins.forEach((admin: any) => {
          db.prepare("INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, ?)").run(
            admin.id, 
            `${teacher.name} 선생님이 연차를 신청했습니다.`,
            now
          );
        });

        return res.json({ id: result.lastInsertRowid });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.patch('/api/leave-requests/:id', async (req, res) => {
    try {
      const { status, processed_by } = req.body;
      const processed_at = new Date().toISOString();
      
      if (supabase) {
        const { error } = await supabase
          .from('leave_requests')
          .update({ status, processed_by, processed_at })
          .eq('id', req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        
        // Notify Teacher if approved
        if (status === 'approved') {
          const { data: request } = await supabase.from('leave_requests').select('teacher_id').eq('id', req.params.id).single();
          if (request) {
            await supabase.from('notifications').insert([{
              user_id: request.teacher_id,
              message: "신청하신 연차가 승인되었습니다.",
              created_at: processed_at
            }]);
          }
        }
        
        return res.json({ success: true });
      } else if (usePostgres && pool) {
        await pool.query(
          'UPDATE leave_requests SET status = $1, processed_by = $2, processed_at = $3 WHERE id = $4',
          [status, processed_by, processed_at, req.params.id]
        );
        
        // Notify Teacher if approved
        if (status === 'approved') {
          const request = await pool.query('SELECT teacher_id FROM leave_requests WHERE id = $1', [req.params.id]);
          if (request.rows.length > 0) {
            await pool.query(
              'INSERT INTO notifications (user_id, message, created_at) VALUES ($1, $2, $3)',
              [request.rows[0].teacher_id, "신청하신 연차가 승인되었습니다.", processed_at]
            );
          }
        }
        
        return res.json({ success: true });
      } else {
        db.prepare("UPDATE leave_requests SET status = ?, processed_by = ?, processed_at = ? WHERE id = ?").run(status, processed_by, processed_at, req.params.id);
        
        // Notify Teacher if approved
        if (status === 'approved') {
          const request = db.prepare("SELECT teacher_id FROM leave_requests WHERE id = ?").get(req.params.id);
          db.prepare("INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, ?)").run(
            request.teacher_id,
            "신청하신 연차가 승인되었습니다.",
            processed_at
          );
        }

        return res.json({ success: true });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.delete('/api/leave-requests/:id', async (req, res) => {
    try {
      if (supabase) {
        const { error } = await supabase.from('leave_requests').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      } else if (usePostgres && pool) {
        await pool.query('DELETE FROM leave_requests WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
      } else {
        db.prepare("DELETE FROM leave_requests WHERE id = ?").run(req.params.id);
        return res.json({ success: true });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.get('/api/notifications/:userId', async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', req.params.userId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      } else if (usePostgres && pool) {
        const result = await pool.query(
          'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
          [req.params.userId]
        );
        return res.json(result.rows);
      } else {
        const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(req.params.userId);
        return res.json(notifications);
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      if (supabase) {
        const { error } = await supabase.from('notifications').update({ is_read: 1 }).eq('id', req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      } else if (usePostgres && pool) {
        await pool.query('UPDATE notifications SET is_read = 1 WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
      } else {
        db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
        return res.json({ success: true });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  app.delete('/api/notifications/:userId', async (req, res) => {
    try {
      if (supabase) {
        const { error } = await supabase.from('notifications').delete().eq('user_id', req.params.userId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      } else if (usePostgres && pool) {
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [req.params.userId]);
        return res.json({ success: true });
      } else {
        db.prepare("DELETE FROM notifications WHERE user_id = ?").run(req.params.userId);
        return res.json({ success: true });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  });

  // NOTE: serving static files / Vite middleware is only needed when
  // running as a standalone server (local development or a traditional
  // deployment). For serverless functions we leave those concerns to the
  // platform.

// start server if running directly (not imported by Netlify function)
// in ESM environment we compare import.meta.url to the executed script path
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.join(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      });
    }

    const port = parseInt(process.env.PORT || '3000', 10);
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);
    });
  })();
}

export default app;
