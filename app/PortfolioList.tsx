import Link from 'next/link';

type Entry = { id: string; title: string; description: string };

export default function PortfolioList({ id, entries }: {
  id: 'experience' | 'projects';
  entries: Entry[];
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 first:mb-10 md:first:mb-12">
      <h2 id={`${id}-heading`} className="mb-4 text-sm font-normal tracking-wide text-teal-700">
        / {id}
      </h2>
      <ul className={`space-y-2.5 border-l border-slate-200 pl-4 md:pl-5 ${id === 'projects' ? 'overflow-x-auto whitespace-nowrap pb-2' : ''}`}>
        {entries.map(entry => (
          <li key={entry.id} className="text-base leading-relaxed">
            <Link href={`/${id}/${entry.id}`} className="group rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
              <span className="font-medium text-slate-950 underline decoration-teal-700/40 decoration-1 underline-offset-[5px] transition-colors group-hover:text-teal-700 group-hover:decoration-teal-700">{entry.title}</span>
              {' '}
              <span className="text-slate-500">{entry.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
