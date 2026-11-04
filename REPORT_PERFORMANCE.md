# Rapor penceresi performansı — I-02

4 Kasım 2026. v0.7.7.9 kaynak kontrol noktası: I-02'nin ölçüm, ölçülen render yükünü azaltma, tekrar doğrulama ve sınırları belgeleme adımları tamamlandı. Tüm site/donanımlarda kasmasızlık veya bütün bellek hedefinin tamamlanması değildir.

## Kapsam ve yöntem

- Aynı üretilmiş 1080p30 VP8/Opus dosya, 1600×900 CSS video, 4000 sabit sentetik DOM öğesi; görünür geçici Firefox ve Chromium profilleri sırayla. Gerçek site veya tüm donanımların kabulü değildir.
- Gerçek kurulu eklentinin yalnız test kopyasında fonksiyon giriş/çıkış süreleri ölçülür: teşhis toplama, modalın senkron kurulumu, seçenekleri okuyup JSON hazırlama, JSON.stringify ve önizleme/bağlantı güncellemesi. İç içe süreler toplanmaz. Test ölçüm kodu üretim kaynaklarına ve teşhis JSON'una girmez. Kaynak SHA256 ve instrumented işareti kaydedilir; ayrıca değiştirilmemiş kaynakla kontrol yapılmalıdır.
- Açılışta iki rAF'a kadar gecikme ve gerçek tarayıcı klavye olayından sonraki ilk rAF'a kadar yorum tepkisi ölçülür. Bunlar fiziksel boya/ekran gecikmesi değildir. Kısa yorum ve 3900 karakterlik sentetik yorumun sonuna ekleme ayrı ölçülür; IME, ekran okuyucu ve tüm gerçek kullanıcı yazma biçimleri değildir.
- HUD açık/rapor kapalı, rapor boşta ve testte yalnız modal backdrop bulanıklığı kapatılıp geri açılmış durumlar CPU/GPU ve video kare sayaçlarıyla karşılaştırılır. Ölçüm sırasında GC çalışmaz. CPU tarayıcı süreç alt ağacının çekirdek eşdeğeridir; süreç kümesi değişen örnekler kesin CPU karşılaştırmasına girmez. GPU motor toplamı tüm cihazın yüzdesi değildir.
- İlk açılış ve beş sıcak açılıştan sonra 10+10 aç/kapat; kapalı rapor kökleri ve dinleyici hedefleri yalnız WeakRef ile izlenir. Firefox GC/CC+cache minimizasyonu ve Chromium kontrollü GC yöntemleri farklıdır; motorlar arası mutlak RAM kıyası yapılmaz. Ham heap ve kişisel kaynak/kimlikler kaydedilmez.
- Rapor gizliliği, seçenekler, 4000 karakter sınırı ve manuel kopyalama/paylaşım davranışı bu hedefte sessizce değiştirilmez. Sayfa içi yorumun site betiklerinden gizlenmediği mevcut açıklama korunur.

## Yeniden çalıştırma

`node tests/report-performance.cjs --engine=both --label=baseline --compare-blur`

`--plain` üretim kaynağını değiştirmeden kurar; fonksiyon içi süre ölçümü yoktur. Sayfa tarafında sayısal klavye/MutationObserver/WeakRef gözlemcileri kalır; tamamen gözlemcisiz çalışma değildir. `--compare-blur`, özgün stilin karşıtını yalnız testte uygular ve geri alır (eski kaynakta blur→none→blur; yeni kaynakta none→blur→none). Geçici test kopyası ve sayısal kayıtlar Git dışı `tests/artifacts/reports-<label>/` altındadır. Mevcut yerel medya dosyaları kullanılır; bağımlılık veya medya indirilmez. Kişisel tarayıcı profili açılmaz ve rapor gönderilmez.

## Doğrulanan bulgu ve düzeltme

Raporun ekranı kaplayan katmanı `backdrop-filter: blur(6px)` ile arkadaki hareketli videoyu yeniden filtreliyordu. v0.7.7.8'de aynı oturumda yalnız bu özellik kapatılıp geri açıldığında 3D motor toplamı Firefox 55.0→1.8→54.5, Edge 17.8→1.0→16.8 oldu. Toplam GPU yüzdesi veya bütün kasmanın nedeni değildir. Firefox'un ilk none penceresinde CPU 0.357→0.582 arttı ve bir video karesi düştü; bu karşı örnek korunur. CPU/site/decoder değişkenliği yüzünden genel CPU kazancı iddia edilmez.

v0.7.7.9 yalnız rapor kökünde standart ve WebKit backdrop filtresini kapatır. Aynı %75 karartma ve kart/renk/tema/önizleme/yorum/kopyalama/paylaşım işlevleri korunur. Diğer modallar bu hedefte değiştirilmedi. Yeni izin, ağ isteği, depolama, timer veya rapor alanı eklenmedi. Fonksiyon ölçümleri JSON üretimini bu örnekte darboğaz göstermediği için yorum önizlemesine gecikme/debounce veya önbellek eklenmedi.

