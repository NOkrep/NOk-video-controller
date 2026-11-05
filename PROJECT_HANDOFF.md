# FilmDeck — Codex / Claude Code proje devri

Güncelleme: **4 Kasım 2026**. Bu dosya güncel duruma giriş noktasıdır; mimarinin ayrıntısı ve ölçüm kanıtlarının yerine geçmez. Kullanıcının kişisel test alan adları, izlediği içerikler ve ham geri bildirimleri burada yayımlanmaz.

## 1. İlk okuma ve doğrulama

1. Bu deponun `AGENTS.md` ve `CLAUDE.md` kurallarını oku. Varsa `LOCAL_AGENT_PROCEDURE.md` ortak çalışma prosedürünü oku; bu yerel dosya Git'e girmez, başka checkout'ta bulunmayabilir.
2. Bu dosyayı, `PROJECT_MASTER_GUIDE.md` mimarisini ve `ACTIVE_WORK.md` başındaki en yeni tarihli kayıtları birlikte oku.
3. Seçilen hedefin teknik belgesine ve ilgili kaynak/testlere geç. Bütün tarihsel belgeleri her görevde baştan okumak gerekmez.
4. `git status --short --branch`, `git log -4 --oneline`, manifest sürümü ve devam eden gerçek süreç/iş durumunu doğrula. Bu dosyadaki snapshot'ı canlı durum sanma.
5. Ne anladığını kısa bildir: sürüm/dal, değişiklik kapsamı, açık hedef, korunacak sınırlar ve ilk doğrulama. Sonraki görev kullanıcıdan gelmediyse öneriyi kendiliğinden aktif hedefe dönüştürme.

Belgelerdeki eski “bekliyor”, “commit yapılmadı” ve test sayıları kendi tarih/sürümüne aittir. Yeni kaynak veya uzak CI hakkında kanıt değildir. Çelişki varsa güncel kod/çıktıyı incele; eski raporu silerek geçmişi düzeltme.

## 2. Ürün ve çalışma anlık görüntüsü

