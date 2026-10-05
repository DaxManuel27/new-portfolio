import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${os.homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const manifest = JSON.parse(await fs.readFile('public/assets/journey.json', 'utf8'));
const captureDirectory = 'test-results/print-resume';
await fs.mkdir(captureDirectory, { recursive: true });
const errors = [], checks = [], samples = [], interactionSamples = [], pressSamples = [];

function watch(page) {
  page.on('pageerror', error => errors.push(String(error)));
}

async function ready(page) {
  await page.waitForFunction(() => window.__portfolio?.snapshot().ready && window.__portfolio.settled(), {}, { timeout: 60000 });
}

async function snapshot(page) {
  return page.evaluate(() => window.__portfolio.snapshot());
}

async function seek(page, progress) {
  await page.evaluate(value => window.__portfolio.seek(value), progress);
  await page.waitForTimeout(80);
  await ready(page);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return snapshot(page);
}

async function capture(page, name) {
  await page.screenshot({ path: `${captureDirectory}/${name}.png` });
}

async function inspectProjectedControl(page, description, focused = false) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const state = await snapshot(page), control = state.printControl;
  assert.ok(control?.visible, `${description}: physical print key has an active projection`);
  const element = await page.locator('#print-resume').evaluate(button => {
    const rect = button.getBoundingClientRect(), style = getComputedStyle(button);
    return {
      left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height,
      label: button.getAttribute('aria-label') || button.textContent.trim(),
      background: style.backgroundColor, focused: document.activeElement === button,
      outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle, boxShadow: style.boxShadow,
    };
  });
  assert.equal(element.label, 'Print Resume', `${description}: semantic key label stays Print Resume`);
  assert.ok(element.width >= 44 && element.height >= 44, `${description}: at least a 44px touch target`);
  assert.ok(Math.abs((element.left + element.right) / 2 - control.x) <= 1, `${description}: target is horizontally centered on the physical key`);
  assert.ok(Math.abs((element.top + element.bottom) / 2 - control.y) <= 1, `${description}: target is vertically centered on the physical key`);
  for (const edge of ['left', 'top', 'right', 'bottom', 'width', 'height']) {
    assert.ok(Math.abs(element[edge] - control.targetBounds[edge]) <= 1, `${description}: ${edge} agrees with the projected target`);
  }
  assert.ok(element.left <= control.keyBounds.left + 1 && element.right >= control.keyBounds.right - 1, `${description}: target covers the key horizontally`);
  assert.ok(element.top <= control.keyBounds.top + 1 && element.bottom >= control.keyBounds.bottom - 1, `${description}: target covers the key vertically`);
  assert.ok(element.left >= 0 && element.top >= 0 && element.right <= page.viewportSize().width && element.bottom <= page.viewportSize().height, `${description}: target stays within the viewport`);
  assert.equal(element.background, 'rgba(0, 0, 0, 0)', `${description}: no detached button background covers the physical key`);
  if (focused) {
    assert.equal(element.focused, true, `${description}: semantic button owns keyboard focus`);
    assert.equal(control.focused, true, `${description}: focus is connected to the physical key`);
    assert.ok((parseFloat(element.outlineWidth) > 0 && element.outlineStyle !== 'none') || element.boxShadow !== 'none', `${description}: visible focus indication around the key`);
  }
  interactionSamples.push({ description, element, control });
  return control;
}

async function dragAcrossKey(page, description) {
  const control = await inspectProjectedControl(page, description);
  await page.mouse.move(control.x, control.y);
  await page.mouse.down();
  await page.mouse.move(control.x + 35, control.y + 65, { steps: 8 });
  // Returning to the original target still produces a click in many browsers;
  // the interaction must remember that this pointer gesture was a drag.
  await page.mouse.move(control.x, control.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  assertIdle(await snapshot(page), `${description}: dragging away and back does not print`);
}

async function touchScrollAcrossKey(page, description) {
  const control = await inspectProjectedControl(page, description);
  const session = await page.context().newCDPSession(page);
  const beforeScroll = await page.evaluate(() => window.scrollY);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: control.x, y: control.y, id: 1 }] });
  for (const offset of [25, 50, 80, 110]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: control.x, y: control.y - offset, id: 1 }] });
    await page.waitForTimeout(25);
  }
  // End the gesture at rest so inertial scrolling does not race the next seek.
  await page.waitForTimeout(150);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(150);
  assertIdle(await snapshot(page), `${description}: touch scroll does not print`);
  assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - beforeScroll) > 20, `${description}: normal touch scrolling remains available`);
  await session.detach();
}

