# NOk Video Controller — Kapsamlı Proje & Mimari Kılavuzu (Master Architecture & Handover Guide)

> **Sürüm:** v0.5.2  
> **Geliştirici:** NOkrep ([GitHub](https://github.com/NOkrep/NOk-video-controller) | `ihsanartrk07@gmail.com`)  
> **Platform Uyumluluğu:** Firefox (Gecko) & Chrome, Brave, Edge, Opera (Chromium) — Manifest V3 WebExtensions  
> **Son Güncelleme:** v0.5.2 (İzole Klavye Kısayolları, Görüntü Filtreleri & Gece Kalkanı, Bellek İçi Harici Altyazı & Senkron, Doğrudan PiP Kontrolü, Küçültülmüş Detaylı Bilgi Barı, %300 Ses Booster + Gain Renk Geçişi, Mıknatıslı Kenar Hizalama)

---

## 1. 📌 Yönetici Özeti & Temel Misyon

**NOk Video Controller**, canlı yayın ve VoD platformlarında kullanıcıya video oynatıcı üzerinde eksiksiz hakimiyet sağlayan, **sıfır depolama izinli (Zero-Storage / In-Memory Stateless)**, evrensel uyumluluklu açık kaynaklı bir tarayıcı eklentisidir.

### Temel Yetenekler:
1. **Evrensel Medya ve Shadow DOM Derin Taraması:**
   - `<all_urls>` desteğiyle her sitede çalışma olanağı.
   - Açık Shadow Root'lar, Web Component'ler (`video-js`, `mux-player`, `youtube-video`, `shreddit-player`) ve aynı kökenli iframe'lerdeki `<video>` etiketlerini özyinelemeli BFS ile yakalama.
   - Akıllı Video Puanlama Matrisi: PiP (+200), oynatılan (+120), sesi açık (+40), viewport içinde (+30) ve en büyük alana sahip video önceliği.
2. **DRM / EME Korumalı İçerik Tespiti & Güvenli Mod:**
   - Widevine, FairPlay, PlayReady şifrelemeli akışları (`video.mediaKeys`, `encrypted` event) otomatik algılama.
   - Donanım ses susturmasını önlemek için Web Audio API booster'ını güvenli modda atlayıp yerel ses kontrolünü (%100) koruma.
   - HUD üzerinde `🛡️ DRM Korumalı Akış` rozeti ve bilgilendirici kılavuz paneli.
3. **3-Kademeli Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline):**
   - **Tier 1 (Siteye Özel):** Kick.com, TRT 1 / TRT İzle, Now TV, PuhuTV.
   - **Tier 2 (Oynatıcı Kütüphaneleri):** YouTube (`movie_player`), Video.js, Hls.js, Shaka Player, Dash.js.
   - **Tier 3 (Evrensel Standart):** HTML5 & Shadow DOM doğrudan denetimi.
   - Canlı sağlık kontrolü (`probeAdapterHealth`) ve HUD üzerinden tek tıkla manuel adaptör değiştirme.
4. **Ağ Seviyesinde HLS / SMIL / BVR Kalite Kilitleri:**
   - TRT 1 & TRT İzle (`cdn-v.pr.trt.com.tr` üzerinde HLS `master1080p`, `720p`, `576p`, `480p`, `360p` yönlendirmesi).
   - Now TV / Fox (ErCDN BVR segment bant genişliği zorlaması `bvr_bw=...`).
   - PuhuTV (DYG Video API akıllı yönlendirmesi: Akamai vs. MNCDN 1080p FHD SMIL rotası).
5. **Kick.com Derin Entegrasyonu:**
   - Amazon IVS Player SDK erken yakalama (`IVSPlayer.create`, `AmazonIVS.createMediaPlayer`, `attachHTMLVideoElement`).
   - React Fiber (Next.js / Radix UI) hook ve setter fonksiyonlarını **0ms önbellekleme** ile yönetme.
6. **Web Audio API ile Gelişmiş Ses (%300 Booster & Stereo/Mono):**
   - %0 ile %300 arasında ses yükseltme (`GainNode` max 3.0x booster) ve dinamik slider renk geçişi (Cyan $\rightarrow$ Amber $\rightarrow$ Rose).
   - Stereo ve Mono modları arasında tek tıkla matris geçişi (`ChannelSplitterNode` + `ChannelMergerNode`).
7. **Kesintisiz Oynatma Hızı & 4 Kademeli Sarma:**
   - 0.25x ile 3.0x arasında kademesiz hız slider'ı, çift tıkla sıfırlama ve `-30s`, `-10s`, `+10s`, `+30s` sarma.
8. **Görüntü Filtreleri, Harici Altyazı ve Klavye Kısayolları (v0.5.2):**
   - Parlaklık, Kontrast, Doygunluk, Gece Kalkanı ve Ters Renk CSS filtreleri.
   - Bellek içi `.srt` / `.vtt` altyazı yükleyici ve `±100ms` senkron kaydırma.
   - Yazı alanlarını dışlayan izole klavye kısayolları motoru.
9. **2-Kademeli Akıllı Saydam HUD, Mıknatıslı Kenar Hizalama & Küçültülmüş Özet Bar:**
   - 2 saniye hareketsizlikte %88 yarı-saydamlık (`opacity: 0.12`), ek 2 saniye sonra tam görünmezlik (`opacity: 0`).
   - Ekran kenarlarına 16px yaklaşıldığında mıknatıslı yapışma (`pvc-snapped-edge`) ve viewport sınır koruması (`clampPopupToViewport`).
   - Küçültülmüş (Collapsed) modda çözünürlük, hız, ses, adaptör ve hızlı kontrol tuşlarını gösteren detaylı özet bar.
10. **Sıfır Kişisel Veri (Zero-PII) Teşhis & Hata Raporlama:**
    - Stream URL'lerindeki güvenlik tokenlarını maskeleyen (`sanitizeStreamUrl`), bellek içi 40 kayıttan oluşan log tamponu ve tek tıkla kopyalanabilir JSON teşhis paneli.

---

## 2. 🏛️ Mimari Tasarım & Çalışma Prensibi

Manifest V3 kısıtlamaları altında hem Firefox (Gecko) hem Chromium tarayıcılarda sayfa içi oynatıcı değişkenlerine erişmek için iki katmanlı hibrit enjeksiyon modeli kullanılmıştır:

```

┌────────────────────────────────────────────────────────────────────────┐
│                        TARAYICI (FIREFOX & CHROMIUM)                   │
├────────────────────────────────┬───────────────────────────────────────┤
│  BACKGROUND SCRIPT / WORKER    │  KULLANICI ETKİLEŞİMİ (Toolbar Click) │
│         (background.js)        │  - activeTab izniyle sekmeyi yakalar  │
│  service_worker + scripts      │  - injected.css & content.js enjekte  │
└────────────────────────────────┴──────────────────┬────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────┐
│               ISOLATED WORLD (content.js)                              │
│  - Tarayıcı eklenti API'lerine erişebilir                              │
│  - Dinamik  oluşturup DOM'a ekler ve siler   │
│  - data-logo-url ile SVG logo adresini Main World'e aktarır            │
│  - postMessage köprüsü ile haberleşir                                  │
└───────────────────────────────────┬────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────┐
│               MAIN WORLD ENGINE (injected.js)                          │
│  - Sayfanın gerçek window nesnesinde çalışır                           │
│  - window.IVSPlayer, window.videojs, React Fiber DOM düğümlerine erişir│
│  - XMLHttpRequest.prototype.open ve window.fetch'i sarmalar            │
│  - Web Audio API, CSS Filter, Harici Altyazı ve Kısayolları yönetir    │
└────────────────────────────────────────────────────────────────────────┘

```

---

## 3. 🎯 Tasarım ve Mühendislik Tercihleri

| Tercih Edilen Yaklaşım | Neden Tercih Edildi? (Gerekçe & Avantaj) | Tercih Edilmeyen / Kaçınılan Yaklaşım |
| :--- | :--- | :--- |
| **Sıfır Depolama (Zero Storage / Stateless)** | Kullanıcı gizliliği, sekme kapatıldığında sıfır kalıntı bırakma ve bellek sızıntısını önleme. | `localStorage`, `sessionStorage`, `chrome.storage`, `IndexedDB`, `cookies`. |
| **Firefox & Chromium Ortak Manifest** | `background` alanında hem `service_worker` hem `scripts` tanımlanarak tek kod tabanıyla her iki tarayıcı ailesinde çalışma sağlanır. | Yalnızca tek tarayıcıya özgü manifest yapısı. |
| **Evrensel Enjeksiyon & Minimum Yetki** | `content_scripts.matches: ["<all_urls>"]` ile her sitede çalışır; `host_permissions` istenmez, yalnızca `activeTab` ve `scripting` kullanılır. | Gereksiz `host_permissions` veya `storage` izinleri istemek. |
| **React Fiber 0ms Hook Caching (Kick)** | Hook dispatch referansları modül seviyesinde önbelleklenerek tıklama maliyeti **0ms**'ye indirildi. | Her tıklamada DOM'u baştan aşağı taramak. |
| **Olay İzolasyonu (`stopPropagation`)** | HUD üzerindeki tüm etkileşimlerde ve klavye kısayollarında `e.stopPropagation()` kullanılarak yerel oynatıcı çakışmaları önlendi. | Olayların video kapsayıcısına kabarmasına izin vermek. |

---

## 4. ⚙️ Bileşenler ve Derinlemesine Çalışma Detayları

### 4.1 Ağ Seviyesi İstek Yönlendirme Motoru (`transformStreamRequestUrl`)
`XMLHttpRequest.prototype.open` ve `window.fetch` sarmalanarak gelen akış URL'leri analiz edilir:
- **TRT 1 & TRT İzle (`cdn-v.pr.trt.com.tr`):** `master(1080p|720p|576p|480p|360p|240p)?` regex eşleşmesiyle hedef kaliteye yönlendirilir ve `0.001s` mikro-sarma ile tampon tazelenir.
- **Now TV / Fox (ErCDN BVR):** Segment ve manifest isteklerine `bvr_bw` bant genişliği parametresi eklenir.
- **PuhuTV (DYG Video API):** 1080p FHD seçildiğinde `akamai=true` parametresi `akamai=false` yapılarak MNCDN rotasına yönlendirilir.

### 4.2 Web Audio API Ses Motoru (%300 Booster & Stereo/Mono)
- **%300 Ses Yükseltme:** `GainNode` üzerinden `validPercent / 100` çarpanıyla maksimum `3.0x` (%300) dijital kazanç sağlanır.
- **Görsel Kazanç (Gain) Renk Geçişi:** Ses slider'ı `%0–100` aralığında Cyan (`#38bdf8`), `%101–200` aralığında Amber (`#f59e0b`), `%201–300` aralığında Rose (`#f43f5e`) rengine bürünür.
- **Stereo <-> Mono Geçişi:** `ChannelSplitterNode` ve `ChannelMergerNode` ile kanallar birleştirilir veya ayrılır.

### 4.3 Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline)
1. **Kullanıcı Tercihi (`userForcedAdapterName`):** Manuel seçilen adaptör varsa önceliklidir.
2. **Tier 1 (Siteye Özel):** `KickAdapter`, `TrtAdapter`, `NowTvAdapter`, `PuhuTvAdapter`.
3. **Tier 2 (Oynatıcı Kütüphaneleri):** `YouTubeAdapter`, `VideoJsAdapter`, `HlsJsAdapter`, `ShakaPlayerAdapter`, `DashJsAdapter`.
4. **Tier 3 (Evrensel HTML5 & Shadow DOM):** `GenericAdapter` + `deepFindMediaElements()` BFS tarayıcısı.

### 4.4 DRM / EME Korumalı İçerik Tespiti & Güvenli Mod
- `video.mediaKeys`, `encrypted` olayı ve `webkitKeys` kontrol edilir.
- DRM algılandığında donanım ses kesintisini önlemek amacıyla Web Audio API devre dışı bırakılır ve yerel `video.volume` (%0–%100) kullanılır.

### 4.5 Canlı Çözünürlük Rozeti & Sıfır-PII Teşhis Raporlama
- `video.videoWidth` ve `video.videoHeight` izlenerek gerçek render çözünürlüğü rozete yazılır.
- `sanitizeStreamUrl` ile tüm kimlik doğrulama parametreleri (`token`, `st`, `hdnts`, `sig`) maskelenir; son 40 log kaydı `DIAGNOSTIC_LOG_BUFFER` içinde tutulur.

### 4.6 İzole Klavye Kısayolları Motoru (v0.5.2)
- `isEditableTarget()` kontrolü sayesinde kullanıcı `INPUT`, `TEXTAREA`, `SELECT` veya `isContentEditable` alanlarında (sohbet/arama kutusu) yazı yazarken kısayollar tetiklenmez.
- Desteklenen tuşlar: `[` / `]` (‡0.25x hız), `R` (1.0x hız sıfırlama), `M` (Stereo/Mono), `Shift + ↑/↓` (±%10 ses), `Alt + Q` (sonraki kalite), `Alt + P` (PiP aç/kapat), `Ctrl + Shift + S` (HUD aç/kapat).

### 4.7 Görüntü Filtreleri ve Gece Kalkanı Modülü (v0.5.2)
- Aktif `<video>` elemanının `style.filter` özelliğine `brightness(50%–150%)`, `contrast(50%–150%)`, `saturate(0%–200%)`, Gece Kalkanı (`sepia(38%) brightness(88%) contrast(95%)`) ve Ters Renk (`invert(100%) hue-rotate(180deg)`) uygulanır.
- Tüm slider'lar üzerine çift tıklandığında (`dblclick`) varsayılan değere (`%100` / `1.0x`) sıfırlanır.

### 4.8 Bellek İçi Harici Altyazı (`.srt` / `.vtt`) ve Senkronizasyon (v0.5.2)
- Sıfır depolama kuralına uygun olarak yerel `.srt` veya `.vtt` dosyaları `FileReader` ile doğrudan RAM'e okunur (`parseSrtOrVttContent`).
- Hem özel `#pvc-subtitle-overlay` katmanında hem de yerel `TextTrack` (`VTTCue`) üzerinde gösterilir; `-100ms` / `+100ms` butonlarıyla anlık senkron kaydırma (`subtitleOffsetMs`) yapılır.

### 4.9 Mıknatıslı Kenar Hizalama, Küçültülmüş Özet Bar & Doğrudan PiP (v0.5.2)
- **Magnetic Edge Snapping:** HUD sürüklenirken pencere kenarlarına `16px` (`SNAP_THRESHOLD`) yaklaştığında kenara mıknatıslı yapışır ve `clampPopupToViewport` ile ekran dışına taşması engellenir.
- **Küçültülmüş (Collapsed) Özet Bar:** Panel küçültüldüğünde (`#pvc-collapsed-summary-bar`) anlık çözünürlük, hız, ses, adaptör bilgisi ve `-10s`, `Oynat/Duraklat`, `+10s`, `PiP` hızlı butonları gösterilir.
- **Doğrudan PiP Kontrolü:** Kontrolcüyü PiP penceresine taşımadan, mevcut penceredeki HUD üzerinden `requestPictureInPicture` / `exitPictureInPicture` yönetilir.

---

## 5. 📊 Sürüm Evrimi ve Çözülen Kritik Problemler

### v0.5.2 (Mevcut Kararlı Sürüm)
- **İzole Klavye Kısayolları Motoru:** Yazı alanlarını dışlayan ve `e.stopPropagation()` ile izole edilen kısayol sistemi eklendi.
- **Görüntü Filtreleri & Gece Kalkanı:** Parlaklık, kontrast, doygunluk, gece modu ve ters renk kontrolleri eklendi.
- **Bellek İçi Harici Altyazı Motoru:** `.srt`/`.vtt` RAM içi ayrıştırıcı ve `±100ms` senkronizasyon eklendi.
- **%300 Ses Booster, Gain Renk Geçişi & Çift Tıkla Sıfırlama:** Ses üst sınırı %300 olarak yapılandırıldı; dinamik slider renk geçişi ve çift tıkla sıfırlama eklendi.
- **Mıknatıslı Kenar Hizalama, Küçültülmüş Detaylı Bar & PiP:** 2D mıknatıslı sürükleme, viewport sınır koruması, küçültülmüş özet bar, doğrudan PiP kontrolü ve vektörel `nok-logo.svg` entegrasyonu tamamlandı.
- **Saf WebExtension Temizliği:** AI Studio simülasyon/sunucu dosyaları (`index.html`, `server.js`, `package.json`, `bun.lock`, `.env.example`, `metadata.json`, `popup.*`, `test.zip`) kaldırıldı ve `SITE_COMPATIBILITY.md` eklendi.

### v0.5.1
- **Evrensel Medya Tespiti & Shadow DOM Derin Taraması:** `<all_urls>` desteği ve `deepFindMediaElements` BFS tarayıcısı eklendi.
- **DRM / EME Güvenli Modu & 3-Kademeli Basamaklı Adaptör Hattı:** `detectDrmStatus` ve `resolveCascadeAdapter` mimarisi devreye alındı.

### v0.5.0
- **Kick.com Ses Senkronizasyonu & TRT 1 HUD Olay İzolasyonu:** Radix UI Slider simülasyonu ve `e.stopPropagation()` izolasyonu tamamlandı.

---

## 6. ⚠️ Güncel Zorluklar ve Bilinen Sınırlar

1. **Cross-Origin iframe İzolasyonu:** Üçüncü taraf `iframe` içindeki videolara ana pencereden doğrudan erişilemez; `manifest.json` içindeki `all_frames: true` sayesinde eklenti her çerçeveye bağımsız enjekte olur.
2. **DRM Korumalı İçerikler:** EME şifreli akışlarda donanım ses kesintisini önlemek için Web Audio API (`%300` booster) bypass edilir.
3. **Firefox PiP API Farkı:** Chromium tarayıcılar `video.requestPictureInPicture()` API'sini desteklerken, Firefox güvenlik/tasarım tercihi olarak bu standart JS metodunu web sayfalarına açmayabilir; kodda güvenli kontrol (`typeof video.requestPictureInPicture === 'function'`) mevcuttur.

---

## 7. 🚀 Gelecek Yol Haritası (Roadmap)

1. **Yeni Tier 1 Platform Adaptörleri:**
   - **Tabii, BluTV, Gain, Exxen:** Yerli VoD platformlarının oynatıcı UI ve kalite seçimi mekanizmalarına özel adaptörler.
   - **Twitch.tv:** Twitch oynatıcı kalite kontrolü için özel Tier 1 adaptörü.
2. **Altyazı Stil Özelleştirmesi:**
   - Harici altyazı katmanının (`#pvc-subtitle-overlay`) yazı boyutu, rengi ve dikey konumunun HUD üzerinden ayarlanabilmesi.
3. **İsteğe Bağlı Tekil Akordeon (Single-Active Accordion) Modu:**
   - Küçük ekranlarda bir akordeon açıldığında diğerinin otomatik kapanması.

---

## 8. 📂 Dosya Ağacı ve Sorumluluk Matrisi

```text
NOk-video-controller/
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── site_support.md    # GitHub yeni site destek/hata bildirim şablonu
├── icons/
│   ├── icon16.png             # 16x16 araç çubuğu ikonu
│   ├── icon48.png             # 48x48 eklenti yönetim ikonu
│   ├── icon128.png            # 128x128 mağaza/kurulum ikonu
│   └── nok-logo.svg           # Saf vektörel NOkrep organizasyon logosu (HUD başlığı)
├── manifest.json              # Manifest V3 yapılandırması (Firefox scripts + Chromium service_worker)
├── background.js              # Stateless arka plan betiği (Toolbar tıklamasıyla enjeksiyon)
├── content.js                 # Isolated World köprüsü (Main World injected.js enjektörü)
├── injected.js                # Main World Engine (HUD, Adaptörler, Web Audio, Filtre, Altyazı, Kısayollar)
├── injected.css               # HUD arayüz stilleri (Glassmorphism, Gain renkleri, Mini-Bar, Mıknatıs efekti)
├── README.md                  # Hızlı kurulum ve proje özeti
├── SITE_COMPATIBILITY.md      # Katı kurallı site uyumluluk ve durum takip tablosu
└── PROJECT_MASTER_GUIDE.md    # BU DOSYA (Eksiksiz mimari, geçmiş ve devir kılavuzu)

```

---

## 9. 🔄 Geliştirici Devir & Kodlama Kuralları

### Kırmızı Çizgiler:

1. **Sıfır Depolama Kuralı:** `localStorage`, `sessionStorage`, `chrome.storage` veya `cookies` kesinlikle kullanılmaz.
2. **Konsol Temizliği:** Periyodik `console.log` basılmaz; yalnızca `addDiagnosticLog` kullanılır.
3. **Sürüm Eşitlemesi:** Sürüm geçişlerinde `manifest.json` (`"version"`), `injected.js` (`EXTENSION_VERSION` ve `VERSION_HISTORY`), `README.md`, `SITE_COMPATIBILITY.md` ve `PROJECT_MASTER_GUIDE.md` senkronize edilir.
4. **Site Uyumluluk Tablosu Kuralı:** `SITE_COMPATIBILITY.md` içindeki "Tam Çalışıyor" bölümüne geliştirici açıkça talep etmeden hiçbir site eklenmez.

---

*NOk Video Controller bir **NOkrep** açık kaynak projesidir.*

```

┌────────────────────────────────────────────────────────────────────────┐
│                        TARAYICI (BROWSER)                              │
│                        TARAYICI (FIREFOX & CHROMIUM)                   │
├────────────────────────────────┬───────────────────────────────────────┤
│    BACKGROUND SERVICE WORKER   │  KULLANICI ETKİLEŞİMİ (Toolbar Click) │
│  BACKGROUND SCRIPT / WORKER    │  KULLANICI ETKİLEŞİMİ (Toolbar Click) │
│         (background.js)        │  - activeTab izniyle sekmeyi yakalar  │
│                                │  - injected.css & content.js enjekte  │
│  service_worker + scripts      │  - injected.css & content.js enjekte  │
└────────────────────────────────┴──────────────────┬────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────┐
│               ISOLATED WORLD (content.js)                              │
│  - Tarayıcı eklenti API'lerine erişebilir                              │
│  - Sayfanın global window/React nesnelerine erişemez                   │
│  - Dinamik <script src="injected.js"> oluşturup DOM'a ekler ve siler   │
│  - Dinamik  oluşturup DOM'a ekler ve siler   │
│  - data-logo-url ile SVG logo adresini Main World'e aktarır            │
│  - postMessage köprüsü ile haberleşir                                  │
└───────────────────────────────────┬────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────┐
│               MAIN WORLD ENGINE (injected.js)                          │
│  - Sayfanın gerçek window nesnesinde çalışır                           │
│  - window.IVSPlayer, window.videojs, React Fiber DOM düğümlerine erişir│
│  - XMLHttpRequest.prototype.open ve window.fetch'i sarmalar            │
│  - Web Audio API (AudioContext) düğümlerini yönetir                    │
│  - Sürüklenebilir, Fullscreen uyumlu Cyberpunk HUD DOM'unu basar       │
│  - Web Audio API, CSS Filter, Harici Altyazı ve Kısayolları yönetir    │
└────────────────────────────────────────────────────────────────────────┘
```

### Katmanların Görev Dağılımı:
1. **`background.js` (Service Worker):**
   - Tamamen **stateless** (durumsuz) çalışır.
   - Hiçbir persistent dinleyici veya arka plan deposu tutmaz.
   - Kullanıcı tarayıcı araç çubuğundaki eklenti ikonuna bastığında `activeTab` yetkisiyle hedef sekmeye `injected.css` ve `content.js` dosyalarını enjekte eder.
2. **`content.js` (Isolated World Content Script):**
   - Sayfa yüklendiğinde (`document_start` veya manuel tıklamada) `injected.js` dosyasını `web_accessible_resources` üzerinden bir `<script>` etiketi olarak sayfanın `document.head` veya `documentElement` alanına basar.
   - Script yüklendiğinde `<script>` etiketini DOM'dan anında temizler (`this.remove()`), böylece DOM kirletilmez fakat JS çalışma zamanı bellekte çalışmayı sürdürür.
   - İkona tekrar tıklandığında `postMessage` ile HUD penceresini açar/kapatır (`PVC_TOGGLE_POPUP`).
3. **`injected.js` (Main World Engine):**
   - Sistemin beynidir (~3600 satır).
   - Sayfanın prototiplerini ve ağ trafiğini manipüle eder.
   - HUD DOM yapısını, sürükleme matematiğini, akordeon menüleri, slider etkileşimlerini ve platform adaptörlerini yönetir.
```

---

## 3. 🎯 Tasarım ve Mühendislik Tercihleri: Neyi Neden Tercih Ettik?
## 3. 🎯 Tasarım ve Mühendislik Tercihleri

| Tercih Edilen Yaklaşım | Neden Tercih Edildi? (Gerekçe & Avantaj) | Tercih Edilmeyen / Kaçınılan Yaklaşım |
| :--- | :--- | :--- |
| **Sıfır Depolama (Zero Storage / Stateless)** | Kullanıcı gizliliği (sıfır ayak izi), platformların depolama kotalarına takılmama, sekme kapatıldığında sıfır kalıntı bırakma ve bellek sızıntısını önleme. | `localStorage`, `sessionStorage`, `chrome.storage`, `IndexedDB`, `cookies`. |
| **Evrensel Enjeksiyon & Minimum Yetki (Content Script `<all_urls>` + Sıfır `host_permissions`)** | Herhangi bir web sitesinde video açıldığında kullanıcıyı kısıtlamamak için `content_scripts.matches` alanında `<all_urls>` kullanılır. Ancak tehlikeli `host_permissions` ve depolama izinleri bilinçli olarak **eklenmemiştir**; yalnızca `activeTab` ve `scripting` kullanılır. Bu sayede hem evrensel erişim sağlanır hem de mağaza güvenlik incelemelerinden hızla geçer. | Dar domain listesi (başka sitelerde eklentinin hiç açılmaması) veya gereksiz `host_permissions` / `storage` izinleri istemek. |
| **Main World Doğrudan Enjeksiyon** | React Fiber ağaçları (`__reactFiber$`), Amazon IVS SDK (`window.IVSPlayer`), Clappr ve Video.js değişkenleri Isolated World'den okunamaz. Main World ile sıfır gecikmeli doğrudan nesne manipülasyonu yapılır. | Yalnızca Content Script kullanarak `postMessage` ile veri kopyalamaya çalışmak (büyük gecikme ve prototip erişim kaybı). |
| **Ağ Kancası ile HLS Yönlendirmesi** | TRT ve Now TV gibi sitelerde oynatıcı arayüzünde kalite seçimi gizlenmiş veya devre dışı bırakılmış olabilir. `XHR` ve `fetch` seviyesinde m3u8 isteklerini `master1080p`ye zorlamak oynatıcıdan bağımsız kesin çözüm sağlar. | Oynatıcının kapalı/şifreli UI menülerini kırmaya çalışmak. |
| **React Fiber 0ms Hook Caching (Kick)** | Kick.com'da her ses butonuna basıldığında tüm DOM ağacında derin BFS (Breadth-First Search) taraması yapmak 100-300ms UI takılmalarına yol açıyordu. Hook dispatch referansları modül seviyesinde önbelleklenerek tıklama maliyeti **0ms**'ye indirildi. | Her tıklamada DOM'u baştan aşağı taramak. |
| **Olay İzolasyonu (`stopPropagation`)** | TRT 1 ve Kick gibi gelişmiş oynatıcılar, video alanı üzerindeki tüm `click`, `mousedown` ve `pointerdown` olaylarını kendi özel kontrollerine veya duraklatma mekanizmasına bağlar. HUD üzerindeki tüm olaylarda `e.stopPropagation()` kullanılarak bu çakışma önlendi. | Olayların video kapsayıcısına kabarmasına (bubble up) izin vermek. |
| **2 Kademeli Hareketsizlik Saydamlığı** | Kullanıcı film/yayın izlerken HUD ekranda kalıcı yer kaplamamalıdır. 2s sonra %88 saydam (`opacity: 0.12`), 4s sonra tamamen transparan (`opacity: 0`). Fare oynatıldığında anında uyanır. | Sabit opak panel veya kullanıcıyı sürekli kapatıp açmaya zorlayan arayüz. |
| **Dinamik Fullscreen DOM Taşıma** | Tarayıcıda bir video tam ekrana geçtiğinde (`requestFullscreen`), `body` içindeki normal öğeler gizlenir. HUD dinamik olarak `document.fullscreenElement` içine taşınarak tam ekranda da kesintisiz çalışması sağlandı. | Tam ekranda kaybolan statik DOM yapıları. |
| **Sıfır Depolama (Zero Storage / Stateless)** | Kullanıcı gizliliği, sekme kapatıldığında sıfır kalıntı bırakma ve bellek sızıntısını önleme. | `localStorage`, `sessionStorage`, `chrome.storage`, `IndexedDB`, `cookies`. |
| **Firefox & Chromium Ortak Manifest** | `background` alanında hem `service_worker` hem `scripts` tanımlanarak tek kod tabanıyla her iki tarayıcı ailesinde çalışma sağlanır. | Yalnızca tek tarayıcıya özgü manifest yapısı. |
| **Evrensel Enjeksiyon & Minimum Yetki** | `content_scripts.matches: ["<all_urls>"]` ile her sitede çalışır; `host_permissions` istenmez, yalnızca `activeTab` ve `scripting` kullanılır. | Gereksiz `host_permissions` veya `storage` izinleri istemek. |
| **React Fiber 0ms Hook Caching (Kick)** | Hook dispatch referansları modül seviyesinde önbelleklenerek tıklama maliyeti **0ms**'ye indirildi. | Her tıklamada DOM'u baştan aşağı taramak. |
| **Olay İzolasyonu (`stopPropagation`)** | HUD üzerindeki tüm etkileşimlerde ve klavye kısayollarında `e.stopPropagation()` kullanılarak yerel oynatıcı çakışmaları önlendi. | Olayların video kapsayıcısına kabarmasına izin vermek. |

---

## 4. ⚙️ Bileşenler ve Derinlemesine Çalışma Detayları

### 4.1 Ağ Seviyesi İstek Yönlendirme Motoru (`transformStreamRequestUrl`)
`XMLHttpRequest.prototype.open` ve `window.fetch` fonksiyonları monkey-patch edilerek gelen akış URL'leri analiz edilir:
- **TRT 1 & TRT İzle (`cdn-v.pr.trt.com.tr`):**  
  İstek URL'sinde `master` veya `.m3u8`/`.ts` geçtiğinde, hedef kalite etiketi (`targetTrtQualitySuffix`) aktifse URL regex ile değiştirilir:
  ```javascript
  const regex = /master(1080p|720p|576p|480p|360p|240p)?/i;
  return url.replace(regex, `master${targetTrtQualitySuffix}`);
  ```
  Kalite değiştirildiğinde oynatıcının donmasını engellemek için `video.currentTime += 0.001` mikro-sarma tampon tazelemesi tetiklenir.
- **Now TV / Fox (ErCDN BVR):**  
  ErCDN SMIL akışlarında segment veya manifest isteklerine `bvr_bw=5500000` (veya seçilen profil değeri) enjekte edilerek CDN'in en yüksek bitrate segmentlerini göndermesi sağlanır.
- **PuhuTV (DYG Video API):**  
  `dygvideo.dygdigital.com/api/video_info` istekleri yakalanır. 1080p FHD seçildiğinde Akamai yerine MNCDN rotasını zorlamak için URL'deki `akamai=true`, `akamai=false` yapılır.

---

### 4.2 Web Audio API Ses Motoru
Standart HTML5 video ses seviyesi en fazla `%100` olabilir. NOk Video Controller bu sınırı aşmak için `AudioContext` kullanır:
```javascript
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(video);
const gainNode = audioCtx.createGain();
const splitter = audioCtx.createChannelSplitter(2);
const merger = audioCtx.createChannelMerger(2);
```
- **%400 Ses Yükseltme:** `gainNode.gain.value = percent / 100` formülüyle 4.0 katına kadar temiz dijital kazanç sağlanır.
- **Stereo <-> Mono Geçişi:**
  - *Stereo:* Sol ve sağ kanallar bağımsız bağlanır.
  - *Mono:* Sol kanal iki çıkışa birden birleştirilir (`merger.connect(...)`), böylece tek taraflı bozuk sesler veya düşük diyaloglar dengelenir.
- **CORS & Çoklu Bağlantı Koruması:**
  - `WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>` kullanılarak aynı video elemanına birden fazla `createMediaElementSource` çağrıldığında fırlatılan `"already connected"` hatası önlenir.
  - Video sunucusu CORS başlığı göndermiyorsa (`CORS Taint`), Web Audio API sessizliğe düşebilir; bu durum `try/catch` ile yakalanıp doğrudan `video.volume` kontrolüne düşülür (graceful degradation).

---

### 4.3 Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline - v0.5.1)
`XMLHttpRequest.prototype.open` ve `window.fetch` sarmalanarak gelen akış URL'leri analiz edilir:
- **TRT 1 & TRT İzle (`cdn-v.pr.trt.com.tr`):** `master(1080p|720p|576p|480p|360p|240p)?` regex eşleşmesiyle hedef kaliteye yönlendirilir ve `0.001s` mikro-sarma ile tampon tazelenir.
- **Now TV / Fox (ErCDN BVR):** Segment ve manifest isteklerine `bvr_bw` bant genişliği parametresi eklenir.
- **PuhuTV (DYG Video API):** 1080p FHD seçildiğinde `akamai=true` parametresi `akamai=false` yapılarak MNCDN rotasına yönlendirilir.

Sistem artık statik bir adaptör listesi yerine, 3 kademeli hiyerarşik ve kendini doğrulayan (self-healing / health-probed) bir boru hattı mimarisi kullanmaktadır:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NOk Video Controller Core                       │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Evrensel Medya & Shadow DOM BFS Tarayıcısı                 │
│  ├─ DOM + Açık/Kapalı Shadow Root'lar + Same-Origin iframes            │
│  ├─ Video Puanlama: (Oynatılan > Sesi Açık > En Geniş Piksel Alanı)    │
│  └─ DRM Sentinel: (video.mediaKeys, encrypted event, Widevine/FairPlay)│
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Basamaklı Yürütme Hattı (Cascade)                 │
│                                                                        │
│  [Kullanıcı Tercihi (Manuel Override)?] ──► Seçilen Adaptör            │
│                       │ Yok                                            │
│                       ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 1: Siteye Özel Adaptörler (Kick, TRT, Now TV, PuhuTV)        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│       │ Eşleşti mi & probeAdapterHealth Başarılı mı?                   │
│       ├─► EVET ──► Aktif Et                                            │
│       └─► HAYIR ──┐ (Sessiz Fallback)                                  │
│                   ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 2: Oynatıcı Kütüphaneleri (YouTube, Video.js, Hls.js, Shaka)│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│       │ Eşleşti mi & probeAdapterHealth Başarılı mı?                   │
│       ├─► EVET ──► Aktif Et                                            │
│       └─► HAYIR ──┐ (Sessiz Fallback)                                  │
│                   ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 3: Evrensel HTML5 & Shadow DOM Standart Adaptör             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│       │ Video Mevcut mu?                                               │
│       ├─► EVET ──► Standart Hız / Ses / Sarma Kontrolleri              │
│       └─► HAYIR ──┐                                                    │
│                   ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 4: Kullanıcı Uyarısı & Tek Tıkla Sıfır-PII Teşhis Raporu    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```
### 4.2 Web Audio API Ses Motoru (%300 Booster & Stereo/Mono)
- **%300 Ses Yükseltme:** `GainNode` üzerinden `validPercent / 100` çarpanıyla maksimum `3.0x` (%300) dijital kazanç sağlanır.
- **Görsel Kazanç (Gain) Renk Geçişi:** Ses slider'ı `%0–100` aralığında Cyan (`#38bdf8`), `%101–200` aralığında Amber (`#f59e0b`), `%201–300` aralığında Rose (`#f43f5e`) rengine bürünür.
- **Stereo <-> Mono Geçişi:** `ChannelSplitterNode` ve `ChannelMergerNode` ile kanallar birleştirilir veya ayrılır.

#### Adaptör Kademeleri:
- **Tier 1 (Siteye Özel):**
  - `KickAdapter`: Amazon IVS Player SDK kancaları, React Fiber 0ms önbelleklenmiş hook'lar, Radix UI slider pointer simülasyonu, Kick VOD hız alt menü otomasyonu.
  - `TrtAdapter`: `cdn-v.pr.trt.com.tr` HLS m3u8 regex yönlendirmesi, TRT ses çubuğu ve UI slider eşitlemesi, `playbackRate` kilit koruması.
  - `NowTvAdapter`: ErCDN BVR segment bant genişliği zorlaması (`bvr_bw`).
  - `PuhuTvAdapter`: DYG Video API manipülasyonu ve MNCDN 1080p FHD rotası.
- **Tier 2 (Oynatıcı Kütüphaneleri):**
  - `YouTubeAdapter`: `movie_player` API, `getAvailableQualityLevels` ve `setPlaybackQualityRange`.
  - `VideoJsAdapter`: `player.qualityLevels()`, `player.playbackRate()`.
  - `HlsJsAdapter`: `hls.levels`, `hls.currentLevel` ve `hls.loadLevel`.
  - `ShakaPlayerAdapter`: `shaka.getVariantTracks()`, `shaka.selectVariantTrack()`, ABR bypass.
  - `DashJsAdapter`: `dashjs.MediaPlayer` bitrate seçimi.
- **Tier 3 (Evrensel HTML5 & Shadow DOM):**
  - `GenericAdapter`: Standart veya Shadow DOM içindeki her `<video>` elemanı için 0.25x-3.0x oynatma hızı, ses düzeyi, 4 kademeli sarma (-30s, -10s, +10s, +30s) ve gerçek çözünürlük ölçümü.
### 4.3 Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline)
1. **Kullanıcı Tercihi (`userForcedAdapterName`):** Manuel seçilen adaptör varsa önceliklidir.
2. **Tier 1 (Siteye Özel):** `KickAdapter`, `TrtAdapter`, `NowTvAdapter`, `PuhuTvAdapter`.
3. **Tier 2 (Oynatıcı Kütüphaneleri):** `YouTubeAdapter`, `VideoJsAdapter`, `HlsJsAdapter`, `ShakaPlayerAdapter`, `DashJsAdapter`.
4. **Tier 3 (Evrensel HTML5 & Shadow DOM):** `GenericAdapter` + `deepFindMediaElements()` BFS tarayıcısı.

---
### 4.4 DRM / EME Korumalı İçerik Tespiti & Güvenli Mod
- `video.mediaKeys`, `encrypted` olayı ve `webkitKeys` kontrol edilir.
- DRM algılandığında donanım ses kesintisini önlemek amacıyla Web Audio API devre dışı bırakılır ve yerel `video.volume` (%0–%100) kullanılır.

### 4.4 Kök Neden Analizi: "Programımız Neden Her Sitede Açılmıyordu?"
1. **Manifest V3 İzin Kısıtlaması (`content_scripts.matches`):**  
   Önceki sürümlerde içerik betiği sadece 9 alan adıyla (`*.nowtv.com.tr`, `*.kick.com`, `*.trt1.com.tr` vb.) sınırlandırılmıştı. Başka sitelerde `content.js` açılışta hiç enjekte edilmiyordu.  
   *Çözüm (v0.5.1):* `<all_urls>` evrensel eşleşmesi tanımlandı; kullanıcı araç çubuğu ikonuna bastığında da anında kancalar devreye sokulur.
2. **Shadow DOM İzolasyonu:**  
   YouTube, Reddit, Twitter/X, Mux ve modern Web Component oynatıcıları `<video>` etiketini ana `document` içine değil, bileşenin Shadow Root'u (`#shadow-root`) içine gizler. `document.querySelectorAll('video')` bu öğeleri göremez.  
   *Çözüm (v0.5.1):* Özyinelemeli `deepFindMediaElements()` BFS tarayıcısı ile tüm açık/kapalı Shadow DOM ağaçları taranarak gizli videolar yakalanır.
3. **DRM / EME Şifrelemesi:**  
   Netflix, Spotify ve korumalı yayınlarda Web Audio API bağlandığında tarayıcının donanım seviyesindeki ses koruması sesi susturur.  
   *Çözüm (v0.5.1):* `detectDrmStatus()` ile DRM otomatik tanınır ve güvenli modda çalıştırılır.
4. **Çapraz Kaynaklı (Cross-Origin) iframe:**  
   Gömülü oynatıcılar farklı bir domainden iframe ile yüklendiğinde tarayıcının güvenlik modeli (Same-Origin Policy) ana sayfadan iframe içine erişimi engeller.  
   *Çözüm (v0.5.1):* Same-origin iframe'ler taranır; erişilemeyen cross-origin durumlarda kullanıcıya tek tıkla teşhis ve raporlama olanağı verilir.
### 4.5 Canlı Çözünürlük Rozeti & Sıfır-PII Teşhis Raporlama
- `video.videoWidth` ve `video.videoHeight` izlenerek gerçek render çözünürlüğü rozete yazılır.
- `sanitizeStreamUrl` ile tüm kimlik doğrulama parametreleri (`token`, `st`, `hdnts`, `sig`) maskelenir; son 40 log kaydı `DIAGNOSTIC_LOG_BUFFER` içinde tutulur.

---
### 4.6 İzole Klavye Kısayolları Motoru (v0.5.2)
- `isEditableTarget()` kontrolü sayesinde kullanıcı `INPUT`, `TEXTAREA`, `SELECT` veya `isContentEditable` alanlarında (sohbet/arama kutusu) yazı yazarken kısayollar tetiklenmez.
- Desteklenen tuşlar: `[` / `]` (‡0.25x hız), `R` (1.0x hız sıfırlama), `M` (Stereo/Mono), `Shift + ↑/↓` (±%10 ses), `Alt + Q` (sonraki kalite), `Alt + P` (PiP aç/kapat), `Ctrl + Shift + S` (HUD aç/kapat).

### 4.5 DRM / EME Korumalı İçerik Tespiti & Güvenli Mod (Graceful Degradation)
- **Tespit:** `video.mediaKeys`, `encrypted` olayı ve `WebKitMediaKeys` varlığı izlenir.
- **Reaksiyon:** EME algılandığında Web Audio API (`createMediaElementSource`) **bilinçli olarak bypass edilir**; ses yerel `video.volume` (%100) üzerinden yürütülür.
- **Kullanıcı Geri Bildirimi:** HUD üzerinde `🛡️ DRM Korumalı Akış` rozeti çıkar; tıklandığında *"Bu içerik platform tarafından şifrelenmiştir. Donanım koruması gereği harici ses güçlendirici sınırlandırılmış olup, temel ses, oynatma hızı ve sarma kontrolleri tam aktiftir"* bilgilendirmesi sunulur.
### 4.7 Görüntü Filtreleri ve Gece Kalkanı Modülü (v0.5.2)
- Aktif `<video>` elemanının `style.filter` özelliğine `brightness(50%–150%)`, `contrast(50%–150%)`, `saturate(0%–200%)`, Gece Kalkanı (`sepia(38%) brightness(88%) contrast(95%)`) ve Ters Renk (`invert(100%) hue-rotate(180deg)`) uygulanır.
- Tüm slider'lar üzerine çift tıklandığında (`dblclick`) varsayılan değere (`%100` / `1.0x`) sıfırlanır.

---
### 4.8 Bellek İçi Harici Altyazı (`.srt` / `.vtt`) ve Senkronizasyon (v0.5.2)
- Sıfır depolama kuralına uygun olarak yerel `.srt` veya `.vtt` dosyaları `FileReader` ile doğrudan RAM'e okunur (`parseSrtOrVttContent`).
- Hem özel `#pvc-subtitle-overlay` katmanında hem de yerel `TextTrack` (`VTTCue`) üzerinde gösterilir; `-100ms` / `+100ms` butonlarıyla anlık senkron kaydırma (`subtitleOffsetMs`) yapılır.

### 4.6 Canlı Çözünürlük Rozeti & Kare Takibi
Modern tarayıcılarda `requestVideoFrameCallback` API'si varsa kullanılır (yoksa `timeupdate` ve periyodik timer'a dönülür).
- Video karesinin gerçek çizim piksel boyutu (`video.videoWidth` x `video.videoHeight`) anlık olarak ölçülür.
- Rozette şu formatta gösterilir:  
  `1080p FHD (1920x1080) ~5.5 Mbps` veya `720p HD (1280x720)`.
