import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, query, ensureLeaveGrantForUser } from '@/lib/db';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();

    const { id } = await props.params;
    const body = await request.json();
    const { name, department, position, phone, email, hire_date, role } = body;

    // 필수 필드 검증
    if (!name?.trim() || !department?.trim()) {
      return NextResponse.json({ error: '이름과 담당 반/부서는 필수입니다.' }, { status: 400 });
    }

    // 사용자 업데이트
    const updateResult = await query(
      `UPDATE users 
       SET name = $1, department = $2, position = $3, phone = $4, email = $5, hire_date = $6, role = $7
       WHERE id = $8
       RETURNING id, login_id, name, role, hire_date, department, phone, email, status, position`,
      [name.trim(), department.trim(), position || null, phone || null, email || null, hire_date || null, role || 'teacher', id]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const updatedUser = updateResult.rows[0];

    // hire_date 변경 시 해당 연도 leave_grant 자동 재계산
    if (hire_date) {
      const currentYear = new Date().getFullYear();
      await ensureLeaveGrantForUser(id, hire_date, currentYear);
    }

    return NextResponse.json({
      success: true,
      message: '교직원 정보가 업데이트되었습니다.',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json({ error: error.message || '정보 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();

    const { id } = await props.params;

    // 사용자를 inactive 상태로 변경 (삭제 대신 비활성화)
    const result = await query(
      `UPDATE users 
       SET status = 'inactive'
       WHERE id = $1
       RETURNING id, name, role`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '교직원 계정이 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: error.message || '계정 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
