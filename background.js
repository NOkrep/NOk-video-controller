/**
 * background.js - Service Worker (Chromium) / Background Script (Firefox)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
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

    // 2. content.js dosyasını sekmeye enjekte et
    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    console.log('[NOkrep] NOk Video Controller sekmeye başarıyla bağlandı.');
  } catch (error) {
    console.error('[NOkrep] Enjeksiyon hatası:', error);
  }
});
