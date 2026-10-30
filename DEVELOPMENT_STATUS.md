# Yeni raporlar sonrası kaynak çalışma durumu

22 Ekim 2026 · **v0.7.1 kaynak geliştirmesi**. Bu belge bir release duyurusu değildir. Kaynak klasörü üzerinde çalışılır; kullanıcı istemeden ZIP, yayın veya push yapılmaz. Önceki sürüm kanıtları kendi release notlarında korunur. **152 Node regresyon testi geçti.**

## Uygulanan düzeltmeler

- YouTube sınıfı veya alan adı tek başına adaptör kanıtı değildir. API'nin seçili videoya sahipliği doğrulanır; readyState 0 olan öğe YouTube adaptörüne alınmaz ve video seçiminde geriye düşer.
- Otomatik enjeksiyonun document.readyState değerinden toolbar tıklaması çıkarılmaz. Toolbar açık bir isolated-world işareti gönderir; motorun tekrar yüklenmesi paneli kendiliğinden açmaz.
- Henüz hazır olmayan iframe kaynağı aynı oturumda metadata/playing olayını bekler. Geç keşif sırasında açık üst panel gizlenmez. Yenilenen veya değiştirilen iframe yeniden bağlanır; önceki oturum komutları taşınmaz.
- Site/platform varsayılan olarak `other` / `unlisted`. Her raporda isteğe bağlı seçimle yalnızca önizlemede görülen alan adı ve platform eklenir. Iframe alan adı sayfa alan adından ayrı açıklanır. Tam URL, içerik yolu ve sorgu parametreleri eklenmez; domain paylaşım bağlantılarına otomatik taşınmaz.
- Açıklama sınırı 500'den görünür sayaçlı 4000 karaktere çıkarıldı. Sınır büyük rapor/DOM metni yükünü sınırlar; anonimleştirme yapmaz. Açıklama ve silme talebi hâlâ isteğe bağlıdır.
- German_7619 / Spacious74 referansı dikey sekmelerde seçili etiketi içerik yüzeyine birleştirir. Native button / ARIA tablist ve klavye davranışı korunur. Ayrıntılı hareket farkları ANIMATION_DETAILS.md içindedir.
- Sıfır opaklıklı altyazı zemininin kenarlık ve kutu gölgesi kaldırıldı. Metin gölgesi okunurluk için ayrı kalır. Uzun CDN işlem yazısı sarılır. Iframe ses durumunun slider dolgusu/renkleri yenilenir.
- Puhu'nun CDN/SMIL adından üretilen tahmini kalite listesi ve kaliteyi değiştirmiş gibi bildiren yol kaldırıldı. Yalnızca seçili oynatıcının gerçek Video.js/HLS envanteri ve sahipliği kullanılır; bunlar yoksa kullanılabilir kontrol iddiası yapılmaz. High/Standard/Low menüsünün sitedeki güncel uygulaması ayrıca doğrulanmalıdır.
- Kick için doğrudan React props, Radix varsayılan ölçeği ve native range ölçeği desteklenir. Bilinen callback önbelleği korunur; keyfi React state hook'u değiştirilmez. Siteyi güncellemiş gibi görünmek için ARIA değeri/slider konumu elle taklit edilmez. VOD belirleme yalnız eski URL biçimine bağlı değildir. Güncel Kick arayüzü canlı kabul bekler.
- Medya kaldırıldığında filtre/hedef/kalite/React cache referansları temizlenir; kapalı panelde bitmiş kalite isteği için timeupdate başına tarama yapılmaz. Altyazı gösterimi ve bekleyen istekler korunur.

## Gizli test kayıtları

SITE_COMPATIBILITY.md, ACCEPTANCE_STATUS.md ve PRIVATE_TEST_NOTES.md yalnızca yereldir; ignore kurallarına alınmıştır. İlk iki dosya diskte korunarak Git indeksinden çıkarılmıştır. Kamuya açık metinlerde kişisel test sitesi adları genelleştirilmiştir. Bu işlem eski Git commitlerini veya daha önce yayımlanmış kopyaları silmez; geçmiş yeniden yazılmamıştır.

## Doğrulama sınırı

Node regresyonları ve kurulu geçici Firefox eklentisiyle yerel sentetik kontroller uygulanır. Firefox 158.0.1'de geç keşif, iframe değişiminden sonra ses komutu, kullanıcı açmadan fullscreen, tek görünür panel, sıfır opaklıklı altyazı kenarı, klavye/idle davranışı ve HLS/Video.js 1080p–480p decoded geçişleri geçti. İkinci turda 2.0 CSS piksel ölçeği kullanıldı; bu gerçek Ctrl+%200 tarayıcı zoom veya ekran okuyucu kabulü değildir.

Gerçek sitelerde güncel Kick UI eşleşmesi, Puhu'nun isimli kalite menüsü ve kullanıcı tarafından bildirilen kalite doğrulama sorunları yalnız bu testlerle kapatılmış sayılmaz. Bellek bulguları ve ölçüm sınırları MEMORY_MEASUREMENTS.md içinde tutulur. Etkin kapsam ACTIVE_WORK.md dosyasındadır.

