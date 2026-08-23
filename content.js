/**
 * content.js - Isolated World Content Script
 * Geliştirici: NOkrep
 */
(() => {
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

  // Eğer sayfa ilk defa yükleniyorsa script'i enjekte et
  if (!window.__NOK_VIDEO_CONTROLLER_CONTENT_LOADED__) {
    window.__NOK_VIDEO_CONTROLLER_CONTENT_LOADED__ = true;
    injectMainWorldScript();
  } else {
    // Zaten enjekte edilmiş, toggle mesajını doğrudan ilet
    window.postMessage({ type: 'PVC_TOGGLE_POPUP' }, '*');
  }

  // Main World ile mesajlaşma dinleyicisi
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || !event.data.type) return;

    if (event.data.type === 'PVC_RE_INJECT_REQUEST') {
      injectMainWorldScript();
    }
  });
})();
