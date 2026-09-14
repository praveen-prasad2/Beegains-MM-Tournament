import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import Nav from '@/components/Nav';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mini Militia — Season 2',
  description: 'Tournament manager for the Mini Militia Season 2 8-team league.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased">
        <Nav />
        <main className="mx-auto max-w-3xl px-4 py-5 pb-16">{children}</main>
        <footer className="pb-10 text-center text-xs text-muted">
          Mini Militia — Season 2 Tournament Manager
        </footer>
      </body>
    </html>
  );
}
