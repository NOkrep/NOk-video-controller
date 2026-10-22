const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const content = fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');
const protocol = fs.readFileSync(path.join(__dirname, '..', 'frame-protocol.js'), 'utf8');
const fixture = require('./frame-fixtures.cjs');

function tree(remote = false) {
  const queue = [], messages = [], frames = []; let executing = null;
  function frame(parent, hasVideo) {
    const f = { children: [], hasVideo, visible: false, listeners: [], language: null, sourceActive: false, commands: [], docListeners: {}, owner: (frames.length + 1).toString(16).padStart(32, '0') };
    f.window = {
      addEventListener: (_type, callback) => f.listeners.push(callback),
      postMessage: data => {
        queue.push({ from: executing?.window, to: f, data });
        messages.push(data);
      }
    };
    f.window.parent = parent?.window || f.window;
    f.element = { contentWindow: f.window };
    if (parent) parent.children.push(f);
    f.context = vm.createContext({
      window: f.window,
      document: { readyState: 'loading', head: { appendChild() {} }, createElement: () => ({ dataset: {} }),
        querySelectorAll: () => f.children.map(child => child.element), addEventListener: (type, callback) => { f.docListeners[type] = callback; } },
      chrome: { runtime: { getURL: file => 'extension:///' + file } }
    });
    executing = f; if (remote) vm.runInContext(protocol, f.context); vm.runInContext(content, f.context); executing = null;
    frames.push(f); return f;
  }
  function local(f, type, payload) {
    executing = f; f.window.postMessage(payload === undefined ? { type } : { type, payload }); executing = null;
  }
  function from(sender, to, type, payload) {
    executing = sender; to.window.postMessage({ type, payload }); executing = null;
  }
  function publish(f) {
    f.window.postMessage({ type: 'PVC_SOURCE_STATE', payload: { session: f.session, state: fixture.state({ owner: f.owner, fullscreen: !!f.fullscreen }) } });
  }
  function flush() {
    let n = 0;
    while (queue.length) {
      assert.ok(++n < 1000, 'Frame protocol must terminate');
      const { from, to, data } = queue.shift(); executing = to;
      for (const listener of to.listeners) listener({ source: from, data });
      // Minimal main-world engine model: test the actual isolated-world source in every frame.
      if (from === to.window) {
        if (data.type === 'PVC_APPLY_LANGUAGE_TR') to.language = 'tr';
        if (data.type === 'PVC_APPLY_LANGUAGE_EN') to.language = 'en';
        if (data.type.startsWith('PVC_APPLY_PLATFORM_')) to.platform = data.type.slice('PVC_APPLY_PLATFORM_'.length);
        if (data.type === 'PVC_HIDE_POPUP') to.visible = false;
        if (data.type === 'PVC_REMOTE_CLEAR') { to.visible = false; to.sourceActive = false; to.remoteState = null; }
        if (data.type === 'PVC_REMOTE_SOURCE_SUSPEND') { to.visible = false; to.sourceActive = false; }
        if (data.type === 'PVC_REMOTE_SOURCE_START') {
          if (to.hasVideo) {
            to.sourceActive = true; to.session = data.payload.session; to.visible = false;
            to.window.postMessage({ type: 'PVC_HUD_OPENED', payload: { session: to.session } }); publish(to);
          } else to.window.postMessage({ type: 'PVC_OPEN_IN_CHILD_FRAMES' });
        }
        if (data.type === 'PVC_REMOTE_STATE') { to.remoteState = data.payload.state; to.remoteSession = data.payload.session; to.visible = !to.remoteState.fullscreen; }
        if (data.type === 'PVC_EXEC_REMOTE_COMMAND' && to.sourceActive) to.commands.push(data.payload.command);
        if (data.type === 'PVC_SOURCE_FULLSCREEN' && to.sourceActive) {
          to.fullscreen = data.payload.value; to.visible = to.fullscreen; publish(to);
        }
        if (data.type === 'PVC_OPEN_IF_MEDIA') {
          if (to.hasVideo) { to.visible = true; to.window.postMessage({ type: 'PVC_HUD_OPENED' }); }
          else to.window.postMessage({ type: 'PVC_OPEN_IN_CHILD_FRAMES' });
        }
        if (data.type === 'PVC_TOGGLE_POPUP') {
          to.visible = !to.visible;
          to.window.postMessage({ type: !to.visible ? 'PVC_HUD_CLOSED' : to.hasVideo ? 'PVC_HUD_OPENED' : 'PVC_OPEN_IN_CHILD_FRAMES' });
        }
      }
      executing = null;
    }
  }
  function toolbar(f) { executing = f; f.window.__NOK_VIDEO_CONTROLLER_TOOLBAR_REQUEST__=true; vm.runInContext(content, f.context); executing = null; flush(); }
  function documentEvent(f, type) { executing = f; f.docListeners[type](); executing = null; flush(); }
  return { frame, local, from, documentEvent, flush, toolbar, frames, messages };
}

