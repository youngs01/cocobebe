import { NextResponse } from 'next/server';
import { calculateServiceInfo, ensureDatabaseSchema, ensureLeaveGrantForUser, query } from '@/lib/db';

function calculateYearsOfService(hireDate: string) {
  if (!hireDate || typeof hireDate !== 'string') {
    return { years: 0, months: 0 };
  }
  
  // Handle both "2020-01-01" and "2020-01-01T00:00:00.000Z" formats
  let dateStr = hireDate.includes('T') ? hireDate : `${hireDate}T00:00:00Z`;
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) {
    return { years: 0, months: 0 };
  }

  // Use UTC for current date
  const now = new Date();
  const endUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  const totalMonths = (endUTC.getUTCFullYear() - start.getUTCFullYear()) * 12 + (endUTC.getUTCMonth() - start.getUTCMonth());
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
      const serviceInfo = calculateServiceInfo(user.hire_date);
      const { years, months } = calculateYearsOfService(user.hire_date);
      
      const grants = grantsByUser.get(user.id) || [];
      const latestGrant = grants[grants.length - 1] || null;
      const usedDays = Number(latestGrant?.used_days ?? 0);
      const pendingDays = Number(latestGrant?.pending_days ?? 0);

      return {
        ...user,
        statutory_days: serviceInfo.statutoryDays,
        bonus_days: 0,
        total_days: serviceInfo.statutoryDays,
        used_days: usedDays,
        pending_days: pendingDays,
        remaining_days: Math.max(0, serviceInfo.statutoryDays - usedDays - pendingDays),
        calculation_note: `${serviceInfo.years}년 ${serviceInfo.months}개월 근속 → ${serviceInfo.statutoryDays}일`,
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
