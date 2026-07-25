import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', dbConnected: false, app: '코코베베 어린이집 연차 및 스케줄 관리' });
}
