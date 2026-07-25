import { NextResponse } from 'next/server';
import { mockUsers } from '../_mock-data';

export async function GET() {
  return NextResponse.json(mockUsers);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, message: '사용자 등록 완료', user: body });
}
