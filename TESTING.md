# FilmDeck geliştirme kontrolleri

GitHub akışı [quality.yml](.github/workflows/quality.yml) içindedir. Dosya GitHub'a yüklendiğinde push, pull request ve elle çalıştırmada devreye girer. Tag push'ları da kapsanır. Bu akış commit, tag, ZIP, release veya mağaza yayını oluşturmaz.

## Otomatik kontroller

- **Kaynak / Ubuntu ve Windows:** JavaScript sözdizimi ve Node regresyon testleri. Manifest, motor, README, npm paket ve kilit dosyası sürümleri eşleşmelidir. Sürüm Git tabanına göre geriye gidemez; aynı sürümde çalışma yapılabilir. `v...` tag'i manifest ile eşleşmelidir.
- **Eklenti sözleşmesi:** izinler yalnız `activeTab` / `scripting`; host izinleri boş; Firefox kimliği sabit; EN/TR açıklamaları, manifestteki çalışma dosyaları ve 16/32/48/128 PNG boyutları geçerli olmalıdır. Bilinen özel notlar, ölçüm çıktıları, `.env`, `.pem` ve `.key` dosyaları Git'e eklenirse kontrol başarısız olur. Bu belirli yol kontrolleri tam bir gizli bilgi tarayıcısı değildir.
- **Tarayıcı / Windows:** geçici profile gerçekten yüklenen eklenti Firefox ve Chromium tabanlı Edge üzerinde denenir. Yerel canvas videosuyla kullanıcı açmadan HUD görünmemesi, 20 temada görünür logo IMG boyutları ve açık/koyu filtresi, About FilmDeck altında NOk yerleşimi, EN/TR geçişi, ses, klavye sekmeleri, küçültme/oynatma, dar pencere ve bozuk logo yedeği sınanır. Video hız/kalite, DRM, gerçek siteler, bellek ve GPU kabulü bu kısa teste dahil değildir.

Akış salt okunur depo yetkisi kullanır; action sürümleri tam commit SHA ile, Playwright kilit dosyasıyla sabitlenir. Bağımlılık lifecycle script'leri çalıştırılmaz. Test çıktıları GitHub artifact'i olarak yüklenmez. Üretim eklentisine npm bağımlılığı veya telemetri eklenmedi.

## Yerelde çalıştırma

Node 24 önerilir (en az Node 22). Kaynak ve regresyon kontrolleri bağımlılık kurulmadan çalışır:

```powershell
npm run check
```

Tarayıcı testleri için geliştirme bağımlılıklarını kur:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run test:browser -- --engine=firefox --narrow=true
npm run test:browser -- --engine=chromium --narrow=true
node tests/hud-state-browser.cjs --engine=firefox
node tests/hud-state-browser.cjs --engine=chromium
node tests/pip-browser.cjs --engine=firefox
node tests/pip-browser.cjs --engine=chromium
node tests/startup-browser.cjs --engine=firefox
node tests/startup-browser.cjs --engine=chromium
node tests/quality-mapping-browser.cjs --engine=firefox
node tests/quality-mapping-browser.cjs --engine=chromium
node tests/hls-early-attach-browser.cjs --engine=firefox
node tests/hls-early-attach-browser.cjs --engine=chromium
node tests/ad-lifecycle-browser.cjs --engine=firefox
node tests/ad-lifecycle-browser.cjs --engine=chromium
```

İkinci tarayıcı senaryosu ayrı yerel kökenlerde iframe medyası kullanır: Mono/Stereo seçili düğmeleri ve `aria-pressed`, küçültülmüş panelle tam ekrana giriş, orada genişletip normal görünüme dönüş ve aynı anda tek görünür HUD. İki motorlu CI matrisinde çalışır. Gerçek site PiP, ses içeriği doğruluğu veya kalite geçişi kabulü değildir.

`pip-browser.cjs` gerçek native PiP çağrıları kullanır. Test sorgularının verdiği geçici etkileşim yetkisi dolduktan sonra üst panelden isteği gönderir; gerekirse kaynak çerçevedeki gerçek onay tıklamasını, açma/kapama durumunun üst HUD'a yansımasını ve tam ekrandan doğrudan açılışı sınar. Native API bulunmazsa bunu `unsupported-handled` olarak bildirir; PiP açıldı demez. Firefox'ta native PiP kapanınca test sekmesi standart WebDriver `browsingContext.activate` ile yeniden odaklanır. Önceki odaksız tam ekran zaman aşımı uygulama hatası olarak sayılmaz. `--screenshots=true` yalnız Chromium'da sentetik onay görüntüsünü Git dışı `tests/artifacts/pip-browser/` altına yazar.

`startup-browser.cjs` gerçek eklenti araç çubuğu eylemini `script-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'` yerel sayfasında sınar: sessiz otomatik başlangıç, panel/logo/SVG/data-* kontrolleri, teşhis penceresi ve aç/kapat/yeniden aç. Chromium'da DOM motor dosyası istekleri testte ayrıca engellenerek native MAIN yolunun sıfırdan başlaması zorlanır. Firefox'ta DOM motoru önceden hazır olabilir; test doğrudan araç çubuğu eylemini ve Trusted Types uyumunu doğrular. Firefox test sürücüsü yalnız ayrı oluşturduğu profil için `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1` kullanıp kendi FilmDeck araç çubuğu düğmesini tarayıcı arayüzünde tıklar; kişisel profil ve dosyalar okunmaz. Chromium `Extensions.triggerAction` test API'sini kullanır. Bu yetki/yardımcılar üretim eklentisinde yoktur.

