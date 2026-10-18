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
  function injectMainWorldScript(autoOpen = false) {
    try {
      const script = document.createElement('script');
      script.src = browserAPI.runtime.getURL('injected.js');
      script.dataset.logoUrl = browserAPI.runtime.getURL('icons/nok-logo.svg');
      script.onload = function () {
        this.remove();
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
    window.postMessage({ type: 'PVC_TOGGLE_POPUP' }, '*');
    return;
  }

  // Yalnızca sabit bir açma sinyali aşağıya iletilir; adres veya rapor verisi taşınmaz.
  function openEmbeddedPlayers() {
    document.querySelectorAll('iframe, frame').forEach(frame => {
      try { frame.contentWindow?.postMessage({ type: 'NOK_FRAME_OPEN' }, '*'); } catch (_) {}
    });
  }

  // Main World ile mesajlaşma dinleyicisi
  window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;
    if (window.parent !== window && event.source === window.parent && event.data.type === 'NOK_FRAME_OPEN') {
      window.postMessage({ type: 'PVC_OPEN_IF_MEDIA' }, '*');
      openEmbeddedPlayers();
      return;
    }
    if (event.source !== window) return;
    if (event.data.type === 'PVC_OPEN_IN_CHILD_FRAMES') openEmbeddedPlayers();

    if (event.data.type === 'PVC_RE_INJECT_REQUEST') {
      injectMainWorldScript();
    }
  });
})();