## v0.7.2 kaynak kontrol noktası

158 Node testi geçti. Ses bağlamı artık sayfa genelinde tüm medya kaynaklarını paylaşmaz: her isteğe bağlı Web Audio binding'i kendi video sahibine bağlıdır. Medya DOM'dan kaldırıldığında source bağlantısı kesilir ve yalnız o bağlam suspend edilir. Geçici sökülen medya tekrar eklenebilir; video erişilemez hâle geldiğinde finalizer ilgili bağlamı kapatır. Kaynak WeakMap, takip WeakRef ve graph WeakMap içinde tutulur. Finalizer zamanlaması garantili değildir; anlık disconnect/suspend finalizer'a bırakılmaz.

Ses seviyesi girdisi aynı route'u yeniden kurmaz; mono/stereo değişiminde gerektiğinde route güncellenir. Splitter/merger yalnız mono istenince oluşturulur. Son gain isteği AudioParam.value'nun eski audio quantum'u yansıtabilmesinden bağımsız izlenir. Native stereo <=100%, DRM bypass ve kaynak sahibi doğrulaması korunur.

Gerçek geçici Firefox ve Chromium tabanlı Edge eklentisinde 30 kapat/aç, aynı videoda 20 boost/mono kontrol döngüsü ve 20 video değişimi ölçüldü. Chromium'da eski sürümde 20 kaldırılmış video / 21 source kalırken düzeltilmiş adayda 0 kaldırılmış video / 1 source / 1 context kaldı. Firefox'ta da bir canlı medya/source/context kaldı. Yeniden ekleme ve hızlı gain isteği ayrıca v0.7.2 kısa regresyon turuyla kontrol edilir. Toplam süreç RAM'i ve gerçek site kabulü bu nesne sonuçlarından çıkarılmaz; ayrıntılar MEMORY_MEASUREMENTS.md içinde.

Son v0.7.2 kısa turu iki motorda geçti: geçici sökme/yeniden ekleme yeni context/source yaratmadı ve running durumuna döndü; hızlı gain dizisinin son 1.5 hedefi gözlendi; üç ek video değişimi sonunda kaldırılmış nesne 0, canlı video/source/context 1 oldu. Aynı kökenli iframe ve Shadow DOM kaldırma gözlemcisi/ayrılmış çerçeve sahipliği Node regresyonlarıyla kapsanır; bu ek kök durumları için gerçek site belleği doğrulanmış sayılmaz. GPU/CPU ölçüm yardımcısı bu aşamada yalnız sözdizimi kontrolünden geçti; filtre performans karşılaştırması sonraki hedeftir.

## v0.7.3 — ölçülmüş filtre hedef araması

159 Node testi geçti. Filtre sürüklemesinin her karesinde tam oynatıcı/medya seçimi yerine en fazla 200 ms yaşayan zayıf hedef önbelleği kullanılır. Medya keşfi değişimi, açık hedef seçimi ve kaldırılmış video yeniden keşfi hemen tetikler. Statik efektlerin sırası/renk işlemleri değiştirilmedi; Web Audio veya rapor alanlarına ek veri eklenmedi.

Kurulu geçici Firefox ve Chromium tabanlı Edge'de yerel 1080p30 video, iki tekrar, açık/kapalı HUD ve sürükleme ölçümleri tamamlandı. Sürükleme video konumu sorguları Firefox'ta 199/202 → 94/93, Edge'de 386/386 → 98/88 oldu. Firefox sürükleme kare kaybı 28/19 → 14/2; Edge sürüklemede iki sürümde de kayıp 0 idi. CPU örnekleri değişken; genel CPU/GPU kazancı iddia edilmez. Yöntem, GPU sayaç sınırları, kontrol pencereleri ve tüm sayısal sonuçlar [FILTER_PERFORMANCE.md](./FILTER_PERFORMANCE.md) içinde.

Firefox headless tam filtre zinciri başlangıç ölçümünde 150 karenin 99/97'sini düşürdü; statik CSS yeniden yazımı sıfırdı. Bu render maliyeti v0.7.3'te çözülmüş sayılmaz. Görünür tarayıcı/compositor ayrıştırması ve geçerli Firefox GPU ölçümü açık. Bellek native/cache sınıflandırması, Kick UI/reklam ve Puhu/Video.js/yanlış iframe gerçek site kabulü hâlâ tamamlanmadı. Sürüm artışı kullanıcıya bildirildi; ZIP/release/push yapılmadı.

## v0.7.4 — Puhu gerçek menü eşleşmesi ve korunan eski seçenek

