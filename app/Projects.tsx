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
  {
    id: 'spotify-cli',
    title: 'spotify-cli',
    images: ['/images/spotify-cli.png'],
    github: 'https://github.com/DaxManuel27/spotify-cli',
    description: 'Built a terminal-based Spotify client for browsing music and controlling playback from the command line.',
  },
];

function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-slate-300">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="scroll-mt-24 bg-[#f5f4ef]">
      <div className="max-w-5xl mx-auto px-6 py-20 md:px-10 md:py-24">
        <FadeIn>
          <div className="mb-10 flex items-end justify-between gap-4 border-b border-slate-300/70 pb-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Selected work</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Projects</h2>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
          {PROJECTS.map(p => (
            <FadeIn key={p.id}>
              <article className="h-full flex flex-col">
                {/* Photos */}
                <div className={`grid gap-3 ${p.images.length > 1 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {p.images.length === 0 && (
                    <div className="w-full h-56 rounded-md bg-white/45 flex items-center justify-center">
                      <PlaceholderIcon />
                    </div>
                  )}
                  {p.square
                    ? p.images.map((src, i) => (
                        <div key={i} className="relative w-full aspect-square overflow-hidden rounded-md bg-white/45">
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
                          className="w-full h-56 object-contain rounded-md bg-white/45"
                        />
                      ))
                  }
                </div>

                <div className="mt-5 flex flex-1 flex-col">
                  <h3 className="text-xl font-bold leading-tight text-slate-950">{p.title}</h3>
                  <p className="text-base text-slate-600 leading-relaxed mt-3">{p.description}</p>
                </div>

                {p.github && (
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noopener"
                    className="mt-5 inline-flex items-center gap-1.5 break-all text-sm font-medium text-teal-700 hover:text-teal-900"
                  >
                    {p.github.replace('https://', '')}
                    <ExternalLink size={12} />
                  </a>
                )}
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