Güvenli UI çizimi destekleyen tarayıcıda `Element.setHTML(..., { sanitizer: {} })` kullanır; yerleşik XSS temizliği korunurken uygulamanın form/SVG/data-* öğeleri kalır. Yeni Trusted Types politikası yaratılmaz. API olmayan eski tarayıcılar önceki HTML yolunu korur; bu tarayıcılarda Trusted Types zorunlu sayfa kabulü yapılmış sayılmaz. [MDN setHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML).

İframe medya değiştirme senaryosu, eski video yerine yeni öğenin kontrol edildiğini ve HUD'un açık kaldığını da sınar. Kalite/aday listesi revizyonu yalnız indeks kullanan kalite ve hedef seçimini sınırlar; temel kontroller güncel medya sahibine bağlıdır. Video/SDK/kaynak/srcObject/medya epoch değişiminde sahip değişir; eski komut reddedilir. Sahip karşılaştırması nesneleri güçlü referanslarla tutmaz.

Varsayılan Windows yolları kurulu Firefox ve Edge içindir. Farklı bir Chromium kurulumu `--browser="C:/.../chrome.exe"` ile verilebilir. Özel test profilleri kişisel profile dokunmaz; test sayfası yalnız localhost kullanır ve yardımcı sürücü sayfa ağını yerel/eklenti kaynaklarıyla sınırlar. Chromium için `--screenshots=true` yerel sentetik ekran görüntülerini Git dışındaki `tests/artifacts/ui-smoke/` klasörüne yazar.

`quality-mapping-browser.cjs`, depodaki küçük sentetik HLS'i (`tests/fixtures/hls`, üretim: `prepare-browser-fixtures.cjs --committed-hls`) ve gerçek Video.js çalışma dosyasını kullanır. Testin kendisi dosya indirmez; Video.js'i `prepare-browser-fixtures.cjs --runtimes-only --download-runtimes` SHA-256 eşleşmesiyle indirir. CI'da zorunlu olmayan `Browser media` işindedir, çünkü sunucunun H.264 desteğine bağlıdır. Farklı çözünürlüklere bağlı normal akışta gerçek 480p görüntüyü; üç etiketin aynı 720p oynatma listesine bağlandığı akışta uyarıyı, başarısız görüntü doğrulamasını ve raporda yalnız `playlistMapping` kategorisinin aktarılmasını sınar. Ortak kaynak senaryosu ayrı kökenli iframe/üst HUD ile de çalışır. `distinct-playlists` yalnız farklı adres eşleşmesidir, farklı görüntü içeriklerinin kanıtı değildir. Eksik veya erişilemeyen envanter `unknown` kalır. Kaynaklar yalnız RAM içinde karşılaştırılır; yeni ağ isteği yapılmaz, seçenekler kaldırılmaz ve otomatik tampon sıfırlama eklenmez.

