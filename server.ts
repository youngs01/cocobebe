import express from 'express';
import path from 'path';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_STAFF,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_POLICY,
  INITIAL_NOTIFICATIONS,
} from './src/data/initialData';
import {
  Staff,
  LeaveRequest,
  AnnualLeavePolicy,
  Notification,
  DbStatus,
} from './src/types';

const { Pool } = pg;
const app = express();
const PORT = 3000;

app.use(express.json());

// Dedicated Neon PostgreSQL Connection String
const NEON_PG_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_pcPJ8bB4IlRu@ep-aged-bar-a7n8l724-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Local Fallback State
let localStore = {
  staff: [...INITIAL_STAFF] as Staff[],
  leaveRequests: [...INITIAL_LEAVE_REQUESTS] as LeaveRequest[],
  policy: { ...INITIAL_POLICY } as AnnualLeavePolicy,
  notifications: [...INITIAL_NOTIFICATIONS] as Notification[],
};

// Database Connection States
let pgPool: pg.Pool | null = null;
let activeDbType: 'postgresql' | 'local' = 'local';
let currentDbUri = NEON_PG_URL;
let dbErrorString = '';

// --- POSTGRESQL CONNECTION ---
async function tryConnectPostgres(uri: string): Promise<boolean> {
  if (!uri) return false;
  try {
    if (pgPool) {
      await pgPool.end().catch(() => {});
      pgPool = null;
    }

    const pool = new Pool({
      connectionString: uri,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    pgPool = pool;
    activeDbType = 'postgresql';
    dbErrorString = '';
    currentDbUri = uri;

    // Create tables if they do not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        "employeeNumber" VARCHAR(100),
        role VARCHAR(50),
        "positionTitle" VARCHAR(100),
        "className" VARCHAR(100),
        "joinDate" VARCHAR(50),
        email VARCHAR(200),
        phone VARCHAR(50),
        "manualAdjustment" NUMERIC DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        "loginId" VARCHAR(100),
        "loginPassword" VARCHAR(100)
      );

      ALTER TABLE staff ADD COLUMN IF NOT EXISTS "loginId" VARCHAR(100);
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS "loginPassword" VARCHAR(100);

      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(100) PRIMARY KEY,
        "staffId" VARCHAR(100),
        "staffName" VARCHAR(100),
        "staffRole" VARCHAR(50),
        "className" VARCHAR(100),
        type VARCHAR(50),
        "daysCount" NUMERIC,
        "startDate" VARCHAR(50),
        "endDate" VARCHAR(50),
        reason TEXT,
        "substituteTeacherId" VARCHAR(100),
        "substituteTeacherName" VARCHAR(100),
        status VARCHAR(50),
        "approvedBy" VARCHAR(100),
        "approvedAt" VARCHAR(100),
        "rejectReason" TEXT,
        "createdAt" VARCHAR(100),
        "deductedFromNextYear" BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS policy (
        id VARCHAR(50) PRIMARY KEY,
        "negativeDeductionEnabled" BOOLEAN DEFAULT TRUE,
        "rolloverMode" VARCHAR(50) DEFAULT 'none',
        "maxRolloverDays" NUMERIC DEFAULT 0,
        "rolloverExpiryMonths" NUMERIC DEFAULT 12,
        "statutoryBaseDays" NUMERIC DEFAULT 15,
        "maxStatutoryDays" NUMERIC DEFAULT 25
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        "staffId" VARCHAR(100),
        title VARCHAR(200),
        message TEXT,
        type VARCHAR(50),
        read BOOLEAN DEFAULT FALSE,
        "createdAt" VARCHAR(100)
      );
    `);

    // Seed database if staff table is empty
    const staffCheck = await pool.query('SELECT COUNT(*) FROM staff');
    const staffCount = parseInt(staffCheck.rows[0].count, 10);

    if (staffCount === 0) {
      for (const s of INITIAL_STAFF) {
        await pool.query(
          `INSERT INTO staff (id, name, "employeeNumber", role, "positionTitle", "className", "joinDate", email, phone, "manualAdjustment", status, "loginId", "loginPassword")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [
            s.id,
            s.name,
            s.employeeNumber,
            s.role,
            s.positionTitle,
            s.className,
            s.joinDate,
            s.email,
            s.phone,
            s.manualAdjustment || 0,
            s.status || 'active',
            s.loginId || null,
            s.loginPassword || null,
          ]
        );
      }
      for (const l of INITIAL_LEAVE_REQUESTS) {
        await pool.query(
          `INSERT INTO leave_requests (id, "staffId", "staffName", "staffRole", "className", type, "daysCount", "startDate", "endDate", reason, "substituteTeacherId", "substituteTeacherName", status, "approvedBy", "approvedAt", "rejectReason", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO NOTHING`,
          [
            l.id,
            l.staffId,
            l.staffName,
            l.staffRole,
            l.className,
            l.type,
            l.daysCount,
            l.startDate,
            l.endDate,
            l.reason,
            l.substituteTeacherId || null,
            l.substituteTeacherName || null,
            l.status,
            l.approvedBy || null,
            l.approvedAt || null,
            l.rejectReason || null,
            l.createdAt,
          ]
        );
      }
      await pool.query(
        `INSERT INTO policy (id, "negativeDeductionEnabled", "rolloverMode", "maxRolloverDays", "rolloverExpiryMonths", "statutoryBaseDays", "maxStatutoryDays")
         VALUES ('default_policy', $1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          INITIAL_POLICY.negativeDeductionEnabled,
          INITIAL_POLICY.rolloverMode,
          INITIAL_POLICY.maxRolloverDays,
          INITIAL_POLICY.rolloverExpiryMonths,
          INITIAL_POLICY.statutoryBaseDays,
          INITIAL_POLICY.maxStatutoryDays,
        ]
      );
      for (const n of INITIAL_NOTIFICATIONS) {
        await pool.query(
          `INSERT INTO notifications (id, "staffId", title, message, type, read, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [n.id, n.staffId, n.title, n.message, n.type, n.read, n.createdAt]
        );
      }
    } else {
      // Cleanup legacy test accounts if present
      await pool.query(`DELETE FROM staff WHERE id IN ('staff-1', 'staff-2', 'staff-3', 'staff-4', 'staff-5', 'staff-6')`);
      await pool.query(`DELETE FROM leave_requests WHERE id IN ('req-101', 'req-102')`);
      await pool.query(`DELETE FROM notifications WHERE id = 'notif-1'`);
    }

    console.log('✅ Connected to Neon PostgreSQL DB successfully!');
    return true;
  } catch (err: any) {
    console.warn('⚠️ PostgreSQL Connection Failed:', err.message);
    activeDbType = 'local';
    dbErrorString = err.message || 'PostgreSQL 연결 실패';
    pgPool = null;
    return false;
  }
}

