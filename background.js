/**
 * background.js - Service Worker (Chromium) / Background Script (Firefox)
 * Geliştirici: NOkrep
 * 
 * Felsefe:
 * 1. Tamamen "Stateless": storage API'si veya persistent arka plan dinlemesi kullanılmaz.
 * 2. On-Demand (İsteğe Bağlı): Kullanıcı araç çubuğu ikonuna tıkladığında aktif sekmeyi dönüştürür.
 * 3. activeTab Yetkisi: Minimum izin ilkesi.
 */

// Chrome ve Firefox WebExtensions API uyumluluk sarmalayıcısı (Cross-browser shim)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  
  // Sistem sayfalarında (chrome://, about:, addons.mozilla.org, edge://) güvenlik nedeniyle çalıştırılamaz
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'))) {
    console.warn('[NOkrep] Sistem sayfalarında çalıştırılamaz.');
    return;
  }

  try {
    // 1. injected.css dosyasını sekmeye enjekte et
    await browserAPI.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['injected.css']
    }).catch(err => {
      // CSS önceden enjekte edilmiş olabilir, sessizce geç
      console.log('[NOkrep] CSS insert notice:', err.message);
    });

    // A toolbar click grants activeTab. Native MAIN injection avoids a page's script loader/CSP.
    let mainReady = false;
    try {
      const prepared = await browserAPI.scripting.executeScript({
        target: { tabId: tab.id }, world: 'MAIN',
        func: (logoUrl, productLogoUrl) => {
          if (window.__NOK_VIDEO_CONTROLLER_ENGINE_READY__ === true) return true;
          window.__NOK_VIDEO_CONTROLLER_ASSETS__ = { logoUrl, productLogoUrl };
          return false;
        },
        args: [browserAPI.runtime.getURL('icons/nok-logo.svg'), browserAPI.runtime.getURL('icons/filmdeck-logo.png')]
      });
      mainReady = prepared.some(item => item.result === true);
      if (!mainReady) {
        await browserAPI.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', files: ['frame-protocol.js', 'injected.js'] });
        const ready = await browserAPI.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN',
          func: () => window.__NOK_VIDEO_CONTROLLER_ENGINE_READY__ === true });
        mainReady = ready.some(item => item.result === true);
      }
    } catch (_) {
      // Firefox 121–127 has no MAIN execution world; retain the DOM injection fallback.
    }

    // Explicit isolated-world intent; document.readyState cannot identify a click.
    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      func: ready => {
        window.__NOK_VIDEO_CONTROLLER_TOOLBAR_REQUEST__ = true;
        if (ready) window.__NOK_VIDEO_CONTROLLER_MAIN_READY__ = true;
      }, args: [mainReady]
    });
    // 2. content.js dosyasını sekmeye enjekte et
    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['frame-protocol.js', 'content.js']
    });

    console.log('[NOkrep] FilmDeck sekmeye başarıyla bağlandı.');
  } catch (error) {
    console.error('[NOkrep] Enjeksiyon hatası:', error);
  }
});
