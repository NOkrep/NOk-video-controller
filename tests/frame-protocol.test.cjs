const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { state, report, session, owner } = require('./frame-fixtures.cjs');
const source = fs.readFileSync(path.join(__dirname, '..', 'frame-protocol.js'), 'utf8');
const context = vm.createContext({}); vm.runInContext(source, context);
const protocol = context.NOkFrameProtocol;
const json = value => JSON.parse(JSON.stringify(value));

test('protocol round-trips bounded UI state and never relays extra URLs, page text, position or identifiers', () => {
  const input = state({ url: 'PRIVATE_URL', currentTime: 12345, title: 'PRIVATE_TITLE' });
  input.qualities[0].source = 'PRIVATE_SOURCE'; input.candidates[0].id = 'PRIVATE_ACCOUNT';
  const cleaned = json(protocol.cleanState(input));
  assert.deepEqual(cleaned, state());
  assert.equal(JSON.stringify(cleaned).includes('PRIVATE'), false);
});

test('state rejects unknown enums, nonfinite values, out-of-range controls and unbounded lists', () => {
  for (const extra of [{ adapter: 'PRIVATE_LABEL' }, { requestedRate: 16 }, { requestedIndex: 128 }, { height: Infinity }, { fullscreen: 1 },
    { qualities: Array.from({ length: 129 }, () => ({ height: 720, bitrate: 0 })) }, { candidates: Array.from({ length: 33 }, () => ({ height: 720 })) }]) {
    assert.equal(protocol.cleanState(state(extra)), null);
  }
  assert.equal(protocol.cleanState(state({ appearance: { fontSize: 200, bottom: 8, background: 82, color: 'white' } })), null);
});

test('commands reconstruct only known fields and enforce owner, revision and control bounds', () => {
  const input = { name: 'speed', owner, revision: 3, value: 1.5, url: 'SECRET', arbitraryMethod: 'fetch' };
  assert.deepEqual(json(protocol.cleanCommand(input)), { name: 'speed', owner, revision: 3, value: 1.5 });
  for (const name of ['fetch', '__proto__', 'constructor', 'evaluate', 'toString']) assert.equal(protocol.cleanCommand({ ...input, name }), null);
  for (const extra of [{ owner: 'PRIVATE_ID' }, { value: 16 }, { value: NaN }, { revision: 1.5 }, { revision: 2147483648 }]) assert.equal(protocol.cleanCommand({ ...input, ...extra }), null);
});

test('subtitle transfer is explicit, bounded, sorted plain cue data with no filenames or source metadata', () => {
  const cue = { start: 1, end: 2, text: '<b>plain</b>', filename: 'PRIVATE_NAME' };
  const command = protocol.cleanCommand({ name: 'subtitle-load', owner, revision: 1, value: [cue] });
  assert.deepEqual(json(command.value), [{ start: 1, end: 2, text: '<b>plain</b>' }]);
  for (const cues of [[], [{ start: 2, end: 1, text: 'x' }], [{ start: 3, end: 4, text: 'x' }, cue], [{ ...cue, text: 'x'.repeat(2001) }],
    Array.from({ length: 20001 }, () => cue)]) assert.equal(protocol.cleanCues(cues), undefined);
});

test('report relay strips comments, deletion preferences, DOM/URL extras and free event details', () => {
  const input = report({ userComments: 'PRIVATE_COMMENT', deleteAfterResolutionRequested: true, href: 'PRIVATE_URL',
    recentEvents: [{ ageSeconds: 5, level: 'INFO', event: 'SPEED_REQUESTED', details: { rate: 1.5, url: 'PRIVATE_EVENT' } }] });
  const cleaned = json(protocol.cleanReport(input));
  assert.equal(JSON.stringify(cleaned).includes('PRIVATE'), false);
  assert.deepEqual(cleaned.recentEvents[0].details, { rate: 1.5 });
  assert.equal(cleaned.userComments, undefined); assert.equal(cleaned.deleteAfterResolutionRequested, undefined);
  input.recentEvents[0].ageSeconds = 1; assert.equal(protocol.cleanReport(input), null);
  assert.equal(protocol.cleanReport(report({ platform: 'PRIVATE_DOMAIN' })), null);
});

test('reply relay permits only bounded manual timing and validated diagnostic payloads', () => {
  const cleaned = protocol.cleanReply({ id: 1, owner, ok: true, code: 'ok', ms: 40, report: report(), privateText: 'PRIVATE' });
  assert.equal(cleaned.ms, 40); assert.equal(cleaned.report.frame.context, 'iframe');
  assert.equal(JSON.stringify(cleaned).includes('PRIVATE'), false);
  assert.equal(protocol.cleanReply({ id: 1, owner, ok: true, code: 'ok', ms: Infinity }), null);
  assert.equal(protocol.cleanReply({ id: 1, owner, ok: true, code: 'ok', report: {} }), null);
});

test('ephemeral session tokens are validated, unique and module reinjection preserves the frozen API', () => {
  assert.equal(protocol.cleanSession(session), session);
  assert.equal(protocol.cleanSession('https://PRIVATE'), null);
  assert.notEqual(protocol.newSession(), protocol.newSession());
  assert.ok(protocol.cleanSession(protocol.newSession()));
  assert.ok(Object.isFrozen(protocol));
  vm.runInContext(source, context); assert.equal(context.NOkFrameProtocol, protocol);
});
