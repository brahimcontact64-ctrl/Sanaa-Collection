'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

interface HeroProps {
  settings: HeroSettings;
}

export default function Hero({ settings }: HeroProps) {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageError, setImageError] = useState(false);

  const mediaUrls = settings.mediaUrls || [];
  const hasSlider = settings.mediaType === 'slider' && mediaUrls.length > 1;

  useEffect(() => {
    if (!hasSlider) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mediaUrls.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [hasSlider, mediaUrls.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mediaUrls.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  if (!settings.enabled) {
    return null;
  }

  const textColor = settings.textColor || '#2c1810';

  return (
    <section className="relative min-h-[50vh] sm:h-[60vh] overflow-hidden flex items-center justify-center px-4">
      {settings.mediaType === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-br from-rose/20 via-beige to-gold/20" />
      )}

      {settings.mediaType === 'image' && settings.mediaUrl && !imageError && (
        <>
          <Image
            src={settings.mediaUrl}
            alt={language === 'ar' ? settings.titleAr : settings.titleFr}
            fill
            priority
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="100vw"
          />
          {settings.overlay && <div className="absolute inset-0 bg-black/30" />}
        </>
      )}

      {settings.mediaType === 'slider' && mediaUrls.length > 0 && !imageError && (
        <>
          <Image
            src={mediaUrls[currentSlide]}
            alt={language === 'ar' ? settings.titleAr : settings.titleFr}
            fill
            priority
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="100vw"
          />
          {settings.overlay && <div className="absolute inset-0 bg-black/30" />}

          {hasSlider && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 text-mocha" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6 text-mocha" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {mediaUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {settings.mediaType === 'video' && settings.videoUrl && !imageError && (
        <>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          >
            <source src={settings.videoUrl} type="video/mp4" />
          </video>
          {settings.overlay && <div className="absolute inset-0 bg-black/30" />}
        </>
      )}

      {(imageError ||
        (settings.mediaType === 'image' && !settings.mediaUrl) ||
        (settings.mediaType === 'slider' && mediaUrls.length === 0) ||
        (settings.mediaType === 'video' && !settings.videoUrl)) && (
        <div className="absolute inset-0 bg-gradient-to-br from-rose/20 via-beige to-gold/20" />
      )}

      <div className="relative z-10 text-center">
        <h1
          className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6"
          style={{
            fontFamily: language === 'ar' ? 'Cairo, sans-serif' : 'Poppins, sans-serif',
            color: textColor,
          }}
        >
          {language === 'ar' ? settings.titleAr : settings.titleFr}
        </h1>
        <p
          className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-8 px-4"
          style={{ color: textColor, opacity: 0.9 }}
        >
          {language === 'ar' ? settings.subtitleAr : settings.subtitleFr}
        </p>
        {settings.showButton && settings.buttonLink && (
          <Link href={settings.buttonLink}>
            <Button
              size="lg"
              className="bg-rose hover:bg-rose/90 text-white px-8 py-6 text-lg"
            >
              {language === 'ar' ? settings.buttonTextAr : settings.buttonTextFr}
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
