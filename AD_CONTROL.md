# v0.7.0 reklam yaşam döngüsü

> 22 Ekim 2026 paket durumu: **v0.7.0.1 düzeltme adayı**, 142 Node testi. Firefox kurulu geçici eklentide sürekli iframe filtresi ve en son değer koruması geçti; Firefox/Edge yerel gerçek HLS ve Video.js kalite geçişleri doğrulandı. Özel test sitesi dahil gerçek site kabulü açıktır. Güncel kanıt: [RELEASE_NOTES_v0.7.0.1.md](./RELEASE_NOTES_v0.7.0.1.md).

20 Ekim 2026 · test adayı. Reklam engelleyici veya evrensel reklam algılama iddiası yoktur. Manuel hızın reklamı hızlandırması otomatik algılama kanıtı değildir.

## Ne zaman çalışır (v0.7.13, kullanıcı kararı)

Sayfa açılınca reklam denetimi başlamaz, reklam oynasa da hız ve sese dokunulmaz. Araç çubuğuna **ilk basışla** o sayfa etkinleşir; panel küçültülse veya kapatılsa da denetim sürer. Etkinlik yalnız RAM'dedir: sayfa içi geçişte (aynı belge) kalır, sayfa yenilenince veya tam gezinmede sıfırlanır. Basış alt çerçevelere ve sonradan yüklenen çerçevelere de geçer.

