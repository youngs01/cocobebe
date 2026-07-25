import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    const result = await query(`SELECT * FROM leave_requests ORDER BY created_at DESC`);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '연차 요청 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ success: true, message: '연차 신청이 접수되었습니다.', request: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '연차 신청 실패' }, { status: 500 });
  }
}
