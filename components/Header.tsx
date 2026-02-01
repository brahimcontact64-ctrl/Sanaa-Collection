'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingBag, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            {settings?.showLogo && settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                style={{
                  height: 'auto',
                  maxHeight: `${((settings.logoSize || 100) / 100) * 64}px`,
                  width: 'auto',
                  maxWidth: '200px'
                }}
                className="object-contain transition-all duration-300"
              />
            ) : (
              <span className="text-2xl font-bold text-mocha" style={{ fontFamily: language === 'ar' ? 'Cairo, sans-serif' : 'Poppins, sans-serif' }}>
                {settings?.siteName || 'Sanaa Collection'}
              </span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-mocha hover:text-rose transition">
              {t('home')}
            </Link>
            <Link href="/products" className="text-mocha hover:text-rose transition">
              {t('products')}
            </Link>
            <Link href="/products" className="text-mocha hover:text-rose transition">
              {t('categories')}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium touch-manipulation ${language === 'fr' ? 'bg-rose text-white' : 'bg-beige text-mocha'}`}
              >
                FR
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium touch-manipulation ${language === 'ar' ? 'bg-rose text-white' : 'bg-beige text-mocha'}`}
              >
                AR
              </button>
            </div>

            <button className="md:hidden p-1 touch-manipulation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-6 h-6 text-mocha" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 text-mocha hover:text-rose">
              {t('home')}
            </Link>
            <Link href="/products" className="block py-2 text-mocha hover:text-rose">
              {t('products')}
            </Link>
            <Link href="/products" className="block py-2 text-mocha hover:text-rose">
              {t('categories')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
