import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않아 로그인할 수 없습니다.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password.trim() : '';

    const result = await query(
      `SELECT id, login_id, name, role, hire_date, department, phone, email, status, position
       FROM users
       WHERE (login_id = $1 OR id = $1) AND password = $2 AND status = 'active'`,
      [username, password]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const user = result.rows[0];
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
