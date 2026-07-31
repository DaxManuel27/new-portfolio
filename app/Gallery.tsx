import Image from 'next/image';
import FadeIn from './FadeIn';

const GALLERY_IMAGES = [
  {
    src: '/images/gallery-toronto.jpg',
    alt: 'Dax Manuel in Toronto',
  },
  {
    src: '/images/gallery-0825.jpg',
    alt: 'Dax Manuel gallery photo',
  },
  {
    src: '/images/gallery-coast-code.jpg',
    alt: 'Dax Manuel coding by the coast',
  },
];

export default function Gallery() {
  return (
    <section className="max-w-5xl mx-auto px-6 pb-20 md:px-10 md:pb-24">
      <FadeIn>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {GALLERY_IMAGES.map(image => (
            <div key={image.src} className="relative h-80 overflow-hidden rounded-xl sm:h-72 md:h-80">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 30vw, (min-width: 640px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
