const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {watchFirefoxBiDi} = require('./firefox-bidi-diagnostics.cjs');

test('a disconnected Firefox rejects the outstanding startup command immediately', async () => {
  const child = new EventEmitter(), socket = new EventTarget(), pending = new Map(), timings = [];
  const diagnostics = watchFirefoxBiDi(child, socket, pending, sample => timings.push(sample));
  diagnostics.track('session.new')('ok');
  const method = 'session.subscribe';
  const result = new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error('deadline')), 1000);
    pending.set(1, {method, reject, timer, finish:diagnostics.track(method)});
  });
  child.emit('exit', 1, null);
  await assert.rejects(result, /process exited \(1\) during session\.subscribe/);
  assert.equal(pending.size, 0);
  assert.deepEqual(timings.map(({method,status}) => [method,status]), [['session.new','ok'],['session.subscribe','disconnected']]);
  assert.match(diagnostics.connectionError('session.new').message, /process exited/);
});

test('a genuine timeout includes only method names, results, and elapsed times', () => {
  const diagnostics = watchFirefoxBiDi(new EventEmitter(), new EventTarget(), new Map());
  diagnostics.track('session.new')('ok');
  const diagnostic = diagnostics.timeout('session.subscribe').message;
  assert.match(diagnostic, /timed out during session\.subscribe/);
  assert.match(diagnostic, /"method":"session.new","status":"ok","elapsedMs":\d+/);
});
