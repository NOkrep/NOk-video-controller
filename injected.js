/**
 * injected.js - NOk Video Controller v0.3.2 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage KULLANILMAZ.
 * 
 * v0.3.2 Güncellemeleri & Mimari Yenilikler:
 * 1. PuhuTV Akış Doğrulama & Donmasız ABR Yönetimi:
 *    - Master.m3u8 içindeki gerçek mevcut paketler (örn: 576p PAL / 480p SD / 360p) taranır.
 *    - Eski dizilerde sunucuda bulunmayan 1080p seçilip Akamai 404 verdiğinde video dondurulmaz; otomatik olarak yayındaki en yüksek geçerli pakete (576p PAL / media-2) dönülür.
 *    - 640x480 ve 786x576 video frame boyutları PAL/SD olarak net ve doğru gösterilir.
 * 2. Kick.com Canlı & VOD Çok Aşamalı Kalite Kancası:
 *    - React Fiber `onQualitySelect`/`setQuality`, Amazon IVS Player API ve Kick 2-aşamalı DOM Ayarlar/Kalite menüsü eşzamanlı kancalanır.
 * 3. Ağ Telemetrisi & Gizlilik Odaklı Tanı Paketi:
 *    - PerformanceResourceTiming üzerinden son medya paketlerinin transfer süresi ve CDN durumları gizlilik ihlali olmadan raporlanır.
 * 4. İlk Tıklamada Kesintisiz Açılış Desteği.
 */

