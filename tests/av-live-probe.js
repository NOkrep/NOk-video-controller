// I-07 measurement copy only; never part of the store package or the source extension.
// Numbers and fixed library codes only: no address, title, source, cue or page text is read or exported.
(() => {
  if (window.__NOK_AV_PROBE__) return;
  const started = performance.now(), windows = [], marks = [], changes = [], contexts = new Set(), hlsErrors = {}, seen = new WeakMap();
  const probe = window.__NOK_AV_PROBE__ = { windows, marks, changes, report };
  let videoCounter = 0, current = null, sampler = null, seenHls = new WeakSet();
  const age = () => Math.round((performance.now() - started) / 100) / 10;
  const median = list => list.length ? [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)] : null;
  const percentile = (list, p) => list.length ? [...list].sort((a, b) => a - b)[Math.min(list.length - 1, Math.floor(list.length * p))] : null;
  const ms = value => value === null ? null : Math.round(value * 1000);
  const push = (list, row, limit) => { list.push(row); if (list.length > limit) list.shift(); };
  const Native = window.AudioContext;
  if (Native) window.AudioContext = new Proxy(Native, { construct(target, args, next) { const ctx = Reflect.construct(target, args, next); contexts.add(ctx); return ctx; } });

  function select() {
    let best = null, score = -1;
    for (const video of document.querySelectorAll('video')) {
      const rect = video.getBoundingClientRect(), value = (video.paused ? 0 : 1e7) + rect.width * rect.height;
      if (video.readyState >= 1 && value > score) { best = video; score = value; }
    }
    return best;
  }
  function bind(video) {
    if (seen.has(video)) return seen.get(video);
    const state = { id: ++videoCounter, lags: [], mediaFirst: null, mediaLast: null, wallFirst: null, wallLast: null, frames: 0, events: {} };
    seen.set(video, state);
    for (const type of ['waiting', 'stalled', 'playing', 'pause', 'seeking', 'seeked', 'error', 'emptied', 'loadstart', 'ended'])
      video.addEventListener(type, () => { state.events[type] = (state.events[type] || 0) + 1; }, { passive: true });
    let seekFrom = null;
    video.addEventListener('timeupdate', () => { if (!video.seeking) seekFrom = video.currentTime; }, { passive: true });
    video.addEventListener('seeking', () => push(changes, { t: age(), video: state.id, kind: 'seek', delta: seekFrom === null ? null : Math.round((video.currentTime - seekFrom) * 10) / 10 }, 400), { passive: true });
    video.addEventListener('ratechange', () => push(changes, { t: age(), video: state.id, kind: 'rate', rate: video.playbackRate }, 400), { passive: true });
    video.addEventListener('volumechange', () => push(changes, { t: age(), video: state.id, kind: 'volume', volume: Math.round(video.volume * 100), muted: video.muted }, 400), { passive: true });
    if (video.requestVideoFrameCallback) {
      const frame = (now, meta) => {
        state.frames++;
        state.lags.push(video.currentTime - meta.mediaTime);
        if (state.mediaFirst === null) { state.mediaFirst = meta.mediaTime; state.wallFirst = now; }
        state.mediaLast = meta.mediaTime; state.wallLast = now;
        video.requestVideoFrameCallback(frame);
      };
      video.requestVideoFrameCallback(frame);
    }
    return state;
  }
  function watchHls(video) {
    const player = video.__nokHlsPlayer;
    if (!player || seenHls.has(player) || typeof player.on !== 'function') return;
    seenHls.add(player);
    try { player.on('hlsError', (_event, data) => { const key = `${data?.type || 'unknown'}:${data?.details || 'unknown'}:${data?.fatal ? 'fatal' : 'recoverable'}`; if (Object.keys(hlsErrors).length < 40 || hlsErrors[key]) hlsErrors[key] = (hlsErrors[key] || 0) + 1; }); } catch (_) {}
  }
  function bufferedAhead(video) {
    for (let i = 0; i < video.buffered.length; i++) if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) return Math.round((video.buffered.end(i) - video.currentTime) * 10) / 10;
    return 0;
  }
  let last = null;
  function sample() {
    const video = select();
    if (!video) return;
    current = video;
    const state = bind(video); watchHls(video);
    const wall = performance.now(), clock = video.currentTime, quality = video.getVideoPlaybackQuality?.();
    const ctx = [...contexts].at(-1);
    const row = { t: age(), video: state.id, videos: document.querySelectorAll('video').length, topFrame: window === window.top, paused: video.paused, seeking: video.seeking, readyState: video.readyState,
      height: video.videoHeight, live: !Number.isFinite(video.duration), blob: video.currentSrc.startsWith('blob:'), rate: video.playbackRate, muted: video.muted, volume: Math.round(video.volume * 100), buffered: bufferedAhead(video),
      clockRate: last && last.video === state.id && !video.seeking && !state.events.seeking ? Math.round((clock - last.clock) / ((wall - last.wall) / 1000) * 100) / 100 : null,
      frameRate: state.frames > 1 && state.wallLast > state.wallFirst ? Math.round((state.mediaLast - state.mediaFirst) / ((state.wallLast - state.wallFirst) / 1000) * 100) / 100 : null,
      lagMedianMs: ms(median(state.lags)), lagP90Ms: ms(percentile(state.lags, .9)), frames: state.frames, dropped: quality?.droppedVideoFrames ?? null, total: quality?.totalVideoFrames ?? null,
      events: state.events, audioContexts: contexts.size, audioState: ctx?.state ?? null, outputLatencyMs: ctx && ctx.outputLatency !== undefined ? Math.round(ctx.outputLatency * 1000) : null };
    push(windows, row, 720);
    last = { video: state.id, clock, wall };
    Object.assign(state, { lags: [], mediaFirst: null, mediaLast: null, wallFirst: null, wallLast: null, frames: 0, events: {} });
  }
  sampler = setInterval(sample, 5000);
  function report() { sample(); return { kind: 'filmdeck-i07-measurement', version: 1, seconds: age(), marks, changes, hlsErrors, windows }; }
  function button(label, action) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.style.cssText = 'all:unset;cursor:pointer;background:#1b2a33;color:#edf2f3;border:1px solid #6099b9;border-radius:4px;padding:4px 8px;font:12px sans-serif'; b.addEventListener('click', event => { event.stopPropagation(); action(b); }); return b; }
  function mark(kind) { sample(); push(marks, { t: age(), kind, video: current ? seen.get(current)?.id ?? null : null }, 100); }
  async function copy(b) {
    const text = JSON.stringify(report());
    try { await navigator.clipboard.writeText(text); b.textContent = 'Kopyalandı'; }
    catch (_) { const area = document.createElement('textarea'); area.value = text; document.documentElement.appendChild(area); area.select(); const ok = document.execCommand('copy'); area.remove(); b.textContent = ok ? 'Kopyalandı' : 'Kopyalanamadı'; }
    setTimeout(() => { b.textContent = 'Ölçümü kopyala'; }, 2500);
  }
  const panel = setInterval(() => {
    if (!select() || !document.documentElement || document.getElementById('nok-i07-probe')) return;
    clearInterval(panel);
    const bar = document.createElement('div'); bar.id = 'nok-i07-probe';
    bar.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;display:flex;gap:6px;opacity:.92';
    bar.append(button('Kayma şimdi', () => mark('sync')), button('Kontrol gitti', () => mark('control')), button('Ölçümü kopyala', copy));
    document.documentElement.appendChild(bar);
  }, 1000);
})();
