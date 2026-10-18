/**
 * injected.js - NOk Video Controller v0.5.5 (Main World Engine)
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
  const EXTENSION_VERSION = '0.5.5';
  const NOK_LOGO_URL = (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.logoUrl) || '';
  const VERSION_HISTORY = [
    { version: 'v0.5.5', notes: 'Altyazı display:none!important görünürlük hatası giderildi; videoya konumlandırma, native fullscreen/PiP track yolu ve sınırlı çizim durumu eklendi. Hls.js boş p etiketleri kaldırıldı, manifest/oynatılan çözünürlük ayrıldı, geç gelen seviye listesi olaylarla yenileniyor. Tek seviye tüm kaynağın tek kalite sunduğu kanıtı sayılmıyor. Canlı Firefox doğrulaması bekliyor.' },
    { version: 'v0.5.4', notes: 'Video bulunamıyor raporunda otomatik sorun seçimi; SRT/VTT boşluk ayrıştırma düzeltmesi; seçili videoya bağlı Shaka/Hls.js/Video.js instance seçimi; TRT Shaka kalite/hız desteği ve sınırlı hız koruması; göstermelik kalite seçeneklerinin kaldırılması; gömülü çerçevelerde panel açma sinyali; pasif HTTP zamanlaması ve manuel HEAD ölçümü. Canlı tarayıcı/site doğrulaması bekliyor.' },
    { version: 'v0.5.3', notes: 'Gizlilik odaklı teşhis şeması v2: URL/alan adı/kesin saat/konsol toplama kaldırıldı; sınırlı teknik durum ve sabit olay kodları, istenen/okunan hız-ses değerleri, isteğe bağlı açıklama ve güvenli metin önizlemesi. Canlı site ve tarayıcı doğrulaması bekliyor.' },
    { version: 'v0.5.2', notes: 'İzole klavye kısayolları motoru, görüntü filtreleri ve gece kalkanı modülü, bellek içi .srt/.vtt harici altyazı yükleyici ve ±100ms senkronizasyon, doğrudan PiP kontrolü, küçültülmüş detaylı bilgi barı, %300 ses booster + dinamik renk geçişi + çift tıkla sıfırlama, mıknatıslı kenar hizalama (magnetic edge snapping) ve Manifest V3 service_worker düzeltmesi.' },
    { version: 'v0.5.1', notes: 'Evrensel medya tespiti, Shadow DOM ve Web Component derin BFS tarayıcısı, Widevine/FairPlay DRM korumalı akış güvenli modu (%100 ses kilit koruması), 3-kademeli basamaklı adaptör mimarisi (Cascade Strategy Pipeline), manuel adaptör seçici ve tek tıkla geliştiriciye anonim teşhis bildirme motoru.' },
    { version: 'v0.5.0', notes: 'Kick.com %0/Mute ve tüm ses seviyelerinde (%50/%100/%150) kesintisiz Radix UI & React Slider eşitlemesi, Kick VOD oynatma hızı 2-kademeli açılır pencere (popover submenu) otomasyonu, TRT 1 / TRT İzle HUD tıklama ve olay yakalama izolasyonu.' }
  ];

  if (window.__NOK_VIDEO_CONTROLLER_INJECTED__) {
    window.postMessage({ type: 'PVC_TOGGLE_POPUP' }, '*');
    return;
  }
  window.__NOK_VIDEO_CONTROLLER_INJECTED__ = true;

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === 'PVC_TOGGLE_POPUP' || event.data.type === 'PVC_TOGGLE_UI' || event.data.type === 'NOK_CONTROLLER_TOGGLE') {
      togglePvcPopup();
    } else if (event.data.type === 'PVC_OPEN_IF_MEDIA') {
      if (deepFindMediaElements().some(item => item.video.readyState > 0)) {
        window.postMessage({ type: 'PVC_OPEN_POPUP' }, '*');
      }
    } else if (event.data.type === 'PVC_OPEN_POPUP') {
      const popup = document.getElementById('pvc-controller-popup') || buildPvcPopup();
      popup.style.display = 'block';
      resetPopupToDefaultPosition(popup);
      clampPopupToViewport(popup);
      resetIdleTimer(popup);
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();
      if (!findVideoAndPlayer().video) window.postMessage({ type: 'PVC_OPEN_IN_CHILD_FRAMES' }, '*');
      showToast(`NOk Video Controller Aktif (v${EXTENSION_VERSION})`);
    }
  });

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
  let pendingQualityHeight = 0;
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
  let subtitleLoadStatus = 'not-loaded';
  let subtitleRenderStatus = 'not-loaded';

  // Amazon IVS Player Global Kanca
  let globalCapturedIvsPlayer = null;

  // Yalnızca seçili video ile ilişkilendirilmiş gerçek instance'lar kullanılır.
  const mediaLibraryBindings = new WeakMap();
  const hookedLibraryMethods = new WeakSet();
  const observedHlsPlayers = new WeakMap();

  function observeHlsPlayer(hls, video) {
    if (observedHlsPlayers.has(hls)) { observedHlsPlayers.get(hls).video = video; return; }
    if (typeof hls.on !== 'function') return;
    const state = { video, manifestObserved: false, declaredLevelCount: null };
    observedHlsPlayers.set(hls, state);
    let pendingRefresh = false;
    const refresh = () => {
      if (pendingRefresh || state.video.isConnected === false) return;
      pendingRefresh = true;
      setTimeout(() => {
        pendingRefresh = false;
        if (state.video.isConnected !== false && findVideoAndPlayer().video === state.video) renderDynamicQualityButtons();
      }, 100);
    };
    hls.on('hlsManifestLoading', () => {
      state.manifestObserved = false;
      state.declaredLevelCount = null;
      refresh();
    });
    hls.on('hlsManifestLoaded', (_event, data) => {
      state.manifestObserved = true;
      state.declaredLevelCount = Array.isArray(data?.levels) ? data.levels.length : null;
      refresh();
    });
    for (const event of ['hlsManifestParsed', 'hlsLevelsUpdated', 'hlsLevelSwitched']) hls.on(event, refresh);
  }

  function rememberMediaLibrary(video, kind, player) {
    if (video?.tagName !== 'VIDEO') return;
    const bindings = mediaLibraryBindings.get(video) || {};
    bindings[kind] = player;
    mediaLibraryBindings.set(video, bindings);
    video[kind === 'hls' ? '__nokHlsPlayer' : '__nokShakaPlayer'] = player;
    if (kind === 'hls') observeHlsPlayer(player, video);
  }

  function hookMediaLibraries() {
    const wrap = (prototype, method, kind) => {
      const original = prototype?.[method];
      if (typeof original !== 'function' || hookedLibraryMethods.has(original)) return;
      const wrapped = function (...args) {
        const result = original.apply(this, args);
        try {
          const media = kind === 'hls' ? (args[0]?.media || args[0])
            : method === 'attach' ? args[0] : this.getMediaElement?.();
          rememberMediaLibrary(media, kind, this);
        } catch (_) {}
        return result;
      };
      try { prototype[method] = wrapped; hookedLibraryMethods.add(wrapped); } catch (_) {}
    };
    wrap(window.Hls?.prototype, 'attachMedia', 'hls');
    wrap(window.shaka?.Player?.prototype, 'attach', 'shaka');
    wrap(window.shaka?.Player?.prototype, 'load', 'shaka');
  }

  function findLibraryPlayer(video, kind, hint) {
    if (!video) return null;
    const bound = mediaLibraryBindings.get(video)?.[kind];
    const candidates = [bound, hint, kind === 'hls' ? video.hls : video._shakaPlayer,
      kind === 'hls' ? video.__nokHlsPlayer : video.__nokShakaPlayer];
    // Shaka UI kendisine ait oynatıcıyı dışa açar; başka videonun instance'ı alınmaz.
    for (let node = video, depth = 0; node && depth < 6; node = node.parentElement, depth++) {
      candidates.push(kind === 'hls' ? node.hls : node._shakaPlayer);
      if (kind === 'shaka') {
        try {
          const controls = node.ui?.getControls?.();
          candidates.push(controls?.getLocalPlayer?.() || controls?.getPlayer?.());
        } catch (_) {}
      }
    }
    const view = video.ownerDocument?.defaultView || window;
    if (kind === 'hls' && Array.isArray(view.Hls?.instances)) candidates.push(...view.Hls.instances);
    for (const candidate of candidates) {
      try {
        if (kind === 'hls' && candidate?.media === video && Array.isArray(candidate.levels)) {
          observeHlsPlayer(candidate, video);
          return candidate;
        }
        if (kind === 'shaka' && typeof candidate?.getVariantTracks === 'function'
            && candidate.getMediaElement?.() === video) return candidate;
      } catch (_) {}
    }
    return null;
  }

  function findVideoJsPlayer(video, hint) {
    if (!video) return null;
    const candidates = [hint, video.player, video.vjsPlayer, video.parentElement?.player];
    const view = video.ownerDocument?.defaultView || window;
    try { candidates.push(...(view.videojs?.getAllPlayers?.() || [])); } catch (_) {}
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object' || typeof candidate.currentTime !== 'function'
          || typeof candidate.playbackRate !== 'function') continue;
      try {
        const element = candidate.el?.();
        if (element?.contains(video) || candidate.tech_?.el_ === video
            || candidate === video.player || candidate === video.vjsPlayer
            || candidate === video.parentElement?.player) return candidate;
      } catch (_) {}
    }
    return null;
  }

  // SCRIPT load yakalama, SDK yüklenmesi ile ilk attach arasındaki aralığı kapsar.
  document.addEventListener('load', event => {
    if (event.target?.tagName === 'SCRIPT') hookMediaLibraries();
  }, true);
  hookMediaLibraries();

  function hookIvsInstance(player) {
    if (!player || typeof player !== 'object') return player;
    globalCapturedIvsPlayer = player;
    if (typeof player.attachHTMLVideoElement === 'function' && !player.__nokHookedAttach) {
      player.__nokHookedAttach = true;
      const origAttach = player.attachHTMLVideoElement;
      player.attachHTMLVideoElement = function (videoEl, ...args) {
        if (videoEl) videoEl.__ivsPlayer = this;
        globalCapturedIvsPlayer = this;
        addDiagnosticLog('INFO', 'IVS_ATTACHED');
        return origAttach.apply(this, [videoEl, ...args]);
      };
    }
    return player;
  }

  try {
    const hookIvsSdk = () => {
      hookMediaLibraries();
      if (window.IVSPlayer && typeof window.IVSPlayer.create === 'function' && !window.IVSPlayer.__nokHooked) {
        window.IVSPlayer.__nokHooked = true;
        const origCreate = window.IVSPlayer.create;
        window.IVSPlayer.create = function (...args) {
          const p = origCreate.apply(this, args);
          addDiagnosticLog('INFO', 'IVS_CREATED');
          return hookIvsInstance(p);
        };
        if (window.IVSPlayer.prototype && typeof window.IVSPlayer.prototype.attachHTMLVideoElement === 'function' && !window.IVSPlayer.prototype.__nokHooked) {
          window.IVSPlayer.prototype.__nokHooked = true;
          const origProtoAttach = window.IVSPlayer.prototype.attachHTMLVideoElement;
          window.IVSPlayer.prototype.attachHTMLVideoElement = function (videoEl, ...args) {
            if (videoEl) videoEl.__ivsPlayer = this;
            globalCapturedIvsPlayer = this;
            addDiagnosticLog('INFO', 'IVS_ATTACHED');
            return origProtoAttach.apply(this, [videoEl, ...args]);
          };
        }
      }
      if (window.AmazonIVS && typeof window.AmazonIVS.createMediaPlayer === 'function' && !window.AmazonIVS.__nokHooked) {
        window.AmazonIVS.__nokHooked = true;
        const origCreate2 = window.AmazonIVS.createMediaPlayer;
        window.AmazonIVS.createMediaPlayer = function (...args) {
          const p = origCreate2.apply(this, args);
          addDiagnosticLog('INFO', 'IVS_CREATED');
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
      addDiagnosticLog('INFO', 'STREAM_DETECTED');
      if (targetPuhuSmilLevel === '1080p.smil' && url.includes('akamai=true')) {
        const redirectUrl = url.replace('akamai=true', 'akamai=false');
        addDiagnosticLog('INFO', 'STREAM_REDIRECTED');
        return redirectUrl;
      }
    }

    if (url.includes('erbvr.com') || url.includes('ercdn.net')) {
      if (url.includes('.smil/playlist.m3u8') || url.includes('.m3u8')) {
        lastCapturedNowPlaylistUrl = url;
        addDiagnosticLog('INFO', 'STREAM_DETECTED');
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
      if (targetTrtQualitySuffix && !activeDrmState.isDrm && (url.includes('master') || url.includes('.m3u8') || url.includes('.ts'))) {
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
  // 📝 GİZLİLİK ODAKLI BELLEK İÇİ TEŞHİS (SABİT OLAY ŞEMASI)
  // =========================================================================
  const DIAGNOSTIC_LOG_BUFFER = [];
  const MAX_LOG_BUFFER_SIZE = 40;

  // Serbest mesaj, URL, hata nesnesi veya iç içe nesne kabul edilmez.
  // Bilinmeyen olay/alanlar kaydedilmez; yalnızca aşağıdaki sayısal alanlar tutulur.
  const DIAGNOSTIC_EVENT_FIELDS = Object.freeze({
    IVS_ATTACHED: [], IVS_CREATED: [], STREAM_DETECTED: [], STREAM_REDIRECTED: [],
    FULLSCREEN_ENTERED: [], FULLSCREEN_EXITED: [], DRM_DETECTED: [],
    SOURCE_SWITCH_STARTED: [], SOURCE_SWITCH_COMPLETED: [], PIP_FAILED: [],
    WEB_AUDIO_DRM_SKIPPED: [],
    SPEED_REQUESTED: ['rate'], SPEED_FAILED: [],
    VOLUME_REQUESTED: ['percent'], AUDIO_MODE_CHANGED: ['mono'], SEEK_REQUESTED: ['delta'],
    QUALITY_REQUESTED: ['height'],
    KICK_SPEED_SYNC: ['reactInvoked', 'ivsInvoked'],
    KICK_VOLUME_SYNC: ['reactInvoked', 'ivsInvoked'],
    KICK_SYNC_FAILED: [], QUALITY_REJECTED: [],
    TRT_RATE_REAPPLIED: ['rate'], TRT_RATE_GAVE_UP: [],
    SUBTITLE_LOADED: [], SUBTITLE_PARSE_EMPTY: [], SUBTITLE_READ_FAILED: []
  });

  function diagnosticNumber(value, min, max, step = 1) {
    return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
      ? Math.round(value / step) * step : null;
  }

  function addDiagnosticLog(level, event, details = {}) {
    if (!Object.prototype.hasOwnProperty.call(DIAGNOSTIC_EVENT_FIELDS, event)) return;
    const safeDetails = {};
    const ranges = {
      rate: [0.25, 3, 0.01], percent: [0, 300, 1], mono: [0, 1, 1],
      delta: [-30, 30, 1], height: [0, 4320, 1],
      reactInvoked: [0, 1, 1], ivsInvoked: [0, 1, 1]
    };
    for (const key of DIAGNOSTIC_EVENT_FIELDS[event]) {
      const value = diagnosticNumber(details?.[key], ...ranges[key]);
      if (value !== null) safeDetails[key] = value;
    }
    DIAGNOSTIC_LOG_BUFFER.push({
      at: performance.now(),
      level: ['INFO', 'WARN', 'ERROR'].includes(level) ? level : 'INFO',
      event,
      details: safeDetails
    });
    if (DIAGNOSTIC_LOG_BUFFER.length > MAX_LOG_BUFFER_SIZE) DIAGNOSTIC_LOG_BUFFER.shift();
  }

  function collectDiagnosticEvents() {
    const now = performance.now();
    return DIAGNOSTIC_LOG_BUFFER.slice(-20).map(entry => ({
      ageSeconds: Math.min(3600, Math.max(0, Math.floor((now - entry.at) / 5000) * 5)),
      level: entry.level, event: entry.event, details: { ...entry.details }
    }));
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
        addDiagnosticLog('INFO', 'FULLSCREEN_ENTERED');
      } else {
        popup.classList.remove('pvc-in-fullscreen');
        addDiagnosticLog('INFO', 'FULLSCREEN_EXITED');
      }
      clampPopupToViewport(popup);
    }

    if (toast && toast.parentElement !== activeTarget) {
      activeTarget.appendChild(toast);
    }

    if (subOverlay && subOverlay.parentElement !== activeTarget) {
      activeTarget.appendChild(subOverlay);
    }
    if (customSubtitleCues.length) {
      const { video } = findVideoAndPlayer();
      if (video) renderCustomSubtitleCue(video);
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
          addDiagnosticLog('WARN', 'DRM_DETECTED');
          updateDrmHudBadge(this);
        }
        return origSetMediaKeys.apply(this, arguments);
      };
    }
  } catch (e) {}

  document.addEventListener('encrypted', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') {
      e.target.__nokEncryptedEvent = true;
      addDiagnosticLog('WARN', 'DRM_DETECTED');
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
    const shaka = findLibraryPlayer(selectedVideo, 'shaka');
    const hls = findLibraryPlayer(selectedVideo, 'hls');
    const vjs = findVideoJsPlayer(selectedVideo);

    if (HOSTNAME.includes('youtube.com')) {
      playerType = 'youtube-player';
      player = document.getElementById('movie_player') || null;
    } else if (selectedVideo.__ivsPlayer || globalCapturedIvsPlayer) {
      player = selectedVideo.__ivsPlayer || globalCapturedIvsPlayer;
      playerType = 'amazon-ivs';
    } else if (shaka) {
      player = shaka;
      playerType = 'shaka-player';
    } else if (hls) {
      player = hls;
      playerType = 'hlsjs';
    } else if (vjs) {
      player = vjs;
      playerType = 'videojs-attached';
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
    addDiagnosticLog('INFO', 'SOURCE_SWITCH_STARTED');

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
      addDiagnosticLog('INFO', 'SOURCE_SWITCH_COMPLETED');
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
        const reactInvoked = this.findAndInvokeReactVolume(validPercent);

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
        addDiagnosticLog('INFO', 'KICK_VOLUME_SYNC', {
          reactInvoked: reactInvoked ? 1 : 0,
          ivsInvoked: ivs && typeof ivs.setVolume === 'function' ? 1 : 0
        });
      } catch (e) { addDiagnosticLog('WARN', 'KICK_SYNC_FAILED'); }
    },
    syncKickPlayerSpeed(rate) {
      try {
        const { video } = findVideoAndPlayer();
        const ivs = this.findIvsPlayer(video);
        if (ivs && typeof ivs.setPlaybackRate === 'function') ivs.setPlaybackRate(rate);
        const reactInvoked = this.findAndInvokeReactSpeed(rate);
        if (video) {
          video.playbackRate = rate;
          video.defaultPlaybackRate = rate;
          video.dispatchEvent(new Event('ratechange', { bubbles: true }));
        }
        addDiagnosticLog('INFO', 'KICK_SPEED_SYNC', {
          reactInvoked: reactInvoked ? 1 : 0,
          ivsInvoked: ivs && typeof ivs.setPlaybackRate === 'function' ? 1 : 0
        });
      } catch (e) { addDiagnosticLog('WARN', 'KICK_SYNC_FAILED'); }
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
    getQualities(video, player) {
      for (const adapter of [ShakaPlayerAdapter, HlsJsAdapter, VideoJsAdapter]) {
        if (adapter.matches(video, player)) {
          const qualities = adapter.getQualities(video, player);
          if (qualities.length) return qualities;
        }
      }
      // Yalnızca bilinen eski TRT manifest rotasında ağ fallback'i gösterilir.
      if (detectDrmStatus(video).isDrm || !/\/master(?:1080p|720p|576p|480p|360p|240p)?[_.]/i.test(lastCapturedTrtStreamUrl)) return [];
      return [
        { id: 'trt_1080', label: '1080p (FHD)', height: 1080, suffix: '1080p' },
        { id: 'trt_720', label: '720p (HD)', height: 720, suffix: '720p' },
        { id: 'trt_576', label: '576p (PAL)', height: 576, suffix: '576p' },
        { id: 'trt_480', label: '480p (SD)', height: 480, suffix: '480p' },
        { id: 'trt_360', label: '360p (Düşük)', height: 360, suffix: '360p' }
      ];
    },
    applyQuality(targetItem, video, player) {
      const providers = { shaka_: ShakaPlayerAdapter, hls_: HlsJsAdapter, vjs_: VideoJsAdapter };
      for (const [prefix, adapter] of Object.entries(providers)) {
        if (String(targetItem.id).startsWith(prefix)) {
          targetTrtQualitySuffix = null;
          return adapter.applyQuality(targetItem, video, player);
        }
      }
      if (!this.getQualities(video, player).some(item => item.id === targetItem.id)) return false;
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
      return !!findLibraryPlayer(video, 'hls', player);
    },
    getQualities(video, player) {
      const hls = findLibraryPlayer(video, 'hls', player);
      const results = [];
      if (hls && hls.levels && hls.levels.length > 0) {
        hls.levels.forEach((lvl, idx) => {
          const resolution = typeof lvl.attrs?.RESOLUTION === 'string'
            ? lvl.attrs.RESOLUTION.match(/^(\d+)x(\d+)$/i) : null;
          const declaredHeight = diagnosticNumber(lvl.height, 1, 4320)
            || (resolution ? diagnosticNumber(Number(resolution[2]), 1, 4320) : null);
          const current = hls.currentLevel === idx || (hls.levels.length === 1 && video.readyState >= 2);
          const observedHeight = current ? diagnosticNumber(video.videoHeight, 1, 4320) : null;
          const bitrate = diagnosticNumber(lvl.bitrate, 1, 1000000000);
          const label = declaredHeight ? `${declaredHeight}p`
            : observedHeight ? `${observedHeight}p · oynatılan`
            : bitrate ? `${(bitrate / 1000000).toFixed(1)} Mb/sn` : `Seviye ${idx + 1}`;
          results.push({ id: `hls_${idx}`, index: idx, label, height: declaredHeight || 0,
            resolutionSource: declaredHeight ? 'manifest' : observedHeight ? 'observed-video' : 'unknown',
            bitrate: bitrate || 0, raw: lvl });
        });
      }
      return results.sort((a, b) => (b.height || 0) - (a.height || 0));
    },
    applyQuality(targetItem, video, player) {
      const hls = findLibraryPlayer(video, 'hls', player);
      if (hls && Number.isInteger(targetItem.index) && hls.levels[targetItem.index]) {
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
      return !!findVideoJsPlayer(video, player);
    },
    getQualities(video, player) {
      const vjs = findVideoJsPlayer(video, player);
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
      const vjs = findVideoJsPlayer(video, player);
      if (vjs && typeof vjs.qualityLevels === 'function') {
        try {
          const ql = vjs.qualityLevels();
          if (ql && ql.length > 0 && Number.isInteger(targetItem.index) && ql[targetItem.index]) {
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
    matches(video, player) {
      return !!findLibraryPlayer(video, 'shaka', player);
    },
    getQualities(video, player) {
      const shaka = findLibraryPlayer(video, 'shaka', player);
      if (!shaka) return [];
      const tracks = shaka.getVariantTracks();
      const active = tracks.find(track => track.active);
      const heights = new Set();
      return tracks.filter(track => {
        if (!(track.height > 0) || (active?.language && track.language !== active.language)
            || (active?.audioId != null && track.audioId !== active.audioId) || heights.has(track.height)) return false;
        heights.add(track.height);
        return true;
      }).map(track => ({ id: `shaka_${track.id}`, label: `${track.height}p`, height: track.height, trackId: track.id }))
        .sort((a, b) => b.height - a.height);
    },
    applyQuality(targetItem, video, player) {
      const shaka = findLibraryPlayer(video, 'shaka', player);
      const track = shaka?.getVariantTracks().find(item => item.id === targetItem.trackId);
      if (!track || typeof shaka.configure !== 'function' || typeof shaka.selectVariantTrack !== 'function') return false;
      if (shaka.configure({ abr: { enabled: false } }) === false) return false;
      shaka.selectVariantTrack(track, true);
      showToast(`Shaka: ${targetItem.label} istendi`);
      return true;
    }
  };

  const DashJsAdapter = {
    name: 'DashJsAdapter',
    tier: 2,
    displayName: 'Dash.js (Tier 2)',
    matches() { return false; },
    getQualities() { return []; },
    applyQuality() { return false; }
  };

  const GenericAdapter = {
    name: 'GenericAdapter',
    tier: 3,
    displayName: 'Evrensel HTML5 & Shadow DOM (Tier 3)',
    matches() { return true; },
    getQualities() { return []; },
    applyQuality() { return false; }
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

    cachedDiscoveredQualities = [];
    if (video && typeof adapter.getQualities === 'function') {
      try {
        const found = adapter.getQualities(video, player);
        if (found && found.length > 0) {
          cachedDiscoveredQualities = found;
          return found;
        }
      } catch (e) {}
    }

    return [];
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
    const { video, player } = findVideoAndPlayer();
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
        if (pendingQualityHeight > 0 && h === pendingQualityHeight) {
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
      const adapter = getActiveAdapter(video, player);
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
    video.addEventListener('enterpictureinpicture', () => {
      updatePipButtonsState(true);
      renderCustomSubtitleCue(video);
    });
    video.addEventListener('leavepictureinpicture', () => {
      updatePipButtonsState(false);
      renderCustomSubtitleCue(video);
    });

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
        if (/firefox/i.test(navigator.userAgent)) {
          showToast('Firefox: PiP için videonun üzerindeki yerleşik PiP düğmesini kullanın');
        } else {
          showToast('Tarayıcınız bu videoda PiP API desteklemiyor');
        }
      }
    } catch (err) {
      addDiagnosticLog('WARN', 'PIP_FAILED');
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
    if (typeof tc !== 'string') return NaN;
    const match = tc.trim().match(/^(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})$/);
    if (!match || Number(match[2]) >= 60 || Number(match[3]) >= 60) return NaN;
    return Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
  }

  function parseSrtOrVttContent(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];
    const normalized = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\s*\n/);
    const cues = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length === 0) continue;
      if (/^(NOTE(?:\s|$)|STYLE(?:\s|$)|REGION(?:\s|$))/.test(lines[0])) continue;

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
      const endSec = parseTimecodeToSeconds(timeParts[1].trim().split(/\s+/)[0]);
      const textLines = lines.slice(timeLineIdx + 1).join('\n').replace(/<[^>]+>/g, '').trim();

      if (textLines && Number.isFinite(startSec) && Number.isFinite(endSec) && endSec > startSec) {
        cues.push({ start: startSec, end: endSec, text: textLines });
      }
    }
    return cues.sort((a, b) => a.start - b.start);
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
      subtitleRenderStatus = !subtitleOverlayEnabled ? 'disabled' : customSubtitleCues.length === 0 ? 'not-loaded' : 'no-video';
      if (overlay) overlay.style.setProperty('display', 'none', 'important');
      return;
    }

    const targetOverlay = ensureSubtitleOverlayElement();
    const effectiveTime = video.currentTime - (subtitleOffsetMs / 1000);
    const activeCue = customSubtitleCues.find(c => effectiveTime >= c.start && effectiveTime <= c.end);

    if (activeCue) {
      targetOverlay.textContent = activeCue.text;
      const nativeMode = document.fullscreenElement === video || video.ownerDocument?.pictureInPictureElement === video;
      if (video.__nokSubtitleTrack) video.__nokSubtitleTrack.mode = nativeMode ? 'showing' : 'hidden';
      if (nativeMode && video.__nokSubtitleTrack) {
        targetOverlay.style.setProperty('display', 'none', 'important');
        subtitleRenderStatus = 'native-requested';
        return;
      }
      // Altyazıyı sayfanın altına değil, seçili videonun görünür alanına yerleştir.
      const rect = video.getBoundingClientRect();
      let left = rect.left, top = rect.top, width = rect.width, height = rect.height;
      let view = video.ownerDocument?.defaultView;
      try {
        while (view && view !== window && view.frameElement) {
          const frame = view.frameElement;
          const bounds = frame.getBoundingClientRect();
          const scaleX = frame.offsetWidth ? bounds.width / frame.offsetWidth : 1;
          const scaleY = frame.offsetHeight ? bounds.height / frame.offsetHeight : 1;
          left = bounds.left + (left + (frame.clientLeft || 0)) * scaleX;
          top = bounds.top + (top + (frame.clientTop || 0)) * scaleY;
          width *= scaleX; height *= scaleY;
          view = view.parent;
        }
      } catch (_) {}
      const visibleLeft = Math.max(0, left), visibleRight = Math.min(window.innerWidth, left + width);
      const visibleTop = Math.max(0, top), visibleBottom = Math.min(window.innerHeight, top + height);
      if (visibleRight <= visibleLeft || visibleBottom <= visibleTop) {
        targetOverlay.style.setProperty('display', 'none', 'important');
        subtitleRenderStatus = 'video-offscreen';
        return;
      }
      targetOverlay.style.setProperty('left', `${(visibleLeft + visibleRight) / 2}px`, 'important');
      targetOverlay.style.setProperty('top', `${visibleBottom - Math.min(40, (visibleBottom - visibleTop) * 0.08)}px`, 'important');
      targetOverlay.style.setProperty('bottom', 'auto', 'important');
      targetOverlay.style.setProperty('transform', 'translate(-50%, -100%)', 'important');
      targetOverlay.style.setProperty('max-width', `${(visibleRight - visibleLeft) * 0.92}px`, 'important');
      targetOverlay.style.setProperty('display', 'block', 'important');
      subtitleRenderStatus = 'overlay-requested';
    } else {
      targetOverlay.style.setProperty('display', 'none', 'important');
      subtitleRenderStatus = 'no-active-cue';
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
      track.mode = subtitleOverlayEnabled ? 'hidden' : 'disabled';
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
  const trtRateGuards = new WeakMap();

  function armTrtRateGuard(video, rate) {
    let state = trtRateGuards.get(video);
    if (!state) {
      state = { rate, attempts: 0, timer: null, active: false };
      trtRateGuards.set(video, state);
      video.addEventListener('ratechange', () => {
        if (!state.active || state.timer !== null || video.isConnected === false || video.ended
            || video.readyState < 2 || Math.abs(video.playbackRate - state.rate) < 0.01
            || video.playbackRate !== 1) return;
        if (state.attempts >= 5) {
          state.active = false;
          addDiagnosticLog('WARN', 'TRT_RATE_GAVE_UP');
          return;
        }
        state.timer = setTimeout(() => {
          state.timer = null;
          if (!state.active || video.isConnected === false || video.ended || video.readyState < 2
              || video.playbackRate !== 1 || Math.abs(state.rate - 1) < 0.01) return;
          state.attempts++;
          try {
            video.playbackRate = state.rate;
            addDiagnosticLog('INFO', 'TRT_RATE_REAPPLIED', { rate: state.rate });
          } catch (_) { state.active = false; }
        }, 200);
      });
      video.addEventListener('emptied', () => {
        state.active = false;
        clearTimeout(state.timer);
        state.timer = null;
      });
    }
    clearTimeout(state.timer);
    Object.assign(state, { rate, attempts: 0, timer: null, active: rate !== 1 });
  }

  function setSpeed(rate) {
    const { video, player } = findVideoAndPlayer();
    if (!video) {
      showToast('Video elementi bulunamadı');
      return false;
    }

    try {
      const validRate = Math.min(3.0, Math.max(0.25, parseFloat(rate.toFixed(2))));
      targetEnforcedPlaybackRate = validRate;
      addDiagnosticLog('INFO', 'SPEED_REQUESTED', { rate: validRate });
      if (currentActiveAdapterName === 'TrtAdapter' || /(^|\.)(trt1\.com\.tr|trtizle\.com|trt\.com\.tr)$/.test(HOSTNAME)) {
        armTrtRateGuard(video, validRate);
      }
      video.playbackRate = validRate;
      video.defaultPlaybackRate = validRate;
      const shaka = findLibraryPlayer(video, 'shaka', player);
      if (shaka && typeof shaka.trickPlay === 'function') {
        try { shaka.trickPlay(validRate, false); } catch (_) {}
      }
      
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
      addDiagnosticLog('WARN', 'SPEED_FAILED');
      return false;
    }
  }

  function initAudioGraphForVideo(video) {
    if (!video) return null;
    if (detectDrmStatus(video).isDrm) {
      addDiagnosticLog('INFO', 'WEB_AUDIO_DRM_SKIPPED');
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
      addDiagnosticLog('INFO', 'VOLUME_REQUESTED', { percent: validPercent });

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
    addDiagnosticLog('INFO', 'AUDIO_MODE_CHANGED', { mono: mode === 'mono' ? 1 : 0 });
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
    addDiagnosticLog('INFO', 'SEEK_REQUESTED', { delta: seconds });

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

  function requestQuality(chosen, video, player) {
    const adapter = getActiveAdapter(video, player);
    addDiagnosticLog('INFO', 'QUALITY_REQUESTED', { height: chosen.height });
    let accepted = false;
    try { accepted = adapter.applyQuality(chosen, video, player) === true; } catch (_) {}
    if (!accepted) {
      addDiagnosticLog('WARN', 'QUALITY_REJECTED');
      showToast('Bu oynatıcıda kalite seçimi uygulanamadı.');
      return false;
    }
    activeForcedQualityId = chosen.id;
    activeForcedQualityLabel = chosen.label;
    pendingQualityLabel = chosen.label;
    pendingQualityHeight = chosen.height || 0;
    clearTimeout(pendingTimeoutTimer);
    pendingTimeoutTimer = setTimeout(() => {
      pendingQualityLabel = '';
      pendingQualityHeight = 0;
      updateRealtimeResolutionBadge();
    }, 3500);
    return true;
  }

  function cycleNextQuality() {
    const qualities = discoverStreamQualities();
    if (!qualities || qualities.length === 0) return;

    let currentIdx = qualities.findIndex(q => q.id === activeForcedQualityId || q.label === activeForcedQualityLabel);
    const nextIdx = (currentIdx + 1) % qualities.length;
    const chosen = qualities[nextIdx];

    const { video, player } = findVideoAndPlayer();
    requestQuality(chosen, video, player);
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
      countBadge.textContent = `${qualities.length} seviye`;
    }

    container.innerHTML = '';
    if (currentActiveAdapterName === 'HlsJsAdapter' || qualities.some(q => q.id.startsWith('hls_'))) {
      const note = document.createElement('span');
      note.className = 'pvc-quality-inventory-note';
      note.textContent = qualities.length === 1
        ? 'Oynatıcı 1 seviye bildiriyor; kaynakta başka kalite olup olmadığı doğrulanmadı.'
        : 'Oynatıcının bildirdiği seviyeler. “Oynatılan” etiketi anlık görüntü ölçümüdür.';
      container.appendChild(note);
    }
    if (qualities.length === 0) {
      const message = document.createElement('span');
      message.textContent = 'Bu oynatıcıda kullanılabilir kalite kontrolü bulunamadı.';
      container.appendChild(message);
    }

    qualities.forEach(q => {
      const btn = document.createElement('button');
      const isCurrentActive = activeForcedQualityId === q.id || activeForcedQualityLabel === q.label;
      btn.className = `pvc-quality-chip-btn ${isCurrentActive ? 'pvc-active' : ''}`;
      btn.textContent = String(q.label).replace(/\s*\(.*\)\s*$/, '') || q.label;
      btn.title = q.resolutionSource === 'observed-video'
        ? 'Çözünürlük akışta belirtilmemiş; değer oynatılan videodan ölçüldü. Başka bir kalite seçeneği anlamına gelmez.'
        : `${q.label}${q.height ? ' • ' + q.height + 'p' : ''}`;

      btn.onclick = (e) => {
        e.stopPropagation();
        const { video, player } = findVideoAndPlayer();
        requestQuality(q, video, player);
        renderDynamicQualityButtons();
        updateRealtimeResolutionBadge();
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
  let lastPingStatus = 'not-tested';

  async function testCdnPing(silent = false) {
    const { video, player } = findVideoAndPlayer();
    if (!video) {
      lastPingStatus = 'no-video';
      if (!silent) showToast('Video bulunamadı');
      return null;
    }
    const mediaUrl = value => {
      try {
        const url = new URL(value);
        return /^https?:$/.test(url.protocol) && /\.(m3u8|mpd|ts|m4s|mp4|webm)(?:$|\/)/i.test(url.pathname);
      } catch (_) { return false; }
    };
    const perf = video.ownerDocument?.defaultView?.performance || performance;
    const entries = perf.getEntriesByType('resource').filter(entry => mediaUrl(entry.name));
    const latest = entries[entries.length - 1];
    const updatePingBadge = (ms) => {
      const pingBtn = document.getElementById('pvc-ping-btn');
      if (pingBtn) {
        pingBtn.textContent = `📡 ${ms} ms`;
        pingBtn.style.color = ms <= 50 ? '#34d399' : (ms <= 120 ? '#38bdf8' : '#f59e0b');
      }
    };
    // Hazır kaynak zamanlaması varsa ek ağ isteği yapmadan HTTP yanıt süresi gösterilir.
    if (latest && latest.requestStart > 0 && latest.responseStart >= latest.requestStart) {
      const ms = Math.round(latest.responseStart - latest.requestStart);
      lastPingStatus = 'resource-timing';
      updatePingBadge(ms);
      if (!silent) showToast(`📡 Medya HTTP yanıtı: ${ms} ms (son istek)`);
      return { ms, method: 'resource-timing' };
    }
    if (silent) { lastPingStatus = 'timing-unavailable'; return null; }
    let targetUrl = video.currentSrc || video.src || '';
    if (!mediaUrl(targetUrl)) targetUrl = latest?.name || '';
    if (!targetUrl) {
      lastPingStatus = 'no-source';
      showToast('CDN ölçümü için erişilebilir medya isteği bulunamadı.');
      return null;
    }
    // Manuel ölçüm: yalnızca HEAD, kimlik bilgisi/referrer yok, GET fallback yok.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const startTime = performance.now();
      const response = await fetch(targetUrl, {
        method: 'HEAD', cache: 'no-store', mode: 'cors', credentials: 'omit',
        referrerPolicy: 'no-referrer', redirect: 'error', signal: controller.signal
      });
      if (!response.ok) {
        lastPingStatus = 'http-rejected';
        showToast('CDN, HEAD ölçümünü kabul etmedi.');
        return null;
      }
      const ms = Math.round(performance.now() - startTime);
      lastPingStatus = 'head';
      updatePingBadge(ms);
      showToast(`📡 Medya HTTP yanıtı: ${ms} ms (HEAD)`);
      return { ms, method: 'head' };
    } catch (err) {
      lastPingStatus = controller.signal.aborted ? 'timeout' : 'blocked';
      showToast(controller.signal.aborted ? 'CDN yanıt ölçümü zaman aşımına uğradı.' : 'CDN yanıtı tarayıcı veya sunucu kısıtı nedeniyle ölçülemedi.');
      return null;
    } finally { clearTimeout(timeout); }
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

  // Rapor sınırı: yalnızca sabit seçenekler, boolean'lar ve sınırlı sayılar.
  // Kaynak URL'leri, alan adları, konsol metinleri ve izleme konumu dışarı çıkmaz.
  function diagnosticChoice(value, choices, fallback = 'unknown') {
    return choices.includes(value) ? value : fallback;
  }

  function diagnosticCount(count) {
    return count === 0 ? '0' : count === 1 ? '1' : count <= 4 ? '2-4' : '5+';
  }

  function diagnosticPlatform(hostname) {
    const platforms = {
      kick: ['kick.com'], trt: ['trt1.com.tr', 'trtizle.com', 'trt.com.tr'],
      now: ['nowtv.com.tr'], puhu: ['puhutv.com'], youtube: ['youtube.com'],
      twitch: ['twitch.tv'], reddit: ['reddit.com'], x: ['x.com'],
      netflix: ['netflix.com'], disney: ['disneyplus.com'], prime: ['primevideo.com'],
      tabii: ['tabii.com'], gain: ['gain.tv'], exxen: ['exxen.com']
    };
    for (const [platform, domains] of Object.entries(platforms)) {
      if (domains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) return platform;
    }
    return 'other';
  }

  function diagnosticResolution(video) {
    const height = video?.videoHeight || 0;
    return height <= 0 ? 'unknown' : height < 720 ? 'sd' : height < 1080 ? 'hd'
      : height < 1440 ? 'fhd' : height < 2160 ? 'qhd' : 'uhd';
  }

  function diagnosticSourceKind(video) {
    if (!video) return 'none';
    if (video.srcObject) return 'media-object';
    const src = video.currentSrc || video.src || '';
    return !src ? 'none' : src.startsWith('blob:') ? 'blob'
      : /^https?:/i.test(src) ? 'http' : 'other';
  }

  function collectFrameDiagnostics() {
    const frames = [...document.querySelectorAll('iframe, frame')];
    let inaccessible = 0;
    for (const frame of frames) {
      try { if (!frame.contentDocument) inaccessible++; }
      catch (_) { inaccessible++; }
    }
    return {
      context: window === window.top ? 'top' : 'iframe',
      localFrameCount: diagnosticCount(frames.length),
      inaccessibleFrameCount: diagnosticCount(inaccessible)
    };
  }

  function buildDiagnosticPayload(errorCode) {
    const { playerType, video, player } = findVideoAndPlayer();
    const hls = findLibraryPlayer(video, 'hls', player);
    const adapter = ALL_ADAPTERS.find(item => item.name === currentActiveAdapterName);
    const browserFamily = /firefox/i.test(navigator.userAgent) ? 'firefox'
      : /chrom(e|ium)|edg\//i.test(navigator.userAgent) ? 'chromium'
      : /safari/i.test(navigator.userAgent) ? 'safari' : 'other';
    const quality = cachedDiscoveredQualities.find(item => item.id === activeForcedQualityId);
    // Uygulanmamış adaptörler kalite kontrolü sunmaz; istekler başarı kanıtı değildir.
    const qualityControl = !video || !adapter || ['GenericAdapter', 'DashJsAdapter'].includes(adapter.name)
      ? 'not-implemented' : 'requires-runtime-verification';
    return {
      reportSchemaVersion: 2,
      extensionVersion: EXTENSION_VERSION,
      errorCode: diagnosticChoice(errorCode, ['NO_VIDEO_FOUND', 'USER_MANUAL_DIAGNOSTIC'], 'USER_MANUAL_DIAGNOSTIC'),
      platform: diagnosticPlatform(HOSTNAME),
      browserFamily,
      playerType: diagnosticChoice(playerType, ['none', 'shadow-html5', 'native-html5', 'youtube-player',
        'amazon-ivs', 'videojs-attached', 'vjsPlayer', 'videojs-parent', 'videojs-global', 'hlsjs', 'shaka-player']),
      activeAdapter: adapter ? adapter.name : 'unknown',
      adapterTier: adapter ? adapter.tier : null,
      adapterSelectionStatus: video ? diagnosticChoice(adapterHealthStatus, ['healthy', 'failed']) : 'no-video',
      frame: collectFrameDiagnostics(),
      videoCandidateCount: diagnosticCount(deepFindMediaElements().length),
      videoState: video ? {
        readyState: diagnosticNumber(video.readyState, 0, 4),
        networkState: diagnosticNumber(video.networkState, 0, 3),
        hasDecodedDimensions: video.videoWidth > 0 && video.videoHeight > 0,
        resolutionClass: diagnosticResolution(video),
        mediaMode: video.duration === Infinity ? 'live' : Number.isFinite(video.duration) && video.duration > 0 ? 'vod' : 'unknown',
        sourceKind: diagnosticSourceKind(video),
        paused: video.paused === true,
        muted: video.muted === true,
        requestedPlaybackRate: diagnosticNumber(targetEnforcedPlaybackRate, 0.25, 3, 0.01),
        observedPlaybackRate: diagnosticNumber(video.playbackRate, 0.0625, 16, 0.01),
        requestedVolumePercent: diagnosticNumber(currentAudioVolumePercent, 0, 300),
        observedNativeVolumePercent: diagnosticNumber(typeof video.volume === 'number' ? video.volume * 100 : NaN, 0, 100),
        observedGain: audioSourceElementMap.has(video) && audioGainNodeInstance ? diagnosticNumber(audioGainNodeInstance.gain.value, 0, 3, 0.01) : null,
        audioContextState: audioContextInstance ? diagnosticChoice(audioContextInstance.state, ['running', 'suspended', 'closed', 'interrupted']) : 'not-created',
        audioSourceCreated: audioSourceElementMap.has(video),
        audioMode: diagnosticChoice(currentAudioMode, ['stereo', 'mono']),
        drmDetected: detectDrmStatus(video).isDrm === true,
        isShadowDom: isMediaInShadowDom === true,
        subtitleLoaded: customSubtitleCues.length > 0,
        subtitleLoadStatus: diagnosticChoice(subtitleLoadStatus, ['not-loaded', 'loaded', 'empty', 'read-error']),
        subtitleRenderStatus: diagnosticChoice(subtitleRenderStatus,
          ['not-loaded', 'disabled', 'no-video', 'no-active-cue', 'overlay-requested', 'native-requested', 'video-offscreen'])
      } : null,
      quality: {
        control: qualityControl,
        requestedHeight: qualityControl === 'not-implemented' ? null : diagnosticNumber(quality?.height, 1, 4320),
        cachedOptionCount: diagnosticCount(video ? cachedDiscoveredQualities.length : 0),
        // getQualities() ve applyQuality() burada çağrılmaz; rapor salt okunurdur.
        verification: 'not-verified',
        inventoryScope: hls ? 'bound-hls-player' : 'adapter',
        inventoryCompleteness: 'not-verified',
        adaptiveMode: hls ? hls.manualLevel === -1 ? 'auto' : Number.isInteger(hls.manualLevel) && hls.manualLevel >= 0 ? 'manual' : 'unknown' : 'unknown',
        playerLevelCount: hls ? diagnosticCount(hls.levels.length) : null,
        knownResolutionCount: hls ? diagnosticCount(hls.levels.filter(level => level.height > 0 || /^\d+x\d+$/i.test(level.attrs?.RESOLUTION || '')).length) : null,
        manifestObserved: hls ? observedHlsPlayers.get(hls)?.manifestObserved === true : false,
        declaredLevelCount: hls && Number.isInteger(observedHlsPlayers.get(hls)?.declaredLevelCount)
          ? diagnosticCount(observedHlsPlayers.get(hls).declaredLevelCount) : null
      },
      cdnMeasurementStatus: diagnosticChoice(lastPingStatus,
        ['not-tested', 'no-video', 'no-source', 'timing-unavailable', 'resource-timing', 'head', 'http-rejected', 'timeout', 'blocked']),
      recentEvents: collectDiagnosticEvents(),
      problem: !video || errorCode === 'NO_VIDEO_FOUND' ? 'detection' : 'unspecified'
    };
  }

  function reportAnonymousError(errorCode) {
    showErrorModal(buildDiagnosticPayload(errorCode));
  }

  function showErrorModal(payload) {
    const existing = document.getElementById('pvc-error-modal');
    if (existing) existing.remove();

    const updatePayloadJson = () => {
      payload.problem = diagnosticChoice(modal.querySelector('#pvc-report-problem').value,
        ['unspecified', 'detection', 'quality', 'speed', 'volume', 'subtitles', 'pip', 'hud'], 'unspecified');
      // Notlar ancak kullanıcının açık seçimiyle dışa aktarılır. Otomatik anonimlik iddiası yoktur.
      delete payload.userComments;
      if (modal.querySelector('#pvc-include-comment').checked) {
        payload.userComments = modal.querySelector('#pvc-user-feedback-input').value.slice(0, 500);
      }
      return JSON.stringify(payload, null, 2);
    };

    const modal = document.createElement('div');
    modal.id = 'pvc-error-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Gizlilik Odaklı Teşhis Raporu (v${EXTENSION_VERSION})</span>
          <button id="pvc-close-modal-btn" aria-label="Raporu Kapat">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Yalnızca sınırlı oynatıcı bilgileri hazırlanır; otomatik gönderim yapılmaz.
            Otomatik rapor alanlarına adresler, hesap bilgileri, izleme konumu ve sayfa konsolu eklenmez.
          </p>
          <label class="pvc-report-field">Sorun yaşanan kontrol
            <select id="pvc-report-problem">
              <option value="unspecified">Seçilmedi</option><option value="detection">Video bulma</option>
              <option value="quality">Kalite</option><option value="speed">Hız</option>
              <option value="volume">Ses</option><option value="subtitles">Altyazı</option>
              <option value="pip">PiP</option><option value="hud">Kontrol paneli</option>
            </select>
          </label>
          <div style="margin-bottom: 12px;">
            <label class="pvc-report-field"><input id="pvc-include-comment" type="checkbox"> Kendi açıklamamı rapora ekle (isteğe bağlı)</label>
            <textarea id="pvc-user-feedback-input" disabled maxlength="500" aria-label="İsteğe bağlı açıklama" placeholder="Ad, e-posta, adres, bağlantı veya hesap bilgisi yazmayın." style="width: 100%; height: 56px; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; color: #f8fafc; font-size: 11px; padding: 8px; resize: none;"></textarea>
            <p class="pvc-modal-desc">Açıklamanız otomatik anonimleştirilmez. Paylaşmadan önce aşağıdaki raporu kontrol edin.
              Bu panel sayfanın içinde çalışır; yazdığınız açıklama sayfanın betiklerinden gizlenmez.
              E-posta gönderen adresinizi, GitHub ise hesabınızı paylaşımınıza bağlayabilir.</p>
          </div>
          <pre id="pvc-modal-code-block" class="pvc-modal-code"></pre>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-copy-payload-btn" class="pvc-modal-btn-secondary">📋 JSON Kopyala</button>
          <a id="pvc-send-mail-link" href="#" rel="noopener noreferrer" class="pvc-modal-btn-primary" style="background:#2563eb;">✉️ E-posta</a>
          <a id="pvc-open-github-link" href="#" target="_blank" rel="noopener noreferrer" class="pvc-modal-btn-primary" style="background:#4f46e5;">🐙 GitHub Issue</a>
        </div>
      </div>
    `;

    getActiveContainer().appendChild(modal);

    ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'dblclick', 'keydown', 'keyup'].forEach(evtType => {
      modal.addEventListener(evtType, (e) => {
        e.stopPropagation();
        if (e.target === modal) modal.remove();
      });
    });

    const feedbackInput = modal.querySelector('#pvc-user-feedback-input');
    const codeBlock = modal.querySelector('#pvc-modal-code-block');
    const mailLink = modal.querySelector('#pvc-send-mail-link');
    const ghLink = modal.querySelector('#pvc-open-github-link');
    const includeComment = modal.querySelector('#pvc-include-comment');
    modal.querySelector('#pvc-report-problem').value = diagnosticChoice(payload.problem,
      ['unspecified', 'detection', 'quality', 'speed', 'volume', 'subtitles', 'pip', 'hud'], 'unspecified');

    const refreshLinks = () => {
      const updatedJson = updatePayloadJson();
      codeBlock.textContent = updatedJson;
      const issueTitle = encodeURIComponent(`[Teşhis/v${EXTENSION_VERSION}]: ${payload.platform} - ${payload.problem}`);
      ghLink.href = `${GITHUB_REPO_URL}/issues/new?title=${issueTitle}`;
      // Raporu URL'ye gömmeyin; kopyalanan JSON kullanıcı tarafından taslağa eklenir.
      mailLink.href = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}`;
    };

    feedbackInput.addEventListener('input', refreshLinks);
    modal.querySelector('#pvc-report-problem').addEventListener('change', refreshLinks);
    includeComment.addEventListener('change', () => {
      feedbackInput.disabled = !includeComment.checked;
      if (!includeComment.checked) feedbackInput.value = '';
      refreshLinks();
    });
    const prepareShare = (e) => {
      e.stopPropagation();
      showToast('Önce JSON’u kopyalayın; açılan taslağa kendiniz ekleyin.');
    };
    mailLink.addEventListener('click', prepareShare);
    ghLink.addEventListener('click', prepareShare);
    refreshLinks();

    modal.querySelector('#pvc-close-modal-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
    modal.querySelector('#pvc-copy-payload-btn').onclick = async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(updatePayloadJson());
        showToast('Teşhis JSON panoya kopyalandı!');
      } catch (_) {
        showToast('Kopyalanamadı. Önizlemedeki JSON’u seçip elle kopyalayın.');
      }
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
  const HUD_DEFAULT_TOP = 16;   // Araç çubuğu simgesinin hemen altı (sayfa içeriğinin üst kenarı)
  const HUD_RAIL_RIGHT = 16;    // Normal modda sağ ray: sağ kenardan boşluk

  function isFullscreenMode() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  }

  // Normal modda: sağ rayda, simgenin altında. Tam ekranda mevcut konum korunur (serbest hareket).
  function resetPopupToDefaultPosition(popup) {
    if (!popup || isFullscreenMode()) return;
    popup.style.setProperty('top', `${HUD_DEFAULT_TOP}px`, 'important');
    popup.style.setProperty('right', `${HUD_RAIL_RIGHT}px`, 'important');
    popup.style.setProperty('left', 'auto', 'important');
    popup.style.setProperty('bottom', 'auto', 'important');
  }

  function clampPopupToViewport(popup) {
    const target = popup || document.getElementById('pvc-controller-popup');
    if (!target || target.style.display === 'none') return;

    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const rect = target.getBoundingClientRect();
    const w = rect.width || target.offsetWidth || 320;
    const h = rect.height || target.offsetHeight || 200;

    // Normal mod: sağ ray (yalnızca dikey sınır koruması)
    if (!isFullscreenMode()) {
      let railTop = rect.top;
      if (railTop < EDGE_MARGIN) railTop = EDGE_MARGIN;
      if (railTop + h > vh - EDGE_MARGIN) railTop = Math.max(EDGE_MARGIN, vh - h - EDGE_MARGIN);
      target.style.setProperty('top', `${Math.round(railTop)}px`, 'important');
      target.style.setProperty('right', `${HUD_RAIL_RIGHT}px`, 'important');
      target.style.setProperty('left', 'auto', 'important');
      target.style.setProperty('bottom', 'auto', 'important');
      return;
    }

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
    // Not: HUD üzerindeki olay izolasyonu (stopPropagation) 'mouseup' olayını document'a ulaştırmaz.
    // Bu yüzden bırakma olayları window üzerinde YAKALAMA (capture) aşamasında dinlenir; böylece HUD fareye yapışıp kalmaz.
    header.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;

      e.preventDefault(); // Yerel metin/resim sürüklemesini engelle
      resetIdleTimer(popup);

      const fullscreen = isFullscreenMode();
      const rect = popup.getBoundingClientRect();
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;
      let ended = false;

      document.body.style.userSelect = 'none';
      popup.classList.add('pvc-dragging');

      const onMouseMove = (moveEvent) => {
        if (ended) return;
        // Fare düğmesi başka bir yerde (pencere dışı, sekme değişimi vb.) bırakıldıysa sürüklemeyi bitir
        if (moveEvent.buttons === 0) { endDrag(); return; }
        resetIdleTimer(popup);

        const vw = window.innerWidth || document.documentElement.clientWidth;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const w = popup.offsetWidth || 320;
        const h = popup.offsetHeight || 200;

        let candidateTop = startTop + (moveEvent.clientY - startClientY);
        let snapped = false;

        // Dikey mıknatıslı kenar yakalama (üst / alt)
        if (Math.abs(candidateTop - EDGE_MARGIN) <= SNAP_THRESHOLD) {
          candidateTop = EDGE_MARGIN;
          snapped = true;
        } else if (Math.abs((vh - h - EDGE_MARGIN) - candidateTop) <= SNAP_THRESHOLD) {
          candidateTop = vh - h - EDGE_MARGIN;
          snapped = true;
        }
        candidateTop = Math.max(EDGE_MARGIN, Math.min(vh - h - EDGE_MARGIN, candidateTop));
        popup.style.setProperty('top', `${Math.round(candidateTop)}px`, 'important');
        popup.style.setProperty('bottom', 'auto', 'important');

        if (fullscreen) {
          // Tam ekran: 2D serbest hareket + yatay mıknatıslı kenar yakalama
          let candidateLeft = startLeft + (moveEvent.clientX - startClientX);
          if (Math.abs(candidateLeft - EDGE_MARGIN) <= SNAP_THRESHOLD) {
            candidateLeft = EDGE_MARGIN;
            snapped = true;
          } else if (Math.abs((vw - w - EDGE_MARGIN) - candidateLeft) <= SNAP_THRESHOLD) {
            candidateLeft = vw - w - EDGE_MARGIN;
            snapped = true;
          }
          candidateLeft = Math.max(EDGE_MARGIN, Math.min(vw - w - EDGE_MARGIN, candidateLeft));
          popup.style.setProperty('left', `${Math.round(candidateLeft)}px`, 'important');
          popup.style.setProperty('right', 'auto', 'important');
        } else {
          // Normal mod: sağ raya sabit, yalnızca dikey (yukarı/aşağı) kayma
          popup.style.setProperty('right', `${HUD_RAIL_RIGHT}px`, 'important');
          popup.style.setProperty('left', 'auto', 'important');
        }

        popup.classList.toggle('pvc-snapped-edge', snapped);
      };

      const endDrag = () => {
        if (ended) return;
        ended = true;
        popup.classList.remove('pvc-dragging');
        setTimeout(() => popup.classList.remove('pvc-snapped-edge'), 350);
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove, true);
        window.removeEventListener('mouseup', endDrag, true);
        window.removeEventListener('pointerup', endDrag, true);
        window.removeEventListener('pointercancel', endDrag, true);
        window.removeEventListener('blur', endDrag, true);
      };

      window.addEventListener('mousemove', onMouseMove, true);
      window.addEventListener('mouseup', endDrag, true);
      window.addEventListener('pointerup', endDrag, true);
      window.addEventListener('pointercancel', endDrag, true);
      window.addEventListener('blur', endDrag, true);
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
        <div class="pvc-menu-brand" title="NOk Video Controller v${EXTENSION_VERSION}">
          <span id="pvc-brand-text" class="pvc-menu-title">NOk</span>
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
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; margin-top: 4px;">
            <div class="pvc-quick-speed-buttons" style="flex: 1 1 100%;">
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
      <div class="pvc-menu-section pvc-section-collapsed" id="pvc-section-quality">
        <div class="pvc-section-header" data-target="pvc-content-quality">
          <div class="pvc-section-title-wrap">
            <span class="pvc-section-arrow">▼</span>
            <span class="pvc-label">🎬 Akış Paket Kaliteleri</span>
          </div>
          <span id="pvc-quality-count-badge" class="pvc-val-badge">Paketler...</span>
        </div>
        <div id="pvc-content-quality" class="pvc-section-content">
          <div id="pvc-dynamic-quality-container" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;"></div>
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

    // NOkrep logosu (icons/nok-logo.svg): DOM API ile eklenir; dosya yoksa veya sayfa CSP'si engellerse sessizce kaldırılır.
    if (/^(chrome|moz)-extension:\/\//.test(NOK_LOGO_URL)) {
      const brandEl = popup.querySelector('.pvc-menu-brand');
      if (brandEl) {
        const logoImg = document.createElement('img');
        logoImg.className = 'pvc-brand-logo';
        logoImg.alt = 'NOk';
        logoImg.draggable = false; // Başlıktaki mousedown sürüklemesini tarayıcının yerel resim sürüklemesi bozmasın
        logoImg.addEventListener('load', () => { const t = popup.querySelector('#pvc-brand-text'); if (t) t.style.display = 'none'; });
        logoImg.addEventListener('error', () => logoImg.remove());
        logoImg.src = NOK_LOGO_URL;
        brandEl.insertBefore(logoImg, brandEl.firstChild);
      }
    }

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
          const parsedCues = parseSrtOrVttContent(content);
          subFileInput.value = '';
          if (parsedCues.length === 0) {
            subtitleLoadStatus = 'empty';
            addDiagnosticLog('WARN', 'SUBTITLE_PARSE_EMPTY');
            if (subStatusText) {
              subStatusText.textContent = 'Geçerli altyazı satırı okunamadı. SRT/VTT biçimini kontrol edin.';
              subStatusText.style.color = '#f43f5e';
            }
            showToast('Altyazı yüklenemedi: geçerli zamanlanmış satır bulunamadı.');
            return;
          }
          customSubtitleCues = parsedCues;
          subtitleLoadStatus = 'loaded';
          addDiagnosticLog('INFO', 'SUBTITLE_LOADED');
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
            monitorVideoResolution(video);
            injectNativeTextTrackCues(video);
            renderCustomSubtitleCue(video);
          }
          showToast(`💬 Altyazı Yüklendi: ${customSubtitleCues.length} satır`);
        }
      };
      reader.onerror = () => {
        subtitleLoadStatus = 'read-error';
        addDiagnosticLog('WARN', 'SUBTITLE_READ_FAILED');
        subFileInput.value = '';
        if (subStatusText) {
          subStatusText.textContent = 'Altyazı dosyası okunamadı.';
          subStatusText.style.color = '#f43f5e';
        }
        showToast('Altyazı dosyası okunamadı.');
      };
      reader.readAsText(file, 'UTF-8');
    });

    subToggleBtn.onclick = (e) => {
      e.stopPropagation();
      subtitleOverlayEnabled = !subtitleOverlayEnabled;
      subToggleBtn.classList.toggle('pvc-active', subtitleOverlayEnabled);
      subToggleBtn.textContent = subtitleOverlayEnabled ? '👁️ Altyazı: Açık' : '🙈 Altyazı: Gizli';
      const { video } = findVideoAndPlayer();
      if (video) {
        injectNativeTextTrackCues(video);
        renderCustomSubtitleCue(video);
      }
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
      reportAnonymousError('NO_VIDEO_FOUND');
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
      reportAnonymousError('USER_MANUAL_DIAGNOSTIC');
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
      if (wasClosed) resetPopupToDefaultPosition(popup);
      clampPopupToViewport(popup);
      resetIdleTimer(popup);
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();
      testCdnPing(true);

      const { video } = findVideoAndPlayer();
      if (!video) window.postMessage({ type: 'PVC_OPEN_IN_CHILD_FRAMES' }, '*');
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
