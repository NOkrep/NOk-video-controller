# Görüntü filtreleri — ölçüm, iyileştirme ve kabul sınırları

## v0.7.7.8 — gerçek oynatıcı kontrol noktası, 3 Kasım 2026

Filtre girdileri artık oynayan videonun `requestVideoFrameCallback` adımında birleştirilir; kare gelmezse 50 ms timer geri dönüşü vardır. Durmuş/hazır olmayan/API desteği bulunmayan videoda mevcut rAF yolu sürer. Callback/timer kimliği, zayıf video/stream referansları, kaynak/epoch/oturum/sahip kontrolü eski hedefe yazımı engeller. Kapanışta zaten kabul edilmiş güncel çizim güvenli hedefe tamamlanır; gönderilmemiş eski oturum rAF komutu hâlâ iptal edilir. Bekleme sonsuz değildir; arka plan/main-thread blokajı gerçek süreyi uzatabilir. Filtre sırası, değerleri, geri yükleme ve mevcut site stiline saygı korunur. Çerçeve başı stil yazımı 200 ms hedef seçimi önbelleğinin zamanını yeniden başlatmaz.

Kaynak regresyonları (başarısız→başarılı): bir video karesinde son değer, 50 ms fallback, durmuş/API'siz medya, reset, eski callback, kaynak/srcObject/epoch/oturum/sahip değişimi ve sürekli sürüklemede 200 ms hedef yenilemesi. Yeni zamanlayıcının geliştirilmesi sırasında yakalanan önbellek süresi ve toplanmış eski stream eşleşmesi hataları düzeltildi; önceki sürümde var oldukları iddia edilmez. 214 Node testi ve kaynak/sürüm/izin denetimi geçti. İki motorda gerçek kurulu eklentiyle ayrı kökenli iframe filtre/kapanış/reset/durmuş medya ve mevcut HUD durum regresyonları doğrulandı. 20 tema, EN/TR ve dar pencere kontrolü de aday geliştirmesi sırasında geçti. [MDN video frame callback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback).

### Son kaynakla tam ekran kabulü

Geçici görünür Firefox 159 ve Chromium tabanlı Edge 152.0.4191.53, sırayla aynı herkese açık Video.js örneğini oynattı. Çözülen video 1280×720, yaklaşık 24 fps; tam ekran çizim alanı 1408×792 CSS pikseldi. `v0778-completion` sonuçlarının `sourceSha256` değeri son `injected.js` ile eşleşir. İki motorda altışar pencerenin tamamında istenen filtre, kaynak sürekliliği, oynatma ve görünürlük doğrulandı; ağ beklemesi yoktu.

| Durum | Firefox CPU | Firefox 3D | Edge CPU | Edge 3D | Düşen / toplam kare FF; Edge |
|---|---|---|---|---|---|
| Nötr, HUD kapalı | 0.144 | 2.0 | 0.155* | 0.0 | 0/144; 0/143 |
| Üç filtre, HUD kapalı | 0.177 | 23.2 | 0.142* | 4.0 | 0/144; 0/144 |
| Tam zincir, HUD kapalı | 0.291 | 51.8 | 0.212* | 7.2 | 0/144; 0/144 |
| Nötr, HUD açık | 0.132 | 1.2 | 0.202* | 0.0 | 0/144; 0/144 |
| Parlaklık sürükleme | 0.407 | 23.2 | 0.257 | 3.6 | 0/144; 0/145 |
| Nötr duruma dönüş | 0.139 | 1.8 | 0.169* | 0.0 | 0/144; 0/144 |

CPU tek çekirdek eşdeğeridir; 3D sütunu yalnız test süreçlerine ait GPU motor sayaçlarının örnek toplam ortalamasıdır, cihaz yüzdesi değildir. `*` Süreç kümesi değişti: bu CPU örnekleri kesin karşılaştırmaya alınmaz; GPU süreç kapsamı da eksik olabilir. Statik pencerelerde stil mutasyonu sıfır, sürüklemede Firefox 144, Edge 141 idi. Test sürücüsü sayfa rAF'ından bağımsız yaklaşık 43/44 girdi/s üretti; girdi ve medya ölçüm süreleri farklı sınırlara sahiptir.

