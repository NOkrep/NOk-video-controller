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
    this.style = { values: {}, setProperty(name, value) { this.values[name] = value; } };
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
  add('language', 'pvc-language-row'); add('pvc-adapter-bar'); const footer = add('pvc-menu-footer');
  add('pvc-brand-footer', 'pvc-brand-footer');
  add('pvc-ping-btn', 'pvc-footer-btn', footer);
  const hotkeys = add('pvc-hotkeys-toggle-btn'); hotkeys.addEventListener('click', () => { hotkeys.retainedListener = true; });
  const timers = new Map(); let timerId = 0;
  const context = vm.createContext({
    document: { activeElement: null, createElement: tag => new Element(tag),
      getElementById: id => id === popup.id ? popup : popup.querySelector('#' + id) },
    window: { matchMedia: () => ({ matches: reducedMotion }), postMessage() {} },
    hotkeysEnabled: true, EXTENSION_VERSION: '0.7.7', popup,
    clampPopupToViewport() {}, idleDelaySeconds: 2, idleTimerStep1: null, idleTimerStep2: null,
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id)
  });
  vm.runInContext(section('  const UI_MESSAGES', '  // END UI LOCALIZATION')
    + section('  // Palette facts', '  // Presentation preferences')
    + section('  const hudAccessibility', '  // END HUD NAVIGATION')
    + section('  function resetIdleTimer', '  const SNAP_THRESHOLD'), context);
  const run = code => vm.runInContext(code, context);
  run('setupHudNavigation(popup)');
  return { popup, slider, file, hotkeys, context, run, timers, find: id => popup.querySelector('#' + id) };
}

test('only Player is shown initially; task groups retain existing controls and handlers', () => {
  const h = harness();
  assert.equal(h.find('pvc-panel-player').hidden, false);
  assert.equal(h.find('pvc-tab-picture'), null);
  assert.equal(h.popup.querySelector('.pvc-hud-tabs').getAttribute('aria-orientation'), 'vertical');
  assert.equal(h.find('pvc-panel-player').querySelector('#pvc-adapter-bar'), h.find('pvc-adapter-bar'));
  assert.equal(h.find('pvc-panel-settings').querySelector('#pvc-section-filters'), h.find('pvc-section-filters'));
  assert.equal(h.find('pvc-section-filters').classList.contains('pvc-section-collapsed'), true);
  for (const id of ['subtitles', 'settings']) assert.equal(h.find('pvc-panel-' + id).hidden, true);
  assert.equal(h.find('pvc-panel-player').querySelector('#pvc-speed-slider'), h.slider);
  assert.equal(h.find('pvc-panel-settings').querySelector('#pvc-hotkeys-toggle-btn'), h.hotkeys);
  h.hotkeys.emit('click'); assert.equal(h.hotkeys.retainedListener, true);
  assert.equal(h.find('pvc-accessibility').hasAttribute('open'), false);
});

test('NOk signature and version live only inside localized About FilmDeck in Settings', () => {
  const h=harness();
  const about=h.find('pvc-about'),brand=h.find('pvc-brand-footer');
  assert.equal(h.find('pvc-panel-settings').contains(about),true);
  assert.equal(about.contains(brand),true);
  assert.equal(h.find('pvc-panel-player').contains(brand),false);
  assert.match(about.textContent,/About FilmDeck/);
  assert.match(about.textContent,/Version 0\.7\.7/);
  h.run('setUiLanguage("tr",false)');
  assert.match(about.textContent,/FilmDeck Hakkında/);
});

