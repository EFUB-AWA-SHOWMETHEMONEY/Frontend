import type { Metadata } from 'next';
import { Jua } from 'next/font/google';
import '@/styles/globals.css';
import Providers from '@/app/providers';

const jua = Jua({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-jua-family',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MoaMoa',
  description: '가상 경제 교육 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={jua.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