### Zamanlama karşılaştırması ve değişken CPU

Aynı medya/oturum içinde kare API'si açık ve yalnız seçili öğede API yokluğu taklit edilmiş rAF yolu karşılaştırıldı. Bu, eski tarayıcının bütünü veya eski sürüm binary'si değildir. Normal görünümde (890×501) rAF önce çalıştırılan `v0778-reverse-final` turunda 6 saniyelik video penceresindeki stil mutasyonları Firefox **273 → 148**, Edge **240 → 143** oldu; her iki yolda düşen kare sıfırdı. Firefox sürükleme CPU'su 0.633 → 0.411, 3D toplamı 19.8 → 13.2 idi. Edge'in eski-yol CPU süreç kümesi değiştiğinden CPU kazancı çıkarılmaz; 3D toplamı 2.4 → 1.6 idi.

Ters sıradaki tam ekran `v0778-timing-final` turunda yazımlar Firefox 229 → 132, Edge 238 → 138; sıfır düşen kareydi. Ancak CPU, yeni yolda Firefox 0.419 → 0.448 ve Edge 0.245 → 0.295 oldu; bu karşı örnekler korunur. Sonuç **tekrarlanan gereksiz stil yazımı azalmasıdır; genel CPU kazancı yüzdesi değildir**. Bu iki ara aday son kaynakla byte düzeyinde aynı değildir: sonrasında 200 ms önbellek/harcanmış callback/negatif stream kimliği korumaları tamamlandı. Son kaynak kabulü yukarıdaki ayrı hash eşleşen turdur; ara aday sonuçları son binary'nin bire bir A/B'si diye sunulmaz.

### Eklentisiz CSS kontrolü ve kalan sınırlar

`native-css-reference-2` turunda eklenti hiç kurulmadı; aynı filtre dizgileri doğrudan test tarafından uygulandı. İki motorda dörder geçerli pencere, sıfır düşen kare ve statik durumda sıfır stil yazımı görüldü. Firefox CPU nötr/üç filtre/tam zincir/dönüş: 0.187/0.176/0.235/0.119; 3D toplamları 1.0/25.6/49.0/1.0. Edge CPU 0.152/0.118*/0.091*/0.121*, 3D 0/5.2/7.0/0.2 idi. Önceki bazı eklentili turlardaki geçici ilk-üç-filtre CPU sıçraması bu turda ve son kaynak turunda tekrar edilmedi. Ayrı oturumlar/site etkinliği/decoder başlangıcı ayrıştırılmadığından sıçramanın nedeni belirlenmiş veya yalnız tarayıcıya yüklenmiş sayılmaz. Bu kontrol, eklenti ek yükünün kesin çıkarımı değildir.

- Statik filtre zinciri hâlâ compositor/GPU işi gerektirir; zamanlama iyileştirmesi bunu bedelsiz yapmaz. Renkler, filtre sırası veya özellikler hız uğruna azaltılmadı.
- Bu canlı kabul tek donanımda kısa 720p/~24fps örneğidir. Güncel gerçek 1080p/4K60, HDR, DRM, diğer codec ve siteler için kasmasızlık garantisi yoktur. Önceki yerel 1080p30 ölçümleri aşağıda ayrı tutulur.
- Video API'sinin sıfır düşen kare sayması, fiziksel ekranın tüm kareleri sunduğunu veya kullanıcıya hiç takılma hissi vermediğini kanıtlamaz.
- CPU tarayıcı alt ağacını kapsar: site/SDK/decoder/eklenti birlikte ölçülür. Kısa ve sıralı örnekler genellenebilir kazanç veya enerji verimi değildir; GPU motor toplamları da bütün GPU yüzdesi değildir.
- 50 ms geri dönüş hedef süredir; ana iş parçacığı blokajı/arka plan kısıtlaması bunu uzatabilir. API yokluğu testi tüm eski tarayıcı kabulü değildir.
- Aynı seçili medya tek çalıştırmada RAM'de iki motora taşınır; ayrı çalıştırmaların aynı içerik/kod/akış olduğu varsayılmaz. Sayfa yolu, başlık, medya adresi ve mutlak izleme konumu kanıta alınmaz.

