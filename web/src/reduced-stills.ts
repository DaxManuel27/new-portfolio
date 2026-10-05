/** Scroll-selected stills crossfade without moving, scaling or requiring WebGL. */
export function reducedStills(container: HTMLElement) {
  const figures = [...container.querySelectorAll<HTMLElement>('figure')];
  let viewport: HTMLDivElement | undefined;
  const step = () => innerHeight * .9;
  const top = () => container.getBoundingClientRect().top + scrollY;
  function render() {
    if (!viewport) return;
    container.style.height = `${(figures.length - 1) * step() + innerHeight * .84}px`;
    const p = Math.max(0, Math.min(figures.length - 1, (scrollY - top() + innerHeight * .08) / step()));
    const index = Math.floor(p), fade = Math.max(0, (p - index - .7) / .3);
    figures.forEach((figure, i) => {
      const opacity = i === index ? 1 - fade : i === index + 1 ? fade : 0;
      figure.style.opacity = String(opacity);
      figure.style.pointerEvents = opacity > .5 ? 'auto' : 'none';
      figure.inert = opacity <= .5;
    });
  }
  window.addEventListener('scroll', render, { passive: true });
  window.addEventListener('resize', render);
  return {
    enable(value: boolean) {
      if (value === !!viewport) return;
      document.body.classList.toggle('reduced-crossfade', value);
      if (value) {
        viewport = document.createElement('div'); viewport.className = 'still-viewport';
        viewport.append(...figures); container.append(viewport); render();
      } else {
        container.append(...figures); viewport?.remove(); viewport = undefined; container.style.height = '';
        figures.forEach(figure => { figure.style.opacity = ''; figure.style.pointerEvents = ''; figure.inert = false; });
      }
    },
    seek(id: string) {
      const index = figures.findIndex(figure => figure.id === id);
      if (viewport && index >= 0) window.scrollTo(0, top() + index * step() - innerHeight * .08);
      else document.getElementById(id)?.scrollIntoView();
    },
  };
}