- Kullanıcı tek tıkla "Yenile" butonuna basarak kaliteyi anında yeniden sorgulayabilir.

---

### 4.5 Sıfır Kişisel Veri (Zero-PII) Teşhis ve Hata Raporlama
Hata veya beklenmeyen durum olduğunda:
1. Son 40 konsol ve adaptör log kaydı bellek içi dizide (`DIAGNOSTIC_LOG_BUFFER`) saklanır.
2. `sanitizeStreamUrl` fonksiyonu ile URL'lerdeki tokenlar (`hdnts`, `token`, `auth`, `signature`, `expires`, `hmac`) silinir veya `[TOKEN_MASKED]` haline getirilir.
3. Teşhis paketi oluşturulur:
   - Tarayıcı User-Agent bilgisi
   - Aktif alan adı (Domain)
   - Oynatıcı tipi ve adaptör adı
   - Video boyutu, mevcut ses ve hız durumu
   - CDN telemetrisi ve son ping süresi
   - **Son 3 sürüm geçmişi** (v0.5.0, v0.4.9, v0.4.8 - JSON şişmesini önlemek için sadeleştirildi)
   - Kullanıcının yazdığı serbest not
4. Kullanıcıya şık bir modal içinde JSON'u kopyalama veya doğrudan geliştiriciye (`ihsanartrk07@gmail.com`) e-posta hazırlama bağlantısı (`mailto:`) sunulur.

