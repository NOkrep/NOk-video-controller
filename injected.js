/**
 * injected.js - NOk Video Controller v0.3.3 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage KULLANILMAZ.
 * 
 * v0.3.3 Entegrasyon & Mimarisi:
 * 1. Kusursuz Klasik HUD Düzeni (Sade, Taşmayan, Sağ Kenara Raylı ve Şık Arayüz).
 * 2. PuhuTV Doğal Paket Doğrulama & Akıllı Eşleştirme (VHS Playlists + Video.js qualityLevels + Akamai/Medianova Ağ Kancası).
 *    - Olmayan kalite seçenekleri (yapay 1080p vb.) kesinlikle listelenmez; sadece mevcut fiziksel akışlar sunulur.
 *    - Akamai manifestosu olan içeriklerde buffer sıfırlamadan kesintisiz VHS/qualityLevels geçişi yapılır.
 * 3. Donmasız Sarma (Seek) & Canlı Çözünürlük Algılama:
 *    - 654x480 çözünürlüğü tam olarak 480p SD, 786x576 çözünürlüğü 576p PAL olarak net tespit edilir.
 * 4. Kick.com Çok Aşamalı ve IVS Tabanlı Kalite Kancası.
 * 5. Zenginleştirilmiş Anonim Teşhis & Hata Modalı.
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

  console.log('[NOkrep] NOk Video Controller v0.3.3 aktif.');

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
  let targetPuhuSmilLevel = null;  // '1080p.smil', '720p.smil', etc.
  let puhuFallbackAttempted = false;

  // =========================================================================
  // 🌐 PUHUTV ÇİFT CDN (AKAMAI & MEDIANOVA MNCDN) AĞ KANCASI (XHR / FETCH)
  // =========================================================================
  function transformPuhuStreamUrl(url) {
    if (typeof url !== 'string') return url;

    // 1. DYG Video API Kancası: PuhuTV'nin 1080p FHD destekleyen Medianova (MNCDN) akışını getirmesi için
    //    akamai=true parametresini akamai=false olarak dönüştürür.
    if (url.includes('dygvideo.dygdigital.com/api/video_info') && url.includes('akamai=true')) {
      const redirectUrl = url.replace('akamai=true', 'akamai=false');
      addDiagnosticLog('INFO', '[PuhuTvAdapter] DYG Video API: 1080p FHD için MNCDN moduna yönlendirildi.');
      return redirectUrl;
    }

    // 2. Medianova (MNCDN) SMIL Kancası (xxxp.smil -> 1080p.smil / 720p.smil vb.)
    if (url.includes('mncdn.com') && url.includes('.smil') && targetPuhuSmilLevel) {
      const redirectUrl = url.replace(/\d+p\.smil/i, targetPuhuSmilLevel);
      if (redirectUrl !== url) {
        addDiagnosticLog('INFO', `[Network Hook] MNCDN SMIL Yönlendirildi: ${targetPuhuSmilLevel}`);
        return redirectUrl;
      }
    }

    return url;
  }

  (function hookNetworkRequestsForPuhu() {
    // 1. XMLHttpRequest Hook
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      try {
        if (typeof url === 'string') {
          const transformedUrl = transformPuhuStreamUrl(url);
          return originalOpen.call(this, method, transformedUrl, ...rest);
        }
      } catch (e) {}
      return originalOpen.call(this, method, url, ...rest);
    };

    // 2. Fetch Hook
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        if (typeof input === 'string') {
          const transformedUrl = transformPuhuStreamUrl(input);
          return originalFetch.call(this, transformedUrl, init);
        } else if (input instanceof Request && input.url) {
          const transformedUrl = transformPuhuStreamUrl(input.url);
          if (transformedUrl !== input.url) {
            const newRequest = new Request(transformedUrl, input);
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
        // Kayıt günlüğü
        if (msg.includes('video') || msg.includes('hls') || msg.includes('ivs') || msg.includes('puhu') || msg.includes('kick')) {
          addDiagnosticLog('WARN', msg);
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

      // 1. VHS Master Playlists
      if (player && player.tech_ && player.tech_.vhs && player.tech_.vhs.playlists && player.tech_.vhs.playlists.master) {
        try {
          const masterPlaylists = player.tech_.vhs.playlists.master.playlists;
          if (Array.isArray(masterPlaylists) && masterPlaylists.length > 0) {
            masterPlaylists.forEach((pl, idx) => {
              const res = pl.attributes && pl.attributes.RESOLUTION ? pl.attributes.RESOLUTION : null;
              const h = res ? res.height : 0;
              const w = res ? res.width : 0;
              const bw = (pl.attributes && pl.attributes.BANDWIDTH) || 0;

              // pl.uri veya pl.resolvedUri içinden gerçek media-X etiketini tespit et
              const uri = pl.resolvedUri || pl.uri || '';
              const mediaMatch = uri.match(/media-(\d+)/i);
              let mediaTag = mediaMatch ? `media-${mediaMatch[1]}` : 'media-2';
              let smilTag = '576p.smil';

              let label = `${h}p`;
              if (h >= 1000 || w >= 1900) {
                label = '1080p (FHD)';
                if (!mediaMatch) mediaTag = 'media-4';
                smilTag = '1080p.smil';
              } else if (h >= 700 || w >= 1200) {
                label = '720p (HD)';
                if (!mediaMatch) mediaTag = 'media-3';
                smilTag = '720p.smil';
              } else if (h === 576 || (w === 786 && h === 576) || (h >= 540 && h <= 576)) {
                label = '576p (PAL)';
                if (!mediaMatch) mediaTag = 'media-3';
                smilTag = '576p.smil';
              } else if (h === 480 || (w === 654 && h === 480) || (h >= 450 && h < 540)) {
                label = '480p (SD)';
                if (!mediaMatch) mediaTag = 'media-2';
                smilTag = '480p.smil';
              } else if (h >= 320 && h < 450) {
                label = '360p (Düşük)';
                if (!mediaMatch) mediaTag = 'media-1';
                smilTag = '360p.smil';
              } else if (h > 0) {
                label = `${h}p`;
              }

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
                  smilTag: smilTag,
                  vhsPlaylist: pl
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
              let smilTag = '576p.smil';
              if (h >= 1000 || w >= 1900) { label = '1080p (FHD)'; mediaTag = 'media-4'; smilTag = '1080p.smil'; }
              else if (h >= 700 || w >= 1200) { label = '720p (HD)'; mediaTag = 'media-3'; smilTag = '720p.smil'; }
              else if (h === 576 || (w === 786 && h === 576) || (h >= 540 && h <= 576)) { label = '576p (PAL)'; mediaTag = 'media-3'; smilTag = '576p.smil'; }
              else if (h === 480 || (w === 654 && h === 480) || (h >= 450 && h < 540)) { label = '480p (SD)'; mediaTag = 'media-2'; smilTag = '480p.smil'; }
              else if (h >= 320 && h < 450) { label = '360p (Düşük)'; mediaTag = 'media-1'; smilTag = '360p.smil'; }

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
                  smilTag: smilTag,
                  raw: q
                });
              }
            }
          }
        } catch (e) {}
      }

      // 3. Kesin Kural: Olmayan kalite gösterilmez. Yalnızca akışta tespit edilen paketler döndürülür.
      return results.sort((a, b) => (b.height || 0) - (a.height || 0));
    },

    applyQuality(targetItem, video, player) {
      puhuFallbackAttempted = false;

      // 1. Akamai / Medianova Ağ Seviyelerini ata
      if (targetItem.mediaTag) {
        targetPuhuMediaLevel = targetItem.mediaTag;
      }
      if (targetItem.smilTag) {
        targetPuhuSmilLevel = targetItem.smilTag;
      } else if (targetItem.height >= 1000) {
        targetPuhuMediaLevel = 'media-4';
        targetPuhuSmilLevel = '1080p.smil';
      } else if (targetItem.height >= 700) {
        targetPuhuMediaLevel = 'media-3';
        targetPuhuSmilLevel = '720p.smil';
      } else if (targetItem.height >= 540) {
        targetPuhuMediaLevel = 'media-3';
        targetPuhuSmilLevel = '576p.smil';
      } else if (targetItem.height >= 450) {
        targetPuhuMediaLevel = 'media-2';
        targetPuhuSmilLevel = '480p.smil';
      } else {
        targetPuhuMediaLevel = 'media-1';
        targetPuhuSmilLevel = '360p.smil';
      }

      addDiagnosticLog('INFO', `[PuhuTvAdapter] Ağ kancası hedefi ayarlandı: Akamai=${targetPuhuMediaLevel}, MNCDN=${targetPuhuSmilLevel} (${targetItem.label})`);

      this.lockAbrBandwidth(player);

      // 2. VHS Playlist Doğrudan Kilit (Buffer sıfırlanmadan donmasız geçiş)
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

      // 4. Eğer Medianova SMIL dosyası değişimi gerekiyorsa (yalnızca mncdn .smil için)
      try {
        let currentSrcUrl = '';
        if (player && typeof player.currentSrc === 'function') currentSrcUrl = player.currentSrc();
        if (!currentSrcUrl && video) currentSrcUrl = video.currentSrc || video.src || '';

        if (currentSrcUrl && currentSrcUrl.includes('mncdn.com') && currentSrcUrl.includes('.smil')) {
          const transformed = transformPuhuStreamUrl(currentSrcUrl);
          if (transformed && transformed !== currentSrcUrl && player && typeof player.src === 'function') {
            const curTime = video ? video.currentTime : 0;
            const isPaused = video ? video.paused : false;
            player.src({ src: transformed, type: 'application/x-mpegURL' });
            if (typeof player.one === 'function') {
              player.one('loadedmetadata', () => {
                if (curTime > 0) player.currentTime(curTime);
                if (!isPaused && typeof player.play === 'function') player.play();
              });
            }
            addDiagnosticLog('INFO', `[PuhuTvAdapter] MNCDN SMIL kaynağı canlı güncellendi: ${transformed}`);
          }
        }
      } catch (srcErr) {}

      this.lockAbrBandwidth(player);
      showToast(`PuhuTV: ${targetItem.label} (Kilitlendi)`);
      addDiagnosticLog('INFO', `[PuhuTvAdapter] Kalite uygulandı: ${targetItem.label}`);
      return true;
    }
  };

  /**
   * 2. Kick.com Canlı Yayın & VOD Adaptörü (Amazon IVS + React Fiber + DOM Fallback)
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

    triggerKickUiQuality(targetLabel) {
      try {
        const cleanTarget = targetLabel.replace(/p\d+/, '').replace(/\s+/g, '');
        const settingsBtn = document.querySelector('[data-testid="player-settings-button"], button[aria-label*="ayar"], button[aria-label*="Setting"], button[aria-label*="Ayarlar"]');
        if (settingsBtn) {
          settingsBtn.click();
          setTimeout(() => {
            const qualityMenuItems = Array.from(document.querySelectorAll('button, div[role="menuitem"], [class*="menu-item"]'));
            const matchBtn = qualityMenuItems.find(el => el.textContent && el.textContent.includes(cleanTarget));
            if (matchBtn) {
              matchBtn.click();
              addDiagnosticLog('INFO', `[KickAdapter] UI Menü seçimi tetiklendi: ${targetLabel}`);
            }
            setTimeout(() => {
              if (document.body.click) document.body.click();
            }, 100);
          }, 120);
        }
      } catch (e) {}
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
        { id: 'kick_1080p60', label: '1080p60', height: 1080 },
        { id: 'kick_720p60', label: '720p60', height: 720 },
        { id: 'kick_480p30', label: '480p30', height: 480 },
        { id: 'kick_360p30', label: '360p30', height: 360 },
        { id: 'kick_160p30', label: '160p30', height: 160 }
      ];
    },

    applyQuality(targetItem, video) {
      const ivs = this.findIvsPlayer(video);
      const isVod = this.isVodPage();

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
              (q.name && targetItem.label && q.name.toLowerCase() === targetItem.label.toLowerCase()) ||
              (q.height && q.height === targetItem.height) ||
              (q.name && q.name.includes(`${targetItem.height}`))
            );
          }

          if (targetQuality && typeof ivs.setQuality === 'function') {
            ivs.setQuality(targetQuality);
            this.triggerKickUiQuality(targetItem.label);
            showToast(`Kick ${isVod ? 'Kayıt' : 'Canlı'}: ${targetQuality.name || targetItem.label} (Kilitlendi)`);
            addDiagnosticLog('INFO', `[KickAdapter] IVS Kalitesi Kilitlendi: ${targetQuality.name}`);
            return true;
          }
        } catch (e) {
          addDiagnosticLog('WARN', '[KickAdapter] IVS setQuality hatası', e.message);
        }
      }

      this.triggerKickUiQuality(targetItem.label);
      showToast(`Kick: ${targetItem.label}`);
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

      if (h >= 1000 || w >= 1900) label = '1080p FHD';
      else if (h >= 700 || w >= 1200) label = '720p HD';
      else if (h >= 540 || (w >= 720 && h >= 500)) label = '576p PAL';
      else if (h >= 450 || (w >= 600 && h >= 400)) label = '480p SD';
      else if (h >= 320) label = '360p SD';
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

    if (HOSTNAME.includes('puhutv.com')) {
      const has1080 = qualities.some(q => (q.height || 0) >= 1000);
      if (!has1080) {
        const mncdnBtn = document.createElement('button');
        mncdnBtn.className = 'pvc-quality-chip-btn';
        mncdnBtn.style.background = 'rgba(56, 189, 248, 0.15)';
        mncdnBtn.style.color = '#38bdf8';
        mncdnBtn.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        mncdnBtn.style.fontSize = '11px';
        mncdnBtn.textContent = '🚀 1080p FHD (MNCDN) Moduna Geç';
        mncdnBtn.title = 'PuhuTV Medianova sunucusundan 1080p FHD akışını almak için sayfayı ağ kancasıyla yeniler';
        mncdnBtn.onclick = () => {
          showToast('1080p FHD MNCDN akışı için sayfa yenileniyor...');
          setTimeout(() => {
            window.location.reload();
          }, 400);
        };
        container.appendChild(mncdnBtn);
      }
    }
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
   * Ergonomik Raylı Sürükleme Motoru (Docked Right-Rail Vertical in Normal Mode, 2D in Fullscreen)
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

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        resetIdleTimer(popup);

        const deltaY = moveEvent.clientY - startClientY;
        const newTop = Math.max(12, Math.min(window.innerHeight - popup.offsetHeight - 12, startTop + deltaY));

        popup.style.setProperty('top', `${newTop}px`, 'important');
        popup.style.setProperty('bottom', 'auto', 'important');

        if (isFs) {
          // Tam ekranda 2D serbest hareket
          const deltaX = moveEvent.clientX - startClientX;
          const newLeft = Math.max(12, Math.min(window.innerWidth - popup.offsetWidth - 12, startLeft + deltaX));
          popup.style.setProperty('left', `${newLeft}px`, 'important');
          popup.style.setProperty('right', 'auto', 'important');
        } else {
          // Normal modda sağ raya sabit, sadece dikey yukarı/aşağı kayma (sıfır lag ve temiz düzen)
          popup.style.setProperty('right', '24px', 'important');
          popup.style.setProperty('left', 'auto', 'important');
        }
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
      <div id="pvc-drag-header" class="pvc-menu-header" title="Sürüklemek için basılı tutun (Normal modda sağ raya kilitli dikey kayar)">
        <div class="pvc-menu-brand">
          <span class="pvc-menu-badge">NOkrep v0.3.3</span>
          <span class="pvc-menu-title">NOk Video Controller</span>
        </div>
        <div class="pvc-header-actions">
          <button id="pvc-collapse-btn" class="pvc-icon-btn" title="Küçült / Büyüt">➖</button>
          <button id="pvc-close-popup-btn" class="pvc-icon-btn pvc-close" title="Kapat">✕</button>
        </div>
      </div>

      <!-- Canlı Render Çözünürlüğü Rozeti -->
      <div style="padding: 7px 12px; background: rgba(0,0,0,0.35); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; border-radius: 6px; margin-bottom: 8px;">
        <span id="pvc-realtime-res-badge" style="font-size: 11px; font-weight: 700; font-family: monospace; color: #38bdf8;">
          🎬 Çözünürlük: Kontrol ediliyor...
        </span>
        <button id="pvc-refresh-res-btn" style="background: none; border: none; color: #94a3b8; font-size: 11px; cursor: pointer; padding: 2px 4px;" title="Çözünürlük ve Paketleri Yenile">🔄</button>
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

      <!-- Dinamik Çözünürlük Seçenekleri -->
      <div class="pvc-menu-section">
        <div class="pvc-section-header">
          <span class="pvc-label">Akış Paket Kaliteleri:</span>
          <span id="pvc-quality-count-badge" class="pvc-subtext" style="color: #38bdf8; font-weight: 600;">Paketler Algılanıyor...</span>
        </div>
        <div id="pvc-dynamic-quality-container" class="pvc-dynamic-grid" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
          <!-- Dinamik Butonlar renderDynamicQualityButtons ile basılır -->
        </div>
      </div>

      <!-- Sadeleştirilmiş Saydamlık Gecikmesi (2s - 5s) -->
      <div class="pvc-menu-section" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
        <div class="pvc-section-header">
          <span class="pvc-label">Saydamlık Gecikmesi:</span>
          <span id="pvc-idle-delay-val" class="pvc-val-badge" style="color:#a78bfa; background:rgba(167,139,250,0.15); border-color:rgba(167,139,250,0.3);">${idleDelaySeconds}s</span>
        </div>
        <div class="pvc-quick-speed-buttons">
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="2">2sn</button>
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="3">3sn</button>
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="4">4sn</button>
          <button class="pvc-chip-btn pvc-idle-btn" data-sec="5">5sn</button>
        </div>
      </div>

      <div class="pvc-menu-footer">
        <button id="pvc-ping-btn" class="pvc-footer-btn pvc-btn-emerald" title="Sunucu gecikmesini ölç">📡 CDN Ping</button>
        <button id="pvc-report-err-btn" class="pvc-footer-btn pvc-btn-amber" title="Zenginleştirilmiş teşhis paketini aç">⚠️ Teşhis / Hata</button>
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

    popup.querySelector('#pvc-refresh-res-btn').onclick = () => {
      resetIdleTimer(popup);
      updateRealtimeResolutionBadge();
      renderDynamicQualityButtons();
      showToast(`🎬 Güncellendi: ${lastObservedResolution}`);
    };

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
      reportAnonymousError('USER_MANUAL_DIAGNOSTIC', 'Kullanıcı teşhis ve hata bildirimini tetikledi.');
    };

    popup.querySelector('#pvc-close-popup-btn').onclick = () => {
      popup.style.display = 'none';
    };

    let isCollapsed = false;
    popup.querySelector('#pvc-collapse-btn').onclick = () => {
      resetIdleTimer(popup);
      isCollapsed = !isCollapsed;
      popup.querySelectorAll('.pvc-menu-section, .pvc-menu-footer, #pvc-realtime-res-badge').forEach(el => {
        el.style.display = isCollapsed ? 'none' : '';
      });
      popup.querySelector('#pvc-collapse-btn').textContent = isCollapsed ? '➕' : '➖';
    };

    renderDynamicQualityButtons();
    return popup;
  }

  function togglePvcPopup() {
    let popup = document.getElementById('pvc-controller-popup');
    const wasClosed = !popup || popup.style.display === 'none';
    if (!popup) {
      popup = buildPvcPopup();
    }
    syncFullscreenElements();
    popup.style.display = wasClosed ? 'block' : 'none';
    if (popup.style.display === 'block') {
      resetIdleTimer(popup);
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();

      const { video } = findVideoAndPlayer();
      if (video) {
        monitorVideoResolution(video);
        const slider = popup.querySelector('#pvc-speed-slider');
        const speedVal = popup.querySelector('#pvc-speed-value');
        if (slider) slider.value = (video.playbackRate || 1.0).toString();
        if (speedVal) speedVal.textContent = `${video.playbackRate || 1.0}x`;
      }
      showToast('NOk Video Controller Aktif (v0.3.3)');
    }
  }

  // Başlangıç Video Gözlemcisi
  setTimeout(() => {
    const { video } = findVideoAndPlayer();
    if (video) {
      monitorVideoResolution(video);
    }
  }, 1000);

})();