// Auto connect on startup
async function ensureDbConnected() {
  if (activeDbType !== 'local') return;
  await tryConnectPostgres(currentDbUri);
}

app.use('/api', async (req, res, next) => {
  if (activeDbType === 'local') {
    await ensureDbConnected();
  }
  next();
});

// --- API ROUTES ---

// Admin Auth
app.post('/api/admin/login', (req, res) => {
  const { adminId, adminPassword } = req.body;
  const targetId = process.env.ADMIN_ID || 'cocobebe';
  const targetPass = process.env.ADMIN_PASSWORD || 'Dbsgofks03!';

  if (adminId === targetId && adminPassword === targetPass) {
    return res.json({ success: true, message: '로그인 성공' });
  } else {
    return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }
});

// DB Status & Config
app.get('/api/db/status', (req, res) => {
  const maskedUri = currentDbUri.replace(/:([^@]+)@/, ':****@');
  res.json({
    connected: activeDbType !== 'local',
    type: activeDbType,
    connectionString: maskedUri,
    error: dbErrorString,
  } as DbStatus);
});

app.post('/api/db/config', async (req, res) => {
  const { connectionString } = req.body;
  if (!connectionString) {
    return res.status(400).json({ error: '데이터베이스 연결 문자열을 입력해주세요.' });
  }

  const success = await tryConnectPostgres(connectionString);
  const maskedUri = connectionString.replace(/:([^@]+)@/, ':****@');

  if (success) {
    return res.json({
      success: true,
      message: 'Neon PostgreSQL 데이터베이스에 성공적으로 연결되었습니다!',
      status: {
        connected: true,
        type: 'postgresql',
        connectionString: maskedUri,
      },
    });
  } else {
    return res.status(400).json({
      success: false,
      message: `데이터베이스 연결 실패: ${dbErrorString}`,
      status: {
        connected: false,
        type: 'local',
        connectionString: maskedUri,
        error: dbErrorString,
      },
    });
  }
});