### 4.7 İzole Klavye Kısayolları Motoru: INPUT, TEXTAREA, SELECT ve isContentEditable odak kontrolü ile sohbet/arama kutularında tetiklenmeyen, e.stopPropagation() ile site kısayollarıyla çakışmayan kısayol motoru ([, ], R, M, Shift + ↑/↓, Alt + Q, Alt + P, Ctrl + Shift + S).

### 4.8 Görüntü Filtreleri ve Gece Kalkanı: Aktif <video> elemanına CSS filter üzerinden uygulanan Parlaklık (%50–%150), Kontrast (%50–%150), Doygunluk (%0–%200), Gece Kalkanı (sepia + brightness) ve Ters Renk (invert + hue-rotate) motoru.

### 4.9 Bellek İçi Harici Altyazı (.srt / .vtt) ve Senkronizasyon: Sıfır depolama ilkesine uygun olarak FileReader ile RAM'de ayrıştırılan altyazı motoru ve ±100ms canlı zaman kaydırma (offset) mekanizması.

### 4.10 %300 Web Audio Ses Güçlendirici, Gain Renk Geçişi & Çift Tıkla Sıfırlama: Maksimum ses kazancının %300 (GainNode 3.0x) olarak sabitlenmesi; %0–100 (Cyan), %101–200 (Amber), %201–300 (Rose) görsel renk geçişi ve tüm slider'larda dblclick ile varsayılana sıfırlama.

