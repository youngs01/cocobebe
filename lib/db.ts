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

export function calculateServiceInfo(hireDate: string, asOfDate: Date = new Date()) {
  if (!hireDate || typeof hireDate !== 'string') {
    console.log('[DEBUG] calculateServiceInfo: Invalid hireDate', hireDate);
    return { years: 0, months: 0, statutoryDays: 0 };
  }

  // Handle both "2020-01-01" and "2020-01-01T00:00:00.000Z" formats
  let dateStr = hireDate.includes('T') ? hireDate : `${hireDate}T00:00:00Z`;
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) {
    console.log('[DEBUG] calculateServiceInfo: Invalid start date', dateStr);
    return { years: 0, months: 0, statutoryDays: 0 };
  }

  const end = new Date(Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth(), asOfDate.getUTCDate()));
  if (isNaN(end.getTime())) {
    console.log('[DEBUG] calculateServiceInfo: Invalid end date', asOfDate);
    return { years: 0, months: 0, statutoryDays: 0 };
  }

  const totalMonths = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  const completedMonths = Math.max(0, totalMonths);
  const years = Math.max(0, Math.floor(completedMonths / 12));
  const months = Math.max(0, completedMonths % 12);

  let statutoryDays = 0;
  if (completedMonths < 1) {
    statutoryDays = 0;
  } else if (completedMonths < 12) {
    // 1년 미만: 월 1일씩 (최대 11일)
    statutoryDays = Math.min(11, completedMonths);
  } else {
    // 1년 이상: 15일 + (years - 1) / 2 추가 (최대 25일)
    const extra = Math.floor((years - 1) / 2);
    statutoryDays = Math.min(25, 15 + extra);
  }

  console.log('[DEBUG] calculateServiceInfo:', {
    hireDate,
    asOfDate: end.toISOString(),
    totalMonths,
    years,
    months,
    completedMonths,
    statutoryDays,
  });

  return { years, months, statutoryDays };
}

export async function ensureLeaveGrantForUser(userId: string, hireDate: string, year: number) {
  try {
    const serviceInfo = calculateServiceInfo(hireDate, new Date(Date.UTC(year, 11, 31)));
    const { statutoryDays, years, months } = serviceInfo;
    
    console.log(`[DEBUG] ensureLeaveGrantForUser for ${userId}:`, { statutoryDays, years, months, hireDate });
    
    const bonusDays = 0;
    const totalDays = Math.max(0, statutoryDays + bonusDays);
    const note = `${year}년 기준 법정연차 ${statutoryDays}일 (근속 ${years}년 ${months}개월)`;

    const existingGrant = await query(`SELECT * FROM leave_grants WHERE user_id = $1 AND year = $2`, [userId, year]);
    if (existingGrant.rows.length > 0) {
      const current = existingGrant.rows[0];
      const usedDays = Number(current.used_days || 0);
      const pendingDays = Number(current.pending_days || 0);
      const remainingDays = Math.max(0, totalDays - usedDays - pendingDays);

      console.log(`[DEBUG] Updating existing grant for ${userId}:`, {
        statutory_days: statutoryDays,
        total_days: totalDays,
        used_days: usedDays,
        pending_days: pendingDays,
        remaining_days: remainingDays,
      });

      await query(
        `UPDATE leave_grants
         SET statutory_days = $1, bonus_days = $2, total_days = $3, remaining_days = $4, calculation_note = $5
         WHERE user_id = $6 AND year = $7`,
        [statutoryDays, bonusDays, totalDays, remainingDays, note, userId, year]
      );

      return {
        ...current,
        statutory_days: statutoryDays,
        bonus_days: bonusDays,
        total_days: totalDays,
        remaining_days: remainingDays,
        calculation_note: note,
      };
    }

    const remainingDays = totalDays;

    console.log(`[DEBUG] Inserting new grant for ${userId}:`, {
      statutory_days: statutoryDays,
      total_days: totalDays,
      remaining_days: remainingDays,
    });

    await query(
      `INSERT INTO leave_grants (user_id, year, statutory_days, bonus_days, total_days, used_days, pending_days, remaining_days, calculation_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, year, statutoryDays, bonusDays, totalDays, 0, 0, remainingDays, note]
    );

    return { user_id: userId, year, statutory_days: statutoryDays, bonus_days: bonusDays, total_days: totalDays, used_days: 0, pending_days: 0, remaining_days: remainingDays, calculation_note: note };
  } catch (err: any) {
    console.error(`Error in ensureLeaveGrantForUser for ${userId}:`, err.message);
    throw err;
  }
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