- **Ürün:** FilmDeck by NOk. Önceki ad NOk Video Controller; ara ad CineDeck'ti. Teknik repo adı ve Firefox kimliği korunur.
- **Çıkış noktası:** sitelerin farklı ve eksik video arayüzlerinden doğan kullanıcı bıkkınlığı. Bilgisayarda video/film/dizi izleyen kullanıcıya ortak kontroller sunmak. Basit kullanımda hız/ses/kalite; daha ayrıntılı işler ayrı sekmeler ve katlanabilir alanlarda.
- **Kaynak sürümü:** `0.7.10`, `claude/workTogether` dalında. `main` son kontrolde `0.7.9.2` idi (#116, `4811e3c`, 5 Kasım). Devir başlangıcındaki kaynak `0.7.7.9`, HEAD `d70940e` idi.
- **Dallar (kullanıcı kararı, 4 Kasım 2026; önceki "mevcut dalda devam" notunun yerine geçer):** Her ajanın `main`'den açılmış tek bir uzun ömürlü dalı vardır: Codex `codex/…`, Claude `claude/…`. İş veya düzeltme başına yeni dal açılmaz; güncellik için `main` bu dala merge edilir. Aynı checkout kullanılır; kullanıcı ajan değiştirirken dal ve temiz durum doğrulanır. Bu yüzden devirden önce iş commit'lenmiş olmalıdır. Ajan kendi dalına commit atar ve push eder; **PR'ı ve merge'ü kullanıcı yapar**, ajan özeti ve PR bağlantısını bildirir. Karşı ajanın dalına doğrudan commit atılmaz; ikinci checkout/worktree istenmeden açılmaz.
- **Taban:** v0.7.7.9 dahil önceki iş `main`'e birleşti (#111, `9c28a3e`). Güncel dallar: Codex `codex/filmdeck-cassette-icon`, Claude `claude/workTogether`. Codex dalının adı ilk işinden kalmıştır; içeriği o işle sınırlı değildir.
- **Son doğrulama kaydı:** 214/214 Node testi; Firefox 159 ve Chromium tabanlı Edge 152 yerel kontrolleri. Son rapor kabulünün JS/CSS hash'leri `tests/artifacts/reports-v0779-plain/ACCEPTANCE.json` içindedir (Git dışı; başka makinede yeniden üretilir).
- **Git durumu ayrımı:** v0.7.7.9 commit'i artık mevcut. Geçmiş çalışma notlarındaki “commit yapılmadı” o turun bitiş durumudur. 4 Kasım Claude kontrolü: `d70940e` için uzak CI'ın 5 işi başarılı; `main` ruleset ile korumalı (PR ve 4 zorunlu kontrol; `Dependency security` zorunlu değil). v0.7.9 `main`'dedir (#115); mağaza başvurusu veya dağıtım yok.
- **Aktif hedef:** bu devir başlangıcında aktif hedef kaydı yok. I-01 ve I-02'nin aşağıda belirtilen dar hedefleri tamamlandı. I-07 kullanıcı kararıyla askıda. I-08 ve D-02'nin yerel kapsamı, D-01'in dar hedefi tamamlandı; gerçek site ve ekran okuyucu kabulleri açık. Sıradaki öneri I-03; henüz başlanmış/atanmış iş değildir.
- **Lisans:** MIT; mevcut LICENSE telif satırı `Copyright (c) 2026 İhsan B. Arıtürk (NOkrep)`. LICENSE ve THIRD_PARTY_NOTICES.md dağıtımda korunur. Ekip içi gelir/ortaklık paylaşımı bu metinle belirlenmiş sayılmaz; diğer projelerin lisansları değiştirilmez.

## 3. Bozulmaması gereken mimari ve gizlilik sınırları

### RAM-only ve izinler

- Üretim eklentisinde `localStorage`, `sessionStorage`, `chrome.storage`/`browser.storage`, cookie veya başka kalıcı kullanıcı ayarı deposu eklenmez. Tercihler JS belleğindedir; kalıcılık “iyileştirme” diye geri getirilmez.
- API izinleri `activeTab` ve `scripting`; `host_permissions` boş. Ancak `<all_urls>` + `all_frames` content script'leri eşleşen sayfalarda otomatik çalışır. Erişim yalnız toolbar tıklamasıyla başlıyor diye anlatma: sessiz köprü/oynatıcı kancaları önceden yüklenir, panel kullanıcı isteğiyle açılır.
- Node/Playwright geliştirme bağımlılıkları üretim runtime'ına taşınmaz. React veya başka framework/oynatıcı kütüphanesi sırf UI düzeltmek için eklenmez.

### Tespit, kontrol ve iframe

- Tier 1 site adaptörleri: Kick, TRT, Now, Puhu. Tier 2 bağlı kütüphaneler: YouTube, Video.js, Hls.js, Shaka, Dash. Tier 3 HTML5/açık Shadow DOM taraması. `probeAdapterHealth` ve cascade korunur.
- Site adı tek başına oyuncuyu belirlemez. Aynı site farklı içerikte farklı player/iframe kullanabilir; aynı library birden çok sitede ortak olabilir. SDK'nın **seçili video ile gerçek sahipliği** doğrulanır. Sınıf adı veya ilgisiz global API varlığı başarı değildir.
- Video/SDK/kaynak/srcObject/medya epoch değişimi eski kontrol hedefini geçersiz kılar. Oturum, sahiplik ve envanter revizyonu farklı kavramlardır. Hız/ses gibi temel komutlar yalnız kalite listesi revizyonu değişti diye reddedilmez; indeksli kalite/hedef seçimi güncel envanter ister.
- Normal görünümde üst HUD, medya işlemleri kaynak iframe'de; fullscreen'de sunum kaynağa geçebilir. Aynı anda tek görünür HUD hedeflenir. Doğrudan video fullscreen/PiP ile wrapper fullscreen aynı değildir.
- MAIN dünya, DOM ve `postMessage` gizli kanal değildir. Sayfa script'lerine karşı kimlik doğrulanmış güvenlik alanı veya mutlak anonimlik iddiası yapılmaz.
- HUD etkileşimlerinde olay izolasyonu (`stopPropagation`) korunur. Kaynak değişince eski komut/filtre/kalite/altyazı/SDK nesnesi yeni hedefe uygulanmaz.

### Ses, hız, kalite ve reklam

- DRM/EME algılanan medyada Web Audio booster atlanır; native ses yolu korunur. DRM'yi aşma veya %100 üstüne zorlamaya çalışma yoktur.
- Kick'in React/IVS yakalama ve setter önbelleği korunur; her tıklamada bütün DOM/Fiber taraması yapılmaz. Gerçek medya değişimi, SDK seçimi ve sitenin görünür kontrol durumu ayrı doğrulanır.
- Kalite için istek, API/menü seçimi ve decoded görüntü ayrıdır. Bir SDK'nın “480p seçildi” demesi görüntünün değiştiğini kanıtlamaz. `timed-out` durumunu sırf menü eşleşti diye başarılıya çevirme.
- Gerçek envanter yoksa seçenek uydurulmaz. Tek HLS seviyesi, bütün kaynakta tek kalite bulunduğunu kanıtlamaz. `playlistMapping` yalnız RAM içindeki adres eşleşmesini sabit kategoriye indirger; adres/manifest dışa çıkmaz. Farklı adresler farklı görüntü içeriklerini de tek başına kanıtlamaz.
- Reklam beklentisi: açık ve seçili oynatıcıya bağlı işarette 16x isteği + mute + güvenle geri getirilebilir gerçek en düşük kalite; çıkışta **1x** ve önceki ses/mute/kalite veya ABR. Önceden mute olanı zorla açma. Manuel hızlandırmanın çalışması otomatik reklam algılama kanıtı değildir.
- **Puhu'nun eski manuel HD kaynak yeniden deneme seçeneği korunacak.** Tek başarısız deneme, kullanıcının birkaç denemede HD yakaladığı gözlemini çürütmez. Daha iyi çözümle yerinin dolduğu doğrulanmadan kaldırma.

### Rapor

- Şema v2; varsayılan platform `other`, site ve açıklama kapalı. Oynatıcı türü site/platform adı değildir.
- Kullanıcı site bilgisini seçerse önizlemede gösterilen alan adı ve platform eklenir; tam URL, içerik yolu, sorgu, izleme konumu veya kaynak URL'si eklenmez. Üst sayfa/iframe bağlamı ayrılır.
- Açıklama açık rızayla eklenir, mevcut görünür sınır 4000 karakterdir. Otomatik anonimleştirilmez; sayfa içindeki metnin site script'lerinden gizli olmadığı açıklaması korunur.
- Otomatik gönderim yoktur. JSON metin olarak önizlenir/kopyalanır; paylaşım URL'sine rapor veya yorum gömülmez. Silme seçeneği yalnız talep ekler; issue/kopyaların silinmesini garanti etmez.
- Günlük sınırlı RAM tamponu ve allowlist olaylarıdır; sayfa konsolunu, kimlikleri, altyazı metnini veya serbest hata stack'lerini toplama.
- **Issue kuralı (kullanıcı kararı):** geliştirme aşamasında kullanıcının kendi diagnostic issue'larındaki alan adları, ajanların siteyi bilebilmesi için bilinçli olarak vardır; eskiyenleri kullanıcı siler. İleride alan adı yalnız kullanıcı isterse eklenir. Değerler bu belgeye, iş kayıtlarına veya commit mesajlarına kopyalanmaz. Public issue dışı kanal D-13'te karar bekler.
- **Issue sürümü bayatlık kanıtı değildir:** Sürümler sırayla farklı alanlarda ilerler; raporun eski numaralı olması sorunun çözüldüğünü veya geçersiz olduğunu göstermez. Çözüldü demek için aynı akış güncel kaynakta sınanır.

## 4. Son kontrol noktalarında yapılanlar

| Sürüm | Değişiklik | Kanıt ve açık sınır |
|---|---|---|
| 0.7.7.3 | Standart MIT LICENSE, metadata/bildirim kontrolleri; ayrı FilmDeck yayın adaptöründe lisansların pakette korunması | Kaynak ve sentetik paket testleri; gerçek mağaza yayını değildir. |
| 0.7.7.4 | İframe Stereo/Mono seçili durumları + aria-pressed; küçültme tercihini fullscreen arasında eşleme | Yerel iki motorlu kabul; gerçek site konumu/çift HUD bütünüyle kapanmadı. |
| 0.7.7.5 | PiP etkileşim yetkisi gerekirse kaynakta gerçek tıklama onayı; hata kategorileri ve durum aktarımı | Yerel Firefox/Edge native PiP; site izinlerini aşmaz, I-09 açık. |
| 0.7.7.6 | YouTube Trusted Types/CSP için destek varsa native güvenli setHTML, legacy geri dönüş; toolbar MAIN başlatma; iframe temel komut/sahiplik ayrımı | Gerçek Firefox toolbar açılışı ve yerel iki motorlu regresyon; tüm video/kalite akışları kabul edilmiş sayılmaz. Eski commit `aad4b4c`. |
| 0.7.7.7 | Video.js etiketlerinin ortak playlist'e bağlı olmasını açıklayan EN/TR notu ve sınırlı `playlistMapping` | Bir örnekte site menüsü de decoded kaliteyi değiştirmedi. Denenen eski tampon flush'ı çözmedi; otomatik flush çözümü üretime eklenmedi. I-05/I-06 açık. |
| 0.7.7.8 | Filtre yazımını video karesine birleştirme; 50 ms geri dönüş, eski hedef/kaynak/stream/oturum korumaları ve 200 ms cache regresyonu | I-01 dar hedefi tamamlandı; stil yazımları azaldı, genel CPU kazancı veya bütün sitelerde kasmasızlık iddiası yok. FILTER_PERFORMANCE.md. |
| 0.7.7.9 | Rapor kökünde oynayan videoya sürekli uygulanan backdrop blur kaldırıldı; karartma/JSON/paylaşım korundu | I-02 dar hedefi tamamlandı; aynı oturumda blur aç/kapat GPU motor yükünü değiştiriyor. JSON darboğazı saptanmadı; 20 ek döngü son kaynakta rapor nesnesi birikimi göstermedi. REPORT_PERFORMANCE.md. |
| 0.7.8 | Açık panel video kaybolunca iframe aramasını yeniler; taşınan panelin yeri kaynak değişiminde korunur ve iframe tam ekranında 0–1 oranıyla aktarılır; "video yok" uyarısı paneli ekran dışına taşırmaz | I-08 yerel iki motorlu kabul (`tests/hud-continuity-browser.cjs`). #80 ve #94 yerelde üretilmedi. Gerçek site kabulü açık. |
| 0.7.9 | Dört pencere gerçek dialog oldu (odak, Tab, Escape, odağı geri verme, ARIA); kısayollar pencere içinde çalışmaz; adaptör seçenekleri ve DRM rozeti düğme oldu; Firefox tam ekran çıkışındaki yer yarışı düzeltildi | D-02 yerel iki motorlu klavye kabulü (`tests/dialog-keyboard-browser.cjs`). Ekran okuyucu ve gerçek site kabulü açık. |

Son ölçümler kişisel profil/yorum kullanmadı. Sentetik test, gerçek site kabulü yerine geçmez. Video sayacında 0 düşen kare fiziksel ekranda hiç takılma olmadığını kanıtlamaz. CPU süreç alt ağacının çekirdek eşdeğeridir, GPU motor toplamı cihaz kullanım yüzdesi değildir. Tarayıcı süreç RAM'ini eklentinin tek başına tüketimi sayma. Toplam native/cache ayrımı D-01'de açık.

## 5. Kullanıcı kararları

- **Sürüm numarası:** `1.0.0` en stabil ilk çıkış sürümüdür. Öncesinde `0.x.0` milestone geçişi, `0.0.x` küçük geliştirme, `0.0.0.x` çok küçük değişikliktir. **Geçici düzen (kullanıcı, 5 Kasım; 4 Kasım'daki üçüncü bölüm sınırının yerine geçer, kesin karar B5'te bekliyor):** `0.milestone.düzeltme.küçük`. Üçüncü bölüm milestone gelene kadar sınırsız artar, dördüncü bölüm **en fazla 9**. `0.7.9.9` sonrası `0.7.10`, `0.7.10` sonrası küçük adım `0.7.11`, çok küçük adım `0.7.10.1`'dir; `0.7.9.10` olmaz. Milestone yalnız kullanıcı kararıyla artar. Üretim kodu değişmeyen belge/devir işinde sürüm artırılmaz.
- Varsayılan arayüz İngilizce, Türkçe seçilebilir; tercihler RAM'de. UI çevirisi kullanıcı yorumuna/altyazıya/JSON'a uygulanmaz.
- Üç temel dikey sekme: Player, Subtitles, Settings. Video renkleri Settings'te, adaptör Player'da. Seçili sekme/yüzey birleşimi german_7619 referansından uyarlanır; native klavye/ARIA korunur.
- **20 tema kalıcı olarak korunuyor (kullanıcı, 5 Kasım):** finalist beş tema seçilmeyecek; insanların çeşit arasından seçebilmesi tercih edildi. Kendiliğinden ayıklama veya yeni renk sistemi yok.
- FilmDeck ürün logosu üstte; NOk amblemi ve sürüm Settings → About FilmDeck içinde. Kullanıcının kaset deck çizimi tüm arka katmanlarıyla ikonlaştırılır; yalnız ön kasete kırpılmaz. Özgün çizimler korunur.
- Ortak SVG çizgi üslubu var; kalan emoji/simgeler kullanıcıyla birlikte kararlaştırılacak. Sessiz toplu değişiklik yapılmaz.
- Uiverse uyarlamaları birebir tüm animasyonları taşımaz. Kullanılan ve bekleyen farklar ANIMATION_DETAILS.md / DESIGN_REFERENCES.md içindedir. Yeni halo/glow/gecikme/dekor eklemek hata düzeltmesi sayılmaz.
- HMI sunumu ayrı akademik çalışmadır: Part-1 ilerleme, İngilizce slayt, kullanıcının tercihi Türkçe anlatım. Prototipin dersten önce başlaması bilinir. Ders PDF'si/güncel yönerge okunmadan eski tarih veya değerlendirme koşulu kesinleştirilmez; bu iş uygulama hedefinin kapanış koşuluna kendiliğinden eklenmez.

## 6. Issue kaynaklı güncel envanter

| Kod | İş | Durum / kalan kabul |
|---|---|---|
| I-01 | Video filtrelerinde kasma | **Dar hedef tamam:** iki motorlu ölçüm/iyileştirme/sınırlar. Yüksek çözünürlük, farklı donanım ve tüm gerçek siteler için evrensel çözüm değil. |
| I-02 | Rapor penceresi performansı | **Dar hedef tamam:** açılış/toplama/JSON/yazma ve döngü ölçüldü, backdrop yükü azaltıldı. Native RAM/soğuk gecikme değişkenliği belgeli. |
| I-03 | Kick ses/hız görünür UI eşleşmesi | **Ses kısmı düzeltildi (v0.7.10):** panel gerçek ses düzeyiyle açılır ve sitenin değişikliğini izler; oynatıcıya verilen ses sitenin simgesine yansır. Gerçek Kick'te kurulu eklentiyle sınandı. Sitenin kaydırıcısının ve VOD hız menüsünün görsel kabulü açık. |
| I-04 | Gerçek reklam döngüsü | Açık: gerçek işarette giriş/çıkış, uygulanmış hız/kalite ve güvenli geri yükleme. Kaynak/sentetik testler var. |
| I-05 | Eksik kalite seçenekleri | Kısmi: Kick'te 5 kalite listelendi ve 160p çözülmüş görüntüyle doğrulandı (5 Kasım, iki motor). Diğer siteler açık: sitenin kendi menüsünde olanları seçili player envanteriyle karşılaştırmak. Site menüsünde de yoksa otomatik hata değil. |
| I-06 | Seçim var, görüntü değişmiyor | Kısmi: ortak playlist teşhisi eklendi. Diğer örneklerin decoded geçişi/gerçek kaynağı açık; menü seçimini başarı sayma. |
| I-07 | Kontrolün sonradan kaybolması ve ses–görüntü kayması | **Askıda (kullanıcı kararı, 4 Kasım).** Sentetik Hls.js ölçümü kayma birikimi veya komut kaybı üretmedi; gerçek site otomasyon profilini bot korumasıyla geçirmedi; kök neden bulunmadı (ACTIVE_WORK.md, `tests/av-sync-browser.cjs`). Kaynak: [#104](https://github.com/NOkrep/NOk-video-controller/issues/104) (Firefox, Hls.js, üst çerçeve, tek video). Sahiplik düzeltmeleri ağırlıkla iframe/medya değişimine yöneliktir; bu rapor iframe değildir ve bağlantıları ölçülmedi. Rapordaki 20 olay yalnız istekleri gösterir, kaybolma anı yoktur. Üretim kodu, rapor ve testlerde kayma ölçümü yok; önce güncel kaynakta yeniden üretim ve ölçüm yöntemi gerekir. Kullanıcıya göre sorun, hatırladığı kadarıyla çözecek bir değişiklik yapılmadığı için büyük olasılıkla sürüyor; bu henüz sınanmadı. |
| I-08 | HUD konumu, sayfa geçişi, olası çift panel | **Yerel kapsam tamam (v0.7.8):** #97 ve #110 yeniden üretilip düzeltildi. Taranan akışlarda çift görünür panel (#80) ve kendiliğinden kapanma (#94) üretilmedi; bu, gerçek sitelerde olmadığını kanıtlamaz. Gerçek site kabulü ve kaynak `video` öğesinin `readyState 0` ile kaldığı geçişler açık. |
| I-09 | Raporlanan sitelerde PiP | Kısmi: yerel onay çözümü geçti; gerçek site izinleri ve normal/fullscreen geçişleri açık. |
| I-10 | Kontrol düzeltmelerinin gerçek site regresyonu | Mono/Stereo, geç keşif, beklenmedik aç/kapat, TRT hız korumasını raporlanan akışta sınamak; yapılanı baştan yazmamak. |
| I-11 | Altyazı sonrası bekleme/görünmeme | Ağ beklemesi, etkin cue boşluğu, disabled ve gerçek çizim hatası ayrılacak. |
| I-12 | CDN yanıt ölçümünün anlaşılması | **Yerel kapsam tamam (v0.7.9.1):** düğme yöntemi ve ölçülememe nedenini gösteriyor, iframe oynatıcıda açıklama kayıp değil, eski kayıt yaşıyla bildiriliyor. Altı sunucu yanıtı ve iki iframe senaryosu iki motorda sınandı. Gerçek CDN'lerde kabul açık. |
| I-13 | Kalan emoji ve simgeler | **Codex'te (kullanıcı, 5 Kasım):** envanter çıkarılıp kullanıcıyla SVG/kaldırma kararı verilecek. |

Kullanıcının “hareketsizlikten sonra panel hiç geri gelmiyor” gözlemi daha sonra düzeltildi; kesin hata diye tutma. Aynı yapıştırılmış rapor iki ayrı issue değildir. “Eksik kalite” kullanıcının site menüsünde karşılaştırdığı durumdur; “hiç kalite görünmüyor” ayrı durumdur. Ham raporlar ve alan adları bu belgeye taşınmaz.

## 7. Issue dışındaki işler

| Kod | İş | Durum / kapsam |
|---|---|---|
| D-01 | Uzun süreli bellek kararlılığı | **Dar hedef tamam (4 Kasım):** 15 dakikalık oynatma ve 90 video değişiminde eklentiye özgü büyüyen sızıntı bulunmadı; Edge renderer büyümesi eklentisiz de aynı. Firefox'ta boost'lu videoların askıdaki bağlamları tarayıcı toplayana kadar geçici bellek tutar. Saatlik oynatma, gerçek MSE/HLS, 4K, çok sekme maliyeti ve tahsisin kesin nedeni açık. MEMORY_MEASUREMENTS.md. |
| D-02 | Dialog ve adaptör klavye erişilebilirliği | **Yerel kapsam tamam (v0.7.9):** başlangıç odağı, Tab çevrimi, Escape, odağı geri verme ve klavyeyle adaptör seçimi iki motorda sınandı. Gerçek ekran okuyucu, açık `select` listesinde ve tarayıcı tam ekranında Escape davranışı açık. |
| D-03 | Ekran okuyucu ve gerçek %200 zoom | CSS ölçeği/otomatik test bunun yerine geçmez. Uzun metin, hedef boyutu ve duyurular açık. |
| D-04 | Fullscreen tema/erişilebilirlik tutarlılığı | **Yerel kapsam tamam (v0.7.9.2):** tema ve dört erişilebilirlik anahtarı iframe tam ekranına geçer, oradaki değişiklik çıkınca korunur; iki motorda sınandı. Gerçek sitede kabul açık. |
| D-05 | İstenen ve gerçekleşen ses/hız geri bildirimi | Raporlarda ayrım var; ana UI'da ayrışmayı anlaşılır gösterme açık. |
| D-06 | Mevcut ses ve altyazı parçalarını seçme | Kullanıcının gelecek özellik talebi; orijinal/dublaj ve hazır altyazılar. Harici SRT'den ayrı; henüz uygulanmadı. |
| D-07 | Finalist beş tema | **Kapandı (kullanıcı, 5 Kasım):** finalist seçilmeyecek; kullanıcıların seçebilmesi için 20 tema kalıyor. |
| D-08 | Ek Uiverse animasyonları | İsteğe bağlı denemeler; zorunlu hata düzeltmesi değil. |
| D-09 | Form/tooltip referansları | Uygun kullanım bekleyen adaylar; sırf referans var diye eklenmez. |
| D-10 | Git/CI takibi | **Tamam (4 Kasım):** `report` zorunlu işe, `quality-mapping` zorunlu olmayan `Browser media` işine eklendi. Hangi testin neden yerelde kaldığı TESTING.md'de. `Browser media` kararlı görülürse zorunlu kontrollere alınması kullanıcı kararıdır. |
| D-11 | Çalışma kayıtlarının sadeleştirilmesi | **Tamam (4 Kasım):** ACTIVE_WORK.md kısa güncel durumla başlıyor; eski kayıtlar değiştirilmeden WORK_HISTORY.md'ye taşındı; belge haritası §9'da. Eski belgelerin içeriği yeniden yazılmadı, kendi tarihlerinin kanıtıdır. |
| D-12 | Git, CI/CD ve yayın otomasyonu | Kullanıcı hedefi: adım adım komut kopyalamak yerine, ajanın kullanıcı talebi ve onayıyla yürütüp izlediği genel yapı. FilmDeck'in hedefi yalnız GitHub ve eklenti mağazalarıdır; sunucu dağıtımı yoktur. Commit ve push ajandadır; PR ve merge kullanıcıda; mağaza gönderimi sürüm ve hedef onayı ister. Mağaza ve diğer sırlar GitHub'a girmez; ajan gerekmedikçe erişmez. |
| D-13 | Alan adlı raporların gizli kanalı | Yayın öncesi karar: alan adı içeren raporun public issue yerine özel kanala gitmesi. Rapor UI'ı değişeceği için ayrı iştir; henüz uygulanmadı. |
| D-14 | Firefox veri toplama beyanı | AMO'nun `data_collection_permissions` gereksinimi mağaza başvurusundan önce resmî kaynaktan doğrulanacak. Manifest ve yayın hedefinde alan yok. |

## 8. Sıradaki öneri ve eklenecek hedef metni

**Kullanıcının seçtiği sonraki işler (5 Kasım):** D-06, I-11, I-03, I-04, I-05, I-09, B6-C (canlı test yolu) ve CI-2 (`Browser media` işini zorunlu kontrole almak); sırayı Claude önerir, başlangıç kullanıcının molasından sonradır. I-13 Codex'te. I-10 canlı oturumlara dahil edildi. D-08: rapor penceresi animasyonları ve geniş eklemeler için önce performans ölçümü. D-09: tooltip yapılacak, form bekliyor. Sürüm kuralının kesin hali (B5) bekliyor. Kullanıcı ek istekler ve tersine mühendislik araçları yazacak; araçlar güvenlik akışından geçmeden kullanılmaz.

**Kullanıcının seçtiği öncelikler (4 Kasım):** Codex kendi araç sistemi notlarını kapattı ve yedi beceri kapsamının onayını yeniledi (`D:/NOk-Tools/AGENT_NOTES.md` N-001, N-004, N-006; geçerlilik 11 Kasım akşamına kadar). Claude şu işleri ele alır:

1. **Tamam:** Katalogdaki üç eski durum etiketi (N-002).
2. **Tamam:** `NOk-FilmDeck-Release` lisans paketlemesini Codex commit'ledi (`b1d933c`, `codex/ww28-private-evidence`). O deponun PR ve merge'ü kullanıcıda.
3. **Ertelendi (kullanıcı, 4 Kasım):** Canlı test için C yolu seçildi ama kullanıcı şimdilik yapmak istemiyor: önce panelde eklentisiz site gözlemi, sonra hesapsız temiz profilde gerçek FilmDeck (bu bölümün sonundaki sınama). Kullanıcı isteyince başlar; yeniden sormaya gerek yok.
4. **Yerel kapsam tamam (v0.7.9.1):** I-12.
5. **Yerel kapsam tamam (v0.7.9.2):** D-04.
6. **Tamam:** D-10.
7. **Tamam:** D-11.

Bu seçim, aşağıdaki önceki önerinin önüne geçer. Önceki öneri kayıt için durur.

Önerilen sıra: **I-03 → I-04**, ardından kalan kalite/PiP/gerçek site kabulü ve erişilebilirlik. I-07 askıdadır; aşağıdaki hedef metni yalnız kullanıcı ona dönerse geçerlidir. Kullanıcı önceliği değiştirebilir. Tek geniş “her şeyi düzelt” hedefi yerine her biri kanıtlanabilir kapsamla yürütülür.

> Firefox ve Chromium’da kontrolün sonradan kaybolması ve ses–görüntü kayması raporunu incele. Medya, oynatıcı ve kaynak değişimlerinde komutların seçili videoya ulaştığını doğrula; senkron kaymasını kontrol kaybından ayrı ölç. Kanıtlanan nedenleri düzelt, aynı akışları tekrar doğrula ve üretilemeyen belirtileri açıkça belgele. Kullanıcı gizliliğini ve RAM-only mimariyi koru. Her sürüm artışını bildir. İşi kendi dalında commit'le, push et ve PR bağlantısını bildir; PR ve merge kullanıcıdadır, ZIP veya release ayrıca istenmedikçe yapılmasın.

İlk adım düzeltme değil, #104 akışını güncel kaynakta yeniden üretmek ve kaymayı ölçecek yöntemi kurmaktır. Web Audio gecikmesi yalnız sınanacak bir hipotezdir. Bu metin öneridir; aktif hedef oluşturma/başlatma talimatı değildir. Bir belirti yeniden üretilemiyorsa sırf başka test geçti diye “çözüldü” deme. Sentetik fixture ile komut sahipliği regresyonu ve gerçek rapordaki senkron kabulü ayrı kanıtlardır.

### Değerlendirilip reddedilen seçenekler

Bu seçenekler silinmez. Gerektiğinde gerekçesiyle kullanıcıya yeniden sorulabilir; kullanıcı onaylamadan uygulanmaz.

| Seçenek | Karar ve gerekçe (4 Kasım 2026) | Yeniden değerlendirme |
|---|---|---|
| I-07 ölçüm kopyası: kullanıcının normal Firefox'unda geçici eklenti, işaret düğmeleri ve yalnız sayısal dışa aktarım | Reddedildi: kullanıcı hesaplı tarayıcısının teste girmesini ve oraya bir şey eklenmesini istemiyor. Taslaklar kenarda: `tests/av-live-probe.js`, `tests/prepare-av-live-copy.cjs`, `tests/av-live-copy-check.cjs`. **Hiç çalıştırılmadı, doğrulanmadı.** | Gerçek site kanıtı başka yolla alınamazsa sorulabilir. |
| `gh` kurup PR'ları ajanın açması | Reddedildi: `main` kuralı onay istemediği için token checkler geçince merge'ü teknik olarak engellemez; kullanıcı PR ve merge'ü kendinde tuttu. | Tam otomasyon istenirse; ayrı bot hesabı seçeneğiyle birlikte. |
| Üretim veya mağaza sırlarını GitHub Secrets/Environment'ta tutmak | Reddedildi: sırlar GitHub'a girmez; workflow'u değiştirebilen ajan sırra dolaylı ulaşabilir. | Kullanıcı ayrıca gündeme getirirse. |

**Ajan paneli önerisi:** Kullanıcı canlı testin ajanın tarayıcı panelinde, doğrulamayı kendisi tamamlayarak birlikte yapılmasını önerdi. Kullanıcının doğrulamayı tamamlaması ajan sınırına aykırı değildir; ajan doğrulamayı çözmez ve otomasyon işaretini gizlemez.

**Panel sınaması (4 Kasım):** FilmDeck panele kurulamıyor. Panel gömülü bir Chromium 152'dir; `chrome://` sayfaları açılmıyor, sayfada eklenti API'si yok, araçlarda eklenti yükleme yolu yok. Panel yalnız siteyi eklentisiz gözlemek için kullanılabilir: MSE, H.264, PiP ve tam ekran var, Widevine yok (DRM'li içerik oynamaz), `navigator.webdriver` `false`. Yol seçimi kullanıcıdadır.

## 9. Kaynaklar, komutlar ve kabul seviyesi

| Alan | Öncelikli kaynak |
|---|---|
| Ana çalışma motoru / UI | injected.js, injected.css |
| Başlangıç / toolbar | content.js, background.js, manifest.json |
| İframe mesaj şeması | frame-protocol.js, FRAME_PRESENTATION.md |
| Kalite / reklam | QUALITY_CONTROL.md, AD_CONTROL.md, LIVE_SITE_VALIDATION.md |
| Son performans | FILTER_PERFORMANCE.md, REPORT_PERFORMANCE.md |
| Bellek | MEMORY_MEASUREMENTS.md; tarihli kısa/uzun deneyleri ayır |
| Tasarım / HMI | HMI_REVIEW.md, ANIMATION_DETAILS.md, DESIGN_REFERENCES.md |
| Güncel iş kaydı | Bu dosya + ACTIVE_WORK.md (başında kısa güncel durum) |
| Tarihsel kayıt | WORK_HISTORY.md (eski iş kayıtları, değiştirilmeden), DEVELOPMENT_STATUS.md, RELEASE_NOTES_v0.7.0*.md; RELEASE_ROADMAP.md eski v0.6→0.7 planıdır. PROJECT_MASTER_GUIDE.md §5 sürüm evrimidir |
| Sürüm değiştirme | `node scripts/set-version.cjs <sürüm>`; manifest, paket, motor, CSS, README, kılavuz ve ACTIVE_WORK birlikte güncellenir |
| Testlerin kurulumu ve sınırları | TESTING.md, package.json, .github/workflows/quality.yml |

Node 24 önerilir, en az 22. `npm run check` kaynak/sürüm/izin/lisans + Node test kapısıdır. UI değişince ilgili gerçek kurulu Firefox/Chromium testini çalıştır; yeni ters örnek veya kaynak değişikliği yokken bütün benchmark'ları gereksiz tekrar etme.

```powershell
npm run check
node tests/ui-smoke.cjs --engine=firefox --narrow=true
node tests/ui-smoke.cjs --engine=chromium --narrow=true
node tests/hud-state-browser.cjs --engine=firefox
node tests/hud-state-browser.cjs --engine=chromium
# İlgili alana göre: startup-browser.cjs, pip-browser.cjs, quality-mapping-browser.cjs, report-browser.cjs
```

Tarayıcı testleri mevcut Playwright ve kurulu tarayıcıları kullanır; varsayılan Chromium yürütülebilir dosyası Edge'dir. Chrome/Brave aynı motoru kullanıyor diye ayrıca denenmiş sayılmaz. Geçici profiller kullanılır; kişisel Firefox profili ve çerez/geçmiş okunmaz. Performans benchmark'ları sırayla, rekabet eden başka benchmark olmadan yürütülür.

Kalite/rapor/performance testlerinin bazısı Git dışı üretilmiş medya veya runtime fixture'ı ister. Eksik fixture'ı tahminle geçme; TESTING.md'yi oku. Kaynak indirme/kurulum gerekiyorsa mevcut güvenlik/izin sınırlarını uygula. `tests/artifacts/`, `dist/`, `node_modules/` Git dışıdır. Özel test notları da ignore edilir; izin almadan bunları yayımlama.

Kabul basamakları ayrı yazılır: kaynak kontrolü → model/sentetik test → gerçek kurulu eklenti → gerçek site → kullanıcı kabulü → uzak CI → paket/mağaza kabulü. Bir basamak diğerinin yerine geçmez. Codex devrinde eski testler yeniden çalıştırılmadı; mevcut log/kanıtlar okundu. Claude kabulünde (4 Kasım, üretim kaynağı `d70940e` ile aynı) `npm run check` ve `hud-state-browser.cjs` Firefox 159 / Edge 152'de geçti. Kaynak değiştiğinde eski kabul hash'ini yeni kaynak için kullanma.

## 10. Sonraki ajanın devir notu

Görev sonunda bu dosyanın yalnız güncel bölümünü ve ACTIVE_WORK.md'nin en üst kaydını güncelle: görev sahibi, dal/HEAD/dirty kapsamı, sürüm, son kesin çıktı/komut, çalışan süreç veya iş handle'ı, açık belirsizlik, güvenli sonraki adım ve bekleyen izin. Sır, kişisel alan adı, kullanıcı yorumu veya ham heap ekleme. Diğer ajanın neyi okuduğunu/doğruladığını varsayma; kısa kabul özeti iste. Aynı dosyayı eşzamanlı düzenlemek yerine görev/dosya sahipliğini belirle.
