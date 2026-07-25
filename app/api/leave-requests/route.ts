import { NextResponse } from 'next/server';
import { mockLeaveRequests } from '../_mock-data';

export async function GET() {
  return NextResponse.json(mockLeaveRequests);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, message: '연차 신청이 접수되었습니다.', request: body });
}
