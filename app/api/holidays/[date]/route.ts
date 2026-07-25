import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, query } from '@/lib/db';

export async function DELETE(request: Request, props: { params: Promise<{ date: string }> }) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const { date } = await props.params;

    await query(`DELETE FROM holidays WHERE date = $1`, [date]);

    return NextResponse.json({ success: true, message: '휴일이 삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '휴일 삭제 실패' }, { status: 500 });
  }
}
