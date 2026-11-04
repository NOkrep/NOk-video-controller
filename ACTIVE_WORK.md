# Etkin çalışma kapsamı

## D-04 yerel kapsam tamam, v0.7.9.2 — 4 Kasım 2026

Oynatıcı iframe içindeyken tam ekran paneli kaynak çerçevede ayrı açılıyor, üst paneldeki tema ve erişilebilirlik tercihleri oraya geçmiyordu. Yeni test eski kodda "fullscreen panel uses the chosen preferences" adımında başarısız oldu.

- Üst panel yeni kaynağa ve her değişiklikte `hud-preferences` komutu gönderir; kaynak durumu tam ekrandaki değişikliği geri taşır. Bekleyen komut varken gelen eski durum seçimi ezmez.
- Protokolden yalnız tema kimliği ve dört doğru/yanlış değer geçer. RAM'de kalır, rapora girmez, yeni izin yok.

**Kanıt:** `hud-state` testi iki motorda; gerçek tam ekrana giriş, tercihlerin kontrollerle birlikte eşleşmesi, tam ekranda değişiklik ve çıkışta geri gelme. Birim testleri protokol sınırlarını ve bekleyen komut sırasını kapsar.

**Sınırlar:** Sentetik yerel kabuldür; gerçek ekran okuyucu ve tema görünümünün gerçek sitelerde kabulü açık.

## I-12 yerel kapsam tamam, v0.7.9.1 — 4 Kasım 2026

Yeni `tests/cdn-measure-browser.cjs`, kurulu eklentiyle yerel sunuculara karşı Firefox 159 ve Edge 152'de çalışır. Düzeltmeden önce yeni birim testleri ve tarayıcı testi başarısız oldu.

- **Düzeltilen hata:** Oynatıcı iframe içindeyse başarısız ölçüm açıklamasız kalıyordu: kaynak çerçevenin bildirimi bastırılıyor, yanıt nedeni taşımıyordu. Yanıta sabit değerli `pingStatus` ve sınırlı `ageMinutes` eklendi, görünen çerçeve nedeni kendisi söylüyor. Adres veya kaynak bilgisi taşınmaz.
- **Düğme:** Ölçülemeyince "Sonuç yok" yazıyor ve nedeni ipucunda; önceki değer ve renk kalmıyor. Sayının ipucu kaynağını söylüyor: son medya isteği veya ayrı HEAD isteği.
- **`hud-state` testindeki aralıklı hatalar:** Testi sınarken 10 turda 2 hata çıktı; `main`'de de 15 turda 2. İki ayrı neden bulundu:
  - **Test yarışı:** Panel yeniden açılınca iframe oturumu birkaç milisaniye sonra bağlanıyor, test bu aralıkta Sıfırla'ya basıyordu. Test artık bağlantıyı bekliyor. Ölçülen aralık çoğunlukla 1–3 ms, en çok 118 ms. Ürün kodu değişmedi; bu aralıkta verilen komut kaybolabilir.
  - **Ürün hatası:** Kaynak çerçeve filtreyi kabul edip çizimi sonraki kareye bırakıyordu. Panel o karede kapanırsa kare iptal ediliyor, son ayar videoya uygulanmıyordu. `clearRemoteSession` artık bekleyen değeri uygular.
- **Eski kayıt:** Elle ölçümde yaşı yazılır ("5 dk önceki istek"). Sessiz yenileme 2 dakikadan eski kaydı güncel göstermez ve kendi yazdığı sayıyı geri alır; elle alınmış sonuç silinmez.
- **Metinler:** Yeni iki dilli açıklamalar her sitede ölçüm sözü vermiyor; kısıtın oynatmayı etkilemediğini belirtiyor.

**Kanıt:** 222/222 Node testi. CDN tarayıcı testi iki motorda 1200 ve 420 piksel genişlikte geçti: son medya isteği, HEAD, HEAD reddi, CORS engeli, 4 saniye zaman aşımı, görünür istek yok, iframe içinde HEAD ve iframe içinde CORS engeli. Ekran görüntüsüyle görsel kontrol yapıldı; bölünen düğme metni bu kontrolde görülüp kısaltıldı. `hud-state` iki motorda 30'ar turda hatasız. Yeni test CI matrisine eklendi.

**Sınırlar:** Sentetik yerel kabuldür. Gerçek CDN yanıtları ve tarayıcının zamanlama kaydının gerçekten dolması sınanmadı; yaş mantığı birim testiyle kapsandı. 4 saniye süresi değişmedi.

## Araç sisteminde tek Python — 4 Kasım 2026

Ürün kodu ve sürüm değişmedi (v0.7.9).

- **Tek Python:** Claude hook'u, `tool-security.mjs` ve SkillSpector ortamı `D:/NOk-Tools/third-party/runtimes/python/3.12.10` kullanıyor. Kullanıcı Python Software Foundation imzasını tercih etti; python.org'da daha yeni 3.12 Windows paketi yok. Sekiz kapsam yeni tabandan aynı sonucu verdi, onaylar geçerli kaldı, hook denemeleri geçti.
- **Engelli beceri:** Kullanıcı kararıyla Claude bağlantısı kaldırıldı, kaynak dosyalar değişmedi. `doctus` ve `glove` UI işi `emil-design-eng`'e geçti.
- **`ensure` koruması:** `ensure` ve `prepare` kurulu kapsamları reddediyor. Yeni test önce başarısız oldu, düzeltmeyle 31 guard testi geçti.
- **`nok-release`:** Hedef proje yolu dosya başvurusu sanıldığı için tarama eksikti. İfade düzeltildi, tarama PASS.
- **NOk-Tools kapandı:** Codex hook'unu aynı Python'a aldı ve kendi bağlantısını kaldırdı (N-009, N-010). Bağımsız denetim: iki istemcide 9 bağlantı ve 1 `DO_NOT_LINK`, sekiz `check` onaylı, `Test-NOkTools.ps1` PASS, araç kodunda Codex runtime yolu yok. Açık iş notu kalmadı. Ayrıntı `D:/NOk-Tools/AGENT_NOTES.md`.

B6-C kullanıcı kararıyla ertelendi; kullanıcı isteyince başlar.

## Araç sistemi etiketleri, lisans paketlemesi ve panel sınaması — 4 Kasım 2026

Ürün kodu ve sürüm değişmedi (v0.7.9).

- **Codex onay yenilemesi doğrulandı:** Yedi `check` onaylı, 20 bağlantı kayıtlı kaynaklarla aynı, `Test-NOkTools.ps1` PASS. `superpowers/nok-reviewed` tarayıcıda ham BLOCKED (52/HIGH) döndü; aynı dört bulguyu kullanıcı onayladı, ham rapor duruyor.
- **N-002 kapandı:** Katalogdaki üç etiket güncellendi. `newInstallGateAutomatic` artık `false`, çünkü otomatik tarama kapısı yoktur.
- **Lisans paketlemesi incelendi, commit edilmedi:** `NOk-FilmDeck-Release` testleri 11/11 geçti. Gerçek kaynakla iki hedef de 16 dosya seçiyor; `LICENSE` ve `THIRD_PARTY_NOTICES.md` içeride, özel notlar dışarıda. Sürüm paketlenmedi, mağazaya gönderilmedi. Değişiklik Codex'in dalındadır (N-008).
- **Panel:** FilmDeck kurulamıyor. Ayrıntı PROJECT_HANDOFF.md §8.

## v0.7.9 main'de, öncelikler ve sürüm kararı — 4 Kasım 2026

