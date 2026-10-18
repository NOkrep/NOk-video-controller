# 🌐 NOk Video Controller — Site Uyumluluk ve Durum Takip Tablosu (`SITE_COMPATIBILITY.md`)

> **Son Güncelleme:** v0.5.4 (geliştirme; canlı doğrulama bekliyor)
> **Yönetim Kuralı (Katı Protokol):**
> 1. **✅ Tam Çalışıyor:** Bu bölüme **yalnızca geliştiricilerin açık testi ve onayı/talebi** ile site eklenebilir. Yapay zeka kendi inisiyatifiyle bu bölüme site ekleyemez.
> 2. **🟡 Yarı Çalışıyor (Test / Geliştirme Aşamasında):** Siteye özel bir adaptör/değişiklik yazıldığında, siteye dair herhangi bir değişiklik yapıldığında veya mevcut basamaklı adaptör mimarisinin (Tier 1 / Tier 2 / Tier 3) sitede çalışacağı öngörüldüğünde eklenir.
> 3. **❌ Hiç Çalışmıyor (Desteklenmiyor):** Geliştiriciler tarafından "bu sitede çalışmıyor" bilgisi verildiğinde veya çok bilinen bir site için sistemlerine özgü bir şey hazırlanmadığından çalışmayacağı düşünüldüğünde buraya eklenir.

---

## ✅ 1. Tam Çalışıyor (Geliştirici Onaylı)

*Henüz geliştirici tarafından "Tam Çalışıyor" onayı verilerek bu listeye taşınmış bir platform bulunmamaktadır. Testler tamamlandıkça geliştirici talebiyle eklenecektir.*

| Platform / Site | Alan Adı (Domain) | Aktif Adaptör & Kademe | Firefox (Gecko) | Chrome (Chromium) | Onaylayan & Notlar |
| :--- | :--- | :--- | :---: | :---: | :--- |
| *Bekleniyor* | `-` | `-` | `-` | `-` | Geliştirici onayı bekleniyor. |

---

## 🟡 2. Yarı Çalışıyor / Kısıtlı (Geliştirme & Test Aşamasında)

Bu listedeki siteler için özel adaptörler (Tier 1/2) veya evrensel tarayıcı (Tier 3 / DRM Güvenli Mod) geliştirmeleri mevcuttur; uçtan uca geliştirici onayı beklenmektedir.

v0.5.4'te seçili videoya bağlı oynatıcı instance seçimi, TRT Shaka kalite/hız çağrıları, altyazı ayrıştırması ve iframe panel açma sinyali düzeltildi; Node regresyon testleri gerçek site onayı değildir. Başka kökenli iframe içindeki motorun çalışması hâlâ o çerçevenin izin/CSP/enjeksiyon durumuna bağlıdır. Yeni raporlar kaynak adreslerini ve özel alan adlarını içermez. Teknik değerlendirme `PROJECT_MASTER_GUIDE.md` Bölüm 4.7 ve 4.14'te tutulur.

