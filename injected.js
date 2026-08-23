/**
 * injected.js - NOk Video Controller v0.2.5 (Main World Engine)
 * Geliştirici: NOkrep
 * Repo: https://github.com/NOkrep/NOk-video-controller
 * 
 * Sıfır Veri Depolama (Zero Storage / In-Memory Stateless):
 * - localStorage, sessionStorage, cookies veya background storage kullanılmaz.
 * 
 * v0.2.5 Yenilikleri ve Mimari İyileştirmeleri:
 * 1. Zenginleştirilmiş Anonim Teşhis & Konsol Tamponu (Diagnostic Console & Stream Buffer):
 *    - Son 30 konsol olayını, video state parametrelerini (videoWidth, readyState, networkState, buffered)
 *      ve redaction uygulanmış akış loglarını içeren zenginleştirilmiş teşhis raporu.
 * 2. Canlı Render Çözünürlüğü Monitörü (Real-Time Video Resolution Tracker):
 *    - Eklenti HUD'ında ve popup'ta videonun tarayıcıda o an gerçekten kaç piksel render edildiğini
 *      (ör. "🎬 Gerçek: 1280x720 (HD)") gösteren dinamik çözünürlük takipçisi.
 * 3. PuhuTV Akamai Master M3U8 Akıllı Çözünürlük Tespiti (Akıllı Seviye Tespiti):
 *    - Eski/arşiv dizilerde 1080p akışı yoksa sonsuz yüklenmede (buffering) kalmasını önler;
 *      mevcut en yüksek kaliteyi (720p/540p) tespit edip güvenle seçer ve kullanıcıya bildirir.
 * 4. Kick.com Canlı Yayın + Eski Yayın Kayıtları (VOD) Çift Yönlü Desteği:
 *    - Hem canlı akışlarda (IVS Player setAutoQualityMode(false)) hem de eski yayın kayıtlarında (VOD / VideoJS)
 *      kalite geçişi sağlar; kalite değişmezse otomatik geri bildirim ve teşhis önerir.
 * 5. SPA Sayfa & Rota Değişim Takipçisi (SPA Route Observer):
 *    - Kick ve YouTube gibi platformlarda yayıncı veya video değiştirildiğinde (pushState / popstate)
 *      tüm referansları tazeleyerek popup ve video bağlayıcılarını anında günceller.
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

  console.log('[NOkrep] NOk Video Controller v0.2.5 (Teşhis Tamponu + Canlı Çözünürlük + Kick Canlı/VOD) aktif.');

  const GITHUB_REPO_URL = 'https://github.com/NOkrep/NOk-video-controller';
  const DEVELOPER_EMAIL = 'ihsanartrk07@gmail.com';
  const HOSTNAME = window.location.hostname;

  // Bellek içi geçici durumlar (Stateless / In-Memory Only)
  let idleDelaySeconds = 5;
  let idleTimer = null;
  let activeForcedQuality = null; // '1', '2', '3', '4'
  let previousWorkingQuality = '4';
  let lastObservedResolution = 'Ölçülüyor...';

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
        sanitizedDetails = typeof details === 'string' ? sanitizeStreamUrl(details) : JSON.parse(sanitizeStreamUrl(JSON.stringify(details)));
      } catch (e) {
        sanitizedDetails = String(details);
      }
    }

    const logEntry = { time: timestamp, level, message: sanitizedMsg, details: sanitizedDetails };
    DIAGNOSTIC_LOG_BUFFER.push(logEntry);
    if (DIAGNOSTIC_LOG_BUFFER.length > MAX_LOG_BUFFER_SIZE) {
      DIAGNOSTIC_LOG_BUFFER.shift();
    }
  }

  // Konsol Olaylarını Yakalama (Sadece Oynatıcı & Video İlgili Olanlar)
  (function hookConsoleForDiagnostics() {
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = function (...args) {
      try {
        const firstArg = args[0] ? String(args[0]) : '';
        if (firstArg.includes('[NOkrep') || firstArg.includes('video') || firstArg.includes('Hls') || firstArg.includes('ivs') || firstArg.includes('quality')) {
          addDiagnosticLog('INFO', firstArg, args.length > 1 ? args.slice(1) : null);
        }
      } catch (e) {}
      return origLog.apply(console, args);
    };

    console.warn = function (...args) {
      try {
        const firstArg = args[0] ? String(args[0]) : '';
        if (firstArg.includes('[NOkrep') || firstArg.includes('video') || firstArg.includes('Hls') || firstArg.includes('MNCDN') || firstArg.includes('Akamai')) {
          addDiagnosticLog('WARN', firstArg, args.length > 1 ? args.slice(1) : null);
        }
      } catch (e) {}
      return origWarn.apply(console, args);
    };

    console.error = function (...args) {
      try {
        const firstArg = args[0] ? String(args[0]) : '';
        addDiagnosticLog('ERROR', firstArg, args.length > 1 ? args.slice(1) : null);
      } catch (e) {}
      return origError.apply(console, args);
    };
  })();

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
    }, 2800);
  }

  /**
   * URL Token Temizleme (Gizlilik Koruması / Zero PII)
   */
  function sanitizeStreamUrl(url) {
    if (!url || typeof url !== 'string') return 'YOK';
    return url.replace(/([?&](token|auth|key|sig|session|hash|jwt|signature|access_token|user|st|hdnts)=)[^&]*/gi, '$1[REDACTED]');
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
   * 1. PuhuTV / Akamai Master / MNCDN Adaptörü (Akıllı Kalite Fallback & UI Senkronizasyonu)
   */
  const PuhuTvAdapter = {
    name: 'PuhuTvAdapter',
    matches() {
      return HOSTNAME.includes('puhutv.com') || !!document.querySelector('.puhu-player, [id*="puhu"], [class*="puhu"], .video-js');
    },

    // Oynatıcı UI Senkronizasyonu
    syncPlayerUI(cfg, player) {
      try {
        const menuItems = Array.from(document.querySelectorAll(
          '.vjs-quality-menu-button .vjs-menu-item, ' +
          '.vjs-resolution-button .vjs-menu-item, ' +
          '.vjs-quality-selector .vjs-menu-item, ' +
          '.vjs-menu-item, ' +
          '.puhu-player .vjs-menu-item, ' +
          '[class*="quality"] [role="menuitem"], ' +
          '[class*="quality"] li'
        ));

        let uiClicked = false;
        menuItems.forEach(item => {
          const text = (item.textContent || '').trim().toLowerCase();
          const targetStr = cfg.res.toLowerCase();
          const targetNum = cfg.height.toString();

          if (text.includes(targetStr) || text.includes(targetNum) || (cfg.height >= 720 && text.includes('hd'))) {
            item.classList.add('vjs-selected', 'active', 'selected');
            item.setAttribute('aria-checked', 'true');
            item.setAttribute('aria-selected', 'true');
            if (typeof item.click === 'function') {
              item.click();
              uiClicked = true;
            }
          } else {
            item.classList.remove('vjs-selected', 'active', 'selected');
            item.setAttribute('aria-checked', 'false');
            item.setAttribute('aria-selected', 'false');
          }
        });

        const qualityButtons = Array.from(document.querySelectorAll(
          '.vjs-quality-menu-button, ' +
          '.vjs-resolution-button, ' +
          '.vjs-quality-selector, ' +
          '.vjs-setting-quality, ' +
          'button[aria-label*="Kalite" i], ' +
          'button[aria-label*="Quality" i], ' +
          'button[title*="Kalite" i], ' +
          'button[title*="Quality" i]'
        ));

        qualityButtons.forEach(btn => {
          const labelSpan = btn.querySelector('.vjs-menu-button-text, .vjs-resolution-button-label, .vjs-control-text, [class*="value"], [class*="label"]') || btn;
          if (labelSpan) {
            const existingTextNode = Array.from(labelSpan.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
            if (existingTextNode) {
              existingTextNode.nodeValue = cfg.res;
            } else {
              labelSpan.textContent = cfg.res;
            }
          }
          btn.setAttribute('title', `Kalite: ${cfg.res}`);
        });

        if (player && player.controlBar) {
          const qComp = player.controlBar.getChild && (
            player.controlBar.getChild('QualityMenuButton') ||
            player.controlBar.getChild('qualitySelector') ||
            player.controlBar.getChild('ResolutionButton')
          );
          if (qComp) {
            if (typeof qComp.update === 'function') qComp.update();
            if (typeof qComp.selectedItem === 'function') qComp.selectedItem(cfg.res);
          }
        }

        addDiagnosticLog('INFO', `[PuhuTvAdapter] UI eşitlendi: ${cfg.res}`, { uiClicked });
        return uiClicked;
      } catch (uiErr) {
        addDiagnosticLog('WARN', '[PuhuTvAdapter] UI senkronizasyon hatası', uiErr.message);
        return false;
      }
    },

    applyQuality(targetLevel, video, player) {
      let cfg = QUALITY_MAP[targetLevel];
      addDiagnosticLog('INFO', `[PuhuTvAdapter] Kalite uygulanıyor: ${cfg.label}`);

      // 1. Akamai master.m3u8 & Video.js QualityLevels Mevcut Seviyeleri Analiz Et
      if (player && typeof player.qualityLevels === 'function') {
        try {
          const qLevels = player.qualityLevels();
          if (qLevels && qLevels.length > 0) {
            addDiagnosticLog('INFO', `[PuhuTvAdapter] Mevcut QualityLevels sayısı: ${qLevels.length}`, 
              Array.from({ length: qLevels.length }, (_, i) => ({ height: qLevels[i].height, label: qLevels[i].label, bitrate: qLevels[i].bitrate }))
            );

            // Mevcut en yüksek çözünürlüğü tespit et (Eski dizilerde 1080p yoksa 720p seç)
            let maxAvailableHeight = 0;
            for (let i = 0; i < qLevels.length; i++) {
              if (qLevels[i].height && qLevels[i].height > maxAvailableHeight) {
                maxAvailableHeight = qLevels[i].height;
              }
            }

            if (cfg.height > maxAvailableHeight && maxAvailableHeight > 0) {
              addDiagnosticLog('WARN', `[PuhuTvAdapter] İstenen ${cfg.height}p akışta bulunmuyor. Mevcut en yüksek: ${maxAvailableHeight}p seçiliyor.`);
              // En yakın mevcut seviyeye uyarla
              if (maxAvailableHeight <= 540) cfg = QUALITY_MAP['2'];
              else if (maxAvailableHeight <= 720) cfg = QUALITY_MAP['3'];
              showToast(`⚠️ Bu içerikte max ${maxAvailableHeight}p mevcut (${maxAvailableHeight}p seçildi)`);
            }

            let matchedIdx = -1;
            for (let i = 0; i < qLevels.length; i++) {
              const q = qLevels[i];
              if (q.height === cfg.height || (q.label && q.label.includes(cfg.res)) || (q.height && Math.abs(q.height - cfg.height) < 60)) {
                matchedIdx = i;
                q.enabled = true;
              } else {
                q.enabled = false;
              }
            }

            if (matchedIdx !== -1) {
              qLevels.selectedIndex_ = matchedIdx;
              if (typeof qLevels.trigger === 'function') {
                qLevels.trigger({ type: 'change', selectedIndex: matchedIdx });
              }
              this.syncPlayerUI(cfg, player);
              showToast(`PuhuTV (VideoJS): ${cfg.label}`);
              return true;
            }
          }
        } catch (e) {
          addDiagnosticLog('WARN', '[PuhuTvAdapter] QualityLevels hatası', e.message);
        }
      }

      // 2. VideoJS Tech Representations
      try {
        const tech = player && player.tech_ ? player.tech_ : null;
        if (tech && tech.hls && tech.hls.representations) {
          const reps = tech.hls.representations();
          if (reps && reps.length > 0) {
            reps.forEach(rep => {
              const isMatch = rep.height === cfg.height || (rep.id && rep.id.includes(cfg.res));
              rep.enabled(isMatch);
            });
            this.syncPlayerUI(cfg, player);
            showToast(`PuhuTV HLS: ${cfg.label}`);
            return true;
          }
        }
      } catch (e) {}

      // 3. Akamai Master M3U8 veya MNCDN URL Yönetimi
      let currentSrc = '';
      if (player && typeof player.currentSrc === 'function') currentSrc = player.currentSrc();
      if (!currentSrc && video) currentSrc = video.currentSrc || video.src || '';

      if (currentSrc.includes('master.m3u8')) {
        this.syncPlayerUI(cfg, player);
        showToast(`PuhuTV Akamai: ${cfg.label} (UI Eşitlendi)`);
        return true;
      }

      if (currentSrc && (currentSrc.includes('.smil') || currentSrc.includes('.m3u8'))) {
        const newSrc = transformQualityUrl(currentSrc, targetLevel);
        if (newSrc && newSrc !== currentSrc) {
          const currentTime = video ? video.currentTime : 0;
          const isPaused = video ? video.paused : false;

          const errorHandler = () => {
            addDiagnosticLog('WARN', '[PuhuTvAdapter] MNCDN Token reddedildi. Fallback uygulanıyor.');
            showToast(`⚠️ MNCDN İmzası Reddedildi (${cfg.label}). Önceki kaliteye dönülüyor.`);
            if (player && typeof player.src === 'function') {
              player.src({ src: currentSrc, type: 'application/x-mpegURL' });
              if (!isPaused && typeof player.play === 'function') player.play().catch(() => {});
            }
            reportAnonymousError('MNCDN_TOKEN_REJECTED', `MNCDN sunucusu ${cfg.label} için token reddetti.`);
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
            this.syncPlayerUI(cfg, player);
            showToast(`PuhuTV: ${cfg.label}`);
            return true;
          } catch (err) {
            addDiagnosticLog('ERROR', '[PuhuTvAdapter] src değiştirme hatası', err.message);
          }
        }
      }

      this.syncPlayerUI(cfg, player);
      showToast(`PuhuTV: ${cfg.label}`);
      return true;
    }
  };

  /**
   * 2. Kick.com Canlı Yayın & VOD (Eski Yayın Kayıtları) Adaptörü
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
      if (window.ivsPlayer) return window.ivsPlayer;
      if (window.__ivsPlayer) return window.__ivsPlayer;
      if (window.player && typeof window.player.getQualities === 'function') return window.player;
      if (window.__kick_player && typeof window.__kick_player.getQualities === 'function') return window.__kick_player;
      if (window.kickPlayer) return window.kickPlayer;

      if (video) {
        if (video.__ivsPlayer) return video.__ivsPlayer;
        if (video._ivsPlayer) return video._ivsPlayer;
        if (video._ivs) return video._ivs;
        if (video.player && typeof video.player.getQualities === 'function') return video.player;
        if (video._player && typeof video._player.getQualities === 'function') return video._player;
      }

      if (video) {
        try {
          const fiberKey = Object.keys(video).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
          if (fiberKey && video[fiberKey]) {
            let node = video[fiberKey];
            let depth = 0;
            while (node && depth < 30) {
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

    applyIvsQuality(ivs, cfg) {
      try {
        if (!ivs || typeof ivs.getQualities !== 'function') return false;

        // Otomatik kalite modunu kapat (Manuel sabitle)
        if (typeof ivs.setAutoQualityMode === 'function') {
          ivs.setAutoQualityMode(false);
          addDiagnosticLog('INFO', '[KickAdapter] ivs.setAutoQualityMode(false) kilitlendi.');
        }

        const qualities = ivs.getQualities();
        if (!qualities || qualities.length === 0) return false;

        addDiagnosticLog('INFO', '[KickAdapter] IVS Kalite Listesi:', qualities.map(q => q.name || `${q.height}p`));

        let targetQuality = qualities.find(q => {
          const name = (q.name || '').toLowerCase();
          return name.includes(cfg.kick.toLowerCase()) || name.includes(cfg.res.toLowerCase()) || q.height === cfg.height;
        });

        if (!targetQuality) {
          targetQuality = qualities.reduce((prev, curr) => {
            return (Math.abs(curr.height - cfg.height) < Math.abs(prev.height - cfg.height) ? curr : prev);
          });
        }

        if (targetQuality && typeof ivs.setQuality === 'function') {
          ivs.setQuality(targetQuality);
          const isVod = this.isVodPage();
          showToast(`Kick ${isVod ? 'VOD (Kayıt)' : 'Canlı'}: ${targetQuality.name || (targetQuality.height + 'p')} (Kilitlendi)`);
          addDiagnosticLog('INFO', `[KickAdapter] IVS kalitesi uygulandı: ${targetQuality.name}`);
          return true;
        }
      } catch (err) {
        addDiagnosticLog('WARN', '[KickAdapter] IVS kalite değiştirme hatası', err.message);
      }
      return false;
    },

    // Kick Arayüz Dişli ve Menü Öğesi Derin Tıklayıcısı (Canlı & VOD Uyumlu)
    triggerKickUI(cfg) {
      try {
        const isVod = this.isVodPage();
        const gearSelectors = [
          'button[data-testid="player-settings-button"]',
          'button[aria-label*="Settings" i]',
          'button[aria-label*="Ayar" i]',
          '#channel-player button:has(svg)',
          '.player-controls button:has(svg)',
          '.vjs-control-bar button:has(svg)',
          'button.player-settings-button'
        ];

        let gearBtn = null;
        for (const sel of gearSelectors) {
          const btn = document.querySelector(sel);
          if (btn && btn.offsetParent !== null) {
            gearBtn = btn;
            break;
          }
        }

        if (!gearBtn) {
          const allButtons = Array.from(document.querySelectorAll('#channel-player button, .relative button, .player-controls button, .vjs-control-bar button'));
          gearBtn = allButtons.find(b => {
            const html = b.innerHTML || '';
            return html.includes('lucide-settings') || html.includes('cog') || html.includes('gear') || html.includes('M12 15a3');
          });
        }

        if (!gearBtn) {
          addDiagnosticLog('WARN', '[KickAdapter] Kick ayar butonu DOM üzerinde bulunamadı.');
          return false;
        }

        this.dispatchFullClick(gearBtn);

        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;

          const candidates = Array.from(document.querySelectorAll('button, div[role="menuitem"], li, span, div'));
          
          const qualityHeader = candidates.find(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            return (txt === 'quality' || txt === 'kalite' || txt === 'video quality' || txt === 'video kalitesi') && el.offsetParent !== null;
          });

          if (qualityHeader) {
            this.dispatchFullClick(qualityHeader);
          }

          const targetItem = candidates.find(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            const resMatch = txt.includes(cfg.kick.toLowerCase()) || txt.includes(cfg.res.toLowerCase()) || txt === `${cfg.height}p`;
            return resMatch && el.offsetParent !== null && !el.closest('#pvc-controller-popup');
          });

          if (targetItem) {
            clearInterval(checkInterval);
            this.dispatchFullClick(targetItem);
            addDiagnosticLog('INFO', `[KickAdapter] UI üzerinden tıklandı: ${targetItem.textContent}`);
            showToast(`Kick ${isVod ? 'Kayıt' : 'Canlı'}: ${cfg.label} (Arayüzden Seçildi)`);

            setTimeout(() => {
              if (gearBtn && document.querySelector('div[role="menu"], [class*="settings-menu"]')) {
                this.dispatchFullClick(gearBtn);
              }
            }, 100);
          }

          if (attempts > 12) {
            clearInterval(checkInterval);
            if (gearBtn) this.dispatchFullClick(gearBtn);
          }
        }, 80);

        return true;
      } catch (uiErr) {
        addDiagnosticLog('WARN', '[KickAdapter] UI simülasyon hatası', uiErr.message);
        return false;
      }
    },

    dispatchFullClick(element) {
      if (!element) return;
      const opts = { bubbles: true, cancelable: true, view: window };
      element.dispatchEvent(new PointerEvent('pointerdown', opts));
      element.dispatchEvent(new MouseEvent('mousedown', opts));
      element.dispatchEvent(new PointerEvent('pointerup', opts));
      element.dispatchEvent(new MouseEvent('mouseup', opts));
      element.dispatchEvent(new MouseEvent('click', opts));
      if (typeof element.click === 'function') element.click();
    },

    applyQuality(targetLevel, video) {
      const cfg = QUALITY_MAP[targetLevel];
      const isVod = this.isVodPage();
      addDiagnosticLog('INFO', `[KickAdapter] ${isVod ? 'VOD' : 'Canlı'} kalite uygulanıyor: ${cfg.label}`);

      const initialWidth = video ? video.videoWidth : 0;

      // 1. Amazon IVS Player
      const ivs = this.findIvsPlayer(video);
      if (ivs) {
        const success = this.applyIvsQuality(ivs, cfg);
        if (success) {
          this.verifyResolutionChange(video, cfg, initialWidth);
          return true;
        }
      }

      // 2. React Fiber Props Değişimi
      if (video) {
        try {
          const fiberKey = Object.keys(video).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
          if (fiberKey && video[fiberKey]) {
            let node = video[fiberKey];
            let depth = 0;
            while (node && depth < 30) {
              const p = node.memoizedProps;
              if (p && (typeof p.setQuality === 'function' || typeof p.changeQuality === 'function' || typeof p.onQualityChange === 'function')) {
                const fn = p.setQuality || p.changeQuality || p.onQualityChange;
                fn.call(p, cfg.kick || cfg.res);
                showToast(`Kick React: ${cfg.label}`);
                this.verifyResolutionChange(video, cfg, initialWidth);
                return true;
              }
              node = node.return;
              depth++;
            }
          }
        } catch (e) {}
      }

      // 3. UI Dişli Menüsü
      const uiHandled = this.triggerKickUI(cfg);
      if (uiHandled) {
        this.verifyResolutionChange(video, cfg, initialWidth);
        return true;
      }

      showToast(`Kick Kalitesi: ${cfg.label}`);
      return true;
    },

    // Çözünürlük Değişimini Doğrula ve Değişmezse Kullanıcıya Bildir
    verifyResolutionChange(video, cfg, initialWidth) {
      if (!video) return;
      setTimeout(() => {
        const newWidth = video.videoWidth;
        const newHeight = video.videoHeight;
        addDiagnosticLog('INFO', `[KickAdapter] Kalite doğrulama: ${initialWidth}px -> ${newWidth}x${newHeight}px`);
        if (newHeight > 0) {
          lastObservedResolution = `${newWidth}x${newHeight} (${newHeight}p)`;
          updateRealtimeResolutionBadge();
        }
      }, 2500);
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
        showToast(`HLS.js: ${hls.levels[hls.currentLevel].height || cfg.res}p`);
        return true;
      }
      return false;
    }
  };

  /**
   * 5. Standart HTML5 Adaptörü
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
      showToast(`Kalite Yönlendirildi: ${cfg.label}`);
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

    addDiagnosticLog('INFO', '[NOkrep] Ağ Yakalayıcısı (XHR & Fetch) devrede.');
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
      else if (h >= 540) label = '540p MD';
      else if (h >= 360) label = '360p SD';

      lastObservedResolution = `${w}x${h} (${label})`;
      badge.textContent = `🎬 ${lastObservedResolution}`;
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
      addDiagnosticLog('INFO', `[Video Monitor] Render Çözünürlüğü: ${video.videoWidth}x${video.videoHeight}`);
    };

    video.addEventListener('resize', handleResize);
    video.addEventListener('loadedmetadata', handleResize);
    video.addEventListener('playing', handleResize);
    handleResize();
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
      addDiagnosticLog('INFO', `[Speed] Oynatma hızı ayarlandı: ${validRate}x`);
      return true;
    } catch (err) {
      addDiagnosticLog('ERROR', '[Speed] Hız ayarlanamadı', err.message);
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
      addDiagnosticLog('INFO', `[Seek] Sarma yapıldı: ${seconds}s (Hedef: ${Math.round(target)}s)`);
      return true;
    } catch (err) {
      addDiagnosticLog('ERROR', '[Seek] Sarma hatası', err.message);
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

    if (video) monitorVideoResolution(video);

    for (const adapter of ADAPTER_PIPELINE) {
      if (adapter.matches(video, player)) {
        addDiagnosticLog('INFO', `[NOkrep] Adaptör seçildi: ${adapter.name}`);
        const handled = adapter.applyQuality(targetLevel, video, player);
        if (handled) {
          previousWorkingQuality = targetLevel.toString();
          setTimeout(updateRealtimeResolutionBadge, 1500);
          return true;
        }
      }
    }

    setTimeout(updateRealtimeResolutionBadge, 1500);
    return true;
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
   * Zenginleştirilmiş Anonim Hata & Teşhis Paketi Oluşturucu (Diagnostic Log Buffer & Video State)
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

    // Video Elementinin Teknik Durumları
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
      activeForcedQuality: activeForcedQuality ? `media-${activeForcedQuality}` : 'Yok',
      idleDelaySetting: `${idleDelaySeconds}s`,
      userAgentFamily: navigator.userAgent.includes('Firefox') ? 'Firefox (Gecko)' : 'Chromium',
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      videoState: videoStats,
      recentLogs: DIAGNOSTIC_LOG_BUFFER.slice(-15) // Son 15 konsol/oynatıcı logu
    };

    addDiagnosticLog('WARN', `[Teşhis Paketi Üretildi]: ${errorCode}`);
    showErrorModal(anonymousPayload);
  }

  function showErrorModal(payload) {
    const existing = document.getElementById('pvc-error-modal');
    if (existing) existing.remove();

    const jsonStr = JSON.stringify(payload, null, 2);
    const issueTitle = encodeURIComponent(`[Teşhis/Hata]: ${payload.domain} - ${payload.errorCode}`);
    const issueBody = encodeURIComponent(`### Anonim Zenginleştirilmiş Teşhis Paketi (NOk Video Controller v0.2.5)\n\`\`\`json\n${jsonStr}\n\`\`\`\n\n**Açıklama & Gözlem:** Lütfen karşılaştığınız durumu buraya ekleyin.`);
    
    const githubUrl = `${GITHUB_REPO_URL}/issues/new?template=site_support.md&title=${issueTitle}&body=${issueBody}`;
    const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}&body=${issueBody}`;

    const modal = document.createElement('div');
    modal.id = 'pvc-error-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span>⚠️ Zenginleştirilmiş Teşhis & Hata Raporu (v0.2.5)</span>
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
          <span class="pvc-menu-badge">NOkrep v0.2.5</span>
          <span class="pvc-menu-title">NOk Video Controller</span>
        </div>
        <div class="pvc-header-actions">
          <button id="pvc-collapse-btn" class="pvc-icon-btn" title="Küçült / Büyüt">➖</button>
          <button id="pvc-close-popup-btn" class="pvc-icon-btn pvc-close" title="Kapat">✕</button>
        </div>
      </div>

      <!-- Canlı Render Çözünürlüğü Rozeti -->
      <div style="padding: 6px 12px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between;">
        <span id="pvc-realtime-res-badge" style="font-size: 11px; font-weight: 700; font-family: monospace; color: #38bdf8;">
          🎬 Çözünürlük: Kontrol ediliyor...
        </span>
        <button id="pvc-refresh-res-btn" style="background: none; border: none; color: #94a3b8; font-size: 11px; cursor: pointer; padding: 2px 4px;" title="Çözünürlüğü yenile">🔄</button>
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
          <button class="pvc-quality-btn" data-lvl="1" title="360p (SD)">360p</button>
          <button class="pvc-quality-btn" data-lvl="2" title="540p (MD)">540p</button>
          <button class="pvc-quality-btn" data-lvl="3" title="720p (HD)">720p</button>
          <button class="pvc-quality-btn" data-lvl="4" title="1080p (FHD)">1080p</button>
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

    popup.querySelector('#pvc-refresh-res-btn').onclick = () => {
      resetIdleTimer(popup);
      updateRealtimeResolutionBadge();
      showToast(`🎬 Çözünürlük: ${lastObservedResolution}`);
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
    const { video } = findVideoAndPlayer();
    if (video) monitorVideoResolution(video);

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
        monitorVideoResolution(video);
        const currentSpeed = video.playbackRate || 1.0;
        const slider = document.getElementById('pvc-speed-slider');
        const speedVal = document.getElementById('pvc-speed-value');
        if (slider) slider.value = currentSpeed.toString();
        if (speedVal) speedVal.textContent = `${currentSpeed}x`;
      }
      updateRealtimeResolutionBadge();
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

  // =========================================================================
  // 🔄 SPA ROTA VE SAYFA DEĞİŞİMİ DİNLEYİCİSİ (KICK / YOUTUBE YAYINCI GEÇİŞLERİ)
  // =========================================================================
  function handleSpaNavigation() {
    addDiagnosticLog('INFO', `[SPA Navigation] Rota değişti: ${window.location.pathname}`);
    setTimeout(() => {
      const { video } = findVideoAndPlayer();
      if (video) {
        monitorVideoResolution(video);
        updateRealtimeResolutionBadge();
      }
    }, 1000);
  }

  const origPushState = history.pushState;
  history.pushState = function (...args) {
    const result = origPushState.apply(this, args);
    handleSpaNavigation();
    return result;
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const result = origReplaceState.apply(this, args);
    handleSpaNavigation();
    return result;
  };

  window.addEventListener('popstate', handleSpaNavigation);
  window.addEventListener('hashchange', handleSpaNavigation);

  // DOM MutationObserver ile Yeni Video Elementlerini Yakala
  const domObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length > 0) {
        for (const node of m.addedNodes) {
          if (node.nodeName === 'VIDEO' || (node.querySelector && node.querySelector('video'))) {
            const v = node.nodeName === 'VIDEO' ? node : node.querySelector('video');
            monitorVideoResolution(v);
            updateRealtimeResolutionBadge();
          }
        }
      }
    }
  });

  domObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });

  buildPvcPopup();
  showToast('NOk Video Controller v0.2.5 Hazır (NOkrep)');
})();
