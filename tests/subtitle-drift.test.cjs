const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// A subtitle file timed for another cut or frame rate slides further every minute; two sync points correct it.
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'injected.js'), 'utf8').replace(/\r\n/g, '\n');
require(path.join(root, 'frame-protocol.js'));
const protocol = globalThis.NOkFrameProtocol;
const { state, report } = require('./frame-fixtures.cjs');
function section(from, to) {
  const a = source.indexOf(from), b = source.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `missing section ${from}`); return source.slice(a, b);
}
const math = vm.createContext({});
vm.runInContext(section('  // SUBTITLE EXPLANATION', '  // END SUBTITLE EXPLANATION'), math);
const run = (text, values = {}) => { Object.assign(math, values); return vm.runInContext(text, math); };

test('without a correction the clock is the plain offset, both ways', () => {
  assert.equal(run('subtitleClockAt(2000, null, 100)'), 98);
  assert.equal(run('videoTimeForSubtitle(2000, null, 98)'), 100);
  assert.equal(run('subtitleOffsetAt(-500, null, 4000)'), -500);
});

test('the reported case: in sync at the start, 3 s off after 12.5 minutes, keeps sliding at the same pace', () => {
  const drift = run('subtitleDriftFrom({ time: 30, offset: 0 }, { time: 780, offset: 3000 })');
  assert.equal(drift.error, undefined);
  assert.equal(drift.rate, 4, '3000 ms over 750 s of video');
  assert.equal(drift.anchor, 780); assert.equal(drift.base, 3000);
  const at = time => run('subtitleOffsetAt(base, drift, time)', { base: drift.base, drift: { rate: drift.rate, anchor: drift.anchor }, time });
  assert.equal(at(30), 0, 'still right at the first point');
  assert.equal(at(1530), 6000, 'and 25 minutes in it has added the next 3 s by itself');
  assert.equal(run('subtitleDriftAmount(4)'), '+2.4');
  assert.equal(run('subtitleDriftAmount(-4)'), '-2.4');
});

test('the browser track gets the exact inverse of the overlay clock', () => {
  const values = { base: 3000, drift: { rate: 4, anchor: 780 } };
  for (const time of [0, 30, 780, 1530, 5400]) {
    const clock = run(`subtitleClockAt(base, drift, ${time})`, values);
    assert.ok(Math.abs(run(`videoTimeForSubtitle(base, drift, ${clock})`, values) - time) < 1e-9, `round trip at ${time}`);
  }
});

test('the inverse also holds where the offset stops at the ±6 hour limit, and across it (N-035 F3)', () => {
  // Codex's reachable case: point 1 at 0 s with -21596000 ms, point 2 at 60 s with -21599000 ms (rate -50).
  const low = { base: -21599000, drift: { rate: -50, anchor: 60 } };
  assert.equal(run('subtitleOffsetAt(base, drift, 90)', low), -21600000, 'saturated at 90 s');
  assert.equal(run('subtitleClockAt(base, drift, 90)', low), 21690);
  assert.ok(Math.abs(run('videoTimeForSubtitle(base, drift, 21690)', low) - 90) < 1e-9, 'not 89.52 s');
  const high = { base: 21599000, drift: { rate: 50, anchor: 60 } };
  for (const values of [low, high]) {
    for (let time = 0; time <= 200; time += 2.5) {
      const clock = run(`subtitleClockAt(base, drift, ${time})`, values);
      assert.ok(Math.abs(run(`videoTimeForSubtitle(base, drift, ${clock})`, values) - time) < 1e-6, `round trip at ${time} s, rate ${values.drift.rate}`);
    }
  }
});

test('points too close, without change or impossibly fast are refused with a reason', () => {
  assert.equal(run('subtitleDriftFrom({ time: 100, offset: 0 }, { time: 140, offset: 500 })').error, 'too-close');
  assert.equal(run('subtitleDriftFrom({ time: 100, offset: 400 }, { time: 900, offset: 400 })').error, 'no-change');
  assert.equal(run('subtitleDriftFrom({ time: 100, offset: 0 }, { time: 200, offset: 6000 })').error, 'too-large');
  // 23.976 ↔ 25 fps is 4.3 %, the largest common case, and must still be accepted.
  assert.equal(run('subtitleDriftFrom({ time: 0, offset: 0 }, { time: 600, offset: 25600 })').error, undefined);
  const back = run('subtitleDriftFrom({ time: 900, offset: 3000 }, { time: 300, offset: 600 })');
  assert.equal(back.rate, 4, 'a second point earlier in the video gives the same line');
});

test('the frame bridge carries the correction and a strict set of drift commands', () => {
  assert.equal(protocol.cleanState(state({ subtitleDriftRate: 4, subtitleSyncPoint: 780.5 })).subtitleDriftRate, 4);
  assert.equal(protocol.cleanState(state({ subtitleDriftRate: 60 })), null, 'beyond the engine limit');
  assert.equal(protocol.cleanState(state({ subtitleSyncPoint: 'line' })), null);
  for (const value of ['mark', 'cancel', 'clear']) assert.equal(protocol.cleanCommand({ name: 'subtitle-drift', owner: 'b'.repeat(32), revision: 1, value }).value, value);
  assert.equal(protocol.cleanCommand({ name: 'subtitle-drift', owner: 'b'.repeat(32), revision: 1, value: 'set-rate' }), null);
});