test('click and vertical arrow/Home/End navigation maintain selection, focus, values and loaded subtitle input', () => {
  const h = harness();
  h.find('pvc-tab-subtitles').emit('click'); assert.equal(h.find('pvc-panel-subtitles').hidden, false);
  assert.equal(h.find('pvc-panel-player').hidden, true);
  h.find('pvc-tab-subtitles').emit('keydown', { key: 'ArrowDown' });
  assert.equal(h.find('pvc-tab-settings').getAttribute('aria-selected'), 'true');
  assert.equal(h.find('pvc-tab-settings').focused, true);
  assert.equal(h.find('pvc-tab-settings').tabIndex, 0); assert.equal(h.find('pvc-tab-player').tabIndex, -1);
  h.find('pvc-tab-settings').emit('keydown', { key: 'ArrowDown' });
  assert.equal(h.find('pvc-panel-player').hidden, false);
  h.find('pvc-tab-player').emit('keydown', { key: 'ArrowUp' });
  assert.equal(h.find('pvc-panel-settings').hidden, false);
  h.find('pvc-tab-settings').emit('keydown', { key: 'Home' });
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

test('pointer-retained focus no longer blocks idle hiding; keyboard interaction protects focus', () => {
  const h = harness(); h.context.document.activeElement = h.slider;
  h.popup.__nokKeyboardFocus = false;
  h.run('resetIdleTimer(popup)');
  for (let i = 0; i < 2; i++) { const pending = [...h.timers.values()]; h.timers.clear(); pending.forEach(fn => fn()); }
  assert.equal(h.popup.classList.contains('pvc-idle-hidden'), true);
  h.popup.__nokKeyboardFocus = true; h.run('resetIdleTimer(popup)');
  for (let i = 0; i < 2; i++) { const pending = [...h.timers.values()]; h.timers.clear(); pending.forEach(fn => fn()); }
  assert.equal(h.popup.classList.contains('pvc-idle-hidden'), false);
});

test('translated navigation and accessibility choices do not reset the selected tab', () => {
  const h = harness(); h.find('pvc-tab-settings').emit('click'); h.run('setUiLanguage("tr", false)');
  assert.equal(h.find('pvc-tab-settings').textContent, 'Ayarlar');
  assert.equal(h.find('pvc-tab-settings').getAttribute('aria-selected'), 'true');
  h.run('setUiLanguage("en", false)'); assert.equal(h.find('pvc-tab-settings').textContent, 'Settings');
  assert.equal(h.find('pvc-panel-settings').hidden, false);
});

test('normal and high-contrast palette text and selected-tab pairs retain at least 4.5:1 contrast', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'injected.css'), 'utf8');
  const palettes = [...css.matchAll(/\{([^{}]*--pvc-bg:[^{}]*)\}/g)];
  assert.equal(palettes.length, 2);
  const luminance = hex => {
    const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const block of palettes) {
    const colors = Object.fromEntries([...block[1].matchAll(/--pvc-([\w-]+):\s*(#[\da-f]{6})/g)].map(m => [m[1], m[2]]));
    for (const [a, b] of [['text', 'bg'], ['muted', 'elevated'], ['accent-ink', 'elevated'], ['bg', 'accent']]) {
      const x = luminance(colors[a]), y = luminance(colors[b]);
      assert.ok((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) >= 4.5, `${a} on ${b}`);
    }
  }
  // Color-pair math only; opacity, hover, focus, layout and real rendering require browser testing.
});

test('all 20 inspected palettes are available, grouped consistently with next/previous navigation', () => {
  const h = harness();
  const themes = JSON.parse(h.run('JSON.stringify(UI_THEMES)'));
  assert.equal(themes.length, 20); assert.equal(new Set(themes.map(theme => theme.id)).size, 20);
  assert.deepEqual(Object.fromEntries(['standard', 'light', 'oled'].map(family => [family, themes.filter(t => t.family === family).length])), { standard: 7, light: 7, oled: 6 });
  const select = h.find('pvc-theme-select');
  assert.deepEqual(select.childNodes.flatMap(group => group.childNodes.map(option => option.value)), themes.map(theme => theme.id));
  assert.equal(select.value, 'atlas');
  for (const theme of themes) {
    h.context.palette = theme.colors;
    for (const background of ['bg', 'surface', 'elevated']) {
      for (const ink of ['text', 'muted', 'accent-ink', 'success', 'warning', 'danger']) {
        assert.ok(h.run(`uiColorContrast(palette['${ink}'], palette['${background}'])`) >= 4.5, `${theme.id}: ${ink}/${background}`);
      }
    }
    assert.ok(h.run('uiColorContrast(palette["accent-on"], palette.accent)') >= 4.5, theme.id);
  }
});

test('theme changes update existing and future roots without resetting controls or writing storage', () => {
  const h = harness(); const slider = h.slider, file = h.file;
  h.find('pvc-tab-settings').emit('click');
  h.find('pvc-theme-select').value = 'paper'; h.find('pvc-theme-select').emit('change');
  assert.equal(h.popup.style.values['--pvc-bg'], '#FAFAFA'); assert.equal(h.popup.style.values['--pvc-scheme'], 'light');
  assert.equal(h.popup.getAttribute('data-pvc-theme'), 'paper');
  assert.equal(h.find('pvc-theme-name').textContent, 'Paper');
  assert.equal(h.find('pvc-speed-slider'), slider); assert.equal(slider.value, '1.5');
  assert.equal(h.find('pvc-sub-file-input'), file); assert.equal(file.value, 'PRIVATE_SUBTITLE.srt');
  assert.equal(h.find('pvc-panel-settings').hidden, false);
  const modal = new Element(); h.context.modal = modal; h.run('applyUiAccessibility(modal)');
  assert.equal(modal.getAttribute('data-pvc-theme'), 'paper'); assert.equal(modal.style.values['--pvc-scheme'], 'light');
  assert.equal(h.run('setUiTheme("unknown")'), false); assert.equal(h.run('currentUiThemeId'), 'paper');
  h.run('setUiTheme(UI_THEMES[0].id)'); h.find('pvc-theme-previous').emit('click');
  assert.equal(h.run('currentUiThemeId'), h.run('UI_THEMES.at(-1).id'));
  h.find('pvc-theme-next').emit('click'); assert.equal(h.run('currentUiThemeId'), h.run('UI_THEMES[0].id'));
  assert.equal(harness().run('currentUiThemeId'), 'atlas');
});

test('high contrast explains its override and does not discard the chosen theme', () => {
  const h = harness(); const control = h.find('pvc-a11y-highContrast');
  control.checked = true; control.emit('change');
  h.run('setUiTheme("glacier")');
  assert.equal(h.find('pvc-theme-contrast-note').hidden, false);
  assert.equal(h.popup.classList.contains('pvc-a11y-contrast'), true);
  control.checked = false; control.emit('change');
  assert.equal(h.find('pvc-theme-contrast-note').hidden, true);
  assert.equal(h.popup.getAttribute('data-pvc-theme'), 'glacier');
  assert.equal(h.popup.style.values['--pvc-scheme'], 'light');
  const css = fs.readFileSync(path.join(__dirname, '..', 'injected.css'), 'utf8');
  const highContrast = css.slice(css.indexOf('  --pvc-bg: #080c14'));
  for (const variable of ['bg', 'surface', 'text', 'muted', 'accent', 'scheme']) {
    assert.match(highContrast, new RegExp(`--pvc-${variable}: [^;]+ !important;`));
  }
});

test('theme family labels translate without changing the choice or selected settings tab', () => {
  const h = harness(); h.run('setUiTheme("daybreak"); setUiLanguage("tr", false)');
  const select = h.find('pvc-theme-select');
  assert.equal(select.childNodes[0].getAttribute('label'), 'Standart / koyu');
  assert.equal(select.childNodes[1].getAttribute('label'), 'Açık'); assert.equal(select.value, 'daybreak');
  h.run('setUiLanguage("en", false)'); assert.equal(select.childNodes[1].getAttribute('label'), 'Light');
});

test('CDN loader tracks the real async operation and restores the button afterwards', async () => {
  const h = harness(); let complete;
  h.context.testCdnPing = () => new Promise(resolve => { complete = resolve; });
  const start = source.indexOf("    popup.querySelector('#pvc-ping-btn').onclick =");
  const end = source.indexOf('\n    };', start) + '\n    };'.length;
  h.run(source.slice(start, end));
  const button = h.find('pvc-ping-btn');
  const promise = button.onclick({ stopPropagation() {} });
  assert.equal(button.disabled, true); assert.equal(button.getAttribute('aria-busy'), 'true');
  assert.equal(button.querySelector('.pvc-loading-grid').childNodes.length, 5);
  complete({ ms: 12 }); await promise;
  assert.equal(button.disabled, false); assert.equal(button.getAttribute('aria-busy'), 'false');
  assert.equal(button.querySelector('.pvc-loading-grid'), null); assert.match(button.textContent, /12 ms/);
  h.context.testCdnPing = async () => { throw new Error('synthetic failure'); };
  await button.onclick({ stopPropagation() {} });
  assert.equal(button.disabled, false); assert.equal(button.getAttribute('aria-busy'), 'false');
  assert.equal(button.querySelector('.pvc-loading-grid'), null);
});

test('component decoration is idempotent and retains checkbox values, input identity and listeners', () => {
  const h = harness(); const checkbox = new Element('INPUT'), button = new Element('BUTTON'), feedback = new Element('TEXTAREA');
  checkbox.type = 'checkbox'; checkbox.checked = true; feedback.value = 'PRIVATE_COMMENT';
  let afterCount = 0, changes = 0; checkbox.after = () => { afterCount++; };
  checkbox.addEventListener('change', () => { changes++; });
  const root = {
    querySelectorAll: selector => selector.includes('input[type=') ? [checkbox] : [button],
    querySelector: () => feedback
  };
  h.context.componentRoot = root; h.run('decorateUiComponents(componentRoot); decorateUiComponents(componentRoot)');
  assert.equal(afterCount, 1); assert.equal(checkbox.checked, true); assert.equal(checkbox.type, 'checkbox');
  assert.equal(feedback.value, 'PRIVATE_COMMENT'); assert.equal(feedback.classList.contains('pvc-feedback-field'), true);
  assert.equal(button.classList.contains('pvc-raised-button'), true);
  checkbox.emit('change'); assert.equal(changes, 1);
});
