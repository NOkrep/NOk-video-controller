# Gerçek site kontrolleri — v0.7.5

22 Ekim 2026. Gerçek kurulu eklenti, ayrı ve geçici Firefox 158.0.1 profili, hesap girişi yok. İlk Puhu/Kick kayıtları headless; görünür kontrol aşağıda ayrıca belirtilir. Kişisel profil kullanılmadı. Bu kayıt bütün site kataloğuna veya tüm tarayıcılara uyumluluk garantisi değildir. İçerik adları, tam izleme adresleri, hesap bilgileri, akış token'ları ve API anahtarları bu dosyaya alınmaz. Yerel operatör çıktıları `tests/artifacts/` içinde Git dışında tutulur.

## Puhu: standart kalite yolu

Güncel bir oynatıcıda yerel menü Otomatik / Düşük / Standart / Yüksek sunarken bağlı VHS beş gerçek rendition bildirdi: 240, 360, 480, 720 ve 1080. Beş sayısal seviye olması tek başına yanlış envanter değildi. Eski SDK yoluyla görüntü 854×480 ve 1920×1080'e geçebiliyordu; fakat sitenin seçili yazısı Standart'ta kalıyordu.

v0.7.4'te siteye ait, tek video sahibine bağlı `.vjs-quality-item` kontrollerinin bilinen isimleri ve gerçek sayısal ID'leri eşleştirildi. Bu üç seviye için doğrudan sitenin kontrolü tıklanır. SDK'nın bildirdiği ek 240p/360p seçenekleri korunur. Sayısal ID, keyfi metinden çözünürlük üretmez; başka host veya paylaşılan/nested oynatıcı bu yolu kullanamaz.

Temiz kurulum tekrarında:

| İstek | Site seçimi | Gerçek görüntü | Eklenti onayı | Gözlenen süre |
|---|---|---|---|---|
| 1080p | Yüksek / ID 1080 | 1920×1080 | 1080p seçili | 5.273 sn |
| 480p | Düşük / ID 480 | 854×480 | 480p seçili | 7.271 sn |

İki geçişte de video oynuyordu. Site seçimi, SDK rendition'ı ve decoded görüntü ayrı okundu; tablo yalnız bu denemeleri kanıtlar. Süre ağ/tampon koşuluna bağlıdır, performans garantisi değildir.

## Puhu: eski içerikte özel kaynak yeniden denemesi

Kullanıcı eski özel düğmeyle birkaç denemeden sonra yüksek kalite yakaladığını bildirdi. Bu deneyim tek başarısız denemeyle geçersiz sayılmaz. Gözlenen eski akışta manifest ve site 1080p bildirirken gerçek görüntü 768×576 kaldı; 15 saniyelik örnekte 1080p doğrulanmadı. Akış MNCDN üzerindeydi. Eski yardımcı fonksiyonun beklediği doğrudan URL alanları gözlenen alternatif API yanıtında dönmedi; bu durumda eski davranışı sayfa yenilemeye düşer. Alternatif kaynağın hiçbir zaman daha yüksek kalite sunamayacağı sonucu çıkarılmaz.

**Kullanıcı talebi:** daha iyi bir çözümle yerini aldığı doğrulanana kadar özel seçenek korunacak. `Oynatıcı → Video kalitesi → 1080p kaynağını yeniden dene` düğmesi standart kalite seçeneklerinin yanında geri eklendi. Her basış kullanıcı tarafından başlatılır; akış denemesi ve gerekirse sayfa yenileme davranışı korunur. Kullanıcı yenilemeden sonra yeniden basabilir. Düğme kalite envanterinin veya doğrulanmış 1080p seçenek sayısının parçası değildir.

Başka site, DRM, ayrılmış video veya bağlı Video.js sahibinin değişmesi durumunda kaynak değiştirme/yeni sayfayı yenileme engellenir. Aynı anda bir istek çalışır; istek 10 saniyede iptal edilebilir. Gerçek CDN host'u doğrulanır. Düğmenin açıklaması yenilemenin RAM içindeki ayar/altyazıları sıfırladığını belirtir; depolama eklenmedi. Eski kaynak denemesi tek başına 1080p başarı işareti üretmez.

