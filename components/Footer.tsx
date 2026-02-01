'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Instagram, Facebook, Send, MessageCircle, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Footer() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, []);

  const socialIcons: any = {
    instagram: Instagram,
    facebook: Facebook,
    tiktok: Send,
    whatsapp: MessageCircle,
    snapchat: Camera,
  };

  return (
    <footer className="bg-mocha text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-gold">{settings?.siteName || 'Sanaa Collection'}</h3>
            <p className="text-beige">
              {t('welcome')} {settings?.siteName || 'Sanaa Collection'}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-gold">{t('contact')}</h3>
            <p className="text-beige">{settings?.contactPhone}</p>
            {settings?.contactEmail && <p className="text-beige">{settings.contactEmail}</p>}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-gold">{t('followUs')}</h3>
            <div className="flex gap-4">
              {settings?.socialLinks &&
                Object.entries(settings.socialLinks).map(([platform, data]: [string, any]) => {
                  if (!data.enabled || !data.url) return null;
                  const Icon = socialIcons[platform];
                  return (
                    <a
                      key={platform}
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-rose rounded-full flex items-center justify-center hover:bg-gold transition"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="border-t border-rose/20 mt-8 pt-8 text-center text-beige">
          <p>© {new Date().getFullYear()} {settings?.siteName || 'Sanaa Collection'}. {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}
