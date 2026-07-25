import { NextResponse } from 'next/server';
import { mockHolidays } from '../_mock-data';

export async function GET() {
  return NextResponse.json(mockHolidays);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, message: '휴일이 등록되었습니다.', holiday: body });
}
