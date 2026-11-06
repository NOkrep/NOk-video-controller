const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'injected.js'), 'utf8').replace(/\r\n/g, '\n');
const css = fs.readFileSync(path.join(root, 'injected.css'), 'utf8').replace(/\r\n/g, '\n');
function section(from, to) {
  const a = source.indexOf(from), b = source.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `missing section ${from}`); return source.slice(a, b);
}
const watchCode = section('  // FRAME LOSS WATCH', '  // END FRAME LOSS WATCH');

function harness() {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { id, style: {}, checked: false, textContent: '', querySelector: child => node(child.slice(1)) });
    return nodes.get(id);
  };
  const context = vm.createContext({
    document: { hidden: false, getElementById: node },
    hudAccessibility: { reduceMotion: false },
    videoFilterState: { brightness: 100, contrast: 100, saturate: 100, nightShield: false, invert: false },
    remotePresentation: null, remoteSourceSession: null,
    adLifecycle: { isActive: () => false },
    tokens: new Map(),
    remoteIdentityToken(object) { if (!context.tokens.has(object)) context.tokens.set(object, context.tokens.size + 1); return context.tokens.get(object); },
    calls: [],
    setUiText(element, text) { element.textContent = text; },
    clampPopupToViewport() { context.calls.push('clamp'); },
    refreshUiAccessibility() { context.calls.push('refresh'); },
    syncHudPreferences() { context.calls.push('sync'); },
    resetVideoFilters() { context.calls.push('reset'); context.videoFilterState = { brightness: 100, contrast: 100, saturate: 100, nightShield: false, invert: false }; },
    publishRemoteSourceState() { context.calls.push('publish'); },
    remoteControl(name, value) { context.calls.push(`remote:${name}:${value}`); }
  });
  vm.runInContext(watchCode, context);
  const run = code => vm.runInContext(code, context);
  return { context, run, node };
}
function playingVideo() {
  const video = { paused: false, ended: false, seeking: false, readyState: 4, playbackRate: 1, total: 0, dropped: 0 };
  video.getVideoPlaybackQuality = () => ({ totalVideoFrames: video.total, droppedVideoFrames: video.dropped });
  return video;
}
// One panel tick is 750 ms: 18 frames at 24 fps.
function tick(h, video, dropped = 0, frames = 18) {
  video.total += frames; video.dropped += dropped;
  h.context.video = video;
  return h.run('checkFrameLoss(video)');
}
const ticks = (h, video, count, dropped = 0, frames = 18) => { for (let i = 0; i < count; i++) tick(h, video, dropped, frames); };
const pending = h => h.run('frameLossOffer()') !== null;
const FIRST_SAMPLE = 1, TICKS_PER_WINDOW = 4, WINDOWS = 4;

test('a sustained loss asks only once it has lasted four full windows', () => {
  const h = harness(), video = playingVideo();
  ticks(h, video, FIRST_SAMPLE);
  ticks(h, video, TICKS_PER_WINDOW * WINDOWS - 1, 6);
  assert.equal(pending(h), false, 'one tick before the fourth window closes');
  tick(h, video, 6);
  assert.equal(pending(h), true);
  assert.deepEqual(h.context.calls.filter(call => call !== 'clamp'), [], 'asking changes nothing by itself');
  assert.equal(h.context.hudAccessibility.reduceMotion, false);
});

test('bursty loss with clean windows between still asks', () => {
  const h = harness(), video = playingVideo();
  ticks(h, video, FIRST_SAMPLE);
  for (let round = 0; round < WINDOWS / 2; round++) {
    ticks(h, video, TICKS_PER_WINDOW, 9); // Half the frames lost.
    ticks(h, video, TICKS_PER_WINDOW, 0);
  }
  assert.equal(pending(h), true, 'measured overload alternated like this and went unasked under a strict streak');
});

