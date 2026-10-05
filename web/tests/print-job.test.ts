import test from 'node:test';
import assert from 'node:assert/strict';
import { PrintJob } from '../src/print-job';
import { evaluate } from '../src/journey';

test('scrolling or waiting never starts a print job', () => {
  const job = new PrintJob();
  for (let i = 0; i <= 100; i++) {
    job.advance(i * 1000, true);
    assert.equal(evaluate(i / 100, job.progress).paper, 0);
  }
  assert.equal(job.status, 'idle');
});

test('one click advances the feed with elapsed time and repeated clicks cannot restart it', () => {
  const job = new PrintJob();
  job.start(); job.advance(0, true); job.advance(1000, true);
  assert.equal(job.status, 'printing'); assert.equal(job.progress, .25);
  job.start(); job.advance(2000, true);
  assert.equal(job.progress, .5);
  job.advance(4000, true);
  assert.equal(job.status, 'printed'); assert.equal(job.progress, 1);
  job.start(); job.advance(5000, true);
  assert.equal(job.progress, 1);
});

test('leaving the desk pauses the job, and returning does not skip the remaining feed', () => {
  const job = new PrintJob(); job.start(); job.advance(0, true); job.advance(1000, true);
  job.advance(1500, false); job.advance(60000, true);
  assert.equal(job.progress, .25);
  job.advance(61000, true); assert.equal(job.progress, .5);
  job.pause(); job.advance(90000, true); assert.equal(job.progress, .5);
});

test('reduced motion displays the printed result only after a click', () => {
  const job = new PrintJob(); job.finish(); assert.equal(job.progress, 0);
  job.start(true); assert.equal(job.progress, 1); assert.equal(job.status, 'printed');
});

test('printed paper is independent of forward, reverse and direct scroll seeks', () => {
  const job = new PrintJob(); job.start(true);
  for (const progress of [.9, 1, .3, 0, .8, .91, 1]) assert.equal(evaluate(progress, job.progress).paper, 1);
  assert.equal(new PrintJob().progress, 0, 'a fresh visit starts empty');
});
