const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'early-hooks.js'), 'utf8');

function load() {
  const listeners = new Set();
  const document = {
    addEventListener: (type, listener, capture) => { assert.equal(type, 'load'); assert.equal(capture, true); listeners.add(listener); },
    removeEventListener: (_type, listener) => listeners.delete(listener)
  };
  const window = {};
  vm.runInNewContext(source, { window, document });
  return { window, listeners, scriptLoaded: () => [...listeners].forEach(listener => listener({ target: { tagName: 'SCRIPT' } })) };
}

function fakeHls() {
  return class Hls { attachMedia(media) { this.media = media; return 'attached'; } };
}

test('a page that attaches right after the library script keeps its player findable', () => {
  const page = load();
  page.window.Hls = fakeHls();
  page.scriptLoaded();
  const video = { tagName: 'VIDEO' }, player = new page.window.Hls();
  assert.equal(player.attachMedia(video), 'attached');
  assert.equal(video.__nokHlsPlayer, player);
  assert.equal(player.media, video);
});

test('Hls.js config form and non-video targets follow the engine rule', () => {
  const page = load();
  page.window.Hls = fakeHls();
  page.scriptLoaded();
  const video = { tagName: 'VIDEO' }, audio = { tagName: 'AUDIO' }, player = new page.window.Hls();
  player.attachMedia({ media: video });
  assert.equal(video.__nokHlsPlayer, player);
  player.attachMedia(audio);
  assert.equal(audio.__nokHlsPlayer, undefined);
});

test('Shaka attach and load both remember the player', () => {
  const page = load();
  class Player {
    attach(media) { this.element = media; return 'a'; }
    load() { return 'l'; }
    getMediaElement() { return this.element; }
  }
  page.window.shaka = { Player };
  page.scriptLoaded();
  const first = { tagName: 'VIDEO' }, second = { tagName: 'VIDEO' }, player = new Player();
  assert.equal(player.attach(first), 'a');
  assert.equal(first.__nokShakaPlayer, player);
  player.element = second;
  assert.equal(player.load(), 'l');
  assert.equal(second.__nokShakaPlayer, player);
});

test('repeated script loads do not stack wrappers and a throwing page is not affected', () => {
  const page = load();
  page.window.Hls = fakeHls();
  page.scriptLoaded();
  const once = page.window.Hls.prototype.attachMedia;
  page.scriptLoaded();
  assert.equal(page.window.Hls.prototype.attachMedia, once);
  const player = new page.window.Hls();
  const hostile = { get tagName() { throw Error('page getter'); } };
  assert.equal(player.attachMedia(hostile), 'attached');
});

test('it stops listening once the engine has taken over', () => {
  const page = load();
  page.window.__NOK_VIDEO_CONTROLLER_INJECTED__ = true;
  page.window.Hls = fakeHls();
  const original = page.window.Hls.prototype.attachMedia;
  page.scriptLoaded();
  assert.equal(page.listeners.size, 0);
  assert.equal(page.window.Hls.prototype.attachMedia, original);
});

test('manifest runs it in the page world at document start in every frame, with no new permission', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const entry = manifest.content_scripts.find(item => item.js.includes('early-hooks.js'));
  assert.deepEqual(entry, { matches: ['<all_urls>'], js: ['early-hooks.js'], run_at: 'document_start', all_frames: true, world: 'MAIN' });
  assert.deepEqual(manifest.permissions.sort(), ['activeTab', 'scripting']);
  assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, '121.0');
  assert.equal(/fetch|XMLHttpRequest|postMessage|localStorage|src\s*=/.test(source), false, 'only remembers an object on the video');
});