Düğmenin tekrar kullanılabilirliğini doğrulamak, yüksek kaliteye her basışta veya belirli sayıda basışta ulaşıldığını kanıtlamaz. Eski katalogdaki alternatif kaynak kalitesi araştırması açıktır.

Geri eklenen düğme temiz Firefox kurulumunda üç ardışık basışla test edildi: üçünde de sayfa gerçekten yenilendi ve düğme yeniden görünür/etkin geldi; normal kalite seçeneği yanında kaldı. Tıklama HUD dışına yayılmadı. Son kısa decoded örneği 640×360 idi; bu tur HD yakalama başarısını kanıtlamaz. Reklam/önizleme ile asıl içerik evresinin ayrıca ayrıştırılması gerekir; tek kısa örnek içerikte kalıcı kalite sınırı olduğunu göstermez. Sayısal kanıt `tests/artifacts/puhu-legacy-retry/summary.json` içindedir; içerik adı/adresi veya API anahtarı içermez.

## Kick

Canlı sayfada bağlı IVS örneği, 1080/720/480/360/160 seçenekleri ve gerçek oynayan video bulundu. Eklentiden verilen %35 ses isteği IVS'te yaklaşık 0.35 olarak okundu. **Bu, Kick arayüzü eşleşmesi kanıtı değildir.** İncelenen headless koşulunda Kick'in kendi kontrol DOM'u boş/kapalı kaldı; fare hareketi ve tıklama işlemleri başarılı dönse de ses/hız menüsünün görünür durumunu doğrulamak mümkün olmadı.

Güncel oynatıcı kökü `#injected-channel-player`; reklam işareti denetimi bu kökü de tanıyacak şekilde genişletildi. Tek video sahipliği, görünür desteklenen işaret ve Kick host kısıtı korunur. Bu kök desteği Node regresyonuyla kapsanır. **Gerçek reklam başlangıcı/bitişi, 16x, sessiz/en düşük kalite ve geri yükleme bu turda doğrulanmadı.** Yapay reklam işareti ekleyerek gerçek site kabulü üretilmedi.

## Açık kabul işleri

- Eski Puhu özel kaynak yolunun birden fazla manuel denemede gerçekten yüksek decoded görüntü vermesi.
- Kick'in görünür ses/hız arayüzü ve gerçek reklam döngüsü.
- Bildirilen diğer Video.js ve gömülü/yanlış video seçimi siteleri.
- Belleğin native/cache payı ve görünür Firefox ağır filtre/GPU koşulları; ayrı ölçüm dosyalarındaki açık sınırlamalar korunur.

166 Node testi geçti. Daha sonraki kaynak değişiklikleri için bu sayı ve canlı kabul kapsamı yeniden değerlendirilir. ZIP/release/push hazırlanmadı.

## Kick: görünür Firefox ve eklentisiz kontrol

v0.7.4 kaynağıyla görünür geçici Firefox 158.0.1 oturumunda canlı video 1280×720, readyState 3 ve oynuyor durumundaydı. HUD hiç açılmadan da `#injected-channel-player` içindeki kontrol alanında button/slider yoktu. Çerez katmanı kapatıldı, BiDi gerçek pointer girdisiyle video üzerine gidildi; görünür ses/hız kontrolleri yine oluşmadı. Bu durum yalnız headless koşuluna bağlanamaz.

Aynı herkese açık oynatıcı **eklenti hiç kurulmadan** ayrı görünür geçici Firefox profilinde tekrar kontrol edildi: engine false, HUD 0, aynı oynatma durumu/çözünürlük ve oynatıcı kökünde yine 0 button/slider. Pointer hit-test gerçekten VIDEO öğesini gösterdi; açık ShadowRoot kontrolü de görünür bir alternatif kontrol ağacı bulmadı. Böylece bu oturumdaki boş kontrol durumu eklentiye özgü değildir. Bu, kullanıcının kendi tarayıcısındaki ses/hız eşleşme sorununu geçersiz kılmaz ve o sorunun düzeldiğini kanıtlamaz.

