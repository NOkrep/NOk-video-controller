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
```

İkinci tarayıcı senaryosu ayrı yerel kökenlerde iframe medyası kullanır: Mono/Stereo seçili düğmeleri ve `aria-pressed`, küçültülmüş panelle tam ekrana giriş, orada genişletip normal görünüme dönüş ve aynı anda tek görünür HUD. İki motorlu CI matrisinde çalışır. Gerçek site PiP, ses içeriği doğruluğu veya kalite geçişi kabulü değildir.

`pip-browser.cjs` gerçek native PiP çağrıları kullanır. Test sorgularının verdiği geçici etkileşim yetkisi dolduktan sonra üst panelden isteği gönderir; gerekirse kaynak çerçevedeki gerçek onay tıklamasını, açma/kapama durumunun üst HUD'a yansımasını ve tam ekrandan doğrudan açılışı sınar. Native API bulunmazsa bunu `unsupported-handled` olarak bildirir; PiP açıldı demez. Firefox'ta native PiP kapanınca test sekmesi standart WebDriver `browsingContext.activate` ile yeniden odaklanır. Önceki odaksız tam ekran zaman aşımı uygulama hatası olarak sayılmaz. `--screenshots=true` yalnız Chromium'da sentetik onay görüntüsünü Git dışı `tests/artifacts/pip-browser/` altına yazar.

`startup-browser.cjs` gerçek eklenti araç çubuğu eylemini `script-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'` yerel sayfasında sınar: sessiz otomatik başlangıç, panel/logo/SVG/data-* kontrolleri, teşhis penceresi ve aç/kapat/yeniden aç. Chromium'da DOM motor dosyası istekleri testte ayrıca engellenerek native MAIN yolunun sıfırdan başlaması zorlanır. Firefox'ta DOM motoru önceden hazır olabilir; test doğrudan araç çubuğu eylemini ve Trusted Types uyumunu doğrular. Firefox test sürücüsü yalnız ayrı oluşturduğu profil için `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1` kullanıp kendi FilmDeck araç çubuğu düğmesini tarayıcı arayüzünde tıklar; kişisel profil ve dosyalar okunmaz. Chromium `Extensions.triggerAction` test API'sini kullanır. Bu yetki/yardımcılar üretim eklentisinde yoktur.

Güvenli UI çizimi destekleyen tarayıcıda `Element.setHTML(..., { sanitizer: {} })` kullanır; yerleşik XSS temizliği korunurken uygulamanın form/SVG/data-* öğeleri kalır. Yeni Trusted Types politikası yaratılmaz. API olmayan eski tarayıcılar önceki HTML yolunu korur; bu tarayıcılarda Trusted Types zorunlu sayfa kabulü yapılmış sayılmaz. [MDN setHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML).

İframe medya değiştirme senaryosu, eski video yerine yeni öğenin kontrol edildiğini ve HUD'un açık kaldığını da sınar. Kalite/aday listesi revizyonu yalnız indeks kullanan kalite ve hedef seçimini sınırlar; temel kontroller güncel medya sahibine bağlıdır. Video/SDK/kaynak/srcObject/medya epoch değişiminde sahip değişir; eski komut reddedilir. Sahip karşılaştırması nesneleri güçlü referanslarla tutmaz.

Varsayılan Windows yolları kurulu Firefox ve Edge içindir. Farklı bir Chromium kurulumu `--browser="C:/.../chrome.exe"` ile verilebilir. Özel test profilleri kişisel profile dokunmaz; test sayfası yalnız localhost kullanır ve yardımcı sürücü sayfa ağını yerel/eklenti kaynaklarıyla sınırlar. Chromium için `--screenshots=true` yerel sentetik ekran görüntülerini Git dışındaki `tests/artifacts/ui-smoke/` klasörüne yazar.

## Sürüm artırma

```powershell
npm run version:set -- 0.7.8
npm run check
```

Komut manifest, motor/CSS başlıkları, npm paket/kilit dosyaları ve güncel README/kılavuz/çalışma kaydı sürüm işaretlerini birlikte günceller. Değişiklik notları ve test kanıtı ayrıca yazılmalıdır; komut tarihsel sürüm kayıtlarını yeniden yazmaz. Kullanıcının küçük düzeltme tercihi için `0.7.8.1` gibi dört sayısal bölüm desteklenir. Commit/tag/push kendiliğinden yapılmaz.

GitHub testleri push **sonrasında** çalışır. Başarısız kontrollerin ana dala birleşmeyi engellemesi için depo ayarlarında ayrıca branch protection / ruleset ve required status checks açılmalıdır; bu çalışma uzak depo ayarlarını değiştirmedi. İlk çalışmadan sonra `Source checks (ubuntu-latest)`, `Source checks (windows-latest)`, `Browser smoke (firefox)` ve `Browser smoke (chromium)` zorunlu kontrol olarak seçilebilir. Kaynak: [GitHub tetikleyicileri](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [güvenli action kullanımı](https://docs.github.com/en/actions/reference/security/secure-use).

## 30 Ekim 2026 — v0.7.7 yerel kanıtı

179 Node testi ve eklenti sözleşmesi geçti. Gerçek kurulu Firefox 159.0 ve Chromium tabanlı Edge 152.0.4191.53'te normal/dar pencere HUD turları geçti; 20 tema ve iki dil kontrol edildi. `npm ci --ignore-scripts --no-audit --no-fund` kilitli bağımlılıkları kurdu. GitHub'ın Ubuntu/Windows işçileri henüz çalıştırılmadı; bu kayıt yerel Windows sonucudur. Önceki gerçek site/bellek/GPU hedefleri [ACTIVE_WORK.md](ACTIVE_WORK.md) içinde açık kaldıkları kapsamda izlenir.
