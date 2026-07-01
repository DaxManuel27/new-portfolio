import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dax Manuel',
  description:
    'Software Engineer and Founder. Software Engineering student at UNB with a minor in Math, interested in software, hardware, and AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
