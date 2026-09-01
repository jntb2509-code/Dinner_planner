import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DinnerPlans — מתכנן הארוחות המשפחתי',
  description: 'אוספים העדפות אוכל מכל המשתתפים, ומתכננים ארוחה שלכולם יש מה לאכול בה.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f6072',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
