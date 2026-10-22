# Görüntü filtreleri — ölçüm ve açık performans işi

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
