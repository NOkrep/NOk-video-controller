const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const source = readFileSync(join(__dirname, '..', 'injected.js'), 'utf8');
const content = readFileSync(join(__dirname, '..', 'content.js'), 'utf8');
function section(from, to) {
  const a = source.indexOf(from), b = source.indexOf(to, a);
  assert.ok(a >= 0 && b > a);
  return source.slice(a, b);
}

function harness(host = 'example.invalid') {
  const listeners = {}, timers = new Map(), logs = [], toasts = [], requests = [];
  let timerId = 0;
  const window = {};
  const video = {
    tagName: 'VIDEO', parentElement: null, readyState: 4, networkState: 2, isConnected: true,
    playbackRate: 1, defaultPlaybackRate: 1, currentTime: 90, videoHeight: 1080,
    paused: false, ended: false, currentSrc: 'blob:https://example.invalid/PRIVATE_UUID',
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    emit: type => { for (const fn of listeners[type] || []) fn(); }
  };
  video.ownerDocument = { defaultView: window };
  const dummy = name => ({ name, tier: 1, matches: () => false, getQualities: () => [] });
  const context = vm.createContext({
    navigator: { language: 'tr' },
    window, video, HOSTNAME: host, activePlayer: null,
    document: { addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null },
    performance: { now: () => 500, getEntriesByType: () => [] },
    URL, AbortController,
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
    showToast: text => toasts.push(text),
    addDiagnosticLog: (level, event, details) => logs.push({ level, event, details }),
    detectDrmStatus: media => ({ isDrm: media?.drm === true }),
    findVideoAndPlayer: () => ({ video, player: context.activePlayer }),
    updateCollapsedSummaryBar() {},
    PuhuTvAdapter: dummy('PuhuTvAdapter'), KickAdapter: dummy('KickAdapter'), NowTvAdapter: dummy('NowTvAdapter'),
    targetTrtQualitySuffix: null, lastCapturedTrtStreamUrl: '',
    userForcedAdapterName: '', currentActiveAdapterName: 'GenericAdapter', adapterHealthStatus: 'healthy',
    cachedDiscoveredQualities: [], activeForcedQualityId: '', activeForcedQualityLabel: '',
    pendingQualityLabel: '', pendingQualityHeight: 0, pendingTimeoutTimer: null,
    fetch: async (url, options) => { requests.push({ url, options }); return { ok: true }; }
  });
  vm.runInContext(section('  const UI_MESSAGES', '  // END UI LOCALIZATION')
    + section('  const mediaLibraryBindings', '  function hookIvsInstance')
    + section('  const TrtAdapter', '  function updateCollapsedSummaryBar')
    + section('  function parseTimecodeToSeconds', '  function shiftSubtitleSync')
    + section('  function diagnosticNumber', '  function addDiagnosticLog')
    + section('  let targetEnforcedPlaybackRate', '  function initAudioGraphForVideo')
    + section('  function requestQuality', '  function cycleNextQuality')
    + section('  let periodicPingTimer', '  function startPeriodicPingEngine'), context);
  const run = code => vm.runInContext(code, context);
  const json = code => JSON.parse(run(`JSON.stringify(${code})`));
  const flush = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); };
  return { context, window, video, run, json, flush, timers, logs, toasts, requests };
}

test('standard SRT arrow whitespace and comma timestamps produce real cues', () => {
  const h = harness();
  h.context.subtitle = '1\r\n00:00:01,000 --> 00:00:03,500\r\nMerhaba\r\n\r\n2\r\n00:00:04,000 --> 00:00:05,000\r\nDünya';
  assert.deepEqual(h.json('parseSrtOrVttContent(subtitle)'), [
    { start: 1, end: 3.5, text: 'Merhaba' }, { start: 4, end: 5, text: 'Dünya' }
  ]);
});

test('WebVTT handles BOM, IDs, settings and excludes NOTE/STYLE metadata', () => {
  const h = harness();
  h.context.subtitle = '\uFEFFWEBVTT\n\nNOTE not a cue\n00:01.000 --> 00:03.000\nIgnore\n\nSTYLE\n::cue { color: white }\n\ncue-id\n00:04.000 --> 00:06.500 align:start position:10%\n<b>İki</b>\nSatır';
  assert.deepEqual(h.json('parseSrtOrVttContent(subtitle)'), [{ start: 4, end: 6.5, text: 'İki\nSatır' }]);
});