function assertIdle(state, description) {
  assert.equal(state.printStatus, 'idle', `${description}: idle job`);
  assert.equal(state.printProgress, 0, `${description}: no print progress`);
  assert.equal(state.paper, 0, `${description}: paper has not fed`);
  if (!state.staticMode) assert.equal(state.paperVisible, false, `${description}: paper mesh hidden`);
  if ('errors' in state) assert.deepEqual(state.errors, [], `${description}: no scene asset errors`);
}

function assertPrinted(state, description) {
  assert.equal(state.printStatus, 'printed', `${description}: completed job retained`);
  assert.equal(state.printProgress, 1, `${description}: completed progress retained`);
  assert.equal(state.paper, 1, `${description}: paper remains fed`);
}

async function assertImage(page, selector, filename, description) {
  const image = page.locator(selector);
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(image => image.decode());
  assert.ok((await image.getAttribute('src')).endsWith(`/assets/${filename}`), `${description}: expected image source`);
  assert.ok(await image.evaluate(image => image.naturalWidth > 0 && image.naturalHeight > 0), `${description}: image decoded`);
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  watch(page);
  await page.goto(`${url}/?review=1`);
  await ready(page);
  const { phases, totalUnits } = await page.evaluate(() => ({ phases: window.__portfolio.phases, totalUnits: window.__portfolio.totalUnits }));
  const resumeHold = phases.find(phase => phase.station === 5 && phase.kind === 'hold');
  const resumeProgress = (resumeHold.start + .5 * (resumeHold.end - resumeHold.start)) / totalUnits;
  const contactHold = phases.find(phase => phase.station === 6 && phase.kind === 'hold');
  const contactProgress = (contactHold.start + .5 * (contactHold.end - contactHold.start)) / totalUnits;
  const button = page.locator('#print-resume');

  for (const [name, viewport] of [
    ['desktop', { width: 1440, height: 960 }],
    ['portrait', { width: 390, height: 844 }],
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);
    for (const phase of phases.filter(phase => phase.station >= 5)) {
      for (const fraction of [.1, .5, .9]) {
        const state = await seek(page, (phase.start + fraction * (phase.end - phase.start)) / totalUnits);
        const description = `${name} station ${phase.station} ${phase.kind} ${fraction}`;
        assertIdle(state, description);
        const shouldShowButton = phase.station === 5 && phase.kind === 'hold';
        assert.equal(await button.isVisible(), shouldShowButton, `${description}: print control appears only at Resume hold`);
        if (shouldShowButton) {
          assert.equal(await button.isEnabled(), true, `${description}: print control enabled`);
          assert.equal((await button.textContent()).trim(), 'Print Resume');
        } else {
          await button.dispatchEvent('click');
          assertIdle(await snapshot(page), `${description}: stale activation outside the Resume hold is ignored`);
        }
        samples.push({ description, state });
      }
    }
    await seek(page, resumeProgress);
    await inspectProjectedControl(page, `${name} Resume key`);
    await dragAcrossKey(page, `${name} pointer drag`);
    await capture(page, `${name}-resume-before-print`);
    await seek(page, contactProgress);
    await capture(page, `${name}-contact-before-print`);
  }
  checks.push('Resume arrival, hold, departure, and Contact contain no paper before activation on desktop and portrait');
  checks.push('Print Resume is enabled only during the Resume hold');
  checks.push('Projected key targets cover the physical control, remain at least 44px, and suppress pointer drags on desktop and portrait');

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(250);
  const beforePrint = await seek(page, resumeProgress);
  await page.keyboard.press('Tab');
  await button.focus();
  await inspectProjectedControl(page, 'desktop keyboard focus', true);
  await capture(page, 'desktop-keyboard-focus');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => {
    const state = window.__portfolio.snapshot();
    return state.printStatus === 'printing' && state.printProgress > 0 && state.printProgress < 1;
  });
  const started = await snapshot(page);
  assert.equal((await button.textContent()).trim(), 'Print Resume', 'physical key label stays unchanged during printing');
  assert.equal(await button.isDisabled(), true, 'control is disabled while printing');
  assert.match(await page.locator('#print-status').textContent(), /print/i, 'printing status is announced');
  // A rapid second activation must not restart the in-flight job, even if a
  // stale event reaches the handler after the control becomes disabled.
  await button.dispatchEvent('click');
  await button.dispatchEvent('click');
  await page.waitForTimeout(650);
  const middle = await snapshot(page);
  assert.equal(middle.printStatus, 'printing');
  assert.ok(middle.printProgress > started.printProgress && middle.printProgress < 1, 'print advances in elapsed time without scrolling and duplicate activation does not restart it');
  assert.equal(middle.progress, beforePrint.progress, 'printing does not move the page');
  assert.ok(middle.paper > 0 && middle.paper < 1, 'paper physically feeds during printing');
  assert.equal(middle.paperVisible, true, 'paper is visible once the job begins');
  await capture(page, 'desktop-printing');
  await page.waitForFunction(() => window.__portfolio.snapshot().printStatus === 'printed', {}, { timeout: 10000 });
  const printed = await snapshot(page);
  assertPrinted(printed, 'completed job');
  await inspectProjectedControl(page, 'desktop completed key');
  assert.equal((await button.textContent()).trim(), 'Print Resume', 'physical key label stays unchanged after printing');
  assert.equal(await button.isDisabled(), true, 'completed job cannot accidentally restart');
  await button.dispatchEvent('click');
  assertPrinted(await snapshot(page), 'second click after completion');
  await capture(page, 'desktop-printed');
  checks.push('Keyboard activation starts a timed print without scrolling; repeated clicks do not restart it');
  samples.push({ description: 'print started', state: started }, { description: 'print in progress', state: middle }, { description: 'print complete', state: printed });

  for (const progress of [contactProgress, resumeProgress, .5, resumeProgress, contactProgress]) {
    const state = await seek(page, progress);
    assertPrinted(state, `return/reverse seek to ${progress}`);
  }
  await seek(page, resumeProgress);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  assertPrinted(await snapshot(page), 'resize after printing');
  await capture(page, 'portrait-printed');
  checks.push('Printed resume persists through forward navigation, reverse scrolling, direct jumps, and resize');

  await page.locator('#motion-toggle').click();
  await page.waitForFunction(() => window.__portfolio.snapshot().staticMode);
  assertPrinted(await snapshot(page), 'switch to reduced motion after printing');
  await assertImage(page, '#still-resume img', 'resume-printed.webp', 'printed static Resume');
  assert.equal(await page.locator('#still-resume [data-resume-print]').isDisabled(), true);
  await page.locator('#motion-toggle').click();
  await ready(page);
  assertPrinted(await snapshot(page), 'return from reduced motion after printing');
  checks.push('Switching to and from reduced motion retains the completed print');

  await page.reload();
  await ready(page);
  assertIdle(await snapshot(page), 'reload begins a fresh print job');
  assert.equal(await button.isEnabled(), true, 'Print Resume is available again on a fresh page');
  checks.push('Reload resets the print job to an empty printer');

  await seek(page, resumeProgress);
  await button.focus();
  await inspectProjectedControl(page, 'live Space activation key');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__portfolio.snapshot().printStatus === 'printing', {}, { timeout: 3000 });
  checks.push('Space also activates the physical semantic key');

  const pointerPage = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  watch(pointerPage);
  await pointerPage.goto(`${url}/?review=1#resume`);
  await ready(pointerPage);
  const pointerControl = await inspectProjectedControl(pointerPage, 'desktop pointer activation');
  await pointerPage.evaluate(() => {
    window.__printPressSamples = [];
    let frames = 0;
    function record() {
      const state = window.__portfolio.snapshot();
      if (state.printStatus !== 'idle') window.__printPressSamples.push({ progress: state.printProgress, pressDepth: state.printControl?.pressDepth });
      if (state.printProgress < .1 && ++frames < 600) requestAnimationFrame(record);
    }
    requestAnimationFrame(record);
  });
  await pointerPage.mouse.click(pointerControl.x, pointerControl.y);
  await pointerPage.waitForFunction(() => window.__portfolio.snapshot().printStatus === 'printing');
  await capture(pointerPage, 'desktop-key-pointer-activation');
  await pointerPage.waitForTimeout(450);
  pressSamples.push(...await pointerPage.evaluate(() => window.__printPressSamples));
  assert.ok(pressSamples.some(sample => sample.pressDepth > 0), 'physical key depresses after activation');
  assert.ok(pressSamples.every(sample => sample.pressDepth >= 0 && sample.pressDepth <= .000701), 'physical key press remains within its authored 0.7mm travel');
  assert.ok(pressSamples.some(sample => sample.progress > .045 && sample.pressDepth === 0), 'physical key releases before the rest of the feed');
  await pointerPage.close();

  const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  watch(touchPage);
  await touchPage.goto(`${url}/?review=1#resume`);
  await ready(touchPage);
  await touchScrollAcrossKey(touchPage, 'portrait touch drag');
  await seek(touchPage, resumeProgress);
  const touchControl = await inspectProjectedControl(touchPage, 'portrait touch activation');
  // Exercise the invisible padding used to provide the minimum touch target,
  // rather than requiring a phone user to hit a small printed letter or mesh.
  let touchY = touchControl.y;
  if (touchControl.targetBounds.top < touchControl.keyBounds.top - 2) touchY = (touchControl.targetBounds.top + touchControl.keyBounds.top) / 2;
  else if (touchControl.targetBounds.bottom > touchControl.keyBounds.bottom + 2) touchY = (touchControl.targetBounds.bottom + touchControl.keyBounds.bottom) / 2;
  await touchPage.touchscreen.tap(touchControl.x, touchY);
  await touchPage.waitForFunction(() => window.__portfolio.snapshot().printStatus === 'printing');
  await capture(touchPage, 'portrait-key-touch-activation');
  await touchPage.close();
  checks.push('Clicking the desktop key and tapping its portrait touch target start printing; dragging over the key scrolls without printing');

  // Hold the station response to inspect the arrival poster, which must also
  // show an empty printer before the scene assets have finished loading.
  const loadingPage = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  watch(loadingPage);
  let releaseStation;
  const stationGate = new Promise(resolve => { releaseStation = resolve; });
  await loadingPage.route(`**/${manifest.stations[5].asset}`, async route => { await stationGate; await route.continue(); });
  await loadingPage.goto(`${url}/?review=1#resume`, { waitUntil: 'domcontentloaded' });
  await loadingPage.waitForFunction(() => document.querySelector('#poster')?.getAttribute('src')?.endsWith('/assets/resume.webp'));
  assert.equal(await loadingPage.locator('#print-resume').isVisible(), false, 'physical key cannot be activated while assets are loading');
  await assertImage(loadingPage, '#poster', 'resume.webp', 'Resume loading');
  await capture(loadingPage, 'desktop-resume-loading');
  releaseStation();
  await ready(loadingPage);
  assertIdle(await snapshot(loadingPage), 'fresh page opened directly at Resume');
  await loadingPage.close();
  checks.push('Direct Resume links and loading posters show the empty printer');

  const reducedPage = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  watch(reducedPage);
  await reducedPage.goto(url);
  await reducedPage.waitForFunction(() => window.__portfolio?.snapshot().staticMode);
  assertIdle(await snapshot(reducedPage), 'fresh reduced-motion page');
  const reducedButton = reducedPage.locator('#still-resume [data-resume-print]');
  await reducedButton.scrollIntoViewIfNeeded();
  await assertImage(reducedPage, '#still-resume img', 'resume.webp', 'initial reduced-motion Resume');
  assert.equal(await reducedButton.isEnabled(), true);
  await capture(reducedPage, 'portrait-reduced-before-print');
  await reducedButton.focus();
  await reducedPage.keyboard.press('Space');
  assertPrinted(await snapshot(reducedPage), 'reduced-motion print completes immediately');
  await assertImage(reducedPage, '#still-resume img', 'resume-printed.webp', 'printed reduced-motion Resume');
  assert.equal(await reducedButton.isDisabled(), true);
  await capture(reducedPage, 'portrait-reduced-printed');
  await reducedPage.close();
  checks.push('Reduced motion supports keyboard printing and reveals the resume immediately');

  assert.deepEqual(errors, [], 'no uncaught browser errors');
  await fs.writeFile(`${captureDirectory}/report.json`, JSON.stringify({ browser: await browser.version(), checks, errors, samples, interactionSamples, pressSamples, captureDirectory }, null, 2));
  console.log(`Print Resume browser regression checks passed (${checks.length} checks).`);
} finally {
  await browser.close();
}