### 4.11 Mıknatıslı Kenar Hizalama (Magnetic Edge Snapping) & Viewport Clamping: HUD sürüklenirken pencere kenarlarına 16px mesafede mıknatıslı yapışma ve pencere boyutu değiştiğinde ekran dışına taşmayı önleyen clampPopupToViewport koruması.

### 4.12 Küçültülmüş (Collapsed Mini-Pill) Detaylı Bilgi Barı & Doğrudan PiP Kontrolü: Panel daraltıldığında çözünürlük, hız, ses, kanal ve adaptör bilgisini gösteren özet bar ile tek tıkla PiP kontrolü.
### 4.9 Mıknatıslı Kenar Hizalama, Küçültülmüş Özet Bar & Doğrudan PiP (v0.5.2)
- **Magnetic Edge Snapping:** HUD sürüklenirken pencere kenarlarına `16px` (`SNAP_THRESHOLD`) yaklaştığında kenara mıknatıslı yapışır ve `clampPopupToViewport` ile ekran dışına taşması engellenir.
- **Küçültülmüş (Collapsed) Özet Bar:** Panel küçültüldüğünde (`#pvc-collapsed-summary-bar`) anlık çözünürlük, hız, ses, adaptör bilgisi ve `-10s`, `Oynat/Duraklat`, `+10s`, `PiP` hızlı butonları gösterilir.
- **Doğrudan PiP Kontrolü:** Kontrolcüyü PiP penceresine taşımadan, mevcut penceredeki HUD üzerinden `requestPictureInPicture` / `exitPictureInPicture` yönetilir.

