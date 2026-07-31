'use client';

import { useEffect, useRef, useState } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
}

export default function FadeIn({ children, className }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0 scale-100 blur-0' : 'opacity-0 translate-y-14 scale-[0.96] blur-sm'
      } ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
