import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, ensureLeaveGrantForUser, query, calculateServiceInfo } from '@/lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();

    const usersResult = await query(`SELECT * FROM users WHERE status IS NULL OR status = 'active' ORDER BY name ASC`);
    const users = usersResult.rows;
    const currentYear = new Date().getFullYear();

    const usersWithLeave = [];

    for (const user of users) {
      try {
        const leaveGrant = await ensureLeaveGrantForUser(user.id, user.hire_date, currentYear);
        const serviceInfo = calculateServiceInfo(user.hire_date);
        const hireDateOnly = typeof user.hire_date === 'string' && user.hire_date.includes('T') ? user.hire_date.split('T')[0] : (user.hire_date || '');

        usersWithLeave.push({
          ...user,
          hire_date: hireDateOnly,
          statutory_days: Number(leaveGrant.statutory_days ?? 0),
          bonus_days: Number(leaveGrant.bonus_days ?? 0),
          total_days: Number(leaveGrant.total_days ?? 0),
          used_days: Number(leaveGrant.used_days ?? 0),
          pending_days: Number(leaveGrant.pending_days ?? 0),
          remaining_days: Number(leaveGrant.remaining_days ?? 0),
          calculation_note: leaveGrant.calculation_note,
          years_of_service: serviceInfo.years,
          months_of_service: serviceInfo.months,
        });
      } catch (err: any) {
        // 오류 발생 시 기본값으로 추가
        usersWithLeave.push({
          ...user,
          statutory_days: 0,
          bonus_days: 0,
          total_days: 0,
          used_days: 0,
          pending_days: 0,
          remaining_days: 0,
          calculation_note: 'Error calculating leave',
        });
      }
    }

    return NextResponse.json(usersWithLeave);
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

    await ensureLeaveGrantForUser(id, hireDate, new Date().getFullYear());

    return NextResponse.json({ success: true, message: '사용자 등록 완료', user: { id, login_id: loginId, name, role } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '사용자 등록 실패' }, { status: 500 });
  }
}