// Staff Management
app.get('/api/staff', async (req, res) => {
  try {
    if (activeDbType === 'postgresql' && pgPool) {
      const result = await pgPool.query('SELECT * FROM staff ORDER BY name ASC');
      const list: Staff[] = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        employeeNumber: row.employeeNumber,
        role: row.role,
        positionTitle: row.positionTitle,
        className: row.className,
        joinDate: row.joinDate,
        email: row.email,
        phone: row.phone,
        manualAdjustment: Number(row.manualAdjustment) || 0,
        status: row.status || 'active',
        loginId: row.loginId || '',
        loginPassword: row.loginPassword || '',
      }));
      return res.json(list);
    }
    res.json(localStore.staff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      name: req.body.name,
      employeeNumber: req.body.employeeNumber || `CB-${new Date().getFullYear()}${Math.floor(100 + Math.random() * 900)}`,
      role: req.body.role || 'teacher',
      positionTitle: req.body.positionTitle || '교사',
      className: req.body.className || '새싹반',
      joinDate: req.body.joinDate || new Date().toISOString().split('T')[0],
      email: req.body.email || `${req.body.name.toLowerCase()}@cocobebe.child.kr`,
      phone: req.body.phone || '010-0000-0000',
      manualAdjustment: Number(req.body.manualAdjustment) || 0,
      status: 'active',
      loginId: req.body.loginId || '',
      loginPassword: req.body.loginPassword || '',
    };

    if (activeDbType === 'postgresql' && pgPool) {
      await pgPool.query(
        `INSERT INTO staff (id, name, "employeeNumber", role, "positionTitle", "className", "joinDate", email, phone, "manualAdjustment", status, "loginId", "loginPassword")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          newStaff.id,
          newStaff.name,
          newStaff.employeeNumber,
          newStaff.role,
          newStaff.positionTitle,
          newStaff.className,
          newStaff.joinDate,
          newStaff.email,
          newStaff.phone,
          newStaff.manualAdjustment,
          newStaff.status,
          newStaff.loginId,
          newStaff.loginPassword,
        ]
      );
    } else {
      localStore.staff.push(newStaff);
    }

    res.json(newStaff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (activeDbType === 'postgresql' && pgPool) {
      await pgPool.query(
        `UPDATE staff 
         SET name = COALESCE($1, name),
             "employeeNumber" = COALESCE($2, "employeeNumber"),
             role = COALESCE($3, role),
             "positionTitle" = COALESCE($4, "positionTitle"),
             "className" = COALESCE($5, "className"),
             "joinDate" = COALESCE($6, "joinDate"),
             email = COALESCE($7, email),
             phone = COALESCE($8, phone),
             "manualAdjustment" = COALESCE($9, "manualAdjustment"),
             status = COALESCE($10, status),
             "loginId" = COALESCE($11, "loginId"),
             "loginPassword" = COALESCE($12, "loginPassword")
         WHERE id = $13`,
        [
          updateData.name,
          updateData.employeeNumber,
          updateData.role,
          updateData.positionTitle,
          updateData.className,
          updateData.joinDate,
          updateData.email,
          updateData.phone,
          updateData.manualAdjustment !== undefined ? Number(updateData.manualAdjustment) : null,
          updateData.status,
          updateData.loginId !== undefined ? updateData.loginId : null,
          updateData.loginPassword !== undefined ? updateData.loginPassword : null,
          id,
        ]
      );
    } else {
      localStore.staff = localStore.staff.map((s) => (s.id === id ? { ...s, ...updateData } : s));
    }

    res.json({ success: true, message: '직원 정보가 수정되었습니다.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Staff Login Auth
app.post('/api/staff/login', async (req, res) => {
  try {
    const { loginId, loginPassword } = req.body;
    if (!loginId || !loginPassword) {
      return res.status(400).json({ success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' });
    }

    // Check super admin credentials
    const targetAdminId = process.env.ADMIN_ID || 'cocobebe';
    const targetAdminPass = process.env.ADMIN_PASSWORD || 'Dbsgofks03!';

    if (loginId === targetAdminId && loginPassword === targetAdminPass) {
      return res.json({
        success: true,
        isAdmin: true,
        message: '관리자로 로그인되었습니다.',
        staff: {
          id: 'admin-cocobebe',
          name: '김은영 (원장)',
          employeeNumber: 'ADMIN-001',
          role: 'admin',
          positionTitle: '원장',
          className: '원장실 / 행정',
          joinDate: '2020-03-01',
          email: 'cocobebe@cocobebe.child.kr',
          phone: '010-0000-0000',
          manualAdjustment: 0,
          status: 'active',
          loginId: targetAdminId,
        },
      });
    }

    // Find staff in database
    let foundStaff: Staff | undefined;

    if (activeDbType === 'postgresql' && pgPool) {
      const result = await pgPool.query(
        'SELECT * FROM staff WHERE "loginId" = $1 AND "loginPassword" = $2 LIMIT 1',
        [loginId, loginPassword]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        foundStaff = {
          id: row.id,
          name: row.name,
          employeeNumber: row.employeeNumber,
          role: row.role,
          positionTitle: row.positionTitle,
          className: row.className,
          joinDate: row.joinDate,
          email: row.email,
          phone: row.phone,
          manualAdjustment: Number(row.manualAdjustment) || 0,
          status: row.status || 'active',
          loginId: row.loginId,
          loginPassword: row.loginPassword,
        };
      }
    } else {
      foundStaff = localStore.staff.find((s) => s.loginId === loginId && s.loginPassword === loginPassword);
    }

    if (foundStaff) {
      const isDirectorOrAdmin = foundStaff.role === 'admin' || foundStaff.positionTitle === '원장';
      return res.json({
        success: true,
        isAdmin: isDirectorOrAdmin,
        staff: foundStaff,
        message: `${foundStaff.name} ${foundStaff.positionTitle}님 환영합니다!`,
      });
    }

    return res.status(401).json({
      success: false,
      message: '등록된 아이디 또는 비밀번호가 올바르지 않습니다.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (activeDbType === 'postgresql' && pgPool) {
      await pgPool.query('DELETE FROM staff WHERE id = $1', [id]);
    } else {
      localStore.staff = localStore.staff.filter((s) => s.id !== id);
    }
    res.json({ success: true, message: '삭제되었습니다.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Leave Requests Management
app.get('/api/leave-requests', async (req, res) => {
  try {
    if (activeDbType === 'postgresql' && pgPool) {
      const result = await pgPool.query('SELECT * FROM leave_requests ORDER BY "createdAt" DESC');
      const list: LeaveRequest[] = result.rows.map((row) => ({
        id: row.id,
        staffId: row.staffId,
        staffName: row.staffName,
        staffRole: row.staffRole,
        className: row.className,
        type: row.type,
        daysCount: Number(row.daysCount) || 0,
        startDate: row.startDate,
        endDate: row.endDate,
        reason: row.reason,
        substituteTeacherId: row.substituteTeacherId,
        substituteTeacherName: row.substituteTeacherName,
        status: row.status,
        approvedBy: row.approvedBy,
        approvedAt: row.approvedAt,
        rejectReason: row.rejectReason,
        createdAt: row.createdAt,
        deductedFromNextYear: row.deductedFromNextYear || false,
      }));
      return res.json(list);
    }
    res.json(localStore.leaveRequests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leave-requests', async (req, res) => {
  try {
    const newReq: LeaveRequest = {
      id: `req-${Date.now()}`,
      staffId: req.body.staffId,
      staffName: req.body.staffName,
      staffRole: req.body.staffRole,
      className: req.body.className,
      type: req.body.type,
      daysCount: Number(req.body.daysCount) || 1,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason,
      substituteTeacherId: req.body.substituteTeacherId || null,
      substituteTeacherName: req.body.substituteTeacherName || null,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      deductedFromNextYear: false,
    };

    if (activeDbType === 'postgresql' && pgPool) {
      await pgPool.query(
        `INSERT INTO leave_requests (id, "staffId", "staffName", "staffRole", "className", type, "daysCount", "startDate", "endDate", reason, "substituteTeacherId", "substituteTeacherName", status, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          newReq.id,
          newReq.staffId,
          newReq.staffName,
          newReq.staffRole,
          newReq.className,
          newReq.type,
          newReq.daysCount,
          newReq.startDate,
          newReq.endDate,
          newReq.reason,
          newReq.substituteTeacherId,
          newReq.substituteTeacherName,
          newReq.status,
          newReq.createdAt,
        ]
      );
    } else {
      localStore.leaveRequests.unshift(newReq);
    }

    res.json(newReq);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leave-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, deductedFromNextYear } = req.body;
    const approvedAt = new Date().toISOString().split('T')[0];

    if (activeDbType === 'postgresql' && pgPool) {
      await pgPool.query(
        `UPDATE leave_requests 
         SET status = 'approved', "approvedBy" = $1, "approvedAt" = $2, "deductedFromNextYear" = COALESCE($3, "deductedFromNextYear")
         WHERE id = $4`,
        [approvedBy || '원장', approvedAt, deductedFromNextYear || false, id]
      );
    } else {
      localStore.leaveRequests = localStore.leaveRequests.map((r) =>
        r.id === id ? { ...r, status: 'approved', approvedBy: approvedBy || '원장', approvedAt, deductedFromNextYear } : r
      );
    }

    res.json({ success: true, message: '승인 처리되었습니다.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leave-requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;

    if (activeDbType === 'postgresql' && pgPool) {
      await pgPool.query(
        `UPDATE leave_requests 
         SET status = 'rejected', "rejectReason" = $1
         WHERE id = $2`,
        [rejectReason || '사유 미기재', id]
      );
    } else {
      localStore.leaveRequests = localStore.leaveRequests.map((r) =>
        r.id === id ? { ...r, status: 'rejected', rejectReason: rejectReason || '사유 미기재' } : r
      );
    }

    res.json({ success: true, message: '반려 처리되었습니다.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Policy Management
app.get('/api/policy', async (req, res) => {
  try {
    if (activeDbType === 'postgresql' && pgPool) {
      const result = await pgPool.query('SELECT * FROM policy WHERE id = \'default_policy\' LIMIT 1');
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const pol: AnnualLeavePolicy = {
          negativeDeductionEnabled: row.negativeDeductionEnabled,
          rolloverMode: row.rolloverMode,
          maxRolloverDays: Number(row.maxRolloverDays) || 0,
          rolloverExpiryMonths: Number(row.rolloverExpiryMonths) || 12,
          statutoryBaseDays: Number(row.statutoryBaseDays) || 15,
          maxStatutoryDays: Number(row.maxStatutoryDays) || 25,
        };
        return res.json(pol);
      }
    }
    res.json(localStore.policy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/policy', async (req, res) => {
  try {
    const updated: AnnualLeavePolicy = req.body;

    if (activeDbType === 'postgresql' && pgPool) {
      await pgPool.query(
        `UPDATE policy 
         SET "negativeDeductionEnabled" = $1, "rolloverMode" = $2, "maxRolloverDays" = $3, "rolloverExpiryMonths" = $4, "statutoryBaseDays" = $5, "maxStatutoryDays" = $6
         WHERE id = 'default_policy'`,
        [
          updated.negativeDeductionEnabled,
          updated.rolloverMode,
          updated.maxRolloverDays,
          updated.rolloverExpiryMonths,
          updated.statutoryBaseDays,
          updated.maxStatutoryDays,
        ]
      );
    } else {
      localStore.policy = { ...updated };
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    if (activeDbType === 'postgresql' && pgPool) {
      const result = await pgPool.query('SELECT * FROM notifications ORDER BY "createdAt" DESC');
      const list: Notification[] = result.rows.map((row) => ({
        id: row.id,
        staffId: row.staffId,
        title: row.title,
        message: row.message,
        type: row.type,
        read: row.read,
        createdAt: row.createdAt,
      }));
      return res.json(list);
    }
    res.json(localStore.notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    if (activeDbType === 'postgresql' && pgPool) {
      await pgPool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [id]);
    } else {
      localStore.notifications = localStore.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite & Static file serving
async function startServer() {
  await ensureDbConnected();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Nursery Attendance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export default app;
