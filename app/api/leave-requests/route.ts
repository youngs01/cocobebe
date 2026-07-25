import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, query } from '@/lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const result = await query(`SELECT * FROM leave_requests ORDER BY created_at DESC`);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '연차 요청 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const body = await request.json().catch(() => ({}));
    const id = body?.id || `req-${Date.now()}`;
    const userId = body?.user_id;
    const leaveType = body?.leave_type || 'annual';
    const startDate = body?.start_date;
    const endDate = body?.end_date;
    const requestedDays = body?.requested_days || 1;
    const reason = body?.reason || '';

    if (!userId || !startDate || !endDate) {
      return NextResponse.json({ error: '연차 신청 정보가 부족합니다.' }, { status: 400 });
    }

    await query(
      `INSERT INTO leave_requests (id, user_id, leave_type, start_date, end_date, requested_days, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
      [id, userId, leaveType, startDate, endDate, requestedDays, reason]
    );

    return NextResponse.json({ success: true, message: '연차 신청이 접수되었습니다.', request: { id, user_id: userId, leave_type: leaveType, start_date: startDate, end_date: endDate, requested_days: requestedDays, reason } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '연차 신청 실패' }, { status: 500 });
  }
}
