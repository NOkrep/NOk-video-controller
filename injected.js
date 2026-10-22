/**
 * injected.js - NOk Video Controller v0.7.0.1 (Main World Engine)
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
  const EXTENSION_VERSION = '0.7.0.1';
  const NOK_LOGO_URL = (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.logoUrl) || '';
  const VERSION_HISTORY = [
    { version: 'v0.7.0.1', notes: 'Düzeltme adayı: iframe filtrelerinde tek bekleyen istek ve en son kullanıcı değerinin korunması; eski oturumda kuyruk/çizim işi iptali. Medya içermeyen DOM değişimlerinde gereksiz keşif engellendi. Video.js eski tamponu yalnızca eşleşen VHS yükleyicileriyle bir kez yeniler. 142 Node testi; Firefox kurulu eklenti, sürekli iframe filtresi ve Firefox/Edge gerçek yerel HLS-Video.js kalite geçişleri geçti. Dizipod ve gerçek site kabulü açık.' },
    { version: 'v0.7.0', notes: 'Test adayı: çapraz kökenli iframe için üst sayfada tek HUD, sınırlı komut/durum köprüsü ve tam ekranda kaynak çerçeveye geçiş. Oynatıcıya bağlı reklam işaretinde 16x isteği, mute ve geri alınabilir en düşük kalite; bitişte 1x/önceki ses-kalite. Kick gerçek envanter ve video sahipliği. 135 Node testi; Firefox kurulu geçici eklentiyle yerel iframe, gerçek HLS/Video.js kalite ve dosya medyasında 16x doğrulandı. Edge Video.js kalite zaman aşımı ve gerçek site kabulü açık.' },
    { version: 'v0.6.1', notes: 'Kalite seçenekleri video/oynatıcı/kaynağa bağlandı; native kaynak menüsü ve Video.js resolution-switcher desteği; istek/oynatıcı/görüntü doğrulaması ayrı, zaman aşımı görünür. Çoklu video hedef seçimi. İframe dışı sunum ve reklam aşaması açık; canlı doğrulama bekliyor.' },
    { version: 'v0.6.0', notes: 'İlk iyileştirme aşaması: filtre input birleştirme ve tarama önbelleği, pointer/klavye odaklı gizlenme, normal modda yatay sürükleme, altyazı görünümü ve sabit platform kapsamı. Kalite/iframe dışı panel/reklam iyileştirmeleri açık; canlı doğrulama bekliyor.' },
    { version: 'v0.5.10', notes: 'SevenGrid kaynaklı 20 yerel tema, kontrast uyarlaması ve bellek içi seçici; seçilen Uiverse düğme/checkbox/switch/input/loader uyarlamaları; kaynak/lisans ve sonraki tasarım kayıtları. Canlı tarayıcı doğrulaması bekliyor.' },
    { version: 'v0.5.9', notes: 'Solda üç dikey sekme, Player içinde adaptör, Settings içinde görüntü kontrolleri; referans görselden koyu petrol/mavi tema ve ortak renk değişkenleri. Canlı tarayıcı/site doğrulaması bekliyor.' },
    { version: 'v0.5.8', notes: 'İngilizce varsayılan dil; Player/Picture/Subtitles/Settings sekmeleri; bellekte paneli açık tutma, büyük yazı, yüksek kontrast ve hareket azaltma seçenekleri. Canlı tarayıcı/site doğrulaması bekliyor.' },
    { version: 'v0.5.7', notes: 'Bellek içi Türkçe/English arayüz, sabit dil sinyalleriyle çerçeve eşitlemesi, isteğe bağlı çözüm sonrası silme talebi; klavye akordeonu, slider adları ve kaynak temelli HMI değerlendirmesi. Canlı tarayıcı/site doğrulaması bekliyor.' },
    { version: 'v0.5.6', notes: 'Çerçeveler arasında tek çalışan HUD dalı; TRT elemente özel geri alınabilir hız kilidi ve sınırlı frekanslı fallback; Video.js VHS representations kalite yolu; Kick Radix ses handler önbelleği ve gerçek hız menüsü fallback; çift sentetik click düzeltmesi; elle istenen ve aktif adaptör ayrımı. Canlı Firefox/site doğrulaması bekliyor.' },
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

  // UI-only gettext catalogue. No page content, subtitle cues or report JSON is translated.
  // Language and original DOM text live only in this frame's RAM.
  const UI_MESSAGES = {
    'Gömülü oynatıcı bu isteği desteklemiyor.': 'The embedded player does not support this request.',
    'Gömülü oynatıcı bu isteği uygulayamadı.': 'The embedded player could not apply this request.',
    'Gömülü oynatıcı yanıt vermedi.': 'The embedded player did not respond.',
    'Altyazı yüklü (oynatıcı çerçevesinde).': 'Subtitles loaded (in the player frame).',
    'Altyazı dosyası gömülü oynatıcı için çok büyük.': 'The subtitle file is too large for the embedded player.',
    'Altyazı aktarılıyor...': 'Transferring subtitles…',
    'Video hedefi': 'Video target', 'Otomatik seçim': 'Automatic selection',
    'Video {0} · {1}': 'Video {0} · {1}', 'Video seçimini yenile': 'Refresh video selection',
    'Kalite isteği yok.': 'No quality requested.', 'Bekleniyor': 'Pending', 'Doğrulandı': 'Confirmed',
    'Görüntü eşleşti': 'Decoded video matches', 'Oynatıcı seçti; görüntü bekleniyor': 'Player selected; waiting for video',
    'Doğrulanamadı': 'Not confirmed', 'Reddedildi': 'Rejected',
    'İstenen {0} · oynatılan {1} · Bekleniyor': 'Requested {0} · decoded {1} · Pending',
    'İstenen {0} · oynatılan {1} · Doğrulandı': 'Requested {0} · decoded {1} · Confirmed',
    'İstenen {0} · oynatılan {1} · Görüntü eşleşti': 'Requested {0} · decoded {1} · Decoded video matches',
    'İstenen {0} · oynatılan {1} · Oynatıcı seçti; görüntü bekleniyor': 'Requested {0} · decoded {1} · Player selected; waiting for video',
    'İstenen {0} · oynatılan {1} · Doğrulanamadı': 'Requested {0} · decoded {1} · Not confirmed',
    'İstenen {0} · oynatılan {1} · Reddedildi': 'Requested {0} · decoded {1} · Rejected',
    'Kalite listesi değişti; yeniden seçin.': 'The quality list changed; choose again.',
    'Kaynak menüsü ve oynatıcı seviyeleri birlikte listelenir; tüm kaynakların bulunduğu doğrulanmadı.': 'Source-menu choices and player levels are listed together; completeness is not verified.',
    'Altyazı görünümü': 'Subtitle appearance', 'Yazı boyutu': 'Font size', 'Alt kenardan uzaklık': 'Distance from bottom',
    'Arka plan opaklığı': 'Background opacity', 'Yazı rengi': 'Text colour', 'Beyaz': 'White', 'Sarı': 'Yellow',
    'Görünümü sıfırla': 'Reset appearance',
    'Yazı boyutu katmanda uygulanır; yerel tam ekran/PiP yazısını tarayıcı yönetir.': 'Font size applies to the overlay; the browser controls native fullscreen/PiP text.',
    'Temalar': 'Themes', 'Tema seç': 'Choose a theme', 'Standart / koyu': 'Standard / dark', 'Açık': 'Light',
    'Önceki': 'Previous', 'Sonraki': 'Next', 'Tema {0} / {1}': 'Theme {0} / {1}',
    'Yüksek kontrast açıkken tema renkleri geçici olarak geçersiz kılınır.': 'High contrast temporarily overrides theme colours.',
    'Kontrol grupları': 'Control groups',
    'Oynatıcı': 'Player',
    'Görüntü': 'Picture',
    'Ayarlar': 'Settings',
    'Erişilebilirlik': 'Accessibility',
    'Paneli açık tut': 'Keep panel visible',
    'Büyük yazı ve kontroller': 'Larger text and controls',
    'Yüksek kontrast': 'High contrast',
    'Panel animasyonlarını azalt': 'Reduce panel motion',
    'Bu tercihler sayfa yenilenince sıfırlanır.': 'These preferences reset when the page reloads.',
    'Klavye Kısayolları Devre Dışı (Açmak için tıklayın)': 'Keyboard shortcuts off (click to turn on)',
    'NOk Video Controller Denetim Masası': 'NOk Video Controller panel',
    'Dil': 'Language',
    'Dil seçimi yalnızca bu sayfa açıkken tutulur.': 'The language choice lasts only for this page.',
    'Sürüklemek için basılı tutun (Kenarlara 16px yaklaşınca mıknatıslı hizalanır)': 'Drag to move (snaps near screen edges)',
    'Resim İçinde Resim (PiP) Aç/Kapat (Alt+P)': 'Toggle Picture-in-Picture (Alt+P)',
    'Resim İçinde Resim': 'Picture-in-Picture',
    'Klavye Kısayolları Aktif (Kapatmak için tıklayın)': 'Keyboard shortcuts on (click to turn off)',
    'Klavye Kısayolları': 'Keyboard shortcuts',
    'Paneli Küçült / Büyüt': 'Collapse / expand panel',
    'Paneli Küçült veya Büyüt': 'Collapse or expand panel',
    'Kapat (Ctrl+Shift+S)': 'Close (Ctrl+Shift+S)',
    'Denetim Masasını Kapat': 'Close panel',
    '10s Geri': 'Back 10 seconds',
    '10s İleri': 'Forward 10 seconds',
    'Oynat / Duraklat': 'Play / pause',
    '⏯️ Oynat': '⏯️ Play',
    '▶️ Oynat': '▶️ Play',
    '⏸️ Duraklat': '⏸️ Pause',
    'PiP Aç/Kapat': 'Toggle PiP',
    'Oynatıcıda o an işlenen video piksel boyutu': 'Current decoded video dimensions',
    '🎬 Gerçek: Ölçülüyor...': '🎬 Playing: measuring…',
    'Çözünürlük ve Paketleri Yenile': 'Refresh resolution and quality options',
    'Adaptör:': 'Adapter:',
    'Otomatik': 'Auto',
    'Adaptör Listesini Aç ve Değiştir': 'Choose player adapter',
    'Değiştir ▾': 'Change ▾',
    '🛡️ DRM Korumalı Akış (Güvenli Mod)': '🛡️ DRM protected stream (safe mode)',
    '⚠️ Aktif Oynatıcı Bekleniyor': '⚠️ Waiting for a video',
    'Sayfadaki video henüz başlamadı veya farklı bir çerçeve içinde.': 'The video may not have started or may be inside another frame.',
    '🔄 Yeniden Tara': '🔄 Scan again',
    '📋 Teşhis Raporu': '📋 Diagnostic report',
    '⚡ Oynatma Hızı & Sarma': '⚡ Speed & seeking',
    'Çift tıklayarak 1.0x değerine sıfırlayabilirsiniz ([ / ])': 'Double-click to reset to 1.0x ([ / ])',
    'Oynatma hızı': 'Playback speed',
    '🔊 Ses Seviyesi & Kanallar': '🔊 Volume & channels',
    'Ses (%0-%300 Güçlendirici) • Çift tıklayarak %100\'e sıfırlayın': 'Volume (0–300% boost) • Double-click to reset to 100%',
    'Maksimum %300 Ses Güçlendirici': 'Maximum 300% volume boost',
    '🎬 Akış Paket Kaliteleri': '🎬 Video quality',
    'Paketler...': 'Loading…',
    '🎨 Görüntü Filtreleri & Gece Kalkanı': '🎨 Picture & night mode',
    'Standart': 'Default',
    'Özel': 'Custom',
    '🌙 Gece': '🌙 Night',
    'Parlaklık': 'Brightness',
    'Kontrast': 'Contrast',
    'Doygunluk': 'Saturation',
    'Parlaklık (%50-%150) • Çift tıkla sıfırla': 'Brightness (50–150%) • Double-click to reset',
    'Kontrast (%50-%150) • Çift tıkla sıfırla': 'Contrast (50–150%) • Double-click to reset',
    'Doygunluk (%0-%200) • Çift tıkla sıfırla': 'Saturation (0–200%) • Double-click to reset',
    'Mavi ışığı azaltan sıcak Gece Kalkanı': 'Warm night filter to reduce blue light',
    '🌙 Gece Modu': '🌙 Night mode',
    'Renkleri ters çevir': 'Invert colours',
    '🔄 Ters Renk': '🔄 Invert',
    'Tüm filtreleri sıfırla': 'Reset all filters',
    '♻️ Sıfırla': '♻️ Reset',
    '💬 Harici Altyazı & Senkron': '💬 Subtitles & timing',
    'RAM üzerinden .srt veya .vtt dosyası yükle': 'Load an .srt or .vtt file for this page',
    '📂 .SRT / .VTT Yükle': '📂 Load .SRT / .VTT',
    'Altyazı katmanını göster/gizle': 'Show / hide subtitles',
    '👁️ Altyazı: Açık': '👁️ Subtitles: on',
    '🙈 Altyazı: Gizli': '🙈 Subtitles: hidden',
    'Yüklü altyazı yok (Sıfır Depolama RAM Modu)': 'No subtitles loaded (kept only for this page)',
    'Altyazıyı 100ms geri çek': 'Show subtitles 100 ms earlier',
    'Senkron kaymasını sıfırla': 'Reset subtitle timing',
    '0ms Sıfırla': 'Reset 0 ms',
    'Altyazıyı 100ms ileri al': 'Show subtitles 100 ms later',
    'Medya HTTP yanıt süresini ölç (ağ pingi değildir)': 'Measure media HTTP response time (not network ping)',
    '📡 CDN yanıtı': '📡 CDN response',
    'Klavye Kısayolları & İzin Rehberi': 'Keyboard shortcuts & permissions',
    '⌨️ Kısayollar': '⌨️ Shortcuts',
    'Zenginleştirilmiş teşhis paketini aç': 'Preview a diagnostic report',
    '⚠️ Teşhis': '⚠️ Report',
    'Raporu Kapat': 'Close report',
    '⚠️ Gizlilik Odaklı Teşhis Raporu (v{0})': '⚠️ Privacy-focused diagnostic report (v{0})',
    'Yalnızca sınırlı oynatıcı bilgileri hazırlanır; otomatik gönderim yapılmaz. Otomatik rapor alanlarına adresler, hesap bilgileri, izleme konumu ve sayfa konsolu eklenmez.': 'Only limited player information is prepared; nothing is sent automatically. Automatic report fields exclude addresses, account details, playback position and the page console.',
    'Sorun yaşanan kontrol': 'Which control has a problem?',
    'Seçilmedi': 'Not selected',
    'Video bulma': 'Video detection',
    'Kalite': 'Quality',
    'Hız': 'Speed',
    'Ses': 'Volume',
    'Altyazı': 'Subtitles',
    'Kontrol paneli': 'Control panel',
    'Kendi açıklamamı rapora ekle (isteğe bağlı)': 'Include my comment in the report (optional)',
    'İsteğe bağlı açıklama': 'Optional comment',
    'Ad, e-posta, adres, bağlantı veya hesap bilgisi yazmayın.': 'Do not include names, email addresses, URLs or account details.',
    'Açıklamanız otomatik anonimleştirilmez. Paylaşmadan önce aşağıdaki raporu kontrol edin. Bu panel sayfanın içinde çalışır; yazdığınız açıklama sayfanın betiklerinden gizlenmez. E-posta gönderen adresinizi, GitHub ise hesabınızı paylaşımınıza bağlayabilir.': 'Your comment is not automatically anonymised. Review the report below before sharing. This panel runs inside the page; comments are not hidden from page scripts. Email and GitHub can associate your submission with your address or account.',
    'Sorun çözüldüğünde bu issue’nun / raporun silinmesini talep ediyorum.': 'I request deletion of this issue / report after the problem is resolved.',
    'Bu seçim yalnızca bir talep ekler. Silme işlemi platformun olanaklarına ve yetkili kişinin işlemine bağlıdır; otomatik silme veya kopyaların kaldırılması garanti edilmez.': 'This adds a request only. Deletion depends on the platform and an authorised maintainer; automatic deletion or removal of copies is not guaranteed.',
    '📋 JSON Kopyala': '📋 Copy JSON',
    '✉️ E-posta': '✉️ Email',
    'Önce JSON’u kopyalayın; açılan taslağa kendiniz ekleyin.': 'Copy the JSON first, then paste it into the draft.',
    'Teşhis JSON panoya kopyalandı!': 'Diagnostic JSON copied!',
    'Kopyalanamadı. Önizlemedeki JSON’u seçip elle kopyalayın.': 'Copy failed. Select the JSON in the preview and copy it manually.',
    '🔐 İzinler & Klavye Kısayolları Rehberi (v{0})': '🔐 Permissions & keyboard shortcuts (v{0})',
    '⌨️ Aktif Klavye Kısayolları': '⌨️ Available keyboard shortcuts',
    've': 'and',
    ': Oynatma hızını 0.25x azalt / artır': ': Decrease / increase playback speed by 0.25x',
    ': Oynatma hızını 1.0x değerine sıfırla': ': Reset playback speed to 1.0x',
    ': Stereo / Mono ses kanalı geçişi': ': Switch between stereo and mono',
    ': Sesi %10 artır / azalt (%300 Booster dahil)': ': Increase / decrease volume by 10% (up to 300% boost)',
    ': Sonraki akış kalitesine geç': ': Select the next video quality',
    ': Resim İçinde Resim (PiP) aç / kapat': ': Toggle Picture-in-Picture (PiP)',
    ': Kontrol panelini gizle / göster': ': Hide / show the panel',
    'Çift Tıklama': 'Double-click',
    ': Herhangi bir slider\'a çift tıklayarak sıfırlayın': ': Double-click a slider to reset it',
    '🌐 Tarayıcı Site Erişimi ({0})': '🌐 Browser site access ({0})',
    'Araç çubuğundaki NOk simgesine tıklayarak veya sağ tıklayıp "Bu Siteye Erişebilir" seçeneğini aktif ederek tüm oynatıcı kancalarını çalıştırabilirsiniz.': 'Click the NOk toolbar icon to activate the player controls. If access is restricted, check the extension’s site access settings in your browser.',
    'Tamam, Kapat': 'OK, close',
    '⚡ Otomatik (Önerilen)': '⚡ Automatic (recommended)',
    'Akıllı': 'Automatic',
    'Sistem sayfayı ve oynatıcı prototiplerini analiz ederek en uygun adaptörü otomatik seçer.': 'Automatically selects an adapter for the current player.',
    'Siteye özel derin API/Ağ kancası': 'Site-specific player integration',
    'Oynatıcı kütüphanesi API kancası': 'Player library integration',
    'Evrensel HTML5 ve Shadow DOM tarayıcısı': 'Universal HTML5 and Shadow DOM detection',
    '🧩 Oynatıcı Adaptörü Seçimi (Basamaklı Hat)': '🧩 Choose player adapter',
    'Kapat': 'Close',
    'Adaptör: Otomatik Mod': 'Adapter: automatic mode',
    'Adaptör: {0}': 'Adapter: {0}',
    'YouTube Oynatıcı (Tier 2)': 'YouTube player (Tier 2)',
    'Video.js Kütüphanesi (Tier 2)': 'Video.js library (Tier 2)',
    'Hls.js Kütüphanesi (Tier 2)': 'Hls.js library (Tier 2)',
    'Evrensel HTML5 & Shadow DOM (Tier 3)': 'Universal HTML5 & Shadow DOM (Tier 3)',
    '🛡️ DRM / EME Korumalı Akış Bilgilendirmesi': '🛡️ DRM / EME protected stream',
    'Bu video akışı': 'This video stream uses',
    'ile şifrelenmiştir. Donanım ses kesintisini önlemek adına Web Audio API ses yükselticisi (%300) devre dışı bırakılmış olup yerel ses (%100), hız, görüntü filtreleri ve altyazı kontrolleri aktif tutulmuştur.': 'encryption. To protect audio playback, Web Audio boosting is disabled. Native volume (up to 100%), speed, picture filters and subtitles remain available.',
    'Anladım, Kapat': 'Understood, close',
    '🛡️ DRM Korumalı Akış ({0})': '🛡️ DRM protected stream ({0})',
    'NOk Video Controller Aktif (v{0})': 'NOk Video Controller active (v{0})',
    '🎬 {0}: Tampon dolduruluyor...': '🎬 {0}: buffering…',
    '✅ {0} Kilitlendi (Akıcı Oynatılıyor)': '✅ {0} locked (playing)',
    'PuhuTV: {0} (Kilitlendi)': 'PuhuTV: {0} (locked)',
    'Kick: {0} (Kilitlendi)': 'Kick: {0} (locked)',
    'Video.js: {0} istendi': 'Video.js: {0} requested',
    'Shaka: {0} istendi': 'Shaka: {0} requested',
    '🎬 Gerçek: {0}': '🎬 Playing: {0}',
    '⏳ {0} Uygulanıyor ({1})': '⏳ Applying {0} ({1})',
    '🎬 Çözünürlük: Bekleniyor...': '🎬 Resolution: waiting…',
    'PiP için aktif video bulunamadı': 'No active video found for PiP',
    '🖼️ PiP Modundan Çıkıldı': '🖼️ Exited PiP',
    '🖼️ Resim İçinde Resim (PiP) Aktif': '🖼️ Picture-in-Picture active',
    '🖼️ PiP Modu: {0}': '🖼️ PiP mode: {0}',
    'Firefox: PiP için videonun üzerindeki yerleşik PiP düğmesini kullanın': 'Firefox: use the built-in PiP button on the video',
    'Tarayıcınız bu videoda PiP API desteklemiyor': 'Your browser does not support the PiP API for this video',
    'PiP açılamadı (Video henüz hazır olmayabilir)': 'Could not open PiP (the video may not be ready)',
    '🎨 Görüntü Filtreleri Sıfırlandı': '🎨 Picture filters reset',
    'Önce bir .srt veya .vtt altyazı dosyası yükleyin': 'Load an .srt or .vtt subtitle file first',
    '💬 Altyazı Senkronu: {0}ms': '💬 Subtitle offset: {0} ms',
    'Video elementi bulunamadı': 'No video element found',
    'TRT hız kilidi açık. Panelden 1x seçerek veya hız çubuğuna çift tıklayarak kapatın.': 'TRT speed lock is on. Select 1x in the panel or double-click the speed slider to release it.',
    '⚡ Hız: {0}x': '⚡ Speed: {0}x',
    '(🛡️ DRM: Yerel %100 Limiti)': '(🛡️ DRM: native 100% limit)',
    '🔊 Ses: %{0} (🛡️ DRM: Yerel %100 Limiti)': '🔊 Volume: {0}% (🛡️ DRM: native 100% limit)',
    '🔊 Ses: %{0} (🚀 +{1}% Booster)': '🔊 Volume: {0}% (🚀 +{1}% boost)',
    '🔊 Ses: %{0}': '🔊 Volume: {0}%',
    'Ses Modu: 🎛️ Mono (Birleşik Kanal)': 'Audio mode: 🎛️ Mono (combined channels)',
    'Ses Modu: 🎧 Stereo (Çift Kanal)': 'Audio mode: 🎧 Stereo (two channels)',
    '🎛️ Mono (Birleşik Kanal)': '🎛️ Mono (combined channels)',
    '🎧 Stereo (Çift Kanal)': '🎧 Stereo (two channels)',
    'Ses Modu: {0}': 'Audio mode: {0}',
    '+{0}s İleri': '+{0}s forward',
    '{0}s Geri': '{0}s back',
    'Bu oynatıcıda kalite seçimi uygulanamadı.': 'Could not apply this quality selection.',
    '1 seviye': '1 level',
    '{0} seviye': '{0} levels',
    'Oynatıcı 1 seviye bildiriyor; kaynakta başka kalite olup olmadığı doğrulanmadı.': 'The player reports one level; other source qualities have not been ruled out.',
    'Oynatıcının bildirdiği seviyeler. “Oynatılan” etiketi anlık görüntü ölçümüdür.': 'Levels reported by the player. “Playing” refers to the current decoded resolution.',
    'Bu oynatıcıda kullanılabilir kalite kontrolü bulunamadı.': 'No quality control is available for this player.',
    'Çözünürlük akışta belirtilmemiş; değer oynatılan videodan ölçüldü. Başka bir kalite seçeneği anlamına gelmez.': 'The stream does not declare a resolution; this value comes from the playing video and is not another quality option.',
    '{0}p · oynatılan': '{0}p · playing',
    '{0} Mb/sn': '{0} Mb/s',
    'Seviye {0}': 'Level {0}',
    '🎬 Doğal Akış ({0}p)': '🎬 Original stream ({0}p)',
    '⚡ Yüksek Bitrate (HD Zorla)': '⚡ High bitrate (force HD)',
    '360p (Düşük)': '360p (low)',
    '240p (Düşük)': '240p (low)',
    '144p (Mobil)': '144p (mobile)',
    '{0} (Düşük) • {1}p': '{0} (low) • {1}p',
    '{0} (Mobil) • {1}p': '{0} (mobile) • {1}p',
    '🚀 1080p FHD MNCDN akışı aranıyor...': '🚀 Looking for a 1080p FHD MNCDN stream…',
    '1080p FHD MNCDN akışı için sayfa yenileniyor...': 'Reloading for the 1080p FHD MNCDN stream…',
    'Video bulunamadı': 'No video found',
    '📡 Medya HTTP yanıtı: {0} ms (son istek)': '📡 Media HTTP response: {0} ms (last request)',
    'CDN ölçümü için erişilebilir medya isteği bulunamadı.': 'No accessible media request found for measurement.',
    'CDN, HEAD ölçümünü kabul etmedi.': 'The CDN rejected the HEAD measurement.',
    '📡 Medya HTTP yanıtı: {0} ms (HEAD)': '📡 Media HTTP response: {0} ms (HEAD)',
    'CDN yanıt ölçümü zaman aşımına uğradı.': 'CDN response measurement timed out.',
    'CDN yanıtı tarayıcı veya sunucu kısıtı nedeniyle ölçülemedi.': 'Browser or server restrictions prevented measurement.',
    '⌨️ Klavye Kısayolları Aktif': '⌨️ Keyboard shortcuts on',
    '🔇 Klavye Kısayolları Devre Dışı': '🔇 Keyboard shortcuts off',
    '🎨 Filtre %100 değerine sıfırlandı': '🎨 Filter reset to 100%',
    '🌙 Gece Kalkanı Aktif': '🌙 Night mode on',
    '☀️ Gece Kalkanı Kapatıldı': '☀️ Night mode off',
    '🔄 Ters Renk Modu Aktif': '🔄 Inverted colours on',
    '🔄 Ters Renk Kapatıldı': '🔄 Inverted colours off',
    'Geçerli altyazı satırı okunamadı. SRT/VTT biçimini kontrol edin.': 'No valid cues found. Check the SRT/VTT format.',
    'Altyazı yüklenemedi: geçerli zamanlanmış satır bulunamadı.': 'Could not load subtitles: no valid timed cues found.',
    '✅ {0} ({1} satır RAM\'de)': '✅ {0} ({1} subtitle cues)',
    '💬 Altyazı Yüklendi: {0} satır': '💬 Subtitles loaded: {0} cues',
    'Altyazı dosyası okunamadı.': 'Could not read the subtitle file.',
    '💬 Altyazı Senkronu Sıfırlandı (0ms)': '💬 Subtitle timing reset (0 ms)',
    '🎬 Güncellendi: {0}': '🎬 Updated: {0}',
    '🎬 Video başarıyla yakalandı!': '🎬 Video found!',
    'Video henüz bulunamadı': 'No video found yet',
    'Ölçülüyor...': 'Measuring…'
  };
  let uiLanguage = 'en';
  const uiOriginalText = new WeakMap();
  const uiOriginalAttributes = new WeakMap();
  const normalizeUiMessage = value => String(value).trim().replace(/\s+/g, ' ');
  const uiPatterns = Object.entries(UI_MESSAGES).filter(([key]) => /\{\d+\}/.test(key)).map(([key, value]) => {
    const indexes = [];
    const escaped = key.split(/(\{\d+\})/).map(part => {
      if (/^\{\d+\}$/.test(part)) { indexes.push(part); return '([\\s\\S]*?)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    return { expression: new RegExp(`^${escaped}$`), value, indexes };
  });
  function uiText(message) {
    const original = String(message);
    if (uiLanguage === 'tr') return original;
    const normalized = normalizeUiMessage(original);
    let translated = Object.hasOwn(UI_MESSAGES, normalized) ? UI_MESSAGES[normalized] : null;
    if (translated === null) {
      for (const pattern of uiPatterns) {
        const match = original.trim().match(pattern.expression);
        if (!match) continue;
        translated = pattern.value.replace(/\{\d+\}/g, token => match[pattern.indexes.indexOf(token) + 1]);
        break;
      }
    }
    return translated === null ? original : original.replace(original.trim(), () => translated);
  }
  function setUiText(element, source) {
    if (!element) return;
    const text = uiText(source);
    if (element.textContent !== text || element.childNodes?.length !== 1 || element.firstChild?.nodeType !== 3) element.textContent = text;
    if (element.firstChild?.nodeType === 3) uiOriginalText.set(element.firstChild, String(source));
  }
  function setUiAttribute(element, name, source) {
    if (!element) return;
    const originals = uiOriginalAttributes.get(element) || {};
    originals[name] = String(source);
    uiOriginalAttributes.set(element, originals);
    element.setAttribute(name, uiText(source));
  }
  function localizeUi(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      if (!uiOriginalText.has(root)) uiOriginalText.set(root, root.nodeValue);
      root.nodeValue = uiText(uiOriginalText.get(root));
      return;
    }
    if (root.hasAttribute?.('data-pvc-i18n-skip')) return;
    for (const name of ['title', 'aria-label', 'placeholder', 'label']) {
      if (root.hasAttribute?.(name)) {
        const originals = uiOriginalAttributes.get(root);
        setUiAttribute(root, name, originals?.[name] ?? root.getAttribute(name));
      }
    }
    // User comments, subtitles and machine-readable diagnostics must stay byte-for-byte intact.
    if (['PRE', 'TEXTAREA'].includes(root.tagName)) return;
    for (const child of root.childNodes || []) localizeUi(child);
  }
  function setUiLanguage(language, announce = true) {
    if (language !== 'tr' && language !== 'en') return;
    uiLanguage = language;
    for (const id of ['pvc-controller-popup', 'pvc-error-modal', 'pvc-permissions-modal', 'pvc-adapter-modal', 'pvc-drm-modal', 'pvc-quick-toast']) {
      const root = document.getElementById(id);
      if (root) { root.setAttribute('lang', language); localizeUi(root); }
    }
    const select = document.getElementById('pvc-language-select');
    if (select) select.value = language;
    if (announce) window.postMessage({ type: language === 'tr' ? 'PVC_LANGUAGE_TR' : 'PVC_LANGUAGE_EN' }, '*');
  }
  // END UI LOCALIZATION

  // Palette facts inspected on sevengrid.app, 2026-10-19. No site scripts/assets are bundled.
  // id, family, scheme, background, surface, elevated, border, text, muted, action
  const UI_THEME_DEFINITIONS = [
    ['aurora', 'standard', 'dark', '#0A0F12', '#11181D', '#1A2228', '#2A3338', '#F5F7F8', '#8B9499', '#1DC7B7'],
    ['daylight', 'light', 'light', '#FBFAF7', '#F2F0EA', '#E9E6DD', '#D7D3C8', '#1A1C1E', '#5C6063', '#0A6E63'],
    ['daybreak', 'light', 'light', '#FEF9F6', '#FCEDE4', '#F5E3D7', '#E4CFC2', '#1F1C1A', '#615F5D', '#A34F1E'],
    ['cream', 'light', 'light', '#F9F6EA', '#F1ECD9', '#E9E3CB', '#D7D0B6', '#1D1C18', '#605F5C', '#6B4423'],
    ['sage', 'light', 'light', '#F6FCF6', '#E8F3E8', '#DCEADB', '#C7D8C7', '#1A1D1A', '#5E605E', '#2F6B47'],
    ['glacier', 'light', 'light', '#F5FBFF', '#E5F2FC', '#D8E9F5', '#C3D6E4', '#1A1D1F', '#5D6061', '#2F6B8F'],
    ['paper', 'light', 'light', '#FAFAFA', '#F0F0F0', '#E6E6E6', '#D3D3D3', '#1C1C1C', '#5F5F5F', '#4F46E5'],
    ['blossom', 'light', 'light', '#FFF9FB', '#FDECF2', '#F7E1E8', '#E6CDD5', '#1F1B1C', '#625F60', '#8E2F73'],
    ['mocha', 'standard', 'dark', '#15110D', '#1E1812', '#2A2118', '#3A2F22', '#F1ECE2', '#9A8E7E', '#B5876F'],
    ['forge', 'standard', 'dark', '#06171E', '#0F1F26', '#14262E', '#2A3D46', '#E8EEF1', '#9AA8AE', '#FD7D00'],
    ['ember', 'standard', 'dark', '#0F1014', '#15171B', '#1C1E23', '#2A2D33', '#F0EFEC', '#8A8985', '#D4AF37'],
    ['pine', 'standard', 'dark', '#0C1611', '#14201A', '#1C2922', '#2E3C34', '#F0EFE8', '#8B9387', '#5BA66E'],
    ['atlas', 'standard', 'dark', '#0A1418', '#131F25', '#1B2A33', '#2C3C46', '#ECEFF2', '#8A95A0', '#5F99B9'],
    ['plum', 'standard', 'dark', '#150D14', '#1E1421', '#291828', '#3A2A39', '#F2EAEF', '#998796', '#C084FC'],
    ['cinder', 'oled', 'dark', '#000000', '#0A0A0A', '#141414', '#1F1F1F', '#EDEDED', '#8A8A8A', '#C98F6B'],
    ['onyx', 'oled', 'dark', '#000000', '#0A0A0A', '#141414', '#1F1F1F', '#EDEDED', '#8A8A8A', '#D4AF37'],
    ['obsidian', 'oled', 'dark', '#000000', '#0A0A0A', '#141414', '#1F1F1F', '#EDEDED', '#8A8A8A', '#5BA66E'],
    ['eclipse', 'oled', 'dark', '#000000', '#0A0A0A', '#141414', '#1F1F1F', '#EDEDED', '#8A8A8A', '#1DC7B7'],
    ['midnight', 'oled', 'dark', '#000000', '#0A0A0A', '#141414', '#1F1F1F', '#EDEDED', '#8A8A8A', '#A5B4FC'],
    ['nocturne', 'oled', 'dark', '#000000', '#0A0A0A', '#141414', '#1F1F1F', '#EDEDED', '#8A8A8A', '#C084FC']
  ];
  function uiColorLuminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  function uiColorContrast(a, b) {
    const x = uiColorLuminance(a), y = uiColorLuminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function uiReadableColor(color, backgrounds, minimum = 4.5) {
    const target = uiColorLuminance(backgrounds[0]) < 0.3 ? '#ffffff' : '#000000';
    const rgb = value => value.slice(1).match(/../g).map(part => parseInt(part, 16));
    const start = rgb(color), end = rgb(target);
    for (let step = 0; step <= 100; step++) {
      const mixed = '#' + start.map((value, i) => Math.round(value + (end[i] - value) * step / 100).toString(16).padStart(2, '0')).join('');
      if (backgrounds.every(background => uiColorContrast(mixed, background) >= minimum)) return mixed;
    }
    return target;
  }
  const UI_THEMES = ['standard', 'light', 'oled'].flatMap(family => UI_THEME_DEFINITIONS.filter(theme => theme[1] === family))
    .map(([id, family, scheme, bg, surface, elevated, border, text, muted, accent]) => {
    const backgrounds = [bg, surface, elevated];
    return { id, family, scheme, name: id[0].toUpperCase() + id.slice(1), colors: {
      bg, surface, elevated, text, accent,
      border: uiReadableColor(border, backgrounds, 3),
      muted: uiReadableColor(muted, backgrounds),
      'accent-ink': uiReadableColor(accent, backgrounds),
      'accent-on': uiColorContrast('#111111', accent) >= uiColorContrast('#ffffff', accent) ? '#111111' : '#ffffff',
      success: uiReadableColor('#34d399', backgrounds), warning: uiReadableColor('#f59e0b', backgrounds),
      danger: uiReadableColor('#f43f5e', backgrounds)
    } };
  });
  let currentUiThemeId = 'atlas';
  const UI_ROOT_IDS = ['pvc-controller-popup', 'pvc-error-modal', 'pvc-permissions-modal', 'pvc-adapter-modal', 'pvc-drm-modal', 'pvc-quick-toast'];
  function applyUiTheme(root) {
    if (!root) return;
    const theme = UI_THEMES.find(item => item.id === currentUiThemeId);
    root.setAttribute('data-pvc-theme', theme.id);
    for (const [key, value] of Object.entries(theme.colors)) root.style.setProperty(`--pvc-${key}`, value);
    root.style.setProperty('--pvc-scheme', theme.scheme);
  }
  function updateThemeControls() {
    const theme = UI_THEMES.find(item => item.id === currentUiThemeId);
    const select = document.getElementById('pvc-theme-select');
    if (select) select.value = theme.id;
    setUiText(document.getElementById('pvc-theme-name'), theme.name);
    setUiText(document.getElementById('pvc-theme-position'), `Tema ${UI_THEMES.indexOf(theme) + 1} / ${UI_THEMES.length}`);
    const note = document.getElementById('pvc-theme-contrast-note');
    if (note) note.hidden = !hudAccessibility.highContrast;
  }
  function setUiTheme(id) {
    if (!UI_THEMES.some(theme => theme.id === id)) return false;
    currentUiThemeId = id;
    UI_ROOT_IDS.forEach(rootId => applyUiTheme(document.getElementById(rootId)));
    updateThemeControls();
    const popup = document.getElementById('pvc-controller-popup');
    if (popup) { resetIdleTimer(popup); clampPopupToViewport(popup); }
    return true;
  }
  function createThemePicker(settings, popup) {
    const details = document.createElement('details'); details.id = 'pvc-themes'; details.className = 'pvc-themes';
    const summary = document.createElement('summary');
    const title = document.createElement('span'); setUiText(title, 'Temalar'); summary.appendChild(title);
    const name = document.createElement('span'); name.id = 'pvc-theme-name'; summary.appendChild(name); details.appendChild(summary);
    const label = document.createElement('label'); label.className = 'pvc-theme-field';
    const caption = document.createElement('span'); setUiText(caption, 'Tema seç'); label.appendChild(caption);
    const select = document.createElement('select'); select.id = 'pvc-theme-select';
    for (const [family, name] of [['standard', 'Standart / koyu'], ['light', 'Açık'], ['oled', 'OLED']]) {
      const group = document.createElement('optgroup'); setUiAttribute(group, 'label', name);
      for (const theme of UI_THEMES.filter(item => item.family === family)) {
        const option = document.createElement('option'); option.value = theme.id; setUiText(option, theme.name); group.appendChild(option);
      }
      select.appendChild(group);
    }
    label.appendChild(select); details.appendChild(label);
    select.addEventListener('change', e => { e.stopPropagation(); setUiTheme(select.value); });
    const controls = document.createElement('div'); controls.className = 'pvc-theme-controls';
    for (const [delta, text] of [[-1, 'Önceki'], [1, 'Sonraki']]) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'pvc-action-btn';
      button.id = delta === -1 ? 'pvc-theme-previous' : 'pvc-theme-next'; setUiText(button, text);
      button.addEventListener('click', e => {
        e.stopPropagation(); const index = UI_THEMES.findIndex(theme => theme.id === currentUiThemeId);
        setUiTheme(UI_THEMES[(index + delta + UI_THEMES.length) % UI_THEMES.length].id);
      }); controls.appendChild(button);
    }
    const position = document.createElement('span'); position.id = 'pvc-theme-position'; position.setAttribute('aria-live', 'polite'); controls.appendChild(position);
    details.appendChild(controls);
    const swatches = document.createElement('div'); swatches.className = 'pvc-theme-swatches'; swatches.setAttribute('aria-hidden', 'true');
    for (const color of ['bg', 'surface', 'elevated', 'text', 'accent']) {
      const swatch = document.createElement('span'); swatch.style.background = `var(--pvc-${color})`; swatches.appendChild(swatch);
    }
    details.appendChild(swatches);
    const note = document.createElement('p'); note.id = 'pvc-theme-contrast-note'; note.className = 'pvc-settings-note';
    setUiText(note, 'Yüksek kontrast açıkken tema renkleri geçici olarak geçersiz kılınır.'); details.appendChild(note);
    settings.insertBefore(details, settings.querySelector('#pvc-accessibility'));
    details.addEventListener('toggle', () => { resetIdleTimer(popup); clampPopupToViewport(popup); });
    updateThemeControls();
  }
  // END UI THEMES

  // Adapted from the user-selected MIT components; see THIRD_PARTY_NOTICES.md.
  function decorateUiComponents(root) {
    for (const button of root.querySelectorAll?.('.pvc-action-btn, .pvc-chip-btn, .pvc-modal-btn-secondary, .pvc-modal-btn-primary') || []) {
      button.classList.add('pvc-raised-button');
    }
    const feedback = root.querySelector?.('#pvc-user-feedback-input');
    if (feedback) feedback.classList.add('pvc-feedback-field');
    for (const checkbox of root.querySelectorAll?.('.pvc-report-field input[type="checkbox"]') || []) {
      if (checkbox.classList.contains('pvc-check-input')) continue;
      checkbox.classList.add('pvc-check-input');
      const visual = document.createElement('span'); visual.className = 'pvc-check-visual'; visual.setAttribute('aria-hidden', 'true');
      visual.innerHTML = '<svg viewBox="0 0 18 18"><path d="M1 9c0-5 3-8 8-8 5 0 8 4 8 8 0 4-4 8-8 8-4 0-8-4-8-8Z"/><polyline points="1 9 7 14 15 4"/></svg>';
      checkbox.after(visual);
    }
  }
  function appendUiLoader(button) {
    const loader = document.createElement('span'); loader.className = 'pvc-loading-grid'; loader.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++) loader.appendChild(document.createElement('i'));
    button.appendChild(loader);
  }
  // END UI COMPONENTS

  // Presentation preferences are kept in this frame only; never added to diagnostics.
  const hudAccessibility = {
    keepVisible: false, largeText: false, highContrast: false,
    reduceMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  };
  function applyUiAccessibility(root) {
    if (!root) return;
    applyUiTheme(root);
    for (const [key, className] of Object.entries({
      largeText: 'pvc-a11y-large-text', highContrast: 'pvc-a11y-contrast', reduceMotion: 'pvc-a11y-reduce-motion'
    })) root.classList.toggle(className, hudAccessibility[key]);
    if (root.id === 'pvc-quick-toast') root.style.setProperty('transition', hudAccessibility.reduceMotion
      ? 'none' : 'opacity 0.2s ease, transform 0.2s ease', 'important');
  }
  function refreshUiAccessibility(popup) {
    for (const id of ['pvc-controller-popup', 'pvc-error-modal', 'pvc-permissions-modal', 'pvc-adapter-modal', 'pvc-drm-modal', 'pvc-quick-toast']) {
      applyUiAccessibility(document.getElementById(id));
    }
    updateThemeControls();
    resetIdleTimer(popup);
    clampPopupToViewport(popup);
  }
  // END HUD ACCESSIBILITY

  function setupHudNavigation(popup) {
    const navigation = document.createElement('div');
    navigation.className = 'pvc-hud-tabs pvc-hide-on-collapse';
    navigation.setAttribute('role', 'tablist');
    navigation.setAttribute('aria-orientation', 'vertical');
    setUiAttribute(navigation, 'aria-label', 'Kontrol grupları');
    const groups = [
      { id: 'player', label: 'Oynatıcı', icon: '<path d="m9 5 10 7-10 7Z"/>', nodes: ['#pvc-section-speed', '#pvc-section-audio', '#pvc-section-quality', '#pvc-adapter-bar', '.pvc-video-target-row'] },
      { id: 'subtitles', label: 'Altyazı', icon: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 10h4m2 0h4M7 14h7m2 0h1"/>', nodes: ['#pvc-section-subtitles'] },
      { id: 'settings', label: 'Ayarlar', icon: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>', nodes: ['.pvc-language-row', '#pvc-section-filters', '#pvc-menu-footer'] }
    ];
    const panels = [], tabs = [];
    const body = document.createElement('div');
    body.id = 'pvc-hud-body'; body.className = 'pvc-hud-body pvc-hide-on-collapse';
    const content = document.createElement('div'); content.className = 'pvc-hud-content';
    popup.insertBefore(body, popup.querySelector('#pvc-section-speed'));
    body.appendChild(navigation); body.appendChild(content);
    for (const group of groups) {
      const tab = document.createElement('button');
      tab.type = 'button'; tab.id = `pvc-tab-${group.id}`; tab.className = 'pvc-hud-tab';
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', `pvc-panel-${group.id}`);
      const icon = document.createElement('span'); icon.className = 'pvc-tab-icon';
      icon.setAttribute('aria-hidden', 'true');
      // Fixed, bundled geometry; no site/user data is interpolated into SVG markup.
      icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false">${group.icon}</svg>`;
      const caption = document.createElement('span'); caption.className = 'pvc-tab-caption'; setUiText(caption, group.label);
      tab.appendChild(icon); tab.appendChild(caption); navigation.appendChild(tab); tabs.push(tab);
      const panel = document.createElement('div');
      panel.id = `pvc-panel-${group.id}`; panel.className = 'pvc-hud-panel pvc-hide-on-collapse';
      panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id);
      // Every panel has a focus stop, including Settings whose first item is a label.
      panel.tabIndex = 0;
      for (const selector of group.nodes) {
        const node = popup.querySelector(selector);
        if (node) panel.appendChild(node); // Move existing controls; retain values, state and listeners.
      }
      content.appendChild(panel); panels.push(panel);
      if (group.id === 'subtitles') {
        panel.querySelector('.pvc-menu-section')?.classList.remove('pvc-section-collapsed');
        panel.querySelector('.pvc-section-header')?.setAttribute('aria-expanded', 'true');
      }
    }
    function activate(index, moveFocus = false) {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (moveFocus) tabs[index].focus();
      resetIdleTimer(popup); clampPopupToViewport(popup);
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', e => { e.stopPropagation(); activate(index); });
      tab.addEventListener('keydown', e => {
        let next;
        if (e.key === 'ArrowDown') next = (index + 1) % tabs.length;
        if (e.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        e.preventDefault(); e.stopPropagation(); activate(next, true);
      });
    });
    const settings = panels.find(panel => panel.id === 'pvc-panel-settings');
    const accessibility = document.createElement('details');
    accessibility.id = 'pvc-accessibility'; accessibility.className = 'pvc-accessibility';
    const summary = document.createElement('summary');
    setUiText(summary, 'Erişilebilirlik'); accessibility.appendChild(summary);
    const options = [
      ['keepVisible', 'Paneli açık tut'], ['largeText', 'Büyük yazı ve kontroller'],
      ['highContrast', 'Yüksek kontrast'], ['reduceMotion', 'Panel animasyonlarını azalt']
    ];
    for (const [key, label] of options) {
      const row = document.createElement('label'); row.className = 'pvc-setting-row';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
      checkbox.id = `pvc-a11y-${key}`; checkbox.checked = hudAccessibility[key];
      const caption = document.createElement('span'); setUiText(caption, label);
      const control = document.createElement('span'); control.className = 'pvc-switch';
      const track = document.createElement('span'); track.className = 'pvc-switch-track'; track.setAttribute('aria-hidden', 'true');
      checkbox.setAttribute('role', 'switch');
      control.appendChild(checkbox); control.appendChild(track);
      row.appendChild(caption); row.appendChild(control); accessibility.appendChild(row);
      checkbox.addEventListener('change', e => {
        e.stopPropagation(); hudAccessibility[key] = checkbox.checked;
        refreshUiAccessibility(popup);
      });
    }
    const shortcutRow = document.createElement('div'); shortcutRow.className = 'pvc-setting-row';
    const shortcutLabel = document.createElement('span'); setUiText(shortcutLabel, 'Klavye Kısayolları');
    shortcutRow.appendChild(shortcutLabel);
    const shortcutButton = popup.querySelector('#pvc-hotkeys-toggle-btn');
    shortcutButton.setAttribute('aria-pressed', String(hotkeysEnabled));
    shortcutRow.appendChild(shortcutButton); accessibility.appendChild(shortcutRow);
    const note = document.createElement('p'); note.className = 'pvc-settings-note';
    setUiText(note, 'Bu tercihler sayfa yenilenince sıfırlanır.');
    accessibility.appendChild(note);
    settings.insertBefore(accessibility, settings.querySelector('#pvc-section-filters'));
    accessibility.addEventListener('toggle', () => { resetIdleTimer(popup); clampPopupToViewport(popup); });
    createThemePicker(settings, popup);
    decorateUiComponents(popup);
    applyUiAccessibility(popup);
    activate(0);
  }
  // END HUD NAVIGATION

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === 'PVC_REMOTE_SOURCE_START') { startRemoteSource(event.data.payload?.session); return; }
    if (event.data.type === 'PVC_REMOTE_CLEAR') { clearRemoteSession(); return; }
    if (event.data.type === 'PVC_REMOTE_SOURCE_SUSPEND') { clearRemoteSession(false); return; }
    if (event.data.type === 'PVC_REMOTE_STATE') { acceptRemoteState(event.data.payload); return; }
    if (event.data.type === 'PVC_REMOTE_REPLY') { acceptRemoteReply(event.data.payload); return; }
    if (event.data.type === 'PVC_EXEC_REMOTE_COMMAND') { executeRemoteCommand(event.data.payload); return; }
    if (event.data.type === 'PVC_SOURCE_FULLSCREEN' && remoteSourceSession === event.data.payload?.session
        && typeof event.data.payload?.value === 'boolean') {
      remoteAncestorFullscreen = event.data.payload.value; syncRemoteFullscreen(); return;
    }
    if (typeof event.data.type === 'string' && event.data.type.startsWith('PVC_APPLY_PLATFORM_')) {
      const platform = event.data.type.slice('PVC_APPLY_PLATFORM_'.length);
      if (Object.hasOwn(DIAGNOSTIC_PLATFORMS, platform)) diagnosticPagePlatform = platform;
      return;
    }
    if (event.data.type === 'PVC_APPLY_LANGUAGE_TR' || event.data.type === 'PVC_APPLY_LANGUAGE_EN') {
      setUiLanguage(event.data.type === 'PVC_APPLY_LANGUAGE_TR' ? 'tr' : 'en', false);
      return;
    }
    if (event.data.type === 'PVC_TOGGLE_POPUP' || event.data.type === 'PVC_TOGGLE_UI' || event.data.type === 'NOK_CONTROLLER_TOGGLE') {
      togglePvcPopup();
    } else if (event.data.type === 'PVC_OPEN_IF_MEDIA') {
      if (deepFindMediaElements().some(item => item.video.readyState > 0)) {
        window.postMessage({ type: 'PVC_OPEN_POPUP' }, '*');
      } else window.postMessage({ type: 'PVC_OPEN_IN_CHILD_FRAMES' }, '*');
    } else if (event.data.type === 'PVC_HIDE_POPUP') {
      const popup = document.getElementById('pvc-controller-popup');
      if (popup) popup.style.display = 'none';
    } else if (event.data.type === 'PVC_OPEN_POPUP') {
      if (frameProtocol && window.parent !== window && !isFullscreenMode() && !remoteSourceSession) {
        window.postMessage({ type: 'PVC_REQUEST_TOP_TOGGLE' }, '*'); return;
      }
      const popup = document.getElementById('pvc-controller-popup') || buildPvcPopup();
      popup.style.display = 'block';
      resetPopupToDefaultPosition(popup);
      clampPopupToViewport(popup);
      resetIdleTimer(popup);
      startQualityWatch();
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();
      window.postMessage({ type: findVideoAndPlayer().video ? 'PVC_HUD_OPENED' : 'PVC_OPEN_IN_CHILD_FRAMES' }, '*');
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

  // FRAME PRESENTATION: bounded UI state; media stays in its owning document.
  const frameProtocol = globalThis.NOkFrameProtocol || null;
  let remotePresentation = null, remotePresentationSession = null;
  let remoteSourceSession = null, remoteSourceOwner = null, remoteAncestorFullscreen = false, remoteSourceActive = true;
  let remoteSourceRevision = 0, remoteSourceSignature = '', remoteSourceQualities = [], remoteSourceCandidates = [];
  let remoteRequestId = 0;
  let remoteFilterQueued = null, remoteFilterFlight = null, remoteFilterIntent = null;
  const remoteRequests = new Map(), retiredRemoteSessions = new Set(), remoteVideoTokens = new WeakMap();
  let remoteVideoToken = 0;
  function postHudSignal(type) {
    const session = remoteSourceSession || remotePresentationSession;
    window.postMessage(session ? { type, payload: { session } } : { type }, '*');
  }
  function clearRemoteSession(retire = true) {
    const hadRemote = remotePresentation || remoteSourceSession;
    if (retire) for (const session of [remotePresentationSession, remoteSourceSession]) if (session) retiredRemoteSessions.add(session);
    while (retiredRemoteSessions.size > 8) retiredRemoteSessions.delete(retiredRemoteSessions.values().next().value);
    for (const pending of remoteRequests.values()) { clearTimeout(pending.timer); pending.resolve({ ok: false, code: 'stale' }); }
    remoteRequests.clear();
    remoteFilterQueued = null; remoteFilterFlight = null; remoteFilterIntent = null;
    if (filterUpdateFrame !== null) { cancelAnimationFrame(filterUpdateFrame); filterUpdateFrame = null; }
    remotePresentation = null; remotePresentationSession = null; remoteSourceSession = null; remoteSourceOwner = null;
    remoteAncestorFullscreen = false; remoteSourceQualities = []; remoteSourceCandidates = [];
    remoteSourceActive = true;
    if (hadRemote) {
      stopAdWatch();
      clearTimeout(qualityWatchTimer);
      const popup = document.getElementById('pvc-controller-popup'); if (popup) popup.style.display = 'none';
      for (const id of ['pvc-error-modal', 'pvc-adapter-modal', 'pvc-drm-modal']) document.getElementById(id)?.remove();
    }
  }
  function remoteFullscreen() { return remoteAncestorFullscreen || isFullscreenMode(); }
  function buildRemoteSourceState() {
    if (!frameProtocol || !remoteSourceSession) return null;
    const selection = findVideoAndPlayer(), { video, player } = selection;
    const qualities = discoverStreamQualities(selection).slice(0, 128);
    updateQualityVerification(video, player);
    const candidates = getMediaCandidates().slice(0, 32).map(item => item.video);
    for (const candidate of candidates) if (!remoteVideoTokens.has(candidate)) remoteVideoTokens.set(candidate, ++remoteVideoToken);
    const signature = JSON.stringify([qualityControlState.generation, userForcedAdapterName,
      qualities.map(item => [item.id, item.height, item.bitrate, item.sourceLabel, item.representationId]), candidates.map(item => remoteVideoTokens.get(item))]);
    if (signature !== remoteSourceSignature) {
      remoteSourceSignature = signature; remoteSourceRevision = (remoteSourceRevision + 1) % 2147483647;
    }
    remoteSourceQualities = qualities; remoteSourceCandidates = candidates;
    const request = readQualityDiagnostics(video, player);
    const bounded = (value, min, max, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
    return frameProtocol.cleanState({
      owner: remoteSourceOwner, revision: remoteSourceRevision, hasVideo: !!video, fullscreen: remoteFullscreen(),
      paused: video?.paused !== false, muted: video?.muted === true,
      width: Math.round(bounded(video?.videoWidth, 0, 16384)), height: Math.round(bounded(video?.videoHeight, 0, 8640)),
      rate: bounded(video?.playbackRate, 0, 16), requestedRate: targetEnforcedPlaybackRate,
      volume: bounded(video?.volume * 100, 0, 100), requestedVolume: currentAudioVolumePercent, audioMode: currentAudioMode,
      adapter: video ? currentActiveAdapterName : 'none', forcedAdapter: userForcedAdapterName || 'none', drm: !!video && detectDrmStatus(video).isDrm,
      qualities: qualities.map(item => ({ height: bounded(item.height, 0, 4320), bitrate: bounded(item.bitrate, 0, 1000000000) })),
      verification: request.verification, requestedHeight: request.requestedHeight || 0,
      requestedIndex: qualities.findIndex(item => item.id === qualityControlState.request?.id),
      decodedMatch: request.decodedMatch, renditionMatch: request.renditionMatch,
      subtitleLoaded: customSubtitleCues.length > 0, subtitleEnabled: subtitleOverlayEnabled,
      subtitleStatus: subtitleRenderStatus, subtitleOffset: subtitleOffsetMs,
      appearance: { ...subtitleAppearance }, filters: { ...videoFilterState },
      candidates: candidates.map(item => ({ height: Math.round(bounded(item.videoHeight, 0, 8640)) })), target: candidates.indexOf(controlledVideo)
    });
  }
  function publishRemoteSourceState() {
    const state = buildRemoteSourceState();
    if (state) window.postMessage({ type: 'PVC_SOURCE_STATE', payload: { session: remoteSourceSession, state } }, '*');
    return state;
  }
  function startRemoteSource(session) {
    if (!frameProtocol || !frameProtocol.cleanSession(session)) {
      window.postMessage({ type: 'PVC_OPEN_IF_MEDIA' }, '*'); return;
    }
    if (retiredRemoteSessions.has(session)) return;
    if (remoteSourceSession === session) { publishRemoteSourceState(); return; }
    clearRemoteSession();
    const { video } = findVideoAndPlayer();
    if (!video || video.readyState === 0) { window.postMessage({ type: 'PVC_OPEN_IN_CHILD_FRAMES' }, '*'); return; }
    remoteSourceSession = session; remoteSourceOwner = frameProtocol.newSession();
    remoteSourceRevision = 0; remoteSourceSignature = '';
    const popup = document.getElementById('pvc-controller-popup'); if (popup) popup.style.display = 'none';
    monitorVideoResolution(video);
    postHudSignal('PVC_HUD_OPENED');
    publishRemoteSourceState(); startQualityWatch();
    syncRemoteFullscreen();
  }
  function syncRemoteFullscreen() {
    if (!remoteSourceSession) return;
    let popup = document.getElementById('pvc-controller-popup');
    if (remoteFullscreen()) {
      popup ||= buildPvcPopup();
      const target = getActiveContainer(); if (popup.parentElement !== target) target.appendChild(popup);
      popup.classList.add('pvc-in-fullscreen'); popup.style.display = 'block';
      syncLocalMediaHud();
      clampPopupToViewport(popup); resetIdleTimer(popup);
    } else if (popup) { popup.style.display = 'none'; popup.classList.remove('pvc-in-fullscreen'); }
    publishRemoteSourceState();
  }
  function remoteControl(name, value) {
    if (!frameProtocol || !remotePresentation || !remotePresentationSession) return Promise.resolve({ ok: false, code: 'stale' });
    const command = frameProtocol.cleanCommand({ name, value, owner: remotePresentation.owner, revision: remotePresentation.revision });
    if (!command) { showToast('Gömülü oynatıcı bu isteği desteklemiyor.'); return Promise.resolve({ ok: false, code: 'unsupported' }); }
    const id = remoteRequestId = (remoteRequestId + 1) % 2147483647, session = remotePresentationSession;
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        remoteRequests.delete(id); showToast('Gömülü oynatıcı yanıt vermedi.'); resolve({ ok: false, code: 'timeout' });
      }, name === 'report' || name === 'ping' ? 10000 : 5000);
      remoteRequests.set(id, { owner: command.owner, session, resolve, timer });
      window.postMessage({ type: 'PVC_REMOTE_COMMAND', payload: { session, id, command } }, '*');
    });
  }
  function queueRemoteFilters(value) {
    if (!remotePresentation || !remotePresentationSession) return;
    rememberRemoteFilterIntent(value);
    remoteFilterQueued = { value: { ...value }, owner: remotePresentation.owner, session: remotePresentationSession };
    flushRemoteFilters();
  }
  function rememberRemoteFilterIntent(value) {
    remoteFilterIntent = { value: { ...value }, owner: remotePresentation.owner, session: remotePresentationSession };
  }
  function sameFilterValues(a, b) {
    return a && b && ['brightness', 'contrast', 'saturate', 'nightShield', 'invert'].every(key => a[key] === b[key]);
  }
  function syncRemoteFilters(state) {
    if (remoteFilterIntent && (remoteFilterIntent.owner !== state.owner || remoteFilterIntent.session !== remotePresentationSession)) remoteFilterIntent = null;
    if (remoteFilterIntent && (!sameFilterValues(state.filters, remoteFilterIntent.value)
        || remoteFilterFlight || remoteFilterQueued || filterUpdateFrame !== null)) return;
    remoteFilterIntent = null;
    videoFilterState = { ...state.filters };
  }
  function flushRemoteFilters() {
    if (remoteFilterFlight || !remoteFilterQueued) return;
    const queued = remoteFilterQueued; remoteFilterQueued = null;
    if (queued.owner !== remotePresentation?.owner || queued.session !== remotePresentationSession) return;
    remoteFilterFlight = queued;
    remoteControl('filters', queued.value).then(reply => {
      // Clearing/replacing a session must not let an old reply dispatch a new command.
      if (remoteFilterFlight !== queued) return;
      remoteFilterFlight = null;
      if (!reply.ok && !remoteFilterQueued && sameFilterValues(remoteFilterIntent?.value, queued.value)) remoteFilterIntent = null;
      flushRemoteFilters();
    });
  }
  function acceptRemoteReply(payload) {
    if (payload?.session !== remotePresentationSession) return;
    const reply = frameProtocol?.cleanReply(payload.reply), pending = reply && remoteRequests.get(reply.id);
    if (!pending || pending.owner !== reply.owner || pending.owner !== remotePresentation?.owner) return;
    clearTimeout(pending.timer); remoteRequests.delete(reply.id); pending.resolve(reply);
    if (!reply.ok) showToast(reply.code === 'stale' ? 'Kalite listesi değişti; yeniden seçin.' : 'Gömülü oynatıcı bu isteği uygulayamadı.');
  }
  async function executeRemoteCommand(payload) {
    if (!frameProtocol || !remoteSourceSession || payload?.session !== remoteSourceSession) return;
    const command = frameProtocol.cleanCommand(payload.command), id = payload.id;
    if (!command || !Number.isInteger(id) || id < 0 || id > 2147483647) return;
    const session = remoteSourceSession, owner = remoteSourceOwner, state = buildRemoteSourceState();
    let reply = { id, owner, ok: true, code: 'ok' };
    if (!state || command.owner !== owner || (command.name !== 'refresh' && command.revision !== state.revision)) reply = { ...reply, ok: false, code: 'stale' };
    else {
      try {
        const { video, player } = findVideoAndPlayer(), value = command.value;
        if (!video && !['refresh', 'report'].includes(command.name)) throw new Error('no-media');
        switch (command.name) {
          case 'speed': if (!setSpeed(value)) throw new Error('speed'); break;
          case 'volume': setAudioVolume(value); break;
          case 'audio': setAudioMode(value); break;
          case 'seek': if (!seekBy(value)) throw new Error('seek'); break;
          case 'quality': if (!remoteSourceQualities[value] || !requestQuality(remoteSourceQualities[value], video, player)) throw new Error('quality'); break;
          case 'target': controlledVideo = value < 0 ? null : remoteSourceCandidates[value]; if (value >= 0 && !controlledVideo) throw new Error('target'); break;
          case 'adapter': userForcedAdapterName = value === 'none' ? '' : value; getActiveAdapter(video, player); break;
          case 'filters': videoFilterState = { ...value }; applyVideoFiltersToElement(video); updateFilterUiBadges(); break;
          case 'appearance': Object.assign(subtitleAppearance, value); updateSubtitleAppearanceControls();
            if (video.__nokSubtitleTrack?.cues) for (const cue of video.__nokSubtitleTrack.cues) { cue.snapToLines = false; cue.line = 100 - value.bottom; }
            renderCustomSubtitleCue(video); break;
          case 'subtitle-load': customSubtitleCues = value; subtitleFileName = 'External subtitles'; subtitleOffsetMs = 0;
            subtitleOverlayEnabled = true; subtitleLoadStatus = 'loaded'; addDiagnosticLog('INFO', 'SUBTITLE_LOADED');
            injectNativeTextTrackCues(video); renderCustomSubtitleCue(video); break;
          case 'subtitle-visible': subtitleOverlayEnabled = value; injectNativeTextTrackCues(video); renderCustomSubtitleCue(video); break;
          case 'subtitle-offset': if (value === 0) { subtitleOffsetMs = 0; injectNativeTextTrackCues(video); renderCustomSubtitleCue(video); } else shiftSubtitleSync(value); break;
          case 'hotkeys': hotkeysEnabled = value; break;
          case 'presentation-active': remoteSourceActive = value; break;
          case 'play': if (video.paused) await video.play(); else video.pause(); break;
          case 'pip': if (await togglePictureInPicture() === false) reply = { ...reply, ok: false, code: 'unsupported' }; break;
          case 'ping': { const result = await testCdnPing(false); if (result?.ms !== undefined) reply.ms = result.ms; else reply = { ...reply, ok: false, code: 'failed' }; break; }
          case 'report': reply.report = buildDiagnosticPayload(video ? 'USER_MANUAL_DIAGNOSTIC' : 'NO_VIDEO_FOUND'); break;
          case 'drm-info': break;
          case 'refresh': invalidateMediaDiscovery(); break;
          default: reply = { ...reply, ok: false, code: 'unsupported' };
        }
      } catch (_) { reply = { id, owner, ok: false, code: 'failed' }; }
    }
    if (remoteSourceSession !== session || remoteSourceOwner !== owner) return;
    const safe = frameProtocol.cleanReply(reply);
    if (safe) window.postMessage({ type: 'PVC_SOURCE_REPLY', payload: { session, reply: safe } }, '*');
    publishRemoteSourceState();
  }
  function acceptRemoteState(payload) {
    const session = frameProtocol?.cleanSession(payload?.session), state = frameProtocol?.cleanState(payload?.state);
    if (!session || !state || retiredRemoteSessions.has(session) || window !== window.top) return;
    const first = remotePresentationSession !== session;
    if (first) clearRemoteSession();
    if (remotePresentation && remotePresentation.owner !== state.owner) {
      for (const pending of remoteRequests.values()) { clearTimeout(pending.timer); pending.resolve({ ok: false, code: 'stale' }); }
      remoteRequests.clear();
    }
    remotePresentationSession = session; remotePresentation = state;
    renderRemoteHud();
    if (first) {
      const popup = document.getElementById('pvc-controller-popup'); resetPopupToDefaultPosition(popup); clampPopupToViewport(popup); resetIdleTimer(popup);
    }
  }
  function renderRemoteHud() {
    const state = remotePresentation; if (!state) return;
    const popup = document.getElementById('pvc-controller-popup') || buildPvcPopup();
    popup.__nokActivity = active => {
      if (popup.__nokLastActivity === active) return;
      popup.__nokLastActivity = active; remoteControl('presentation-active', active);
    };
    const target = getActiveContainer();
    const blockedTarget = ['IFRAME', 'FRAME', 'VIDEO'].includes(target.tagName);
    if (!blockedTarget && popup.parentElement !== target) target.appendChild(popup);
    popup.style.display = state.fullscreen || blockedTarget ? 'none' : 'block';
    const text = (id, value) => setUiText(document.getElementById(id), value);
    const value = (id, next) => { const input = document.getElementById(id); if (input && document.activeElement !== input) input.value = String(next); };
    if (remoteRequests.size === 0) {
      currentAudioVolumePercent = state.requestedVolume; targetEnforcedPlaybackRate = state.requestedRate;
      currentAudioMode = state.audioMode; syncRemoteFilters(state); Object.assign(subtitleAppearance, state.appearance);
      subtitleOverlayEnabled = state.subtitleEnabled; subtitleOffsetMs = state.subtitleOffset;
      value('pvc-speed-slider', state.requestedRate); value('pvc-volume-slider', state.requestedVolume);
      updateFilterUiBadges(); updateSubtitleAppearanceControls();
    }
    userForcedAdapterName = state.forcedAdapter === 'none' ? '' : state.forcedAdapter;
    lastObservedResolution = state.hasVideo ? `${state.width}x${state.height} (${state.height}p)` : '—';
    text('pvc-realtime-res-badge', `🎬 Gerçek: ${lastObservedResolution}`); text('pvc-mini-res-val', `🎬 ${state.height || '—'}p`);
    text('pvc-hdr-speed-badge', `${state.requestedRate}x`); text('pvc-mini-speed-val', `⚡ ${state.rate}x`);
    text('pvc-hdr-volume-badge', `${state.requestedVolume}%`); text('pvc-mini-vol-val', `🔊 ${state.volume}% (${state.audioMode === 'mono' ? 'M' : 'S'})`);
    text('pvc-hdr-audio-badge', state.audioMode.toUpperCase()); text('pvc-active-adapter-badge', state.adapter);
    text('pvc-mini-adapter-val', state.adapter.replace('Adapter', ''));
    text('pvc-sub-offset-badge', `${state.subtitleOffset >= 0 ? '+' : ''}${state.subtitleOffset}ms`);
    text('pvc-sub-toggle-btn', state.subtitleEnabled ? '👁️ Altyazı: Açık' : '🙈 Altyazı: Gizli');
    document.getElementById('pvc-sub-toggle-btn')?.classList.toggle('pvc-active', state.subtitleEnabled);
    text('pvc-sub-status-text', state.subtitleLoaded ? 'Altyazı yüklü (oynatıcı çerçevesinde).' : 'Yüklü altyazı yok (Sıfır Depolama RAM Modu)');
    for (const [id, show] of [['pvc-drm-status-badge', state.drm], ['pvc-no-video-alert', !state.hasVideo]]) {
      const element = document.getElementById(id); if (element) element.style.display = show ? 'block' : 'none';
    }
    renderRemoteQualities(); renderRemoteTargets();
  }
  function renderRemoteQualities() {
    const state = remotePresentation, container = document.getElementById('pvc-dynamic-quality-container');
    if (!state || !container) return;
    const signature = JSON.stringify([state.owner, state.revision, uiLanguage, state.qualities]);
    if (container.__nokRemoteSignature !== signature) {
      container.innerHTML = ''; container.__nokRemoteSignature = signature;
      state.qualities.forEach((quality, index) => {
        const button = document.createElement('button'); button.className = 'pvc-quality-chip-btn'; button.type = 'button';
        const label = quality.height > 0 ? `${quality.height}p` : quality.bitrate > 0 ? `${(quality.bitrate / 1000000).toFixed(1)} Mb/sn` : `Seviye ${index + 1}`;
        setUiText(button, label); button.__nokRemoteIndex = index;
        const owner = state.owner, revision = state.revision;
        button.onclick = e => { e.stopPropagation(); if (remotePresentation?.owner === owner && remotePresentation.revision === revision) remoteControl('quality', index); };
        container.appendChild(button);
      });
      const note = document.createElement('span'); note.className = 'pvc-quality-inventory-note';
      setUiText(note, state.qualities.length ? 'Kaynak menüsü ve oynatıcı seviyeleri birlikte listelenir; tüm kaynakların bulunduğu doğrulanmadı.' : 'Bu oynatıcıda kullanılabilir kalite kontrolü bulunamadı.'); container.appendChild(note);
    }
    for (const button of container.querySelectorAll('button')) {
      const selected = state.requestedIndex >= 0 && button.__nokRemoteIndex === state.requestedIndex;
      const confirmed = selected && ['confirmed', 'decoded-match'].includes(state.verification);
      button.classList.toggle('pvc-active', confirmed); button.classList.toggle('pvc-requested', selected && !confirmed); button.setAttribute('aria-pressed', String(confirmed));
    }
    setUiText(document.getElementById('pvc-quality-count-badge'), `${state.qualities.length} seviye`);
    const labels = { pending: 'Bekleniyor', confirmed: 'Doğrulandı', 'decoded-match': 'Görüntü eşleşti', 'rendition-confirmed': 'Oynatıcı seçti; görüntü bekleniyor', 'timed-out': 'Doğrulanamadı', rejected: 'Reddedildi' };
    setUiText(document.getElementById('pvc-quality-status'), state.verification === 'not-verified' ? 'Kalite isteği yok.'
      : `İstenen ${state.requestedHeight ? state.requestedHeight + 'p' : '—'} · oynatılan ${state.height ? state.height + 'p' : '—'} · ${labels[state.verification]}`);
  }
  function renderRemoteTargets() {
    const select = document.getElementById('pvc-video-target'), state = remotePresentation;
    if (!select || !state || document.activeElement === select) return;
    const signature = JSON.stringify([state.owner, state.revision, state.candidates, uiLanguage]);
    if (select.__nokRemoteSignature !== signature) {
      select.innerHTML = ''; select.__nokRemoteSignature = signature;
      const automatic = document.createElement('option'); automatic.value = 'auto'; setUiText(automatic, 'Otomatik seçim'); select.appendChild(automatic);
      state.candidates.forEach((candidate, index) => {
        const option = document.createElement('option'); option.value = String(index); setUiText(option, `Video ${index + 1} · ${candidate.height ? candidate.height + 'p' : '—'}`); select.appendChild(option);
      });
    }
    select.value = state.target < 0 ? 'auto' : String(state.target);
  }
  function syncLocalMediaHud() {
    if (remotePresentation) return;
    const speed = document.getElementById('pvc-speed-slider'); if (speed) speed.value = String(targetEnforcedPlaybackRate);
    const volume = document.getElementById('pvc-volume-slider');
    if (volume) { volume.value = String(currentAudioVolumePercent); updateVolumeSliderVisualGain(volume, currentAudioVolumePercent); }
    setUiText(document.getElementById('pvc-hdr-speed-badge'), `${targetEnforcedPlaybackRate}x`);
    setUiText(document.getElementById('pvc-hdr-volume-badge'), `${currentAudioVolumePercent}%`);
    setUiText(document.getElementById('pvc-hdr-audio-badge'), currentAudioMode.toUpperCase());
    document.getElementById('pvc-audio-stereo-btn')?.classList.toggle('pvc-audio-active', currentAudioMode === 'stereo');
    document.getElementById('pvc-audio-mono-btn')?.classList.toggle('pvc-audio-active', currentAudioMode === 'mono');
    const toggle = document.getElementById('pvc-sub-toggle-btn');
    setUiText(toggle, subtitleOverlayEnabled ? '👁️ Altyazı: Açık' : '🙈 Altyazı: Gizli'); toggle?.classList.toggle('pvc-active', subtitleOverlayEnabled);
    if (customSubtitleCues.length) setUiText(document.getElementById('pvc-sub-status-text'), `💬 Altyazı Yüklendi: ${customSubtitleCues.length} satır`);
    setUiText(document.getElementById('pvc-sub-offset-badge'), `${subtitleOffsetMs >= 0 ? '+' : ''}${subtitleOffsetMs}ms`);
    updateFilterUiBadges(); updateSubtitleAppearanceControls(); updateRealtimeResolutionBadge();
  }
  // END FRAME PRESENTATION

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
      invalidateQualityVideo(state.video);
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

  function isIvsBoundToVideo(player, video) {
    if (!player || !video) return false;
    try {
      if (typeof player.getHTMLVideoElement === 'function') return player.getHTMLVideoElement() === video;
      return video.__ivsPlayer === player || video._ivsPlayer === player;
    } catch (_) { return false; }
  }
  function ivsQualityKey(quality) {
    if (!quality || typeof quality.name !== 'string' || quality.name.length > 128
        || !Number.isFinite(quality.height) || quality.height < 0 || quality.height > 4320
        || !Number.isFinite(quality.bitrate) || quality.bitrate < 0 || quality.bitrate > 1000000000) return null;
    return JSON.stringify([quality.name, quality.height, quality.bitrate]);
  }
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
    AD_CONTROL_STARTED: [], AD_CONTROL_ENDED: [],
    SPEED_REQUESTED: ['rate'], SPEED_FAILED: [],
    VOLUME_REQUESTED: ['percent'], AUDIO_MODE_CHANGED: ['mono'], SEEK_REQUESTED: ['delta'],
    QUALITY_REQUESTED: ['height'],
    KICK_SPEED_SYNC: ['reactInvoked', 'ivsInvoked'],
    KICK_VOLUME_SYNC: ['reactInvoked', 'ivsInvoked'],
    KICK_SPEED_UI_INVOKED: ['rate'], KICK_SPEED_UI_UNAVAILABLE: [],
    KICK_SYNC_FAILED: [], QUALITY_REJECTED: [],
    TRT_RATE_REAPPLIED: ['rate'], TRT_RATE_GAVE_UP: [], TRT_RATE_INTERCEPTED: ['rate'],
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
    if (remotePresentation) { renderRemoteHud(); return; }
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
    if (remoteSourceSession) syncRemoteFullscreen();
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, syncFullscreenElements);
  });

  function showToast(msg) {
    if (remoteSourceSession && !remoteFullscreen()) return;
    try {
      const existing = document.getElementById('pvc-quick-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'pvc-quick-toast';
      toast.className = 'pvc-toast pvc-toast-visible';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      toast.setAttribute('lang', uiLanguage);
      setUiText(toast, msg);
      
      toast.style.cssText = `
        position: fixed !important;
        top: 24px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: var(--pvc-surface) !important;
        color: var(--pvc-accent-ink, #92bfd5) !important;
        border: 1px solid color-mix(in srgb, var(--pvc-accent) 45%, transparent) !important;
        padding: 8px 22px !important;
        border-radius: 24px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45) !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        display: block !important;
        opacity: 1 !important;
        letter-spacing: 0.3px !important;
        transition: opacity 0.2s ease, transform 0.2s ease !important;
      `;

      const container = getActiveContainer();
      container.appendChild(toast);
      applyUiAccessibility(toast);

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
      setUiText(drmBadge, `🛡️ DRM Korumalı Akış (${drmStatus.keySystem})`);
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

  // Cache discovery, not player instances: library attachment can change between calls.
  let mediaDiscoveryCache = { at: -Infinity, candidates: [] };
  let controlledVideo = null;
  function invalidateMediaDiscovery() { mediaDiscoveryCache.at = -Infinity; }
  function getMediaCandidates() {
    const now = performance.now();
    if (now - mediaDiscoveryCache.at > 1000 || mediaDiscoveryCache.candidates.some(item => item.video.isConnected === false)) {
      mediaDiscoveryCache = { at: now, candidates: deepFindMediaElements() };
    }
    return mediaDiscoveryCache.candidates;
  }
  // Attributes (including filter sliders and video styles) never invalidate the scan.
  if (typeof MutationObserver === 'function') {
    const mediaObserver = new MutationObserver(records => {
      const isUiNode = node => node?.nodeType === 1 && (node.id?.startsWith('pvc-') || node.closest?.('[id^="pvc-"]'));
      const mayChangeMedia = node => node?.nodeType === 1 && !isUiNode(node)
        && (['VIDEO', 'IFRAME', 'FRAME'].includes(node.tagName) || node.shadowRoot || node.tagName?.includes('-')
          || node.querySelector?.('video, iframe, frame'));
      if (records.some(record => !isUiNode(record.target)
          && [...record.addedNodes, ...record.removedNodes].some(mayChangeMedia))) invalidateMediaDiscovery();
    });
    mediaObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
  document.addEventListener('playing', invalidateMediaDiscovery, true);
  document.addEventListener('loadedmetadata', invalidateMediaDiscovery, true);
  // END MEDIA DISCOVERY CACHE

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
    const discoveredList = getMediaCandidates();
    if (discoveredList.length === 0) {
      controlledVideo = null;
      isMediaInShadowDom = false;
      return { video: null, player: null, playerType: 'none', platform: HOSTNAME, isShadow: false };
    }

    // Score each candidate once; sorting previously repeated layout reads in its comparator.
    let bestCandidate = discoveredList[0], bestScore = -Infinity;
    for (const candidate of discoveredList) {
      const score = scoreVideoCandidate(candidate.video);
      if (score > bestScore) { bestCandidate = candidate; bestScore = score; }
    }
    if (controlledVideo) {
      const controlled = discoveredList.find(item => item.video === controlledVideo && item.video.isConnected !== false);
      if (controlled) bestCandidate = controlled;
      else controlledVideo = null;
    }
    const selectedVideo = bestCandidate.video;
    isMediaInShadowDom = bestCandidate.isShadow;

    detectDrmStatus(selectedVideo);

    let player = null;
    let playerType = bestCandidate.isShadow ? 'shadow-html5' : 'native-html5';
    const shaka = findLibraryPlayer(selectedVideo, 'shaka');
    const hls = findLibraryPlayer(selectedVideo, 'hls');
    const vjs = findVideoJsPlayer(selectedVideo);
    const attachedIvs = selectedVideo.__ivsPlayer || selectedVideo._ivsPlayer;
    const ivs = attachedIvs && isIvsBoundToVideo(attachedIvs, selectedVideo) ? attachedIvs
      : globalCapturedIvsPlayer && isIvsBoundToVideo(globalCapturedIvsPlayer, selectedVideo) ? globalCapturedIvsPlayer : null;

    if (HOSTNAME.includes('youtube.com')) {
      playerType = 'youtube-player';
      player = document.getElementById('movie_player') || null;
    } else if (ivs) {
      player = ivs;
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
    let clickAttempted = false;
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
      clickAttempted = true;
      if (typeof el.click === 'function') el.click();
      else el.dispatchEvent(new MouseEvent('click', { ...commonOpts, button: 0, buttons: 0 }));
    } catch (e) {
      if (!clickAttempted && typeof el.click === 'function') {
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
  let cachedKickVolOwner = null;
  let cachedKickSpeedOwner = null;
  let kickSpeedUiTimer = null;

  function invokeKickVolumeSlider(percent) {
    const roots = document.querySelectorAll('[data-testid="volume-slider"], .volume-slider, [role="slider"][aria-label*="volume" i], [role="slider"][aria-label*="ses" i], input[type="range"][aria-label*="volume" i]');
    for (const root of roots) {
      const key = Object.keys(root).find(name => name.startsWith('__reactFiber$') || name.startsWith('__reactInternalInstance$'));
      if (!key) continue;
      let invoked = false;
      searchFiberTree(root[key], node => {
        const props = node.memoizedProps;
        if (typeof props?.onValueChange !== 'function' || !Array.isArray(props.value || props.defaultValue)) return false;
        const max = props.max ?? Number(root.getAttribute?.('aria-valuemax') || root.max);
        if (max !== 1 && max !== 100) return false;
        try {
          props.onValueChange([percent / 100 * max]);
          cachedKickVolHook = { dispatch: props.onValueChange, type: 'array', max };
          cachedKickVolOwner = root;
          invoked = true;
          return true;
        } catch (_) { return false; }
      }, 60);
      if (invoked) return true;
    }
    return false;
  }

  function scheduleKickSpeedUi(rate) {
    clearTimeout(kickSpeedUiTimer);
    const settings = document.querySelector('[data-testid="player-settings-button"], [data-testid="settings-button"]');
    if (!settings) { addDiagnosticLog('WARN', 'KICK_SPEED_UI_UNAVAILABLE'); return; }
    const items = () => [...document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [data-radix-popper-content-wrapper] button')]
      .filter(item => !item.closest?.('#pvc-controller-popup') && item.getClientRects().length > 0);
    const rateValue = item => {
      const text = (item.textContent || '').trim().toLowerCase().replace(/\s+/g, '');
      if (text === 'normal') return 1;
      const match = text.match(/^(\d+(?:[.,]\d+)?)\s*[x×]$/);
      return match ? Number(match[1].replace(',', '.')) : NaN;
    };
    const selectRate = () => {
      const item = items().find(candidate => rateValue(candidate) === rate);
      if (!item) return false;
      simulateFullPointerClick(item);
      addDiagnosticLog('INFO', 'KICK_SPEED_UI_INVOKED', { rate });
      return true;
    };
    const isSpeedMenu = item => /^(playback speed|speed|oynatma hızı|hız)(\s|$)/i.test((item.textContent || '').trim());
    const openedByUs = settings.getAttribute('aria-expanded') !== 'true' && !items().some(isSpeedMenu);
    const unavailable = () => {
      addDiagnosticLog('WARN', 'KICK_SPEED_UI_UNAVAILABLE');
      if (openedByUs && settings.getAttribute('aria-expanded') === 'true') simulateFullPointerClick(settings);
    };
    // Yalnızca gerçek menü seçenekleri tıklanır; router veya tahmini React hook'u değiştirilmez.
    if (selectRate()) return;
    if (openedByUs) simulateFullPointerClick(settings);
    kickSpeedUiTimer = setTimeout(() => {
      if (selectRate()) return;
      const submenu = items().find(isSpeedMenu);
      if (!submenu) { unavailable(); return; }
      simulateFullPointerClick(submenu);
      kickSpeedUiTimer = setTimeout(() => {
        if (!selectRate()) unavailable();
      }, 120);
    }, 120);
  }

  const KickAdapter = {
    name: 'KickAdapter',
    matches() {
      return HOSTNAME.includes('kick.com') || (!!document.querySelector('#channel-player, [class*="kick-player"]') && !HOSTNAME.includes('trt') && !HOSTNAME.includes('puhu') && !HOSTNAME.includes('nowtv'));
    },
    isVodPage() {
      return window.location.pathname.includes('/video/') || window.location.pathname.includes('/videos/');
    },
    findIvsPlayer(video) {
      if (isIvsBoundToVideo(globalCapturedIvsPlayer, video) && typeof globalCapturedIvsPlayer.getQualities === 'function') return globalCapturedIvsPlayer;
      if (isIvsBoundToVideo(video?.__ivsPlayer, video) && typeof video.__ivsPlayer.getQualities === 'function') return video.__ivsPlayer;
      if (isIvsBoundToVideo(video?._ivsPlayer, video) && typeof video._ivsPlayer.getQualities === 'function') return video._ivsPlayer;
      for (const candidate of [window.ivsPlayer, window.__ivsPlayer, window.player]) {
        if (isIvsBoundToVideo(candidate, video) && typeof candidate.getQualities === 'function') return (globalCapturedIvsPlayer = candidate);
      }

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
        if (isIvsBoundToVideo(el.__ivsPlayer, video) && typeof el.__ivsPlayer.getQualities === 'function') return (globalCapturedIvsPlayer = el.__ivsPlayer);
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

            if (isIvsBoundToVideo(foundPlayer, video)) {
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
      if (cachedKickSpeedOwner?.isConnected === false) { cachedKickSpeedSetter = null; cachedKickSpeedHook = null; }
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
                  cachedKickSpeedOwner = root;
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
      if (cachedKickVolOwner?.isConnected === false) { cachedKickVolSetter = null; cachedKickVolHook = null; }
      if (cachedKickVolSetter) {
        try { cachedKickVolSetter(normalizedVol); return true; } catch (e) { cachedKickVolSetter = null; }
      }
      if (cachedKickVolHook && typeof cachedKickVolHook.dispatch === 'function') {
        try {
          if (cachedKickVolHook.type === 'array') cachedKickVolHook.dispatch([normalizedVol * (cachedKickVolHook.max || 1)]);
          else if (cachedKickVolHook.type === 'percent') cachedKickVolHook.dispatch(percent);
          else cachedKickVolHook.dispatch(normalizedVol);
          return true;
        } catch (e) { cachedKickVolHook = null; }
      }
      if (invokeKickVolumeSlider(percent)) return true;

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
                  cachedKickVolOwner = root;
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
        clearTimeout(kickSpeedUiTimer);
        const { video } = findVideoAndPlayer();
        const ivs = this.findIvsPlayer(video);
        if (ivs && typeof ivs.setPlaybackRate === 'function') ivs.setPlaybackRate(rate);
        const reactInvoked = this.findAndInvokeReactSpeed(rate);
        if (!reactInvoked && this.isVodPage()) scheduleKickSpeedUi(rate);
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
    getQualities(video) {
      const results = [];
      const ivs = this.findIvsPlayer(video);
      if (ivs && typeof ivs.getQualities === 'function') {
        try {
          const qList = ivs.getQualities();
          if (Array.isArray(qList) && qList.length > 0) {
            qList.slice(0, 128).forEach((q, idx) => {
              const key = ivsQualityKey(q); if (!key || (!q.height && !q.bitrate)) return;
              const h = q.height || 0;
              results.push({ id: `ivs_${key}`, index: idx, label: h ? `${h}p` : `${(q.bitrate / 1000000).toFixed(1)} Mb/sn`,
                height: h, bitrate: q.bitrate || 0, qualityApi: 'ivs', raw: q });
            });
            return results.sort((a, b) => (b.height || 0) - (a.height || 0));
          }
        } catch (e) {}
      }
      return []; // No guessed renditions when the selected player has no inventory.
    },
    applyQuality(targetItem, video) {
      const ivs = this.findIvsPlayer(video);
      if (ivs && typeof ivs.getQualities === 'function') {
        try {
          const qList = ivs.getQualities();
          const key = ivsQualityKey(targetItem.raw);
          const targetQuality = key && Array.isArray(qList) ? qList.find(q => ivsQualityKey(q) === key) : null;
          if (!targetQuality || typeof ivs.setQuality !== 'function') return false;
          ivs.setQuality(targetQuality);
          return true;
        } catch (e) {}
      }
      return false;
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

  function refreshVideoJsBufferedQuality(video, vjs, choice) {
    // VHS may have selected the requested playlist while old rendition frames
    // still fill the buffer. Its fastQualityChange_ then skips a same-playlist
    // request. Reuse VHS's own reset/load path only for that exact bound case.
    // https://github.com/videojs/http-streaming/blob/v3.17.2/src/playlist-controller.js
    try {
      if (!video || video.isConnected === false || video.ended || video.readyState < 2
          || !(video.videoHeight > 0) || !(choice.height > 0) || video.videoHeight === choice.height
          || !(video.buffered?.length > 0) || findVideoJsPlayer(video, vjs) !== vjs) return false;
      const vhs = vjs?.tech_?.vhs || vjs?.tech?.({ IWillNotUseThisInPlugins: true })?.vhs;
      const controller = vhs?.playlistController_;
      const id = choice.representationId ?? choice.raw?.id ?? vjs?.qualityLevels?.()[choice.index]?.id;
      const representation = id == null ? null : vhs?.representations?.().find(item => item.id === id);
      const media = controller?.mainPlaylistLoader_?.media?.();
      if (!representation?.playlist || representation.height !== choice.height || !representation.enabled()
          || media?.id !== id || controller.mainSegmentLoader_?.playlist_?.id !== id
          || typeof controller.runFastQualitySwitch_ !== 'function') return false;
      try { controller.runFastQualitySwitch_(); } catch (_) { /* One attempt per explicit request, even on SDK failure. */ }
      return true;
    } catch (_) { return false; }
  }

  function applyVideoJsEnabledSelection(levels, index) {
    const list = Array.from(levels || []), target = list[index];
    if (!target) return false;
    const read = level => typeof level.enabled === 'function' ? level.enabled() : level.enabled;
    const write = (level, enabled) => { if (typeof level.enabled === 'function') level.enabled(enabled); else level.enabled = enabled; };
    // VHS starts a fast switch only on a disabled -> enabled transition.
    // If the target is already in the ABR pool, keep another level active while
    // cycling that target; never transiently disable every level.
    if (read(target) === true && list.some((level, i) => i !== index && read(level) === true)) write(target, false);
    write(target, true);
    list.forEach((level, i) => { if (i !== index) write(level, false); });
    return true;
  }
  const VideoJsAdapter = {
    name: 'VideoJsAdapter',
    tier: 2,
    displayName: 'Video.js Kütüphanesi (Tier 2)',
    matches(video, player) {
      return !!findVideoJsPlayer(video, player);
    },
    getQualities(video, player) {
      const vjs = findVideoJsPlayer(video, player);
      if (typeof vjs?.getGroupedSrc === 'function' && typeof vjs?.currentResolution === 'function') {
        try {
          const groups = vjs.getGroupedSrc()?.label;
          const options = [], heights = new Set();
          for (const [sourceLabel, sources] of Object.entries(groups || {})) {
            if (!Array.isArray(sources)) continue;
            const numericLabel = sourceLabel.match(/^(\d{2,4})p?$/i);
            const height = sources.map(source => diagnosticNumber(Number(source.res), 100, 4320)).find(Boolean)
              || (numericLabel ? diagnosticNumber(Number(numericLabel[1]), 100, 4320) : null);
            if (!height || heights.has(height)) continue;
            heights.add(height);
            options.push({ id: `vjs_source_${height}`, height, label: `${height}p`, qualityApi: 'vjs-resolution-switcher', sourceLabel });
          }
          if (options.length) return options.sort((a, b) => b.height - a.height);
        } catch (_) {}
      }
      if (vjs && typeof vjs.qualityLevels === 'function') {
        try {
          const ql = vjs.qualityLevels();
          if (ql && ql.length > 0) {
            const res = [];
            for (let i = 0; i < ql.length; i++) {
              const h = ql[i].height || 0;
              // QualityLevels labels may be playlist IDs/URLs, not user-facing resolutions.
              res.push({ id: `vjs_${i}`, index: i, label: h ? `${h}p` : ql[i].bitrate > 0
                ? `${(ql[i].bitrate / 1000000).toFixed(1)} Mb/sn` : `Seviye ${i + 1}`, height: h, raw: ql[i] });
            }
            if (res.length > 0) return res.sort((a, b) => (b.height || 0) - (a.height || 0));
          }
        } catch (e) {}
      }
      try {
        const vhs = vjs?.tech_?.vhs || vjs?.tech?.({ IWillNotUseThisInPlugins: true })?.vhs;
        const representations = vhs?.representations?.();
        if (Array.isArray(representations)) {
          return representations.map((rep, index) => typeof rep.enabled === 'function' ? ({
            id: `vjs_vhs_${index}`, index,
            label: rep.height > 0 ? `${rep.height}p` : rep.bandwidth > 0
              ? `${(rep.bandwidth / 1000000).toFixed(1)} Mb/sn` : `Seviye ${index + 1}`,
            height: diagnosticNumber(rep.height, 1, 4320) || 0, qualityApi: 'vhs-representations', representationId: rep.id
          }) : null).filter(Boolean).sort((a, b) => b.height - a.height);
        }
      } catch (_) {}
      return GenericAdapter.getQualities();
    },
    applyQuality(targetItem, video, player) {
      const vjs = findVideoJsPlayer(video, player);
      if (targetItem.qualityApi === 'vjs-resolution-switcher') {
        try {
          if (!vjs?.getGroupedSrc?.()?.label?.[targetItem.sourceLabel] || typeof vjs.currentResolution !== 'function') return false;
          vjs.currentResolution(targetItem.sourceLabel);
          return true;
        } catch (_) { return false; }
      }
      if (targetItem.qualityApi === 'vhs-representations') {
        try {
          const vhs = vjs?.tech_?.vhs || vjs?.tech?.({ IWillNotUseThisInPlugins: true })?.vhs;
          const representations = vhs?.representations?.();
          if (!Array.isArray(representations)) return false;
          const targetIndex = targetItem.representationId !== undefined
            ? representations.findIndex(rep => rep.id === targetItem.representationId) : targetItem.index;
          if (!Number.isInteger(targetIndex) || typeof representations[targetIndex]?.enabled !== 'function') return false;
          if (!applyVideoJsEnabledSelection(representations, targetIndex)) return false;
          showToast(`Video.js: ${targetItem.label} istendi`);
          return true;
        } catch (_) { return false; }
      }
      if (vjs && typeof vjs.qualityLevels === 'function') {
        try {
          const ql = vjs.qualityLevels();
          if (ql && ql.length > 0 && Number.isInteger(targetItem.index) && ql[targetItem.index]) {
            if (!applyVideoJsEnabledSelection(ql, targetItem.index)) return false;
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
    getQualities(video) { return getNativeQualityMenuOptions(video); },
    applyQuality(item, video) { return applyNativeQualityMenu(item, video); }
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

  // A quality choice belongs to a particular media/player/source, never just a label.
  const qualityControlState = { context: null, request: null, generation: 0 };
  const qualityMediaEpochs = new WeakMap();
  const qualityObservedVideos = new WeakSet();
  let qualityWatchTimer = null;
  const qualityChoiceBindings = new WeakMap();
  const nativeQualityHandles = new WeakMap();
  const QUALITY_PLAYER_ROOT = '.video-js, .plyr, .jwplayer, .vds-player, [data-player]';
  function getQualitySourceKey(video, player) {
    return typeof player?.url === 'string' ? player.url : video?.currentSrc || video?.src || '';
  }
  function invalidateQualityVideo(video) {
    if (video) qualityMediaEpochs.set(video, (qualityMediaEpochs.get(video) || 0) + 1);
  }
  function observeQualityVideo(video) {
    if (!video || qualityObservedVideos.has(video)) return;
    qualityObservedVideos.add(video);
    for (const event of ['emptied', 'loadstart']) video.addEventListener(event, () => invalidateQualityVideo(video));
  }
  function qualityContextMatches(video, player, context = qualityControlState.context) {
    return !!video && !!context && context.video === video && context.player === player
      && context.source === getQualitySourceKey(video, player) && context.epoch === (qualityMediaEpochs.get(video) || 0);
  }
  function resetQualityContext(video, player, adapter) {
    if (qualityContextMatches(video, player) && qualityControlState.context.adapter === adapter) return;
    clearTimeout(pendingTimeoutTimer);
    const pending = qualityControlState.request;
    const expectedSwitch = video && pending?.video === video && ['native-menu', 'vjs-resolution-switcher'].includes(pending.qualityApi)
      && performance.now() - pending.started < 12000 && ['pending', 'rendition-confirmed'].includes(pending.status);
    qualityControlState.context = video ? { video, player, adapter, source: getQualitySourceKey(video, player), epoch: qualityMediaEpochs.get(video) || 0 } : null;
    qualityControlState.request = expectedSwitch ? pending : null;
    qualityControlState.generation++;
    activeForcedQualityId = ''; activeForcedQualityLabel = '';
    pendingQualityLabel = ''; pendingQualityHeight = 0;
    cachedDiscoveredQualities = [];
  }
  function getNativeQualityMenuOptions(video) {
    const root = video?.closest?.(QUALITY_PLAYER_ROOT);
    if (!root || root.closest?.('#pvc-controller-popup')) return [];
    // A shared layout containing several videos cannot establish ownership of a menu.
    const ownedVideos = [...root.querySelectorAll('video')].filter(item => item.closest(QUALITY_PLAYER_ROOT) === root);
    if (ownedVideos.length !== 1 || ownedVideos[0] !== video) return [];
    const nodes = root.querySelectorAll('button[data-plyr="quality"][value], .vjs-resolution-button .vjs-menu-item, .vjs-quality-selector .vjs-menu-item, .jw-settings-submenu-quality button[data-value]');
    const options = [], heights = new Set();
    for (const node of nodes) {
      if (node.closest(QUALITY_PLAYER_ROOT) !== root || node.disabled || node.getAttribute('aria-disabled') === 'true') continue;
      // Only a strict numeric resolution is exported to our UI. No arbitrary page text.
      const label = (node.textContent || '').trim();
      const match = label.match(/^(\d{2,4})\s*p?(?:\s*(?:HD|FHD|QHD|UHD|4K|\(HD\)|\(FHD\)))?$/i);
      const height = match && diagnosticNumber(Number(match[1]), 100, 4320);
      if (!height || heights.has(height)) continue;
      heights.add(height);
      const option = { id: `menu_${height}`, label: `${height}p`, height, qualityApi: 'native-menu' };
      nativeQualityHandles.set(option, { node, root, video, source: video.currentSrc || video.src || '' });
      options.push(option);
    }
    return options.sort((a, b) => b.height - a.height);
  }
  function applyNativeQualityMenu(item, video) {
    const handle = nativeQualityHandles.get(item);
    if (!handle || handle.video !== video || handle.node.isConnected === false || handle.video.isConnected === false
        || handle.root !== video.closest?.(QUALITY_PLAYER_ROOT) || !handle.root.contains(handle.node)
        || handle.source !== (video.currentSrc || video.src || '') || handle.node.disabled || handle.node.getAttribute('aria-disabled') === 'true') return false;
    handle.node.click();
    return true; // Invocation only. Decoded dimensions are checked separately.
  }
  function readQualityDiagnostics(video, player) {
    const current = qualityContextMatches(video, player);
    const request = current ? qualityControlState.request : null;
    return { current, adapter: current ? qualityControlState.context.adapter : null,
      verification: request && ['pending', 'rendition-confirmed'].includes(request.status) && performance.now() - request.started >= 12000
        ? 'timed-out' : request?.status || 'not-verified',
      requestedHeight: request?.height || null,
      decodedMatch: request?.decodedMatch ?? null, renditionMatch: request?.renditionMatch ?? null,
      cachedCount: current ? cachedDiscoveredQualities.length : 0,
      menuCount: current ? cachedDiscoveredQualities.filter(item => item.qualityApi === 'native-menu').length : 0 };
  }
  // END QUALITY CONTEXT

  // AD LIFECYCLE: one selected media owner, no URL/text/duration heuristics.
  function createAdLifecycle(ports) {
    let active = null;
    const safely = fn => { try { return fn(); } catch (_) {} };
    function stop(restorePlayer = true) {
      if (!active) return;
      const saved = active; active = null;
      // Native state belongs to the captured element, never a replacement video.
      safely(() => { saved.video.playbackRate = 1; saved.video.defaultPlaybackRate = 1; });
      safely(() => { saved.video.volume = saved.volume; saved.video.muted = saved.muted; });
      if (restorePlayer) {
        safely(() => saved.setRate?.(1)); safely(() => saved.setMuted?.(saved.muted));
        safely(() => saved.restoreQuality?.());
        ports.resetRequestedRate();
      }
      ports.log('AD_CONTROL_ENDED');
    }
    function tick(selection, marked) {
      const video = selection?.video;
      if (active && (active.video !== video || active.player !== selection.player || !video?.isConnected || video.ended)) stop(false);
      if (!video || !video.isConnected || video.ended) return;
      if (!marked) { stop(); return; }
      if (!active) {
        const controls = safely(() => ports.capture(selection)) || {};
        active = { ...controls, video, player: selection.player, volume: video.volume, muted: video.muted };
        safely(() => controls.lowerQuality?.());
        ports.log('AD_CONTROL_STARTED');
      }
      // SDK and native setters are independent: an unsupported 16x must not prevent mute.
      if (video.playbackRate !== 16) { safely(() => active.setRate?.(16)); safely(() => { video.playbackRate = 16; }); }
      if (!video.muted) { safely(() => active.setMuted?.(true)); safely(() => { video.muted = true; }); }
    }
    return Object.freeze({ tick, stop, isActive: video => active?.video === video });
  }
  function hasSelectedAdMarker(video) {
    const root = video?.closest?.('#channel-player, [data-testid="video-player"], .video-js, .jwplayer, .html5-video-player, .plyr');
    if (!root || root.querySelectorAll('video').length !== 1 || !root.contains(video)) return false;
    const visible = node => {
      const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
      return node.isConnected !== false && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };
    if (!visible(root)) return false;
    if (root.matches('.video-js.vjs-ad-playing, .jwplayer.jw-flag-ads, .html5-video-player.ad-showing')) return true;
    // A data-testid marker is used only on the supported Kick host and inside this player.
    return /(^|\.)kick\.com$/.test(HOSTNAME) && [...root.querySelectorAll('[data-testid="ad-badge"]')].some(visible);
  }
  function captureAdControls({ video, player }) {
    if (trtRateGuards.get(video)?.active) armTrtRateGuard(video, 1, player);
    const source = video.currentSrc || video.src || '', sourceObject = video.srcObject;
    const current = () => video.isConnected !== false && video === findVideoAndPlayer().video
      && player === findVideoAndPlayer().player && source === (video.currentSrc || video.src || '') && sourceObject === video.srcObject;
    const result = {};
    const ivs = KickAdapter.findIvsPlayer(video);
    if (ivs && isIvsBoundToVideo(ivs, video)) {
      result.setRate = rate => { if (isIvsBoundToVideo(ivs, video)) ivs.setPlaybackRate?.(rate); };
      result.setMuted = muted => { if (isIvsBoundToVideo(ivs, video)) ivs.setMuted?.(muted); };
      if (typeof ivs.getQuality === 'function' && typeof ivs.isAutoQualityMode === 'function' && typeof ivs.setQuality === 'function' && typeof ivs.setAutoQualityMode === 'function') {
        const levels = ivs.getQualities(), previous = ivs.getQuality(), automatic = ivs.isAutoQualityMode();
        const lowest = [...levels].filter(item => item.height > 0).sort((a, b) => a.height - b.height || (a.bitrate || 0) - (b.bitrate || 0))[0];
        const previousKey = ivsQualityKey(previous);
        if (lowest && (automatic || (previousKey && levels.some(level => ivsQualityKey(level) === previousKey)))) {
          result.lowerQuality = () => ivs.setQuality(lowest);
          result.restoreQuality = () => { if (current() && isIvsBoundToVideo(ivs, video)) {
            if (automatic) ivs.setAutoQualityMode(true);
            else { const live = ivs.getQualities().find(level => ivsQualityKey(level) === previousKey); if (live) ivs.setQuality(live); }
          } };
        }
      }
      return result;
    }
    const hls = findLibraryPlayer(video, 'hls', player);
    if (hls) {
      const levels = [...(hls.levels || [])], previous = hls.manualLevel;
      const lowest = levels.map((level, index) => ({ level, index })).filter(item => item.level.height > 0)
        .sort((a, b) => a.level.height - b.level.height || (a.level.bitrate || 0) - (b.level.bitrate || 0))[0];
      if (lowest && Number.isInteger(previous) && previous >= -1 && previous < levels.length) {
        result.lowerQuality = () => { hls.currentLevel = lowest.index; };
        result.restoreQuality = () => { if (current() && levels.length === hls.levels.length && levels.every((level, i) => level === hls.levels[i])) hls.currentLevel = previous; };
      }
      return result;
    }
    const vjs = findVideoJsPlayer(video, player);
    if (vjs) {
      result.setRate = rate => vjs.playbackRate?.(rate);
      result.setMuted = muted => vjs.muted?.(muted);
      let representations = false;
      const readLevels = () => {
        const levels = vjs.qualityLevels ? Array.from(vjs.qualityLevels()) : [];
        if (levels.length) return levels;
        representations = true;
        return (vjs.tech_?.vhs || vjs.tech?.({ IWillNotUseThisInPlugins: true })?.vhs)?.representations?.() || [];
      };
      const levels = readLevels(), previous = levels.map(level => typeof level.enabled === 'function' ? level.enabled() : level.enabled);
      const lowest = levels.map((level, index) => ({ level, index })).filter(item => item.level.height > 0)
        .sort((a, b) => a.level.height - b.level.height || (a.level.bitrate || a.level.bandwidth || 0) - (b.level.bitrate || b.level.bandwidth || 0))[0];
      const enable = (level, value) => { if (typeof level.enabled === 'function') level.enabled(value); else level.enabled = value; };
      if (lowest && previous.every(value => typeof value === 'boolean') && previous.some(Boolean)) {
        result.lowerQuality = () => applyVideoJsEnabledSelection(levels, lowest.index);
        result.restoreQuality = () => {
          const live = readLevels();
          const same = live.length === levels.length && live.every((level, index) => representations
            ? level.id !== undefined && level.id === levels[index].id && level.height === levels[index].height
            : level === levels[index]);
          if (current() && same) {
            live.forEach((level, index) => { if (previous[index]) enable(level, true); });
            live.forEach((level, index) => { if (!previous[index]) enable(level, false); });
          }
        };
        return result;
      }
    }
    // A checked native numeric menu item is an exact, restorable selection.
    const menu = getNativeQualityMenuOptions(video), checked = menu.find(item => {
      const node = nativeQualityHandles.get(item)?.node;
      return node?.getAttribute('aria-checked') === 'true' || node?.getAttribute('aria-selected') === 'true';
    });
    const lowest = [...menu].filter(item => item.height > 0).sort((a, b) => a.height - b.height || (a.bitrate || 0) - (b.bitrate || 0))[0];
    if (checked && lowest) {
      result.lowerQuality = () => applyNativeQualityMenu(lowest, video);
      result.restoreQuality = () => { if (current()) applyNativeQualityMenu(checked, video); };
    }
    return result;
  }
  const adLifecycle = createAdLifecycle({ capture: captureAdControls,
    resetRequestedRate: () => { targetEnforcedPlaybackRate = 1; },
    log: event => addDiagnosticLog('INFO', event) });
  let adWatchTimer = null;
  function stopAdWatch() { clearTimeout(adWatchTimer); adWatchTimer = null; adLifecycle.stop(); }
  function startAdWatch() {
    if (adWatchTimer !== null || remotePresentation) return;
    const tick = () => {
      const selection = findVideoAndPlayer();
      if (!selection.video || selection.video.isConnected === false) { stopAdWatch(); return; }
      adLifecycle.tick(selection, hasSelectedAdMarker(selection.video));
      adWatchTimer = setTimeout(tick, 750);
    };
    adWatchTimer = setTimeout(tick, 750);
  }
  window.addEventListener('pagehide', stopAdWatch);
  // END AD LIFECYCLE

  function startQualityWatch() {
    clearTimeout(qualityWatchTimer);
    if (remotePresentation) { qualityWatchTimer = null; return; }
    const tick = () => {
      if (remoteSourceSession) {
        if (document.hidden || (!remoteSourceActive && !remoteFullscreen())) {
          const context = qualityControlState.context;
          if (context?.video?.isConnected !== false && context?.video && qualityControlState.request) updateQualityVerification(context.video, context.player);
          qualityWatchTimer = setTimeout(tick, 750); return;
        }
        const { video } = findVideoAndPlayer(); if (video) monitorVideoResolution(video);
        publishRemoteSourceState(); qualityWatchTimer = setTimeout(tick, 750); return;
      }
      const popup = document.getElementById('pvc-controller-popup');
      if (!popup || popup.style.display === 'none') { qualityWatchTimer = null; return; }
      if (!document.hidden) {
        if (popup.classList.contains('pvc-idle-hidden')) {
          const context = qualityControlState.context;
          if (context?.video && context.video.isConnected !== false && qualityControlState.request) updateQualityVerification(context.video, context.player);
        } else {
          const selection = findVideoAndPlayer();
          if (selection.video) monitorVideoResolution(selection.video);
          renderDynamicQualityButtons();
          updateRealtimeResolutionBadge();
          updateVideoTargetControls();
        }
      }
      qualityWatchTimer = setTimeout(tick, 750);
    };
    qualityWatchTimer = setTimeout(tick, 750);
  }

  function updateVideoTargetControls() {
    if (remotePresentation) { renderRemoteTargets(); return; }
    const select = document.getElementById('pvc-video-target');
    if (!select || document.activeElement === select) return;
    const candidates = getMediaCandidates();
    const sameVideos = select.__nokVideos?.length === candidates.length
      && select.__nokVideos.every((video, i) => video === candidates[i].video);
    const labelSignature = candidates.map(item => item.video.videoHeight || 0).join(',');
    if (!sameVideos || select.__nokVideoLabels !== labelSignature) {
      select.innerHTML = '';
      const automatic = document.createElement('option'); automatic.value = 'auto'; setUiText(automatic, 'Otomatik seçim'); select.appendChild(automatic);
      candidates.forEach(({ video }, i) => {
        const option = document.createElement('option'); option.value = String(i);
        const resolution = video.videoHeight > 0 ? `${video.videoHeight}p` : '—';
        setUiText(option, `Video ${i + 1} · ${resolution}`); select.appendChild(option);
      });
      select.__nokVideos = candidates.map(item => item.video);
      select.__nokVideoLabels = labelSignature;
    }
    const index = candidates.findIndex(item => item.video === controlledVideo);
    select.value = index >= 0 ? String(index) : 'auto';
  }

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
    if (!video) {
      currentActiveAdapterName = GenericAdapter.name;
      adapterHealthStatus = 'failed';
      updateAdapterHudBadge(GenericAdapter);
      return GenericAdapter;
    }
    if (userForcedAdapterName) {
      const forced = ALL_ADAPTERS.find(a => a.name === userForcedAdapterName);
      if (forced && forced.matches(video, player) && probeAdapterHealth(forced, video, player)) {
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
    const adapter = resolveCascadeAdapter(video, player);
    resetQualityContext(video, player, adapter);
    return adapter;
  }

  function updateAdapterHudBadge(adapter) {
    const badge = document.getElementById('pvc-active-adapter-badge');
    if (badge && adapter) {
      const tierTag = adapter.tier ? `Tier ${adapter.tier}` : 'Tier 3';
      setUiText(badge, `${adapter.name} (${tierTag})`);
      setUiAttribute(badge, 'title', adapter.displayName || adapter.name);
    }
    updateCollapsedSummaryBar();
  }

  function discoverStreamQualities(selection = findVideoAndPlayer()) {
    const { video, player } = selection;
    observeQualityVideo(video);
    const adapter = getActiveAdapter(video, player);

    cachedDiscoveredQualities = [];
    if (video && typeof adapter.getQualities === 'function') {
      try {
        const found = adapter.getQualities(video, player);
        if (found && found.length > 0) {
          cachedDiscoveredQualities = found;
        }
      } catch (e) {}
    }

    if (video && adapter !== GenericAdapter) {
      const menu = getNativeQualityMenuOptions(video);
      const menuHeights = new Set(menu.map(item => item.height));
      // Keep separately declared source menu choices even if this HLS manifest exposes one level.
      cachedDiscoveredQualities = [...menu, ...cachedDiscoveredQualities.filter(item => !menuHeights.has(item.height)
        && !(menu.length > 0 && item.resolutionSource === 'observed-video'))];
    }
    for (const option of cachedDiscoveredQualities) qualityChoiceBindings.set(option, {
      video, player, source: getQualitySourceKey(video, player), epoch: qualityMediaEpochs.get(video) || 0, generation: qualityControlState.generation
    });
    return cachedDiscoveredQualities;
  }

  // =========================================================================
  // 📊 KÜÇÜLTÜLMÜŞ (MINI-PILL) DETAYLI BİLGİ BARI GÜNCELLEYİCİSİ (MADDE 6)
  // =========================================================================
  function updateCollapsedSummaryBar() {
    if (remotePresentation) { renderRemoteHud(); return; }
    const miniRes = document.getElementById('pvc-mini-res-val');
    const miniSpeed = document.getElementById('pvc-mini-speed-val');
    const miniVol = document.getElementById('pvc-mini-vol-val');
    const miniAdapter = document.getElementById('pvc-mini-adapter-val');

    const { video } = findVideoAndPlayer();
    const shortRes = (video && video.videoHeight > 0) ? `${video.videoHeight}p` : '---';
    if (miniRes) setUiText(miniRes, `🎬 ${shortRes}`);
    if (miniSpeed) setUiText(miniSpeed, `⚡ ${targetEnforcedPlaybackRate}x`);
    if (miniVol) setUiText(miniVol, `🔊 ${currentAudioVolumePercent}% (${currentAudioMode === 'mono' ? 'M' : 'S'})`);
    if (miniAdapter) {
      const drmPrefix = activeDrmState.isDrm ? '🛡️ ' : '';
      setUiText(miniAdapter, `${drmPrefix}${currentActiveAdapterName.replace('Adapter', '')}`);
    }
  }

  function updateRealtimeResolutionBadge() {
    if (remotePresentation) { renderRemoteHud(); return; }
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

      setUiText(badge, `🎬 Gerçek: ${lastObservedResolution}`);
      badge.style.color = 'var(--pvc-accent-ink, #92bfd5)';
    } else {
      setUiText(badge, '🎬 Çözünürlük: Bekleniyor...');
      badge.style.color = 'var(--pvc-muted, #a2b6c0)';
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
    updateQualityVerification(video, player);
    updateCollapsedSummaryBar();
  }

  function monitorVideoResolution(video) {
    startAdWatch();
    if (!video || video.__nokMonitored) return;
    video.__nokMonitored = true;

    const handleResize = () => {
      if (findVideoAndPlayer().video !== video) return;
      if (currentAudioVolumePercent > 100 || currentAudioMode === 'mono') initAudioGraphForVideo(video);
      updateRealtimeResolutionBadge();
      renderDynamicQualityButtons();
    };

    video.addEventListener('resize', handleResize);
    video.addEventListener('loadedmetadata', handleResize);
    video.addEventListener('playing', handleResize);
    video.addEventListener('timeupdate', () => {
      const selected = findVideoAndPlayer();
      if (selected.video !== video) return;
      updateQualityVerification(video, selected.player);
      if (pendingQualityLabel || lastObservedResolution.includes('Bekleniyor')) {
        updateRealtimeResolutionBadge();
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

    video.addEventListener('ended', () => { if (adLifecycle.isActive(video)) adLifecycle.stop(); });
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
    if (remotePresentation) return (await remoteControl('pip')).ok;
    const { video } = findVideoAndPlayer();
    if (!video) {
      showToast('PiP için aktif video bulunamadı');
      return false;
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
        return false;
      }
      return true;
    } catch (err) {
      addDiagnosticLog('WARN', 'PIP_FAILED');
      showToast('PiP açılamadı (Video henüz hazır olmayabilir)');
      return false;
    }
  }

  // =========================================================================
  // 🎨 GÖRÜNTÜ FİLTRELERİ VE GECE KALKANI MOTORU (MADDE 3)
  // =========================================================================
  const appliedVideoFilters = new WeakMap();
  let lastFilteredVideo = null;
  let filterUpdateFrame = null;
  function restoreVideoFilter(video) {
    const saved = video && appliedVideoFilters.get(video);
    if (!saved) return;
    if (video.style.getPropertyValue('filter') === saved.applied) {
      if (saved.value) video.style.setProperty('filter', saved.value, saved.priority);
      else video.style.removeProperty('filter');
    }
    appliedVideoFilters.delete(video);
  }
  function scheduleVideoFilterUpdate() {
    if (remotePresentation) rememberRemoteFilterIntent(videoFilterState);
    if (filterUpdateFrame !== null) return;
    filterUpdateFrame = requestAnimationFrame(() => {
      filterUpdateFrame = null;
      if (remotePresentation) queueRemoteFilters(videoFilterState);
      else applyVideoFiltersToElement();
      updateFilterUiBadges();
    });
  }
  function applyVideoFiltersToElement(video) {
    const targetVideo = video || findVideoAndPlayer().video;
    if (!targetVideo) return;
    if (lastFilteredVideo && lastFilteredVideo !== targetVideo) restoreVideoFilter(lastFilteredVideo);
    lastFilteredVideo = targetVideo;

    const parts = [];
    if (videoFilterState.brightness !== 100) parts.push(`brightness(${videoFilterState.brightness}%)`);
    if (videoFilterState.contrast !== 100) parts.push(`contrast(${videoFilterState.contrast}%)`);
    if (videoFilterState.saturate !== 100) parts.push(`saturate(${videoFilterState.saturate}%)`);
    // Filter ordering/clamping is significant; do not merge brightness across sepia.
    if (videoFilterState.nightShield) parts.push('sepia(38%) brightness(88%) contrast(95%)');
    if (videoFilterState.invert) parts.push('invert(100%) hue-rotate(180deg)');

    if (parts.length === 0) { restoreVideoFilter(targetVideo); return; }
    let saved = appliedVideoFilters.get(targetVideo);
    if (!saved) {
      saved = { value: targetVideo.style.getPropertyValue('filter'), priority: targetVideo.style.getPropertyPriority('filter'), applied: null };
      appliedVideoFilters.set(targetVideo, saved);
    }
    const filterCss = parts.join(' ');
    if (saved.applied === filterCss && targetVideo.style.getPropertyValue('filter') === filterCss) return;
    targetVideo.style.setProperty('filter', filterCss, 'important');
    saved.applied = filterCss;
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
    if (bVal) setUiText(bVal, `%${videoFilterState.brightness}`);
    if (cVal) setUiText(cVal, `%${videoFilterState.contrast}`);
    if (sVal) setUiText(sVal, `%${videoFilterState.saturate}`);
    if (nightBtn) nightBtn.classList.toggle('pvc-active', videoFilterState.nightShield);
    if (invertBtn) invertBtn.classList.toggle('pvc-active', videoFilterState.invert);

    if (hdrBadge) {
      const isCustom = videoFilterState.brightness !== 100 || videoFilterState.contrast !== 100 || videoFilterState.saturate !== 100 || videoFilterState.nightShield || videoFilterState.invert;
      setUiText(hdrBadge, videoFilterState.nightShield ? '🌙 Gece' : (isCustom ? 'Özel' : 'Standart'));
    }
  }

  function resetVideoFilters() {
    videoFilterState = { brightness: 100, contrast: 100, saturate: 100, nightShield: false, invert: false };
    scheduleVideoFilterUpdate();
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

  const subtitleAppearance = { fontSize: 20, bottom: 8, background: 82, color: 'white' };
  function setSubtitleAppearance(key, value) {
    if (key === 'color') {
      if (!['white', 'yellow'].includes(value)) return false;
    } else {
      const ranges = { fontSize: [12, 48], bottom: [0, 40], background: [0, 100] };
      if (!Object.hasOwn(ranges, key) || !Number.isFinite(value)) return false;
      value = Math.round(Math.max(ranges[key][0], Math.min(ranges[key][1], value)));
    }
    subtitleAppearance[key] = value;
    if (remotePresentation) { updateSubtitleAppearanceControls(); remoteControl('appearance', { ...subtitleAppearance }); return true; }
    const input = document.getElementById(`pvc-sub-${key}`);
    if (input) input.value = String(value);
    const output = document.getElementById(`pvc-sub-${key}-value`);
    if (output) setUiText(output, key === 'fontSize' ? `${value}px` : `${value}%`);
    const { video } = findVideoAndPlayer();
    if (video) {
      if (key === 'bottom' && video.__nokSubtitleTrack?.cues) {
        for (const cue of video.__nokSubtitleTrack.cues) { cue.snapToLines = false; cue.line = 100 - value; }
      }
      renderCustomSubtitleCue(video);
    }
    return true;
  }
  function updateSubtitleAppearanceControls() {
    for (const [key, value] of Object.entries(subtitleAppearance)) {
      const input = document.getElementById(`pvc-sub-${key}`); if (input && document.activeElement !== input) input.value = String(value);
      const output = document.getElementById(`pvc-sub-${key}-value`);
      if (output) setUiText(output, key === 'fontSize' ? `${value}px` : `${value}%`);
    }
  }
  // END SUBTITLE APPEARANCE

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
    targetOverlay.style.setProperty('font-size', `${subtitleAppearance.fontSize}px`, 'important');
    targetOverlay.style.setProperty('background', `rgba(9, 13, 22, ${subtitleAppearance.background / 100})`, 'important');
    targetOverlay.style.setProperty('color', subtitleAppearance.color === 'yellow' ? '#fff176' : '#ffffff', 'important');
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
      targetOverlay.style.setProperty('top', `${visibleBottom - (visibleBottom - visibleTop) * subtitleAppearance.bottom / 100}px`, 'important');
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
        const cue = new window.VTTCue(s, e, c.text);
        cue.snapToLines = false;
        cue.line = 100 - subtitleAppearance.bottom;
        track.addCue(cue);
      });
    } catch (e) {}
  }

  function shiftSubtitleSync(deltaMs) {
    if (remotePresentation) { remoteControl('subtitle-offset', deltaMs); return; }
    if (customSubtitleCues.length === 0) {
      showToast('Önce bir .srt veya .vtt altyazı dosyası yükleyin');
      return;
    }
    subtitleOffsetMs = Math.max(-3600000, Math.min(3600000, subtitleOffsetMs + deltaMs));
    const badge = document.getElementById('pvc-sub-offset-badge');
    if (badge) {
      setUiText(badge, `${subtitleOffsetMs >= 0 ? '+' : ''}${subtitleOffsetMs}ms`);
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

  function armTrtRateGuard(video, rate, player) {
    let state = trtRateGuards.get(video);
    if (!state) {
      state = { rate, player, attempts: 0, timer: null, active: false, mode: 'event', lastLog: -Infinity };
      trtRateGuards.set(video, state);
      state.release = () => {
        state.active = false;
        clearTimeout(state.timer);
        state.timer = null;
        const own = Object.getOwnPropertyDescriptor(video, 'playbackRate');
        if (state.get && own?.get === state.get && own?.set === state.set) delete video.playbackRate;
        state.get = null; state.set = null; state.mode = 'off';
      };
      const correctRate = () => {
        if (!state.active || state.timer !== null || video.isConnected === false || video.ended
            || video.readyState < 2 || Math.abs(video.playbackRate - state.rate) < 0.01
            || video.playbackRate !== 1) return;
        state.timer = setTimeout(() => {
          state.timer = null;
          if (!state.active || video.isConnected === false || video.ended || video.readyState < 2
              || video.playbackRate !== 1 || Math.abs(state.rate - 1) < 0.01) return;
          state.attempts++;
          try {
            const shaka = findLibraryPlayer(video, 'shaka', state.player);
            if (typeof shaka?.trickPlay === 'function') shaka.trickPlay(state.rate, false);
            video.playbackRate = state.rate;
            if (performance.now() - state.lastLog >= 5000) {
              state.lastLog = performance.now();
              addDiagnosticLog('INFO', 'TRT_RATE_REAPPLIED', { rate: state.rate });
            }
          } catch (_) { state.release(); addDiagnosticLog('WARN', 'SPEED_FAILED'); }
        }, state.attempts < 5 ? 200 : 1000);
      };
      video.addEventListener('ratechange', correctRate);
      video.addEventListener('playing', correctRate);
      video.addEventListener('emptied', state.release);
      video.addEventListener('ended', state.release);
    }
    clearTimeout(state.timer);
    Object.assign(state, { rate, player, attempts: 0, timer: null, active: rate !== 1 });
    if (rate === 1) { state.release(); return; }
    if (state.get) return;
    // Yalnızca bu elementteki otomatik 1x yazımını yönlendir. Başka bir own accessor ezilmez.
    if (!Object.getOwnPropertyDescriptor(video, 'playbackRate')) {
      let prototype = Object.getPrototypeOf(video), descriptor;
      while (prototype && !descriptor) {
        descriptor = Object.getOwnPropertyDescriptor(prototype, 'playbackRate');
        prototype = Object.getPrototypeOf(prototype);
      }
      if (descriptor?.get && descriptor?.set) {
        state.get = () => descriptor.get.call(video);
        state.set = value => {
          const redirect = state.active && Number(value) === 1 && state.rate !== 1
            && video.isConnected !== false && !video.ended && video.readyState >= 2;
          descriptor.set.call(video, redirect ? state.rate : value);
          if (redirect && performance.now() - state.lastLog >= 5000) {
            state.lastLog = performance.now();
            addDiagnosticLog('INFO', 'TRT_RATE_INTERCEPTED', { rate: state.rate });
          }
        };
        try {
          Object.defineProperty(video, 'playbackRate', { configurable: true, enumerable: descriptor.enumerable,
            get: state.get, set: state.set });
          state.mode = 'element';
        } catch (_) { state.get = null; state.set = null; state.mode = 'event'; }
      }
    }
    if (state.mode === 'off') state.mode = 'event';
  }

  function setSpeed(rate) {
    if (remotePresentation) { remoteControl('speed', Math.max(0.25, Math.min(3, rate))); return true; }
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
        armTrtRateGuard(video, validRate, player);
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
      if (hdrBadge) {
        setUiText(hdrBadge, `${validRate}x`);
        setUiAttribute(hdrBadge, 'title', trtRateGuards.get(video)?.active
          ? 'TRT hız kilidi açık. Panelden 1x seçerek veya hız çubuğuna çift tıklayarak kapatın.' : 'Oynatma hızı');
      }

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
    // Native stereo volume needs no irreversible MediaElementAudioSource connection.
    // Firefox can ignore rate changes for an audio-less video routed through Web Audio
    // (Mozilla bug 1942609). Use capability evidence, never a browser/version cutoff.
    if (video.readyState < 1 || (video.readyState >= 1 && video.mozHasAudio === false)) return null;
    if (currentAudioVolumePercent <= 100 && currentAudioMode === 'stereo' && !audioSourceElementMap.has(video)) return null;
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
      const requestedGain = currentAudioVolumePercent > 100 ? currentAudioVolumePercent / 100 : 1;
      if (audioGainNodeInstance.gain.value !== requestedGain) audioGainNodeInstance.gain.setValueAtTime(requestedGain, audioContextInstance.currentTime);
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

    let activeColor = 'var(--pvc-accent-ink, #92bfd5)';
    if (percent > 200) {
      slider.classList.add('pvc-gain-hot');
      activeColor = 'var(--pvc-danger, #f43f5e)';
    } else if (percent > 100) {
      slider.classList.add('pvc-gain-warm');
      activeColor = 'var(--pvc-warning, #f59e0b)';
    } else {
      slider.classList.add('pvc-gain-normal');
      activeColor = 'var(--pvc-accent-ink, #92bfd5)';
    }

    slider.style.setProperty(
      'background',
      `linear-gradient(90deg, ${activeColor} 0%, ${activeColor} ${ratio}%, var(--pvc-elevated, #1b2a33) ${ratio}%, var(--pvc-elevated, #1b2a33) 100%)`,
      'important'
    );
  }

  let isInternalVolumeUpdating = false;

  function setAudioVolume(percent) {
    if (remotePresentation) { remoteControl('volume', Math.max(0, Math.min(300, percent))); return; }
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
        setUiText(hdrBadge, `${validPercent}%`);
        hdrBadge.style.color = validPercent > 200 ? 'var(--pvc-danger, #f43f5e)' : (validPercent > 100 ? 'var(--pvc-warning, #fbbf24)' : 'var(--pvc-accent-ink, #92bfd5)');
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
    if (remotePresentation) { remoteControl('audio', mode); return; }
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
    if (hdrBadge) setUiText(hdrBadge, mode.toUpperCase());

    updateCollapsedSummaryBar();
    showToast(`Ses Modu: ${mode === 'mono' ? '🎛️ Mono (Birleşik Kanal)' : '🎧 Stereo (Çift Kanal)'}`);
  }

  function seekBy(seconds) {
    if (remotePresentation) { remoteControl('seek', seconds); return true; }
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
    const binding = qualityChoiceBindings.get(chosen);
    if (!binding || binding.video !== video || binding.player !== player || binding.generation !== qualityControlState.generation
        || binding.source !== getQualitySourceKey(video, player) || binding.epoch !== (qualityMediaEpochs.get(video) || 0)) {
      showToast('Kalite listesi değişti; yeniden seçin.');
      return false;
    }
    const adapter = getActiveAdapter(video, player);
    const liveChoice = discoverStreamQualities({ video, player }).find(item => item.id === chosen.id);
    if (!liveChoice || (chosen.raw && liveChoice.raw !== chosen.raw && chosen.qualityApi !== 'ivs')) {
      showToast('Kalite listesi değişti; yeniden seçin.');
      return false;
    }
    chosen = liveChoice;
    clearTimeout(pendingTimeoutTimer); pendingQualityLabel = ''; pendingQualityHeight = 0;
    addDiagnosticLog('INFO', 'QUALITY_REQUESTED', { height: chosen.height });
    qualityControlState.request = { video, id: chosen.id, height: chosen.height || 0, choice: chosen,
      qualityApi: chosen.qualityApi || '', status: 'pending', started: performance.now(), decodedMatch: false, renditionMatch: null };
    let accepted = false;
    try { accepted = (chosen.qualityApi === 'native-menu' ? applyNativeQualityMenu(chosen, video)
      : adapter.applyQuality(chosen, video, player)) === true; } catch (_) {}
    if (!accepted) {
      qualityControlState.request.status = 'rejected';
      activeForcedQualityId = ''; activeForcedQualityLabel = '';
      addDiagnosticLog('WARN', 'QUALITY_REJECTED');
      showToast('Bu oynatıcıda kalite seçimi uygulanamadı.');
      updateQualityStatusText(video);
      return false;
    }
    activeForcedQualityId = chosen.id;
    activeForcedQualityLabel = chosen.label;
    pendingQualityLabel = chosen.label;
    pendingQualityHeight = chosen.height || 0;
    clearTimeout(pendingTimeoutTimer);
    const request = qualityControlState.request;
    pendingTimeoutTimer = setTimeout(() => {
      if (qualityControlState.request !== request) return;
      updateQualityVerification(video, findVideoAndPlayer().player, true);
    }, 12000);
    updateQualityVerification(video, player);
    return true;
  }

  function updateQualityVerification(video, player, expired = false) {
    if (!qualityContextMatches(video, player)) return;
    const request = qualityControlState.request;
    if (!request || request.status === 'rejected') { updateQualityStatusText(video); return; }
    const chosen = request.choice;
    let rendition = null;
    try {
      if (chosen.qualityApi === 'native-menu') {
        const node = nativeQualityHandles.get(chosen)?.node;
        rendition = node ? node.getAttribute('aria-checked') === 'true' || node.getAttribute('aria-selected') === 'true' : null;
      } else if (chosen.id.startsWith('hls_')) {
        const hls = findLibraryPlayer(video, 'hls', player);
        if (hls) rendition = hls.currentLevel === chosen.index && (!chosen.raw || hls.levels[chosen.index] === chosen.raw);
      } else if (chosen.qualityApi === 'ivs') {
        const ivs = KickAdapter.findIvsPlayer(video);
        if (ivs?.getQuality) rendition = ivsQualityKey(ivs.getQuality()) === ivsQualityKey(chosen.raw);
      } else if (chosen.id.startsWith('shaka_')) {
        const shaka = findLibraryPlayer(video, 'shaka', player);
        if (shaka) rendition = shaka.getVariantTracks().some(track => track.id === chosen.trackId && track.active
          && (!(chosen.height > 0) || track.height === chosen.height));
      } else if (chosen.id.startsWith('vjs_')) {
        const vjs = findVideoJsPlayer(video, player);
        if (chosen.qualityApi === 'vjs-resolution-switcher') {
          rendition = vjs?.currentResolution?.()?.label === chosen.sourceLabel;
        } else if (chosen.qualityApi !== 'vhs-representations') {
          const levels = vjs?.qualityLevels?.();
          if (Number.isInteger(levels?.selectedIndex) && levels.selectedIndex >= 0) rendition = levels.selectedIndex === chosen.index
            && (!chosen.raw || levels[chosen.index] === chosen.raw);
        } else {
          const vhs = vjs?.tech_?.vhs || vjs?.tech?.({ IWillNotUseThisInPlugins: true })?.vhs;
          const selected = vhs?.playlists?.media?.();
          if (selected?.id != null && chosen.representationId != null) rendition = selected.id === chosen.representationId;
        }
      }
    } catch (_) {}
    request.renditionMatch = rendition;
    if (rendition === true && chosen.id.startsWith('vjs_') && !request.bufferRefreshAttempted
        && video.videoHeight !== request.height && performance.now() - request.started >= 250) {
      request.bufferRefreshAttempted = refreshVideoJsBufferedQuality(video, findVideoJsPlayer(video, player), chosen);
    }
    request.decodedMatch = request.height > 0 && video.readyState >= 2 && video.videoHeight === request.height;
    request.status = request.decodedMatch ? rendition === true ? 'confirmed' : 'decoded-match'
      : expired || performance.now() - request.started >= 12000 ? 'timed-out'
      : rendition === true ? 'rendition-confirmed' : 'pending';
    if (request.status === 'confirmed' || request.status === 'decoded-match' || request.status === 'timed-out') {
      pendingQualityLabel = ''; pendingQualityHeight = 0; clearTimeout(pendingTimeoutTimer);
    }
    updateQualityStatusText(video);
  }
  function updateQualityStatusText(video) {
    const status = document.getElementById('pvc-quality-status');
    if (!status) return;
    const request = qualityControlState.request;
    const labels = { pending: 'Bekleniyor', confirmed: 'Doğrulandı', 'decoded-match': 'Görüntü eşleşti',
      'rendition-confirmed': 'Oynatıcı seçti; görüntü bekleniyor', 'timed-out': 'Doğrulanamadı', rejected: 'Reddedildi' };
    if (!request) { setUiText(status, 'Kalite isteği yok.'); return; }
    const observed = video?.videoHeight > 0 ? `${video.videoHeight}p` : '—';
    setUiText(status, `İstenen ${request.height ? request.height + 'p' : '—'} · oynatılan ${observed} · ${labels[request.status]}`);
  }

  function cycleNextQuality() {
    if (remotePresentation) {
      const index = remotePresentation.requestedIndex;
      if (remotePresentation.qualities.length) remoteControl('quality', (index + 1) % remotePresentation.qualities.length);
      return;
    }
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

    const { video } = remotePresentation ? { video: { playbackRate: remotePresentation.rate } } : findVideoAndPlayer();
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
    if (remotePresentation) { renderRemoteQualities(); return; }
    const container = document.getElementById('pvc-dynamic-quality-container');
    if (!container) return;

    const selection = findVideoAndPlayer();
    const qualities = discoverStreamQualities(selection);
    updateQualityVerification(selection.video, selection.player);
    const countBadge = document.getElementById('pvc-quality-count-badge');
    if (countBadge) {
      setUiText(countBadge, `${qualities.length} seviye`);
    }

    const request = qualityControlState.request;
    const signature = JSON.stringify([qualityControlState.generation, uiLanguage,
      qualities.map(item => [item.id, item.label, item.height, item.sourceLabel, item.representationId])]);
    const sameRaw = container.__nokQualities?.every((item, i) => item.raw === qualities[i]?.raw);
    if (container.__nokQualitySignature === signature && sameRaw) { updateQualityButtonStates(container); return; }
    const focusedId = container.contains(document.activeElement) ? document.activeElement.__nokQualityId : null;
    container.__nokQualitySignature = signature; container.__nokQualities = qualities;
    container.innerHTML = '';
    if (qualities.some(q => q.qualityApi === 'native-menu')) {
      const note = document.createElement('span'); note.className = 'pvc-quality-inventory-note';
      setUiText(note, 'Kaynak menüsü ve oynatıcı seviyeleri birlikte listelenir; tüm kaynakların bulunduğu doğrulanmadı.');
      container.appendChild(note);
    }
    if (currentActiveAdapterName === 'HlsJsAdapter' || qualities.some(q => q.id.startsWith('hls_'))) {
      const note = document.createElement('span');
      note.className = 'pvc-quality-inventory-note';
      setUiText(note, qualities.length === 1
        ? 'Oynatıcı 1 seviye bildiriyor; kaynakta başka kalite olup olmadığı doğrulanmadı.'
        : 'Oynatıcının bildirdiği seviyeler. “Oynatılan” etiketi anlık görüntü ölçümüdür.');
      container.appendChild(note);
    }
    if (qualities.length === 0) {
      const message = document.createElement('span');
      setUiText(message, 'Bu oynatıcıda kullanılabilir kalite kontrolü bulunamadı.');
      container.appendChild(message);
    }

    qualities.forEach(q => {
      const btn = document.createElement('button');
      btn.__nokQualityId = q.id;
      const requested = request?.id === q.id;
      const confirmed = requested && ['confirmed', 'decoded-match'].includes(request.status);
      btn.className = `pvc-quality-chip-btn ${confirmed ? 'pvc-active' : requested ? 'pvc-requested' : ''}`;
      btn.setAttribute('aria-pressed', String(confirmed));
      setUiText(btn, String(q.label).replace(/\s*\(.*\)\s*$/, '') || q.label);
      setUiAttribute(btn, 'title', q.resolutionSource === 'observed-video'
        ? 'Çözünürlük akışta belirtilmemiş; değer oynatılan videodan ölçüldü. Başka bir kalite seçeneği anlamına gelmez.'
        : `${q.label}${q.height ? ' • ' + q.height + 'p' : ''}`);

      btn.onclick = (e) => {
        e.stopPropagation();
        const { video, player } = findVideoAndPlayer();
        requestQuality(q, video, player);
        renderDynamicQualityButtons();
        updateRealtimeResolutionBadge();
      };

      container.appendChild(btn);
      if (focusedId === q.id) btn.focus();
    });
  }

  function updateQualityButtonStates(container) {
    const request = qualityControlState.request;
    for (const button of container.querySelectorAll('button')) {
      const requested = request?.id === button.__nokQualityId;
      const confirmed = requested && ['confirmed', 'decoded-match'].includes(request.status);
      button.classList.toggle('pvc-active', confirmed);
      button.classList.toggle('pvc-requested', requested && !confirmed);
      button.setAttribute('aria-pressed', String(confirmed));
    }
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
    if (remotePresentation) {
      if (silent) return null;
      const reply = await remoteControl('ping'); return reply.ok && reply.ms !== undefined ? { ms: reply.ms, method: 'remote' } : null;
    }
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
      if (pingBtn && pingBtn.getAttribute('aria-busy') !== 'true') {
        setUiText(pingBtn, `📡 ${ms} ms`);
        pingBtn.style.color = ms <= 50 ? 'var(--pvc-success, #34d399)' : (ms <= 120 ? 'var(--pvc-accent-ink, #92bfd5)' : 'var(--pvc-warning, #f59e0b)');
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

  const DIAGNOSTIC_PLATFORMS = Object.freeze({
      kick: ['kick.com'], trt: ['trt1.com.tr', 'trtizle.com', 'trt.com.tr'],
      now: ['nowtv.com.tr'], puhu: ['puhutv.com'], youtube: ['youtube.com'],
      twitch: ['twitch.tv'], reddit: ['reddit.com'], x: ['x.com'],
      netflix: ['netflix.com'], disney: ['disneyplus.com'], prime: ['primevideo.com'],
      tabii: ['tabii.com'], gain: ['gain.tv'], exxen: ['exxen.com']
  });
  let diagnosticPagePlatform = 'other';
  function diagnosticPlatform(hostname) {
    for (const [platform, domains] of Object.entries(DIAGNOSTIC_PLATFORMS)) {
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
    const recordedQuality = readQualityDiagnostics(video, player);
    const adapter = recordedQuality.adapter;
    const requestedAdapter = ALL_ADAPTERS.find(item => item.name === userForcedAdapterName);
    const browserFamily = /firefox/i.test(navigator.userAgent) ? 'firefox'
      : /chrom(e|ium)|edg\//i.test(navigator.userAgent) ? 'chromium'
      : /safari/i.test(navigator.userAgent) ? 'safari' : 'other';
    const playerPlatform = diagnosticPlatform(HOSTNAME);
    const pagePlatform = diagnosticChoice(diagnosticPagePlatform, Object.keys(DIAGNOSTIC_PLATFORMS), 'other');
    // Uygulanmamış adaptörler kalite kontrolü sunmaz; istekler başarı kanıtı değildir.
    const qualityControl = !video || !adapter || adapter.name === 'DashJsAdapter' || (adapter.name === 'GenericAdapter' && recordedQuality.menuCount === 0)
      ? 'not-implemented' : 'requires-runtime-verification';
    return {
      reportSchemaVersion: 2,
      extensionVersion: EXTENSION_VERSION,
      errorCode: diagnosticChoice(errorCode, ['NO_VIDEO_FOUND', 'USER_MANUAL_DIAGNOSTIC'], 'USER_MANUAL_DIAGNOSTIC'),
      platform: playerPlatform !== 'other' ? playerPlatform : pagePlatform,
      platformScope: playerPlatform !== 'other' ? 'player' : pagePlatform !== 'other' ? 'page' : 'unlisted',
      browserFamily,
      playerType: diagnosticChoice(playerType, ['none', 'shadow-html5', 'native-html5', 'youtube-player',
        'amazon-ivs', 'videojs-attached', 'vjsPlayer', 'videojs-parent', 'videojs-global', 'hlsjs', 'shaka-player']),
      activeAdapter: adapter ? adapter.name : video ? 'unknown' : 'none',
      adapterTier: adapter ? adapter.tier : null,
      forcedAdapter: requestedAdapter ? requestedAdapter.name : 'none',
      forcedAdapterStatus: !requestedAdapter ? 'not-forced' : !video ? 'no-video'
        : requestedAdapter.name === adapter?.name ? 'selected' : 'unavailable',
      adapterSelectionStatus: video ? adapter ? diagnosticChoice(adapterHealthStatus, ['healthy', 'failed']) : 'not-evaluated' : 'no-video',
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
        playbackRateLock: trtRateGuards.get(video)?.active
          ? diagnosticChoice(trtRateGuards.get(video).mode, ['element', 'event']) : 'off',
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
        requestedHeight: qualityControl === 'not-implemented' ? null : diagnosticNumber(recordedQuality.requestedHeight, 1, 4320),
        cachedOptionCount: diagnosticCount(recordedQuality.cachedCount),
        // getQualities() ve applyQuality() burada çağrılmaz; rapor salt okunurdur.
        verification: diagnosticChoice(recordedQuality.verification,
          ['not-verified', 'pending', 'confirmed', 'decoded-match', 'rendition-confirmed', 'timed-out', 'rejected'], 'not-verified'),
        decodedMatch: recordedQuality.decodedMatch,
        renditionMatch: recordedQuality.renditionMatch,
        inventoryScope: recordedQuality.menuCount > 0 ? 'player-and-source-menu' : hls ? 'bound-hls-player' : 'adapter',
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
    if (remotePresentation) { remoteControl('report').then(reply => { if (reply.ok && reply.report) showErrorModal(reply.report); }); return; }
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
      delete payload.deleteAfterResolutionRequested;
      if (modal.querySelector('#pvc-request-deletion').checked === true) payload.deleteAfterResolutionRequested = true;
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
            <textarea id="pvc-user-feedback-input" disabled maxlength="500" aria-label="İsteğe bağlı açıklama" placeholder="Ad, e-posta, adres, bağlantı veya hesap bilgisi yazmayın." style="width: 100%; height: 56px; background: var(--pvc-surface, #142127); border: 1px solid color-mix(in srgb, var(--pvc-accent) 30%, transparent); border-radius: 8px; color: var(--pvc-text, #edf2f3); font-size: 11px; padding: 8px; resize: none;"></textarea>
            <p class="pvc-modal-desc">Açıklamanız otomatik anonimleştirilmez. Paylaşmadan önce aşağıdaki raporu kontrol edin.
              Bu panel sayfanın içinde çalışır; yazdığınız açıklama sayfanın betiklerinden gizlenmez.
              E-posta gönderen adresinizi, GitHub ise hesabınızı paylaşımınıza bağlayabilir.</p>
          </div>
          <label class="pvc-report-field"><input id="pvc-request-deletion" type="checkbox"> Sorun çözüldüğünde bu issue’nun / raporun silinmesini talep ediyorum.</label>
          <p class="pvc-modal-desc">Bu seçim yalnızca bir talep ekler. Silme işlemi platformun olanaklarına ve yetkili kişinin işlemine bağlıdır; otomatik silme veya kopyaların kaldırılması garanti edilmez.</p>
          <pre id="pvc-modal-code-block" class="pvc-modal-code"></pre>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-copy-payload-btn" class="pvc-modal-btn-secondary">📋 JSON Kopyala</button>
          <a id="pvc-send-mail-link" href="#" rel="noopener noreferrer" class="pvc-modal-btn-primary" style="background:var(--pvc-elevated, #1b2a33);">✉️ E-posta</a>
          <a id="pvc-open-github-link" href="#" target="_blank" rel="noopener noreferrer" class="pvc-modal-btn-primary" style="background:var(--pvc-elevated, #1b2a33);">🐙 GitHub Issue</a>
        </div>
      </div>
    `;

    getActiveContainer().appendChild(modal);
    modal.setAttribute('lang', uiLanguage);
    localizeUi(modal);
    applyUiAccessibility(modal);
    decorateUiComponents(modal);

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
      const issueTitle = encodeURIComponent(`[Diagnostic/v${EXTENSION_VERSION}]: ${payload.platform} - ${payload.problem}`);
      // Only a fixed, non-identifying request enters the draft URL, never the report or comment.
      const deletionBody = payload.deleteAfterResolutionRequested === true
        ? '&body=' + encodeURIComponent('Deletion request: I request deletion of this issue / report after the problem is resolved.\n\nPlease paste the diagnostic JSON below after reviewing it.\n') : '';
      ghLink.href = `${GITHUB_REPO_URL}/issues/new?title=${issueTitle}${deletionBody}`;
      // Raporu URL'ye gömmeyin; kopyalanan JSON kullanıcı tarafından taslağa eklenir.
      mailLink.href = `mailto:${DEVELOPER_EMAIL}?subject=${issueTitle}${deletionBody}`;
    };

    feedbackInput.addEventListener('input', refreshLinks);
    modal.querySelector('#pvc-report-problem').addEventListener('change', refreshLinks);
    modal.querySelector('#pvc-request-deletion').addEventListener('change', refreshLinks);
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
    modal.setAttribute('lang', uiLanguage);
    localizeUi(modal);
    applyUiAccessibility(modal);
    decorateUiComponents(modal);
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
        <div class="pvc-adapter-option ${isSelected ? 'pvc-adapter-selected' : ''}" data-adapter="${opt.name}" style="padding: 10px 12px; background: ${isSelected ? 'color-mix(in srgb, var(--pvc-accent) 15%, transparent)' : 'rgba(255, 255, 255, 0.03)'}; border: 1px solid ${isSelected ? 'var(--pvc-accent-ink, #92bfd5)' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 8px; margin-bottom: 8px; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <span style="font-weight: 700; font-size: 13px; color: ${isSelected ? 'var(--pvc-accent-ink, #92bfd5)' : 'var(--pvc-text, #edf2f3)'};">${opt.label}</span>
            <span class="pvc-val-badge" style="font-size: 10px;">${opt.tier}</span>
          </div>
          <div style="font-size: 11px; color: var(--pvc-muted, #a2b6c0);">${opt.desc}</div>
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
    modal.setAttribute('lang', uiLanguage);
    localizeUi(modal);
    applyUiAccessibility(modal);
    decorateUiComponents(modal);
    ['click', 'mousedown', 'pointerdown'].forEach(evtType => {
      modal.addEventListener(evtType, (e) => {
        if (e.target === modal) modal.remove();
        else e.stopPropagation();
      });
    });

    modal.querySelectorAll('.pvc-adapter-option').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (remotePresentation) { remoteControl('adapter', el.getAttribute('data-adapter') || 'none'); modal.remove(); return; }
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
    const drm = remotePresentation ? { isDrm: remotePresentation.drm, keySystem: 'EME', label: 'DRM / EME' } : detectDrmStatus(video);

    const modal = document.createElement('div');
    modal.id = 'pvc-drm-modal';
    modal.innerHTML = `
      <div class="pvc-modal-card">
        <div class="pvc-modal-header">
          <span style="color: var(--pvc-warning, #fbbf24);">🛡️ DRM / EME Korumalı Akış Bilgilendirmesi</span>
          <button id="pvc-close-drm-btn">✕</button>
        </div>
        <div class="pvc-modal-body">
          <p class="pvc-modal-desc">
            Bu video akışı <strong id="pvc-drm-key-system" data-pvc-i18n-skip></strong> ile şifrelenmiştir. Donanım ses kesintisini önlemek adına Web Audio API ses yükselticisi (%300) devre dışı bırakılmış olup yerel ses (%100), hız, görüntü filtreleri ve altyazı kontrolleri aktif tutulmuştur.
          </p>
        </div>
        <div class="pvc-modal-footer">
          <button id="pvc-dismiss-drm-btn" class="pvc-modal-btn-secondary" style="width: 100%;">Anladım, Kapat</button>
        </div>
      </div>
    `;

    getActiveContainer().appendChild(modal);
    modal.setAttribute('lang', uiLanguage);
    localizeUi(modal);
    applyUiAccessibility(modal);
    decorateUiComponents(modal);
    ['click', 'mousedown', 'pointerdown'].forEach(evtType => {
      modal.addEventListener(evtType, (e) => {
        if (e.target === modal) modal.remove();
        else e.stopPropagation();
      });
    });
    modal.querySelector('#pvc-drm-key-system').textContent = drm.keySystem;
    document.getElementById('pvc-close-drm-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
    document.getElementById('pvc-dismiss-drm-btn').onclick = (e) => { e.stopPropagation(); modal.remove(); };
  }

  function resetIdleTimer(popup) {
    if (!popup) return;
    popup.classList.remove('pvc-idle-hidden', 'pvc-idle-semi');
    popup.__nokActivity?.(true);

    clearTimeout(idleTimerStep1);
    clearTimeout(idleTimerStep2);
    if (hudAccessibility.keepVisible) return;

    idleTimerStep1 = setTimeout(() => {
      const keyboardFocus = () => popup.__nokKeyboardFocus !== false && popup.contains(document.activeElement);
      if (!popup.matches(':hover') && !keyboardFocus()) {
        popup.classList.add('pvc-idle-semi');
      }
      idleTimerStep2 = setTimeout(() => {
        if (!popup.matches(':hover') && !keyboardFocus()) {
          popup.classList.add('pvc-idle-hidden');
          popup.__nokActivity?.(false);
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

  // Açılış sağ üsttedir; kullanıcı her iki modda da paneli yatay/dikey taşıyabilir.
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
      if (e.target.closest('button, input, select, textarea, label')) return;

      e.preventDefault(); // Yerel metin/resim sürüklemesini engelle
      resetIdleTimer(popup);

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

        {
          // Both embedded and fullscreen HUDs can move away from native player controls.
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
    setUiAttribute(popup, 'aria-label', 'NOk Video Controller Denetim Masası');
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

      <label class="pvc-language-row" title="Dil seçimi yalnızca bu sayfa açıkken tutulur.">
        <span>🌐 <span>Dil</span></span>
        <select id="pvc-language-select" aria-label="Dil">
          <option value="tr" lang="tr" data-pvc-i18n-skip>Türkçe</option>
          <option value="en" lang="en" data-pvc-i18n-skip>English</option>
        </select>
      </label>

      <!-- Küçültülmüş (Collapsed Mini-Pill) Detaylı Bilgi ve Hızlı Kontrol Barı (Madde 6) -->
      <div id="pvc-collapsed-summary-bar">
        <div class="pvc-mini-metrics-row">
          <span id="pvc-mini-res-val" style="color: var(--pvc-accent-ink, #92bfd5);">🎬 ---</span>
          <span id="pvc-mini-speed-val" style="color: var(--pvc-text, #edf2f3);">⚡ 1.0x</span>
          <span id="pvc-mini-vol-val" style="color: var(--pvc-success, #34d399);">🔊 %100 (S)</span>
          <span id="pvc-mini-adapter-val" style="color: var(--pvc-accent-ink, #92bfd5); font-size: 9.5px;">Generic</span>
        </div>
        <div class="pvc-mini-quick-controls">
          <button id="pvc-mini-seek-m10" class="pvc-action-btn" title="10s Geri">⏮️ -10s</button>
          <button id="pvc-mini-play-pause" class="pvc-action-btn" title="Oynat / Duraklat">⏯️ Oynat</button>
          <button id="pvc-mini-seek-p10" class="pvc-action-btn" title="10s İleri">⏭️ +10s</button>
          <button id="pvc-mini-pip-btn" class="pvc-action-btn" title="PiP Aç/Kapat">🖼️ PiP</button>
        </div>
      </div>

      <!-- Canlı Render Çözünürlüğü Rozeti -->
      <div id="pvc-realtime-res-container" style="padding: 7px 12px; background: rgba(0, 0, 0, 0.4); border: 1px solid color-mix(in srgb, var(--pvc-accent) 20%, transparent); display: flex; align-items: center; justify-content: space-between; border-radius: 6px; margin-bottom: 6px;" title="Oynatıcıda o an işlenen video piksel boyutu">
        <span id="pvc-realtime-res-badge" style="font-size: 11px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, monospace; color: var(--pvc-accent-ink, #92bfd5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;" aria-live="polite">
          🎬 Gerçek: Ölçülüyor...
        </span>
        <button id="pvc-refresh-res-btn" style="background: none; border: none; color: var(--pvc-muted, #a2b6c0); font-size: 12px; cursor: pointer; padding: 2px 4px;" title="Çözünürlük ve Paketleri Yenile">🔄</button>
      </div>

      <!-- Basamaklı Adaptör Durumu & Manuel Seçici Barı -->
      <div id="pvc-adapter-bar" style="padding: 5px 10px; background: rgba(27, 42, 51, 0.7); border: 1px solid color-mix(in srgb, var(--pvc-accent) 25%, transparent); border-radius: 6px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <span style="font-size: 10.5px; color: var(--pvc-muted, #a2b6c0);">Adaptör:</span>
          <span id="pvc-active-adapter-badge" style="font-size: 10.5px; font-weight: 700; color: var(--pvc-accent-ink, #92bfd5); background: color-mix(in srgb, var(--pvc-accent) 12%, transparent); padding: 1px 5px; border-radius: 4px; border: 1px solid color-mix(in srgb, var(--pvc-accent) 30%, transparent);">Otomatik</span>
        </div>
        <button id="pvc-change-adapter-btn" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--pvc-muted, #a2b6c0); font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;" title="Adaptör Listesini Aç ve Değiştir">Değiştir ▾</button>
      </div>

      <label class="pvc-video-target-row"><span>Video hedefi</span><select id="pvc-video-target" aria-label="Video hedefi"><option value="auto">Otomatik seçim</option></select></label>

      <!-- DRM Koruma Rozeti -->
      <div id="pvc-drm-status-badge" style="display: none; padding: 5px 10px; background: color-mix(in srgb, var(--pvc-warning) 12%, transparent); border: 1px solid color-mix(in srgb, var(--pvc-warning) 40%, transparent); border-radius: 6px; margin-bottom: 6px; color: var(--pvc-warning, #fbbf24); font-size: 10.5px; font-weight: 600; cursor: pointer;">
        <span>🛡️ DRM Korumalı Akış (Güvenli Mod)</span>
      </div>

      <!-- Video Bulunamadı Uyarısı -->
      <div id="pvc-no-video-alert" style="display: none; padding: 8px 10px; background: color-mix(in srgb, var(--pvc-danger) 12%, transparent); border: 1px solid color-mix(in srgb, var(--pvc-danger) 35%, transparent); border-radius: 6px; margin-bottom: 8px; font-size: 11px; color: var(--pvc-danger, #fca5a5);">
        <div style="font-weight: 700; margin-bottom: 2px;">⚠️ Aktif Oynatıcı Bekleniyor</div>
        <div style="font-size: 10px; color: var(--pvc-muted, #a2b6c0); margin-bottom: 6px;">Sayfadaki video henüz başlamadı veya farklı bir çerçeve içinde.</div>
        <div style="display: flex; gap: 6px;">
          <button id="pvc-rescan-btn" style="flex: 1; padding: 3px; background: var(--pvc-elevated, #1b2a33); color: var(--pvc-text, #edf2f3); border: none; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer;">🔄 Yeniden Tara</button>
          <button id="pvc-quick-report-btn" style="flex: 1; padding: 3px; background: rgba(255, 255, 255, 0.08); color: var(--pvc-text, #edf2f3); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; font-size: 10px; cursor: pointer;">📋 Teşhis Raporu</button>
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
            <input type="range" id="pvc-speed-slider" aria-label="Oynatma hızı" min="0.25" max="3.0" step="0.25" value="1.0" class="pvc-range-slider" title="Çift tıklayarak 1.0x değerine sıfırlayabilirsiniz ([ / ])" />
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
            <span id="pvc-hdr-audio-badge" class="pvc-val-badge" style="color: var(--pvc-accent-ink, #92bfd5); background: color-mix(in srgb, var(--pvc-accent) 12%, transparent); border-color: color-mix(in srgb, var(--pvc-accent) 30%, transparent);">STEREO</span>
            <span id="pvc-hdr-volume-badge" class="pvc-val-badge">100%</span>
          </div>
        </div>
        <div id="pvc-content-audio" class="pvc-section-content">
          <div class="pvc-slider-row">
            <span class="pvc-slider-bound">%0</span>
            <input type="range" id="pvc-volume-slider" aria-label="Ses" min="0" max="300" step="5" value="100" class="pvc-range-slider pvc-gain-normal" title="Ses (%0-%300 Güçlendirici) • Çift tıklayarak %100'e sıfırlayın" />
            <span class="pvc-slider-bound" style="color: var(--pvc-danger, #f43f5e);" title="Maksimum %300 Ses Güçlendirici">%300 🚀</span>
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
          <p id="pvc-quality-status" class="pvc-settings-note" aria-live="polite">Kalite isteği yok.</p>
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
            <input type="range" id="pvc-filter-brightness" aria-label="Parlaklık" min="50" max="150" step="5" value="100" class="pvc-range-slider" title="Parlaklık (%50-%150) • Çift tıkla sıfırla" />
            <span id="pvc-val-brightness" class="pvc-slider-bound">%100</span>
          </div>
          <div class="pvc-slider-row">
            <span class="pvc-slider-bound" title="Kontrast">◐</span>
            <input type="range" id="pvc-filter-contrast" aria-label="Kontrast" min="50" max="150" step="5" value="100" class="pvc-range-slider" title="Kontrast (%50-%150) • Çift tıkla sıfırla" />
            <span id="pvc-val-contrast" class="pvc-slider-bound">%100</span>
          </div>
          <div class="pvc-slider-row">
            <span class="pvc-slider-bound" title="Doygunluk">🌈</span>
            <input type="range" id="pvc-filter-saturate" aria-label="Doygunluk" min="0" max="200" step="10" value="100" class="pvc-range-slider" title="Doygunluk (%0-%200) • Çift tıkla sıfırla" />
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
          <div id="pvc-sub-status-text" style="font-size: 10px; color: var(--pvc-muted, #a2b6c0); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            Yüklü altyazı yok (Sıfır Depolama RAM Modu)
          </div>
          <div class="pvc-btn-grid-3">
            <button id="pvc-sub-sync-m100" class="pvc-action-btn" title="Altyazıyı 100ms geri çek">⏪ -100ms</button>
            <button id="pvc-sub-sync-reset" class="pvc-action-btn" title="Senkron kaymasını sıfırla">0ms Sıfırla</button>
            <button id="pvc-sub-sync-p100" class="pvc-action-btn" title="Altyazıyı 100ms ileri al">⏩ +100ms</button>
          </div>
          <details class="pvc-sub-appearance">
            <summary>Altyazı görünümü</summary>
            <label>Yazı boyutu <output id="pvc-sub-fontSize-value">20px</output><input id="pvc-sub-fontSize" type="range" min="12" max="48" value="20" class="pvc-range-slider" /></label>
            <label>Alt kenardan uzaklık <output id="pvc-sub-bottom-value">8%</output><input id="pvc-sub-bottom" type="range" min="0" max="40" value="8" class="pvc-range-slider" /></label>
            <label>Arka plan opaklığı <output id="pvc-sub-background-value">82%</output><input id="pvc-sub-background" type="range" min="0" max="100" value="82" class="pvc-range-slider" /></label>
            <label>Yazı rengi <select id="pvc-sub-color"><option value="white">Beyaz</option><option value="yellow">Sarı</option></select></label>
            <button id="pvc-sub-appearance-reset" class="pvc-action-btn">Görünümü sıfırla</button>
            <p class="pvc-settings-note">Yazı boyutu katmanda uygulanır; yerel tam ekran/PiP yazısını tarayıcı yönetir.</p>
          </details>
        </div>
      </div>

      <!-- Footer: Ping, Rehber/Kısayollar ve Teşhis -->
      <div class="pvc-menu-footer" id="pvc-menu-footer">
        <button id="pvc-ping-btn" class="pvc-footer-btn pvc-btn-emerald" title="Medya HTTP yanıt süresini ölç (ağ pingi değildir)">📡 CDN yanıtı</button>
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
    popup.setAttribute('lang', uiLanguage);
    localizeUi(popup);
    const languageSelect = popup.querySelector('#pvc-language-select');
    languageSelect.value = uiLanguage;
    languageSelect.addEventListener('change', e => {
      e.stopPropagation();
      setUiLanguage(languageSelect.value);
      resetIdleTimer(popup);
      clampPopupToViewport(popup);
    });
    const videoTarget = popup.querySelector('#pvc-video-target');
    videoTarget.addEventListener('change', e => {
      e.stopPropagation();
      if (remotePresentation) { remoteControl('target', videoTarget.value === 'auto' ? -1 : Number(videoTarget.value)); return; }
      const candidate = videoTarget.__nokVideos?.[Number(videoTarget.value)];
      controlledVideo = videoTarget.value !== 'auto' && candidate?.isConnected !== false ? candidate || null : null;
      renderDynamicQualityButtons(); updateRealtimeResolutionBadge(); resetIdleTimer(popup);
    });
    updateVideoTargetControls();

    // Olay İzolasyonu (e.stopPropagation)
    ['click', 'pointerdown', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick', 'keydown', 'keyup'].forEach(evtType => {
      popup.addEventListener(evtType, (e) => {
        e.stopPropagation();
      }, { capture: false });
    });

    const dragHeader = popup.querySelector('#pvc-drag-header');
    makeDraggable(popup, dragHeader);

    popup.addEventListener('focusin', () => resetIdleTimer(popup));
    popup.addEventListener('focusout', () => resetIdleTimer(popup));
    popup.addEventListener('pointerdown', () => { popup.__nokKeyboardFocus = false; resetIdleTimer(popup); });
    popup.addEventListener('keydown', () => { popup.__nokKeyboardFocus = true; resetIdleTimer(popup); });
    popup.addEventListener('mouseenter', () => resetIdleTimer(popup));
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
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.setAttribute('aria-controls', header.getAttribute('data-target'));
      header.setAttribute('aria-expanded', String(!header.closest('.pvc-menu-section').classList.contains('pvc-section-collapsed')));
      header.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); header.click(); }
      });
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        resetIdleTimer(popup);
        const section = header.closest('.pvc-menu-section');
        if (section) {
          section.classList.toggle('pvc-section-collapsed');
          header.setAttribute('aria-expanded', String(!section.classList.contains('pvc-section-collapsed')));
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
      if (remotePresentation) remoteControl('hotkeys', hotkeysEnabled);
      hkBtn.classList.toggle('pvc-btn-active', hotkeysEnabled);
      hkBtn.setAttribute('aria-pressed', String(hotkeysEnabled));
      setUiAttribute(hkBtn, 'title', hotkeysEnabled ? 'Klavye Kısayolları Aktif (Kapatmak için tıklayın)'
        : 'Klavye Kısayolları Devre Dışı (Açmak için tıklayın)');
      showToast(hotkeysEnabled ? '⌨️ Klavye Kısayolları Aktif' : '🔇 Klavye Kısayolları Devre Dışı');
    };

    // Küçültülmüş Mini-Bar Hızlı Butonları (Madde 6)
    popup.querySelector('#pvc-mini-seek-m10').onclick = (e) => { e.stopPropagation(); seekBy(-10); };
    popup.querySelector('#pvc-mini-seek-p10').onclick = (e) => { e.stopPropagation(); seekBy(10); };
    popup.querySelector('#pvc-mini-pip-btn').onclick = (e) => { e.stopPropagation(); togglePictureInPicture(); };
    popup.querySelector('#pvc-mini-play-pause').onclick = (e) => {
      e.stopPropagation();
      if (remotePresentation) { remoteControl('play'); return; }
      const { video } = findVideoAndPlayer();
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => {});
        setUiText(e.currentTarget, '⏸️ Duraklat');
      } else {
        video.pause();
        setUiText(e.currentTarget, '▶️ Oynat');
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
        scheduleVideoFilterUpdate();
      });
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        videoFilterState[key] = 100;
        scheduleVideoFilterUpdate();
        showToast('🎨 Filtre %100 değerine sıfırlandı');
      });
    };
    bindFilterSlider('#pvc-filter-brightness', 'brightness');
    bindFilterSlider('#pvc-filter-contrast', 'contrast');
    bindFilterSlider('#pvc-filter-saturate', 'saturate');

    popup.querySelector('#pvc-btn-night-shield').onclick = (e) => {
      e.stopPropagation();
      videoFilterState.nightShield = !videoFilterState.nightShield;
      scheduleVideoFilterUpdate();
      showToast(videoFilterState.nightShield ? '🌙 Gece Kalkanı Aktif' : '☀️ Gece Kalkanı Kapatıldı');
    };

    popup.querySelector('#pvc-btn-invert-color').onclick = (e) => {
      e.stopPropagation();
      videoFilterState.invert = !videoFilterState.invert;
      scheduleVideoFilterUpdate();
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
      if (remotePresentation && file.size > 4000000) { subFileInput.value = ''; showToast('Altyazı dosyası gömülü oynatıcı için çok büyük.'); return; }
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
              setUiText(subStatusText, 'Geçerli altyazı satırı okunamadı. SRT/VTT biçimini kontrol edin.');
              subStatusText.style.color = 'var(--pvc-danger, #f43f5e)';
            }
            showToast('Altyazı yüklenemedi: geçerli zamanlanmış satır bulunamadı.');
            return;
          }
          customSubtitleCues = parsedCues;
          // Loading a file is an explicit request to show it, even after a previous hide.
          subtitleOverlayEnabled = true;
          subToggleBtn.classList.add('pvc-active');
          setUiText(subToggleBtn, '👁️ Altyazı: Açık');
          subtitleLoadStatus = 'loaded';
          addDiagnosticLog('INFO', 'SUBTITLE_LOADED');
          subtitleFileName = file.name;
          subtitleOffsetMs = 0;
          const badge = document.getElementById('pvc-sub-offset-badge');
          if (badge) setUiText(badge, '0ms');
          if (subStatusText) {
            setUiText(subStatusText, `✅ ${subtitleFileName} (${customSubtitleCues.length} satır RAM'de)`);
            subStatusText.style.color = 'var(--pvc-success, #34d399)';
          }
          const { video } = findVideoAndPlayer();
          if (remotePresentation) {
            setUiText(subStatusText, 'Altyazı aktarılıyor...');
            remoteControl('subtitle-load', parsedCues).then(reply => {
              if (!reply.ok) showToast('Gömülü oynatıcı bu isteği uygulayamadı.');
              else showToast(`💬 Altyazı Yüklendi: ${parsedCues.length} satır`);
            });
            return;
          } else if (video) {
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
          setUiText(subStatusText, 'Altyazı dosyası okunamadı.');
          subStatusText.style.color = 'var(--pvc-danger, #f43f5e)';
        }
        showToast('Altyazı dosyası okunamadı.');
      };
      reader.readAsText(file, 'UTF-8');
    });

    subToggleBtn.onclick = (e) => {
      e.stopPropagation();
      subtitleOverlayEnabled = !subtitleOverlayEnabled;
      subToggleBtn.classList.toggle('pvc-active', subtitleOverlayEnabled);
      setUiText(subToggleBtn, subtitleOverlayEnabled ? '👁️ Altyazı: Açık' : '🙈 Altyazı: Gizli');
      if (remotePresentation) { remoteControl('subtitle-visible', subtitleOverlayEnabled); return; }
      const { video } = findVideoAndPlayer();
      if (video) {
        injectNativeTextTrackCues(video);
        renderCustomSubtitleCue(video);
      }
    };

    popup.querySelector('#pvc-sub-sync-m100').onclick = (e) => { e.stopPropagation(); shiftSubtitleSync(-100); };
    for (const key of ['fontSize', 'bottom', 'background', 'color']) {
      const input = popup.querySelector(`#pvc-sub-${key}`);
      input.value = String(subtitleAppearance[key]);
      input.addEventListener(key === 'color' ? 'change' : 'input', e => {
        e.stopPropagation(); resetIdleTimer(popup);
        setSubtitleAppearance(key, key === 'color' ? input.value : Number(input.value));
      });
    }
    popup.querySelector('#pvc-sub-appearance-reset').onclick = e => {
      e.stopPropagation();
      for (const [key, value] of Object.entries({ fontSize: 20, bottom: 8, background: 82, color: 'white' })) setSubtitleAppearance(key, value);
    };
    popup.querySelector('#pvc-sub-sync-p100').onclick = (e) => { e.stopPropagation(); shiftSubtitleSync(100); };
    popup.querySelector('#pvc-sub-sync-reset').onclick = (e) => {
      e.stopPropagation();
      if (remotePresentation) { remoteControl('subtitle-offset', 0); return; }
      subtitleOffsetMs = 0;
      const badge = document.getElementById('pvc-sub-offset-badge');
      if (badge) setUiText(badge, '0ms');
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
      if (remotePresentation) { remoteControl('refresh'); return; }
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
      if (remotePresentation) { remoteControl('refresh'); return; }
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
      this.disabled = true;
      this.setAttribute('aria-busy', 'true');
      setUiText(this, 'Ölçülüyor...');
      appendUiLoader(this);
      try {
        const res = await testCdnPing(false);
        setUiText(this, (res && res.ms !== undefined) ? `📡 ${res.ms} ms` : '📡 CDN yanıtı');
      } catch (_) {
        setUiText(this, '📡 CDN yanıtı');
      } finally {
        this.querySelector('.pvc-loading-grid')?.remove();
        this.disabled = false;
        this.setAttribute('aria-busy', 'false');
      }
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
      stopAdWatch();
      postHudSignal('PVC_HUD_CLOSED');
      if (remotePresentation || remoteSourceSession) clearRemoteSession();
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

    setupHudNavigation(popup);
    updateSubtitleAppearanceControls();
    if (!remotePresentation) syncLocalMediaHud();
    startQualityWatch();
    renderDynamicQualityButtons();
    updateCollapsedSummaryBar();
    return popup;
  }

  function togglePvcPopup() {
    if (remotePresentation || remoteSourceSession) { postHudSignal('PVC_HUD_CLOSED'); clearRemoteSession(); return; }
    if (frameProtocol && window.parent !== window && !isFullscreenMode()) { window.postMessage({ type: 'PVC_REQUEST_TOP_TOGGLE' }, '*'); return; }
    let popup = document.getElementById('pvc-controller-popup');
    const wasClosed = !popup || popup.style.display === 'none';
    if (!popup) {
      popup = buildPvcPopup();
    }
    syncFullscreenElements();
    popup.style.display = wasClosed ? 'block' : 'none';
    if (!wasClosed) { stopAdWatch(); postHudSignal('PVC_HUD_CLOSED'); }
    if (popup.style.display === 'block') {
      if (wasClosed) resetPopupToDefaultPosition(popup);
      clampPopupToViewport(popup);
      resetIdleTimer(popup);
      startQualityWatch();
      renderDynamicQualityButtons();
      updateRealtimeResolutionBadge();
      testCdnPing(true);

      const { video } = findVideoAndPlayer();
      window.postMessage({ type: video ? 'PVC_HUD_OPENED' : 'PVC_OPEN_IN_CHILD_FRAMES' }, '*');
      if (video) {
        monitorVideoResolution(video);
        const slider = popup.querySelector('#pvc-speed-slider');
        const hdrSpeed = popup.querySelector('#pvc-hdr-speed-badge');
        if (slider) slider.value = (video.playbackRate || 1.0).toString();
        if (hdrSpeed) setUiText(hdrSpeed, `${video.playbackRate || 1.0}x`);
        initAudioGraphForVideo(video);
      }
      showToast(`NOk Video Controller Aktif (v${EXTENSION_VERSION})`);
    }
  }

  if (window === window.top) {
    const platform = diagnosticPlatform(HOSTNAME);
    if (platform !== 'other') window.postMessage({ type: `PVC_PLATFORM_${platform}` }, '*');
  }
  window.postMessage({ type: 'PVC_ENGINE_READY' }, '*');
  startPeriodicPingEngine();
  setTimeout(() => {
    const { video } = findVideoAndPlayer();
    if (video) {
      monitorVideoResolution(video);
    }
    testCdnPing(true);
  }, 1000);

})();
