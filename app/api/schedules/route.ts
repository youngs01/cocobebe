import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, query } from '@/lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const result = await query(`SELECT ts.*, u.name AS user_name, u.department FROM teacher_schedules ts LEFT JOIN users u ON u.id = ts.user_id ORDER BY ts.date ASC`);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '스케줄 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const body = await request.json().catch(() => ({}));
    const userId = body?.user_id;
    const date = body?.date;
    const shiftType = body?.shift_type || 'normal';
    const note = body?.note || '';

    if (!userId || !date) {
      return NextResponse.json({ error: '스케줄 정보가 부족합니다.' }, { status: 400 });
    }

    await query(
      `INSERT INTO teacher_schedules (user_id, date, shift_type, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date) DO UPDATE SET shift_type = EXCLUDED.shift_type, note = EXCLUDED.note`,
      [userId, date, shiftType, note]
    );

    return NextResponse.json({ success: true, message: '스케줄이 저장되었습니다.', schedule: { user_id: userId, date, shift_type: shiftType, note } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '스케줄 저장 실패' }, { status: 500 });
  }
}
