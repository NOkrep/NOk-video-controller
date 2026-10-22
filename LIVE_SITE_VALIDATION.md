# Gerçek site kontrolleri — v0.7.4

22 Ekim 2026. Gerçek kurulu eklenti, ayrı ve geçici Firefox 158.0.1 profili, hesap girişi yok. Headless tarayıcı; kişisel profil kullanılmadı. Bu kayıt bütün site kataloğuna veya tüm tarayıcılara uyumluluk garantisi değildir. İçerik adları, tam izleme adresleri, hesap bilgileri, akış token'ları ve API anahtarları bu dosyaya alınmaz. Yerel operatör çıktıları `tests/artifacts/` içinde Git dışında tutulur.

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
