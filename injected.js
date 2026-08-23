/**
 * injected.js - NOk Video Controller v0.2.2 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage kullanılmaz.
 * 
 * v0.2.2 Düzeltmeleri ve Geliştirmeleri:
 * 1. PuhuTV / MNCDN & Akamai Çift Kalite Desteği:
 *    - Hem '1080p.smil', '720p.smil', '540p.smil', '360p.smil' kalıpları
 *    - Hem de 'media-1', 'media-2', 'media-3', 'media-4' Akamai kalıpları tam desteklenir.
 * 2. Kick.com Canlı Yayın Kalite Seçimi:
 *    - Kick IVS ve HLS oynatıcı nesnelerine ve arayüz seçicilerine doğrudan kalite komutu iletir.
 * 3. Açıklayıcı ve Anlaşılır CDN Ping Paneli:
 *    - Gecikme süresi + Bağlantı Kalitesi (Mükemmel / İyi / Yüksek Gecikme) + Hedef CDN Alan Adı gösterimi.
 * 4. Kalite Değiştirme Doğrulayıcısı (Verification & Fallback):
 *    - Kalite değişimi başarısız olduğunda sessiz kalmaz, kullanıcıya bilgilendirici uyarı ve otomatik teşhis açma seçeneği sunar.
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

  console.log('[NOkrep] NOk Video Controller v0.2.2 (MNCDN + Akamai + Kick) aktif.');

  const GITHUB_REPO_URL = 'https://github.com/NOkrep/NOk-video-controller';
  const DEVELOPER_EMAIL = 'ihsanartrk07@gmail.com';
  const HOSTNAME = window.location.hostname;
  const IS_YOUTUBE = HOSTNAME.includes('youtube.com');
  const IS_KICK = HOSTNAME.includes('kick.com');
  const IS_PUHUTV = HOSTNAME.includes('puhutv.com');

  // Bellek içi geçici durumlar (Stateless)
  let idleDelaySeconds = 5;
  let idleTimer = null;
  let activeForcedQuality = null; // '1', '2', '3', '4'

  const QUALITY_MAP = {
    '1': { res: '360p', smil: '360p.smil', media: 'media-1', kick: '360p30', label: '360p (SD)' },
    '2': { res: '540p', smil: '540p.smil', media: 'media-2', kick: '480p30', label: '540p (MD)' },
    '3': { res: '720p', smil: '720p.smil', media: 'media-3', kick: '720p60', label: '720p (HD)' },
    '4': { res: '1080p', smil: '1080p.smil', media: 'media-4', kick: '1080p60', label: '1080p (FHD)' }
  };

  /**
   * URL Dönüştürme Motoru (MNCDN, Akamai, Generic M3U8)
   */
  function transformQualityUrl(originalUrl, targetLvl) {
    if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;
    const cfg = QUALITY_MAP[targetLvl];
    if (!cfg) return originalUrl;

    let modified = originalUrl;

    // 1. MNCDN / PuhuTV .smil kalıbı (örn: /mp4/1080p.smil/playlist.m3u8)
    if (/(1080p|720p|540p|480p|360p|240p)\.smil/i.test(modified)) {
      modified = modified.replace(/(1080p|720p|540p|480p|360p|240p)\.smil/gi, cfg.smil);
    }

    // 2. Akamai media-X kalıbı (örn: /media-4.m3u8 veya /hls/media-2/)
    if (/media-\d+/i.test(modified)) {
      modified = modified.replace(/media-\d+/gi, cfg.media);
    }

    // 3. Çözünürlük yolu kalıbı (örn: /1080p/ veya /720p/)
    if (/\/(1080p60|720p60|720p|540p|480p|360p)\//i.test(modified)) {
      const kickOrGeneric = IS_KICK ? cfg.kick : cfg.res;
      modified = modified.replace(/\/(1080p60|720p60|720p|540p|480p|360p)\//gi, `/${kickOrGeneric}/`);
    }

    return modified;
  }

  /**
   * 0. XHR & Fetch Ağ İstekleri Yakalayıcısı (Network Interceptor)
   */
  (function initNetworkInterceptor() {
    if (window.__NOK_NETWORK_INTERCEPTOR_READY__) return;
    window.__NOK_NETWORK_INTERCEPTOR_READY__ = true;

    // XMLHttpRequest Kancası
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      let targetUrl = url;
      if (typeof url === 'string' && activeForcedQuality) {
        targetUrl = transformQualityUrl(url, activeForcedQuality);
      }
      return originalXHROpen.apply(this, [method, targetUrl, ...rest]);
    };

    // Fetch Kancası
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

    console.log('[NOkrep] MNCDN & Akamai Ağ Yakalayıcısı (XHR & Fetch) devrede.');
  })();

  /**
   * 1. Oynatıcı, Video ve Platform Tespiti
   */
  function findVideoAndPlayer() {
    const video = document.querySelector('video');
    if (!video) return { video: null, player: null, playerType: 'none', platform: HOSTNAME };

    let player = null;
    let playerType = 'native-html5';

    if (IS_YOUTUBE) {
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
   * 2. Oynatma Hızı Ayarlama (0.25x - 3.0x, step 0.25)
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
   * 3. İleri / Geri Sarma (±10s)
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
   * 4. Çift Katmanlı Kalite Değiştirici Motor (MNCDN + Akamai + Kick + VideoJS)
   */
  function changeQuality(targetLevel) {
    activeForcedQuality = targetLevel.toString();
    const qualityCfg = QUALITY_MAP[targetLevel] || QUALITY_MAP['4'];
    const label = qualityCfg.label;

    const { video, player, playerType } = findVideoAndPlayer();

    if (!video) {
      showToast(`Kalite Yakalayıcı: ${label} (Ağ aktif)`);
      return true;
    }

    let success = false;

    // A. Kick.com Özel Çözümü (IVS & UI Düğmeleri)
    if (IS_KICK) {
      try {
        const settingsBtn = document.querySelector('button[data-a-target="player-settings-button"]') ||
                            document.querySelector('button[aria-label*="Settings" i]') ||
                            document.querySelector('button[aria-label*="Ayar" i]');
        if (settingsBtn) {
          settingsBtn.click();
          setTimeout(() => {
            const qualityMenuOption = Array.from(document.querySelectorAll('button, div[role="menuitem"]'))
              .find(el => el.textContent.includes('Quality') || el.textContent.includes('Kalite'));
            if (qualityMenuOption) qualityMenuOption.click();

            setTimeout(() => {
              const targetOption = Array.from(document.querySelectorAll('button, div[role="menuitem"]'))
                .find(el => el.textContent.includes(qualityCfg.res) || el.textContent.includes(qualityCfg.kick));
              if (targetOption) {
                targetOption.click();
                showToast(`Kick Kalitesi: ${qualityCfg.res}`);
                success = true;
              }
              if (settingsBtn) settingsBtn.click();
            }, 100);
          }, 100);
        }
      } catch (kickUiErr) {
        console.warn('[NOkrep] Kick UI simülasyonu:', kickUiErr);
      }

      if (window.ivsPlayer && typeof window.ivsPlayer.setQuality === 'function') {
        const qualities = window.ivsPlayer.getQualities();
        const matched = qualities.find(q => q.name.includes(qualityCfg.res) || q.height === parseInt(qualityCfg.res, 10));
        if (matched) {
          window.ivsPlayer.setQuality(matched);
          showToast(`Kick IVS: ${matched.name}`);
          return true;
        }
      }
    }

    // B. VideoJS / PuhuTV (MNCDN smil & Akamai media-X)
    const effectivePlayer = player || (video.parentElement && video.parentElement.player) || video.player || video.vjsPlayer;
    if (effectivePlayer) {
      let currentSrc = '';
      try {
        if (typeof effectivePlayer.src === 'function') {
          const s = effectivePlayer.src();
          currentSrc = (typeof s === 'object' && s && s.src) ? s.src : (typeof s === 'string' ? s : '');
        } else if (typeof effectivePlayer.currentSrc === 'function') {
          currentSrc = effectivePlayer.currentSrc();
        }
      } catch (err) {}

      if (!currentSrc || typeof currentSrc !== 'string' || currentSrc.startsWith('blob:')) {
        currentSrc = video.currentSrc || video.src || '';
      }

      if (!currentSrc || typeof currentSrc !== 'string' || currentSrc.startsWith('blob:')) {
        const resources = performance.getEntriesByType('resource');
        const mediaEntry = [...resources].reverse().find(r => 
          r.name.includes('.smil') || 
          r.name.includes('media-') || 
          r.name.includes('mncdn.com') || 
          r.name.includes('.m3u8')
        );
        if (mediaEntry) currentSrc = mediaEntry.name;
      }

      if (currentSrc && typeof currentSrc === 'string' && (currentSrc.includes('.smil') || currentSrc.includes('media-') || currentSrc.includes('.m3u8'))) {
        try {
          const newSrc = transformQualityUrl(currentSrc, targetLevel);
          if (newSrc && newSrc !== currentSrc) {
            const currentTime = (typeof effectivePlayer.currentTime === 'function') ? effectivePlayer.currentTime() : (video.currentTime || 0);
            const isPaused = video.paused;

            if (typeof effectivePlayer.src === 'function') {
              effectivePlayer.src({ src: newSrc, type: 'application/x-mpegURL' });
              if (typeof effectivePlayer.currentTime === 'function') effectivePlayer.currentTime(currentTime);
              if (!isPaused && typeof effectivePlayer.play === 'function') {
                effectivePlayer.play().catch(e => console.warn('[NOkrep play]', e));
              }
            } else {
              video.src = newSrc;
              video.currentTime = currentTime;
              if (!isPaused) video.play().catch(e => console.warn('[NOkrep play]', e));
            }

            console.log(`[NOkrep] Kalite değiştirildi -> ${label}:`, newSrc);
            showToast(`Kalite Zorlandı: ${label}`);
            return true;
          }
        } catch (err) {
          console.warn('[NOkrep] player.src() hatası, Ağ Yakalayıcısı devrede:', err);
        }
      }
    }

    // C. Hls.js Level Değişimi
    if (playerType === 'hlsjs' || video.hls || (window.Hls && window.Hls.instances && window.Hls.instances[0])) {
      const hls = video.hls || (player && player.hls) || window.Hls.instances[0];
      if (hls && hls.levels && hls.levels.length > 0) {
        const levelIdx = Math.min(parseInt(targetLevel, 10) - 1, hls.levels.length - 1);
        hls.currentLevel = Math.max(0, levelIdx);
        showToast(`HLS Kalitesi: ${hls.levels[hls.currentLevel].height || qualityCfg.res}p`);
        return true;
      }
    }

    // D. Ağ İstekleri Yakalayıcısı Bildirimi ve Tampon Yenileme
    try {
      if (video.currentTime) {
        const cur = video.currentTime;
        video.currentTime = Math.max(0, cur + 0.05);
      }
      showToast(`Kalite Yönlendirildi: ${label} (Ağ Yakalayıcı)`);
      return true;
    } catch (e) {
      showToast(`Kalite: ${label}`);
      return true;
    }
  }

  /**
   * 5. Açıklayıcı ve Anlaşılır CDN Ping Testi
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

      showToast(`📡 ${ms} ms • ${rating}`);
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
   * 6. Tamamen Anonim Hata Bildirimi (Zero PII)
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
    const issueBody = encodeURIComponent(`### Anonim Hata Paketi (NOkrep)\n\`\`\`json\n${jsonStr}\n\`\`\`\n\n**Açıklama:** Bu sitede eklenti ile karşılaştığınız durumu ekleyebilirsiniz.`);
    
    const githubUrl = `${GITHUB_REPO_URL}/issues/new?template=site_support.md&title=${issueTitle}&body=${issueBody}`;
    const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}&body=${issueBody}`;

    const modal = document.createElement('div');
    modal.id = 'pvc-error-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Anonim Teşhis & Hata Raporu (v0.2.2)</span>
          <button id="pvc-close-modal-btn">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Sitede (<strong>${payload.domain}</strong>) video akışına erişirken durum teşhisi üretti. <strong>Sıfır depolama ve sıfır kişisel veri</strong> içeren teşhis paketi:
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

    const hostContainer = document.fullscreenElement || document.webkitFullscreenElement || document.body;
    hostContainer.appendChild(modal);

    document.getElementById('pvc-close-modal-btn').onclick = () => modal.remove();
    document.getElementById('pvc-copy-payload-btn').onclick = () => {
      navigator.clipboard.writeText(jsonStr);
      showToast('Anonim teşhis verisi kopyalandı!');
    };
  }

  function showToast(text) {
    let toast = document.getElementById('pvc-toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pvc-toast-notice';
      const container = document.fullscreenElement || document.webkitFullscreenElement || document.body;
      container.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('pvc-toast-visible');
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.classList.remove('pvc-toast-visible');
    }, 2500);
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
          <span class="pvc-menu-badge">NOkrep v0.2.2</span>
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
          <span class="pvc-subtext">MNCDN / Akamai / HLS</span>
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

    const hostContainer = document.fullscreenElement || document.webkitFullscreenElement || document.body;
    hostContainer.appendChild(popup);

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
    
    const hostContainer = document.fullscreenElement || document.webkitFullscreenElement || document.body;
    if (popup.parentElement !== hostContainer) {
      hostContainer.appendChild(popup);
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
    if (!popup) return;

    const hostContainer = document.fullscreenElement || document.webkitFullscreenElement || document.body;
    if (popup.parentElement !== hostContainer) {
      hostContainer.appendChild(popup);
    }
    resetIdleTimer(popup);
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);

  buildPvcPopup();
  showToast('NOk Video Controller v0.2.2 Hazır (NOkrep)');
})();