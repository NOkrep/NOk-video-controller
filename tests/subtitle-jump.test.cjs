const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Large shifts (a file that joins two episodes): type the shift, or pick the line heard now.
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'injected.js'), 'utf8').replace(/\r\n/g, '\n');
require(path.join(root, 'frame-protocol.js'));
const protocol = globalThis.NOkFrameProtocol;
const { state, report } = require('./frame-fixtures.cjs');
function section(from, to) {
  const a = source.indexOf(from), b = source.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `missing section ${from}`); return source.slice(a, b);
}
const context = vm.createContext({});
vm.runInContext(section('  // SUBTITLE EXPLANATION', '  // END SUBTITLE EXPLANATION') + section('  // SUBTITLE LINES', '  // END SUBTITLE LINES'), context);
const run = (text, values = {}) => { Object.assign(context, values); return vm.runInContext(text, context); };
const parse = text => run('parseSubtitleOffsetInput(value)', { value: text });

test('a typed shift reads minutes, hours, seconds and milliseconds, with either minus sign', () => {
  assert.equal(parse('-41:35'), -2495000);
  assert.equal(parse('−41:35'), -2495000, 'the typographic minus');
  assert.equal(parse('+1:02:03.5'), 3723500);
  assert.equal(parse('2.5'), 2500); assert.equal(parse('-2,5'), -2500, 'a decimal comma');
  assert.equal(parse('2.5s'), 2500); assert.equal(parse('3 sn'), 3000);
  assert.equal(parse('-2500ms'), -2500); assert.equal(parse(' - 41 : 35 '), -2495000, 'spaces are ignored');
  assert.equal(parse('0'), 0); assert.equal(Object.is(parse('-0'), -0), false, 'no negative zero');
  for (const bad of ['', 'abc', '41:75', '1:61:00', '--5', '5:', ':30', '7:00:00']) assert.equal(parse(bad), null, `refused: ${bad}`);
  assert.equal(parse('6:00:00'), 21600000, 'six hours is the limit');
});

test('a shift reads as milliseconds below a minute and as a clock from a minute on', () => {
  const text = (ms, spaced) => run('subtitleOffsetText(ms, spaced)', { ms, spaced });
  assert.equal(text(0, false), '0ms'); assert.equal(text(250, false), '+250ms'); assert.equal(text(-250, true), '-250 ms');
  assert.equal(text(-2495000, true), '-41:35.0'); assert.equal(text(3723540, true), '+1:02:03.5');
  assert.equal(text(59999, true), '+59999 ms'); assert.equal(text(-60000, true), '-1:00.0');
});

test('the line picker searches the whole file without case or Turkish accents, and lists the lines around now without words', () => {
  const cues = [];
  for (let i = 0; i < 40; i++) cues.push({ start: i * 60, end: i * 60 + 3, text: `Satır ${i}` });
  cues[30].text = '<i>Işığı</i> KAPAT\nŞimdi';
  const find = (query, clock) => Array.from(run('findSubtitleLines(cues, query, clock)', { cues, query, clock }), cue => cue.start);
  assert.deepEqual(find('isigi kapat', -1), [1800], 'tags, case and accents are ignored; every word must match');
  assert.deepEqual(find('ışığı', -1), [1800]);
  assert.deepEqual(find('yok', -1), []);
  assert.deepEqual(find('', 600), [300, 360, 420, 480, 540, 600, 660, 720, 780, 840], 'five before and five from the current line');
  assert.deepEqual(find('', -1), [0, 60, 120, 180, 240, 300, 360, 420, 480, 540], 'before the file starts: the first lines');
  assert.deepEqual(find('', 99999), [1800, 1860, 1920, 1980, 2040, 2100, 2160, 2220, 2280, 2340], 'after the file ends: the last lines');
  assert.equal(run('subtitleLineText(cue)', { cue: cues[30] }), 'Işığı KAPAT Şimdi');
  assert.equal(run('findSubtitleLines(many, "satır", -1)', { many: Array.from({ length: 500 }, (_, i) => ({ start: i, end: i + 1, text: 'satır' })) }).length, 40, 'at most 40 results');
  assert.equal(run('formatCueTime(2495.9)'), '41:35'); assert.equal(run('formatCueTime(3723)'), '1:02:03');
});

