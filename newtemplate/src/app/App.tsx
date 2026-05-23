import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Home, Briefcase, FolderGit2, Mail, Linkedin, Github, X, ExternalLink, Instagram } from 'lucide-react';

type Panel = 'about' | 'projects' | 'experience';

interface Project {
  id: string;
  title: string;
  meta: string;
  image?: string;
  summary: string;
  github?: string;
}

interface Experience {
  id: string;
  title: string;
  org: string;
  meta: string;
  summary?: string;
  url?: string;
}

const PROJECTS: Project[] = [
  {
    id: '4bit-cpu',
    title: '4 Bit CPU',
    meta: 'Hardware / Digital Logic',
    image: 'ALU.png',
    summary: 'Designed and built a 4-bit CPU from scratch, including an Arithmetic Logic Unit (ALU) capable of performing basic arithmetic and logic operations.',
  },
  {
    id: 'ml-framework-c',
    title: 'ML Framework in C',
    meta: 'Systems / ML',
    image: 'MLFramework.png',
    summary: 'Designed a machine learning framework from scratch in C, implementing forward/back-propagation, gradient descent, and activation/loss functions.',
    github: 'https://github.com/DaxManuel27/ml-framework-c',
  },
  {
    id: 'pytorch-meta',
    title: 'PyTorch — Meta Open Source',
    meta: 'Open Source',
    image: 'pytorch.png',
    summary: 'Contributed to writing test functions with C++ and Python, with over 4 PRs triaged by Meta maintainers.',
    github: 'https://github.com/DaxManuel27/pytorch',
  },
  {
    id: 'semantic',
    title: 'Semantic',
    meta: 'AI System Design',
    summary: 'AI system design engineer, working directly with Claude Code in the terminal to design better systems.',
    github: 'https://github.com/DaxManuel27/semantic',
  },
  {
    id: 'vehicle-perception',
    title: 'Vehicle Perception Model',
    meta: 'Computer Vision',
    image: 'vehicle.png',
    summary: 'Trained a model on LiDAR data from the Waymo Open Dataset to predict 3D bounding boxes over vehicles.',
    github: 'https://github.com/DaxManuel27/vehicle-perception',
  },
  {
    id: 'hr-system',
    title: 'HR System',
    meta: 'Software',
    summary: 'Led a team of four developing a full-stack web-based Employee Management System with Spring Boot.',
    github: 'https://github.com/DaxManuel27/hr-system',
  },
  {
    id: 'cursor-cad',
    title: 'Cursor for CAD',
    meta: 'AI / Hardware',
    summary: 'Turning prompts into exportable 3D CAD models in under 24 hours at McHacks 2026.',
    github: 'https://github.com/DaxManuel27/cursor-cad',
  },
  {
    id: 'cover-letter-gen',
    title: 'AI Cover Letter Generator',
    meta: 'AI / Productivity',
    summary: 'Generating cover letters with AI, based on your resume and job description.',
    github: 'https://github.com/DaxManuel27/cover-letter-gen',
  },
  {
    id: 'codesimplify',
    title: 'CodeSimplify',
    meta: 'Developer Tools',
    summary: 'Created a Chrome extension that explains any requested snippets of code on GitHub.',
    github: 'https://github.com/DaxManuel27/codesimplify',
  },
  {
    id: 'soccer-predictor',
    title: 'Soccer Match Predictor',
    meta: 'ML / Sports',
    summary: 'Trained a model with Scikit-learn to predict Premier League soccer matches.',
    github: 'https://github.com/DaxManuel27/soccer-predictor',
  },
];

const EXPERIENCES: Experience[] = [
  {
    id: 'ultra-maritime',
    title: 'Software Engineer Intern',
    org: 'Ultra Maritime',
    meta: 'Summer 2026',
    summary: '',
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
    summary: 'hackatlantic.ca',
    url: 'https://hackatlantic.ca',
  },
];

interface HeatmapDay {
  date: string;
  count: number;
  level: number;
}

