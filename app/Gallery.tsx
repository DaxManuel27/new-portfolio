import Image from 'next/image';
import FadeIn from './FadeIn';

const GALLERY_ITEMS = [
  {
    type: 'image',
    src: '/images/gallery-toronto.jpg',
    alt: 'Dax Manuel in Toronto',
  },
  {
    type: 'video',
    src: '/videos/gallery-screen-recording.mov',
    alt: 'Dax Manuel gallery video',
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
];

export default function Gallery() {
  const marqueeItems = [...GALLERY_ITEMS, ...GALLERY_ITEMS];

  return (
    <section className="max-w-5xl mx-auto px-6 pb-20 md:px-10 md:pb-24">
      <FadeIn>
        <div className="overflow-hidden">
          <div className="gallery-marquee flex w-max gap-4 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
            {marqueeItems.map((item, index) => (
              <div
                key={`${item.src}-${index}`}
                className="gallery-marquee-item shrink-0"
                aria-hidden={index >= GALLERY_ITEMS.length}
              >
                <div className="relative h-80 overflow-hidden rounded-xl sm:h-72 md:h-80">
                  {item.type === 'image' ? (
                    <Image
                      src={item.src}
                      alt={index >= GALLERY_ITEMS.length ? '' : item.alt}
                      fill
                      sizes="(min-width: 768px) 30vw, (min-width: 640px) 33vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={item.src}
                      aria-label={index >= GALLERY_ITEMS.length ? undefined : item.alt}
                      className="h-full w-full object-cover"
                      autoPlay
                      controls={index < GALLERY_ITEMS.length}
                      loop
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
      </FadeIn>
    </section>
  );
}