test('the frame bridge carries a typed shift, a chosen line and the subtitle clock; reports allow the longer range', () => {
  const command = (name, value) => protocol.cleanCommand({ name, owner: 'b'.repeat(32), revision: 1, value });
  assert.equal(command('subtitle-offset-set', -2495000).value, -2495000);
  assert.equal(command('subtitle-offset-set', 21600001), null); assert.equal(command('subtitle-offset-set', 2.5), null, 'whole milliseconds');
  assert.equal(command('subtitle-align', 2495.4).value, 2495.4); assert.equal(command('subtitle-align', -1), null); assert.equal(command('subtitle-align', 'line'), null);
  assert.equal(protocol.cleanState(state({ subtitleOffset: -2495000, subtitleClock: 12.5 })).subtitleClock, 12.5);
  assert.equal(protocol.cleanState(state({ subtitleClock: 'line' })), null);
  const videoState = { ...report().videoState, subtitleLoaded: true, subtitleOffsetMs: -2495000, subtitleDriftMsPerMinute: 0 };
  const events = [{ ageSeconds: 5, level: 'INFO', event: 'SUBTITLE_LINE_ALIGNED', details: {} }, { ageSeconds: 5, level: 'INFO', event: 'SUBTITLE_OFFSET_CHANGED', details: { offsetMs: -2495000 } }];
  assert.equal(protocol.cleanReport(report({ videoState, recentEvents: events })).videoState.subtitleOffsetMs, -2495000);
  const builder = section('  function buildDiagnosticPayload', '  function reportAnonymousError');
  assert.doesNotMatch(builder, /subtitleClock|subtitleLineText|customSubtitleCues\[/, 'no clock and no line in a report');
});

test('lines reach the panel as text only, the shared controls exist in both layouts and every new text is translated', () => {
  const render = section('  function renderSubtitleLines', '  function bindSubtitleLinePicker');
  assert.doesNotMatch(render, /innerHTML|insertAdjacentHTML|outerHTML|setUiMarkup\(list, [^']/, 'no HTML strings (Trusted Types)');
  assert.match(render, /text\.textContent = subtitleLineText\(cue\)/); assert.match(render, /'data-pvc-i18n-skip'/, 'a line is never translated');
  for (const id of ['pvc-tb-sub-offset-input', 'pvc-tb-sub-offset-apply', 'pvc-tb-sub-line-search', 'pvc-tb-sub-lines', 'pvc-sub-offset-input', 'pvc-sub-offset-apply', 'pvc-sub-line-search', 'pvc-sub-lines', 'pvc-sub-jump']) {
    assert.match(source, new RegExp(`id="${id}"`), id);
  }
  for (const key of ['Uygula', 'Kaymayı yaz (− erken, + geç)', 'örn. -41:35 veya +2.5', 'Kaymayı yaz veya satır seç', 'Şu an bu satır', 'Satır ara', 'Altyazı satırları',
    'Duyduğunuz bir kelimeyi yazın', 'Şu an duyduğunuz satırı seçin; altyazı o satırdan devam eder.', 'Eşleşen satır yok.',
    'Satırlar oynatıcı çerçevesinde; listelemek için dosyayı bu panelden yeniden yükleyin.', 'Kayma anlaşılamadı. Örnek: -41:35, +2.5 veya -2500ms', '💬 Altyazı Senkronu: {0}']) {
    assert.ok(source.includes(`'${key}':`), `${key} is translated`);
  }
  assert.ok(source.indexOf("'💬 Altyazı Senkronu: {0}ms':") < source.indexOf("'💬 Altyazı Senkronu: {0}':"), 'the ms pattern is matched first');
});