test('subtitle parser rejects empty/malformed/reversed timings and sorts cues', () => {
  const h = harness();
  h.context.subtitle = '1\n00:00:90,000 --> 00:02:00,000\nInvalid\n\n2\n00:00:05,000 --> 00:00:04,000\nReverse\n\n3\n00:00:03,000 --> 00:00:04,000\nLater\n\n4\n00:00:01,000 --> 00:00:02,000\nFirst';
  assert.deepEqual(h.json('parseSrtOrVttContent(subtitle)').map(cue => cue.start), [1, 3]);
  assert.equal(h.json('parseSrtOrVttContent("not a subtitle")').length, 0);
});

test('Video.js parent instance survives cascade selection without global first-player fallback', () => {
  const h = harness();
  const qualityLevels = [{ height: 720, enabled: true }, { height: 1080, enabled: true }];
  const player = { currentTime() {}, playbackRate() {}, qualityLevels: () => qualityLevels };
  h.video.parentElement = { player };
  h.context.activePlayer = player;
  assert.equal(h.run('getActiveAdapter(video, activePlayer).name'), 'VideoJsAdapter');
  const q = h.json('discoverStreamQualities()');
  assert.equal(q.length, 2);
  assert.equal(h.run('VideoJsAdapter.applyQuality({ index: 0 }, video, activePlayer)'), true);
  assert.deepEqual(qualityLevels.map(level => level.enabled), [true, false]);
  assert.equal(h.run('VideoJsAdapter.applyQuality({ index: 99 }, video, activePlayer)'), false);
  assert.deepEqual(qualityLevels.map(level => level.enabled), [true, false]);
});

test('Hls direct instance is not mistaken for Video.js and wrong-video instances are rejected', () => {
  const h = harness();
  const hls = { media: h.video, levels: [{ height: 1080 }, { height: 720 }] };
  h.video.hls = hls; h.context.activePlayer = hls;
  assert.equal(h.run('getActiveAdapter(video, activePlayer).name'), 'HlsJsAdapter');
  assert.equal(h.run('HlsJsAdapter.applyQuality({ index: 1 }, video, activePlayer)'), true);
  assert.equal(hls.currentLevel, 1);
  hls.media = {};
  assert.equal(h.run('findLibraryPlayer(video, "hls", activePlayer)'), null);
});

test('Hls attach hook preserves return value, captures instance and is idempotent', () => {
  const h = harness();
  class Hls { constructor() { this.levels = [{ height: 720 }]; } attachMedia(media) { this.media = media; return 'original-result'; } }
  h.window.Hls = Hls;
  h.run('hookMediaLibraries()'); const first = Hls.prototype.attachMedia;
  h.run('hookMediaLibraries()'); assert.equal(Hls.prototype.attachMedia, first);
  const instance = new Hls(); assert.equal(instance.attachMedia(h.video), 'original-result');
  assert.equal(h.run('findLibraryPlayer(video, "hls")'), instance);
  instance.media = null;
  assert.equal(h.run('findLibraryPlayer(video, "hls")'), null);
});

test('Hls single unknown resolution uses observed label without inventing manifest height', () => {
  const h = harness(); h.video.videoHeight = 720;
  const hls = { media: h.video, currentLevel: 0, levels: [{ height: 0, name: '', attrs: {} }] };
  h.video.hls = hls;
  const qualities = h.json('HlsJsAdapter.getQualities(video, null)');
  assert.equal(qualities.length, 1);
  assert.equal(qualities[0].label, '720p · oynatılan');
  assert.equal(qualities[0].height, 0);
  assert.equal(qualities[0].resolutionSource, 'observed-video');
});

