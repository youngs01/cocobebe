import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, query } from '@/lib/db';
import { getDefaultHolidayList } from '@/lib/holidays';

const fallbackHolidays = getDefaultHolidayList(2026);

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(fallbackHolidays);
    }

    await ensureDatabaseSchema();
    const result = await query(`SELECT * FROM holidays ORDER BY date ASC`);
    return NextResponse.json(result.rows.length > 0 ? result.rows : fallbackHolidays);
  } catch (error: any) {
    return NextResponse.json(fallbackHolidays);
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const body = await request.json().catch(() => ({}));
    const date = body?.date;
    const title = body?.title;

    if (!date || !title) {
      return NextResponse.json({ error: '날짜와 휴일명을 입력해 주세요.' }, { status: 400 });
    }

    await query(
      `INSERT INTO holidays (date, title, is_public, source) VALUES ($1, $2, $3, $4)
       ON CONFLICT (date) DO UPDATE SET title = EXCLUDED.title, is_public = EXCLUDED.is_public, source = EXCLUDED.source`,
      [date, title, true, 'manual']
    );

    return NextResponse.json({ success: true, message: '휴일이 등록되었습니다.', holiday: { date, title, is_public: true, source: 'manual' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '휴일 등록 실패' }, { status: 500 });
  }
}
