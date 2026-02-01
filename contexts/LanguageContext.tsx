'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ar: {
    home: 'الرئيسية',
    products: 'المنتجات',
    categories: 'الفئات',
    cart: 'السلة',
    admin: 'لوحة التحكم',
    search: 'بحث...',
    welcome: 'مرحبا بك في',
    newArrivals: 'وصل حديثاً',
    bestSellers: 'الأكثر مبيعاً',
    featured: 'مميز',
    shopNow: 'تسوق الآن',
    viewAll: 'عرض الكل',
    addToCart: 'أضف للسلة',
    orderNow: 'اطلب الآن',
    price: 'السعر',
    colors: 'الألوان',
    stock: 'المخزون',
    inStock: 'متوفر',
    outOfStock: 'نفذ من المخزون',
    quantity: 'الكمية',
    total: 'المجموع',
    delivery: 'التوصيل',
    orderForm: 'نموذج الطلب',
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    wilaya: 'الولاية',
    address: 'العنوان',
    notes: 'ملاحظات (اختياري)',
    submitOrder: 'اضغط هنا للطلب',
    orderSuccess: 'تم إرسال طلبك بنجاح!',
    orderSuccessMsg: 'سنتواصل معك قريباً لتأكيد الطلب',
    aboutUs: 'من نحن',
    contact: 'اتصل بنا',
    followUs: 'تابعنا',
    allRightsReserved: 'جميع الحقوق محفوظة',
    filter: 'تصفية',
    all: 'الكل',
    description: 'الوصف',
  },
  fr: {
    home: 'Accueil',
    products: 'Produits',
    categories: 'Catégories',
    cart: 'Panier',
    admin: 'Admin',
    search: 'Rechercher...',
    welcome: 'Bienvenue chez',
    newArrivals: 'Nouveautés',
    bestSellers: 'Meilleures Ventes',
    featured: 'En Vedette',
    shopNow: 'Acheter maintenant',
    viewAll: 'Voir tout',
    addToCart: 'Ajouter au panier',
    orderNow: 'Commander maintenant',
    price: 'Prix',
    colors: 'Couleurs',
    stock: 'Stock',
    inStock: 'En stock',
    outOfStock: 'Rupture de stock',
    quantity: 'Quantité',
    total: 'Total',
    delivery: 'Livraison',
    orderForm: 'Formulaire de commande',
    fullName: 'Nom complet',
    phone: 'Téléphone',
    wilaya: 'Wilaya',
    address: 'Adresse',
    notes: 'Notes (optionnel)',
    submitOrder: 'Envoyer la commande',
    orderSuccess: 'Votre commande a été envoyée avec succès!',
    orderSuccessMsg: 'Nous vous contactons bientôt pour confirmer',
    aboutUs: 'À propos',
    contact: 'Contact',
    followUs: 'Suivez-nous',
    allRightsReserved: 'Tous droits réservés',
    filter: 'Filtrer',
    all: 'Tout',
    description: 'Description',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'ar' || saved === 'fr')) {
      setLanguage(saved);
    }
    document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = saved || 'fr';
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.ar] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