test('a report shows the shift and the drift as plain numbers, and their events', () => {
  const videoState = { ...report().videoState, subtitleLoaded: true, subtitleOffsetMs: 3000, subtitleDriftMsPerMinute: 240 };
  const events = [{ ageSeconds: 60, level: 'INFO', event: 'SUBTITLE_OFFSET_CHANGED', details: { offsetMs: 3000 } },
    { ageSeconds: 55, level: 'INFO', event: 'SUBTITLE_SYNC_POINT_MARKED', details: {} },
    { ageSeconds: 50, level: 'INFO', event: 'SUBTITLE_DRIFT_SET', details: { driftMsPerMinute: 240 } },
    { ageSeconds: 45, level: 'INFO', event: 'SUBTITLE_DRIFT_CLEARED', details: {} }];
  const clean = protocol.cleanReport(report({ videoState, recentEvents: events }));
  assert.equal(clean.videoState.subtitleOffsetMs, 3000); assert.equal(clean.videoState.subtitleDriftMsPerMinute, 240);
  assert.equal(clean.recentEvents.length, 4);
  assert.equal(protocol.cleanReport(report({ videoState: { ...videoState, subtitleOffsetMs: 'line' } })), null);
  assert.equal(protocol.cleanReport(report({ recentEvents: [{ ...events[0], details: { offsetMs: 9e9 } }] })), null);
  const builder = section('  function buildDiagnosticPayload', '  function reportAnonymousError');
  assert.doesNotMatch(builder, /currentTime|subtitleSyncPoint|anchor/, 'no playback position, not even the sync points');
});

test('repeated − / + presses become one event holding the last value', () => {
  let now = 1000;
  const log = vm.createContext({ performance: { now: () => now } });
  vm.runInContext(section('  const DIAGNOSTIC_LOG_BUFFER = []', '  function addDiagnosticLog') + section('  function addDiagnosticLog', '\n  }\n') + '\n  }', log);
  const add = (event, details) => { log.args = [event, details]; vm.runInContext('addDiagnosticLog("INFO", ...args)', log); };
  add('SUBTITLE_OFFSET_CHANGED', { offsetMs: 100 }); now += 400;
  add('SUBTITLE_OFFSET_CHANGED', { offsetMs: 200 }); now += 400;
  add('SUBTITLE_OFFSET_CHANGED', { offsetMs: 300 });
  let buffer = vm.runInContext('DIAGNOSTIC_LOG_BUFFER', log);
  assert.equal(buffer.length, 1); assert.equal(buffer[0].details.offsetMs, 300);
  now += 6000; add('SUBTITLE_OFFSET_CHANGED', { offsetMs: 3300 });
  add('SEEK_REQUESTED', { delta: 10 }); add('SEEK_REQUESTED', { delta: 10 });
  buffer = vm.runInContext('DIAGNOSTIC_LOG_BUFFER', log);
  assert.deepEqual(Array.from(buffer, item => item.event), ['SUBTITLE_OFFSET_CHANGED', 'SUBTITLE_OFFSET_CHANGED', 'SEEK_REQUESTED', 'SEEK_REQUESTED'], 'a later correction and other events stay separate');
});

test('every new drift text has an English translation and both panels offer the two points', () => {
  for (const key of ['Zamanla kayma', 'Zamanla kayma düzeltmesi', '1. noktayı kaydet', '2. noktayı kaydet', 'Vazgeç', 'Düzeltmeyi kaldır', 'Kayma {0} · zamanla düzeltiliyor',
    'Altyazı zamanla kayıyorsa: doğruyken 1. noktayı kaydedin, kayınca − / + ile düzeltip 2. noktayı kaydedin.',
    '1. nokta {0} anında kaydedildi. Altyazı kayınca − / + ile düzeltip 2. noktayı kaydedin.', 'Düzeltme açık: her 10 dakikada {0} sn',
    '1. nokta kaydedildi. Altyazı kayınca − / + ile düzeltip 2. noktayı kaydedin.', '2. nokta 1. noktadan en az 1 dakika uzakta olmalı.',
    'İki noktada kayma aynı; zamanla kayma yok.', 'Kayma çok hızlı; dosya bu videoya ait olmayabilir.', '💬 Kayma düzeltmesi açık: her 10 dakikada {0} sn']) {
    assert.ok(source.includes(`'${key}':`), `${key} is translated`);
  }
  assert.ok(source.indexOf("'Kayma {0} · zamanla düzeltiliyor':") < source.indexOf("'Kayma {0}':"), 'the longer pattern is matched first');
  for (const id of ['pvc-sub-drift-mark', 'pvc-sub-drift-cancel', 'pvc-sub-drift-status', 'pvc-tb-sub-drift-mark', 'pvc-tb-sub-drift-cancel', 'pvc-tb-sub-drift-text']) assert.match(source, new RegExp(`id="${id}"`));
});
