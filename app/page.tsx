import PortfolioList from './PortfolioList';
import { EXPERIENCES, PROJECTS } from './portfolio-data';

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
      <main className="max-w-3xl mx-auto px-6 pt-20 pb-16 md:px-8 md:pt-28 md:pb-20">
        <section id="home" className="mb-10 md:mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">Dax Manuel</h1>
          {/* Replace this paragraph with your bio. */}
          <p className="mt-6 text-base leading-relaxed text-slate-500 md:mt-7">
             I’m Dax, a third year software engineering student at unb, the founder of hack atlantic, and a project lead at unb formula racing. I previously worked as a swe intern at ultra maritime, a defense company.
          </p>
        </section>

        <div>
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
          <section id="contact" aria-label="Contact" className="scroll-mt-24 mt-8 md:mt-10">
            <ConnectLinks />
          </section>
        </div>

      </main>
    </div>
  );
}