---

## 5. 📊 Sürüm Evrimi ve Çözülen Kritik Problemler

### v0.5.0 (Mevcut Kararlı Sürüm)
- **Kick.com Ses Senkronizasyonu & Mute Çözümü:** Ses seviyesi %0'dan %50, %100 veya %150'ye alındığında Kick mute butonunun sentetik PointerEvent ile açılması ve Radix UI Slider izine pointer simülasyonu eklendi.
- **TRT 1 / TRT İzle HUD Olay İzolasyonu:** TRT oynatıcı katmanlarının buton tıklamalarını yutması `e.stopPropagation()` ile engellendi. Teşhis, CDN Ping, İzinler ve akordeon butonları TRT üzerinde %100 çalışır hale getirildi.
- **Hareketsizlik Timer Düzeltmesi:** Fare oynatıldığında HUD'un anında %100 opaklığa dönmesi sağlandı (`pvc-idle-semi` ve `pvc-idle-hidden` temizliği).
- **Sadeleştirilmiş Teşhis JSON Paketi:** Teşhis modalındaki sürüm geçmişi yalnızca son 3 versiyonu içerecek şekilde hafifletildi.
### v0.5.2 (Mevcut Kararlı Sürüm)
- **İzole Klavye Kısayolları Motoru:** Yazı alanlarını dışlayan ve `e.stopPropagation()` ile izole edilen kısayol sistemi eklendi.
- **Görüntü Filtreleri & Gece Kalkanı:** Parlaklık, kontrast, doygunluk, gece modu ve ters renk kontrolleri eklendi.
- **Bellek İçi Harici Altyazı Motoru:** `.srt`/`.vtt` RAM içi ayrıştırıcı ve `±100ms` senkronizasyon eklendi.
- **%300 Ses Booster, Gain Renk Geçişi & Çift Tıkla Sıfırlama:** Ses üst sınırı %300 olarak yapılandırıldı; dinamik slider renk geçişi ve çift tıkla sıfırlama eklendi.
- **Mıknatıslı Kenar Hizalama, Küçültülmüş Detaylı Bar & PiP:** 2D mıknatıslı sürükleme, viewport sınır koruması, küçültülmüş özet bar, doğrudan PiP kontrolü ve vektörel `nok-logo.svg` entegrasyonu tamamlandı.
- **Saf WebExtension Temizliği:** AI Studio simülasyon/sunucu dosyaları (`index.html`, `server.js`, `package.json`, `bun.lock`, `.env.example`, `metadata.json`, `popup.*`, `test.zip`) kaldırıldı ve `SITE_COMPATIBILITY.md` eklendi.

