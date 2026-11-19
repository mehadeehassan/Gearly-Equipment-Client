import { Footer } from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Providers } from '@/components/layout/Providers';
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Gearly — Equipment, ready when you are',
  description: 'Find, book and rent dependable equipment for your next project.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers />
        <Navbar />
        <main className="min-h-[65vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
