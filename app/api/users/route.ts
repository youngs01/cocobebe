import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, ensureLeaveGrantForUser, query } from '@/lib/db';

export async function GET() {
  try {
    console.log('[API] GET /api/users - START');
    
    if (!process.env.DATABASE_URL) {
      console.log('[API] DATABASE_URL not set');
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const currentYear = new Date().getFullYear();
    console.log('[API] Current year:', currentYear);

    // 1. 모든 직원 조회
    const usersResult = await query(`SELECT * FROM users ORDER BY name ASC`);
    const users = usersResult.rows;
    console.log('[API] Total users:', users.length);

    const usersWithLeave = [];

    for (const user of users) {
      console.log(`[API] Processing user: ${user.name} (${user.id}), hire_date: ${user.hire_date}`);
      try {
        // 2. 각 직원별로 해당 연도(currentYear)의 연차 데이터 생성/조회
        const leaveGrant = await ensureLeaveGrantForUser(user.id, user.hire_date, currentYear);
        
        console.log(`[API] Leave grant for ${user.name}:`, {
          statutory_days: leaveGrant.statutory_days,
          total_days: leaveGrant.total_days,
          used_days: leaveGrant.used_days,
          remaining_days: leaveGrant.remaining_days,
        });

        // 3. 사용자 정보와 연차 정보를 합쳐서 반환
        usersWithLeave.push({
          ...user,
          statutory_days: leaveGrant.statutory_days,
          bonus_days: leaveGrant.bonus_days,
          total_days: leaveGrant.total_days,
          used_days: leaveGrant.used_days,
          pending_days: leaveGrant.pending_days,
          remaining_days: leaveGrant.remaining_days,
          calculation_note: leaveGrant.calculation_note,
        });
      } catch (err: any) {
        console.error(`[API] Failed for ${user.name}:`, err.message, err.stack);
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

    console.log('[API] GET /api/users - SUCCESS, returning', usersWithLeave.length, 'users');
    return NextResponse.json(usersWithLeave);
  } catch (error: any) {
    console.error('[API] GET /api/users - ERROR:', error.message, error.stack);
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
