'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { initializeFirestore } from '@/lib/autoseed';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProductDetailPage() {
  const { language, t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    wilaya: '',
    commune: '',
    deliveryType: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    const fetchProduct = async () => {
      await initializeFirestore();

      const productDoc = await getDoc(doc(db, 'products', params.id as string));
      if (productDoc.exists()) {
        const productData: any = { id: productDoc.id, ...productDoc.data() };
        setProduct(productData);
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0]);
        }
      }

      const wilayasQuery = query(collection(db, 'wilayas'), orderBy('code', 'asc'));
      const wilayasSnap = await getDocs(wilayasQuery);
      setDeliveryZones(wilayasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const communesSnap = await getDocs(collection(db, 'communes'));
      setCommunes(communesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      setLoading(false);
    };

    fetchProduct();
  }, [params.id]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedColor || !selectedColor.name) {
      alert(language === 'ar' ? 'يرجى اختيار اللون' : 'Veuillez sélectionner une couleur');
      return;
    }

    if (!formData.commune) {
      alert(language === 'ar' ? 'يرجى اختيار البلدية' : 'Veuillez sélectionner une commune');
      return;
    }

    if (!formData.deliveryType) {
      alert(language === 'ar' ? 'يرجى اختيار نوع التوصيل' : 'Veuillez sélectionner le type de livraison');
      return;
    }

    const selectedZone = deliveryZones.find(z => z.code === formData.wilaya);
    if (!selectedZone) {
      alert(language === 'ar' ? 'خطأ في بيانات الولاية' : 'Erreur de données wilaya');
      return;
    }

    const deliveryPrice = formData.deliveryType === 'bureau'
      ? selectedZone.stopdesk_price || 0
      : selectedZone.delivery_price || 0;
    const totalPrice = product.price * quantity + deliveryPrice;

    const selectedCommuneObj = communes.find(
      (c: any) => c.name === formData.commune && c.wilayaCode === formData.wilaya
    );

    const order = {
      fullName: formData.fullName,
      phone: formData.phone,
      address: formData.address,
      wilaya: formData.wilaya,
      wilayaCode: selectedZone.code,
      wilayaName: selectedZone.name,
      commune: formData.commune,
      communeName: selectedCommuneObj?.name || formData.commune,
      deliveryType: formData.deliveryType,
      deliveryTypeLabel: formData.deliveryType === 'bureau'
        ? (language === 'ar' ? 'التوصيل إلى المكتب' : 'Livraison au bureau')
        : (language === 'ar' ? 'التوصيل إلى المنزل' : 'Livraison à domicile'),
      notes: formData.notes || '',
      product: {
        id: product.id,
        titleAr: product.titleAr,
        titleFr: product.titleFr,
        price: product.price,
        images: selectedColor.images || [],
      },
      quantity,
      selectedColor: {
        name: selectedColor.name,
        image: selectedColor.images?.[0] || '',
      },
      deliveryPrice,
      totalPrice,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          updatedBy: 'customer',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'orders'), order);
      setOrderSuccess(true);

      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error creating order:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إنشاء الطلب' : 'Erreur lors de la création de la commande');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-mocha text-xl">Chargement...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-mocha text-xl">
          {language === 'ar' ? 'المنتج غير موجود' : 'Produit non trouvé'}
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-mocha mb-2">{t('orderSuccess')}</h2>
          <p className="text-mocha/70">{t('orderSuccessMsg')}</p>
        </div>
      </div>
    );
  }

  const selectedZone = deliveryZones.find(z => z.code === formData.wilaya);
  const deliveryPrice = !formData.deliveryType
    ? 0
    : formData.deliveryType === 'bureau'
    ? selectedZone?.stopdesk_price || 0
    : selectedZone?.delivery_price || 0;
  const totalPrice = product.price * quantity + deliveryPrice;
  const availableCommunes = communes.filter(c => c.wilayaCode === formData.wilaya);

  const currentImages = selectedColor?.images || [];
  const currentImage = currentImages[currentImageIndex] || '/placeholder.jpg';

  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mb-8 lg:mb-12">
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden bg-beige mb-4">
            {product.videoUrl ? (
              <div className="relative w-full h-full">
                <video
                  src={product.videoUrl}
                  controls
                  playsInline
                  muted
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
                {product.new && (
                  <Badge className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gold text-white text-xs sm:text-sm z-10">
                    {t('newArrivals')}
                  </Badge>
                )}
              </div>
            ) : (
              <div
                className="relative cursor-pointer group w-full h-full"
                onClick={() => openLightbox(currentImage)}
              >
                <Image
                  src={currentImage}
                  alt={language === 'ar' ? product.titleAr : product.titleFr}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority
                  quality={100}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                    <svg className="w-6 h-6 text-mocha" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
                {product.new && (
                  <Badge className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gold text-white text-xs sm:text-sm">
                    {t('newArrivals')}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {currentImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {currentImages.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                    currentImageIndex === index
                      ? 'border-rose scale-105'
                      : 'border-gray-200 hover:border-rose/50'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.titleFr} ${index + 1}`}
                    fill
                    sizes="20vw"
                    className="object-contain"
                    loading="lazy"
                    quality={100}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-mocha mb-3 sm:mb-4">
            {language === 'ar' ? product.titleAr : product.titleFr}
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-rose mb-4 sm:mb-6">{product.price} DA</p>
          <p className="text-mocha/80 mb-4 sm:mb-6 text-sm sm:text-base">
            {language === 'ar' ? product.descriptionAr : product.descriptionFr}
          </p>

          <div className="space-y-4 sm:space-y-6 mb-6">
            <div>
              <Label className="text-sm sm:text-base font-semibold">{t('colors')}</Label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
                {product.colors?.map((color: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedColor(color);
                      setCurrentImageIndex(0);
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 touch-manipulation transition-all ${
                      selectedColor?.name === color.name
                        ? 'border-rose shadow-lg scale-105'
                        : 'border-gray-200 hover:border-rose/50'
                    }`}
                  >
                    <Image
                      src={color.images?.[0] || '/placeholder.jpg'}
                      alt={color.name}
                      fill
                      sizes="(max-width: 640px) 33vw, 20vw"
                      className="object-contain"
                      loading="lazy"
                      quality={100}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs sm:text-sm font-medium text-center">
                        {color.name}
                      </p>
                    </div>
                    {selectedColor?.name === color.name && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-rose rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm sm:text-base">{t('quantity')}</Label>
              <div className="flex items-center gap-3 sm:gap-4 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 sm:h-12 sm:w-12 touch-manipulation"
                >
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <span className="text-xl sm:text-2xl font-semibold w-12 sm:w-16 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="h-10 w-10 sm:h-12 sm:w-12 touch-manipulation"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            <div>
              <span
                className={`text-sm sm:text-base ${
                  product.stock > 0 ? 'text-green-600' : 'text-red-600'
                } font-semibold`}
              >
                {product.stock > 0 ? `${t('inStock')} (${product.stock})` : t('outOfStock')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold text-mocha mb-4 sm:mb-6">{t('orderForm')}</h2>
        <form onSubmit={handleSubmitOrder} className="space-y-4">
          <div>
            <Label htmlFor="fullName">{t('fullName')} *</Label>
            <Input
              id="fullName"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">{t('phone')} *</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="wilaya">{language === 'ar' ? 'الولاية' : 'Wilaya'} *</Label>
            <Select
              required
              value={formData.wilaya}
              onValueChange={(value) =>
                setFormData({ ...formData, wilaya: value, commune: '', deliveryType: '' })
              }
            >
              <SelectTrigger className="text-sm sm:text-base h-12">
                <SelectValue placeholder={language === 'ar' ? 'اختر الولاية' : 'Sélectionner la wilaya'} />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {deliveryZones.map(zone => (
                  <SelectItem key={zone.code} value={zone.code} className="text-sm py-3">
                    {zone.code}. {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="commune">{language === 'ar' ? 'البلدية' : 'Commune'} *</Label>
            <Select
              required
              value={formData.commune}
              onValueChange={(value) => setFormData({ ...formData, commune: value })}
              disabled={!formData.wilaya}
            >
              <SelectTrigger className="text-sm sm:text-base h-12">
                <SelectValue
                  placeholder={
                    language === 'ar'
                      ? formData.wilaya
                        ? 'اختر البلدية'
                        : 'اختر الولاية أولا'
                      : formData.wilaya
                      ? 'Sélectionner la commune'
                      : 'Choisir wilaya d\'abord'
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {availableCommunes.map((commune: any, index: number) => (
                  <SelectItem key={index} value={commune.name} className="text-sm py-3">
                    {commune.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{language === 'ar' ? 'نوع التوصيل' : 'Type de livraison'} *</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryType: 'bureau' })}
                disabled={!formData.wilaya}
                className={`p-4 rounded-lg border-2 transition-all touch-manipulation ${
                  formData.deliveryType === 'bureau'
                    ? 'border-rose bg-rose/5'
                    : 'border-gray-200 hover:border-rose/50'
                } ${!formData.wilaya ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <p className="font-semibold text-sm sm:text-base mb-1">
                    {language === 'ar' ? 'التوصيل إلى المكتب' : 'Bureau'}
                  </p>
                  {selectedZone && (
                    <p className="text-rose font-bold text-lg">{selectedZone.stopdesk_price || 0} DA</p>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryType: 'domicile' })}
                disabled={!formData.wilaya}
                className={`p-4 rounded-lg border-2 transition-all touch-manipulation ${
                  formData.deliveryType === 'domicile'
                    ? 'border-rose bg-rose/5'
                    : 'border-gray-200 hover:border-rose/50'
                } ${!formData.wilaya ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <p className="font-semibold text-sm sm:text-base mb-1">
                    {language === 'ar' ? 'التوصيل إلى المنزل' : 'Domicile'}
                  </p>
                  {selectedZone && (
                    <p className="text-rose font-bold text-lg">{selectedZone.delivery_price || 0} DA</p>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="address">{t('address')} *</Label>
            <Textarea
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="bg-beige p-4 rounded-lg space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span>{t('price')}:</span>
              <span className="font-semibold">{product.price * quantity} DA</span>
            </div>
            <div className="flex justify-between">
              <span>{t('delivery')}:</span>
              <span className="font-semibold">{deliveryPrice} DA</span>
            </div>
            <div className="flex justify-between text-base sm:text-lg font-bold text-mocha border-t border-mocha/20 pt-2">
              <span>{t('total')}:</span>
              <span className="text-rose">{totalPrice} DA</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-rose hover:bg-mocha text-white py-5 sm:py-6 text-base sm:text-lg touch-manipulation"
            disabled={product.stock === 0}
          >
            {t('submitOrder')}
          </Button>
        </form>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2 touch-manipulation"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Fullscreen view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
