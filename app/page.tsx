import Image from 'next/image';
import { Mail, Linkedin, Github, Instagram, ExternalLink } from 'lucide-react';
import Projects from './Projects';
import FadeIn from './FadeIn';
import Gallery from './Gallery';

interface Experience {
  id: string;
  title: string;
  org: string;
  meta: string;
  logo: string;
  logoAlt: string;
  summary?: string;
  url?: string;
}

const EXPERIENCES: Experience[] = [
  {
    id: 'ultra-maritime',
    title: 'Software Engineer Intern',
    org: 'Ultra Maritime',
    meta: 'Summer 2026',
    logo: '/images/ultra-maritime-logo.jpeg',
    logoAlt: 'Ultra Maritime logo',
  },
  {
    id: 'hack-atlantic',
    title: 'Founder',
    org: 'Hack Atlantic',
    meta: 'Apr 2026 — Present',
    logo: '/images/hack-atlantic-logo.jpg',
    logoAlt: 'Hack Atlantic logo',
    summary: '',
    url: 'https://hackatlantic.ca',
  },
  {
    id: 'unb-formula',
    title: 'Firmware',
    org: 'UNB Formula Racing',
    meta: 'Sep 2025 — Present',
    logo: '/images/unb-formula-racing-logo.png',
    logoAlt: 'UNB Formula Racing logo',
    summary: '',
  },
];

const CONTACT_LINKS = [
  {
    label: 'Email',
    value: 'dax.manuel@unb.ca',
    href: 'mailto:dax.manuel@unb.ca',
    Icon: Mail,
  },
  {
    label: 'LinkedIn',
    value: 'nikolasdaxmanuel',
    href: 'https://linkedin.com/in/nikolasdaxmanuel',
    Icon: Linkedin,
  },
  {
    label: 'GitHub',
    value: 'DaxManuel27',
    href: 'https://github.com/DaxManuel27',
    Icon: Github,
  },
  {
    label: 'Instagram',
    value: 'daxmanuel',
    href: 'https://instagram.com/daxmanuel',
    Icon: Instagram,
  },
];

function ConnectLinks() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CONTACT_LINKS.map(({ label, value, href, Icon }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener' : undefined}
          className="group flex min-h-20 items-center justify-between gap-4 border-t border-slate-200 py-4 transition-colors hover:border-slate-400"
          aria-label={`${label}: ${value}`}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-950 group-hover:text-white">
              <Icon size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">{label}</span>
              <span className="block break-all text-sm text-slate-500">{value}</span>
            </span>
          </span>
          <ExternalLink size={15} className="shrink-0 text-slate-400 transition-colors group-hover:text-slate-950" />
        </a>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-center">
          <div className="flex items-center justify-center gap-6">
            {['Home', 'Projects', 'Experience', 'Contact'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
              >
                {item}
              </a>
            ))}
          </div>
        </nav>
      </header>
      <main>

        {/* Hero */}
        <section id="home" className="scroll-mt-24 max-w-5xl mx-auto px-6 pt-16 pb-10 text-center md:px-10 md:pt-24 md:pb-14">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold leading-none text-slate-950">Dax Manuel</h1>
        </section>

        <Gallery />

        {/* Projects (interactive island) */}
        <Projects />

        {/* Experience */}
        <section id="experience" className="scroll-mt-24 max-w-5xl mx-auto px-6 py-20 md:px-10 md:py-24">
          <FadeIn>
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-950">Experience</h2>
              </div>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3">
            {EXPERIENCES.map(e => (
              <FadeIn key={e.id}>
                <div className="border-t border-slate-200 pt-5">
                  <div className="relative mb-4 h-12 w-20">
                    <Image
                      src={e.logo}
                      alt={e.logoAlt}
                      fill
                      sizes="80px"
                      className="object-contain object-left"
                    />
                  </div>
                  <div className="text-base font-semibold text-slate-950">{e.title} @ {e.org}</div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">{e.meta}</div>
                  {e.summary && (
                    <p className="text-sm text-slate-600 leading-relaxed mt-2">{e.summary}</p>
                  )}
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 mt-3 hover:text-teal-900">
                      {e.url.replace('https://', '')}
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-24 max-w-5xl mx-auto px-6 pb-20 md:px-10 md:pb-24">
          <FadeIn>
            <div className="mb-8 grid gap-4 border-b border-slate-200 pb-5 md:grid-cols-[1fr_1.4fr] md:items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-950">Contact</h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 md:justify-self-end">
                Open to software engineering internships, hackathon collaborations, and student team projects.
              </p>
            </div>
          </FadeIn>
          <FadeIn>
            <ConnectLinks />
          </FadeIn>
        </section>

      </main>
    </div>
  );
}