Dar hedefin ölçüm → dinamik yazım darboğazını azaltma → aynı senaryo tekrarları → sınırları belgeleme adımları tamamlandı. Bu, tüm eski site/performans issue'larının kapanışı değildir. Bellek native/cache ayrımı, rapor penceresi performansı, Kick/Puhu ve diğer gerçek site işleri ayrı kalır. Kaynak klasörü güncellendi; commit/push/ZIP/release yapılmadı. Sayısal kanıtlar yalnız Git dışı `tests/artifacts/live-filters-*/` içindedir.

## 3 Kasım 2026 — ilk v0.7.7.7 gerçek oynatıcı ölçümü

Etkin hedef gerçek oynatıcıda Firefox/Chromium filtre kapalı/açık/sürükleme karşılaştırmasıdır. Kaynak v0.7.7.7; bu aşamada üretim filtre davranışı değiştirilmedi. `tests/live-filter-performance.cjs` ayrı geçici görünür profillerde aynı herkese açık örneği sırayla açar; kaynak/başlık/adres/izleme konumu dışa aktarılmaz. Statik pencere öncesi istenen CSS'nin seçili videoya ulaştığı beklenir ve pencere başı/sonu tekrar doğrulanır. Kaynak değişimi, gizli belge, duraklama, hız değişimi ve ağ beklemesi ölçüm geçerliliğini düşürür; gerçek dropped-frame artışı hiçbir zaman dışlama gerekçesi değildir. Süreç kümesi değişen CPU örnekleri kesin CPU karşılaştırmasına alınmaz. CPU/GPU ve sayfa pencerelerinin sınırları farklıdır; aynı sabit aşama her ikisi bitene kadar korunur.

İlk `v0777-baseline` ve `v0777-fullscreen` turları keşif niteliğindedir ve **karşılaştırmadan çıkarılmıştır**: UI girdisinden hemen sonra paneli kapatmak bekleyen filtre güncellemesini iptal edebildiğinden bazı aşama adları gerçek CSS durumunu yansıtmıyordu. Ham sayısal sonuçlar korunur; her klasördeki `VALIDATION.json` bu eksiği kaydeder. İlk turdaki `valid:true` yalnız medya ilerlemesini ifade ediyordu, filtre eşleşmesini kanıtlamaz. Eski pencerelerden kazanç yüzdesi çıkarılmaz. Düzeltilmiş doğrulayıcı için regresyon testi eklendi.

