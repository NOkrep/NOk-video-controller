/**
 * injected.js - NOk Video Controller v0.2.3 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage kullanılmaz.
 * 
 * v0.2.3 Yenilikleri ve Mimari İyileştirmeleri:
 * 1. Modüler Platform Adaptörleri (Isolated Site Adapters Pattern):
 *    - PuhuTvAdapter, KickAdapter, VideoJsAdapter, HlsJsAdapter, NativeAdapter
 *    - Her platform kendi izole dosya/nesne bloğunda çalışır, birbirlerinin mantığını bozamaz.
 * 2. PuhuTV MNCDN Token Koruması & Otomatik Fallback (Secure Token Recovery):
 *    - Secure token (HMAC 'st=') uyuşmazlığında VideoJS QualityLevels API tercih edilir.
 *    - Akış hata verirse siyah ekranda kalmaz, çalışan önceki çözünürlüğe anında geri döner.
 * 3. Tam Ekran (Fullscreen) Toast & Modal Desteği:
 *    - Fullscreen modunda toast ve teşhis pencereleri videonun arkasında kalmaz, aktif fullscreen konteynerine taşınır.
 * 4. Kick.com Canlı Yayın Katman Bağlayıcısı:
 *    - Canlı IVS / React Fiber arayüz tetikleyicisi ile kalite komutları doğrudan iletilir.
 */

