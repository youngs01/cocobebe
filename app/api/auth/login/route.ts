import { NextResponse } from 'next/server';
import { adminUser } from '../../_mock-data';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password.trim() : '';

  if (username === 'coco' && password === 'Dbsgofks03!') {
    return NextResponse.json({ success: true, user: adminUser });
  }

  return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
}