Tek Chromium tam ekran odak profilinde FilmDeck `injected.js` fonksiyonlarında örneklenen self süre sürükleme sırasında yaklaşık 8.14 saniyede 70.6 ms, nötr açıkta 8.17 saniyede 30.6 ms idi. Bu V8 örneklemesidir; tarayıcının bütün native/compositor/decoder süresi değildir ve bu fark tüm CPU maliyetini açıklamaz. Dışa yalnız uygulama fonksiyon adları/satırları ve sayılar çıkar; ham profil/site script adresleri kaydedilmez. Bu profilin sürükleme CPU süreç kümesi değiştiği için süreç CPU değeri kesin karşılaştırmaya alınmaz. Kanıt Git dışı `tests/artifacts/live-filters-v0777-profile/` içindedir. [CDP Profiler](https://chromedevtools.github.io/devtools-protocol/tot/Profiler/).

`v0777-validated` Firefox tekrarlarında istenen tüm statik CSS durumları pencere başı/sonu doğrulandı: gerçek 1280×720 video yaklaşık 890×501 CSS piksel alanda oynadı; 12 pencerenin tamamında ağ beklemesi ve düşen video karesi yoktu. Sürükleme CPU çekirdek eşdeğeri 0.647/0.520, nötr açık 0.350/0.169 idi; statik tam zincir 0.283/0.183. Bu kısa/değişken örneklerden kazanç yüzdesi üretilmez. Statik filtre yazımı sıfırdı; sürüklemede 355/361 stil mutasyonu ölçüldü. Chromium sürükleme pencerelerinde yalnız 9–10 girdi oluştu; bu pencerelerin düşük CPU'su bir iyileşme kanıtı değildir. `VALIDATION.json` bu kısıtı ayrıca kaydeder. Düşük input/rAF hızının nedeni henüz kesinleşmedi; bunun kendisi arayüz planlaması/render sorununa işaret edebilir, kullanıcı veya arka plan sekmesi nedeniyle olduğu varsayılmaz.

İzole test adayı: CSS filtre yazımları `requestVideoFrameCallback` ile bir sonraki video karesine birleştirildi; 50 ms sınır ve destek yoksa açık başarısız deney sınıflaması kullanıldı. Üretim kodu değişmedi. İlk adayda CSS'nin gerçek/istenen değer muhasebesi reset'i bozdu; bu başarısız deney uygulamaya taşınmadı. İkinci test adayında Firefox'ta 6 saniyede 144 stil yazımı / 144 video karesi, sıfır düşen kare ve nötr duruma dönüş görüldü; Chromium input yükü düşük kaldığından motorlar arası aday kabulü yoktur. Kanıt `tests/artifacts/live-filters-v0777-frame-candidate-2/`. Bu yalnız testte video stiline uygulanan bir prototiptir; üretim çözümü, API yokluğu, duraklamış medya ve sahiplik/iptal regresyonları ayrıca gerektirir.

İlk v0.7.7.7 araştırma aşamasında test girdisinin yavaşlayan sayfa rAF'ına bağımlı olmaması için üretici test sürücüsüne taşındı; girdi sayısı/süresi, odak ve yerleşik rAF işareti kaydedildi. O aşamada runtime değişikliği/kabul yoktu. Sonraki v0.7.7.8 uygulaması ve kabulü yukarıdadır; bu tarihsel keşif kayıtlarından kazanç iddiası çıkarılmaz.

22 Ekim 2026. Kaynak v0.7.2 başlangıcı ve v0.7.3 hedef önbelleği karşılaştırması. Bu dosya site uyumluluğu veya tüm donanımlarda performans garantisi değildir.

## Yöntem

Gerçek eklenti geçici Firefox 158.0.1 ve Chromium tabanlı Edge 152.0.4191.53 profillerine kuruldu. Kişisel profil kullanılmadı. Ağ yalnız loopback ve tarayıcının dahili/eklenti kaynaklarına açıktı. Yerel FFmpeg üretimi 1920×1080, 30 fps, VP8/Opus dosya, 1600×900 CSS video alanı; sessiz Opus kanalı, autoplay muted. İşlemci ölçümünde boost/mono açık değildi. İki tarayıcı sırayla çalıştırıldı; aynı anda iki benchmark çalışmadı. Her aşamadan önce 1.5 saniye bekleme, iki tekrar; ölçüm sırasında GC yok.

Tarayıcılar headless çalışır. Edge viewport 1920×1080, Firefox iç viewport 1920×995; video alanı her ikisine de sığar. Görünür masaüstü Firefox/Chromium, gerçek site, tam ekran, DRM veya 60 fps kabulü değildir. WebGL renderer bilgisinden yalnız yazılım backend'i işareti boolean olarak tutulur; ham cihaz modeli dışa aktarılmaz. Bu işaret video compositor'un donanım yolunda olduğunu kanıtlamaz.

- CPU: yalnız test tarayıcısının süreç alt ağacında CPU saniyesi / ölçüm saniyesi; **tek çekirdek eşdeğeri**, tüm bilgisayarın yüzde kullanımı değildir. Çocuk süreç değişen pencereler `processSetStable:false` işaretlidir ve kesin CPU karşılaştırmasına alınmaz.
- GPU: yalnız test süreçlerinin `GPUEngine` sayaçları, motor türü başına toplam; toplam GPU yüzdesi değildir. Firefox'ta bu sayaçlar gözlenmedi; **sıfır GPU kullanımı anlamına gelmez**. Başka uygulamaların sayaçları veya komut satırları rapora alınmaz.
- Kare: 5 saniyelik sayfa penceresinde `getVideoPlaybackQuality()` toplam/düşen kare farkı. Toplam kare, düşen kareleri de içerir ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/getVideoPlaybackQuality)).
- Test kodu video style mutasyonlarını ve `getBoundingClientRect()` çağrılarını sayar. Bu metrikler yalnız filtre fonksiyonundan gelmez; HUD kalite/altyazı durum izlemeleri de dahil olur. Bir sayım zorunlu olarak pahalı bir layout olduğunu göstermez.

