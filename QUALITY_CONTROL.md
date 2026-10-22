# Kalite kontrolü: bağlam, kaynak menüsü ve kanıt

> 22 Ekim 2026 paket durumu: **v0.7.0.1 düzeltme adayı**, 142 Node testi. Firefox kurulu geçici eklentide sürekli iframe filtresi ve en son değer koruması geçti; Firefox/Edge yerel gerçek HLS ve Video.js kalite geçişleri doğrulandı. Özel test sitesi dahil gerçek site kabulü açıktır. Güncel kanıt: [RELEASE_NOTES_v0.7.0.1.md](./RELEASE_NOTES_v0.7.0.1.md).

20 Ekim 2026 · v0.7.0 test adayı. v0.6.1 kalite iyileştirmeleri korunur; iframe sunumu ve reklam yaşam döngüsü artık kaynakta uygulanmıştır (`FRAME_PRESENTATION.md`, `AD_CONTROL.md`). Sentetik Edge'de native menü + gerçek decoded boyut eşleşmesi geçti; raporlanan gerçek sitelerde Firefox/Chromium sonucu henüz yoktur. Bu belge `RELEASE_ROADMAP.md` kapsamını küçültmez. Kick artık yalnızca seçili videoya bağlı gerçek IVS listesi sunar; tahmini liste yoktur. SDK seçimi ve decoded boyut eşleşmesi ayrı kanıtlardır.

## İki farklı envanter

Bir HLS instance'ının `levels` listesi sitenin bütün kaynak seçenekleri değildir. Site 480/720/1080 kaynakları arasında geçiyor olabilir; o anda bağlı instance yalnızca seçili kaynağın tek seviyeli manifestini görür. Tek seviye, sitenin başka kalite sunmadığını kanıtlamaz.

Uygulanan yollar:

- Bağlı Hls.js `levels`, Video.js `qualityLevels` / VHS `representations`, Shaka variant tracks ve mevcut Tier 1 yolları korunur.
- Seçili videonun tek başına ait olduğu `.video-js`, `.plyr`, `.jwplayer`, `.vds-player` veya `[data-player]` kökünde belirli kalite kontrol seçicileri okunur. Plyr `button[data-plyr=quality][value]`, Video.js resolution/quality menü öğeleri ve JW quality alt menü düğmeleri desteklenir. Aynı kökte birden fazla video varsa menü sahipliği varsayılmaz; nested player kökleri birbirinden ayrılır.
- Metin tam bir sayısal çözünürlük olmalıdır (ör. 720p, 1080p FHD). Sayfanın rastgele metnindeki sayı, link, içerik adı veya “Watch 1080p” seçenek olarak alınmaz. UI yalnızca temizlenmiş yükseklik etiketini gösterir. Yerel DOM öğesi `click()` ile bir kez çağrılır; adres yeniden yazılmaz ve gizli ayarlar menüsü otomatik açılmaz.
- Video.js resolution-switcher varsa `getGroupedSrc().label` ile gerçekten bildirilen kaynak grupları ve sayısal `res` / sayısal label okunur. Seçim `currentResolution(label)` üzerinden oynatıcıya bırakılır. Bu bütün kaynak değiştirme plugin'lerini kapsadığı anlamına gelmez. API'nin döndürdüğü kaynak URL'leri rapora/etikete eklenmez.
- Menü ile bildirilen yüksekliklerde mevcut library seçeneği yinelenmez. Menü varken yalnızca oynatılan boyuttan etiketlenmiş HLS seçeneği ikinci, sahte bir kalite gibi eklenmez. Bilinmeyen metadata diğer gerçek seviyelerin yüksekliklerine kopyalanmaz. Envanter bütünlüğü hâlâ `not-verified` olarak raporlanır.

