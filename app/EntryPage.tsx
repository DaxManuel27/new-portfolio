import Link from 'next/link';

export default function EntryPage({ section, title, description, meta, url, images = [] }: {
  section: 'experience' | 'projects';
  title: string;
  description: string;
  meta?: string;
  url?: string;
  images?: string[];
}) {
  return (
    <main className="min-h-screen bg-white font-sans text-slate-950">
      <article className="max-w-5xl mx-auto px-6 py-12 md:px-10 md:py-20">
        <Link href={`/#${section}`} className="text-sm text-slate-500 underline underline-offset-4 hover:text-teal-700">
          ← Back to {section}
        </Link>
        <p className="mt-16 mb-5 text-base tracking-wide text-teal-700">/ {section}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {meta && <p className="mt-4 text-sm text-slate-400">{meta}</p>}
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">{description}</p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block text-sm text-teal-700 underline underline-offset-4">
            {section === 'projects' ? 'View on GitHub' : 'Visit website'} ↗
          </a>
        )}
        {images.length > 0 && (
          <div className="mt-10 space-y-8">
            {images.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`${title} — project image ${index + 1}`}
                className="mx-auto h-auto max-h-[720px] w-full rounded-lg object-contain"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