CPU/GPU ve sayfa kare pencereleri birlikte başlatılan farklı API işlemleridir. PowerShell süreç keşfi başlangıç gecikmesi ve GPU örneklemesinin süresi yüzünden başlangıç/bitişleri eşit değildir; ayrı gerçek süreler ham sayısal kanıtta tutulur. Kısa iki tekrar ve warm-up farkları CPU kazanç yüzdesi hesaplamaya yetmez.

## v0.7.2: tekrarlanan bulgu

Kapalı = HUD kullanıcı tarafından kapatılmış; statik filtreler uygulanmaya devam ediyor. Üç filtre = parlaklık 115%, kontrast 110%, doygunluk 120%. Tam zincir bunlara gece modu ve ters renk ekler. Sürükleme = diğer filtreler sıfırlanmışken her requestAnimationFrame'de parlaklık girdisi. Kullanıcı girdisi frekansı Firefox'un yük altında düşen animasyon hızına bağlıdır; iki motorda eşit sayıda girdi varsayılmaz.

| Tarayıcı / durum | CPU çekirdek eşdeğeri (iki tekrar) | Düşen / toplam kare (iki tekrar) | Video konumu sorgusu |
|---|---|---|---|
| Edge, nötr kapalı | 0.420 / 0.273 | 0/151 / 0/151 | 2 / 0 |
| Edge, üç filtre kapalı | 0.415* / 0.276 | 0/150 / 0/148 | 0 / 9 |
| Edge, tam zincir kapalı | 0.375 / 0.261 | 0/150 / 0/150 | 0 / 0 |
| Edge, parlaklık sürükleme | 0.359 / 0.346 | 0/149 / 0/149 | 386 / 386 |
| Firefox, nötr kapalı | 1.061 / 0.521 | 0/150 / 0/151 | 2 / 0 |
| Firefox, üç filtre kapalı | 0.476 / 0.548 | 0/151 / 1/151 | 0 / 2 |
| Firefox, tam zincir kapalı | 1.267* / 1.310 | 99/150 / 97/150 | 0 / 0 |
| Firefox, parlaklık sürükleme | 1.277 / 1.254 | 28/152 / 19/151 | 199 / 202 |

`*` Süreç kümesi pencere sırasında değişti; bu CPU toplamı kısmi olabilir.

Edge GPU örneklerinde nötr kapalı durumda VideoProcessing motor toplamı ortalama 3.2 / 4.0, tam zincirde 3D toplamı 7.2 / 9.2, sürüklemede 3D 8.0 / 7.8 görüldü. Bunlar örnek motor sayaçlarıdır; makinenin toplam GPU kullanım yüzdesi olarak okunmamalıdır. Firefox GPU sayacı mevcut gözlemde yoktur.

Statik tam zincirde style yazımı iki motorda da sıfırdı. Firefox'taki yüksek kare kaybı, sürekli JS/CSS yeniden yazım döngüsüyle açıklanamaz. Filtreler sıfırlanınca dönüş pencerelerinde her iki motorda da kare kaybı sıfıra döndü. Görüntü filtresinin render maliyeti ayrıca araştırılmalıdır.

## v0.7.3: uygulanan değişiklik ve tekrar

Filtre güncellemesi artık her sürükleme karesinde oynatıcı/medya keşfini yeniden yapmaz. Hedef yalnız WeakRef ile en fazla 200 ms önbellekte tutulur. Medya keşif önbelleği değiştiğinde, kullanıcı başka hedef seçtiğinde veya video kaldırıldığında hemen yeni seçim yapılır. Periyodik sona erme otomatik hedef seçimini yeniden değerlendirir. Filtre sırası, renk değerleri ve site stilini geri yükleme davranışı değişmedi; kaynak/library sahipliği doğrulamaları atlanmadı.

Firefox tekrarında konum sorgusu 199/202 → **94/93**; sürükleme CSS yazımı 124/126 → 137/150, düşen kare 28/19 → **14/2** oldu. Animasyon hızı ve CPU ölçümleri değişkendir (son CPU 1.470/1.236); kesin CPU kazancı veya bütün render sorununun çözüldüğü sonucu çıkarılmaz. Nötr açık karşılaştırma 67/66 konum sorgusuyla benzer kaldı; azaltılan kısım sürükleme hedef aramasıdır.