test('working iframe hides empty top HUD and other sibling HUDs', () => {
  const t = tree(), top = t.frame(null, false), a = t.frame(top, true), b = t.frame(top, true);
  t.toolbar(top);
  assert.equal(top.visible, false);
  assert.equal([a, b].filter(f => f.visible).length, 1);
  assert.ok(t.messages.every(message => Object.keys(message).join() === 'type'));
});

test('toolbar toggles delegated HUD closed and reopens a single working branch', () => {
  const t = tree(), top = t.frame(null, false); t.frame(top, true); t.frame(top, true);
  t.toolbar(top); assert.equal(t.frames.filter(f => f.visible).length, 1);
  t.toolbar(top); assert.equal(t.frames.filter(f => f.visible).length, 0);
  t.toolbar(top); assert.equal(t.frames.filter(f => f.visible).length, 1);
  assert.ok(t.frames.every(f => f.listeners.length === 1));
});

test('nested working iframe has one HUD along the entire parent chain', () => {
  const t = tree(), top = t.frame(null, false), child = t.frame(top, false), leaf = t.frame(child, true);
  t.toolbar(top);
  assert.equal(top.visible, false); assert.equal(child.visible, false); assert.equal(leaf.visible, true);
  leaf.visible = false; t.local(leaf, 'PVC_HUD_CLOSED'); t.flush();
  t.toolbar(top); assert.equal(leaf.visible, true);
});

test('no working frame leaves the top fallback panel available', () => {
  const t = tree(), top = t.frame(null, false); t.frame(top, false);
  t.toolbar(top); assert.equal(top.visible, true);
  assert.equal(t.frames.filter(f => f.visible).length, 1);
});

test('top-level media wins without opening children', () => {
  const t = tree(), top = t.frame(null, true), child = t.frame(top, true);
  t.toolbar(top); assert.equal(top.visible, true); assert.equal(child.visible, false);
});

test('language choice reaches parents, siblings and later frames using only fixed signals', () => {
  const t = tree(), top = t.frame(null, false), a = t.frame(top, true), b = t.frame(top, false), leaf = t.frame(b, true);
  t.local(a, 'PVC_LANGUAGE_EN'); t.flush();
  assert.ok(t.frames.every(frame => frame.language === 'en'));
  const later = t.frame(top, true); t.flush(); assert.equal(later.language, 'en');
  t.local(leaf, 'PVC_LANGUAGE_TR'); t.flush();
  assert.ok(t.frames.every(frame => frame.language === 'tr'));
  assert.ok(t.messages.every(message => Object.keys(message).join() === 'type'));
});

test('fixed top-page platform reaches embedded and late frames without hosts or child overrides', () => {
  const t = tree(), top = t.frame(null, false), a = t.frame(top, true), leaf = t.frame(a, true);
  t.local(top, 'PVC_PLATFORM_trt'); t.flush();
  assert.ok(t.frames.every(f => f.platform === 'trt'));
  const later = t.frame(top, true); t.flush(); assert.equal(later.platform, 'trt');
  t.local(leaf, 'PVC_PLATFORM_kick'); t.flush(); assert.equal(top.platform, 'trt');
  t.local(top, 'PVC_PLATFORM_PRIVATE_DOMAIN'); t.flush(); assert.equal(a.platform, 'trt');
  assert.ok(t.messages.every(message => Object.keys(message).join() === 'type'));
});

test('protocol-enabled iframe renders its only normal HUD in the top page, not over the video', () => {
  const t = tree(true), top = t.frame(null, false), a = t.frame(top, true), b = t.frame(top, true);
  t.toolbar(top);
  assert.equal(top.visible, true); assert.equal(a.visible, false); assert.equal(b.visible, false);
  assert.equal([a, b].filter(f => f.sourceActive).length, 1);
  assert.equal(top.remoteState.hasVideo, true);
  assert.equal(t.frames.filter(f => f.visible).length, 1);
});

