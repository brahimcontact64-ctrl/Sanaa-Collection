import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { algerianWilayas, algerianCommunes } from './algerianDeliveryData';

const sampleCategories = [
  { id: 'hijab-carre', nameAr: 'حجاب مربع', nameFr: 'Hijab Carré', order: 1 },
  { id: 'hijab-jersey', nameAr: 'حجاب جيرسي', nameFr: 'Hijab Jersey', order: 2 },
  { id: 'hijab-soie', nameAr: 'حجاب حرير', nameFr: 'Hijab Soie', order: 3 },
  { id: 'hijab-instant', nameAr: 'حجاب فوري', nameFr: 'Hijab Instant', order: 4 },
];

const sampleProducts = [
  {
    id: 'hijab-1',
    titleAr: 'حجاب حرير فاخر',
    titleFr: 'Hijab Soie Premium',
    descriptionAr: 'حجاب حرير عالي الجودة، ناعم ومريح للاستخدام اليومي',
    descriptionFr: 'Hijab en soie de haute qualité, doux et confortable pour un usage quotidien',
    category: 'hijab-soie',
    price: 1500,
    colors: [
      { name: 'Beige', images: ['https://images.pexels.com/photos/7945911/pexels-photo-7945911.jpeg', 'https://images.pexels.com/photos/7945874/pexels-photo-7945874.jpeg'] },
      { name: 'Rose', images: ['https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg'] },
      { name: 'Blanc', images: ['https://images.pexels.com/photos/7945874/pexels-photo-7945874.jpeg'] },
    ],
    stock: 50,
    featured: true,
    new: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hijab-2',
    titleAr: 'حجاب جيرسي كلاسيكي',
    titleFr: 'Hijab Jersey Classique',
    descriptionAr: 'حجاب جيرسي مرن وعملي، مثالي لجميع المناسبات',
    descriptionFr: 'Hijab jersey extensible et pratique, idéal pour toutes occasions',
    category: 'hijab-jersey',
    price: 800,
    colors: [
      { name: 'Rose', images: ['https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg'] },
      { name: 'Noir', images: ['https://images.pexels.com/photos/8110766/pexels-photo-8110766.jpeg'] },
      { name: 'Beige', images: ['https://images.pexels.com/photos/7945911/pexels-photo-7945911.jpeg'] },
    ],
    stock: 100,
    featured: true,
    new: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hijab-3',
    titleAr: 'حجاب مربع قطني',
    titleFr: 'Hijab Carré Coton',
    descriptionAr: 'حجاب قطني 100%، مريح وقابل للتنفس',
    descriptionFr: 'Hijab 100% coton, confortable et respirant',
    category: 'hijab-carre',
    price: 600,
    colors: [
      { name: 'Blanc', images: ['https://images.pexels.com/photos/7945874/pexels-photo-7945874.jpeg'] },
      { name: 'Noir', images: ['https://images.pexels.com/photos/8110766/pexels-photo-8110766.jpeg'] },
      { name: 'Gris', images: ['https://images.pexels.com/photos/9638696/pexels-photo-9638696.jpeg'] },
    ],
    stock: 75,
    featured: false,
    new: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hijab-4',
    titleAr: 'حجاب فوري',
    titleFr: 'Hijab Instant',
    descriptionAr: 'حجاب فوري سهل الارتداء، مثالي للنساء العاملات',
    descriptionFr: 'Hijab instant facile à porter, idéal pour les femmes actives',
    category: 'hijab-instant',
    price: 1200,
    colors: [
      { name: 'Marron', images: ['https://images.pexels.com/photos/7945911/pexels-photo-7945911.jpeg'] },
      { name: 'Beige', images: ['https://images.pexels.com/photos/7945874/pexels-photo-7945874.jpeg'] },
      { name: 'Noir', images: ['https://images.pexels.com/photos/8110766/pexels-photo-8110766.jpeg'] },
    ],
    stock: 60,
    featured: true,
    new: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hijab-5',
    titleAr: 'حجاب حرير لامع',
    titleFr: 'Hijab Soie Brillant',
    descriptionAr: 'حجاب حرير لامع للمناسبات الخاصة',
    descriptionFr: 'Hijab soie brillant pour occasions spéciales',
    category: 'hijab-soie',
    price: 2000,
    colors: [
      { name: 'Or', images: ['https://images.pexels.com/photos/9638696/pexels-photo-9638696.jpeg'] },
      { name: 'Argent', images: ['https://images.pexels.com/photos/7945874/pexels-photo-7945874.jpeg'] },
      { name: 'Champagne', images: ['https://images.pexels.com/photos/7945911/pexels-photo-7945911.jpeg'] },
    ],
    stock: 30,
    featured: false,
    new: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hijab-6',
    titleAr: 'حجاب جيرسي ناعم',
    titleFr: 'Hijab Jersey Doux',
    descriptionAr: 'حجاب جيرسي ناعم بتصميم عصري',
    descriptionFr: 'Hijab jersey doux au design moderne',
    category: 'hijab-jersey',
    price: 900,
    colors: [
      { name: 'Noir', images: ['https://images.pexels.com/photos/8110766/pexels-photo-8110766.jpeg'] },
      { name: 'Bleu marine', images: ['https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg'] },
      { name: 'Bordeaux', images: ['https://images.pexels.com/photos/7945911/pexels-photo-7945911.jpeg'] },
    ],
    stock: 80,
    featured: false,
    new: false,
    createdAt: new Date().toISOString(),
  },
];