Edge tekrarında konum sorgusu 386/386 → **98/88** oldu. Sürüklemede her iki tekrar da **0/151** kare kaybı verdi; CSS yazımı 301/301 kaldı. CPU 0.367*/0.325 çekirdek eşdeğeri; ilk pencerede süreç kümesi değişti. 3D motor sayaç ortalamaları 7.4/7.6; GPU kazancı iddia edilmez. Nötr kapalı ilk pencere 2/150 kare kaybı, ikinci 0/150 verdi; dönüşler 0/151 ve 0/150 oldu. Dolayısıyla tüm koşullarda sıfır kare kaybı iddiası yoktur. Son tekrarların WebGL işareti iki motorda da `rendererReported:true, softwareRenderer:false`; bu yalnız renderer metninde bilinen yazılım adlarının bulunmamasıdır.

v0.7.3 odak tekrarında statik tam zincir değiştirilmedi ve yeniden ölçülmedi; tam zincirin Firefox sonucu açık sorun olarak korunur. 159 Node testi, hedefin kaldırılması/yeniden seçimi, keşif geçersizleşmesi ve zaman aşımı regresyonlarını kapsar.

## Tekrarlama ve kanıt sınırı

```powershell
node tests/prepare-browser-fixtures.cjs --performance-fixture
node tests/filter-performance.cjs --engine=firefox --browser="<firefox.exe>" --label=filter-baseline
node tests/filter-performance.cjs --engine=chromium --browser="<Chromium browser.exe>" --packages="<Playwright node_modules>" --label=filter-baseline
# Yalnız nötr/drag/dönüş odak tekrarı:
node tests/filter-performance.cjs --engine=firefox --browser="<firefox.exe>" --label=filter-focus --focus
```

Yerel sayısal JSON kanıtları Git dışındaki `tests/artifacts/filters-{firefox,chromium}-v072-first/` ve `filters-{firefox,chromium}-v073-target-cache/` içindedir. Kaynak SHA256, sürüm, gerçek kurulum, süreler, sayaçlar ve kare durumları kaydedilir; ham heap, kişisel içerik veya sayfa adresi içermez. Sonraki kabul: Firefox'ta ağır zincirin görünür tarayıcı/compositor koşullarında ayrıştırılması, geçerli GPU ölçümü ve gerçek sitede aynı sonucun sınanması. Bellek hedefinin native/cache sınıflandırması ve Kick/Puhu/site kabulü ayrı açık işlerdir.

## v0.7.4: görünür Firefox kontrolü

Test sürücüsüne `--visible` seçeneği eklendi; üretim filtre kodu, filtre sırası ve değerleri değiştirilmedi. Aynı 1080p30 yerel dosya, 1600×900 CSS video alanı, gerçek kurulu eklenti ve iki tekrar kullanıldı. Firefox 158.0.1 geçici profilinde bütün ölçüm belgeleri `visibilityState: visible`, bütün CPU pencereleri `processSetStable: true` idi. Bu turda Firefox için GPU motor sayaçları da gözlendi; önceki headless koşuldaki eksik GPU sayacından sıfır kullanım sonucu çıkarılmaması gerektiği doğrulandı.

| Görünür Firefox / durum | CPU çekirdek eşdeğeri | Düşen / toplam kare | 3D motor toplamı örnek ortalaması |
|---|---|---|---|
| Nötr kapalı | 0.325 / 0.214 | 0/151 / 0/150 | 1.00 / 1.50 |
| Üç filtre kapalı | 0.322 / 0.275 | 1/151 / 0/150 | 55.75 / 56.25 |
| Tam zincir kapalı | 0.590 / 0.379 | 0/150 / 0/150 | 76.75 / 78.00 |
| Parlaklık sürükleme | 0.341 / 0.390 | 0/150 / 1/151 | 1.75 / 37.00 |
| Nötr dönüş | 0.180 / 0.271 | 0/150 / 0/150 | 1.50 / 1.25 |