test('nested pinned branch carries commands only to the selected source and strips extra metadata', () => {
  const t = tree(true), top = t.frame(null, false), middle = t.frame(top, false), leaf = t.frame(middle, true), sibling = t.frame(top, true);
  t.toolbar(top); // The immediately ready sibling may win before the nested leaf.
  const source = t.frames.find(f => f.sourceActive);
  const command = { name: 'volume', value: 80, owner: top.remoteState.owner, revision: 1, url: 'PRIVATE_URL' };
  t.local(top, 'PVC_REMOTE_COMMAND', { session: top.remoteSession, id: 1, command }); t.flush();
  assert.equal(source.commands.length, 1); assert.equal(source.commands[0].value, 80);
  assert.equal(JSON.stringify(source.commands).includes('PRIVATE_URL'), false);
  assert.equal(t.frames.filter(f => f !== source).reduce((sum, f) => sum + f.commands.length, 0), 0);
});

test('a deeply nested source presents at the top and toolbar closes/reopens with a new session', () => {
  const t = tree(true), top = t.frame(null, false), middle = t.frame(top, false), leaf = t.frame(middle, true);
  t.toolbar(top); const previousSession = top.remoteSession;
  assert.equal(top.visible, true); assert.equal(middle.visible, false); assert.equal(leaf.sourceActive, true);
  t.toolbar(top); assert.equal(t.frames.filter(f => f.visible || f.sourceActive).length, 0);
  t.toolbar(top); assert.equal(top.visible, true); assert.equal(leaf.sourceActive, true);
  assert.notEqual(top.remoteSession, previousSession);
  assert.ok(t.frames.every(f => f.listeners.length === 1));
});

test('late state/close/hide from a prior session cannot reopen or close the new top presentation', () => {
  const t = tree(true), top = t.frame(null, false), leaf = t.frame(top, true);
  t.toolbar(top); const previousSession = top.remoteSession;
  t.toolbar(top); t.toolbar(top); const currentSession = top.remoteSession;
  t.from(leaf, top, 'NOK_REMOTE_STATE', { session: previousSession, state: fixture.state({ fullscreen: true }) });
  t.from(leaf, top, 'NOK_FRAME_CLOSED', { session: previousSession });
  t.from(top, leaf, 'NOK_FRAME_HIDE', { session: previousSession }); t.flush();
  assert.equal(top.remoteSession, currentSession); assert.equal(top.visible, true); assert.equal(leaf.sourceActive, true);
});

test('nonwinning sibling and malformed or unknown commands cannot drive the pinned source', () => {
  const t = tree(true), top = t.frame(null, false), a = t.frame(top, true), b = t.frame(top, true); t.toolbar(top);
  const source = a.sourceActive ? a : b, other = a.sourceActive ? b : a;
  t.from(other, top, 'NOK_REMOTE_STATE', { session: top.remoteSession, state: fixture.state({ fullscreen: true }) });
  t.local(top, 'PVC_REMOTE_COMMAND', { session: top.remoteSession, id: 1, command: { name: 'fetch', owner: top.remoteState.owner, revision: 1, value: 'PRIVATE_URL' } });
  t.local(top, 'PVC_REMOTE_COMMAND', { session: '0'.repeat(32), id: 2, command: { name: 'speed', owner: top.remoteState.owner, revision: 1, value: 2 } }); t.flush();
  assert.equal(top.visible, true); assert.equal(source.commands.length, 0);
});

test('ancestor iframe fullscreen moves the sole visible HUD to the leaf and exit restores top presentation', () => {
  const t = tree(true), top = t.frame(null, false), middle = t.frame(top, false), leaf = t.frame(middle, true); t.toolbar(top);
  top.context.document.fullscreenElement = middle.element; t.documentEvent(top, 'fullscreenchange');
  assert.equal(top.visible, false); assert.equal(middle.visible, false); assert.equal(leaf.visible, true);
  top.context.document.fullscreenElement = null; t.documentEvent(top, 'fullscreenchange');
  assert.equal(top.visible, true); assert.equal(leaf.visible, false);
  assert.equal(t.frames.filter(f => f.visible).length, 1);
});

test('child keyboard toggle requests reach the top and engine-ready recovers an early open request', () => {
  const t = tree(true), top = t.frame(null, false), leaf = t.frame(top, true);
  t.local(leaf, 'PVC_REQUEST_TOP_TOGGLE'); t.flush(); assert.equal(top.visible, true);
  t.local(leaf, 'PVC_REQUEST_TOP_TOGGLE'); t.flush(); assert.equal(top.visible, false);
  t.toolbar(top); t.local(leaf, 'PVC_ENGINE_READY'); t.flush();
  assert.equal(top.visible, true); assert.equal(t.frames.filter(f => f.visible).length, 1);
});
