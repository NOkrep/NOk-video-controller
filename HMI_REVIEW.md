# NOk Video Controller — HMI değerlendirmesi

19 Ekim 2026 · v0.5.8 geliştirme sürümü

İlk bulgular v0.5.7 yerleşimine aittir; v0.5.8 değişiklikleri ve kalan öneriler aşağıda ayrıca belirtilmiştir.

Bu değerlendirme `injected.js`, `injected.css` ve mevcut kullanıcı raporlarına dayalı bir kullanılabilirlik incelemesidir. Canlı tarayıcıda görsel denetim, ekran okuyucu testi, görev süresi ölçümü veya kullanıcı araştırması yapılmadı. Aşağıdaki öncelikler ürün değerlendirmesidir; bir WCAG uygunluk belgesi değildir.

## Genel değerlendirme

Panel işlev bakımından güçlü; ilk kullanımda bilgi yükü yüksek. Ana sorun özellik eksikliği değil, sık kullanılan işlemlerle teknik durum bilgilerinin aynı dar alanda benzer ağırlıkta sunulması. Bir sonraki tasarım adımında hız, ses, oynat/duraklat ve kaliteyi öne çıkarıp adaptör ayrıntılarını gelişmiş alana taşımak en fazla faydayı sağlayacaktır.

İyi çalışan tasarım kararları:

- Hız ve ses varsayılan olarak açık; filtreler ve altyazı ikincil bölümlerde. Bu gruplama sık ve seyrek kullanılan işleri ayırıyor.
- Hazır hız/ses değerleri, kaydırıcılar ve kısayollar farklı kullanım alışkanlıklarını destekliyor. 1x ve %100 hazır düğmeleri sıfırlamayı yalnızca çift tıklamaya bağımlı bırakmıyor.
- Küçültülmüş panel videoyu daha az kaplıyor; yer değiştirme ve ekran sınırı denetimi mevcut.
- Teşhis önizlemesi ve açıklamanın isteğe bağlı olması paylaşım üzerinde kontrol sağlıyor. Yeni silme kutusu da ayrı ve varsayılan olarak kapalı.

## Öncelikli bulgular

| Öncelik | Bulgu ve kullanıcıya etkisi | Önerilen değişiklik | Durum |
| --- | --- | --- | --- |
| Yüksek | Hız/ses özetleri çoğunlukla istenen değeri gösteriyor. Oynatıcı isteği geri alırsa kullanıcı kontrolün gerçekleştiğini düşünebilir; TRT raporları bu ayrımı önemli kılıyor. | İstenen ve gözlenen değer ayrışınca kalıcı, kısa durum göster: “İstenen 2x · Oynatılan 1x”. Kalite düğmesi vurgusu da uygulama başarısı anlamına gelmemeli. | Sonraki çalışma |
| Yüksek | Açılır pencerelerde başlangıç odağı, Tab çevrimi, Escape ile kapatma ve kapatınca odağı geri verme akışı tanımlanmamış. Adaptör seçenekleri tıklanabilir `div`. Klavye kullanıcısı arka sayfaya geçebilir veya seçime ulaşamayabilir. | Pencerelere gerçek dialog davranışı, başlık ilişkisi ve odak yönetimi; adaptör listesine yerel düğme/radyo kontrolleri ekle. Sadece `aria-modal` eklemek yeterli değildir. | Sonraki çalışma |
| Orta | Dar panelde 9.5–11px metinler ve az dolgulu düğmeler bulunuyor. İngilizce metinler ve tarayıcı yakınlaştırması taşma riskini artırıyor. | Ana metni yaklaşık 13–14px, sık kullanılan hedefleri yaklaşık 32px yüksekliğe çıkar; 200% yakınlaştırmada ve dar ekranda gerçek ölçüm yap. | Görsel deneme gerekli |
| Orta | Adaptör/Tier, paket, RAM ve CDN Ping gibi terimler izleyicinin yapmak istediği işlemden daha teknik. | “Video kalitesi”, “Altyazı yükle”, “Gelişmiş oynatıcı ayarları” gibi görev adları kullan. Adaptör/Tier ve teşhis ayrıntılarını gelişmiş alana taşı. HTTP ölçümünü “CDN yanıtı” olarak adlandır. | İngilizce başlıklar sadeleştirildi; CDN adı iki dilde düzeltildi. Tam yeniden gruplama yapılmadı. |
| Orta | İki saniyede çok silik, dört saniyede görünmez panel, fare dışarıdayken durum okumayı zorlaştırabilir. Klavye odağı için mevcut gizlenmeme koşulu faydalı. | Bellek içi “Paneli açık tut” seçeneği veya daha uzun süre sun; odakla görünürlüğün geri dönmesini koru. | Odak giriş/çıkış olayları eklendi; süre ve davranış tercihi sonraki çalışma |
| Orta | Ana panelde bölüm başlıkları yalnızca tıklamayla açılıyordu; kaydırıcıların ayrı erişilebilir adları yoktu. | Bölümlerde Tab, Enter/Space ve açık/kapalı durumu; kaydırıcılarda erişilebilir adlar. | Bu sürümde eklendi; gerçek ekran okuyucu testi bekliyor |
| Düşük | Emoji simgeleri platforma göre değişiyor; görünüş ve tooltip tek başına anlamı aktarmayabilir. Bazı durumlar yalnızca renk veya etkin sınıfla belirtiliyor. | Tutarlı simge seti, metinle durum, açma/kapama düğmelerinde `aria-pressed`; dokunma ve klavye kullanımında yardımcı açıklama. | Sonraki çalışma |

