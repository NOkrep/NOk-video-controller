// node --test tests/diagnostics.test.cjs (yalnızca Node yerleşik modülleri)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '..', 'injected.js'), 'utf8');
function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'Production source section must exist');
  return source.slice(from, to);
}
const localization = section('  const UI_MESSAGES', '  // END UI LOCALIZATION');
const diagnostics = section('  const DIAGNOSTIC_LOG_BUFFER', '  function getActiveContainer');
const report = section('  function diagnosticChoice', '  function showPermissionsGuideModal');

class Element {
  constructor(id = '') { this.id = id; this.listeners = {}; this.children = {}; this.value = ''; this.checked = false; }
  set innerHTML(value) {
    this.markup = value;
    for (const match of value.matchAll(/id="([^"]+)"/g)) this.children[match[1]] = new Element(match[1]);
    if (this.children['pvc-report-problem']) this.children['pvc-report-problem'].value = 'unspecified';
    if (this.children['pvc-user-feedback-input']) this.children['pvc-user-feedback-input'].disabled = true;
  }
  setAttribute(name, value) { (this.attributes ||= {})[name] = value; }
  getAttribute(name) { return this.attributes?.[name] ?? null; }
  hasAttribute(name) { return Object.hasOwn(this.attributes || {}, name); }
  querySelector(selector) { return this.children[selector.slice(1)] || null; }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  emit(type) { for (const callback of this.listeners[type] || []) callback({ target: this, stopPropagation() {} }); }
  remove() { this.removed = true; }
}

function harness(options = {}) {
  const video = options.video === null ? null : {
    videoWidth: 1920, videoHeight: 1080, volume: 0.5, playbackRate: 1.5,
    readyState: 4, networkState: 2, duration: 5942, currentTime: 1234,
    paused: false, muted: false,
    currentSrc: 'https://secret.example/account-name/movie-id.m3u8?new_secret=UNIQUE_SECRET',
    ...options.video
  };
  const output = { writes: [], toasts: [], modal: null };
  const window = {}; window.top = window;
  const context = vm.createContext({
    performance: { now: () => options.now ?? 15000 },
    navigator: {
      language: 'tr',
      userAgent: 'Mozilla/5.0 PRIVATE_DEVICE Firefox/150.1',
      clipboard: { writeText: async text => {
        if (options.clipboardFailure) throw new Error('denied');
        output.writes.push(text);
      } }
    },
    window,
    document: {
      querySelectorAll: () => options.frames || [],
      getElementById: () => output.modal?.removed ? null : output.modal,
      createElement: () => new Element()
    },
    getActiveContainer: () => ({ appendChild: element => { output.modal = element; } }),
    showToast: message => output.toasts.push(message),
    findVideoAndPlayer: () => ({ video, playerType: options.playerType || 'native-html5' }),
    deepFindMediaElements: () => video ? [{ video }] : [],
    detectDrmStatus: () => ({ isDrm: options.drm || false, keySystem: 'PRIVATE_DRM_STRING' }),
    ALL_ADAPTERS: [ { name: 'GenericAdapter', tier: 3 }, { name: 'KickAdapter', tier: 1 }, { name: 'TrtAdapter', tier: 1 }, { name: 'DashJsAdapter', tier: 2 } ],
    currentActiveAdapterName: options.adapter || 'GenericAdapter',
    userForcedAdapterName: options.forcedAdapter || '', trtRateGuards: new WeakMap(),
    adapterHealthStatus: 'healthy',
    cachedDiscoveredQualities: [{ id: 'private-id', label: 'PRIVATE_TITLE', height: 720 }],
    activeForcedQualityId: 'private-id', targetEnforcedPlaybackRate: 2,
    currentAudioVolumePercent: 200, currentAudioMode: 'stereo',
    audioGainNodeInstance: { gain: { value: 2 } },
    audioContextInstance: { state: 'running' },
    audioSourceElementMap: new WeakMap(),
    customSubtitleCues: [{ text: 'PRIVATE_SUBTITLE' }], subtitleLoadStatus: 'loaded', subtitleRenderStatus: 'no-active-cue', lastPingStatus: 'not-tested', isMediaInShadowDom: false,
    findLibraryPlayer: () => options.hls || null,
    observedHlsPlayers: new WeakMap(options.hls ? [[options.hls, { manifestObserved: true, declaredLevelCount: options.hls.levels.length }]] : []),
    EXTENSION_VERSION: '0.5.7', HOSTNAME: options.hostname || 'personal.192-0-2-1.sslip.io',
    GITHUB_REPO_URL: 'https://github.com/NOkrep/NOk-video-controller',
    DEVELOPER_EMAIL: 'developer@example.invalid',
    fetch: () => { throw new Error('Report must not make network requests'); }
  });
  vm.runInContext(localization + diagnostics + report, context);
  const run = code => vm.runInContext(code, context);
  const payload = () => JSON.parse(run('JSON.stringify(buildDiagnosticPayload("USER_MANUAL_DIAGNOSTIC"))'));
  const open = () => { run('reportAnonymousError("USER_MANUAL_DIAGNOSTIC")'); return output.modal; };
  return { run, payload, open, output, video };
}

