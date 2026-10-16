# 🌐 NOk Video Controller — Site Uyumluluk ve Durum Takip Tablosu (`SITE_COMPATIBILITY.md`)

> **Son Güncelleme:** v0.5.2  
> **Yönetim Kuralı (Katı Protokol):**
> 1. **✅ Tam Çalışıyor:** Bu bölüme **yalnızca geliştiricilerin açık testi ve onayı/talebi** ile site eklenebilir. Yapay zeka kendi inisiyatifiyle bu bölüme site ekleyemez.
> 2. **🟡 Yarı Çalışıyor (Test / Geliştirme Aşamasında):** Siteye özel bir adaptör/değişiklik yazıldığında veya mevcut basamaklı adaptör mimarisinin (Tier 1 / Tier 2 / Tier 3) sitede çalışacağı öngörüldüğünde eklenir.
> 3. **❌ Hiç Çalışmıyor (Desteklenmiyor / Kısıtlı):** Geliştiriciler tarafından çalışmadığı bildirilen siteler veya kendisine özgü kapalı/şifreli bir mimarisi olup henüz özel adaptör hazırlanmadığı için çalışmayacağı bilinen popüler platformlar buraya eklenir.

---

## ✅ 1. Tam Çalışıyor (Geliştirici Onaylı)

*Henüz geliştirici tarafından "Tam Çalışıyor" onayı verilerek bu listeye taşınmış bir platform bulunmamaktadır. Testler tamamlandıkça geliştirici talebiyle eklenecektir.*

| Platform / Site | Alan Adı (Domain) | Aktif Adaptör & Kademe | Firefox (Gecko) | Chrome (Chromium) | Onaylayan & Notlar |
| :--- | :--- | :--- | :---: | :---: | :--- |
| *Bekleniyor* | `-` | `-` | `-` | `-` | Geliştirici onayı bekleniyor. |

---

## 🟡 2. Yarı Çalışıyor (Geliştirme & Test Aşamasında)

Bu listedeki siteler için özel adaptörler (Tier 1/2) veya evrensel tarayıcı (Tier 3) geliştirmeleri yapılmıştır; ancak tüm fonksiyonların (kalite kilidi, hız, %300 ses booster, filtreler, altyazı) uçtan uca geliştirici onayı beklenmektedir.

| Platform / Site | Alan Adı (Domain) | Aktif Adaptör & Kademe | Çalışan / Beklenen Özellikler | Bilinen Eksikler veya Test Edilecekler |
| :--- | :--- | :--- | :--- | :--- |
| **Kick** | `kick.com` | `KickAdapter` (Tier 1) | Canlı & VOD hız kontrolü, 0ms React Fiber ses önbelleklemesi, Radix UI ses eşitlemesi, Amazon IVS kalite seçimi, görüntü filtreleri, klavye kısayolları. | VOD 2-kademeli menü geçişleri ve canlı reklam (16x) geçiş kararlılığı hem Firefox hem Chrome'da doğrulama bekliyor. |
| **TRT 1 & TRT İzle** | `trt1.com.tr`, `trtizle.com`, `trt.com.tr` | `TrtAdapter` (Tier 1) | `cdn-v.pr.trt.com.tr` HLS ağ kancası (`master1080p`–`360p`), `e.stopPropagation()` HUD olay izolasyonu, ses barı eşitlemesi, hız kilidi, filtreler. | Canlı yayın ile arşiv (VOD) içerikleri arasında manifest URL yapısı farklılıkları test edilmeli. |
| **Now TV (FOX)** | `nowtv.com.tr` | `NowTvAdapter` (Tier 1) | Video.js `qualityLevels` kilidi, ErCDN BVR (`bvr_bw`) bitrate zorlama modu, hız, %300 ses yükseltici, filtreler ve harici altyazı. | Tek akışlı SMIL yayınlarda CDN'in `bvr_bw` parametresine verdiği anlık çözünürlük tepkisi doğrulanmalı. |
| **PuhuTV** | `puhutv.com` | `PuhuTvAdapter` (Tier 1) | Video.js VHS kalite listesi, DYG Video API kancası ile Akamai'den MNCDN `1080p.smil` FHD akışına geçiş, hız, ses ve filtreler. | MNCDN geçişinde tampon yenileme (smooth switch) performansı farklı dizilerde test edilmeli. |
| **YouTube** | `youtube.com` | `YouTubeAdapter` (Tier 2) | `movie_player` API üzerinden kalite okuma/değiştirme, 0.25x–3.0x hız, %300 ses güçlendirici, Stereo/Mono, görüntü filtreleri, harici `.srt/.vtt` altyazı. | YouTube'un yeni arayüz güncellemelerinde kalite API'sinin (`setPlaybackQualityRange`) davranış tutarlılığı izlenmeli. |
| **Reddit** | `reddit.com` | `GenericAdapter` (Tier 3 - Shadow DOM) | Açık Shadow Root BFS taraması (`shreddit-player`), hız, %300 ses yükseltici, sarma, görüntü filtreleri. | Reddit'e özgü HLS/DASH paket ayıklayıcı (Tier 1 adaptörü) henüz yazılmadığı için manuel çözünürlük kilidi çalışmaz. |
| **X (Twitter)** | `x.com`, `twitter.com` | `GenericAdapter` (Tier 3) | Hız kontrolü, %300 ses yükseltici, Stereo/Mono, ±10s/30s sarma, görüntü filtreleri. | X oynatıcısına özel kalite seçici adaptörü henüz mevcut değil; çoklu videolu akışta aktif video puanlaması test edilmeli. |
| **Standart Video.js / Hls.js Siteleri** | Genel (`<all_urls>`) | `VideoJsAdapter` / `HlsJsAdapter` (Tier 2) | Global `window.videojs` veya `window.Hls` nesnelerini dışa açan sitelerde kalite seçimi, hız, ses, filtre ve altyazı. | Oynatıcı örneğini (instance) kapalı Webpack/Vite closure içinde saklayan sitelerde Tier 3'e (salt HTML5 kontrolüne) düşer. |

