# NOk Video Controller — Kapsamlı Proje & Mimari Kılavuzu (Master Architecture & Handover Guide)

> **Sürüm:** v0.5.1  
> **Geliştirici:** NOkrep ([GitHub](https://github.com/NOkrep/NOk-video-controller) | `ihsanartrk07@gmail.com`)  
> **Platform Uyumluluğu:** Chrome, Brave, Edge, Opera, Firefox (Manifest V3 WebExtensions)  
> **Son Güncelleme:** v0.5.1 (Evrensel Medya Tespiti, Shadow DOM Derin BFS Taraması, DRM/EME Korumalı İçerik Güvenli Modu, 3-Kademeli Basamaklı Adaptör Mimarisi)

---

## 1. 📌 Yönetici Özeti & Temel Misyon

**NOk Video Controller**, Türkiye'deki ve dünyadaki popüler canlı yayın ile VoD (Video on Demand) platformlarında kullanıcıya video oynatıcı üzerinde eksiksiz hakimiyet sağlayan, **sıfır depolama izinli (Zero-Storage / In-Memory Stateless)**, evrensel uyumluluklu modern bir tarayıcı eklentisidir.

### Temel Yetenekler:
1. **Evrensel Medya ve Shadow DOM Derin Taraması (v0.5.1):**
   - `<all_urls>` desteğiyle her sitede çalışma olanağı.
   - Açık/kapalı Shadow Root'lar, Web Component'ler (YouTube, Reddit, Twitter/X, Mux) ve aynı kökenli iframe'lerdeki `<video>` etiketlerini özyinelemeli BFS ile yakalama.
   - Akıllı Video Puanlama Matrisi: Oynatılan (+120), sesi açık (+40), viewport içinde (+30), en büyük alana sahip video önceliği.
2. **DRM / EME Korumalı İçerik Tespiti & Güvenli Mod (v0.5.1):**
   - Widevine, FairPlay, PlayReady şifrelemeli akışları (`video.mediaKeys`, `encrypted` event) otomatik algılama.
   - Donanım ses susturmasını önlemek için Web Audio API booster'ını güvenli modda atlayıp yerel ses kontrolünü (%100) koruma.
   - HUD üzerinde `🛡️ DRM Korumalı Akış` rozeti ve bilgilendirici kılavuz paneli.
3. **3-Kademeli Basamaklı Adaptör Mimarisi (Cascade Strategy Pipeline - v0.5.1):**
   - **Tier 1 (Siteye Özel):** Kick.com, TRT 1 / TRT İzle, Now TV, PuhuTV.
   - **Tier 2 (Oynatıcı Kütüphaneleri):** YouTube (`movie_player`), Video.js, Hls.js, Shaka Player, Dash.js.
   - **Tier 3 (Evrensel Standart):** HTML5 & Shadow DOM doğrudan denetimi.
   - Canlı sağlık kontrolü (`probeAdapterHealth`), HUD üzerinden tek tıkla manuel adaptör değiştirme ve tek tıkla Sıfır-PII anonim JSON teşhis kopyalama.
4. **Ağ Seviyesinde HLS / SMIL / BVR Kalite Kilitleri:**
   - TRT 1 & TRT İzle (`cdn-v.pr.trt.com.tr` üzerinde HLS `master1080p`, `720p`, `576p`, `480p`, `360p` yönlendirmesi).
   - Now TV / Fox (ErCDN BVR segment bant genişliği zorlaması `bvr_bw=...`).
   - PuhuTV (DYG Video API akıllı yönlendirmesi: Akamai vs. MNCDN 1080p FHD SMIL rotası).
5. **Kick.com Derin Entegrasyonu:**
   - Amazon IVS Player SDK erken yakalama (`IVSPlayer.create`, `AmazonIVS.createMediaPlayer`, `attachHTMLVideoElement`).
   - React Fiber (Next.js / Radix UI) hook ve setter fonksiyonlarını **0ms önbellekleme** ile yönetme (UI donması olmadan ses kontrolü).
   - Kick VOD oynatma hızını yerel 2-kademeli ayarlar penceresini (popover sub-menu) otomatik simüle ederek değiştirme.
   - Sessizden (%0) çıkıldığında Radix UI Slider pointer dispatch ve Kick mute butonu PointerEvent tıklaması ile un-mute garantisi.
3. **Web Audio API ile Gelişmiş Ses:**
   - %0 ile %400 arasında ses yükseltme (`GainNode` booster).
   - Stereo ve Mono modları arasında tek tıkla matris geçişi (`ChannelSplitterNode` + `ChannelMergerNode`).
4. **Kesintisiz Oynatma Hızı:**
   - 0.25x ile 4x arasında kademesiz slider ve hızlı preset butonları.
   - TRT gibi oynatıcıların hızı zorla 1x'e sıfırlamasını engelleyen `playbackRate` kilidi.
5. **4 Kademeli Hassas Sarma:**
   - `-30s`, `-10s`, `+10s`, `+30s` ile canlı yayın tamponunda ve VoD içeriklerinde anlık atlama.
6. **Canlı Çözünürlük ve Kare Hızı Rozeti:**
   - `requestVideoFrameCallback` ile oynatılan videonun anlık render piksel boyutunu (`videoWidth` x `videoHeight`) ve çözünürlük etiketini (4K, 1080p FHD, 720p HD vb.) hesaplayıp rozete basma.
7. **2-Kademeli Akıllı Saydam HUD (Idle Fade):**
   - Video izlerken dikkati dağıtmamak için 2 saniye hareketsizlikte %88 yarı-saydamlık (`opacity: 0.12`), ek 2 saniye sonra tamamen görünmezlik (`opacity: 0`). Fare hareketinde veya üzerine gelindiğinde anında %100 netlik.
8. **Sıfır Kişisel Veri (Zero-PII) Teşhis & Hata Raporlama:**
   - Stream URL'lerindeki tüm güvenlik tokenlarını ve imzaları maskeleyen (`sanitizeStreamUrl`), bellek içi 40 kayıttan oluşan log tamponu, son 3 sürüm geçmişi ve tek tıkla kopyalanabilir/gönderilebilir hata paneli.

---

## 2. 🏛️ Mimari Tasarım & Çalışma Prensibi

Chrome Manifest V3 kısıtlamaları altında sayfa içi oynatıcı değişkenlerine erişmek için iki katmanlı hibrit enjeksiyon modeli kullanılmıştır:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TARAYICI (BROWSER)                              │
├────────────────────────────────┬───────────────────────────────────────┤
│    BACKGROUND SERVICE WORKER   │  KULLANICI ETKİLEŞİMİ (Toolbar Click) │
│         (background.js)        │  - activeTab izniyle sekmeyi yakalar  │
│                                │  - injected.css & content.js enjekte  │
└────────────────────────────────┴──────────────────┬────────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               ISOLATED WORLD (content.js)                              │
│  - Tarayıcı eklenti API'lerine erişebilir                              │
│  - Sayfanın global window/React nesnelerine erişemez                   │
│  - Dinamik <script src="injected.js"> oluşturup DOM'a ekler ve siler   │
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
- **Tespit:** `video.mediaKeys`, `encrypted` olayı ve `WebKitMediaKeys` varlığı izlenir.
- **Reaksiyon:** EME algılandığında Web Audio API (`createMediaElementSource`) **bilinçli olarak bypass edilir**; ses yerel `video.volume` (%100) üzerinden yürütülür.
- **Kullanıcı Geri Bildirimi:** HUD üzerinde `🛡️ DRM Korumalı Akış` rozeti çıkar; tıklandığında *"Bu içerik platform tarafından şifrelenmiştir. Donanım koruması gereği harici ses güçlendirici sınırlandırılmış olup, temel ses, oynatma hızı ve sarma kontrolleri tam aktiftir"* bilgilendirmesi sunulur.

---

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

---

## 5. 📊 Sürüm Evrimi ve Çözülen Kritik Problemler

### v0.5.0 (Mevcut Kararlı Sürüm)
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

### 5. Harici Altyazı Desteği (External Subtitle Loader & Sync)
- Yerel `.srt` veya `.vtt` dosyasını sürükleyip bırakarak videoya altyazı ekleme.
- `+100ms` / `-100ms` altyazı senkronizasyon kaydırma butonları.

---

## 8. 📂 Dosya Ağacı ve Sorumluluk Matrisi

```
NOk-video-controller/
├── manifest.json              # Manifest V3 eklenti tanımlayıcısı (İzinler, Content Script kuralları)
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

---

## 9. 🔄 Geliştirici Devir & Yeni Konuşmaya Taşıma Kılavuzu

Eğer projeyi yeni bir yapay zeka modeline, başka bir konuşmaya veya yeni bir yazılımcıya devrediyorsanız, aşağıdaki kontrol listesini ve prompt şablonunu kullanabilirsiniz:

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

### Kodlama ve Geliştirme Kuralları (Kırmızı Çizgiler):
1. **Sıfır Depolama Kuralı:** Asla kalıcı depolama eklemeyin. Ayarlar bellek içinde (`injected.js` içindeki JS değişkenlerinde) tutulur; sekme yenilendiğinde sıfırlanması projenin bilinçli mimari tercihidir.
2. **Konsol Kirliliği:** Kod içerisine periyodik `console.log` basmayın; loglama yalnızca `addDiagnosticLog` fonksiyonu ile bellek içi ring buffer'a yazılmalıdır.
3. **Sürüm Numaralandırması:** Bir özellik veya düzeltme yapıldığında şu 4 dosyada sürüm numarasını eşitleyin:
   - `manifest.json` (`"version"`)
   - `package.json` (`"version"`)
   - `injected.js` (`EXTENSION_VERSION` ve `VERSION_HISTORY`)
   - `server.js` (`/api/health` ve ZIP dosya adı)
4. **Testbed Senkronizasyonu:** `index.html` dosyasındaki test video ve simülasyon butonlarını güncel tutun.

---
*NOk Video Controller bir **NOkrep** açık kaynak projesidir.*
