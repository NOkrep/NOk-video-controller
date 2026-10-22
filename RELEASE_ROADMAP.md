# v0.6.0 → v0.7.0 çalışma planı

> 22 Ekim 2026 paket durumu: **v0.7.0.1 düzeltme adayı**, 142 Node testi. Firefox kurulu geçici eklentide sürekli iframe filtresi ve en son değer koruması geçti; Firefox/Edge yerel gerçek HLS ve Video.js kalite geçişleri doğrulandı. Dizipod dahil gerçek site kabulü açıktır. Güncel kanıt: [RELEASE_NOTES_v0.7.0.1.md](./RELEASE_NOTES_v0.7.0.1.md).

20 Ekim 2026. Kullanıcı “adım adım” ilerlemek istiyor. Mevcut **v0.7.0 test adayı** kaynak ve sentetik regresyon aşamasına ulaştı; tüm gerçek site issue'larının çözüldüğü iddiası yoktur. 20 tema korunur; finalist seçilmedi. Kaynak raporlar yeniden yayımlanmaz; aşağıda yalnızca teknik bulgular tutulur.

## Sürüm politikası

- Yeni kullanıcı özelliği veya anlamlı davranış paketi: 0.6.0, sonraki ara paket 0.6.1, hedef 0.7.0.
- Aynı sürümün çok küçük dağıtım düzeltmesi gerekirse dördüncü sayısal bileşen: örneğin 0.6.0.1, 0.6.0.2. Dört bileşen klasik SemVer değildir; WebExtension manifest sürümüdür. Gereksiz her yerel düzenlemede artırılmaz; dağıtılacak paket için eşitlenir.
- 0.5.10 zaten kullanıldı; geçmişi silinmez ve 0.5.9'a dönülmez. İlk kaynak aşaması 0.6.0, kalite aşaması 0.6.1, iframe/reklam birleştirmesi mevcut 0.7.0 test adayıdır. Her ara yerel düzenleme ayrı dağıtım sürümü sayılmaz.
- Chrome ve Firefox manifest sürümü 1–4 sayısal bileşeni destekler: [Chrome](https://developer.chrome.com/docs/extensions/reference/manifest/version), [MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/version). Ortak aralık için her parça 0–65535, baştaki gereksiz sıfırlar yok, tüm sürüm sıfır değil.
- GitHub push, tag ve release oluşturulmadı. Kullanıcı paylaşacağı paketi test edip kendisi pushlayabilir.

## Raporlar ve kabul koşulları

| İş | Kanıt / ayrım | Durum ve kabul koşulu |
| --- | --- | --- |
| PERF-01 renk filtreleri | Her input'ta deep DOM taraması ve aynı filter değerinin yeniden yazımı vardı. | **v0.6.0 kaynak düzeltmesi:** rAF ile birleştirme, diff yazma, varsayılanda site stilini ezmeme, reset/eski video için geri yükleme; aday taraması RAM önbelleğinde. Node modelinde 200 input → 1 seçim + 1 yazım. Gerçek Firefox GPU/FPS/dropped-frame sonucu henüz yok. |
| HUD-01 gizlenmeme | Pointer tıklaması sonrası kalan aktifElement, klavye odağı gibi gizlenmeyi engelliyordu. | **v0.6.0 kaynak düzeltmesi:** pointer/klavye ayrımı; Keep visible kapalı, fare panel dışında ve pointer odağında 2+2s sonunda gizlenmeli. Klavye odağında gizlenmemeli. Gerçek iframe testi bekliyor. |
| HUD-02 video içinde sağa sabit panel | Fixed konum iframe viewport'una bağlıydı; cross-origin DOM erişimi yok. | **v0.7.0 kaynak + sentetik Edge:** üstte tek HUD, kaynakta medya; sahip/sayaç/session sınırı, nested model, kapat/aç, ancestor fullscreen ve çıkış. FRAME_PRESENTATION.md. Kurulu geçici Firefox eklentisiyle nested yerel tarayıcı testi geçti; gerçek site kabulü bekliyor. |
| SUB-01 görünüm ve disabled durumu | Boyut/konum ayarı eksik; loaded + disabled dosyanın okunmadığı anlamına gelmiyor. | **v0.6.0 kaynak düzeltmesi:** boyut, alt mesafe, zemin opaklığı, beyaz/sarı; yeni dosya görünürlüğü açar. Native fullscreen/PiP boyutunu tarayıcı yönetir; overlay ve cue konumu model testinde sınandı. Canlı görünüm bekliyor. |
| DIAG-01 platform other/ad | Known host allowlist ve iframe player host'u birlikte kullanılıyordu; iframe host'u bilinmiyorsa üst sayfa adı kayboluyordu. | **v0.6.0:** fixed enum + platformScope player/page/unlisted; yalnızca üstten alta bilinen platform etiketi. Ham host, hash, içerik adı yok. Unlisted site other kalır; sınıflandırma uyumluluk garantisi değildir. |
| QUAL-01 Generic'te hiç seçenek yok | Generic HTML5/blob, alttaki kütüphane instance'ına ulaşmıyorsa kalite listesi sunamaz. Kullanıcı “kalite gözükmüyor” dediğinde bu sınıf. | **v0.6.1 kaynak ilerlemesi:** seçili tek videoya ait belirli native menüler, geç attach yenilemesi ve Video.js kaynak grupları eklendi. API/kanıt yoksa seçenek uydurulmaz. Gerçek raporlanan site menüsüyle canlı karşılaştırma açık. |
| QUAL-02 HLS'te eksik seçenek ve tutarsız adapter | Kullanıcı “eksik kalite” derse sitenin kendi menüsünde daha fazla seçenek görerek karşılaştırmıştır. Bir raporda HlsJsAdapter + native-html5 ve 5+ aday var; seçim/cache eşleşmesi şüpheli. | **v0.6.1 kaynak ilerlemesi:** video/player/source/epoch bağlamı, eski seçim reddi, raporda stale adapter/cache dışlama, gerçek source-menu seviyeleriyle birleştirme ve manuel video hedefi. Tek seviye bütün kaynağın tek kalite sunduğunu kanıtlamaz. Canlı site menüsünün kapsandığı henüz doğrulanmadı. |
| QUAL-03 Video.js istek doğrulaması | Seçenekler görünse de rapor requested480, verification not-verified. Bu tek başına uygulama başarısını veya kök nedeni kanıtlamaz. | **v0.6.1 kaynak ilerlemesi:** pending/rendition-confirmed/decoded-match/confirmed/timed-out/rejected durumları; kabul tek başına başarı değil, 12s timeout görünür. Düğme/odak korunur. Model/API senaryoları geçer; gerçek buffering/geçiş ayrıca doğrulanmalı. |
| AD-01 otomatik reklam kontrolü | Eski Kick kodunda kalite/geri yükleme yoktu; generic reklam otomatik algılanmıyordu. | **v0.7.0 kaynak + sentetik Edge:** seçili, görünür, tek videolu kökte açık marker; 16x isteği/mute; IVS/HLS/Video.js/checked native menüde geri alınabilir gerçek en düşük kalite. Çıkışta 1x/önceki ses-mute, aynı kaynak/envanterde önceki kalite/ABR. Replacement/ended/close hata izolasyonu modellerde sınandı. Edge 720→480→720 ve %40 dönüşü geçer; MediaStream 16x uygulamaz, gerçek reklam hızlanması/Kick UI/Firefox açıktır. AD_CONTROL.md. İşaret yoksa tahmin yapılmaz. |
| DESIGN-01 animasyon açıklaması | Beş uyarlama birebir kaynak kopyası değil; üç örnek bekliyor. | **Belgelendi:** ANIMATION_DETAILS.md. Bu aşamada yeni glow/floating-label/halo eklenmedi; kullanıcı tasarım geri bildiriminden sonra ayrı paketle denenebilir. |

## Aşamalar

1. **v0.6.0 — Kaynak düzeltmeleri hazır, canlı doğrulama bekliyor.** Filtre yükü, gizlenme, yatay taşıma, altyazı görünümü, sabit platform kapsamı. 82 Node testi, JS syntax ve diff kontrolü. İzin/depolama/DRM/Kick setter cache sınırları korunur.
2. **v0.6.1 — Kalite kaynak/test aşaması.** Kalite bağlamı, native kaynak menüsü, Video.js source plugin'i, request/rendition/decoded ayrımı ve manuel video hedefi; bu aşamada 97 Node testi. QUALITY_CONTROL.md kanıt sınırını açıklar. Sonraki 0.7.0 aşamasında iframe sunumu uygulandı; gerçek site başarısı ilan edilmez.
3. **v0.7.0 — Kaynak ve sentetik regresyon hazır; canlı kabul açık.** İframe sunumu ve reklam giriş/çıkış geri yüklemesi eklendi. Toplam 135 Node testi, syntax/diff kontrolü ve Firefox kurulu eklenti yerel senaryoları geçer. Edge temel 14 kontrolü geçti; son gerçek Video.js kalite geçişi zaman aşımı açıktır. MediaStream 16x isteğini kaydeder, gerçek hızlanmayı doğrulamaz. Animasyon açıklaması tamamdır; yeni dekorlar ayrıca talep edilmedikçe eklenmez. Kalan kritik işler yalnızca sürüm numarası büyütülerek kapatılmaz.

## Açık canlı kabul listesi

- Eklentiyi yeniden yükle, medya sayfasını yenile: Firefox kurulu eklenti yolunda iframe dışı tek HUD, idle gizlenme, kapat/aç ve iki kademeli nested fullscreen.
- Native menü ile bütün kalite seçeneklerini karşılaştır; listedeki değere tıklayıp SDK seçimi ve decoded sonucu birlikte gözle. Kullanıcının “dizipod.com olabilir” yanıtı kesin rapor kaynağı değildir. Yeni anonim rapor hangi teknik sınıfın kaldığını göstermelidir; alan adı rapora zorla eklenmez.
- Kick VOD ses/hız UI eşleşmesi; gerçek reklam işareti giriş/çıkışı, 16x'in gerçekten uygulanması, önceki kalite/ABR ve mute dönüşü. İşaret yoksa eklenti bunu desteklenmeyen algılama olarak bırakır.
- SRT/VTT, cue boşluğu, yazı boyutu/konumu/zemin/renk; doğrudan video fullscreen/PiP kısıtını wrapper fullscreen'den ayır.
- Büyük yazı/yüksek kontrast/reduced motion, ekran okuyucu, %200 zoom; özellikle çerçeveye özgü tema/erişilebilirlik tercihlerinin fullscreen'de aynı olmayabileceğini kontrol et.
- Gerçek yüksek çözünürlüklü video ile varsayılan/filtre açık karşılaştırması: FPS/dropped frames/GPU cihazda ölçülmeli. Modelde 200 input→1 yazım, GPU kazanım yüzdesi değildir.

Her aşama için kaynak/test sonucu ile canlı Firefox/Chromium sonucu ayrı tutulur. Kullanıcı teyidi olmadan SITE_COMPATIBILITY “Tam Çalışıyor” listesine site eklenmez. Rapor önizlemesi/açıklama opt-in/silme talebi korunur; otomatik rapor gönderimi yoktur.


## v0.7.0.1 — Düzeltme sonrası kabul

142 Node testi, Firefox kurulu geçici eklentide sürekli iframe filtresi ve yerel gerçek HLS/Video.js Firefox/Edge decoded geçişleri geçti. Önceki Edge kalite zaman aşımı yerel senaryoda kapandı. Dizipod Firefox v0.7.0 kullanıcı regresyonu kesin adım bilinmeden alınmıştır; 0.7.0.1 ile gerçek site kabulü açık kalır. Ekran okuyucu, gerçek %200 zoom, Kick/TRT reklam/arayüz ve cihaz GPU ölçümü hâlâ ayrı kabul gerektirir. Test ZIP'i yeni sürüm adıyla hazırlanır; eski ZIP korunur. Güncel paket kanıtı RELEASE_NOTES_v0.7.0.1.md içindedir.
