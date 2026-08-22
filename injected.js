/**
 * injected.js - NOk Video Controller (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
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

  console.log('[NOkrep] NOk Video Controller v2.0 aktifleşti.');

  const GITHUB_REPO_URL = 'https://github.com/NOkrep/NOk-video-controller';
  const DEVELOPER_EMAIL = 'ihsanartrk07@gmail.com';
  const HOSTNAME = window.location.hostname;
  const IS_YOUTUBE = HOSTNAME.includes('youtube.com');
  const IS_KICK = HOSTNAME.includes('kick.com');

  let idleTimer = null;
  const IDLE_TIMEOUT_MS = 10000; // 10 saniye hareketsizlik süresi

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

  function seekBy(seconds) {
    const { video, player } = findVideoAndPlayer();
    if (!video) return false;

    try {
      let current = (player && typeof player.currentTime === 'function') ? player.currentTime() : (video.currentTime || 0);
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

  function changeQuality(targetLevel) {
    const { video, player, playerType } = findVideoAndPlayer();
    if (!video) {
      reportAnonymousError('NO_VIDEO_FOUND', 'Kalite değiştirilecek video elementi yok.');
      return false;
    }

    if (IS_KICK || playerType === 'hlsjs') {
      const hlsInstance = video.hls || (player && player.hls) || (window.Hls && window.Hls.instances && window.Hls.instances[0]);
      if (hlsInstance && hlsInstance.levels && hlsInstance.levels.length > 0) {
        const levelIdx = Math.min(parseInt(targetLevel, 10) - 1, hlsInstance.levels.length - 1);
        hlsInstance.currentLevel = Math.max(0, levelIdx);
        const selected = hlsInstance.levels[hlsInstance.currentLevel];
        const resLabel = selected ? `${selected.height}p` : `Level ${targetLevel}`;
        showToast(`Kick Kalitesi: ${resLabel}`);
        return true;
      }
    }

    let activeSrc = '';
    if (player && typeof player.currentSrc === 'function') activeSrc = player.currentSrc();
    if (!activeSrc && player && typeof player.src === 'function') activeSrc = player.src();
    if (!activeSrc || typeof activeSrc !== 'string' || activeSrc.startsWith('blob:')) {
      activeSrc = video.currentSrc || video.src || '';
    }

    if ((!activeSrc || activeSrc.startsWith('blob:')) && player && player.tech_) {
      const tech = player.tech_;
      if (tech.src_) activeSrc = tech.src_;
      else if (tech.el_ && tech.el_.src) activeSrc = tech.el_.src;
    }

    if (!activeSrc || activeSrc.startsWith('blob:')) {
      const resources = performance.getEntriesByType('resource');
      const mediaEntry = [...resources].reverse().find(r => 
        r.name.includes('media-') || 
        r.name.includes('.m3u8') || 
        r.name.includes('/hls/') || 
        r.name.includes('master')
      );
      if (mediaEntry) activeSrc = mediaEntry.name;
    }

    if (activeSrc && activeSrc.includes('media-')) {
      try {
        const targetMediaStr = `media-${targetLevel}`;
        const newSrc = activeSrc.replace(/media-\d+/, targetMediaStr);
        const currentTime = (player && typeof player.currentTime === 'function') ? player.currentTime() : video.currentTime;
        const isPaused = video.paused;

        if (player && typeof player.src === 'function') {
          player.src({ src: newSrc, type: 'application/x-mpegURL' });
          player.currentTime(currentTime);
          if (!isPaused) player.play();
        } else {
          video.src = newSrc;
          video.currentTime = currentTime;
          if (!isPaused) video.play();
        }

        const qualityLabels = { '1': '360p (SD)', '2': '540p (MD)', '3': '720p (HD)', '4': '1080p (FHD)' };
        showToast(`Kalite: ${qualityLabels[targetLevel] || targetMediaStr}`);
        return true;
      } catch (err) {
        console.error('[NOkrep] Akamai değiştirme hatası:', err);
        reportAnonymousError('AKAMAI_SWAP_ERROR', err.message);
        return false;
      }
    }

    showToast('Akamai media-X formatı tespit edilemedi');
    reportAnonymousError('MEDIA_PATTERN_NOT_FOUND', `Bulunan kaynak: ${activeSrc || 'BOŞ'}`);
    return false;
  }

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
        r.name.includes('media-') ||
        r.name.includes('kick') ||
        r.name.includes('puhutv')
      );
      if (mediaEntry) targetUrl = mediaEntry.name;
    }

    if (!targetUrl) {
      showToast('Ping için aktif CDN akışı bulunamadı');
      reportAnonymousError('PING_NO_STREAM_URL', 'Performans zaman çizelgesinde video CDN isteği yok.');
      return null;
    }

    try {
      const startTime = performance.now();
      await fetch(targetUrl, { method: 'HEAD', cache: 'no-store', mode: 'cors' });
      const durationMs = Math.round(performance.now() - startTime);
      showToast(`CDN Ping: ${durationMs} ms`);
      return durationMs;
    } catch (err) {
      try {
        const startTime = performance.now();
        await fetch(targetUrl, { method: 'GET', cache: 'no-store', mode: 'no-cors' });
        const durationMs = Math.round(performance.now() - startTime);
        showToast(`CDN Ping: ${durationMs} ms (No-CORS)`);
        return durationMs;
      } catch (innerErr) {
        showToast('CDN Ping ölçülemedi');
        reportAnonymousError('PING_FETCH_FAILED', innerErr.message);
        return null;
      }
    }
  }

  function reportAnonymousError(errorCode, message) {
    const { playerType } = findVideoAndPlayer();
    const cleanHostname = window.location.hostname || 'bilinmeyen-site';

    const anonymousPayload = {
      timestamp: new Date().toISOString(),
      errorCode,
      cleanMessage: message ? message.replace(/https?:\/\/[^\s]+/g, '[URL_REDACTED]') : 'Bilinmeyen hata',
      playerType,
      domain: cleanHostname,
      userAgentFamily: navigator.userAgent.includes('Firefox') ? 'Firefox (Gecko)' : 'Chromium',
      screenResolution: `${window.innerWidth}x${window.innerHeight}`
    };

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
          <span>⚠️ Anonim Hata & Teşhis Raporu (NOkrep)</span>
          <button id="pvc-close-modal-btn">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Eklenti bu sitede (<strong>${payload.domain}</strong>) oynatıcıya erişirken bir engelle karşılaştı. Sıfır kişisel veri içeren teşhis paketi:
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
      showToast('Anonim hata verisi kopyalandı!');
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
    }, 2400);
  }

  function resetIdleTimer(popup) {
    if (!popup) return;
    popup.classList.remove('pvc-idle-transparent');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      popup.classList.add('pvc-idle-transparent');
    }, IDLE_TIMEOUT_MS);
  }

  function makeDraggable(popup, header) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      
      isDragging = true;
      resetIdleTimer(popup);

      const rect = popup.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      popup.style.bottom = 'auto';
      popup.style.right = 'auto';
      popup.style.left = `${initialLeft}px`;
      popup.style.top = `${initialTop}px`;

      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        resetIdleTimer(popup);

        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        const maxLeft = window.innerWidth - popup.offsetWidth - 8;
        const maxTop = window.innerHeight - popup.offsetHeight - 8;

        newLeft = Math.max(8, Math.min(newLeft, maxLeft));
        newTop = Math.max(8, Math.min(newTop, maxTop));

        popup.style.left = `${newLeft}px`;
        popup.style.top = `${newTop}px`;
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
          <span class="pvc-menu-badge">NOkrep v2.0</span>
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
          <span class="pvc-subtext">Akamai / HLS</span>
        </div>
        <div class="pvc-btn-grid-4">
          <button class="pvc-quality-btn" data-lvl="1" title="360p Düşük">360p</button>
          <button class="pvc-quality-btn" data-lvl="2" title="540p Orta">540p</button>
          <button class="pvc-quality-btn" data-lvl="3" title="720p HD">720p</button>
          <button class="pvc-quality-btn" data-lvl="4" title="1080p FHD">1080p</button>
        </div>
      </div>

      <div class="pvc-menu-footer">
        <button id="pvc-ping-btn" class="pvc-footer-btn pvc-btn-emerald">📡 CDN Ping</button>
        <button id="pvc-report-err-btn" class="pvc-footer-btn pvc-btn-amber">⚠️ Hata Bildir</button>
      </div>
    `;

    const hostContainer = document.fullscreenElement || document.webkitFullscreenElement || document.body;
    hostContainer.appendChild(popup);

    const dragHeader = popup.querySelector('#pvc-drag-header');
    makeDraggable(popup, dragHeader);

    popup.addEventListener('mouseenter', () => resetIdleTimer(popup));
    popup.addEventListener('mousemove', () => resetIdleTimer(popup));
    popup.addEventListener('mousedown', () => resetIdleTimer(popup));

    const slider = popup.querySelector('#pvc-speed-slider');
    const speedVal = popup.querySelector('#pvc-speed-value');

    slider.addEventListener('input', (e) => {
      resetIdleTimer(popup);
      const val = parseFloat(e.target.value);
      speedVal.textContent = `${val}x`;
      setSpeed(val);
    });

    popup.querySelectorAll('.pvc-chip-btn').forEach(btn => {
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
      btn.onclick = () => {
        resetIdleTimer(popup);
        const lvl = btn.getAttribute('data-lvl');
        popup.querySelectorAll('.pvc-quality-btn').forEach(b => b.classList.remove('pvc-active'));
        btn.classList.add('pvc-active');
        changeQuality(lvl);
      };
    });

    popup.querySelector('#pvc-ping-btn').onclick = async function () {
      resetIdleTimer(popup);
      this.textContent = 'Ölçülüyor...';
      const ms = await testCdnPing();
      this.textContent = ms !== null ? `📡 ${ms} ms` : '📡 Ping';
    };

    popup.querySelector('#pvc-report-err-btn').onclick = () => {
      resetIdleTimer(popup);
      const { video } = findVideoAndPlayer();
      reportAnonymousError('USER_MANUAL_REPORT', video ? 'Kullanıcı manuel hata bildirimini tetikledi.' : 'Video bulunamadı.');
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
  showToast('NOk Video Controller Hazır (NOkrep)');
})();