test('a single burst or light loss never asks', () => {
  const h = harness(), video = playingVideo();
  ticks(h, video, FIRST_SAMPLE);
  for (let round = 0; round < 4; round++) {
    ticks(h, video, TICKS_PER_WINDOW, 18); // A whole window lost, as after a quality change.
    ticks(h, video, TICKS_PER_WINDOW * WINDOWS, 0);
  }
  assert.equal(pending(h), false, 'one bad window among four is a stutter');
  ticks(h, video, TICKS_PER_WINDOW * WINDOWS * 2, 1); // About 5.5%: above the normal 0-3% but not sustained trouble.
  assert.equal(pending(h), false);
  ticks(h, video, TICKS_PER_WINDOW * WINDOWS * 2, 2, 2); // Too few frames to judge: a stalled or slideshow source.
  assert.equal(pending(h), false);
});

for (const [name, change] of [
  ['paused', video => { video.paused = true; }], ['seeking', video => { video.seeking = true; }], ['ended', video => { video.ended = true; }],
  ['fast speed', video => { video.playbackRate = 2.5; }]
]) test(`${name} playback restarts the count: lost frames there are expected`, () => {
  const h = harness(), video = playingVideo();
  ticks(h, video, FIRST_SAMPLE);
  ticks(h, video, TICKS_PER_WINDOW * WINDOWS - 1, 6);
  const restore = { ...video };
  change(video); tick(h, video, 6);
  Object.assign(video, { paused: restore.paused, seeking: restore.seeking, ended: restore.ended, readyState: restore.readyState, playbackRate: restore.playbackRate });
  tick(h, video, 6);
  assert.equal(pending(h), false);
});

test('buffering counts as neither good nor bad evidence', () => {
  const h = harness(), video = playingVideo();
  ticks(h, video, FIRST_SAMPLE);
  ticks(h, video, TICKS_PER_WINDOW * WINDOWS - 1, 6);
  assert.equal(pending(h), false);
  video.readyState = 2; ticks(h, video, TICKS_PER_WINDOW * 3, 0);
  assert.equal(pending(h), false, 'no window closes while it buffers');
  video.readyState = 4; tick(h, video, 6);
  assert.equal(pending(h), true, 'the same loss resumes where it was');
});

test('a hidden tab, a running ad and a replaced source do not count', () => {
  for (const interrupt of [
    h => { h.context.document.hidden = true; },
    h => { h.context.adLifecycle.isActive = () => true; }
  ]) {
    const h = harness(), video = playingVideo();
    ticks(h, video, FIRST_SAMPLE);
    ticks(h, video, TICKS_PER_WINDOW * WINDOWS - 1, 6);
    interrupt(h); tick(h, video, 6);
    h.context.document.hidden = false; h.context.adLifecycle.isActive = () => false;
    tick(h, video, 6);
    assert.equal(pending(h), false);
  }
  const h = harness(), video = playingVideo();
  ticks(h, video, FIRST_SAMPLE);
  ticks(h, video, TICKS_PER_WINDOW * WINDOWS - 1, 6);
  ticks(h, playingVideo(), 1, 6);
  assert.equal(pending(h), false, 'another element');
  const replaced = harness(), counters = playingVideo();
  ticks(replaced, counters, FIRST_SAMPLE);
  ticks(replaced, counters, TICKS_PER_WINDOW * WINDOWS - 1, 6);
  counters.total = 18; counters.dropped = 0; // A new source restarts the browser's counters.
  replaced.context.video = counters; replaced.run('checkFrameLoss(video)');
  assert.equal(pending(replaced), false);
});

test('a browser without counters never asks', () => {
  const h = harness(), video = playingVideo();
  delete video.getVideoPlaybackQuality;
  ticks(h, video, TICKS_PER_WINDOW * WINDOWS * 2, 6);
  assert.equal(pending(h), false);
  const zero = harness(), hidden = playingVideo();
  hidden.getVideoPlaybackQuality = () => ({ totalVideoFrames: 0, droppedVideoFrames: 0 }); // Fingerprinting protection.
  ticks(zero, hidden, TICKS_PER_WINDOW * WINDOWS * 2, 6);
  assert.equal(pending(zero), false);
});

function asked(setup = () => {}) {
  const h = harness(), video = playingVideo();
  setup(h);
  ticks(h, video, FIRST_SAMPLE + TICKS_PER_WINDOW * WINDOWS, 6);
  return { h, video };
}

