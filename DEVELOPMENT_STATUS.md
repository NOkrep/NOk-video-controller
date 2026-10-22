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