function GitHubHeatmap() {
  const [weeks, setWeeks] = useState<(HeatmapDay | null)[][]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://github-contributions-api.jogruber.de/v4/DaxManuel27?y=last');
        let { contributions }: { contributions: HeatmapDay[] } = await res.json();
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 4);
        contributions = contributions.filter(d => new Date(d.date) >= cutoff);
        const firstDow = new Date(contributions[0].date).getDay();
        const cells: (HeatmapDay | null)[] = [...Array(firstDow).fill(null), ...contributions];
        const w: (HeatmapDay | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
        setWeeks(w);
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  if (failed) return null;
  if (!weeks.length) return <div className="text-xs text-gray-400 text-center py-4">Loading contributions…</div>;

  const colors = ['#e8e8e8', '#c0c0c0', '#888888', '#484848', '#0f0f0f'];

  return (
    <div className="mt-8">
      <div className="text-xs text-gray-400 tracking-widest uppercase text-center mb-3 font-mono">GitHub contributions</div>
      <div className="overflow-x-auto flex justify-center">
        <div className="flex gap-[2px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {[...week, ...Array(7 - week.length).fill(null)].map((day, di) => (
                <div
                  key={di}
                  style={{ background: colors[day ? day.level : 0] }}
                  className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0"
                  title={day && day.count > 0 ? `${day.date}: ${day.count} contribution${day.count !== 1 ? 's' : ''}` : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-gray-300">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

export default function App() {
  const [panel, setPanel] = useState<Panel>('about');
  const [modal, setModal] = useState<Project | Experience | null>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const navItems: { id: Panel; label: string; icon: ReactNode }[] = [
    { id: 'about', label: 'About', icon: <Home size={18} /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 size={18} /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase size={18} /> },
  ];

  const isProject = (item: Project | Experience): item is Project => 'summary' in item && !('org' in item);

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col items-center text-center">
            <img
              src="images/headshot.png"
              alt="Dax Manuel"
              className="w-16 h-16 rounded-full mb-3 object-cover object-top"
            />
            <h2 className="font-semibold text-gray-900">Dax Manuel</h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">Software Eng + Math · UNB</p>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-6">
          <nav>
            <ul className="space-y-1">
              {navItems.map(({ id, label, icon }) => (
                <li key={id}>
                  <button
                    onClick={() => setPanel(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      panel === id
                        ? 'bg-white text-gray-900 font-medium shadow-sm'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-3 font-mono">Connect</div>
            <div className="flex flex-col gap-1">
              <a href="mailto:dax.manuel@unb.ca" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 text-gray-600 text-sm transition-colors">
                <Mail size={15} />
                dax.manuel@unb.ca
              </a>
              <a href="https://linkedin.com/in/nikolasdaxmanuel" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 text-gray-600 text-sm transition-colors">
                <Linkedin size={15} />
                LinkedIn
              </a>
              <a href="https://github.com/DaxManuel27" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 text-gray-600 text-sm transition-colors">
                <Github size={15} />
                GitHub
              </a>
              <a href="https://instagram.com/bydaxmanuel" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 text-gray-600 text-sm transition-colors">
                <Instagram size={15} />
                Instagram
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 text-gray-600 text-sm transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px]"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03Z"/></svg>
                Discord
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-10">

          {/* About */}
          {panel === 'about' && (
            <div>
              {/* Hero: text left, tall photo right */}
              <div className="flex items-start gap-10 mb-10">
                <div className="flex-1 min-w-0">
                  <h1 className="text-9xl font-bold text-gray-900 leading-tight mb-4">Dax Manuel</h1>
                  <p className="text-xl text-gray-700 leading-snug mb-5">
                    {/* Software Engineer, Founder, and Content Creator. */}
                    Software Engineer and Founder.
                  </p>
                  <p className="text-gray-500 leading-relaxed mb-6 max-w-lg">
                    Software Engineering Student at UNB with a Minor in Math. My interests are in all disciplines of software, hardware, and AI. Feel free to reach out to me about anything. 

                  </p>
                  <p className="text-gray-500 leading-relaxed mb-6 max-w-lg">
                    Outside of that, I am into health, lifting, running, travelling, and sports.
                  </p>
                </div>
                <img
                  src="images/headshot.png"
                  alt="Dax Manuel"
                  className="w-72 rounded-2xl object-cover object-top flex-shrink-0"
                  style={{ height: '360px' }}
                />
              </div>

              {/* What I'm Doing */}
              <div className="mt-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-5">What I'm Doing</h2>
                <div className="flex gap-4">
                  {/* Column 1 */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                      <img src="images/Ultra-Maritime-site-Logo.png" alt="Ultra Maritime" className="w-full h-auto object-contain p-6" />
                      <div className="p-4">
                        <div className="font-medium text-gray-900 text-base leading-snug">Software Engineering Intern</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">Ultra Maritime · Summer 2026</div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                      <img src="images/unb-formula-logo.png" alt="UNB Formula Racing" className="w-full h-auto object-contain" />
                      <div className="p-4">
                        <div className="font-medium text-gray-900 text-base leading-snug">Electrical Project Lead</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">UNB Formula Racing · Sep 2025–</div>
                      </div>
                    </div>
                  </div>
                  {/* Column 2 */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                      <img src="images/hackatlanticSS.png" alt="Hack Atlantic" className="w-full h-96 object-cover" />
                      <div className="p-4">
                        <div className="font-medium text-gray-900 text-base leading-snug">Founder</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">Hack Atlantic · Apr 2026–</div>
                      </div>
                    </div>
                    {/* Content Creator card — re-enable in ~1 week
                    <a href="https://instagram.com/bydaxmanuel" target="_blank" rel="noopener" className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                      <img src="images/Instagram_logo_2016.svg.png" alt="Instagram" className="w-full h-auto object-cover" />
                      <div className="p-4">
                        <div className="font-medium text-gray-900 text-base leading-snug">Content Creator</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">@bydaxmanuel · Instagram</div>
                      </div>
                    </a>
                    */}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Projects */}
          {panel === 'projects' && (
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-8">Projects</h1>
              <div className="flex gap-6">
                {[PROJECTS.filter((_, i) => i % 2 === 0), PROJECTS.filter((_, i) => i % 2 !== 0)].map((col, ci) => (
                  <div key={ci} className="flex-1 flex flex-col gap-6">
                    {col.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setModal(p)}
                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all text-left"
                      >
                        <div className="bg-gray-50 flex items-center justify-center overflow-hidden">
                          {p.image
                            ? <img src={p.image} alt={p.title} className="w-full h-auto object-contain" />
                            : <div className="h-48 w-full flex items-center justify-center"><PlaceholderIcon /></div>
                          }
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100">
                          <div className="text-base font-medium text-gray-900 leading-tight">{p.title}</div>
                          <div className="text-xs text-gray-400 font-mono mt-1">{p.meta}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {panel === 'experience' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Experience</h1>
              <div className="divide-y divide-gray-100">
                {EXPERIENCES.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setModal(e)}
                    className="w-full flex items-center gap-4 py-4 px-2 hover:pl-5 transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                      <Briefcase size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-medium text-gray-900">{e.title} · {e.org}</div>
                      <div className="text-[12px] text-gray-400 mt-0.5">{e.meta}</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal */}
      {modal && (
        <div
          ref={scrimRef}
          onClick={e => { if (e.target === scrimRef.current) setModal(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="w-[min(600px,calc(100vw-48px))] max-h-[calc(100vh-64px)] bg-white rounded-2xl overflow-auto shadow-2xl p-8">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {'org' in modal ? `${modal.title} · ${(modal as Experience).org}` : modal.title}
                </h3>
                <div className="text-[10.5px] font-mono tracking-widest text-gray-400 uppercase mt-1">{modal.meta}</div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X size={13} />
              </button>
            </div>

            {'image' in modal && modal.image && (
              <img
                src={modal.image}
                alt={modal.title}
                className="w-full max-h-52 object-cover rounded-xl mb-4"
              />
            )}

            {'summary' in modal && modal.summary && (
              <p className="text-[14.5px] text-gray-700 leading-relaxed mb-3">
                {'url' in modal && modal.url
                  ? <a href={(modal as Experience).url} target="_blank" rel="noopener" className="underline underline-offset-2">{modal.summary}</a>
                  : modal.summary
                }
              </p>
            )}

            {'github' in modal && modal.github && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-[90px_1fr] gap-4 text-[13.5px]">
                  <div className="text-[10.5px] font-mono tracking-widest text-gray-400 uppercase pt-0.5">GitHub</div>
                  <a
                    href={(modal as Project).github}
                    target="_blank"
                    rel="noopener"
                    className="text-gray-900 underline underline-offset-2 flex items-center gap-1"
                  >
                    {(modal as Project).github!.replace('https://', '')}
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