---

## ❌ 3. Hiç Çalışmıyor / Desteklenmiyor (Özel Sistem veya DRM Kısıtı)

Aşağıdaki popüler platformlar, kendilerine özgü kapalı oynatıcı mimarileri veya donanım seviyesinde DRM (Widevine / FairPlay / PlayReady) şifrelemeleri nedeniyle özel bir çalışma yapılmadığı için şu an desteklenmemektedir (veya temel özellikler kilitlidir):

| Platform / Site | Alan Adı (Domain) | Çalışmama / Kısıt Nedeni (Teknik Gerekçe) |
| :--- | :--- | :--- |
| **Netflix** | `netflix.com` | **Katı DRM (Widevine EME) & Özel Cadmium Oynatıcı:** Ağ seviyesinde manifest/kalite müdahalesi şifreli lisans nedeniyle imkansızdır. Web Audio API bağlandığında donanım sesi kesildiği için %300 ses yükseltici devre dışı kalır. Özel Netflix adaptörü yoktur. |
| **Disney+ & Amazon Prime Video** | `disneyplus.com`, `primevideo.com` | **Widevine / PlayReady DRM & Özel DASH Sarmalayıcı:** Şifreli medya akışları nedeniyle kalite kilidi ve Web Audio API ses güçlendirici çalışmaz; platforma özgü UI/API adaptörü hazırlanmamıştır. |
| **TRT Tabii, BluTV, Exxen, Gain** | `tabii.com`, `blutv.com`, `exxen.com`, `gain.tv` | **Yerli DRM / Özel Token Mimarisi:** `PROJECT_MASTER_GUIDE.md` yol haritasında belirtildiği üzere bu platformların özel HLS/DASH kimlik doğrulama ve DRM yapılarına özgü Tier 1 adaptörleri henüz geliştirilmemiştir. |
| **Twitch** | `twitch.tv` | **Web Worker Tabanlı Özel Oynatıcı:** Twitch, medya akışını ve kalite kontrolünü izole Web Worker içinde yönetir. Twitch'e özgü bir Tier 1 adaptörü henüz yazılmadığı için kalite paketlerine müdahale edilemez. |
| **Spotify Web Player** | `open.spotify.com` | **EME Şifreli Ses Akışı (`<audio>`):** Eklenti şu an yalnızca `<video>` etiketlerini (`tagName === 'VIDEO'`) hedeflemektedir ve Spotify akışları Widevine DRM ile şifrelendiği için çalışmaz. |
| **Cross-Origin Gömülü Oynatıcılar (Bazı Dizi/Film Siteleri)** | Çeşitli (`iframe`) | Video, ana sayfadan farklı bir alan adına sahip `iframe` içindeyse, ana sayfadaki HUD iframe içindeki videoya güvenlik duvarı (Same-Origin Policy) nedeniyle doğrudan hükmedemez (yalnızca iframe kendi içinde script çalıştırırsa yakalanabilir). |