test('default export excludes identifiers, URLs, viewing position and device details', () => {
  const h = harness();
  h.run(`addDiagnosticLog('WARN', 'https://secret.example/UNIQUE_SECRET');
    addDiagnosticLog('WARN', 'PIP_FAILED', { error: { token: 'UNIQUE_SECRET' } });`);
  const payload = h.payload();
  const json = JSON.stringify(payload);
  for (const secret of ['UNIQUE_SECRET', 'PRIVATE_', 'personal.', '192-0-2', 'secret.example',
    'currentTime', 'duration', 'displaySize', 'timestamp', 'sampleUrl', 'userComments', 'domain', 'networkTelemetry']) {
    assert.equal(json.includes(secret), false, secret);
  }
  assert.equal(payload.platform, 'other');
  assert.equal(payload.browserFamily, 'firefox');
  assert.equal(payload.videoState.sourceKind, 'http');
  assert.equal(payload.videoState.resolutionClass, 'fhd');
});

test('events reject unknown fields, nested objects, invalid values and prototype keys', () => {
  const h = harness();
  h.run(`addDiagnosticLog('INFO', '__proto__', { percent: 50 });
    addDiagnosticLog('INFO', 'VOLUME_REQUESTED', { percent: { token: 'SECRET' }, extra: 'SECRET' });
    addDiagnosticLog('INFO', 'VOLUME_REQUESTED', { percent: NaN });
    addDiagnosticLog('INFO', 'VOLUME_REQUESTED', { percent: Infinity });
    addDiagnosticLog('INFO', 'VOLUME_REQUESTED', { percent: 99999 });
    addDiagnosticLog('INFO', 'VOLUME_REQUESTED', { percent: 125, privateName: 'SECRET' });`);
  const events = h.payload().recentEvents;
  assert.equal(events.length, 5);
  assert.deepEqual(events.slice(0, 4).map(e => e.details), [{}, {}, {}, {}]);
  assert.deepEqual(events[4].details, { percent: 125 });
});

test('ring buffer is bounded and exports coarse relative ages', () => {
  const h = harness();
  h.run(`for (let i = 0; i < 100; i++) addDiagnosticLog('INFO', 'VOLUME_REQUESTED', { percent: i });`);
  assert.equal(h.run('DIAGNOSTIC_LOG_BUFFER.length'), 40);
  assert.equal(h.payload().recentEvents.length, 20);
  assert.equal(h.payload().recentEvents[0].details.percent, 80);
  h.run('performance.now = () => 22799');
  assert.equal(h.payload().recentEvents[0].ageSeconds, 5);
});

test('supported platform names never export arbitrary subdomains', () => {
  assert.equal(harness({ hostname: 'private-customer.kick.com' }).payload().platform, 'kick');
  assert.equal(harness({ hostname: 'kick.com.attacker.invalid' }).payload().platform, 'other');
  assert.equal(harness({ hostname: '127.0.0.1' }).payload().platform, 'other');
});

test('no-video and inaccessible frames remain diagnosable without frame addresses', () => {
  const blocked = { get contentDocument() { throw new Error('PRIVATE_FRAME_URL'); } };
  const p = harness({ video: null, frames: [blocked, { contentDocument: null }, { contentDocument: {} }] }).payload();
  assert.equal(p.videoState, null);
  assert.equal(p.adapterSelectionStatus, 'no-video');
  assert.equal(p.frame.inaccessibleFrameCount, '2-4');
  assert.equal(p.videoCandidateCount, '0');
  assert.equal(p.problem, 'detection');
  assert.equal(p.quality.cachedOptionCount, '0');
});