`backdrop-filter` öğenin arkasındaki alanı işler ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)); maliyet iddiası dokümandan değil yukarıdaki karşıt durum deneyinden gelir. rAF callback'i repaint öncesindedir; ölçülen tepki fiziksel boya süresi diye sunulmaz ([MDN rAF](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)). Eski kaynakta gerçek tarayıcı testi `blur(6px) != none` ile başarısız oldu; düzeltme sonrası Firefox 159 ve Edge 152'de gerçek UI tıklamalarıyla geçti. Ayrıca isteğe bağlı açıklama/silme talebi, ham metin önizleme, güvenli paylaşım linkleri, EN/TR ve kopyanın önizlemeyle eşleşmesi doğrulandı. Clipboard yalnız testte taklit edilir; kullanıcının panosu değiştirilmez.

## Aynı senaryoların sayısal tekrarı

Geçici görünür Firefox 159.0 ve Chromium tabanlı Edge 152.0.4191.53. `v0778-baseline` / `v0779-after` instrumented turlarında aşağıdaki fonksiyon/tepki değerleri kaydedildi. Küçük örnekler ve zamanlayıcı çözünürlüğü nedeniyle 0 ms maliyetsizlik anlamına gelmez. İç içe JSON/seçenek/önizleme süreleri birbirine eklenmez.

| Ölçüm | Firefox önce → sonra | Edge önce → sonra |
|---|---|---|
| İlk teşhis toplama (ms) | 4 → 4 | 2.9 → 5.5 |
| İlk modalın senkron kurulumu, JSON dahil (ms) | 3 → 5 | 2.1 → 2.7 |
| Sıcak teşhis toplama, 5 açılış medyanı (ms) | 5 → 5 | 3.5 → 4.8 |
| Sıcak modal kurulumu medyanı (ms) | 2 → 2 | 1.8 → 1.7 |
| İlk açılış → iki rAF (ms) | 39 → 29 | 60.8 → 59.1 |
| Sıcak açılış → iki rAF medyanı (ms) | 26 → 27 | 28.1 → 29.3 |
| Kısa yorum, input → sonraki rAF p95 (ms) | 53 → 11 | 16.5 → 14.8 |
| Uzun yorum, input → sonraki rAF p95 (ms) | 7 → 6 | 16.2 → 14.7 |
| Uzun yorumda JSON.stringify p95 (ms) | 1 → 1 | 0.1 → 0.1 |
| Uzun yorumda önizleme + bağlantı güncellemesi p95 (ms) | 1 → 1 | 0.3 → 0.3 |

Her kısa/uzun yorum turunda 56 gerçek (`isTrusted`) klavye girdisi ve 56 canlı önizleme yazımı görüldü. Uzun durumda 3900 karakterin sonuna 56 karakter eklendi; 4000 sınırı ve son JSON/yorum eşitliği korundu. İlk Firefox kısa yorumdaki 103 ms maksimum tepki sonrasında 57 ms idi; tekil fark yalnız düzeltmeye atfedilmez. Toplama süresi bazı örneklerde yükseldi; bu CPU/JSON hızlandırma değişikliği değildir.

Yeni kaynak içinde de ters durum tekrarı yapıldı: none→testte zorlanmış blur→none.

| Motor | 3D motor örnek toplamı | CPU çekirdek eşdeğeri | Düşen / toplam video karesi |
|---|---|---|---|
| Firefox | 1.4 → 29.25 → 1.8 | 0.108 → 0.424 → 0.111 | 0/180 → 1/181 → 0/180 |
| Edge | 0.8 → 24.5 → 1.0 | 0.375 → 0.731* → 0.335 | 0/179 → 0/179 → 0/180 |

`*` CPU süreç kümesi değişti; bu CPU değeri kesin karşılaştırmaya alınmaz, GPU süreç kapsamı da eksik olabilir. GPU sütunu cihazın toplam kullanım yüzdesi değildir. Açılış/yorum yükü ölçümünde test gözlemcilerinin ek işi bulunur. Sonuç, bu örnekte backdrop bulanıklığının tekrar eden render yükünün azaltılmasıdır; genel CPU/yazma hızı kazancı veya tüm sitelerde kasmasızlık değildir.

## Aç/kapat ve bellek ayrımı

İlk rapor + 5 sıcak aç/kapat sonrasında başlangıç, +10 ve +20 döngüde rapor kapalıyken GC/CC yapıldı. Connected DOM her turda 4422 öğede kaldı. Firefox'ta kapatılmış rapor kökü ve dinleyici hedefi 0/0/0 idi. Edge ilk turunda son rapordan 1 kök/17 dinleyici referansı 1/1/1 ve 17/17/17 olarak sabit kaldı; yeni kaynak turunda 0/0/0 idi. Bu tek örnek tutulmasının nedeni belirlenmiş veya CSS değişikliğiyle giderilmiş sayılmaz; döngü başına büyüme saptanmadı.

