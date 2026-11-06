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
const code = section('  // UI TOOLTIP', '  // END UI TOOLTIP');
function harness() {
  const context = vm.createContext({ writes: [], setUiAttribute(element, name, value) { context.writes.push(value); element.attributes[name] = value; } });
  vm.runInContext(code, context);
  return { context, run: text => vm.runInContext(text, context) };
}
const element = () => ({ attributes: {}, removeAttribute(name) { delete this.attributes[name]; }, setAttribute(name, value) { this.attributes[name] = value; } });
const viewport = { width: 1000, height: 700 };
const rect = (left, top, width = 100, height = 30) => ({ left, top, width, height, right: left + width, bottom: top + height });
const place = (target, size = { width: 200, height: 60 }, view = viewport) => { const h = harness(); h.context.args = [target, size, view]; return h.run('tooltipPosition(...args)'); };

test('it sits above its target, centred, with its origin on the target', () => {
  const at = place(rect(400, 300));
  assert.equal(at.below, false); assert.equal(at.top, 300 - 60 - 8); assert.equal(at.left, 350); assert.equal(at.originX, 100);
});

test('it flips below when there is no room above, and stays above when neither side fits better', () => {
  assert.equal(place(rect(400, 10)).below, true);
  assert.equal(place(rect(400, 10)).top, 48);
  assert.equal(place(rect(400, 660), { width: 200, height: 60 }).below, false);
  const tall = place(rect(400, 20, 100, 30), { width: 200, height: 690 });
  assert.equal(tall.top, 8, 'a tooltip taller than the view starts at the margin');
});

test('it never leaves the viewport sideways, and its origin still points at the target', () => {
  const left = place(rect(0, 300, 40));
  assert.equal(left.left, 8); assert.equal(left.originX, 12);
  const right = place(rect(960, 300, 40));
  assert.equal(right.left, 1000 - 200 - 8); assert.equal(right.originX, 188);
  const narrow = place(rect(10, 300), { width: 300, height: 60 }, { width: 200, height: 700 });
  assert.equal(narrow.left, 8, 'wider than the view: the start stays readable');
});

test('every adapter a frame can report has an explanation by its real level', () => {
  const h = harness();
  const tips = name => { h.context.name = name; return h.run('adapterTip(name)'); };
  for (const name of ['KickAdapter', 'TrtAdapter', 'NowTvAdapter', 'PuhuTvAdapter']) assert.match(tips(name), /Siteye özel/);
  for (const name of ['YouTubeAdapter', 'VideoJsAdapter', 'HlsJsAdapter', 'ShakaPlayerAdapter', 'DashJsAdapter']) assert.match(tips(name), /kütüphanesi/);
  assert.match(tips('GenericAdapter'), /Evrensel/);
  for (const name of ['none', 'unknown', 'Otomatik']) assert.equal(tips(name), null);
  const declared = [...source.matchAll(/name: '(\w+Adapter)',\n\s+(?:priority: \d+,\n\s+)?tier: (\d)/g)];
  for (const [, name, tier] of declared) { h.context.name = name; assert.equal(h.run('ADAPTER_TIERS[name]'), Number(tier), name); }
});

test('a quality chip explains its live state first, then what it knows about itself', () => {
  const h = harness();
  const tip = (base, status) => { h.context.args = [base, status]; return h.run('qualityChipTip(...args)'); };
  assert.equal(tip('5.0 Mb/sn', null), '5.0 Mb/sn');
  assert.equal(tip(null, null), null, 'nothing useful means no tooltip at all');
  for (const status of ['pending', 'confirmed', 'decoded-match', 'rendition-confirmed', 'timed-out', 'rejected']) assert.ok(tip('5.0 Mb/sn', status) && tip('5.0 Mb/sn', status) !== '5.0 Mb/sn', status);
  assert.equal(tip('5.0 Mb/sn', 'not-verified'), '5.0 Mb/sn');
});

test('an unchanged tip does not write the attribute on every panel tick', () => {
  const h = harness(), node = element(); h.context.node = node;
  h.run('setUiTip(node, "Same"); setUiTip(node, "Same"); setUiTip(node, "Same")');
  assert.equal(h.context.writes.length, 1);
  h.run('setUiTip(node, null)'); assert.equal('data-pvc-tip' in node.attributes, false);
  h.run('setUiTip(node, "Same")'); assert.equal(node.attributes['data-pvc-tip'], 'Same');
});

test('a status gets a keyboard stop only while it has something to explain', () => {
  const h = harness(), node = element(); h.context.node = node;
  h.run('setUiTipStop(node, "Why")'); assert.equal(node.attributes.tabindex, '0');
  h.run('setUiTipStop(node, null)'); assert.equal('tabindex' in node.attributes, false);
});

test('new tips exist in both languages and the three surfaces use them, not native titles', () => {
  const messages = section('const UI_MESSAGES = {', '\n  };\n');
  const h = harness();
  for (const tip of [...Object.values(h.run('ADAPTER_TIER_TIPS')), ...Object.values(h.run('QUALITY_STATUS_TIPS'))]) assert.ok(messages.includes(`'${tip}':`), `no English for: ${tip}`);
  for (const pattern of [/id="pvc-ping-btn"[^>]*\btitle=/, /setUiAttribute\(button, 'title'/, /setUiAttribute\(badge, 'title'/, /setUiAttribute\(btn, 'title'/]) assert.doesNotMatch(source, pattern);
  assert.match(source, /for \(const name of \['title', 'aria-label', 'placeholder', 'label', 'data-pvc-tip'\]\)/, 'the panel language updates tips');
});

test('it is own code with no timer or listener left running while closed', () => {
  const bind = section('  function bindTooltips(popup)', '\n  // END UI TOOLTIP');
  assert.doesNotMatch(bind, /setInterval|requestAnimationFrame|localStorage|fetch\(|innerHTML|setUiMarkup/);
  assert.match(bind, /tip\.textContent = /, 'text only, never markup');
  assert.match(bind, /window\.addEventListener\('keydown', onKey, true\)/); assert.match(bind, /window\.removeEventListener\('keydown', onKey, true\)/);
  assert.match(bind, /document\.addEventListener\('pointerdown', onOutside, true\)/); assert.match(bind, /document\.removeEventListener\('pointerdown', onOutside, true\)/);
});

test('its motion is short, compositor-only and covered by the panel settings', () => {
  const at = css.indexOf('#pvc-controller-popup .pvc-tooltip {'); assert.ok(at >= 0);
  const rule = css.slice(at, css.indexOf('}', at));
  assert.match(rule, /transition: opacity 0\.125s .*transform 0\.125s /);
  assert.match(rule, /transform: scale\(0\.97\)/);
  assert.match(css, /#pvc-controller-popup\.pvc-a11y-large-text \.pvc-tooltip/);
  assert.match(css, /#pvc-controller-popup\.pvc-a11y-reduce-motion \.pvc-tooltip \{ transition: none !important;/, 'the general rule has the same weight and comes earlier');
  assert.match(css, /#pvc-controller-popup \.pvc-tooltip\[hidden\] \{ display: none !important; \}/);
});
