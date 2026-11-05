# Etkin çalışma kapsamı

## Güncel durum

5 Kasım 2026. Ayrıntılı envanter PROJECT_HANDOFF.md §6-8, aşağıdakiler en yeni kayıtlardır. Daha eski kayıtlar değişmeden [WORK_HISTORY.md](WORK_HISTORY.md) içindedir.

- **Sürüm:** Kaynak sürümü **v0.7.9.2**, `main`'de (#116). PR ve merge kullanıcıda. Sürüm `node scripts/set-version.cjs <sürüm>` ile değiştirilir; araç bu satırı günceller. Geçici düzen `0.milestone.düzeltme.küçük`: üçüncü bölüm sınırsız, dördüncü en fazla 9; kesin karar (B5) bekliyor.
- **Yerel kapsamı biten:** I-08, I-12, D-01 (dar hedef), D-02, D-04, D-10, D-11.
- **Seçildi, Claude'da (sıra):** CI-2, B6-C, I-03, I-04, I-05, I-09 ve I-10, D-08, D-09 (tooltip), I-11, D-06.
- **Codex'te:** I-13.
- **Kapandı:** D-07; finalist seçilmeyecek, 20 tema kalıyor.
- **Karar bekliyor:** B5 kesin sürüm kuralı.
- **Seçilmedi:** I-06, D-03, D-05, D-12, D-13, D-14, kalan gerçek site kabulleri.
- **Askıda:** I-07.
- **Araç sistemi:** `D:/NOk-Tools` açık iş notu yok; beceri onayları 11 Kasım akşamı dolar.

## D-10: CI kapsamı — 4 Kasım 2026

Ürün kodu değişmedi. `report-browser` canvas videosuyla üretilmiş dosya istemeden çalışıyor ve zorunlu `Browser smoke` işine girdi. `quality-mapping` için depoya 1,1 MiB sentetik HLS eklendi; Video.js SHA-256 eşleşmesiyle iniyor. Sunucunun H.264 desteği önceden bilinmediği için ayrı ve zorunlu olmayan `Browser media` işindedir. Sınıflandırma TESTING.md'de.

**Kanıt:** `report` iki motorda, `quality-mapping` iki motorda 5'er turda geçti, 224/224 Node testi. Uzak CI sonucu commit'ten sonra doğrulanacak.

**Gözlem:** `77bbb35` commit'inde `Browser smoke (firefox)` ilk adımda (`ui-smoke`) bir kez başarısız oldu. Yerelde 10 turda tekrarlamadı, sonraki commit'te geçti. Günlük okunamadığı için neden bilinmiyor; kapatılmış sayılmaz.

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