(() => {
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === 'PVC_TOGGLE_POPUP' || event.data.type === 'PVC_TOGGLE_UI') {
      togglePvcPopup();
    }
  });

  if (window.__NOK_VIDEO_CONTROLLER_INJECTED__) {
    togglePvcPopup();
    return;
  }
  window.__NOK_VIDEO_CONTROLLER_INJECTED__ = true;

  console.log('[NOkrep] NOk Video Controller v0.2.3 (Modüler Adaptör Mimarisi) aktif.');

  const GITHUB_REPO_URL = 'https://github.com/NOkrep/NOk-video-controller';
  const DEVELOPER_EMAIL = 'ihsanartrk07@gmail.com';
  const HOSTNAME = window.location.hostname;

  // Bellek içi geçici durumlar (Stateless)
  let idleDelaySeconds = 5;
  let idleTimer = null;
  let activeForcedQuality = null; // '1', '2', '3', '4'
  let previousWorkingQuality = '4';

  const QUALITY_MAP = {
    '1': { res: '360p', height: 360, smil: '360p.smil', media: 'media-1', kick: '360p30', label: '360p (SD)' },
    '2': { res: '540p', height: 540, smil: '540p.smil', media: 'media-2', kick: '480p30', label: '540p (MD)' },
    '3': { res: '720p', height: 720, smil: '720p.smil', media: 'media-3', kick: '720p60', label: '720p (HD)' },
    '4': { res: '1080p', height: 1080, smil: '1080p.smil', media: 'media-4', kick: '1080p60', label: '1080p (FHD)' }
  };

  /**
   * Tam Ekran Konteynerini Döndürür
   */
  function getActiveContainer() {
    return document.fullscreenElement || 
           document.webkitFullscreenElement || 
           document.mozFullScreenElement || 
           document.msFullscreenElement || 
           document.body;
  }

  /**
   * Ortak Toast Bildirimi (Tam Ekran Uyumlu)
   */
  function showToast(text) {
    let toast = document.getElementById('pvc-toast-notice');
    const container = getActiveContainer();

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pvc-toast-notice';
      container.appendChild(toast);
    } else if (toast.parentElement !== container) {
      container.appendChild(toast);
    }

    toast.textContent = text;
    toast.classList.add('pvc-toast-visible');
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.classList.remove('pvc-toast-visible');
    }, 2500);
  }

  /**
   * URL Dönüştürme Yardımcısı
   */
  function transformQualityUrl(originalUrl, targetLvl) {
    if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;
    const cfg = QUALITY_MAP[targetLvl];
    if (!cfg) return originalUrl;

    let modified = originalUrl;

    // MNCDN .smil kalıbı
    if (/(1080p|720p|540p|480p|360p|240p)\.smil/i.test(modified)) {
      modified = modified.replace(/(1080p|720p|540p|480p|360p|240p)\.smil/gi, cfg.smil);
    }

    // Akamai media-X kalıbı
    if (/media-\d+/i.test(modified)) {
      modified = modified.replace(/media-\d+/gi, cfg.media);
    }

    // Doğrudan çözünürlük yolu
    if (/\/(1080p60|720p60|720p|540p|480p|360p)\//i.test(modified)) {
      const kickOrGeneric = HOSTNAME.includes('kick.com') ? cfg.kick : cfg.res;
      modified = modified.replace(/\/(1080p60|720p60|720p|540p|480p|360p)\//gi, `/${kickOrGeneric}/`);
    }

    return modified;
  }

  // =========================================================================
  // 🛡️ MODÜLER SİTE VE OYNATICI ADAPTÖRLERİ (SITE ADAPTERS PATTERN)
  // =========================================================================

  /**
   * 1. PuhuTV / MNCDN Adaptörü
   */
  const PuhuTvAdapter = {
    name: 'PuhuTvAdapter',
    matches() {
      return HOSTNAME.includes('puhutv.com') || !!document.querySelector('.puhu-player, [id*="puhu"], [class*="puhu"]');
    },
    applyQuality(targetLevel, video, player) {
      const cfg = QUALITY_MAP[targetLevel];
      console.log('[NOkrep:PuhuTvAdapter] Kalite uygulanıyor:', cfg.label);

      // Yöntem 1: VideoJS QualityLevels API (MNCDN token'ı bozmadan seviye seçer)
      if (player && typeof player.qualityLevels === 'function') {
        try {
          const qLevels = player.qualityLevels();
          if (qLevels && qLevels.length > 0) {
            let matchedIdx = -1;
            for (let i = 0; i < qLevels.length; i++) {
              if (qLevels[i].height === cfg.height || (qLevels[i].label && qLevels[i].label.includes(cfg.res))) {
                matchedIdx = i;
                qLevels[i].enabled = true;
              } else {
                qLevels[i].enabled = false;
              }
            }
            if (matchedIdx !== -1) {
              showToast(`PuhuTV Kalitesi: ${cfg.label}`);
              return true;
            }
          }
        } catch (e) {
          console.warn('[NOkrep:PuhuTvAdapter] qualityLevels API hatası:', e);
        }
      }

      // Yöntem 2: VideoJS Representations Seçimi
      try {
        const tech = player && player.tech_ ? player.tech_ : null;
        if (tech && tech.hls && tech.hls.representations) {
          const reps = tech.hls.representations();
          if (reps && reps.length > 0) {
            reps.forEach(rep => {
              rep.enabled(rep.height === cfg.height);
            });
            showToast(`PuhuTV HLS Seviyesi: ${cfg.label}`);
            return true;
          }
        }
      } catch (e) {}

      // Yöntem 3: player.src() URL Dönüştürme & Hata Korumalı Fallback
      let currentSrc = '';
      if (player && typeof player.currentSrc === 'function') currentSrc = player.currentSrc();
      if (!currentSrc && video) currentSrc = video.currentSrc || video.src || '';

      if (currentSrc && (currentSrc.includes('.smil') || currentSrc.includes('.m3u8'))) {
        const newSrc = transformQualityUrl(currentSrc, targetLevel);
        if (newSrc && newSrc !== currentSrc) {
          const currentTime = video ? video.currentTime : 0;
          const isPaused = video ? video.paused : false;

          // Hata Dinleyicisi (MNCDN Token uyuşmazlığında otomatik kurtarma)
          const errorHandler = () => {
            console.warn('[NOkrep:PuhuTvAdapter] MNCDN Token reddedildi. Önceki çalışan kaliteye dönülüyor.');
            showToast(`⚠️ MNCDN İmzası Reddedildi (${cfg.label}). 1080p'ye geri dönülüyor.`);
            if (player && typeof player.src === 'function') {
              player.src({ src: currentSrc, type: 'application/x-mpegURL' });
              if (!isPaused && typeof player.play === 'function') player.play().catch(() => {});
            }
            // Kullanıcıya otomatik teşhis aç
            reportAnonymousError('MNCDN_TOKEN_REJECTED', `MNCDN sunucusu ${cfg.label} için token reddetti (st=[REDACTED]).`);
            video.removeEventListener('error', errorHandler);
          };

          video.addEventListener('error', errorHandler, { once: true });

          try {
            if (player && typeof player.src === 'function') {
              player.src({ src: newSrc, type: 'application/x-mpegURL' });
              if (typeof player.currentTime === 'function') player.currentTime(currentTime);
              if (!isPaused && typeof player.play === 'function') player.play().catch(() => {});
            } else if (video) {
              video.src = newSrc;
              video.currentTime = currentTime;
              if (!isPaused) video.play().catch(() => {});
            }
            showToast(`PuhuTV Kalitesi: ${cfg.label}`);
            return true;
          } catch (err) {
            console.warn('[NOkrep:PuhuTvAdapter] src değiştirme hatası:', err);
          }
        }
      }

      showToast(`PuhuTV Kalite Yakalayıcı: ${cfg.label}`);
      return true;
    }
  };

  /**
   * 2. Kick.com Canlı Yayın Adaptörü (IVS & React UI)
   */
  const KickAdapter = {
    name: 'KickAdapter',
    matches() {
      return HOSTNAME.includes('kick.com');
    },
    applyQuality(targetLevel, video) {
      const cfg = QUALITY_MAP[targetLevel];
      console.log('[NOkrep:KickAdapter] Kick kalitesi tetikleniyor:', cfg.label);

      // 1. Doğrudan Kick IVS Player Nesnesi
      if (window.ivsPlayer && typeof window.ivsPlayer.setQuality === 'function') {
        try {
          const qualities = window.ivsPlayer.getQualities();
          const target = qualities.find(q => q.name.includes(cfg.res) || q.height === cfg.height);
          if (target) {
            window.ivsPlayer.setQuality(target);
            showToast(`Kick IVS: ${target.name}`);
            return true;
          }
        } catch (e) {
          console.warn('[NOkrep:KickAdapter] ivsPlayer hatası:', e);
        }
      }

      // 2. Kick Video Elementi React Fiber Bağlayıcısı
      try {
        if (video) {
          const fiberKey = Object.keys(video).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
          if (fiberKey && video[fiberKey]) {
            let node = video[fiberKey];
            let depth = 0;
            while (node && depth < 20) {
              if (node.memoizedProps && (node.memoizedProps.setQuality || node.memoizedProps.changeQuality || node.memoizedProps.player)) {
                const p = node.memoizedProps.player || node.memoizedProps;
                if (typeof p.setQuality === 'function') {
                  p.setQuality(cfg.res);
                  showToast(`Kick React Player: ${cfg.label}`);
                  return true;
                }
              }
              node = node.return;
              depth++;
            }
          }
        }
      } catch (e) {}

      // 3. Kick Arayüz Dişli Menüsü Simülasyonu
      try {
        const gearBtn = document.querySelector('button[aria-label*="Settings" i], button[aria-label*="Ayar" i], button[data-a-target="player-settings-button"]');
        if (gearBtn) {
          gearBtn.click();
          setTimeout(() => {
            const menuItems = Array.from(document.querySelectorAll('button, div[role="menuitem"], span'));
            const qualityOption = menuItems.find(el => el.textContent && (el.textContent.includes('Quality') || el.textContent.includes('Kalite')));
            if (qualityOption) {
              qualityOption.click();
              setTimeout(() => {
                const subItems = Array.from(document.querySelectorAll('button, div[role="menuitem"], span'));
                const targetRes = subItems.find(el => el.textContent && (el.textContent.includes(cfg.res) || el.textContent.includes(cfg.kick)));
                if (targetRes) {
                  targetRes.click();
                  showToast(`Kick Kalitesi: ${cfg.label}`);
                }
                if (gearBtn) gearBtn.click();
              }, 120);
            } else {
              if (gearBtn) gearBtn.click();
            }
          }, 120);
          return true;
        }
      } catch (uiErr) {
        console.warn('[NOkrep:KickAdapter] UI simülasyonu:', uiErr);
      }

      showToast(`Kick Kalitesi: ${cfg.label} (İletildi)`);
      return true;
    }
  };

  /**
   * 3. VideoJS Genel Adaptörü
   */
  const VideoJsAdapter = {
    name: 'VideoJsAdapter',
    matches(video, player) {
      return !!player || !!(video && (video.player || video.vjsPlayer || (video.parentElement && video.parentElement.player)));
    },
    applyQuality(targetLevel, video, player) {
      const cfg = QUALITY_MAP[targetLevel];
      const effPlayer = player || (video && (video.player || video.vjsPlayer || (video.parentElement && video.parentElement.player)));
      
      let currentSrc = '';
      if (effPlayer && typeof effPlayer.currentSrc === 'function') currentSrc = effPlayer.currentSrc();
      if (!currentSrc && video) currentSrc = video.currentSrc || video.src || '';

      if (currentSrc) {
        const newSrc = transformQualityUrl(currentSrc, targetLevel);
        if (newSrc && newSrc !== currentSrc) {
          const curTime = video ? video.currentTime : 0;
          if (effPlayer && typeof effPlayer.src === 'function') {
            effPlayer.src({ src: newSrc, type: 'application/x-mpegURL' });
            if (typeof effPlayer.currentTime === 'function') effPlayer.currentTime(curTime);
          } else if (video) {
            video.src = newSrc;
            video.currentTime = curTime;
          }
          showToast(`VideoJS Kalite: ${cfg.label}`);
          return true;
        }
      }
      return false;
    }
  };

  /**
   * 4. Hls.js Adaptörü
   */
  const HlsJsAdapter = {
    name: 'HlsJsAdapter',
    matches(video, player) {
      return !!(video && video.hls) || !!(player && player.hls) || !!(window.Hls && window.Hls.instances && window.Hls.instances.length > 0);
    },
    applyQuality(targetLevel, video, player) {
      const cfg = QUALITY_MAP[targetLevel];
      const hls = (video && video.hls) || (player && player.hls) || (window.Hls && window.Hls.instances && window.Hls.instances[0]);
      if (hls && hls.levels && hls.levels.length > 0) {
        const lvlIndex = Math.min(parseInt(targetLevel, 10) - 1, hls.levels.length - 1);
        hls.currentLevel = Math.max(0, lvlIndex);
        showToast(`HLS.js Kalitesi: ${hls.levels[hls.currentLevel].height || cfg.res}p`);
        return true;
      }
      return false;
    }
  };

  /**
   * 5. Standart HTML5 / Ağ Yakalayıcı Adaptörü
   */
  const NativeAdapter = {
    name: 'NativeAdapter',
    matches() { return true; },
    applyQuality(targetLevel, video) {
      const cfg = QUALITY_MAP[targetLevel];
      if (video && video.src && !video.src.startsWith('blob:')) {
        const newSrc = transformQualityUrl(video.src, targetLevel);
        if (newSrc !== video.src) {
          const cur = video.currentTime;
          video.src = newSrc;
          video.currentTime = cur;
          showToast(`Kalite Değiştirildi: ${cfg.label}`);
          return true;
        }
      }
      showToast(`Kalite Yönlendirildi: ${cfg.label} (Ağ Yakalayıcı)`);
      return true;
    }
  };

  const ADAPTER_PIPELINE = [
    PuhuTvAdapter,
    KickAdapter,
    HlsJsAdapter,
    VideoJsAdapter,
    NativeAdapter
  ];

  // =========================================================================
  // 🌐 AĞ İSTEKLERİ YAKALAYICISI (XHR & FETCH INTERCEPTOR)
  // =========================================================================
  (function initNetworkInterceptor() {
    if (window.__NOK_NETWORK_INTERCEPTOR_READY__) return;
    window.__NOK_NETWORK_INTERCEPTOR_READY__ = true;

    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      let targetUrl = url;
      if (typeof url === 'string' && activeForcedQuality) {
        targetUrl = transformQualityUrl(url, activeForcedQuality);
      }
      return originalXHROpen.apply(this, [method, targetUrl, ...rest]);
    };

    const originalFetch = window.fetch;
    window.fetch = function (resource, init) {
      if (typeof resource === 'string' && activeForcedQuality) {
        const targetUrl = transformQualityUrl(resource, activeForcedQuality);
        return originalFetch.call(this, targetUrl, init);
      } else if (resource instanceof Request && activeForcedQuality && typeof resource.url === 'string') {
        const newUrl = transformQualityUrl(resource.url, activeForcedQuality);
        const newReq = new Request(newUrl, resource);
        return originalFetch.call(this, newReq, init);
      }
      return originalFetch.apply(this, arguments);
    };

    console.log('[NOkrep] Ağ Yakalayıcısı (XHR & Fetch) devrede.');
  })();

  /**
   * Oynatıcı ve Video Tespiti
   */
  function findVideoAndPlayer() {
    const video = document.querySelector('video');
    if (!video) return { video: null, player: null, playerType: 'none', platform: HOSTNAME };

    let player = null;
    let playerType = 'native-html5';

    if (HOSTNAME.includes('youtube.com')) {
      playerType = 'youtube-player';
      player = document.getElementById('movie_player') || null;
    } else if (video.player) {
      player = video.player;
      playerType = 'videojs-attached';
    } else if (video.vjsPlayer) {
      player = video.vjsPlayer;
      playerType = 'vjsPlayer';
    } else if (video.parentElement && video.parentElement.player) {
      player = video.parentElement.player;
      playerType = 'videojs-parent';
    } else if (window.videojs && typeof window.videojs.getAllPlayers === 'function') {
      const players = window.videojs.getAllPlayers();
      if (players && players.length > 0) {
        player = players[0];
        playerType = 'videojs-global';
      }
    } else if (video.hls || (video.parentElement && video.parentElement.hls) || window.Hls) {
      playerType = 'hlsjs';
      player = video.hls || (video.parentElement && video.parentElement.hls) || null;
    }

    return { video, player, playerType, platform: HOSTNAME };
  }

  /**
   * Oynatma Hızı Ayarlama (0.25x - 3.0x, step 0.25)
   */
  function setSpeed(rate) {
    const { video, player } = findVideoAndPlayer();
    if (!video) {
      showToast('Video elementi bulunamadı');
      return false;
    }

    try {
      const validRate = Math.min(3.0, Math.max(0.25, parseFloat(rate.toFixed(2))));
      video.playbackRate = validRate;
      
      if (player && typeof player.playbackRate === 'function') {
        player.playbackRate(validRate);
      } else if (player && typeof player.setPlaybackRate === 'function') {
        player.setPlaybackRate(validRate);
      }

      const slider = document.getElementById('pvc-speed-slider');
      const label = document.getElementById('pvc-speed-value');
      if (slider) slider.value = validRate.toString();
      if (label) label.textContent = `${validRate}x`;

      showToast(`Hız: ${validRate}x`);
      return true;
    } catch (err) {
      console.error('[NOkrep] Hız ayarlanamadı:', err);
      reportAnonymousError('SPEED_CHANGE_FAILED', err.message);
      return false;
    }
  }

  /**
   * İleri / Geri Sarma (±10s)
   */
  function seekBy(seconds) {
    const { video, player } = findVideoAndPlayer();
    if (!video) return false;

    try {
      let current = 0;
      if (player && typeof player.currentTime === 'function') {
        current = player.currentTime();
      } else {
        current = video.currentTime || 0;
      }

      const target = Math.max(0, current + seconds);

      if (player && typeof player.currentTime === 'function') {
        player.currentTime(target);
      } else {
        video.currentTime = target;
      }

      showToast(seconds > 0 ? `+${seconds}s İleri` : `${seconds}s Geri`);
      return true;
    } catch (err) {
      console.error('[NOkrep] Sarma hatası:', err);
      reportAnonymousError('SEEK_FAILED', err.message);
      return false;
    }
  }

  /**
   * Çok Sütunlu Modüler Kalite Yönlendiricisi
   */
  function changeQuality(targetLevel) {
    activeForcedQuality = targetLevel.toString();
    const { video, player } = findVideoAndPlayer();

    for (const adapter of ADAPTER_PIPELINE) {
      if (adapter.matches(video, player)) {
        console.log(`[NOkrep] Adaptör seçildi: ${adapter.name}`);
        const handled = adapter.applyQuality(targetLevel, video, player);
        if (handled) {
          previousWorkingQuality = targetLevel.toString();
          return true;
        }
      }
    }

    return true;
  }

  /**
   * CDN Ping Testi (Tam Ekran Uyumlu & Ayrıntılı)
   */
  async function testCdnPing() {
    const { video, player } = findVideoAndPlayer();
    if (!video) {
      showToast('Video bulunamadı');
      return null;
    }

    let targetUrl = '';
    if (player && typeof player.currentSrc === 'function') targetUrl = player.currentSrc();
    if (!targetUrl || targetUrl.startsWith('blob:')) targetUrl = video.currentSrc || video.src || '';

    if (!targetUrl || targetUrl.startsWith('blob:')) {
      const resources = performance.getEntriesByType('resource');
      const mediaEntry = [...resources].reverse().find(r => 
        r.name.includes('.ts') || 
        r.name.includes('.m4s') || 
        r.name.includes('.m3u8') || 
        r.name.includes('.smil') ||
        r.name.includes('media-') ||
        r.name.includes('mncdn') ||
        r.name.includes('akamaized') ||
        r.name.includes('kick')
      );
      if (mediaEntry) targetUrl = mediaEntry.name;
    }

    if (!targetUrl) {
      showToast('Ping için aktif CDN akışı bulunamadı');
      return null;
    }

    let hostDisplay = 'CDN';
    try {
      const parsed = new URL(targetUrl);
      hostDisplay = parsed.hostname;
    } catch (e) {}

    try {
      const startTime = performance.now();
      await fetch(targetUrl, { method: 'HEAD', cache: 'no-store', mode: 'cors' });
      const ms = Math.round(performance.now() - startTime);
      
      let rating = 'Mükemmel (Takılmasız)';
      if (ms > 120) rating = 'Yüksek Gecikme (Buffer Riski)';
      else if (ms > 50) rating = 'İyi (HD Akış)';

      showToast(`📡 ${ms} ms • ${rating} (${hostDisplay})`);
      return { ms, rating, host: hostDisplay };
    } catch (err) {
      try {
        const startTime = performance.now();
        await fetch(targetUrl, { method: 'GET', cache: 'no-store', mode: 'no-cors' });
        const ms = Math.round(performance.now() - startTime);
        showToast(`📡 ${ms} ms (${hostDisplay})`);
        return { ms, rating: 'Aktif', host: hostDisplay };
      } catch (innerErr) {
        showToast(`Ping ölçülemedi (${hostDisplay})`);
        return null;
      }
    }
  }

  function sanitizeStreamUrl(url) {
    if (!url || typeof url !== 'string') return 'YOK';
    return url.replace(/([?&](token|auth|key|sig|session|hash|jwt|signature|access_token|user|st)=)[^&]*/gi, '$1[REDACTED]');
  }

  /**
   * Tamamen Anonim Hata Bildirimi (Zero PII & Tam Ekran Uyumlu Modal)
   */
  function reportAnonymousError(errorCode, message) {
    const { playerType, video, player } = findVideoAndPlayer();
    const cleanHostname = window.location.hostname || 'bilinmeyen-site';

    let capturedSampleUrl = '';
    if (player && typeof player.currentSrc === 'function') capturedSampleUrl = player.currentSrc();
    if (!capturedSampleUrl && video) capturedSampleUrl = video.currentSrc || video.src || '';
    if (!capturedSampleUrl || capturedSampleUrl.startsWith('blob:')) {
      const resources = performance.getEntriesByType('resource');
      const mediaEntry = [...resources].reverse().find(r => 
        r.name.includes('.m3u8') || 
        r.name.includes('.smil') || 
        r.name.includes('media-') || 
        r.name.includes('.ts')
      );
      if (mediaEntry) capturedSampleUrl = mediaEntry.name;
    }

    const anonymousPayload = {
      timestamp: new Date().toISOString(),
      errorCode,
      cleanMessage: message ? sanitizeStreamUrl(message) : 'Kullanıcı teşhis bildirdi.',
      streamSampleUrl: sanitizeStreamUrl(capturedSampleUrl),
      playerType,
      domain: cleanHostname,
      activeForcedQuality: activeForcedQuality ? `media-${activeForcedQuality}` : 'Yok',
      idleDelaySetting: `${idleDelaySeconds}s`,
      userAgentFamily: navigator.userAgent.includes('Firefox') ? 'Firefox (Gecko)' : 'Chromium',
      screenResolution: `${window.innerWidth}x${window.innerHeight}`
    };

    console.warn('[NOkrep Teşhis Paketi]:', anonymousPayload);
    showErrorModal(anonymousPayload);
  }

  function showErrorModal(payload) {
    const existing = document.getElementById('pvc-error-modal');
    if (existing) existing.remove();

    const jsonStr = JSON.stringify(payload, null, 2);
    const issueTitle = encodeURIComponent(`[Hata]: ${payload.domain} - ${payload.errorCode}`);
    const issueBody = encodeURIComponent(`### Anonim Hata Paketi (NOkrep)\n\`\`\`json\n${jsonStr}\n\`\`\`\n\n**Açıklama:** Bu sitede karşılaştığınız durumu ekleyebilirsiniz.`);
    
    const githubUrl = `${GITHUB_REPO_URL}/issues/new?template=site_support.md&title=${issueTitle}&body=${issueBody}`;
    const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}&body=${issueBody}`;

    const modal = document.createElement('div');
    modal.id = 'pvc-error-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Anonim Teşhis & Hata Raporu (v0.2.3)</span>
          <button id="pvc-close-modal-btn">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Sitede (<strong>${payload.domain}</strong>) akış kontrolü sırasında durum teşhisi üretildi. <strong>Sıfır depolama ve sıfır kişisel veri</strong> içeren teşhis paketi:
          </p>
          <pre class="pvc-modal-code">${jsonStr}</pre>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-copy-payload-btn" class="pvc-modal-btn-secondary">📋 JSON Kopyala</button>
          <a href="${mailtoUrl}" target="_blank" class="pvc-modal-btn-primary" style="background:#2563eb;">✉️ E-posta</a>
          <a href="${githubUrl}" target="_blank" class="pvc-modal-btn-primary" style="background:#4f46e5;">🐙 GitHub Issue Aç</a>
        </div>
      </div>
    `;

    const container = getActiveContainer();
    container.appendChild(modal);

    document.getElementById('pvc-close-modal-btn').onclick = () => modal.remove();
    document.getElementById('pvc-copy-payload-btn').onclick = () => {
      navigator.clipboard.writeText(jsonStr);
      showToast('Anonim teşhis verisi kopyalandı!');
    };
  }

  function resetIdleTimer(popup) {
    if (!popup) return;
    popup.classList.remove('pvc-idle-transparent');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      popup.classList.add('pvc-idle-transparent');
    }, idleDelaySeconds * 1000);
  }

  function makeDraggable(popup, header) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;
      
      isDragging = true;
      resetIdleTimer(popup);

      const rect = popup.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      popup.style.setProperty('bottom', 'auto', 'important');
      popup.style.setProperty('right', 'auto', 'important');
      popup.style.setProperty('left', `${initialLeft}px`, 'important');
      popup.style.setProperty('top', `${initialTop}px`, 'important');

      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        resetIdleTimer(popup);

        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        const maxLeft = Math.max(0, window.innerWidth - popup.offsetWidth - 10);
        const maxTop = Math.max(0, window.innerHeight - popup.offsetHeight - 10);

        newLeft = Math.max(10, Math.min(newLeft, maxLeft));
        newTop = Math.max(10, Math.min(newTop, maxTop));

        popup.style.setProperty('left', `${newLeft}px`, 'important');
        popup.style.setProperty('top', `${newTop}px`, 'important');
      };

      const onMouseUp = () => {
        isDragging = false;
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  function buildPvcPopup() {
    let popup = document.getElementById('pvc-controller-popup');
    if (popup) return popup;

    popup = document.createElement('div');
    popup.id = 'pvc-controller-popup';
    popup.className = 'pvc-floating-menu';

    popup.innerHTML = `
      <div id="pvc-drag-header" class="pvc-menu-header" title="Sürüklemek için basılı tutun">
        <div class="pvc-menu-brand">
          <span class="pvc-menu-badge">NOkrep v0.2.3</span>
          <span class="pvc-menu-title">NOk Video Controller</span>
        </div>
        <div class="pvc-header-actions">
          <button id="pvc-collapse-btn" class="pvc-icon-btn" title="Küçült / Büyüt">➖</button>
          <button id="pvc-close-popup-btn" class="pvc-icon-btn pvc-close" title="Kapat">✕</button>
        </div>
      </div>

      <div class="pvc-menu-section">
        <div class="pvc-section-header">
          <span class="pvc-label">Oynatma Hızı:</span>
          <span id="pvc-speed-value" class="pvc-val-badge">1.0x</span>
        </div>
        <div class="pvc-slider-row">
          <span class="pvc-slider-bound">0.25x</span>
          <input 
            type="range" 
            id="pvc-speed-slider" 
            min="0.25" 
            max="3.0" 
            step="0.25" 
            value="1.0" 
            class="pvc-range-slider"
          />
          <span class="pvc-slider-bound">3.0x</span>
        </div>
        <div class="pvc-quick-speed-buttons">
          <button class="pvc-chip-btn" data-speed="1.0">1x</button>
          <button class="pvc-chip-btn" data-speed="1.25">1.25x</button>
          <button class="pvc-chip-btn" data-speed="1.5">1.5x</button>
          <button class="pvc-chip-btn" data-speed="2.0">2x</button>
          <button class="pvc-chip-btn" data-speed="2.5">2.5x</button>
        </div>
      </div>

      <div class="pvc-menu-section">
        <span class="pvc-label">Hızlı Sarma:</span>
        <div class="pvc-btn-grid-2">
          <button id="pvc-seek-m10" class="pvc-action-btn">⏪ -10 Saniye</button>
          <button id="pvc-seek-p10" class="pvc-action-btn">⏩ +10 Saniye</button>
        </div>
      </div>

      <div class="pvc-menu-section">
        <div class="pvc-section-header">
          <span class="pvc-label">Kalite Zorlama:</span>
          <span class="pvc-subtext">Adaptör Destekli</span>
        </div>
        <div class="pvc-btn-grid-4">
          <button class="pvc-quality-btn" data-lvl="1" title="360p (SD / smil)">360p</button>
          <button class="pvc-quality-btn" data-lvl="2" title="540p (MD / smil)">540p</button>
          <button class="pvc-quality-btn" data-lvl="3" title="720p (HD / smil)">720p</button>
          <button class="pvc-quality-btn" data-lvl="4" title="1080p (FHD / smil)">1080p</button>
        </div>
      </div>

      <div class="pvc-menu-section" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
        <div class="pvc-section-header">
          <span class="pvc-label">Saydamlık Gecikmesi:</span>
          <span id="pvc-idle-delay-val" class="pvc-val-badge" style="color:#a78bfa; background:rgba(167,139,250,0.15); border-color:rgba(167,139,250,0.3);">${idleDelaySeconds}s</span>
        </div>
        <div class="pvc-quick-speed-buttons">
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="2">2sn</button>
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="3">3sn</button>
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="5">5sn</button>
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="8">8sn</button>
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="10">10sn</button>
        </div>
      </div>

      <div class="pvc-menu-footer">
        <button id="pvc-ping-btn" class="pvc-footer-btn pvc-btn-emerald" title="Sunucu gecikmesini ölç">📡 CDN Ping</button>
        <button id="pvc-report-err-btn" class="pvc-footer-btn pvc-btn-amber" title="Teşhis paketini aç">⚠️ Hata Bildir</button>
      </div>
    `;

    const container = getActiveContainer();
    container.appendChild(popup);

    const dragHeader = popup.querySelector('#pvc-drag-header');
    makeDraggable(popup, dragHeader);

    popup.addEventListener('mouseenter', () => resetIdleTimer(popup));
    popup.addEventListener('mousemove', () => resetIdleTimer(popup));
    popup.addEventListener('mousedown', () => resetIdleTimer(popup));
    popup.addEventListener('touchstart', () => resetIdleTimer(popup));

    const slider = popup.querySelector('#pvc-speed-slider');
    const speedVal = popup.querySelector('#pvc-speed-value');

    slider.addEventListener('input', (e) => {
      resetIdleTimer(popup);
      const val = parseFloat(e.target.value);
      speedVal.textContent = `${val}x`;
      setSpeed(val);
    });

    popup.querySelectorAll('.pvc-chip-btn:not(.pvc-idle-btn)').forEach(btn => {
      btn.onclick = () => {
        resetIdleTimer(popup);
        const val = parseFloat(btn.getAttribute('data-speed'));
        setSpeed(val);
      };
    });

    popup.querySelector('#pvc-seek-m10').onclick = () => {
      resetIdleTimer(popup);
      seekBy(-10);
    };

    popup.querySelector('#pvc-seek-p10').onclick = () => {
      resetIdleTimer(popup);
      seekBy(10);
    };

    popup.querySelectorAll('.pvc-quality-btn').forEach(btn => {
      const lvl = btn.getAttribute('data-lvl');
      if (activeForcedQuality === lvl) btn.classList.add('pvc-active');

      btn.onclick = () => {
        resetIdleTimer(popup);
        popup.querySelectorAll('.pvc-quality-btn').forEach(b => b.classList.remove('pvc-active'));
        btn.classList.add('pvc-active');
        changeQuality(lvl);
      };
    });

    const updateIdleBtnUI = () => {
      popup.querySelectorAll('.pvc-idle-btn').forEach(btn => {
        const sec = parseInt(btn.getAttribute('data-sec'), 10);
        if (sec === idleDelaySeconds) {
          btn.style.background = '#7c3aed';
          btn.style.color = '#ffffff';
          btn.style.borderColor = '#a78bfa';
        } else {
          btn.style.background = '';
          btn.style.color = '';
          btn.style.borderColor = '';
        }
      });
    };
    updateIdleBtnUI();

    popup.querySelectorAll('.pvc-idle-btn').forEach(btn => {
      btn.onclick = () => {
        const sec = parseInt(btn.getAttribute('data-sec'), 10);
        idleDelaySeconds = sec;
        const valBadge = popup.querySelector('#pvc-idle-delay-val');
        if (valBadge) valBadge.textContent = `${sec}s`;
        updateIdleBtnUI();
        showToast(`Saydamlık Gecikmesi: ${sec} saniye`);
        resetIdleTimer(popup);
      };
    });

    popup.querySelector('#pvc-ping-btn').onclick = async function () {
      resetIdleTimer(popup);
      this.textContent = 'Ölçülüyor...';
      const res = await testCdnPing();
      if (res && res.ms !== undefined) {
        this.textContent = `📡 ${res.ms} ms`;
      } else {
        this.textContent = '📡 Ping';
      }
    };

    popup.querySelector('#pvc-report-err-btn').onclick = () => {
      resetIdleTimer(popup);
      const { video } = findVideoAndPlayer();
      reportAnonymousError('USER_MANUAL_DIAGNOSTIC', video ? 'Kullanıcı teşhis ve hata bildirimini tetikledi.' : 'Video bulunamadı.');
    };

    popup.querySelector('#pvc-collapse-btn').onclick = (e) => {
      e.stopPropagation();
      resetIdleTimer(popup);
      popup.classList.toggle('pvc-collapsed');
      const isCollapsed = popup.classList.contains('pvc-collapsed');
      e.target.textContent = isCollapsed ? '➕' : '➖';
    };

    popup.querySelector('#pvc-close-popup-btn').onclick = (e) => {
      e.stopPropagation();
      popup.style.display = 'none';
    };

    resetIdleTimer(popup);
    return popup;
  }

  function togglePvcPopup() {
    const popup = buildPvcPopup();
    const container = getActiveContainer();

    if (popup.parentElement !== container) {
      container.appendChild(popup);
    }

    const isVisible = popup.style.display !== 'none';
    popup.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      resetIdleTimer(popup);
      const { video } = findVideoAndPlayer();
      if (video) {
        const currentSpeed = video.playbackRate || 1.0;
        const slider = document.getElementById('pvc-speed-slider');
        const speedVal = document.getElementById('pvc-speed-value');
        if (slider) slider.value = currentSpeed.toString();
        if (speedVal) speedVal.textContent = `${currentSpeed}x`;
      }
    }
  }

  const handleFullscreenChange = () => {
    const popup = document.getElementById('pvc-controller-popup');
    const toast = document.getElementById('pvc-toast-notice');
    const modal = document.getElementById('pvc-error-modal');
    const container = getActiveContainer();

    if (popup && popup.parentElement !== container) {
      container.appendChild(popup);
    }
    if (toast && toast.parentElement !== container) {
      container.appendChild(toast);
    }
    if (modal && modal.parentElement !== container) {
      container.appendChild(modal);
    }

    if (popup) resetIdleTimer(popup);
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);

  buildPvcPopup();
  showToast('NOk Video Controller v0.2.3 Hazır (NOkrep)');
})();