### v0.4.9
- **Kick.com 0ms React Fiber Caching:** React hook dispatch ve setter fonksiyonları önbelleğe alınarak buton tıklamalarındaki UI donması tamamen giderildi.
- **TRT 1 / TRT İzle CDN-V HLS Yönlendirmesi:** `cdn-v.pr.trt.com.tr` üzerindeki HLS manifest ve segment yönlendirmeleri tamamlandı; 0.001s mikro-sarma tampon tazelemesi eklendi.
- **TRT 1 Ses Çubuğu ve 1x Hız Kilit Koruması:** TRT oynatıcısının ses barlarının ve hız sıfırlamasının kontrol altına alınması sağlandı.
### v0.5.1
- **Evrensel Medya Tespiti & Shadow DOM Derin Taraması:** `<all_urls>` desteği ve `deepFindMediaElements` BFS tarayıcısı eklendi.
- **DRM / EME Güvenli Modu & 3-Kademeli Basamaklı Adaptör Hattı:** `detectDrmStatus` ve `resolveCascadeAdapter` mimarisi devreye alındı.

### v0.4.8
- **Kick.com Next.js Rota İzolasyonu:** React Fiber ağacı taranırken Next.js router state'ine temas edilmesi sonucu oluşan 404 yönlendirme hatası giderildi.
- **TRT Özel HLS Adaptörü:** TRT 1 ve TRT İzle için özel adaptör sınıfı oluşturuldu.
### v0.5.0
- **Kick.com Ses Senkronizasyonu & TRT 1 HUD Olay İzolasyonu:** Radix UI Slider simülasyonu ve `e.stopPropagation()` izolasyonu tamamlandı.

