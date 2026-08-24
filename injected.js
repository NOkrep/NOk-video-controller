/**
 * injected.js - NOk Video Controller v0.3.8 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage KULLANILMAZ.
 * 
 * v0.3.8 İyileştirmeleri & Düzeltmeleri:
 * 1. Kick.com Reklam Takılmasız Hızlandırma (16x Hız + Mute + Otomatik 360p/160p Düşürme & Geri Alma):
 *    - Kick reklamlarında yüksek çözünürlükten kaynaklanan takılmaları önlemek için reklam anında kalite 360p/en düşük seviyeye çekilir.
 *    - Reklam bitiminde kullanıcının orijinal kaliteli akış profiline otomatik geri dönülür.
 * 2. Gelişmiş Ses Denetimi (%0 - %200 Kaydırmalı Ses & Ses Yükseltici / Gain Booster):
 *    - Standart HTML5 video ses sınırlarını aşan Web Audio API GainNode köprüsü.
 *    - Düşük sesli videoları 2 katına (%200) kadar yükseltme imkanı.
 * 3. Stereo / Mono Ses Kanalı Anahtarlayıcısı:
 *    - Tek kulaklık kullanımında veya tek taraflı ses dosyalarında ChannelMerger / ChannelSplitter ile anında Mono/Stereo geçişi.
 * 4. Akıllı Akordeon (Daraltılabilir / Genişletilebilir) HUD Bölümleri:
 *    - Her bölüm başlığında anlık seçili değer (Hız, Ses, Kalite, Saydamlık vb.) gösterilir ve tıklandığında daraltılabilir.
 * 5. Genel Küçültme (➖/➕) Düzeltmesi:
 *    - Genel küçültme modunda canlı çözünürlük rozeti, ping ve hata butonları gizlenmez, gerçek çözünürlük metni eksiksiz görüntülenir.
 */

