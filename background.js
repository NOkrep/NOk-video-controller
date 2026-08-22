/**
 * background.js - Service Worker (Chromium) / Background Script (Firefox)
 * Geliştirici: NOkrep
 */
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('edge://'))) {
    console.warn('[NOkrep] Sistem sayfalarında çalıştırılamaz.');
    return;
  }

  try {
    await browserAPI.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['injected.css']
    }).catch(err => {
      console.log('[NOkrep] CSS yükleme uyarısı:', err.message);
    });

    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    console.log('[NOkrep] Script başarıyla enjekte edildi.');
  } catch (error) {
    console.error('[NOkrep] Enjeksiyon hatası:', error);
  }
});