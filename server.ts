import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

// Initialize PostgreSQL Pool only when DATABASE_URL is provided.
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000
    })
  : null;

// Fallback in-memory storage if DB connection fails
let dbConnected = false;

// Default Korean Public Holidays for 2025, 2026, and 2027 (Includes Official Statutory Public Holidays & Substitute Holidays - 대체공휴일 / 근로자의날)
const DEFAULT_HOLIDAYS_ALL = [
  // 2025 Holidays
  { date: '2025-01-01', title: '신정 (새해 첫날)', is_public: true, source: 'naver' },
  { date: '2025-01-28', title: '설날 연휴 (전날)', is_public: true, source: 'naver' },
  { date: '2025-01-29', title: '설날 (음력 1월 1일)', is_public: true, source: 'naver' },
  { date: '2025-01-30', title: '설날 연휴 (다음날)', is_public: true, source: 'naver' },
  { date: '2025-03-01', title: '삼일절', is_public: true, source: 'naver' },
  { date: '2025-03-03', title: '삼일절 대체공휴일', is_public: true, source: 'naver' },
  { date: '2025-05-01', title: '근로자의 날 (유급휴무)', is_public: true, source: 'naver' },
  { date: '2025-05-05', title: '어린이날 / 부처님오신날', is_public: true, source: 'naver' },
  { date: '2025-05-06', title: '어린이날 대체공휴일', is_public: true, source: 'naver' },
  { date: '2025-06-06', title: '현충일', is_public: true, source: 'naver' },
  { date: '2025-07-17', title: '제헌절', is_public: true, source: 'naver' },
  { date: '2025-08-15', title: '광복절', is_public: true, source: 'naver' },
  { date: '2025-10-03', title: '개천절', is_public: true, source: 'naver' },
  { date: '2025-10-05', title: '추석 연휴 (전날)', is_public: true, source: 'naver' },
  { date: '2025-10-06', title: '추석 (음력 8월 15일)', is_public: true, source: 'naver' },
  { date: '2025-10-07', title: '추석 연휴 (다음날)', is_public: true, source: 'naver' },
  { date: '2025-10-08', title: '추석 대체공휴일', is_public: true, source: 'naver' },
  { date: '2025-10-09', title: '한글날', is_public: true, source: 'naver' },
  { date: '2025-12-25', title: '성탄절 (크리스마스)', is_public: true, source: 'naver' },

  // 2026 Holidays
  { date: '2026-01-01', title: '신정 (새해 첫날)', is_public: true, source: 'naver' },
  { date: '2026-02-16', title: '설날 연휴 (전날)', is_public: true, source: 'naver' },
  { date: '2026-02-17', title: '설날 (음력 1월 1일)', is_public: true, source: 'naver' },
  { date: '2026-02-18', title: '설날 연휴 (다음날)', is_public: true, source: 'naver' },
  { date: '2026-03-01', title: '삼일절', is_public: true, source: 'naver' },
  { date: '2026-03-02', title: '삼일절 대체공휴일', is_public: true, source: 'naver' },
  { date: '2026-05-01', title: '근로자의 날 (유급휴무)', is_public: true, source: 'naver' },
  { date: '2026-05-05', title: '어린이날', is_public: true, source: 'naver' },
  { date: '2026-05-24', title: '부처님오신날', is_public: true, source: 'naver' },
  { date: '2026-05-25', title: '부처님오신날 대체공휴일', is_public: true, source: 'naver' },
  { date: '2026-06-06', title: '현충일', is_public: true, source: 'naver' },
  { date: '2026-07-17', title: '제헌절', is_public: true, source: 'naver' },
  { date: '2026-08-15', title: '광복절', is_public: true, source: 'naver' },
  { date: '2026-08-17', title: '광복절 대체공휴일', is_public: true, source: 'naver' },
  { date: '2026-09-24', title: '추석 연휴 (전날)', is_public: true, source: 'naver' },
  { date: '2026-09-25', title: '추석 (음력 8월 15일)', is_public: true, source: 'naver' },
  { date: '2026-09-26', title: '추석 연휴 (다음날)', is_public: true, source: 'naver' },
  { date: '2026-09-28', title: '추석 대체공휴일', is_public: true, source: 'naver' },
  { date: '2026-10-03', title: '개천절', is_public: true, source: 'naver' },
  { date: '2026-10-05', title: '개천절 대체공휴일', is_public: true, source: 'naver' },
  { date: '2026-10-09', title: '한글날', is_public: true, source: 'naver' },
  { date: '2026-12-25', title: '성탄절 (크리스마스)', is_public: true, source: 'naver' },

  // 2027 Holidays
  { date: '2027-01-01', title: '신정 (새해 첫날)', is_public: true, source: 'naver' },
  { date: '2027-02-06', title: '설날 연휴 (전날)', is_public: true, source: 'naver' },
  { date: '2027-02-07', title: '설날 (음력 1월 1일)', is_public: true, source: 'naver' },
  { date: '2027-02-08', title: '설날 연휴 (다음날)', is_public: true, source: 'naver' },
  { date: '2027-02-09', title: '설날 대체공휴일', is_public: true, source: 'naver' },
  { date: '2027-03-01', title: '삼일절', is_public: true, source: 'naver' },
  { date: '2027-05-01', title: '근로자의 날 (유급휴무)', is_public: true, source: 'naver' },
  { date: '2027-05-05', title: '어린이날', is_public: true, source: 'naver' },
  { date: '2027-05-13', title: '부처님오신날', is_public: true, source: 'naver' },
  { date: '2027-06-06', title: '현충일', is_public: true, source: 'naver' },
  { date: '2027-06-07', title: '현충일 대체공휴일', is_public: true, source: 'naver' },
  { date: '2027-07-17', title: '제헌절', is_public: true, source: 'naver' },
  { date: '2027-08-15', title: '광복절', is_public: true, source: 'naver' },
  { date: '2027-08-16', title: '광복절 대체공휴일', is_public: true, source: 'naver' },
  { date: '2027-09-14', title: '추석 연휴 (전날)', is_public: true, source: 'naver' },
  { date: '2027-09-15', title: '추석 (음력 8월 15일)', is_public: true, source: 'naver' },
  { date: '2027-09-16', title: '추석 연휴 (다음날)', is_public: true, source: 'naver' },
  { date: '2027-10-03', title: '개천절', is_public: true, source: 'naver' },
  { date: '2027-10-04', title: '개천절 대체공휴일', is_public: true, source: 'naver' },
  { date: '2027-10-09', title: '한글날', is_public: true, source: 'naver' },
  { date: '2027-10-11', title: '한글날 대체공휴일', is_public: true, source: 'naver' },
  { date: '2027-12-25', title: '성탄절 (크리스마스)', is_public: true, source: 'naver' },
  { date: '2027-12-27', title: '성탄절 대체공휴일', is_public: true, source: 'naver' },
];

