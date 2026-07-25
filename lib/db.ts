import { Pool } from 'pg';
import 'dotenv/config';

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
