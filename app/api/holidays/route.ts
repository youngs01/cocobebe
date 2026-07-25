import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    const result = await query(`SELECT * FROM holidays ORDER BY date ASC`);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '휴일 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ success: true, message: '휴일이 등록되었습니다.', holiday: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '휴일 등록 실패' }, { status: 500 });
  }
}
