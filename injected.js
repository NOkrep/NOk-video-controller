/**
 * injected.js - NOk Video Controller v0.2.7 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage KULLANILMAZ.
 * 
 * v0.2.7 Yenilikleri ve Mimari İyileştirmeleri:
 * 1. Canlı Akış Paket Kaliteleri (Stream-Extracted Dynamic Qualities):
 *    - Sabit 1/2/3/4 veya 360/720/1080 etiketleri yerine oynatıcının HLS/DASH manifest ve
 *      paketlerinden gelen GERÇEK kalite seçenekleri (VideoJS qualityLevels, Amazon IVS getQualities,
 *      HLS.js levels) çekilerek listelenir (ör. [⚡ Otomatik] [576p PAL] [480p] [360p] veya [1080p60] [720p60]).
 * 2. PuhuTV Video.js systemBandwidth Hatası & Sonsuz Yükleme Düzeltmesi:
 *    - "The systemBandwidth property is read-only" hatası giderildi; ABR güvenli bandwidth kilidiyle
 *      sabitlenir ve var olmayan URL zorlaması yerine mevcut master.m3u8 seviyesi kilitlenir.
 * 3. Kick.com Canlı & VOD Dinamik IVS Listesi & Akıllı Buffer Flush:
 *    - Canlı ve VOD yayınlarda IVS Player paketleri tek tıkla kilitlenir; 0.02s mikro tampon tetikleme ile
 *      kullanıcının elle ileri-geri sarmasına gerek kalmadan yeni kalitedeki video anında yüklenir.
 * 4. Sade ve Bağımsız Eklenti HUD Arayüzü:
 *    - Sitedeki oynatıcı kontrol çubuklarını bozmadan, eklenti HUD'ı tek ve temiz gerçeklik kaynağı olarak
 *      seçili kaliteyi ve anlık render edilen gerçek piksel sayısını (ör. 🎬 Gerçek: 786x576) gösterir.
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

  console.log('[NOkrep] NOk Video Controller v0.2.7 (Dinamik Akış Paketleri + ABR Kilit + Akıllı Buffer) aktif.');

  const GITHUB_REPO_URL = 'https://github.com/NOkrep/NOk-video-controller';
  const DEVELOPER_EMAIL = 'ihsanartrk07@gmail.com';
  const HOSTNAME = window.location.hostname;

  // Bellek içi geçici durumlar (Stateless / In-Memory Only)
  let idleDelaySeconds = 5;
  let idleTimer = null;
  let activeForcedQualityId = 'auto';
  let activeForcedQualityLabel = 'Otomatik';
  let lastObservedResolution = 'Ölçülüyor...';
  let cachedDiscoveredQualities = [];

  // =========================================================================
  // 📝 SIFIR KİŞİSEL VERİ (ZERO-PII) BELLEK İÇİ TEŞHİS GÜNLÜĞÜ (RING BUFFER)
  // =========================================================================
  const DIAGNOSTIC_LOG_BUFFER = [];
  const MAX_LOG_BUFFER_SIZE = 30;

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
           document.body;
  }

  function showToast(msg) {
    const existing = document.getElementById('pvc-quick-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'pvc-quick-toast';
    toast.className = 'pvc-toast';
    toast.textContent = msg;

    const container = getActiveContainer();
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 2800);
  }

  // =========================================================================
  // 🧩 MODÜLER ADAPTÖR MİMARİSİ (DİNAMİK PAKET ÇEKME & ABR KİLİDİ)
  // =========================================================================

  /**
   * 1. PuhuTV Adaptörü (Video.js QualityLevels & ABR Bandwidth Güvenli Kilit)
   */
  const PuhuTvAdapter = {
    name: 'PuhuTvAdapter',
    matches() {
      return HOSTNAME.includes('puhutv.com') || !!document.querySelector('.puhu-player, .vjs-puhu-skin, [class*="puhu"]');
    },

    // ABR (Otomatik Bitrate Düşürme) Algoritmasını Güvenle Kilitler
    lockAbrBandwidth(player) {
      try {
        if (!player) return;
        if (player.tech_ && player.tech_.vhs) {
          player.tech_.vhs.bandwidth = 99999999;
          if (player.tech_.vhs.masterPlaylistController_) {
            player.tech_.vhs.masterPlaylistController_.fastQualityChange_ = true;
          }
          addDiagnosticLog('INFO', '[PuhuTvAdapter] Video.js VHS Bandwidth 99999999 kilitlendi.');
        }
        if (player.tech_ && player.tech_.hls) {
          player.tech_.hls.bandwidth = 99999999;
        }
      } catch (e) {}
    },

    // Akışın gerçek çözünürlük seviyelerini dinamik çeker
    getQualities(video, player) {
      const results = [];
      if (player && typeof player.qualityLevels === 'function') {
        try {
          const qLevels = player.qualityLevels();
          if (qLevels && qLevels.length > 0) {
            for (let i = 0; i < qLevels.length; i++) {
              const q = qLevels[i];
              const h = q.height || 0;
              const w = q.width || 0;
              let label = q.label || `${h}p`;
              if (h === 576 || (w === 786 && h === 576)) label = '576p (PAL)';
              else if (h === 480 || w === 654) label = '480p (SD)';
              else if (h === 360 || w === 640) label = '360p (Düşük)';
              else if (h >= 1080) label = '1080p (FHD)';
              else if (h >= 720) label = '720p (HD)';

              results.push({
                id: `vjs_${i}`,
                index: i,
                label: label,
                height: h,
                width: w,
                bitrate: q.bitrate || 0,
                raw: q
              });
            }
          }
        } catch (e) {}
      }

      if (results.length === 0 && player && player.tech_ && player.tech_.hls && player.tech_.hls.representations) {
        try {
          const reps = player.tech_.hls.representations();
          if (reps && reps.length > 0) {
            reps.forEach((r, idx) => {
              const h = r.height || 0;
              results.push({
                id: `vjs_rep_${idx}`,
                index: idx,
                label: `${h}p`,
                height: h,
                raw: r
              });
            });
          }
        } catch (e) {}
      }

      return results.sort((a, b) => (b.height || 0) - (a.height || 0));
    },

    applyQuality(targetItem, video, player) {
      this.lockAbrBandwidth(player);

      if (targetItem.id === 'auto') {
        if (player && typeof player.qualityLevels === 'function') {
          try {
            const qLevels = player.qualityLevels();
            for (let i = 0; i < qLevels.length; i++) {
              qLevels[i].enabled = true;
            }
            if (typeof qLevels.trigger === 'function') qLevels.trigger({ type: 'change', selectedIndex: -1 });
          } catch (e) {}
        }
        showToast('PuhuTV: Otomatik Kalite (ABR Aktif)');
        addDiagnosticLog('INFO', '[PuhuTvAdapter] Otomatik kaliteye geçildi.');
        return true;
      }

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

            this.lockAbrBandwidth(player);
            showToast(`PuhuTV (Kilitli): ${targetItem.label}`);
            addDiagnosticLog('INFO', `[PuhuTvAdapter] Kalite uygulandı: ${targetItem.label}`);
            return true;
          }
        } catch (e) {
          addDiagnosticLog('WARN', '[PuhuTvAdapter] qualityLevels uygulama hatası', e.message);
        }
      }

      showToast(`PuhuTV: ${targetItem.label}`);
      return true;
    }
  };

  /**
   * 2. Kick.com Canlı Yayın & VOD Adaptörü (Amazon IVS & Dinamik Paket Çekme)
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
        document.querySelector('[data-testid="player-settings-button"]')
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
            while (node && depth < 40) {
              const props = node.memoizedProps;
              const state = node.memoizedState;
              
              if (props) {
                if (props.player && typeof props.player.getQualities === 'function') return props.player;
                if (props.ivsPlayer && typeof props.ivsPlayer.getQualities === 'function') return props.ivsPlayer;
                if (props.mediaPlayer && typeof props.mediaPlayer.getQualities === 'function') return props.mediaPlayer;
              }
              if (state && state.player && typeof state.player.getQualities === 'function') return state.player;
              
              node = node.return;
              depth++;
            }
          }
        } catch (e) {}
      }

      return null;
    },

    flushStreamBuffer(video) {
      try {
        if (video) {
          const cur = video.currentTime;
          if (!video.paused && cur > 0.5) {
            video.currentTime = cur - 0.02;
          }
          addDiagnosticLog('INFO', '[KickAdapter] Stream buffer flush tetiklendi.');
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
              results.push({
                id: `ivs_${idx}`,
                label: q.name || `${q.height}p`,
                height: q.height,
                bitrate: q.bitrate,
                raw: q
              });
            });
            return results.sort((a, b) => (b.height || 0) - (a.height || 0));
          }
        } catch (e) {}
      }

      return [
        { id: '1080p60', label: '1080p60 (FHD)', height: 1080 },
        { id: '720p60', label: '720p60 (HD)', height: 720 },
        { id: '480p30', label: '480p30 (SD)', height: 480 },
        { id: '360p30', label: '360p30 (Düşük)', height: 360 },
        { id: '160p30', label: '160p30 (Mobil)', height: 160 }
      ];
    },

    applyQuality(targetItem, video) {
      const ivs = this.findIvsPlayer(video);
      const isVod = this.isVodPage();

      if (targetItem.id === 'auto') {
        if (ivs && typeof ivs.setAutoQualityMode === 'function') {
          ivs.setAutoQualityMode(true);
        }
        showToast(`Kick ${isVod ? 'Kayıt' : 'Canlı'}: Otomatik Kalite (Auto)`);
        addDiagnosticLog('INFO', '[KickAdapter] IVS setAutoQualityMode(true) açıldı.');
        return true;
      }

      if (ivs && typeof ivs.getQualities === 'function') {
        try {
          if (typeof ivs.setAutoQualityMode === 'function') {
            ivs.setAutoQualityMode(false);
          }

          const qList = ivs.getQualities();
          let targetQuality = targetItem.raw || null;

          if (!targetQuality && Array.isArray(qList)) {
            targetQuality = qList.find(q => 
              (q.name && q.name.toLowerCase().includes(targetItem.label.toLowerCase())) ||
              (q.height && q.height === targetItem.height) ||
              (q.name && q.name.includes(`${targetItem.height}`))
            );
          }

          if (targetQuality && typeof ivs.setQuality === 'function') {
            ivs.setQuality(targetQuality);
            this.flushStreamBuffer(video);
            showToast(`Kick ${isVod ? 'Kayıt' : 'Canlı'}: ${targetQuality.name || targetItem.label} (Kilitlendi)`);
            addDiagnosticLog('INFO', `[KickAdapter] IVS Kalitesi Kilitlendi: ${targetQuality.name}`);
            return true;
          }
        } catch (e) {
          addDiagnosticLog('WARN', '[KickAdapter] IVS setQuality hatası', e.message);
        }
      }

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
        if (targetItem.id === 'auto') {
          hls.currentLevel = -1;
          showToast('HLS.js: Otomatik Kalite');
          return true;
        }
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
        { id: '540', label: '540p (MD)', height: 540 },
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
   * Canlı Yayın/Video Paketlerinden Gerçek Kalite Seçeneklerini Çekme
   */
  function discoverStreamQualities() {
    const { video, player } = findVideoAndPlayer();
    for (const adapter of ADAPTER_PIPELINE) {
      if (adapter.matches(video, player) && typeof adapter.getQualities === 'function') {
        const found = adapter.getQualities(video, player);
        if (found && found.length > 0) {
          cachedDiscoveredQualities = found;
          return found;
        }
      }
    }
    return cachedDiscoveredQualities;
  }

  /**
   * Canlı Video Çözünürlük Takipçisi (Real-Time Rendered Pixels Monitor)
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
      else if (h === 576 || (w === 786 && h === 576)) label = '576p PAL';
      else if (h >= 540) label = '540p MD';
      else if (h >= 480) label = '480p SD';
      else if (h >= 360) label = '360p SD';

      lastObservedResolution = `${w}x${h} (${label})`;
      badge.textContent = `🎬 Gerçek: ${lastObservedResolution}`;
      badge.style.color = '#38bdf8';
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

  /**
   * Dinamik Kalite Butonlarını HUD İçinde Render Etme
   */
  function renderDynamicQualityButtons() {
    const container = document.getElementById('pvc-dynamic-quality-container');
    if (!container) return;

    const qualities = discoverStreamQualities();
    const countBadge = document.getElementById('pvc-quality-count-badge');
    if (countBadge) {
      countBadge.textContent = qualities.length > 0 ? `${qualities.length} Paket Algılandı` : 'Algılanıyor...';
    }

    container.innerHTML = '';

    // 1. "Auto / Otomatik" Butonu
    const autoBtn = document.createElement('button');
    autoBtn.className = `pvc-quality-chip-btn ${activeForcedQualityId === 'auto' ? 'pvc-active' : ''}`;
    autoBtn.textContent = '⚡ Otomatik';
    autoBtn.title = 'Yayıncının varsayılan otomatik kalite modu';
    autoBtn.onclick = () => {
      activeForcedQualityId = 'auto';
      activeForcedQualityLabel = 'Otomatik';
      const { video, player } = findVideoAndPlayer();
      for (const adapter of ADAPTER_PIPELINE) {
        if (adapter.matches(video, player)) {
          adapter.applyQuality({ id: 'auto', label: 'Otomatik' }, video, player);
          break;
        }
      }
      renderDynamicQualityButtons();
      setTimeout(updateRealtimeResolutionBadge, 1200);
    };
    container.appendChild(autoBtn);

    // 2. Akıştan Gelen Gerçek Paketler
    qualities.forEach(q => {
      const btn = document.createElement('button');
      const isCurrentActive = activeForcedQualityId === q.id || activeForcedQualityLabel === q.label;
      btn.className = `pvc-quality-chip-btn ${isCurrentActive ? 'pvc-active' : ''}`;
      btn.textContent = q.label;
      btn.title = `${q.label} • ${q.height ? q.height + 'p' : ''}`;

      btn.onclick = () => {
        activeForcedQualityId = q.id;
        activeForcedQualityLabel = q.label;
        const { video, player } = findVideoAndPlayer();
        for (const adapter of ADAPTER_PIPELINE) {
          if (adapter.matches(video, player)) {
            adapter.applyQuality(q, video, player);
            break;
          }
        }
        renderDynamicQualityButtons();
        setTimeout(updateRealtimeResolutionBadge, 1200);
      };

      container.appendChild(btn);
    });
  }

  /**
   * CDN Ping Testi
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
   * Zenginleştirilmiş Anonim Hata & Teşhis Paketi Oluşturucu
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
      domain: cleanHostname,
      activeForcedQuality: activeForcedQualityLabel || 'Otomatik',
      discoveredQualitiesCount: cachedDiscoveredQualities.length,
      idleDelaySetting: `${idleDelaySeconds}s`,
      userAgentFamily: navigator.userAgent.includes('Firefox') ? 'Firefox (Gecko)' : 'Chromium',
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      videoState: videoStats,
      recentLogs: DIAGNOSTIC_LOG_BUFFER.slice(-15)
    };

    addDiagnosticLog('WARN', `[Teşhis Paketi Üretildi]: ${errorCode}`);
    showErrorModal(anonymousPayload);
  }

  function showErrorModal(payload) {
    const existing = document.getElementById('pvc-error-modal');
    if (existing) existing.remove();

    const jsonStr = JSON.stringify(payload, null, 2);
    const issueTitle = encodeURIComponent(`[Teşhis/Hata]: ${payload.domain} - ${payload.errorCode}`);
    const issueBody = encodeURIComponent(`### Anonim Zenginleştirilmiş Teşhis Paketi (NOk Video Controller v0.2.7)\n\`\`\`json\n${jsonStr}\n\`\`\`\n\n**Açıklama & Gözlem:** Lütfen karşılaştığınız durumu buraya ekleyin.`);
    
    const githubUrl = `${GITHUB_REPO_URL}/issues/new?template=site_support.md&title=${issueTitle}&body=${issueBody}`;
    const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}&body=${issueBody}`;

    const modal = document.createElement('div');
    modal.id = 'pvc-error-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Zenginleştirilmiş Teşhis & Hata Raporu (v0.2.7)</span>
          <button id="pvc-close-modal-btn">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Sitede (<strong>${payload.domain}</strong>) oynatıcı durumu, konsol trace tamponu ve video render boyutu anonimleştirilerek toplandı (<strong>Sıfır Kişisel Veri</strong>):
          </p>
          <pre class="pvc-modal-code">${jsonStr}</pre>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-copy-payload-btn" class="pvc-modal-btn-secondary">📋 JSON Kopyala</button>
          <a href="${mailtoUrl}" target="_blank" class="pvc-modal-btn-primary" style="background:#2563eb;">✉️ E-posta İle Gönder</a>
          <a href="${githubUrl}" target="_blank" class="pvc-modal-btn-primary" style="background:#4f46e5;">🐙 GitHub Issue Aç</a>
        </div>
      </div>
    `;

    const container = getActiveContainer();
    container.appendChild(modal);

    document.getElementById('pvc-close-modal-btn').onclick = () => modal.remove();
    document.getElementById('pvc-copy-payload-btn').onclick = () => {
      navigator.clipboard.writeText(jsonStr);
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
          <span class="pvc-menu-badge">NOkrep v0.2.7</span>
          <span class="pvc-menu-title">NOk Video Controller</span>
        </div>
        <div class="pvc-header-actions">
          <button id="pvc-collapse-btn" class="pvc-icon-btn" title="Küçült / Büyüt">➖</button>
          <button id="pvc-close-popup-btn" class="pvc-icon-btn pvc-close" title="Kapat">✕</button>
        </div>
      </div>

      <!-- Canlı Render Çözünürlüğü Rozeti -->
      <div style="padding: 7px 12px; background: rgba(0,0,0,0.35); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between;">
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

      <!-- Dinamik Çözünürlük Seçenekleri (Paketlerden Çekilen Canlı Kaliteler) -->
      <div class="pvc-menu-section">
        <div class="pvc-section-header">
          <span class="pvc-label">Akış Paket Kaliteleri:</span>
          <span id="pvc-quality-count-badge" class="pvc-subtext" style="color: #38bdf8; font-weight: 600;">Paketler Algılanıyor...</span>
        </div>
        <div id="pvc-dynamic-quality-container" class="pvc-dynamic-grid" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
          <!-- Dinamik Butonlar renderDynamicQualityButtons ile basılır -->
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
    const popup = document.getElementById('pvc-controller-popup') || buildPvcPopup();
    popup.style.display = (popup.style.display === 'none') ? 'block' : 'none';
    if (popup.style.display === 'block') {
      resetIdleTimer(popup);
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();
    }
  }

  // =========================================================================
  // 🚀 BAŞLATMA
  // =========================================================================
  function initEngine() {
    const popup = buildPvcPopup();
    resetIdleTimer(popup);

    const { video } = findVideoAndPlayer();
    if (video) {
      monitorVideoResolution(video);
      renderDynamicQualityButtons();
    } else {
      const observer = new MutationObserver(() => {
        const { video: v } = findVideoAndPlayer();
        if (v) {
          monitorVideoResolution(v);
          renderDynamicQualityButtons();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // SPA Rota Değişimlerini İzleme
    const handleLocationChange = () => {
      addDiagnosticLog('INFO', `[SPA Observer] Rota değişti: ${window.location.pathname}`);
      setTimeout(() => {
        const { video: newVideo } = findVideoAndPlayer();
        if (newVideo) {
          monitorVideoResolution(newVideo);
          renderDynamicQualityButtons();
          updateRealtimeResolutionBadge();
        }
      }, 1000);
    };

    window.addEventListener('popstate', handleLocationChange);
    const origPush = history.pushState;
    history.pushState = function (...args) {
      origPush.apply(this, args);
      handleLocationChange();
    };

    showToast('NOk Video Controller Aktif (Dinamik Akış Paketleri)');
    addDiagnosticLog('INFO', '[NOkrep] Motor v0.2.7 hazır.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }

})();
