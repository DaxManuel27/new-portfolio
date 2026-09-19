import EntryPage from '../../EntryPage';
import { EXPERIENCES } from '../../portfolio-data';

const entry = EXPERIENCES.find(entry => entry.id === 'unb-formula')!;

export const metadata = { title: `${entry.org} | Dax Manuel` };

export default function Page() {
  return <EntryPage section="experience" title={entry.org} description={entry.title} meta={entry.meta} url={entry.url} />;
}