test('the question says exactly what yes will change', () => {
  assert.match(asked().h.run('frameLossOffer()'), /animasyonları kapatılsın mı/);
  const withFilters = asked(h => { h.context.videoFilterState.brightness = 120; }).h.run('frameLossOffer()');
  assert.match(withFilters, /animasyonları kapatılsın/); assert.match(withFilters, /filtreleri sıfırlansın/);
  const onlyFilters = asked(h => { h.context.hudAccessibility.reduceMotion = true; h.context.videoFilterState.nightShield = true; }).h.run('frameLossOffer()');
  assert.doesNotMatch(onlyFilters, /animasyon/); assert.match(onlyFilters, /filtreleri sıfırlansın/);
});

test('with nothing left to reduce it does not ask', () => {
  const { h } = asked(h => { h.context.hudAccessibility.reduceMotion = true; });
  assert.equal(pending(h), false);
});

test('a choice made while the question is open updates or withdraws it', () => {
  const { h, video } = asked();
  assert.equal(pending(h), true);
  h.context.hudAccessibility.reduceMotion = true;
  tick(h, video, 6);
  assert.equal(h.node('pvc-frame-loss-notice').style.display, 'none');
});

test('no is final on this page, however bad the loss stays', () => {
  const { h, video } = asked();
  h.run('answerFrameLoss(false)');
  assert.equal(h.context.hudAccessibility.reduceMotion, false, 'no changes nothing');
  assert.deepEqual(h.context.calls.filter(call => call !== 'clamp'), []);
  ticks(h, video, TICKS_PER_WINDOW * WINDOWS * 3, 6);
  assert.equal(pending(h), false);
  assert.equal(h.node('pvc-frame-loss-notice').style.display, 'none');
});

test('yes reduces motion through the existing setting and resets only active filters', () => {
  const plain = asked().h;
  plain.run('answerFrameLoss(true)');
  assert.equal(plain.context.hudAccessibility.reduceMotion, true);
  assert.equal(plain.node('pvc-a11y-reduceMotion').checked, true, 'the settings switch shows the new state');
  assert.deepEqual(plain.context.calls.filter(call => call !== 'clamp'), ['refresh', 'sync']);
  const filtered = asked(h => { h.context.videoFilterState.invert = true; }).h;
  filtered.run('answerFrameLoss(true)');
  assert.deepEqual(filtered.context.calls.filter(call => call !== 'clamp'), ['refresh', 'sync', 'reset']);
  assert.equal(pending(filtered), false);
});

test('only an open panel counts as measuring, including one hidden while idle', () => {
  const h = harness(), popup = h.node('pvc-controller-popup');
  assert.equal(h.run('frameLossPanelOpen()'), false, 'never opened');
  popup.style.display = 'block';
  assert.equal(h.run('frameLossPanelOpen()'), true);
  popup.style.display = 'none';
  assert.equal(h.run('frameLossPanelOpen()'), false, 'closed after a press: the ad watch runs but frames are not read');
  h.context.remoteSourceSession = 'a'.repeat(32);
  assert.equal(h.run('frameLossPanelOpen()'), true, 'the frame behind a visible panel');
  const counted = harness(), video = playingVideo();
  let reads = 0; const read = video.getVideoPlaybackQuality;
  video.getVideoPlaybackQuality = () => { reads++; return read(); };
  counted.context.video = video;
  counted.run('checkFrameLoss(frameLossPanelOpen() ? video : null)');
  assert.equal(reads, 0);
});

test('closing the panel withdraws an unanswered question without counting as no', () => {
  const { h, video } = asked();
  h.run('clearFrameLossOffer()');
  assert.equal(pending(h), false);
  ticks(h, video, FIRST_SAMPLE + TICKS_PER_WINDOW * WINDOWS, 6);
  assert.equal(pending(h), true, 'it may ask again after measuring afresh');
});