(() => {
  const EXTENSION_VERSION = '0.3.8';
  const VERSION_HISTORY = [
    { version: 'v0.3.8', notes: 'Kick.com reklamlarında 360p akıllı kalite düşürme & geri alma, %0-%200 ses seviyesi ve Gain booster, Mono/Stereo ses anahtarı, akıllı akordeon HUD bölümleri ve genel küçültme çözünürlük düzeltmesi.' },
    { version: 'v0.3.7', notes: 'Kick.com otomatik reklam algılayıcı ve 16x hızlandırıcı (Ad Fast-Forward & Mute), HUD ve bildirimler için ARIA/A11y erişilebilirlik geliştirmeleri, klavye Tab navigasyon desteği.' },
    { version: 'v0.3.6', notes: 'PuhuTV 576p/480p Video.js VHS donma düzeltmesi (non-destructive qualityLevels switch), Anti-Stall oynatıcı nöbetçisi, sayfa açılışında doğal akış koruması & isteğe bağlı pürüzsüz 1080p MNCDN geçişi.' },
    { version: 'v0.3.5', notes: 'PuhuTV MNCDN dahili profil pürüzsüz geçişi, 1-tıkla anında açılış senkronizasyonu, 16px sürükleme sıçramasını önleyen 24px sabit sağ ray, canlı DYG Video API yakalama ve telemetri.' },
    { version: 'v0.3.4', notes: 'Pürüzsüz tampon motoru (Smooth Buffer Engine), doğrudan 1080p MNCDN API geçişi, 5 profil ayrıştırma.' },
    { version: 'v0.3.3', notes: 'Sentetik olmayan gerçek HLS paketleri, tek tık iyileştirmesi, 480p SD / 576p PAL ayrımı.' },
    { version: 'v0.3.2', notes: 'HUD UI, Kick adaptörü, Zero-PII teşhis motoru.' }
  ];

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === 'PVC_TOGGLE_POPUP' || event.data.type === 'PVC_TOGGLE_UI' || event.data.type === 'NOK_CONTROLLER_TOGGLE') {
      togglePvcPopup();
    } else if (event.data.type === 'PVC_OPEN_POPUP') {
      const popup = document.getElementById('pvc-controller-popup') || buildPvcPopup();
      popup.style.display = 'block';
      resetIdleTimer(popup);
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();
      showToast('NOk Video Controller Aktif (v0.3.8)');
    }
  });

  if (window.__NOK_VIDEO_CONTROLLER_INJECTED__) {
    togglePvcPopup();
    return;
  }
  window.__NOK_VIDEO_CONTROLLER_INJECTED__ = true;

  console.log('[NOkrep] NOk Video Controller v0.3.8 aktif.');

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
  let targetPuhuMediaLevel = null;
  let targetPuhuSmilLevel = null;
  let puhuFallbackAttempted = false;
  let lastCapturedDygApiUrl = '';

  // Web Audio API State (Ses Yükseltme & Mono/Stereo)
  let currentAudioVolumePercent = 100;
  let currentAudioMode = 'stereo'; // 'stereo' | 'mono'
  let audioContextInstance = null;
  let audioGainNodeInstance = null;
  let audioSplitterNodeInstance = null;
  let audioMergerNodeInstance = null;
  let audioSourceElementMap = new WeakMap();

  // =========================================================================
  // 🌐 PUHUTV ÇİFT CDN (AKAMAI & MEDIANOVA MNCDN) AĞ KANCASI (XHR / FETCH)
  // =========================================================================
  function transformPuhuStreamUrl(url) {
    if (typeof url !== 'string') return url;

    // Canlı DYG API isteğini yakala ve hafızada tut
    if (url.includes('dygvideo.dygdigital.com/api/video_info')) {
      lastCapturedDygApiUrl = url;
      addDiagnosticLog('INFO', `[PuhuTvAdapter] DYG Video API yakalandı: ${sanitizeStreamUrl(url)}`);
    }

    // Yalnızca kullanıcı 1080p FHD hedefi seçmişse ve doğrudan API isteği atılıyorsa MNCDN moduna dönüştür
    if (targetPuhuSmilLevel === '1080p.smil' && url.includes('dygvideo.dygdigital.com/api/video_info') && url.includes('akamai=true')) {
      const redirectUrl = url.replace('akamai=true', 'akamai=false');
      addDiagnosticLog('INFO', '[PuhuTvAdapter] DYG Video API: 1080p FHD için MNCDN moduna yönlendirildi.');
      return redirectUrl;
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
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
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
  // ⚡ PÜRÜZSÜZ TAMPON & OYNATICI KAYNAK DEĞİŞTİRME MOTORU (SMOOTH BUFFER SWITCH)
  // =========================================================================
  let smoothSwitchInterval = null;
  let smoothSwitchTimeout = null;

  function smoothPlayerSourceSwitch(player, video, newSrcUrl, label) {
    if (!player) return;
    const curTime = video ? video.currentTime : 0;
    const wasPaused = video ? video.paused : false;

    if (smoothSwitchInterval) clearInterval(smoothSwitchInterval);
    if (smoothSwitchTimeout) clearTimeout(smoothSwitchTimeout);

    if (video && !wasPaused) {
      video.pause();
    }
    showToast(`🎬 ${label}: Tampon dolduruluyor...`);
    addDiagnosticLog('INFO', `[BufferEngine] Pürüzsüz kaynak geçişi başlatıldı: ${newSrcUrl} (${label})`);

    // VHS ABR ve Tampon hedeflerini en yüksek seviyeye ayarla
    if (player.tech_ && player.tech_.vhs) {
      player.tech_.vhs.bandwidth = 99999999;
      if (player.tech_.vhs.masterPlaylistController_) {
        player.tech_.vhs.masterPlaylistController_.fastQualityChange_ = true;
      }
      player.tech_.vhs.GOAL_BUFFER_LENGTH = 30;
      player.tech_.vhs.MAX_GOAL_BUFFER_LENGTH = 60;
    }

    if (typeof player.src === 'function') {
      player.src({ src: newSrcUrl, type: 'application/x-mpegURL' });
    }

    let resumed = false;
    const resumePlayback = () => {
      if (resumed) return;
      resumed = true;
      if (smoothSwitchInterval) clearInterval(smoothSwitchInterval);
      if (smoothSwitchTimeout) clearTimeout(smoothSwitchTimeout);

      if (!wasPaused && typeof player.play === 'function') {
        player.play().catch(() => {});
      }
      showToast(`✅ ${label} Kilitlendi (Akıcı Oynatılıyor)`);
      addDiagnosticLog('INFO', `[BufferEngine] Tampon hazırlandı, oynatma sürdürülüyor: ${label}`);
    };

    // Global Emniyet Zamanlayıcısı (Event tetiklenmese bile 2 saniyede başlat)
    smoothSwitchTimeout = setTimeout(() => {
      resumePlayback();
    }, 2000);

    if (typeof player.one === 'function') {
      player.one('loadedmetadata', () => {
        if (curTime > 0 && typeof player.currentTime === 'function') {
          player.currentTime(curTime);
        }

        // Segment tamponunun en az 1.2s - 1.5s dolmasını kontrol et
        smoothSwitchInterval = setInterval(() => {
          if (video && video.buffered && video.buffered.length > 0) {
            for (let i = 0; i < video.buffered.length; i++) {
              if (video.buffered.start(i) <= curTime && video.buffered.end(i) >= curTime + 1.2) {
                resumePlayback();
                return;
              }
            }
          }
        }, 150);
      });
    }
  }

  // =========================================================================
  // 🧩 MODÜLER ADAPTÖR MİMARİSİ
  // =========================================================================

  /**
   * 1. PuhuTV Adaptörü (Video.js VHS Master + Akamai & Medianova MNCDN Interceptor)
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
          player.tech_.vhs.GOAL_BUFFER_LENGTH = 30;
        }
        if (player.tech_ && player.tech_.hls) {
          player.tech_.hls.bandwidth = 99999999;
        }
      } catch (e) {}
    },

    getQualities(video, player) {
      const results = [];
      const seenHeights = new Set();

      let currentSrcUrl = '';
      if (player && typeof player.currentSrc === 'function') currentSrcUrl = player.currentSrc();
      if (!currentSrcUrl && video) currentSrcUrl = video.currentSrc || video.src || '';

      // A. VHS Master Playlists (Akamai veya Medianova SMIL master playlist)
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

      // B. Video.js qualityLevels()
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

      // C. Medianova MNCDN Akışı Aktifse ve HLS playlist henüz parsing aşamasındaysa: Standart 5 SMIL profilini listele
      if (results.length === 0 && currentSrcUrl && currentSrcUrl.includes('mncdn.com') && currentSrcUrl.includes('.smil')) {
        return [
          { id: 'puhu_mn_1080', label: '1080p (FHD)', height: 1080, mediaTag: 'media-4', smilTag: '1080p.smil' },
          { id: 'puhu_mn_720', label: '720p (HD)', height: 720, mediaTag: 'media-3', smilTag: '720p.smil' },
          { id: 'puhu_mn_576', label: '576p (PAL)', height: 576, mediaTag: 'media-3', smilTag: '576p.smil' },
          { id: 'puhu_mn_480', label: '480p (SD)', height: 480, mediaTag: 'media-2', smilTag: '480p.smil' },
          { id: 'puhu_mn_360', label: '360p (Düşük)', height: 360, mediaTag: 'media-1', smilTag: '360p.smil' }
        ];
      }

      return results.sort((a, b) => (b.height || 0) - (a.height || 0));
    },

    applyQuality(targetItem, video, player) {
      puhuFallbackAttempted = false;

      // 1. Akamai / Medianova Hedef Seviyelerini ata
      if (targetItem.mediaTag) {
        targetPuhuMediaLevel = targetItem.mediaTag;
      }
      if (targetItem.smilTag) {
        targetPuhuSmilLevel = targetItem.smilTag;
      }

      addDiagnosticLog('INFO', `[PuhuTvAdapter] Hedef kalite seçildi: ${targetItem.label}`);
      this.lockAbrBandwidth(player);

      // 2. Akış URL kontrolü
      let currentSrcUrl = '';
      if (player && typeof player.currentSrc === 'function') currentSrcUrl = player.currentSrc();
      if (!currentSrcUrl && video) currentSrcUrl = video.currentSrc || video.src || '';

      // 3. Eğer kullanıcı 1080p seçtiyse ve mevcut akış Akamai ise, doğrudan MNCDN 1080p'ye geçir
      if (targetItem.height >= 1000 && !currentSrcUrl.includes('mncdn.com')) {
        switchToPuhuMncdnDirectly(video, player);
        return true;
      }

      // 4. Video.js qualityLevels Güvenli Kilit (Standart Non-Destructive ABR Switch)
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
          }
        } catch (e) {}
      }

      // 5. VHS Fast Quality Change & Bandwidth Lock
      if (player && player.tech_ && player.tech_.vhs) {
        try {
          if (player.tech_.vhs.masterPlaylistController_) {
            player.tech_.vhs.masterPlaylistController_.fastQualityChange_ = true;
          }
        } catch (e) {}
      }

      // 6. Anti-Stall Oynatıcı Nöbetçisi (Donma Önleme & Canlandırma)
      if (video && !video.paused) {
        const stallCheckTime = video.currentTime;
        setTimeout(() => {
          if (video && !video.paused && video.currentTime === stallCheckTime && video.readyState < 3) {
            addDiagnosticLog('INFO', '[PuhuTvAdapter] Donma önleme nöbetçisi akışı canlandırdı.');
            try {
              video.currentTime += 0.01;
            } catch (e) {}
          }
        }, 900);
      }

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

    checkAdFastForward(video) {
      if (!video || !window.location.hostname.includes('kick.com')) return;

      const adSelectors = [
        '[data-testid="ad-badge"]',
        '[class*="ad-overlay"]',
        '[class*="ad-badge"]',
        '[class*="ad-banner"]',
        '[class*="advertisement"]',
        '[class*="ad-indicator"]',
        '[id*="ad-player"]',
        '.video-ad-overlay',
        '[aria-label*="Ad "]',
        '[aria-label*="Reklam"]'
      ];

      let hasAd = adSelectors.some(sel => !!document.querySelector(sel));

      if (!hasAd) {
        const candidates = Array.from(document.querySelectorAll('#channel-player div, .player-container div, .relative.flex-1 div'));
        for (const el of candidates) {
          if (el.children.length === 0 && el.textContent) {
            const txt = el.textContent.trim().toLowerCase();
            if (txt.startsWith('ad ') || txt.includes('commercial in progress') || txt === 'reklam' || txt.startsWith('reklam:')) {
              hasAd = true;
              break;
            }
          }
        }
      }

      if (hasAd && !this.isKickAdActive) {
        this.isKickAdActive = true;
        this.preKickAdSpeed = video.playbackRate || 1.0;
        this.preKickAdMuted = video.muted;
        
        // Mevcut IVS kalitesini hatırla
        const ivs = this.findIvsPlayer(video);
        if (ivs && typeof ivs.getQuality === 'function') {
          try {
            this.preKickAdQuality = ivs.getQuality();
          } catch (e) {}
        }

        try {
          video.playbackRate = 16.0;
          video.muted = true;
        } catch (e) {}

        // Takılmayı önlemek için reklam kalitesini 360p / 160p seviyesine düşür
        if (ivs && typeof ivs.getQualities === 'function') {
          try {
            if (typeof ivs.setAutoQualityMode === 'function') {
              ivs.setAutoQualityMode(false);
            }
            const qList = ivs.getQualities();
            if (Array.isArray(qList) && qList.length > 0) {
              const lowQ = qList.find(q => (q.height && q.height <= 360) || (q.name && (q.name.includes('360') || q.name.includes('160')))) || qList[qList.length - 1];
              if (lowQ && typeof ivs.setQuality === 'function') {
                ivs.setQuality(lowQ);
                addDiagnosticLog('INFO', `[KickAdapter] Reklam hızlandırmada tampon koruması: Kalite ${lowQ.name || lowQ.height + 'p'} seviyesine çekildi.`);
              }
            }
          } catch (e) {
            this.triggerKickUiQuality('360p');
          }
        } else {
          this.triggerKickUiQuality('360p');
        }

        showToast('⚡ Kick Reklamı Algılandı: 16x Hız + 360p Tampon Koruması & Mute Devrede');
        addDiagnosticLog('INFO', '[KickAdapter] Canlı reklam tespit edildi: 16x hızlandırma, 360p düşük profil ve ses kapalı devrede.');
      } else if (!hasAd && this.isKickAdActive) {
        this.isKickAdActive = false;
        try {
          video.playbackRate = this.preKickAdSpeed || 1.0;
          video.muted = this.preKickAdMuted;
        } catch (e) {}

        // Orijinal yayına dönünce önceki kaliteyi geri yükle
        const ivs = this.findIvsPlayer(video);
        if (ivs && this.preKickAdQuality && typeof ivs.setQuality === 'function') {
          try {
            ivs.setQuality(this.preKickAdQuality);
            addDiagnosticLog('INFO', `[KickAdapter] Reklam bitti: Orijinal IVS kalitesi (${this.preKickAdQuality.name || 'HD'}) geri yüklendi.`);
          } catch (e) {}
        } else if (activeForcedQualityLabel) {
          this.triggerKickUiQuality(activeForcedQualityLabel);
        }

        showToast('✅ Reklam Bitti: Normal Canlı Yayına ve Orijinal Kaliteye Dönüldü');
        addDiagnosticLog('INFO', `[KickAdapter] Reklam sona erdi: Oynatma hızı (${this.preKickAdSpeed}x), ses seviyesi ve kalite geri yüklendi.`);
      }
    },

    isKickAdActive: false,
    preKickAdSpeed: 1.0,
    preKickAdMuted: false,
    preKickAdQuality: null,

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
      if (HOSTNAME.includes('kick.com')) {
        KickAdapter.checkAdFastForward(video);
      }
    });
    handleResize();

    // Kick.com için periyodik reklam izleyici
    if (HOSTNAME.includes('kick.com')) {
      setInterval(() => {
        KickAdapter.checkAdFastForward(video);
      }, 750);
    }
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
      const hdrBadge = document.getElementById('pvc-hdr-speed-badge');
      if (slider) slider.value = validRate.toString();
      if (label) label.textContent = `${validRate}x`;
      if (hdrBadge) hdrBadge.textContent = `${validRate}x`;

      showToast(`Hız: ${validRate}x`);
      addDiagnosticLog('INFO', `[Speed] Oynatma hızı ayarlandı: ${validRate}x`);
      return true;
    } catch (err) {
      addDiagnosticLog('ERROR', '[Speed] Hız ayarlanamadı', err.message);
      return false;
    }
  }

  /**
   * Web Audio API Ses Yükseltici (%0 - %200) ve Mono/Stereo Yönlendiricisi
   */
  function initAudioGraphForVideo(video) {
    if (!video) return null;
    try {
      if (!audioContextInstance) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        audioContextInstance = new AudioCtx();
      }

      if (audioContextInstance.state === 'suspended') {
        audioContextInstance.resume().catch(() => {});
      }

      let source = audioSourceElementMap.get(video);
      if (!source) {
        try {
          source = audioContextInstance.createMediaElementSource(video);
          audioSourceElementMap.set(video, source);
        } catch (e) {
          // Zaten bağlanmış olabilir
          return { ctx: audioContextInstance, gainNode: audioGainNodeInstance };
        }
      }

      if (!audioGainNodeInstance) {
        audioGainNodeInstance = audioContextInstance.createGain();
      }
      if (!audioSplitterNodeInstance) {
        audioSplitterNodeInstance = audioContextInstance.createChannelSplitter(2);
      }
      if (!audioMergerNodeInstance) {
        audioMergerNodeInstance = audioContextInstance.createChannelMerger(2);
      }

      // Bağlantıyı yeniden yapılandır
      applyAudioGraphRouting(source);
      return { ctx: audioContextInstance, gainNode: audioGainNodeInstance };
    } catch (err) {
      addDiagnosticLog('WARN', '[WebAudio] Audio graph başlatılamadı', err.message);
      return null;
    }
  }

  function applyAudioGraphRouting(sourceNode) {
    if (!audioContextInstance || !audioGainNodeInstance) return;
    const { video } = findVideoAndPlayer();
    const source = sourceNode || (video ? audioSourceElementMap.get(video) : null);
    if (!source) return;

    try {
      source.disconnect();
      audioGainNodeInstance.disconnect();
      if (audioSplitterNodeInstance) audioSplitterNodeInstance.disconnect();
      if (audioMergerNodeInstance) audioMergerNodeInstance.disconnect();

      if (currentAudioMode === 'mono' && audioSplitterNodeInstance && audioMergerNodeInstance) {
        // Mono Modu: Sol ve Sağ kanalları birleştirip her iki kulağa eşit dağıt
        source.connect(audioSplitterNodeInstance);
        audioSplitterNodeInstance.connect(audioMergerNodeInstance, 0, 0); // Sol -> Sol
        audioSplitterNodeInstance.connect(audioMergerNodeInstance, 0, 1); // Sol -> Sağ
        audioSplitterNodeInstance.connect(audioMergerNodeInstance, 1, 0); // Sağ -> Sol
        audioSplitterNodeInstance.connect(audioMergerNodeInstance, 1, 1); // Sağ -> Sağ
        audioMergerNodeInstance.connect(audioGainNodeInstance);
      } else {
        // Stereo Modu: Doğal 2 kanallı geçiş
        source.connect(audioGainNodeInstance);
      }

      audioGainNodeInstance.connect(audioContextInstance.destination);
    } catch (e) {
      addDiagnosticLog('WARN', '[WebAudio] Routing hatası', e.message);
    }
  }

  function setAudioVolume(percent) {
    const { video } = findVideoAndPlayer();
    const validPercent = Math.max(0, Math.min(200, Math.round(percent)));
    currentAudioVolumePercent = validPercent;

    // Normal %0 - %100 arası video.volume ve muted kontrolü
    if (video) {
      if (validPercent === 0) {
        video.muted = true;
        video.volume = 0;
      } else {
        video.muted = false;
        video.volume = Math.min(1.0, validPercent / 100);
      }
    }

    // %100 - %200 arası Web Audio API GainNode yükseltmesi (Booster)
    const graph = video ? initAudioGraphForVideo(video) : null;
    if (audioGainNodeInstance && audioContextInstance) {
      if (audioContextInstance.state === 'suspended') {
        audioContextInstance.resume().catch(() => {});
      }
      const gainMultiplier = validPercent > 100 ? (validPercent / 100) : 1.0;
      audioGainNodeInstance.gain.setValueAtTime(gainMultiplier, audioContextInstance.currentTime);
    }

    // UI Güncelle
    const slider = document.getElementById('pvc-volume-slider');
    const valBadge = document.getElementById('pvc-volume-value');
    const hdrBadge = document.getElementById('pvc-hdr-volume-badge');
    if (slider) slider.value = validPercent.toString();
    if (valBadge) valBadge.textContent = `${validPercent}%`;
    if (hdrBadge) hdrBadge.textContent = `${validPercent}%`;

    const boostMsg = validPercent > 100 ? ` (🚀 +${validPercent - 100}% Güçlendirici)` : '';
    showToast(`Ses: %${validPercent}${boostMsg}`);
    addDiagnosticLog('INFO', `[Audio] Ses ayarlandı: %${validPercent} (Mode: ${currentAudioMode})`);
  }

  function setAudioMode(mode) {
    if (mode !== 'stereo' && mode !== 'mono') return;
    currentAudioMode = mode;
    const { video } = findVideoAndPlayer();
    if (video) {
      initAudioGraphForVideo(video);
      applyAudioGraphRouting();
    }

    const stereoBtn = document.getElementById('pvc-audio-stereo-btn');
    const monoBtn = document.getElementById('pvc-audio-mono-btn');
    const hdrBadge = document.getElementById('pvc-hdr-audio-badge');

    if (stereoBtn) stereoBtn.className = `pvc-audio-mode-btn ${mode === 'stereo' ? 'pvc-audio-active' : ''}`;
    if (monoBtn) monoBtn.className = `pvc-audio-mode-btn ${mode === 'mono' ? 'pvc-audio-active' : ''}`;
    if (hdrBadge) hdrBadge.textContent = mode.toUpperCase();

    showToast(`Ses Modu: ${mode === 'mono' ? '🎛️ Mono (Tek Kanal Birleşik)' : '🎧 Stereo (Çift Kanal)'}`);
    addDiagnosticLog('INFO', `[Audio] Kanal modu ayarlandı: ${mode}`);
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
        mncdnBtn.title = 'PuhuTV Medianova sunucusundan 1080p FHD akışını almak için doğrudan video kaynağını günceller veya sayfayı yeniler';
        mncdnBtn.onclick = async () => {
          const { video, player } = findVideoAndPlayer();
          await switchToPuhuMncdnDirectly(video, player);
        };
        container.appendChild(mncdnBtn);
      }
    }
  }

  async function switchToPuhuMncdnDirectly(video, player) {
    showToast('🚀 1080p FHD MNCDN akışı aranıyor...');
    addDiagnosticLog('INFO', '[PuhuTvAdapter] MNCDN 1080p doğrudan geçiş tetiklendi');

    try {
      // 1. Canlı yakalanan DYG Video API URL'si varsa doğrudan kullan
      if (lastCapturedDygApiUrl) {
        const mnApiUrl = lastCapturedDygApiUrl.replace('akamai=true', 'akamai=false');
        addDiagnosticLog('INFO', `[PuhuTvAdapter] Canlı yakalanan DYG API çağrılıyor: ${sanitizeStreamUrl(mnApiUrl)}`);
        const res = await fetch(mnApiUrl, { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          const videoUrl = json && json.data && (json.data.video_url || json.data.hls_url || (json.data.files && json.data.files[0] && json.data.files[0].url));
          if (videoUrl && videoUrl.includes('mncdn.com')) {
            const mncdn1080Url = videoUrl.replace(/\d+p\.smil/i, '1080p.smil');
            targetPuhuSmilLevel = '1080p.smil';
            smoothPlayerSourceSwitch(player, video, mncdn1080Url, '1080p FHD (MNCDN)');
            activeForcedQualityId = 'puhu_mn_1080';
            activeForcedQualityLabel = '1080p (FHD)';
            renderDynamicQualityButtons();
            return;
          }
        }
      }

      // 2. ReferenceId tespit et (Next.js, Player options veya DOM)
      let refId = '';
      if (window.__NEXT_DATA__ && window.__NEXT_DATA__.props && window.__NEXT_DATA__.props.pageProps) {
        const pp = window.__NEXT_DATA__.props.pageProps;
        if (pp.video && pp.video.referenceId) refId = pp.video.referenceId;
        else if (pp.episode && pp.episode.referenceId) refId = pp.episode.referenceId;
        else if (pp.data && pp.data.referenceId) refId = pp.data.referenceId;
      }

      if (!refId && player && player.options_) {
        const opts = player.options_;
        if (opts.referenceId) refId = opts.referenceId;
      }

      if (!refId) {
        const el = document.querySelector('[data-reference-id], [data-video-id]');
        if (el) refId = el.getAttribute('data-reference-id') || el.getAttribute('data-video-id') || '';
      }

      if (refId && player) {
        const apiUrl = `https://dygvideo.dygdigital.com/api/video_info?akamai=false&PublisherId=29&ReferenceId=${encodeURIComponent(refId)}&SecretKey=NtvApiSecret2014*`;
        const res = await fetch(apiUrl, { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          const videoUrl = json && json.data && (json.data.video_url || json.data.hls_url || (json.data.files && json.data.files[0] && json.data.files[0].url));
          if (videoUrl && videoUrl.includes('mncdn.com')) {
            const mncdn1080Url = videoUrl.replace(/\d+p\.smil/i, '1080p.smil');
            targetPuhuSmilLevel = '1080p.smil';
            smoothPlayerSourceSwitch(player, video, mncdn1080Url, '1080p FHD (MNCDN)');
            activeForcedQualityId = 'puhu_mn_1080';
            activeForcedQualityLabel = '1080p (FHD)';
            renderDynamicQualityButtons();
            return;
          }
        }
      }
    } catch (err) {
      addDiagnosticLog('WARN', '[PuhuTvAdapter] MNCDN API doğrudan geçişi başarısız oldu, sayfa yenilenecek', err.message);
    }

    // Fallback: Doğrudan API yanıt vermezse sayfayı kancayla yenile
    showToast('1080p FHD MNCDN akışı için sayfa yenileniyor...');
    setTimeout(() => {
      window.location.reload();
    }, 400);
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
   * Zenginleştirilmiş Anonim Hata & Teşhis Paketi (v0.3.5 Sürüm ve Telemetri Takibi)
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

    const streamCdnProvider = capturedSampleUrl.includes('mncdn.com') 
      ? 'Medianova (MNCDN)' 
      : (capturedSampleUrl.includes('akamaized.net') ? 'Akamai' : 'Diğer / Doğrudan');

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
      extensionVersion: EXTENSION_VERSION,
      versionHistory: VERSION_HISTORY,
      errorCode: errorCode || 'USER_MANUAL_DIAGNOSTIC',
      cleanMessage: message ? sanitizeStreamUrl(message) : 'Kullanıcı teşhis ve hata bildirimini tetikledi.',
      streamCdnProvider,
      streamSampleUrl: sanitizeStreamUrl(capturedSampleUrl),
      lastCapturedDygApiUrl: lastCapturedDygApiUrl ? sanitizeStreamUrl(lastCapturedDygApiUrl) : null,
      playerType,
      activeAdapter: currentActiveAdapterName,
      domain: cleanHostname,
      activeForcedQuality: activeForcedQualityLabel || 'Otomatik',
      discoveredQualitiesCount: cachedDiscoveredQualities.length,
      discoveredQualities: cachedDiscoveredQualities.map(q => ({ label: q.label, height: q.height, id: q.id })),
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
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Zenginleştirilmiş Teşhis ve Sürüm Raporu');
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Zenginleştirilmiş Teşhis & Sürüm Raporu (v0.3.7)</span>
          <button id="pvc-close-modal-btn" aria-label="Raporu Kapat">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Sitede (<strong>${payload.domain}</strong>) oynatıcı durumu, CDN telemetrisi ve sürüm geçmişi anonimleştirilerek toplandı (<strong>Sıfır Kişisel Veri</strong>):
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
          <button id="pvc-copy-payload-btn" class="pvc-modal-btn-secondary" aria-label="JSON Kodunu Panoya Kopyala">📋 JSON Kopyala</button>
          <a id="pvc-send-mail-link" href="#" target="_blank" class="pvc-modal-btn-primary" style="background:#2563eb;" aria-label="E-posta İle Gönder">✉️ E-posta İle Gönder</a>
          <a id="pvc-open-github-link" href="#" target="_blank" class="pvc-modal-btn-primary" style="background:#4f46e5;" aria-label="GitHub Issue Aç">🐙 GitHub Issue Aç</a>
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

      const issueTitle = encodeURIComponent(`[Teşhis/v0.3.7]: ${payload.domain} - ${payload.errorCode}`);
      const compactSummary = encodeURIComponent(
        `### Anonim Teşhis Özeti (v0.3.7)\n` +
        `- **Domain:** ${payload.domain}\n` +
        `- **Adaptör:** ${payload.activeAdapter}\n` +
        `- **CDN Sağlayıcı:** ${payload.streamCdnProvider}\n` +
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
    popup.setAttribute('role', 'region');
    popup.setAttribute('aria-label', 'NOk Video Controller Denetim Masası');
    popup.setAttribute('tabindex', '0');

    popup.innerHTML = `
      <div id="pvc-drag-header" class="pvc-menu-header" title="Sürüklemek için basılı tutun (Normal modda sağ raya kilitli dikey kayar)">
        <div class="pvc-menu-brand">
          <span class="pvc-menu-badge">NOkrep v0.3.8</span>
          <span class="pvc-menu-title">NOk Video Controller</span>
        </div>
        <div class="pvc-header-actions">
          <button id="pvc-collapse-btn" class="pvc-icon-btn" title="Paneli Küçült / Büyüt" aria-label="Paneli Küçült veya Büyüt">➖</button>
          <button id="pvc-close-popup-btn" class="pvc-icon-btn pvc-close" title="Kapat" aria-label="Denetim Masasını Kapat">✕</button>
        </div>
      </div>

      <!-- Canlı Render Çözünürlüğü Rozeti (Küçültme modunda da her zaman tam metinle korunur) -->
      <div id="pvc-realtime-res-container" style="padding: 7px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: space-between; border-radius: 6px; margin-bottom: 8px; box-shadow: inset 0 1px 4px rgba(0,0,0,0.5);">
        <span id="pvc-realtime-res-badge" style="font-size: 11px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, monospace; color: #38bdf8; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;" aria-live="polite">
          🎬 Gerçek: Ölçülüyor...
        </span>
        <button id="pvc-refresh-res-btn" style="background: none; border: none; color: #94a3b8; font-size: 12px; cursor: pointer; padding: 2px 4px; border-radius: 4px; transition: color 0.15s ease;" title="Çözünürlük ve Paketleri Yenile" aria-label="Çözünürlük ve Paketleri Yenile">🔄</button>
      </div>

      <!-- 1. BÖLÜM: Oynatma Hızı & Sarma (Akordeon) -->
      <div class="pvc-menu-section" id="pvc-section-speed">
        <div class="pvc-section-header" data-target="pvc-content-speed" title="Daraltmak veya genişletmek için tıklayın">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">⚡ Oynatma Hızı & Sarma</span>
          </div>
          <span id="pvc-hdr-speed-badge" class="pvc-val-badge">1.0x</span>
        </div>
        <div id="pvc-content-speed" class="pvc-section-content">
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
              aria-label="Oynatma Hızı Kaydırıcı"
            />
            <span class="pvc-slider-bound">3.0x</span>
          </div>
          <div class="pvc-quick-speed-buttons">
            <button class="pvc-chip-btn" data-speed="1.0" aria-label="1x Hız">1x</button>
            <button class="pvc-chip-btn" data-speed="1.25" aria-label="1.25x Hız">1.25x</button>
            <button class="pvc-chip-btn" data-speed="1.5" aria-label="1.5x Hız">1.5x</button>
            <button class="pvc-chip-btn" data-speed="2.0" aria-label="2x Hız">2x</button>
            <button class="pvc-chip-btn" data-speed="2.5" aria-label="2.5x Hız">2.5x</button>
          </div>
          <div class="pvc-btn-grid-2" style="margin-top: 6px;">
            <button id="pvc-seek-m10" class="pvc-action-btn" aria-label="10 Saniye Geri Sar">⏪ -10 Saniye</button>
            <button id="pvc-seek-p10" class="pvc-action-btn" aria-label="10 Saniye İleri Sar">⏩ +10 Saniye</button>
          </div>
        </div>
      </div>

      <!-- 2. BÖLÜM: Ses Düzeyi & Stereo/Mono (Akordeon) -->
      <div class="pvc-menu-section" id="pvc-section-audio">
        <div class="pvc-section-header" data-target="pvc-content-audio" title="Daraltmak veya genişletmek için tıklayın">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">🔊 Ses Seviyesi & Kanallar</span>
          </div>
          <div style="display: flex; gap: 4px; align-items: center;">
            <span id="pvc-hdr-audio-badge" class="pvc-val-badge" style="color: #a78bfa; background: rgba(167,139,250,0.12); border-color: rgba(167,139,250,0.3);">STEREO</span>
            <span id="pvc-hdr-volume-badge" class="pvc-val-badge">100%</span>
          </div>
        </div>
        <div id="pvc-content-audio" class="pvc-section-content">
          <div class="pvc-slider-row">
            <span class="pvc-slider-bound">%0</span>
            <input 
              type="range" 
              id="pvc-volume-slider" 
              min="0" 
              max="200" 
              step="5" 
              value="100" 
              class="pvc-range-slider"
              aria-label="Ses Seviyesi ve Yükseltici Kaydırıcı"
            />
            <span class="pvc-slider-bound" style="color: #38bdf8;">%200 🚀</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <div class="pvc-quick-speed-buttons" style="flex: 1; margin-right: 8px;">
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="0" aria-label="Sessiz (%0)">%0</button>
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="50" aria-label="Yarım Ses (%50)">%50</button>
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="100" aria-label="Normal Ses (%100)">%100</button>
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="150" aria-label="Yükseltilmiş Ses (%150)">%150</button>
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="200" aria-label="Maksimum Ses (%200)">%200</button>
            </div>
            <div style="display: flex; gap: 4px;">
              <button id="pvc-audio-stereo-btn" class="pvc-audio-mode-btn pvc-audio-active" title="Stereo (Doğal Çift Kanal)" aria-label="Stereo Ses Modu">🎧 Stereo</button>
              <button id="pvc-audio-mono-btn" class="pvc-audio-mode-btn" title="Mono (Tek Kulaklık / Birleşik Kanal)" aria-label="Mono Ses Modu">🎛️ Mono</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. BÖLÜM: Akış Paket Kaliteleri (Akordeon) -->
      <div class="pvc-menu-section" id="pvc-section-quality">
        <div class="pvc-section-header" data-target="pvc-content-quality" title="Daraltmak veya genişletmek için tıklayın">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">🎬 Akış Paket Kaliteleri</span>
          </div>
          <span id="pvc-quality-count-badge" class="pvc-val-badge" style="color: #38bdf8;" aria-live="polite">Paketler...</span>
        </div>
        <div id="pvc-content-quality" class="pvc-section-content">
          <div id="pvc-dynamic-quality-container" class="pvc-dynamic-grid" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;" role="group" aria-label="Kalite Seçenekleri">
            <!-- Dinamik Butonlar renderDynamicQualityButtons ile basılır -->
          </div>
        </div>
      </div>

      <!-- 4. BÖLÜM: Saydamlık Gecikmesi (Akordeon) -->
      <div class="pvc-menu-section" id="pvc-section-idle">
        <div class="pvc-section-header" data-target="pvc-content-idle" title="Daraltmak veya genişletmek için tıklayın">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">⏱️ Saydamlık Gecikmesi</span>
          </div>
          <span id="pvc-idle-delay-val" class="pvc-val-badge" style="color:#a78bfa; background:rgba(167,139,250,0.15); border-color:rgba(167,139,250,0.3);">${idleDelaySeconds}s</span>
        </div>
        <div id="pvc-content-idle" class="pvc-section-content">
          <div class="pvc-quick-speed-buttons">
            <button class="pvc-chip-btn pvc-idle-btn" data-sec="2" aria-label="2 Saniye Saydamlık Gecikmesi">2sn</button>
            <button class="pvc-chip-btn pvc-idle-btn" data-sec="3" aria-label="3 Saniye Saydamlık Gecikmesi">3sn</button>
            <button class="pvc-chip-btn pvc-idle-btn" data-sec="4" aria-label="4 Saniye Saydamlık Gecikmesi">4sn</button>
            <button class="pvc-chip-btn pvc-idle-btn" data-sec="5" aria-label="5 Saniye Saydamlık Gecikmesi">5sn</button>
          </div>
        </div>
      </div>

      <!-- Footer: Ping ve Hata Raporu (Küçültme modunda da her zaman görünür) -->
      <div class="pvc-menu-footer" id="pvc-menu-footer">
        <button id="pvc-ping-btn" class="pvc-footer-btn pvc-btn-emerald" title="Sunucu gecikmesini ölç" aria-label="Sunucu CDN Gecikmesini Ölç">📡 CDN Ping</button>
        <button id="pvc-report-err-btn" class="pvc-footer-btn pvc-btn-amber" title="Zenginleştirilmiş teşhis paketini aç" aria-label="Anonim Teşhis ve Hata Raporunu Aç">⚠️ Teşhis / Hata</button>
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

    // Akordeon Başlık Tıklama Olayları
    popup.querySelectorAll('.pvc-section-header').forEach(header => {
      header.addEventListener('click', (e) => {
        resetIdleTimer(popup);
        const section = header.closest('.pvc-menu-section');
        if (section) {
          section.classList.toggle('pvc-section-collapsed');
        }
      });
    });

    // Hız Slider ve Preset Butonları
    const speedSlider = popup.querySelector('#pvc-speed-slider');
    const speedVal = popup.querySelector('#pvc-speed-value');

    speedSlider.addEventListener('input', (e) => {
      resetIdleTimer(popup);
      const val = parseFloat(e.target.value);
      if (speedVal) speedVal.textContent = `${val}x`;
      setSpeed(val);
    });

    popup.querySelectorAll('.pvc-chip-btn:not(.pvc-idle-btn):not(.pvc-vol-preset-btn)').forEach(btn => {
      btn.onclick = () => {
        resetIdleTimer(popup);
        const val = parseFloat(btn.getAttribute('data-speed'));
        setSpeed(val);
      };
    });

    // Ses Slider ve Preset Butonları
    const volumeSlider = popup.querySelector('#pvc-volume-slider');
    volumeSlider.addEventListener('input', (e) => {
      resetIdleTimer(popup);
      const val = parseInt(e.target.value, 10);
      setAudioVolume(val);
    });

    popup.querySelectorAll('.pvc-vol-preset-btn').forEach(btn => {
      btn.onclick = () => {
        resetIdleTimer(popup);
        const val = parseInt(btn.getAttribute('data-vol'), 10);
        setAudioVolume(val);
      };
    });

    // Stereo / Mono Butonları
    const stereoBtn = popup.querySelector('#pvc-audio-stereo-btn');
    const monoBtn = popup.querySelector('#pvc-audio-mono-btn');
    stereoBtn.onclick = () => {
      resetIdleTimer(popup);
      setAudioMode('stereo');
    };
    monoBtn.onclick = () => {
      resetIdleTimer(popup);
      setAudioMode('mono');
    };

    // Sarma Butonları
    popup.querySelector('#pvc-seek-m10').onclick = () => {
      resetIdleTimer(popup);
      seekBy(-10);
    };

    popup.querySelector('#pvc-seek-p10').onclick = () => {
      resetIdleTimer(popup);
      seekBy(10);
    };

    // Saydamlık Gecikmesi Butonları
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

    // Çözünürlük Yenileme
    popup.querySelector('#pvc-refresh-res-btn').onclick = () => {
      resetIdleTimer(popup);
      updateRealtimeResolutionBadge();
      renderDynamicQualityButtons();
      showToast(`🎬 Güncellendi: ${lastObservedResolution}`);
    };

    // Ping ve Teşhis
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

    // Genel Küçültme (➖ / ➕):
    // Kullanıcı talebi doğrultusunda: Küçültüldüğünde akordeon bölümleri gizlenir;
    // Çözünürlük rozeti (metin eksiksiz görünür), Ping ve Hata bölümleri görünmeye devam eder.
    let isCollapsed = false;
    popup.querySelector('#pvc-collapse-btn').onclick = () => {
      resetIdleTimer(popup);
      isCollapsed = !isCollapsed;
      popup.classList.toggle('pvc-collapsed', isCollapsed);
      
      // Sadece 4 ana ayar bölümünü gizle, çözünürlük rozeti ve footer'ı açık tut
      popup.querySelectorAll('.pvc-menu-section').forEach(el => {
        el.style.display = isCollapsed ? 'none' : '';
      });

      popup.querySelector('#pvc-collapse-btn').textContent = isCollapsed ? '➕' : '➖';
      updateRealtimeResolutionBadge();
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
        const hdrSpeed = popup.querySelector('#pvc-hdr-speed-badge');
        if (slider) slider.value = (video.playbackRate || 1.0).toString();
        if (speedVal) speedVal.textContent = `${video.playbackRate || 1.0}x`;
        if (hdrSpeed) hdrSpeed.textContent = `${video.playbackRate || 1.0}x`;

        // Ses grafiğini ve başlangıç ses seviyesini bağla
        initAudioGraphForVideo(video);
      }
      showToast('NOk Video Controller Aktif (v0.3.8)');
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