test('Hls labels prefer declared resolution and do not copy active dimensions to other levels', () => {
  const h = harness(); h.video.videoHeight = 720;
  h.video.hls = { media: h.video, currentLevel: 0, levels: [
    { height: 0 }, { height: 0, attrs: { RESOLUTION: '1920x1080' } },
    { height: 0, name: 'PRIVATE_NAME' }, { height: 0, bitrate: 2500000 }
  ] };
  const qualities = h.json('HlsJsAdapter.getQualities(video, null)');
  assert.deepEqual(qualities.map(q => q.label), ['1080p', '720p · oynatılan', 'Seviye 3', '2.5 Mb/sn']);
  assert.equal(qualities.filter(q => q.resolutionSource === 'observed-video').length, 1);
  assert.equal(qualities.some(q => q.label === 'p' || q.label === 'undefinedp' || q.label.includes('PRIVATE_NAME')), false);
});

test('Hls late manifest events refresh inventory once, and loading resets observed count', () => {
  const h = harness(); const events = {}; let refreshes = 0;
  h.context.renderDynamicQualityButtons = () => { refreshes++; };
  const hls = { media: h.video, currentLevel: 0, levels: [{ height: 0 }],
    on: (event, handler) => { (events[event] ||= []).push(handler); } };
  h.video.hls = hls;
  h.run('findLibraryPlayer(video, "hls")'); h.run('findLibraryPlayer(video, "hls")');
  assert.equal(events.hlsManifestLoaded.length, 1);
  hls.levels = [{ height: 720 }, { height: 1080 }];
  events.hlsManifestLoaded[0]('hlsManifestLoaded', { levels: hls.levels });
  events.hlsLevelsUpdated[0](); h.flush();
  assert.equal(refreshes, 1);
  assert.equal(h.json('HlsJsAdapter.getQualities(video, null)').length, 2);
  assert.equal(h.run('observedHlsPlayers.get(video.hls).declaredLevelCount'), 2);
  events.hlsManifestLoading[0]();
  assert.equal(h.run('observedHlsPlayers.get(video.hls).manifestObserved'), false);
  assert.equal(h.run('observedHlsPlayers.get(video.hls).declaredLevelCount'), null);
});

function subtitleHarness() {
  const h = harness(); const overlays = new Map();
  h.window.innerWidth = 1200; h.window.innerHeight = 800;
  h.video.getBoundingClientRect = () => ({ left: 100, top: 100, width: 640, height: 360 });
  h.context.customSubtitleCues = [{ start: 1, end: 5, text: '<img onerror=SECRET> düz metin' }];
  h.context.subtitleOffsetMs = 0; h.context.subtitleOverlayEnabled = true;
  h.context.subtitleRenderStatus = 'not-loaded'; h.video.currentTime = 2;
  h.context.document.getElementById = id => overlays.get(id) || null;
  h.context.document.createElement = () => {
    const priorities = {};
    const element = { style: { setProperty(key, value, priority) { this[key] = value; priorities[key] = priority; },
      getPropertyPriority: key => priorities[key] } };
    Object.defineProperty(element, 'innerHTML', { set() { throw new Error('Subtitle must be plain text'); } });
    return element;
  };
  h.context.getActiveContainer = () => ({ appendChild: element => overlays.set(element.id, element) });
  return { ...h, overlays };
}

