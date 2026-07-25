import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, query } from '@/lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const result = await query(`SELECT * FROM users ORDER BY name ASC`);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '사용자 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();

    const body = await request.json().catch(() => ({}));
    const id = body?.id || `usr-${Date.now()}`;
    const loginId = body?.login_id || body?.username || `user${Date.now()}`;
    const password = body?.password || '1234';
    const name = body?.name || '신규 교사';
    const role = body?.role || 'teacher';
    const hireDate = body?.hire_date || '2026-01-01';
    const department = body?.department || '미지정';
    const phone = body?.phone || '';
    const email = body?.email || '';
    const status = body?.status || 'active';
    const position = body?.position || '교사';

    await query(
      `INSERT INTO users (id, login_id, password, name, role, hire_date, department, phone, email, status, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         login_id = EXCLUDED.login_id,
         password = EXCLUDED.password,
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         hire_date = EXCLUDED.hire_date,
         department = EXCLUDED.department,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         status = EXCLUDED.status,
         position = EXCLUDED.position`,
      [id, loginId, password, name, role, hireDate, department, phone, email, status, position]
    );

    return NextResponse.json({ success: true, message: '사용자 등록 완료', user: { id, login_id: loginId, name, role } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '사용자 등록 실패' }, { status: 500 });
  }
}
