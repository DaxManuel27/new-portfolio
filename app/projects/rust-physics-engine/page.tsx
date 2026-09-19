import EntryPage from '../../EntryPage';
import { PROJECTS } from '../../portfolio-data';

const entry = PROJECTS.find(entry => entry.id === 'rust-physics-engine')!;

export const metadata = { title: `${entry.title} | Dax Manuel` };

export default function Page() {
  return <EntryPage section="projects" title={entry.title} description={entry.description} url={entry.github} images={entry.images} />;
}
