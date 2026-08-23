/**
 * background.js - NOk Video Controller v0.2.2
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Depolama: Arka planda hiçbir durum saklamaz.
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id || !tab.url) return;

  if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('edge://')) {
    return;
  }

  try {
    // 1. CSS Enjeksiyonu
    await browserAPI.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['injected.css']
    }).catch(() => {});

    // 2. Content Script Enjeksiyonu
    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (err) {
    console.error('[NOkrep:Background] Enjeksiyon hatası:', err);
  }
});