Edge kaynak turunda tüm belgeleri kapsayan CDP DOM düğümü 9139, JS dinleyicisi 137 olarak üç ölçümde de sabitti. JS heap 2.50→2.56→2.65 MB; test kendi sayısal süre/WeakRef kayıtlarını da tuttuğundan bu fark üretim eklentisinin sızıntısı sayılmaz. İlk turda heap yaklaşık 2.50 MB'de kalırken süreç private RAM 581→642→666 MB oldu; Firefox süreç RAM'i 918→949→949 MB idi. Tüm tarayıcı sürecinin native/cache/decoder payı bu dar deneyde ayrıştırılmadı; D-01 açık kalır. GC yalnız bellek kontrol noktalarında, performans pencereleri dışında çalıştı.

İlk Edge HUD açık/rapor kapalı penceresinde 5, yeni kaynakta aynı aşamada 3 ve döngüler sonrası rapor kapalıyken 14 düşen kare görüldü. Firefox ilk turda none ve döngü sonrası pencerelerde birer kare kaybetti. Kötü örnekler elenmedi; bunlar genel takılma sorununun bütünüyle çözüldüğünü söylemeyi engeller. Rapor kapalı kare kaybının nedeni bu deneyde belirlenmedi.

## Son kaynakla fonksiyon gövdeleri değiştirilmemiş kontrol

`v0779-plain`: gerçek kaynak klasörü kuruldu; fonksiyon sarmalayıcıları yok, sayfa gözlemcileri var. JS ve CSS SHA256 değerleri son kaynakla eşleşir. İki motorda HUD/rapor/döngü sonrası pencerelerde oynatma ve görünürlük doğrulandı. Rapor açık 6 saniyelik pencerede Firefox CPU 0.281, 3D 1.5, 0/180 düşen kare; Edge CPU 0.319, 3D 1.0, 0/180 idi. Her iki raporun hesaplanan backdrop değeri `none` idi. Edge HUD-only penceresinde 4/181 kare kaybı, döngü sonrası 0/180; Firefox iki aşamada 0/181 ve 0/180 verdi.

İlk açılış → iki rAF Firefox 33 ms / Edge 81.6 ms; sıcak açılış medyanı 25 / 29.2 ms idi. Kısa yorum tepki p95 38 / 13.8 ms; uzun yorum 5 / 13.1 ms. 56+56 gerçek girdi, canlı JSON/yorum eşitliği ve 4000 sınırı korundu. Bu bağımsız turlar tekil hız kazanma yüzdesi vermez; Firefox kısa yazmada 86 ms ve Edge'de 51.1 ms maksimum örnek kaldı.

GC sonrası 0/+10/+20 döngüde iki motorda kapatılmış rapor kökü ve dinleyici hedefi 0/0/0, bağlı DOM 4422/4422/4422 idi. Edge heap 2.57→2.54→2.62 MB; CDP düğümü 9140→9139→9139 ve dinleyici 137/137/137 idi. Bu kısa döngüde rapor nesnesi birikimi gösterilmedi; uzun kullanım/native bellek sızıntısızlık garantisi değildir.

## Kabul ve kalan sınırlar

- `npm run check`: 214/214 test ve sürüm/izin/varlık/MIT kontrolleri geçti. Yeni `report-browser.cjs` iki motorda geçti; sözdizimi ve diff boşluk kontrolü geçti. Uzak GitHub CI çalıştırılmadı. Bu yerel test mevcut üretilmiş medya fixture'ını gerektirir; CI'a eklenmedi.
- Rapor açma/toplama/önizleme/yorum ve tekrarlı kaynak ölçümleri ayrıştırıldı; ölçülen backdrop yükü düzeltildi ve eski/yeni karşıt durumlarda tekrarlandı. Daha pahalı olduğu gösterilmeyen JSON yolu yeniden tasarlanmadı.
- Bu tek donanım ve kontrollü yerel üst belge örneğidir. Gerçek sitenin SDK/DOM karmaşıklığı, iframe mesaj gecikmesi, tam ekran/zoom/IME/ekran okuyucu, HDR/4K/60fps ve farklı GPU'lar ayrıca kabul gerektirir. Bunlar mevcut gerçek site/erişilebilirlik/uzun bellek işleri kapsamında kalır.
- Soğuk açılış veya tekil input gecikmesi, rapor kapalı kare kaybı ve toplam native/cache RAM'in nedeni tam ayrıştırılmadı. Video sayacının sıfır kayıp bildirmesi fiziksel ekranın hiç takılmadığını kanıtlamaz. CPU/GPU ölçüm sınırları, GC yöntem farkları ve gözlemci ek işi korunur.
- Rapor verisi ve açıklama RAM-only kalır. Yeni alan, otomatik gönderim veya izin yoktur. Üretim koduna test probu, telemetri veya süre ölçme API'si eklenmedi. Commit/push/ZIP/release yapılmadı.