API kaynakları: [Hls.currentLevel](https://hlsjs.video-dev.org/api-docs/hls.js.hls.currentlevel), [Video.js VHS representations](https://github.com/videojs/http-streaming#vhsrepresentations), [Video.js resolution-switcher yöntemleri](https://github.com/kmoskwiak/videojs-resolution-switcher#methods). Bu kütüphaneler eklentiye paketlenmez; yalnızca sayfadaki bağlı instance/API kullanılır.

## Eski seçimin yeni videoya uygulanmaması

`qualityControlState.context` video referansı, bulunan player referansı, kaynak anahtarı, adaptör ve medya yükleme neslini tutar. Kaynak anahtarı RAM'de kalır; raporlanmaz. HLS manifest yükleme, video `emptied` ve `loadstart` nesli değiştirir. Oyuncu/URL/nesil değişince eski liste, vurgulama ve doğrulama temizlenir.

Her üretilmiş seçenek WeakMap ile aynı bağlama bağlanır. Düğmenin sadece metni veya indeksi yeterli değildir. İstekten hemen önce canlı seçenek yeniden bulunur; kaynak/nesil/oynatıcı uyumsuzluğu ve yeniden sıralanıp başka nesneye dönüşmüş library seviyeleri reddedilir. Native menü tıklamasında DOM sahipliği, connected/disabled ve kaynak tekrar denetlenir. Hedef seviye, diğerleri kapanmadan önce etkinleştirilir.

Kaynak değiştiren native menü veya resolution-switcher isteğinde, aynı video üzerinde 12 saniye içindeki beklenen kaynak/instance geçişi bekleyen isteği taşıyabilir. Başka videoya geçiş bu istisnayı kullanmaz. Kaynak geçişinin gerçekleşmesi başarı değildir; yeni görüntü ayrıca gözlenir.

Teşhis yalnızca o anki video/player/kaynak/nesil ile eşleşen kaydı okur; yeni getQualities/kalite uygulaması/ağ isteği başlatmaz. Eşleşme yoksa eski adaptör adı yerine `unknown`, durum `not-evaluated`, eski cachedOptionCount yerine 0 ve verification `not-verified` olur. Böylece eski HlsJsAdapter adı yeni native-html5 video için sağlıklı denetim gibi sunulmaz.

## İstek ve gözlem durumları

| verification | Kanıt |
| --- | --- |
| not-verified | Bu bağlamda kayıtlı kalite isteği yok veya eski kayıt bu kaynağa ait değil. |
| pending | API/menü çağrısı kabul edildi; görüntü ve oynatıcı seçimi henüz eşleşmedi. |
| rendition-confirmed | Oynatıcı hedef seviyeyi seçtiğini bildiriyor; decoded yükseklik henüz hedef değil. Bu tampon geçişinde olabilir. |
| decoded-match | Hazır videonun decoded yüksekliği hedefle eşleşiyor; SDK/menü seçimi ayrıca teyit edilmedi. |
| confirmed | Hem bağlı oynatıcı/menü seçimi hem decoded yükseklik hedefle eşleşiyor. |
| timed-out | 12 saniye sonunda görüntü hedefi doğrulanmadı. Sonraki gerçek eşleşme bu durumu güncelleyebilir. |
| rejected | API/menü isteği uygulanamadı; düğme başarılı gösterilmez. |

`decodedMatch` ve `renditionMatch` yalnızca boolean/null kanıttır. Mevcut HLS level nesnesi, Video.js selectedIndex/quality nesnesi, VHS seçili playlist ID'si, Shaka active track ve kaynak plugin'inin currentResolution bilgisi uygun olduğunda okunur. Bir seçeneğin enabled olması seçildiği anlamına gelmez. Yalnızca ilk belirtilen API çağrısının dönmesi `confirmed` üretmez.

UI istenen ve decoded yüksekliği ayrı yazar. Bekleyen/reddedilen/zaman aşımındaki istek başarı vurgusu almaz. `decoded-match` ve `confirmed` görüntü eşleşmesini gösterebilir; metin hangi kanıtın bulunduğunu açık tutar. Kalite durumu ve seviye yenilemeleri düğme düğümlerini gereksiz yeniden kurmaz; klavye odağı korunur. Yalnızca etiket çevirisi/gerçek envanter değişimi yeni düğme gerektirir; eşleşen düğme yeniden odaklanır.

## Video hedefi ve arka plan maliyeti

Player → Video target varsayılan olarak otomatik puanlamayı kullanır. Kullanıcı belirli video seçerse, daha yüksek puanlı bir reklam/önizleme videoyu devralmaz. Hedef DOM'dan ayrıldığında veya artık aday değilse otomatik seçim geri gelir. Seçenekler yalnızca sıra ve video yüksekliğidir; URL, DOM ID, başlık veya içerik adı gösterilmez/raporlanmaz. Seçim yalnızca RAM'dedir.

Açık ve görünür HUD'da 750ms aralıkla geç bağlanan instance/seviye listeleri kontrol edilir. Aynı seçenek listesi düğmeleri yeniden oluşturmaz. `pvc-idle-hidden` durumunda geniş keşif/kalite envanteri taraması yapılmaz; varsa eldeki hedefte doğrulama takip edilir. Panel kapanınca bu timer sona erer. Video/SDK olayları aktif isteği ayrıca günceller. Bu mimari ölçülmüş cihaz FPS kazancı iddiası değildir.

## Doğrulama ve açık sınırlar

97 Node testi içinde şu senaryolar geçer: tek HLS seviyesine gerçek kaynak menüsünün eklenmesi, menü sahipliği/nested-root reddi, URL/epoch/player/level değişiminde eski istek reddi, SDK çağrısı ile decoded doğrulamasının ayrılması, timeout/geç eşleşme, API rejection, Video.js kaynak grupları, düğme/odak kimliği ve iki dilde dinamik durum. Gizlilik testleri URL/özel label/raw level verisinin rapora sızmadığını ve raporun salt okunur kaldığını sınar.

Bunlar gerçek sitenin menü seçicisi veya kalite geçişi için canlı kanıt değildir. Özellikle raporlanan Generic/native-html5 iframe ve HLS 5+ aday senaryolarının gerçek site yapısı kontrol edilmelidir. Site menüsü desteklenen kök/selector/API dışında veya kapalı shadow root'taysa bu sürümün tüm seçenekleri bulduğu söylenemez. İzin artırma, kapalı DRM'yi kırma veya manifest URL'sinden çözünürlük tahmini yapılmaz.

Canlı kontrol: site menüsündeki seçeneklerle HUD'u karşılaştır; video hedefini doğrula; farklı yükseklik seç ve tampon geçişini bekle; requested/rendition/decoded durumlarını izle; duraklatıp devam et; kaynak değiştir; paneli kapat/aç ve iframe/fullscreen geçişini dene. Kullanıcının site adını belirtmesi, ilgili menü yolunu doğrulamak için yeterli başlangıçtır; içerik/hesap/tam izleme bağlantısı istenmez.


## v0.7.0.1 — Eski VHS tamponu

Seçilen kaliteyi gösteren SDK ile decoded video farklı kalabiliyordu. Eşleşen video/instance ve hedef playlist/segment loader kimlikleri doğrulanınca, VHS kendi runFastQualitySwitch_ yolu manuel istek başına en fazla bir kez denenir. Yöntem yoksa zorlanmaz; fake başarı, yeni ağ kaynağı veya doğrudan MSE buffer silme yoktur. Eski Edge zaman aşımı ile Firefox gerçek yerel Video.js 1080→480 senaryoları geçti. Gerçek site kapsamı RELEASE_NOTES_v0.7.0.1.md sınırındadır.
