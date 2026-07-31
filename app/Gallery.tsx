'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import FadeIn from './FadeIn';

const GALLERY_ITEMS = [
  {
    type: 'image',
    src: '/images/gallery-toronto.jpg',
    alt: 'Dax Manuel in Toronto',
  },
  {
    type: 'image',
    src: '/images/gallery-0825.jpg',
    alt: 'Dax Manuel gallery photo',
  },
  {
    type: 'image',
    src: '/images/gallery-coast-code.jpg',
    alt: 'Dax Manuel coding by the coast',
  },
  {
    type: 'video',
    src: '/videos/gallery-screen-recording.mov',
    alt: 'Dax Manuel gallery video',
  },
];

export default function Gallery() {
  const viewportRef = useRef<HTMLDivElement>(null);

  const slide = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const visibleItems = window.matchMedia('(min-width: 640px)').matches ? 3 : 1;
    const gap = 16;
    const itemWidth = (viewport.clientWidth - gap * (visibleItems - 1)) / visibleItems;

    viewport.scrollBy({
      left: direction * (itemWidth + gap),
      behavior: 'smooth',
    });
  };

  return (
    <section className="max-w-5xl mx-auto px-6 pb-20 md:px-10 md:pb-24">
      <FadeIn>
        <div className="relative">
          <div
            ref={viewportRef}
            className="overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex snap-x snap-mandatory gap-4">
              {GALLERY_ITEMS.map(item => (
                <div key={item.src} className="min-w-full snap-start sm:min-w-[calc((100%_-_2rem)/3)]">
                  <div className="relative h-80 overflow-hidden rounded-xl sm:h-72 md:h-80">
                    {item.type === 'image' ? (
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        sizes="(min-width: 768px) 30vw, (min-width: 640px) 33vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={item.src}
                        aria-label={item.alt}
                        className="h-full w-full object-cover"
                        controls
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => slide(-1)}
              aria-label="Previous gallery item"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-950 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => slide(1)}
              aria-label="Next gallery item"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-950 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
