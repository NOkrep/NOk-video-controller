const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'injected.js'), 'utf8');
function section(from, to) { return source.slice(source.indexOf(from), source.indexOf(to, source.indexOf(from))); }

// Structural/event DOM model. This cannot prove CSS layout or screen-reader behaviour.
class Element {
  constructor(tagName = 'DIV') {
    this.tagName = tagName.toUpperCase(); this.nodeType = 1; this.childNodes = []; this.attributes = {};
    this.listeners = {}; this.hidden = false; this.checked = false; this.value = '';
    this.style = { setProperty() {} };
    this.classList = {
      contains: name => this.className.split(' ').includes(name),
      add: name => this.classList.toggle(name, true), remove: name => this.classList.toggle(name, false),
      toggle: (name, force) => {
        const classes = new Set(this.className.split(' ').filter(Boolean));
        const on = force ?? !classes.has(name); if (on) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' '); return on;
      }
    }; this.className = '';
  }
  set textContent(value) { this.childNodes = [{ nodeType: 3, nodeValue: value }]; }
  get textContent() { return this.childNodes.map(n => n.nodeType === 3 ? n.nodeValue : n.textContent).join(''); }
  get firstChild() { return this.childNodes[0]; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
  appendChild(child) { return this.insertBefore(child, null); }
  insertBefore(child, reference) {
    if (child.parent) child.parent.childNodes.splice(child.parent.childNodes.indexOf(child), 1);
    const i = reference ? this.childNodes.indexOf(reference) : this.childNodes.length;
    assert.ok(i >= 0); this.childNodes.splice(i, 0, child); child.parent = this; return child;
  }
  querySelector(selector) {
    for (const child of this.childNodes) {
      if (child.nodeType !== 1) continue;
      if (selector.startsWith('#') ? child.id === selector.slice(1) : child.classList.contains(selector.slice(1))) return child;
      const result = child.querySelector(selector); if (result) return result;
    }
    return null;
  }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  emit(type, data = {}) { for (const callback of this.listeners[type] || []) callback({ stopPropagation() {}, preventDefault() {}, ...data }); }
  focus() { this.focused = true; }
  matches() { return false; }
  contains(node) { return node === this || this.childNodes.some(child => child.nodeType === 1 && child.contains(node)); }
}

function harness(reducedMotion = false) {
  const popup = new Element(); popup.id = 'pvc-controller-popup';
  const add = (id, cls, parent = popup) => { const el = new Element(); el.id = id; el.className = cls || ''; parent.appendChild(el); return el; };
  const speed = add('pvc-section-speed', 'pvc-menu-section');
  const slider = add('pvc-speed-slider', '', speed); slider.value = '1.5';
  const audio = add('pvc-section-audio', 'pvc-menu-section'); audio.savedVolume = 75;
  add('pvc-section-quality', 'pvc-menu-section pvc-section-collapsed');
  const picture = add('pvc-section-filters', 'pvc-menu-section pvc-section-collapsed');
  add('picture-heading', 'pvc-section-header', picture);
  const subtitles = add('pvc-section-subtitles', 'pvc-menu-section pvc-section-collapsed');
  add('subtitle-heading', 'pvc-section-header', subtitles);
  const file = add('pvc-sub-file-input', '', subtitles); file.value = 'PRIVATE_SUBTITLE.srt';
  add('language', 'pvc-language-row'); add('pvc-adapter-bar'); add('pvc-menu-footer');
  const hotkeys = add('pvc-hotkeys-toggle-btn'); hotkeys.addEventListener('click', () => { hotkeys.retainedListener = true; });
  const timers = new Map(); let timerId = 0;
  const context = vm.createContext({
    document: { activeElement: null, createElement: tag => new Element(tag),
      getElementById: id => id === popup.id ? popup : popup.querySelector('#' + id) },
    window: { matchMedia: () => ({ matches: reducedMotion }), postMessage() {} },
    hotkeysEnabled: true, popup,
    clampPopupToViewport() {}, idleDelaySeconds: 2, idleTimerStep1: null, idleTimerStep2: null,
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id)
  });
  vm.runInContext(section('  const UI_MESSAGES', '  // END UI LOCALIZATION')
    + section('  const hudAccessibility', '  // END HUD NAVIGATION')
    + section('  function resetIdleTimer', '  const SNAP_THRESHOLD'), context);
  const run = code => vm.runInContext(code, context);
  run('setupHudNavigation(popup)');
  return { popup, slider, file, hotkeys, context, run, timers, find: id => popup.querySelector('#' + id) };
}

