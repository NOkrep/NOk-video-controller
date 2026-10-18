# NOk Video Controller — Kapsamlı Proje & Mimari Kılavuzu (Master Architecture & Handover Guide)

> **Sürüm:** v0.5.3 (geliştirme; canlı tarayıcı/site doğrulaması bekliyor)
> **Geliştirici:** NOkrep ([GitHub](https://github.com/NOkrep/NOk-video-controller) | `ihsanartrk07@gmail.com`)  
> **Platform Uyumluluğu:** Firefox (Gecko, 121+) & Chrome, Brave, Edge, Opera (Chromium, 121+) — Manifest V3 WebExtensions  
> **Son Güncelleme:** v0.5.3 (Gizlilik odaklı teşhis şeması v2, sabit olay kodları, güvenli metin önizlemesi ve isteğe bağlı açıklama)

---

## 1. 📌 Yönetici Özeti & Temel Misyon

**NOk Video Controller**, Türkiye'deki ve dünyadaki popüler canlı yayın ile VoD (Video on Demand) platformlarında kullanıcıya video oynatıcı üzerinde eksiksiz hakimiyet sağlayan, **sıfır depolama izinli (Zero-Storage / In-Memory Stateless)**, evrensel uyumluluklu açık kaynaklı bir tarayıcı eklentisidir.

### Temel Yetenekler:
1. **Evrensel Medya ve Shadow DOM Derin Taraması:**
   - `<all_urls>` desteğiyle her sitede çalışma olanağı.
   - Açık Shadow Root'lar, Web Component'ler (`video-js`, `mux-player`, `youtube-video`, `shreddit-player`) ve aynı kökenli iframe'lerdeki `<video>` etiketlerini özyinelemeli BFS ile yakalama.
   - Akıllı Video Puanlama Matrisi: PiP (+200), oynatılan (+120), sesi açık (+40), viewport içinde (+30), büyük alan ve hazır durumda olma puanları ile en uygun videonun seçilmesi.
2. **DRM / EME Korumalı İçerik Tespiti & Güvenli Mod:**
   - Widevine, FairPlay, PlayReady şifrelemeli akışları (`video.mediaKeys`, `encrypted` event) otomatik algılama.
   - Donanım ses susturmasını önlemek için Web Audio API booster'ını güvenli modda atlayıp yerel ses kontrolünü (%100) koruma.
   - HUD üzerinde `🛡️ DRM Korumalı Akış` rozeti ve bilgilendirici kılavuz paneli.
3. **3-Kademeli Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline):**
   - **Tier 1 (Siteye Özel):** Kick.com, TRT 1 / TRT İzle, Now TV, PuhuTV.
   - **Tier 2 (Oynatıcı Kütüphaneleri):** YouTube (`movie_player`), Video.js, Hls.js, Shaka Player, Dash.js.
   - **Tier 3 (Evrensel Standart):** HTML5 & Shadow DOM doğrudan denetimi.
   - Canlı sağlık kontrolü (`probeAdapterHealth`), HUD üzerinden manuel adaptör değiştirme ve kullanıcı kontrollü, gizlilik odaklı JSON teşhis kopyalama.
4. **Ağ Seviyesinde HLS / SMIL / BVR Kalite Kilitleri:**
   - TRT 1 & TRT İzle (`cdn-v.pr.trt.com.tr` üzerinde HLS `master1080p`, `720p`, `576p`, `480p`, `360p` yönlendirmesi).
   - Now TV / Fox (ErCDN BVR segment bant genişliği zorlaması `bvr_bw=...`).
   - PuhuTV (DYG Video API akıllı yönlendirmesi: Akamai vs. MNCDN 1080p FHD SMIL rotası).
5. **Kick.com Derin Entegrasyonu:**
   - Amazon IVS Player SDK erken yakalama (`IVSPlayer.create`, `AmazonIVS.createMediaPlayer`, `attachHTMLVideoElement`).
   - React Fiber (Next.js / Radix UI) hook ve setter fonksiyonlarını **0ms önbellekleme** ile yönetme (UI donması olmadan ses kontrolü).
   - Kick VOD oynatma hızını yerel 2-kademeli ayarlar penceresini (popover sub-menu) otomatik simüle ederek değiştirme.
   - Sessizden (%0) çıkıldığında Radix UI Slider pointer dispatch ve Kick mute butonu PointerEvent tıklaması ile un-mute garantisi.
6. **Web Audio API ile Gelişmiş Ses (%300 Booster & Stereo/Mono):**
   - %0 ile %300 arasında ses yükseltme (`GainNode` max 3.0x) ve dinamik slider renk geçişi (Cyan → Amber → Rose).
   - Stereo ve Mono modları arasında tek tıkla matris geçişi (`ChannelSplitterNode` + `ChannelMergerNode`).
7. **Kesintisiz Oynatma Hızı & 4 Kademeli Sarma:**
   - 0.25x ile 3.0x arasında hız slider'ı, çift tıkla sıfırlama ve TRT gibi oynatıcıların hızı zorla 1x'e sıfırlamasını engelleyen `playbackRate` kilidi.
   - `-30s`, `-10s`, `+10s`, `+30s` ile canlı yayın tamponunda ve VoD içeriklerinde anlık atlama.
8. **Canlı Çözünürlük Rozeti:** Oynatılan videonun anlık render piksel boyutunu (`videoWidth` x `videoHeight`) ve çözünürlük etiketini (4K, 1080p FHD, 720p HD vb.) hesaplayıp rozete basma.
9. **Görüntü Filtreleri, Harici Altyazı ve Klavye Kısayolları (v0.5.2):**
   - Parlaklık, Kontrast, Doygunluk, Gece Kalkanı ve Ters Renk CSS filtreleri.
   - Bellek içi `.srt` / `.vtt` altyazı yükleyici ve `±100ms` senkron kaydırma.
   - Yazı alanlarını dışlayan izole klavye kısayolları motoru.
10. **2-Kademeli Akıllı Saydam HUD, Mıknatıslı Kenar Hizalama & Küçültülmüş Özet Bar (v0.5.2):**
    - 2 saniye hareketsizlikte %88 yarı-saydamlık (`opacity: 0.12`), ek 2 saniye sonra tam görünmezlik (`opacity: 0`). Fare hareketinde veya üzerine gelindiğinde anında %100 netlik.
    - Ekran kenarlarına 16px yaklaşıldığında mıknatıslı yapışma (`pvc-snapped-edge`) ve viewport sınır koruması (`clampPopupToViewport`).
    - Küçültülmüş (Collapsed) modda çözünürlük, hız, ses, adaptör ve hızlı kontrol tuşlarını gösteren detaylı özet bar.
11. **Gizlilik Odaklı Teşhis & Hata Raporlama (v0.5.3):**
    - URL ve konsol metni toplamayan sabit olay şeması; bellekte en fazla 40 olay, raporda son 20 olay. Önizleme, isteğe bağlı açıklama ve kullanıcı kontrollü kopyalama; otomatik gönderim ve mutlak anonimlik iddiası yoktur.

---

## 2. 🏛️ Mimari Tasarım & Çalışma Prensibi

Manifest V3 kısıtlamaları altında hem Firefox (Gecko) hem Chromium tarayıcılarda sayfa içi oynatıcı değişkenlerine erişmek için iki katmanlı hibrit enjeksiyon modeli kullanılmıştır:

```
┌────────────────────────────────────────────────────────────────────────┐
│                  TARAYICI (FIREFOX & CHROMIUM)                         │
├────────────────────────────────┬───────────────────────────────────────┤
│  BACKGROUND SCRIPT / WORKER    │  KULLANICI ETKİLEŞİMİ (Toolbar Click) │
│         (background.js)        │  - activeTab izniyle sekmeyi yakalar  │
│  service_worker (Chromium) +   │  - injected.css & content.js enjekte  │
│  scripts (Firefox)             │                                       │
└────────────────────────────────┴──────────────────┬────────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               ISOLATED WORLD (content.js)                              │
│  - Tarayıcı eklenti API'lerine erişebilir                              │
│  - Sayfanın global window/React nesnelerine erişemez                   │
│  - Dinamik <script src="injected.js"> oluşturup DOM'a ekler ve siler   │
│  - data-logo-url ile logo adresini (icons/nok-logo.svg) Main World'e   │
│    aktarır                                                             │
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
│  - CSS Filter, Harici Altyazı ve Klavye Kısayollarını yönetir          │
│  - Sürüklenebilir, Fullscreen uyumlu Cyberpunk HUD DOM'unu basar       │
└────────────────────────────────────────────────────────────────────────┘
```

### Katmanların Görev Dağılımı:
1. **`background.js` (Service Worker / Background Script):**
   - Tamamen **stateless** (durumsuz) çalışır.
   - Hiçbir persistent dinleyici veya arka plan deposu tutmaz.
   - Kullanıcı tarayıcı araç çubuğundaki eklenti ikonuna bastığında `activeTab` yetkisiyle hedef sekmeye `injected.css` ve `content.js` dosyalarını enjekte eder.
2. **`content.js` (Isolated World Content Script):**
   - Sayfa yüklendiğinde (`document_start` veya manuel tıklamada) `injected.js` dosyasını `web_accessible_resources` üzerinden bir `<script>` etiketi olarak sayfanın `document.head` veya `documentElement` alanına basar.
   - Script yüklendiğinde `<script>` etiketini DOM'dan anında temizler (`this.remove()`), böylece DOM kirletilmez fakat JS çalışma zamanı bellekte çalışmayı sürdürür.
   - Logo adresini `script.dataset.logoUrl` ile Main World'e aktarır.
   - İkona tekrar tıklandığında `postMessage` ile HUD penceresini açar/kapatır (`PVC_TOGGLE_POPUP`).
3. **`injected.js` (Main World Engine):**
   - Sistemin beynidir (~3600 satır).
   - Sayfanın prototiplerini ve ağ trafiğini manipüle eder.
   - HUD DOM yapısını, sürükleme matematiğini, akordeon menüleri, slider etkileşimlerini ve platform adaptörlerini yönetir.

### Firefox & Chromium Ortak Manifest (v0.5.2)
`manifest.json` içinde `background` alanında hem `service_worker` hem `scripts` birlikte tanımlıdır (MDN'nin çapraz tarayıcı önerisi):
- **Chromium:** `service_worker` kullanılır, `scripts` yok sayılır. Chrome 121 öncesinde `scripts` varlığı Manifest V3 eklentisinin yüklenmesini reddettirir; bu yüzden hedef Chrome 121+'dır.
- **Firefox:** `service_worker` desteklenmez, `scripts` kullanılır. Firefox 120 öncesinde `service_worker` varken arka plan sayfası başlamaz; bu yüzden `strict_min_version` `121.0` olarak ayarlıdır.
- Kaynak: MDN `manifest.json/background` — Browser support bölümü (tarayıcı sürümleri değişebilir; güncel MDN sayfasından doğrulayın).

---

## 3. 🎯 Tasarım ve Mühendislik Tercihleri: Neyi Neden Tercih Ettik?

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
| **Firefox & Chromium Ortak Manifest** | `background` alanında hem `service_worker` hem `scripts` tanımlanarak tek kod tabanıyla her iki tarayıcı ailesinde çalışma sağlanır (bkz. Bölüm 2). | Her tarayıcı için ayrı manifest dosyası tutmak veya `scripts` anahtarını silip Firefox arka planını bozmak. |

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

### 4.2 Web Audio API Ses Motoru (%300 Booster & Stereo/Mono)
Standart HTML5 video ses seviyesi en fazla `%100` olabilir. NOk Video Controller bu sınırı aşmak için `AudioContext` kullanır:
```javascript
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(video);
const gainNode = audioCtx.createGain();
const splitter = audioCtx.createChannelSplitter(2);
const merger = audioCtx.createChannelMerger(2);
```
- **%300 Ses Yükseltme:** `gainNode.gain.value = percent / 100` formülüyle 3.0 katına kadar temiz dijital kazanç sağlanır (v0.5.2'de %200'den %300'e çıkarıldı).
- **Görsel Kazanç (Gain) Renk Geçişi:** Ses slider'ı `%0–100` aralığında Cyan (`#38bdf8`), `%101–200` aralığında Amber (`#f59e0b`), `%201–300` aralığında Rose (`#f43f5e`) rengine bürünür.
- **Stereo <-> Mono Geçişi:**
  - *Stereo:* Sol ve sağ kanallar bağımsız bağlanır.
  - *Mono:* Sol kanal iki çıkışa birden birleştirilir (`merger.connect(...)`), böylece tek taraflı bozuk sesler veya düşük diyaloglar dengelenir.
- **CORS & Çoklu Bağlantı Koruması:**
  - `WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>` kullanılarak aynı video elemanına birden fazla `createMediaElementSource` çağrıldığında fırlatılan `"already connected"` hatası önlenir.
  - Video sunucusu CORS başlığı göndermiyorsa (`CORS Taint`), Web Audio API sessizliğe düşebilir; bu durum `try/catch` ile yakalanıp doğrudan `video.volume` kontrolüne düşülür (graceful degradation).

---

### 4.3 Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline - v0.5.1)

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

---

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

---

### 4.5 DRM / EME Korumalı İçerik Tespiti & Güvenli Mod (Graceful Degradation)
- **Tespit:** `video.mediaKeys`, `encrypted` olayı ve `WebKitMediaKeys` varlığı izlenir (`detectDrmStatus`).
- **Reaksiyon:** EME algılandığında Web Audio API (`createMediaElementSource`) **bilinçli olarak bypass edilir**; ses yerel `video.volume` (%0–%100) üzerinden yürütülür.
- **Kullanıcı Geri Bildirimi:** HUD üzerinde `🛡️ DRM Korumalı Akış` rozeti çıkar; tıklandığında *"Bu içerik platform tarafından şifrelenmiştir. Donanım koruması gereği harici ses güçlendirici sınırlandırılmış olup, temel ses, oynatma hızı ve sarma kontrolleri tam aktiftir"* bilgilendirmesi sunulur.

---

### 4.6 Canlı Çözünürlük Rozeti
- Video karesinin gerçek çizim piksel boyutu (`video.videoWidth` x `video.videoHeight`) `resize` ve `timeupdate` olayları ile anlık ölçülür.
- Rozette şu formatta gösterilir: `1080p FHD (1920x1080)` veya `720p HD (1280x720)`.
- Kullanıcı tek tıkla "Yenile" butonuna basarak kaliteyi anında yeniden sorgulayabilir.

---

### 4.7 Gizlilik Odaklı Teşhis ve Hata Raporlama (v0.5.3 / Şema v2)

**Öncelik:** Kullanıcı anonimliği, gizliliği ve güvenliği teşhis ayrıntısından önce gelir. Eski "Sıfır Kişisel Veri" iddiası kaldırılmıştır; maskeleme listesine yeni token adları eklemek yerine gereksiz veriler hiç toplanmaz.

- **Kaydedilmeyenler:** Tam URL, URL yolu/sorgusu, `blob:` kimliği, ham alan adı ve alt alan adı, IP, hesap/kanal/içerik kimliği, altyazı metni/dosya adı, kesin tarih-saat, tam User-Agent/işletim sistemi, ekran/viewport boyutu, izleme konumu ve içerik süresi. Sayfanın `console.warn/error` fonksiyonları artık sarılmaz.
- **Sabit şema:** `reportSchemaVersion: 2`, eklenti sürümü, sınırlı hata kodu, tarayıcı ailesi, oynatıcı/adaptör türü ve adaptör seçim durumu. `adapterSelectionStatus` mevcut seçim değişkeninin anlık değeridir; rapor yeni bir sağlık kontrolü yapmaz ve elle seçilen adaptörün çalıştığını kanıtlamaz. Bilinen platform alan adları yalnızca sabit platform etiketine çevrilir; özel/bilinmeyen alan adları `other` olur. Hash veya kalıcı rapor/kullanıcı kimliği üretilmez.
- **Medya durumu:** `readyState`, `networkState`, çözünürlük sınıfı (SD/HD/FHD/QHD/UHD), kaynak türü (adres içermeyen `blob/http/media-object/none/other`), canlı/VOD/bilinmiyor, duraklatma/sessizlik, istenen ve videodan okunan hız/ses, mevcut ses grafiği durumu, DRM ve altyazı-var/yok bayrakları. Canlı/VOD değeri `duration` üzerinden bir çıkarımdır; süre rapora girmez ve bu sınıflama her akışta kesin değildir. Gain değeri yalnızca seçili video için kaynak oluşturulmuşsa gösterilir; duyulabilir ses kanıtı değildir.
- **Video bulma:** Video adedi ve mevcut belgedeki iframe/erişilemeyen iframe adetleri yalnızca `0`, `1`, `2-4`, `5+` aralıklarıyla belirtilir; iframe adresi okunmaz. Ana sayfa raporu diğer kökendeki iframe motorunun çalıştığını kanıtlamaz.
- **Olay tamponu:** `addDiagnosticLog(level, event, details)` yalnızca `DIAGNOSTIC_EVENT_FIELDS` içindeki sabit olay kodlarını ve olay başına izin verilen sınırlı sayıları kabul eder. Serbest metin, hata nesnesi, iç içe nesne veya bilinmeyen alan tutulmaz. En fazla 40 olay bellekte, son 20 olay raporda; olay yaşı 5 saniye aralıklarıyla ve en fazla 3600 saniye olarak aktarılır.
- **Sonuçların anlamı:** `SPEED_REQUESTED`, `VOLUME_REQUESTED`, `QUALITY_REQUESTED`, `SEEK_REQUESTED` yalnızca isteği belirtir. Kick `reactInvoked/ivsInvoked` alanları çağrının yapıldığını gösterir; UI eşleşmesi veya oynatıcı tarafından kabul edildiği kanıtlanmaz. Kalite `verification` her zaman `not-verified` kalır. Generic/Shaka/Dash adaptörlerinin şu an sabit seçenek sunması `quality.control: not-implemented` olarak belirtilir. Bu sürüm bu adaptörlerin kalite uygulama davranışını değiştirmez.
- **Salt okunur rapor:** `buildDiagnosticPayload` rapor oluştururken ağ isteği, kalite uygulaması, yeni ses grafiği veya `getQualities` çağrısı yapmaz. Mevcut CDN ping özelliği ayrı çalışmaya devam eder; bu açıklama eklentinin tamamının ağ kullanmadığı anlamına gelmez.
- **Arayüz ve paylaşım:** Mevcut modal düzeni korunur. Sorun türü sabit listeden seçilebilir. Serbest açıklama varsayılan kapalıdır; kullanıcı açıkça seçerse en fazla 500 karakter eklenir ve otomatik anonimleştirilmediği belirtilir. Seçim kapatılınca açıklama temizlenir. JSON yalnızca `textContent` ile önizlenir. Clipboard Promise başarısızlığında başarı bildirimi verilmez. Mail/GitHub bağlantıları raporu veya açıklamayı URL'ye gömmez; kullanıcı JSON'u kopyalayıp taslağa kendisi ekler. Otomatik gönderim yoktur.
- **Anonimlik sınırı:** Panel MAIN world/sayfa DOM'unda çalışır; sayfa betikleri paneldeki verileri okuyabilir veya değiştirebilir. Not alanı gizli iletişim kanalı değildir. Kullanıcının notu kişisel bilgi içerebilir, e-posta/GitHub paylaşımı hesap kimliğiyle ilişkilendirilebilir. Kullanıcının kopyaladığı rapor panoda veya paylaşılan hizmette kalabilir; sıfır depolama ilkesi eklentinin kendi durumuna ilişkindir.

**Geçmiş raporlardan değerlendirme (yeniden test edilmedi):**

| Rapor | Kaynakta görülen durum | Sonuç / hâlâ gereken kanıt |
| :--- | :--- | :--- |
| TRT v0.4.8 | 720p isteğine karşın 1080 sınıfı görüntü; kullanıcı hız ve kalite işlemediğini, ses UI'sının eşleşmediğini bildirmiş. | Sonraki sürümlerde düzeltme notları var; güncel canlı test olmadan çözülmüş sayılmaz. |
| Kişisel sunucu v0.5.0 | Video hazır; yalnızca "çalışmıyor" açıklaması ve işlem bildirimleri var. | Hangi kontrolün başarısız olduğu kanıtlanamıyor. Özel sunucu adresi bu belgeye taşınmadı. |
| HDfilmcehennemi v0.5.1 | `NO_VIDEO_FOUND`, `playerType: none`, video durumu yok. | Başlatılmamış oynatıcı/iframe/başka bir neden ayrımı rapordan yapılamıyor. |
| Nepu v0.5.1 | `hlsjs` algısı, GenericAdapter ve sabit kalite listesi; gerçek seçim kanıtı yok. | Kütüphane varlığı çalışan instance/kalite API'si anlamına gelmez. |
| Diziyou v0.5.0 | Seçili video `0x0`, `readyState: 0`, `networkState: 0`; buna rağmen sarma/hız bildirimleri var. | Hazır olmayan/yanlış video olasılığı; oynatma başarısı kanıtlanmıyor. |
| Kick v0.5.2 | Kullanıcı kalite UI eşleşmesinin çalıştığını, hız/ses UI eşleşmesinin çalışmadığını bildirmiş. | Yeni istenen/okunan değerler ve çağrı olayları sonraki incelemeyi destekler; UI sorunu bu sürümde düzeltilmedi. |

Ham raporlar, tokenlar, adresler ve kullanıcıya özgü bilgiler repoya kopyalanmaz. `tests/diagnostics.test.cjs` üretim fonksiyonlarını izole Node/DOM taklidi ortamında çalıştırır; gizli örnek dizelerin dışa çıkmamasını, güvenli önizlemeyi, açıklama seçimini, tampon sınırlarını ve kopyalama hatalarını denetler. Çalıştırma: `node --test tests/diagnostics.test.cjs`. Bu testler gerçek tarayıcı/site doğrulaması değildir.

---

### 4.8 İzole Klavye Kısayolları Motoru (v0.5.2)
- `isEditableTarget()` kontrolü sayesinde kullanıcı `INPUT`, `TEXTAREA`, `SELECT` veya `isContentEditable` alanlarında (sohbet/arama kutusu) yazı yazarken kısayollar tetiklenmez.
- Desteklenen tuşlar: `[` / `]` (±0.25x hız), `R` (1.0x hız sıfırlama), `M` (Stereo/Mono), `Shift + ↑/↓` (±%10 ses, %300'e kadar), `Alt + Q` (sonraki kalite), `Alt + P` (PiP aç/kapat), `Ctrl + Shift + S` (HUD aç/kapat).
- Sitelerin kendi kısayollarıyla çakışmamak için `e.stopPropagation()` kullanılır; kısayollar HUD başlığındaki ⌨️ butonuyla bellek içinde geçici olarak devre dışı bırakılabilir (kalıcı depolama yoktur).

### 4.9 Görüntü Filtreleri ve Gece Kalkanı Modülü (v0.5.2)
- Aktif `<video>` elemanının `style.filter` özelliğine `brightness(50%–150%)`, `contrast(50%–150%)`, `saturate(0%–200%)`, Gece Kalkanı (`sepia(38%) brightness(88%) contrast(95%)`) ve Ters Renk (`invert(100%) hue-rotate(180deg)`) uygulanır.
- CSS filtreleri DRM güvenli modunda da sesi veya şifrelemeyi etkilemez.
- Tüm slider'lar (hız, ses, parlaklık, kontrast, doygunluk) üzerine çift tıklandığında (`dblclick`) varsayılan değere (`%100` / `1.0x`) sıfırlanır.

### 4.10 Bellek İçi Harici Altyazı (`.srt` / `.vtt`) ve Senkronizasyon (v0.5.2)
- Sıfır depolama kuralına uygun olarak yerel `.srt` veya `.vtt` dosyaları `FileReader` ile doğrudan RAM'e okunur (`parseSrtOrVttContent`).
- Hem özel `#pvc-subtitle-overlay` katmanında hem de yerel `TextTrack` (`VTTCue`) üzerinde gösterilir; `-100ms` / `+100ms` butonlarıyla anlık senkron kaydırma (`subtitleOffsetMs`) yapılır.

### 4.11 Mıknatıslı Kenar Hizalama, Küçültülmüş Özet Bar & Doğrudan PiP (v0.5.2)
- **Magnetic Edge Snapping:** HUD sürüklenirken pencere kenarlarına `16px` (`SNAP_THRESHOLD`) yaklaştığında kenara mıknatıslı yapışır ve `clampPopupToViewport` ile ekran dışına taşması engellenir.
- **Küçültülmüş (Collapsed) Özet Bar:** Panel küçültüldüğünde (`#pvc-collapsed-summary-bar`) anlık çözünürlük, hız, ses, adaptör bilgisi ve `-10s`, `Oynat/Duraklat`, `+10s`, `PiP` hızlı butonları gösterilir.
- **Konumlandırma (Ray Modeli):** Normal modda HUD toolbar simgesinin hemen altında (üst `16px`, sağ `16px`) **sağ rayda** açılır ve yalnızca dikey (yukarı/aşağı) hareket eder; HUD her açılışta bu varsayılan konuma döner. Tam ekranda (`document.fullscreenElement`) 2D serbest hareket + 4 kenar mıknatıslı yakalama kullanılır; tam ekrandan çıkınca HUD sağ raya döner (`isFullscreenMode`, `resetPopupToDefaultPosition`, rayı gözeten `clampPopupToViewport`).
- **Sürükleme Güvenliği:** HUD üzerindeki olay izolasyonu `mouseup` yayılımını durdurduğu için bırakma olayları `window` üzerinde **capture** aşamasında (`mouseup`, `pointerup`, `pointercancel`, `blur`) dinlenir; ayrıca `mousemove` sırasında `buttons === 0` ise sürükleme bitirilir. (Önceki sürümde bırakma olayı `document`'e ulaşmadığı için HUD fare imlecine yapışık kalıyordu.)
- **Doğrudan PiP Kontrolü:** Kontrolcüyü PiP penceresine taşımadan, mevcut penceredeki HUD üzerinden `requestPictureInPicture` / `exitPictureInPicture` yönetilir.

### 4.12 NOkrep Logosu (HUD Başlığı) (v0.5.2)
- `icons/nok-logo.svg` dosyası `manifest.json` içinde `web_accessible_resources` olarak tanımlıdır.
- `content.js` logo adresini `script.dataset.logoUrl` ile Main World'e aktarır; `injected.js` logoyu DOM API ile ekler (yalnızca `chrome-extension://` / `moz-extension://` adresleri kabul edilir).
- Logo `draggable=false` ile başlık sürüklemesini bozmaz; dosya bulunamaz veya sayfa CSP'si engellerse `error` olayında kendini kaldırır.
- Logo saydam arka planlıdır (HUD'un koyu zemini üzerinde beyaz kutu olmadan görünür). Dosya, kaynak görselin (1672x941, beyaz zeminli) kırpılmış, saydamlaştırılmış 512 px genişlikli sürümünü SVG içine gömülü PNG olarak taşır; gerçek vektör çizim değildir.

### 4.13 HUD Arayüz Düzeni (v0.5.2)
- **Sade Başlık:** Başlıkta yalnızca logo ve düğmeler (PiP, kısayollar, küçült, kapat) bulunur; "NOkrep vX" rozeti ve "NOk Controller" yazısı kaldırıldı, sürüm bilgisi logonun tooltip'indedir. Logo yüklenemezse yedek olarak "NOk" yazısı görünür.
- **Varsayılan Açık Bölümler:** Yalnızca "Oynatma Hızı & Sarma" ve "Ses Seviyesi & Kanallar" açık başlar; "Akış Paket Kaliteleri", "Görüntü Filtreleri" ve "Harici Altyazı" kapalı başlar (akordeonlar bağımsızdır, birden fazlası açık kalabilir).
- **Kalite Rozetleri:** Kalite seçenekleri büyük tam genişlikli butonlar yerine küçük hap rozetlerdir (`1080p`, `720p` ...); parantez içindeki açıklama (`FHD`, `HD`) rozetten çıkarılmış, tam etiket tooltip'te kalmıştır.
- **Sığma Düzeltmeleri:** Sarma düğmeleri (`+10s`, `+30s`) kırpılmadan sığar; Stereo/Mono düğmeleri ses ön ayarlarının altına sarılır; başlık düğmeleri (`flex-shrink: 0`) sağda kesilmez.
- **Bilinçli Olarak Yapılmayanlar:** Çözünürlük ve adaptör kutularının tek şeritte birleştirilmesi şimdilik istenmedi (askıda).

---

## 5. 📊 Sürüm Evrimi ve Çözülen Kritik Problemler

### v0.5.3 (Geliştirme — Canlı Test Bekliyor)
- Gizlilik odaklı rapor şeması v2; serbest metin/URL/alan adı/kesin saat/konsol toplama kaldırıldı.
- İstenen ve okunan hız/ses, hazır olma/iframe durumu ve sınırlı Kick çağrı olayları eklendi; kalite doğrulamasının yapılmadığı açıkça belirtilir.
- Rapor `textContent` ile gösterilir; açıklama isteğe bağlıdır, paylaşım adresleri JSON içermez, kopyalama hataları ele alınır.
- Bağımlılıksız Node gizlilik/rapor testleri eklendi. Canlı Firefox, Chromium ve site testleri beklenmektedir; site uyumluluk onayı verilmedi.

### v0.5.2 (Önceki Kararlı Sürüm)
- **İzole Klavye Kısayolları Motoru:** Yazı alanlarını dışlayan ve `e.stopPropagation()` ile izole edilen kısayol sistemi eklendi.
- **Görüntü Filtreleri & Gece Kalkanı:** Parlaklık, kontrast, doygunluk, gece modu ve ters renk kontrolleri eklendi.
- **Bellek İçi Harici Altyazı Motoru:** `.srt`/`.vtt` RAM içi ayrıştırıcı ve `±100ms` senkronizasyon eklendi.
- **%300 Ses Booster, Gain Renk Geçişi & Çift Tıkla Sıfırlama:** Ses üst sınırı %300 olarak yapılandırıldı; dinamik slider renk geçişi ve çift tıkla sıfırlama eklendi.
- **Mıknatıslı Kenar Hizalama, Küçültülmüş Detaylı Bar & PiP:** 2D mıknatıslı sürükleme, viewport sınır koruması, küçültülmüş özet bar ve doğrudan PiP kontrolü eklendi.
- **Sürükleme Hatası Düzeltmesi & Ray Konumlandırma:** HUD'un fareye yapışıp kalması giderildi; normal modda sağ ray (dikey), tam ekranda serbest hareket geri getirildi.
- **Arayüz Sadeleştirme:** Sade başlık (yalnızca logo), küçük kalite rozetleri, varsayılan olarak yalnızca hız ve ses bölümleri açık; kırpılan düğmeler düzeltildi (bkz. 4.13).
- **NOkrep Logosu:** HUD başlığına `icons/nok-logo.svg` eklendi (DOM API ile, yüklenemezse otomatik gizlenir, saydam arka plan).
- **Firefox & Chromium Ortak Manifest:** `background` içinde `service_worker` + `scripts` birlikte tanımlandı; `strict_min_version` `121.0` yapıldı.
- **Reddit:** `shreddit-player` Web Component'i Shadow DOM tarayıcısının özel host listesine eklendi.
- **Saf WebExtension Temizliği:** AI Studio simülasyon/sunucu dosyaları (`index.html`, `server.js`, `package.json`, `bun.lock`, `.env.example`, `metadata.json`, `popup.*`, `.aistudio/`, `test.zip`) kaldırıldı; `SITE_COMPATIBILITY.md` eklendi.

### v0.5.1
- **Evrensel Medya Tespiti & Shadow DOM Derin Taraması:** `<all_urls>` desteği ve `deepFindMediaElements` BFS tarayıcısı eklendi.
- **DRM / EME Güvenli Modu & 3-Kademeli Basamaklı Adaptör Hattı:** `detectDrmStatus` ve `resolveCascadeAdapter` mimarisi devreye alındı.

### v0.5.0
- **Kick.com Ses Senkronizasyonu & Mute Çözümü:** Ses seviyesi %0'dan %50, %100 veya %150'ye alındığında Kick mute butonunun sentetik PointerEvent ile açılması ve Radix UI Slider izine pointer simülasyonu eklendi.
- **TRT 1 / TRT İzle HUD Olay İzolasyonu:** TRT oynatıcı katmanlarının buton tıklamalarını yutması `e.stopPropagation()` ile engellendi. Teşhis, CDN Ping, İzinler ve akordeon butonları TRT üzerinde %100 çalışır hale getirildi.
- **Hareketsizlik Timer Düzeltmesi:** Fare oynatıldığında HUD'un anında %100 opaklığa dönmesi sağlandı (`pvc-idle-semi` ve `pvc-idle-hidden` temizliği).
- **Sadeleştirilmiş Teşhis JSON Paketi:** Teşhis modalındaki sürüm geçmişi yalnızca son 3 versiyonu içerecek şekilde hafifletildi.

### v0.4.9
- **Kick.com 0ms React Fiber Caching:** React hook dispatch ve setter fonksiyonları önbelleğe alınarak buton tıklamalarındaki UI donması tamamen giderildi.
- **TRT 1 / TRT İzle CDN-V HLS Yönlendirmesi:** `cdn-v.pr.trt.com.tr` üzerindeki HLS manifest ve segment yönlendirmeleri tamamlandı; 0.001s mikro-sarma tampon tazelemesi eklendi.
- **TRT 1 Ses Çubuğu ve 1x Hız Kilit Koruması:** TRT oynatıcısının ses barlarının ve hız sıfırlamasının kontrol altına alınması sağlandı.

### v0.4.8
- **Kick.com Next.js Rota İzolasyonu:** React Fiber ağacı taranırken Next.js router state'ine temas edilmesi sonucu oluşan 404 yönlendirme hatası giderildi.
- **TRT Özel HLS Adaptörü:** TRT 1 ve TRT İzle için özel adaptör sınıfı oluşturuldu.

---

## 6. ⚠️ Güncel Zorluklar, Bilinen Sınırlar ve Edge Cases

Gelecekteki geliştiricilerin veya dil modellerinin bilmesi gereken teknik hassasiyetler:

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
5. **Firefox PiP API Farkı:**
   - Chromium tarayıcılar `video.requestPictureInPicture()` API'sini desteklerken, Firefox bu standart JS metodunu web sayfalarına açmayabilir; kodda güvenli kontrol (`typeof video.requestPictureInPicture === 'function'`) mevcuttur. Güncel durumu MDN'den doğrulayın.
6. **Firefox'ta PiP:** `video.requestPictureInPicture` Firefox'ta mevcut değilse HUD'daki PiP düğmesi, "videonun üzerindeki yerleşik PiP düğmesini kullanın" uyarısı gösterir. Güncel durumu MDN'den doğrulayın.
7. **Tam Ekranda HUD Görünürlüğü:** HUD, `document.fullscreenElement` içine taşınır. Tam ekran elemanı doğrudan `<video>` ise (bazı sitelerde/yerel kontrollerde) alt öğeler çizilmediğinden HUD görünmeyebilir; bu durum henüz çözülmemiş bilinen bir sınırdır.
8. **Firefox Slider İzi:** `::-moz-range-track` saydam bırakılır ki slider'ın kendi arka planı (kazanç dolgusu) görünsün; Firefox'ta görsel olarak doğrulanmalıdır (geliştirme ortamında Firefox çalıştırılamadı).
9. **Cross-Browser Test Sınırı:** Geliştirme Firefox'ta, Chrome testi ise ayrı bir geliştirici tarafından yapılmaktadır; bir özellik her iki tarayıcıda doğrulanmadan `SITE_COMPATIBILITY.md` içinde "Tam Çalışıyor" yapılmaz.

---

## 7. 🚀 Gelecek Yol Haritası (Roadmap)

**Tamamlananlar (v0.5.2):** Klavye kısayolları, görüntü filtreleri & gece kalkanı, harici altyazı yükleyici, doğrudan PiP kontrolü, %300 ses + renk geçişi, mıknatıslı kenar hizalama, küçültülmüş özet bar.

1. **Yeni Tier 1 Platform Adaptörleri:**
   - **Tabii, BluTV, Gain, Exxen:** Yerli VoD platformlarının oynatıcı UI ve kalite seçimi mekanizmalarına özel adaptörler.
   - **Twitch.tv:** Twitch oynatıcı kalite kontrolü için özel Tier 1 adaptörü.
2. **Altyazı Stil Özelleştirmesi:** Harici altyazı katmanının (`#pvc-subtitle-overlay`) yazı boyutu, rengi ve dikey konumunun HUD üzerinden ayarlanabilmesi.
3. **İsteğe Bağlı Tekil Akordeon (Single-Active Accordion) Modu:** Küçük ekranlarda bir akordeon açıldığında diğerinin otomatik kapanması (şimdilik askıda).
4. **Document Picture-in-Picture:** `DocumentPictureInPicture` API'si yalnızca Chromium'da mevcut olduğundan HUD'u PiP penceresine taşıma fikri şimdilik uygulanmamıştır; HUD kendi penceresinden PiP'i yönetir.

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
│   └── nok-logo.svg           # NOkrep organizasyon logosu (saydam; HUD başlığında gösterilir, yüklenemezse otomatik gizlenir)
├── manifest.json              # Manifest V3 yapılandırması (Firefox scripts + Chromium service_worker)
├── background.js              # Stateless arka plan betiği (Toolbar tıklamasıyla enjeksiyon)
├── content.js                 # Isolated World köprüsü (Main World injected.js enjektörü, logo adresi aktarımı)
├── injected.js                # Main World Engine (HUD, Adaptörler, Web Audio, Filtre, Altyazı, Kısayollar)
├── injected.css               # HUD arayüz stilleri (Glassmorphism, Gain renkleri, Mini-Bar, Mıknatıs efekti, Logo)
├── tests/
│   └── diagnostics.test.cjs    # Bağımlılıksız Node gizlilik/rapor sınırı testleri
├── README.md                  # Hızlı kurulum ve proje özeti
├── SITE_COMPATIBILITY.md      # Katı kurallı site uyumluluk ve durum takip tablosu
└── PROJECT_MASTER_GUIDE.md    # BU DOSYA (Eksiksiz mimari, geçmiş, felsefe ve devir kılavuzu)
```

---

## 9. 🔄 Geliştirici Devir & Yeni Konuşmaya Taşıma Kılavuzu

Eğer projeyi yeni bir yapay zeka modeline, başka bir konuşmaya veya yeni bir yazılımcıya devrediyorsanız, aşağıdaki kontrol listesini ve prompt şablonunu kullanabilirsiniz:

### Yeni Konuşmayı Başlatırken Kullanılacak Prompt Şablonu:
```text
NOk Video Controller projesini geliştirmeye devam ediyoruz (Mevcut geliştirme sürümü: v0.5.3; canlı tarayıcı/site testi bekliyor).
Projenin tam mimarisi, tasarım tercihleri, 3 kademeli Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline), DRM/EME tespit motoru ve dosya ağacı `/PROJECT_MASTER_GUIDE.md` dosyasında eksiksiz belgelenmiştir. Site durumları `/SITE_COMPATIBILITY.md` dosyasında takip edilir.

Bu projede dikkat edilmesi gereken katı kurallar:
1. SIFIR DEPOLAMA (Stateless): localStorage, sessionStorage, chrome.storage veya cookies KESİNLİKLE kullanılmaz. Tüm durum bellek içi (in-memory) değişkenlerde tutulur.
2. SIFIR HOST İZNİ: host_permissions eklenmez; activeTab ve scripting yetkisi yeterlidir.
3. 3 KADEMELİ BASAMAK HATTI (Cascade Pipeline): Tier 1 (Siteye özel), Tier 2 (Oynatıcı kütüphaneleri: YouTube, Video.js, Hls.js, Shaka, Dash.js), Tier 3 (Evrensel HTML5 & Shadow DOM). Bu hiyerarşi ve sağlık kontrolü (probeAdapterHealth) bozulmamalıdır.
4. DRM / EME GÜVENLİ MODU: Şifreli akışlarda (Widevine/FairPlay) Web Audio API booster atlanmalı, yerel ses ve oynatma kontrolleri korunmalıdır.
5. KICK.COM OPTİMİZASYONU: 0ms React Fiber hook önbelleklemesi korunmalıdır.
6. OLAY İZOLASYONU: HUD üzerindeki tüm etkileşimlerde e.stopPropagation() korunmalıdır.
7. FIREFOX + CHROMIUM: Geliştirmeler her iki tarayıcı tabanı için ortak yapılır; manifest'te service_worker ve scripts birlikte kalır.
8. SITE_COMPATIBILITY.md: "Tam Çalışıyor" bölümüne geliştirici talep etmeden site eklenmez.
9. Yapılan her değişiklik/plan/mimari karar PROJECT_MASTER_GUIDE.md dosyasına işlenir. Kod değişiklikleri sohbete yazılmaz, dosya/zip olarak iletilir.

Lütfen ilk olarak PROJECT_MASTER_GUIDE.md dosyasını incele ve [BURAYA YAPMAK İSTEDİĞİNİZ YENİ ÖZELLİK VEYA DÜZELTMEYİ YAZIN] konusunda çalışmaya başla.
```

### Kodlama ve Geliştirme Kuralları (Kırmızı Çizgiler):
1. **Sıfır Depolama Kuralı:** Asla kalıcı depolama eklemeyin. Ayarlar bellek içinde (`injected.js` içindeki JS değişkenlerinde) tutulur; sekme yenilendiğinde sıfırlanması projenin bilinçli mimari tercihidir.
2. **Konsol Kirliliği:** Kod içerisine periyodik `console.log` basmayın; loglama yalnızca `addDiagnosticLog` fonksiyonu ile bellek içi ring buffer'a yazılmalıdır.
3. **Sürüm Numaralandırması:** Bir özellik veya düzeltme yapıldığında şu dosyalarda sürüm numarasını eşitleyin:
   - `manifest.json` (`"version"`)
   - `injected.js` (`EXTENSION_VERSION` ve `VERSION_HISTORY`)
   - `README.md`, `SITE_COMPATIBILITY.md` ve `PROJECT_MASTER_GUIDE.md` (sürüm başlıkları)
4. **Site Uyumluluk Tablosu Kuralı:** `SITE_COMPATIBILITY.md` içindeki "Tam Çalışıyor" bölümüne geliştirici açıkça talep etmeden hiçbir site eklenmez.
5. **Dokümantasyon:** Değişiklikler, planlar ve mimari yapı bu dosyaya işlenir; kural metinleri (özellikle `SITE_COMPATIBILITY.md` yönetim kuralları) sahibinin onayı olmadan yeniden yazılmaz.

---

*NOk Video Controller bir **NOkrep** açık kaynak projesidir.*