| Platform / Site | Alan Adı (Domain) | Aktif Adaptör & Kademe | Çalışan / Beklenen Özellikler | Bilinen Kısıtlar veya Test Edilecekler |
| :--- | :--- | :--- | :--- | :--- |
| **Kick** | `kick.com` | `KickAdapter` (Tier 1) | Canlı & VOD hız kontrolü, 0ms React Fiber ses önbelleklemesi, Radix UI ses eşitlemesi, Amazon IVS kalite seçimi, görüntü filtreleri, klavye kısayolları. | VOD menü geçişleri ve canlı reklam (16x) geçiş kararlılığı Firefox ve Chrome'da doğrulama bekliyor. |
| **TRT 1 & TRT İzle** | `trt1.com.tr`, `trtizle.com`, `trt.com.tr` | `TrtAdapter` (Tier 1) | Ulaşılabilen Shaka/Hls.js/Video.js instance'ına kalite delegasyonu; bilinen eski HLS rotasında ağ fallback'i, olay izolasyonu, ses barı eşitlemesi, sınırlı hız koruması, filtreler. | v0.5.3 Firefox raporunda kalite ve 1x'e dönen hız sorunu doğrulandı; v0.5.4 uygulaması gerçek sitede tekrar test edilmeli. |
| **Now TV (FOX)** | `nowtv.com.tr` | `NowTvAdapter` (Tier 1) | Video.js `qualityLevels` kilidi, ErCDN BVR (`bvr_bw`) bitrate zorlama modu, hız, %300 ses yükseltici, filtreler ve harici altyazı. | Tek akışlı SMIL yayınlarda CDN'in `bvr_bw` parametresine verdiği anlık çözünürlük tepkisi doğrulanmalı. |
| **PuhuTV** | `puhutv.com` | `PuhuTvAdapter` (Tier 1) | Video.js VHS kalite listesi, DYG Video API kancası ile Akamai'den MNCDN `1080p.smil` FHD akışına geçiş, hız, ses ve filtreler. | MNCDN geçişinde tampon yenileme (smooth switch) performansı farklı dizilerde test edilmeli. |
| **YouTube** | `youtube.com` | `YouTubeAdapter` (Tier 2) | `movie_player` API üzerinden kalite okuma/değiştirme, 0.25x–3.0x hız, %300 ses güçlendirici, Stereo/Mono, görüntü filtreleri, harici `.srt/.vtt` altyazı. | YouTube arayüz güncellemelerinde kalite API'sinin (`setPlaybackQualityRange`) davranış tutarlılığı izlenmeli. |
| **Reddit & X (Twitter)** | `reddit.com`, `x.com` | `GenericAdapter` (Tier 3) | Özyinelemeli açık Shadow DOM (`deepFindMediaElements`) ve standart `<video>` taraması ile hız, %300 ses yükseltici, sarma, görüntü filtreleri. | Bu platformlara özel HLS/DASH kalite ayıklayıcı (Tier 1 adaptörü) henüz yazılmadığı için manuel çözünürlük kilidi çalışmaz. |
| **Twitch** | `twitch.tv` | `GenericAdapter` (Tier 3) | Standart `<video>` elemanı üzerinden hız, ses, sarma ve görüntü filtreleri. | Twitch'e özgü Tier 1 kalite adaptörü henüz yazılmadığı için HUD üzerinden akış kalitesi değiştirilemez. |
| **DRM Korumalı VoD Platformları** | `netflix.com`, `disneyplus.com`, `primevideo.com`, `tabii.com`, `blutv.com`, `exxen.com`, `gain.tv` | `GenericAdapter` (Tier 3 + DRM Güvenli Mod) | Standart `<video>` etiketi üzerinden yerel ses (%0–%100), hız, görüntü filtreleri ve harici altyazı katmanı (gerçek tarayıcı testi gerektirir). | EME/DRM şifrelemesi nedeniyle Web Audio API (%300 ses booster) donanım ses kesintisini önlemek için otomatik devre dışı bırakılır; özel kalite adaptörleri yoktur. |

---

## ❌ 3. Hiç Çalışmıyor (Desteklenmiyor)

| Platform / Senaryo | Alan Adı / Kapsam | Çalışmama Nedeni (Teknik Gerekçe) |
| :--- | :--- | :--- |
| **Salt `<audio>` Tabanlı Medya Siteleri** | `open.spotify.com` vb. | Eklentinin medya tarayıcısı (`deepFindMediaElements`) yalnızca `tagName === 'VIDEO'` olan elemanları hedeflemektedir; `<audio>` etiketleri kapsam dışıdır. |
| **Tarayıcı Sistem & Mağaza Sayfaları** | `chrome://`, `about:`, `addons.mozilla.org` | Tarayıcı güvenlik kısıtlamaları nedeniyle eklenti betiklerinin sistem sayfalarına enjekte edilmesi engellenmektedir. |