---

## 6. ⚠️ Güncel Zorluklar, Bilinen Sınırlar ve Edge Cases

Gelecekteki geliştiricilerin veya dil modellerinin bilmesi gereken teknik hassasiyetler:
## 6. ⚠️ Güncel Zorluklar ve Bilinen Sınırlar

1. **Cross-Origin iframe İzolasyonu:**
   - Eğer video oynatıcı ana sayfada değil de üçüncü taraf bir `iframe` içinde barındırılıyorsa (`cross-origin`), Same-Origin Policy gereği ana pencere iframe içindeki video etiketine erişemez.
   - *Çözüm:* `manifest.json` içindeki `all_frames: true` ayarı sayesinde eklenti iframe'lerin içine de bağımsız olarak enjekte olur ve her çerçevenin kendi video kontrolcüsü çalışır.
2. **DRM Korumalı İçerikler (Widevine / FairPlay / PlayReady):**
   - EME (Encrypted Media Extensions) ile korunan şifreli akışlarda URL'yi başka bir kalite seviyesine zorlamak doğrudan çalışmayabilir (şifre çözme anahtarı belirli bir çözünürlük lisansına bağlı olabilir).
   - Bu durumlarda ağ manipülasyonu yerine oynatıcının dahili kalite seçim API'leri (`hls.levels`, `player.getQualityLevels()`) tercih edilmelidir.
3. **Web Audio API CORS Taint:**
   - Video akışını sağlayan CDN sunucusu `Access-Control-Allow-Origin: *` başlığı döndürmezse, tarayıcı `createMediaElementSource(video)` çağrıldığında güvenlik gereği sesi susturabilir.
   - Bu yüzden ses motoru her zaman `try/catch` içinde başlatılır ve hata durumunda standart `video.volume` kontrolüne sessizce geri düşülür.
4. **SPA (Tek Sayfa Uygulamaları) Rota Geçişleri:**
   - Kick, YouTube veya PuhuTV gibi sitelerde kullanıcı sayfa yenilemeden başka bir videoya geçtiğinde (Next.js / React Router geçişi), eski video DOM'dan silinir ve yeni bir video gelir.
   - Bu nedenle `MutationObserver` ve `setInterval(detectActiveVideo, 1500)` mekanizması sürekli tetikte kalarak yeni videoyu anında tespit eder ve ses grafiğini ona bağlar.
1. **Cross-Origin iframe İzolasyonu:** Üçüncü taraf `iframe` içindeki videolara ana pencereden doğrudan erişilemez; `manifest.json` içindeki `all_frames: true` sayesinde eklenti her çerçeveye bağımsız enjekte olur.
2. **DRM Korumalı İçerikler:** EME şifreli akışlarda donanım ses kesintisini önlemek için Web Audio API (`%300` booster) bypass edilir.
3. **Firefox PiP API Farkı:** Chromium tarayıcılar `video.requestPictureInPicture()` API'sini desteklerken, Firefox güvenlik/tasarım tercihi olarak bu standart JS metodunu web sayfalarına açmayabilir; kodda güvenli kontrol (`typeof video.requestPictureInPicture === 'function'`) mevcuttur.

---

## 7. 🚀 Gelecek Yol Haritası ve Eklenecek Özellikler (Roadmap)

Gelecek sürümlerde projeye eklenmesi planlanan özellikler:

### 1. Özelleştirilebilir Klavye Kısayolları (Keybindings Engine)
- Sayfada video odaktayken veya genel sekmeyken çalışacak kısayollar:
  - `[` ve `]`: Oynatma hızını 0.25x azalt / artır.
  - `M`: Stereo / Mono modları arasında geçiş yap.
  - `Shift + Yukarı / Aşağı`: Sesi %10'ar artır / azalt (%400 boost dahil).
  - `Alt + Q`: Kalite seçim menüsünü odakla / sonraki kaliteye geç.
  - `Ctrl + Shift + S`: HUD penceresini gizle / göster.

### 2. Gelişmiş Resim İçinde Resim (Custom Picture-in-Picture / Document PiP)
- Modern Chrome `DocumentPictureInPicture` API'si kullanılarak, video PiP moduna alındığında hız, ses ve kalite kontrollerinin de PiP penceresinde görünür olması.

### 3. Yeni Platform Adaptörleri:
- **Tabii (TRT Tabii):** Tabii platformunun özel HLS/DASH kimlik doğrulama başlıkları ve oynatıcı yapısına özel adaptör.
- **BluTV & Gain & Exxen:** Yerli VoD platformlarının oynatıcı UI ve segment mekanizmaları.
- **Twitch.tv:** Amazon IVS ile benzer köklere sahip olan TTV player API kancaları.

### 4. Video Görüntü Filtreleri (Video Shaders & Filters)
- HUD menüsüne eklenecek "Görüntü Ayarları" akordeon bölümü:
  - Parlaklık (Brightness: %50 - %150)
  - Kontrast (Contrast: %50 - %150)
  - Doygunluk (Saturation: %0 - %200)
  - Gece Modu / Ters Renkler (Invert / Warm Night Shield)
  - CSS `filter: brightness(...) contrast(...)` kancaları.
## 7. 🚀 Gelecek Yol Haritası (Roadmap)

