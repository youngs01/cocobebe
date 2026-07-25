import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, ensureLeaveGrantForUser, query } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const { id } = await params;
    const userResult = await query(`SELECT hire_date, name FROM users WHERE id = $1`, [id]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const currentYear = new Date().getFullYear();
    const grant = await ensureLeaveGrantForUser(id, user.hire_date, currentYear);
    return NextResponse.json({ success: true, note: `${user.name}의 연차를 재산정했습니다.`, grant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '연차 재산정 실패' }, { status: 500 });
  }
}
