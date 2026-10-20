/**
 * content.js - Isolated World Content Script
 * Geliştirici: NOkrep
 */
(() => {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  const frameProtocol = globalThis.NOkFrameProtocol;
  let selectedLanguageSignal = null;
  let selectedPlatformSignal = null;
  const platformSignals = new Set(['kick', 'trt', 'now', 'puhu', 'youtube', 'twitch', 'reddit', 'x',
    'netflix', 'disney', 'prime', 'tabii', 'gain', 'exxen'].map(platform => `NOK_PLATFORM_${platform}`));

  /**
   * Main World Enjeksiyonu:
   * Sayfadaki 'window.videojs', video elementleri ve player closure'larına doğrudan
   * erişebilmek için injected.js dosyasını DOM'a bir script elementi olarak ekleyip
   * işi bitince DOM'dan temizleriz (kod bellekte çalışmaya devam eder).
   */
  function injectMainWorldScript(autoOpen = false) {
    try {
      const script = document.createElement('script');
      script.src = browserAPI.runtime.getURL('injected.js');
      script.dataset.logoUrl = browserAPI.runtime.getURL('icons/nok-logo.svg');
      script.onload = function () {
        this.remove();
        if (selectedLanguageSignal) {
          window.postMessage({ type: selectedLanguageSignal === 'NOK_LANGUAGE_TR' ? 'PVC_APPLY_LANGUAGE_TR' : 'PVC_APPLY_LANGUAGE_EN' }, '*');
        }
        if (selectedPlatformSignal) window.postMessage({ type: selectedPlatformSignal.replace('NOK_PLATFORM_', 'PVC_APPLY_PLATFORM_') }, '*');
        if (autoOpen) {
          window.postMessage({ type: 'PVC_OPEN_POPUP' }, '*');
        }
      };
      const helper = document.createElement('script');
      helper.src = browserAPI.runtime.getURL('frame-protocol.js');
      const appendMain = function () { this.remove(); (document.head || document.documentElement).appendChild(script); };
      helper.onload = appendMain;
      helper.onerror = appendMain; // A blocked helper leaves legacy local-frame controls available.
      (document.head || document.documentElement).appendChild(helper);
    } catch (e) {
      console.error('[NOkrep:Content] Main World script enjekte edilemedi:', e);
    }
  }

  // Eğer sayfa ilk defa yükleniyorsa (document_start veya toolbar click)
  if (!window.__NOK_VIDEO_CONTROLLER_CONTENT_LOADED__) {
    window.__NOK_VIDEO_CONTROLLER_CONTENT_LOADED__ = true;
    // Otomatik enjeksiyonda kancaları sessizce tak; kullanıcı toolbar ikonuna bastıysa doğrudan aç
    const isManualClick = document.readyState === 'complete' || document.readyState === 'interactive';
    injectMainWorldScript(isManualClick);
  } else {
    // Kullanıcı ikona tekrar tıkladıysa popup'ı aç/kapat
    window.postMessage({ type: 'PVC_TOOLBAR_TOGGLE' }, '*');
    return;
  }

  // Only a pinned branch carries protocol-validated state/commands. No URLs/DOM travel.
  let searching = false;
  let activeChild = null;
  let delegatedVisible = false;
  let requestedByParent = false;
  let session = null;
  let ancestorFullscreen = false;
  function children() {
    return [...document.querySelectorAll('iframe, frame')].map(frame => frame.contentWindow).filter(Boolean);
  }
  function send(target, type, payload) {
    try { target.postMessage(payload === undefined ? { type } : { type, payload }, '*'); } catch (_) {}
  }
  function hideChildren(except = null) {
    children().forEach(child => { if (child !== except) lifecycle(child, 'NOK_FRAME_HIDE'); });
  }
  function lifecycle(target, type) { send(target, type, frameProtocol ? { session } : undefined); }
  function syncFullscreenBranch() {
    if (!frameProtocol || !session) return;
    const fullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    const activeFrame = [...document.querySelectorAll('iframe, frame')].find(frame => frame.contentWindow === activeChild);
    const value = ancestorFullscreen || (!!activeFrame && fullscreen === activeFrame);
    if (activeChild) send(activeChild, 'NOK_REMOTE_FULLSCREEN', { session, value });
    else if (requestedByParent) send(window, 'PVC_SOURCE_FULLSCREEN', { session, value });
  }
  function openEmbeddedPlayers() {
    searching = true;
    activeChild = null;
    delegatedVisible = false;
    if (frameProtocol && !requestedByParent) session = frameProtocol.newSession();
    children().forEach(child => {
      if (selectedLanguageSignal) send(child, selectedLanguageSignal);
      lifecycle(child, 'NOK_FRAME_OPEN');
    });
  }
  function closeBranch() {
    searching = false;
    activeChild = null;
    delegatedVisible = false;
    requestedByParent = false;
    window.postMessage({ type: 'PVC_HIDE_POPUP' }, '*');
    if (frameProtocol) window.postMessage({ type: 'PVC_REMOTE_CLEAR' }, '*');
    hideChildren();
    session = null;
    ancestorFullscreen = false;
  }

  // Main World ile mesajlaşma dinleyicisi
  window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;
    const type = event.data.type;
    // Only a public, fixed platform enum travels down the frame tree; never hosts or URLs.
    const localPlatform = event.source === window && window.parent === window && typeof type === 'string'
      && platformSignals.has(type.replace('PVC_PLATFORM_', 'NOK_PLATFORM_')) && type.startsWith('PVC_PLATFORM_');
    const parentPlatform = window.parent !== window && event.source === window.parent && platformSignals.has(type);
    if (localPlatform || parentPlatform) {
      const signal = localPlatform ? type.replace('PVC_PLATFORM_', 'NOK_PLATFORM_') : type;
      if (selectedPlatformSignal === signal) return;
      selectedPlatformSignal = signal;
      window.postMessage({ type: signal.replace('NOK_PLATFORM_', 'PVC_APPLY_PLATFORM_') }, '*');
      children().forEach(child => send(child, signal));
      return;
    }
    if (type === 'NOK_PLATFORM_REQUEST' && children().includes(event.source)) {
      if (selectedPlatformSignal) send(event.source, selectedPlatformSignal);
      return;
    }
    const localLanguage = event.source === window && (type === 'PVC_LANGUAGE_TR' || type === 'PVC_LANGUAGE_EN');
    const frameLanguage = (type === 'NOK_LANGUAGE_TR' || type === 'NOK_LANGUAGE_EN')
      && ((window.parent !== window && event.source === window.parent) || children().includes(event.source));
    if (localLanguage || frameLanguage) {
      const signal = type.endsWith('_TR') ? 'NOK_LANGUAGE_TR' : 'NOK_LANGUAGE_EN';
      if (selectedLanguageSignal === signal) return;
      selectedLanguageSignal = signal;
      window.postMessage({ type: signal === 'NOK_LANGUAGE_TR' ? 'PVC_APPLY_LANGUAGE_TR' : 'PVC_APPLY_LANGUAGE_EN' }, '*');
      children().forEach(child => { if (child !== event.source) send(child, signal); });
      if (window.parent !== window && event.source !== window.parent) send(window.parent, signal);
      return;
    }
    if (type === 'NOK_LANGUAGE_REQUEST' && children().includes(event.source)) {
      if (selectedLanguageSignal) send(event.source, selectedLanguageSignal);
      return;
    }
    if (window.parent !== window && event.source === window.parent && event.data.type === 'NOK_FRAME_OPEN') {
      const incomingSession = frameProtocol ? frameProtocol.cleanSession(event.data.payload?.session) : null;
      if (frameProtocol && !incomingSession) return;
      closeBranch();
      requestedByParent = true;
      session = incomingSession;
      send(window, frameProtocol ? 'PVC_REMOTE_SOURCE_START' : 'PVC_OPEN_IF_MEDIA', frameProtocol ? { session } : undefined);
      return;
    }
    if (window.parent !== window && event.source === window.parent && event.data.type === 'NOK_FRAME_HIDE') {
      if (frameProtocol && event.data.payload?.session !== session) return;
      closeBranch();
      return;
    }
    if (event.data.type === 'NOK_FRAME_ACTIVE' && children().includes(event.source)) {
      if (frameProtocol && event.data.payload?.session !== session) return;
      if (!searching || (activeChild && activeChild !== event.source)) {
        lifecycle(event.source, 'NOK_FRAME_HIDE');
        return;
      }
      activeChild = event.source;
      delegatedVisible = true;
      window.postMessage({ type: 'PVC_HIDE_POPUP' }, '*');
      hideChildren(activeChild);
      if (frameProtocol && requestedByParent) send(window, 'PVC_REMOTE_SOURCE_SUSPEND');
      if (requestedByParent) lifecycle(window.parent, 'NOK_FRAME_ACTIVE');
      syncFullscreenBranch();
      return;
    }
    if (frameProtocol && requestedByParent && event.source === window.parent && type === 'NOK_REMOTE_FULLSCREEN') {
      if (event.data.payload?.session !== session || typeof event.data.payload?.value !== 'boolean') return;
      ancestorFullscreen = event.data.payload.value; syncFullscreenBranch(); return;
    }
    if (frameProtocol && type === 'NOK_TOP_TOGGLE' && children().includes(event.source)) {
      if (window.parent !== window) send(window.parent, 'NOK_TOP_TOGGLE');
      else send(window, 'PVC_TOOLBAR_TOGGLE');
      return;
    }
    if (event.data.type === 'NOK_FRAME_CLOSED' && event.source === activeChild) {
      if (frameProtocol && event.data.payload?.session !== session) return;
      searching = false;
      activeChild = null;
      delegatedVisible = false;
      if (frameProtocol) window.postMessage({ type: 'PVC_REMOTE_CLEAR' }, '*');
      if (requestedByParent) lifecycle(window.parent, 'NOK_FRAME_CLOSED');
      requestedByParent = false; session = null; ancestorFullscreen = false;
      return;
    }
    if (frameProtocol && delegatedVisible && event.source === activeChild && children().includes(event.source) && event.data.payload?.session === session) {
      const state = type === 'NOK_REMOTE_STATE' ? frameProtocol.cleanState(event.data.payload.state) : null;
      const reply = type === 'NOK_REMOTE_REPLY' ? frameProtocol.cleanReply(event.data.payload.reply) : null;
      if (state) {
        if (requestedByParent) send(window.parent, 'NOK_REMOTE_STATE', { session, state });
        else send(window, 'PVC_REMOTE_STATE', { session, state });
        return;
      }
      if (reply) {
        if (requestedByParent) send(window.parent, 'NOK_REMOTE_REPLY', { session, reply });
        else send(window, 'PVC_REMOTE_REPLY', { session, reply });
        return;
      }
    }
    if (frameProtocol && requestedByParent && event.source === window.parent && type === 'NOK_REMOTE_COMMAND') {
      if (event.data.payload?.session !== session) return;
      const command = frameProtocol.cleanCommand(event.data.payload?.command);
      const id = event.data.payload?.id;
      if (!command || !Number.isInteger(id) || id < 0 || id > 2147483647) return;
      if (activeChild && children().includes(activeChild)) send(activeChild, 'NOK_REMOTE_COMMAND', { session, id, command });
      else send(window, 'PVC_EXEC_REMOTE_COMMAND', { session, id, command });
      return;
    }
    if (event.source !== window) return;
    if (frameProtocol && type === 'PVC_REMOTE_COMMAND' && delegatedVisible && activeChild && children().includes(activeChild)) {
      if (event.data.payload?.session !== session) return;
      const command = frameProtocol.cleanCommand(event.data.payload?.command), id = event.data.payload?.id;
      if (command && Number.isInteger(id) && id >= 0 && id <= 2147483647) send(activeChild, 'NOK_REMOTE_COMMAND', { session, id, command });
      return;
    }
    if (frameProtocol && requestedByParent) {
      if (type === 'PVC_SOURCE_STATE') {
        if (activeChild) return;
        const state = event.data.payload?.session === session && frameProtocol.cleanState(event.data.payload.state);
        if (state) send(window.parent, 'NOK_REMOTE_STATE', { session, state });
        return;
      }
      if (type === 'PVC_SOURCE_REPLY') {
        if (activeChild) return;
        const reply = event.data.payload?.session === session && frameProtocol.cleanReply(event.data.payload.reply);
        if (reply) send(window.parent, 'NOK_REMOTE_REPLY', { session, reply });
        return;
      }
      if (type === 'PVC_ENGINE_READY' && !activeChild) {
        send(window, 'PVC_REMOTE_SOURCE_START', { session });
        return;
      }
    }
    if (frameProtocol && type === 'PVC_REQUEST_TOP_TOGGLE') {
      if (window.parent !== window) send(window.parent, 'NOK_TOP_TOGGLE');
      else send(window, 'PVC_TOOLBAR_TOGGLE');
      return;
    }
    if (event.data.type === 'PVC_OPEN_IN_CHILD_FRAMES') openEmbeddedPlayers();
    if (event.data.type === 'PVC_HUD_OPENED') {
      if (frameProtocol && requestedByParent && event.data.payload?.session !== session) return;
      searching = false;
      activeChild = null;
      delegatedVisible = false;
      hideChildren();
      if (requestedByParent) lifecycle(window.parent, 'NOK_FRAME_ACTIVE');
      syncFullscreenBranch();
    }
    if (event.data.type === 'PVC_HUD_CLOSED') {
      if (frameProtocol && requestedByParent && event.data.payload?.session !== session) return;
      hideChildren();
      searching = false;
      activeChild = null;
      delegatedVisible = false;
      if (frameProtocol) window.postMessage({ type: 'PVC_REMOTE_CLEAR' }, '*');
      if (requestedByParent) lifecycle(window.parent, 'NOK_FRAME_CLOSED');
      requestedByParent = false; session = null; ancestorFullscreen = false;
    }
    if (event.data.type === 'PVC_TOOLBAR_TOGGLE') {
      if (delegatedVisible) closeBranch();
      else window.postMessage({ type: 'PVC_TOGGLE_POPUP' }, '*');
    }

    if (event.data.type === 'PVC_RE_INJECT_REQUEST') {
      injectMainWorldScript();
    }
  });
  if (window.parent !== window) send(window.parent, 'NOK_LANGUAGE_REQUEST');
  if (window.parent !== window) send(window.parent, 'NOK_PLATFORM_REQUEST');
  if (frameProtocol) for (const type of ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange']) document.addEventListener?.(type, syncFullscreenBranch);
  if (frameProtocol && typeof MutationObserver === 'function') {
    let pending = false;
    const observer = new MutationObserver(() => {
      if (!activeChild || pending) return;
      pending = true;
      setTimeout(() => {
        pending = false;
        if (activeChild && !children().includes(activeChild)) {
          const parentWasWaiting = requestedByParent;
          const previousSession = session;
          closeBranch();
          if (parentWasWaiting) send(window.parent, 'NOK_FRAME_CLOSED', { session: previousSession });
        }
      }, 100);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