`hls-early-attach-browser.cjs`, gerçek Hls.js'i kapalı kapsamda ve betik yüklenir yüklenmez bağlar; üst sayfada ve ayrı kökenli iframe'de oynatıcının bağlanma anında bulunduğunu, panelin `HlsJsAdapter` ve 3 seviye gösterdiğini sınar. `libraryHtml` motoru beklediği için diğer testler bu yarışı göstermez. Motorun bağlanmadan önce hazır olup olmadığı çıktıda yazar; bu sonuç sabit değildir.

`ad-lifecycle-browser.cjs`, gerçek Video.js/VHS oynatmada oynatıcının kendi `vjs-ad-playing` işaretiyle reklam döngüsünü üst sayfada ve ayrı kökenli iframe'de sınar: ilk basıştan önce denetim olmaması ve ağ kancasının yerinde olması, basışla reklam sırasında açılan panel, 16x ve sessize alma, en düşük seviye, bitişte 1x, önceki ses ve kalite, panelin gerçek değerleri göstermesi, küçültülmüş ve kapalı panelde denetimin sürmesi, iframe yenilense de sürmesi. Sentetik işaret kullanır; gerçek reklam kabulü `youtube-ad-acceptance.cjs` ile yapılır. O test basmadan bekler, bir kez basıp paneli kapatır ve aynı belgede sonraki videolara geçer; bir turda reklam görmezse `no-ad-seen` yazar, bu geçti sayılmaz.

`frame-loss-browser.cjs`, kare kaybı bildirimini üst sayfada ve ayrı kökenli iframe'de sınar: kapalı panelde sayaç okunmaması, %5 kayıpta sorulmaması, sürekli kayıpta sorulması, sormanın tek başına bir şey değiştirmemesi, "Hayır" sonrası tekrar sorulmaması, "Evet" ile ayarın açılması ve filtrenin medyanın çerçevesinde sıfırlanması, açık sorunun panel diliyle değişmesi. Kayıp tam olsun diye sayaçlar sayfada değiştirilir. Gerçek sayaçlarla ağır yük denemesi ANIMATION_PERFORMANCE.md içindedir.

`tooltip-browser.cjs`, panel tooltip'ini gerçek fare ve klavyeyle sınar: gecikme, ekranda kalma ve paneli kaydırma alanından taşma, yan öğeye hemen geçiş, imlecin metne gidebilmesi, Esc'in yalnız tooltip'i kapatması, Tab ile ulaşma, açık metnin dil ayarını izlemesi, azaltılmış hareket, gömülü oynatıcının durumunu üst panelde açıklama. Dokunmatik kısmı sentetik `PointerEvent` kullanır; gerçek telefon kabulü değildir. Ekran okuyucu kabulü de değildir, yalnız `aria-describedby` bağlantısı sınanır. Kalite düğmesi ve durum satırı açıklamaları gerçek Video.js ile `quality-mapping-browser.cjs` içinde sınanır.

`subtitle-browser.cjs`, Altyazı sekmesindeki açıklamayı üst sayfada ve ayrı kökenli iframe'de sınar: boş aralık ve sıradaki satır, dil, duran ve duraklatılmış video ayrımı, gizli, dosya sonu, satır görünürken sessizlik, satır metninin açıklamaya girmemesi. Panel kapalıyken video öğesi değişince altyazının yeni videoyu izlemesini ve video kalkınca satırın kalmamasını da sınar. Sentetik akış ve dosya kullanır; gerçek site görsel kontrolü değildir.

Panel "hareket azaltma" ayarını başlangıçta işletim sisteminden alır ve CI'daki Windows Server'da Firefox bunu açık görebilir. Bu yüzden animasyon sınayan testler önce ayarı kapatır. `--os-reduced-motion=true` Firefox test profilinde aynı durumu yerelde kurar.

## Animasyon ve reklam denetimi ölçümü (D-08)

`node tests/animation-performance.cjs --engine=both --label=<etiket>` görünür iki tarayıcıda 1080p sentetik videoyla sırayla çalışır: basmadan, basıp panel kapalı, panel açık, üç filtre, rapor boşta, rapor animasyonları sürekli çalışırken, anahtarlar mevcut hâliyle, kaynaktaki yavaş geçiş ve parıltıyla, sürekli parıltıyla, azaltılmış hareketle. Geniş adaylar yalnız testte eklenen stille uygulanır. Reklam denetimi süresi yalnız Git dışı test kopyasında ölçülür. `--url-file=<dosya>` gerçek sayfada yalnız o süreyi ve düğüm sayısını yazar; adres, başlık ve sayfa metni yazılmaz. Sayılar Git dışı `tests/artifacts/animation-<etiket>/` altındadır. CPU/GPU okuması PowerShell betiği çalıştırabilen bir kabuk ister. Kanıt ve sınırlar ANIMATION_PERFORMANCE.md içindedir.

