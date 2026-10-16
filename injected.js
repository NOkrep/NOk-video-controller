/**
 * injected.js - NOk Video Controller v0.5.2 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage KULLANILMAZ.
 * 
 * v0.5.2 İyileştirmeleri & Yeni Modüller:
 * 1. İzole Klavye Kısayolları Motoru ([ / ], R, M, Shift+Up/Down, Alt+Q, Alt+P, Ctrl+Shift+S).
 * 2. Görüntü Filtreleri (Parlaklık, Kontrast, Doygunluk) & Gece Kalkanı / Ters Renk Modülü.
 * 3. Bellek İçi Harici Altyazı (.srt / .vtt) Yükleyici ve ±100ms Senkronizasyon Motoru.
 * 4. Doğrudan Resim İçinde Resim (PiP) Kontrolü.
 * 5. Gelişmiş Küçültülmüş (Collapsed Mini-Pill) Bilgi & Hızlı Kontrol Barı.
 * 6. %300 Web Audio Ses Güçlendirici, Dinamik Kazanç (Gain) Renk Geçişi ve Çift Tıkla Slider Sıfırlama.
 * 7. 2D Mıknatıslı Kenar Hizalama (Magnetic Edge Snapping) ve Viewport Sınır Koruması (Clamping).
 */

(() => {
  const EXTENSION_VERSION = '0.5.2';
  const NOK_LOGO_URL = (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.logoUrl) || '';
  const VERSION_HISTORY = [
    { version: 'v0.5.2', notes: 'İzole klavye kısayolları motoru, görüntü filtreleri ve gece kalkanı modülü, bellek içi .srt/.vtt harici altyazı yükleyici ve ±100ms senkronizasyon, doğrudan PiP kontrolü, küçültülmüş detaylı bilgi barı, %300 ses booster + dinamik renk geçişi + çift tıkla sıfırlama, mıknatıslı kenar hizalama (magnetic edge snapping) ve Manifest V3 service_worker düzeltmesi.' },
    { version: 'v0.5.1', notes: 'Evrensel medya tespiti, Shadow DOM ve Web Component derin BFS tarayıcısı, Widevine/FairPlay DRM korumalı akış güvenli modu (%100 ses kilit koruması), 3-kademeli basamaklı adaptör mimarisi (Cascade Strategy Pipeline), manuel adaptör seçici ve tek tıkla geliştiriciye anonim teşhis bildirme motoru.' },
    { version: 'v0.5.0', notes: 'Kick.com %0/Mute ve tüm ses seviyelerinde (%50/%100/%150) kesintisiz Radix UI & React Slider eşitlemesi, Kick VOD oynatma hızı 2-kademeli açılır pencere (popover submenu) otomasyonu, TRT 1 / TRT İzle HUD tıklama ve olay yakalama izolasyonu.' }
  ];

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === 'PVC_TOGGLE_POPUP' || event.data.type === 'PVC_TOGGLE_UI' || event.data.type === 'NOK_CONTROLLER_TOGGLE') {
      togglePvcPopup();
    } else if (event.data.type === 'PVC_OPEN_POPUP') {
      const popup = document.getElementById('pvc-controller-popup') || buildPvcPopup();
      popup.style.display = 'block';
      clampPopupToViewport(popup);
      resetIdleTimer(popup);
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();
      showToast(`NOk Video Controller Aktif (v${EXTENSION_VERSION})`);
    }
  });

  if (window.__NOK_VIDEO_CONTROLLER_INJECTED__) {
    togglePvcPopup();
    return;
  }
  window.__NOK_VIDEO_CONTROLLER_INJECTED__ = true;

  console.log(`[NOkrep] NOk Video Controller v${EXTENSION_VERSION} aktif.`);

  const GITHUB_REPO_URL = 'https://github.com/NOkrep/NOk-video-controller';
  const DEVELOPER_EMAIL = 'ihsanartrk07@gmail.com';
  const HOSTNAME = window.location.hostname;

  // Bellek içi geçici durumlar (Stateless / In-Memory Only)
  let idleDelaySeconds = 2;
  let idleTimerStep1 = null;
  let idleTimerStep2 = null;
  let activeForcedQualityId = '';
  let activeForcedQualityLabel = '';
  let pendingQualityLabel = '';
  let pendingTimeoutTimer = null;
  let lastObservedResolution = 'Ölçülüyor...';
  let cachedDiscoveredQualities = [];
  let currentActiveAdapterName = 'GenericAdapter';
  let userForcedAdapterName = '';
  let adapterHealthStatus = 'healthy';
  let activeDrmState = { isDrm: false, keySystem: '', label: '' };
  let isMediaInShadowDom = false;
  let targetPuhuMediaLevel = null;
  let targetPuhuSmilLevel = null;
  let puhuFallbackAttempted = false;
  let lastCapturedDygApiUrl = '';

  // Klavye Kısayolları Durumu (In-Memory)
  let hotkeysEnabled = true;

  // Web Audio API State (Ses Yükseltme %0 - %300 & Mono/Stereo)
  let currentAudioVolumePercent = 100;
  let currentAudioMode = 'stereo'; // 'stereo' | 'mono'
  let audioContextInstance = null;
  let audioGainNodeInstance = null;
  let audioSplitterNodeInstance = null;
  let audioMergerNodeInstance = null;
  let audioSourceElementMap = new WeakMap();

  // Görüntü Filtreleri ve Gece Kalkanı Durumu (In-Memory)
  let videoFilterState = {
    brightness: 100, // 50 - 150
    contrast: 100,   // 50 - 150
    saturate: 100,   // 0 - 200
    nightShield: false,
    invert: false
  };

  // Bellek İçi Harici Altyazı Durumu (In-Memory)
  let customSubtitleCues = []; // [{ start: number, end: number, text: string }]
  let subtitleOffsetMs = 0;
  let subtitleFileName = '';
  let subtitleOverlayEnabled = true;

  // Amazon IVS Player Global Kanca
  let globalCapturedIvsPlayer = null;

  function hookIvsInstance(player) {
    if (!player || typeof player !== 'object') return player;
    globalCapturedIvsPlayer = player;
    if (typeof player.attachHTMLVideoElement === 'function' && !player.__nokHookedAttach) {
      player.__nokHookedAttach = true;
      const origAttach = player.attachHTMLVideoElement;
      player.attachHTMLVideoElement = function (videoEl, ...args) {
        if (videoEl) videoEl.__ivsPlayer = this;
        globalCapturedIvsPlayer = this;
        addDiagnosticLog('INFO', '[KickAdapter] IVS player.attachHTMLVideoElement yakalandı.');
        return origAttach.apply(this, [videoEl, ...args]);
      };
    }
    return player;
  }

  try {
    const hookIvsSdk = () => {
      if (window.IVSPlayer && typeof window.IVSPlayer.create === 'function' && !window.IVSPlayer.__nokHooked) {
        window.IVSPlayer.__nokHooked = true;
        const origCreate = window.IVSPlayer.create;
        window.IVSPlayer.create = function (...args) {
          const p = origCreate.apply(this, args);
          addDiagnosticLog('INFO', '[KickAdapter] IVSPlayer.create yakalandı.');
          return hookIvsInstance(p);
        };
        if (window.IVSPlayer.prototype && typeof window.IVSPlayer.prototype.attachHTMLVideoElement === 'function' && !window.IVSPlayer.prototype.__nokHooked) {
          window.IVSPlayer.prototype.__nokHooked = true;
          const origProtoAttach = window.IVSPlayer.prototype.attachHTMLVideoElement;
          window.IVSPlayer.prototype.attachHTMLVideoElement = function (videoEl, ...args) {
            if (videoEl) videoEl.__ivsPlayer = this;
            globalCapturedIvsPlayer = this;
            addDiagnosticLog('INFO', '[KickAdapter] IVSPlayer.prototype.attachHTMLVideoElement yakalandı.');
            return origProtoAttach.apply(this, [videoEl, ...args]);
          };
        }
      }
      if (window.AmazonIVS && typeof window.AmazonIVS.createMediaPlayer === 'function' && !window.AmazonIVS.__nokHooked) {
        window.AmazonIVS.__nokHooked = true;
        const origCreate2 = window.AmazonIVS.createMediaPlayer;
        window.AmazonIVS.createMediaPlayer = function (...args) {
          const p = origCreate2.apply(this, args);
          addDiagnosticLog('INFO', '[KickAdapter] AmazonIVS.createMediaPlayer yakalandı.');
          return hookIvsInstance(p);
        };
      }
    };
    hookIvsSdk();
    setInterval(hookIvsSdk, 1500);

    let _rawIVS = window.IVSPlayer;
    try {
      Object.defineProperty(window, 'IVSPlayer', {
        configurable: true,
        enumerable: true,
        get() { return _rawIVS; },
        set(val) {
          _rawIVS = val;
          hookIvsSdk();
        }
      });
    } catch (e) {}
  } catch (e) {}

  // =========================================================================
  // 🌐 ÇİFT CDN VE SMIL / BVR / TRT AĞ KANCASI (XHR / FETCH)
  // =========================================================================
  let targetNowBvrBandwidth = null;
  let lastCapturedNowPlaylistUrl = '';
  let targetTrtQualitySuffix = null;
  let lastCapturedTrtStreamUrl = '';

  function transformStreamRequestUrl(url) {
    if (typeof url !== 'string') return url;

    if (url.includes('dygvideo.dygdigital.com/api/video_info')) {
      lastCapturedDygApiUrl = url;
      addDiagnosticLog('INFO', `[PuhuTvAdapter] DYG Video API yakalandı: ${sanitizeStreamUrl(url)}`);
      if (targetPuhuSmilLevel === '1080p.smil' && url.includes('akamai=true')) {
        const redirectUrl = url.replace('akamai=true', 'akamai=false');
        addDiagnosticLog('INFO', '[PuhuTvAdapter] DYG Video API: 1080p FHD için MNCDN moduna yönlendirildi.');
        return redirectUrl;
      }
    }

    if (url.includes('erbvr.com') || url.includes('ercdn.net')) {
      if (url.includes('.smil/playlist.m3u8') || url.includes('.m3u8')) {
        lastCapturedNowPlaylistUrl = url;
        addDiagnosticLog('INFO', `[NowTvAdapter] ErCDN Playlist yakalandı: ${sanitizeStreamUrl(url)}`);
      }

      if (targetNowBvrBandwidth && (url.includes('bvr_bw=') || url.includes('.ts') || url.includes('.m4s') || url.includes('.mp4'))) {
        if (url.includes('bvr_bw=')) {
          return url.replace(/bvr_bw=\d+/g, `bvr_bw=${targetNowBvrBandwidth}`);
        } else {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}bvr_bw=${targetNowBvrBandwidth}`;
        }
      }
    }

    if (url.includes('cdn-v.pr.trt.com.tr') || url.includes('trt.com.tr') || url.includes('trtizle.com')) {
      if (url.includes('.m3u8') || url.includes('.ts')) {
        lastCapturedTrtStreamUrl = url;
      }
      if (targetTrtQualitySuffix && (url.includes('master') || url.includes('.m3u8') || url.includes('.ts'))) {
        const regex = /master(1080p|720p|576p|480p|360p|240p)?/i;
        if (regex.test(url)) {
          return url.replace(regex, `master${targetTrtQualitySuffix}`);
        }
      }
    }

    return url;
  }

  (function hookNetworkRequests() {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      try {
        if (typeof url === 'string') {
          const transformedUrl = transformStreamRequestUrl(url);
          return originalOpen.call(this, method, transformedUrl, ...rest);
        }
      } catch (e) {}
      return originalOpen.call(this, method, url, ...rest);
    };

    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        if (typeof input === 'string') {
          const transformedUrl = transformStreamRequestUrl(input);
          return originalFetch.call(this, transformedUrl, init);
        } else if (input instanceof Request && input.url) {
          const transformedUrl = transformStreamRequestUrl(input.url);
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
    const subOverlay = document.getElementById('pvc-subtitle-overlay');

    if (popup && popup.parentElement !== activeTarget) {
      activeTarget.appendChild(popup);
      if (document.fullscreenElement) {
        popup.classList.add('pvc-in-fullscreen');
        addDiagnosticLog('INFO', '[Fullscreen] HUD tam ekran kapsayıcısına taşındı.');
      } else {
        popup.classList.remove('pvc-in-fullscreen');
        addDiagnosticLog('INFO', '[Fullscreen] HUD standart body kapsayıcısına döndü.');
      }
      clampPopupToViewport(popup);
    }

    if (toast && toast.parentElement !== activeTarget) {
      activeTarget.appendChild(toast);
    }

    if (subOverlay && subOverlay.parentElement !== activeTarget) {
      activeTarget.appendChild(subOverlay);
    }
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, syncFullscreenElements);
  });

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
      }, 2200);
    } catch (e) {
      console.log('[NOk Toast]', msg);
    }
  }

  // =========================================================================
  // 🛡️ DRM / EME GÜVENLİK VE ŞİFRELEME TESPİT MOTORU (DRM SENTINEL)
  // =========================================================================
  try {
    const origSetMediaKeys = HTMLMediaElement.prototype.setMediaKeys;
    if (origSetMediaKeys && !HTMLMediaElement.prototype.__nokHookedDrm) {
      HTMLMediaElement.prototype.__nokHookedDrm = true;
      HTMLMediaElement.prototype.setMediaKeys = function (mediaKeys) {
        if (mediaKeys) {
          this.__nokHasMediaKeys = true;
          this.__nokKeySystem = mediaKeys.keySystem || 'Widevine/FairPlay EME';
          addDiagnosticLog('WARN', `[DRM Sentinel] setMediaKeys çağrıldı: ${this.__nokKeySystem}`);
          updateDrmHudBadge(this);
        }
        return origSetMediaKeys.apply(this, arguments);
      };
    }
  } catch (e) {}

  document.addEventListener('encrypted', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') {
      e.target.__nokEncryptedEvent = true;
      addDiagnosticLog('WARN', '[DRM Sentinel] encrypted olayı yakalandı (EME şifreleme aktif)');
      updateDrmHudBadge(e.target);
    }
  }, { capture: true, passive: true });

  function detectDrmStatus(video) {
    if (!video) return { isDrm: false, keySystem: 'Yok', label: 'Standart Akış' };
    
    const hasMediaKeys = !!video.mediaKeys || !!video.__nokHasMediaKeys;
    const hasEncrypted = !!video.__nokEncryptedEvent;
    const hasLegacy = !!video.webkitKeys || !!video.msKeys;
    const isDrm = hasMediaKeys || hasEncrypted || hasLegacy;

    let keySystem = 'Yok';
    if (isDrm) {
      if (video.mediaKeys && video.mediaKeys.keySystem) keySystem = video.mediaKeys.keySystem;
      else if (video.__nokKeySystem) keySystem = video.__nokKeySystem;
      else keySystem = 'EME Korumalı (Widevine / FairPlay)';
    }

    const state = {
      isDrm,
      keySystem,
      label: isDrm ? '🛡️ DRM Korumalı Akış' : 'Standart Akış'
    };
    activeDrmState = state;
    return state;
  }

  function updateDrmHudBadge(video) {
    const drmBadge = document.getElementById('pvc-drm-status-badge');
    const drmStatus = detectDrmStatus(video);
    if (!drmBadge) return;
    if (drmStatus.isDrm) {
      drmBadge.style.display = 'block';
      drmBadge.innerHTML = `<span>🛡️ DRM Korumalı Akış (${drmStatus.keySystem})</span>`;
    } else {
      drmBadge.style.display = 'none';
    }
  }

  // =========================================================================
  // 🔍 DERİN MEDYA VE SHADOW DOM TARAYICISI (DEEP BFS MEDIA DISCOVERY)
  // =========================================================================
  function deepFindMediaElements() {
    const discovered = [];
    const visitedShadowRoots = new Set();

    function traverse(node, inShadow = false) {
      if (!node) return;

      if (node.nodeType === 1 && node.tagName === 'VIDEO') {
        discovered.push({
          video: node,
          isShadow: inShadow,
          parent: node.parentElement || node.parentNode
        });
      }

      if (node.shadowRoot && !visitedShadowRoots.has(node.shadowRoot)) {
        visitedShadowRoots.add(node.shadowRoot);
        traverse(node.shadowRoot, true);
      }

      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          traverse(node.children[i], inShadow);
        }
      }

      if (node.nodeType === 1 && (node.tagName === 'IFRAME' || node.tagName === 'FRAME')) {
        try {
          const doc = node.contentDocument || (node.contentWindow && node.contentWindow.document);
          if (doc) {
            traverse(doc.body || doc.documentElement, false);
          }
        } catch (e) {}
      }
    }

    traverse(document.body || document.documentElement, false);

    if (discovered.length === 0) {
      try {
        const customHosts = document.querySelectorAll('video-js, mux-player, youtube-video, shreddit-player, [data-player], .html5-video-player');
        customHosts.forEach(host => {
          if (host.shadowRoot && !visitedShadowRoots.has(host.shadowRoot)) {
            traverse(host.shadowRoot, true);
          }
          const innerVid = host.querySelector('video');
          if (innerVid && !discovered.some(d => d.video === innerVid)) {
            discovered.push({ video: innerVid, isShadow: true, parent: host });
          }
        });
      } catch (e) {}
    }

    return discovered;
  }

  function scoreVideoCandidate(video) {
    if (!video) return -999;
    let score = 0;

    if (document.pictureInPictureElement === video) score += 200;
    if (!video.paused && video.currentTime > 0 && !video.ended) score += 120;
    if (!video.muted && video.volume > 0) score += 40;
    if (video.readyState >= 2) score += 25;

    try {
      const rect = video.getBoundingClientRect();
      const w = video.clientWidth || video.videoWidth || rect.width || 0;
      const h = video.clientHeight || video.videoHeight || rect.height || 0;
      const area = w * h;

      if (area > 200000) score += 40;
      else if (area > 40000) score += 20;
      if (w === 0 || h === 0) score -= 60;

      const inViewport = (
        rect.bottom > 0 &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth)
      );
      if (inViewport && area > 0) score += 30;
    } catch (e) {}

    return score;
  }

  function findVideoAndPlayer() {
    const discoveredList = deepFindMediaElements();
    if (discoveredList.length === 0) {
      isMediaInShadowDom = false;
      return { video: null, player: null, playerType: 'none', platform: HOSTNAME, isShadow: false };
    }

    discoveredList.sort((a, b) => scoreVideoCandidate(b.video) - scoreVideoCandidate(a.video));
    const bestCandidate = discoveredList[0];
    const selectedVideo = bestCandidate.video;
    isMediaInShadowDom = bestCandidate.isShadow;

    detectDrmStatus(selectedVideo);

    let player = null;
    let playerType = bestCandidate.isShadow ? 'shadow-html5' : 'native-html5';

    if (HOSTNAME.includes('youtube.com')) {
      playerType = 'youtube-player';
      player = document.getElementById('movie_player') || null;
    } else if (selectedVideo.__ivsPlayer || globalCapturedIvsPlayer) {
      player = selectedVideo.__ivsPlayer || globalCapturedIvsPlayer;
      playerType = 'amazon-ivs';
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
      player = selectedVideo.hls || (selectedVideo.parentElement && selectedVideo.parentElement.hls) || (window.Hls && window.Hls.instances && window.Hls.instances[0]) || null;
    } else if (selectedVideo._shakaPlayer || (window.shaka && window.shaka.Player)) {
      playerType = 'shaka-player';
      player = selectedVideo._shakaPlayer || null;
    }

    return { 
      video: selectedVideo, 
      player, 
      playerType, 
      platform: HOSTNAME, 
      isShadow: isMediaInShadowDom,
      isDrm: activeDrmState.isDrm
    };
  }

  // =========================================================================
  // ⚡ PÜRÜZSÜZ TAMPON & OYNATICI KAYNAK DEĞİŞTİRME MOTORU
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

    smoothSwitchTimeout = setTimeout(() => {
      resumePlayback();
    }, 2000);

    if (typeof player.one === 'function') {
      player.one('loadedmetadata', () => {
        if (curTime > 0 && typeof player.currentTime === 'function') {
          player.currentTime(curTime);
        }

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
  // 🧩 MODÜLER ADAPTÖR MİMARİSİ (3-KADEMELİ BASAMAKLI HAT)
  // =========================================================================
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

      if (player && player.tech_ && player.tech_.vhs && player.tech_.vhs.playlists && player.tech_.vhs.playlists.master) {
        try {
          const masterPlaylists = player.tech_.vhs.playlists.master.playlists;
          if (Array.isArray(masterPlaylists) && masterPlaylists.length > 0) {
            masterPlaylists.forEach((pl, idx) => {
              const res = pl.attributes && pl.attributes.RESOLUTION ? pl.attributes.RESOLUTION : null;
              const h = res ? res.height : 0;
              const w = res ? res.width : 0;
              const bw = (pl.attributes && pl.attributes.BANDWIDTH) || 0;
              const uri = pl.resolvedUri || pl.uri || '';
              const mediaMatch = uri.match(/media-(\d+)/i);
              let mediaTag = mediaMatch ? `media-${mediaMatch[1]}` : 'media-2';
              let smilTag = '576p.smil';

              let label = `${h}p`;
              if (h >= 1000 || w >= 1900) { label = '1080p (FHD)'; if (!mediaMatch) mediaTag = 'media-4'; smilTag = '1080p.smil'; }
              else if (h >= 700 || w >= 1200) { label = '720p (HD)'; if (!mediaMatch) mediaTag = 'media-3'; smilTag = '720p.smil'; }
              else if (h === 576 || (w === 786 && h === 576) || (h >= 540 && h <= 576)) { label = '576p (PAL)'; if (!mediaMatch) mediaTag = 'media-3'; smilTag = '576p.smil'; }
              else if (h === 480 || (w === 654 && h === 480) || (h >= 450 && h < 540)) { label = '480p (SD)'; if (!mediaMatch) mediaTag = 'media-2'; smilTag = '480p.smil'; }
              else if (h >= 320 && h < 450) { label = '360p (Düşük)'; if (!mediaMatch) mediaTag = 'media-1'; smilTag = '360p.smil'; }

              if (h > 0 && !seenHeights.has(h)) {
                seenHeights.add(h);
                results.push({ id: `puhu_vhs_${idx}`, index: idx, label, height: h, width: w, bitrate: bw, mediaTag, smilTag, vhsPlaylist: pl });
              }
            });
          }
        } catch (e) {}
      }

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
              else if (h === 576 || (h >= 540 && h <= 576)) { label = '576p (PAL)'; mediaTag = 'media-3'; smilTag = '576p.smil'; }
              else if (h === 480 || (h >= 450 && h < 540)) { label = '480p (SD)'; mediaTag = 'media-2'; smilTag = '480p.smil'; }
              else if (h >= 320 && h < 450) { label = '360p (Düşük)'; mediaTag = 'media-1'; smilTag = '360p.smil'; }

              if (h > 0 && !seenHeights.has(h)) {
                seenHeights.add(h);
                results.push({ id: `vjs_ql_${i}`, index: i, label, height: h, width: w, bitrate: q.bitrate || 0, mediaTag, smilTag, raw: q });
              }
            }
          }
        } catch (e) {}
      }

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
      if (targetItem.mediaTag) targetPuhuMediaLevel = targetItem.mediaTag;
      if (targetItem.smilTag) targetPuhuSmilLevel = targetItem.smilTag;

      this.lockAbrBandwidth(player);

      let currentSrcUrl = '';
      if (player && typeof player.currentSrc === 'function') currentSrcUrl = player.currentSrc();
      if (!currentSrcUrl && video) currentSrcUrl = video.currentSrc || video.src || '';

      if (targetItem.height >= 1000 && !currentSrcUrl.includes('mncdn.com')) {
        switchToPuhuMncdnDirectly(video, player);
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
          }
        } catch (e) {}
      }

      if (player && player.tech_ && player.tech_.vhs && player.tech_.vhs.masterPlaylistController_) {
        try { player.tech_.vhs.masterPlaylistController_.fastQualityChange_ = true; } catch (e) {}
      }

      this.lockAbrBandwidth(player);
      showToast(`PuhuTV: ${targetItem.label} (Kilitlendi)`);
      return true;
    }
  };

  function simulateFullPointerClick(el) {
    if (!el) return false;
    const initialScrollX = window.scrollX;
    const initialScrollY = window.scrollY;
    try {
      const rect = el.getBoundingClientRect();
      const x = rect.left + (rect.width ? rect.width / 2 : 10);
      const y = rect.top + (rect.height ? rect.height / 2 : 10);
      const commonOpts = {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        view: window
      };

      el.dispatchEvent(new PointerEvent('pointerover', commonOpts));
      el.dispatchEvent(new MouseEvent('mouseover', commonOpts));
      el.dispatchEvent(new PointerEvent('pointerdown', { ...commonOpts, isPrimary: true, button: 0, buttons: 1, pointerType: 'mouse' }));
      el.dispatchEvent(new MouseEvent('mousedown', { ...commonOpts, button: 0, buttons: 1 }));
      if (typeof el.focus === 'function') {
        try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
      }
      el.dispatchEvent(new PointerEvent('pointerup', { ...commonOpts, isPrimary: true, button: 0, buttons: 0, pointerType: 'mouse' }));
      el.dispatchEvent(new MouseEvent('mouseup', { ...commonOpts, button: 0, buttons: 0 }));
      el.dispatchEvent(new MouseEvent('click', { ...commonOpts, button: 0, buttons: 0 }));
      if (typeof el.click === 'function') el.click();
    } catch (e) {
      if (typeof el.click === 'function') {
        try { el.click(); } catch (err) {}
      }
    } finally {
      if (window.scrollY !== initialScrollY || window.scrollX !== initialScrollX) {
        window.scrollTo(initialScrollX, initialScrollY);
      }
    }
    return true;
  }

  function setReactInputValue(input, val) {
    if (!input) return;
    try {
      const proto = window.HTMLInputElement ? window.HTMLInputElement.prototype : null;
      const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, val);
      } else {
        input.value = val;
      }
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    } catch (e) {
      input.value = val;
    }
  }

  function searchFiberTree(startFiber, visitor, maxNodes = 600) {
    if (!startFiber) return false;
    let curr = startFiber;
    let upDepth = 0;
    while (curr && upDepth < 35) {
      if (visitor(curr)) return true;
      curr = curr.return;
      upDepth++;
    }

    const queue = [startFiber];
    const visited = new Set();
    let count = 0;

    while (queue.length > 0 && count < maxNodes) {
      const node = queue.shift();
      if (!node || visited.has(node)) continue;
      visited.add(node);
      count++;

      if (visitor(node)) return true;

      if (node.child) queue.push(node.child);
      if (node.sibling) queue.push(node.sibling);
    }
    return false;
  }

  // Kick.com React Fiber 0ms Hızlı Önbelleği
  let cachedKickVolSetter = null;
  let cachedKickVolHook = null;
  let cachedKickSpeedSetter = null;
  let cachedKickSpeedHook = null;

  const KickAdapter = {
    name: 'KickAdapter',
    matches() {
      return HOSTNAME.includes('kick.com') || (!!document.querySelector('#channel-player, [class*="kick-player"]') && !HOSTNAME.includes('trt') && !HOSTNAME.includes('puhu') && !HOSTNAME.includes('nowtv'));
    },
    isVodPage() {
      return window.location.pathname.includes('/video/') || window.location.pathname.includes('/videos/');
    },
    findIvsPlayer(video) {
      if (globalCapturedIvsPlayer && typeof globalCapturedIvsPlayer.getQualities === 'function') return globalCapturedIvsPlayer;
      if (video && video.__ivsPlayer && typeof video.__ivsPlayer.getQualities === 'function') return video.__ivsPlayer;
      if (video && video._ivsPlayer && typeof video._ivsPlayer.getQualities === 'function') return video._ivsPlayer;
      if (window.ivsPlayer && typeof window.ivsPlayer.getQualities === 'function') return (globalCapturedIvsPlayer = window.ivsPlayer);
      if (window.__ivsPlayer && typeof window.__ivsPlayer.getQualities === 'function') return (globalCapturedIvsPlayer = window.__ivsPlayer);
      if (window.player && typeof window.player.getQualities === 'function') return (globalCapturedIvsPlayer = window.player);

      const candidates = [
        video,
        video ? video.parentElement : null,
        video ? video.closest('#channel-player') : null,
        video ? video.closest('.player-container') : null,
        document.querySelector('#channel-player'),
        document.querySelector('.player-container'),
        document.querySelector('div[data-testid="player-controls"]'),
        document.querySelector('div[data-testid="video-player"]')
      ].filter(Boolean);

      for (const el of candidates) {
        if (el.__ivsPlayer && typeof el.__ivsPlayer.getQualities === 'function') return (globalCapturedIvsPlayer = el.__ivsPlayer);
        try {
          const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$') || k.startsWith('__reactProps$'));
          if (fiberKey && el[fiberKey]) {
            let foundPlayer = null;
            searchFiberTree(el[fiberKey], (node) => {
              const props = node.memoizedProps;
              const state = node.memoizedState;
              if (props && typeof props === 'object') {
                const p = props.player || props.ivsPlayer || props.mediaPlayer || (props.stream && props.stream.player);
                if (p && typeof p.getQualities === 'function') { foundPlayer = p; return true; }
              }
              if (state) {
                let hook = state;
                let hookDepth = 0;
                while (hook && typeof hook === 'object' && hookDepth < 35) {
                  const m = hook.memoizedState;
                  if (m && typeof m === 'object') {
                    if (typeof m.getQualities === 'function') { foundPlayer = m; return true; }
                    if (m.current && typeof m.current.getQualities === 'function') { foundPlayer = m.current; return true; }
                    if (m.player && typeof m.player.getQualities === 'function') { foundPlayer = m.player; return true; }
                  }
                  hook = hook.next;
                  hookDepth++;
                }
              }
              return false;
            }, 350);

            if (foundPlayer) {
              globalCapturedIvsPlayer = foundPlayer;
              if (video) video.__ivsPlayer = foundPlayer;
              return foundPlayer;
            }
          }
        } catch (e) {}
      }
      return null;
    },
    findAndInvokeReactQuality(targetLabel, targetHeight) {
      if (!targetLabel) return false;
      const cleanDigits = (targetLabel.match(/\d+/) || [''])[0];
      const rootCandidates = [
        document.querySelector('#channel-player'),
        document.querySelector('.player-container'),
        document.querySelector('video') ? document.querySelector('video').parentElement : null,
        document.querySelector('div[data-testid="player-controls"]')
      ].filter(Boolean);

      for (const root of rootCandidates) {
        const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
        if (!fiberKey || !root[fiberKey]) continue;

        let success = false;
        searchFiberTree(root[fiberKey], (node) => {
          const props = node.memoizedProps;
          if (props && typeof props === 'object') {
            const setterNames = ['setQuality', 'onQualityChange', 'changeQuality', 'handleQualitySelect', 'setSelectedQuality'];
            for (const name of setterNames) {
              if (typeof props[name] === 'function') {
                try { props[name](targetLabel); success = true; return true; } catch (e) {}
              }
            }
          }
          return false;
        }, 400);
        if (success) return true;
      }
      return false;
    },
    findAndInvokeReactSpeed(rate) {
      const rateLabel = `${rate}x`;
      if (cachedKickSpeedSetter) {
        try { cachedKickSpeedSetter(rate); return true; } catch (e) { cachedKickSpeedSetter = null; }
      }
      if (cachedKickSpeedHook && typeof cachedKickSpeedHook.dispatch === 'function') {
        try {
          cachedKickSpeedHook.dispatch(cachedKickSpeedHook.type === 'string' ? (rate === 1 ? '1x' : rateLabel) : rate);
          return true;
        } catch (e) { cachedKickSpeedHook = null; }
      }

      const rootCandidates = [
        document.querySelector('div[data-testid="player-controls"]'),
        document.querySelector('#channel-player'),
        document.querySelector('.player-container')
      ].filter(Boolean);

      for (const root of rootCandidates) {
        const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
        if (!fiberKey || !root[fiberKey]) continue;

        let success = false;
        searchFiberTree(root[fiberKey], (node) => {
          const props = node.memoizedProps;
          if (props && typeof props === 'object') {
            const speedSetters = ['setPlaybackRate', 'setSpeed', 'onPlaybackRateChange', 'handlePlaybackRateChange'];
            for (const name of speedSetters) {
              if (typeof props[name] === 'function') {
                try {
                  props[name](rate);
                  cachedKickSpeedSetter = props[name];
                  success = true;
                  return true;
                } catch (e) {}
              }
            }
          }
          return false;
        }, 80);
        if (success) return true;
      }
      return false;
    },
    findAndInvokeReactVolume(percent) {
      const normalizedVol = Math.max(0, Math.min(1, percent / 100));
      if (cachedKickVolSetter) {
        try { cachedKickVolSetter(normalizedVol); return true; } catch (e) { cachedKickVolSetter = null; }
      }
      if (cachedKickVolHook && typeof cachedKickVolHook.dispatch === 'function') {
        try {
          if (cachedKickVolHook.type === 'array') cachedKickVolHook.dispatch([normalizedVol]);
          else if (cachedKickVolHook.type === 'percent') cachedKickVolHook.dispatch(percent);
          else cachedKickVolHook.dispatch(normalizedVol);
          return true;
        } catch (e) { cachedKickVolHook = null; }
      }

      const rootCandidates = [
        document.querySelector('div[data-testid="volume-slider"]'),
        document.querySelector('.volume-slider'),
        document.querySelector('div[data-testid="player-controls"]'),
        document.querySelector('#channel-player')
      ].filter(Boolean);

      for (const root of rootCandidates) {
        const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
        if (!fiberKey || !root[fiberKey]) continue;

        let success = false;
        searchFiberTree(root[fiberKey], (node) => {
          const props = node.memoizedProps;
          if (props && typeof props === 'object') {
            const volSetters = ['setVolume', 'onVolumeChange', 'handleVolumeChange', 'setVolumeLevel'];
            for (const name of volSetters) {
              if (typeof props[name] === 'function') {
                try {
                  props[name](normalizedVol);
                  cachedKickVolSetter = props[name];
                  success = true;
                  return true;
                } catch (e) {}
              }
            }
          }
          return false;
        }, 80);
        if (success) return true;
      }
      return false;
    },
    syncKickPlayerVolume(percent) {
      try {
        const { video } = findVideoAndPlayer();
        const validPercent = Math.max(0, Math.min(100, Math.round(percent)));
        const normalizedVol = validPercent / 100;
        this.findAndInvokeReactVolume(validPercent);

        if (video) {
          video.muted = (validPercent === 0);
        }

        const sliders = document.querySelectorAll('input[type="range"][aria-label*="volume" i], input[type="range"][aria-label*="ses" i], [data-testid="volume-slider"] input');
        sliders.forEach(slider => {
          setReactInputValue(slider, validPercent);
          slider.style.setProperty('--slider-fill', `${validPercent}%`);
        });

        const radixSliders = document.querySelectorAll('[role="slider"][aria-label*="volume" i], [role="slider"][aria-label*="ses" i], div[data-testid="volume-slider"] [role="slider"]');
        radixSliders.forEach(slider => {
          slider.setAttribute('aria-valuenow', validPercent.toString());
          slider.style.setProperty('left', `${validPercent}%`, 'important');
        });

        const ivs = this.findIvsPlayer(video);
        if (ivs) {
          if (typeof ivs.setVolume === 'function') ivs.setVolume(normalizedVol);
          if (typeof ivs.setMuted === 'function') ivs.setMuted(validPercent === 0);
        }
      } catch (e) {}
    },
    syncKickPlayerSpeed(rate) {
      try {
        const { video } = findVideoAndPlayer();
        const ivs = this.findIvsPlayer(video);
        if (ivs && typeof ivs.setPlaybackRate === 'function') ivs.setPlaybackRate(rate);
        this.findAndInvokeReactSpeed(rate);
        if (video) {
          video.playbackRate = rate;
          video.defaultPlaybackRate = rate;
          video.dispatchEvent(new Event('ratechange', { bubbles: true }));
        }
      } catch (e) {}
    },
    triggerKickUiQuality(targetLabel) {
      try {
        if (!targetLabel) return;
        const digits = (targetLabel.match(/\d+/) || [''])[0];
        const settingsBtn = document.querySelector('[data-testid="player-settings-button"], [data-testid="settings-button"]');
        if (!settingsBtn) return;
        simulateFullPointerClick(settingsBtn);
        setTimeout(() => {
          const popoverContainers = Array.from(document.querySelectorAll('div[data-radix-popper-content-wrapper], div[data-radix-portal] div[role="menu"]'));
          for (const cont of popoverContainers) {
            const items = Array.from(cont.querySelectorAll('button, div[role="menuitem"], span, div'));
            const match = items.find(el => {
              const txt = (el.textContent || '').trim().toLowerCase();
              return txt.length <= 25 && digits && txt.includes(digits);
            });
            if (match) { simulateFullPointerClick(match); break; }
          }
        }, 120);
      } catch (e) {}
    },
    checkAdFastForward(video) {
      if (!video || !window.location.hostname.includes('kick.com')) return;
      const adSelectors = ['[data-testid="ad-badge"]', '[class*="ad-overlay"]', '[class*="ad-badge"]'];
      const hasAd = adSelectors.some(sel => !!document.querySelector(sel));
      if (hasAd && !this.isKickAdActive) {
        this.isKickAdActive = true;
        this.preKickAdSpeed = video.playbackRate || 1.0;
        this.preKickAdMuted = video.muted;
        try { video.playbackRate = 16.0; video.muted = true; } catch (e) {}
      } else if (!hasAd && this.isKickAdActive) {
        this.isKickAdActive = false;
        try { video.playbackRate = this.preKickAdSpeed || 1.0; video.muted = this.preKickAdMuted; } catch (e) {}
      }
    },
    isKickAdActive: false,
    preKickAdSpeed: 1.0,
    preKickAdMuted: false,
    getQualities(video) {
      const results = [];
      const ivs = this.findIvsPlayer(video);
      if (ivs && typeof ivs.getQualities === 'function') {
        try {
          const qList = ivs.getQualities();
          if (Array.isArray(qList) && qList.length > 0) {
            qList.forEach((q, idx) => {
              const h = q.height || 0;
              results.push({ id: `ivs_${idx}`, index: idx, label: q.name || `${h}p`, height: h, bitrate: q.bitrate || 0, raw: q });
            });
            return results.sort((a, b) => (b.height || 0) - (a.height || 0));
          }
        } catch (e) {}
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
      this.findAndInvokeReactQuality(targetItem.label, targetItem.height);
      const ivs = this.findIvsPlayer(video);
      if (ivs && typeof ivs.getQualities === 'function') {
        try {
          if (typeof ivs.setAutoQualityMode === 'function') ivs.setAutoQualityMode(false);
          const qList = ivs.getQualities();
          const targetQuality = Array.isArray(qList) ? qList.find(q => (q.height && q.height === targetItem.height) || (q.name && q.name.includes(`${targetItem.height}`))) : null;
          if (targetQuality && typeof ivs.setQuality === 'function') ivs.setQuality(targetQuality);
        } catch (e) {}
      }
      this.triggerKickUiQuality(targetItem.label);
      showToast(`Kick: ${targetItem.label} (Kilitlendi)`);
      return true;
    }
  };

  const NowTvAdapter = {
    name: 'NowTvAdapter',
    matches(video) {
      return HOSTNAME.includes('nowtv.com.tr') || HOSTNAME.includes('fox.com.tr') || (video && (video.src?.includes('erbvr.com') || video.currentSrc?.includes('erbvr.com')));
    },
    getQualities(video) {
      const currentHeight = video && video.videoHeight ? video.videoHeight : 360;
      return [
        { id: 'now_bvr_max', label: '🚀 Max Bitrate (ErCDN Boost)', height: 1080, bitrate: 12000000, isBoost: true },
        { id: 'now_bvr_hd', label: '⚡ Yüksek Bitrate (HD Zorla)', height: 720, bitrate: 5500000, isBoost: true },
        { id: 'now_current', label: `🎬 Doğal Akış (${currentHeight}p)`, height: currentHeight, bitrate: 0, isBoost: false }
      ];
    },
    applyQuality(targetItem) {
      targetNowBvrBandwidth = targetItem.isBoost ? (targetItem.bitrate || 12000000) : null;
      showToast(`Now TV: ${targetItem.label}`);
      return true;
    }
  };

  const TrtAdapter = {
    name: 'TrtAdapter',
    matches(video) {
      return HOSTNAME.includes('trt1.com.tr') || HOSTNAME.includes('trtizle.com') || HOSTNAME.includes('trt.com.tr') || (video && video.currentSrc?.includes('trt.com.tr'));
    },
    syncTrtUiVolume(percent) {
      try {
        const val = Math.max(0, Math.min(100, Math.round(percent)));
        const volumeBars = document.querySelectorAll('[class*="volume-progress"], [class*="volume-fill"], [class*="volume-level"], .vjs-volume-level');
        volumeBars.forEach(bar => bar.style.setProperty('width', `${val}%`, 'important'));
      } catch (e) {}
    },
    syncTrtUiSpeed() {},
    getQualities() {
      return [
        { id: 'trt_1080', label: '1080p (FHD)', height: 1080, suffix: '1080p' },
        { id: 'trt_720', label: '720p (HD)', height: 720, suffix: '720p' },
        { id: 'trt_576', label: '576p (PAL)', height: 576, suffix: '576p' },
        { id: 'trt_480', label: '480p (SD)', height: 480, suffix: '480p' },
        { id: 'trt_360', label: '360p (Düşük)', height: 360, suffix: '360p' }
      ];
    },
    applyQuality(targetItem, video) {
      if (targetItem.suffix) targetTrtQualitySuffix = targetItem.suffix;
      if (video && video.currentTime > 0) {
        try { video.currentTime = Math.max(0, video.currentTime + 0.001); } catch (e) {}
      }
      showToast(`TRT: ${targetItem.label}`);
      return true;
    }
  };

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
          results.push({ id: `hls_${idx}`, index: idx, label: `${lvl.height || lvl.name}p`, height: lvl.height, bitrate: lvl.bitrate, raw: lvl });
        });
      }
      return results.sort((a, b) => (b.height || 0) - (a.height || 0));
    },
    applyQuality(targetItem, video, player) {
      const hls = (video && video.hls) || (player && player.hls) || (window.Hls && window.Hls.instances && window.Hls.instances[0]);
      if (hls && hls.levels && targetItem.index !== undefined) {
        hls.currentLevel = targetItem.index;
        showToast(`HLS.js: ${targetItem.label}`);
        return true;
      }
      return false;
    }
  };

  const YouTubeAdapter = {
    name: 'YouTubeAdapter',
    tier: 2,
    displayName: 'YouTube Oynatıcı (Tier 2)',
    matches() {
      return HOSTNAME.includes('youtube.com') || !!document.getElementById('movie_player') || !!document.querySelector('.html5-video-player');
    },
    getQualities(video, player) {
      const yt = player || document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      if (yt && typeof yt.getAvailableQualityLevels === 'function') {
        try {
          const levels = yt.getAvailableQualityLevels();
          if (Array.isArray(levels) && levels.length > 0) {
            const labelMap = {
              'hd2160': { label: '2160p (4K)', height: 2160 },
              'hd1440': { label: '1440p (2K)', height: 1440 },
              'hd1080': { label: '1080p (FHD)', height: 1080 },
              'hd720': { label: '720p (HD)', height: 720 },
              'large': { label: '480p (SD)', height: 480 },
              'medium': { label: '360p (Düşük)', height: 360 },
              'small': { label: '240p (Düşük)', height: 240 },
              'tiny': { label: '144p (Mobil)', height: 144 },
              'auto': { label: 'Otomatik', height: 0 }
            };
            return levels.map(lvl => ({
              id: `yt_${lvl}`,
              label: labelMap[lvl] ? labelMap[lvl].label : lvl,
              height: labelMap[lvl] ? labelMap[lvl].height : 0,
              raw: lvl
            }));
          }
        } catch (e) {}
      }
      return GenericAdapter.getQualities();
    },
    applyQuality(targetItem, video, player) {
      const yt = player || document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      if (yt && typeof yt.setPlaybackQualityRange === 'function' && targetItem.raw) {
        try {
          yt.setPlaybackQualityRange(targetItem.raw, targetItem.raw);
          showToast(`YouTube: ${targetItem.label}`);
          return true;
        } catch (e) {}
      }
      return false;
    }
  };

  const VideoJsAdapter = {
    name: 'VideoJsAdapter',
    tier: 2,
    displayName: 'Video.js Kütüphanesi (Tier 2)',
    matches(video, player) {
      return !!player || !!(video && (video.player || video.vjsPlayer)) || !!(window.videojs && typeof window.videojs.getAllPlayers === 'function' && window.videojs.getAllPlayers().length > 0) || !!document.querySelector('.video-js, .vjs-tech');
    },
    getQualities(video, player) {
      const vjs = player || (video && (video.player || video.vjsPlayer)) || (window.videojs && window.videojs.getAllPlayers && window.videojs.getAllPlayers()[0]);
      if (vjs && typeof vjs.qualityLevels === 'function') {
        try {
          const ql = vjs.qualityLevels();
          if (ql && ql.length > 0) {
            const res = [];
            for (let i = 0; i < ql.length; i++) {
              const h = ql[i].height || 0;
              res.push({ id: `vjs_${i}`, index: i, label: ql[i].label || (h ? `${h}p` : `Seviye ${i + 1}`), height: h, raw: ql[i] });
            }
            if (res.length > 0) return res.sort((a, b) => (b.height || 0) - (a.height || 0));
          }
        } catch (e) {}
      }
      return GenericAdapter.getQualities();
    },
    applyQuality(targetItem, video, player) {
      const vjs = player || (video && (video.player || video.vjsPlayer)) || (window.videojs && window.videojs.getAllPlayers && window.videojs.getAllPlayers()[0]);
      if (vjs && typeof vjs.qualityLevels === 'function') {
        try {
          const ql = vjs.qualityLevels();
          if (ql && ql.length > 0) {
            for (let i = 0; i < ql.length; i++) ql[i].enabled = (targetItem.index === i);
            showToast(`Video.js: ${targetItem.label}`);
            return true;
          }
        } catch (e) {}
      }
      return false;
    }
  };

  const ShakaPlayerAdapter = {
    name: 'ShakaPlayerAdapter',
    tier: 2,
    displayName: 'Shaka Player (Tier 2)',
    matches(video) {
      return !!(video && video._shakaPlayer) || !!(window.shaka && window.shaka.Player);
    },
    getQualities() { return GenericAdapter.getQualities(); },
    applyQuality(targetItem) {
      showToast(`Shaka Player: ${targetItem.label}`);
      return true;
    }
  };

  const DashJsAdapter = {
    name: 'DashJsAdapter',
    tier: 2,
    displayName: 'Dash.js (Tier 2)',
    matches() { return !!(window.dashjs && window.dashjs.MediaPlayer); },
    getQualities() { return GenericAdapter.getQualities(); },
    applyQuality(targetItem) {
      showToast(`Dash.js: ${targetItem.label}`);
      return true;
    }
  };

  const GenericAdapter = {
    name: 'GenericAdapter',
    tier: 3,
    displayName: 'Evrensel HTML5 & Shadow DOM (Tier 3)',
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

  PuhuTvAdapter.tier = 1; PuhuTvAdapter.displayName = 'PuhuTV (Tier 1)';
  KickAdapter.tier = 1; KickAdapter.displayName = 'Kick.com (Tier 1)';
  NowTvAdapter.tier = 1; NowTvAdapter.displayName = 'Now TV / Fox (Tier 1)';
  TrtAdapter.tier = 1; TrtAdapter.displayName = 'TRT 1 / TRT İzle (Tier 1)';
  HlsJsAdapter.tier = 2; HlsJsAdapter.displayName = 'Hls.js Kütüphanesi (Tier 2)';

  const ALL_ADAPTERS = [
    KickAdapter,
    TrtAdapter,
    NowTvAdapter,
    PuhuTvAdapter,
    YouTubeAdapter,
    VideoJsAdapter,
    HlsJsAdapter,
    ShakaPlayerAdapter,
    DashJsAdapter,
    GenericAdapter
  ];

  function probeAdapterHealth(adapter, video, player) {
    if (!adapter) return false;
    try {
      if (!video && adapter.tier !== 3) return false;
      if (typeof adapter.getQualities === 'function') {
        const qList = adapter.getQualities(video, player);
        if (!Array.isArray(qList)) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function resolveCascadeAdapter(video, player) {
    if (userForcedAdapterName) {
      const forced = ALL_ADAPTERS.find(a => a.name === userForcedAdapterName);
      if (forced) {
        currentActiveAdapterName = forced.name;
        adapterHealthStatus = 'healthy';
        updateAdapterHudBadge(forced);
        return forced;
      }
    }

    for (const tierLevel of [1, 2]) {
      const tierAdapters = ALL_ADAPTERS.filter(a => a.tier === tierLevel);
      for (const a of tierAdapters) {
        if (a.matches(video, player) && probeAdapterHealth(a, video, player)) {
          currentActiveAdapterName = a.name;
          adapterHealthStatus = 'healthy';
          updateAdapterHudBadge(a);
          return a;
        }
      }
    }

    currentActiveAdapterName = GenericAdapter.name;
    adapterHealthStatus = video ? 'healthy' : 'failed';
    updateAdapterHudBadge(GenericAdapter);
    return GenericAdapter;
  }

  function getActiveAdapter(video, player) {
    return resolveCascadeAdapter(video, player);
  }

  function updateAdapterHudBadge(adapter) {
    const badge = document.getElementById('pvc-active-adapter-badge');
    if (badge && adapter) {
      const tierTag = adapter.tier ? `Tier ${adapter.tier}` : 'Tier 3';
      badge.textContent = `${adapter.name} (${tierTag})`;
      badge.title = adapter.displayName || adapter.name;
    }
    updateCollapsedSummaryBar();
  }

  function discoverStreamQualities() {
    const { video, player } = findVideoAndPlayer();
    const adapter = getActiveAdapter(video, player);

    if (typeof adapter.getQualities === 'function') {
      try {
        const found = adapter.getQualities(video, player);
        if (found && found.length > 0) {
          cachedDiscoveredQualities = found;
          return found;
        }
      } catch (e) {}
    }

    if (adapter.name !== 'GenericAdapter' && cachedDiscoveredQualities.length > 0) {
      return cachedDiscoveredQualities;
    }

    return GenericAdapter.getQualities();
  }

  // =========================================================================
  // 📊 KÜÇÜLTÜLMÜŞ (MINI-PILL) DETAYLI BİLGİ BARI GÜNCELLEYİCİSİ (MADDE 6)
  // =========================================================================
  function updateCollapsedSummaryBar() {
    const miniRes = document.getElementById('pvc-mini-res-val');
    const miniSpeed = document.getElementById('pvc-mini-speed-val');
    const miniVol = document.getElementById('pvc-mini-vol-val');
    const miniAdapter = document.getElementById('pvc-mini-adapter-val');

    const { video } = findVideoAndPlayer();
    const shortRes = (video && video.videoHeight > 0) ? `${video.videoHeight}p` : '---';
    if (miniRes) miniRes.textContent = `🎬 ${shortRes}`;
    if (miniSpeed) miniSpeed.textContent = `⚡ ${targetEnforcedPlaybackRate}x`;
    if (miniVol) miniVol.textContent = `🔊 %${currentAudioVolumePercent} (${currentAudioMode === 'mono' ? 'M' : 'S'})`;
    if (miniAdapter) {
      const drmPrefix = activeDrmState.isDrm ? '🛡️ ' : '';
      miniAdapter.textContent = `${drmPrefix}${currentActiveAdapterName.replace('Adapter', '')}`;
    }
  }

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

    const noVideoAlert = document.getElementById('pvc-no-video-alert');
    if (noVideoAlert) {
      noVideoAlert.style.display = video ? 'none' : 'block';
    }
    if (video) {
      updateDrmHudBadge(video);
      const adapter = getActiveAdapter(video);
      updateAdapterHudBadge(adapter);
      applyVideoFiltersToElement(video);
    }
    updateCollapsedSummaryBar();
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
      renderCustomSubtitleCue(video);
    });
    video.addEventListener('enterpictureinpicture', () => updatePipButtonsState(true));
    video.addEventListener('leavepictureinpicture', () => updatePipButtonsState(false));

    applyVideoFiltersToElement(video);
    handleResize();

    if (HOSTNAME.includes('kick.com')) {
      setInterval(() => {
        KickAdapter.checkAdFastForward(video);
      }, 750);
    }
  }

  // =========================================================================
  // 🖼️ RESİM İÇİNDE RESİM (PiP) DOĞRUDAN KONTROLÜ (MADDE 5)
  // =========================================================================
  function updatePipButtonsState(isPip) {
    const pipHeaderBtn = document.getElementById('pvc-pip-btn');
    const pipMiniBtn = document.getElementById('pvc-mini-pip-btn');
    if (pipHeaderBtn) pipHeaderBtn.classList.toggle('pvc-btn-active', isPip);
    if (pipMiniBtn) pipMiniBtn.classList.toggle('pvc-active', isPip);
  }

  async function togglePictureInPicture() {
    const { video } = findVideoAndPlayer();
    if (!video) {
      showToast('PiP için aktif video bulunamadı');
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        updatePipButtonsState(false);
        showToast('🖼️ PiP Modundan Çıkıldı');
      } else if (typeof video.requestPictureInPicture === 'function') {
        if (video.disablePictureInPicture) {
          video.disablePictureInPicture = false;
          video.removeAttribute('disablepictureinpicture');
        }
        await video.requestPictureInPicture();
        updatePipButtonsState(true);
        showToast('🖼️ Resim İçinde Resim (PiP) Aktif');
      } else if (typeof video.webkitSetPresentationMode === 'function') {
        const mode = video.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture';
        video.webkitSetPresentationMode(mode);
        showToast(`🖼️ PiP Modu: ${mode}`);
      } else {
        showToast('Tarayıcınız bu videoda PiP API desteklemiyor');
      }
    } catch (err) {
      addDiagnosticLog('WARN', '[PiP] PiP geçiş hatası:', err.message);
      showToast('PiP açılamadı (Video henüz hazır olmayabilir)');
    }
  }

  // =========================================================================
  // 🎨 GÖRÜNTÜ FİLTRELERİ VE GECE KALKANI MOTORU (MADDE 3)
  // =========================================================================
  function applyVideoFiltersToElement(video) {
    const targetVideo = video || findVideoAndPlayer().video;
    if (!targetVideo) return;

    const parts = [];
    if (videoFilterState.brightness !== 100) parts.push(`brightness(${videoFilterState.brightness}%)`);
    if (videoFilterState.contrast !== 100) parts.push(`contrast(${videoFilterState.contrast}%)`);
    if (videoFilterState.saturate !== 100) parts.push(`saturate(${videoFilterState.saturate}%)`);
    if (videoFilterState.nightShield) parts.push('sepia(38%) brightness(88%) contrast(95%)');
    if (videoFilterState.invert) parts.push('invert(100%) hue-rotate(180deg)');

    const filterCss = parts.length > 0 ? parts.join(' ') : 'none';
    targetVideo.style.setProperty('filter', filterCss, 'important');
    updateFilterUiBadges();
  }

  function updateFilterUiBadges() {
    const hdrBadge = document.getElementById('pvc-hdr-filter-badge');
    const bSlider = document.getElementById('pvc-filter-brightness');
    const cSlider = document.getElementById('pvc-filter-contrast');
    const sSlider = document.getElementById('pvc-filter-saturate');
    const bVal = document.getElementById('pvc-val-brightness');
    const cVal = document.getElementById('pvc-val-contrast');
    const sVal = document.getElementById('pvc-val-saturate');
    const nightBtn = document.getElementById('pvc-btn-night-shield');
    const invertBtn = document.getElementById('pvc-btn-invert-color');

    if (bSlider) bSlider.value = videoFilterState.brightness.toString();
    if (cSlider) cSlider.value = videoFilterState.contrast.toString();
    if (sSlider) sSlider.value = videoFilterState.saturate.toString();
    if (bVal) bVal.textContent = `%${videoFilterState.brightness}`;
    if (cVal) cVal.textContent = `%${videoFilterState.contrast}`;
    if (sVal) sVal.textContent = `%${videoFilterState.saturate}`;
    if (nightBtn) nightBtn.classList.toggle('pvc-active', videoFilterState.nightShield);
    if (invertBtn) invertBtn.classList.toggle('pvc-active', videoFilterState.invert);

    if (hdrBadge) {
      const isCustom = videoFilterState.brightness !== 100 || videoFilterState.contrast !== 100 || videoFilterState.saturate !== 100 || videoFilterState.nightShield || videoFilterState.invert;
      hdrBadge.textContent = videoFilterState.nightShield ? '🌙 Gece' : (isCustom ? 'Özel' : 'Standart');
    }
  }

  function resetVideoFilters() {
    videoFilterState = { brightness: 100, contrast: 100, saturate: 100, nightShield: false, invert: false };
    applyVideoFiltersToElement();
    showToast('🎨 Görüntü Filtreleri Sıfırlandı');
  }

  // =========================================================================
  // 💬 BELLEK İÇİ HARİCİ ALTYAZI (.SRT / .VTT) VE SENKRON MOTORU (MADDE 4)
  // =========================================================================
  function parseTimecodeToSeconds(tc) {
    if (!tc) return 0;
    const clean = tc.trim().replace(',', '.');
    const parts = clean.split(':');
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 0;
  }

  function parseSrtOrVttContent(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];
    const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\s*\n/);
    const cues = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length === 0) continue;

      let timeLineIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('-->')) {
          timeLineIdx = i;
          break;
        }
      }
      if (timeLineIdx === -1) continue;

      const timeParts = lines[timeLineIdx].split('-->');
      if (timeParts.length < 2) continue;

      const startSec = parseTimecodeToSeconds(timeParts[0]);
      const endSec = parseTimecodeToSeconds(timeParts[1].split(/\s+/)[0]);
      const textLines = lines.slice(timeLineIdx + 1).join('\n').replace(/<[^>]+>/g, '').trim();

      if (textLines && endSec > startSec) {
        cues.push({ start: startSec, end: endSec, text: textLines });
      }
    }
    return cues;
  }

  function ensureSubtitleOverlayElement() {
    let overlay = document.getElementById('pvc-subtitle-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pvc-subtitle-overlay';
      getActiveContainer().appendChild(overlay);
    }
    return overlay;
  }

  function renderCustomSubtitleCue(video) {
    const overlay = document.getElementById('pvc-subtitle-overlay');
    if (!video || !subtitleOverlayEnabled || customSubtitleCues.length === 0) {
      if (overlay) overlay.style.display = 'none';
      return;
    }

    const targetOverlay = ensureSubtitleOverlayElement();
    const effectiveTime = video.currentTime - (subtitleOffsetMs / 1000);
    const activeCue = customSubtitleCues.find(c => effectiveTime >= c.start && effectiveTime <= c.end);

    if (activeCue) {
      targetOverlay.textContent = activeCue.text;
      targetOverlay.style.display = 'block';
    } else {
      targetOverlay.style.display = 'none';
    }
  }

  function injectNativeTextTrackCues(video) {
    if (!video || typeof video.addTextTrack !== 'function' || typeof window.VTTCue !== 'function') return;
    try {
      let track = video.__nokSubtitleTrack;
      if (!track) {
        track = video.addTextTrack('subtitles', 'NOk Harici Altyazı', 'tr');
        video.__nokSubtitleTrack = track;
      }
      track.mode = subtitleOverlayEnabled ? 'hidden' : 'showing';
      while (track.cues && track.cues.length > 0) {
        track.removeCue(track.cues[0]);
      }
      const offsetSec = subtitleOffsetMs / 1000;
      customSubtitleCues.forEach(c => {
        const s = Math.max(0, c.start + offsetSec);
        const e = Math.max(s + 0.2, c.end + offsetSec);
        track.addCue(new window.VTTCue(s, e, c.text));
      });
    } catch (e) {}
  }

  function shiftSubtitleSync(deltaMs) {
    if (customSubtitleCues.length === 0) {
      showToast('Önce bir .srt veya .vtt altyazı dosyası yükleyin');
      return;
    }
    subtitleOffsetMs += deltaMs;
    const badge = document.getElementById('pvc-sub-offset-badge');
    if (badge) {
      badge.textContent = `${subtitleOffsetMs >= 0 ? '+' : ''}${subtitleOffsetMs}ms`;
    }
    const { video } = findVideoAndPlayer();
    if (video) {
      injectNativeTextTrackCues(video);
      renderCustomSubtitleCue(video);
    }
    showToast(`💬 Altyazı Senkronu: ${subtitleOffsetMs >= 0 ? '+' : ''}${subtitleOffsetMs}ms`);
  }

  // =========================================================================
  // ⚡ HIZ, %300 SES GÜÇLENDİRİCİ VE KAZANÇ (GAIN) RENK MOTORU (MADDE 8)
  // =========================================================================
  let targetEnforcedPlaybackRate = 1.0;

  function setSpeed(rate) {
    const { video, player } = findVideoAndPlayer();
    if (!video) {
      showToast('Video elementi bulunamadı');
      return false;
    }

    try {
      const validRate = Math.min(3.0, Math.max(0.25, parseFloat(rate.toFixed(2))));
      targetEnforcedPlaybackRate = validRate;
      video.playbackRate = validRate;
      video.defaultPlaybackRate = validRate;
      
      if (player && typeof player.playbackRate === 'function') {
        try { player.playbackRate(validRate); } catch (e) {}
      } else if (player && typeof player.setPlaybackRate === 'function') {
        try { player.setPlaybackRate(validRate); } catch (e) {}
      }

      if (HOSTNAME.includes('kick.com')) {
        KickAdapter.syncKickPlayerSpeed(validRate);
      } else if (HOSTNAME.includes('trt') || currentActiveAdapterName === 'TrtAdapter') {
        TrtAdapter.syncTrtUiSpeed(validRate);
      }

      const slider = document.getElementById('pvc-speed-slider');
      const hdrBadge = document.getElementById('pvc-hdr-speed-badge');
      if (slider) slider.value = validRate.toString();
      if (hdrBadge) hdrBadge.textContent = `${validRate}x`;

      updateCollapsedSummaryBar();
      showToast(`⚡ Hız: ${validRate}x`);
      return true;
    } catch (err) {
      return false;
    }
  }

  function initAudioGraphForVideo(video) {
    if (!video) return null;
    if (detectDrmStatus(video).isDrm) {
      addDiagnosticLog('INFO', '[WebAudio] DRM korumalı akış: Web Audio API atlandı, yerel video.volume kullanılıyor.');
      return null;
    }
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

      applyAudioGraphRouting(source);
      return { ctx: audioContextInstance, gainNode: audioGainNodeInstance };
    } catch (err) {
      return null;
    }
  }

  function applyAudioGraphRouting(sourceNode) {
    if (!audioContextInstance || !audioGainNodeInstance) return;
    const { video } = findVideoAndPlayer();
    if (video && detectDrmStatus(video).isDrm) return;
    const source = sourceNode || (video ? audioSourceElementMap.get(video) : null);
    if (!source) return;

    try {
      source.disconnect();
      audioGainNodeInstance.disconnect();
      if (audioSplitterNodeInstance) audioSplitterNodeInstance.disconnect();
      if (audioMergerNodeInstance) audioMergerNodeInstance.disconnect();

      if (currentAudioMode === 'mono' && audioSplitterNodeInstance && audioMergerNodeInstance) {
        source.connect(audioSplitterNodeInstance);
        audioSplitterNodeInstance.connect(audioMergerNodeInstance, 0, 0);
        audioSplitterNodeInstance.connect(audioMergerNodeInstance, 0, 1);
        audioSplitterNodeInstance.connect(audioMergerNodeInstance, 1, 0);
        audioSplitterNodeInstance.connect(audioMergerNodeInstance, 1, 1);
        audioMergerNodeInstance.connect(audioGainNodeInstance);
      } else {
        source.connect(audioGainNodeInstance);
      }

      audioGainNodeInstance.connect(audioContextInstance.destination);
    } catch (e) {}
  }

  function updateVolumeSliderVisualGain(slider, percent) {
    if (!slider) return;
    slider.classList.remove('pvc-gain-normal', 'pvc-gain-warm', 'pvc-gain-hot');
    const ratio = Math.min(100, Math.max(0, (percent / 300) * 100));

    let activeColor = '#38bdf8';
    if (percent > 200) {
      slider.classList.add('pvc-gain-hot');
      activeColor = '#f43f5e';
    } else if (percent > 100) {
      slider.classList.add('pvc-gain-warm');
      activeColor = '#f59e0b';
    } else {
      slider.classList.add('pvc-gain-normal');
      activeColor = '#38bdf8';
    }

    slider.style.setProperty(
      'background',
      `linear-gradient(90deg, ${activeColor} 0%, ${activeColor} ${ratio}%, #1e293b ${ratio}%, #1e293b 100%)`,
      'important'
    );
  }

  let isInternalVolumeUpdating = false;

  function setAudioVolume(percent) {
    if (isInternalVolumeUpdating) return;
    isInternalVolumeUpdating = true;
    try {
      const { video } = findVideoAndPlayer();
      const isDrm = video ? detectDrmStatus(video).isDrm : false;
      const validPercent = Math.max(0, Math.min(300, Math.round(percent)));
      currentAudioVolumePercent = validPercent;

      if (video) {
        if (validPercent === 0) {
          video.muted = true;
          video.volume = 0;
        } else {
          video.muted = false;
          video.volume = Math.min(1.0, validPercent / 100);
        }
      }

      if (HOSTNAME.includes('kick.com')) {
        KickAdapter.syncKickPlayerVolume(validPercent);
      } else if (HOSTNAME.includes('trt') || currentActiveAdapterName === 'TrtAdapter') {
        TrtAdapter.syncTrtUiVolume(validPercent);
      }

      if (video && !isDrm) {
        initAudioGraphForVideo(video);
        if (audioGainNodeInstance && audioContextInstance) {
          if (audioContextInstance.state === 'suspended') {
            audioContextInstance.resume().catch(() => {});
          }
          const gainMultiplier = validPercent > 100 ? (validPercent / 100) : 1.0;
          audioGainNodeInstance.gain.setValueAtTime(gainMultiplier, audioContextInstance.currentTime);
        }
      }

      const slider = document.getElementById('pvc-volume-slider');
      const hdrBadge = document.getElementById('pvc-hdr-volume-badge');
      if (slider) {
        slider.value = validPercent.toString();
        updateVolumeSliderVisualGain(slider, validPercent);
      }
      if (hdrBadge) {
        hdrBadge.textContent = `${validPercent}%`;
        hdrBadge.style.color = validPercent > 200 ? '#f43f5e' : (validPercent > 100 ? '#fbbf24' : '#38bdf8');
      }

      updateCollapsedSummaryBar();

      let boostMsg = '';
      if (isDrm && validPercent > 100) {
        boostMsg = ' (🛡️ DRM: Yerel %100 Limiti)';
      } else if (validPercent > 100) {
        boostMsg = ` (🚀 +${validPercent - 100}% Booster)`;
      }
      showToast(`🔊 Ses: %${validPercent}${boostMsg}`);
    } finally {
      isInternalVolumeUpdating = false;
    }
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

    updateCollapsedSummaryBar();
    showToast(`Ses Modu: ${mode === 'mono' ? '🎛️ Mono (Birleşik Kanal)' : '🎧 Stereo (Çift Kanal)'}`);
  }

  function seekBy(seconds) {
    const { video, player } = findVideoAndPlayer();
    if (!video) return false;

    try {
      const current = (player && typeof player.currentTime === 'function') ? player.currentTime() : (video.currentTime || 0);
      const target = Math.max(0, current + seconds);

      if (player && typeof player.currentTime === 'function') {
        player.currentTime(target);
      } else {
        video.currentTime = target;
      }

      showToast(seconds > 0 ? `+${seconds}s İleri` : `${seconds}s Geri`);
      return true;
    } catch (err) {
      return false;
    }
  }

  // =========================================================================
  // ⌨️ İZOLE KLAVYE KISAYOLLARI MOTORU (STATELESS KEYBINDINGS - MADDE 1)
  // =========================================================================
  function isEditableTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    if (el.getAttribute && (el.getAttribute('contenteditable') === 'true' || el.getAttribute('role') === 'textbox')) return true;
    return false;
  }

  function cycleNextQuality() {
    const qualities = discoverStreamQualities();
    if (!qualities || qualities.length === 0) return;

    let currentIdx = qualities.findIndex(q => q.id === activeForcedQualityId || q.label === activeForcedQualityLabel);
    const nextIdx = (currentIdx + 1) % qualities.length;
    const chosen = qualities[nextIdx];

    activeForcedQualityId = chosen.id;
    activeForcedQualityLabel = chosen.label;
    const { video, player } = findVideoAndPlayer();
    const adapter = getActiveAdapter(video, player);
    adapter.applyQuality(chosen, video, player);
    renderDynamicQualityButtons();
  }

  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement || (document.activeElement && document.activeElement.shadowRoot && document.activeElement.shadowRoot.activeElement);
    if (isEditableTarget(e.target) || isEditableTarget(activeEl)) return;

    // Ctrl + Shift + S -> HUD Gizle / Göster (Kısayollar kapalı olsa dahi çalışır)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyS') {
      e.preventDefault();
      e.stopPropagation();
      togglePvcPopup();
      return;
    }

    if (!hotkeysEnabled) return;

    const { video } = findVideoAndPlayer();
    if (!video) return;

    // Shift + ArrowUp / ArrowDown -> %10 Ses Kontrolü (%0 - %300)
    if (e.shiftKey && !e.ctrlKey && !e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.key === 'ArrowUp' ? 10 : -10;
      setAudioVolume(currentAudioVolumePercent + delta);
      return;
    }

    // Alt + Q -> Kalite Değiştir
    if (e.altKey && !e.ctrlKey && e.code === 'KeyQ') {
      e.preventDefault();
      e.stopPropagation();
      cycleNextQuality();
      return;
    }

    // Alt + P -> Resim İçinde Resim (PiP)
    if (e.altKey && !e.ctrlKey && e.code === 'KeyP') {
      e.preventDefault();
      e.stopPropagation();
      togglePictureInPicture();
      return;
    }

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // [ veya ] -> Oynatma Hızı -0.25x / +0.25x
    if (e.key === '[' || e.key === ']') {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.key === ']' ? 0.25 : -0.25;
      setSpeed((video.playbackRate || targetEnforcedPlaybackRate || 1.0) + delta);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      e.stopPropagation();
      setSpeed(1.0);
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      e.stopPropagation();
      setAudioMode(currentAudioMode === 'stereo' ? 'mono' : 'stereo');
    }
  }, { capture: true });

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

      btn.onclick = (e) => {
        e.stopPropagation();
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

  async function switchToPuhuMncdnDirectly(video, player) {
    showToast('🚀 1080p FHD MNCDN akışı aranıyor...');
    try {
      if (lastCapturedDygApiUrl) {
        const mnApiUrl = lastCapturedDygApiUrl.replace('akamai=true', 'akamai=false');
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
    } catch (err) {}
    showToast('1080p FHD MNCDN akışı için sayfa yenileniyor...');
    setTimeout(() => window.location.reload(), 400);
  }

  let periodicPingTimer = null;

  async function testCdnPing(silent = false) {
    const { video, player } = findVideoAndPlayer();
    if (!video) {
      if (!silent) showToast('Video bulunamadı');
      return null;
    }

    let targetUrl = (player && typeof player.currentSrc === 'function') ? player.currentSrc() : '';
    if (!targetUrl || targetUrl.startsWith('blob:')) targetUrl = video.currentSrc || video.src || '';

    if (!targetUrl || targetUrl.startsWith('blob:')) {
      const resources = performance.getEntriesByType('resource');
      const mediaEntry = [...resources].reverse().find(r => 
        r.name.includes('.ts') || r.name.includes('.m4s') || r.name.includes('.m3u8') || r.name.includes('mncdn') || r.name.includes('akamaized') || r.name.includes('kick') || r.name.includes('ivs') || r.name.includes('ercdn')
      );
      if (mediaEntry) targetUrl = mediaEntry.name;
    }

    if (!targetUrl) {
      if (!silent) showToast('Ping için aktif CDN akışı bulunamadı');
      return null;
    }

    let hostDisplay = 'CDN';
    try { hostDisplay = new URL(targetUrl).hostname; } catch (e) {}

    const updatePingBadge = (ms) => {
      const pingBtn = document.getElementById('pvc-ping-btn');
      if (pingBtn) {
        pingBtn.textContent = `📡 ${ms} ms`;
        pingBtn.style.color = ms <= 50 ? '#34d399' : (ms <= 120 ? '#38bdf8' : '#f59e0b');
      }
    };

    try {
      const startTime = performance.now();
      await fetch(targetUrl, { method: 'HEAD', cache: 'no-store', mode: 'cors' });
      const ms = Math.round(performance.now() - startTime);
      updatePingBadge(ms);
      if (!silent) showToast(`📡 ${ms} ms (${hostDisplay})`);
      return { ms, host: hostDisplay };
    } catch (err) {
      try {
        const startTime = performance.now();
        await fetch(targetUrl, { method: 'GET', cache: 'no-store', mode: 'no-cors' });
        const ms = Math.round(performance.now() - startTime);
        updatePingBadge(ms);
        if (!silent) showToast(`📡 ${ms} ms (${hostDisplay})`);
        return { ms, host: hostDisplay };
      } catch (innerErr) {
        if (!silent) showToast(`Ping ölçülemedi (${hostDisplay})`);
        return null;
      }
    }
  }

  function startPeriodicPingEngine() {
    if (periodicPingTimer) clearInterval(periodicPingTimer);
    periodicPingTimer = setInterval(() => {
      if (document.hidden) return;
      const popup = document.getElementById('pvc-controller-popup');
      const { video } = findVideoAndPlayer();
      if ((popup && popup.style.display !== 'none') || (video && !video.paused)) {
        testCdnPing(true);
      }
    }, 15000);
  }

  function collectNetworkTelemetry() {
    try {
      const resources = performance.getEntriesByType('resource');
      return resources.filter(r => r.name.includes('.m3u8') || r.name.includes('.ts') || r.name.includes('.m4s') || r.name.includes('ivs')).slice(-8).map(e => {
        let domain = 'Bilinmeyen';
        try { domain = new URL(e.name).hostname; } catch (_) {}
        return { host: domain, type: e.initiatorType || 'media', durationMs: Math.round(e.duration), sampleUrl: sanitizeStreamUrl(e.name) };
      });
    } catch (e) { return []; }
  }

  function reportAnonymousError(errorCode, message) {
    const { playerType, video, player } = findVideoAndPlayer();
    const cleanHostname = window.location.hostname || 'bilinmeyen-site';

    let capturedSampleUrl = (player && typeof player.currentSrc === 'function') ? player.currentSrc() : '';
    if (!capturedSampleUrl && video) capturedSampleUrl = video.currentSrc || video.src || '';

    const videoStats = video ? {
      renderedResolution: `${video.videoWidth}x${video.videoHeight}`,
      displaySize: `${video.clientWidth}x${video.clientHeight}`,
      paused: video.paused,
      muted: video.muted,
      playbackRate: video.playbackRate,
      audioMode: currentAudioMode,
      volumePercent: currentAudioVolumePercent,
      videoFilters: videoFilterState,
      subtitleLoaded: customSubtitleCues.length > 0,
      subtitleOffsetMs
    } : null;

    const anonymousPayload = {
      timestamp: new Date().toISOString(),
      extensionVersion: EXTENSION_VERSION,
      versionHistory: VERSION_HISTORY.slice(0, 3),
      errorCode: errorCode || 'USER_MANUAL_DIAGNOSTIC',
      cleanMessage: message ? sanitizeStreamUrl(message) : 'Kullanıcı teşhis ve hata bildirimini tetikledi.',
      streamSampleUrl: sanitizeStreamUrl(capturedSampleUrl),
      playerType,
      activeAdapter: currentActiveAdapterName,
      isDrmProtected: activeDrmState.isDrm,
      drmKeySystem: activeDrmState.keySystem,
      isShadowDom: isMediaInShadowDom,
      domain: cleanHostname,
      videoState: videoStats,
      userComments: '',
      networkTelemetry: collectNetworkTelemetry(),
      recentLogs: DIAGNOSTIC_LOG_BUFFER.slice(-20)
    };

    showErrorModal(anonymousPayload);
  }

  function showErrorModal(payload) {
    const existing = document.getElementById('pvc-error-modal');
    if (existing) existing.remove();

    const updatePayloadJson = () => {
      payload.userComments = document.getElementById('pvc-user-feedback-input')?.value || '';
      return JSON.stringify(payload, null, 2);
    };

    const modal = document.createElement('div');
    modal.id = 'pvc-error-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Zenginleştirilmiş Teşhis & Sürüm Raporu (v${EXTENSION_VERSION})</span>
          <button id="pvc-close-modal-btn" aria-label="Raporu Kapat">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Sitede (<strong>${payload.domain}</strong>) oynatıcı durumu anonimleştirilerek toplandı (<strong>Sıfır Kişisel Veri</strong>):
          </p>
          <div style="margin-bottom: 12px;">
            <textarea id="pvc-user-feedback-input" placeholder="Karşılaştığınız durumu buraya yazabilirsiniz..." style="width: 100%; height: 56px; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; color: #f8fafc; font-size: 11px; padding: 8px; resize: none;"></textarea>
          </div>
          <pre id="pvc-modal-code-block" class="pvc-modal-code">${JSON.stringify(payload, null, 2)}</pre>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-copy-payload-btn" class="pvc-modal-btn-secondary">📋 JSON Kopyala</button>
          <a id="pvc-send-mail-link" href="#" target="_blank" class="pvc-modal-btn-primary" style="background:#2563eb;">✉️ E-posta</a>
          <a id="pvc-open-github-link" href="#" target="_blank" class="pvc-modal-btn-primary" style="background:#4f46e5;">🐙 GitHub Issue</a>
        </div>
      </div>
    `;

    getActiveContainer().appendChild(modal);

    ['click', 'mousedown', 'pointerdown'].forEach(evtType => {
      modal.addEventListener(evtType, (e) => {
        if (e.target === modal) modal.remove();
        else e.stopPropagation();
      });
    });

    const feedbackInput = document.getElementById('pvc-user-feedback-input');
    const codeBlock = document.getElementById('pvc-modal-code-block');
    const mailLink = document.getElementById('pvc-send-mail-link');
    const ghLink = document.getElementById('pvc-open-github-link');

    const refreshLinks = () => {
      const updatedJson = updatePayloadJson();
      codeBlock.textContent = updatedJson;
      const issueTitle = encodeURIComponent(`[Teşhis/v${EXTENSION_VERSION}]: ${payload.domain} - ${payload.errorCode}`);
      ghLink.href = `${GITHUB_REPO_URL}/issues/new?title=${issueTitle}`;
      mailLink.href = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}&body=${encodeURIComponent(updatedJson.slice(0, 1500))}`;
    };

    feedbackInput.addEventListener('input', refreshLinks);
    refreshLinks();

    document.getElementById('pvc-close-modal-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
    document.getElementById('pvc-copy-payload-btn').onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(updatePayloadJson());
      showToast('Teşhis JSON panoya kopyalandı!');
    };
  }

  function showPermissionsGuideModal() {
    const existing = document.getElementById('pvc-permissions-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pvc-permissions-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>🔐 İzinler & Klavye Kısayolları Rehberi (v${EXTENSION_VERSION})</span>
          <button id="pvc-close-perms-btn">✕</button>
        </div>
        <div class="pvc-modal-body">
          <div class="pvc-perm-card">
            <div class="pvc-perm-title">⌨️ Aktif Klavye Kısayolları</div>
            <div class="pvc-perm-step">• <strong>[</strong> ve <strong>]</strong> : Oynatma hızını 0.25x azalt / artır</div>
            <div class="pvc-perm-step">• <strong>R</strong> : Oynatma hızını 1.0x değerine sıfırla</div>
            <div class="pvc-perm-step">• <strong>M</strong> : Stereo / Mono ses kanalı geçişi</div>
            <div class="pvc-perm-step">• <strong>Shift + ↑ / ↓</strong> : Sesi %10 artır / azalt (%300 Booster dahil)</div>
            <div class="pvc-perm-step">• <strong>Alt + Q</strong> : Sonraki akış kalitesine geç</div>
            <div class="pvc-perm-step">• <strong>Alt + P</strong> : Resim İçinde Resim (PiP) aç / kapat</div>
            <div class="pvc-perm-step">• <strong>Ctrl + Shift + S</strong> : Kontrol panelini gizle / göster</div>
            <div class="pvc-perm-step">• <strong>Çift Tıklama</strong> : Herhangi bir slider'a çift tıklayarak sıfırlayın</div>
          </div>
          <div class="pvc-perm-card">
            <div class="pvc-perm-title">🌐 Tarayıcı Site Erişimi (${HOSTNAME})</div>
            <div class="pvc-perm-step">Araç çubuğundaki NOk simgesine tıklayarak veya sağ tıklayıp "Bu Siteye Erişebilir" seçeneğini aktif ederek tüm oynatıcı kancalarını çalıştırabilirsiniz.</div>
          </div>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-dismiss-perms-btn" class="pvc-modal-btn-secondary" style="width:100%;">Tamam, Kapat</button>
        </div>
      </div>
    `;

    getActiveContainer().appendChild(modal);
    ['click', 'mousedown', 'pointerdown'].forEach(evtType => {
      modal.addEventListener(evtType, (e) => {
        if (e.target === modal) modal.remove();
        else e.stopPropagation();
      });
    });
    document.getElementById('pvc-close-perms-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
    document.getElementById('pvc-dismiss-perms-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
  }

  function showAdapterPickerModal() {
    const existing = document.getElementById('pvc-adapter-modal');
    if (existing) existing.remove();

    const { video, player } = findVideoAndPlayer();
    const modal = document.createElement('div');
    modal.id = 'pvc-adapter-modal';

    const optionsHtml = [
      { name: '', label: '⚡ Otomatik (Önerilen)', tier: 'Akıllı', desc: 'Sistem sayfayı ve oynatıcı prototiplerini analiz ederek en uygun adaptörü otomatik seçer.' },
      ...ALL_ADAPTERS.map(a => ({
        name: a.name,
        label: a.displayName || a.name,
        tier: `Tier ${a.tier || 3}`,
        desc: a.tier === 1 ? 'Siteye özel derin API/Ağ kancası' : a.tier === 2 ? 'Oynatıcı kütüphanesi API kancası' : 'Evrensel HTML5 ve Shadow DOM tarayıcısı'
      }))
    ].map(opt => {
      const isSelected = (!userForcedAdapterName && opt.name === '') || (userForcedAdapterName === opt.name);
      return `
        <div class="pvc-adapter-option ${isSelected ? 'pvc-adapter-selected' : ''}" data-adapter="${opt.name}" style="padding: 10px 12px; background: ${isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.1)'}; border-radius: 8px; margin-bottom: 8px; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <span style="font-weight: 700; font-size: 13px; color: ${isSelected ? '#38bdf8' : '#f8fafc'};">${opt.label}</span>
            <span class="pvc-val-badge" style="font-size: 10px;">${opt.tier}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8;">${opt.desc}</div>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="pvc-modal-card" style="max-height: 85vh; display: flex; flex-direction: column;">
        <div class="pvc-modal-header">
          <span>🧩 Oynatıcı Adaptörü Seçimi (Basamaklı Hat)</span>
          <button id="pvc-close-adapter-btn">✕</button>
        </div>
        <div class="pvc-modal-body" style="overflow-y: auto; flex: 1;">
          ${optionsHtml}
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-dismiss-adapter-btn" class="pvc-modal-btn-secondary" style="width: 100%;">Kapat</button>
        </div>
      </div>
    `;

    getActiveContainer().appendChild(modal);
    ['click', 'mousedown', 'pointerdown'].forEach(evtType => {
      modal.addEventListener(evtType, (e) => {
        if (e.target === modal) modal.remove();
        else e.stopPropagation();
      });
    });

    modal.querySelectorAll('.pvc-adapter-option').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        userForcedAdapterName = el.getAttribute('data-adapter');
        const newAdapter = getActiveAdapter(video, player);
        renderDynamicQualityButtons();
        updateRealtimeResolutionBadge();
        showToast(userForcedAdapterName ? `Adaptör: ${newAdapter.name}` : 'Adaptör: Otomatik Mod');
        modal.remove();
      });
    });

    document.getElementById('pvc-close-adapter-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
    document.getElementById('pvc-dismiss-adapter-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
  }

  function showDrmInfoModal() {
    const existing = document.getElementById('pvc-drm-modal');
    if (existing) existing.remove();

    const { video } = findVideoAndPlayer();
    const drm = detectDrmStatus(video);

    const modal = document.createElement('div');
    modal.id = 'pvc-drm-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span style="color: #fbbf24;">🛡️ DRM / EME Korumalı Akış Bilgilendirmesi</span>
          <button id="pvc-close-drm-btn">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Bu video akışı <strong>${drm.keySystem}</strong> ile şifrelenmiştir. Donanım ses kesintisini önlemek adına Web Audio API ses yükselticisi (%300) devre dışı bırakılmış olup yerel ses (%100), hız, görüntü filtreleri ve altyazı kontrolleri aktif tutulmuştur.
          </p>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-dismiss-drm-btn" class="pvc-modal-btn-secondary" style="width: 100%;">Anladım, Kapat</button>
        </div>
      </div>
    `;

    getActiveContainer().appendChild(modal);
    ['click', 'mousedown', 'pointerdown'].forEach(evtType => {
      modal.addEventListener(evtType, (e) => {
        if (e.target === modal) modal.remove();
        else e.stopPropagation();
      });
    });
    document.getElementById('pvc-close-drm-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
    document.getElementById('pvc-dismiss-drm-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
  }

  function resetIdleTimer(popup) {
    if (!popup) return;
    popup.classList.remove('pvc-idle-hidden', 'pvc-idle-semi');

    clearTimeout(idleTimerStep1);
    clearTimeout(idleTimerStep2);

    idleTimerStep1 = setTimeout(() => {
      if (!popup.matches(':hover') && !popup.contains(document.activeElement)) {
        popup.classList.add('pvc-idle-semi');
      }
      idleTimerStep2 = setTimeout(() => {
        if (!popup.matches(':hover') && !popup.contains(document.activeElement)) {
          popup.classList.add('pvc-idle-hidden');
        }
      }, 2000);
    }, idleDelaySeconds * 1000);
  }

  // =========================================================================
  // 🧲 MIKNATISLI KENAR HİZALAMA (MAGNETIC EDGE SNAPPING) & VIEWPORT CLAMPING (MADDE 9)
  // =========================================================================
  const SNAP_THRESHOLD = 16;
  const EDGE_MARGIN = 12;

  function clampPopupToViewport(popup) {
    const target = popup || document.getElementById('pvc-controller-popup');
    if (!target || target.style.display === 'none') return;

    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const rect = target.getBoundingClientRect();
    const w = rect.width || target.offsetWidth || 320;
    const h = rect.height || target.offsetHeight || 200;

    let newLeft = rect.left;
    let newTop = rect.top;

    if (newLeft < EDGE_MARGIN) newLeft = EDGE_MARGIN;
    if (newLeft + w > vw - EDGE_MARGIN) newLeft = Math.max(EDGE_MARGIN, vw - w - EDGE_MARGIN);
    if (newTop < EDGE_MARGIN) newTop = EDGE_MARGIN;
    if (newTop + h > vh - EDGE_MARGIN) newTop = Math.max(EDGE_MARGIN, vh - h - EDGE_MARGIN);

    target.style.setProperty('left', `${Math.round(newLeft)}px`, 'important');
    target.style.setProperty('top', `${Math.round(newTop)}px`, 'important');
    target.style.setProperty('right', 'auto', 'important');
    target.style.setProperty('bottom', 'auto', 'important');
  }

  window.addEventListener('resize', () => {
    const popup = document.getElementById('pvc-controller-popup');
    if (popup) clampPopupToViewport(popup);
  });

  function makeDraggable(popup, header) {
    let isDragging = false;
    let startClientX = 0;
    let startClientY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;
      
      isDragging = true;
      resetIdleTimer(popup);

      const rect = popup.getBoundingClientRect();
      startClientX = e.clientX;
      startClientY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        resetIdleTimer(popup);

        const vw = window.innerWidth || document.documentElement.clientWidth;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const w = popup.offsetWidth || 320;
        const h = popup.offsetHeight || 200;

        let candidateLeft = startLeft + (moveEvent.clientX - startClientX);
        let candidateTop = startTop + (moveEvent.clientY - startClientY);
        let snapped = false;

        // Mıknatıslı Kenar Yakalama (Sol / Sağ / Üst / Alt 16px eşiği)
        if (Math.abs(candidateLeft - EDGE_MARGIN) <= SNAP_THRESHOLD) {
          candidateLeft = EDGE_MARGIN;
          snapped = true;
        } else if (Math.abs((vw - w - EDGE_MARGIN) - candidateLeft) <= SNAP_THRESHOLD) {
          candidateLeft = vw - w - EDGE_MARGIN;
          snapped = true;
        }

        if (Math.abs(candidateTop - EDGE_MARGIN) <= SNAP_THRESHOLD) {
          candidateTop = EDGE_MARGIN;
          snapped = true;
        } else if (Math.abs((vh - h - EDGE_MARGIN) - candidateTop) <= SNAP_THRESHOLD) {
          candidateTop = vh - h - EDGE_MARGIN;
          snapped = true;
        }

        // Viewport Clamping
        candidateLeft = Math.max(EDGE_MARGIN, Math.min(vw - w - EDGE_MARGIN, candidateLeft));
        candidateTop = Math.max(EDGE_MARGIN, Math.min(vh - h - EDGE_MARGIN, candidateTop));

        popup.classList.toggle('pvc-snapped-edge', snapped);
        popup.style.setProperty('left', `${Math.round(candidateLeft)}px`, 'important');
        popup.style.setProperty('top', `${Math.round(candidateTop)}px`, 'important');
        popup.style.setProperty('right', 'auto', 'important');
        popup.style.setProperty('bottom', 'auto', 'important');
      };

      const onMouseUp = () => {
        isDragging = false;
        setTimeout(() => popup.classList.remove('pvc-snapped-edge'), 350);
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
      <div id="pvc-drag-header" class="pvc-menu-header" title="Sürüklemek için basılı tutun (Kenarlara 16px yaklaşınca mıknatıslı hizalanır)">
        <div class="pvc-menu-brand">
          ${NOK_LOGO_URL ? `<img src="${NOK_LOGO_URL}" alt="NOk" class="pvc-brand-logo" />` : ''}
          <span class="pvc-menu-badge" title="NOk Video Controller v${EXTENSION_VERSION}">NOkrep v${EXTENSION_VERSION}</span>
          <span class="pvc-menu-title">NOk Controller</span>
        </div>
        <div class="pvc-header-actions">
          <button id="pvc-pip-btn" class="pvc-icon-btn" title="Resim İçinde Resim (PiP) Aç/Kapat (Alt+P)" aria-label="Resim İçinde Resim">🖼️</button>
          <button id="pvc-hotkeys-toggle-btn" class="pvc-icon-btn pvc-btn-active" title="Klavye Kısayolları Aktif (Kapatmak için tıklayın)" aria-label="Klavye Kısayolları">⌨️</button>
          <button id="pvc-collapse-btn" class="pvc-icon-btn" title="Paneli Küçült / Büyüt" aria-label="Paneli Küçült veya Büyüt">➖</button>
          <button id="pvc-close-popup-btn" class="pvc-icon-btn pvc-close" title="Kapat (Ctrl+Shift+S)" aria-label="Denetim Masasını Kapat">✕</button>
        </div>
      </div>

      <!-- Küçültülmüş (Collapsed Mini-Pill) Detaylı Bilgi ve Hızlı Kontrol Barı (Madde 6) -->
      <div id="pvc-collapsed-summary-bar">
        <div class="pvc-mini-metrics-row">
          <span id="pvc-mini-res-val" style="color: #38bdf8;">🎬 ---</span>
          <span id="pvc-mini-speed-val" style="color: #f8fafc;">⚡ 1.0x</span>
          <span id="pvc-mini-vol-val" style="color: #34d399;">🔊 %100 (S)</span>
          <span id="pvc-mini-adapter-val" style="color: #a78bfa; font-size: 9.5px;">Generic</span>
        </div>
        <div class="pvc-mini-quick-controls">
          <button id="pvc-mini-seek-m10" class="pvc-action-btn" title="10s Geri">⏮️ -10s</button>
          <button id="pvc-mini-play-pause" class="pvc-action-btn" title="Oynat / Duraklat">⏯️ Oynat</button>
          <button id="pvc-mini-seek-p10" class="pvc-action-btn" title="10s İleri">⏭️ +10s</button>
          <button id="pvc-mini-pip-btn" class="pvc-action-btn" title="PiP Aç/Kapat">🖼️ PiP</button>
        </div>
      </div>

      <!-- Canlı Render Çözünürlüğü Rozeti -->
      <div id="pvc-realtime-res-container" style="padding: 7px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: space-between; border-radius: 6px; margin-bottom: 6px;" title="Oynatıcıda o an işlenen video piksel boyutu">
        <span id="pvc-realtime-res-badge" style="font-size: 11px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, monospace; color: #38bdf8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;" aria-live="polite">
          🎬 Gerçek: Ölçülüyor...
        </span>
        <button id="pvc-refresh-res-btn" style="background: none; border: none; color: #94a3b8; font-size: 12px; cursor: pointer; padding: 2px 4px;" title="Çözünürlük ve Paketleri Yenile">🔄</button>
      </div>

      <!-- Basamaklı Adaptör Durumu & Manuel Seçici Barı -->
      <div id="pvc-adapter-bar" style="padding: 5px 10px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 6px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <span style="font-size: 10.5px; color: #94a3b8;">Adaptör:</span>
          <span id="pvc-active-adapter-badge" style="font-size: 10.5px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">Otomatik</span>
        </div>
        <button id="pvc-change-adapter-btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;" title="Adaptör Listesini Aç ve Değiştir">Değiştir ▾</button>
      </div>

      <!-- DRM Koruma Rozeti -->
      <div id="pvc-drm-status-badge" style="display: none; padding: 5px 10px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; margin-bottom: 6px; color: #fbbf24; font-size: 10.5px; font-weight: 600; cursor: pointer;">
        <span>🛡️ DRM Korumalı Akış (Güvenli Mod)</span>
      </div>

      <!-- Video Bulunamadı Uyarısı -->
      <div id="pvc-no-video-alert" style="display: none; padding: 8px 10px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 6px; margin-bottom: 8px; font-size: 11px; color: #fca5a5;">
        <div style="font-weight: 700; margin-bottom: 2px;">⚠️ Aktif Oynatıcı Bekleniyor</div>
        <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 6px;">Sayfadaki video henüz başlamadı veya farklı bir çerçeve içinde.</div>
        <div style="display: flex; gap: 6px;">
          <button id="pvc-rescan-btn" style="flex: 1; padding: 3px; background: #2563eb; color: #fff; border: none; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer;">🔄 Yeniden Tara</button>
          <button id="pvc-quick-report-btn" style="flex: 1; padding: 3px; background: rgba(255,255,255,0.08); color: #f1f5f9; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; font-size: 10px; cursor: pointer;">📋 Teşhis Raporu</button>
        </div>
      </div>

      <!-- 1. BÖLÜM: Oynatma Hızı & Sarma -->
      <div class="pvc-menu-section" id="pvc-section-speed">
        <div class="pvc-section-header" data-target="pvc-content-speed">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">⚡ Oynatma Hızı & Sarma</span>
          </div>
          <span id="pvc-hdr-speed-badge" class="pvc-val-badge">1.0x</span>
        </div>
        <div id="pvc-content-speed" class="pvc-section-content">
          <div class="pvc-slider-row">
            <span class="pvc-slider-bound">0.25x</span>
            <input type="range" id="pvc-speed-slider" min="0.25" max="3.0" step="0.25" value="1.0" class="pvc-range-slider" title="Çift tıklayarak 1.0x değerine sıfırlayabilirsiniz ([ / ])" />
            <span class="pvc-slider-bound">3.0x</span>
          </div>
          <div class="pvc-quick-speed-buttons">
            <button class="pvc-chip-btn" data-speed="1.0">1.0x</button>
            <button class="pvc-chip-btn" data-speed="1.25">1.25x</button>
            <button class="pvc-chip-btn" data-speed="1.5">1.5x</button>
            <button class="pvc-chip-btn" data-speed="2.0">2.0x</button>
          </div>
          <div class="pvc-btn-grid-4" style="margin-top: 6px;">
            <button id="pvc-seek-m30" class="pvc-action-btn">⏪ -30s</button>
            <button id="pvc-seek-m10" class="pvc-action-btn">⏮️ -10s</button>
            <button id="pvc-seek-p10" class="pvc-action-btn">⏭️ +10s</button>
            <button id="pvc-seek-p30" class="pvc-action-btn">⏩ +30s</button>
          </div>
        </div>
      </div>

      <!-- 2. BÖLÜM: Ses Düzeyi (%0 - %300 Booster) & Stereo/Mono (Madde 8) -->
      <div class="pvc-menu-section" id="pvc-section-audio">
        <div class="pvc-section-header" data-target="pvc-content-audio">
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
            <input type="range" id="pvc-volume-slider" min="0" max="300" step="5" value="100" class="pvc-range-slider pvc-gain-normal" title="Ses (%0-%300 Güçlendirici) • Çift tıklayarak %100'e sıfırlayın" />
            <span class="pvc-slider-bound" style="color: #f43f5e;" title="Maksimum %300 Ses Güçlendirici">%300 🚀</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <div class="pvc-quick-speed-buttons" style="flex: 1; margin-right: 6px;">
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="0">%0</button>
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="100">%100</button>
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="200">%200</button>
              <button class="pvc-chip-btn pvc-vol-preset-btn" data-vol="300">%300</button>
            </div>
            <div style="display: flex; gap: 3px;">
              <button id="pvc-audio-stereo-btn" class="pvc-audio-mode-btn pvc-audio-active" title="Stereo (M)">🎧 Stereo</button>
              <button id="pvc-audio-mono-btn" class="pvc-audio-mode-btn" title="Mono (M)">🎛️ Mono</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. BÖLÜM: Akış Paket Kaliteleri -->
      <div class="pvc-menu-section" id="pvc-section-quality">
        <div class="pvc-section-header" data-target="pvc-content-quality">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">🎬 Akış Paket Kaliteleri</span>
          </div>
          <span id="pvc-quality-count-badge" class="pvc-val-badge">Paketler...</span>
        </div>
        <div id="pvc-content-quality" class="pvc-section-content">
          <div id="pvc-dynamic-quality-container" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;"></div>
        </div>
      </div>

      <!-- 4. BÖLÜM: Görüntü Filtreleri & Gece Kalkanı (Madde 3) -->
      <div class="pvc-menu-section pvc-section-collapsed" id="pvc-section-filters">
        <div class="pvc-section-header" data-target="pvc-content-filters">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">🎨 Görüntü Filtreleri & Gece Kalkanı</span>
          </div>
          <span id="pvc-hdr-filter-badge" class="pvc-val-badge">Standart</span>
        </div>
        <div id="pvc-content-filters" class="pvc-section-content">
          <div class="pvc-slider-row">
            <span class="pvc-slider-bound" title="Parlaklık">☀️</span>
            <input type="range" id="pvc-filter-brightness" min="50" max="150" step="5" value="100" class="pvc-range-slider" title="Parlaklık (%50-%150) • Çift tıkla sıfırla" />
            <span id="pvc-val-brightness" class="pvc-slider-bound">%100</span>
          </div>
          <div class="pvc-slider-row">
            <span class="pvc-slider-bound" title="Kontrast">◐</span>
            <input type="range" id="pvc-filter-contrast" min="50" max="150" step="5" value="100" class="pvc-range-slider" title="Kontrast (%50-%150) • Çift tıkla sıfırla" />
            <span id="pvc-val-contrast" class="pvc-slider-bound">%100</span>
          </div>
          <div class="pvc-slider-row">
            <span class="pvc-slider-bound" title="Doygunluk">🌈</span>
            <input type="range" id="pvc-filter-saturate" min="0" max="200" step="10" value="100" class="pvc-range-slider" title="Doygunluk (%0-%200) • Çift tıkla sıfırla" />
            <span id="pvc-val-saturate" class="pvc-slider-bound">%100</span>
          </div>
          <div class="pvc-btn-grid-3">
            <button id="pvc-btn-night-shield" class="pvc-action-btn" title="Mavi ışığı azaltan sıcak Gece Kalkanı">🌙 Gece Modu</button>
            <button id="pvc-btn-invert-color" class="pvc-action-btn" title="Renkleri ters çevir">🔄 Ters Renk</button>
            <button id="pvc-btn-reset-filters" class="pvc-action-btn" title="Tüm filtreleri sıfırla">♻️ Sıfırla</button>
          </div>
        </div>
      </div>

      <!-- 5. BÖLÜM: Bellek İçi Harici Altyazı (.srt / .vtt) & Senkron (Madde 4) -->
      <div class="pvc-menu-section pvc-section-collapsed" id="pvc-section-subtitles">
        <div class="pvc-section-header" data-target="pvc-content-subtitles">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">💬 Harici Altyazı & Senkron</span>
          </div>
          <span id="pvc-sub-offset-badge" class="pvc-val-badge">0ms</span>
        </div>
        <div id="pvc-content-subtitles" class="pvc-section-content">
          <input type="file" id="pvc-sub-file-input" accept=".srt,.vtt" style="display: none !important;" />
          <div class="pvc-btn-grid-2" style="margin-bottom: 6px;">
            <button id="pvc-sub-load-btn" class="pvc-action-btn" title="RAM üzerinden .srt veya .vtt dosyası yükle">📂 .SRT / .VTT Yükle</button>
            <button id="pvc-sub-toggle-btn" class="pvc-action-btn pvc-active" title="Altyazı katmanını göster/gizle">👁️ Altyazı: Açık</button>
          </div>
          <div id="pvc-sub-status-text" style="font-size: 10px; color: #94a3b8; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            Yüklü altyazı yok (Sıfır Depolama RAM Modu)
          </div>
          <div class="pvc-btn-grid-3">
            <button id="pvc-sub-sync-m100" class="pvc-action-btn" title="Altyazıyı 100ms geri çek">⏪ -100ms</button>
            <button id="pvc-sub-sync-reset" class="pvc-action-btn" title="Senkron kaymasını sıfırla">0ms Sıfırla</button>
            <button id="pvc-sub-sync-p100" class="pvc-action-btn" title="Altyazıyı 100ms ileri al">⏩ +100ms</button>
          </div>
        </div>
      </div>

      <!-- Footer: Ping, Rehber/Kısayollar ve Teşhis -->
      <div class="pvc-menu-footer" id="pvc-menu-footer">
        <button id="pvc-ping-btn" class="pvc-footer-btn pvc-btn-emerald" title="Sunucu gecikmesini ölç (CDN Ping)">📡 CDN Ping</button>
        <button id="pvc-perms-btn" class="pvc-footer-btn pvc-btn-sky" title="Klavye Kısayolları & İzin Rehberi">⌨️ Kısayollar</button>
        <button id="pvc-report-err-btn" class="pvc-footer-btn pvc-btn-amber" title="Zenginleştirilmiş teşhis paketini aç">⚠️ Teşhis</button>
      </div>
    `;

    getActiveContainer().appendChild(popup);

    // Olay İzolasyonu (e.stopPropagation)
    ['click', 'pointerdown', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick'].forEach(evtType => {
      popup.addEventListener(evtType, (e) => {
        e.stopPropagation();
      }, { capture: false });
    });

    const dragHeader = popup.querySelector('#pvc-drag-header');
    makeDraggable(popup, dragHeader);

    popup.addEventListener('mouseenter', () => popup.classList.remove('pvc-idle-semi', 'pvc-idle-hidden'));
    popup.addEventListener('mouseleave', () => resetIdleTimer(popup));
    popup.addEventListener('mousemove', () => resetIdleTimer(popup));
    popup.addEventListener('mousedown', () => resetIdleTimer(popup));

    window.addEventListener('mousemove', () => {
      if (popup && popup.style.display !== 'none') {
        if (popup.classList.contains('pvc-idle-hidden')) {
          popup.classList.remove('pvc-idle-hidden');
          popup.classList.add('pvc-idle-semi');
        }
        resetIdleTimer(popup);
      }
    }, { passive: true });

    // Akordeon Başlıkları (Çoklu açık kalabilir - Madde 7)
    popup.querySelectorAll('.pvc-section-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        resetIdleTimer(popup);
        const section = header.closest('.pvc-menu-section');
        if (section) {
          section.classList.toggle('pvc-section-collapsed');
          clampPopupToViewport(popup);
        }
      });
    });

    // PiP ve Kısayol Anahtarı Butonları
    popup.querySelector('#pvc-pip-btn').onclick = (e) => {
      e.stopPropagation();
      resetIdleTimer(popup);
      togglePictureInPicture();
    };

    const hkBtn = popup.querySelector('#pvc-hotkeys-toggle-btn');
    hkBtn.onclick = (e) => {
      e.stopPropagation();
      resetIdleTimer(popup);
      hotkeysEnabled = !hotkeysEnabled;
      hkBtn.classList.toggle('pvc-btn-active', hotkeysEnabled);
      showToast(hotkeysEnabled ? '⌨️ Klavye Kısayolları Aktif' : '🔇 Klavye Kısayolları Devre Dışı');
    };

    // Küçültülmüş Mini-Bar Hızlı Butonları (Madde 6)
    popup.querySelector('#pvc-mini-seek-m10').onclick = (e) => { e.stopPropagation(); seekBy(-10); };
    popup.querySelector('#pvc-mini-seek-p10').onclick = (e) => { e.stopPropagation(); seekBy(10); };
    popup.querySelector('#pvc-mini-pip-btn').onclick = (e) => { e.stopPropagation(); togglePictureInPicture(); };
    popup.querySelector('#pvc-mini-play-pause').onclick = (e) => {
      e.stopPropagation();
      const { video } = findVideoAndPlayer();
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => {});
        e.currentTarget.textContent = '⏸️ Duraklat';
      } else {
        video.pause();
        e.currentTarget.textContent = '▶️ Oynat';
      }
    };

    // Hız Slider + Çift Tıkla Sıfırlama (Madde 8)
    const speedSlider = popup.querySelector('#pvc-speed-slider');
    speedSlider.addEventListener('input', (e) => {
      e.stopPropagation();
      resetIdleTimer(popup);
      setSpeed(parseFloat(e.target.value));
    });
    speedSlider.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      setSpeed(1.0);
    });

    popup.querySelectorAll('.pvc-chip-btn[data-speed]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        resetIdleTimer(popup);
        setSpeed(parseFloat(btn.getAttribute('data-speed')));
      };
    });

    // Ses Slider (%0 - %300) + Görsel Renk Geçişi + Çift Tıkla Sıfırlama (Madde 8)
    const volumeSlider = popup.querySelector('#pvc-volume-slider');
    updateVolumeSliderVisualGain(volumeSlider, currentAudioVolumePercent);
    volumeSlider.addEventListener('input', (e) => {
      e.stopPropagation();
      resetIdleTimer(popup);
      setAudioVolume(parseInt(e.target.value, 10));
    });
    volumeSlider.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      setAudioVolume(100);
    });

    popup.querySelectorAll('.pvc-vol-preset-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        resetIdleTimer(popup);
        setAudioVolume(parseInt(btn.getAttribute('data-vol'), 10));
      };
    });

    popup.querySelector('#pvc-audio-stereo-btn').onclick = (e) => { e.stopPropagation(); setAudioMode('stereo'); };
    popup.querySelector('#pvc-audio-mono-btn').onclick = (e) => { e.stopPropagation(); setAudioMode('mono'); };

    // Sarma Butonları
    popup.querySelector('#pvc-seek-m30').onclick = (e) => { e.stopPropagation(); seekBy(-30); };
    popup.querySelector('#pvc-seek-m10').onclick = (e) => { e.stopPropagation(); seekBy(-10); };
    popup.querySelector('#pvc-seek-p10').onclick = (e) => { e.stopPropagation(); seekBy(10); };
    popup.querySelector('#pvc-seek-p30').onclick = (e) => { e.stopPropagation(); seekBy(30); };

    // Görüntü Filtreleri Kontrolleri + Çift Tıkla Sıfırlama (Madde 3 & 8)
    const bindFilterSlider = (id, key) => {
      const el = popup.querySelector(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        e.stopPropagation();
        resetIdleTimer(popup);
        videoFilterState[key] = parseInt(e.target.value, 10);
        applyVideoFiltersToElement();
      });
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        videoFilterState[key] = 100;
        applyVideoFiltersToElement();
        showToast('🎨 Filtre %100 değerine sıfırlandı');
      });
    };
    bindFilterSlider('#pvc-filter-brightness', 'brightness');
    bindFilterSlider('#pvc-filter-contrast', 'contrast');
    bindFilterSlider('#pvc-filter-saturate', 'saturate');

    popup.querySelector('#pvc-btn-night-shield').onclick = (e) => {
      e.stopPropagation();
      videoFilterState.nightShield = !videoFilterState.nightShield;
      applyVideoFiltersToElement();
      showToast(videoFilterState.nightShield ? '🌙 Gece Kalkanı Aktif' : '☀️ Gece Kalkanı Kapatıldı');
    };

    popup.querySelector('#pvc-btn-invert-color').onclick = (e) => {
      e.stopPropagation();
      videoFilterState.invert = !videoFilterState.invert;
      applyVideoFiltersToElement();
      showToast(videoFilterState.invert ? '🔄 Ters Renk Modu Aktif' : '🔄 Ters Renk Kapatıldı');
    };

    popup.querySelector('#pvc-btn-reset-filters').onclick = (e) => {
      e.stopPropagation();
      resetVideoFilters();
    };

    // Harici Altyazı Kontrolleri (Madde 4)
    const subFileInput = popup.querySelector('#pvc-sub-file-input');
    const subStatusText = popup.querySelector('#pvc-sub-status-text');
    const subToggleBtn = popup.querySelector('#pvc-sub-toggle-btn');

    popup.querySelector('#pvc-sub-load-btn').onclick = (e) => {
      e.stopPropagation();
      subFileInput.click();
    };

    subFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const content = loadEvt.target && loadEvt.target.result;
        if (typeof content === 'string') {
          customSubtitleCues = parseSrtOrVttContent(content);
          subtitleFileName = file.name;
          subtitleOffsetMs = 0;
          const badge = document.getElementById('pvc-sub-offset-badge');
          if (badge) badge.textContent = '0ms';
          if (subStatusText) {
            subStatusText.textContent = `✅ ${subtitleFileName} (${customSubtitleCues.length} satır RAM'de)`;
            subStatusText.style.color = '#34d399';
          }
          const { video } = findVideoAndPlayer();
          if (video) {
            injectNativeTextTrackCues(video);
            renderCustomSubtitleCue(video);
          }
          showToast(`💬 Altyazı Yüklendi: ${customSubtitleCues.length} satır`);
        }
      };
      reader.readAsText(file, 'UTF-8');
    });

    subToggleBtn.onclick = (e) => {
      e.stopPropagation();
      subtitleOverlayEnabled = !subtitleOverlayEnabled;
      subToggleBtn.classList.toggle('pvc-active', subtitleOverlayEnabled);
      subToggleBtn.textContent = subtitleOverlayEnabled ? '👁️ Altyazı: Açık' : '🙈 Altyazı: Gizli';
      const { video } = findVideoAndPlayer();
      if (video) renderCustomSubtitleCue(video);
    };

    popup.querySelector('#pvc-sub-sync-m100').onclick = (e) => { e.stopPropagation(); shiftSubtitleSync(-100); };
    popup.querySelector('#pvc-sub-sync-p100').onclick = (e) => { e.stopPropagation(); shiftSubtitleSync(100); };
    popup.querySelector('#pvc-sub-sync-reset').onclick = (e) => {
      e.stopPropagation();
      subtitleOffsetMs = 0;
      const badge = document.getElementById('pvc-sub-offset-badge');
      if (badge) badge.textContent = '0ms';
      const { video } = findVideoAndPlayer();
      if (video) {
        injectNativeTextTrackCues(video);
        renderCustomSubtitleCue(video);
      }
      showToast('💬 Altyazı Senkronu Sıfırlandı (0ms)');
    };

    // Çözünürlük, Adaptör, DRM ve Footer Butonları
    popup.querySelector('#pvc-refresh-res-btn').onclick = (e) => {
      e.stopPropagation();
      updateRealtimeResolutionBadge();
      renderDynamicQualityButtons();
      testCdnPing(true);
      showToast(`🎬 Güncellendi: ${lastObservedResolution}`);
    };

    popup.querySelector('#pvc-change-adapter-btn').onclick = (e) => {
      e.stopPropagation();
      showAdapterPickerModal();
    };

    popup.querySelector('#pvc-drm-status-badge').onclick = (e) => {
      e.stopPropagation();
      showDrmInfoModal();
    };

    popup.querySelector('#pvc-rescan-btn').onclick = (e) => {
      e.stopPropagation();
      const { video } = findVideoAndPlayer();
      if (video) {
        monitorVideoResolution(video);
        updateRealtimeResolutionBadge();
        renderDynamicQualityButtons();
        showToast('🎬 Video başarıyla yakalandı!');
      } else {
        showToast('Video henüz bulunamadı');
      }
    };

    popup.querySelector('#pvc-quick-report-btn').onclick = (e) => {
      e.stopPropagation();
      reportAnonymousError('NO_VIDEO_FOUND', 'Sayfada herhangi bir video oynatıcı kilitlenemedi.');
    };

    popup.querySelector('#pvc-ping-btn').onclick = async function (e) {
      e.stopPropagation();
      this.textContent = 'Ölçülüyor...';
      const res = await testCdnPing(false);
      this.textContent = (res && res.ms !== undefined) ? `📡 ${res.ms} ms` : '📡 Ping';
    };

    popup.querySelector('#pvc-perms-btn').onclick = (e) => {
      e.stopPropagation();
      showPermissionsGuideModal();
    };

    popup.querySelector('#pvc-report-err-btn').onclick = (e) => {
      e.stopPropagation();
      reportAnonymousError('USER_MANUAL_DIAGNOSTIC', 'Kullanıcı teşhis ve hata bildirimini tetikledi.');
    };

    popup.querySelector('#pvc-close-popup-btn').onclick = (e) => {
      e.stopPropagation();
      popup.style.display = 'none';
    };

    // Küçültme / Genişletme (➖ / ➕) (Madde 6)
    let isCollapsed = false;
    popup.querySelector('#pvc-collapse-btn').onclick = (e) => {
      e.stopPropagation();
      resetIdleTimer(popup);
      isCollapsed = !isCollapsed;
      popup.classList.toggle('pvc-collapsed', isCollapsed);
      popup.querySelector('#pvc-collapse-btn').textContent = isCollapsed ? '➕' : '➖';
      updateRealtimeResolutionBadge();
      clampPopupToViewport(popup);
    };

    renderDynamicQualityButtons();
    updateCollapsedSummaryBar();
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
      clampPopupToViewport(popup);
      resetIdleTimer(popup);
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();
      testCdnPing(true);

      const { video } = findVideoAndPlayer();
      if (video) {
        monitorVideoResolution(video);
        const slider = popup.querySelector('#pvc-speed-slider');
        const hdrSpeed = popup.querySelector('#pvc-hdr-speed-badge');
        if (slider) slider.value = (video.playbackRate || 1.0).toString();
        if (hdrSpeed) hdrSpeed.textContent = `${video.playbackRate || 1.0}x`;
        initAudioGraphForVideo(video);
      }
      showToast(`NOk Video Controller Aktif (v${EXTENSION_VERSION})`);
    }
  }

  startPeriodicPingEngine();
  setTimeout(() => {
    const { video } = findVideoAndPlayer();
    if (video) {
      monitorVideoResolution(video);
    }
    testCdnPing(true);
  }, 1000);

})();