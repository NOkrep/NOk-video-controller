# Bellek ölçümleri

22 Ekim 2026 · v0.7.1 kaynak çalışması. İlk Firefox turu ve Chromium tabanlı Edge turu. Bunlar kısa, yerel laboratuvar ölçümleridir; gerçek siteler için performans garantisi değildir.

## Yöntem ve kapsam

- Her tarayıcı kişisel profillerden bağımsız, yeni geçici test profiliyle başlatılır. Yalnız testin oluşturduğu browser PID'si ve alt süreçleri ölçülür; profil içerikleri, geçmiş, komut satırları veya ham heap dump toplanmaz.
- Eklentisiz ve eklentili aynı yerel 1080p/10fps canvas-video sahnesi, iç içe iki farklı kökenli iframe içinde kullanılır. Firefox turunda kontrol testleri sırasında kaynak 720p'ye geçer; bellekte altyazı da yüklenir. Edge turu 1080p kalır. Bu fark ve tarayıcı sürümü nedeniyle tablolar motorlar arasında doğrudan karşılaştırma için kullanılamaz.
- Gerçek geçici Firefox eklentisi BiDi ile, gerçek unpacked Edge eklentisi CDP `Extensions.loadUnpacked` ile kurulur. Edge bellek sonucu önceki page-script/mock entegrasyon testi değildir. Otomasyona ait geçici profile yönelik debugging seçeneği kullanılır; kişisel browser ayarı/eklenti politikası değiştirilmez. Referans: [resmî CDP Extensions](https://chromedevtools.github.io/devtools-protocol/tot/Extensions/).
- Native stereo ses 45/55% dahil, 30 kapat/aç ve son kapatmadan sonra 5 saniye bekleme. Her açılışta yeni kaynak oturumunun hazır olduğu doğrulanır. Firefox ayrıca kontrol, altyazı, filtre kuyruğu ve fullscreen testlerinden geçer. Kapatma, sayfa belleğindeki kullanıcı ayarlarını veya yeniden kullanılabilir HUD DOM'unu silmek anlamına gelmez.
- `PrivateMemorySize64` ve Working Set **tarayıcı + video + extension dahil** toplamdır. Extension kurulunca yeni süreçler/JIT/decoder cache oluşabilir. Bir anlık fark, eklentinin tek başına RAM tüketimi veya optimizasyon kazancı değildir. Toplam süreç sayısı değişebilir.
- Edge'de `Runtime.getHeapUsage` / `Memory.getDOMCounters` da kaydedilir; aynı renderer'ı paylaşan iframe'ler iki kez sayılmaz. Heap, host sayfa ve extension Main World kodunu birlikte içerir; extension service worker için ayrı heap değildir. Zorlanmış GC yapılmaz.

## Firefox 158.0.1 — ilk tur

| Aşama | Toplam private MiB | Süreç |
| --- | ---: | ---: |
| Aynı video, eklentisiz | 722.67 | 12 |
| Eklenti kurulu, HUD hiç açılmamış | 617.15 | 12 |
| Kontrollerden sonra açık | 685.40 | 12 |
| 10 kapat/aç | 696.00 | 12 |
| 20 kapat/aç | 768.43 | 12 |
| 30 kapat/aç | 724.60 | 12 |
| Son kapatma + 5 s | 669.62 | 12 |

Örnekler dalgalanıyor; kapat/aç sayısıyla tek yönlü süreç belleği büyümesi görülmedi. Eklentisiz noktanın daha yüksek olması, eklentinin bellek azalttığını kanıtlamaz. Native JS heap/tutulmuş nesne analizi bu Firefox turunda yapılmadı.

### Son kaynakta Firefox tekrar turu

Referans temizliği sonrasında v0.7.1 kaynağıyla aynı test yeniden çalıştırıldı; geç keşif, iframe değiştirme ve ses dolgusu kontrolleri de geçti. Bu turda gerçek HLS/Video.js ek turu çalıştırılmadı; önceki doğrulama korunur.

| Aşama | Toplam private MiB |
| --- | ---: |
| Aynı video, eklentisiz | 747.70 |
| Eklenti kurulu, HUD hiç açılmamış | 651.00 |
| Kontrollerden sonra açık | 681.64 |
| 10 / 20 / 30 kapat-aç | 707.40 / 801.25 / 756.39 |
| Son kapatma + 5 s | 715.60 |

İkinci turda son değer açık kontrol noktasından yaklaşık **34 MiB yüksek** kaldı; ilk turdaki düşüş tekrarlanmadı. Bu fark görmezden gelinmez. GC/decoder/cache ve gerçek tutulmuş nesneler ayrıştırılmadan Firefox belleği “sorunsuz/sızıntısız” olarak kapatılamaz. Daha uzun ve heap odaklı ölçüm etkin kapsamda kalır.

## Edge 152.0.4191.53 — kurulu eklenti

| Aşama | Toplam private MiB | Sayfa JS heap MiB | DOM düğümü | JS dinleyici |
| --- | ---: | ---: | ---: | ---: |
| Aynı video, eklentisiz | 378.73 | 1.903 | 173 | 17 |
| Eklenti kurulu, HUD hiç açılmamış | 455.32 | 3.587 | 173 | 78 |
| HUD açık | 487.53 | 5.654 | 1113 | 208 |
| 10 kapat/aç | 468.81 | 5.953 | 1038 | 208 |
| 20 kapat/aç | 468.53 | 6.017 | 1038 | 208 |
| 30 kapat/aç | 455.48 | 6.075 | 1038 | 208 |
| Son kapatma + 5 s | 453.97 | 6.150 | 1038 | 208 |

30 aç/kapatta DOM/dinleyici birikmesi gözlenmedi. Sayfanın heap'i açık duruma göre yaklaşık 0.50 MiB arttı; yeni tahsis ve GC zamanlaması ayrıştırılmadığından bu artış “sızıntı” ya da “sızıntısız” diye sınıflandırılmadı. Süreç RAM'i daha sonra düşerken V8 heap'i aynı yönde hareket etmek zorunda değildir.

## Kaynak incelemesiyle kapatılan tutulma yolları

DOM'dan kaldırılmış medya için seçim cache'i, açık hedef seçimi, son filtre hedefi, kalite context'i/seçenek closure'ları ve ayrılmış React callback sahipleri temizlenir. Sonlandırılmış kalite isteği, kapalı HUD'da her timeupdate için tarama gerekçesi olmaz. WeakMap kullanımı tek başına diğer güçlü referansları ortadan kaldırmaz; bu yüzden DOM'da tutulan seçenekler de kontrol edilir. Node regresyonları bu referans temizliğini ve eski oturum komutlarının reddini sınar; bu testler native heap sızıntısızlık kanıtı değildir.

## Kalan ölçüm

Uzun video oynatma, yoğun SPA/video değiştirme, sesli gerçek dosyada boost/mono, filtreli 1080p/4K için CPU/GPU/kare kaybı ve kontrollü GC sonrası tutulmuş heap karşılaştırması ayrı senaryolardır. Headless canvas testi gerçek cihaz GPU performansını temsil etmez. Şu an ek bir kullanıcı eklentisi kurmak gerekmiyor; var olan Firefox/BiDi ve Chromium/CDP araçları ilk tur için yeterli oldu.

## Tekrar çalıştırma

Node.js, PowerShell 7 ve zaten kurulu browser/Playwright kullanılır; scriptler dependency/browser indirmez. Windows sandbox browser başlatmayı engellerse yalnız test komutu için uygulama onayı gerekir. Örnekler:

```powershell
node tests/firefox-integration.cjs --browser="C:/Program Files/Mozilla Firefox/firefox.exe" --memory
node tests/chromium-memory.cjs --packages="<Playwright node_modules>" --browser="<Chromium tabanlı browser.exe>"
```

Ham sayısal sonuçlar `tests/artifacts/firefox-browser/result.json` ve `tests/artifacts/chromium-memory/result.json` içindedir; artifacts Git'e dahil edilmez ve sonraki turda yenilenebilir. İlk tur tablosu bu belgede sabit tutulur. Güncel test sürümü ve kapsamı DEVELOPMENT_STATUS.md / ACTIVE_WORK.md ile birlikte değerlendirilir.

## v0.7.2 — sesli dosya, nesne ömrü ve zorlanmış toplama

Önceki canvas testi sabit boyutta değildi: kalite kontrolü sırasında 1080p→720p geçiyor, altyazı/HUD/frame kontrolleri yapılıyor ve yalnız OS süreç toplamı ölçülüyordu. Bu yüzden 34 MiB'ı doğrudan eklenti heap'i olarak yorumlamak uygun değildi. Yeni turda aynı 1280×720/30fps yerel WebM dosyası ve gerçek Opus ses kanalı kullanıldı. Ses kanalı dijital sessizlik içerir; mikrofon/kullanıcı dosyası kullanılmaz. Bu test ses düğümü/routing/binding ömrünü sınar; duyulabilir ses kalitesi testi değildir.

Üretim koduna ölçüm API'si/rapor alanı eklenmedi. Test sayfasında video/context/source için WeakRef, sayısal bağlantı ve listener sayaçları var. Heap dump alınmadı. Chromium'da CDP GC iki tur, arada finalizer için event-loop dönüşüyle çalıştırıldı. Firefox'ta yalnız yeni test profiline `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1` verilerek about:memory Minimize Memory Usage kullanıldı ve tamamlanma bildirimi beklendi. Bu işlem GC/CC yanında cache baskısı da uygular; iki motorun mutlak private RAM değerleri karşılaştırılmaz. Referanslar: [Mozilla about:memory](https://firefox-source-docs.mozilla.org/performance/memory/about_colon_memory.html), [Remote Agent sistem erişimi](https://firefox-source-docs.mozilla.org/remote/Security.html), [CDP HeapProfiler](https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/).

### Bulgu ve düzeltme

Chromium 152'de eski ortak AudioContext çalışırken, 20 video değişiminden sonra 20 kaldırılmış video ve toplam 21 kaynak canlı kaldı. Yalnız source.disconnect yeterli olmadı: bağlantılar temizlense de videolar/context tutulması devam etti. Laboratuvarda bağlamı suspend etmek eski videoları serbest bıraktı. Bağlamı her video kaldırıldığında kapatmak ise yeniden eklenen aynı öğenin geri dönülmez MediaElementAudioSource binding'ini bozardı.

Düzeltme: her isteğe bağlı binding kendi video AudioContext'ine sahiptir. Kaldırmada bağlantı hemen kesilir ve bağlam suspend edilir; başka oynatıcının sesi durmaz. Video uygulama tarafından hâlâ tutuluyorsa binding/context tekrar kullanılabilir. Video erişilemez olduktan sonra FinalizationRegistry bağlamı kapatır; eski context ve DSP düğümleri de toplanabilir. Aynı videoda tekrar gain/mono kullanımı tek context/source kullanır; mono düğümleri gerektiğinde yaratılır. Finalizer anlık temizliğin yerine kullanılmaz ve üretimde zorlanmış GC çalıştırılmaz.

| Ölçüm: 20 video değişimi + kapatma/toplama | Chromium önce | Chromium sonra | Firefox sonra |
| --- | ---: | ---: | ---: |
| Canlı video | 21 | 1 | 1 |
| Kaldırılmış ama canlı video | 20 | 0 | 0 |
| Canlı audio source | 21 | 1 | 1 |
| Canlı AudioContext | 1 (21 kaynak sahibi) | 1 (yalnız güncel video) | 1 |
| CDP JS dinleyici | 176 | 131 | ölçülmedi |
| CDP DOM düğümü | 3943 | 982 | ölçülmedi |

Chromium'da aynı dosyada 30 native aç/kapat private RAM'i 394.43→381.89 MiB, Firefox'ta 525.84→526.85 MiB oldu. Firefox'un bütün boost/mono/değişim turu sonunda 527.09 MiB kaldı; aynı turdaki açık kontrol noktasından yaklaşık +1.25 MiB. Önceki 34 MiB bu sabit dosya + toplama senaryosunda tekrar edilmedi. **34 MiB'ın tekil native tahsis nedeni geriye dönük kanıtlanmış değildir.** Yeni nesne tutulması bulgusu önceki native-only ölçümün nedeni olarak sunulmaz.

Chromium süreç toplamı düzeltmeden sonra da boost başlangıcı 386.57→tur sonu 434.42 MiB oldu; buna rağmen eski video/source/context toplanmıştı. Bu kalan native/decoder/cache farkı ayrıca sınıflandırılmalıdır. Nesne temizliği kanıtı, tüm süreç RAM artışının çözüldüğü anlamına gelmez; toplam bellek incelemesi bu yüzden bütünüyle kapatılmadı.

Tam tur ham sayısal kanıtları Git dışındaki `tests/artifacts/resource-{chromium,firefox}-before-routing-fix/` ve `resource-{chromium,firefox}-finalized-context-fix/` klasörlerinde. Son v0.7.2 hızlı hedef/reinsert regresyonları `resource-{chromium,firefox}-v072-final/` içindedir. Sonraki çalıştırmalar kaynak SHA256'sını da kaydeder. Aynı öğeyi söküp yeniden ekleme, kaynak/context sayısının artmaması ve yeniden running olması ile doğrulanır; bütün ölçümler yalnız sentetik test oturumlarına aittir.

```powershell
node tests/prepare-browser-fixtures.cjs --audio-fixture
node tests/resource-investigation.cjs --engine=firefox --browser="<firefox.exe>" --label=memory-check --assert-clean
node tests/resource-investigation.cjs --engine=chromium --browser="<Chromium browser.exe>" --packages="<Playwright node_modules>" --label=memory-check --assert-clean
```