v0.7.9 `main`'e birleşti (#115, `fff5ccf`). Kullanıcı üçüncü sürüm bölümünü de 9 ile sınırladı; `0.7.9` sonrası küçük adım `0.8.0`'dır. Öncelik sırası PROJECT_HANDOFF.md §8'dedir: Codex önce araç sistemi notlarını kapatıp beceri onaylarını yeniler, sonra Claude listeye başlar.

## Chromium başlangıç testindeki aralıklı hata — 4 Kasım 2026

Yalnız belge içeren `be3fc1c` commit'inde `Browser smoke (chromium)` başlangıç testi kırmızı oldu. Hata yerelde 10 turun 3'ünde üretildi. Ürün kodu ve sürüm değişmedi (v0.7.9).

**Kök neden:** Eklenti yeni kurulduğunda service worker hedefi görünür, ama `onClicked` dinleyicisi henüz kayıtlı olmayabilir. Tarayıcı bu aralıkta gelen araç çubuğu eylemini düşürür. Test kurulumdan hemen sonra tıkladığı için panel açılmıyordu. v0.7.9'a özgü değildir: tanı betiğinde `main` (v0.7.8) 20 turun 18'inde, güncel kod 19'unda aynı hatayı verdi. Testin normal adımlarında oran daha düşüktür, çünkü tıklamadan önce başka işler yapar.

**Düzeltme:** `tests/resource-driver.cjs` Chromium kurulumunda dinleyici kaydını bekliyor. Araç çubuğunu kullanan bütün Chromium testleri bundan yararlanır.

**Kullanıcı etkisi:** Uyuyan worker yolunda 20 turda kayıp tıklama yok; bunun 17 turunda worker tıklama anında gerçekten kapalıydı. Kalan kullanıcı etkisi, eklenti kurulduktan sonraki ilk yarım saniyede yapılan tıklamayla sınırlıdır; ikinci tıklama çalışır. Bu yüzden ürün kodu değiştirilmedi.

## Ortak araç sistemi: notlar ve hook Python'u — 4 Kasım 2026

Ürün kodu ve sürüm değişmedi (v0.7.9). Kullanıcı kararıyla iki değişiklik yapıldı, ikisi de bu deponun dışındadır:

- **Ajanlar arası notlar:** `D:/NOk-Tools/AGENT_NOTES.md` oluşturuldu. Bir ajan diğerinin alanında sorun görürse düzeltmez, buraya not bırakır. İşe başlarken kendine açık notları okur. `AGENTS.md` ve `CLAUDE.md` bu dosyaya yönlendiriyor.
- **Claude hook'u:** `D:/NOk-Tools/third-party/runtimes/python/3.12.4` içindeki imzalı Python'a taşındı, Codex runtime'ına bağımlılığı kalktı.

**Kanıt:** Deneme komutu Bash ve PowerShell'de engellendi, normal komut ikisinde de çalıştı. 8 sentetik kararda eski ve yeni Python aynı sonucu verdi. 30 guard testi ve `Test-NOkTools.ps1` (164 dosya) geçti.

**Sınırlar:** Hook bir OS güvenlik sınırı değildir; kapsamı yine Bash ve PowerShell araçlarıdır. SkillSpector ortamı, yani `ensure`, hâlâ Codex runtime'ına bağlıdır. Açık maddeler `AGENT_NOTES.md` içindedir.

## D-02 yerel kapsam tamam, v0.7.9 — 4 Kasım 2026

Yeni `tests/dialog-keyboard-browser.cjs` kurulu eklentide gerçek klavye olaylarıyla çalışır. Düzeltmeden önce iki motorda da rapor, kısayol, adaptör ve DRM pencerelerinde başlangıç odağı, Tab çevrimi, Escape ve odağı geri verme yoktu. Pencere açıkken `m` arkadaki ses modunu değiştiriyordu, çünkü kısayol dinleyicisi yakalama aşamasında çalışır. Adaptör seçenekleri ve DRM rozeti klavyeyle kullanılamıyordu.

- Dört pencere ortak `activateUiDialog` davranışına geçti: `role="dialog"`, `aria-modal`, başlıkla adlandırma, içeride başlayan odak, Tab çevrimi, Escape, odağın açan düğmeye dönmesi. Pencere içinde eklenti kısayolları ve site tuşları çalışmaz.
- Yazılmış rapor açıklaması varsa Escape pencereyi kapatmaz.
- Adaptör seçenekleri ve DRM rozeti gerçek düğme oldu. Görsel kontrol yapıldı. Klavye eylemi olduğu için animasyon eklenmedi.
- **I-08 düzeltmesi:** Test Firefox'ta v0.7.8'deki bir yarışı yakaladı: iframe tam ekrandan çıkışta yer geçici görünüm boyutuna göre hesaplanıyor, panel 8 turun 2'sinde 4 piksel kayıyordu. Geçişten hemen sonraki boyut değişiminde yer yeniden uygulanır; düzeltmeden sonra 16 turda kayma yok.

**Kanıt:** 217/217 Node testi ve kaynak/sürüm/izin denetimi. Son kaynakla (`injected.js` SHA256 `dc825596…`) Firefox 159 ve Edge 152'de `dialog-keyboard`, iki kez `hud-continuity`, `hud-state`, `pip`, `startup`, `report` ve dar pencereli `ui-smoke` geçti. Yeni dialog testi CI matrisine eklendi; uzak sonucu bu kayıt yazılırken görülmedi.

**Araçlar:** `D:/NOk-Tools` README, katalog, güvenlik kayıtları ve yapı okundu. `Test-NOkTools.ps1` 164 dosyada PASS, 10 Claude bağlantısı doğru. Profilden `emil-design-eng`, `systematic-debugging` ve `verification-before-completion` `check` onayıyla kullanıldı. Yeni araç kurulmadı.

**Sınırlar:** Sentetik yerel kabuldür. Gerçek ekran okuyucu, açık `select` listesinde Escape ve tarayıcı tam ekranında Escape davranışı sınanmadı. Tarayıcı Escape ile tam ekrandan çıkabilir. Bu turda gerçek DRM yok; rozet testte zorla gösterildi.

## D-01 dar hedef tamam — 4 Kasım 2026

`tests/memory-soak.cjs`, eklentisiz / pasif / aktif koşulları iki motorda uzun oynatma ve 90 video değişimiyle karşılaştırdı. Eklentiye özgü büyüyen sızıntı bulunmadı, bu yüzden üretim kodu ve sürüm değişmedi (v0.7.8).

15 dakikalık oynatmada iki motorda da sürekli büyüme yoktu. Edge'deki değişim başına yaklaşık 1 MiB renderer artışı eklentisiz de aynıdır ve 60 değişimden sonra yatay hale geliyor. Firefox'ta boost/mono kullanılan kaldırılmış videoların askıdaki `AudioContext`leri tarayıcı toplayana kadar kalıyor: 90 değişimde kontrollerin yaklaşık 100–200 MiB üstü, zorlanmış toplamayla geri dönüyor. Bağlamı erken kapatmak geri eklenen videoyu sessiz bırakacağı için değiştirilmedi.

**Sınırlar:** Sentetik tek sayfa ve 15 dakikadır. Saatlik oynatma, gerçek MSE/HLS sitesi, 4K, çok sekme maliyeti ve tahsisin kesin nedeni açık. Ayrıntı MEMORY_MEASUREMENTS.md.

## I-08 yerel kapsam tamam, v0.7.8 — 4 Kasım 2026