Basılana kadar duran işler: reklam denetimi, 1. saniyedeki video izleme ve 15 saniyelik yerel CDN okuması. **Sayfa yüklenirken kurulmaya devam edenler:** `early-hooks.js`, IVS kancası ve XHR/fetch kancası. Bunlar yalnız adres ve oynatıcı kaydeder, videoya dokunmaz. Kaynak ve kalite işleri bunlara bağlıdır (örnek: Puhu'da 1080p yeniden denemesi sayfa yüklenirken yakalanan adresi kullanır), bu yüzden basışa bağlanmaz.

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

Geri dönüşü bilinmiyorsa kaliteye dokunulmaz. Bitişte kullanıcı isteği doğrultusunda hız **1x** olur; reklam öncesindeki hız 2x olsa da 2x'e dönmez. Önceki ses ve mute geri gelir; önceden sessizde olan kullanıcı zorla açılmaz. Temizlik `pagehide` ve video değişiminde yapılır; v0.7.13'ten beri panel kapatma denetimi durdurmaz. Seçili video/oynatıcı değişirse eski native element temizlenir; kaydedilmiş SDK/kalite başka videoya uygulanmaz. Kaynak/envanter değişmişse eski kalite numarası zorla yeni kaynağa uygulanmaz; bu durum eski kaliteye dönüş garantisi sunmaz.

Sabit `AD_CONTROL_STARTED` / `AD_CONTROL_ENDED` olayları sadece döngü giriş/çıkışını gösterir; 16x'in veya kalitenin gerçekten uygulandığını kanıtlamaz. İzlenen içerik/URL/metin raporlanmaz. Olaylar diğerleri gibi sınırlı RAM tamponundadır.

## Gerçek YouTube kabulü — 5 Kasım 2026, v0.7.12

Geçici profil, hesap yok. Kick'te reklam artık nadir olabildiği için (kullanıcı bilgisi) kabul YouTube'da yapıldı: `tests/youtube-ad-acceptance.cjs`.

- **Çalışan:** `ad-showing` işaretiyle 16x ve sessize alma uygulanıyor, bitişte 1x ve ses geri geliyor. `AD_CONTROL_STARTED` ve `ENDED` kaydediliyor. Art arda iki reklamda YouTube hızı ve sesi sıfırlıyor, 750 ms'lik denetim yeniden uyguluyor; bu aralıkta reklam kısa süre normal hızda ve sesli oynayabilir.
- **Kalite:** YouTube için kalite düşürme yolu yok, reklamda kalite değişmedi. Bu bilinçli sınır tablodaki gibi geri dönüşü bilinen yollarla ilgilidir.
- **Düzeltilen üç hata:** Panel reklam bitince eski hızı gösteriyordu (`16x` veya reklam öncesi değer). Reklam başındaki ses seviyesi, YouTube'un içerik için seçtiği seviyenin üstüne yazılabiliyordu; artık yalnız seviye 0'a çekildiyse geri yazılır. Panel gerçek sesi kaçırabiliyordu.
- **Ölçüm:** Reklam sonrası içeriğin başlaması eklentisiz Chromium'da 7,6 ve 7,8 sn; FilmDeck'le Chromium'da 1,8, Firefox'ta 0,3 sn. Az örnektir; hızlandırmanın boşluk yarattığını göstermez.
- **O sürümdeki tutarsızlık:** Denetim yalnız panel açıkken veya sayfa açılışından 1 saniye sonra video varken başlıyor, panel kapanınca duruyordu. Paneli hiç açılmayan bir turda YouTube reklamı 176 saniye boyunca 1x ve sesli oynadı. v0.7.13'te kullanıcı kararıyla kaldırıldı.

Canlı Kick reklamı hâlâ görülmedi; `ad-badge` doğrulanmadı.

## Basış kuralının kabulü — 5 Kasım 2026, v0.7.13

Geçici profil, hesap yok, iki motor. Akış: basmadan bekle, bir kez bas, paneli kapat, aynı belgede sonraki videolara geç.

- **Basmadan:** Gerçek reklam oynarken hız 1x kaldı (Chromium 10, Firefox 12 örnek).
- **Kapalı panelde:** İki motorda ikişer gerçek reklam 16x ve sessiz geçti, bitişte 1x ve ses geldi. Panel yeniden açılınca 1x ve gerçek ses seviyesini gösterdi. Panel kapalıyken kaydırıcı eski sesi tutabilir; açılışta düzelir.
- **Puhu, geç basış:** Sayfa yüklenip 25 saniye sonra basıldı. v0.7.12 ile v0.7.13 aynı içeriklerde aynı listeyi verdi (Chromium üç içerik, Firefox bir içerik). Yeniden deneme iki motorda sayfa yüklenirken yakalanan adresi kullandı. Bir içerikte iki sürümde de `0 levels` görüldü; bu değişiklikten gelmiyor, v0.7.14'te düzeltildi (ACTIVE_WORK.md).
- **Kick, erken yakalama:** Basılmadan önce IVS oynatıcısı iki motorda videoya bağlı bulundu; basışta `KickAdapter` ve 5 seviye geldi. TRT ve Now gerçek sitede ayrıca sınanmadı; kancaları aynı yerde, motor yüklenirken kurulur.
- **Sınır:** Sayfanın ilk reklamı basılana kadar normal hızda ve sesli oynar. Bu, kararın bilinen sonucudur.

## Doğrulama sınırı

Node testleri giriş/çıkış, önceki mute/ses, 1x dönüş, SDK hata izolasyonu, gerçek HLS/IVS/Video.js seçimleri, envanter/source değişimi, replacement/ended ve marker sahipliğini sınar. Sentetik Edge testinde gerçek native menü 720p→480p→720p, mute ve %40 ses dönüşü geçer. Test `MediaStream`'i 16x isteğini kaydeder ama hızı 1x tutar; bu test gerçek reklam hızlanmasını doğrulamaz. Yerel dosya medyasıyla Firefox üzerinde yaklaşık 15.97x medya saati ve 1x/%40 ses dönüşü ayrıca doğrulandı. Canlı Kick reklamı ve site arayüzüyle eşleşme ayrıca sınanmalıdır.

API dayanakları: [Amazon IVS Player](https://aws.github.io/amazon-ivs-player-docs/1.52.0/web/interfaces/Player.html) (`getQualities`, `getQuality`, `isAutoQualityMode`, `setAutoQualityMode`, `setQuality`, video sahipliği); [Hls.js currentLevel](https://hlsjs.video-dev.org/api-docs/hls.js.hls.currentlevel) ve [autoLevelEnabled](https://hlsjs.video-dev.org/api-docs/hls.js.hls.autolevelenabled). SDK'nin sunduğu kalite listesi bütün sunucu envanteri garantisi değildir.
