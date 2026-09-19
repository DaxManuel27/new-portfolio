import PortfolioList from './PortfolioList';
import { EXPERIENCES, PROJECTS } from './portfolio-data';
import Gallery from './Gallery';

const CONTACT_LINKS = [
  { label: 'email', href: 'mailto:dax.manuel@unb.ca' },
  { label: 'linkedin', href: 'https://linkedin.com/in/nikolasdaxmanuel' },
  { label: 'github', href: 'https://github.com/DaxManuel27' },
];

function ConnectLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
      {CONTACT_LINKS.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="rounded-sm text-lg text-slate-950 underline decoration-teal-700/40 decoration-1 underline-offset-[5px] transition-colors hover:text-teal-700 hover:decoration-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
        >
          {label}
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
            {['Home', 'Experience', 'Projects', 'Contact'].map(item => (
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

        <div className="w-fit max-w-full mx-auto px-6 pt-12 pb-20 md:px-8 md:pt-14 md:pb-24">
          <PortfolioList
            id="experience"
            entries={EXPERIENCES.map(e => ({
              id: e.id,
              title: e.org,
              description: e.title,
            }))}
          />
          <PortfolioList
            id="projects"
            entries={PROJECTS.map(p => ({
              id: p.id,
              title: p.title,
              description: p.summary,
            }))}
          />
          {/* Contact */}
          <section id="contact" aria-label="Contact" className="scroll-mt-24 mt-12 md:mt-14">
            <ConnectLinks />
          </section>
        </div>

      </main>
    </div>
  );
}