Puhu'nun isimli kalite kontrolleri, seçili video sahibinin gerçek menü ID'leriyle eşleştirildi. SDK'nın diğer gerçek seviyeleri korunur. Temiz Firefox tekrarında 1080p / Yüksek / 1920×1080 ve 480p / Düşük / 854×480, eklenti onayıyla birlikte gözlendi. Eski bir akıştaki 1080p metadata / 576p decoded farkı ayrı açık sorun olarak kaydedildi; tek denemeden eski yeniden deneme yönteminin hiç çalışmadığı sonucu çıkarılmadı.

Kullanıcı talebiyle eski manuel `1080p kaynağını yeniden dene` seçeneği kalite bölümüne geri eklendi; daha iyi karşılık doğrulanana kadar korunur. Alternatif kaynak ve gerekirse sayfa yenileme akışı sürer. Tek eşzamanlı istek, seçili video/SDK/source sahipliği, DRM engeli ve kesin CDN host denetimi eklendi; salt deneme başarı olarak işaretlenmez. Yenileme hâlâ RAM ayarlarını sıfırlar, kalıcı depolama kullanılmaz.

Kick gerçek sayfasında IVS sesinin %35 isteğini aldığı görüldü; görünür kontrol eşleşmesi ve gerçek reklam döngüsü henüz doğrulanmadı. Güncel oyuncu kökü reklam denetimine eklendi, sahiplik/görünürlük kısıtları korundu. **166 Node testi geçti.** Canlı kabul kapsamı ve sınırlamalar [LIVE_SITE_VALIDATION.md](./LIVE_SITE_VALIDATION.md) içindedir; hedefin bütünü açık, ZIP/yayın/push yoktur.

## v0.7.5 — gerçek Video.js native seçim eşleşmesi

Tek video sahibinin `.vjs-quality-button .item-quality` kontrolü desteklenir. Doğrudan sayısal metin, nested HD/FullHD ikonlarından ayrılır; native `vjs-checked` okunur ve gerçek menü bir kez tıklanır. Kaynak değişmiş/başka video sahibinden kalan handle reddedilir; ek SDK seviyeleri korunur. Puhu'nun isimli kontrolleri ve eski manuel retry seçeneği sürer. **170 Node testi geçti.**

Temiz kurulu görünür Firefox/Edge'de, bildirilen Video.js örneğinde 1080p ve 480p komutları site ve SDK seçiminde eşleşti; gerçek iframe 1.5x/%40 ses komutunu aldı. Üç rendition aynı resolved URI alanını bildiriyor; görüntü iki motorda da 720p kalıyor ve eklenti bunu doğru biçimde onaylamıyor. Bu yüzden decoded kalite kabulü açık kalır. Ek VHS 2 reset/seek denemesi son kaynakta tutulmadı. Ayrıntı LIVE_SITE_VALIDATION.md; özel site eşleşmesi Git dışındaki notta. Kaynak v0.7.5, yeni release/ZIP/push yok.

## v0.7.6 — FilmDeck adı ve marka yerleşimi

29 Ekim 2026. Ürün adı FilmDeck by NOk; HUD erişilebilir adı ve etkinlik metinleri FilmDeck. Kullanıcının sağladığı yatay logo başlıkta açık zemin üzerinde, mevcut NOk logosu yalnız alt imza alanında gösterilir. Alt imza sekme içeriklerinin dışında kalır; mini modda gizlenir. Görseller extension URL'sinden yüklenir; yükleme hatasında okunur metin yedeği korunur. Depo adresi, eklenti kimliği ve protokol adları değişmedi.

170 Node testi, JS sözdizimi ve iki tarayıcıda yerel kurulu eklenti marka kontrolü geçti. Firefox/Chromium'da Player/Subtitles/Settings, görsel yüklenmesi, alt imzanın sınırları ve hata sonrası metin yedeği doğrulandı; Chromium ekran görüntüleri ayrıca incelendi. Bunlar yeni canlı site kabulü veya sınıf kullanılabilirlik deneyi değildir. Yatay wordmark'tan 16/48/128 kare ikon türetilmedi; önceki kare araç çubuğu ikonları durur. Kaynak sürümü v0.7.6; release/ZIP/push yok.

### 30 Ekim 2026 — kullanıcı tarafından sağlanan kare simge

`icons/icon_not_round.png` (1254×1254, saydam PNG) kaynak alınarak `icon16.png`, `icon48.png` ve `icon128.png` yenilendi. Kaynak dosyanın hash'i işlem öncesi/sonrası aynı; yalnız boyutlandırma yapıldı, kırpma/renk değiştirme/ek yuvarlatma uygulanmadı. PNG boyutları, alpha kanalı ve hem manifest hem toolbar eşleştirmeleri doğrulandı; üç çıktı görsel olarak incelendi. 16 px sürümde karakter ayrıntıları seçilemez hâle gelir; bu tur ayrı sadeleştirilmiş tasarım üretilmedi. Yeni tarayıcı yükleme veya canlı site testi yapılmadı. Küçük varlık güncellemesi aynı v0.7.6 içinde; HUD yerleşimi/tema önerileri ayrıca değerlendirilir.