Yeni `tests/hud-continuity-browser.cjs`, kurulu eklentiyle Firefox 159 ve Edge 152'de panel konumunu, her çerçevedeki görünür panel sayısını ve komut ulaşımını ölçtü. Düzeltmeden önce dört hata yeniden üretildi; test önce başarısız, düzeltmeden sonra geçti.

- **#97:** Açık paneldeki üst sayfa videosu kaybolup oynatıcı iframe'de gelince panel kapatılıp açılana kadar "video yok" kalıyordu. Çocuk çerçeve araması yalnız açılışta başlıyordu. Panel artık video kaybında aramayı yeniliyor, yerel video dönerse aramayı kapatıyor.
- **#110:** İframe oynatıcıda normal ve tam ekran paneli ayrı öğelerdir; yer paylaşılmadığı için tam ekranda varsayılan köşeye atlıyordu. Yer, boş alanın 0–1 oranıyla iki yönde aktarılır. Sayfa koordinatı, adres veya medya konumu taşınmaz.
- **Kaynak değişimi:** Açık ve taşınmış panel her yeni oturumda köşeye dönüyordu; artık yerini korur. Kapatıp açınca varsayılan köşeye dönüş belgelenmiş davranıştır, korunur.
- **Uyarı:** "Video yok" uyarısı alttaki paneli ekran dışına taşırıyordu. Panel uyarı süresince yukarı çıkar, uyarı kalkınca kullanıcının yerine döner.

**Kanıt:** 217/217 Node testi ve kaynak/sürüm/izin denetimi. İki motorda yeni süreklilik testi ile `hud-state`, `pip`, `startup` ve dar pencereli `ui-smoke` geçti. Yeni test CI matrisine eklendi; uzak sonucu bu kayıt yazılırken görülmedi.

