/*
 * early-hooks.js - FilmDeck by NOk (Main World, document_start)
 * The engine loads asynchronously, so a page can attach its player first. Hls.js has no
 * registry to find it afterwards. This only remembers which player owns a video; the engine
 * reads the same field. No network, storage or messaging. Below Firefox 128 the manifest
 * "world" key is ignored, this runs in the isolated world and sees no page library.
 */
(() => {
  'use strict';
  const own = new WeakSet();
  const remember = (prototype, method, field, mediaOf) => {
    const original = prototype?.[method];
    if (typeof original !== 'function' || own.has(original)) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      try {
        const media = mediaOf(this, args);
        if (media?.tagName === 'VIDEO') media[field] = this;
      } catch (_) {}
      return result;
    };
    try { prototype[method] = wrapped; own.add(wrapped); } catch (_) {}
  };
  // A script's load event fires before the parser reaches the next script.
  const onLoad = event => {
    if (window.__NOK_VIDEO_CONTROLLER_INJECTED__) { document.removeEventListener('load', onLoad, true); return; }
    if (event.target?.tagName !== 'SCRIPT') return;
    remember(window.Hls?.prototype, 'attachMedia', '__nokHlsPlayer', (_player, args) => args[0]?.media || args[0]);
    const shaka = window.shaka?.Player?.prototype;
    remember(shaka, 'attach', '__nokShakaPlayer', (_player, args) => args[0]);
    remember(shaka, 'load', '__nokShakaPlayer', player => player.getMediaElement?.());
  };
  document.addEventListener('load', onLoad, true);
})();
