import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, ensureLeaveGrantForUser, query, calculateServiceInfo } from '@/lib/db';

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
    const currentYear = new Date().getFullYear();
    try {
      const grant = await ensureLeaveGrantForUser(user.id, user.hire_date, currentYear);
      const serviceInfo = calculateServiceInfo(user.hire_date);

      const dbStatutoryDays = Number(grant?.statutory_days ?? -1);
      const statutoryDays = dbStatutoryDays > 0 ? dbStatutoryDays : serviceInfo.statutoryDays;
      const dbTotalDays = Number(grant?.total_days ?? -1);
      const totalDays = dbTotalDays > 0 ? dbTotalDays : statutoryDays;
      const dbRemainingDays = Number(grant?.remaining_days ?? -1);
      const remainingDays = dbRemainingDays >= 0 ? dbRemainingDays : totalDays;

      return NextResponse.json({
        success: true,
        user: {
          ...user,
          statutory_days: Math.max(0, statutoryDays),
          bonus_days: Number(grant?.bonus_days ?? 0),
          total_days: Math.max(0, totalDays),
          used_days: Number(grant?.used_days ?? 0),
          pending_days: Number(grant?.pending_days ?? 0),
          remaining_days: Math.max(0, remainingDays),
          calculation_note: grant?.calculation_note || `로그인 시 계산됨 (근속 ${serviceInfo.years}년 ${serviceInfo.months}개월)`,
          years_of_service: serviceInfo.years,
          months_of_service: serviceInfo.months,
        }
      });
    } catch (err: any) {
      console.error(`Failed to process leave grant for ${user.id}:`, err.message);
      const serviceInfo = calculateServiceInfo(user.hire_date);
      return NextResponse.json({
        success: true,
        user: {
          ...user,
          statutory_days: Math.max(0, serviceInfo.statutoryDays),
          bonus_days: 0,
          total_days: Math.max(0, serviceInfo.statutoryDays),
          used_days: 0,
          pending_days: 0,
          remaining_days: Math.max(0, serviceInfo.statutoryDays),
          calculation_note: `근속 ${serviceInfo.years}년 ${serviceInfo.months}개월 (매뉴얼 계산)`,
          years_of_service: serviceInfo.years,
          months_of_service: serviceInfo.months,
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