test('only Player is shown initially; task groups retain existing controls and handlers', () => {
  const h = harness();
  assert.equal(h.find('pvc-panel-player').hidden, false);
  for (const id of ['picture', 'subtitles', 'settings']) assert.equal(h.find('pvc-panel-' + id).hidden, true);
  assert.equal(h.find('pvc-panel-player').querySelector('#pvc-speed-slider'), h.slider);
  assert.equal(h.find('pvc-panel-settings').querySelector('#pvc-hotkeys-toggle-btn'), h.hotkeys);
  h.hotkeys.emit('click'); assert.equal(h.hotkeys.retainedListener, true);
  assert.equal(h.find('pvc-accessibility').hasAttribute('open'), false);
});

test('click and arrow/Home/End navigation maintain selection, focus, values and loaded subtitle input', () => {
  const h = harness();
  h.find('pvc-tab-subtitles').emit('click'); assert.equal(h.find('pvc-panel-subtitles').hidden, false);
  assert.equal(h.find('pvc-panel-player').hidden, true);
  h.find('pvc-tab-subtitles').emit('keydown', { key: 'ArrowRight' });
  assert.equal(h.find('pvc-tab-settings').getAttribute('aria-selected'), 'true');
  assert.equal(h.find('pvc-tab-settings').focused, true);
  assert.equal(h.find('pvc-tab-settings').tabIndex, 0); assert.equal(h.find('pvc-tab-player').tabIndex, -1);
  h.find('pvc-tab-settings').emit('keydown', { key: 'ArrowRight' });
  assert.equal(h.find('pvc-panel-player').hidden, false);
  h.find('pvc-tab-player').emit('keydown', { key: 'End' }); assert.equal(h.find('pvc-panel-settings').hidden, false);
  h.find('pvc-tab-settings').emit('keydown', { key: 'Home' }); assert.equal(h.find('pvc-panel-player').hidden, false);
  assert.equal(h.slider.value, '1.5'); assert.equal(h.file.value, 'PRIVATE_SUBTITLE.srt');
});

test('keep-visible cancels idle timers and turning it off restores auto-hide; focused controls stay visible', () => {
  const h = harness(); assert.ok(h.timers.size > 0);
  const checkbox = h.find('pvc-a11y-keepVisible'); checkbox.checked = true; checkbox.emit('change');
  assert.equal(h.timers.size, 0); assert.equal(h.run('hudAccessibility.keepVisible'), true);
  checkbox.checked = false; checkbox.emit('change'); assert.ok(h.timers.size > 0);
  h.context.document.activeElement = checkbox;
  const first = [...h.timers.values()]; h.timers.clear(); first.forEach(fn => fn());
  assert.equal(h.popup.classList.contains('pvc-idle-semi'), false);
  const next = [...h.timers.values()]; h.timers.clear(); next.forEach(fn => fn());
  assert.equal(h.popup.classList.contains('pvc-idle-hidden'), false);
});

test('presentation preferences apply locally, respect reduced-motion default, and reset in a fresh page', () => {
  const h = harness(true); assert.equal(h.popup.classList.contains('pvc-a11y-reduce-motion'), true);
  const motion = h.find('pvc-a11y-reduceMotion'); motion.checked = false; motion.emit('change');
  assert.equal(h.popup.classList.contains('pvc-a11y-reduce-motion'), false);
  for (const [key, cls] of [['largeText', 'pvc-a11y-large-text'], ['highContrast', 'pvc-a11y-contrast']]) {
    const checkbox = h.find('pvc-a11y-' + key); checkbox.checked = true; checkbox.emit('change');
    assert.equal(h.popup.classList.contains(cls), true);
    checkbox.checked = false; checkbox.emit('change'); assert.equal(h.popup.classList.contains(cls), false);
  }
  const modal = new Element(); h.context.modal = modal;
  h.run('hudAccessibility.highContrast = true; applyUiAccessibility(modal)');
  assert.equal(modal.classList.contains('pvc-a11y-contrast'), true);
  const fresh = harness(); assert.equal(fresh.run('hudAccessibility.largeText'), false);
  assert.equal(fresh.run('hudAccessibility.keepVisible'), false); assert.equal(fresh.run('uiLanguage'), 'en');
});

test('translated navigation and accessibility choices do not reset the selected tab', () => {
  const h = harness(); h.find('pvc-tab-settings').emit('click'); h.run('setUiLanguage("tr", false)');
  assert.equal(h.find('pvc-tab-settings').textContent, 'Ayarlar');
  assert.equal(h.find('pvc-tab-settings').getAttribute('aria-selected'), 'true');
  h.run('setUiLanguage("en", false)'); assert.equal(h.find('pvc-tab-settings').textContent, 'Settings');
  assert.equal(h.find('pvc-panel-settings').hidden, false);
});
