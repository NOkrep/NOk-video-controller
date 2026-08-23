/**
 * content.js - Isolated World Content Script
 * Geliştirici: NOkrep
 */
(() => {
  // Eğer daha önce çalıştıysa çift enjeksiyonu önle, arayüzü aç/kapa yap
  if (window.__NOK_VIDEO_CONTROLLER_CONTENT_LOADED__) {
    window.postMessage({ type: 'PVC_TOGGLE_POPUP' }, '*');
    return;
  }
  window.__NOK_VIDEO_CONTROLLER_CONTENT_LOADED__ = true;

  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

  /**
   * Main World Enjeksiyonu:
   * Sayfadaki 'window.videojs', video elementleri ve player closure'larına doğrudan
   * erişebilmek için injected.js dosyasını DOM'a bir script elementi olarak ekleyip
   * işi bitince DOM'dan temizleriz (kod bellekte çalışmaya devam eder).
   */
  function injectMainWorldScript() {
    try {
      const script = document.createElement('script');
      script.src = browserAPI.runtime.getURL('injected.js');
      script.onload = function () {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      console.error('[NOkrep:Content] Main World script enjekte edilemedi:', e);
    }
  }

  injectMainWorldScript();

  // Main World ile mesajlaşma dinleyicisi
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || !event.data.type) return;

    if (event.data.type === 'PVC_RE_INJECT_REQUEST') {
      injectMainWorldScript();
    }
  });
})();
