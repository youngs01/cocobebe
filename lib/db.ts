import { Pool } from 'pg';
import 'dotenv/config';
import { getDefaultHolidayList } from './holidays';

const connectionString = process.env.DATABASE_URL;

let poolInstance: Pool | null = null;

function getPool() {
  if (!connectionString) {
    return null;
  }

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
  }

  return poolInstance;
}

export const pool = getPool();

function getCurrentYear() {
  return new Date().getFullYear();
}

function calculateServiceInfo(hireDate: string, asOfYear: number) {
  const start = new Date(`${hireDate}T00:00:00`);
  const end = new Date(`${asOfYear}-12-31T00:00:00`);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const years = Math.max(0, Math.floor(months / 12));
  const remainingMonths = Math.max(0, months % 12);

  let statutoryDays = 15;
  if (years >= 1) {
    statutoryDays = Math.min(25, 15 + Math.max(0, years - 1));
  }

  return { years, months: remainingMonths, statutoryDays };
}

export async function ensureLeaveGrantForUser(userId: string, hireDate: string, year: number) {
  const existingGrant = await query(`SELECT * FROM leave_grants WHERE user_id = $1 AND year = $2`, [userId, year]);
  if (existingGrant.rows.length > 0) {
    return existingGrant.rows[0];
  }

  const previousGrant = await query(
    `SELECT remaining_days FROM leave_grants WHERE user_id = $1 AND year < $2 ORDER BY year DESC LIMIT 1`,
    [userId, year]
  );

  const { statutoryDays, years, months } = calculateServiceInfo(hireDate, year);
  const bonusDays = 0;
  const totalDays = statutoryDays + bonusDays;
  const previousRemaining = previousGrant.rows[0]?.remaining_days != null ? Number(previousGrant.rows[0].remaining_days) : 0;
  const remainingDays = Number((totalDays + previousRemaining).toFixed(1));
  const note = `${year}년 기준 법정연차 ${statutoryDays}일 (근속 ${years}년 ${months}개월)`;

  await query(
    `INSERT INTO leave_grants (user_id, year, statutory_days, bonus_days, total_days, used_days, pending_days, remaining_days, calculation_note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [userId, year, statutoryDays, bonusDays, totalDays, 0, 0, remainingDays, note]
  );

  return { user_id: userId, year, statutory_days: statutoryDays, bonus_days: bonusDays, total_days: totalDays, used_days: 0, pending_days: 0, remaining_days: remainingDays, calculation_note: note };
}

export async function updateLeaveGrantBalance(userId: string, year: number, usedDelta: number) {
  const user = await query(`SELECT hire_date FROM users WHERE id = $1`, [userId]);
  const hireDate = user.rows[0]?.hire_date || '2020-01-01';
  await ensureLeaveGrantForUser(userId, hireDate, year);

  const grantResult = await query(`SELECT * FROM leave_grants WHERE user_id = $1 AND year = $2`, [userId, year]);
  if (grantResult.rows.length === 0) {
    return null;
  }

  const grant = grantResult.rows[0];
  const updatedUsed = Number(grant.used_days || 0) + usedDelta;
  const updatedRemaining = Number(grant.total_days || 0) - updatedUsed;

  await query(
    `UPDATE leave_grants SET used_days = $1, remaining_days = $2 WHERE user_id = $3 AND year = $4`,
    [updatedUsed, updatedRemaining, userId, year]
  );

  return { ...grant, used_days: updatedUsed, remaining_days: updatedRemaining };
}

async function seedDefaultHolidays(activePool: Pool) {
  const holidays = getDefaultHolidayList(new Date().getFullYear());

  for (const holiday of holidays) {
    await activePool.query(
      `INSERT INTO holidays (date, title, is_public, source)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date) DO NOTHING`,
      [holiday.date, holiday.title, holiday.is_public, holiday.source]
    );
  }
}

export async function ensureDatabaseSchema() {
  const activePool = getPool();
  if (!activePool) {
    return;
  }

  await activePool.query(`
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
      position VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

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

  await activePool.query(
    `INSERT INTO users (id, login_id, password, name, role, hire_date, department, phone, email, status, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO NOTHING`,
    [
      'usr-coco',
      'coco',
      'Dbsgofks03!',
      '관리자',
      'manager',
      '2020-01-01',
      '원장실/행정',
      '010-0000-0000',
      'coco@cocobebe.kr',
      'active',
      '원장'
    ]
  );

  await seedDefaultHolidays(activePool);

  const currentYear = getCurrentYear();
  const adminUser = await query(`SELECT id, hire_date FROM users WHERE id = $1`, ['usr-coco']);
  if (adminUser.rows.length > 0) {
    await ensureLeaveGrantForUser('usr-coco', '2020-01-01', currentYear);
  }
}

export async function query<T = any>(text: string, params?: any[]) {
  const activePool = getPool();
  if (!activePool) {
    throw new Error('DATABASE_URL is not configured');
  }

  const client = await activePool.connect();
  try {
    const result = await client.query(text, params);
    return result as { rows: T[] };
  } finally {
    client.release();
  }
}
