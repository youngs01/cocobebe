import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    const result = await query(`SELECT * FROM teacher_schedules ORDER BY date ASC`);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '스케줄 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ success: true, message: '스케줄이 저장되었습니다.', schedule: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '스케줄 저장 실패' }, { status: 500 });
  }
}
