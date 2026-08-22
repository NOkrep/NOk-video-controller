document.getElementById('launchBtn').addEventListener('click', async () => {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  try {
    await browserAPI.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['injected.css']
    }).catch(() => {});

    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    window.close();
  } catch (err) {
    console.error(err);
  }
});