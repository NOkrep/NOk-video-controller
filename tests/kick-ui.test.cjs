const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'injected.js'), 'utf8');
const from = source.indexOf('  function simulateFullPointerClick');
const to = source.indexOf('  const NowTvAdapter', from);
assert.ok(from >= 0 && to > from);

function harness() {
  const timers = new Map(), logs = [], ivsRates = []; let id = 0;
  class Event { constructor(type, options) { this.type = type; Object.assign(this, options); } }
  const video = { playbackRate: 1, defaultPlaybackRate: 1, dispatchEvent() {} };
  const context = vm.createContext({
    HOSTNAME: 'kick.com', window: { location: { pathname: '/videos/sample' }, scrollX: 0, scrollY: 0, scrollTo() {} },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    Event, MouseEvent: Event, PointerEvent: Event,
    setTimeout: callback => { timers.set(++id, callback); return id; }, clearTimeout: id => timers.delete(id),
    findVideoAndPlayer: () => ({ video }),
    addDiagnosticLog: (level, event, details) => logs.push({ level, event, details }),
    ivs: { setPlaybackRate: rate => ivsRates.push(rate) }
  });
  vm.runInContext(source.slice(from, to), context);
  const run = code => vm.runInContext(code, context);
  const flush = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); };
  return { context, run, flush, timers, logs, ivsRates };
}

test('Radix volume onValueChange uses array scale and cached handler without rescanning', () => {
  for (const max of [1, 100]) {
    const h = harness(), values = []; let scans = 0;
    const root = { isConnected: true, __reactFiber$sample: { memoizedProps: { max, value: [max / 2],
      onValueChange: value => values.push(value) }, memoizedState: { queue: { dispatch() { throw Error('Do not touch arbitrary hook'); } } } } };
    h.context.document.querySelectorAll = () => { scans++; return [root]; };
    assert.equal(h.run('KickAdapter.findAndInvokeReactVolume(80)'), true);
    const firstScans = scans;
    assert.equal(h.run('KickAdapter.findAndInvokeReactVolume(30)'), true);
    assert.equal(scans, firstScans);
    assert.deepEqual(JSON.parse(JSON.stringify(values)), [[max * 0.8], [max * 0.3]]);
    root.isConnected = false; h.context.document.querySelectorAll = () => [];
    assert.equal(h.run('KickAdapter.findAndInvokeReactVolume(40)'), false);
    assert.equal(values.length, 2);
  }
});

test('pointer simulation invokes one semantic click instead of toggling twice', () => {
  const h = harness(); let clicks = 0; const events = [];
  h.context.button = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 10, height: 10 }),
    dispatchEvent: event => events.push(event.type), click: () => clicks++ };
  assert.equal(h.run('simulateFullPointerClick(button)'), true);
  assert.equal(clicks, 1); assert.equal(events.filter(event => event === 'click').length, 0);
});

test('Kick speed fallback navigates two real menu levels and clicks the exact rate once', () => {
  const h = harness(); let stage = 0; const clicked = [];
  function item(name, nextStage) {
    return { textContent: name, getClientRects: () => [{}], closest: () => null,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 10, height: 10 }),
      dispatchEvent() {}, click() { clicked.push(name); stage = nextStage; } };
  }
  const settings = item('Settings', 1); settings.getAttribute = () => stage > 0 ? 'true' : 'false';
  const submenu = item('Playback Speed', 2), rate = item('1.25x', 0);
  h.context.document.querySelector = selector => selector.includes('player-settings-button') ? settings : null;
  h.context.document.querySelectorAll = () => stage === 1 ? [submenu] : stage === 2 ? [rate] : [];
  h.run('KickAdapter.findIvsPlayer = () => ivs; KickAdapter.syncKickPlayerSpeed(1.25)');
  h.flush(); h.flush();
  assert.deepEqual(h.ivsRates, [1.25]);
  assert.deepEqual(clicked, ['Settings', 'Playback Speed', '1.25x']);
  assert.equal(h.logs.filter(log => log.event === 'KICK_SPEED_UI_INVOKED').length, 1);
  assert.equal(h.timers.size, 0);
});