test('active subtitle overrides production important hide rule and is anchored to video', () => {
  const h = subtitleHarness(); h.run('renderCustomSubtitleCue(video)');
  const overlay = h.overlays.get('pvc-subtitle-overlay');
  const css = readFileSync(join(__dirname, '..', 'injected.css'), 'utf8');
  assert.match(css.match(/#pvc-subtitle-overlay\s*\{[^}]+\}/)[0], /display:\s*none\s*!important/);
  assert.equal(overlay.style.display, 'block');
  assert.equal(overlay.style.getPropertyPriority('display'), 'important');
  assert.equal(overlay.textContent, '<img onerror=SECRET> düz metin');
  assert.equal(overlay.style.left, '420px');
  assert.ok(parseFloat(overlay.style.top) > 100 && parseFloat(overlay.style.top) < 460);
  assert.equal(h.run('subtitleRenderStatus'), 'overlay-requested');
});

test('subtitle gaps and disabled captions hide the overlay and report distinct safe states', () => {
  const h = subtitleHarness(); h.run('renderCustomSubtitleCue(video)');
  h.video.currentTime = 9; h.run('renderCustomSubtitleCue(video)');
  const overlay = h.overlays.get('pvc-subtitle-overlay');
  assert.equal(overlay.style.display, 'none');
  assert.equal(h.run('subtitleRenderStatus'), 'no-active-cue');
  h.context.subtitleOverlayEnabled = false; h.run('renderCustomSubtitleCue(video)');
  assert.equal(h.run('subtitleRenderStatus'), 'disabled');
});

test('native fullscreen uses showing TextTrack; normal mode restores overlay without duplicates', () => {
  const h = subtitleHarness(); h.video.__nokSubtitleTrack = { mode: 'hidden' };
  h.context.document.fullscreenElement = h.video;
  h.run('renderCustomSubtitleCue(video)');
  assert.equal(h.video.__nokSubtitleTrack.mode, 'showing');
  assert.equal(h.overlays.get('pvc-subtitle-overlay').style.display, 'none');
  assert.equal(h.run('subtitleRenderStatus'), 'native-requested');
  h.context.document.fullscreenElement = null; h.run('renderCustomSubtitleCue(video)');
  assert.equal(h.video.__nokSubtitleTrack.mode, 'hidden');
  assert.equal(h.overlays.get('pvc-subtitle-overlay').style.display, 'block');
});

function shakaPlayer(h, tracks) {
  const calls = [];
  const player = {
    getMediaElement: () => h.video, getVariantTracks: () => tracks,
    configure: configuration => { calls.push(['configure', configuration]); return true; },
    selectVariantTrack: (track, clearBuffer) => calls.push(['select', track, clearBuffer]),
    trickPlay: (...args) => calls.push(['speed', ...args])
  };
  h.video._shakaPlayer = player; h.context.activePlayer = player;
  return { player, calls };
}

test('TRT delegates to real Shaka variants, keeps audio language and disables ABR before selection', () => {
  const h = harness('www.trt1.com.tr');
  const tracks = [{ id: 1, height: 1080, language: 'tr', audioId: 7, active: true },
    { id: 2, height: 720, language: 'tr', audioId: 7 }, { id: 3, height: 720, language: 'en', audioId: 8 }];
  const { calls } = shakaPlayer(h, tracks);
  const qualities = h.json('TrtAdapter.getQualities(video, activePlayer)');
  assert.deepEqual(qualities.map(q => q.trackId), [1, 2]);
  h.context.choice = qualities[1];
  assert.equal(h.run('TrtAdapter.applyQuality(choice, video, activePlayer)'), true);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), ['configure', { abr: { enabled: false } }]);
  assert.equal(calls[1][1], tracks[1]); assert.equal(calls[1][2], true);
  assert.equal(h.run('targetTrtQualitySuffix'), null);
});

test('TRT event fallback keeps correcting resets with bounded timers instead of a lifetime retry limit', () => {
  const h = harness('www.trt1.com.tr'); const { calls } = shakaPlayer(h, []);
  assert.equal(h.run('setSpeed(1.5)'), true);
  assert.deepEqual(calls.at(-1), ['speed', 1.5, false]);
  for (let i = 0; i < 6; i++) { h.video.playbackRate = 1; h.video.emit('ratechange'); h.flush(); }
  assert.equal(h.run('trtRateGuards.get(video).attempts'), 6);
  assert.equal(h.run('trtRateGuards.get(video).active'), true);
  assert.equal(h.logs.filter(log => log.event === 'TRT_RATE_GAVE_UP').length, 0);
  assert.equal(h.logs.filter(log => log.event === 'TRT_RATE_REAPPLIED').length, 1, 'Logs are throttled');
  assert.equal(h.timers.size, 0);
  h.run('setSpeed(1.5)'); h.video.playbackRate = 0; h.video.emit('ratechange');
  assert.equal(h.timers.size, 0, 'Do not fight buffering rate 0');
  h.video.playbackRate = 1; h.video.emit('ratechange'); assert.equal(h.timers.size, 1);
  h.video.emit('emptied'); h.flush(); assert.equal(h.video.playbackRate, 1);
});

