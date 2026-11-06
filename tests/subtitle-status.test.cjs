const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'injected.js'), 'utf8').replace(/\r\n/g, '\n');
function section(from, to) {
  const a = source.indexOf(from), b = source.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `missing section ${from}`); return source.slice(a, b);
}
const code = section('  // SUBTITLE EXPLANATION', '  // END SUBTITLE EXPLANATION');
function harness() {
  const nodes = new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id, { id, hidden: false, textContent: '' }); return nodes.get(id); };
  const context = vm.createContext({ document: { getElementById: node }, setUiText(element, text) { element.textContent = text; }, customSubtitleCues: [], subtitleOffsetMs: 0, subtitleRenderStatus: 'not-loaded', remotePresentation: null });
  vm.runInContext(code, context);
  return { context, node, run: text => vm.runInContext(text, context) };
}
const cues = [{ start: 10, end: 12 }, { start: 100, end: 102 }, { start: 3700, end: 3702 }];
const delay = (h, time, list = cues) => { h.context.args = [list, time]; return h.run('nextCueDelay(...args)'); };
const say = (h, status, buffering = false, nextIn = -1) => { h.context.args = [status, buffering, nextIn]; return h.run('subtitleExplanation(...args)'); };

test('the delay points at the next line and knows when the file has ended', () => {
  const h = harness();
  assert.equal(delay(h, 0), 10);
  assert.equal(delay(h, 11), 89, 'inside a line it still points at the following one');
  assert.equal(delay(h, 4000), -1);
  assert.equal(delay(h, 5, []), -1);
});

test('a delay reads the same in both languages and rounds up so it never says zero', () => {
  const h = harness();
  const format = seconds => { h.context.seconds = seconds; return h.run('formatCueDelay(seconds)'); };
  assert.equal(format(9), '0:09'); assert.equal(format(0.2), '0:01'); assert.equal(format(89), '1:29');
  assert.equal(format(3600), '1:00:00'); assert.equal(format(3725), '1:02:05');
});

test('every reason nothing is on screen is told apart', () => {
  const h = harness();
  assert.match(say(h, 'disabled'), /gizli/);
  assert.match(say(h, 'no-video'), /Video bulunamadı/);
  assert.match(say(h, 'video-offscreen'), /görünür alanda değil/);
  assert.match(say(h, 'native-requested'), /tarayıcının/);
  assert.match(say(h, 'no-active-cue', false, 89), /Sıradaki satır 1:29 sonra/);
  assert.match(say(h, 'no-active-cue', false, -1), /bitti/);
  assert.match(say(h, 'no-active-cue', true, 89), /yükleniyor/, 'a stalled video is not reported as a gap in the file');
});

test('nothing is said while a line is showing or no file is loaded', () => {
  const h = harness();
  assert.equal(say(h, 'overlay-requested'), null);
  assert.equal(say(h, 'overlay-requested', true, 5), null, 'a line on screen needs no excuse even while buffering');
  assert.equal(say(h, 'not-loaded'), null);
});

test('the panel line shows only with a loaded file and follows the media', () => {
  const h = harness(), line = h.node('pvc-sub-why');
  const video = { currentTime: 11, paused: false, readyState: 4 };
  h.context.video = video;
  h.context.subtitleRenderStatus = 'no-active-cue';
  h.run('updateSubtitleExplanation(video)');
  assert.equal(line.hidden, true, 'no file loaded');
  h.context.customSubtitleCues = cues;
  h.run('updateSubtitleExplanation(video)');
  assert.equal(line.hidden, false); assert.match(line.textContent, /1:29/);
  video.readyState = 1;
  h.run('updateSubtitleExplanation(video)');
  assert.match(line.textContent, /yükleniyor/);
  video.paused = true;
  h.run('updateSubtitleExplanation(video)');
  assert.match(line.textContent, /Sıradaki/, 'a paused video is not loading');
  h.context.subtitleRenderStatus = 'overlay-requested';
  h.run('updateSubtitleExplanation(video)');
  assert.equal(line.hidden, true);
});

test('the sync offset moves the next line with the file', () => {
  const h = harness();
  h.context.customSubtitleCues = cues; h.context.subtitleOffsetMs = 5000;
  h.context.video = { currentTime: 11, paused: false, readyState: 4 };
  h.context.subtitleRenderStatus = 'no-active-cue';
  h.run('updateSubtitleExplanation(video)');
  assert.match(h.node('pvc-sub-why').textContent, /0:04/, 'the line at 10 s now plays at 15 s');
  assert.deepEqual(JSON.parse(JSON.stringify(h.run('subtitleFrameState(video)'))), { subtitleBuffering: false, subtitleNextIn: 4 });
});

