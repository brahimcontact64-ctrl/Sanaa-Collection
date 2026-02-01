'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Film, Palette } from 'lucide-react';

interface HeroSettings {
  enabled: boolean;
  titleFr: string;
  titleAr: string;
  subtitleFr: string;
  subtitleAr: string;
  mediaType: 'gradient' | 'image' | 'slider' | 'video';
  mediaUrl?: string;
  mediaUrls?: string[];
  videoUrl?: string;
  showButton: boolean;
  buttonTextFr: string;
  buttonTextAr: string;
  buttonLink: string;
  overlay: boolean;
  textColor: string;
}

export default function HeroManager() {
  const [settings, setSettings] = useState<HeroSettings>({
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'main');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.hero) {
          setSettings((prev) => ({ ...prev, ...data.hero }));
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement');
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'main');
      await updateDoc(settingsRef, { hero: settings });
      toast.success('Hero mis à jour avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse. Max: 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `hero_image_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `hero/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setSettings({ ...settings, mediaUrl: downloadURL });
      toast.success('Image téléchargée avec succès');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement');
    }
    setUploading(false);
  };

  const handleSliderImageUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse. Max: 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `hero_slider_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `hero/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const updatedUrls = [...(settings.mediaUrls || []), downloadURL];
      setSettings({ ...settings, mediaUrls: updatedUrls });
      toast.success('Image ajoutée au slider');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement');
    }
    setUploading(false);
  };

  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Vidéo trop volumineuse. Max: 50MB');
      return;
    }

    setUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `hero_video_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `hero/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setSettings({ ...settings, videoUrl: downloadURL });
      toast.success('Vidéo téléchargée avec succès');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Erreur lors du téléchargement');
    }
    setUploading(false);
  };

  const removeSliderImage = (index: number) => {
    const updatedUrls = settings.mediaUrls?.filter((_, i) => i !== index) || [];
    setSettings({ ...settings, mediaUrls: updatedUrls });
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="media">Média</TabsTrigger>
          <TabsTrigger value="button">Bouton</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration générale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="hero-enabled" className="font-semibold">Activer le Hero</Label>
                <Switch
                  id="hero-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title-fr" className="font-semibold">Titre (Français)</Label>
                <Input
                  id="title-fr"
                  value={settings.titleFr}
                  onChange={(e) =>
                    setSettings({ ...settings, titleFr: e.target.value })
                  }
                  placeholder="Titre en français"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title-ar" className="font-semibold">Titre (Arabe)</Label>
                <Input
                  id="title-ar"
                  value={settings.titleAr}
                  onChange={(e) =>
                    setSettings({ ...settings, titleAr: e.target.value })
                  }
                  placeholder="العنوان بالعربية"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle-fr" className="font-semibold">Sous-titre (Français)</Label>
                <Input
                  id="subtitle-fr"
                  value={settings.subtitleFr}
                  onChange={(e) =>
                    setSettings({ ...settings, subtitleFr: e.target.value })
                  }
                  placeholder="Sous-titre en français"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle-ar" className="font-semibold">Sous-titre (Arabe)</Label>
                <Input
                  id="subtitle-ar"
                  value={settings.subtitleAr}
                  onChange={(e) =>
                    setSettings({ ...settings, subtitleAr: e.target.value })
                  }
                  placeholder="العنوان الفرعي بالعربية"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-color" className="font-semibold">Couleur du texte</Label>
                <div className="flex gap-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={settings.textColor}
                    onChange={(e) =>
                      setSettings({ ...settings, textColor: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.textColor}
                    onChange={(e) =>
                      setSettings({ ...settings, textColor: e.target.value })
                    }
                    placeholder="#2c1810"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="overlay" className="font-semibold">Overlay sombre (média)</Label>
                <Switch
                  id="overlay"
                  checked={settings.overlay}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, overlay: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Type de média</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSettings({ ...settings, mediaType: 'gradient' })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    settings.mediaType === 'gradient'
                      ? 'border-rose bg-rose/10'
                      : 'border-gray-200 hover:border-rose/50'
                  }`}
                >
                  <Palette className="w-8 h-8" />
                  <span className="font-semibold">Dégradé</span>
                </button>

                <button
                  onClick={() => setSettings({ ...settings, mediaType: 'image' })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    settings.mediaType === 'image'
                      ? 'border-rose bg-rose/10'
                      : 'border-gray-200 hover:border-rose/50'
                  }`}
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="font-semibold">Image</span>
                </button>

                <button
                  onClick={() => setSettings({ ...settings, mediaType: 'slider' })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    settings.mediaType === 'slider'
                      ? 'border-rose bg-rose/10'
                      : 'border-gray-200 hover:border-rose/50'
                  }`}
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="font-semibold">Slider</span>
                </button>

                <button
                  onClick={() => setSettings({ ...settings, mediaType: 'video' })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    settings.mediaType === 'video'
                      ? 'border-rose bg-rose/10'
                      : 'border-gray-200 hover:border-rose/50'
                  }`}
                >
                  <Film className="w-8 h-8" />
                  <span className="font-semibold">Vidéo</span>
                </button>
              </div>

              {settings.mediaType === 'image' && (
                <div className="space-y-4">
                  <Label className="font-semibold">Image de fond</Label>
                  {settings.mediaUrl && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden">
                      <img
                        src={settings.mediaUrl}
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 5MB - JPG, PNG, WebP</p>
                  </div>
                </div>
              )}

              {settings.mediaType === 'slider' && (
                <div className="space-y-4">
                  <Label className="font-semibold">Images du slider</Label>

                  {settings.mediaUrls && settings.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {settings.mediaUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeSliderImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSliderImageUpload(file);
                      }}
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ajoutez plusieurs images - Max 5MB chacune
                    </p>
                  </div>
                </div>
              )}

              {settings.mediaType === 'video' && (
                <div className="space-y-4">
                  <Label className="font-semibold">Vidéo de fond</Label>
                  {settings.videoUrl && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden">
                      <video
                        src={settings.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoUpload(file);
                      }}
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max 50MB - MP4, WebM (autoplay, muted, loop)
                    </p>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">Téléchargement en cours...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="button" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du bouton</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-button" className="font-semibold">Afficher le bouton</Label>
                <Switch
                  id="show-button"
                  checked={settings.showButton}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showButton: checked })
                  }
                />
              </div>

              {settings.showButton && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="button-text-fr" className="font-semibold">
                      Texte du bouton (Français)
                    </Label>
                    <Input
                      id="button-text-fr"
                      value={settings.buttonTextFr}
                      onChange={(e) =>
                        setSettings({ ...settings, buttonTextFr: e.target.value })
                      }
                      placeholder="Découvrir"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="button-text-ar" className="font-semibold">
                      Texte du bouton (Arabe)
                    </Label>
                    <Input
                      id="button-text-ar"
                      value={settings.buttonTextAr}
                      onChange={(e) =>
                        setSettings({ ...settings, buttonTextAr: e.target.value })
                      }
                      placeholder="اكتشف"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="button-link" className="font-semibold">Lien du bouton</Label>
                    <Input
                      id="button-link"
                      value={settings.buttonLink}
                      onChange={(e) =>
                        setSettings({ ...settings, buttonLink: e.target.value })
                      }
                      placeholder="/products"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4">
        <Button onClick={saveSettings} disabled={saving} size="lg" className="flex-1">
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les modifications'}
        </Button>
      </div>
    </div>
  );
}
