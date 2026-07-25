import { NextResponse } from 'next/server';
import { mockSchedules } from '../_mock-data';

export async function GET() {
  return NextResponse.json(mockSchedules);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, message: '스케줄이 저장되었습니다.', schedule: body });
}
