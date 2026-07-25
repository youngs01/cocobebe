import { NextResponse } from 'next/server';
import { ensureDatabaseSchema, query, updateLeaveGrantBalance } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    await ensureDatabaseSchema();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body?.action || 'approve';
    const processedBy = body?.processed_by || '관리자';
    const rejectionReason = body?.rejection_reason || null;

    const requestResult = await query(`SELECT * FROM leave_requests WHERE id = $1`, [id]);
    if (requestResult.rows.length === 0) {
      return NextResponse.json({ error: '연차 신청을 찾을 수 없습니다.' }, { status: 404 });
    }

    const leaveRequest = requestResult.rows[0];
    const requestYear = new Date(leaveRequest.start_date).getFullYear();

    if (action === 'approve') {
      await query(
        `UPDATE leave_requests SET status = 'approved', processed_by = $1, processed_at = NOW(), rejection_reason = NULL WHERE id = $2`,
        [processedBy, id]
      );
      await updateLeaveGrantBalance(leaveRequest.user_id, requestYear, Number(leaveRequest.requested_days || 0));
      return NextResponse.json({ success: true, message: '연차 승인 및 차감이 반영되었습니다.' });
    }

    if (action === 'reject') {
      await query(
        `UPDATE leave_requests SET status = 'rejected', processed_by = $1, processed_at = NOW(), rejection_reason = $2 WHERE id = $3`,
        [processedBy, rejectionReason, id]
      );
      return NextResponse.json({ success: true, message: '연차 신청이 반려되었습니다.' });
    }

    if (action === 'cancel') {
      await query(
        `UPDATE leave_requests SET status = 'cancelled', processed_by = $1, processed_at = NOW(), rejection_reason = NULL WHERE id = $2`,
        [processedBy, id]
      );
      await updateLeaveGrantBalance(leaveRequest.user_id, requestYear, -Number(leaveRequest.requested_days || 0));
      return NextResponse.json({ success: true, message: '승인 취소 및 연차가 복원되었습니다.' });
    }

    return NextResponse.json({ error: '지원하지 않는 처리입니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '연차 처리 실패' }, { status: 500 });
  }
}
