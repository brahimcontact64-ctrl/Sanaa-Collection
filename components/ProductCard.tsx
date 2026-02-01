'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: {
    id: string;
    titleAr: string;
    titleFr: string;
    price: number;
    colors?: Array<{
      name: string;
      images: string[];
    }>;
    images?: string[];
    stock: number;
    new?: boolean;
    featured?: boolean;
  };
}

function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();

  const displayImage = product.colors?.[0]?.images?.[0] || product.images?.[0] || '/placeholder.jpg';

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-beige">
          <Image
            src={displayImage}
            alt={language === 'ar' ? product.titleAr : product.titleFr}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain"
            loading="lazy"
            quality={100}
          />
          {product.new && (
            <Badge className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-gold text-white text-[10px] sm:text-xs">
              {t('newArrivals')}
            </Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-rose text-white text-[10px] sm:text-xs">
              {t('featured')}
            </Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">{t('outOfStock')}</span>
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-mocha mb-1 sm:mb-2 line-clamp-2 text-sm sm:text-base">
            {language === 'ar' ? product.titleAr : product.titleFr}
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-base sm:text-xl font-bold text-rose">{product.price} DA</span>
            {product.stock > 0 && (
              <span className="text-xs sm:text-sm text-green-600">{t('inStock')}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(ProductCard);