test('TRT element lock redirects only 1x, preserves 0x buffering and restores native property on reset', () => {
  const h = harness('www.trt1.com.tr'); let nativeRate = 1;
  delete h.video.playbackRate;
  const prototype = {};
  Object.defineProperty(prototype, 'playbackRate', { configurable: true,
    get() { return nativeRate; }, set(value) { nativeRate = value; } });
  Object.setPrototypeOf(h.video, prototype);
  assert.equal(h.run('setSpeed(1.5)'), true);
  assert.equal(h.run('trtRateGuards.get(video).mode'), 'element');
  for (let i = 0; i < 30; i++) h.video.playbackRate = 1;
  assert.equal(h.video.playbackRate, 1.5);
  assert.equal(h.timers.size, 0);
  h.video.playbackRate = 0; assert.equal(h.video.playbackRate, 0);
  h.video.playbackRate = 1; assert.equal(h.video.playbackRate, 1.5);
  h.run('setSpeed(1)');
  assert.equal(Object.getOwnPropertyDescriptor(h.video, 'playbackRate'), undefined);
  assert.equal(h.video.playbackRate, 1);
  h.run('setSpeed(2)'); h.video.emit('emptied');
  assert.equal(Object.getOwnPropertyDescriptor(h.video, 'playbackRate'), undefined);
  h.video.playbackRate = 1; assert.equal(h.video.playbackRate, 1);
});

test('Video.js reads VHS representations without qualityLevels and applies a stable representation ID', () => {
  const h = harness(); const enabled = [true, true];
  const reps = [
    { id: 'PRIVATE_REP_A', height: 720, enabled: value => { enabled[0] = value; } },
    { id: 'PRIVATE_REP_B', height: 1080, enabled: value => { enabled[1] = value; } }
  ];
  const player = { currentTime() {}, playbackRate() {}, qualityLevels: () => [], tech_: { vhs: { representations: () => reps } } };
  h.video.parentElement = { player }; h.context.activePlayer = player;
  const qualities = h.json('VideoJsAdapter.getQualities(video, activePlayer)');
  assert.deepEqual(qualities.map(q => q.height), [1080, 720]);
  h.context.choice = qualities[1];
  assert.equal(h.run('VideoJsAdapter.applyQuality(choice, video, activePlayer)'), true);
  assert.deepEqual(enabled, [true, false]);
  h.context.choice.representationId = 'missing';
  assert.equal(h.run('VideoJsAdapter.applyQuality(choice, video, activePlayer)'), false);
  assert.deepEqual(enabled, [true, false]);
});

test('unmatched forced adapter cannot pretend to control a video', () => {
  const h = harness(); h.context.userForcedAdapterName = 'DashJsAdapter';
  assert.equal(h.run('getActiveAdapter(video, activePlayer).name'), 'GenericAdapter');
  assert.equal(h.run('getActiveAdapter(null, null).name'), 'GenericAdapter');
  assert.equal(h.run('adapterHealthStatus'), 'failed');
});

test('unbound libraries and generic video expose no fictitious quality choices or stale cache', () => {
  const h = harness(); h.window.shaka = { Player: function () {} };
  h.context.cachedDiscoveredQualities = [{ id: 'old-private-id', height: 1080 }];
  assert.equal(h.run('getActiveAdapter(video, activePlayer).name'), 'GenericAdapter');
  assert.deepEqual(h.json('discoverStreamQualities()'), []);
  assert.equal(h.run('requestQuality({ id: "fake", height: 720 }, video, activePlayer)'), false);
  assert.equal(h.run('activeForcedQualityId'), '');
  assert.equal(h.run('pendingQualityLabel'), '');
});

test('DRM prevents legacy TRT URL fallback but still allows licensed Shaka tracks', () => {
  const h = harness('www.trt1.com.tr'); h.video.drm = true;
  h.context.lastCapturedTrtStreamUrl = 'https://cdn.invalid/master1080p_0001.ts';
  assert.deepEqual(h.json('TrtAdapter.getQualities(video, null)'), []);
  shakaPlayer(h, [{ id: 1, height: 720, language: 'tr' }]);
  assert.equal(h.json('TrtAdapter.getQualities(video, activePlayer)').length, 1);
});

