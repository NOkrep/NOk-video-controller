/**
 * injected.js - NOk Video Controller v0.2.8 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage KULLANILMAZ.
 * 
 * v0.2.8 Yenilikleri ve Düzeltmeleri:
 * 1. Bildirim (Toast) Sistemi Güçlendirildi:
 *    - Tam ekran, tiyatro modu ve normal modda HUD açık/kapalıyken tüm bildirimler (hız, sarma, kalite, ping)
 *      ekranın üst ortasında yüksek z-index ve canlı renklerle kesintisiz görünür.
 * 2. PuhuTV Video.js / VHS Gerçek Paket & 1080p/576p Akamai Düzeltmesi:
 *    - Paketlerin seçim sonrası kaybolup 5 genel butona dönüşmesi (fallback sızıntısı) tamamen engellendi.
 *    - Video.js VHS master playlist katmanından (`vhs.playlists.master.playlists`, `qualityLevels`, `representations`)
 *      tüm çözünürlükler eksiksiz listelenir ve `vhs.selectPlaylist` + `vhs.playlists.media` ile doğrudan kilitlenir.
 * 3. Kick.com Canlı Yayın & VOD IVS Kalite Kilitleme ve Buffer Flush:
 *    - Canlı yayın ve VOD kayıtlarında IVS `getQualities` referansı taze çekilerek `setAutoQualityMode(false)` +
 *      `setQuality(matchedQuality)` uygulanır; `ivs.seekTo` ile MSE arabelleği anında temizlenerek yeni kalite hemen başlar.
 * 4. Canlı Render Takibi:
 *    - Ekranda o an gerçekten çizilen piksel çözünürlüğü (`video.videoWidth x video.videoHeight`) HUD rozetinde canlı gösterilir.
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

  console.log('[NOkrep] NOk Video Controller v0.2.8 (Dinamik Akış Paketleri + ABR Kilit + Akıllı Buffer) aktif.');

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
  let currentActiveAdapterName = 'GenericAdapter';

  // =========================================================================
  // 📝 SIFIR KİŞİSEL VERİ (ZERO-PII) BELLEK İÇİ TEŞHİS GÜNLÜĞÜ (RING BUFFER)
  // =========================================================================
  const DIAGNOSTIC_LOG_BUFFER = [];
  const MAX_LOG_BUFFER_SIZE = 35;

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
           document.body ||
           document.documentElement;
  }

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
      
      // Inline stiller ile CSS yüklenmeme veya iframe durumlarında garantili görünürlük
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
      }, 2600);
    } catch (e) {
      console.log('[NOk Toast]', msg);
    }
  }

  // =========================================================================
  // 🧩 MODÜLER ADAPTÖR MİMARİSİ (DİNAMİK PAKET ÇEKME & ABR KİLİDİ)
  // =========================================================================

  /**
   * 1. PuhuTV Adaptörü (Video.js VHS & Master Playlist Doğrudan Kilit)
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

    // Akışın gerçek çözünürlük seviyelerini VHS ve QualityLevels üzerinden dinamik çeker
    getQualities(video, player) {
      const results = [];
      const seenHeights = new Set();

      // 1. VHS Master Playlists (En yetkili ve eksiksiz kaynak)
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
              if (h >= 1080) label = '1080p (FHD)';
              else if (h >= 720) label = '720p (HD)';
              else if (h === 576 || (w === 786 && h === 576)) label = '576p (PAL)';
              else if (h >= 480 || w === 654) label = '480p (SD)';
              else if (h >= 360 || w === 640) label = '360p (Düşük)';
              else if (h > 0) label = `${h}p`;
              else label = `Paket ${idx + 1}`;

              const uniqueKey = `${h}_${bw}`;
              if (!seenHeights.has(uniqueKey)) {
                seenHeights.add(uniqueKey);
                results.push({
                  id: `puhu_vhs_${idx}`,
                  index: idx,
                  label: label,
                  height: h,
                  width: w,
                  bitrate: bw,
                  vhsPlaylist: pl,
                  raw: pl
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
              if (h >= 1080) label = '1080p (FHD)';
              else if (h >= 720) label = '720p (HD)';
              else if (h === 576 || (w === 786 && h === 576)) label = '576p (PAL)';
              else if (h >= 480 || w === 654) label = '480p (SD)';
              else if (h >= 360 || w === 640) label = '360p (Düşük)';

              results.push({
                id: `vjs_ql_${i}`,
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

      // 3. Representations
      if (results.length === 0 && player && player.tech_ && player.tech_.vhs && typeof player.tech_.vhs.representations === 'function') {
        try {
          const reps = player.tech_.vhs.representations();
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

      if (results.length > 0) {
        return results.sort((a, b) => (b.height || 0) - (a.height || 0) || (b.bitrate || 0) - (a.bitrate || 0));
      }

      return [];
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
        if (player && player.tech_ && player.tech_.vhs) {
          player.tech_.vhs.selectPlaylist = null;
        }
        showToast('PuhuTV: Otomatik Kalite (ABR Aktif)');
        addDiagnosticLog('INFO', '[PuhuTvAdapter] Otomatik kaliteye geçildi.');
        return true;
      }

      let applied = false;

      // 1. VHS Playlist Doğrudan Kilit
      if (targetItem.vhsPlaylist && player && player.tech_ && player.tech_.vhs) {
        try {
          const targetPl = targetItem.vhsPlaylist;
          if (typeof player.tech_.vhs.selectPlaylist === 'function') {
            player.tech_.vhs.selectPlaylist = () => targetPl;
          }
          if (player.tech_.vhs.playlists && typeof player.tech_.vhs.playlists.media === 'function') {
            player.tech_.vhs.playlists.media(targetPl);
          }
          applied = true;
          addDiagnosticLog('INFO', `[PuhuTvAdapter] VHS Playlist kilitlendi: ${targetItem.label}`);
        } catch (e) {
          addDiagnosticLog('WARN', '[PuhuTvAdapter] VHS Playlist kilit hatası', e.message);
        }
      }

      // 2. Video.js qualityLevels kilit
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
            applied = true;
          }
        } catch (e) {}
      }

      this.lockAbrBandwidth(player);
      showToast(`PuhuTV (Kilitli): ${targetItem.label}`);
      addDiagnosticLog('INFO', `[PuhuTvAdapter] Kalite uygulandı: ${targetItem.label}`);
      return true;
    }
  };

  /**
   * 2. Kick.com Canlı Yayın & VOD Adaptörü (Amazon IVS & Akıllı Buffer Flush)
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
        document.querySelector('div[class*="player"]')
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
            while (node && depth < 45) {
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

    flushStreamBuffer(video, ivs) {
      try {
        if (ivs && typeof ivs.seekTo === 'function') {
          if (this.isVodPage() && video) {
            ivs.seekTo(video.currentTime);
          } else if (typeof ivs.getLiveLatency === 'function') {
            const lat = ivs.getLiveLatency();
            if (lat > 0 && video) {
              ivs.seekTo(video.duration || video.currentTime);
            }
          }
        } else if (video && !video.paused) {
          const cur = video.currentTime;
          if (cur > 0.5) {
            video.currentTime = cur - 0.02;
          }
        }
        addDiagnosticLog('INFO', '[KickAdapter] Stream buffer flush tetiklendi.');
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

      return [];
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
            this.flushStreamBuffer(video, ivs);
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

  function getActiveAdapter(video, player) {
    for (const adapter of ADAPTER_PIPELINE) {
      if (adapter.matches(video, player)) {
        currentActiveAdapterName = adapter.name;
        return adapter;
      }
    }
    return GenericAdapter;
  }

  /**
   * Canlı Yayın/Video Paketlerinden Gerçek Kalite Seçeneklerini Çekme
   */
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

    // Eğer özel adaptör (Puhu/Kick) aktifse ve daha önce paket keşfetmişse onu koru
    if (adapter.name !== 'GenericAdapter' && cachedDiscoveredQualities.length > 0) {
      return cachedDiscoveredQualities;
    }

    // Yalnızca genel sayfalarda generic adaptör listesini dön
    if (adapter.name === 'GenericAdapter') {
      return GenericAdapter.getQualities();
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
    video.addEventListener('timeupdate', () => {
      if (lastObservedResolution.includes('Bekleniyor') || lastObservedResolution.includes('Ölçülüyor')) {
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
      const adapter = getActiveAdapter(video, player);
      adapter.applyQuality({ id: 'auto', label: 'Otomatik' }, video, player);
      renderDynamicQualityButtons();
      setTimeout(updateRealtimeResolutionBadge, 1000);
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
        const adapter = getActiveAdapter(video, player);
        adapter.applyQuality(q, video, player);
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
      activeAdapter: currentActiveAdapterName,
      domain: cleanHostname,
      activeForcedQuality: activeForcedQualityLabel || 'Otomatik',
      discoveredQualitiesCount: cachedDiscoveredQualities.length,
      idleDelaySetting: `${idleDelaySeconds}s`,
      userAgentFamily: navigator.userAgent.includes('Firefox') ? 'Firefox (Gecko)' : 'Chromium',
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      videoState: videoStats,
      recentLogs: DIAGNOSTIC_LOG_BUFFER.slice(-20)
    };

    addDiagnosticLog('WARN', `[Teşhis Paketi Üretildi]: ${errorCode}`);
    showErrorModal(anonymousPayload);
  }

  function showErrorModal(payload) {
    const existing = document.getElementById('pvc-error-modal');
    if (existing) existing.remove();

    const jsonStr = JSON.stringify(payload, null, 2);
    const issueTitle = encodeURIComponent(`[Teşhis/Hata]: ${payload.domain} - ${payload.errorCode}`);
    const issueBody = encodeURIComponent(`### Anonim Zenginleştirilmiş Teşhis Paketi (NOk Video Controller v0.2.8)\n\`\`\`json\n${jsonStr}\n\`\`\`\n\n**Açıklama & Gözlem:** Lütfen karşılaştığınız durumu buraya ekleyin.`);
    
    const githubUrl = `${GITHUB_REPO_URL}/issues/new?template=site_support.md&title=${issueTitle}&body=${issueBody}`;
    const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}&body=${issueBody}`;

    const modal = document.createElement('div');
    modal.id = 'pvc-error-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Zenginleştirilmiş Teşhis & Hata Raporu (v0.2.8)</span>
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
          <span class="pvc-menu-badge">NOkrep v0.2.8</span>
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

    showToast('NOk Video Controller Aktif (v0.2.8)');
    addDiagnosticLog('INFO', '[NOkrep] Motor v0.2.8 hazır.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }

})();