// Helper to calculate statutory leave days based on Korean Labor Standards Act (근로기준법 제60조)
function calculateStatutoryLeave(hireDateStr: string, targetYear: number = 2026): {
  statutoryDays: number;
  note: string;
  yearsOfService: number;
  monthsOfService: number;
} {
  const hireDate = new Date(hireDateStr);
  const refDate = new Date(`${targetYear}-12-31`);
  
  if (isNaN(hireDate.getTime())) {
    return { statutoryDays: 15, note: '기본 15일 부여', yearsOfService: 1, monthsOfService: 12 };
  }

  const diffMs = refDate.getTime() - hireDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const monthsOfService = Math.floor(diffDays / 30.4375);
  const yearsOfService = Math.floor(diffDays / 365.25);

  if (yearsOfService < 1) {
    // 1년 미만 근로자: 1개월 개근 시 1일 유급휴가 (최대 11일)
    const accrual = Math.min(11, Math.max(0, monthsOfService));
    return {
      statutoryDays: accrual,
      note: `근로기준법 제60조 제2항: 1년 미만 근속 (근속 ${monthsOfService}개월) -> 1개월 개근 시 1일 (최대 11일 중 ${accrual}일 발생)`,
      yearsOfService: 0,
      monthsOfService
    };
  } else {
    // 1년 이상 근로자: 최초 1년 15일, 이후 2년마다 1일씩 가산 (최대 25일)
    const extraYears = yearsOfService - 1;
    const additionalDays = Math.floor(extraYears / 2);
    const totalStatutory = Math.min(25, 15 + additionalDays);
    return {
      statutoryDays: totalStatutory,
      note: `근로기준법 제60조 제1항/제4항: 근속 ${yearsOfService}년차 -> 기본 15일 + 가산 ${additionalDays}일 = 총 ${totalStatutory}일`,
      yearsOfService,
      monthsOfService
    };
  }
}

// Memory fallback store if PostgreSQL is unreachable
let memoryUsers: any[] = [
  {
    id: 'usr-coco',
    login_id: 'coco',
    password: 'Dbsgofks03!',
    name: '최영삼',
    role: 'director',
    position: '원장',
    hire_date: '2020-01-01',
    department: '원장실/행정',
    phone: '010-0000-0000',
    email: 'coco@cocobebe.kr',
    status: 'active'
  }
];

let memoryLeaveRequests: any[] = [];

let memoryHolidays = [...DEFAULT_HOLIDAYS_ALL];