GPU sütunu tüm GPU'nun yüzdesi değildir; yalnız test süreçlerine ait 3D motor sayaçlarının örnek toplam ortalamasıdır. Nötr kapalıda VideoProcessing toplam ortalaması 4.50/4.25; üç filtre ve tam zincirde 0 oldu. Filtreli çizim farklı GPU motor iş yükü gösterdi ve bedelsiz değildir. Parlaklık sürüklemenin iki tekrarındaki GPU dağılımı da değişti; bu sayılar sabit maliyet veya kesin kazanç yüzdesi olarak kullanılmaz.

Önceki headless tam zincirde 99/150 ve 97/150 kare kaybı, görünür turda 0/150 ve 0/150 oldu. Aynı üretim koduyla bu koşul farkı önemlidir; headless sonucu bütün Firefox kullanımlarına genellenmez. Görünür turda statik filtre style yazımı yine sıfır; sürükleme konum sorguları 77/98, CSS yazımları 254/301 idi. Üç filtre, nötr açık veya sürükleme penceresinde tekil kare kayıpları görüldüğünden her koşulda sıfır kayıp iddiası yoktur.

Bu deney kullanıcının gerçek sitede gördüğü kasmayı geçersiz kılmaz. Bir makinede kısa 1080p30 örneği; 60 fps, farklı çözünürlük, codec, site scriptleri, DRM ve diğer GPU/compositor koşulları için garanti değildir. WebGL renderer işareti yine video compositor'un tam donanım yolunu kanıtlamaz. Filtre rengi veya işlevi performans adına sessizce değiştirilmedi. Kanıt Git dışında `tests/artifacts/filters-firefox-v074-visible/`; kaynak sürümü v0.7.4 ve SHA256 kayıtlıdır.

```powershell
node tests/filter-performance.cjs --engine=firefox --browser="<firefox.exe>" --label=visible --visible
node tests/filter-performance.cjs --engine=chromium --browser="<Chromium browser.exe>" --packages="<Playwright node_modules>" --label=visible --visible
```

### Görünür Chromium karşılaştırması

Edge 152.0.4191.53 aynı yöntemle ayrı geçici görünür profilde tamamlandı. Bütün örneklerde belge görünür, GPU motor sayaçları gözlenebilir ve oynatma 1920×1080 idi. Firefox ve Edge aynı anda benchmark çalıştırmadı.

| Görünür Edge / durum | CPU çekirdek eşdeğeri | Düşen / toplam kare | 3D motor toplamı örnek ortalaması |
|---|---|---|---|
| Nötr kapalı | 0.299 / 0.264 | 0/150 / 0/151 | 0.00 / 0.00 |
| Üç filtre kapalı | 0.282* / 0.267 | 0/151 / 0/148 | 2.00 / 7.00 |
| Tam zincir kapalı | 0.240 / 0.278 | 0/149 / 0/150 | 7.25 / 6.80 |
| Parlaklık sürükleme | 0.374 / 0.455 | 0/149 / 0/151 | 8.00 / 8.25 |
| Nötr dönüş | 0.280 / 0.287 | 0/150 / 0/151 | 0.00 / 0.00 |

`*` İlk üç filtre CPU penceresinde süreç kümesi değişti; kesin CPU karşılaştırmasına alınmaz. İlk nötr açık örneği de aynı işareti taşır. Nötr kapalıda VideoProcessing motor toplamı ortalaması 5.20/5.20, tam zincirde 0 oldu. Üç filtre ikinci penceresinde bir video style mutasyonu görüldü; tam zincirde iki tekrar da sıfırdı. Sürekli statik filtre yazımı görülmedi. Sürükleme konum sorgusu 105/97; CSS yazımı 301/301.

Bu kısa görünür Edge turunun bütün pencereleri sıfır kare kaybı verdi; başka site/donanım/60 fps için garanti değildir. Firefox ve Edge GPU motor toplamlarının farkı tarayıcıların aynı GPU işi yaptığı veya tüm GPU verimlerinin doğrudan bu oranlarda farklı olduğu anlamına gelmez. Sabit üretim v0.7.4 ile görünür/headless koşullar ayrıştırılmış, v0.7.3'teki gereksiz hedef aramasını azaltma değişikliği korunmuştur. Kalan sınır gerçek site, yüksek kare hızı ve farklı donanım kabulüdür. Sayısal kanıt `tests/artifacts/filters-chromium-v074-visible/` içinde Git dışındadır.
