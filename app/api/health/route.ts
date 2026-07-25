import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({ status: 'ok', dbConnected: false, error: 'DATABASE_URL이 설정되지 않았습니다.' });
    }

    await pool.query('SELECT 1');
    return NextResponse.json({ status: 'ok', dbConnected: true, app: '코코베베 어린이집 연차 및 스케줄 관리' });
  } catch (error: any) {
    return NextResponse.json({ status: 'ok', dbConnected: false, error: error.message || 'DB 연결 실패' }, { status: 500 });
  }
}
