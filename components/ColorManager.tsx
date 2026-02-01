'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import ImageCropper from '@/components/ImageCropper';

interface Color {
  name: string;
  images: string[];
}

interface ColorManagerProps {
  colors: Color[];
  onChange: (colors: Color[]) => void;
}

export default function ColorManager({ colors, onChange }: ColorManagerProps) {
  const [uploading, setUploading] = useState<{colorIndex: number, uploading: boolean}>({colorIndex: -1, uploading: false});
  const [cropperState, setCropperState] = useState<{
    show: boolean;
    colorIndex: number;
    imageUrl: string;
    files: File[];
    currentFileIndex: number;
  }>({
    show: false,
    colorIndex: -1,
    imageUrl: '',
    files: [],
    currentFileIndex: 0,
  });

  const addColor = () => {
    onChange([...colors, { name: '', images: [] }]);
  };

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  const updateColorName = (index: number, name: string) => {
    const updated = [...colors];
    updated[index].name = name;
    onChange(updated);
  };

  const removeImage = (colorIndex: number, imageIndex: number) => {
    const updated = [...colors];
    updated[colorIndex].images = updated[colorIndex].images.filter((_, i) => i !== imageIndex);
    onChange(updated);
  };

  const handleImageUpload = async (colorIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const firstFile = filesArray[0];
    const imageUrl = URL.createObjectURL(firstFile);

    setCropperState({
      show: true,
      colorIndex,
      imageUrl,
      files: filesArray,
      currentFileIndex: 0,
    });
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const { colorIndex, files, currentFileIndex } = cropperState;

    setUploading({ colorIndex, uploading: true });

    try {
      const fileName = files[currentFileIndex].name;
      const storageRef = ref(storage, `products/${Date.now()}_${fileName}`);
      await uploadBytes(storageRef, croppedBlob);
      const url = await getDownloadURL(storageRef);

      const updated = [...colors];
      updated[colorIndex].images = [...updated[colorIndex].images, url];
      onChange(updated);

      URL.revokeObjectURL(cropperState.imageUrl);

      if (currentFileIndex < files.length - 1) {
        const nextFile = files[currentFileIndex + 1];
        const nextImageUrl = URL.createObjectURL(nextFile);
        setCropperState({
          ...cropperState,
          imageUrl: nextImageUrl,
          currentFileIndex: currentFileIndex + 1,
        });
      } else {
        setCropperState({
          show: false,
          colorIndex: -1,
          imageUrl: '',
          files: [],
          currentFileIndex: 0,
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploading({ colorIndex: -1, uploading: false });
    }
  };

  const handleCropCancel = () => {
    URL.revokeObjectURL(cropperState.imageUrl);
    setCropperState({
      show: false,
      colorIndex: -1,
      imageUrl: '',
      files: [],
      currentFileIndex: 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Couleurs & Images</Label>
        <Button
          type="button"
          onClick={addColor}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une couleur
        </Button>
      </div>

      <div className="space-y-4">
        {colors.map((color, colorIndex) => (
          <div
            key={colorIndex}
            className="border rounded-lg p-4 space-y-3 bg-gray-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Label className="text-sm">Nom de la couleur</Label>
                <Input
                  value={color.name}
                  onChange={(e) => updateColorName(colorIndex, e.target.value)}
                  placeholder="ex: Noir, Beige, Rouge..."
                  className="mt-1"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeColor(colorIndex)}
                className="mt-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <Label className="text-sm">Images ({color.images.length})</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {color.images.map((image, imageIndex) => (
                  <div key={imageIndex} className="relative aspect-square group">
                    <img
                      src={image}
                      alt={`${color.name} ${imageIndex + 1}`}
                      className="w-full h-full object-contain rounded border bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(colorIndex, imageIndex)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <label className="aspect-square border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-rose hover:bg-rose/5 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">
                    {uploading.colorIndex === colorIndex && uploading.uploading
                      ? 'Upload...'
                      : 'Ajouter'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(colorIndex, e.target.files)}
                    disabled={uploading.colorIndex === colorIndex && uploading.uploading}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {colors.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <p className="mb-2">Aucune couleur ajoutée</p>
          <p className="text-sm">Cliquez sur "Ajouter une couleur" pour commencer</p>
        </div>
      )}

      {cropperState.show && (
        <ImageCropper
          imageUrl={cropperState.imageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
