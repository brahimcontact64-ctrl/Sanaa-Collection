'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductCard from '@/components/ProductCard';
import { useSearchParams } from 'next/navigation';

export default function ProductsPage() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const categoryParam = searchParams.get('category');
      const filterParam = searchParams.get('filter');

      let productsQuery = query(collection(db, 'products'));

      if (categoryParam) {
        productsQuery = query(collection(db, 'products'), where('category', '==', categoryParam));
        setSelectedCategory(categoryParam);
      } else if (filterParam === 'new') {
        productsQuery = query(collection(db, 'products'), where('new', '==', true));
      } else if (filterParam === 'featured') {
        productsQuery = query(collection(db, 'products'), where('featured', '==', true));
      }

      const productsSnap = await getDocs(productsQuery);
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const categoriesQuery = query(
        collection(db, 'categories'),
        where('active', '==', true),
        orderBy('order')
      );
      const categoriesSnap = await getDocs(categoriesQuery);
      setCategories(categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      setLoading(false);
    };

    fetchData();
  }, [searchParams]);

  const handleCategoryFilter = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    let productsQuery = query(collection(db, 'products'));

    if (categoryId !== 'all') {
      productsQuery = query(collection(db, 'products'), where('category', '==', categoryId));
    }

    const productsSnap = await getDocs(productsQuery);
    setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-mocha text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mocha mb-6 sm:mb-8">{t('products')}</h1>

      <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
        <button
          onClick={() => handleCategoryFilter('all')}
          className={`px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base touch-manipulation ${
            selectedCategory === 'all'
              ? 'bg-rose text-white'
              : 'bg-white text-mocha border border-mocha hover:bg-beige'
          }`}
        >
          {t('all')}
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryFilter(category.id)}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base touch-manipulation ${
              selectedCategory === category.id
                ? 'bg-rose text-white'
                : 'bg-white text-mocha border border-mocha hover:bg-beige'
            }`}
          >
            {language === 'ar' ? category.nameAr : category.nameFr}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <p className="text-lg sm:text-xl text-mocha/60">
            {language === 'ar' ? 'لا توجد منتجات متاحة' : 'Aucun produit disponible'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