### 5. Harici Altyazı Desteği (External Subtitle Loader & Sync)
- Yerel `.srt` veya `.vtt` dosyasını sürükleyip bırakarak videoya altyazı ekleme.
- `+100ms` / `-100ms` altyazı senkronizasyon kaydırma butonları.
1. **Yeni Tier 1 Platform Adaptörleri:**
   - **Tabii, BluTV, Gain, Exxen:** Yerli VoD platformlarının oynatıcı UI ve kalite seçimi mekanizmalarına özel adaptörler.
   - **Twitch.tv:** Twitch oynatıcı kalite kontrolü için özel Tier 1 adaptörü.
2. **Altyazı Stil Özelleştirmesi:**
   - Harici altyazı katmanının (`#pvc-subtitle-overlay`) yazı boyutu, rengi ve dikey konumunun HUD üzerinden ayarlanabilmesi.
3. **İsteğe Bağlı Tekil Akordeon (Single-Active Accordion) Modu:**
   - Küçük ekranlarda bir akordeon açıldığında diğerinin otomatik kapanması.

---

## 8. 📂 Dosya Ağacı ve Sorumluluk Matrisi

```
NOk-video-controller/
├── manifest.json              
├── background.js              # Service Worker (Minimalist, Stateless, toolbar click ile enjeksiyon)
├── content.js                 # Isolated World scripti (Main World scriptini <script> ile enjekte eder)
├── injected.js                # Main World Engine (HUD DOM, Ağ kancaları, Platform adaptörleri, Web Audio)
├── injected.css               # HUD arayüz stilleri (Cyberpunk/Glassmorphism, saydamlık animasyonları)
├── popup.html                 # Eklenti araç çubuğu popup arayüzü
├── popup.js                   # Popup etkileşim kodu (Hedef sekmeye enjeksiyon tetikler)
├── icons/                     # 16x16, 48x48, 128x128 eklenti ikonları
├── index.html                 # Web tabanlı interaktif testbed ve canlı simülasyon arayüzü
├── server.js                  # Express.js test sunucusu ve ZIP indirme uç noktası (/api/download-zip)
├── package.json               # Proje bağımlılıkları ve npm scriptleri
├── metadata.json              # Google AI Studio ortam metadata yapılandırması
├── README.md                  # Hızlı başlangıç ve repo özeti
└── PROJECT_MASTER_GUIDE.md    # BU DOSYA (Eksiksiz mimari, geçmiş, felsefe ve devir kılavuzu)
```

```text
NOk-video-controller/
├── .github/ISSUE_TEMPLATE/site_support.md
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── site_support.md    # GitHub yeni site destek/hata bildirim şablonu
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── nok-logo.jpg (veya nok-logo.svg)
├── manifest.json
├── background.js
├── content.js
├── injected.js
├── injected.css
├── README.md
├── PROJECT_MASTER_GUIDE.md
└── SITE_COMPATIBILITY.md

- index.html, server.js, package.json, bun.lock, .env.example, metadata.json dosyalarının kaldırılarak projenin saf WebExtension yapısına kavuşturulması ve /SITE_COMPATIBILITY.md dosyasının eklenmesi.
│   ├── icon16.png             # 16x16 araç çubuğu ikonu
│   ├── icon48.png             # 48x48 eklenti yönetim ikonu
│   ├── icon128.png            # 128x128 mağaza/kurulum ikonu
│   └── nok-logo.svg           # Saf vektörel NOkrep organizasyon logosu (HUD başlığı)
├── manifest.json              # Manifest V3 yapılandırması (Firefox scripts + Chromium service_worker)
├── background.js              # Stateless arka plan betiği (Toolbar tıklamasıyla enjeksiyon)
├── content.js                 # Isolated World köprüsü (Main World injected.js enjektörü)
├── injected.js                # Main World Engine (HUD, Adaptörler, Web Audio, Filtre, Altyazı, Kısayollar)
├── injected.css               # HUD arayüz stilleri (Glassmorphism, Gain renkleri, Mini-Bar, Mıknatıs efekti)
├── README.md                  # Hızlı kurulum ve proje özeti
├── SITE_COMPATIBILITY.md      # Katı kurallı site uyumluluk ve durum takip tablosu
└── PROJECT_MASTER_GUIDE.md    # BU DOSYA (Eksiksiz mimari, geçmiş ve devir kılavuzu)

---
```

## 9. 🔄 Geliştirici Devir & Yeni Konuşmaya Taşıma Kılavuzu
---

Eğer projeyi yeni bir yapay zeka modeline, başka bir konuşmaya veya yeni bir yazılımcıya devrediyorsanız, aşağıdaki kontrol listesini ve prompt şablonunu kullanabilirsiniz:
## 9. 🔄 Geliştirici Devir & Kodlama Kuralları

### Yeni Konuşmayı Başlatırken Kullanılacak Prompt Şablonu:
```text
NOk Video Controller projesini geliştirmeye devam ediyoruz (Mevcut kararlı sürüm: v0.5.1).
Projenin tam mimarisi, tasarım tercihleri, 3 kademeli Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline), DRM/EME tespit motoru ve dosya ağacı `/PROJECT_MASTER_GUIDE.md` dosyasında eksiksiz belgelenmiştir.

Bu projede dikkat edilmesi gereken katı kurallar:
1. SIFIR DEPOLAMA (Stateless): localStorage, sessionStorage, chrome.storage veya cookies KESİNLİKLE kullanılmaz. Tüm durum bellek içi (in-memory) değişkenlerde tutulur.
2. SIFIR HOST İZNİ: host_permissions eklenmez; activeTab ve scripting yetkisi yeterlidir.
3. 3 KADEMELİ BASAMAK HATTI (Cascade Pipeline): Tier 1 (Siteye özel), Tier 2 (Oynatıcı kütüphaneleri: YouTube, Video.js, Hls.js, Shaka, Dash.js), Tier 3 (Evrensel HTML5 & Shadow DOM). Bu hiyerarşi ve sağlık kontrolü (probeAdapterHealth) bozulmamalıdır.
4. DRM / EME GÜVENLİ MODU: Şifreli akışlarda (Widevine/FairPlay) Web Audio API booster atlanmalı, yerel ses ve oynatma kontrolleri korunmalıdır.
5. KICK.COM OPTİMİZASYONU: 0ms React Fiber hook önbelleklemesi korunmalıdır.
6. OLAY İZOLASYONU: HUD üzerindeki tüm etkileşimlerde e.stopPropagation() korunmalıdır.

Lütfen ilk olarak PROJECT_MASTER_GUIDE.md dosyasını incele ve [BURAYA YAPMAK İSTEDİĞİNİZ YENİ ÖZELLİK VEYA DÜZELTMEYİ YAZIN] konusunda çalışmaya başla.
```
### Kırmızı Çizgiler:

### Kodlama ve Geliştirme Kuralları (Kırmızı Çizgiler):
1. **Sıfır Depolama Kuralı:** Asla kalıcı depolama eklemeyin. Ayarlar bellek içinde (`injected.js` içindeki JS değişkenlerinde) tutulur; sekme yenilendiğinde sıfırlanması projenin bilinçli mimari tercihidir.
2. **Konsol Kirliliği:** Kod içerisine periyodik `console.log` basmayın; loglama yalnızca `addDiagnosticLog` fonksiyonu ile bellek içi ring buffer'a yazılmalıdır.
3. **Sürüm Numaralandırması:** Bir özellik veya düzeltme yapıldığında şu 4 dosyada sürüm numarasını eşitleyin:
   - `manifest.json` (`"version"`)
   - `package.json` (`"version"`)
   - `injected.js` (`EXTENSION_VERSION` ve `VERSION_HISTORY`)
   - `server.js` (`/api/health` ve ZIP dosya adı)
4. **Testbed Senkronizasyonu:** `index.html` dosyasındaki test video ve simülasyon butonlarını güncel tutun.
1. **Sıfır Depolama Kuralı:** `localStorage`, `sessionStorage`, `chrome.storage` veya `cookies` kesinlikle kullanılmaz.
2. **Konsol Temizliği:** Periyodik `console.log` basılmaz; yalnızca `addDiagnosticLog` kullanılır.
3. **Sürüm Eşitlemesi:** Sürüm geçişlerinde `manifest.json` (`"version"`), `injected.js` (`EXTENSION_VERSION` ve `VERSION_HISTORY`), `README.md`, `SITE_COMPATIBILITY.md` ve `PROJECT_MASTER_GUIDE.md` senkronize edilir.
4. **Site Uyumluluk Tablosu Kuralı:** `SITE_COMPATIBILITY.md` içindeki "Tam Çalışıyor" bölümüne geliştirici açıkça talep etmeden hiçbir site eklenmez.

---

*NOk Video Controller bir **NOkrep** açık kaynak projesidir.*

```