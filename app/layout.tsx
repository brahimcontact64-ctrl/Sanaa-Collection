import './globals.css';
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const cairo = Cairo({ subsets: ['latin', 'arabic'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: 'Sanaa Collection - Hijabs Premium',
  description: 'Découvrez notre collection de hijabs élégants et de qualité supérieure',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={cairo.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-beige min-h-screen">
        <LanguageProvider>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
