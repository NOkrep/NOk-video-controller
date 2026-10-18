const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const content = fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');

function tree() {
  const queue = [], messages = [], frames = []; let executing = null;
  function frame(parent, hasVideo) {
    const f = { children: [], hasVideo, visible: false, listeners: [], language: null };
    f.window = {
      addEventListener: (_type, callback) => f.listeners.push(callback),
      postMessage: data => {
        queue.push({ from: executing?.window, to: f, data });
        messages.push(data);
      }
    };
    f.window.parent = parent?.window || f.window;
    if (parent) parent.children.push(f);
    f.context = vm.createContext({
      window: f.window,
      document: { readyState: 'loading', head: { appendChild() {} }, createElement: () => ({ dataset: {} }),
        querySelectorAll: () => f.children.map(child => ({ contentWindow: child.window })) },
      chrome: { runtime: { getURL: file => 'extension:///' + file } }
    });
    executing = f; vm.runInContext(content, f.context); executing = null;
    frames.push(f); return f;
  }
  function local(f, type) {
    executing = f; f.window.postMessage({ type }); executing = null;
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
        if (data.type === 'PVC_HIDE_POPUP') to.visible = false;
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
  function toolbar(f) { executing = f; vm.runInContext(content, f.context); executing = null; flush(); }
  return { frame, local, flush, toolbar, frames, messages };
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
