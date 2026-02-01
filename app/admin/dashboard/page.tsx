'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plus, CreditCard as Edit, Trash2, Upload, Eye, Download, Share2 } from 'lucide-react';
import { downloadInvoice } from '@/lib/pdfGenerator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ColorManager from '@/components/ColorManager';
import HeroManager from '@/components/HeroManager';
import { initializeFirestore } from '@/lib/autoseed';

export default function AdminDashboard() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [productColors, setProductColors] = useState<any[]>([]);
  const [productVideoUrl, setProductVideoUrl] = useState<string>('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (user) {
      initAndFetch();
    }
  }, [user]);

  const initAndFetch = async () => {
    await initializeFirestore();
    await fetchAllData();
  };

  const fetchAllData = async () => {
    const productsSnap = await getDocs(collection(db, 'products'));
    setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const ordersSnap = await getDocs(ordersQuery);
    setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const categoriesSnap = await getDocs(collection(db, 'categories'));
    setCategories(categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const wilayasQuery = query(collection(db, 'wilayas'), orderBy('code', 'asc'));
    const wilayasSnap = await getDocs(wilayasQuery);
    setDeliveryZones(wilayasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const settingsRef = doc(db, 'settings', 'main');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      setSettings({ id: settingsSnap.id, ...settingsSnap.data() });
    } else {
      setSettings(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Veuillez sélectionner un fichier vidéo valide (mp4, webm)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('La vidéo est trop volumineuse. Taille maximale: 50MB');
      return;
    }

    setUploadingVideo(true);
    try {
      const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const videoUrl = await getDownloadURL(storageRef);
      setProductVideoUrl(videoUrl);
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Erreur lors du téléchargement de la vidéo');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    setProductVideoUrl('');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    if (productColors.length === 0) {
      alert('Veuillez ajouter au moins une couleur avec des images');
      return;
    }

    const hasEmptyColor = productColors.some(c => !c.name || c.images.length === 0);
    if (hasEmptyColor) {
      alert('Toutes les couleurs doivent avoir un nom et au moins une image');
      return;
    }

    const productData = {
      titleAr: formData.get('titleAr'),
      titleFr: formData.get('titleFr'),
      descriptionAr: formData.get('descriptionAr'),
      descriptionFr: formData.get('descriptionFr'),
      category: formData.get('category'),
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      colors: productColors,
      videoUrl: productVideoUrl || '',
      featured: formData.get('featured') === 'true',
      new: formData.get('new') === 'true',
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    if (editingProduct) {
      await updateDoc(doc(db, 'products', editingProduct.id), productData);
    } else {
      await addDoc(collection(db, 'products'), productData);
    }

    setIsProductDialogOpen(false);
    setEditingProduct(null);
    setProductColors([]);
    setProductVideoUrl('');
    fetchAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
      await deleteDoc(doc(db, 'products', id));
      fetchAllData();
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    const statusHistory = order?.statusHistory || [];

    statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy: user?.email || 'admin',
    });

    await updateDoc(doc(db, 'orders', orderId), {
      status: newStatus,
      statusHistory,
      lastUpdated: new Date().toISOString(),
    });
    fetchAllData();
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const categoryData = {
      nameAr: formData.get('nameAr'),
      nameFr: formData.get('nameFr'),
      active: formData.get('active') === 'on',
      order: editingCategory?.order || categories.length,
      createdAt: editingCategory?.createdAt || new Date().toISOString(),
    };

    if (editingCategory) {
      await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
    } else {
      await addDoc(collection(db, 'categories'), categoryData);
    }

    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
    fetchAllData();
  };

  const handleDeleteCategory = async (id: string) => {
    const productsInCategory = products.filter(p => p.category === id);
    if (productsInCategory.length > 0) {
      alert(
        `Impossible de supprimer cette catégorie. ${productsInCategory.length} produit(s) l'utilisent.`
      );
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie?')) {
      await deleteDoc(doc(db, 'categories', id));
      fetchAllData();
    }
  };

  const handleSaveDeliveryZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const zoneData = {
      delivery_price: Number(formData.get('deliveryPrice')),
      stopdesk_price: Number(formData.get('stopdeskPrice')),
      delay_days: Number(formData.get('delayDays')),
      updatedAt: new Date().toISOString(),
    };

    if (editingZone) {
      await updateDoc(doc(db, 'wilayas', editingZone.id), zoneData);
    }

    setIsZoneDialogOpen(false);
    setEditingZone(null);
    fetchAllData();
  };

  const handleToggleCategoryActive = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'categories', id), { active: !currentStatus });
    fetchAllData();
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const socialLinks: any = {};
    ['instagram', 'facebook', 'tiktok', 'whatsapp', 'snapchat'].forEach(platform => {
      socialLinks[platform] = {
        url: formData.get(`${platform}_url`) || '',
        enabled: formData.get(`${platform}_enabled`) === 'on',
      };
    });

    const settingsData = {
      siteName: formData.get('siteName'),
      contactPhone: formData.get('contactPhone'),
      contactEmail: formData.get('contactEmail'),
      showLogo: formData.get('showLogo') === 'on',
      logoUrl: settings?.logoUrl || '',
      socialLinks,
    };

    const settingsRef = doc(db, 'settings', 'main');
    await setDoc(settingsRef, settingsData, { merge: true });
    fetchAllData();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const logoUrl = await getDownloadURL(storageRef);

    const settingsRef = doc(db, 'settings', 'main');
    await setDoc(settingsRef, { logoUrl, showLogo: true }, { merge: true });
    fetchAllData();
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer le logo?')) return;

    const settingsRef = doc(db, 'settings', 'main');
    await setDoc(settingsRef, { logoUrl: '', showLogo: false }, { merge: true });
    fetchAllData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-mocha">Admin Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="delivery">Livraison</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestion des produits</CardTitle>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingProduct(null);
                        setProductColors([]);
                        setProductVideoUrl('');
                        setIsProductDialogOpen(true);
                      }}
                      className="bg-rose hover:bg-mocha"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau produit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Titre (AR)</Label>
                          <Input
                            name="titleAr"
                            required
                            defaultValue={editingProduct?.titleAr}
                          />
                        </div>
                        <div>
                          <Label>Titre (FR)</Label>
                          <Input
                            name="titleFr"
                            required
                            defaultValue={editingProduct?.titleFr}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Description (AR)</Label>
                          <Textarea
                            name="descriptionAr"
                            required
                            defaultValue={editingProduct?.descriptionAr}
                          />
                        </div>
                        <div>
                          <Label>Description (FR)</Label>
                          <Textarea
                            name="descriptionFr"
                            required
                            defaultValue={editingProduct?.descriptionFr}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Catégorie</Label>
                          <Select name="category" defaultValue={editingProduct?.category} required>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.nameFr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Prix (DA)</Label>
                          <Input
                            name="price"
                            type="number"
                            required
                            defaultValue={editingProduct?.price}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Stock</Label>
                        <Input
                          name="stock"
                          type="number"
                          required
                          defaultValue={editingProduct?.stock}
                        />
                      </div>

                      <ColorManager
                        colors={productColors}
                        onChange={setProductColors}
                      />

                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Vidéo du produit (optionnel)</Label>
                        {productVideoUrl ? (
                          <div className="space-y-3">
                            <video
                              src={productVideoUrl}
                              controls
                              className="w-full max-h-64 rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleRemoveVideo}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer la vidéo
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Input
                              type="file"
                              accept="video/mp4,video/webm"
                              onChange={handleVideoUpload}
                              disabled={uploadingVideo}
                              className="cursor-pointer"
                            />
                            {uploadingVideo && (
                              <p className="text-sm text-gray-500 mt-2">Téléchargement en cours...</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Formats acceptés: MP4, WebM. Taille max: 50MB
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="featured"
                            id="featured"
                            value="true"
                            defaultChecked={editingProduct?.featured}
                          />
                          <Label htmlFor="featured">Produit vedette</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="new"
                            id="new"
                            value="true"
                            defaultChecked={editingProduct?.new}
                          />
                          <Label htmlFor="new">Nouveau produit</Label>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-rose hover:bg-mocha">
                        Enregistrer
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img
                            src={product.colors?.[0]?.images?.[0] || product.images?.[0] || '/placeholder.jpg'}
                            alt={product.titleFr}
                            className="w-12 h-12 object-contain rounded bg-gray-50"
                          />
                        </TableCell>
                        <TableCell>{product.titleFr}</TableCell>
                        <TableCell>{product.price} DA</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProduct(product);
                              setProductColors(product.colors || []);
                              setProductVideoUrl(product.videoUrl || '');
                              setIsProductDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestion des catégories</CardTitle>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingCategory(null);
                        setIsCategoryDialogOpen(true);
                      }}
                      className="bg-rose hover:bg-mocha"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle catégorie
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveCategory} className="space-y-4">
                      <div>
                        <Label>Nom (Arabe)</Label>
                        <Input
                          name="nameAr"
                          required
                          defaultValue={editingCategory?.nameAr}
                          placeholder="موديل 1"
                        />
                      </div>
                      <div>
                        <Label>Nom (Français)</Label>
                        <Input
                          name="nameFr"
                          required
                          defaultValue={editingCategory?.nameFr}
                          placeholder="Modèle 1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="active"
                          id="active"
                          defaultChecked={editingCategory?.active ?? true}
                        />
                        <Label htmlFor="active">Catégorie active</Label>
                      </div>
                      <Button type="submit" className="w-full bg-rose hover:bg-mocha">
                        Enregistrer
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom (AR)</TableHead>
                      <TableHead>Nom (FR)</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Produits</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => {
                      const productCount = products.filter(p => p.category === category.id).length;
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.nameAr}</TableCell>
                          <TableCell>{category.nameFr}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                category.active
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-gray-400 hover:bg-gray-500'
                              }
                            >
                              {category.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{productCount} produit(s)</TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCategory(category);
                                setIsCategoryDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={category.active ? 'secondary' : 'default'}
                              onClick={() =>
                                handleToggleCategoryActive(category.id, category.active)
                              }
                              className={
                                category.active ? '' : 'bg-green-500 hover:bg-green-600'
                              }
                            >
                              {category.active ? 'Désactiver' : 'Activer'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {categories.length === 0 && (
                  <div className="text-center py-8 text-mocha/60">
                    Aucune catégorie. Créez-en une pour commencer.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Gestion des commandes</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={statusFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('all')}
                      className="text-xs"
                    >
                      Tous ({orders.length})
                    </Button>
                    {[
                      { value: 'pending', label: 'تم الطلب', color: 'bg-yellow-500' },
                      { value: 'preparing', label: 'قيد التحضير', color: 'bg-blue-500' },
                      { value: 'shipping', label: 'راهـي في الطريق', color: 'bg-purple-500' },
                      { value: 'delivered', label: 'وصلت', color: 'bg-green-500' },
                      { value: 'completed', label: 'أخذها الزبون', color: 'bg-teal-500' },
                      { value: 'cancelled', label: 'ملغاة', color: 'bg-red-500' },
                    ].map(s => (
                      <Button
                        key={s.value}
                        size="sm"
                        variant={statusFilter === s.value ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(s.value)}
                        className="text-xs"
                      >
                        {s.label} ({orders.filter(o => o.status === s.value).length})
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Wilaya</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders
                        .filter(order => statusFilter === 'all' || order.status === statusFilter)
                        .map(order => {
                          const statusConfig = {
                            pending: { label: 'تم الطلب', color: 'bg-yellow-500' },
                            preparing: { label: 'قيد التحضير', color: 'bg-blue-500' },
                            shipping: { label: 'راهـي في الطريق', color: 'bg-purple-500' },
                            delivered: { label: 'وصلت', color: 'bg-green-500' },
                            completed: { label: 'أخذها الزبون', color: 'bg-teal-500' },
                            cancelled: { label: 'ملغاة', color: 'bg-red-500' },
                          };
                          const status = statusConfig[order.status as keyof typeof statusConfig] || {
                            label: order.status,
                            color: 'bg-gray-500',
                          };

                          return (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-sm">
                                #{order.id.substring(0, 8)}
                              </TableCell>
                              <TableCell>{order.fullName}</TableCell>
                              <TableCell>{order.phone}</TableCell>
                              <TableCell>{order.wilaya}</TableCell>
                              <TableCell className="font-semibold">{order.totalPrice} DA</TableCell>
                              <TableCell>
                                <Badge className={`${status.color} text-white`}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setViewingOrder(order);
                                      setIsOrderDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Select
                                    value={order.status}
                                    onValueChange={value => handleUpdateOrderStatus(order.id, value)}
                                  >
                                    <SelectTrigger className="w-36 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">تم الطلب</SelectItem>
                                      <SelectItem value="preparing">قيد التحضير</SelectItem>
                                      <SelectItem value="shipping">راهـي في الطريق</SelectItem>
                                      <SelectItem value="delivered">وصلت</SelectItem>
                                      <SelectItem value="completed">أخذها الزبون</SelectItem>
                                      <SelectItem value="cancelled">ملغاة</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                  {orders.filter(order => statusFilter === 'all' || order.status === statusFilter)
                    .length === 0 && (
                    <div className="text-center py-8 text-mocha/60">
                      Aucune commande trouvée
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Détails de la commande #{viewingOrder?.id.substring(0, 8)}</DialogTitle>
                </DialogHeader>
                {viewingOrder && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Informations client</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Nom:</span> {viewingOrder.fullName}
                          </p>
                          <p>
                            <span className="font-medium">Téléphone:</span> {viewingOrder.phone}
                          </p>
                          <p>
                            <span className="font-medium">Wilaya:</span>{' '}
                            {viewingOrder.wilayaName || viewingOrder.wilaya}
                          </p>
                          <p>
                            <span className="font-medium">Adresse:</span> {viewingOrder.address}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Informations commande</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Date:</span>{' '}
                            {new Date(viewingOrder.createdAt).toLocaleString('fr-FR')}
                          </p>
                          <p>
                            <span className="font-medium">Statut:</span>{' '}
                            <Badge
                              className={
                                ({
                                  pending: 'bg-yellow-500',
                                  preparing: 'bg-blue-500',
                                  shipping: 'bg-purple-500',
                                  delivered: 'bg-green-500',
                                  completed: 'bg-teal-500',
                                  cancelled: 'bg-red-500',
                                } as Record<string, string>)[viewingOrder.status] || 'bg-gray-500'
                              }
                            >
                              {
                                ({
                                  pending: 'تم الطلب',
                                  preparing: 'قيد التحضير',
                                  shipping: 'راهـي في الطريق',
                                  delivered: 'وصلت',
                                  completed: 'أخذها الزبون',
                                  cancelled: 'ملغاة',
                                } as Record<string, string>)[viewingOrder.status] || viewingOrder.status
                              }
                            </Badge>
                          </p>
                          {viewingOrder.notes && (
                            <p>
                              <span className="font-medium">Notes:</span> {viewingOrder.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Produit commandé</h3>
                      {viewingOrder.product && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 p-4 bg-beige rounded-lg">
                            <img
                              src={viewingOrder.product.images?.[0] || '/placeholder.jpg'}
                              alt={viewingOrder.product.titleFr}
                              className="w-20 h-20 object-contain rounded bg-white"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{viewingOrder.product.titleFr}</p>
                              <p className="text-sm text-gray-600">
                                {viewingOrder.product.titleAr}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Quantité: {viewingOrder.quantity || 1}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{viewingOrder.product.price} DA</p>
                            </div>
                          </div>

                          {viewingOrder.selectedColor && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium mb-2">Couleur sélectionnée:</p>
                              <div className="flex items-center gap-3">
                                <img
                                  src={viewingOrder.selectedColor.image}
                                  alt={viewingOrder.selectedColor.nameAr}
                                  className="w-16 h-16 object-contain rounded border-2 border-rose bg-white"
                                />
                                <div>
                                  <p className="font-medium text-rose">
                                    {viewingOrder.selectedColor.nameAr}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span>Sous-total:</span>
                        <span className="font-medium">
                          {(viewingOrder.totalPrice - (viewingOrder.deliveryPrice || 0)).toFixed(
                            2
                          )}{' '}
                          DA
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Livraison:</span>
                        <span className="font-medium">
                          {viewingOrder.deliveryPrice || 0} DA
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>{viewingOrder.totalPrice} DA</span>
                      </div>
                    </div>

                    {viewingOrder.statusHistory && viewingOrder.statusHistory.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Historique des statuts</h3>
                        <div className="space-y-2">
                          {viewingOrder.statusHistory.map(
                            (history: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
                              >
                                <Badge
                                  className={
                                    ({
                                      pending: 'bg-yellow-500',
                                      preparing: 'bg-blue-500',
                                      shipping: 'bg-purple-500',
                                      delivered: 'bg-green-500',
                                      completed: 'bg-teal-500',
                                      cancelled: 'bg-red-500',
                                    } as Record<string, string>)[history.status] || 'bg-gray-500'
                                  }
                                >
                                  {
                                    ({
                                      pending: 'تم الطلب',
                                      preparing: 'قيد التحضير',
                                      shipping: 'راهـي في الطريق',
                                      delivered: 'وصلت',
                                      completed: 'أخذها الزبون',
                                      cancelled: 'ملغاة',
                                    } as Record<string, string>)[history.status] || history.status
                                  }
                                </Badge>
                                <span className="text-gray-600">
                                  {new Date(history.timestamp).toLocaleString('fr-FR')}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-rose hover:bg-mocha"
                        onClick={async () => {
                          try {
                            await downloadInvoice({
                              order: viewingOrder,
                              settings,
                            });
                          } catch (error) {
                            console.error('Error generating PDF:', error);
                            alert('Erreur lors de la génération du PDF');
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const message = `Bonjour ${viewingOrder.fullName}, votre commande #${viewingOrder.id.substring(0, 8)} est en cours de traitement.`;
                          window.open(
                            `https://wa.me/${viewingOrder.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
                            '_blank'
                          );
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Contacter sur WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des zones de livraison</CardTitle>
                <p className="text-sm text-gray-500 mt-2">
                  Toutes les wilayas algériennes sont pré-configurées. Modifiez les prix de livraison selon vos besoins.
                </p>
              </CardHeader>
                <Dialog
                  open={isZoneDialogOpen}
                  onOpenChange={(open) => {
                    setIsZoneDialogOpen(open);
                    if (!open) setEditingZone(null);
                  }}
                >
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingZone ? 'Modifier la zone' : 'Nouvelle zone'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveDeliveryZone} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Code</Label>
                          <Input
                            name="code"
                            value={editingZone?.code || ''}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Wilaya</Label>
                          <Input
                            name="name"
                            value={editingZone?.name || ''}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Zone</Label>
                            <Input
                              value={editingZone?.zone || 0}
                              disabled
                              className="bg-gray-100"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Délai (jours)</Label>
                            <Input
                              name="delayDays"
                              type="number"
                              required
                              defaultValue={editingZone?.delay_days || 1}
                              placeholder="1"
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Prix Stop Desk (DA)</Label>
                            <Input
                              name="stopdeskPrice"
                              type="number"
                              required
                              defaultValue={editingZone?.stopdesk_price || 0}
                              placeholder="450"
                            />
                            <p className="text-xs text-gray-500 mt-1">Livraison au bureau</p>
                          </div>
                          <div>
                            <Label>Prix Domicile (DA)</Label>
                            <Input
                              name="deliveryPrice"
                              type="number"
                              required
                              defaultValue={editingZone?.delivery_price || 0}
                              placeholder="590"
                            />
                            <p className="text-xs text-gray-500 mt-1">Livraison à domicile</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-rose hover:bg-mocha">
                          Enregistrer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsZoneDialogOpen(false)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Wilaya</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Stop Desk</TableHead>
                        <TableHead>Domicile</TableHead>
                        <TableHead>Délai</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryZones.map((zone) => (
                        <TableRow key={zone.id}>
                          <TableCell className="font-mono">{zone.code}</TableCell>
                          <TableCell>{zone.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              zone.zone === 0 ? 'bg-green-500' :
                              zone.zone === 1 ? 'bg-blue-500' :
                              zone.zone === 2 ? 'bg-yellow-500' :
                              zone.zone === 3 ? 'bg-orange-500' :
                              zone.zone === 4 ? 'bg-red-500' :
                              'bg-purple-500'
                            }>
                              Zone {zone.zone}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{zone.stopdesk_price || 0} DA</TableCell>
                          <TableCell className="font-semibold">{zone.delivery_price || 0} DA</TableCell>
                          <TableCell className="text-sm">{zone.delay_days || 1}j</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingZone(zone);
                                setIsZoneDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {deliveryZones.length === 0 && (
                    <div className="text-center py-8 text-mocha/60">
                      Aucune zone de livraison configurée
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero">
            <HeroManager />
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings?.logoUrl && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          style={{
                            height: 'auto',
                            maxHeight: `${((settings?.logoSize || 100) / 100) * 64}px`,
                            width: 'auto',
                            maxWidth: '200px'
                          }}
                          className="object-contain border rounded p-2 transition-all duration-300"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveLogo}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer le logo
                        </Button>
                      </div>
                      <div>
                        <Label htmlFor="logoSize" className="flex items-center justify-between">
                          <span>Taille du logo: {settings?.logoSize || 100}%</span>
                        </Label>
                        <Input
                          id="logoSize"
                          type="range"
                          min="50"
                          max="200"
                          step="10"
                          defaultValue={settings?.logoSize || 100}
                          onChange={async (e) => {
                            const logoSize = Number(e.target.value);
                            const settingsRef = doc(db, 'settings', 'main');
                            await setDoc(settingsRef, { logoSize }, { merge: true });
                            fetchAllData();
                          }}
                          className="mt-2 w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>50%</span>
                          <span>100%</span>
                          <span>200%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="logo">
                      {settings?.logoUrl ? 'Remplacer le logo' : 'Télécharger un logo'}
                    </Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format recommandé: PNG avec fond transparent
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paramètres généraux</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateSettings} className="space-y-4">
                    <div>
                      <Label htmlFor="siteName">Nom du site</Label>
                      <Input
                        id="siteName"
                        name="siteName"
                        defaultValue={settings?.siteName}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="showLogo"
                        id="showLogo"
                        defaultChecked={settings?.showLogo}
                      />
                      <Label htmlFor="showLogo">Afficher le logo</Label>
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Téléphone</Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        defaultValue={settings?.contactPhone}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        defaultValue={settings?.contactEmail}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Réseaux sociaux</h3>
                      {['instagram', 'facebook', 'tiktok', 'whatsapp', 'snapchat'].map(
                        platform => (
                          <div key={platform} className="grid grid-cols-12 gap-2 mb-3">
                            <div className="col-span-2 flex items-center">
                              <input
                                type="checkbox"
                                name={`${platform}_enabled`}
                                id={`${platform}_enabled`}
                                defaultChecked={settings?.socialLinks?.[platform]?.enabled}
                              />
                              <Label htmlFor={`${platform}_enabled`} className="ml-2 capitalize">
                                {platform}
                              </Label>
                            </div>
                            <div className="col-span-10">
                              <Input
                                name={`${platform}_url`}
                                placeholder={`URL ${platform}`}
                                defaultValue={settings?.socialLinks?.[platform]?.url}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <Button type="submit" className="w-full bg-rose hover:bg-mocha">
                      Enregistrer les paramètres
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de la facture</CardTitle>
                  <p className="text-sm text-gray-500 mt-2">
                    Configurez les informations de votre entreprise qui apparaîtront sur toutes les factures PDF
                  </p>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const formData = new FormData(form);

                      const invoiceSettings = {
                        storeName: formData.get('invoice_storeName') || '',
                        businessName: formData.get('invoice_businessName') || '',
                        nif: formData.get('invoice_nif') || '',
                        nis: formData.get('invoice_nis') || '',
                        rc: formData.get('invoice_rc') || '',
                        address: formData.get('invoice_address') || '',
                        wilaya: formData.get('invoice_wilaya') || '',
                        phone: formData.get('invoice_phone') || '',
                        email: formData.get('invoice_email') || '',
                        footerNote: formData.get('invoice_footerNote') || '',
                      };

                      const settingsRef = doc(db, 'settings', 'main');
                      await setDoc(settingsRef, { invoice: invoiceSettings }, { merge: true });
                      fetchAllData();
                      alert('Paramètres de facture enregistrés avec succès!');
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invoice_storeName">Nom du magasin</Label>
                        <Input
                          id="invoice_storeName"
                          name="invoice_storeName"
                          defaultValue={settings?.invoice?.storeName}
                          placeholder="Sanaa Collection"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoice_businessName">Raison sociale (optionnel)</Label>
                        <Input
                          id="invoice_businessName"
                          name="invoice_businessName"
                          defaultValue={settings?.invoice?.businessName}
                          placeholder="SARL Sanaa"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="invoice_nif">NIF (optionnel)</Label>
                        <Input
                          id="invoice_nif"
                          name="invoice_nif"
                          defaultValue={settings?.invoice?.nif}
                          placeholder="000000000000000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoice_nis">NIS (optionnel)</Label>
                        <Input
                          id="invoice_nis"
                          name="invoice_nis"
                          defaultValue={settings?.invoice?.nis}
                          placeholder="000000000000000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoice_rc">RC (optionnel)</Label>
                        <Input
                          id="invoice_rc"
                          name="invoice_rc"
                          defaultValue={settings?.invoice?.rc}
                          placeholder="00/00-0000000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invoice_address">Adresse (optionnel)</Label>
                        <Input
                          id="invoice_address"
                          name="invoice_address"
                          defaultValue={settings?.invoice?.address}
                          placeholder="123 Rue de la Liberté"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoice_wilaya">Wilaya (optionnel)</Label>
                        <Input
                          id="invoice_wilaya"
                          name="invoice_wilaya"
                          defaultValue={settings?.invoice?.wilaya}
                          placeholder="Alger"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invoice_phone">Téléphone (optionnel)</Label>
                        <Input
                          id="invoice_phone"
                          name="invoice_phone"
                          defaultValue={settings?.invoice?.phone}
                          placeholder="0555 00 00 00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoice_email">Email (optionnel)</Label>
                        <Input
                          id="invoice_email"
                          name="invoice_email"
                          type="email"
                          defaultValue={settings?.invoice?.email}
                          placeholder="contact@sanaa.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="invoice_footerNote">Note de pied de page (optionnel)</Label>
                      <Textarea
                        id="invoice_footerNote"
                        name="invoice_footerNote"
                        defaultValue={settings?.invoice?.footerNote}
                        placeholder="Merci pour votre confiance"
                        rows={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ce message apparaîtra en bas de chaque facture
                      </p>
                    </div>

                    <Button type="submit" className="w-full bg-rose hover:bg-mocha">
                      Enregistrer les paramètres de facture
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
