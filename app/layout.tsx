import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '코코베베 어린이집 연차 관리',
  description: '연차, 승인, 스케줄 관리',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
