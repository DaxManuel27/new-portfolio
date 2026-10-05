import { clamp } from './journey';

export class PrintJob {
  progress = 0;
  private lastTime: number | undefined;
  readonly duration = 4000;
  get status(): 'idle' | 'printing' | 'printed' {
    return this.progress === 1 ? 'printed' : this.started ? 'printing' : 'idle';
  }
  private started = false;
  start(reducedMotion = false) {
    if (this.started) return;
    this.started = true; this.lastTime = undefined;
    if (reducedMotion) this.progress = 1;
  }
  pause() { this.lastTime = undefined; }
  finish() { if (this.started) { this.progress = 1; this.pause(); } }
  advance(now: number, visible: boolean) {
    if (!visible || this.status !== 'printing') { this.pause(); return; }
    if (this.lastTime !== undefined) this.progress = clamp(this.progress + Math.max(0, now - this.lastTime) / this.duration);
    this.lastTime = now;
  }
}