## CI'da olan ve yerelde kalan testler (D-10)

| Yer | Testler | Neden |
|---|---|---|
| Zorunlu CI (`Browser smoke`) | `ui-smoke`, `hud-state`, `hud-continuity`, `dialog-keyboard`, `cdn-measure`, `volume-mirror`, `pip`, `startup`, `report`, `frame-loss`, `tooltip`, `subtitle` | Üretilmiş dosya istemez, kısa sürer |
| Zorunlu olmayan CI (`Browser media`) | `quality-mapping`, `hls-early-attach`, `ad-lifecycle` | Sunucunun H.264 desteğine ve sabitlenmiş Video.js/Hls.js indirmesine bağlı |
| Yerel: ölçüm | `filter-performance`, `report-performance`, `animation-performance`, `memory-soak`, `chromium-memory`, `native-media-retention`, `resource-investigation`, `av-sync-browser` | Süre, bellek ve GPU ölçer veya uzun sürer; paylaşımlı CI makinesinde sonuç anlamlı değildir |
| Yerel: gerçek site | `kick-site-acceptance`, `youtube-ad-acceptance`, `live-filter-performance`, `live-player-*`, `videojs-site-acceptance`, `puhu-retry-acceptance` | Dış siteye bağlıdır, hesap ve bot koruması değişkendir |
| Yerel: geniş fixture | `browser-integration`, `firefox-integration` | Üretilmiş medya ve özel tarayıcı yolları ister; ana davranışları CI'daki testler kapsar |
| Kenarda, çalıştırılmadı | `av-live-probe`, `prepare-av-live-copy`, `av-live-copy-check` | Reddedilen I-07 planının taslakları (PROJECT_HANDOFF.md §8) |

## Gerçek oynatıcı filtre performansı

`node tests/live-filter-performance.cjs --url="<public HTTPS page>" --engine=both --label=filter-run` Firefox ve Chromium'u sırayla, geçici görünür profillerde çalıştırır. Hesap kullanılmaz; içerik başlığı, medya adresi ve mutlak izleme konumu raporlanmaz. `--discover` yalnız ana sayfadan herkese açık bir örnek seçmek içindir; hedef adres yalnız süreç RAM'inde iki motor arasında korunur. Varsayılan iki tekrarda nötr/üç filtre/tam zincir/nötr açık/sürükleme/nötr dönüş ölçülür. `--focus` yalnız nötr/sürükleme/dönüşü, `--fullscreen` seçili Video.js kökünün standart fullscreen durumunu sınar. `--profile` Chromium'da yalnız FilmDeck fonksiyon self sürelerinin sayısal özetini ekler; ham CPU profili veya script adresleri dışa çıkmaz. `--compare-timing`, aynı seçili medya üzerinde kare API'si açıkken ve yalnız testte o öğede API yokluğu taklit edilerek rAF geri dönüşünde karşılaştırır; özgün özellik geri yüklenir. `--legacy-first` sıra etkisini kontrol etmek için modları ters sıraya alır. Bu, tüm eski tarayıcıların emülasyonu değildir. Ölçüm pencereleri boyunca başka benchmark başlatılmamalıdır.

Statik filtre gerçek videoya ulaşmadan panel kapatılmaz. Pencere başı/sonu filtre, kaynak/hız/görünürlük/ağ durumu ve girdi yükü kontrol edilir. Düşen kareler kötü performans kanıtıdır; asla sırf yüksek olduğu için dışlanmaz. Sayfa rAF hızından bağımsız test girdisi kullanılır; düşük girdi yükü ve değişen CPU süreç kümesi karşılaştırma sınırıdır. Sonuçlar yalnız Git dışı `tests/artifacts/live-filters-<label>/` altındadır. CPU/GPU sayaçlarının anlamı ve geçersiz ilk deneyler FILTER_PERFORMANCE.md içinde açıklanır. Gerçek site erişiminin değişmesi ölçümün yeniden üretilebilirliğini sınırlayabilir.