test('no-video report preselects detection and user can change it', () => {
  const h = harness({ video: null }); const modal = h.open();
  const select = modal.querySelector('#pvc-report-problem');
  assert.equal(select.value, 'detection');
  assert.equal(JSON.parse(modal.querySelector('#pvc-modal-code-block').textContent).problem, 'detection');
  select.value = 'hud'; select.emit('change');
  assert.equal(JSON.parse(modal.querySelector('#pvc-modal-code-block').textContent).problem, 'hud');
});

test('no-video forced Dash selection is recorded as a request, never an active media adapter', () => {
  const p = harness({ video: null, adapter: 'DashJsAdapter', forcedAdapter: 'DashJsAdapter' }).payload();
  assert.equal(p.activeAdapter, 'none');
  assert.equal(p.adapterTier, null);
  assert.equal(p.forcedAdapter, 'DashJsAdapter');
  assert.equal(p.forcedAdapterStatus, 'no-video');
});

test('unready video differs from absent video; blob UUIDs are excluded', () => {
  const p = harness({ video: { videoWidth: 0, videoHeight: 0, readyState: 0, networkState: 0,
    duration: NaN, currentSrc: 'blob:https://private.invalid/PRIVATE_UUID' } }).payload();
  assert.equal(p.videoState.hasDecodedDimensions, false);
  assert.equal(p.videoState.readyState, 0);
  assert.equal(p.videoState.sourceKind, 'blob');
  assert.equal(p.videoState.mediaMode, 'unknown');
  assert.equal(JSON.stringify(p).includes('PRIVATE_UUID'), false);
});

test('requested and observed media values remain separate; unrelated gain is excluded', () => {
  const p = harness({ adapter: 'KickAdapter' }).payload();
  assert.equal(p.videoState.requestedPlaybackRate, 2);
  assert.equal(p.videoState.observedPlaybackRate, 1.5);
  assert.equal(p.videoState.requestedVolumePercent, 200);
  assert.equal(p.videoState.observedNativeVolumePercent, 50);
  assert.equal(p.videoState.observedGain, null);
  assert.equal(p.videoState.audioSourceCreated, false);
});

test('generic quality placeholders are never reported as verified control', () => {
  const p = harness().payload();
  assert.equal(p.quality.control, 'not-implemented');
  assert.equal(p.quality.requestedHeight, null);
  assert.equal(p.quality.verification, 'not-verified');
  const trt = harness({ adapter: 'TrtAdapter' }).payload();
  assert.equal(trt.quality.requestedHeight, 720);
  assert.equal(trt.videoState.resolutionClass, 'fhd');
  assert.equal(trt.quality.verification, 'not-verified');
});

test('Hls report distinguishes player inventory from resolution metadata without leaking manifest data', () => {
  const h = harness({ hls: { levels: [{ height: 0, url: 'https://PRIVATE_MANIFEST/SECRET' }] } });
  const p = h.payload();
  assert.equal(p.quality.inventoryScope, 'bound-hls-player');
  assert.equal(p.quality.playerLevelCount, '1');
  assert.equal(p.quality.knownResolutionCount, '0');
  assert.equal(p.quality.manifestObserved, true);
  assert.equal(p.quality.declaredLevelCount, '1');
  assert.equal(JSON.stringify(p).includes('PRIVATE_MANIFEST'), false);
  assert.equal(JSON.stringify(p).includes('SECRET'), false);
});

test('subtitle render status exposes cue gap without exporting subtitles or timestamps', () => {
  const p = harness().payload();
  assert.equal(p.videoState.subtitleRenderStatus, 'no-active-cue');
  assert.equal(JSON.stringify(p).includes('PRIVATE_SUBTITLE'), false);
});

test('unexpected player/error strings are dropped', () => {
  const h = harness({ playerType: 'PRIVATE_PLAYER_URL' });
  const p = JSON.parse(h.run('JSON.stringify(buildDiagnosticPayload("SECRET_ERROR"))'));
  assert.equal(p.errorCode, 'USER_MANUAL_DIAGNOSTIC');
  assert.equal(p.playerType, 'unknown');
});