test('an embedded player measures in its own frame and the visible panel asks', () => {
  const session = 'a'.repeat(32);
  const sourceFrame = harness();
  sourceFrame.context.remoteSourceSession = session;
  const video = playingVideo();
  ticks(sourceFrame, video, FIRST_SAMPLE + TICKS_PER_WINDOW * WINDOWS, 6);
  assert.deepEqual(sourceFrame.context.calls.filter(call => call === 'publish'), ['publish'], 'an idle panel still learns of it');
  assert.equal(sourceFrame.run('frameLossState()'), true);

  const top = harness();
  top.context.remotePresentation = { frameLoss: true };
  assert.equal(pending(top), true);
  top.run('answerFrameLoss(false)');
  assert.deepEqual(top.context.calls.filter(call => call !== 'clamp'), ['remote:frame-loss-answered:true']);
  assert.equal(pending(top), false, 'the frame state arriving later does not reopen it');

  sourceFrame.run('frameLossAnswered = true; frameLossPending = false');
  assert.equal(sourceFrame.run('frameLossState()'), false);
  ticks(sourceFrame, video, TICKS_PER_WINDOW * WINDOWS * 2, 6);
  assert.equal(sourceFrame.run('frameLossState()'), false);
});

test('it adds no timer, no CPU or memory read and nothing to reports', () => {
  assert.doesNotMatch(watchCode, /setTimeout|setInterval|requestAnimationFrame|hardwareConcurrency|deviceMemory|performance\.memory|localStorage|sessionStorage|fetch\(/);
  const adWatch = section('  function startAdWatch()', '  function armPage()');
  assert.match(adWatch, /checkFrameLoss\(frameLossPanelOpen\(\) \? selection\.video : null\)/, 'the existing tick, no extra discovery');
  assert.doesNotMatch(section('  function startQualityWatch()', '  function updateVideoTargetControls()'), /FrameLoss/);
  const report = section('function buildDiagnosticPayload', '\n  }\n');
  assert.doesNotMatch(report, /frameLoss/i);
  const protocol = fs.readFileSync(path.join(root, 'frame-protocol.js'), 'utf8');
  assert.doesNotMatch(protocol.slice(protocol.indexOf('function cleanReport'), protocol.indexOf('function cleanReply')), /frameLoss/i);
});

test('the frame protocol carries only a yes-or-no state and answer', () => {
  const context = vm.createContext({ globalThis: {} });
  context.globalThis = context;
  vm.runInContext(fs.readFileSync(path.join(root, 'frame-protocol.js'), 'utf8'), context);
  const protocol = context.NOkFrameProtocol, { state, owner } = require('./frame-fixtures.cjs');
  assert.equal(protocol.cleanState(state({ frameLoss: true })).frameLoss, true);
  assert.equal(protocol.cleanState(state({ frameLoss: 0.3 })), null, 'never a measured value');
  assert.equal(protocol.cleanCommand({ name: 'frame-loss-answered', owner, revision: 1, value: true }).value, true);
  assert.equal(protocol.cleanCommand({ name: 'frame-loss-answered', owner, revision: 1, value: 'yes' }), null);
});

test('the report motion keeps its source timing and respects reduced motion', () => {
  const rule = selector => {
    const at = css.indexOf(selector + ' {'); assert.ok(at >= 0, `missing ${selector}`);
    return css.slice(at, css.indexOf('}', at));
  };
  assert.match(rule('#pvc-error-modal .pvc-check-input:checked + .pvc-check-visual polyline'), /transition: stroke-dashoffset 0\.2s linear 0\.15s/);
  assert.match(rule('#pvc-error-modal .pvc-check-visual::before'), /width: 48px[\s\S]*height: 48px/);
  const frame = rule('#pvc-error-modal .pvc-feedback-frame::before,\n#pvc-error-modal .pvc-feedback-frame::after');
  assert.match(frame, /transform: scaleX\(0\)/);
  assert.match(frame, /transition: transform/, 'only the compositor-friendly property moves');
  const reduced = css.slice(css.lastIndexOf('.pvc-a11y-reduce-motion .pvc-check-visual::before') - 40);
  assert.match(reduced, /pvc-feedback-frame::before/);
  assert.match(reduced, /pvc-feedback-frame::after/);
  assert.match(css, /@media \(hover: hover\)[^}]*\.pvc-report-field:hover \.pvc-check-visual::before/, 'a touch does not leave the halo on');
});