(() => {
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === 'PVC_TOGGLE_POPUP' || event.data.type === 'PVC_TOGGLE_UI' || event.data.type === 'NOK_CONTROLLER_TOGGLE') {
      togglePvcPopup();
    }
  });

  if (window.__NOK_VIDEO_CONTROLLER_INJECTED__) {
    togglePvcPopup();
    return;
  }
  window.__NOK_VIDEO_CONTROLLER_INJECTED__ = true;

  console.log('[NOkrep] NOk Video Controller v0.3.2 aktif.');

  const GITHUB_REPO_URL = 'https://github.com/NOkrep/NOk-video-controller';
  const DEVELOPER_EMAIL = 'ihsanartrk07@gmail.com';
  const HOSTNAME = window.location.hostname;

  // Bellek içi geçici durumlar (Stateless / In-Memory Only)
  let idleDelaySeconds = 3;
  let idleTimer = null;
  let activeForcedQualityId = '';
  let activeForcedQualityLabel = '';
  let pendingQualityLabel = '';
  let pendingTimeoutTimer = null;
  let lastObservedResolution = 'Ölçülüyor...';
  let cachedDiscoveredQualities = [];
  let currentActiveAdapterName = 'GenericAdapter';
  let targetPuhuMediaLevel = null; // 'media-4', 'media-3', 'media-2', 'media-1'
  let puhuFallbackAttempted = false;

  // =========================================================================
  // 🌐 PUHUTV AKAMAI XHR / FETCH İSTEK YÖNLENDİRİCİSİ (1080p - 360p MEDIA HOOK)
  // =========================================================================
  (function hookNetworkRequestsForPuhu() {
    // 1. XMLHttpRequest Hook
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      try {
        if (targetPuhuMediaLevel && typeof url === 'string' && url.includes('puhu.akamaized.net') && url.includes('media-')) {
          const redirectUrl = url.replace(/media-\d+/, targetPuhuMediaLevel);
          addDiagnosticLog('INFO', `[Network Hook] XHR Akamai Yönlendirildi: ${targetPuhuMediaLevel}`);
          return originalOpen.call(this, method, redirectUrl, ...rest);
        }
      } catch (e) {}
      return originalOpen.call(this, method, url, ...rest);
    };

    // 2. Fetch Hook
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        if (targetPuhuMediaLevel) {
          if (typeof input === 'string' && input.includes('puhu.akamaized.net') && input.includes('media-')) {
            const redirectUrl = input.replace(/media-\d+/, targetPuhuMediaLevel);
            addDiagnosticLog('INFO', `[Network Hook] Fetch Akamai Yönlendirildi: ${targetPuhuMediaLevel}`);
            return originalFetch.call(this, redirectUrl, init);
          } else if (input instanceof Request && input.url && input.url.includes('puhu.akamaized.net') && input.url.includes('media-')) {
            const redirectUrl = input.url.replace(/media-\d+/, targetPuhuMediaLevel);
            const newRequest = new Request(redirectUrl, input);
            return originalFetch.call(this, newRequest, init);
          }
        }
      } catch (e) {}
      return originalFetch.apply(this, arguments);
    };
  })();

  // =========================================================================
  // 📝 SIFIR KİŞİSEL VERİ (ZERO-PII) BELLEK İÇİ TEŞHİS GÜNLÜĞÜ
  // =========================================================================
  const DIAGNOSTIC_LOG_BUFFER = [];
  const MAX_LOG_BUFFER_SIZE = 40;

  function addDiagnosticLog(level, message, details = null) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const sanitizedMsg = sanitizeStreamUrl(typeof message === 'string' ? message : JSON.stringify(message));
    
    let sanitizedDetails = null;
    if (details) {
      try {
        if (typeof details === 'string') {
          sanitizedDetails = sanitizeStreamUrl(details);
        } else {
          sanitizedDetails = JSON.parse(JSON.stringify(details, getCircularReplacer()));
          if (Array.isArray(sanitizedDetails)) {
            sanitizedDetails = sanitizedDetails.map(item => typeof item === 'string' ? sanitizeStreamUrl(item) : item);
          }
        }
      } catch (e) {
        sanitizedDetails = '[Detay Ayrıştırılamadı]';
      }
    }

    DIAGNOSTIC_LOG_BUFFER.push({
      time: timestamp,
      level,
      message: sanitizedMsg,
      details: sanitizedDetails
    });

    if (DIAGNOSTIC_LOG_BUFFER.length > MAX_LOG_BUFFER_SIZE) {
      DIAGNOSTIC_LOG_BUFFER.shift();
    }
  }

  function getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Dairesel Referans]';
        seen.add(value);
      }
      return value;
    };
  }

  (function hookConsoleForDiagnostics() {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = function (...args) {
      try {
        const msg = args.map(a => (typeof a === 'string' ? a : (a && a.message ? a.message : ''))).join(' ');
        if (msg.includes('video') || msg.includes('hls') || msg.includes('ivs') || msg.includes('puhu') || msg.includes('kick')) {
          addDiagnosticLog('WARN', msg);
        }

        // PuhuTV 1080p (media-4) 404 aldığında otomatik 576p/480p (media-2) fallback
        if (msg.includes('puhu.akamaized.net') && (msg.includes('media-4') || targetPuhuMediaLevel === 'media-4') && (msg.includes('errored') || msg.includes('Problem encountered'))) {
          if (!puhuFallbackAttempted) {
            puhuFallbackAttempted = true;
            targetPuhuMediaLevel = 'media-2';
            addDiagnosticLog('WARN', '[PuhuTvAdapter] Bu içerikte 1080p master bulunamadı; en yüksek mevcut kaliteye (576p/media-2) uyarlandı.');
            showToast('PuhuTV: Bu içerik maks 576p destekliyor (576p PAL kilitlendi)');
            const badge = document.getElementById('pvc-realtime-res-badge');
            if (badge) {
              badge.textContent = '🎬 PuhuTV: Maks 576p PAL Yayını';
              badge.style.color = '#38bdf8';
            }
          }
        }
      } catch (e) {}
      originalWarn.apply(console, args);
    };

    console.error = function (...args) {
      try {
        const msg = args.map(a => (typeof a === 'string' ? a : (a && a.message ? a.message : ''))).join(' ');
        if (msg.includes('video') || msg.includes('hls') || msg.includes('ivs') || msg.includes('puhu') || msg.includes('kick') || msg.includes('VIDEOJS') || msg.includes('bandwidth')) {
          addDiagnosticLog('ERROR', msg);
        }
      } catch (e) {}
      originalError.apply(console, args);
    };
  })();

  function sanitizeStreamUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    return rawUrl
      .replace(/([?&]st=)[^&]+/gi, '$1[REDACTED]')
      .replace(/([?&]token=)[^&]+/gi, '$1[REDACTED]')
      .replace(/([?&]auth=)[^&]+/gi, '$1[REDACTED]')
      .replace(/([?&]hdnts=)[^&]+/gi, '$1[REDACTED]')
      .replace(/([?&]hdntl=)[^&]+/gi, '$1[REDACTED]')
      .replace(/([?&]sig=)[^&]+/gi, '$1[REDACTED]')
      .replace(/([?&]expires=)[^&]+/gi, '$1[REDACTED]')
      .replace(/([?&]e=)[^&]+/gi, '$1[REDACTED]')
      .replace(/\/ivs\/v1\/[^\/]+\//gi, '/ivs/v1/[REDACTED]/');
  }

  function getActiveContainer() {
    return document.fullscreenElement ||
           document.webkitFullscreenElement ||
           document.mozFullScreenElement ||
           document.msFullscreenElement ||
           document.body ||
           document.documentElement;
  }

  // =========================================================================
  // 🖥️ TAM EKRAN DİNAMİK YENİDEN YERLEŞİM (FULLSCREEN STACKING MANAGER)
  // =========================================================================
  function syncFullscreenElements() {
    const activeTarget = getActiveContainer();
    const popup = document.getElementById('pvc-controller-popup');
    const toast = document.getElementById('pvc-quick-toast');

    if (popup && popup.parentElement !== activeTarget) {
      activeTarget.appendChild(popup);
      if (document.fullscreenElement) {
        popup.classList.add('pvc-in-fullscreen');
        addDiagnosticLog('INFO', '[Fullscreen] HUD tam ekran kapsayıcısına taşındı.');
      } else {
        popup.classList.remove('pvc-in-fullscreen');
        addDiagnosticLog('INFO', '[Fullscreen] HUD standart body kapsayıcısına döndü.');
      }
    }

    if (toast && toast.parentElement !== activeTarget) {
      activeTarget.appendChild(toast);
    }
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, syncFullscreenElements);
  });

  /**
   * Garantili & Tam Ekran Uyumlu Bildirim (Toast) Gösterici
   */
  function showToast(msg) {
    try {
      const existing = document.getElementById('pvc-quick-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'pvc-quick-toast';
      toast.className = 'pvc-toast pvc-toast-visible';
      toast.textContent = msg;
      
      toast.style.cssText = `
        position: fixed !important;
        top: 24px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: rgba(15, 23, 42, 0.96) !important;
        color: #38bdf8 !important;
        border: 1px solid rgba(56, 189, 248, 0.45) !important;
        padding: 8px 22px !important;
        border-radius: 24px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.85), 0 0 16px rgba(56, 189, 248, 0.25) !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        display: block !important;
        opacity: 1 !important;
        letter-spacing: 0.3px !important;
        transition: opacity 0.2s ease, transform 0.2s ease !important;
      `;

      const container = getActiveContainer();
      container.appendChild(toast);

      addDiagnosticLog('INFO', `[Toast] ${msg}`);

      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(-50%) translateY(-10px)';
          setTimeout(() => {
            if (toast.parentElement) toast.remove();
          }, 250);
        }
      }, 2400);
    } catch (e) {
      console.log('[NOk Toast]', msg);
    }
  }

  // =========================================================================
  // 🎯 AKTİF OYNATILAN VİDEOYU VE OYNATICIYI BULMA (MULTI-VIDEO ISOLATION)
  // =========================================================================
  function findVideoAndPlayer() {
    const videoElements = Array.from(document.querySelectorAll('video'));
    if (videoElements.length === 0) {
      return { video: null, player: null, playerType: 'none', platform: HOSTNAME };
    }

    // 1. Öncelik: O an gerçekten çalan/oynatılan video
    let selectedVideo = videoElements.find(v => !v.paused && v.currentTime > 0 && !v.ended);

    // 2. Öncelik: En son etkileşime girilen veya sesi açık olan
    if (!selectedVideo) {
      selectedVideo = videoElements.find(v => !v.muted && v.currentTime > 0);
    }

    // 3. Öncelik: Ekranda en büyük alana sahip video (Ana oynatıcı)
    if (!selectedVideo) {
      let maxArea = -1;
      videoElements.forEach(v => {
        const area = (v.clientWidth || v.videoWidth || 0) * (v.clientHeight || v.videoHeight || 0);
        if (area > maxArea) {
          maxArea = area;
          selectedVideo = v;
        }
      });
    }

    if (!selectedVideo) selectedVideo = videoElements[0];

    let player = null;
    let playerType = 'native-html5';

    if (HOSTNAME.includes('youtube.com')) {
      playerType = 'youtube-player';
      player = document.getElementById('movie_player') || null;
    } else if (selectedVideo.player) {
      player = selectedVideo.player;
      playerType = 'videojs-attached';
    } else if (selectedVideo.vjsPlayer) {
      player = selectedVideo.vjsPlayer;
      playerType = 'vjsPlayer';
    } else if (selectedVideo.parentElement && selectedVideo.parentElement.player) {
      player = selectedVideo.parentElement.player;
      playerType = 'videojs-parent';
    } else if (window.videojs && typeof window.videojs.getAllPlayers === 'function') {
      const players = window.videojs.getAllPlayers();
      if (players && players.length > 0) {
        player = players[0];
        playerType = 'videojs-global';
      }
    } else if (selectedVideo.hls || (selectedVideo.parentElement && selectedVideo.parentElement.hls) || window.Hls) {
      playerType = 'hlsjs';
      player = selectedVideo.hls || (selectedVideo.parentElement && selectedVideo.parentElement.hls) || null;
    }

    return { video: selectedVideo, player, playerType, platform: HOSTNAME };
  }

  // =========================================================================
  // 🧩 MODÜLER ADAPTÖR MİMARİSİ
  // =========================================================================

  /**
   * 1. PuhuTV Adaptörü (Video.js VHS Master + Akamai Media Level Interceptor)
   */
  const PuhuTvAdapter = {
    name: 'PuhuTvAdapter',
    matches() {
      return HOSTNAME.includes('puhutv.com') || !!document.querySelector('.puhu-player, .vjs-puhu-skin, [class*="puhu"]');
    },

    lockAbrBandwidth(player) {
      try {
        if (!player) return;
        if (player.tech_ && player.tech_.vhs) {
          player.tech_.vhs.bandwidth = 99999999;
          if (player.tech_.vhs.masterPlaylistController_) {
            player.tech_.vhs.masterPlaylistController_.fastQualityChange_ = true;
          }
        }
        if (player.tech_ && player.tech_.hls) {
          player.tech_.hls.bandwidth = 99999999;
        }
      } catch (e) {}
    },

    getQualities(video, player) {
      const results = [];
      const seenHeights = new Set();

      // 1. VHS Master Playlists doğrudan kontrolü
      if (player && player.tech_ && player.tech_.vhs && player.tech_.vhs.playlists && player.tech_.vhs.playlists.master) {
        try {
          const masterPlaylists = player.tech_.vhs.playlists.master.playlists;
          if (Array.isArray(masterPlaylists) && masterPlaylists.length > 0) {
            masterPlaylists.forEach((pl, idx) => {
              const res = pl.attributes && pl.attributes.RESOLUTION ? pl.attributes.RESOLUTION : null;
              const h = res ? res.height : 0;
              const w = res ? res.width : 0;
              const bw = (pl.attributes && pl.attributes.BANDWIDTH) || 0;

              let label = `${h}p`;
              let mediaTag = 'media-2';
              if (h >= 1080) { label = '1080p (FHD)'; mediaTag = 'media-4'; }
              else if (h >= 720) { label = '720p (HD)'; mediaTag = 'media-3'; }
              else if (h === 576 || (w === 786 && h === 576) || (h >= 540 && h <= 576)) { label = '576p (PAL)'; mediaTag = 'media-2'; }
              else if (h >= 480 || w === 654 || (w === 640 && h === 480)) { label = '480p (SD)'; mediaTag = 'media-2'; }
              else if (h >= 360 || w === 640) { label = '360p (Düşük)'; mediaTag = 'media-1'; }
              else if (h > 0) { label = `${h}p`; }

              if (h > 0 && !seenHeights.has(h)) {
                seenHeights.add(h);
                results.push({
                  id: `puhu_vhs_${idx}`,
                  index: idx,
                  label: label,
                  height: h,
                  width: w,
                  bitrate: bw,
                  mediaTag: mediaTag,
                  vhsPlaylist: pl,
                  verifiedInManifest: true
                });
              }
            });
          }
        } catch (e) {
          addDiagnosticLog('WARN', '[PuhuTvAdapter] vhs.playlists okuma hatası', e.message);
        }
      }

      // 2. Video.js qualityLevels()
      if (results.length === 0 && player && typeof player.qualityLevels === 'function') {
        try {
          const qLevels = player.qualityLevels();
          if (qLevels && qLevels.length > 0) {
            for (let i = 0; i < qLevels.length; i++) {
              const q = qLevels[i];
              const h = q.height || 0;
              const w = q.width || 0;
              let label = q.label || `${h}p`;
              let mediaTag = 'media-2';
              if (h >= 1080) { label = '1080p (FHD)'; mediaTag = 'media-4'; }
              else if (h >= 720) { label = '720p (HD)'; mediaTag = 'media-3'; }
              else if (h === 576 || (w === 786 && h === 576) || (h >= 540 && h <= 576)) { label = '576p (PAL)'; mediaTag = 'media-2'; }
              else if (h >= 480 || w === 654 || (w === 640 && h === 480)) { label = '480p (SD)'; mediaTag = 'media-2'; }
              else if (h >= 360 || w === 640) { label = '360p (Düşük)'; mediaTag = 'media-1'; }

              if (h > 0 && !seenHeights.has(h)) {
                seenHeights.add(h);
                results.push({
                  id: `vjs_ql_${i}`,
                  index: i,
                  label: label,
                  height: h,
                  width: w,
                  bitrate: q.bitrate || 0,
                  mediaTag: mediaTag,
                  raw: q,
                  verifiedInManifest: true
                });
              }
            }
          }
        } catch (e) {}
      }

      // 3. Fallback: Standart PuhuTV paketleri
      if (results.length === 0) {
        return [
          { id: 'puhu_1080', label: '1080p (FHD)', height: 1080, mediaTag: 'media-4' },
          { id: 'puhu_720', label: '720p (HD)', height: 720, mediaTag: 'media-3' },
          { id: 'puhu_576', label: '576p (PAL)', height: 576, mediaTag: 'media-2' },
          { id: 'puhu_480', label: '480p (SD)', height: 480, mediaTag: 'media-2' },
          { id: 'puhu_360', label: '360p (Düşük)', height: 360, mediaTag: 'media-1' }
        ];
      }

      // En yüksek kaliteyi etiketle (örn: Eğer maks 576p ise kullanıcıya belirt)
      results.sort((a, b) => (b.height || 0) - (a.height || 0));
      if (results[0] && results[0].height < 1080) {
        results[0].label = `${results[0].label} (Maks)`;
      }

      return results;
    },

    applyQuality(targetItem, video, player) {
      puhuFallbackAttempted = false;

      // 1. Akamai Network Hook seviyesini ata
      if (targetItem.mediaTag) {
        targetPuhuMediaLevel = targetItem.mediaTag;
        addDiagnosticLog('INFO', `[PuhuTvAdapter] Ağ kancası hedefi ayarlandı: ${targetItem.mediaTag} (${targetItem.label})`);
      } else if (targetItem.height >= 1080) {
        targetPuhuMediaLevel = 'media-4';
      } else if (targetItem.height >= 720) {
        targetPuhuMediaLevel = 'media-3';
      } else if (targetItem.height >= 480) {
        targetPuhuMediaLevel = 'media-2';
      } else {
        targetPuhuMediaLevel = 'media-1';
      }

      this.lockAbrBandwidth(player);

      // 2. VHS Playlist Doğrudan Kilit
      if (targetItem.vhsPlaylist && player && player.tech_ && player.tech_.vhs) {
        try {
          const targetPl = targetItem.vhsPlaylist;
          if (typeof player.tech_.vhs.selectPlaylist === 'function') {
            player.tech_.vhs.selectPlaylist = () => targetPl;
          }
          if (player.tech_.vhs.playlists && typeof player.tech_.vhs.playlists.media === 'function') {
            player.tech_.vhs.playlists.media(targetPl);
          }
          addDiagnosticLog('INFO', `[PuhuTvAdapter] VHS Playlist kilitlendi: ${targetItem.label}`);
        } catch (e) {}
      }

      // 3. Video.js qualityLevels kilit
      if (player && typeof player.qualityLevels === 'function') {
        try {
          const qLevels = player.qualityLevels();
          if (qLevels && qLevels.length > 0) {
            const targetIdx = targetItem.index !== undefined ? targetItem.index : -1;
            for (let i = 0; i < qLevels.length; i++) {
              if (targetIdx !== -1) {
                qLevels[i].enabled = (i === targetIdx);
              } else if (targetItem.height) {
                const match = qLevels[i].height === targetItem.height || Math.abs((qLevels[i].height || 0) - targetItem.height) < 40;
                qLevels[i].enabled = match;
              }
            }

            if (targetIdx !== -1) {
              qLevels.selectedIndex_ = targetIdx;
              if (typeof qLevels.trigger === 'function') {
                qLevels.trigger({ type: 'change', selectedIndex: targetIdx });
              }
            }
          }
        } catch (e) {}
      }

      this.lockAbrBandwidth(player);
      showToast(`PuhuTV: ${targetItem.label} (Kilitlendi)`);
      addDiagnosticLog('INFO', `[PuhuTvAdapter] Kalite uygulandı: ${targetItem.label}`);
      return true;
    }
  };

  /**
   * 2. Kick.com Canlı Yayın & VOD Adaptörü (Amazon IVS + React Fiber + Çok Aşamalı DOM UI)
   */
  const KickAdapter = {
    name: 'KickAdapter',
    matches() {
      return HOSTNAME.includes('kick.com') || !!document.querySelector('#channel-player, [data-testid="player-settings-button"], [class*="kick-player"]');
    },

    isVodPage() {
      return window.location.pathname.includes('/video/') || window.location.pathname.includes('/videos/');
    },

    findIvsPlayer(video) {
      if (window.ivsPlayer && typeof window.ivsPlayer.getQualities === 'function') return window.ivsPlayer;
      if (window.__ivsPlayer && typeof window.__ivsPlayer.getQualities === 'function') return window.__ivsPlayer;
      if (window.player && typeof window.player.getQualities === 'function') return window.player;
      if (window.kickPlayer && typeof window.kickPlayer.getQualities === 'function') return window.kickPlayer;
      if (window.__kick_player && typeof window.__kick_player.getQualities === 'function') return window.__kick_player;

      const candidates = [
        video,
        document.querySelector('#channel-player'),
        document.querySelector('.relative.flex-1'),
        document.querySelector('.player-container'),
        document.querySelector('.vjs-control-bar'),
        document.querySelector('[data-testid="player-settings-button"]'),
        document.querySelector('div[class*="player"]'),
        document.querySelector('main')
      ].filter(Boolean);

      for (const el of candidates) {
        if (el.__ivsPlayer && typeof el.__ivsPlayer.getQualities === 'function') return el.__ivsPlayer;
        if (el._ivsPlayer && typeof el._ivsPlayer.getQualities === 'function') return el._ivsPlayer;
        if (el._ivs && typeof el._ivs.getQualities === 'function') return el._ivs;
        if (el.player && typeof el.player.getQualities === 'function') return el.player;

        try {
          const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
          if (fiberKey && el[fiberKey]) {
            let node = el[fiberKey];
            let depth = 0;
            while (node && depth < 80) {
              const props = node.memoizedProps;
              const state = node.memoizedState;
              
              if (props) {
                if (props.player && typeof props.player.getQualities === 'function') return props.player;
                if (props.ivsPlayer && typeof props.ivsPlayer.getQualities === 'function') return props.ivsPlayer;
                if (props.mediaPlayer && typeof props.mediaPlayer.getQualities === 'function') return props.mediaPlayer;
                if (props.stream && props.stream.player && typeof props.stream.player.getQualities === 'function') return props.stream.player;
              }
              if (state && state.player && typeof state.player.getQualities === 'function') return state.player;
              
              node = node.return || node.child || node.sibling;
              depth++;
            }
          }
        } catch (e) {}
      }

      return null;
    },

    findReactQualityDispatcher(video) {
      const candidates = [
        video,
        document.querySelector('#channel-player'),
        document.querySelector('[data-testid="player-settings-button"]'),
        document.querySelector('.player-container')
      ].filter(Boolean);

      for (const el of candidates) {
        try {
          const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
          if (fiberKey && el[fiberKey]) {
            let node = el[fiberKey];
            let depth = 0;
            while (node && depth < 80) {
              const props = node.memoizedProps;
              if (props) {
                if (typeof props.onQualitySelect === 'function') return props.onQualitySelect;
                if (typeof props.onSelectQuality === 'function') return props.onSelectQuality;
                if (typeof props.setQuality === 'function') return props.setQuality;
                if (typeof props.handleQualityChange === 'function') return props.handleQualityChange;
              }
              node = node.return || node.child || node.sibling;
              depth++;
            }
          }
        } catch (e) {}
      }
      return null;
    },

    /**
     * Kick DOM Çok Aşamalı Kalite Menüsü Seçici (Settings Gear -> Quality Submenu -> Resolution)
     */
    triggerKickUiQuality(targetLabel) {
      try {
        const cleanTarget = targetLabel.replace(/p\d+/, '').replace(/\s+/g, '').replace('Source', '').replace('Kaynak', '');
        const settingsBtn = document.querySelector('[data-testid="player-settings-button"], button[aria-label*="ayar"], button[aria-label*="Setting"], button[aria-label*="Ayarlar"], button[aria-label*="quality"]');
        
        if (settingsBtn) {
          settingsBtn.click();
          
          setTimeout(() => {
            // 1. Adım: Menü içindeki "Quality" / "Kalite" alt menü butonunu ara ve tıkla
            const menuButtons = Array.from(document.querySelectorAll('button, div[role="menuitem"], [class*="menu-item"], div[tabindex="0"]'));
            const qualitySubmenuBtn = menuButtons.find(el => {
              const txt = el.textContent || '';
              return (txt.includes('Quality') || txt.includes('Kalite') || txt.includes('Otomatik') || txt.includes('Auto') || /\d{3,4}p/.test(txt)) && !el.closest('#pvc-controller-popup');
            });

            if (qualitySubmenuBtn && !qualitySubmenuBtn.textContent.includes(cleanTarget)) {
              qualitySubmenuBtn.click();
            }

            // 2. Adım: Kalite seçenekleri listesinden hedef çözünürlüğü seç
            setTimeout(() => {
              const allOptionButtons = Array.from(document.querySelectorAll('button, div[role="menuitem"], [class*="menu-item"], div[tabindex="0"]'));
              const targetBtn = allOptionButtons.find(el => {
                const txt = el.textContent || '';
                return txt.includes(cleanTarget) && !el.closest('#pvc-controller-popup');
              });

              if (targetBtn) {
                targetBtn.click();
                addDiagnosticLog('INFO', `[KickAdapter] 2-Aşamalı UI Menü seçimi uygulandı: ${targetLabel}`);
              }

              // Menüyü kapat
              setTimeout(() => {
                const closeTarget = document.querySelector('.player-container') || document.body;
                if (closeTarget && closeTarget.click) closeTarget.click();
              }, 120);
            }, 120);
          }, 100);
        }
      } catch (e) {
        addDiagnosticLog('WARN', '[KickAdapter] UI Menü tetikleme hatası', e.message);
      }
    },

    getQualities(video) {
      const results = [];
      const ivs = this.findIvsPlayer(video);
      if (ivs && typeof ivs.getQualities === 'function') {
        try {
          const qList = ivs.getQualities();
          if (Array.isArray(qList) && qList.length > 0) {
            qList.forEach((q, idx) => {
              const h = q.height || 0;
              const label = q.name || (h ? `${h}p` : `Paket ${idx + 1}`);
              results.push({
                id: `ivs_${idx}`,
                index: idx,
                label: label,
                height: h,
                bitrate: q.bitrate || 0,
                raw: q
              });
            });
            addDiagnosticLog('INFO', `[KickAdapter] IVS Paketleri tespit edildi: ${results.map(r => r.label).join(', ')}`);
            return results.sort((a, b) => (b.height || 0) - (a.height || 0));
          }
        } catch (e) {
          addDiagnosticLog('WARN', '[KickAdapter] IVS getQualities hatası', e.message);
        }
      }

      return [
        { id: 'kick_1080p60', label: '1080p60 (Kaynak)', height: 1080 },
        { id: 'kick_720p60', label: '720p60', height: 720 },
        { id: 'kick_480p30', label: '480p30', height: 480 },
        { id: 'kick_360p30', label: '360p30', height: 360 },
        { id: 'kick_160p30', label: '160p30', height: 160 }
      ];
    },

    applyQuality(targetItem, video) {
      const ivs = this.findIvsPlayer(video);
      const reactDispatcher = this.findReactQualityDispatcher(video);
      const isVod = this.isVodPage();

      let applied = false;

      // 1. React Fiber State Dispatcher
      if (typeof reactDispatcher === 'function') {
        try {
          reactDispatcher(targetItem.raw || targetItem.label || targetItem.height);
          applied = true;
          addDiagnosticLog('INFO', `[KickAdapter] React Fiber Dispatcher uygulandı: ${targetItem.label}`);
        } catch (e) {}
      }

      // 2. Amazon IVS Player SDK
      if (ivs && typeof ivs.getQualities === 'function') {
        try {
          if (typeof ivs.setAutoQualityMode === 'function') {
            ivs.setAutoQualityMode(false);
          }

          const qList = ivs.getQualities();
          let targetQuality = null;

          if (Array.isArray(qList)) {
            targetQuality = qList.find(q => 
              (targetItem.raw && q === targetItem.raw) ||
              (q.name && targetItem.label && q.name.toLowerCase().includes(targetItem.label.toLowerCase().slice(0, 4))) ||
              (q.height && q.height === targetItem.height)
            );
          }

          if (targetQuality && typeof ivs.setQuality === 'function') {
            ivs.setQuality(targetQuality);
            applied = true;
            addDiagnosticLog('INFO', `[KickAdapter] IVS Kalitesi Kilitlendi: ${targetQuality.name}`);
          }
        } catch (e) {
          addDiagnosticLog('WARN', '[KickAdapter] IVS setQuality hatası', e.message);
        }
      }

      // 3. Çok aşamalı UI Menü Tetiklemesi
      this.triggerKickUiQuality(targetItem.label);

      showToast(`Kick ${isVod ? 'Kayıt' : 'Canlı'}: ${targetItem.label} (Kilitlendi)`);
      return true;
    }
  };

  /**
   * 3. HLS.js Adaptörü
   */
  const HlsJsAdapter = {
    name: 'HlsJsAdapter',
    matches(video, player) {
      return !!(video && video.hls) || !!(player && player.hls) || !!(window.Hls && window.Hls.instances && window.Hls.instances.length > 0);
    },
    getQualities(video, player) {
      const hls = (video && video.hls) || (player && player.hls) || (window.Hls && window.Hls.instances && window.Hls.instances[0]);
      const results = [];
      if (hls && hls.levels && hls.levels.length > 0) {
        hls.levels.forEach((lvl, idx) => {
          results.push({
            id: `hls_${idx}`,
            index: idx,
            label: `${lvl.height || lvl.name}p`,
            height: lvl.height,
            bitrate: lvl.bitrate,
            raw: lvl
          });
        });
      }
      return results.sort((a, b) => (b.height || 0) - (a.height || 0));
    },
    applyQuality(targetItem, video, player) {
      const hls = (video && video.hls) || (player && player.hls) || (window.Hls && window.Hls.instances && window.Hls.instances[0]);
      if (hls && hls.levels) {
        if (targetItem.index !== undefined) {
          hls.currentLevel = targetItem.index;
          showToast(`HLS.js: ${targetItem.label}`);
          return true;
        }
      }
      return false;
    }
  };

  /**
   * 4. Genel Standart VideoJS / HTML5 Adaptörü
   */
  const GenericAdapter = {
    name: 'GenericAdapter',
    matches() { return true; },
    getQualities() {
      return [
        { id: '1080', label: '1080p (FHD)', height: 1080 },
        { id: '720', label: '720p (HD)', height: 720 },
        { id: '576', label: '576p (PAL)', height: 576 },
        { id: '480', label: '480p (SD)', height: 480 },
        { id: '360', label: '360p (Düşük)', height: 360 }
      ];
    },
    applyQuality(targetItem) {
      showToast(`Kalite Seçildi: ${targetItem.label}`);
      return true;
    }
  };

  const ADAPTER_PIPELINE = [
    PuhuTvAdapter,
    KickAdapter,
    HlsJsAdapter,
    GenericAdapter
  ];

  function getActiveAdapter(video, player) {
    for (const adapter of ADAPTER_PIPELINE) {
      if (adapter.matches(video, player)) {
        currentActiveAdapterName = adapter.name;
        return adapter;
      }
    }
    return GenericAdapter;
  }

  function discoverStreamQualities() {
    const { video, player } = findVideoAndPlayer();
    const adapter = getActiveAdapter(video, player);

    if (typeof adapter.getQualities === 'function') {
      const found = adapter.getQualities(video, player);
      if (found && found.length > 0) {
        cachedDiscoveredQualities = found;
        return found;
      }
    }

    if (adapter.name !== 'GenericAdapter' && cachedDiscoveredQualities.length > 0) {
      return cachedDiscoveredQualities;
    }

    return GenericAdapter.getQualities();
  }

  /**
   * Canlı Video Çözünürlük Takipçisi & Durum Rozeti (PAL 576p / SD 480p ve En-Boy Doğrulamalı)
   */
  function updateRealtimeResolutionBadge() {
    const { video } = findVideoAndPlayer();
    const badge = document.getElementById('pvc-realtime-res-badge');
    if (!badge) return;

    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      const w = video.videoWidth;
      const h = video.videoHeight;
      let label = `${h}p`;

      if (h >= 1080) label = '1080p FHD';
      else if (h >= 720) label = '720p HD';
      else if (h === 576 || (w === 786 && h === 576) || (h >= 540 && h <= 576)) label = '576p PAL';
      else if (h === 480 || w === 640 || w === 654 || (w === 852 && h === 480)) label = '480p SD';
      else if (h >= 360 || w === 640) label = '360p SD';
      else if (h >= 160) label = `${h}p`;

      lastObservedResolution = `${w}x${h} (${label})`;

      if (pendingQualityLabel) {
        const cleanPending = pendingQualityLabel.replace(/p\d+/, '').replace(/\s+/g, '');
        if (lastObservedResolution.includes(cleanPending)) {
          pendingQualityLabel = '';
          clearTimeout(pendingTimeoutTimer);
          badge.textContent = `🎬 Gerçek: ${lastObservedResolution}`;
          badge.style.color = '#38bdf8';
        } else {
          badge.textContent = `⏳ ${pendingQualityLabel} Uygulanıyor (${label})`;
          badge.style.color = '#f59e0b';
        }
      } else {
        badge.textContent = `🎬 Gerçek: ${lastObservedResolution}`;
        badge.style.color = '#38bdf8';
      }
    } else {
      badge.textContent = '🎬 Çözünürlük: Bekleniyor...';
      badge.style.color = '#94a3b8';
    }
  }

  function monitorVideoResolution(video) {
    if (!video || video.__nokMonitored) return;
    video.__nokMonitored = true;

    const handleResize = () => {
      updateRealtimeResolutionBadge();
      renderDynamicQualityButtons();
    };

    video.addEventListener('resize', handleResize);
    video.addEventListener('loadedmetadata', handleResize);
    video.addEventListener('playing', handleResize);
    video.addEventListener('timeupdate', () => {
      if (pendingQualityLabel || lastObservedResolution.includes('Bekleniyor')) {
        updateRealtimeResolutionBadge();
      }
    });
    handleResize();
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
      addDiagnosticLog('INFO', `[Speed] Oynatma hızı ayarlandı: ${validRate}x`);
      return true;
    } catch (err) {
      addDiagnosticLog('ERROR', '[Speed] Hız ayarlanamadı', err.message);
      return false;
    }
  }

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
      addDiagnosticLog('INFO', `[Seek] Sarma yapıldı: ${seconds}s (Hedef: ${Math.round(target)}s)`);
      return true;
    } catch (err) {
      addDiagnosticLog('ERROR', '[Seek] Sarma hatası', err.message);
      return false;
    }
  }

  function renderDynamicQualityButtons() {
    const container = document.getElementById('pvc-dynamic-quality-container');
    if (!container) return;

    const qualities = discoverStreamQualities();
    const countBadge = document.getElementById('pvc-quality-count-badge');
    if (countBadge) {
      countBadge.textContent = `${qualities.length} Paket Hazır`;
    }

    container.innerHTML = '';

    qualities.forEach(q => {
      const btn = document.createElement('button');
      const isCurrentActive = activeForcedQualityId === q.id || activeForcedQualityLabel === q.label;
      btn.className = `pvc-quality-chip-btn ${isCurrentActive ? 'pvc-active' : ''}`;
      btn.textContent = q.label;
      btn.title = `${q.label} • ${q.height ? q.height + 'p' : ''}`;

      btn.onclick = () => {
        activeForcedQualityId = q.id;
        activeForcedQualityLabel = q.label;
        pendingQualityLabel = q.label;
        
        clearTimeout(pendingTimeoutTimer);
        pendingTimeoutTimer = setTimeout(() => {
          pendingQualityLabel = '';
          updateRealtimeResolutionBadge();
        }, 3500);

        const { video, player } = findVideoAndPlayer();
        const adapter = getActiveAdapter(video, player);
        adapter.applyQuality(q, video, player);
        renderDynamicQualityButtons();
        
        const badge = document.getElementById('pvc-realtime-res-badge');
        if (badge) {
          badge.textContent = `⏳ ${q.label} Uygulandı`;
          badge.style.color = '#f59e0b';
        }
      };

      container.appendChild(btn);
    });
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
      addDiagnosticLog('INFO', `[CDN Ping] ${ms} ms (${hostDisplay})`);
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

  /**
   * Zenginleştirilmiş Ağ ve Video Telemetrisi Toplayıcı
   */
  function collectNetworkTelemetry() {
    try {
      const resources = performance.getEntriesByType('resource');
      const mediaEntries = resources.filter(r => 
        r.name.includes('.m3u8') ||
        r.name.includes('.ts') ||
        r.name.includes('.m4s') ||
        r.name.includes('media-') ||
        r.name.includes('ivs') ||
        r.name.includes('akamaized') ||
        r.name.includes('kick.com')
      ).slice(-8);

      return mediaEntries.map(e => {
        let domain = 'Bilinmeyen';
        try { domain = new URL(e.name).hostname; } catch (_) {}
        return {
          host: domain,
          type: e.initiatorType || 'media',
          durationMs: Math.round(e.duration),
          transferSize: e.transferSize || 0,
          sampleUrl: sanitizeStreamUrl(e.name)
        };
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Zenginleştirilmiş Anonim Hata & Teşhis Paketi
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

    const videoStats = video ? {
      renderedResolution: `${video.videoWidth}x${video.videoHeight}`,
      displaySize: `${video.clientWidth}x${video.clientHeight}`,
      paused: video.paused,
      muted: video.muted,
      playbackRate: video.playbackRate,
      readyState: video.readyState,
      networkState: video.networkState,
      duration: Math.round(video.duration || 0),
      currentTime: Math.round(video.currentTime || 0),
      bufferedEnd: video.buffered.length > 0 ? Math.round(video.buffered.end(video.buffered.length - 1)) : 0
    } : null;

    const anonymousPayload = {
      timestamp: new Date().toISOString(),
      errorCode: errorCode || 'USER_MANUAL_DIAGNOSTIC',
      cleanMessage: message ? sanitizeStreamUrl(message) : 'Kullanıcı teşhis ve hata bildirimini tetikledi.',
      streamSampleUrl: sanitizeStreamUrl(capturedSampleUrl),
      playerType,
      activeAdapter: currentActiveAdapterName,
      domain: cleanHostname,
      activeForcedQuality: activeForcedQualityLabel || 'Otomatik',
      discoveredQualitiesCount: cachedDiscoveredQualities.length,
      idleDelaySetting: `${idleDelaySeconds}s`,
      userAgentFamily: navigator.userAgent.includes('Firefox') ? 'Firefox (Gecko)' : 'Chromium',
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      videoState: videoStats,
      userComments: '',
      networkTelemetry: collectNetworkTelemetry(),
      recentLogs: DIAGNOSTIC_LOG_BUFFER.slice(-20)
    };

    addDiagnosticLog('WARN', `[Teşhis Paketi Üretildi]: ${errorCode}`);
    showErrorModal(anonymousPayload);
  }

  function showErrorModal(payload) {
    const existing = document.getElementById('pvc-error-modal');
    if (existing) existing.remove();

    const updatePayloadJson = () => {
      const userText = document.getElementById('pvc-user-feedback-input')?.value || '';
      payload.userComments = userText;
      return JSON.stringify(payload, null, 2);
    };

    const modal = document.createElement('div');
    modal.id = 'pvc-error-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Zenginleştirilmiş Teşhis & Geri Bildirim (v0.3.2)</span>
          <button id="pvc-close-modal-btn">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Sitede (<strong>${payload.domain}</strong>) oynatıcı durumu, son medya telemetrisi ve hata günlüğü anonimleştirilerek toplandı (<strong>Sıfır Kişisel Veri</strong>):
          </p>

          <!-- Kullanıcı Görüşleri ve Notu Bölümü -->
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #38bdf8; margin-bottom: 4px;">
              💬 Görüşleriniz & Karşılaştığınız Durum (İsteğe Bağlı):
            </label>
            <textarea 
              id="pvc-user-feedback-input" 
              placeholder="Örn: 1080p seçeneği tıklandıktan sonra görüntüde takılma oldu mu? Karşılaştığınız durumu buraya yazabilirsiniz..."
              style="width: 100%; height: 60px; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; color: #f8fafc; font-size: 11px; padding: 8px; font-family: sans-serif; resize: none; box-sizing: border-box;"
            ></textarea>
          </div>

          <pre id="pvc-modal-code-block" class="pvc-modal-code">${JSON.stringify(payload, null, 2)}</pre>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-copy-payload-btn" class="pvc-modal-btn-secondary">📋 JSON Kopyala</button>
          <a id="pvc-send-mail-link" href="#" target="_blank" class="pvc-modal-btn-primary" style="background:#2563eb;">✉️ E-posta İle Gönder</a>
          <a id="pvc-open-github-link" href="#" target="_blank" class="pvc-modal-btn-primary" style="background:#4f46e5;">🐙 GitHub Issue Aç</a>
        </div>
      </div>
    `;

    const container = getActiveContainer();
    container.appendChild(modal);

    const feedbackInput = document.getElementById('pvc-user-feedback-input');
    const codeBlock = document.getElementById('pvc-modal-code-block');
    const mailLink = document.getElementById('pvc-send-mail-link');
    const ghLink = document.getElementById('pvc-open-github-link');

    const refreshLinks = () => {
      const updatedJson = updatePayloadJson();
      codeBlock.textContent = updatedJson;

      const issueTitle = encodeURIComponent(`[Teşhis/Hata]: ${payload.domain} - ${payload.errorCode}`);
      const compactSummary = encodeURIComponent(
        `### Anonim Teşhis Özeti\n` +
        `- **Domain:** ${payload.domain}\n` +
        `- **Adaptör:** ${payload.activeAdapter}\n` +
        `- **Oynatıcı:** ${payload.playerType}\n` +
        `- **Render Çözünürlüğü:** ${payload.videoState ? payload.videoState.renderedResolution : 'Bilinmiyor'}\n\n` +
        `*(Detaylı JSON panoya kopyalandı, lütfen aşağıya yapıştırın)*\n\n\`\`\`json\n\n\`\`\``
      );
      
      ghLink.href = `${GITHUB_REPO_URL}/issues/new?title=${issueTitle}&body=${compactSummary}`;
      mailLink.href = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}&body=${encodeURIComponent(updatedJson.slice(0, 1500))}`;
    };

    feedbackInput.addEventListener('input', refreshLinks);
    refreshLinks();

    document.getElementById('pvc-close-modal-btn').onclick = () => modal.remove();
    document.getElementById('pvc-copy-payload-btn').onclick = () => {
      const finalJson = updatePayloadJson();
      navigator.clipboard.writeText(finalJson);
      showToast('Zenginleştirilmiş teşhis JSON kopyalandı!');
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

  /**
   * Ergonomik Raylı Sürükleme Motoru (Normal Modda Sağ Kenara Kilitli Ray, Tam Ekranda 2D)
   */
  function makeDraggable(popup, header) {
    let isDragging = false;
    let startClientY = 0;
    let startTop = 0;
    let startClientX = 0;
    let startLeft = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;
      
      isDragging = true;
      resetIdleTimer(popup);

      const isFs = !!document.fullscreenElement;
      const rect = popup.getBoundingClientRect();

      startClientY = e.clientY;
      startTop = rect.top;
      startClientX = e.clientX;
      startLeft = rect.left;

      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEvt) => {
        if (!isDragging) return;
        const deltaY = moveEvt.clientY - startClientY;
        const newTop = Math.max(10, Math.min(window.innerHeight - 380, startTop + deltaY));
        popup.style.top = `${newTop}px`;
        popup.style.bottom = 'auto';

        if (isFs) {
          const deltaX = moveEvt.clientX - startClientX;
          const newLeft = Math.max(10, Math.min(window.innerWidth - 300, startLeft + deltaX));
          popup.style.left = `${newLeft}px`;
          popup.style.right = 'auto';
        } else {
          popup.style.right = '24px';
          popup.style.left = 'auto';
        }
      };

      const onMouseUp = () => {
        isDragging = false;
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        resetIdleTimer(popup);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // =========================================================================
  // 🎛️ HUD ARAYÜZÜ OLUŞTURMA VE BAĞLANTI (POPUP CREATION)
  // =========================================================================
  function createPvcPopup() {
    const existing = document.getElementById('pvc-controller-popup');
    if (existing) return existing;

    const popup = document.createElement('div');
    popup.id = 'pvc-controller-popup';
    popup.className = 'pvc-popup-card';
    popup.style.right = '24px';
    popup.style.top = '80px';

    popup.innerHTML = `
      <div id="pvc-drag-header" class="pvc-header">
        <div class="pvc-brand-wrapper">
          <span class="pvc-brand-title">NOk Video Controller</span>
          <span class="pvc-badge-v03">v0.3.2</span>
        </div>
        <div class="pvc-header-actions">
          <button id="pvc-min-btn" class="pvc-icon-btn" title="Simge Durumuna Küçült">−</button>
          <button id="pvc-close-btn" class="pvc-icon-btn" title="Kapat">✕</button>
        </div>
      </div>

      <div id="pvc-main-body" class="pvc-body">
        <!-- Canlı Çözünürlük ve Durum Rozeti -->
        <div id="pvc-realtime-res-badge" class="pvc-live-badge">
          🎬 Çözünürlük: Ölçülüyor...
        </div>

        <!-- 1. Hız Denetimi -->
        <div class="pvc-section">
          <div class="pvc-section-header">
            <span class="pvc-section-label">⚡ Oynatma Hızı</span>
            <span id="pvc-speed-value" class="pvc-section-val">1.0x</span>
          </div>
          <div class="pvc-chips-row">
            <button class="pvc-chip-btn" data-speed="0.5">0.5x</button>
            <button class="pvc-chip-btn" data-speed="1.0">1.0x</button>
            <button class="pvc-chip-btn" data-speed="1.5">1.5x</button>
            <button class="pvc-chip-btn" data-speed="2.0">2.0x</button>
            <button class="pvc-chip-btn" data-speed="2.5">2.5x</button>
            <button class="pvc-chip-btn" data-speed="3.0">3.0x</button>
          </div>
          <input id="pvc-speed-slider" class="pvc-slider" type="range" min="0.25" max="3.0" step="0.25" value="1.0" />
        </div>

        <!-- 2. Sarma Denetimi -->
        <div class="pvc-section">
          <div class="pvc-section-header">
            <span class="pvc-section-label">⏩ Hızlı Sarma (Atlama)</span>
          </div>
          <div class="pvc-chips-row">
            <button class="pvc-chip-btn" data-seek="-30">-30s</button>
            <button class="pvc-chip-btn" data-seek="-10">-10s</button>
            <button class="pvc-chip-btn" data-seek="-5">-5s</button>
            <button class="pvc-chip-btn" data-seek="5">+5s</button>
            <button class="pvc-chip-btn" data-seek="10">+10s</button>
            <button class="pvc-chip-btn" data-seek="30">+30s</button>
          </div>
        </div>

        <!-- 3. Dinamik Çözünürlük ve Akış Kancası -->
        <div class="pvc-section">
          <div class="pvc-section-header">
            <span class="pvc-section-label">🎯 Çözünürlük & ABR Kilit</span>
            <span id="pvc-quality-count-badge" class="pvc-counter-badge">Paketler Aranıyor...</span>
          </div>
          <div id="pvc-dynamic-quality-container" class="pvc-quality-grid">
            <!-- Dinamik çipler buraya yüklenecek -->
          </div>
        </div>

        <!-- 4. Yardımcı Araçlar (CDN Ping, Saydamlık, Teşhis) -->
        <div class="pvc-footer-tools">
          <button id="pvc-cdn-ping-btn" class="pvc-tool-btn" title="CDN Akış Gecikmesini Ölç">📡 CDN Ping</button>
          <button id="pvc-idle-cycle-btn" class="pvc-tool-btn" title="Saydamlaşma Süresini Değiştir">⏱️ Saydam: 3s</button>
          <button id="pvc-diag-btn" class="pvc-tool-btn pvc-tool-btn-accent" title="Anonim Hata ve Teşhis Bildir">⚠️ Teşhis</button>
        </div>
      </div>
    `;

    const container = getActiveContainer();
    container.appendChild(popup);

    const dragHeader = popup.querySelector('#pvc-drag-header');
    makeDraggable(popup, dragHeader);

    // Olay Dinleyicileri
    popup.querySelector('#pvc-close-btn').onclick = () => popup.remove();
    
    const minBtn = popup.querySelector('#pvc-min-btn');
    const mainBody = popup.querySelector('#pvc-main-body');
    minBtn.onclick = () => {
      if (mainBody.style.display === 'none') {
        mainBody.style.display = 'block';
        minBtn.textContent = '−';
      } else {
        mainBody.style.display = 'none';
        minBtn.textContent = '+';
      }
      resetIdleTimer(popup);
    };

    popup.addEventListener('mouseenter', () => popup.classList.remove('pvc-idle-transparent'));
    popup.addEventListener('mouseleave', () => resetIdleTimer(popup));
    popup.addEventListener('mousemove', () => resetIdleTimer(popup));

    // Hız Çipleri & Slider
    popup.querySelectorAll('[data-speed]').forEach(btn => {
      btn.onclick = () => {
        const val = parseFloat(btn.getAttribute('data-speed'));
        setSpeed(val);
        resetIdleTimer(popup);
      };
    });

    const speedSlider = popup.querySelector('#pvc-speed-slider');
    speedSlider.oninput = () => {
      const val = parseFloat(speedSlider.value);
      setSpeed(val);
      resetIdleTimer(popup);
    };

    // Sarma Çipleri
    popup.querySelectorAll('[data-seek]').forEach(btn => {
      btn.onclick = () => {
        const val = parseInt(btn.getAttribute('data-seek'), 10);
        seekBy(val);
        resetIdleTimer(popup);
      };
    });

    // CDN Ping Butonu
    popup.querySelector('#pvc-cdn-ping-btn').onclick = () => {
      testCdnPing();
      resetIdleTimer(popup);
    };

    // Saydamlık Süresi Döngüsü (1s -> 2s -> 3s -> 5s -> 10s)
    const idleCycleBtn = popup.querySelector('#pvc-idle-cycle-btn');
    const idleDelays = [1, 2, 3, 5, 10];
    idleCycleBtn.onclick = () => {
      const curIdx = idleDelays.indexOf(idleDelaySeconds);
      const nextIdx = (curIdx + 1) % idleDelays.length;
      idleDelaySeconds = idleDelays[nextIdx];
      idleCycleBtn.textContent = `⏱️ Saydam: ${idleDelaySeconds}s`;
      showToast(`Saydamlık Gecikmesi: ${idleDelaySeconds} saniye`);
      resetIdleTimer(popup);
    };

    // Teşhis ve Hata Raporlama Butonu
    popup.querySelector('#pvc-diag-btn').onclick = () => {
      reportAnonymousError('USER_MANUAL_DIAGNOSTIC', 'Kullanıcı teşhis ve hata bildirimini tetikledi.');
    };

    // İlk Video ve Çözünürlük Başlatması
    const { video } = findVideoAndPlayer();
    if (video) {
      monitorVideoResolution(video);
    }
    renderDynamicQualityButtons();
    updateRealtimeResolutionBadge();
    resetIdleTimer(popup);

    return popup;
  }

  function togglePvcPopup() {
    const existing = document.getElementById('pvc-controller-popup');
    if (existing) {
      if (existing.style.display === 'none') {
        existing.style.display = 'block';
        resetIdleTimer(existing);
        showToast('NOk Video Controller Aktif (v0.3.2)');
      } else {
        existing.style.display = 'none';
        showToast('NOk Video Controller Gizlendi');
      }
    } else {
      createPvcPopup();
      showToast('NOk Video Controller Aktif (v0.3.2)');
    }
  }

  // İlk Açılış
  createPvcPopup();
})();
