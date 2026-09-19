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

export const EXPERIENCES: Experience[] = [
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


interface Project {
  id: string;
  title: string;
  images: string[];
  square?: boolean;
  github?: string;
  summary: string;
  description: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'rust-physics-engine',
    title: 'Rust Physics Engine',
    images: [],
    github: 'https://github.com/daxmanuel27/rust-physics-engine',
    summary: 'A physics engine written in Rust.',
    description: 'A physics engine written in Rust.',
  },
  {
    id: 'ml-framework-c',
    title: 'ML Framework in C',
    images: ['/images/MLFramework.png'],
    github: 'https://github.com/DaxManuel27/deep-learning-framework',
    summary: 'Machine learning from scratch in C.',
    description: 'Designed a machine learning framework from scratch in C, implementing forward/back-propagation, gradient descent, and activation/loss functions.',
  },
  {
    id: 'cursor-cad',
    title: 'Cursor for CAD - McHacks 13 Submission',
    images: ['/images/IMG_4652.JPG', '/images/cursorforcad.png'],
    square: true,
    github: 'https://github.com/DaxManuel27/mchacks',
    summary: 'Prompts to 3D CAD models (McHacks 2026).',
    description: 'Turning prompts into exportable 3D CAD models in under 24 hours at McHacks 2026.',
  },
  {
    id: 'vehicle-perception',
    title: 'Vehicle Perception Model',
    images: ['/images/vehicle.png'],
    github: 'https://github.com/DaxManuel27/vehicle-perception-model',
    summary: '3D vehicle detection from LiDAR data.',
    description: 'Trained a model on LiDAR data from the Waymo Open Dataset to predict 3D bounding boxes over vehicles.',
  },
  {
    id: '4bit-cpu',
    title: '4 Bit CPU',
    images: ['/images/ALU.png'],
    summary: 'A CPU and arithmetic logic unit built from scratch.',
    description: 'Designed and built a 4-bit CPU from scratch, including an Arithmetic Logic Unit (ALU) capable of performing basic arithmetic and logic operations.',
  },
  {
    id: 'spotify-cli',
    title: 'spotify-cli',
    images: ['/images/spotify-cli.png'],
    github: 'https://github.com/DaxManuel27/spotify-cli',
    summary: 'Browse music and control Spotify from the terminal.',
    description: 'Built a terminal-based Spotify client for browsing music and controlling playback from the command line.',
  },
];
