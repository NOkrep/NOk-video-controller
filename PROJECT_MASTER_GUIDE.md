# NOk Video Controller — Kapsamlı Proje & Mimari Kılavuzu (Master Architecture & Handover Guide)

> Önceki paket kanıtı (22 Ekim 2026): **v0.7.0.1 düzeltme adayı**, 142 Node testi. Firefox kurulu geçici eklentide sürekli iframe filtresi ve en son değer koruması geçti; Firefox/Edge yerel gerçek HLS ve Video.js kalite geçişleri doğrulandı. Özel test sitesi dahil gerçek site kabulü açıktır. Güncel kanıt: [RELEASE_NOTES_v0.7.0.1.md](./RELEASE_NOTES_v0.7.0.1.md).

> **Sürüm:** v0.7.2 (kaynak geliştirmesi; release/ZIP/push yapılmadı; gerçek site kabulü açık)
> **Geliştirici:** NOkrep ([GitHub](https://github.com/NOkrep/NOk-video-controller) | `ihsanartrk07@gmail.com`)  
> **Platform Uyumluluğu:** Firefox (Gecko, 121+) & Chrome, Brave, Edge, Opera (Chromium, 121+) — Manifest V3 WebExtensions  
> **Son Güncelleme:** 22 Ekim 2026 — v0.7.1 (yeni raporlar, HUD yaşam döngüsü, isteğe bağlı site bilgisi, iki motor bellek incelemesi)

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
  - `DashJsAdapter`: Yeri korunur ancak kalite API'si henüz uygulanmamıştır; aktif eşleşme ve kalite seçimi sunmaz.
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
- **Sonuçların anlamı:** `SPEED_REQUESTED`, `VOLUME_REQUESTED`, `QUALITY_REQUESTED`, `SEEK_REQUESTED` yalnızca isteği belirtir. Kick `reactInvoked/ivsInvoked` alanları çağrının yapıldığını gösterir; UI eşleşmesi veya oynatıcı tarafından kabul edildiği kanıtlanmaz. Kalite `verification` her zaman `not-verified` kalır. Generic/Dash kalite kontrolü sunmaz (`not-implemented`); v0.5.4'te Shaka gerçek instance/track API'si üzerinden çalışır. Kalite listesi artık eski video/adaptör önbelleğine geri düşmez; video yoksa rapor seçenek adedini `0` gösterir.
- **Salt okunur rapor:** `buildDiagnosticPayload` rapor oluştururken ağ isteği, kalite uygulaması, yeni ses grafiği veya `getQualities` çağrısı yapmaz. `cdnMeasurementStatus` yalnızca sabit durum kodu taşır; adres/zamanlama örneği dışa aktarılmaz. v0.5.4'te otomatik CDN güncellemeleri yalnızca mevcut kaynak zamanlamasını okur. Manuel düğme gerektiğinde `credentials: omit` ve `referrerPolicy: no-referrer` ile, yönlendirme kabul etmeyen, 4 saniye sınırlı HEAD isteği yapabilir. Bu seçenekler akış adresinin kendi sorgu parametrelerini silmez; mevcut medya adresi manuel ölçümde CDN'e tekrar gider, rapora girmez.
- **Arayüz ve paylaşım:** Mevcut modal düzeni korunur. Sorun türü sabit listeden seçilebilir. Serbest açıklama varsayılan kapalıdır; kullanıcı açıkça seçerse en fazla 500 karakter eklenir ve otomatik anonimleştirilmediği belirtilir. Seçim kapatılınca açıklama temizlenir. JSON yalnızca `textContent` ile önizlenir. Clipboard Promise başarısızlığında başarı bildirimi verilmez. Mail/GitHub bağlantıları raporu veya açıklamayı URL'ye gömmez; kullanıcı JSON'u kopyalayıp taslağa kendisi ekler. Otomatik gönderim yoktur.
- **Anonimlik sınırı:** Panel MAIN world/sayfa DOM'unda çalışır; sayfa betikleri paneldeki verileri okuyabilir veya değiştirebilir. Not alanı gizli iletişim kanalı değildir. Kullanıcının notu kişisel bilgi içerebilir, e-posta/GitHub paylaşımı hesap kimliğiyle ilişkilendirilebilir. Kullanıcının kopyaladığı rapor panoda veya paylaşılan hizmette kalabilir; sıfır depolama ilkesi eklentinin kendi durumuna ilişkindir.

**Geçmiş raporlardan değerlendirme (yeniden test edilmedi):**

| Rapor | Kaynakta görülen durum | Sonuç / hâlâ gereken kanıt |
| :--- | :--- | :--- |
| TRT v0.4.8 | 720p isteğine karşın 1080 sınıfı görüntü; kullanıcı hız ve kalite işlemediğini, ses UI'sının eşleşmediğini bildirmiş. | Sonraki sürümlerde düzeltme notları var; güncel canlı test olmadan çözülmüş sayılmaz. |
| Kişisel sunucu v0.5.0 | Video hazır; yalnızca "çalışmıyor" açıklaması ve işlem bildirimleri var. | Hangi kontrolün başarısız olduğu kanıtlanamıyor. Özel sunucu adresi bu belgeye taşınmadı. |
| Özel test sitesi A v0.5.1 | `NO_VIDEO_FOUND`, `playerType: none`, video durumu yok. | Başlatılmamış oynatıcı/iframe/başka bir neden ayrımı rapordan yapılamıyor. |
| Nepu v0.5.1 | `hlsjs` algısı, GenericAdapter ve sabit kalite listesi; gerçek seçim kanıtı yok. | Kütüphane varlığı çalışan instance/kalite API'si anlamına gelmez. |
| Özel test sitesi B v0.5.0 | Seçili video `0x0`, `readyState: 0`, `networkState: 0`; buna rağmen sarma/hız bildirimleri var. | Hazır olmayan/yanlış video olasılığı; oynatma başarısı kanıtlanmıyor. |
| Kick v0.5.2 | Kullanıcı kalite UI eşleşmesinin çalıştığını, hız/ses UI eşleşmesinin çalışmadığını bildirmiş. | Yeni istenen/okunan değerler ve çağrı olayları sonraki incelemeyi destekler; UI sorunu bu sürümde düzeltilmedi. |

Ham raporlar, tokenlar, adresler ve kullanıcıya özgü bilgiler repoya kopyalanmaz. `tests/diagnostics.test.cjs` üretim fonksiyonlarını izole Node/DOM taklidi ortamında çalıştırır; gizli örnek dizelerin dışa çıkmamasını, güvenli önizlemeyi, açıklama seçimini, tampon sınırlarını ve kopyalama hatalarını denetler. Video yoksa veya `NO_VIDEO_FOUND` ise rapor `problem: detection` ile açılır; seçim kullanıcı tarafından değiştirilebilir. Bu testler gerçek tarayıcı/site doğrulaması değildir.

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

### 4.14 v0.5.4 — Yeni Firefox Raporlarına Göre Düzeltmeler

- **Somut kaynak hataları:** SRT/VTT bitiş zamanının başındaki boşluk `split` öncesinde temizlenmediği için standart dosyalarda tüm satırlar eleniyordu. Artık BOM, CRLF, VTT cue ayarları ve NOTE/STYLE/REGION blokları ele alınır; bozuk/ters zamanlar elenir, cue'lar zamana göre sıralanır. Sıfır cue başarı sayılmaz, önceki geçerli altyazı korunur. Okuma/ayrıştırma durumu rapora yalnızca `subtitleLoadStatus` sabit seçeneğiyle girer; dosya adı/metni rapora girmez. Gizleme, native track'i de devre dışı bırakır.
- **Gerçek instance ilişkisi:** Hls `attachMedia`, Shaka `attach/load` kancaları ve Shaka UI `getControls().getLocalPlayer()/getPlayer()` ile ulaşılan instance seçili videoyla doğrulanır (`media` / `getMediaElement()`). Video.js parent/global aramasında ilk rastgele player seçilmez, seçili medya ilişkisi aranır. Salt `window.Hls`/`window.shaka.Player` varlığı artık instance kanıtı sayılmaz. Kancalar SCRIPT load yakalama ve mevcut SDK kontrol döngüsünde kurulur; her tıklamada React ağacı taranmaz. `updateRealtimeResolutionBadge` artık bulunan player'ı adaptöre geçirir.
- **Kalite:** Tier 1/2/3 sırası ve `probeAdapterHealth` korunur. TRT önce bağlı Shaka/Hls/Video.js kalite seçeneklerine yönlendirir. Shaka'da mevcut ses dili/audioId korunarak gerçek variant listesi kullanılır; `configure({abr:{enabled:false}})` ardından `selectVariantTrack(track,true)` çağrılır. TRT ağ fallback'i yalnızca tanınan eski master rotası görülmüşse ve DRM yoksa sunulur. Generic/Dash sabit, işlevsiz çözünürlük düğmeleri kaldırılır. Başarısız seçim aktif kalite veya "uygulandı" durumuna geçirilmez; bekleyen çözünürlük metin yerine sayısal yükseklikle karşılaştırılır. Çağrı yapılması gerçek görüntü kalitesi değiştiğini kanıtlamaz.
- **TRT hız:** Ulaşılabilen Shaka instance'ında `trickPlay(rate,false)` ile oynatıcının hız denetleyicisine de istek iletilir. TRT için yalnızca açık kullanıcı hız isteğinden sonra `ratechange` koruması kurulur; 1x'e geri dönüşte 200ms gecikmeyle en fazla 5 kez tekrar uygular, sonra `TRT_RATE_GAVE_UP` kaydeder. Buffering için 0x, başka bir hız değeri, çıkarılmış/bitmiş video veya `emptied` olayında zorlamaz. 1x isteği korumayı kapatır. Kick reklam/hook önbelleği davranışı değiştirilmez.
- **iframe:** İçerik betiği stilleri manifest'ten tüm çerçevelere yüklenir. Panel açılırken erişilebilir video yoksa content bridge çocuk çerçevelere yalnızca `NOK_FRAME_OPEN` sabit sinyalini yollar; onlar da yerel motorlarında hazır medya varsa HUD açar ve sinyali alt çerçevelere iletir. Top frame raporu iframe'in özel verisini toplamaz. Bu mekanizma Same-Origin Policy/CSP/korumalı tarayıcı sayfalarını aşmaz ve iframe'de çalışan motor/izin gerektirir. Content/Main world tekrar enjeksiyonu yeni mesaj dinleyicisi eklemez.
- **CDN ölçümü:** Duraklatma manuel ölçümü engellemez. Son gerçek medya isteğinin `requestStart/responseStart` bilgisi açıksa pasif HTTP yanıt süresi kullanılır; JavaScript/IVS worker gibi kaynaklar CDN videosu sanılmaz. Zamanlama yoksa otomatik döngü ağ isteği yapmaz. Manuel ölçümde yalnızca HEAD vardır; eski GET/no-cors fallback'i kaldırılmıştır. Sonuç ICMP ping değildir; CORS/TAO, HEAD reddi, kaynak eksikliği ve zaman aşımı ölçümü engelleyebilir.
- **Doğrulama sınırı:** `node --test tests/diagnostics.test.cjs tests/player-controls.test.cjs` ile üretim fonksiyonlarında regresyon/gizlilik sınanır; tüm motorun bootstrap/tekrar enjeksiyon smoke testi de vardır. Gerçek Firefox/Chromium, TRT/CDN ve gömülü oynatıcıların uçtan uca testi henüz yapılmadı; v0.5.3 kullanıcı raporları v0.5.4 başarı kanıtı değildir. Eklenti yeniden yüklenmeli ve medya sayfaları yenilenmelidir.

API kaynakları: [Shaka Player API](https://shaka-project.github.io/shaka-player/docs/api/shaka.Player.html), [Shaka UI Controls](https://shaka-project.github.io/shaka-player/docs/api/shaka.ui.Controls.html), [Hls attachMedia](https://hlsjs.video-dev.org/api-docs/hls.js.hls.attachmedia).

### 4.15 v0.5.5 — Altyazı Görünürlüğü ve HLS Envanteri

- **Kullanıcı kanıtı:** v0.5.4 Firefox raporu bağlı HlsJsAdapter, `subtitleLoaded: true`, `subtitleLoadStatus: loaded` ve bir HLS seviyesi gösteriyor; kullanıcı metnin görünmediğini ve düğmede yalnızca `p` yazdığını bildirdi. Bu rapor altyazının ekranda çizildiğini veya site genelinde tek kalite olduğunu kanıtlamaz.
- **Görünürlük hatası:** CSS'te `#pvc-subtitle-overlay { display:none!important }` bulunurken JS yalnızca normal `style.display='block'` veriyordu. Gösterme/gizleme artık inline `setProperty(...,'important')` kullanır. Yükleme sırasında seçili video mutlaka `monitorVideoResolution` ile izlenir. Normal katman videonun görünür alanına yerleştirilir; erişilebilir iframe koordinatları üst pencereye çevrilir. Doğrudan video fullscreen/standart PiP durumunda varsa native TextTrack `showing` yapılır, overlay gizlenir; çıkışta native track `hidden` ve overlay etkin olur. Firefox'un yerleşik PiP'inde bu standart olayların çalışması garanti edilmez.
- **Gizlilik odaklı çizim durumu:** `subtitleRenderStatus` yalnızca `not-loaded`, `disabled`, `no-video`, `no-active-cue`, `overlay-requested`, `native-requested`, `video-offscreen` değerlerinden biridir. İstek durumu gerçek piksel görünürlüğünü kanıtlamaz. Cue metni, zamanları, dosya adı, video konumu ve ekran boyutu rapora girmez. Altyazı mevcut konumda eşleşmiyorsa durum `no-active-cue` olur; bu eşleşmeme yükleme hatası değildir.
- **HLS etiketi:** Öncelik `level.height`, ardından `attrs.RESOLUTION` değeridir. Eksikse yalnızca oynatılan seviyede video yüksekliği `720p · oynatılan` gibi gösterilebilir; bu ölçüm manifest yüksekliği olarak kaydedilmez (`height: 0`, raporda `requestedHeight: null`). Diğer seviyelere aktif videonun boyutu kopyalanmaz. Çözünürlük bilinmiyorsa gerçek bitrate veya `Seviye N` kullanılır. Boş `p`, `undefinedp`, keyfi NAME/URL etiketleri ve hayali çözünürlükler üretilmez.
- **Envanterin sınırı:** `quality.inventoryScope` bağlı HLS oynatıcısını belirtir; `playerLevelCount`, `knownResolutionCount`, `declaredLevelCount` yalnızca adet aralıklarıdır. `manifestObserved` mevcut kancanın MANIFEST_LOADED olayını görüp görmediğini belirtir; olayın kaçırılması kaynakta kalite olmadığı anlamına gelmez. `adaptiveMode` yalnızca `manualLevel` değerinden `auto/manual/unknown` olarak çıkarılır. `inventoryCompleteness: not-verified` sabittir: tek kayıt tüm sitede tek kalite bulunduğunu veya otomatiğin çalıştığını kanıtlamaz. Yeni ağ isteği veya manifest indirmesi yapılmaz; kaynak URL/metni rapora eklenmez.
- **Geç gelen seviyeler:** `hlsManifestLoading`, `hlsManifestLoaded`, `hlsManifestParsed`, `hlsLevelsUpdated`, `hlsLevelSwitched` olayları gözlenir. Yükleme başlangıcı önceki manifest adet bilgisini sıfırlar. 100ms birleştirilmiş yenileme yalnızca seçili videonun düğmelerini günceller; aynı instance'a tekrar dinleyici eklenmez. Tek seviyede arayüz yalnızca "oynatıcı 1 seviye bildiriyor" der; kaynağın tek kalite sunduğunu iddia etmez.
- **Doğrulama:** 38 Node testi; HLS eksik metadata/sonradan gelen seviyeler, CSS önceliği için inline çizim komutu, cue boşluğu, native track geçişi ve rapor gizliliği kapsanır. Gerçek layout/Firefox testi değildir. `tests/ui-preview-server.cjs` localhost üzerinde gerçek CSS/üretim betiğiyle sentetik HLS ve örnek SRT sunar. Bu ortamın tarayıcısı localhost'a ulaşamadı; bağımsız `data:` önizlemesi de URL güvenlik politikasıyla reddedildi. Başka bir tarayıcı yolu denenmedi; otomatik görsel doğrulama tamamlanmadı. Önizleme sunucusu durduruldu.

API kaynakları: [Hls Level metadatası](https://hlsjs.video-dev.org/api-docs/hls.js.level), [Hls olayları](https://hlsjs.video-dev.org/api-docs/hls.js.events).

### 4.16 v0.5.6 — Çift HUD, TRT Hız Kilidi, Video.js ve Kick UI

- **Yeni kanıt sınırı:** v0.5.5 HLS raporu `manifestObserved:true`, bir bildirilmiş seviye, sıfır çözünürlük metadatası ve otomatik ABR modu gösterdi. Kaynak genelindeki tüm kaliteler veya altyazı piksel görünürlüğü bu raporla doğrulanmadı. İframe raporunda kullanıcı çalışan panelin yanında boş üst panel gördüğünü bildirdi. TRT logları korumanın beş deneme sonrası tükenip hızın 1x kaldığını gösterdi. Kick'te IVS çağrıları var, React çağrıları yok; kullanıcı önceki hız/ses UI uyumsuzluğunu ayrıca doğruladı. Video.js'te kendi menüsünde kalite olmasına karşın eklenti listesi boştu.
- **Tek HUD dalı:** Content bridge RAM'de doğrudan çocuk WindowProxy referansı tutar. Yerel medya yoksa çocuklar denenir; ilk `NOK_FRAME_ACTIVE` yanıtı kazanan dal olur. Üstteki boş HUD ve diğer dallar `NOK_FRAME_HIDE` / `PVC_HIDE_POPUP` ile kapanır. Yerel medya olan çerçeve kendi çocuklarını açmaz. İç içe çerçevelerde aktif/kapandı sinyali yalnızca seçili dal boyunca iletilir. Araç çubuğu, devredilmiş paneli de kapatıp yeniden açabilir. Programatik gizleme kullanıcı kapatma ACK'i üretmez; böylece çalışan çocuğun yanlışlıkla kapatılması önlenir. Yanıt vermeyen tüm dallarda üst hata paneli kullanılabilir kalır. Sinyaller yalnızca sabit `type` taşır; URL, rapor, video bilgisi veya kalıcı kimlik aktarılmaz. CSP/izin/DOM sınırları aşılmaz; yarışma sırasında kısa süreli geçiş görünürlüğü olabilir, Node testleri son durumda tek HUD'ı denetler.
- **TRT element kilidi:** Açık hız isteği sonrası yalnızca o video üzerinde native playbackRate descriptor'ına yönlenen own accessor kurulur; global HTMLMediaElement prototipi değiştirilmez. Aktif kilitte otomatik 1x yazımı istenen hıza yönlenir; 0x buffering ve diğer hız değerleri engellenmez. Üçüncü taraf own accessor varsa üzerine yazılmaz: Shaka denetleyicisini de güncelleyen ratechange fallback'i ilk beş istekte 200ms, sonrasında en fazla saniyede bir düzeltir; ömür boyu beş deneme sınırı kaldırılmıştır. Periyodik interval kurulmaz. Panelde 1x, `emptied` veya `ended` kilidi kapatır ve yalnızca eklentinin kurduğu own accessor'ı siler. Site kilitliyken kendi menüsünden 1x isteyemez; HUD tooltip'i kilidi panelden 1x/çift tıkla kapatmayı açıklar. Loglar en sık beş saniyede bir tutulur; `playbackRateLock` raporda yalnızca `element/event/off/unknown` olur. Canlı Shaka/buffering davranışı ayrıca doğrulanmalıdır.
- **Video.js VHS kaliteleri:** `qualityLevels()` doluysa önceki yol korunur. Yoksa/boşsa `tech_.vhs` veya `tech(...).vhs` üzerindeki `representations()` listesi kullanılır. Yalnızca gerçek temsil girdileri gösterilir; seçim sabit API temsil ID'siyle tekrar bulunur, önce hedef açılır sonra diğerleri kapanır. ID'ler yalnızca kontrol için bellektedir, rapora girmez. Bu çözüm siteye özel harici kalite menülerinin tamamını destekleme iddiası değildir.
- **Kick ses UI:** Bilinen ses slider köklerinde Radix `onValueChange(number[])` aranır; yalnızca açık max 1/100 ölçeği kabul edilir. İşleyici ve ait olduğu DOM kökü önbelleğe alınır; sonraki çağrıda Fiber/DOM tekrar taranmaz. Bağlantısı kesilen kök önbelleği geçersizleştirir. Rastgele memoizedState hook dispatch'i/router state'i değiştirilmez. Önceki adlandırılmış setter hızlı yolu da korunur. Booster yüzde 100 üstündeyken yerel Kick slider'ı doğal yüzde 100 sınırında kalır.
- **Kick hız UI:** Adlandırılmış React setter bulunamazsa VOD'da gerçek settings → playback speed → tam hız etiketi menü yolu, iki adet 120ms gecikmeli adımla denenir. Yeni hız isteği eski bekleyen adımı iptal eder. Yalnızca görünür menü seçenekleri kullanılır; bulunamayan/yerel menüde desteklenmeyen hız `KICK_SPEED_UI_UNAVAILABLE` olur. `KICK_SPEED_UI_INVOKED` seçim çağrısıdır, eşleşme kanıtı değildir. Açılmış menü başarısızlıkta mümkünse kapatılır. `simulateFullPointerClick` artık hem sentetik click hem `.click()` çağırarak menüyü iki kez toggle etmez; tek semantik click üretir. Canlı Kick DOM'u değişebilir, UI testi beklenir.
- **Elle adaptör seçimi:** Eşleşmeyen veya sağlıksız zorlanmış adaptör otomatik hattı devralmaz. Video yoksa raporda `activeAdapter:none`, tier null olur; `forcedAdapter` ve `forcedAdapterStatus` yalnızca bilinen adaptör adlarından/`not-forced/no-video/selected/unavailable` durumlarından oluşur. Video bulunmaması DASH adaptörü gerektirdiği anlamına gelmez.
- **Doğrulama:** `node --test tests/diagnostics.test.cjs tests/player-controls.test.cjs tests/frame-coordination.test.cjs tests/kick-ui.test.cjs`. Video.js VHS, native descriptor/fallback kilidi, iki kardeş/iç içe iframe, toolbar kapat/aç, Radix handler ölçeği/önbelleği ve iki aşamalı hız menüsü üretim kaynak fonksiyonlarıyla sınanır. 50 Node testi; gerçek Firefox/Chromium, TRT ve Kick UI sonucu değildir. Ham raporlar repoya kopyalanmadı; ek kalıcı depolama/izin eklenmedi.

Kaynaklar: [Video.js VHS representations API](https://github.com/videojs/http-streaming#representations), [Radix Slider API](https://www.radix-ui.com/primitives/docs/components/slider), [HTMLMediaElement playbackRate](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate).

### 4.17 v0.5.7 — Türkçe / English Arayüz ve Silme Talebi

- **Dil:** `UI_MESSAGES` Türkçe kaynak metinlerini İngilizceye eşleyen yerel bir gettext sözlüğüdür; uzaktan çeviri yoktur. `navigator.language` Türkçe ise `tr`, diğer durumlarda `en`; seçim yalnızca RAM'de `uiLanguage` ile tutulur. `_locales/en,tr/messages.json` tarayıcı eklenti açıklaması içindir; manifest varsayılanı İngilizcedir. İzin eklenmedi.
- **Durum koruma:** `setUiText`, `setUiAttribute` ve `localizeUi` yalnızca eklentinin panel/pencere/toast düğümlerini günceller. Türkçe kaynaklar WeakMap'te tutulur. Dil değişimi paneli yeniden kurmaz; event handler, kaydırıcı, açık bölüm, form ve kutu durumları korunur. Teşhis PRE, textarea değeri ve altyazı metni çevrilmez. Dinamik parametreler HTML olarak işlenmez; dosya adı boşlukları ve `$` karakterleri korunur. Yeni UI metni sözlüğe eklenmeli, dinamik yazımlar `setUiText`/`setUiAttribute` üzerinden yapılmalıdır.
- **Çerçeveler:** Yerel `PVC_LANGUAGE_TR/EN`, köprüde `NOK_LANGUAGE_TR/EN`, motorda `PVC_APPLY_LANGUAGE_TR/EN` sabit türleri kullanılır. Köprü yalnızca kendisinden veya doğrudan ebeveyn/çocuktan gelen geçerli türleri işler; aynı dil tekrar yayılmaz. Yeni çocuk `NOK_LANGUAGE_REQUEST` ile bellekteki tercihi ister; script onload gecikirse tercih tekrar uygulanır. Sadece `type` iletilir; URL, kimlik, medya, JSON veya kullanıcı metni taşınmaz. Yenilemede varsayılan dil geri gelir; yerel ayar teşhis alanına eklenmez.
- **Silme talebi:** Rapor kutusu varsayılan olarak kapalıdır. Açılırsa JSON'da opsiyonel `deleteAfterResolutionRequested: true` olur; kapanınca alan silinir. GitHub ve e-posta taslağına yalnızca sabit, kimliksiz İngilizce talep cümlesi eklenebilir; rapor ve özel açıklama URL'ye konmaz. Şema v2 ile uyumlu ek alandır. Otomatik paylaşım/silme yapılmaz; platform ve yetkili işlemine bağımlılık açıkça anlatılır. Manuel GitHub şablonunda da iki dilli kutu vardır.
- **HMI:** Bölüm başlıklarına Tab, Enter/Space, `aria-expanded`/`aria-controls`; beş range kontrolüne ad; tüm pencerelere focus-visible stili eklendi. HUD focusin/focusout ile görünür olur; önceki odak içindeyken gizlenmeme koşulu korunur. SELECT ve diğer form kontrolleri sürükleme başlatmaz; HUD klavye olayları da sayfaya kabarcıklanmaz. HTTP ölçümü “CDN yanıtı” adıyla sunulur. DRM anahtar adı HTML yerine metin olarak yazılır. Açılır pencerelerin odak yönetimi ve diğer HMI önerileri halen açık; `HMI_REVIEW.md` canlı test veya uygunluk belgesi değildir.
- **Doğrulama:** Çeviri kataloğu/parametreleri, panel ve dört pencerenin İngilizce metinleri, dil değişiminde form/JSON/altyazı koruması, kardeş/yeni çerçeve sinyalleri, silme talebi ve özel metnin URL'ye girmemesi Node testleriyle sınanır. 59 Node testi geçti; sözdizimi ve diff kontrolleri temiz. Gerçek Firefox/Chromium yerleşim, ekran okuyucu ve site testi beklenir.

### 4.18 v0.5.8 — İngilizce Başlangıç, Sekmeler ve Erişilebilirlik

- **İngilizce başlangıç:** `uiLanguage = 'en'` sabittir; v0.5.7'deki `navigator.language` varsayılanı kaldırılmıştır. Yeni sayfa her zaman İngilizcedir. Kullanıcının Türkçe seçimi sayfa belleğinde korunur, dil sinyalleri önceki protokolle çerçeveler arasında eşitlenir. Eklenti yönetim açıklaması tarayıcının yerel ayar sistemini kullanmaya devam eder.
- **Görev sekmeleri:** `setupHudNavigation` Player (hız/ses/kalite), Picture (filtreler), Subtitles (yükleme/senkron), Settings (dil/erişilebilirlik/adaptör/yardım) oluşturur. Var olan düğümler appendChild ile taşınır; yeniden innerHTML kurulmaz. Değerler, dosya girdisi ve handler kimlikleri korunur. Görüntü/altyazı bölümleri kendi sekmelerinde açık başlar. Adaptör ve yardım erişilebilirlik altında yanlış gruplanmaz; Settings içinde ayrı kalır. Ana durum, DRM ve video bulamama uyarıları sekmelerin dışında kalır.
- **Sekme klavyesi:** tablist/tab/tabpanel, aria-controls/labelledby/selected, roving tabindex; tıklama ve yatay oklar/Home/End seçimi. Seçili olmayan panelin `hidden` niteliğini koruyan önemli CSS kuralı ve mini modda sekme/panel gizleme vardır. Seçim oynatıcı API'sini çağırmaz. Olay izolasyonu korunur.
- **Sunum tercihleri:** `hudAccessibility` çerçeve RAM'inde keepVisible/largeText/highContrast/reduceMotion tutar. Native details alanı başlangıçta kapalıdır; native label/checkbox kullanılır. Kısayol düğmesi buraya taşınır ve aria-pressed/title güncellenir. keepVisible açıkken fade timer kurulmaz; açma/kapama önceki timer'ları temizler. Büyük metin/kontrast/hareket sınıfları HUD, açık ve sonradan açılan pencereler ve toast'a uygulanır. CSS özgüllüğü mevcut önemli kuralları aşacak şekilde kök ID'lere bağlıdır. Hareket azaltma başlangıç değeri `prefers-reduced-motion`; elle kapatılabilir. Medya filtreleri ve DRM ses yolu değiştirilmez.
- **Gizlilik:** Bu yeni sunum tercihleri rapora eklenmez, ağdan okunmaz, kalıcı yazılmaz ve çerçeveler arasında gönderilmez. Her yeni çerçeve kendi varsayılanıyla başlar; dil eşitlemesi bundan ayrıdır. Panel kapatma/açma aynı DOM ve RAM'i korur, sayfa yenileme sıfırlar.
- **Doğrulama:** `tests/hud-navigation.test.cjs` gerçek kaynak fonksiyonlarını DOM/olay modeliyle sınar: ilk sekme ve gizleme, klavye/odak seçimi, slider/file/handler kimliği, timer iptali, odak içindeyken görünürlük, sunum sınıfları/varsayılanları ve dil değişiminde seçimin korunması. Toplam 64 Node testi geçti; sözdizimi/diff kontrolleri temiz. Bu testler CSS piksel yerleşimi, fullscreen/PiP ve ekran okuyucu sonucu değildir; canlı Firefox/Chromium doğrulaması beklenir. `HMI_REVIEW.md` güncel tasarım önerilerini içerir.

### 4.19 v0.5.9 — Sol Şerit ve Referans Renkleri

- **Üç sekme:** Player hız/ses/kalite/adaptör, Subtitles dosya/senkron, Settings dil/erişilebilirlik/görüntü kontrolleri/yardım. Picture sekmesi kaldırıldı; filtreler Settings içinde varsayılan katlanmış akordeon olarak taşınır. Kontrol düğümleri ve handler'lar korunur; oynatıcı ve medya durumuna dokunulmaz.
- **Dikey gezinme:** `pvc-hud-body` iki sütunlu gövde, `pvc-hud-tabs` sol şerit, `pvc-hud-content` mevcut panellerin konak alanıdır. tablist aria-orientation vertical; ↑/↓/Home/End, roving tabindex, aria-selected/controls/labelledby korunur. Üç sabit SVG geometrisi aria-hidden span içinde, yanında çevrilebilir görünür adla yer alır. SVG içine kullanıcı/site metni girmez. Mini mod tüm gövdeyi gizler.
- **Alan dengesi:** Normal panel 388px, şerit 64px; viewport max-width/max-height sınırı korunur. 380px altındaki viewport'ta şerit 56px ve sarma düğmeleri iki sütundur. Metinler ve başlıklar sarılabilir. Bu ölçüler kaynak kararıdır, gerçek küçük ekran/200% zoom testi beklenir.
- **Tema:** Kullanıcı referansından örneklenen #0A1418 ana zemin, #1B2A33 kart, #6099B9 mavi vurgu. Metin #EDF2F3, ikincil #A2B6C0, küçük vurgu metni #92BFD5. UI köklerine bağlı `--pvc-*` değişkenleri CSS ve JS inline renkleri için ortaktır. Opak zemin, düşük parlama; yeşil/kehribar/kırmızı işlevsel durumlar korunur. Altyazı overlay stili ve video filtre hesapları değiştirilmez. High contrast kendi değişkenlerini ezer ve seçili sol sekmede açık dolgu/koyu metin çiftini korur. Yeni ağ/font/kütüphane, depolama, izin veya rapor alanı eklenmedi.
- **Doğrulama:** Dikey yön/oklar, üç panel, adaptör/filtre ebeveyni, filtre katlanması, kontrol kimliği/durumları ve normal/high-contrast opak renk çiftleri Node test kapsamındadır. Matematiksel renk oranları: text/bg 16.51:1, muted/elevated 7.01:1, accent-ink/elevated 7.46:1, bg/accent 6.00:1. Bunlar gerçek piksel kontrastı veya tüm UI erişilebilirliği onayı değildir; kaynak/renk hesabı ile canlı tarayıcı sonucu ayrıdır.

### 4.20 v0.5.10 — 20 Tema ve Kullanıcı Bileşen Referansları

- **Katalog:** SevenGrid sayfası tarayıcıda açılıp tema bandındaki 20 ad ve CSSOM renk değişkenleri incelendi. `UI_THEME_DEFINITIONS` yerel sayısal renk sabitleridir; site script/font/görseli alınmaz. 7 standart/koyu, 7 açık, 6 OLED. `UI_THEMES` aynı aile sırasıyla native optgroup ve Previous/Next için ortak sıralamadır; başlangıç Atlas. Kaynak/uyarlama karşılaştırması `THEME_EVALUATION.md`.
- **Kontrast:** Bir kez katalog kurulumunda opak üç yüzey için metin/ikincil/vurgu/durum 4.5:1, kenarlık 3:1 hedefine en küçük %1 RGB karışım adımı hesaplanır. Ana yüzeyler ve ana action rengi korunur. Seçili dolgu için siyah/beyazdan yüksek kontrastlı yazı seçilir. Bu matematik alpha/hover/focus/gerçek layout onayı değildir. Dekor ve durum dolguları color-mix ile tema değişkenlerini kullanır; bağımsız altyazı stili/medya filtre hesapları değişmez.
- **Seçim ve durum:** Settings içinde kapalı Themes alanı, gruplanmış native select, Önceki/Sonraki, ad/sayaç ve renk örnekleri. `currentUiThemeId` yalnızca çerçeve RAM'inde; `setUiTheme` bilinen ID'leri kabul eder. Düğüm/handler/input yeniden kurulmadan UI köklerine CSS değişkenleri uygulanır; medya API'si veya kalite taraması tetiklenmez. Yeni modal/toast `applyUiAccessibility` üzerinden temayı devralır. High contrast değişkenleri !important ile inline normal tema değişkenlerini ezer; seçim saklanır ve açıklama görünür olur. Native color-scheme açık temaları izler. Dil çevirisi optgroup label niteliğini de kapsar. Tema çerçeveler arasında aktarılmaz ve rapora eklenmez.
- **Bileşenler:** Voxybuns düğme hissi mevcut native eylemlere sınıf ekleyerek; WhiteNervosa/mrhyddenn check geometrisi raporun iki kutusuna; gharsh11032000 switch erişilebilirlik tercihlerine; eslam-hany input görünümü isteğe bağlı açıklamaya; Nawsome beş kare loader gerçek CDN ölçüm süresine uyarlandı. Input'lar display:none olmaz; native değer, checked/change, etiket ve klavye davranışı korunur. Ölçüm aria-busy/disabled ile sınırlandırılır; başarı/başarısızlıkta loader ve busy kaldırılır. Hareket azaltma animasyon ve düğme yolculuğunu kapatır. Namespace'ler pvc-*.
- **Kaynak kaydı:** `DESIGN_REFERENCES.md` sekiz URL'nin kullanıldığı/ertelendiği yerleri tutar. Radio ve tooltip sayfaları okundu, aynı örneklerin kodu Galaxy arşivinde bulunamadı; uygulanmadı. Formun checkout örneği incelendi ve uygun yerel form tasarımı için ayrıldı. Kullanılan beş örneğin HTML/CSS'i resmî Uiverse Galaxy arşivinden okunarak uyarlandı; doğrudan indirme engeli aşılmadı. MIT yazar/bildirimleri `THIRD_PARTY_NOTICES.md` içinde. Yeni runtime ağı/kütüphanesi, kalıcı depolama veya izin yoktur.
- **Doğrulama:** Node testleri tüm 20 katalog girdisini, aile/sıra tutarlılığını, türetilmiş renk çiftlerini, native seçici/ileri-geri, geçersiz ID reddi, mevcut/sonradan açılan kökler, kontrol/input kimliği, dil, high contrast öncelik kaydı, async loader cleanup ve dekorasyon idempotence'ını sınar. Gerçek Firefox/Chromium, küçük ekran, fullscreen, ekran okuyucu ve hareket/kontrast piksel doğrulaması beklenir.

### 4.21 v0.6.0 — İlk İyileştirme Aşaması

- **Aşamalı kapsam:** Kullanıcının v0.5.10 raporları `RELEASE_ROADMAP.md` içinde teknik bulgu/kabul koşullarıyla ayrıldı. v0.6.0 ilk pakettir; v0.6.1 kalite/iframe dışı sunum, v0.7.0 reklam yaşam döngüsü ve birleşik doğrulama hedefidir. Bunlar tamamlanmış gibi sunulmaz. 20 tema kalır. Çok küçük dağıtım düzeltmelerinde dört sayısal bileşen (örn. 0.6.0.1) kullanılabilir; geçmiş 0.5.10 sürümü geriye çevrilmez. GitHub push/release yapılmadı.
- **Filtre performansı:** Input handler'ları `scheduleVideoFilterUpdate` ile tek requestAnimationFrame'e birleşir. Callback son durumu tek seçime uygular; `appliedVideoFilters` WeakMap değişmeyen stili yazmaz. Nötr varsayılan CSS filter:none dayatmaz. Önceki inline filter/priority saklanır; reset veya video değişiminde yalnızca hâlâ eklentiye ait değer geri yüklenir. Site sonradan farklı yazmışsa üzerine reset uygulanmaz. Night shield filtre sırası korunur; brightness/contrast sepia üzerinden cebirsel olarak birleştirilmez. Canvas, video kopyası, will-change veya yeni GPU yüzeyi dayatılmaz. Modelde 200 input tek seçim/yazıma düşer; bu gerçek FPS/GPU kazancı ölçümü değildir.
- **Keşif:** `getMediaCandidates` adayları en fazla 1000ms RAM'de tutar; detached video, playing/loadedmetadata ve sayfa childList değişimleri geçersiz kılar. Gözlem attributes/style izlemez ve pvc UI değişikliklerini yok sayar. Shadow DOM ve iframe için TTL tekrar taraması korunur. Her aday bir kez puanlanır; sort comparator içindeki tekrarlanan layout okumaları kaldırıldı. Player instance'ları bu önbelleğe alınmaz; cascade ve probeAdapterHealth korunur.
- **HUD:** Pointer etkileşimiyle kalan focus, klavye etkileşiminin gizlenmeme korumasından ayrıldı. Hover/Keep visible ve klavye odağı koruması sürer. Normal mod artık yatay/dikey sürüklenebilir; açılış sağ üstte kalır. Cross-origin iframe içindeki HUD hâlâ frame sınırındadır; top-page sunum köprüsü açık iştir. Dış yerleşim çözüldü denmez.
- **Altyazı:** Subtitles içinde kapalı görünüm details alanı: 12–48px yazı, %0–40 alt mesafe, %0–100 arka plan opaklığı, sabit white/yellow. Bilinmeyen anahtar/renk ve finite olmayan sayılar reddedilir. Overlay çizimi ve native VTTCue.line konumu güncellenir; native fullscreen/PiP font boyutu tarayıcı kontrolünde kalır. Yeni geçerli dosya yüklemek subtitleOverlayEnabled'i açar ve düğmeyi günceller; loaded+disabled durumu dosya okunmadı olarak yorumlanmaz. Ayarlar/cue metni/dosya adı RAM'dedir; görünüm tercihleri rapora eklenmez.
- **Platform sınıflandırması:** `DIAGNOSTIC_PLATFORMS` fixed allowlist; player tanınıyorsa onun enum'u, değilse bilinen üst sayfanın enum'u kullanılır. Yeni ek alan `platformScope` yalnızca player/page/unlisted değerindedir; bilinmeyen site `other` kalır. content.js yalnızca allowlist'teki `NOK_PLATFORM_*` türlerini üstten alta, mevcut child WindowProxy'lerine iletir; geç frame request'i desteklenir. Domain/URL/hash/referrer/site başlığı aktarılmaz. Üst sayfa veya çocuk sayfa betikleri sayfa içi sinyalleri taklit edebilir; bu enum güvenlik yetkisi/medya komutu sağlamaz, sınıflandırma ipucudur.
- **Animasyon kaydı:** Kaynak beş bileşen resmî Galaxy arşivinden tekrar okundu; süre/eğri/halo/glow/floating-label/iç kapak farkları `ANIMATION_DETAILS.md` içinde ayrıntılıdır. Önceki sadeleştirmeler tercihti; ölçülmüş performans zorunluluğu gibi sunulmaz. v0.6.0 yeni dekoratif animasyon eklemez.
- **Doğrulama:** 82 Node testi; filtre input birleştirme/geri yükleme, candidate cache/invalidation, normal horizontal clamp, pointer-vs-keyboard idle, altyazı appearance validation/konum ve fixed platform propagation/scope dahil. JS syntax/diff kontrolü başarılıdır. Gerçek Firefox/Chromium, iframe/fullscreen/GPU yükü ve yardımcı teknoloji testi bekliyor. Site durumları yükseltilmedi.

### 4.22 v0.6.1 — Kalite Bağlamı, Kaynak Menüsü ve Kanıt

- `QUALITY_CONTROL.md` envanter yollarını, istisnaları ve kanıt sınırını ayrıntılandırır. `qualityControlState` / `qualityChoiceBindings` kalite seçeneğini video/player/source/epoch/generation'a bağlar. Detached/değişmiş video, yeni kaynak, manifest/media load veya yeniden sıralanmış seviye eski seçimi kullanamaz. Native kaynak menüsü / resolution-switcher için aynı video üzerinde sınırlı beklenen kaynak geçişi istisnası vardır; görüntü ayrıca doğrulanır.
- Generic için seçili tek videonun sahip olduğu Plyr/Video.js/JW kalite menülerinden strict numeric seçenekler okunur. Tüm sayfada sayı/metin araması yapılmaz. Tier 2 envanterine aynı yükseklikleri yinelenmeden eklenir; tek HLS seviyesi tüm sitenin tek kalite sunduğu anlamına gelmez. Video.js resolution-switcher getGroupedSrc/currentResolution ek yolu, adres değiştirmeyi siteye bırakır. Raw source/label/level RAM'de kalır; URL tahmin edilmez. Cascade/probeAdapterHealth, DRM ve Kick setter cache korunur.
- Request kabulü artık başarı değildir. pending/rendition-confirmed/decoded-match/confirmed/timed-out/rejected durumları; SDK seviye kimliği ile decoded video boyutu ayrı izlenir. 12s timeout görünürdür; geç gerçek eşleşme durumu düzeltebilir. HLS currentLevel/Video.js selectedIndex veya bir enabled bayrağı tek başına decoded başarı kanıtı sayılmaz. Düğme durumları yerinde güncellenir; gereksiz DOM yeniden kurma/aria-live tekrarları azaltıldı. Dinamik durum çevirisi iki dilde korunur.
- Teşhis readQualityDiagnostics ile sadece eşleşen kaydı okur. Eski adapter/cache/request yeni video için gösterilmez; unknown/not-evaluated ve sıfır cached count kullanılır. Bounded verification enum'u ve boolean/null decodedMatch/renditionMatch eklenir; getQualities/uygulama/ağ tetiklenmez. Rapor schema v2 additive kalır.
- Player → Video target kullanıcıya sıra/yükseklikle manuel video seçimi sunar; başlık/URL/DOM ID yoktur. Açık seçim daha yüksek puanlı başka videoya geçmez; hedef çıkarılınca serbest bırakılır. Görünür HUD'da 750ms kontrollü yenileme geç attach'i alır; idle-hidden durumunda geniş keşif durur, kapalı panelde timer sona erer. Mevcut rAF filtre optimizasyonu ve 20 tema korunur.
- 97 Node testi: kalite/menü sahipliği, kaynak/epoch/instance reddi, Video.js kaynak grupları, request-vs-rendition-vs-decoded, timeout/recovery, odağın/düğümün korunması, hedef seçimi ve idle yenileme sınırı dahil. Canlı Firefox/Chromium site/iframe/fullscreen onayı değildir. Cross-origin top HUD sunumu ve reklam yaşam döngüsü açık; v0.7.0 hedefi tamamlanmadı.

### 4.23 v0.7.0 — İframe Sunumu ve Reklam Yaşam Döngüsü (Test Adayı)

- `frame-protocol.js`: Main/Isolated World ve seçili çocuk dalı arasında allowlist şeması. Yeni RAM oturumu/sahip/sayaç, stale komut reddi ve kapatmada pending istek temizliği. Medya kaynak çerçevededir; normal HUD üstte, ancestor iframe fullscreen'de kaynakta. Ayrıntı: FRAME_PRESENTATION.md.
- Otomatik teknik durumda URL, içerik adı, izleme konumu, dosya adı veya altyazı metni yoktur. Altyazı yalnızca elle yüklenince cue komutu olarak kaynak dala iner. Teşhis yalnızca manuel istekle önizlemeye çıkar. Kalıcı depolama/izin eklenmedi.
- İnaktif/idle-hidden üst sunumda kaynak kalite taraması/aktarımı durur. Kaynak medya filtreleri rAF/diff ve aday cache sınırlarını korur. Gerçek GPU maliyeti azaltılmış gibi sunulmaz.
- Reklam yalnızca görünür tek videolu oyuncunun açık işaretiyle tespit edilir; 16x istenir, mute açılır, gerçek ve geri alınabilir en düşük kalite seçilir. Bitişte 1x/önceki ses-mute ve eşleşen kalite/ABR geri gelir. Kaynak/instance değişiminde eski kalite başka videoya uygulanmaz; Web Audio kurulmaz. AD_CONTROL.md.
- Kick kalite listesi SDK'den gelir; tahmini fallback kaldırıldı. IVS video sahipliği ve wrapper değişimine dayanıklı değer kimliği eklendi. Setter cache ve cascade korunur; gerçek Kick arayüz eşleşmesi ayrıca doğrulanmalıdır.
- 129 Node testi, JS syntax/diff kontrolü ve iki yerel kökende gerçek Edge ile 14 sentetik kontrol geçti. MediaStream 16x'i uygulamaz; yalnızca isteği sınar. Kurulu eklenti, nested gerçek tarayıcı, Firefox, gerçek reklam/site, ekran okuyucu, zoom, GPU/FPS açık kabul koşullarıdır. SITE_COMPATIBILITY durumu yükseltilmedi; push/tag/release yapılmadı.

### 4.24 v0.7.0.1 — Filtre ve Kalite Düzeltmeleri

- İframe filtresinde tek uçuş + son değer kuyruğu. Kullanıcı niyeti eşleşen kaynak durumuna kadar korunur; eski yanıt seçimi ezmez. Kapatma/oynatıcı değişimi kuyruk ve çizim işini iptal eder.
- Metin/span DOM değişimi keşif önbelleğini gereksiz bozmaz; medya/iframe değişimleri ve 1s keşif yenilemesi korunur.
- Video.js hedefi seçmiş ama eski tamponu oynatıyorsa, aynı video/instance ve iki hedef yükleyici kontrolünden sonra VHS kendi yenileme yolu bir kez denenir. Gerçek decoded eşleşme yine gereklidir.
- 142 Node testi; Firefox kurulu geçici eklentide sürekli iframe filtresi; Firefox/Edge gerçek yerel HLS-Video.js kalite geçişleri geçti. Eski 0.7.0 Edge zaman aşımı bu senaryoda kapandı. Özel test sitesi gerçek kabulü açık. RELEASE_NOTES_v0.7.0.1.md.

## 5. 📊 Sürüm Evrimi ve Çözülen Kritik Problemler

### v0.7.0 (Test Adayı — Kaynak ve Sentetik Regresyon Hazır)
- Tek üst iframe HUD'u, kaynak medya komutları, kaynak fullscreen geçişi ve oturum/sahip/sayaç sınırları.
- Reklam giriş/çıkışı, geri alınabilir gerçek en düşük kalite, 16x isteği/mute ve 1x/önceki ses-kalite dönüşü.
- Kick gerçek kalite ve video sahipliği; 129 Node + 14 sentetik Edge kontrolü. Gerçek site/Firefox ve gerçek hızlanma onayı değildir.

### v0.6.1 (Kalite Aşaması — Geliştirme, Canlı Test Bekliyor)
- Kalite seçeneği video/player/source/epoch'a bağlı; eski cache/adapter rapordan dışlanır.
- Seçili videonun native kaynak menüsü ve Video.js resolution-switcher kaynak grupları.
- İstek/oynatıcı/görüntü ayrımı, görünür timeout, iki dilde durum ve odak koruması.
- Çoklu video hedefi ve açık HUD ile sınırlı envanter yenileme. İframe dışı sunum/reklam işleri açık.

### v0.6.0 (İlk Aşama — Geliştirme, Canlı Test Bekliyor)
- Tek frame'de birleştirilen ve diff ile uygulanan filtreler, aday keşfi önbelleği.
- Pointer/klavye odak ayrımıyla idle gizlenmesi ve normal modda yatay sürükleme.
- Altyazı görünüm ayarları ve dosya yüklemede görünürlüğü açma.
- Gizlilik sınırını koruyan platformScope ve bilinen üst sayfa enum'u.
- v0.7.0 yol haritası ve ayrıntılı Uiverse animasyon karşılaştırması; eksik kalite/iframe dışı HUD/reklam işleri açık.

### v0.5.10 (Geliştirme — Canlı Test Bekliyor)
- Kaynakları incelenen 20 SevenGrid paleti; yerel tema seçici, kontrast uyarlaması ve high contrast önceliği.
- Beş Uiverse kontrol uyarlaması; native davranış ve gizlilik sınırı korunur.
- Kullanılan/ertelenen tasarımlar ve MIT bildirimleri proje içinde kayıtlı; canlı doğrulama beklenir.

### v0.5.9 (Geliştirme — Canlı Test Bekliyor)
- Simge ve kısa adlarla üç dikey sol sekme; Player adaptörü, Settings görüntü kontrolleri.
- Referansa dayalı koyu petrol/mavi tema ve ortak UI renk değişkenleri; yüksek kontrast korunur.
- Kontrol kimliği, dikey klavye gezinmesi ve renk çifti hesabı sınanır; canlı yerleşim testi beklenir.

### v0.5.8 (Geliştirme — Canlı Test Bekliyor)
- Tarayıcı dilinden bağımsız İngilizce başlangıç ve dört görev sekmesi.
- Kapalı erişilebilirlik alanı: açık tutma, büyük metin/kontroller, yüksek kontrast, azaltılmış hareket ve kısayol düğmesi.
- Sunum tercihleri çerçeve RAM'inde, rapordan ayrı; gerçek tarayıcı testi bekleniyor.

### v0.5.7 (Geliştirme — Canlı Test Bekliyor)
- Türkçe/English UI ve çerçeveler arasında yalnızca RAM'de dil tercihi.
- İsteğe bağlı çözüm sonrası silme talebi; JSON ve sabit taslak metni, otomatik silme yok.
- Klavye akordeonu, range adları, odak görünürlüğü ve HMI kaynak incelemesi.

### v0.5.6 (Geliştirme — Canlı Test Bekliyor)
- Çalışan iframe dalına tek HUD devri ve araç çubuğu kapat/aç koordinasyonu.
- TRT elemente özel geri alınabilir hız kilidi; beş denemede vazgeçen davranış kaldırıldı.
- Video.js VHS kalite listesi, Kick Radix ses handler önbelleği ve native hız menüsü fallback'i.
- Tek semantik tıklama ve aktif/elle istenen adaptör ayrımı; 50 Node testi, canlı doğrulama bekleniyor.

### v0.5.5 (Geliştirme — Canlı Test Bekliyor)
- Altyazı `display:none!important` öncelik hatası, videoya konumlandırma ve native track geçişi.
- HLS manifest/oynatılan çözünürlük ayrımı; geç seviye olayları, sınırlı envanter ve çizim durumları.
- Tek seviyeden kaynak genelinde tek kalite sonucu çıkarılmaz. 38 Node testi geçti; otomatik görsel/gerçek Firefox doğrulaması tamamlanmadı.

### v0.5.4 (Geliştirme — Canlı Test Bekliyor)
- Otomatik "Video bulma" sorun seçimi, SRT/VTT ayrıştırma ve sıfır-cue hata bildirimi.
- Videoya bağlı Shaka/Hls/Video.js instance seçimi, TRT kalite delegasyonu ve sınırlı hız koruması.
- İşlevsiz kalite listelerinin kaldırılması, iframe panel açma sinyali, pasif HTTP zamanlaması ve manuel güvenli HEAD ölçümü.
- Kaynak/Node regresyon testleri; gerçek tarayıcı ve site doğrulaması beklenmektedir.

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
├── _locales/                 # en/tr eklenti açıklaması (tarayıcı dili)
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
│   ├── diagnostics.test.cjs    # Bağımlılıksız Node gizlilik/rapor sınırı testleri
│   ├── player-controls.test.cjs # Altyazı, instance/kalite/hız, iframe ve HTTP regresyonları
│   ├── frame-coordination.test.cjs # Kardeş/iç içe iframe HUD koordinasyonu
│   ├── hud-navigation.test.cjs # Sekmeler, durum koruma ve erişilebilirlik tercihleri
│   ├── localization.test.cjs   # Dil/DOM durum koruma ve çeviri testleri
│   ├── kick-ui.test.cjs        # Radix ses handler ve hız menüsü regresyonları
│   └── ui-preview-server.cjs   # Localhost sentetik altyazı/HLS manuel önizlemesi
├── DESIGN_REFERENCES.md       # Kullanılan/ertelenen sekiz kullanıcı tasarım kaynağı
├── THEME_EVALUATION.md        # 20 paletin kaynak ve HUD değerlendirmesi
├── THIRD_PARTY_NOTICES.md     # Uyarlanan Uiverse bileşenlerinin MIT bildirimleri
├── HMI_REVIEW.md              # Kaynak temelli kullanılabilirlik bulguları ve canlı kabul ölçütleri
├── README.md                  # Hızlı kurulum ve proje özeti
├── SITE_COMPATIBILITY.md      # Katı kurallı site uyumluluk ve durum takip tablosu
└── PROJECT_MASTER_GUIDE.md    # BU DOSYA (Eksiksiz mimari, geçmiş, felsefe ve devir kılavuzu)
```

---

## 9. 🔄 Geliştirici Devir & Yeni Konuşmaya Taşıma Kılavuzu

Eğer projeyi yeni bir yapay zeka modeline, başka bir konuşmaya veya yeni bir yazılımcıya devrediyorsanız, aşağıdaki kontrol listesini ve prompt şablonunu kullanabilirsiniz:

### Yeni Konuşmayı Başlatırken Kullanılacak Prompt Şablonu:
```text
NOk Video Controller projesini geliştirmeye devam ediyoruz (Mevcut sürüm: v0.7.0.1 düzeltme adayı; Firefox/Edge yerel testleri geçti; gerçek site kabulü bekliyor). RELEASE_ROADMAP.md kaynak aşamalarını ve açık canlı kabul koşullarını; FRAME_PRESENTATION.md iframe sınırlarını, AD_CONTROL.md reklam davranışını; QUALITY_CONTROL.md kalite kanıt sınırını, ANIMATION_DETAILS.md kaynak/uyarlama farklarını açıklar. 142 Node testi ve yerel Firefox/Edge kanıtı gerçek site onayı değildir; eski Edge Video.js kalite zaman aşımı yerel senaryoda giderildi. RELEASE_NOTES_v0.7.0.1.md güncel paket kanıtıdır.
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

## 22 Ekim 2026 — yeni raporlar sonrası kaynak çalışması

Güncel kapsam [ACTIVE_WORK.md](./ACTIVE_WORK.md), 152 Node testi ve tarayıcı kontrol sınırları [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md), Firefox/Chromium bellek bulguları [MEMORY_MEASUREMENTS.md](./MEMORY_MEASUREMENTS.md) içinde tutulur. Rapor platformu varsayılan other; kullanıcı seçerse önizlemedeki alan adı/platform paylaşılır. Açıklama sınırı görünür sayaçlı 4000 karakterdir; anonimleştirme değildir. Özel site test notları Git dışında yerelde kalır. Eski paket kanıtları yukarıda tarihleriyle korunur; yeni release veya ZIP hazırlanmadı.

### v0.7.2 — sahipli ses bağlamı ve bellek temizliği

Her video kendi isteğe bağlı Web Audio bağlamına sahiptir. Kaldırmada bağlantı kesilir ve bağlam suspend edilir; yeniden ekleme için binding korunur. Video erişilemez olduğunda FinalizationRegistry yalnız bu bağlamı kapatır. Native stereo <=100% ve DRM bypass korunur. Ses seviyesi güncellemeleri DSP bağlantısını tekrar kurmaz; son gain isteği AudioParam.value gecikmesinden bağımsız tutulur. 158 Node testi ve Firefox/Chromium nesne yaşam döngüsü ölçümleri; kapsam/sınırlamalar MEMORY_MEASUREMENTS.md içinde. Bu kaynak artışı release veya ZIP değildir. Her sonraki sürüm artışında kullanıcıya değişiklik, kanıt ve hedef durumu bildirilecektir.
