import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import FadeIn from './FadeIn';

interface Project {
  id: string;
  title: string;
  images: string[];
  square?: boolean;
  github?: string;
  description: string;
}

const PROJECTS: Project[] = [
  {
    id: 'ml-framework-c',
    title: 'ML Framework in C',
    images: ['/images/MLFramework.png'],
    github: 'https://github.com/DaxManuel27/deep-learning-framework',
    description: 'Designed a machine learning framework from scratch in C, implementing forward/back-propagation, gradient descent, and activation/loss functions.',
  },
  {
    id: 'cursor-cad',
    title: 'Cursor for CAD - McHacks 13 Submission',
    images: ['/images/IMG_4652.JPG', '/images/cursorforcad.png'],
    square: true,
    github: 'https://github.com/DaxManuel27/mchacks',
    description: 'Turning prompts into exportable 3D CAD models in under 24 hours at McHacks 2026.',
  },
  {
    id: 'vehicle-perception',
    title: 'Vehicle Perception Model',
    images: ['/images/vehicle.png'],
    github: 'https://github.com/DaxManuel27/vehicle-perception-model',
    description: 'Trained a model on LiDAR data from the Waymo Open Dataset to predict 3D bounding boxes over vehicles.',
  },
  {
    id: '4bit-cpu',
    title: '4 Bit CPU',
    images: ['/images/ALU.png'],
    description: 'Designed and built a 4-bit CPU from scratch, including an Arithmetic Logic Unit (ALU) capable of performing basic arithmetic and logic operations.',
  },
];

function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-300">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="scroll-mt-24 mb-24">
      <h2 className="text-3xl font-bold text-gray-900 bg-[#cbb489] rounded-xl px-6 py-4 mb-8 text-center">Projects</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {PROJECTS.map(p => (
          <FadeIn key={p.id}>
            <article className="h-full flex flex-col">
              {/* Title banner */}
              <div className="bg-[#e8dcc4] text-gray-900 rounded-xl px-5 py-4">
                <h3 className="text-xl font-bold leading-tight">{p.title}</h3>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                {p.images.length === 0 && (
                  <div className="w-full h-56 rounded-lg bg-[#f5efe1] flex items-center justify-center">
                    <PlaceholderIcon />
                  </div>
                )}
                {p.square
                  ? p.images.map((src, i) => (
                      <div key={i} className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#f5efe1]">
                        <Image
                          src={src}
                          alt={p.title}
                          fill
                          sizes="(min-width: 1024px) 224px, (min-width: 768px) 448px, (min-width: 640px) 50vw, 100vw"
                          className="object-contain"
                        />
                      </div>
                    ))
                  : p.images.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={p.title}
                        className="w-full h-56 object-contain rounded-lg bg-[#f5efe1]"
                      />
                    ))
                }
              </div>

              {/* Text under */}
              <p className="text-base text-gray-600 leading-relaxed mt-5">{p.description}</p>

              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-sm text-gray-900 underline underline-offset-2 mt-5"
                >
                  {p.github.replace('https://', '')}
                  <ExternalLink size={12} />
                </a>
              )}
            </article>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