const defaultSettings = {
  id: 'main',
  logoUrl: '',
  showLogo: false,
  logoSize: 100,
  siteName: 'Sanaa Collection',
  socialLinks: {
    instagram: { url: '', enabled: false },
    facebook: { url: '', enabled: false },
    tiktok: { url: '', enabled: false },
    whatsapp: { url: '', enabled: false },
    snapchat: { url: '', enabled: false },
  },
  contactPhone: '+213',
  contactEmail: '',
  invoice: {
    storeName: 'Sanaa Collection',
    businessName: '',
    nif: '',
    nis: '',
    rc: '',
    address: '',
    wilaya: '',
    phone: '',
    email: '',
    footerNote: 'Merci pour votre confiance',
  },
  hero: {
    enabled: true,
    titleFr: 'Sanaa Collection',
    titleAr: 'مجموعة سناء',
    subtitleFr: 'Hijabs élégants et modernes pour chaque femme',
    subtitleAr: 'حجاب أنيق وعصري لكل امرأة',
    mediaType: 'gradient',
    mediaUrls: [],
    showButton: false,
    buttonTextFr: 'Découvrir',
    buttonTextAr: 'اكتشف',
    buttonLink: '/products',
    overlay: true,
    textColor: '#2c1810',
  },
  createdAt: new Date().toISOString(),
};

export async function initializeFirestore() {
  if (typeof window === 'undefined') {
    console.log('⚠️ Skipping Firestore initialization during build');
    return { success: false, message: 'Build-time skip' };
  }

  try {
    const settingsRef = doc(db, 'settings', 'main');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, defaultSettings);
      console.log('✓ Settings created');
    }

    const categoriesSnap = await getDocs(collection(db, 'categories'));
    if (categoriesSnap.empty) {
      const batch1 = writeBatch(db);
      for (const category of sampleCategories) {
        batch1.set(doc(db, 'categories', category.id), category);
      }
      await batch1.commit();
      console.log('✓ Categories seeded');
    }

    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      const batch2 = writeBatch(db);
      for (const product of sampleProducts) {
        batch2.set(doc(db, 'products', product.id), product);
      }
      await batch2.commit();
      console.log('✓ Products seeded');
    }

    const wilayasSnap = await getDocs(collection(db, 'wilayas'));
    if (wilayasSnap.empty) {
      const batch3 = writeBatch(db);
      for (const wilaya of algerianWilayas) {
        batch3.set(doc(db, 'wilayas', wilaya.code), wilaya);
      }
      await batch3.commit();
      console.log(`✓ Wilayas seeded (${algerianWilayas.length} wilayas)`);
    } else {
      const existingWilaya = wilayasSnap.docs[0].data();
      if (existingWilaya.delivery && !existingWilaya.delivery_price) {
        console.log('⚙️ Migrating wilayas to new pricing structure...');
        const batch3 = writeBatch(db);
        for (const wilaya of algerianWilayas) {
          batch3.set(doc(db, 'wilayas', wilaya.code), wilaya, { merge: false });
        }
        await batch3.commit();
        console.log(`✓ Wilayas migrated (${algerianWilayas.length} wilayas)`);
      }
    }

    const communesSnap = await getDocs(collection(db, 'communes'));
    if (communesSnap.empty) {
      let batch4 = writeBatch(db);
      let count = 0;
      for (let i = 0; i < algerianCommunes.length; i++) {
        const commune = algerianCommunes[i];
        const communeId = `${commune.wilayaCode}_${i}`;
        batch4.set(doc(db, 'communes', communeId), commune);
        count++;

        if (count === 500) {
          await batch4.commit();
          batch4 = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch4.commit();
      }
      console.log(`✓ Communes seeded (${algerianCommunes.length} communes)`);
    }

    console.log('✅ Database initialization complete');
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    return { success: false, message: 'Failed to initialize database', error };
  }
}