test('paused video can use passive HTTP timing without any fetch', async () => {
  const h = harness(); h.video.paused = true;
  h.context.performance.getEntriesByType = () => [{ name: 'https://cdn.invalid/part.m4s?SECRET', requestStart: 100, responseStart: 140 }];
  const result = await h.run('testCdnPing(false)');
  assert.equal(result.ms, 40); assert.equal(result.method, 'resource-timing');
  assert.equal(h.requests.length, 0);
});

test('silent CDN refresh does not probe network; blob and SDK JS are not media endpoints', async () => {
  const h = harness();
  h.context.performance.getEntriesByType = () => [{ name: 'https://kick.com/ivs/worker.js', duration: 99 }];
  assert.equal(await h.run('testCdnPing(true)'), null);
  assert.equal(await h.run('testCdnPing(false)'), null);
  assert.equal(h.requests.length, 0);
  assert.equal(h.run('lastPingStatus'), 'no-source');
});

test('manual HTTP probe uses HEAD without credentials/referrer and never GET fallback', async () => {
  const h = harness(); h.video.currentSrc = 'https://cdn.invalid/video.mp4'; h.video.paused = true;
  await h.run('testCdnPing(false)');
  assert.equal(h.requests[0].options.method, 'HEAD');
  assert.equal(h.requests[0].options.credentials, 'omit');
  assert.equal(h.requests[0].options.referrerPolicy, 'no-referrer');
  h.context.fetch = async () => { throw new Error('CORS PRIVATE_URL'); };
  assert.equal(await h.run('testCdnPing(false)'), null);
  assert.equal(h.run('lastPingStatus'), 'blocked');
  assert.equal(h.toasts.at(-1).includes('PRIVATE_URL'), false);
  assert.equal(h.timers.size, 0);
});

test('content relay sends only fixed frame-open signal and reinjection adds no duplicate listener', () => {
  const events = [], sent = [], selfPosts = [];
  const parent = {}, window = { parent, postMessage: payload => selfPosts.push(payload), addEventListener: (type, cb) => events.push(cb) };
  const document = {
    readyState: 'loading', head: { appendChild() {} }, createElement: () => ({ dataset: {} }),
    querySelectorAll: () => [{ contentWindow: { postMessage: payload => sent.push(payload) } }]
  };
  const context = vm.createContext({ window, document, chrome: { runtime: { getURL: path => 'extension:///' + path } } });
  vm.runInContext(content, context);
  events[0]({ source: parent, data: { type: 'NOK_FRAME_OPEN', privateData: 'SECRET' } });
  assert.deepEqual(JSON.parse(JSON.stringify(sent)), [{ type: 'NOK_FRAME_HIDE' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(selfPosts)), [{ type: 'PVC_HIDE_POPUP' }, { type: 'PVC_OPEN_IF_MEDIA' }]);
  events[0]({ source: window, data: { type: 'PVC_OPEN_IN_CHILD_FRAMES' } });
  assert.equal(sent.at(-1).type, 'NOK_FRAME_OPEN');
  vm.runInContext(content, context);
  assert.equal(events.length, 1);
  assert.equal(selfPosts.at(-1).type, 'PVC_TOOLBAR_TOGGLE');
});

test('complete main engine boots and reinjection does not register another message listener', () => {
  const listeners = [], posts = [];
  const window = { location: { hostname: 'example.invalid' },
    addEventListener: (type, cb) => { if (type === 'message') listeners.push(cb); },
    postMessage: payload => posts.push(payload), fetch: async () => ({ ok: true }) };
  window.parent = window; window.top = window;
  class XHR { open() {} }
  const context = vm.createContext({
    window, document: { currentScript: null, addEventListener() {} },
    navigator: { userAgent: 'Firefox' }, XMLHttpRequest: XHR, HTMLMediaElement: class {},
    console: { log() {}, warn() {}, error() {} },
    setInterval() { return 1; }, clearInterval() {}, setTimeout() { return 1; }, clearTimeout() {},
    performance: { now: () => 1 }
  });
  vm.runInContext(source, context);
  assert.equal(window.__NOK_VIDEO_CONTROLLER_INJECTED__, true);
  assert.equal(listeners.length, 1);
  vm.runInContext(source, context);
  assert.equal(listeners.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(posts)), [{ type: 'PVC_TOGGLE_POPUP' }]);
});
