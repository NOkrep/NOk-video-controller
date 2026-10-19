const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const source = readFileSync(join(__dirname, '..', 'injected.js'), 'utf8');
const localization = source.slice(source.indexOf('  const UI_MESSAGES'), source.indexOf('  // END UI LOCALIZATION'));

// DOM model for text/attributes only: deliberately makes no layout or browser claims.
class Element {
  constructor(tagName = 'DIV', attributes = {}, children = []) {
    this.nodeType = 1; this.tagName = tagName; this.attributes = attributes; this.childNodes = children;
    this.value = ''; this.checked = false;
  }
  set textContent(value) { this.childNodes = [{ nodeType: 3, nodeValue: value }]; }
  get textContent() { return this.childNodes.map(node => node.nodeType === 3 ? node.nodeValue : node.textContent).join(''); }
  get firstChild() { return this.childNodes[0]; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
}
const text = nodeValue => ({ nodeType: 3, nodeValue });
function parseMarkup(markup) {
  const root = new Element(), stack = [root];
  for (const match of markup.matchAll(/<!--[\s\S]*?-->|<\/?[\w-]+\b[^>]*>|[^<]+/g)) {
    const token = match[0];
    if (token.startsWith('<!--')) continue;
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (token.startsWith('<')) {
      const name = token.match(/^<([\w-]+)/)[1].toUpperCase();
      const attrs = Object.fromEntries([...token.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].slice(1).map(m => [m[1], m[2] ?? '']));
      const el = new Element(name, attrs); stack.at(-1).childNodes.push(el);
      if (!['INPUT', 'BR', 'IMG', 'HR'].includes(name) && !token.endsWith('/>')) stack.push(el);
    } else stack.at(-1).childNodes.push(text(token));
  }
  return root;
}
function harness(language = 'en-US', roots = {}) {
  const signals = [];
  const context = vm.createContext({ navigator: { language }, document: { getElementById: id => roots[id] || null },
    window: { postMessage: message => signals.push(message) } });
  vm.runInContext(localization, context);
  return { context, signals, run: code => vm.runInContext(code, context) };
}

test('every browser language starts in English; Turkish remains an explicit choice', () => {
  for (const [language, expected] of [['tr-TR', 'en'], ['TR', 'en'], ['en-GB', 'en'], ['de-DE', 'en'], ['', 'en']]) {
    assert.equal(harness(language).run('uiLanguage'), expected);
  }
  const h = harness('tr-TR');
  h.run('setUiLanguage("tr", false)'); assert.equal(h.run('uiLanguage'), 'tr');
  h.run('setUiLanguage("en", false)');
  h.run('setUiLanguage("invalid")'); assert.equal(h.run('uiLanguage'), 'en'); assert.equal(h.signals.length, 0);
});

test('English catalogue preserves placeholders and translates dynamic feedback without treating values as markup', () => {
  const h = harness();
  for (const [key, value] of Object.entries(h.run('UI_MESSAGES'))) {
    assert.deepEqual(key.match(/\{\d+\}/g) || [], value.match(/\{\d+\}/g) || [], key);
  }
  assert.equal(h.run('uiText("⚡ Hız: 1.5x")'), '⚡ Speed: 1.5x');
  assert.equal(h.run('uiText("✅ movie<script>.srt (12 satır RAM\'de)")'), '✅ movie<script>.srt (12 subtitle cues)');
  h.context.message = "✅ Kalite  $& {0}.srt (12 satır RAM'de)";
  assert.equal(h.run('uiText(message)'), '✅ Kalite  $& {0}.srt (12 subtitle cues)');
  assert.equal(h.run('uiText("720p · oynatılan")'), '720p · playing');
  assert.equal(h.run('uiText("📡 CDN yanıtı")'), '📡 CDN response');
  assert.equal(h.run('uiText("🔊 Ses: %200 (🚀 +100% Booster)")'), '🔊 Volume: 200% (🚀 +100% boost)');
  assert.equal(h.run('uiText("🔊 Ses: %100 (🛡️ DRM: Yerel %100 Limiti)")'), '🔊 Volume: 100% (🛡️ DRM: native 100% limit)');
});

test('changing language preserves live inputs, node identity, diagnostic JSON and subtitles', () => {
  const label = new Element('SPAN', { title: 'Oynatma hızı' }, [text('Kalite')]);
  const select = new Element('SELECT'); select.value = 'quality';
  const comment = new Element('TEXTAREA', { placeholder: 'İsteğe bağlı açıklama' }); comment.value = 'PRIVATE_COMMENT';
  const checkbox = new Element('INPUT'); checkbox.checked = true;
  const json = new Element('PRE', {}, [text('{"problem":"quality","userComments":"Kalite"}')]);
  const cue = new Element('SPAN', { 'data-pvc-i18n-skip': '' }, [text('Kalite')]);
  const root = new Element('DIV', {}, [label, select, comment, checkbox, json, cue]);
  const h = harness('tr', { 'pvc-controller-popup': root });
  h.run('setUiLanguage("en")');
  assert.equal(label.textContent, 'Quality'); assert.equal(label.getAttribute('title'), 'Playback speed');
  assert.equal(root.childNodes[1], select); assert.equal(select.value, 'quality');
  assert.equal(comment.value, 'PRIVATE_COMMENT'); assert.equal(checkbox.checked, true);
  assert.equal(json.textContent, '{"problem":"quality","userComments":"Kalite"}'); assert.equal(cue.textContent, 'Kalite');
  h.run('setUiLanguage("tr")'); assert.equal(label.textContent, 'Kalite');
  assert.equal(label.getAttribute('title'), 'Oynatma hızı'); assert.equal(root.getAttribute('lang'), 'tr');
  assert.equal(h.signals.length, 2);
  assert.ok(h.signals.every(message => Object.keys(message).join() === 'type'));
});

test('dynamic labels retain their current source across repeated language switches', () => {
  const root = new Element(); const h = harness('tr', { 'pvc-controller-popup': root });
  h.context.label = root;
  h.run('setUiText(label, "⚡ Hız: 2x"); setUiLanguage("en")'); assert.equal(root.textContent, '⚡ Speed: 2x');
  h.run('setUiText(label, "⚡ Hız: 1.5x"); setUiLanguage("tr")'); assert.equal(root.textContent, '⚡ Hız: 1.5x');
});

test('main panel English text and accessible names contain no untranslated Turkish words', () => {
  const start = source.indexOf('    popup.innerHTML = `');
  const end = source.indexOf('\n    `;', start);
  const literal = source.slice(start + '    popup.innerHTML = '.length, end + '\n    `'.length);
  const h = harness(); h.context.EXTENSION_VERSION = '0.5.10';
  h.context.root = parseMarkup(h.run(literal)); h.run('localizeUi(root)');
  const remaining = [];
  function inspect(node) {
    if (node.hasAttribute?.('data-pvc-i18n-skip')) return;
    if (node.nodeType === 3 && /[çğıöşüÇĞİÖŞÜ]/.test(node.nodeValue)) remaining.push(node.nodeValue.trim());
    for (const value of Object.values(node.attributes || {})) if (/[çğıöşüÇĞİÖŞÜ]/.test(value)) remaining.push(value);
    for (const child of node.childNodes || []) inspect(child);
  }
  inspect(h.context.root); assert.deepEqual(remaining, []);
});

test('all dialog templates translate privacy, deletion and shortcut explanations', () => {
  const h = harness();
  Object.assign(h.context, { EXTENSION_VERSION: '0.5.10', HOSTNAME: 'example.invalid', drm: { keySystem: 'Widevine' }, optionsHtml: '' });
  const templates = [...source.matchAll(/modal\.innerHTML = (`[\s\S]*?`);/g)];
  assert.equal(templates.length, 4);
  for (const template of templates) {
    h.context.root = parseMarkup(h.run(template[1])); h.run('localizeUi(root)');
    assert.doesNotMatch(h.context.root.textContent, /[çğıöşüÇĞİÖŞÜ]/);
  }
});

test('extension metadata has both locales and an English fallback without new permissions', () => {
  const manifest = JSON.parse(readFileSync(join(__dirname, '..', 'manifest.json'), 'utf8'));
  assert.equal(manifest.default_locale, 'en');
  for (const lang of ['tr', 'en']) {
    const messages = JSON.parse(readFileSync(join(__dirname, '..', '_locales', lang, 'messages.json'), 'utf8'));
    assert.ok(messages.extensionDescription.message);
  }
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting']); assert.deepEqual(manifest.host_permissions, []);
});
