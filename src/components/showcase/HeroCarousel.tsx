import { useState, useEffect, useRef, useCallback } from 'react';
import type { ArtifactGroup, Mode } from '../../types/artifact.types';

interface HeroSlide {
  key: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  artifact?: ArtifactGroup;
  modeId?: string;
}

interface HeroCarouselProps {
  modes: Mode[];
  groups: ArtifactGroup[];
  onArtifactClick: (group: ArtifactGroup) => void;
  onModeFilter: (modeId: string) => void;
}

export const HeroCarousel = ({ modes, groups, onArtifactClick, onModeFilter }: HeroCarouselProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);

  // Build slides dynamically
  const slides: HeroSlide[] = [];

  // Slide 0: Daily challenge — deterministic pick from popular
  const popular = [...groups].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  if (popular.length > 0) {
    const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % popular.length;
    const dailyArtifact = popular[dayIndex];
    slides.push({
      key: 'daily',
      title: 'Күнделікті челлендж',
      subtitle: dailyArtifact.title,
      cta: 'Ойнау',
      gradient: 'from-orange-500 to-rose-500',
      artifact: dailyArtifact,
    });
  }

  // Per-mode slides
  const modeGradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-indigo-500 to-violet-500',
  ];

  modes.forEach((mode, i) => {
    const modeGroups = groups.filter((g) => g.modeId === mode.id);
    if (modeGroups.length > 0) {
      slides.push({
        key: `mode-${mode.id}`,
        title: `${mode.icon} ${mode.label}`,
        subtitle: `${modeGroups.length} артефакт`,
        cta: 'Қарау',
        gradient: modeGradients[i % modeGradients.length],
        modeId: mode.id,
      });
    }
  });

  // Newest artifact slide
  const newest = [...groups].sort(
    (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
  )[0];
  if (newest) {
    slides.push({
      key: 'new',
      title: 'Жаңалық',
      subtitle: newest.title,
      cta: 'Қарау',
      gradient: 'from-emerald-500 to-teal-500',
      artifact: newest,
    });
  }

  // Auto-scroll
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  // Clamp active slide
  useEffect(() => {
    if (activeSlide >= slides.length && slides.length > 0) {
      setActiveSlide(0);
    }
  }, [activeSlide, slides.length]);

  const handleSlideClick = useCallback(
    (slide: HeroSlide) => {
      if (slide.artifact) {
        onArtifactClick(slide.artifact);
      } else if (slide.modeId) {
        onModeFilter(slide.modeId);
      }
    },
    [onArtifactClick, onModeFilter]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        setActiveSlide((prev) => (prev + 1) % slides.length);
      } else {
        setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  };

  if (slides.length === 0) return null;

  const currentSlide = slides[activeSlide] || slides[0];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={() => handleSlideClick(currentSlide)}
        className={`w-full h-48 md:h-64 bg-gradient-to-r ${currentSlide.gradient} transition-all duration-500 text-left`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-1 md:mb-2 drop-shadow-md">
            {currentSlide.title}
          </h2>
          <p className="text-base md:text-xl text-white/90 mb-3 md:mb-4 drop-shadow-sm">
            {currentSlide.subtitle}
          </p>
          <span className="inline-flex self-start px-5 md:px-6 py-2 md:py-2.5 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition-colors text-sm md:text-base">
            {currentSlide.cta}
          </span>
        </div>
      </button>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide(i);
              }}
              className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${
                i === activeSlide
                  ? 'bg-white w-6 md:w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