test('a panel showing an embedded player explains from numbers alone', () => {
  const h = harness();
  h.context.remotePresentation = { subtitleLoaded: true, subtitleStatus: 'no-active-cue', subtitleBuffering: false, subtitleNextIn: 30 };
  h.run('updateSubtitleExplanation(null)');
  assert.match(h.node('pvc-sub-why').textContent, /0:30/);
  h.context.remotePresentation = { subtitleLoaded: false, subtitleStatus: 'no-active-cue', subtitleBuffering: false, subtitleNextIn: 30 };
  h.run('updateSubtitleExplanation(null)');
  assert.equal(h.node('pvc-sub-why').hidden, true);
});

test('the frame protocol carries numbers only, within bounds', () => {
  const context = vm.createContext({}); context.globalThis = context;
  vm.runInContext(fs.readFileSync(path.join(root, 'frame-protocol.js'), 'utf8'), context);
  const protocol = context.NOkFrameProtocol, { state } = require('./frame-fixtures.cjs');
  assert.equal(protocol.cleanState(state({ subtitleNextIn: 94.5 })).subtitleNextIn, 94.5);
  assert.equal(protocol.cleanState(state({ subtitleNextIn: -1 })).subtitleNextIn, -1);
  assert.equal(protocol.cleanState(state({ subtitleNextIn: 'Secret line' })), null);
  assert.equal(protocol.cleanState(state({ subtitleBuffering: 'yes' })), null);
  const report = fs.readFileSync(path.join(root, 'frame-protocol.js'), 'utf8');
  assert.doesNotMatch(report.slice(report.indexOf('function cleanReport'), report.indexOf('function cleanReply')), /subtitleNextIn|subtitleBuffering/, 'it stays out of reports');
});

test('it never touches cue text, and adds no timer', () => {
  assert.doesNotMatch(code, /\.text\b|setTimeout|setInterval|requestAnimationFrame|addEventListener/);
});

test('every explanation exists in both languages', () => {
  const messages = section('const UI_MESSAGES = {', '\n  };\n');
  for (const text of ['Altyazı gizli.', 'Video bulunamadı; altyazı video gelince görünür.', 'Video görünür alanda değil; altyazı video görününce çıkar.',
    'Altyazı tarayıcının kendi oynatıcı yüzeyinde gösteriliyor.', 'Video yükleniyor; altyazı video ilerleyince görünür.',
    'Bu dosyanın satırları bitti; video dosyadan uzun olabilir.', 'Şu an satır yok. Sıradaki satır {0} sonra.']) {
    assert.ok(messages.includes(`'${text}':`), `no English for: ${text}`);
    assert.ok(code.includes(text.replace('{0}', '${formatCueDelay(nextIn)}')), `not used: ${text}`);
  }
});

function watch(selection, cueList) {
  const timers = [], calls = [];
  const context = vm.createContext({
    timers, calls, remotePresentation: null, customSubtitleCues: cueList,
    setTimeout: fn => timers.push(fn), findVideoAndPlayer: () => selection.current,
    adLifecycle: { tick() {}, stop() {} }, hasSelectedAdMarker: () => false, checkFrameLoss() {}, frameLossPanelOpen: () => false,
    monitorVideoResolution: video => calls.push(['monitor', video.name]), renderCustomSubtitleCue: video => calls.push(['render', video?.name ?? null]),
    startPeriodicPingEngine() {}, testCdnPing() {}, window: { addEventListener() {} }
  });
  vm.runInContext(section('  let adWatchTimer', '  // END AD LIFECYCLE'), context);
  vm.runInContext('startAdWatch()', context);
  return { calls, timers, fire() { timers.shift()(); } };
}

test('a video element replaced while the panel is closed keeps the subtitles', () => {
  const selection = { current: { video: { name: 'first' } } };
  const w = watch(selection, cues);
  w.fire();
  selection.current = { video: { name: 'second' } };
  w.fire();
  assert.deepEqual(w.calls, [['monitor', 'first'], ['render', 'first'], ['monitor', 'second'], ['render', 'second']]);
});

test('with no video the last line does not stay on screen', () => {
  const w = watch({ current: { video: null } }, cues);
  w.fire();
  assert.deepEqual(w.calls, [['render', null]]);
});

test('without a loaded file the ad watch does no subtitle work', () => {
  const w = watch({ current: { video: { name: 'first' } } }, []);
  w.fire();
  assert.deepEqual(w.calls, []);
});
