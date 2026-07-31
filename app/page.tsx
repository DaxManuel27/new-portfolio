import Image from 'next/image';
import { Briefcase, Mail, Linkedin, Github, ExternalLink } from 'lucide-react';
import Projects from './Projects';
import FadeIn from './FadeIn';
import Gallery from './Gallery';

interface Experience {
  id: string;
  title: string;
  org: string;
  meta: string;
  summary?: string;
  url?: string;
}

const EXPERIENCES: Experience[] = [
  {
    id: 'ultra-maritime',
    title: 'Software Engineer Intern',
    org: 'Ultra Maritime',
    meta: 'Summer 2026',
    summary: 'C',
  },
  {
    id: 'unb-formula',
    title: 'Electrical Project Lead',
    org: 'UNB Formula Racing',
    meta: 'Sep 2025 — Present',
    summary: '',
  },
  {
    id: 'hack-atlantic',
    title: 'Founder',
    org: 'Hack Atlantic',
    meta: 'Apr 2026 — Present',
    summary: '',
    url: 'https://hackatlantic.ca',
  },
];

function ConnectLinks() {
  const linkClass =
    'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-950';

  return (
    <div className="flex flex-wrap gap-2">
      <a href="mailto:dax.manuel@unb.ca" className={linkClass}>
        <Mail size={15} />
        dax.manuel@unb.ca
      </a>
      <a href="https://linkedin.com/in/nikolasdaxmanuel" target="_blank" rel="noopener" className={linkClass}>
        <Linkedin size={15} />
        LinkedIn
      </a>
      <a href="https://github.com/DaxManuel27" target="_blank" rel="noopener" className={linkClass}>
        <Github size={15} />
        GitHub
      </a>
      <a href="https://discord.com" target="_blank" rel="noopener" className={linkClass}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px]"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03Z"/></svg>
        Discord
      </a>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-center sm:justify-between">
          <a href="#home" className="hidden sm:inline text-sm font-semibold text-slate-950">
            Dax Manuel
          </a>
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/85 p-1 shadow-sm">
            {['Home', 'Projects', 'Experience'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-950 hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>
        </nav>
      </header>
      <main>

        {/* Hero — About + Contact */}
        <section id="home" className="scroll-mt-24 max-w-5xl mx-auto px-6 py-12 md:px-10 md:py-20 flex flex-col-reverse md:flex-row items-start gap-8 md:gap-12">
          <div className="flex-1 min-w-0">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Portfolio</p>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold leading-none text-slate-950 mb-5">Dax Manuel</h1>
            <p className="text-2xl text-slate-700 leading-snug mb-5">
              Software Engineer and Founder.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4 max-w-xl">
              Software Engineering Student at UNB with a Minor in Math. I'm interested in software and AI within the robotics and automotive industry. 
            </p>
            <p className="text-slate-600 leading-relaxed mb-8 max-w-xl">
              Outside of that, I am into health, lifting, running, travelling, and sports.
            </p>
            <ConnectLinks />
          </div>
          <Image
            src="/images/headshot.png"
            alt="Dax Manuel"
            width={288}
            height={360}
            priority
            sizes="(min-width: 768px) 288px, 192px"
            className="w-48 h-56 mx-auto sm:mx-0 sm:w-48 sm:h-64 md:w-72 md:h-[360px] rounded-2xl object-cover object-center md:object-top shadow-xl shadow-slate-200/80 flex-shrink-0"
          />
        </section>

        <Gallery />

        {/* Projects (interactive island) */}
        <Projects />

        {/* Experience */}
        <section id="experience" className="scroll-mt-24 max-w-5xl mx-auto px-6 py-20 md:px-10 md:py-24">
          <FadeIn>
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Background</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Experience</h2>
              </div>
            </div>
          </FadeIn>
          <div className="flex flex-col divide-y divide-slate-200">
            {EXPERIENCES.map(e => (
              <FadeIn key={e.id}>
                <div className="flex gap-4 py-7">
                  <div className="w-10 h-10 flex items-center justify-center text-teal-700 flex-shrink-0 mt-1">
                    <Briefcase size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-slate-950">{e.title} @ {e.org}</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{e.meta}</div>
                    {e.summary && (
                      <p className="text-sm text-slate-600 leading-relaxed mt-2 max-w-2xl">{e.summary}</p>
                    )}
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 mt-3 hover:text-teal-900">
                        {e.url.replace('https://', '')}
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
