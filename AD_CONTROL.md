# v0.7.0 reklam yaşam döngüsü

> 22 Ekim 2026 paket durumu: **v0.7.0.1 düzeltme adayı**, 142 Node testi. Firefox kurulu geçici eklentide sürekli iframe filtresi ve en son değer koruması geçti; Firefox/Edge yerel gerçek HLS ve Video.js kalite geçişleri doğrulandı. Özel test sitesi dahil gerçek site kabulü açıktır. Güncel kanıt: [RELEASE_NOTES_v0.7.0.1.md](./RELEASE_NOTES_v0.7.0.1.md).

20 Ekim 2026 · test adayı. Reklam engelleyici veya evrensel reklam algılama iddiası yoktur. Manuel hızın reklamı hızlandırması otomatik algılama kanıtı değildir.

## Algılama ve davranış

Tek 750ms zamanlayıcı yalnızca seçili videoyu denetler. Görünür, tek videolu, bu videoyu içeren oynatıcı kökü gerekir. Desteklenen açık işaretler: Video.js kökünde `vjs-ad-playing`, JW Player kökünde `jw-flag-ads`, YouTube kökünde `ad-showing`; Kick host'unda kökün içinde görünür `data-testid="ad-badge"`. Sibling/reklam iframe'i, başka videoya ait menü veya gizli işaret kabul edilmez. URL, video süresi veya serbest sayfa metniyle tahmin yoktur. İşaret sunmayan generic reklamlar otomatik hızlandırılmaz.

Girişte mevcut ses seviyesi/mute saklanır, 16x istenir ve mute açılır. SDK/native setter hataları birbirini engellemez; 16x desteklenmese bile mute denenir. Gerçek hız tarayıcı/oynatıcı sınırlamasına tabidir. Web Audio kurulmaz; DRM güvenli yoluna booster eklenmez.

Kalite ancak geri getirilebilir gerçek seçenek varsa düşürülür:

| Yol | Düşürme | Geri yükleme |
| --- | --- | --- |
| Seçili videoya bağlı Amazon IVS | SDK'nın gerçek listesinde en düşük pozitif yükseklik, eşitlikte bitrate | Önceki otomatik mod veya listede hâlâ bulunan aynı kalite |
| Hls.js | Gerçek levels envanterinin en düşük seviyesi | Önceki `manualLevel` (`-1` otomatik), aynı kaynak/instance/envanter |
| Video.js qualityLevels / VHS representations | En düşük seviyeyi etkinleştir | Önceki tüm enabled bayrakları; aynı kaynak ve raw seviye / kararlı representation ID |
| Seçili native menü | Checked/selected sayısal seçenek varsa en düşük gerçek menü seçeneğine tek click | Önceki aynı menü düğümü, bağlı ve aynı kaynaksa |

Geri dönüşü bilinmiyorsa kaliteye dokunulmaz. Bitişte kullanıcı isteği doğrultusunda hız **1x** olur; reklam öncesindeki hız 2x olsa da 2x'e dönmez. Önceki ses ve mute geri gelir; önceden sessizde olan kullanıcı zorla açılmaz. Panel kapatma/remote oturum kapatma/pagehide temizliği vardır. Seçili video/oynatıcı değişirse eski native element temizlenir; kaydedilmiş SDK/kalite başka videoya uygulanmaz. Kaynak/envanter değişmişse eski kalite numarası zorla yeni kaynağa uygulanmaz; bu durum eski kaliteye dönüş garantisi sunmaz.

Sabit `AD_CONTROL_STARTED` / `AD_CONTROL_ENDED` olayları sadece döngü giriş/çıkışını gösterir; 16x'in veya kalitenin gerçekten uygulandığını kanıtlamaz. İzlenen içerik/URL/metin raporlanmaz. Olaylar diğerleri gibi sınırlı RAM tamponundadır.

## Doğrulama sınırı

Node testleri giriş/çıkış, önceki mute/ses, 1x dönüş, SDK hata izolasyonu, gerçek HLS/IVS/Video.js seçimleri, envanter/source değişimi, replacement/ended ve marker sahipliğini sınar. Sentetik Edge testinde gerçek native menü 720p→480p→720p, mute ve %40 ses dönüşü geçer. Test `MediaStream`'i 16x isteğini kaydeder ama hızı 1x tutar; bu test gerçek reklam hızlanmasını doğrulamaz. Yerel dosya medyasıyla Firefox üzerinde yaklaşık 15.97x medya saati ve 1x/%40 ses dönüşü ayrıca doğrulandı. Canlı Kick reklamı ve site arayüzüyle eşleşme ayrıca sınanmalıdır.

API dayanakları: [Amazon IVS Player](https://aws.github.io/amazon-ivs-player-docs/1.52.0/web/interfaces/Player.html) (`getQualities`, `getQuality`, `isAutoQualityMode`, `setAutoQualityMode`, `setQuality`, video sahipliği); [Hls.js currentLevel](https://hlsjs.video-dev.org/api-docs/hls.js.hls.currentlevel) ve [autoLevelEnabled](https://hlsjs.video-dev.org/api-docs/hls.js.hls.autolevelenabled). SDK'nin sunduğu kalite listesi bütün sunucu envanteri garantisi değildir.
