/**
 * background.js - Service Worker (Chromium) / Background Script (Firefox)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'))) {
    console.warn('[NOkrep] Sistem sayfalarında çalıştırılamaz.');
    return;
  }

  try {
    // 1. injected.css dosyasını sekmeye aktar
    await browserAPI.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['injected.css']
    }).catch(err => {
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