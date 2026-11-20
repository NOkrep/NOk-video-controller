# Tasarım referansları ve kullanım kaydı

Güncelleme: 19 Ekim 2026 · v0.5.10. Bu dosya proje kaydıdır; tarayıcı tercihleri yalnızca RAM'de tutulur. Kullanıcının seçtiği referanslar aşağıdadır. Kullanım durumu değişirse ilgili satır, sürüm ve uyarlama notu birlikte güncellenmelidir.

20 Ekim 2026 / v0.6.0 ek notu: tüm temalar ve aşağıdaki kullanım durumları korunur. Kaynak animasyon süreleri, eğriler, taşınan ve taşınmayan parçalar ayrıntılı olarak [ANIMATION_DETAILS.md](ANIMATION_DETAILS.md) içinde karşılaştırılmıştır. Bu aşamada yeni dekoratif animasyon eklenmedi.

## Uygulanan bileşenler

| Referans | Durum / yer | Uyarlama |
| --- | --- | --- |
| [Voxybuns — buttons](https://uiverse.io/Voxybuns/lucky-fireant-71) | **Kullanılıyor, v0.5.10:** ana eylemler, hazır hız/ses düğmeleri, rapor eylemleri (`pvc-raised-button`). | Yükseltilmiş çerçeve ve basılma hissi; mevcut button ve metin düğümleri korunur. Ölçü/renk tema tokenlarına uyar. Hareket azaltmada yer değiştirme kapalıdır. |
| [WhiteNervosa — checkboxes](https://uiverse.io/WhiteNervosa/green-donkey-82) | **Kullanılıyor, v0.5.10:** teşhis ekranındaki açıklama ve silme talebi kutuları (`pvc-check-input`, `pvc-check-visual`). | Daire/çizgi/check geometrisi uyarlandı. Kaynakta `display:none` olan input burada odaklanabilir kalır; label bağlantısı, Space, checked ve change davranışı korunur. Kaynak ayrıca @mrhyddenn varyasyonunu kredilendirir. |
| [gharsh11032000 — toggle switches](https://uiverse.io/gharsh11032000/brave-pug-20) | **Kullanılıyor, v0.5.10:** dört erişilebilirlik tercihi (`pvc-switch`). | Çerçeveli oval ve kayan işaretçi. Native checkbox `role=switch` ile, etiket içinde ve odaklanabilir boyutta kalır. Yoğun mavi glow yerine tema rengi ve görünür odak kullanılır. |
| [Nawsome — loaders](https://uiverse.io/Nawsome/slimy-tiger-93) | **Kullanılıyor, v0.5.10:** kullanıcı CDN ölçümünü başlattığında, gerçek işlem süresince (`pvc-loading-grid`). | Beş kareli hareket 4px kare / 5px aralığa indirildi; keyframe adları `pvc-*`. `aria-busy` ve yazılı bekleme durumu vardır. İşlem bitince/başarısız olunca kaldırılır; hareket azaltmada animasyon gösterilmez. |
| [eslam-hany — inputs](https://uiverse.io/eslam-hany/strange-goose-48) | **Kullanılıyor, v0.5.10:** isteğe bağlı rapor açıklaması (`pvc-feedback-field`). | Ofset kenarlık/gölge ve focus alt çizgisi. Mevcut textarea, görünür yönerge, aria-label, disabled ve gizlilik seçimi korunur; kaynağın gizlenen etiketi taşınmaz. |

Bu beş örneğin HTML/CSS'i Uiverse'in [resmî Galaxy arşivinden](https://github.com/uiverse-io/galaxy) incelendi. Doğrudan Uiverse kaynak indirmesi engellendiği için herkese açık arşiv kullanıldı. Çalışma sırasında üçüncü taraf JS çalıştırılmadı; projeye uzak bağımlılık, font veya ağ çağrısı eklenmedi. Dağıtım bildirimleri [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) içindedir.

Arşiv yolları:

- `Buttons/Voxybuns_lucky-fireant-71.html`
- `Checkboxes/WhiteNervosa_green-donkey-82.html`
- `Toggle-switches/gharsh11032000_brave-pug-20.html`
- `loaders/Nawsome_slimy-tiger-93.html`
- `Inputs/eslam-hany_strange-goose-48.html`

## Sonraki uygun kullanım için ayrılanlar

| Referans | Durum ve uygun kullanım | Ön koşul |
| --- | --- | --- |
| [german_7619 — radio buttons](https://uiverse.io/german_7619/brown-sloth-50) | **Kullanılıyor, 22 Ekim 2026:** üç dikey HUD sekmesi. Önceki “bekliyor” kaydı bu tarihte güncellendi. | Sayfa ve etkileşimli görünüm tekrar incelendi; Spacious74 varyasyon kredisi korundu. Seçili etiket, içerikle aynı yüzey rengine ve ters yuvarlatılmış dış köşelere sahip. Kaynaktaki yatay radio yapısı yerine mevcut native button / ARIA tablist, ok tuşları ve odak korundu. Kaynak animasyonunun birebir kopyası değildir; uzak kod eklenmedi. |
| [zanina-yassine — forms](https://uiverse.io/zanina-yassine/angry-shrimp-34) | **Bekliyor.** Çok alanlı altyazı görünümü/ayar formunun kart, boşluk ve alan gruplaması için aday. | Kaynak bir checkout formudur. Mevcut küçük HUD'a ödeme/hesap alanı eklemek için gerekçe yoktur; yalnızca uygun bir yerel ayar formu oluşursa yerleşim yaklaşımı uyarlanabilir. HTML/CSS arşivden incelendi. |
| [vinodjangid07 — tooltips](https://uiverse.io/vinodjangid07/funny-panther-79) | **Bekliyor.** Karmaşık adaptör/kalite durumları yanında küçük yardım kontrolü için aday. | Aynı örneğin kodu arşivde bulunamadı. Hover yanında focus, Escape, dokunma ve panel sınırında taşmama davranışı birlikte tasarlanmalı; native title/erişilebilir adlar şimdilik korunur. |

## Temalar

[SevenGrid](https://sevengrid.app/?ref=grave) sayfasının herkese açık tema bandı ve CSS renk değişkenleri tarayıcıda incelendi. **20 temanın tümü** Settings → Themes içine eklenmiştir. Sayfanın JS'i, yazıları, görselleri veya uygulama özellikleri kopyalanmadı; renk değerleri/adları HUD tokenlarına eşlendi. Açık/koyu/OLED aileleri ve değerlendirme [THEME_EVALUATION.md](THEME_EVALUATION.md) içindedir.

Atlas başlangıçtır. Temalar yerel tanımlıdır ve çevrimdışı uygulanır. Seçim çerçeve belleğinde kalır; kapat/aç korur, sayfa yenileme Atlas'a döndürür. Tema kimliği ve erişilebilirlik tercihleri teşhis JSON'una eklenmez. Kullanıcının finalist beş tema seçimi henüz yapılmadı. **5 Kasım 2026 kullanıcı kararı:** finalist seçilmeyecek, 20 tema kalıyor.

## I-13 seçili simgeler — 21 Kasım 2026, v0.8.3.1

Kullanıcı karşılaştırmadan 4A, 6A, 10B, 16A, 17A ve 30A'yı seçti ve uygulamaya
geçilmesini istedi. 8A ve 45A geçici tercihlerdir; daha sonra tekrar
değerlendirilecek. Diğer envanter satırları için toplu kabul varsayılmadı.

| Önce | Sonra | Gerekçe / kapsam |
| --- | --- | --- |
| Rapor bağlantısında ahtapot emojisi | GitHub Octicons işareti (4A) | Hedef hizmet doğrudan tanınır. SVG yolu yerel kayıt defterinde; dış istek yok. Kaynak/MIT bildirimi THIRD_PARTY_NOTICES.md içinde. |
| İzin/kısayol rehberi başlığında kilit emojisi | Anahtar delikli kilit SVG'si (6A) | Başlık site erişimi ve kısayol rehberini birlikte kapsar; kısayollar düğmesinin klavye simgesi korunur. |
| Adaptör başlığında yapboz emojisi | Yapboz SVG'si (10B) | Video/kalite simgesinden ayrılan uyumluluk anlamı. |
| Yenileme simgesindeki eski ok çizimi | Dengeli iki yenileme oku (16A) | Ortak `refresh` çizimi güncellenir; yeniden tarama, çözünürlük yenileme ve 1080p kaynak denemesi aynı anlamı korur. |
| Kolay okunur düzenin Mono düğmesinde ayar çubukları | Araç çubuğundaki `monoSource` ile aynı SVG (17A) | Düğmenin işlevi/etiketi korunur; iki düzenin ses modu gösterimi eşleşir. |
| Filtre sıfırlamada yenileme simgesi | Ayrı, ters yönlü dönüş oku (30A) | Araç çubuğu ve Kolay okunur düzendeki filtre sıfırlaması ayrışır; mevcut Sıfırla / Tümünü sıfırla etiketleri değişmez. Yeni etiket önerisi ayrıca kabul edilmiş sayılmaz. |
| Kısayollar kapalı bildiriminde sessiz hoparlör emojisi | Yalnız metin, TR/EN (8A, geçici) | Sesin kapandığı izlenimi azaltılır; başka simge adayı ileride değerlendirilebilir. |
| Hareketi azalt için mevcut dalga | Mevcut dalga korunur (45A, geçici) | Kullanıcı şimdilik bu gösterimi seçti; kesin tasarım kabulü değildir. |

Yeni çizimler mevcut `uiIcon` / `uiLabel`, 24'lük görünüm alanı ve 1.7 çizgi
kalınlığını kullanır. GitHub marka işaretinin özgün dolgusu korunur. Diyaloglar
HUD dışında bulunduğundan SVG'nin varsayılan boyutu açıkça 18 px'dir; araç
çubuğunun mevcut CSS boyutları korunur. Çalışma anında HTML ataması eklenmedi;
mevcut güvenli `setUiMarkup` yolu kullanılır. Altyazı, dosya adı, yorum ve rapor
içeriği değiştirilmez. Doğrulama ve açık iş sınırları ACTIVE_WORK.md kaydındadır.
