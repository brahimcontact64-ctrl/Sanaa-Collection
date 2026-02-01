'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, where, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { initializeFirestore } from '@/lib/autoseed';
import ProductCard from '@/components/ProductCard';
import Hero from '@/components/Hero';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<{ [key: string]: any[] }>({});
  const [heroSettings, setHeroSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAndFetch = async () => {
      await initializeFirestore();

      const settingsRef = doc(db, 'settings', 'main');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setHeroSettings(data.hero || null);
      }

      const categoriesQuery = query(
        collection(db, 'categories'),
        orderBy('order')
      );
      const categoriesSnap = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);

      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      const grouped: { [key: string]: any[] } = {};
      categoriesData.forEach(category => {
        grouped[category.id] = productsData.filter(
          (product: any) => product.category === category.id
        );
      });
      setProductsByCategory(grouped);

      setLoading(false);
    };

    initAndFetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-mocha text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      {heroSettings && <Hero settings={heroSettings} />}

      {categories.map(category => {
        const categoryProducts = productsByCategory[category.id] || [];
        if (categoryProducts.length === 0) return null;

        return (
          <section
            key={category.id}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10"
          >
            <div className="mb-4 sm:mb-6">
              <h2
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-mocha"
                style={{ fontFamily: language === 'ar' ? 'Cairo, sans-serif' : 'Poppins, sans-serif' }}
              >
                {language === 'ar' ? category.nameAr : category.nameFr}
              </h2>
              <div className="h-1 w-20 bg-rose mt-2"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {categoryProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}

      {categories.every(cat => !productsByCategory[cat.id]?.length) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-mocha/60 text-lg">
            {language === 'ar' ? 'لا توجد منتجات متاحة حالياً' : 'Aucun produit disponible pour le moment'}
          </p>
        </section>
      )}
    </div>
  );
}