Bu gözlem üzerine tahmini React setter/hook değişikliği yapılmadı. Gerçek reklam başlangıcı/bitişi görülmedi; 16x/mute/lowest/restore kabulü hâlâ açık. İçerik veya hesap bilgisi içermeyen sayısal özet `tests/artifacts/kick-visible-control/summary.json` içinde Git dışındadır. Sonraki farklı kanıt, kontrolü gerçekten oluşan bir oynatıcı/VOD ya da farklı tarayıcı koşulu olmalıdır; aynı Firefox hover döngüsünü tekrarlamak yeni kabul kanıtı üretmez.

## v0.7.5 — bildirilen Video.js oynatıcı

Üst sayfada gizli, readyState 0 bir video; aynı kökenli iframe'de hazır Video.js 7.18.1 oynatıcı bulundu. HUD gerçek iframe hedefini ve 480/720/1080 envanterini seçti. Site kendi native kalite bileşenini video başlatıldıktan sonra oluşturuyor; eklentinin bağlı VHS temsillerinden seçim yapması sitenin Auto etiketini açık bırakıyordu.

v0.7.5, bu tek video sahibine ait `.vjs-quality-button .item-quality` öğelerini tanır; doğrudan sayısal caption'ı nested HD/FullHD ikonlarından ayırır. Aynı yükseklikteki seçenek sitenin kendi gerçek kontrolünden uygulanır, `vjs-checked` yalnız okunur. Native seçim yeni ağ adresi tahmini, sahte ARIA veya ek tampon müdahalesi değildir.

Son kaynak SHA256'sıyla temiz görünür Firefox 158.0.1 ve Edge 152.0.4191.53 kurulumlarında:

| Tarayıcı | Eklenti isteği | Site native seçimi / SDK | Decoded görüntü | HUD sonucu |
|---|---|---|---|---|
| Firefox | 1080p | 1080 / 1080 | 1280×720 | Not confirmed, başarı vurgusu yok |
| Firefox | 480p | 480 / 480 | 1280×720 | Not confirmed, başarı vurgusu yok |
| Edge | 1080p | 1080 / 1080 | 1280×720 | Not confirmed, başarı vurgusu yok |
| Edge | 480p | 480 / 480 | 1280×720 | Not confirmed, başarı vurgusu yok |

İki motorda gerçek iframe videosu hız 1.5x ve native ses 0.4 komutlarını da aldı. Böylece gizli/yüklenmemiş üst video yerine hazır iframe hedefinin kontrol edildiği bu örnekte doğrulandı. Bu tek durum diğer bildirilen gömülü sitelerin kabulü yerine geçmez.

Üç rendition'ın üçünde de `playlist.resolvedUri` alanı doluydu ve değerler tek bir distinct adres bildirdi. Adresler dışa aktarılmadı. Önceki manuel site menüsü denemesinde de native 1080 seçili görünürken decoded görüntü 720 kaldı. Bu bulgular bu kaynağın ilan ettiği kalite ile görüntü arasındaki farkı gösterir; sunucu yanıtlarının daima aynı olduğunu, bütün katalogda tek kalite bulunduğunu veya kullanıcının başka içerikte gördüğü farkın geçersiz olduğunu kanıtlamaz.

Yeni VHS 2 özel reset/seek denemesi görüntü değişimini doğrulayamadığı için son kaynakta tutulmadı. Mevcut dar VHS 3 kurtarma yolu korunur. **Native menü eşleşmesi ve iframe kontrolü doğrulandı; gerçek decoded kalite değişimi kabulü başarısız/açık kaldı.** 170 Node testi geçti. Git dışı sayısal özetler `tests/artifacts/videojs-site-{firefox,chromium}-v075-native/summary.json`; `decodedAcceptance:false` açıkça kayıtlıdır. Test yardımcısı bu durumda tam görüntü kabulü için çıkış kodu 2 üretir; kanıt toplanması başarıya dönüştürülmez. Site adı eşleşmesi özel yerel nottadır, bu belgede izleme adresi/içerik adı yoktur.
