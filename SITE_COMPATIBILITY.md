# 🌐 NOk Video Controller — Site Uyumluluk ve Durum Takip Tablosu (`SITE_COMPATIBILITY.md`)

> **Son Güncelleme:** v0.5.10 (geliştirme; canlı doğrulama bekliyor)
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

v0.5.4 Firefox raporunda HlsJsAdapter ve başarılı altyazı yüklemesi görülmüş, ancak kullanıcı altyazının görünmediğini ve tek boş kalite etiketi olduğunu bildirmiştir. v0.5.5 bu kaynak hatalarını ve envanter güncellemelerini düzeltir; gerçek siteye dair yeni çalışma onayı verilmemiştir. Oynatıcının bir seviye bildirmesi site genelinde tek kalite bulunduğu anlamına gelmez.

v0.5.5 kullanıcı raporlarında çift HUD (üst panel boş, iframe paneli çalışır), TRT hızının koruma denemelerinden sonra 1x'e dönmesi ve Video.js yerel kalite seçeneklerinin eklentide görünmemesi bildirildi. Kick için kullanıcı hız/sesin değişip yerel arayüzün eşleşmediğini ayrıca doğruladı. v0.5.6 bu yollar için kaynak düzeltmeleri ve Node regresyonları içerir; gerçek site onayı beklenir.

v0.5.7 Türkçe/İngilizce arayüz, sabit sinyalli çerçeve dil eşitlemesi ve isteğe bağlı çözüm sonrası rapor silme talebi ekler. Bunlar site uyumluluğu onayı değildir; iki dilde Firefox/Chromium yerleşimi, klavye kullanımı ve çalışan iframe paneli canlı test bekler. Kaynak temelli arayüz değerlendirmesi `HMI_REVIEW.md` içindedir.

v0.5.8 her sayfada İngilizce başlar; Player/Picture/Subtitles/Settings sekmeleri ve açılır erişilebilirlik alanı ekler. Büyük yazı, yüksek kontrast, açık tutma ve hareket azaltma tercihleri RAM'dedir. Sekme/dil değişiminde kontrollerin durumu Node modelinde korunur; gerçek yerleşim, fullscreen ve ekran okuyucu testi beklenir. Site çalışma durumları değiştirilmedi.

v0.5.9 solda Player/Subtitles/Settings sekmeleri, Player'a taşınan adaptör ve Settings içindeki görüntü kontrolleriyle referans temayı uygular. Oynatıcı/adaptör mantığı ve site onayları değiştirilmedi. Dikey klavye gezinmesi ve opak renk çiftleri Node test kapsamındadır; gerçek Firefox/Chromium, zoom, fullscreen ve ekran okuyucu doğrulaması beklenir.

v0.5.10 tüm 20 SevenGrid paletini yerel seçiciyle ve beş Uiverse kontrol uyarlamasını ekler. Ana oynatıcı API'leri/adaptör hattı değişmez. Her iki dilde açık/koyu/OLED, high contrast, reduced motion, native checkbox/switch ve async ölçüm görünümü canlı tarayıcıda test bekler. Site durumları otomatik yükseltilmedi.

| Platform / Site | Alan Adı (Domain) | Aktif Adaptör & Kademe | Çalışan / Beklenen Özellikler | Bilinen Kısıtlar veya Test Edilecekler |
| :--- | :--- | :--- | :--- | :--- |
| **Kick** | `kick.com` | `KickAdapter` (Tier 1) | Canlı & VOD hız kontrolü, React setter/Radix onValueChange önbelleği, gerçek hız menüsü fallback'i, Amazon IVS kalite seçimi, filtreler ve kısayollar. | v0.5.5'te IVS çağrısı var, React eşitlemesi yoktu; v0.5.6 ses/hız UI eşleşmesi ve reklam geçişleri canlı test bekliyor. |
| **TRT 1 & TRT İzle** | `trt1.com.tr`, `trtizle.com`, `trt.com.tr` | `TrtAdapter` (Tier 1) | Ulaşılabilen Shaka/Hls.js/Video.js instance'ına kalite delegasyonu; bilinen eski HLS rotasında ağ fallback'i, olay izolasyonu, ses barı eşitlemesi, elemente özel hız kilidi, filtreler. | v0.5.5 raporunda beş deneme sonrası 1x'e dönüş görüldü; v0.5.6 hız kilidi ve kalite değişimleri canlı test bekliyor. |
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
