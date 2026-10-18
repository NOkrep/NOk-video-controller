/**
 * content.js - Isolated World Content Script
 * Geliştirici: NOkrep
 */
(() => {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  let selectedLanguageSignal = null;

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
        if (autoOpen) {
          window.postMessage({ type: 'PVC_OPEN_POPUP' }, '*');
        }
      };
      (document.head || document.documentElement).appendChild(script);
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

  // Çerçeveler arasında yalnızca sabit UI sinyalleri ve RAM'de WindowProxy tutulur.
  // İlk çalışan dal kazanır; üst panel ve diğer dallar kapanır. Medya/rapor taşınmaz.
  let searching = false;
  let activeChild = null;
  let delegatedVisible = false;
  let requestedByParent = false;
  function children() {
    return [...document.querySelectorAll('iframe, frame')].map(frame => frame.contentWindow).filter(Boolean);
  }
  function send(target, type) {
    try { target.postMessage({ type }, '*'); } catch (_) {}
  }
  function hideChildren(except = null) {
    children().forEach(child => { if (child !== except) send(child, 'NOK_FRAME_HIDE'); });
  }
  function openEmbeddedPlayers() {
    searching = true;
    activeChild = null;
    delegatedVisible = false;
    children().forEach(child => {
      if (selectedLanguageSignal) send(child, selectedLanguageSignal);
      send(child, 'NOK_FRAME_OPEN');
    });
  }
  function closeBranch() {
    searching = false;
    activeChild = null;
    delegatedVisible = false;
    requestedByParent = false;
    window.postMessage({ type: 'PVC_HIDE_POPUP' }, '*');
    hideChildren();
  }

  // Main World ile mesajlaşma dinleyicisi
  window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;
    const type = event.data.type;
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
      closeBranch();
      requestedByParent = true;
      window.postMessage({ type: 'PVC_OPEN_IF_MEDIA' }, '*');
      return;
    }
    if (window.parent !== window && event.source === window.parent && event.data.type === 'NOK_FRAME_HIDE') {
      closeBranch();
      return;
    }
    if (event.data.type === 'NOK_FRAME_ACTIVE' && children().includes(event.source)) {
      if (!searching || (activeChild && activeChild !== event.source)) {
        send(event.source, 'NOK_FRAME_HIDE');
        return;
      }
      activeChild = event.source;
      delegatedVisible = true;
      window.postMessage({ type: 'PVC_HIDE_POPUP' }, '*');
      hideChildren(activeChild);
      if (requestedByParent) send(window.parent, 'NOK_FRAME_ACTIVE');
      return;
    }
    if (event.data.type === 'NOK_FRAME_CLOSED' && event.source === activeChild) {
      searching = false;
      activeChild = null;
      delegatedVisible = false;
      if (requestedByParent) send(window.parent, 'NOK_FRAME_CLOSED');
      return;
    }
    if (event.source !== window) return;
    if (event.data.type === 'PVC_OPEN_IN_CHILD_FRAMES') openEmbeddedPlayers();
    if (event.data.type === 'PVC_HUD_OPENED') {
      searching = false;
      activeChild = null;
      delegatedVisible = false;
      hideChildren();
      if (requestedByParent) send(window.parent, 'NOK_FRAME_ACTIVE');
    }
    if (event.data.type === 'PVC_HUD_CLOSED') {
      hideChildren();
      searching = false;
      activeChild = null;
      delegatedVisible = false;
      if (requestedByParent) send(window.parent, 'NOK_FRAME_CLOSED');
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
})();