`--native-reference` eklentiyi hiç kurmadan aynı CSS dizgilerini testte doğrudan uygular: nötr/üç filtre/tam zincir/dönüş. HUD ve sürükleme ölçümü içermez; ayrı oturumların farkını yalnız eklenti ek yükü olarak yorumlamaya yetmez. Başarısızlık mesajlarında HTTP adresleri maskelenir. Benchmark sırasında tarayıcı/ağ hatası veya geçersiz medya penceresi varsa ham kayıt korunur ve kabul sayılmaz; düşük performanslı ama geçerli pencere elenmez.

v0.7.7.8 yerel sonuç: 214 Node testi ve eklenti sözleşmesi; iki motorda iframe filtre/kapanış/reset/durmuş medya kontrolleri geçti. Son kaynak hash'iyle canlı tam ekran altışar filtre penceresi doğrulandı. Firefox'un ek iframe tekrarındaki bir başlangıç zaman aşımı uygulama regresyonu sayılmadı; temiz profil tekrarında test geçti. Güncel gerçek site sonuçları/CPU belirsizlikleri FILTER_PERFORMANCE.md içindedir; uzak CI sonucu değildir.

## Rapor penceresi performansı

Yerel üretilmiş medya hazırsa `node tests/report-performance.cjs --engine=both --label=report-run --compare-blur` görünür iki tarayıcıyı sırayla çalıştırır. İlk/sıcak açılış, teşhis toplama, JSON/önizleme, gerçek kısa/uzun klavye girdisi ve 20 ek aç/kapatta GC sonrası rapor kökü/dinleyici tutulması ayrıdır. Fonksiyon sarmalayıcıları yalnız Git dışı test kopyasına eklenir; `--plain` gerçek kaynakla tekrar yapar (sayfa gözlemcileri kalır). CPU/GPU/kare sayıları ve kaynak JS/CSS hash'leri Git dışı `tests/artifacts/reports-<label>/` altına yazılır. Özel yorum, kaynak URL'si ve ham heap yoktur; kullanıcı panosu değiştirilmez. Aynı anda başka benchmark çalıştırılmamalıdır.

`node tests/report-browser.cjs --engine=firefox` ve `--engine=chromium` gerçek UI tıklamalarıyla raporda backdrop blur olmamasını, canlı ham metin önizlemesini, EN/TR, özel alan varsayılanlarını, opt-in geri almayı, paylaşım URL'lerini ve kopya/önizleme eşitliğini doğrular. Mevcut `tests/artifacts/media/synthetic-av-720p.webm` dosyası gerekir; performans aracı ayrıca yerel 1080p dosyayı kullanır. Eksikse `node tests/prepare-browser-fixtures.cjs --audio-fixture --performance-fixture` yerel FFmpeg ile üretir; çalışma dosyaları bu komutla otomatik indirilmez. Bu iki yeni test mevcut CI'a eklenmedi.

v0.7.7.9 kanıtı ve sınırları REPORT_PERFORMANCE.md içindedir. `npm run check` 214 testi geçti; yerel rapor tarayıcı regresyonları iki motorda geçti. Toplam süreç RAM'i uygulamanın tek başına tüketimi veya sıfır video karesi kaybı evrensel akıcılık garantisi değildir.

## Dialog klavye davranışı (D-02)

`node tests/dialog-keyboard-browser.cjs --engine=firefox|chromium [--report=true] [--screenshots=true]` kurulu eklentide gerçek klavye olaylarıyla çalışır ve iki motorlu CI matrisindedir. Rapor, kısayol, adaptör ve DRM pencerelerinde klavyeyle açmayı, ARIA adlandırmayı, başlangıç odağını, Tab çevrimini, kısayol ve site tuşu sızıntısını, Escape'i ve odağın geri dönmesini; adaptörde klavyeyle seçimi ve iframe sunumunu sınar. Gerçek DRM kullanmaz, ekran okuyucu kabulü değildir. `--screenshots=true` yalnız Chromium'da Git dışı `tests/artifacts/dialog-keyboard/` altına görüntü yazar.

## CDN ölçüm sonuçları (I-12)

`node tests/cdn-measure-browser.cjs --engine=firefox|chromium [--width=420]` kurulu eklentiyi yerel sunuculara karşı çalıştırır: son medya isteği, HEAD, HEAD reddi, CORS engeli, zaman aşımı, görünür istek yok ve iki iframe durumu. Düğme metni, ipucu ve bildirimi denetler. Gerçek CDN davranışının kanıtı değildir.

