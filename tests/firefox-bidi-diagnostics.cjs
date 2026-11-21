// Test-only transport diagnostics. Record method names and elapsed times, never request parameters.
const { performance } = require('node:perf_hooks');

function watchFirefoxBiDi(processHandle, socket, pending, onTiming = () => {}) {
  let ended;
  const recent = [];
  const track = method => {
    const started = performance.now();
    return status => {
      const sample = {method, status, elapsedMs: Math.round(performance.now() - started)};
      recent.push(sample);
      if (recent.length > 8) recent.shift();
      onTiming(sample);
    };
  };
  const error = (method, cause) => new Error(`Firefox BiDi ${cause} during ${method}; recent=${JSON.stringify(recent)}`);
  const stop = cause => {
    if (ended) return;
    ended = cause;
    for (const [id, request] of pending) {
      pending.delete(id);
      clearTimeout(request.timer);
      request.finish('disconnected');
      request.reject(error(request.method, cause));
    }
  };
  processHandle.once('exit', (code, signal) => stop(`process exited (${code ?? signal})`));
  socket.addEventListener('close', event => stop(`socket closed (${event.code})`), {once:true});
  socket.addEventListener('error', () => stop('socket error'), {once:true});
  return {
    track,
    timeout: method => error(method, 'timed out'),
    connectionError: method => ended ? error(method, ended) : null
  };
}

module.exports = {watchFirefoxBiDi};