test('preview renders payload as text and sharing URLs never embed report/comments', () => {
  const h = harness();
  const modal = h.open();
  const textarea = modal.querySelector('#pvc-user-feedback-input');
  const checkbox = modal.querySelector('#pvc-include-comment');
  const code = modal.querySelector('#pvc-modal-code-block');
  assert.equal(textarea.disabled, true);
  assert.equal(JSON.parse(code.textContent).userComments, undefined);
  assert.deepEqual(h.output.writes, []);
  checkbox.checked = true; checkbox.emit('change');
  assert.equal(textarea.disabled, false);
  textarea.value = '</pre><img src=x onerror=PRIVATE_SECRET>'; textarea.emit('input');
  assert.equal(code.textContent.includes('PRIVATE_SECRET'), true);
  assert.equal(modal.markup.includes('PRIVATE_SECRET'), false);
  for (const selector of ['#pvc-send-mail-link', '#pvc-open-github-link']) {
    const href = modal.querySelector(selector).href;
    assert.equal(href.includes('PRIVATE_SECRET'), false);
    assert.equal(href.includes('body='), false);
  }
  checkbox.checked = false; checkbox.emit('change');
  assert.equal(textarea.value, '');
  assert.equal(JSON.parse(code.textContent).userComments, undefined);
});

test('problem selection is allowlisted and opted-in comments are bounded', () => {
  const h = harness(); const modal = h.open();
  const select = modal.querySelector('#pvc-report-problem');
  select.value = 'PRIVATE_SITE'; select.emit('change');
  assert.equal(JSON.parse(modal.querySelector('#pvc-modal-code-block').textContent).problem, 'unspecified');
  const checkbox = modal.querySelector('#pvc-include-comment');
  checkbox.checked = true; checkbox.emit('change');
  const textarea = modal.querySelector('#pvc-user-feedback-input');
  textarea.value = 'a'.repeat(900); textarea.emit('input');
  assert.equal(JSON.parse(modal.querySelector('#pvc-modal-code-block').textContent).userComments.length, 500);
});

test('deletion request is opt-in, reaches both drafts as fixed text and never exports comments in URLs', () => {
  const h = harness(); const modal = h.open();
  const checkbox = modal.querySelector('#pvc-request-deletion');
  const preview = modal.querySelector('#pvc-modal-code-block');
  assert.equal(JSON.parse(preview.textContent).deleteAfterResolutionRequested, undefined);
  checkbox.checked = true; checkbox.emit('change');
  assert.equal(JSON.parse(preview.textContent).deleteAfterResolutionRequested, true);
  modal.querySelector('#pvc-include-comment').checked = true; modal.querySelector('#pvc-include-comment').emit('change');
  modal.querySelector('#pvc-user-feedback-input').value = 'PRIVATE_DELETE_COMMENT';
  modal.querySelector('#pvc-user-feedback-input').emit('input');
  for (const selector of ['#pvc-send-mail-link', '#pvc-open-github-link']) {
    const href = modal.querySelector(selector).href;
    assert.match(decodeURIComponent(href), /I request deletion of this issue \/ report after the problem is resolved/);
    assert.equal(href.includes('PRIVATE_DELETE_COMMENT'), false);
    assert.equal(href.includes('reportSchemaVersion'), false);
  }
  checkbox.checked = false; checkbox.emit('change');
  assert.equal(JSON.parse(preview.textContent).deleteAfterResolutionRequested, undefined);
  assert.equal(modal.querySelector('#pvc-open-github-link').href.includes('body='), false);
});

test('clipboard success matches preview; rejection never claims success', async () => {
  for (const failure of [false, true]) {
    const h = harness({ clipboardFailure: failure }); const modal = h.open();
    await modal.querySelector('#pvc-copy-payload-btn').onclick({ stopPropagation() {} });
    if (failure) {
      assert.equal(h.output.writes.length, 0);
      assert.match(h.output.toasts.at(-1), /Kopyalanamadı/);
    } else {
      assert.equal(h.output.writes[0], modal.querySelector('#pvc-modal-code-block').textContent);
      assert.match(h.output.toasts.at(-1), /kopyalandı/);
    }
  }
});

test('DRM reporting does not initialize audio or export key-system free text', () => {
  const p = harness({ drm: true }).payload();
  assert.equal(p.videoState.drmDetected, true);
  assert.equal(p.videoState.audioSourceCreated, false);
  assert.equal(JSON.stringify(p).includes('PRIVATE_DRM_STRING'), false);
});

test('diagnostics do not wrap site console or expose network telemetry', () => {
  assert.doesNotMatch(source, /console\.(warn|error)\s*=|hookConsoleForDiagnostics|sanitizeStreamUrl|collectNetworkTelemetry/);
  assert.doesNotMatch(report, /getEntriesByType|\bfetch\(|currentTime|new Date/);
});