## Uzun bellek ölçümü (D-01)

`node tests/memory-soak.cjs --engine=firefox|chromium --condition=native|passive|active [--label=run] [--minutes=4] [--replacements=60] [--no-forced] [--quick]` aynı yerel dosyayla uzun oynatma ve video değişimi ölçer. `--no-forced` değişimler sırasında toplamayı tarayıcıya bırakır. Eksik dosyayı `prepare-browser-fixtures.cjs --audio-fixture` üretir. Sonuçlar Git dışı `tests/artifacts/memory-soak-<label>/` altındadır; sentetik tek sayfa ölçümüdür, CI'a eklenmedi. Kapsam ve sınırlar MEMORY_MEASUREMENTS.md içindedir.

## HUD yeri ve sayfa geçişleri (I-08)

`node tests/hud-continuity-browser.cjs --engine=firefox|chromium [--headless=true] [--report=true]` kurulu eklentiyle yerel sentetik sayfalarda çalışır ve iki motorlu CI matrisindedir. Üst sayfa ve iframe tam ekranında panel yerini; video/iframe değişimi, geç gelen video ve boş iframe akışlarında tek görünür paneli, panelin açık kalmasını, "video yok" uyarısını ve komutun yeni videoya ulaşmasını sınar. `--report=true` başarısız olmadan koordinatları yazar. Gerçek site kabulü değildir.

## Ses–görüntü senkron ölçümü (I-07)

`node tests/prepare-browser-fixtures.cjs --av-fixture` yerel FFmpeg ile 2 saniyede bir flaş ve bip içeren Git dışı HLS üretir. Mevcut `hls/` videolarında ses yoktur. `node tests/av-sync-browser.cjs --engine=firefox|chromium --scenario=graph-first|native-first|edge|long --label=run` gerçek Hls.js ve kurulu eklentiyle çalışır; Web Audio çıkışı sıfır kazançtan geçtiği için hoparlöre bip gitmez. Sonuç pozitifse görüntü sesin önündedir. Değerler grafik içinden ölçülür, sabit paylar içerir; pencereleri birbiriyle karşılaştırın. `valid:false`, pencere arka planda kaldığı için kanıt sayılmaz; o turu tekrarlayın. CI'a eklenmedi; gerçek site veya hoparlör algısı kabulü değildir.

## Sürüm artırma

```powershell
npm run version:set -- 0.7.8
npm run check
```

Komut manifest, motor/CSS başlıkları, npm paket/kilit dosyaları ve güncel README/kılavuz/çalışma kaydı sürüm işaretlerini birlikte günceller. Değişiklik notları ve test kanıtı ayrıca yazılmalıdır; komut tarihsel sürüm kayıtlarını yeniden yazmaz. Kullanıcının küçük düzeltme tercihi için `0.7.8.1` gibi dört sayısal bölüm desteklenir. Commit/tag/push kendiliğinden yapılmaz.

GitHub testleri push **sonrasında** çalışır. Başarısız kontrollerin ana dala birleşmeyi engellemesi için depo ayarlarında ayrıca branch protection / ruleset ve required status checks açılmalıdır; bu çalışma uzak depo ayarlarını değiştirmedi. İlk çalışmadan sonra `Source checks (ubuntu-latest)`, `Source checks (windows-latest)`, `Browser smoke (firefox)` ve `Browser smoke (chromium)` zorunlu kontrol olarak seçilebilir. Kaynak: [GitHub tetikleyicileri](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [güvenli action kullanımı](https://docs.github.com/en/actions/reference/security/secure-use).

## 30 Ekim 2026 — v0.7.7 yerel kanıtı

179 Node testi ve eklenti sözleşmesi geçti. Gerçek kurulu Firefox 159.0 ve Chromium tabanlı Edge 152.0.4191.53'te normal/dar pencere HUD turları geçti; 20 tema ve iki dil kontrol edildi. `npm ci --ignore-scripts --no-audit --no-fund` kilitli bağımlılıkları kurdu. GitHub'ın Ubuntu/Windows işçileri henüz çalıştırılmadı; bu kayıt yerel Windows sonucudur. Önceki gerçek site/bellek/GPU hedefleri [ACTIVE_WORK.md](ACTIVE_WORK.md) içinde açık kaldıkları kapsamda izlenir.