Hedef boyutu için WCAG 2.2 AA 2.5.8, istisnalar dahil 24×24 CSS piksel veya yeterli aralık koşullarını açıklar. Burada kesin boyut ihlali ilan edilmedi; gerçek yerleşimde boyut ve aralık ölçülmelidir. Yukarıdaki 32px önerisi panel için ürün tercihidir. [W3C hedef boyutu açıklaması](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Akordeon için Enter/Space, `aria-expanded` ve `aria-controls`; dialog için odak taşıma, Tab çevrimi ve Escape davranışı referans alınmıştır. Mevcut kısmi iyileştirmeler tam erişilebilirlik onayı sayılmaz. [W3C akordeon örüntüsü](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), [W3C dialog örüntüsü](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Önerilen bir sonraki düzen

Üstte marka, açık bir oynat/duraklat kontrolü, küçültme ve kapatma; hemen altında hız, ses ve gerçek oynatma durumu. Kalite, altyazı ve görüntü ayarları mevcut açılır bölümlerde kalabilir. Dil seçimi görünür bir metinli kontrol olmalı; bayrak kullanmak gerekmiyor. Adaptör seçimi, teknik ayrıntılar, HTTP ölçümü ve rapor gelişmiş/yardım alanında gruplanabilir. Bu düzen henüz uygulanmadı.

Dil seçimi v0.5.7'de `Türkçe / English` olarak ayrı satırda eklendi. v0.5.8 itibarıyla tarayıcı dilinden bağımsız İngilizce başlar; dil Settings alanındadır. Seçim sayfa belleğinde kalır, yenilemede sıfırlanır. Dil değişimi paneli yeniden kurmaz; açıklama, kutu seçimi, kaydırıcı değerleri ve açık bölümler korunur. Altyazı metni, dosya adı ve teşhis JSON'u çevrilmez.

## Canlı doğrulama için kabul ölçütleri

1. Firefox ve Chromium'da her iki dilde 100%/200% yakınlaştırma: başlık, düğme, kalite notu ve silme açıklamasında kesilme veya yatay taşma olmaması.
2. Yalnızca klavyeyle dil seçimi, beş bölüm ve kaydırıcıların kullanılması; odağın görünür kalması, sitenin kısayollarının tetiklenmemesi. Açılır pencerelerin kalan odak sorunu ayrıca giderilmeli.
3. HLS kalite listesi yenilenirken ve altyazı yüklüyken dil değişimi: seçili video, dosya adı, altyazı içeriği ve değerlerin korunması.
4. Çalışan panel iframe içindeyken dilin kardeş/yeni çerçevelere aktarılması; yenilemede başlangıç diline dönülmesi.
5. Silme kutusu kapalıyken talep alanının olmaması; açıkken önizleme ve taslakta talebin bulunması; hiçbir durumda özel açıklama veya JSON'un URL'ye eklenmemesi.

Node testleri çeviri, durum koruma, sabit dil sinyalleri ve rapor sınırını denetler. Yazı okunaklılığı, kontrast, gerçek hedef boyutları, ekran okuyucu duyuruları ve canlı oynatıcı geri bildirimleri ayrıca tarayıcıda sınanmalıdır.


## v0.5.8 ile uygulanan düzen

Player, Picture, Subtitles ve Settings sekmeleri eklendi. Hız/ses/kalite ana sekmede, filtreler ve altyazı ayrı sekmelerde; dil, adaptör ve yardım Settings içindedir. Kısayol düğmesi kapalı başlayan Accessibility alanına taşındı. Yeni alan otomatik gizlemeyi durdurma, büyük yazı/kontroller, yüksek kontrast ve panel hareketlerini azaltmayı içerir. Yalnızca seçili panel görünür; sekme geçişi kontrol/dosya durumunu korur. Bu adımlar üstteki gruplama ve gizlenme sorunlarını ele alır; görsel/yardımcı teknoloji doğrulaması beklenir. Açılır pencerelerdeki odak yönetimi, istenen/gözlenen değer ayrımı ve diğer bulgular henüz açık.

Ek erişilebilirlik adayları: klavye kısayollarını yeniden atama; altyazı yazı boyutu, arka planı ve konumunu ayarlama; daha büyük dokunma hedefleri ve ayarlanabilir arayüz ölçeği; kaydırıcı yanında sayısal giriş; odak geri verme/Escape/Tab çevrimi; renkle birlikte yazılı durum. Bunlar öneridir, bu sürümde uygulanmadı.

## Okunabilirlik için renk yönü ve örnek kaynaklar

Önerim mat koyu gri, daha az parlama/gölge ve tek mavi vurgu. Sürekli beyaz olmayan kırık beyaz ana metin, yeterince açık ikincil metin; yeşil/kehribar/kırmızı yalnızca durumlarda ve metin/simgeyle beraber kullanılmalı. Varsayılan tema, görsel yön seçimi beklenirken korunmuştur; yüksek kontrast isteğe bağlıdır.

| Rol | Önerilen renk |
| --- | --- |
| Ana zemin | `#111827` |
| Kart/kontrol zemini | `#1F2937` |
| Ana metin | `#F3F4F6` |
| İkincil metin | `#CBD5E1` |
| Etkin kontrol/vurgu | `#60A5FA` |

Önerilen opak renk çiftlerinde hesaplanan kontrast: ana metin/ana zemin 16.12:1, ikincil metin/kart zemini 9.89:1, vurgu/kart zemini 5.77:1. Normal metinde en az 4.5:1 kontrast hedeflenmeli; bu yalnızca renk çiftinin hesabıdır, gerçek HUD'daki saydamlık, odak, hover ve devre dışı durumları ayrıca ölçülmelidir. [W3C kontrast açıklaması](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html).

İncelenebilecek kaynaklar: [Mobbin](https://mobbin.com/) gerçek ürün ekranları ve ayar akışları; [Dribbble — browser extension](https://dribbble.com/search/browser-extension) eklenti tasarım konseptleri; [Dark Mode Design](https://www.darkmodedesign.com/) koyu tema renk/boşluk/okunabilirlik örnekleri. Konsept görselleri tek başına kullanılabilirlik veya erişilebilirlik kanıtı değildir. Arama için “browser extension”, “media player”, “settings panel”, “compact controls” kullanılabilir.
