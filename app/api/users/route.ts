import { NextResponse } from 'next/server';
import { calculateServiceInfo, ensureDatabaseSchema, ensureLeaveGrantForUser, query } from '@/lib/db';

function calculateYearsOfService(hireDate: string) {
  const start = new Date(`${hireDate}T00:00:00Z`);
  const now = new Date();
  const totalMonths = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + (now.getUTCMonth() - start.getUTCMonth());
  const years = Math.max(0, Math.floor(totalMonths / 12));
  const months = Math.max(0, totalMonths % 12);
  return { years, months };
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const usersResult = await query(`SELECT * FROM users ORDER BY name ASC`);
    const currentYear = new Date().getFullYear();

    for (const user of usersResult.rows) {
      try {
        await ensureLeaveGrantForUser(user.id, user.hire_date, currentYear);
      } catch (err: any) {
        console.error(`Failed to ensure leave grant for user ${user.id}:`, err.message);
      }
    }

    const grantsResult = await query(`SELECT * FROM leave_grants WHERE year = $1 ORDER BY user_id ASC`, [currentYear]);

    const grantsByUser = new Map<string, any[]>();
    for (const grant of grantsResult.rows) {
      const list = grantsByUser.get(grant.user_id) || [];
      list.push(grant);
      grantsByUser.set(grant.user_id, list);
    }

    const users = usersResult.rows.map((user: any) => {
      const grants = grantsByUser.get(user.id) || [];
      const latestGrant = grants[grants.length - 1] || null;
      const serviceInfo = calculateServiceInfo(user.hire_date);
      const { years, months } = calculateYearsOfService(user.hire_date);
      
      // 0이나 null/undefined인 경우 모두 계산값으로 대체
      const dbStatutoryDays = Number(latestGrant?.statutory_days ?? -1);
      const statutoryDays = dbStatutoryDays > 0 ? dbStatutoryDays : serviceInfo.statutoryDays;
      
      const bonusDays = Number(latestGrant?.bonus_days ?? 0);
      const dbTotalDays = Number(latestGrant?.total_days ?? -1);
      const totalDays = dbTotalDays > 0 ? dbTotalDays : statutoryDays;
      
      const usedDays = Number(latestGrant?.used_days ?? 0);
      const pendingDays = Number(latestGrant?.pending_days ?? 0);
      const dbRemainingDays = Number(latestGrant?.remaining_days ?? -1);
      const remainingDays = dbRemainingDays >= 0 ? dbRemainingDays : Math.max(0, totalDays - usedDays - pendingDays);

      return {
        ...user,
        statutory_days: Math.max(0, statutoryDays),
        bonus_days: bonusDays,
        total_days: Math.max(0, totalDays),
        used_days: usedDays,
        pending_days: pendingDays,
        remaining_days: Math.max(0, remainingDays),
        calculation_note: latestGrant?.calculation_note || `${serviceInfo.years}년 ${serviceInfo.months}개월 근속 기준`,
        years_of_service: years,
        months_of_service: months,
      };
    });

    return NextResponse.json(users);
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