**Sınırlar:** Sentetik yerel kabuldür; gerçek site kabulü açık. Taranan akışlarda çift görünür panel (#80) ve kendiliğinden kapanma (#94) üretilmedi; gerçek sitelerde olmadığı kanıtlanmadı. Video kaybolmayıp `readyState 0` ile kalan geçişte iframe araması yenilenmez: bir reklam çerçevesinin kontrolü alma riski nedeniyle bilinçli bırakıldı. Commit ve push yapıldı; `main` birleşmesi kullanıcıdadır.

## I-07 askıda — 4 Kasım 2026

Kullanıcı I-07'yi askıya aldı. Üretim kodu ve sürüm değişmedi. Kök neden bulunmadı; sorun çözüldü denemez.

**Kanıt:** yeni `tests/av-sync-browser.cjs`, gerçek Hls.js, kurulu eklenti ve 2 saniyede bir flaş + bip içeren sentetik HLS ile Firefox 159 ve Edge 152'de çalıştı. #104'teki hızlı komut dizisi, grafiğin önce/sonra oluşması, ses 0, boost 200, duraklat/devam ve 4 dakikalık oynatma kayma birikimi üretmedi: 1x değerleri yaklaşık 18–54 ms, 1,5x–2x değerleri yaklaşık 44–102 ms aralığında kaldı; hız, ses ve sarma komutları videoya ulaştı. Değerler Web Audio grafiği içindendir, sabit fixture/gecikme payları içerir ve hoparlör algısını kanıtlamaz. `graph-first` ve `native-first` turları tek tekrardır. Bu koşulda Web Audio hipotezi desteklenmedi.

**Sınır:** #104'ün gerçek sitesinde sınanamadı: site otomasyonlu test profilini bot korumasıyla geçirmedi. Ölçüm kopyası fikri reddedildi ve taslakları hiç çalıştırılmadan kenarda bırakıldı. Gerekçe ve yeniden değerlendirme koşulu PROJECT_HANDOFF.md §8'de. Ajan panelinde birlikte test önerisi açık bir seçenek olarak kayıtlı.

## Claude Code devir kabulü ve kullanıcı kararları — 4 Kasım 2026

Claude Code handoff, yerel prosedür ve kılavuzu okudu; Git durumunu kendi doğruladı. `npm run check` ve `hud-state-browser.cjs` Firefox 159 / Edge 152'de geçti; `ACCEPTANCE.json` hash'leri güncel JS/CSS ile eşleşti; `d70940e` uzak CI'ı başarılı, `main` ruleset ile korumalı. Canlı site kabulü yapılmadı.

Kullanıcı kararları: ajanlar ayrı dallarda çalışır ve PR/merge ile ilerler; sürüm düzeni `0.x.0` milestone / `0.0.x` küçük / `0.0.0.x` çok küçük (en fazla 9); issue sürümü bayatlık kanıtı değildir; alan adlı diagnostic issue'lar geliştirmede bilinçli olarak tutulur ve eskiyenleri kullanıcı siler; Git, CI/CD ve yayın için genel otomasyon istenir (D-12); commit ve push ajana devredildi, PR ve merge kullanıcıda kaldı, `gh` kurulmadı; sırlar GitHub'a girmez, ajan gerekmedikçe erişmez ve gerekirse nedenini açıklayıp izin ister. Kullanıcı v0.7.7.9'u `main`'e birleştirdi (#111). Ayrıntı PROJECT_HANDOFF.md §2, §3, §5 ve §7.

Bu işte üretim kodu ve sürüm değişmedi; yalnız belgeler ve özel dosya CI kontrolü güncellendi. Dal `claude/agent-handoff`, taban `main` (`9c28a3e`). Aktif hedef yok; I-07 öneri olarak kalır.

## Codex / Claude Code ortak devir kaydı — 4 Kasım 2026

Güncel giriş noktası PROJECT_HANDOFF.md: mimari sınırlar, son sürüm kanıtları, I-01..I-13 ve D-01..D-11 envanteri ve önerilen I-07 hedefi. Yerel/Git dışı LOCAL_AGENT_PROCEDURE.md ortak araç/beceri, güvenlik, Git/CI, release ve ajanlar arası devir prosedürünü içerir. AGENTS.md/CLAUDE.md okuma sırasını yönlendirir; mevcut merkez kuralları korunur. Devir başlangıcında kaynak v0.7.7.9, HEAD `d70940e`, çalışma ağacı temizdi; v0.7.7.8 de `06e4387` ile commitlidir. Eski “commit yapılmadı” kayıtları kendi tarihlerine aittir. Aktif hedef yok; I-07 öneridir. Bu devirde runtime/sürüm değiştirilmedi, eski testler yeniden çalıştırılmadı; sözleşme/bağlantı/envanter ve mevcut JS/CSS kanıt kimlikleri kontrol edildi. Claude'un okuma/kabul özeti ve canlı hook/uzak CI durumu bu dosya oluşturmayla doğrulanmış sayılmaz. Commit/push/ZIP/yayın yapılmadı.

## Tamamlanan dar hedef — I-02 rapor penceresi performansı, 4 Kasım 2026

Firefox 159 ve Chromium tabanlı Edge 152'de oynayan sentetik 1080p30 video üzerinde rapor açılışı, teşhis toplama, JSON önizlemesi ve gerçek klavye olaylarıyla kısa/uzun yorum tepkisi ayrı ölçüldü. JSON hazırlama darboğazı saptanmadı. Raporun ekranı kaplayan backdrop bulanıklığı aynı oturumda açılıp kapatılınca tekrarlanan 3D motor yükü gösterdi. **v0.7.7.9**, yalnız rapor kökünde bu efekti kaldırır; mevcut karartma, canlı önizleme, yorum sınırı, gizlilik ve paylaşım işlevleri korunur. Yeni runtime timer, ağ isteği, izin, depolama veya teşhis alanı yoktur. Kaynak sürümü artışı kullanıcıya bildirildi.

**Kanıt:** eski kaynakta başarısız olan rapor tarayıcı regresyonu iki motorda düzeltme sonrası geçti; EN/TR, metin önizleme, manuel kopyanın önizlemeyle eşleşmesi, özel alanların varsayılan dışlanması ve opt-in geri alma sınandı. 214/214 Node testi ve kaynak/sürüm/izin denetimi geçti. Önce/sonra fonksiyon ölçümlerinin yanında fonksiyon gövdeleri değiştirilmemiş son kaynakla tekrar yapıldı; JS/CSS SHA256 eşleşti. Rapor açık son pencerelerde iki motor da 0/180 düşen video karesi bildirdi; tüm takılmaların çözüldüğü sonucu çıkarılmaz. 5 sıcak + 20 ek aç/kapatta bağlı DOM sabit kaldı; son kaynak kontrolünde GC sonrası kapatılmış rapor kökü/dinleyici hedefi kalmadı. İlk Edge turundaki tek sabit tutulmanın nedeni belirlenmedi; CSS ile giderildiği iddia edilmez.

**Sınırlar ve sonraki işler:** toplam tarayıcı native/cache RAM payı ayrıştırılmadı; D-01 açık. Rapor kapalı bazı pencerelerdeki kare kaybı, soğuk açılış/yazma gecikmesi değişkenliği, gerçek site/iframe aktarım gecikmesi, farklı donanım ve IME/ekran okuyucu kabulü bu dar deneyden tamamlandı sayılmaz. Yeni zorunlu özellik çıkmadı. Yeni yerel rapor tarayıcı testinin CI'a alınması mevcut D-10 kapsamında, medya fixture hazırlığıyla ayrıca düzenlenebilir. Ayrıntılar REPORT_PERFORMANCE.md ve TESTING.md içinde. Önceki v0.7.7.8 commit'i `06e4387` ile korunur; bu v0.7.7.9 çalışmasında commit/push/ZIP/release yapılmadı.

## Tamamlanan dar hedef — gerçek oynatıcı filtre performansı, 3 Kasım 2026

Kullanıcı önceki dört parçalı hedefi temizleyip Firefox/Chromium gerçek oynatıcı filtre performansı hedefini etkinleştirdi. Bu dar hedefin ölçüm, dinamik yazım darboğazını azaltma, tekrar doğrulama ve sınırları belgeleme adımları v0.7.7.8 kaynak kontrol noktasıyla tamamlandı. Diğer açık işler silinmedi; aşağıdaki tarihsel kayıtlar ve önceki envanter kapsamında kalır. ZIP/release/commit/push yapılmadı.

Filtre yazımları video karesine hizalanır; 50 ms geri dönüş ve durmuş/eski API yolu korunur. Son kabul edilmiş değer kapanışta korunur, kaynak/oturum/sahip değişimi eski callback'i iptal eder. Aday geliştirilirken 200 ms hedef önbelleğinin sürekli sürüklemeyle sonsuza uzaması ve toplanmış eski stream eşleşmesi regresyonla yakalanıp düzeltildi; bunlar önceki sürüm hatası diye sunulmaz. Filtre rengi/sırası, site stiline saygı, izin ve RAM-only mimari değişmedi.

**Kanıt:** 214/214 Node testi ve kaynak/sürüm/izin denetimi; son kaynakla Firefox 159 / Chromium tabanlı Edge 152 gerçek kurulu eklentide iframe filtre/kapanış/reset/durmuş medya + HUD durum testi geçti. Son canlı tam ekran kabulünün iki motorda altışar penceresi kaynak SHA256 eşleşmesi, doğru filtre, görünür ve kesintisiz medya ilerlemesiyle geçti; video sayacı sıfır düşen kare bildirdi. Önceki normal/tam ekran aynı-oturum zamanlama karşılaştırmalarında gereksiz stil mutasyonları azaldı; CPU her turda düşmedi. Son canlı örnek 720p/~24fps olduğu için tüm donanım/site/4K60/DRM için kasmasızlık iddiası yoktur. Eklentisiz CSS kontrolü ve statik render maliyeti, geçici CPU sıçramasının ayrıştırılamayan nedeni ve geçersiz ilk keşif turları FILTER_PERFORMANCE.md içinde ayrı belgelenmiştir.

**Sıradaki hedef adayları:** rapor penceresi performansı; bellekte native/cache ayrımı ve uzun kullanım; Kick görünür UI/reklam kabulü; kalan gerçek site kalite/medya/senkron kabulü. Kullanıcı seçiminden önce bu işlerden yeni hedef oluşturulmaz. Güncel filtre hedefinin tamamlanması eski bütünsel uygulama hedefini veya tüm issue'ları tamamlamaz.

## 3 Kasım 2026 — yeni regresyonların aşamalı takibi

**v0.7.7.7 — kalite kaynağı eşleştirmesi:** raporlanan herkese açık bir Video.js 7.18.1 örneği ayrı Firefox 159 profilinde yeniden incelendi. 480/720/1080 etiketleri tek resolved playlist adresine bağlıydı; FilmDeck paneli kullanılmadan sitenin kendi menüsünden 480p seçildiğinde SDK 480 bildirirken çözülen görüntü 720p kaldı. Yalnız test profilinde, doğru bağlı legacy VHS tamponu bir kez yenilenince de 720p kaldı. Bu gözlem tüm site/içerikler için genellenmez; eski controller'a otomatik flush eklemek bu örneği çözmediğinden üretime böyle bir müdahale eklenmedi.

Seçili Video.js/VHS envanteri yalnız RAM içinde, en fazla 128 seviye ile karşılaştırılır. Farklı yüksekliklerin aynı playlist adresine eşleşmesi kalite alanında EN/TR açıklama gösterir. Yerel/iframe HUD ve teşhis önizlemesi yalnız `playlistMapping: unknown | shared-playlist | distinct-playlists` taşır. Kaynak adresi, içerik adı, izleme konumu veya manifest içeriği aktarılmaz. `distinct-playlists` farklı görüntü içeriğini kanıtlamaz. Eksik envanter bilinmeyen kalır; kalite seçenekleri ve mevcut decoded doğrulama korunur. Yeni ağ isteği, kalıcı depolama, izin, timer veya otomatik kaynak/tampon sıfırlama yoktur.

Kanıt: **207/207 Node testi**, kaynak/sürüm/izin denetimi; Firefox 159 ve Chromium tabanlı Edge 152'de gerçek kurulu eklenti + Video.js/VHS + test amaçlı HLS ile ortak playlist uyarısı ve başarısız 480p doğrulaması, farklı playlist akışında gerçek 480p görüntü, ayrı kökenli iframe/üst HUD uyarısı ve anonim rapor aktarımı geçti. Kalite açıklamaları panel sınırlarına sığdı. Yeni tarayıcı testi mevcut yerel çalışma dosyalarını kullanır; CI'a eklenmedi ve otomatik indirme yapmaz. v0.7.7.6 commit'i `aad4b4c` ile korunur. Bu yeni kaynak kontrol noktası için commit/push/ZIP/yayın yapılmadı. Diğer örneklerde eksik envanter/gerçek kalite geçişi, senkron ve filtre/rapor performansı açık.

**v0.7.7.6 — açılış ve kontrol hedefi:** YouTube'da motor hazırken panelin `innerHTML` ataması `Sink type mismatch violation blocked by CSP` hatasıyla reddedildi. Destekleyen tarayıcıda tüm UI HTML atamaları yerleşik güvenli `setHTML` yoluna geçti; form/SVG/data-* işlevleri korunur, boş listeler parser kullanmadan temizlenir, yeni Trusted Types politikası yaratılmaz. Hesapsız ayrı Firefox 159 profilinde YouTube ana sayfası ve Google API örneğinin herkese açık izleme sayfasında gerçek toolbar üzerinden panel/logo açılışı doğrulandı; oynatma/kalite veya kullanıcı hesabındaki bütün durumların kabulü değildir.

Araç çubuğu tıklaması mevcut activeTab/scripting izinleriyle native MAIN başlatmayı dener; desteklenmezse eski DOM yolu sürer. Logo adresleri yalnız paket varlıkları olarak bellekte aktarılıp silinir. İzole dünyada yükleme sürerken gelen açılış isteği kaybolmaz; başarısız DOM yüklemesi sonraki tıklamada yeniden denenebilir. Metadata'sı olmayan yerel video iframe keşfini durdurmaz.

İframe'de yalnız kalite/aday listesi revizyonunun değişmesi temel hız/ses vb. komutlarını engelliyordu; başarısız regresyonla doğrulanıp ayrıldı. İndeksli kalite/hedef seçimleri liste revizyonuna, tüm medya komutları güncel sahibe bağlıdır. Video, SDK, kaynak, srcObject veya medya epoch değişince sahip yenilenir ve eski komut reddedilir. Sahip anahtarı yalnız ilkel değerler ve WeakMap kimlikleri taşır; eski video/SDK/MediaStream'i güçlü referansla tutmaz. Yerel iki motorlu video değiştirmede HUD açık kaldı ve ses komutu yeni videoya ulaştı. Gerçek rapordaki ses–görüntü kaymasının nedeni henüz ölçülmedi; bu testten çözüldü sonucu çıkarılmaz.

Son kanıt: **204/204 Node testi**, sürüm/izin/varlık/sözdizimi ve diff kontrolleri geçti. Firefox 159 ve Chromium tabanlı Edge 152'de gerçek toolbar + sıkı Trusted Types + teşhis penceresi; Chromium'da engellenmiş DOM başlangıcından native MAIN kurtarma; iki motorda video değiştirme, Mono/Stereo, küçültme/tam ekran ve PiP regresyonları geçti. Sahip değişince yalnız uyanık HUD aktivitesi yeni sahibe yeniden bildirilir; hareketsiz HUD uyandırılmaz. 20 tema, EN/TR ve dar pencere kontrolleri geçti. Yeni başlangıç testi mevcut CI matrisine eklendi; uzak CI henüz çalıştırılmadı. Kaynak v0.7.7.6; commit/push/ZIP/yayın yok. Eski tarayıcıların native Sanitizer API olmayan Trusted Types sayfaları ayrıca kabul gerektirir. Sonraki işler: gerçek kalite geçişi, özel senkron raporu, filtre/rapor performansı ve kullanıcıyla emoji envanteri kararı.

**v0.7.7.5 — PiP kontrol noktası:** ayrı yerel kökenli iframe'de alt çerçevenin geçici etkileşim yetkisi dolduktan sonra üst panel PiP isteği Firefox'ta `NotAllowedError` ile reddedildi; gerçek başarısız tarayıcı regresyonu kaydedildi. Doğrudan PiP yolu korunur. Aynı hata olursa yalnız kaynak videoda gerçek tıklama isteyen küçük onay gösterilir; otomatik tekrar veya iframe izin politikası değiştirme yoktur. Onay kapanış/iptal/30s süre sonunda temizlenir; hedef, kaynak, srcObject veya oturum değişmişse eski videoya işlem yapmaz. PiP işlemi seçili videonun sahibi belgeyi kullanır; üst HUD gerçek PiP durumunu ve aria-pressed bilgisini alır. Sabit `PIP_ACTIVATION_REQUIRED`, `PIP_POLICY_BLOCKED`, `PIP_NOT_READY`, `PIP_UNSUPPORTED` olayları eklenir; ham hata mesajı/stack/adres yoktur. Firefox 159 ve Chromium tabanlı Edge 152'de normal görünümden onayla native PiP açma, üstten kapatma ve tam ekrandan doğrudan açma geçti. Native pencere kapanınca test sekmesinin odağını geri verme yalnız test aracına eklendi. Gerçek raporlanan sitelerde kabul açık; evrensel PiP başarısı iddiası yok.

Son doğrulama: v0.7.7.5 sürüm/izin/sözdizimi kontrolleri ve 191 Node testi geçti. İki motorda önceki iframe Mono/Stereo/küçültme testi ve 20 tema + EN/TR + dar pencere UI testi tekrar geçti. Yeni PiP tarayıcı senaryosu CI'a eklendi; uzak CI çalıştırılmadı. Sentetik onay ekranının yerleşimi incelendi. Kaynak checkpoint'i; commit/push/ZIP/yayın yok. Tarayıcı kuralı: [requestPictureInPicture exceptions](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestPictureInPicture#exceptions).

**v0.7.7.4 kaynak kontrol noktası:** iframe'den gelen ses modu yalnız rozeti güncelliyor, seçili düğmeleri güncellemiyordu; ortak ses modu UI güncellemesi ve aria-pressed eklendi. Küçültme tercihi her popup'ın yerel closure'ında ayrıydı; oturum/sahip/revizyon kontrollü boolean komut ve durum aktarımıyla normal/tam ekran arasında eşleşir. Kaynak değişmediğinde top HUD'un ilk tercihi korunur; koordinatlar çerçeveler arasında gönderilmez. Kaynak regresyonları ve kurulu eklentiyle Firefox 159 / Chromium tabanlı Edge 152 yerel iframe testleri geçti. Gerçek raporlanan sitelerde kabul açık; konum farkı veya gerçek çift HUD bütünüyle çözüldü denmez. YouTube temiz profil denemesi yükleme aşamasında kaldı ve sonraki tarayıcı komutu hata verdi; kök neden/başarı kanıtı değildir. Yeni tarayıcı senaryosu mevcut CI matrisine eklendi; uzak CI henüz çalıştırılmadı. Sürüm kullanıcıya bildirilir; commit/push/ZIP/yayın yok.

1. YouTube HUD açılışı: v0.7.7.6 güvenli çizim + Firefox canlı panel/logo kabulü geçti. Oynatıcı/video değişimi: temel komut revizyonu ve sahip yenileme düzeltildi; yerel iki motorlu kabul geçti. Diğer raporlanan siteler ve ses–görüntü senkron kayması açık.
2. İframe ses modu düğmeleri ve tam ekran küçültme durumu: v0.7.7.4 kaynak + yerel iki motorlu regresyon tamam; gerçek site kabulü açık. Konum devamlılığı ve gerçek çift panel iddiası ayrıca incelenecek.
3. PiP: v0.7.7.5 kaynak + yerel iki motorlu regresyon geçti; gerçek site izinleri ve raporlanan sitelerde kabul açık.
4. Kalite: v0.7.7.7 ortak playlist/etiket ayrımı ve iki motorlu yerel/iframe kabulü geçti. Bir gerçek örnekte site menüsü de farklı görüntü vermedi; tüm siteye genellenmez. Diğer eksik envanter ve gerçek kaynak geçişi kabulü açık.
5. Video filtreleri: v0.7.7.8 dar hedefi tamamlandı; statik GPU maliyeti/yüksek çözünürlük sınırları kayıtlı. Rapor penceresi: v0.7.7.9 dar ölçüm/iyileştirme hedefi tamamlandı; gerçek site/donanım ve native/cache sınırları REPORT_PERFORMANCE.md içinde.
6. Kalan emoji/SVG envanteri: kullanıcıyla birlikte değiştirme/kaldırma kararı verilecek; toplu sessiz temizlik yapılmayacak.

### Gelecek özellik — oynatıcıdaki mevcut ses ve altyazı parçaları

Kullanıcı talebi: videoda zaten sunulan birden çok ses parçası (örneğin orijinal/dublaj) ve altyazı seçenekleri FilmDeck üzerinden listelenip seçilebilsin. Harici SRT/VTT yüklemeden ayrı bir özelliktir; bu aşamada uygulanmayacak.

- Yalnız seçili video/oynatıcıya bağlı gerçek parça envanteri; dil/etiket, etkin seçim ve altyazıyı kapatma durumu.
- Native medya veya ilgili adaptörün sunduğu API üzerinden seçim; kaynak/oynatıcı değişince listeyi yenileme, eski hedefe komut göndermeme.
- Desteklenmeyen veya erişilemeyen parça listesi için açık durum; seçenek uydurma, DRM aşma ve yeni izin/depolama yok.
- EN/TR, klavye/ekran okuyucu ve iframe/tam ekran eşleşmesi; parça adları, altyazı içeriği ve içerik kimlikleri otomatik teşhis raporuna alınmayacak.

Ham raporlar ve özel test alan adları bu paylaşılan iş listesine kopyalanmaz. Mevcut Puhu manuel kaynak yeniden deneme seçeneği korunur.

Son doğrulama (v0.7.7.4): `npm run check` — 184/184 test; JS sözdizimi ve diff boşluk kontrolü geçti. `hud-state-browser.cjs` Firefox 159 ve Chromium tabanlı Edge 152'de geçti. Mevcut `ui-smoke.cjs` iki motorda 20 tema, EN/TR ve dar pencereyle geçti. Bu kanıtlar yerel kurulu eklenti senaryolarıdır; canlı site veya uzak GitHub CI sonucu değildir.

## v0.7.7.3 — 3 Kasım 2026, MIT ve dağıtım bildirimleri

Standart LICENSE eklendi: Copyright (c) 2026 İhsan B. Arıtürk (NOkrep). README ve npm metaverisi MIT ile eşleşir; kaynak denetimi eksik/taslak/eksik koşullu lisansı ve boş üçüncü taraf bildirimini reddeder. Yalnız NOk-FilmDeck-Release adaptörünün paket kodu/testleri/README'si güncellendi: Chrome ve Firefox sentetik ZIP'lerinde LICENSE ve THIRD_PARTY_NOTICES.md aynen korunur, eksik/boş bildirim paketlemeyi durdurur ve yasal dosyaların hash'leri paket kaynak kimliğine katılır. Gelir paylaşımı veya ortaklık oranı belirlenmedi. Mevcut güvenlik/Dependabot değişiklikleri korundu. Diğer projelerin lisanslarına ve ortak motor koduna dokunulmadı; gerçek uygulama ZIP'i, commit/push veya mağaza başvurusu yapılmadı. Kaynak, hedef ve ortak motor test kanıtı bu turda ayrı doğrulandı; gerçek yayın kabulü değildir.

## v0.7.7.2 — 30 Ekim 2026, görünür amblem ve About FilmDeck

Son kontrol: 180 Node testi ve ikon/sürüm sözleşmesi geçti. Firefox 159.0 ve Chromium tabanlı Edge 152.0.4191.53'te 20 tema, EN/TR, dar pencere, görünür logo ve About FilmDeck yerleşimi geçti. Tam deck'in gerçek boyutlu açık/koyu PNG önizlemesi incelendi; canlı araç çubuğu/HiDPI kabulü ayrıca kullanıcıda doğrulanmalıdır. Kaynak v0.7.7.2, uygulama commit/push/PR yapılmadı.

Çalışma dalı `codex/filmdeck-cassette-icon`, `main` ile aynı `ad90ae4` v0.7.7 commit'inden açılmıştır; önceki HUD/CI değişiklikleri eksik değildir. Gizli IMG + CSS maskesi yolu kaldırıldı; özgün yatay logo görünür IMG ve tema filtresiyle çizilir. Önceki maske tanımı kontrolü gerçek çizimi kanıtlamıyordu; yeni görünür IMG kontrolü eski kaynakta başarısız oldu, düzeltmeden sonra Firefox/Chromium'da geçti. Kullanıcının sitesindeki kesin CSP/çizim nedeni doğrudan ölçülmüş sayılmaz. NOk imzası ve sürüm yalnız Settings → About FilmDeck içindedir. 16/32/48/128 px simgeler tüm kaset deck ve arka katmanları korunarak, ek iç boşluk olmadan boyutlandırıldı; özgün 4096 px dosya değişmedi. Eklentiyi yeniden yükledikten sonra açık sayfa da yenilenmelidir: eski motor aynı sayfanın RAM'inde kalabilir.

`HMI_lessons` ve `others-Puhu` dallarının her birinde yalnız bir ek merge commit'i vardı; tree'leri main geçmişindeki sırasıyla `4d71a35` ve `d79dabb` ile aynıydı. SHA lease ile uzak dallar, ardından yerel dallar silindi. `main` ve çalışma dalı korundu. Uygulama değişiklikleri henüz commit/push/PR yapılmadı; önceki gerçek site/performans hedefleri açık kaldıkları kapsamda korunur.

## v0.7.7.1 — 30 Ekim 2026, kaset simgesi

Kullanıcının `icons/filmdeck_kaset_tam_radyus_4096.png` çiziminden saydam 16/32/48/128 px simgeler üretildi; görünür çizim oranı korunup kareye ortalandı ve dış saydam boşluk azaltıldı. Özgün dosyanın SHA-256 özeti değişmedi. Manifest eklenti/toolbar eşlemelerine 32 px boyutu ve CI denetimine aynı boyut eklendi. 179 Node testi ve ikon sözleşmesi geçti; açık/koyu zeminde gerçek boyutlu PNG önizlemesi incelendi. Tarayıcı araç çubuğundaki canlı görünüm ayrıca doğrulanmadı. Çalışma dalı `codex/filmdeck-cassette-icon`; commit/push/PR/yayın yok. Önceki hedeflerin kabul durumu değişmez.

## v0.7.7 — 30 Ekim 2026, simgeler ve otomatik kalite kontrolleri

HUD'da ortak SVG çizgi simgeleri, tema rengini izleyen FilmDeck logo maskesi ve alt `by NOk` imzası uygulandı. Sürüm Ayarlar → Hakkında bölümüne taşındı; kullanıcının araç çubuğu ikonları ve özgün çizimleri korunur. 179 Node testi ve Firefox/Chromium normal/dar pencere HUD kontrolleri geçti. GitHub push/PR için kaynak/sürüm/izin/çalışma dosyaları ile iki motorlu sentetik HUD kontrol akışı hazır; uzak işçide ilk çalışma push sonrasıdır. Komutlar ve kanıt sınırları TESTING.md içinde. Önceki gerçek site/performans hedefleri bu UI/CI işiyle kapatılmadı. Commit, push, ZIP veya release yapılmadı.

30 Ekim 2026. Kaynak sürümü **v0.7.9 — FilmDeck by NOk**. Önceki v0.7.0.1 çalışması korunur; yeni kullanıcı raporları mevcut hedefin devamıdır. Tamamlanmış dil/tema/iframe filtre kuyruğu işleri yeniden yapılmaz. Kullanıcı istemeden ZIP, pre-release, normal release veya push hazırlanmaz. Kaynak klasörü esas alınır.

1. **Bellek:** ayrı Firefox test profilinde eklentisiz/kapalı/açık ve tekrarlı aç-kapat/video değiştirme ölçümü; süreç belleği ile JS/nesne tutulması ayrımı; kişisel tarayıcı geçmişi ve ham heap rapora girmez.
2. **Yanlış video ve geç keşif:** yüklenmemiş veya görünmeyen gömülü oynatıcıların çalışan videonun önüne geçmesini engelle; gerçek API/video sahipliğiyle adaptör seç; kullanıcı seçimini koru.
3. **HUD yaşam döngüsü:** kullanıcı açmadan görünme; video sonradan hazır olunca panel kapanmasın; çerçeve/sayfa değişiminde eski hedeften çıkıp yeniden bulsun.
4. **Rapor:** platform varsayılan other; kullanıcı seçerse önizlemede sayfanın alan adı ve platform adı. Oynatıcı türü site adı değildir. Yorum sınırını görünür sayaçla genişlet; serbest açıklama otomatik anonimleştirilmez. Site test kayıtları yalnızca yerelde.
5. **UI:** german_7619 brown-sloth-50 birleşik etiket/seçili yüzey yaklaşımını dikey sekmelere uyarla; klavye/ARIA/native button korunur. Uzun işlem yazıları ve iframe ses çubuğu görseli düzgün sığsın.
6. **Altyazı:** zemin opaklığı 0 iken zemin kenarlığı/gölgesi kalmasın; metin okunurluğu ayrı korunur.
7. **Kick:** gerçek SDK sesi/hızı ile sitenin görünür kontrol durumunu ayrı doğrula; UI eşleşmesi olmadan başarı iddiası üretme; setter önbelleği korunur.
8. **Kalite:** Video.js'te seçilen seviye ile decoded görüntü ayrımı açık; Puhu'da uydurma sayısal kalite listesi yerine gerçek oynatıcı envanteri/kontrolü; başarısız veya desteklenmeyen kontrol dürüst gösterilir.

Özel alan adları ve rapor gözlemleri `PRIVATE_TEST_NOTES.md` / `SITE_COMPATIBILITY.md` içindedir; Git'e alınmaz. Kabul kanıtı kaynak, anlamlı regresyon testi ve Firefox tarayıcı kontrolüyle ayrı kaydedilir; gerçek site başarısı yerel testten türetilmez.

## Bu turdaki sonuç ve sonraki kabul

- 2–6 için kaynak düzeltmeleri ve regresyon kontrolleri uygulandı. Firefox kurulu eklentide geç medya/iframe değişimi ve 2.0 CSS piksel ölçeği kontrolleri geçti. Ayrıntılar DEVELOPMENT_STATUS.md.
- 1 için Firefox ve **gerçek kurulu eklentiyle Chromium tabanlı Edge** ilk bellek turları tamamlandı: aynı yerel video, eklentisiz/hiç açılmamış/açık ve 30 aç-kapat/kapalı aşamaları. Edge'de heap/DOM/listener sayıları da ölçüldü. MEMORY_MEASUREMENTS.md.
- 7–8 kaynak düzeltmeleri ve kontrollü oynatıcı testleri tamamlandı; güncel Kick UI ve Puhu isimli kalite menüsü gerçek site kabulü açık. Bunları yerel testten “çözüldü” olarak işaretleme.
- Sonraki bellek/performance turu: uzun oynatma ve SPA/video değiştirme, gerçek sesli medyada boost/mono, görüntü filtreleri açık/kapalı CPU/GPU/kare kaybı ve gerektiğinde kontrollü GC ile tutulmuş heap karşılaştırması. İlk turdaki süreç RAM'i eklentinin tek başına tüketimi olarak sunulmaz.
- Eski uygulama hedefi tamamlanmış olarak işaretlenmez; yeni raporların uygulama kapsamı bu dosyadan izlenir. ZIP/yayın/push istenmedi ve yapılmadı.

## Kullanıcının yeni dört parçalı hedefi — v0.7.2 kontrol noktası

1. **Bellek: ilerledi, bütünü açık.** Sesli dosya, 30 aç/kapat, 20 boost/mono video değişimi ve zorlanmış toplama ile ölçüm yapıldı. Chromium'da kaldırılmış 20 video/kaynak tutulması düzeltildi; iki motorda artık bir canlı video/kaynak/bağlam kaldı. Yeniden eklenen aynı medya öğesi kendi binding'ini kullanabiliyor. Önceki Firefox 34 MiB farkı sabit dosya + GC/CC ölçümünde tekrar edilmedi; tekil native tahsis nedeni belirlenmiş sayılmaz. Toplam native RAM/cache payının sınıflandırılması hâlâ açıktır.
2. **Filtre performansı: açık.** CPU/GPU ölçüm yardımcıları hazırlandı; henüz filtreli/filtersiz karşılaştırmanın kanıtı değildir. İki motorda işlemci, GPU ve düşen kare ölçümleri yapılmalıdır.
3. **Kick UI/reklam: açık.** Bu turda yeni gerçek site doğrulaması yapılmadı.
4. **Puhu/Video.js/medya keşfi gerçek site kabulü: açık.** Önceki yerel testler korunur; güncel site başarısı iddia edilmez.

**Sürüm bildirim kuralı:** her kaynak sürümü artışında kullanıcıya sürüm, değişiklik, doğrulanan kanıtlar ve açık hedefler bildirilir; hedef kartını kullanıcı güncelleyebilir. v0.7.2, 158 Node testi ve gerçek Firefox/Edge laboratuvar kontrolleriyle kaynak kontrol noktasıdır; release/ZIP/push yoktur.

## v0.7.3 kontrol noktası — hedef kartına aktarılacak durum

- **1 Bellek: kısmen tamamlandı.** v0.7.2 nesne temizliği kanıtı korunur; toplam native/cache RAM payı henüz sınıflandırılmadı.
- **2 Filtreler: ölçüm ve hedef araması düzeltmesi tamamlandı; render kabulü açık.** 1080p30 yerel videoda Firefox/Edge CPU, GPU sayaç durumu ve kare kaybı iki tekrarla kaydedildi. 200 ms WeakRef hedef önbelleğiyle sürükleme video konumu sorgusu Firefox 199/202 → 94/93, Edge 386/386 → 98/88. 159 Node testi geçti. Firefox ağır statik zincir kare kaybı ve görünür tarayıcı/GPU doğrulaması tamamlanmadı. FILTER_PERFORMANCE.md.
- **3 Kick UI/reklam: açık.** Bu kontrol noktasında yeni canlı site kanıtı yok.
- **4 Gerçek site kalite/medya keşfi: açık.** Puhu/Video.js ve bildirilen gömülü oynatıcılar için canlı kabul sürer.

Kaynak klasörü v0.7.3; kullanıcı sürüm artışından ve kalan kapsamdan haberdar edildi. Hedefin bütünü tamamlandı işaretlenmez. Yayın/ZIP/push istenmedi ve yapılmadı.

## v0.7.4 — güncel durum

- Puhu'nun güncel oynatıcısında gerçek 1080p ve 480p görüntü, site seçimi ve eklenti onayıyla doğrulandı; isimli menü eşleşmesi düzeltildi.
- **Eski manuel 1080p kaynak yeniden deneme düğmesi geri eklendi ve daha iyi bir çözümle yerini aldığı doğrulanana kadar korunacak.** Tek denemede eski akışın 576p kalması, kullanıcının birkaç denemeden sonra HD yakaladığı deneyimini çürütmez. Bu özel kaynağın kalite kabulü açık.
- Kick'te SDK %35 sesi aldı; görünür ses/hız kontrolü ve gerçek reklam akışı açık. Güncel oyuncu kökü reklam denetiminde tanınır; gerçek reklam başarı iddiası yok.
- 166 Node testi geçti. Bellek native/cache sınıflandırması, Firefox ağır filtre/GPU ve diğer Video.js/gömülü site kabulü açık kalır. Ayrıntı LIVE_SITE_VALIDATION.md.

Hedef bütünü tamamlanmadı. Sürüm artışı kullanıcıya bildirildi; kaynak klasörü esas, ZIP/yayın/push yapılmadı.

Eski Puhu düğmesinin geri eklenmesi, temiz Firefox'ta üç ardışık yenileme ve her seferinde yeniden görünür/etkin olmasıyla doğrulandı. Bu test HD yakalama kabulü değildir; reklam/önizleme/asıl içerik ayrımı ve eski kaynakta birkaç denemeden sonraki kalite sonucu ayrıca izlenecek. Kullanıcının bu yöntemi daha iyi bir çözüm doğrulanana kadar koruma talebi geçerlidir.

### v0.7.4 bellek sınıflandırması — aynı sürümde ilerleme

Gerçek kurulu Firefox/Chromium'da 30 aç/kapat ve 20 boost/mono video değiştirme tekrarları geçti; bir güncel video/source/context kaldı, kaldırılmış videolar toplandı. Firefox kapanışında gfx yaklaşık 151→70 MiB ve süreç private 571→470 MiB düştü. Chromium'daki renderer artışı eklentisiz 20 video değiştirme kontrolünde de tekrarlandı (yaklaşık +71 MiB; eklentili boost başlangıcına göre +66 MiB). Dolayısıyla bu büyüme yalnız eklentiye özgü değildir; kesin decoder/cache/allocator nedeni ve önceki 34 MiB'ın geriye dönük açıklaması kanıtlanmadı. Ayrıntı MEMORY_MEASUREMENTS.md. Test yardımcıları anonim sayısal kategoriler üretir; üretime rapor alanı eklenmedi. Sürüm artmadı, v0.7.4; Puhu eski düğmesi korunur. Dört parçalı hedefin bütünü açık; ağır filtre/görünür GPU, Kick UI/gerçek reklam ve diğer site kabulü tamamlanmış sayılmaz.

### v0.7.4 görünür filtre kontrolü

Firefox ve Edge'de gerçek kurulu eklentiyle iki tekrarlı görünür 1080p30 CPU/GPU/kare ölçümü tamamlandı. Firefox headless tam zincirdeki 99/150 ve 97/150 kayıp görünür koşulda 0/150 ve 0/150 oldu; GPU motor yükü belirgin arttı. Edge görünür turda bütün pencerelerde sıfır kayıp verdi. Bu, filtrelerin maliyetsiz veya gerçek sitedeki kasma raporunun geçersiz olduğu anlamına gelmez. GPU sayaçları iki motorda gözlendi; ham cihaz bilgisi alınmadı. Ayrıntı FILTER_PERFORMANCE.md. Filtre sırası/rengi değiştirilmedi, sürüm v0.7.4 kaldı. v0.7.3 hedef araması azaltması korunur; sentetik/görünür ölçüm kısmı tamamlandı, gerçek site/60 fps/farklı donanım kapsamı sınırlama olarak kaydedildi. Kick UI/gerçek reklam ve diğer site kabulü açık.

Kick görünür Firefox tekrarı ve eklentisiz kontrolü tamamlandı: video oynarken iki koşulda da sitenin kontrol kökü boş; pointer hit-test VIDEO, görünür belge ve odak doğrulandı. Bu boşluk yalnız eklentiye özgü değildir; ses/hız UI veya gerçek reklam başarısı kanıtlanmadı. Aynı Firefox hover döngüsünü tekrar etme. Sonraki farklı kanıt kontrolü oluşan Kick VOD/Chromium koşulu veya bildirilen diğer Video.js/gömülü site kabulünden alınmalı. LIVE_SITE_VALIDATION.md ve Git dışındaki sayısal özet güncel. Üretim kodu/sürümü değişmedi; kaynak v0.7.4, eski Puhu düğmesi korunur.

## v0.7.5 kontrol noktası — Video.js native menü

170 Node testi geçti. Gerçek Video.js `.vjs-quality-button .item-quality` menüsü için sayısal caption/HD badge ayrımı ve gerçek `vjs-checked` seçimi desteği eklendi; aynı yükseklikte SDK yerine native kontrol kullanılır. Puhu isimli seçimleri ve eski 1080p retry düğmesi korunur. Kaynak sürümü artışı kullanıcıya bildirildi; ZIP/yayın/push yapılmadı.

Temiz görünür Firefox/Edge'de 1080p ve 480p istekleri site menüsü ve SDK seçiminde eşleşti. Hazır iframe videosu 1.5x ve %40 ses isteğini aldı; gizli readyState 0 üst video seçilmedi. Ancak bu örnekte üç rendition tek bir resolved kaynak adresi bildiriyor, decoded görüntü her iki istekte 720p kalıyor. Eklenti doğru biçimde Not confirmed gösteriyor; **decoded kalite kabulü açık**, bütün site uyumlu/kalite çözüldü denmez. Kanıt LIVE_SITE_VALIDATION.md ve Git dışındaki iki motor özetlerinde. Görüntüyü değiştirmeyen deneysel VHS 2 tampon yolu son kaynakta yoktur.

Sıradaki farklı kabul: bildirilen diğer yanlış/gömülü video siteleri; ayrıca kontrolü gerçekten oluşan Kick VOD/Chromium ve gerçek reklam döngüsü. Eski Puhu manuel retry korunmaya devam eder. Belleğin ilk 34 MiB farkı geriye dönük tek nedene bağlanmadı; ölçülmüş sınırlar MEMORY_MEASUREMENTS.md içindedir. Genel hedef tamamlanmadı.

## v0.7.6 — FilmDeck ürün kimliği

29 Ekim 2026. Kullanıcı ürün adını FilmDeck olarak belirledi. Manifest, güncel README/rehber ve görünen arayüz adları güncellendi. Kullanıcının yatay PNG logosu değiştirilmeden `icons/filmdeck-logo.png` olarak kullanılır; özgün dosya korunur. HUD üstünde FilmDeck, sekmelerin dışında alt bölümde NOk imzası vardır. Küçük kare tarayıcı ikonları yatay logodan üretilmedi. Eklenti ID'si, teknik protokol, izinler ve bellek içi çalışma ilkesi korunur.

170 Node testi ve sözdizimi kontrolü geçti. Geçici Firefox ve Chromium profillerinde yerel sentetik medyayla iki görselin yüklenmesi, üç sekmede alt imzanın konumu, taşma sınırı ve sonradan hataya düşen görselin metin yedeği doğrulandı. Bu tur önceki gerçek site/kalite/reklam kabulünü kapatmaz. Sunum için üç ayrı anlatı ve Canva yerleşim rehberi sohbetin özel çıktı klasöründedir; kullanıcı PDF'si ve ekip bilgileri depoya alınmadı. Yayın/ZIP/push yoktur.