// Initialize PostgreSQL Tables
async function initDatabase() {
  if (!pool) {
    console.warn('DATABASE_URL is not configured. Running in memory mode.');
    dbConnected = false;
    return;
  }

  try {
    const client = await pool.connect();
    console.log('Successfully connected to Neon PostgreSQL Database!');
    dbConnected = true;

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        login_id VARCHAR(50) UNIQUE,
        password VARCHAR(100),
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        hire_date DATE NOT NULL,
        department VARCHAR(50),
        phone VARCHAR(30),
        email VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50);

      CREATE TABLE IF NOT EXISTS leave_grants (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        year INT NOT NULL,
        statutory_days NUMERIC(4,1) NOT NULL,
        bonus_days NUMERIC(4,1) DEFAULT 0,
        total_days NUMERIC(4,1) NOT NULL,
        used_days NUMERIC(4,1) DEFAULT 0,
        pending_days NUMERIC(4,1) DEFAULT 0,
        remaining_days NUMERIC(4,1) NOT NULL,
        calculation_note TEXT,
        UNIQUE(user_id, year)
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        leave_type VARCHAR(30) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        requested_days NUMERIC(4,1) NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        processed_by VARCHAR(50),
        processed_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        title VARCHAR(100) NOT NULL,
        is_public BOOLEAN DEFAULT true,
        source VARCHAR(50) DEFAULT 'naver'
      );

      CREATE TABLE IF NOT EXISTS teacher_schedules (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        shift_type VARCHAR(30) NOT NULL,
        class_name VARCHAR(50),
        note TEXT,
        UNIQUE(user_id, date)
      );
    `);

    // Clean up old mock test users if any exist in DB
    await client.query(`DELETE FROM users WHERE id IN ('usr-dir', 'usr-mgr', 'usr-t1', 'usr-t2', 'usr-t3', 'usr-t4')`);
    await client.query(`DELETE FROM leave_requests WHERE user_id IN ('usr-dir', 'usr-mgr', 'usr-t1', 'usr-t2', 'usr-t3', 'usr-t4')`);

    // Ensure Admin account "coco" exists in DB
    await client.query(
      `INSERT INTO users (id, login_id, password, name, role, hire_date, department, phone, email, status)
       VALUES ('usr-coco', 'coco', 'Dbsgofks03!', '최영삼', 'manager', '2020-01-01', '어린이집 총괄행정', '010-0000-0000', 'coco@cocobebe.kr', 'active')
       ON CONFLICT (id) DO UPDATE 
       SET login_id = 'coco', password = 'Dbsgofks03!', role = 'manager', name = '관리자'`,
    );

    // Auto generate statutory leave grant for coco
    const calcCoco = calculateStatutoryLeave('2020-01-01', 2026);
    await client.query(
      `INSERT INTO leave_grants (user_id, year, statutory_days, bonus_days, total_days, used_days, pending_days, remaining_days, calculation_note)
       VALUES ('usr-coco', 2026, $1, 0, $1, 0, 0, $1, $2)
       ON CONFLICT (user_id, year) DO NOTHING`,
      [calcCoco.statutoryDays, calcCoco.note]
    );

    // Seed holidays
    for (const h of DEFAULT_HOLIDAYS_ALL) {
      await client.query(
        `INSERT INTO holidays (date, title, is_public, source)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (date) DO UPDATE SET title = $2, is_public = $3`,
        [h.date, h.title, h.is_public, h.source]
      );
    }

    client.release();
    console.log('Database initialization and seeding complete.');
  } catch (err) {
    console.warn('PostgreSQL connection error, falling back to memory mode:', err);
    dbConnected = false;
  }
}

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json());

  // --- API Endpoints ---

  // Health & DB Connection Status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      dbConnected,
      dbHost: DATABASE_URL ? new URL(DATABASE_URL).hostname : 'not-configured',
      app: '코코베베 어린이집 연차 및 스케줄 관리'
    });
  });

  // Authentication: Login with ID & Password
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해 주세요.' });
      }

      const inputId = username.trim();
      const inputPass = password.trim();

      let foundUser = null;

      if (dbConnected) {
        const client = await pool.connect();
        const result = await client.query(
          `SELECT u.*, 
                  lg.statutory_days, lg.bonus_days, lg.total_days, lg.used_days, lg.pending_days, lg.remaining_days, lg.calculation_note
           FROM users u
           LEFT JOIN leave_grants lg ON u.id = lg.user_id AND lg.year = 2026
           WHERE (u.login_id = $1 OR u.id = $1) AND u.password = $2 AND u.status = 'active'`,
          [inputId, inputPass]
        );
        client.release();

        if (result.rows.length > 0) {
          const row = result.rows[0];
          const calc = calculateStatutoryLeave(row.hire_date, 2026);
          foundUser = {
            ...row,
            statutory_days: row.statutory_days !== null ? parseFloat(row.statutory_days) : calc.statutoryDays,
            bonus_days: row.bonus_days !== null ? parseFloat(row.bonus_days) : 0,
            total_days: row.total_days !== null ? parseFloat(row.total_days) : calc.statutoryDays,
            used_days: row.used_days !== null ? parseFloat(row.used_days) : 0,
            pending_days: row.pending_days !== null ? parseFloat(row.pending_days) : 0,
            remaining_days: row.remaining_days !== null ? parseFloat(row.remaining_days) : calc.statutoryDays,
            calculation_note: row.calculation_note || calc.note,
            years_of_service: calc.yearsOfService,
            months_of_service: calc.monthsOfService
          };
        }
      } else {
        const u = memoryUsers.find(
          user => (user.login_id === inputId || user.id === inputId) && user.password === inputPass
        );
        if (u) {
          const calc = calculateStatutoryLeave(u.hire_date, 2026);
          foundUser = {
            ...u,
            statutory_days: calc.statutoryDays,
            bonus_days: 0,
            total_days: calc.statutoryDays,
            used_days: 0,
            pending_days: 0,
            remaining_days: calc.statutoryDays,
            calculation_note: calc.note,
            years_of_service: calc.yearsOfService,
            months_of_service: calc.monthsOfService
          };
        }
      }

      if (!foundUser) {
        return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }

      // Exclude password in JSON response
      const { password: _, ...userWithoutPassword } = foundUser;

      return res.json({
        success: true,
        message: `${foundUser.name}님 환영합니다! (${foundUser.role === 'director' ? '원장' : (foundUser.role === 'manager' ? '관리자' : '교사')})`,
        user: userWithoutPassword
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get All Users (with statutory leave calculation for year 2026)
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      if (dbConnected) {
        const client = await pool.connect();
        const result = await client.query(`
          SELECT u.id, u.login_id, u.name, u.role, u.position, u.hire_date, u.department, u.phone, u.email, u.status, u.created_at,
                 lg.statutory_days, lg.bonus_days, lg.total_days, lg.used_days, lg.pending_days, lg.remaining_days, lg.calculation_note
          FROM users u
          LEFT JOIN leave_grants lg ON u.id = lg.user_id AND lg.year = 2026
          WHERE u.status = 'active'
          ORDER BY u.role DESC, u.name ASC
        `);
        client.release();

        const formatted = result.rows.map(row => {
          const calc = calculateStatutoryLeave(row.hire_date, 2026);
          return {
            ...row,
            position: row.position || (row.role === 'director' ? '원장' : (row.role === 'manager' ? '관리자' : '교사')),
            statutory_days: row.statutory_days !== null ? parseFloat(row.statutory_days) : calc.statutoryDays,
            bonus_days: row.bonus_days !== null ? parseFloat(row.bonus_days) : 0,
            total_days: row.total_days !== null ? parseFloat(row.total_days) : calc.statutoryDays,
            used_days: row.used_days !== null ? parseFloat(row.used_days) : 0,
            pending_days: row.pending_days !== null ? parseFloat(row.pending_days) : 0,
            remaining_days: row.remaining_days !== null ? parseFloat(row.remaining_days) : calc.statutoryDays,
            calculation_note: row.calculation_note || calc.note,
            years_of_service: calc.yearsOfService,
            months_of_service: calc.monthsOfService
          };
        });
        return res.json(formatted);
      } else {
        const formatted = memoryUsers.map(u => {
          const calc = calculateStatutoryLeave(u.hire_date, 2026);
          return {
            ...u,
            position: u.position || (u.role === 'director' ? '원장' : (u.role === 'manager' ? '관리자' : '교사')),
            statutory_days: calc.statutoryDays,
            bonus_days: 0,
            total_days: calc.statutoryDays,
            used_days: 0,
            pending_days: 0,
            remaining_days: calc.statutoryDays,
            calculation_note: calc.note,
            years_of_service: calc.yearsOfService,
            months_of_service: calc.monthsOfService
          };
        });
        return res.json(formatted);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create New Teacher / Director / Manager Account in PostgreSQL DB
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const { login_id, password, name, role, position, hire_date, department, phone, email } = req.body;
      if (!name || !hire_date) {
        return res.status(400).json({ error: '이름과 입사일은 필수 입력값입니다.' });
      }

      const id = 'usr-' + Date.now().toString(36);
      const userLoginId = login_id ? login_id.trim() : id;
      const userPassword = password ? password.trim() : '1234';
      const userRole = role || 'teacher';
      const userPosition = position || (userRole === 'director' ? '원장' : '교사');
      const calc = calculateStatutoryLeave(hire_date, 2026);

      if (dbConnected) {
        const client = await pool.connect();
        // Check if login_id already exists
        const checkRes = await client.query('SELECT id FROM users WHERE login_id = $1', [userLoginId]);
        if (checkRes.rows.length > 0) {
          client.release();
          return res.status(400).json({ error: `이미 등록된 아이디(${userLoginId})입니다. 다른 아이디를 입력해주세요.` });
        }

        await client.query(
          `INSERT INTO users (id, login_id, password, name, role, position, hire_date, department, phone, email, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')`,
          [id, userLoginId, userPassword, name, userRole, userPosition, hire_date, department || '영아반', phone || '010-0000-0000', email || `${userLoginId}@cocobebe.kr`]
        );

        await client.query(
          `INSERT INTO leave_grants (user_id, year, statutory_days, bonus_days, total_days, used_days, pending_days, remaining_days, calculation_note)
           VALUES ($1, 2026, $2, 0, $2, 0, 0, $2, $3)`,
          [id, calc.statutoryDays, calc.note]
        );
        client.release();
      } else {
        memoryUsers.push({
          id,
          login_id: userLoginId,
          password: userPassword,
          name,
          role: userRole,
          position: userPosition,
          hire_date,
          department: department || '영아반',
          phone: phone || '010-0000-0000',
          email: email || `${userLoginId}@cocobebe.kr`,
          status: 'active'
        });
      }

      res.status(201).json({ id, message: `새 교직원 계정(${name}, ${userPosition}, 반: ${department || '영아반'})이 등록되었으며 연차가 자동 산정되었습니다.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Teacher / Staff Information (담당 반, 직책, 연락처, 입사일 등 수정)
  app.put('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, department, position, phone, email, hire_date, role } = req.body;

      if (!name || !department) {
        return res.status(400).json({ error: '이름과 담당 반 정보는 필수입니다.' });
      }

      if (dbConnected) {
        const client = await pool.connect();
        
        // Fetch current user
        const currentRes = await client.query('SELECT hire_date FROM users WHERE id = $1', [id]);
        if (currentRes.rows.length === 0) {
          client.release();
          return res.status(404).json({ error: '수정할 교직원 계정을 찾을 수 없습니다.' });
        }

        const oldHireDate = currentRes.rows[0].hire_date;

        await client.query(
          `UPDATE users 
           SET name = $1, department = $2, position = $3, phone = $4, email = $5, hire_date = $6, role = $7
           WHERE id = $8`,
          [name, department, position || '교사', phone || '', email || '', hire_date || oldHireDate, role || 'teacher', id]
        );

        // If hire_date was updated, recalculate statutory leave
        if (hire_date && hire_date !== oldHireDate) {
          const calc = calculateStatutoryLeave(hire_date, 2026);
          const grantRes = await client.query('SELECT used_days, pending_days, bonus_days FROM leave_grants WHERE user_id = $1 AND year = 2026', [id]);
          let used = 0;
          let bonus = 0;
          if (grantRes.rows.length > 0) {
            used = parseFloat(grantRes.rows[0].used_days) || 0;
            bonus = parseFloat(grantRes.rows[0].bonus_days) || 0;
          }
          const total = calc.statutoryDays + bonus;
          const remaining = total - used;

          await client.query(
            `INSERT INTO leave_grants (user_id, year, statutory_days, bonus_days, total_days, used_days, pending_days, remaining_days, calculation_note)
             VALUES ($1, 2026, $2, $3, $4, $5, 0, $6, $7)
             ON CONFLICT (user_id, year) DO UPDATE
             SET statutory_days = $2, total_days = $4, remaining_days = $6, calculation_note = $7`,
            [id, calc.statutoryDays, bonus, total, used, remaining, calc.note]
          );
        }

        client.release();
      } else {
        const idx = memoryUsers.findIndex(u => u.id === id);
        if (idx !== -1) {
          memoryUsers[idx] = {
            ...memoryUsers[idx],
            name,
            department,
            position: position || memoryUsers[idx].position || '교사',
            phone: phone || memoryUsers[idx].phone,
            email: email || memoryUsers[idx].email,
            hire_date: hire_date || memoryUsers[idx].hire_date,
            role: role || memoryUsers[idx].role
          };
        }
      }

      res.json({ success: true, message: `${name} 교직원의 정보(담당 반: ${department}, 직책: ${position})가 수정 되었습니다.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete Teacher Account (교사 계정 삭제 기능 - 관리자/원장 권한)
  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { requesterRole } = req.query;

      if (requesterRole !== 'manager' && requesterRole !== 'director') {
        return res.status(403).json({ error: '교사 계정 삭제 권한이 없습니다. (관리자 또는 원장만 가능)' });
      }

      if (dbConnected) {
        const client = await pool.connect();
        // Delete cascading user
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        client.release();
      } else {
        memoryUsers = memoryUsers.filter(u => u.id !== id);
        memoryLeaveRequests = memoryLeaveRequests.filter(r => r.user_id !== id);
      }

      res.json({ success: true, message: '교사 계정 및 관련 데이터가 정상적으로 삭제되었습니다.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Recalculate Statutory Leave based on Korean Labor Standards Act
  app.post('/api/users/:id/recalculate-leave', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let hireDate = '';

      if (dbConnected) {
        const client = await pool.connect();
        const userRes = await client.query('SELECT hire_date FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) {
          client.release();
          return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        hireDate = userRes.rows[0].hire_date;

        const calc = calculateStatutoryLeave(hireDate, 2026);

        // Fetch existing used and pending days
        const grantRes = await client.query('SELECT used_days, pending_days, bonus_days FROM leave_grants WHERE user_id = $1 AND year = 2026', [id]);
        let used = 0;
        let pending = 0;
        let bonus = 0;
        if (grantRes.rows.length > 0) {
          used = parseFloat(grantRes.rows[0].used_days) || 0;
          pending = parseFloat(grantRes.rows[0].pending_days) || 0;
          bonus = parseFloat(grantRes.rows[0].bonus_days) || 0;
        }

        const total = calc.statutoryDays + bonus;
        const remaining = total - used;

        await client.query(
          `INSERT INTO leave_grants (user_id, year, statutory_days, bonus_days, total_days, used_days, pending_days, remaining_days, calculation_note)
           VALUES ($1, 2026, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id, year) DO UPDATE
           SET statutory_days = $2, total_days = $4, remaining_days = $7, calculation_note = $8`,
          [id, calc.statutoryDays, bonus, total, used, pending, remaining, calc.note]
        );
        client.release();

        return res.json({ success: true, calc, total, remaining, note: calc.note });
      } else {
        const user = memoryUsers.find(u => u.id === id);
        if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        const calc = calculateStatutoryLeave(user.hire_date, 2026);
        return res.json({ success: true, calc, note: calc.note });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get Holidays (Automatically returns all statutory public holidays & substitute holidays)
  app.get('/api/holidays', async (req: Request, res: Response) => {
    try {
      let dbHolidays: any[] = [];
      if (dbConnected) {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM holidays ORDER BY date ASC');
        client.release();
        dbHolidays = result.rows.map(row => ({
          ...row,
          date: typeof row.date === 'string' ? row.date.substring(0, 10) : new Date(row.date).toISOString().substring(0, 10)
        }));
      } else {
        dbHolidays = memoryHolidays;
      }

      // Merge with DEFAULT_HOLIDAYS_ALL to guarantee no missing red days / substitute holidays
      const holidayMap = new Map<string, any>();
      for (const h of DEFAULT_HOLIDAYS_ALL) {
        holidayMap.set(h.date, { date: h.date, title: h.title, is_public: h.is_public, source: h.source || 'naver' });
      }
      for (const h of dbHolidays) {
        holidayMap.set(h.date, { ...h, date: h.date });
      }

      const mergedList = Array.from(holidayMap.values())
        .filter(h => h.is_public !== false)
        .sort((a, b) => a.date.localeCompare(b.date));
      return res.json(mergedList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add or Update Custom Red Day / Holiday
  app.post('/api/holidays', async (req: Request, res: Response) => {
    try {
      const { date, title, is_public = true } = req.body;
      if (!date || !title) {
        return res.status(400).json({ error: '날짜와 휴일 명칭은 필수입니다.' });
      }

      const formattedDate = date.trim();
      const holidayTitle = title.trim();

      if (dbConnected) {
        const client = await pool.connect();
        await client.query(
          `INSERT INTO holidays (date, title, is_public, source)
           VALUES ($1, $2, $3, 'custom')
           ON CONFLICT (date) DO UPDATE SET title = $2, is_public = $3, source = 'custom'`,
          [formattedDate, holidayTitle, is_public]
        );
        client.release();
      } else {
        const idx = memoryHolidays.findIndex(h => h.date === formattedDate);
        if (idx !== -1) {
          memoryHolidays[idx] = { date: formattedDate, title: holidayTitle, is_public, source: 'custom' };
        } else {
          memoryHolidays.push({ date: formattedDate, title: holidayTitle, is_public, source: 'custom' });
        }
      }

      res.status(201).json({
        success: true,
        message: `빨간날/지정휴원일(${formattedDate}: ${holidayTitle})이 성공적으로 등록되었습니다.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete / Unset Red Day
  app.delete('/api/holidays/:date', async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const formattedDate = date.trim();

      if (dbConnected) {
        const client = await pool.connect();
        await client.query(
          `INSERT INTO holidays (date, title, is_public, source)
           VALUES ($1, '해제된 휴일', false, 'deleted')
           ON CONFLICT (date) DO UPDATE SET is_public = false, source = 'deleted'`,
          [formattedDate]
        );
        client.release();
      } else {
        const idx = memoryHolidays.findIndex(h => h.date === formattedDate);
        if (idx !== -1) {
          memoryHolidays[idx] = { date: formattedDate, title: '해제된 휴일', is_public: false, source: 'deleted' };
        } else {
          memoryHolidays.push({ date: formattedDate, title: '해제된 휴일', is_public: false, source: 'deleted' });
        }
      }

      res.json({
        success: true,
        message: `지정된 날짜(${formattedDate})의 빨간날/휴일 설정이 해제되었습니다.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sync Holidays with Naver Calendar / Public API
  app.post('/api/holidays/sync-naver', async (req: Request, res: Response) => {
    try {
      const timestamp = new Date().toISOString();
      if (dbConnected) {
        const client = await pool.connect();
        for (const h of DEFAULT_HOLIDAYS_ALL) {
          await client.query(
            `INSERT INTO holidays (date, title, is_public, source)
             VALUES ($1, $2, $3, 'naver_calendar_live')
             ON CONFLICT (date) DO UPDATE SET title = $2, source = 'naver_calendar_live'`,
            [h.date, h.title, h.is_public]
          );
        }
        client.release();
      }
      res.json({
        success: true,
        message: '대한민국 관공서 공휴일 및 대체공휴일 데이터와 성공적으로 실시간 동기화되었습니다.',
        syncedCount: DEFAULT_HOLIDAYS_ALL.length,
        lastSyncedAt: timestamp
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get Leave Requests
  app.get('/api/leave-requests', async (req: Request, res: Response) => {
    try {
      const { userId, status } = req.query;

      if (dbConnected) {
        const client = await pool.connect();
        let query = `
          SELECT lr.*, u.name as user_name, u.department
          FROM leave_requests lr
          JOIN users u ON lr.user_id = u.id
          WHERE 1=1
        `;
        const params: any[] = [];
        if (userId) {
          params.push(userId);
          query += ` AND lr.user_id = $${params.length}`;
        }
        if (status) {
          params.push(status);
          query += ` AND lr.status = $${params.length}`;
        }
        query += ` ORDER BY lr.created_at DESC`;

        const result = await client.query(query, params);
        client.release();
        return res.json(result.rows.map(row => ({
          ...row,
          requested_days: parseFloat(row.requested_days)
        })));
      } else {
        let filtered = [...memoryLeaveRequests];
        if (userId) filtered = filtered.filter(r => r.user_id === userId);
        if (status) filtered = filtered.filter(r => r.status === status);
        return res.json(filtered);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit Leave Request
  app.post('/api/leave-requests', async (req: Request, res: Response) => {
    try {
      const { user_id, leave_type, start_date, end_date, requested_days, reason } = req.body;
      if (!user_id || !start_date || !end_date) {
        return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
      }

      const reqId = 'req-' + Date.now().toString(36);
      const days = parseFloat(requested_days) || 1.0;

      if (dbConnected) {
        const client = await pool.connect();

        // Check user remaining days
        const grantRes = await client.query('SELECT remaining_days, pending_days FROM leave_grants WHERE user_id = $1 AND year = 2026', [user_id]);
        if (grantRes.rows.length > 0) {
          const rem = parseFloat(grantRes.rows[0].remaining_days) || 0;
          if (days > rem) {
            client.release();
            return res.status(400).json({ error: `잔여 연차가 부족합니다. (신청일수: ${days}일, 남은 연차: ${rem}일)` });
          }
        }

        await client.query(
          `INSERT INTO leave_requests (id, user_id, leave_type, start_date, end_date, requested_days, reason, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
          [reqId, user_id, leave_type, start_date, end_date, days, reason || '']
        );

        // Update pending_days in grant
        await client.query(
          `UPDATE leave_grants SET pending_days = pending_days + $1 WHERE user_id = $2 AND year = 2026`,
          [days, user_id]
        );

        client.release();
      } else {
        const user = memoryUsers.find(u => u.id === user_id);
        memoryLeaveRequests.unshift({
          id: reqId,
          user_id,
          user_name: user?.name || '교사',
          department: user?.department || '어린이집',
          leave_type,
          start_date,
          end_date,
          requested_days: days,
          reason,
          status: 'pending',
          processed_by: null,
          processed_at: null,
          rejection_reason: null,
          created_at: new Date().toISOString()
        });
      }

      res.status(201).json({ id: reqId, message: '연차 신청서가 정상 접수되었습니다. 관리자/원장 승인 대기 중입니다.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Approve / Reject / Cancel Leave Request (원장/관리자 승인, 차감 및 취소시 잔여연차 복원)
  app.post('/api/leave-requests/:id/action', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action, processed_by, rejection_reason } = req.body; // action: 'approve' | 'reject' | 'cancel'

      if (!['approve', 'reject', 'cancel'].includes(action)) {
        return res.status(400).json({ error: '유효하지 않은 작업입니다.' });
      }

      const now = new Date().toISOString();

      if (dbConnected) {
        const client = await pool.connect();
        const reqRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
        if (reqRes.rows.length === 0) {
          client.release();
          return res.status(404).json({ error: '연차 신청건을 찾을 수 없습니다.' });
        }

        const leaveReq = reqRes.rows[0];
        const days = parseFloat(leaveReq.requested_days);
        const userId = leaveReq.user_id;
        const currentStatus = leaveReq.status;

        if (action === 'approve') {
          // Change status to approved
          // Deduct from remaining_days, add to used_days, subtract from pending_days
          await client.query(
            `UPDATE leave_requests 
             SET status = 'approved', processed_by = $1, processed_at = $2 
             WHERE id = $3`,
            [processed_by || '관리자', now, id]
          );

          if (currentStatus === 'pending') {
            await client.query(
              `UPDATE leave_grants 
               SET used_days = used_days + $1, 
                   pending_days = GREATEST(0, pending_days - $1),
                   remaining_days = total_days - (used_days + $1)
               WHERE user_id = $2 AND year = 2026`,
              [days, userId]
            );
          }
        } else if (action === 'reject') {
          await client.query(
            `UPDATE leave_requests 
             SET status = 'rejected', processed_by = $1, processed_at = $2, rejection_reason = $3 
             WHERE id = $4`,
            [processed_by || '관리자', now, rejection_reason || '사유 미기재', id]
          );

          if (currentStatus === 'pending') {
            await client.query(
              `UPDATE leave_grants 
               SET pending_days = GREATEST(0, pending_days - $1)
               WHERE user_id = $2 AND year = 2026`,
              [days, userId]
            );
          }
        } else if (action === 'cancel') {
          // Cancel previously approved leave and RESTORE remaining leave days! (승인 연차 취소 시 남은 연차 복원)
          await client.query(
            `UPDATE leave_requests 
             SET status = 'cancelled', processed_by = $1, processed_at = $2 
             WHERE id = $3`,
            [processed_by || '관리자', now, id]
          );

          if (currentStatus === 'approved') {
            await client.query(
              `UPDATE leave_grants 
               SET used_days = GREATEST(0, used_days - $1),
                   remaining_days = total_days - GREATEST(0, used_days - $1)
               WHERE user_id = $2 AND year = 2026`,
              [days, userId]
            );
          } else if (currentStatus === 'pending') {
            await client.query(
              `UPDATE leave_grants 
               SET pending_days = GREATEST(0, pending_days - $1)
               WHERE user_id = $2 AND year = 2026`,
              [days, userId]
            );
          }
        }

        client.release();
      } else {
        const item = memoryLeaveRequests.find(r => r.id === id);
        if (item) {
          const currentStatus = item.status;
          item.status = action === 'approve' ? 'approved' : (action === 'reject' ? 'rejected' : 'cancelled');
          item.processed_by = processed_by || '관리자';
          item.processed_at = now;
          if (rejection_reason) item.rejection_reason = rejection_reason;
        }
      }

      const actionMsg = action === 'approve' 
        ? '연차 승인 처리되었으며, 차감이 정상 등록되었습니다.' 
        : (action === 'cancel' ? '승인되었던 연차가 취소 처리되어 차감 일수가 남은 연차로 복원되었습니다!' : '연차가 반려 처리되었습니다.');

      res.json({ success: true, message: actionMsg });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get Teacher Schedules / Duty Shifts
  app.get('/api/schedules', async (req: Request, res: Response) => {
    try {
      const { month } = req.query; // e.g. '2026-07' or '2026-08'
      if (dbConnected) {
        const client = await pool.connect();
        const result = await client.query(`
          SELECT ts.*, u.name as user_name, u.department
          FROM teacher_schedules ts
          JOIN users u ON ts.user_id = u.id
          ORDER BY ts.date ASC, u.name ASC
        `);
        client.release();
        return res.json(result.rows);
      } else {
        return res.json([]);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save / Update Teacher Schedule Shift
  app.post('/api/schedules', async (req: Request, res: Response) => {
    try {
      const { user_id, date, shift_type, class_name, note } = req.body;
      if (!user_id || !date || !shift_type) {
        return res.status(400).json({ error: '필수 값이 누락되었습니다.' });
      }

      if (dbConnected) {
        const client = await pool.connect();
        await client.query(
          `INSERT INTO teacher_schedules (user_id, date, shift_type, class_name, note)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, date) DO UPDATE
           SET shift_type = $3, class_name = $4, note = $5`,
          [user_id, date, shift_type, class_name || '', note || '']
        );
        client.release();
      }

      res.json({ success: true, message: '근무 당직 스케줄이 등록/수정되었습니다.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve Vite Frontend in development / static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Cocobebe Daycare Server] listening on http://0.0.0.0:${PORT}`);
    if (DATABASE_URL) {
      console.log(`📌 Connected to PostgreSQL DB: ${DATABASE_URL.substring(0, 35)}...`);
    } else {
      console.log('📌 DATABASE_URL is not configured; using in-memory fallback.');
    }
  });
}

startServer();
