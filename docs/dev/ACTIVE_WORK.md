# Etkin çalışma kapsamı

## Güncel durum

5 Kasım 2026. Ayrıntılı envanter PROJECT_HANDOFF.md §6-8, aşağıdakiler en yeni kayıtlardır. Daha eski kayıtlar değişmeden [WORK_HISTORY.md](../history/WORK_HISTORY.md) içindedir.

- **Sürüm:** Kaynak sürümü **v0.8.3.4**, `codex/filmdeck-cassette-icon` dalında; taban `main` #131 (`2efadc1`). PR ve merge kullanıcıda. Sürüm `node scripts/set-version.cjs <sürüm>` ile değiştirilir; araç bu satırı günceller. Geçici düzen `0.milestone.düzeltme.küçük`: üçüncü bölüm sınırsız, dördüncü en fazla 9; kesin karar (B5) bekliyor.
- **Yerel kapsamı biten:** I-08, I-12, D-01 (dar hedef), D-02, D-04, D-08 (rapor kapsamı), D-09 (tooltip), D-10, D-11, I-11.
- **Seçildi, Codex yürütüyor (21 Kasım, N-039):** I-10 + I-09 gerçek site regresyonu, I-03 Kick (reklam görülürse I-04), I-05 kalite envanteri, D-06 gerçek parça seçimi ve Firefox test güvenilirliği. Claude incelemeyi yürütüyor. B6-C bu beş işin dışında.
- **I-13:** tamamlandı ve Claude incelemesinden geçti.
- **Kapandı:** D-07; finalist seçilmeyecek, 20 tema kalıyor.
- **Karar bekliyor:** B5 kesin sürüm kuralı.
- **Seçilmedi:** I-06, D-03, D-05, D-12, D-13, D-14, kalan gerçek site kabulleri.
- **Askıda:** I-07.
- **Araç sistemi:** `D:/NOk-Tools` açık iş notu yok; beceri onayları 11 Kasım akşamı dolar. Yeni adaylar için dört aşamalı inceleme kuruldu (aşağıda).
- **13 Kasım:** Kullanıcı C araç çubuğunu (MEC523 Alternatif C, B'nin sekme mantığıyla) sıradaki iş seçti; önce görsel model örnekleri. I-03'ün kullanıcı denemesi aşağıda, kök neden incelenmedi.
- **16 Kasım — milestone 0.8 (araç çubuğu) tamam:** kullanıcı karşılaştırmayı bitirdi ve iki gerçek sitede denedi; sürüm `0.8.0`. Sıradaki seçili işler: I-03, I-04, I-05, I-09 ve I-10, D-06.
- **17 Kasım — v0.8.1:** kullanıcı raporundan altyazı zamanla kayma düzeltmesi ve raporda kayma değeri (aşağıda).
- **17 Kasım — v0.8.2:** büyük kayma için kaymayı elle yazma ve "Şu an bu satır" (aşağıda).
- **19 Kasım — v0.8.3:** kullanıcı uzaktayken Claude'un seçtiği beş hedef (aşağıda): D-06 ses ve altyazı parçaları, araç çubuğunun kaydırma çubuğu kayması, Firefox `hud-continuity` incelemesi, beceri onayları (kullanıcı onayı bekliyor).

## N-039 · 1. I-10 / I-09 gerçek site regresyonu — 21 Kasım 2026

- **Taban ve kapsam.** v0.8.3.4, `2efadc1`. Codex iş devri ve gerçek site deneme kaydı bu dosyada güncellendi. Kurulu Edge 152 ve Firefox 160.0.1, ayrı geçici profiller.
- **Raporlu örnek A.** İki motorda tarayıcı eklenti eylemi varsayılan araç çubuğunu açtı. Kontrol iframe'deki hazır videoya ulaştı. 1,5× hız, %0 → %40 → %65 ses, Mono → Stereo, harici sentetik altyazı yükleme durumu ve PiP açılışı gözlendi. Arayüz iki motorda ölçülen görünür alanın içindeydi. Araç çubuğu 480/720/1080 sundu. 1080 isteğinden sonra iki motorda görüntü 720 kaldı ve seçili kalite onaylanmadı. Bu sonuç önceki örnekle uyumlu. Görüntünün değişmemesinin nedeni bu turda doğrulanmadı.
- **Raporlu örnek B.** İki motorda temel kontroller, altyazı yükleme durumu ve PiP açıldı. Oynatma çerçevesi motora göre farklıydı. Araç çubuğunda yalnız 1080 seçeneği görüldü. Yerel menü karşılaştırması I-05 kapsamında. Ölçülen panel görünür alandaydı.
- **Başlangıç ölçümü.** İlk yardımcı dış kapsayıcıyı ölçtüğü için görünür çubuğu kaçırabiliyordu. Ölçüm gerçek araç çubuğuna taşındı. Erken okunan Stereo durumuna da kaynak yanıtını bekleyen bir denetim eklendi. Bu değişiklikler yerel yardımcıya ait.
- **Ek ölçüm.** Örnek A'da iki motorda araç çubuğu sürükleme sonrası ekranda kaldı. PiP kapatıldı ve yeniden açıldı. Sentetik altyazı satırının görünür çizimi de iki motorda doğrulandı. Aynı kökenli iframe'de katman üst belgede olabildiği için yalnız video çerçevesine bakan ilk yardımcı satırı kaçırmıştı.
- **Kontroller.** `npm run check` geçti. `toolbar-browser`, `pip-browser` ve `ui-smoke` geniş/dar biçimleri başsız Edge ve Firefox'ta 8/8. Bu komutların sonuçları ayrı yerel günlüklerde.
- **Kalan kapsam.** Kullanıcı tarafından bildirilen diğer oynatıcılar ve gerçek sitedeki tam ekran geçişi açık. İki oynatıcı üzerinden genel site uyumluluğu çıkarılamaz. Anonim yerel kanıt `tests/artifacts/n039-live-*.json` altında. Kök neden atanmayan vakalarda ürün değişikliği ve sürüm artışı yok. Claude incelemesi bekliyor.

## N-039 · 2. I-03 / I-04 yayın kontrolleri — 21 Kasım 2026

- Kurulu eklentiyle iki motorda ayrı test profillerinde açık yayın kartı, canlı kanal ve geçmiş yayın örnekleri denendi. Bu koşularda seçilebilir, hazır medya oluşmadı. Geçmiş yayın rotasına ulaşmak, geçmiş yayının oynadığını göstermedi. Canlı uçtaki hız davranışı, sitenin hız menüsü ve %0'dan sonraki ses değişiklikleri bu yüzden yeniden üretilemedi.
- Kodda medya hızı ile sitenin hız menüsü ayrı yollardır. Ses tarafındaki Radix geri çağrısı DOM sahibine bağlı önbellek kullanır. Eldeki canlı gözlem, hangisinin kullanıcı örneğinde bozulduğunu belirlemiyor. Yerel `node --test tests/kick-ui.test.cjs tests/kick-quality.test.cjs` 8/8 ve `npm run check` geçti. Bu testler yerel menü algoritması ve bağlı oynatıcı davranışını sınar.
- Açılan canlı ve geçmiş yayın örnekleri kullanıcıdan istendi. Canlı reklamın giriş/çıkışı gözlenmedi. Ürün kodu ve sürüm aynı kaldı. Claude incelemesi bekliyor.

## N-039 · 3. I-05 kalite envanteri — 21 Kasım 2026

- **Örnek A.** İki motorda video sahibinin kendi DOM menüsünde dört öğe ve sayısal olarak 480/720/1080 bulundu. FilmDeck'te üç sayısal seviye de vardı. Yalnız metnin kendi sayısal kısmını okuyan ikinci ölçüm, bazı örnek ölçümlerde rozet metninin sayıları gizlediğini gösterdi. Kaynağın nihai 1080 görüntü geçişi I-10 kaydındaki gibi doğrulanmadı.
- **Örnek B.** FilmDeck tek 1080 seçeneği sundu. Denenen Firefox oturumunda seçili video sahibinde bilinen yerel menü öğeleri bulunmadı. Başka içerik veya menü yapısı için sonuca varılmadı.
- **Açık ve kanıt.** İki örnekte eksik olan doğrulanmış bir yerel kalite saptanmadı. Kullanıcıdan FilmDeck'te eksik görünen bir yerel seviye örneği istendi. `npm run check` ve `node tests/quality-mapping-browser.cjs --engine=chromium|firefox` ayrı koşularda geçti. Sürüm v0.8.3.4. Claude incelemesi bekliyor.

## N-039 · 4. D-06 gerçek altyazı seçimi — 21 Kasım 2026

- **Gerçek örnek A, Edge.** Oynatıcı çerçevesinde üç seçenek listelendi, bu sayıya Kapalı dahil. Araç çubuğundan hazır altyazı seçimi kaynak oynatıcının metin parçasını `showing` durumuna geçirdi. Kolay okunur düzendeki görünür seçim kutusundan Kapalı seçilince kaynak parça gösterimi durdu. Kanıt yalnız sayıları ve durumları içerir.
- **Firefox ve açık kapsam.** Aynı sayfanın koşusunda yeterli parça listesi gelmedi. Görülen taşıyıcıların parça listesini aynı anda sunduğu veya Firefox'ta seçim sorunu olduğu doğrulanmadı. Gerçek çoklu ses seçimi ve gerçek Shaka çalışma zamanı açık. Checksum doğrulamalı Shaka indirmesi kullanıcı iznini bekliyor.
- **Yerel kanıt.** `npm run check` ve `node tests/media-tracks-browser.cjs --engine=chromium|firefox` geçti. HLS fikstürü üzerindeki iki düzenin ses/altyazı ekran görüntüleri `tests/artifacts/n039-track-*.png`. Görüntülere gerçek oynatıcı veya içerik bilgisi alınmadı. Görsel kabul kullanıcıda. Ürün değişikliği yok. Claude incelemesi bekliyor.

## N-039 · 5. Firefox test güvenilirliği — 21 Kasım 2026

- **Doğrulanan test hatası.** `firefox-integration.cjs` varsayılan araç çubuğunda gizli kalan klasik sekmeye odaklanıyordu. Gerçek ArrowDown girdisinden sonra Altyazılar sekmesinin `aria-selected` değeri `false` kaldı. Test mevcut `easyRead` yardımcısıyla görünür Kolay okunur düzene geçtiğinde klavye, odak ve hareketsizlik adımları geçti. Kırmızı ve yeşil komut `node tests/firefox-integration.cjs --browser=<kurulu Firefox>`.
- **BiDi tanısı.** Test sürücüleri, süreç veya WebSocket kapanırsa bekleyen komutu hemen reddeder. Zaman aşımı hatasına son sekiz komutun adı, sonucu ve süresi eklenir. İstek parametreleri yazılmaz. Üç temiz Firefox başlatmada `session.subscribe` 2,249 / 3,502 / 7,609 ms. Eski aralıklı zaman aşımı yeniden üretilemedi. 15 ve 60 saniyelik komut sınırları aynı.
- **Kanıt.** `node --test tests/firefox-bidi-diagnostics.test.cjs` 2/2. Git dışı kopyada kopma hatası ayırt edilmediğinde ilgili test kırmızı. `npm run check` 314/314. Başsız `startup-browser` ve `hud-continuity-browser --headless=true` iki motorda 4/4. Firefox `hud-continuity` ayrıca değişiklik öncesi ölçümde geçti. Son entegrasyon koşusunda klavye ok gezinmesi, odak ve hareketsizlik denetimleri doğru, tarayıcı hata listesi boş. Yerel günlükler `tests/artifacts/n039-*`.
- **Kalan kapsam.** Tarihsel BiDi zaman aşımının ve aralıklı HUD konum düşüşünün kök nedenleri açık. Güncelleme test altyapısına ait ve sürüm v0.8.3.4. Gerçek site kanıtı üst işlerde. Claude incelemesi bekliyor.

## v0.8.3.4 pre-release hazırlığı — 21 Kasım 2026

Kullanıcı istedi ("o iki şeyi halledelim"). Mağazaya gönderilmedi (`storeStatus: not-submitted`). Notlar: [RELEASE_NOTES_v0.8.3.4.md](../history/RELEASE_NOTES_v0.8.3.4.md).

- **Paketler:** `NOk-Release-Core` `package filmdeck`, `claude/workTogether` temiz `47e447b` ağacından; Chrome ve Firefox ayrı ZIP, `npm run check` komut içinde geçti. Git dışı `NOk-FilmDeck-Release/artifacts/` altında (`0.8.3.4-3f8f631d97fd`, `0.8.3.4-db738b2012e3`); eski arşivlere dokunulmadı, o depoya commit atılmadı.
- **Denetim:** 17'şer dosya; manifest dışındaki bütün ürün dosyaları kaynakla bayt bayt aynı, fazla dosya yok; Chrome `service_worker`, Firefox `scripts`, sürüm 0.8.3.4. Açılmış iki ZIP kendi tarayıcısında `ui-smoke --extension=…` ile geniş ve dar geçti (20 tema, TR/EN). Bunun için `ui-smoke`'a `--extension` seçeneği eklendi; verilmezse eski davranış.
- **Yayın:** kullanıcıda. PR birleştikten sonra GitHub'da pre-release işaretli `v0.8.3.4-pre_release` önerilir; iki ZIP ve notlardaki SHA-256 değerleri. Notlar ve test seçeneği paketlerden sonra commit edildi; ürün dosyaları değişmedi.

## Opak araç çubuğu ve Playwright 1.65.1, v0.8.3.4 — 21 Kasım 2026

- **Kullanıcı bildirimi:** yeni araç çubuğunun arkasındaki sayfa, özellikle yazı, hafifçe görünüyor ve okumayı bozuyordu.
- **Neden:** çubuğun gövdesi `--pvc-bg` renginin %92'si, açılır kutular %94'ü ile çiziliyordu. Klasik panel ve şeritler zaten opaktı. Bütün 20 temanın `--pvc-bg` değeri opak onaltılık renk.
- **Düzeltme:** iki arka plan doğrudan `var(--pvc-bg)` (`injected.css`). Otomatik solma (`Açık tut` kapalıyken izlerken) bilerek değiştirilmedi.
- **Test:** `toolbar-browser` çubuğun ve açık bir kutunun hesaplanan arka planında saydamlık olmadığını doğrular. Düzeltme geri alınınca Edge'de düştü, yerine konunca geçti.
- **Playwright 1.62.1 → 1.65.1:** Dependabot dalı eski main'den (`95ffcd7`) açıldığı için kilit dosyasında çakışma olasılığı vardı; aynı yükseltme bu dala alındı (`--ignore-scripts`, tarayıcı indirilmedi; testler kurulu Edge ve Firefox'u kullanır). Önce geçici ayrı çalışma ağacında, sonra son kaynakta sınandı.
- **Kanıt:** `npm run check` 312/312. toolbar, media-tracks, dialog-keyboard, tooltip, hud-continuity, ui-smoke geniş/dar Edge 152.0.4191.53 ve Firefox 160.0.1'de 14/14.
- **Firefox kararsızlığı (kod dışı):** bir süre bütün Firefox testleri `BiDi timeout: session.subscribe` ile düştü (60 s bekleme). Aynı anda değişmemiş main kodu geçti; birkaç dakika sonra değişikliklerle toolbar iki kez, ui-smoke geniş ve dar geçti. Firefox'un başsız oturumunda ara sıra yanıt vermeme olarak kayıtlı; kök neden bulunmadı.
- **Sınır:** gerçek site ve uzak CI kabulü yok. Tag, ZIP veya release yapılmadı.

## I-13 kalan onaylı simgeler, v0.8.3.3 — 21 Kasım 2026

Kullanıcı, ilk karşılaştırmada itiraz etmediği önerileri zaten kabul ettiğini
açıkladı. Önceki kayıtlardaki dar onay yorumu bu açıklamayla düzeltildi.
Claude'un N-035 düzeltmeleri PR #129 ile main'e girdikten sonra Codex dalına
merge edildi; yeni uygulama bu tabanın üstündedir. Dosya sahipliği N-036'da.

- **Görünür simgeler:** teşhis başlığı, JSON kopyalama, e-posta, dört pencerenin kapatma düğmesi, izin rehberinin klavye/site erişimi alt başlıkları ve DRM başlığı ortak SVG üslubunda. Mini adaptör DRM işareti kalkan SVG'si; katlanır bölüm ve adaptör değiştirme okları mevcut chevron. Gizli altyazı için Kolay okunur düzen de `eyeOff` gösterir; aynı durum tekrar geldiğinde SVG yeniden oluşturulmaz.
- **Metinler:** ürünün hız/ses/mono-stereo/PiP/filtre/CDN/altyazı ve kalite bildirimlerindeki emoji önekleri kaldırıldı. NOW kalite seçeneklerinin adları korundu; yalnız önekler kalktı. Eski çeviri anahtarları uyumluluk için tutulur, görünür emoji sayılmaz. Yeni düz ses son ekleri TR/EN birlikte; uzun kayma deseni genel `Kayma {0}` deseninden önce gelir.
- **Sıfırlama kararı:** kullanıcı bütün sıfırlama düğmelerinde 30A'yı seçti. İki düzende toplam yedi mevcut filtre, altyazı kayması ve altyazı görünümü düğmesi ortak `reset` kullanır. Yeniden tarama, çözünürlük yenileme ve manuel 1080p kaynak denemesi 16A `refresh` olarak kaldı. İşlem/etiketler korunur.
- **Kullanıcı içeriği:** ürünün durum öneki kalkınca araç çubuğunun geniş emoji temizleme adımı kaldırıldı. Dosya adı emojileri ve çeviri anahtarına benzeyen dosya adları korunur; dosya/satır sayısı deseni genel desenlerden önce eşleşir. Yorum, JSON ve altyazı satırlarına temizlik uygulanmaz. Durum simgesi değişimi mevcut `setUiMarkup` ile HTML kapsayıcıda kurulur; Trusted Types altında SVG'ye ham HTML ataması yapılmaz.
- **Geçici tercihler:** 8A yalnız metin, 45A mevcut dalga olarak korunur. Sonradan yeniden değerlendirme tasarım notudur; bu sürümdeki onaylı uygulama kapsamını açık bırakmaz.
- **Kanıt:** `npm run check` 312/312, sıfır fail/skip. `toolbar-browser`, `ui-smoke` geniş/dar, `dialog-keyboard-browser`, `tooltip-browser`, `media-tracks-browser` Edge ve Firefox'ta 12/12 geçti. Son iki mono/stereo çeviri anahtarı ayrıca son kaynak kontrolünde sınandı. Yeni tarayıcı assertion'ları dosya adı emojisini, gizli/açık altyazı SVG'sini ve yedi sıfırlama simgesini doğrular. Ek kurulu Edge kabulü Trusted Types zorunlu sentetik sayfada önce v0.8.3.2/EN, sonra v0.8.3.3/EN ve TR: rapor/izin/altyazı görselleri, yorumun metin olarak korunması. Günlükler `tests/artifacts/i13-v0833-*.txt`, görüntüler ve `ACCEPTANCE.json` `tests/artifacts/i13-v0833-images/` altında; Git dışı. Görsel yardımcının ikinci dosya yüklemesinde eski durumla erken ilerlemesi benzersiz dosya adı ve yükleme tamamlanma beklemesiyle düzeltildi; ürün için ek değişiklik gerekmedi.
- **Claude incelemesi (21 Kasım, main `35e28c7`):** engelleyici bulgu yok. Emojisi kalkan bildirimlerin hepsi kendi İngilizce karşılığını buluyor; önce gelen genel kalıplara takılan yok. Mini DRM simgesi iki güncelleme yolunda da korunuyor. Claude'un koşusu: `npm run check` 312/312; toolbar, media-tracks, dialog-keyboard, tooltip, hud-continuity, ui-smoke geniş/dar Edge ve Firefox'ta 14/14. Ayrıntı NOk-Tools N-036.
- **Sınır:** bu yerel/sentetik kabuldür; yeni gerçek site ve uzak CI sonucu değildir. Claude'un parça seçimi, kayma matematiği, klavye izolasyonu ve frame-protocol.js bu simge işinde değiştirilmedi. İzin, depolama, rapor şeması veya ağ isteği eklenmedi. Tag, ZIP veya release yok; PR/merge kullanıcıda. GitHub işaretinin MIT kapsamı dışında logo kullanım kurallarına tabi olduğu THIRD_PARTY_NOTICES.md içinde açıklanır.

## I-13 seçili simgeler, v0.8.3.1 — 21 Kasım 2026

Kullanıcı, karşılaştırmada seçtiği simgelerin uygulanmasını istedi. Codex'in
inceleme/devir işi tamam; N-035'te Claude'a bırakılan dört bulgu hâlâ açık.
Kullanıcı bu simge işini önce yapmaya izin verdi; dosya sahipliği N-036'ya
uygulama başlamadan kaydedildi.

- **Uygulanan seçimler:** 4A GitHub işareti, 6A rehber başlığında anahtar delikli kilit, 10B adaptör başlığında yapboz, 16A ortak yenileme çiziminde dengeli oklar, 17A Kolay okunur Mono düğmesinde `monoSource`, 30A filtre sıfırlamada ayrı dönüş oku. Mevcut düğme adları korunur; etiket değiştirme önerisi ayrıca kabul edilmiş sayılmaz.
- **Geçici tercihler:** 8A kısayollar kapalı bildiriminde yalnız metin (TR/EN); 45A mevcut hareket dalgası korunur. İkisi daha sonra yeniden değerlendirilecek. Diğer envanter satırları henüz topluca onaylanmadı; I-13'ün tamamı kapanmış sayılmaz.
- **Güvenlik ve görünüm:** yeni başlıklar mevcut `uiLabel` ve güvenli `setUiMarkup` yolunu kullanır; yeni HTML dizesi atama yöntemi, depolama, izin veya ağ isteği eklenmedi. GitHub yolu yerelde; MIT kaynak/telif bildirimi THIRD_PARTY_NOTICES.md içinde. HUD dışında da SVG boyutu 18 px; Mono/Stereo düğmelerinde çizim ve metin boşluğu uygulanır. Altyazı, dosya adı ve kullanıcı yorumuna dokunulmadı.
- **Yerel kanıt:** `npm run check` 308/308; `toolbar-browser`, `ui-smoke` geniş/dar, `dialog-keyboard-browser`, `tooltip-browser` Edge 152.0.4191.53 ve Firefox 160.0.1 ile 10/10. Ek kurulu eklenti kontrolü: Edge'de Trusted Types zorunlu sentetik sayfada gerçek SVG geometrileri, görünür boyut, erişilebilir başlık, GitHub dolgusu ve TR/EN simgesiz bildirim; 3 kabul akışı (önce EN, sonra EN/TR). Günlükler ve önce/sonra görüntüleri Git dışı `tests/artifacts/i13-v0831-*` altında.
- **Sınır:** yeni gerçek site kabulü veya uzak CI sonucu bu kanıta dahil değil. Parça seçimi, altyazı matematiği, klavye motoru ve frame-protocol.js değiştirilmedi; N-035'in düzeltmeleri Claude'da. Tag, ZIP veya release oluşturulmadı; PR/merge kullanıcıda.

## Codex incelemesi (N-035) düzeltmeleri ve I-13 simge incelemesi, v0.8.3.2 — 21 Kasım 2026

Kullanıcı Codex'ten v0.8.3'ü incelemesini istedi; Codex dört bulgu bıraktı (N-035) ve I-13'te seçilen simgeleri uyguladı (v0.8.3.1, #128). Claude bulguların dördünü de doğruladı ve düzeltti; simge değişikliğini inceledi.

- **F1 (orta) — bayat parça anahtarı:** anahtar yalnız sıra numarası taşıyordu; liste aynı uzunlukta yeniden sıralanınca eski anahtar başka parçayı seçiyordu. Anahtar artık parçanın kendi kimlik alanlarından (Hls.js `id/groupId/name/lang/url`, Shaka dil/rol/etiket, tarayıcı `id/kind/label/language`) üretilen kısa bir parmak izi taşıyor (`hls:a:1:<iz>`); seçimden önce o sıradaki parçanın anahtarı birebir eşleşmezse hiçbir şey seçilmiyor. Çerçeve protokolü yeni biçimi doğruluyor. Regresyon testi: aynı uzunlukta ters sıralama, Hls.js ve tarayıcı listesi; denetim bilerek zayıflatılınca iki test düştü.
- **F2 (orta) — `keypress` sayfaya ulaşıyordu:** panel `keydown`/`keyup`'ı durduruyordu, `keypress`'i durdurmuyordu. Panel, rapor penceresi ve PiP onay kutusunun olay yalıtımına `keypress` eklendi. `toolbar-browser` artık sayfa gövdesine üç tuş dinleyicisi koyup kayma alanına ve satır aramasına gerçek tuşlarla yazıyor ve hiçbir olayın sayfaya ulaşmadığını sınıyor; düzeltme olmadan Edge'de düştü. Sayfanın önceden kurduğu yakalama (capture) dinleyicileri bu yalıtımın kapsamında değildir.
- **F3 (düşük) — ±6 saat sınırında ters dönüşüm:** kayma sınırda dururken tarayıcı izi için ters hesap doymayı bilmiyordu (Codex'in örneğinde 90 s yerine 89,52 s). Ters dönüşüm artık doymuş bölgede sınırı kullanıyor; saat kesin artan olduğundan çözüm tek. Test: Codex'in örneği ve her iki sınırda 0–200 s gidiş-dönüş.
- **F4 (orta, sahte SDK) — Shaka'da boş rol:** boş rol her rolle eşleşiyordu; aynı dilde ana ve yorum parçası varken ikisi birden seçili görünüyordu. Boş rol artık yalnız rolsüz oynayan varyantla eşleşiyor ve bir listede en fazla bir öğe seçili görünüyor. Gerçek Shaka SDK'sında doğrulanmadı (yerel çalışma dosyası yok).
- **Test notu:** `media-tracks-browser`'daki "tek ses parçası" adımı aslında sesi olmayan videoyu sınıyordu; adı düzeltildi, tek parçalı durum birim testinde. Kolay okunur seçim kutuları testte `change` olayıyla sürülüyor; gerçek fare etkileşimi değil.
- **Kanıt:** `npm run check` 311/311 (üç yeni regresyon testi). Edge 152 ve Firefox 160.0.1'de geçti: `media-tracks`, `toolbar`, `subtitle`, `hud-state`, `report`, `dialog-keyboard`, `ui-smoke` (geniş ve dar).
- **I-13 simge incelemesi (v0.8.3.1):** değişiklik seçilenlerle (4A, 6A, 10B, 16A, 17A, 30A, geçici 8A) sınırlı; protokol/matematik/klavyeye dokunulmamış; `main` üzerinde `npm run check` 308/308. İki not Codex'e (N-037): GitHub işareti MIT kapsamında değil, GitHub logo kurallarına tabi (bağlantı amaçlı kullanım izinli; işaret değiştirilmemeli, onay izlenimi verilmemeli) — `THIRD_PARTY_NOTICES.md`'ye bir satır gerekiyor. Altyazı kaymasının iki "Sıfırla" düğmesi hâlâ `refresh` simgesini kullanıyor; filtre sıfırlaması yeni `reset` simgesini aldı — tutarlılık kullanıcı kararı.

## Bekleyen izinler — kullanıcı dönünce (19 Kasım 2026)

1. **Beceri onaylarının yenilenmesi (NOk-Tools, N-032) — tamamlandı (19 Kasım, kullanıcı onayıyla).** On bir bağlı kapsamın hepsi `approved: true`, 26 Kasım'a kadar; `superpowers/nok-reviewed` kullanıcı kararıyla kaydedildi; `Test-NOkTools.ps1` PASS. Önceki durum: altı bağlı kapsam yeniden taramada inceleme kararı istiyor ve şu an onaysız: `prototype`, `superpowers/verification`, `superpowers/nok-reviewed` (systematic-debugging), `i-have-adhd-skill`, `anthropic-skills/frontend-design`, `anthropic-skills/doc-coauthoring`. Kaynak baytları, bulgu parmak izleri ve eksik kimlikleri 13 Kasım'la birebir aynı. Beşi için 13 Kasım'daki ajan gerekçesiyle `record-review` kaydı hazır ama otomatik izin denetiminde durduruldu; `superpowers/nok-reviewed` için kullanıcı kararı gerekiyor (13 Kasım'da da kullanıcı onaylamıştı). Onaylanana kadar bu altı beceri kullanılmıyor.
2. **PR:** `claude/workTogether` → `main` (belge taşıması, v0.8.1, v0.8.1.1, v0.8.2, v0.8.3). PR ve merge kullanıcıda.

## Kullanıcı uzaktayken beş hedef, v0.8.3 — 19 Kasım 2026

Kullanıcı: "sıradaki 5 işi belirle … sen çalışa dur"; izinler biriktirilecek. Gerçek site veya bot doğrulaması gerektiren işler (I-03, I-04, I-05, I-09/I-10) kullanıcı dönene kadar bekletildi.

- **1. Beceri onayları:** kullanıcı onayıyla tamamlandı (yukarıda). Beş kapsam (`nok-release`, `emil-design-eng`, `mobile-native`, `karpathy-guidelines`, `ponytail`) yeniden taramada doğrudan PASS aldı ve 26 Kasım'a kadar geçerli.
- **2. Araç çubuğu ve kaydırma çubuğu:** v0.8.1.1'de kalan iş. Sürükleme, araç çubuğunun aşağı/yukarı açılma kararı, açılır kutu ve Help yerleşimi, sığma denetimi ve bildirim konumu artık `visibleViewport()` kullanıyor. `hud-continuity-browser` yeni adımı: Edge'de 15 px kaydırma çubuğuyla kalite açılır kutusu görünür kenarın tam 12 px içinde (1173 / 1185); eski hesapla çubuğun üstüne taşardı. Firefox'ta kaydırma çubuğu 0 px, adım yine geçti. Kolay okunur düzenin boyut sığma denetimi (`textScaleFits`) birim testlerinin sahte DOM'u yüzünden `innerWidth`'te bırakıldı (en fazla 15 px).
- **3. Firefox `hud-continuity`:** rapor kipinde 5/5 ve öncesinde 2/2 temiz (toplam 7). İki düşüş yalnız iki motorun arka arkaya çalıştığı toplu koşularda görüldü ve yeniden üretilemedi; kök neden bulunmadan test değiştirilmedi. Test düşünce tüm ölçümleri zaten yazdırıyor; toplu koşularda çıktı artık dosyaya kaydediliyor.
- **4–5. D-06, videonun kendi ses ve altyazı parçaları:** kaynak sırası Hls.js → Shaka → Video.js → tarayıcının kendi listeleri. Araç çubuğu: Altyazılar grubunda "Videonun altyazısı" düğmesi (yalnız parça varsa görünür; Kapalı + parçalar), Oynatıcı grubundaki ses açılır kutusunda "Ses parçası" kartı (yalnız birden çok ses parçası varsa). Kolay okunur düzen: aynı seçimler iki seçim kutusunda. Etiket: parçanın adı, yoksa dil adı (panel dilinde), yoksa "Parça N"; FilmDeck'in yüklenen dosya için eklediği iz listelenmez ve kendi kipini korur. Gömülü oynatıcıda liste çerçeve durumuyla gelir, seçim `media-track` komutuyla medya çerçevesinde uygulanır; anahtar canlı listeye karşı yeniden denetlenir. Listeler yalnız panelde, metin olarak; rapora girmez. Tasarım B3 kalıbını izliyor; kullanıcının görsel onayı açık.
- **Fikstür:** `tests/fixtures/hls-tracks` (167 KB; `prepare-browser-fixtures.cjs --committed-track-hls`): mevcut 480p video, TR/EN iki ses (440/880 Hz) ve iki WebVTT altyazı.
- **Kanıt:** `npm run check` 308/308 (yeni `media-tracks.test.cjs` 6 test, Shaka sahte nesnelerle). Toplu koşu, iki motorda hepsi geçti: `toolbar`, `subtitle`, `hud-state`, `report`, `quality-mapping`, `hls-early-attach`, `dialog-keyboard`, `hud-continuity` (Firefox bu toplu koşuda da geçti), `ui-smoke` (geniş ve dar). `media-tracks-browser` Edge 152 ve Firefox 160.0.1'de geçti: gerçek Hls.js'te ses ve altyazı seçimi, Kapalı, Kolay okunur seçim kutuları; `<track>`'lı yerel video ve FilmDeck izinin dışarıda kalması; gerçek Video.js/VHS'te ses ve metin parçası; ayrı kökenli iframe'de üst panelin seçimi çerçeveye uygulaması.
- **Açık:** gerçek sitede deneme (dublaj/orijinal ses ve hazır altyazılı bir site); Shaka yalnız birim testinde; görsel onay.

## Büyük kayma: kaymayı yaz ve "Şu an bu satır", v0.8.2 — 17 Kasım 2026

Kullanıcının altyazı dosyası iki bölümün birleşimiydi (başka sitelerdeki dosyalarda da aynı); ~40 dakika kaydırmak gerekti. Dosyayı şimdilik kendisi düzenleyecek. Önerilen dört yoldan kullanıcı "Şu an bu satır" ile kaymayı elle yazmayı seçti.

- **Kaymayı yaz:** Altyazı zamanlaması kutusunda "Şu anki kayma" altında, Kolay okunur düzende "Kaymayı yaz veya satır seç" içinde. `-41:35`, `1:02:03.5`, `+2.5` / `+2,5` (sn), `-2500ms`; tipografik eksi de olur. Yanlış değer kırmızı çerçeveyle işaretlenir, hiçbir şey değişmez. Yazılan kayma zamanla kayma düzeltmesini ve bekleyen noktayı kaldırır (o doğru eski kaymaya aitti).
- **Şu an bu satır:** Arama kutusu ve liste. Kelime yazılınca tüm dosyada büyük/küçük harf ve Türkçe işaretler gözetmeden arar (en fazla 40 satır); boşken o anki konumun çevresindeki 10 satırı gösterir. Seçilen satır videonun şu anki zamanında başlar. Gömülü oynatıcıda üst panel satırın başlangıç zamanını gönderir, kaymayı medya çerçevesi kendi video saatiyle hesaplar.
- **Sınır ve gösterim:** kayma sınırı 1 saatten 6 saate çıktı (birden çok bölümü birleştiren dosyalar). 1 dakikanın üstündeki kayma `-41:35.0` biçiminde gösterilir.
- **Gizlilik:** satır metinleri yalnız panelde, metin olarak gösterilir; rapora, ipucuna ve çerçeve durumuna girmez. Rapora yalnız `SUBTITLE_LINE_ALIGNED` olayı ve kaymanın sayısı girer. Satır kodu, satır metnine hiç dokunmayan altyazı açıklama bölümünden ayrı tutuldu.
- **Reddedilen öneri — bölüm seçici:** dosya yüklenince büyük boşluklardan ya da 00:00'a dönen zamandan bölümleri bulup "hangi bölüm?" diye sormak. Kullanıcı "mantıksız" buldu; yapılmadı. Bilinen sınır kayıtta: zamanı 00:00'dan yeniden başlayan birleşik dosyalar gömülü oynatıcıya aktarılamıyor (`cleanCues` sıralı başlangıç ister), üst sayfada ilk bölümün satırı gösterilir. Gerekirse yeniden sorulur.
- **Kanıt:** `npm run check` 302/302 (yeni `subtitle-jump.test.cjs` 5 test). `toolbar-browser` Edge 152 ve Firefox 160'ta geçti: gerçek tuşlarla `-41:35` (alandaki `-` hız kısayolunu tetiklemedi), yanlış değer, arama, satır seçimi ve katman, Kolay okunur düzen; ayrı kökenli iframe'de yazılan kayma ve satır hizalama. `subtitle`, `hud-state`, `report`, `dialog-keyboard`, `hud-continuity`, `ui-smoke` (geniş ve dar) iki motorda geçti. Firefox `hud-continuity` bir koşuda "spa: iframe becomes top video: vertical position" adımında düştü, sonraki iki koşu geçti; ekrana sığmayan Firefox penceresinde (1408×663) zamanlamaya bağlı görünüyor, incelenmedi.

## Altyazı zamanla kayma düzeltmesi ve raporda kayma, v0.8.1 — 17 Kasım 2026

Kullanıcı raporu (Firefox, iframe, Generic, harici SRT; site adı kayda geçmedi): altyazı başta doğruydu, bölüm boyunca her 10–15 dakikada ~3 sn ileri almak gerekti, sonunda ~9 sn. Kök neden: motor sabit kaymayı videonun gerçek saatine uyguluyor ve zaman ayrıştırma doğru; dosya başka kurgu/kare hızına göre zamanlanmış. Rapor sorunu gösteremedi, çünkü kayma değeri ve kaydırma olayı rapora girmiyordu. Kullanıcı ikisini de seçti.

- **İki noktalı düzeltme:** Altyazı zamanlaması kutusunda (araç çubuğu) ve klasik Altyazı bölümünde "1. noktayı kaydet / 2. noktayı kaydet", "Vazgeç", "Düzeltmeyi kaldır". Kaldırınca altyazı o anki yerinde kalır; Sıfırla ve yeni dosya her şeyi sıfırlar. Şerit "Kayma … · zamanla düzeltiliyor" der. Gömülü oynatıcıda düzeltme medya çerçevesinde hesaplanır. Ayrıntı: PROJECT_MASTER_GUIDE.md (altyazı gizliliği bölümü).
- **Rapor:** `videoState.subtitleOffsetMs`, `videoState.subtitleDriftMsPerMinute` ve dört altyazı zamanlama olayı; art arda − / + basışları tek olay. Oynatma konumu yine rapora girmez.
- **Küçük düzeltme:** sıfır kayma rozeti `+0ms` yerine `0ms`.
- **Kanıt:** `npm run check` 297/297 (yeni `subtitle-drift.test.cjs` 8 test). `toolbar-browser` Edge 152 ve Firefox 160'ta geçti; kayma adımları sahte video saatiyle (canvas akışı sarılamaz) üst sayfada ve ayrı kökenli iframe'de, tarayıcı izi, katman ve rapor dahil sınandı.
- **Yan bulgu (v0.8.1.1'de çözüldü):** `hud-continuity-browser` Edge'de "close and reopen: default corner", Firefox'ta bir kez "iframe: normal position returns after exit" adımında düştü; 0.8.0 kodunda da aynıydı. Kök neden: görünür test penceresinde Edge artık klasik (her zaman görünen, 15 px) kaydırma çubuğu gösteriyor. Panel `right: 16px` ile sayfa kenarına doğru yerleşiyordu, ama kenara yapıştırma ve konum oranı `innerWidth` (kaydırma çubuğu dahil) kullanıyordu; panel kaydırma çubuğunun altına kayabiliyordu. Test de boşluğu `innerWidth`'ten ölçtüğü için 31 px gördü. Düzeltme: `visibleViewport()` (kaydırma çubuğu hariç, quirks sayfada `body`) yapıştırma ve oran hesabında; test boşlukları görünür kenardan ölçüyor. Firefox'taki tek düşüş sonraki dört koşuda tekrarlanmadı (zamanlama). Araç çubuğunun kendi açılır kutu yerleşimi hâlâ `innerWidth` kullanıyor; kaydırma çubuklu sayfada en fazla 15 px fark, ayrıca ele alınmadı.
- **Açık:** gerçek dosyayla kullanıcı denemesi. Kurgu farkında (bir noktada birden atlama) düz çizgi uymaz; o durumda − / + yeter.

## Belgeler docs/ altında, kısa README — 16–17 Kasım 2026

Kullanıcı GitHub'da kökte gereğinden fazla dosya olduğunu düşündü; silmek yerine düzenleme önerisini onayladı ("Yes, move them"). Kod ve sürüm değişmedi (v0.8.0).

- **Taşınanlar (`git mv`, geçmiş korunur):** `docs/dev` — devir, ana kılavuz, bu iş kaydı, test, kalite, canlı site doğrulaması, çerçeve sunumu, reklam denetimi, geliştirme durumu, yol haritası; `docs/design` — araç çubuğu, HMI incelemesi, tasarım kaynakları, tema değerlendirmesi, animasyon ayrıntıları; `docs/measurements` — animasyon, filtre, bellek, rapor ölçümleri; `docs/history` — iş geçmişi, eski sürüm notları ve eski README (`README_ARCHIVE.md`).
- **Kökte kalanlar:** kısa kullanıcı README'si (ne olduğu, özellikler, kurulum, gizlilik, lisans, belge bağlantıları; e-posta adresi yeni README'de yok, eskisi arşivde), LICENSE, THIRD_PARTY_NOTICES, AGENTS.md, CLAUDE.md ve kod.
- **Güncellenenler:** 47 göreli bağlantı yeni yerlerine göre yeniden yazıldı (AGENTS.md dışındaki tüm bağlantılar çözülüyor); CLAUDE.md, `scripts/set-version.cjs`, `tests/extension-contract.test.cjs`; NOk-Tools `project-profiles/video-controller.json` › `docs` (yedek: `reports/backups/2026-11-17-claude-filmdeck-docs-paths`, `Test-NOkTools.ps1` PASS).
- **Codex'te:** `AGENTS.md` Codex alanı; içindeki üç bağlantı eski yolları gösteriyor. `D:/NOk-Tools/AGENT_NOTES.md` › N-019 ile bildirildi. Koddaki birkaç yorum belge adını geçirir; adlar değişmediği için aramayla bulunur.
- **Kanıt:** `npm run check` 289/289 (taşımadan sonra).

## Milestone 0.8: kompakt araç çubuğu, v0.8.0 — 16 Kasım 2026

Kullanıcı kararı: eski/yeni panel karşılaştırması tamam ("bir sorun gözlemlemedim"), araç çubuğu iki gerçek sitede denendi ("şimdilik yeterli"; site adları kayda geçmedi). Milestone `0.7` → `0.8`; sürüm `0.8.0`. Kullanıcı PR'ı sürüm artışından sonra açmayı tercih etti.

- **Milestone kapsamı (v0.7.19–v0.7.27):** Model 5 araç çubuğu ve dört grubu (Player, Subtitles, Settings, Accessibility); B3 açılır kutu stili; ertelenen anlık durumlar (oynat/duraklat, DRM kalkanı, kare kaybı ve video bekleniyor şeritleri, 1080p yeniden deneme); Stereo/Mono kayan anahtarı; araç çubuğu varsayılan, eski panel Kolay okunur düzen ve 100/125/150 kademeleri; yolda bulunan hatalar (Trusted Types, UTF-8 dışı sayfalarda kodlama, düzen değişiminde konum, çerçeve yenilenince tercihin ezilmesi). Ayrıntı: TOOLBAR_REDESIGN.md §6.
- **Kanıt (0.8.0 üzerinde):** `npm run check` 289/289. Tarayıcı: `toolbar`, `hud-state`, `hud-continuity`, `dialog-keyboard`, `volume-mirror`, `cdn-measure`, `pip`, `startup`, `report`, `frame-loss`, `tooltip`, `subtitle`, `quality-mapping`, `hls-early-attach`, `ad-lifecycle`, `ui-smoke` (geniş ve dar) Edge 152 ve Firefox 160'ta geçti.
- **Açık:** B5 kesin sürüm kuralı kullanıcıda. Gerçek site kabulü kullanıcının iki sitesiyle sınırlı; DRM'li ve 1080p yeniden deneme siteleri ayrıca denenmedi.

## Stereo/Mono kayan anahtarı, v0.7.27 — 16 Kasım 2026

Kullanıcı seçti: Model 1 kayan anahtar, simgeler "5c stereo + 6 mono" (kulaklık / tek kaynaktan iki yana yayılan ses). Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Kapsam:** ses kutusundaki iki parçalı seçici yerine anahtar; ad her zaman görünür, simgeler ve ipucu üzerine gelince ya da klavye odağında; tıklama, Boşluk, ←/→ ve fare tekerleğiyle değişir.
- **Test:** `toolbar-browser` durgunken simgelerin gizli, üzerine gelince görünür olduğunu, tıklama, ← ve tekerlekle değişimi ve klasik paneldeki ortak durumu sınar. Firefox sürücüsüne (`resource-driver.cjs`) ok tuşlarının WebDriver karşılıkları eklendi.
- **Kanıt:** `npm run check` (289/289); `toolbar`, `hud-state`, `tooltip`, `dialog-keyboard`, `ui-smoke` Edge ve Firefox'ta geçti. Ekran görüntüsüyle durgun/üzerine gelinmiş, Stereo/Mono kontrolü.
- **Sınır:** gerçek site denenmedi.

## Araç çubuğu varsayılan, Easy-read'de kademeli büyütme, v0.7.26 — 16 Kasım 2026

Kullanıcı istedi: araç çubuğunu varsayılan yap, ardından kademeli büyütmeyi ekle. Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Kapsam:** panel araç çubuğuyla açılır; klasik panel "Kolay okunur düzen" (iki yönlü anahtar: araç çubuğu Accessibility'de ve klasik Erişilebilirlik'in başında). "Büyük yazı" yerine 100/125/150 kademeleri (CSS `zoom` + genişlik; sığmayan kademe seçilemez, daralan pencerede sığan en büyük kademe). Tercih köprüsünde `largeText` → `textScale`.
- **Yolda bulunan ve düzeltilen:** düzen değişince panel sol kenarını koruyup ekranın ortasında kalıyordu; artık sağ kenarını korur. Gömülü oynatıcı çerçevesi aynı oturumda yenilenince (sayfa içi gezinme) yeni kaynak varsayılan tercihlerle geliyor ve üstteki kullanıcı seçimini eziyordu; üst panel artık yeni kaynağa kendi tercihlerini gönderir. Eski varsayılan "klasik" olduğu için bu hata görünmüyordu.
- **Testler:** klasik paneli sınayan tarayıcı testleri açılıştan sonra `easyRead` yardımcısıyla Kolay okunur düzene geçer; araç çubuğu testi varsayılanı, iki yönlü anahtarı, 125% kademesini ve araç çubuğunun büyümediğini sınar; birim testi kademe sınıflarını ve dar pencerede küçük kademeye düşmeyi, çerçeve testi yeni sahibe tercih gönderimini sınar. `hud-continuity` Edge'de artık geçiyor (önceki 31 px sağ boşluk sorunu düzen geçişindeki sağ kenar korumasıyla çözüldü).
- **Stereo/Mono:** kullanıcı uiverse.io'dan beş örnek önerdi (topuzda simge taşıyan kayan anahtarlar, üstü çizilen etiket, dolan hap düğme). Claude görüşü: üstü çizilen etiket olumsuzu gösterdiği için önerilmedi. Kullanıcı isteğiyle iki model Figma'da çizildi ("Stereo / Mono · models"): Model 1 kayan anahtar (iki simge yolda hep görünür, topuz seçilenin altına kayar, yanında o anki ad), Model 2 tek "Mono" hap düğme; karşılaştırma için bugünkü iki parçalı seçici. Her biri Stereo ve Mono hâlinde, B3 ses kutusunda ve 2× yakın çekimde. Kullanıcı Model 1'i seçti ama hoparlör kutusu simgelerini beğenmedi; internetteki örnekler arandı (en yerleşik gösterim Logic Pro: tek daire mono, iç içe iki daire stereo; IconPark/FontAudio gibi setlerde hazır ikonlar var ama lisans incelemesi gerekir). Aynı sayfaya dört simge çifti çizildi: A daireler (Claude önerisi), B kulaklık (küçükte harita iğnesine benziyor), C dalgalar, D harfler ("L R" / "M"). Kullanıcı bunları zayıf buldu; stereo için kulak üstü kulaklığı biliyor, mono için yerleşik simge aradı. Araştırma: iPhone, Android ve Windows "Mono ses"i yalnız yazıyla gösteriyor, yerleşik bir mono simgesi yok. Kulaklıktan türeyen dört öneri çizildi: 1 tek kapaklı başlık (Claude önerisi), 2 kapaklar arasında birleşen oklar, 3 farklı/aynı kapaklar (küçük boyutta fark zor seçiliyor), 4 kulak. Kullanıcının fikriyle anahtar durgunken yalnız ad ve sade topuz; üzerine gelince ya da klavye odağında simgeler ve ipucu çıkar; ad dokunmatik ve klavye için hep kalır. Kullanıcı 1 ile 4 arasında kaldı ama ikisini de garip buldu; üç inceltilmiş çeşit çizildi: 1b ikinci kapak silik ve kesik çizgili (16 px'de stereodan zor ayrılıyor), 4b kulağa giren ses dalgaları, 5 tek kapaktan çıkan ses dalgaları. Kullanıcı fikri: mono, tek daireden yayılan ses dalgaları olsun (tek kaynak, tek/çift daire gösterimini de andırır). Çizildi: 5c stereo kulaklık + mono tek daireden dalgalar; 6 daire ailesi (stereo iki daire kendi taraflarına, mono tek daire iki yana; küçük boyutta iki durum birbirine benziyor). Karar bekliyor.

## UTF-8 bildirmeyen sayfalarda bozuk Türkçe ve çeviri, v0.7.25.1 — 16 Kasım 2026

Kullanıcı istedi ("Yes, fix it"). v0.7.25 sırasında bulunan açık bulgunun düzeltmesi.

- **Kök neden:** `content.js` motoru (`injected.js`) sayfaya `<script src>` ile ekliyor; eklenti dosyası karakter kodlaması bildirmeden sunulduğu için tarayıcı betiği sayfanın kodlamasıyla çözüyordu. Eski Türkçe kodlamalı (windows-1254) ya da kodlama bildirmeyen sayfalarda Türkçe metinler bozuluyor ("OynatÄ±cÄ±", "1.0Ã—") ve çeviri anahtarları eşleşmediği için İngilizce arayüz Türkçe/bozuk kalıyordu.
- **Düzeltme:** eklenen iki betiğe `charset = 'utf-8'`; HTML'de bu öznitelik betiğin kodlamasını sayfanınkinden önce belirler. Arka plandaki `executeScript` yolu ve `content.js`'in kendisi zaten UTF-8 okunuyordu.
- **Kanıt:** `toolbar-browser` artık videosuz sayfayı windows-1254 olarak sunuyor; düzeltmeden önce iki motorda başarısız oldu ("translations still found on a windows-1254 page"), sonra geçti. `content-startup.test.cjs` iki betiğin `charset` değerini denetliyor. `npm run check` (289/289); `toolbar`, `startup`, `subtitle`, `hud-state`, `tooltip`, `dialog-keyboard`, `frame-loss`, `ui-smoke` Edge ve Firefox'ta geçti.
- **Sınır:** gerçek eski kodlamalı bir sitede denenmedi.

## Ertelenen anlık durumlar araç çubuğunda, v0.7.25 — 16 Kasım 2026

Kullanıcı seçti: 1C, 2B+C (şeritte yalnız kalkan, üzerine gelince "Protected stream"; sınırlanan her denetimde kalkan, kutuda açıklama satırı yok), 3A, 4A+C (kırmızı bekleme şeridi; yeniden deneme Quality kutusunda, Quality düğmesinde işaret). Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Yolda bulunan ve düzeltilen:** klasik küçültülmüş çubuktaki oynat düğmesi `outerHTML` kullanıyordu (Trusted Types sitelerinde hata); ipucu çubuğun altında şeridin üstüne binip tıklamayı yakalıyordu; kalkan yazısı açılırken kalkan imlecin altından kayabiliyordu; DRM penceresindeki yedek şifreleme adı çevrilmiyordu. Önceki kayıttaki "Yok" bulgusu yalnız rozet elle açıldığında görülüyor, gerçek DRM'de çıkmıyor.
- **Açık bulgu (ayrı iş, kullanıcıya önerildi):** `content.js` `injected.js`'i `<script src>` ile ekliyor; UTF-8 bildirmeyen bir sayfada betik sayfanın kodlamasıyla çözülüyor, Türkçe metinler bozuluyor ve çeviriler bulunamıyor (karakter kodlaması bildirmeyen yerel test sayfasında görüldü). Bu işten önce de vardı.
- **Kanıt:** `npm run check` (289/289). `toolbar-browser` (oynat/duraklat, DRM kalkanı gerçek algılayıcıyla, üzerine gelince yazının açık kalması, ses düğmesinde kalkan, yeniden dene işareti ve düğmesi, kare kaybı şeridi ve Hayır, videosuz sayfada kırmızı şerit ve her grupta kalması), `subtitle`, `hud-state`, `tooltip`, `dialog-keyboard`, `frame-loss`, `ui-smoke` Edge ve Firefox'ta geçti. Ekran görüntüsüyle kontrol.
- **Sınır:** gerçek DRM'li site ve gerçek 1080p yeniden deneme sitesi denenmedi.

## Ertelenen anlık durumlar için modeller (Figma) — 16 Kasım 2026

Kod değişmedi. Kullanıcı ertelenen dört kararı (oynat/duraklat, DRM, kare kaybı sorusu, "video bekleniyor" ve "kaynağı yeniden dene") eski panel görüntüleriyle karşılaştırıp seçmek istedi. Sayfa: `FilmDeck MEC523 Wireframes` › "Transient states · models".

- **Eski hal:** gerçek eklentiden (v0.7.24 klasik panel, Edge, yerel test sayfası) alınmış ekran görüntüleri: küçültülmüş çubuk, DRM rozeti ve penceresi, kare kaybı sorusu, "Waiting for a video", "Retry 1080p source". Bekleme uyarısı ve yeniden dene düğmesi panelin kendi taraması onları hemen gizlediği için yalnız test sayfasında geçici bir stille açık tutuldu.
- **Öneriler (her satırda üç, B3 tarzında):** oynat/duraklat — A yok, B Player grubunun başında, C Playing şeridinde; DRM — A soldaki sabit simgeler arasında kalkan + açılır kutu, B Playing şeridinde etiket, C ses düğmesinde kalkan ve ses kutusunda açıklama; kare kaybı — A şerit (Claude'un önceki önerisi), B çubuğun sonunda sessiz çip + kutu, C cevap bekleyen kart; bekleme/yeniden dene — A kırmızı şerit + Playing şeridinde "Retry 1080p", B çubuğun kendisi "bekleniyor" der, C kısa şerit + Quality kutusunda düğme.
- **Bulunan küçük hata:** İngilizce DRM penceresinde şifreleme türü bilinmeyince Türkçe "Yok" kelimesi çevrilmeden görünüyor ("uses **Yok** encryption"). Henüz düzeltilmedi.
- **Karar bekliyor:** kullanıcı her satır için bir öneri seçecek; satırlar karıştırılabilir.

## Karşılaştırma 3. tur: B3 açılır kutu stili ve grup düğmesi, v0.7.24 — 15 Kasım 2026

Kullanıcı B3'ü seçti ("daha yenilikçi ve zarif") ve grup düğmesini netleştirdi: tek tıklama bir şey yapmaz, çift tıklama listeyi açar, tekerlek liste açılmadan gezer. Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Kapsam:** bütün açılır kutular B3 stilinde (tek katman, ayraçlar, hap seçenekler, ince kaydırıcılar, anahtar satırları); çubuktaki oklar kaldırıldı; açık düğmede ve kutunun kenarında vurgu çizgisi; tema ve video hedefi için kendi listemiz; 150 ms açılış (hareketi azaltta yok).
- **Ara karar (Claude):** klavyede çift tıklama olmadığından Enter/Boşluk grup listesini açar.
- **Kanıt:** `npm run check` (289/289). `toolbar-browser` (tek tıklamanın bir şey açmaması, çift tıklama ve Enter ile liste, tekerlekle geçiş, kutunun düğmeye bağlanması, çubukta ok olmaması, kendi tema ve hedef listeleri, anahtar satırları), `subtitle`, `hud-state`, `tooltip`, `dialog-keyboard`, `ui-smoke` Edge ve Firefox'ta geçti. Ekran görüntüsüyle Player, Subtitles, Settings ve açık tema listesi kontrolü.
- **Sınır:** gerçek site denenmedi.

## Karşılaştırma 2. tur: Subtitles düzeltmeleri, grup düğmesi, B modelleri, v0.7.23 — 15 Kasım 2026

Kullanıcı B modelini en hoş buldu ama düğmelerdeki aşağı ok ile kutunun uçla düğmeden çıkıyormuş gibi durmasının birlikte gereksiz kalabalık yarattığını söyledi; Subtitles ve grup düğmesinde düzeltmeler bildirdi. Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Düzeltilen:** göz simgesinin kaybolması (Trusted Types; eşitlemenin geri kalanını da durduruyordu), görünüm kaydırıcılarının kalın çubuk olması, şeritte satır sayısının kesilmesi (ad kısalır, sayı görünür, tamamı ipucunda), grup düğmesi (tıklama yalnız listeyi açar, tekerlek gezer).
- **Figma:** "Popovers · models" sayfasına "B variants" eklendi: B1 yalnız ok, B2 yalnız uç, B3 ikisi de yok ve sessiz vurgu çizgisi. Karar bekliyor.
- **Test:** `toolbar-browser` sayfası Trusted Types zorunlu hale getirildi; HTML dizesi kullanan satır geçici olarak geri konunca Edge'de test başarısız oldu, kaldırınca geçti. Yeni denetimler: göz simgeleri, ince kaydırıcı, satır sayısı ve ipucu, tıklamanın grubu değiştirmemesi, çift tıklamanın listeyi açık bırakması.

## Açılır kutu modelleri (Figma) — 15 Kasım 2026

Kod değişmedi. Kullanıcı açılır kutuların yeni panel tarzından bağımsız durduğunu söyledi ve önerileri Figma modeli olarak istedi. Sayfa: `FilmDeck MEC523 Wireframes` › "Popovers · models". Her modelde aynı üç kutu (Volume, Picture & night, Theme) açtığı düğmenin altında, Atlas teması.

- **Current (v0.7.22):** köşeli, ağır gölgeli ayrı pencere görünümü; kutu içinde kenarlıklı kart; tarayıcının kendi seçim kutusu; dikdörtgen düğmeler. Karşılaştırma için.
- **A · Aynı malzeme, tek katman:** kutu çubukla aynı yarı saydam zemin ve yuvarlak köşelerle; iç kutu yok, ince ayraç ve küçük soluk başlıklar; hap seçenekler, anahtarlar, kendi listemiz.
- **B · A + düğmeye bağlı:** A'ya ek olarak düğmeyi gösteren küçük uç; açık düğme kutunun rengine bürünür; düğmeden kısa büyüme animasyonu (hareketi azalt açıkken yok).
- **C · Yumuşak renk blokları:** eski paneldeki "açık renkli kutu" fikri kenarlıksız, yuvarlak, hafif tonlu bloklarla; hap seçenekler, anahtarlar, kendi listemiz.
- **Karar bekliyor:** kullanıcı modeli seçecek; seçilen model bütün açılır kutulara (Help dahil) uygulanacak.

## Karşılaştırma 1. tur: kapatma baloncuğu ve FilmDeck adı, v0.7.22.1 — 15 Kasım 2026

Kullanıcı eski/yeni panel karşılaştırmasının ilk düzeltmelerini bildirdi. Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Düzeltilen:** sürüklerken baloncuğun bazen açık kalması (basılı tutma ve sürükleme boyunca açılmıyor); baloncuk tam daire, yalnız X, üzerine gelince kırmızı halka; FilmDeck adının üzerine gelince çevresinde alan oluşmaması.
- **Açık, karar bekliyor:** açılır kutuların tasarımı; Claude önerileri kullanıcıya sunuldu. Kullanıcı diğer grupları inceledikçe yeni düzeltmeler bildirecek.
- **Kanıt:** `npm run check` (289/289). `toolbar-browser` yeni "basılıyken baloncuk yok" denetimiyle Edge ve Firefox'ta geçti; denetim düzeltme geri alınınca başarısız oluyor. `hud-state`, `tooltip` iki motorda, `hud-continuity` Firefox'ta geçti; Edge'de `hud-continuity` bilinen, `main`'de de olan rightGap 31 sorunuyla başarısız. Ekran görüntüsüyle Atlas ve Daylight kontrolü.

## Kompakt araç çubuğu: Accessibility grubu, v0.7.22 — 15 Kasım 2026

Kullanıcı istedi: Accessibility bölümünü yap; ardından kullanıcı eski ve yeni paneli karşılaştırıp düzeltmeleri bildirecek, sonunda yeni panel varsayılan yapılıp milestone birlikte doğrulanacak. Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Kapsam:** Keep visible, Easy-read layout, High contrast, Reduce motion anahtarları ve not şeridi (Figma "Accessibility · new group"). Anahtarlar klasik onay kutularını tetikler; Easy-read klasik panele geçip dönüş anahtarını açık getirir. "Klasik panelde aç" yer tutucusu kaldırıldı; dört grup tamam.
- **Ek:** Açılışta çıkan bildirim araç çubuğu düzenine geçince çubuğun altına iner.
- **Test kararlılığı:** Firefox'ta `toolbar-browser` gömülü çerçeve adımında ("top speed popover") dört koşudan birinde zaman aşımı oldu; sonraki koşular geçti. Olası neden: düzen değişiminden hemen sonra çerçeveden gelen durum paneli yeniden yerleştiriyor ve test eski koordinata tıklıyor. Test artık tıklamadan önce çubuğun yerinin oturmasını bekliyor; kök neden kesin doğrulanmadı.
- **Kanıt:** `npm run check` (289/289). `toolbar-browser` (her motorda iki kez), `subtitle`, `hud-state`, `tooltip`, `dialog-keyboard`, `ui-smoke` Edge ve Firefox'ta geçti. Ekran görüntüsüyle Atlas, yüksek kontrast, Daylight ve Easy-read geçişi kontrolü.
- **Sınır:** Gerçek site denenmedi. Araç çubuğu hâlâ önizleme anahtarıyla açılıyor; varsayılan yapılması kullanıcının karşılaştırmasından sonra.

## Kompakt araç çubuğu: Settings grubu, v0.7.21 — 15 Kasım 2026

Kullanıcı istedi: "settings grubuna başla". Tasarım Figma "Model 5 · rev 4" Settings çizimi. Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Kapsam:** Dil (Türkçe/English, dar kutu), Picture & night (Reset all başlığın sağında, üç kaydırıcı, Night mode ve Invert, ayarlıyken düğmede nokta), tema adı düğmesi (tema adı başlığın sağında, liste, önceki/sonraki, örnek renkler; tekerlekle tema değişir). Help bu grupta hep açık, sağ uca hizalı; diğer kutular yanında açılır.
- **Ek:** Açılır kutulardaki bütün kaydırıcılar fare tekerleğine bağlandı. v0.7.20 kaydındaki "altyazı kaydırıcıları tekerlekle" ifadesi o sürüm için doğru değildi; düzeltme bu sürümde (TOOLBAR_REDESIGN.md §6'da not edildi). Bildirim, üst ortaya uzanan açık kutuların altına iniyor.
- **Kanıt:** `npm run check` (289/289). `toolbar-browser.cjs` (Help'in yeri ve kalıcılığı, kutunun Help'in yanında açılması, tekerlekle parlaklık, gece modu videoda ve klasik panelde, Reset all, dil geçişi, tema önceki/sonraki ve tekerlek, grup listesinde Help'in çekilmesi, kısayol rehberinin açılması; gömülü çerçevede gece modunun çerçevedeki videoya ulaşması), `subtitle-browser`, `hud-state`, `tooltip`, `dialog-keyboard` ve `ui-smoke` Edge ve Firefox'ta geçti. Ekran görüntüsüyle Atlas, Daylight ve alt yarı kontrolü.
- **Sınır:** Gerçek site denenmedi. CDN ölçümü testte tıklanmadı (ağ isteği); yalnız varsayılan açıklaması sınandı. Accessibility grubu sırada; araç çubuğu hâlâ önizleme anahtarıyla açılıyor.

## Kompakt araç çubuğu: Subtitles grubu, v0.7.20 — 15 Kasım 2026

Kullanıcı Subtitles grubuna geçişi onayladı ("Evet, geç"). Ayrıntı: TOOLBAR_REDESIGN.md §6.

- **Kapsam:** Load file (ipucunda .srt/.vtt), göz simgeli Shown/Hidden, `− 100ms +` zamanlama (adım 50 ms–1 s, tekerlek), şu anki kaymayı gösteren kutu ve şerit, Appearance kutusu (White/Yellow başlığın sağında, kaydırıcılar, sıfırla). Düğmeler klasik panelin işlevlerini kullanır; durum tek kaynakta.
- **Düzeltme:** Grup değişince araç çubuğu sağ kenarını koruyup sola büyür ve pencere içine sıkıştırılır; geniş grup sağdan taşıyordu.
- **Köprü:** `subtitle-offset` gömülü çerçeveye tüm adımlarla (±50…±1000 ms) gider; protokol testi kabul/ret durumlarını sınar.
- **Kanıt:** `npm run check` (289/289). `toolbar-browser.cjs` (altyazı yükleme, göster/gizle, adım ve tekerlek, kayma ve sıfırlama, görünüm, gömülü çerçevede −250 ms) ve `subtitle-browser.cjs` Edge ve Firefox'ta geçti; `hud-state`, `tooltip`, `dialog-keyboard` Edge'de, `ui-smoke` Firefox'ta geçti. Ekran görüntüsüyle görsel kontrol (Atlas).
- **Sınır:** Gerçek site denenmedi. Settings ve Accessibility grupları sırada; araç çubuğu hâlâ önizleme anahtarıyla açılıyor.

## Araç çubuğunda logo ve tema uyumlu kapatma, v0.7.19.1 — 15 Kasım 2026

Kullanıcı istedi: kapatma düğmesinin kırmızısı temadan bağımsız duruyordu; adın yazısı yerine ürünün kendi logosu kullanılmalıydı.

- **Kapatma:** X düğmesi artık temanın yazı, kenarlık ve yüzey renklerini kullanıyor (`--pvc-text`, `--pvc-border`); kırmızı (`--pvc-danger`) kaldırıldı.
- **Logo:** Araç çubuğunun başında klasik başlıktaki ürün logosu (`FILMDECK_LOGO_URL`, `.pvc-product-logo`) aynı tema filtresiyle (koyu temada beyaz, açık temada siyah); görsel yüklenemezse "FilmDeck" yazısı yedek olarak görünür. Logoya basılı tutup sürükleme ve üzerine gelince kapatma baloncuğu aynen çalışır.
- **Kanıt:** `npm run check` (289/289), `toolbar-browser.cjs` Edge ve Firefox'ta geçti. Atlas ve Daylight temalarında ekran görüntüsüyle görsel kontrol.

## Kompakt araç çubuğu önizlemesi: iskelet ve Player grubu, v0.7.19 — 14 Kasım 2026

Kullanıcı tasarımı onayladı ve uygulamayı başlattı. Ayrıntı ve kalan işler: TOOLBAR_REDESIGN.md §6.

- **Kapsam:** Araç çubuğu klasik panelin kökünün içinde; düzen açıkken kök saydamlaşır, klasik içerik gizlenir ama DOM'da kalır. Sürükleme, konum hafızası, tema, boşta solma ve gömülü oynatıcı köprüsü ortak. Düğmeler klasik panelin işlevlerini çağırır; değerler klasik panelden okunur. Player grubu, FilmDeck/X baloncuğu, PiP, kısayol, rapor, grup düğmesi, tek açılır kutu, üst/alt yarı kuralı, dar pencerede klasik panele dönüş ve fare tekerleği hazır. Diğer üç grupta "Klasik panelde aç" düğmesi var.
- **Ara karar (Claude):** Diğer gruplar olmadan araç çubuğu varsayılan yapılmadı; erişim kesilirdi. Klasik panel varsayılan; Ayarlar › Erişilebilirlik › "Kompakt araç çubuğu (önizleme)" ile açılır. Düzen tercihi `layout` alanıyla çerçeveler arası tercih köprüsüne eklendi (`frame-protocol.js` şeması).
- **Kanıt:** `npm run check` geçti (289/289 Node; yeni `toolbar.test.cjs` yön, dar pencere, adım/grup kurallarını ve çevirileri sınar). Yeni `toolbar-browser.cjs` Edge ve Firefox'ta geçti: hız/ses/Mono/sarma adımı/tekerlek, tek kutu, alt yarıda üste açılma, grup listesi, tema rengi, X ile kapatma ve ayrı kökenli iframe'de üst araç çubuğunun çerçevedeki videonun hızını değiştirmesi. Firefox'ta ilk turda bir kez X ile kapatma adımında zaman aşımı oldu; sonraki 5 turda yeniden üretilemedi, nedeni bulunmadı. `ui-smoke`, `tooltip-browser`, `hud-state-browser` iki motorda, `hud-continuity-browser` Firefox'ta geçti. `hud-continuity-browser` Edge'de bu makinede başarısız: kapatıp açınca sağ boşluk 16 yerine 31 px (test sayfasının kaydırma çubuğu); aynı ölçüm `main` kodunda birebir aynı, değişiklikten değil. Görsel kontrol Edge ekran görüntüleriyle (Atlas, Daylight, Forge temaları; alt yarı).
- **Sınır:** Gerçek site denenmedi. Gerçek sarma etkisi (test videosu canvas akışı), sürükleme ve dar pencere geçişi tarayıcıda otomatik sınanmadı; dar pencere kuralı saf işlev testinde. Kare kaybı sorusu, "etkin oynatıcı bekleniyor", kaynağı yeniden dene ve DRM rozeti araç çubuğu düzeninde görünmez (ertelenen kararlar). Hızlı art arda tık çift tıklama sayılır ve grup listesini açar (tasarım gereği). Uzak CI görülmedi.

## C araç çubuğu tasarımı — 13–14 Kasım 2026

Kod değişmedi; tasarım Figma'da (`FilmDeck MEC523 Wireframes`, sayfalar "C + tabs (models)", "Mode switch (models)", "Model 5 · current vs planned"). Reddedilen modeller silinmedi, sayfada işaretli duruyor.

- **Seçilen yön:** Model 5. Araç çubuğunun en sağındaki düğme grupları sırayla değiştirir (Player → Subtitles → Settings) ve grubun adını yazar; solundaki düğmeler gruba göre değişir. Kullanıcı gerekçesi: HMI ilkemiz gereği her şey simgeyle birlikte adıyla da yazılmalı.
- **Elenen:** Model 6 (dikey kayar anahtar) kesin elendi. Model 4, 7, 8, 9 karşılaştırma için sayfada duruyor.
- **Player grubu, rev 2 (14 Kasım, kullanıcı istekleri):** hız kutusunda yalnız hız; ileri/geri sarma araç çubuğunda `« 10s »` biçiminde, ortadaki 10s'e basınca adım (5/10/30/60 sn) ve doğrudan atlama (−30/−10/+10/+30) açılır; Stereo/Mono ses kutusunun başlığının sağında; o an oynatılan çözünürlük araç çubuğunun altında "Playing 1280×720 · Refresh" şeridinde; PiP ve kısayol aç/kapa araç çubuğunda.
- **Kullanıcıda açık:** Stereo/Mono denetiminin görünümü. Kullanıcı başka sitelerdeki düğme modellerini inceleyip bildirecek; o zamana kadar yer tutucu.
- **Açık karar:** Adaptör ve video hedefi kalite kutusunun altında ("Player detection") mı, Settings grubunda mı. Kısayol aç/kapa hem araç çubuğunda hem Accessibility içinde mi kalacak.
- **14 Kasım, kullanıcı kararları:**
  - Küçültme düğmesi yok. Kapatma, FilmDeck adının üzerine gelince yanında açılan küçük baloncukta (ada tıklayınca kapatma önerilmedi: kazayla kapanma riski).
  - Dört grup: Player, Subtitles, Settings, Accessibility. Grup düğmesinde fare tekerleği grup değiştirir; çift tıklama dört grubun listesini açar.
  - **Fare tekerleği değer değişikliklerinde de kullanılacak** (hız, ses, sarma adımı, altyazı zamanlaması gibi). Uygulamada yalnız imleç o denetimin üzerindeyken sayfa kaydırması engellenir; klavye karşılığı da olmalı.
  - PiP ve Shortcuts yalnız simge; adları üzerine gelince ve klavye odağında görünür.
  - Subtitles: "Load file" üzerine gelince kabul edilen türleri (.srt, .vtt) yazar; zamanlama `− 100ms +` biçiminde, ortaya basınca adım ve sıfırlama açılır; Beyaz/Sarı seçimi "Subtitle appearance" başlığının sağında. Açık/Kapalı'nın yeri ve kayma (offset) değerinin yeri için Claude önerisi Figma'da (Subtitles rev 2).
- **14 Kasım, ikinci tur (rev 3):**
  - Araç çubuğunun başında yalnız "FilmDeck" yazısı, simge yok. Üzerine gelince yalnız X simgeli kapatma baloncuğu çıkar, sola doğru açılır.
  - **Bütün ipuçları ve baloncuklar panel temasını kullanır** (beyaz değil). Bu kural bütün sistemlere uygulanır.
  - Çift tıkla açılan grup listesi, seçili grup düğmesinin mavi kutusuyla aynı genişlikte sabit; "1 / 4" sıra yazısı yok. Bunun için grup düğmesinin genişliği en uzun ada ("Accessibility") göre sabitlenir.
  - Subtitles aç/kapa göz simgesiyle kalır; yeri Load file'ın hemen sağı.
  - Açılır kutuların içi eski paneldeki gibi biraz daha açık renkli kutulara bölünür, alanların sınırı belli olur.
  - Settings: Picture ve Night mode birlikte (ikisi de video filtresi). Tema düğmesinde o anki tema adı yazar (ör. "Aurora"). Klavye kısayolu aç/kapa Settings'te yok; Help'te yalnız bilgi rehberi. Settings grubuna geçince Help kutusu kendiliğinden açık durur.
  - **rev 4 (14 Kasım):** grup düğmesi o anki adın genişliğinde (sabit genişlik kaldırıldı), liste en uzun ada göre; rapor simgesi her grupta solda; dil kutusu kendi içeriği kadar; Reset all "Picture & night mode" başlığının sağında; tema adı "Theme" başlığının sağında; Help maddelerinde simgeler. Teknik kurallar ve bugünkü özelliklerin yeni yerleri [TOOLBAR_REDESIGN.md](../design/TOOLBAR_REDESIGN.md) içinde; açılır kutular araç çubuğu ekranın üst yarısındaysa altta, alt yarısındaysa üstte açılır.
  - Settings/Accessibility ayrımı Claude'a bırakıldı: Settings = dil, görüntü ve gece filtresi, tema, Help; Accessibility = paneli açık tut, büyük yazı, yüksek kontrast, hareketi azalt (her biri araç çubuğunda tek tıkla açılıp kapanan düğme). Kısayol aç/kapa her grupta solda duran simgede kalır, Accessibility'de ikinci kez yer almaz.

## I-03 kullanıcı denemesi, Kick — 13 Kasım 2026

Kullanıcının kendi denemesi, v0.7.18, Firefox, canlı yayın. Kod değişmedi, yeniden üretilmedi.

- **Hız:** Canlı uçta hız değişikliği etkisizdi; kullanıcı bu yüzden yayının geçmişine geri dönüp izlerken denedi. Orada da panelde değiştirilen hız Kick'in kendi arayüzünde görünmüyor.
- **Ses:** Panelde %0 seçildikten sonra seçilen ilk değer sitenin arayüzüne yansıyor; ondan sonraki değişiklikler yansımıyor. Sonraki değerler rastgele ve hep %100'ün altındaydı. v0.7.10'daki "oynatıcıya verilen ses sitenin simgesine yansır" kabulü bu sırada geçmiyor.
- **Durum:** Açık. Kullanıcı önce C araç çubuğunu seçti. I-03'e dönüldüğünde Firefox'ta, canlı yayının geçmişinde (DVR) ve canlı uçta ayrı ayrı yeniden üretilecek; canlı uçta hızın etkisiz kalması beklenen bir sınır olabilir, ayrıca kontrol edilecek.

## v0.7.18 pre-release hazırlığı — 6 Kasım 2026

Kullanıcı istedi; `main` `faa9f8d` üzerinden. Mağazaya gönderilmedi (`storeStatus: not-submitted`). Notlar: RELEASE_NOTES_v0.7.18.md.

- **Paketler:** `NOk-Release-Core` `package filmdeck` ile Chrome ve Firefox ayrı ZIP; `npm run check` komut içinde geçti. Git dışı `NOk-FilmDeck-Release/artifacts/` altında (`0.7.18-3f8f631d97fd`, `0.7.18-db738b2012e3`); eski arşivlere dokunulmadı, o depoya commit atılmadı.
- **Denetim:** Ürün dosyaları ve lisans bildirimleri kaynakla bayt bayt aynı. Fazla dosya yok. Taramada çıkan tek kişisel veri raporun e-posta seçeneğindeki geliştirici adresi; v0.7.0'dan beri kaynakta açık. İki ZIP açılıp kurularak denendi: panel, sürüm, rapor, gerçek videoda hız ve filtre.
- **Yayın:** Kullanıcı kendi hesabıyla yayınladı (6 Kasım): `v0.7.18-pre_release`, pre-release işaretli, `0bddeaa` üzerinde. Paketler `faa9f8d` durumundan üretildi; arada yalnız belgeler ve test sürücüsü değişti. GitHub'dan indirilen iki ZIP'in SHA-256 değeri notlardakiyle aynı. Mağazaya gönderilmedi.

## Sürüm kontrolü: etiketli tag ve zorla güncellenen dal — 6 Kasım 2026

Ürün kodu değişmedi, sürüm artmadı. `scripts/check-extension.cjs` iki durumda yanlış alarm veriyordu.

- **Etiketli tag:** Kural v0.7.7'de eklenmiş, `v0.7.18-pre_release` adını reddediyordu (#96). Bu adı ajan önermişti. Artık `v<sürüm>` veya `v<sürüm>-<etiket>` kabul edilir; sürüm yine tam eşleşmelidir. Yerelde aynı mesaj üretildi.
- **Zorla güncellenen dal:** Dependabot dalı (#108) her güncellemede zorla yazılıyor; önceki commit klonda olmadığı için push koşusu düşüyordu (#76, #90). PR koşuları geçiyordu. Artık o commit yoksa uyarı yazar ve yalnız sürüm karşılaştırmasını atlar; PR koşusu gerçek tabana karşı karşılaştırmaya devam eder. Yerelde aynı hata üretildi; CI günlüğü okunmadı.
- **Kanıt:** 284/284 Node; üç yeni test önce kırmızı. Uzak CI görülmedi.
- **Sınır:** `v0.7.18-pre_release` tag'i eski betiği içeren `0bddeaa`'yı gösterir, #96 yeniden çalıştırılsa da düşer. Yayın ve ZIP'ler bundan etkilenmez, tag taşınmadı. #108 ancak `main` bu düzeltmeyi aldıktan ve Dependabot dalı yenilendikten sonra push kontrolünü geçer.

## CI'da Firefox sürücü başlangıç zaman aşımı — 6 Kasım 2026

- **Belirti:** Yalnız belge değiştiren `35f48e6` koşusunda (#92) `frame-loss` adımı Firefox'ta 39 sn'de düştü. Hata satırını kullanıcı günlükten verdi: `BiDi timeout: webExtension.install`. Test kendi adımlarına gelmedi; ürün veya bildirim hatası değil.
- **Neden:** Sürücü her BiDi komutunu 20 sn bekliyordu; yoğun makinede Firefox başlangıcı ve eklenti kurulumu bunu aşabiliyor. Yerelde işlemci yükü altında aynı hata 4 turda 2 kez üretildi (`session.subscribe`, `webExtension.install`).
- **Düzeltme:** `tests/resource-driver.cjs` başlangıç komutları ve Firefox başlangıç bekleyişi 60 sn; sayfa içi komutlar 20 sn kalır. Ürün kodu değişmedi, sürüm artmadı.
- **Kanıt:** Aynı koşulda 4 turda 4 geçti. Küçük örnek; CI'da ara ara düşüşün bittiğini ancak sonraki koşular gösterir.
- **Ayrı, incelenmedi:** Playwright 1.64.1 Dependabot dalının push koşusu (#90) kaynak kontrolünde 1 sn'de düştü, aynı commit'in PR koşusu (#91) geçti.

## I-11 altyazının neden görünmediğini söyleme, v0.7.18 — 6 Kasım 2026

**Durum: yerel kapsam tamam (tarayıcı kabulü aynı gün, kod değişmeden; #96'nın o anı yeniden üretilemedi).** Kaynak rapor #96: altyazı yüklendikten sonra video bir süre yüklenmedi; raporda `readyState: 1` ve `no-active-cue` var, kullanıcı kendi internetinden olabileceğini de yazmış.

- **Eklenen:** Altyazı sekmesinde, dosya yüklüyken ekranda satır yoksa nedeni yazar: gizli, video yok, video görünür alanda değil, tarayıcının kendi yüzeyinde, video yükleniyor, şu an satır yok ve sıradaki satırın süresi, dosya bitti. Duran video "yükleniyor" sayılmaz. Gömülü oynatıcıdan panele yalnız sayı ve evet/hayır gider, satır metni gitmez, rapora girmez.
- **Düzeltilen:** Panel kapalıyken video öğesi değişirse altyazı duruyordu, çünkü yeni öğede dinleyici yoktu; video kaybolursa son satır ekranda kalabiliyordu. Basış sonrası mevcut 750 ms döngüsü dosya yüklüyken bunu da yapar. Yeni zamanlayıcı yok.
- **Kanıt:** 281/281 Node; yeni testler önce kırmızı. Yeni `subtitle-browser` iki motorda geçti; değişen video düzeltmesi geçici olarak çıkarılınca tam o adımda düştü. `0972024` için uzak CI'da yedi iş geçti (o sırada `subtitle-browser` CI'da değildi, sonra eklendi). Görsel kontrol Edge'de TRT sayfasında: açıklama satırı ve oynatıcının üstünde çizilen satır.
- **Ölçüm, altyazı yüklemek videoyu durduruyor mu:** Bu ölçümde hayır. Aynı oynatmada yüklemeden önce ve sonra 15'er sn; TRT, Puhu ve yerel video, iki motor, 2000 satır. Sonrasında bekleme olayı 0, `readyState` hep 4, medya 15 sn'de 15 sn ilerledi, kalite listesi aynı kaldı. Yükleme 8-11 ms. TRT'de sitenin kendi metin izi de varken değişiklik yok.
- **Ağır dosya:** 20.000 satırda (gömülü oynatıcı sınırı) yükleme Firefox 331 ms, Edge 11 ms; +100 ms senkron kaydırma Firefox 369 ms, Edge 132 ms sayfayı tutar, video durmadı. 2000 satırda 13 ms'nin altında. Gerçekçi dosya boyutu olmadığı için değiştirilmedi.
- **Sınır:** #96'daki bekleme (eski sürüm 0.7.0.1, `readyState: 1`) yeniden üretilemedi. Kullanıcının tahmin ettiği gibi ağ kaynaklı olabilir, bu kanıtlanmış değildir. Tek tur, kısa pencere; zayıf bağlantı ve her içerik denenmedi.
- **Görülen, değiştirilmeyen:** İngilizce bildirimde tek satırlı dosyada "1 cues" yazıyor. Varsayılan altyazı konumu sitenin alt kontrolleriyle üst üste gelebiliyor; konum ayarı zaten var.

## TRT hız koruması gerçek sayfada doğrulandı — 6 Kasım 2026

Kullanıcının verdiği, TRT'nin kendi oynatıcısını kullanan sayfa; geçici profil, hesap yok, iki motor, içerik adı kaydedilmedi. Kod değişmedi.

- **Sonuç:** `TrtAdapter`, Shaka, 5 kalite. 2x 60 sn tuttu; 60 sn ileri atlamadan ve 480p seçiminden sonra da tuttu (çözülen görüntü 480p). `TRT_RATE_INTERCEPTED` kaydı korumanın gerçekten çalıştığını gösteriyor. 1x'e dönünce koruma bırakıldı (`playbackRate` öğeden kalktı).
- **Sınır:** Tek sayfa; yayın boyunca uzun süre veya reklam kuşağı denenmedi.

## CI'da Firefox rapor testi ve hareket azaltma, v0.7.17 — 6 Kasım 2026

- **Belirti:** v0.7.15 ve v0.7.16'da `Browser smoke (firefox)` `report` adımında düştü; o adımdan sonraki `frame-loss` ve `tooltip` CI Firefox'ta çalışmadı. Chromium işi geçti. Günlük oturum istediği için okunamadı, adım adı API'den alındı.
- **Neden (yerelde üretildi):** Panel hareket azaltma ayarını işletim sisteminden alır. D-08 ve D-09 testleri başta kapalı varsayıp tersine çeviriyordu. Firefox profiline işletim sistemi tercihi verilince aynı test düştü. CI makinesinin tercihi doğrudan görülmedi; kanıt bu üretim ve yalnız Firefox'un düşmesidir.
- **Düzeltme:** Testler başta ayarı kapatır. `--os-reduced-motion=true` ile yerelde sınanabilir.
- **Bulunan ürün hatası:** Hareket azaltma açıkken işaretli onay kutusunun çizim geçişi kapanmıyordu, işaretli durum kuralı daha ağır basıyordu. Düzeltildi; test önce kırmızı (`0.2s`, `0.3s`), sonra yeşil.
- **Kanıt:** `report`, `frame-loss`, `tooltip` Firefox'ta işletim sistemi tercihi açıkken ve Chromium'da geçti; `report` ve `tooltip` Firefox'ta tercih kapalıyken de geçti. `04eba36` için uzak CI'da yedi işin hepsi geçti; `frame-loss` ve `tooltip` CI Firefox'ta ilk kez çalıştı.
- **CI-2:** Kullanıcı `Browser media` kontrollerini `main` kuralına ekledi (6 Kasım).

## D-09 panel tooltip'i, v0.7.16 — 6 Kasım 2026

- **Değişen:** Adaptör rozeti, CDN düğmesi, kalite düğmeleri ve kalite durum satırındaki açıklamalar tarayıcı ipucundan kendi tooltip'imize geçti. Adaptör açıklaması artık seviyesini anlatır; kalite düğmesi ve durum satırı isteğin gerçek durumunu anlatır. Kalite düğmelerindeki "1080p • 1080p" gibi görünen etiketi tekrar eden eski ipucu kaldırıldı, varsa bit hızı yazar. Gömülü oynatıcıda düğmeler için ipucu yoktu, artık var.
- **Davranış:** Fare 400 ms sonra açar, yana geçişte bekletmez, imleç metne gidebilir, basınca kapanır. Klavye odakta hemen açar, Esc yalnız tooltip'i kapatır. Dokunmatikte düğmede 500 ms basılı tutma işlemi çalıştırmadan açar, rozet ve durumda kısa dokunuş yeter. Rozet ve durum satırı yalnız açıklaması varken Tab ile ulaşılır. Zamanlayıcı ve pencere dinleyicisi yalnız açılırken ve açıkken vardır.
- **Testle bulunan hata:** Genel azaltılmış hareket kuralı tooltip'e işlemiyordu (aynı ağırlık, önce geliyor); ayrı kural eklendi.
- **Kanıt:** 268/268 Node; 14 tarayıcı testi iki motorda (28/28), yeni `tooltip` dahil. Kalite açıklamaları gerçek Video.js ile `quality-mapping` içinde. Görsel kontrol Edge'de, büyük yazı ve yüksek kontrast dahil. Uzak CI görülmedi.
- **Sınır:** Dokunmatik sentetik olaylarla sınandı, gerçek telefonda değil. Ekran okuyucuda dinlenmedi, yalnız `aria-describedby` bağlantısı doğrulandı.
- **Yan bulgu (değiştirilmedi):** Büyük yazıda "CDN yanıtı" düğmesinde sözcük harf ortasından bölünüyor. Bu değişiklikten gelmiyor.

## D-08 rapor animasyonları, ölçüm ve kare kaybı bildirimi, v0.7.15 — 5 Kasım 2026

Geçici profil, hesap yok, iki motor. Ayrıntı ve tablolar: ANIMATION_PERFORMANCE.md, ANIMATION_DETAILS.md.

- **Rapor penceresi:** Checkbox'ta 0,15 sn gecikmeli çizim, 48 px hover halkası ve hover rengi; metin alanında odakta üst ve alt çizgi. Azaltılmış hareket hepsini kapatır. Metin alanında tam güçteki odak halkası çizgileri örttüğü için soluklaştırıldı; yüksek kontrast kendi halkasını korur.
- **Kare kaybı bildirimi:** Son 4 pencerede toplam en az %15 ve en az 2 kötü pencere olursa panelde sorar. Kendisi bir şey değiştirmez. "Evet" mevcut azaltılmış hareket ayarını açar ve varsa filtreleri sıfırlar; "Hayır" sayfa yenilenene kadar geçerlidir. Gömülü oynatıcıda ölçüm medyanın çerçevesinde, soru görünen panelde. Yeni zamanlayıcı yok; panel kapalıyken sayaç okunmaz.
- **Ölçüm sonucu:** Filtreler asıl maliyet (Firefox 3D yaklaşık 1 → 43). Rapor animasyonları ve denenen geniş adaylar bu makinede ölçülebilir kare kaybı vermedi; tek donanım, geniş eklemeler uygulanmadı. Azaltılmış hareket boşta panelde ölçülebilir kazanç vermiyor. Basış sonrası reklam denetimi gerçek sayfada tick başına medyan 0,2-2 ms.
- **Yan düzeltme:** Rapor kaydırılınca görünmez checkbox'lar yerinde kalıp başka alanların üstüne binebiliyordu.
- **Kural değişikliği:** İlk kural (art arda 4 kötü pencere) gerçek yükte Edge'de hiç sormadı; dalgalı kayıp için son 4 pencere kuralına geçildi.
- **Kanıt:** 258/258 Node, 12 tarayıcı testi ve yeni `frame-loss` iki motorda (26/26). Firefox'ta gerçek sayaçlarla bildirim çıktı.
- **Açık sınır:** Edge'de eşiği aşan gerçek kayıp üretilemedi, sorma yolu orada taklit sayaçla doğrulandı. Ağır yükte Edge video kareleri üretmedi ama çoğunu düşen saymadı, bildirim çıkmadı. Sayaçlar her takılmayı görmez. Uzak CI görülmedi.

## Puhu eski oynatıcıda boş kalite listesi, v0.7.14 — 5 Kasım 2026

Geçici profil, hesap yok, iki motor. İçerik adı kaydedilmedi.

- **Kök neden:** Taranan 12 içerikten biri eski site oynatıcısını kullanıyor: kalite API'si olmayan Video.js 5.20.4 kabuğu, altında Hls.js. `PuhuTvAdapter` Video.js'i görünce Hls.js listesine hiç bakmıyordu. Kalite uygulama yolu da Video.js'e gidiyordu. Hls.js'te seviye vardı, rapor `playerLevelCount: 1` diyordu.
- **Düzeltme:** Video.js listesi boşsa Hls.js listesi kullanılır, Hls.js seviyesi Hls.js üzerinden uygulanır. Video.js'in listesi varsa öncelik değişmez.
- **Kanıt:** O içerikte iki motorda `0 levels` yerine `1 level` (1080p). Sitenin kendi listesinde de tek seviye tanımlı, yani 1 doğru sayı. Seçim oynatmayı bozmadı. Yeni oynatıcıda 5 seviye aynı kaldı.
- **Ölçülen, hata olmayan:** Yeni oynatıcıda 1080p seçince görüntü ilk 5-10 sn 240p görünebiliyor (tampon dolarken, `readyState` 2), sonra 1080p'ye çıkıp ölçüm boyunca (35-45 sn) kalıyor. Chromium'da programla ve gerçek fareyle aynı. Firefox'ta 1080p'nin kaldığı görüldü, fareyle tıklama yalnız Chromium'da denendi.
- **Değiştirilmeyen:** Genel `VideoJsAdapter` aynı karışımı Puhu dışında da kaçırabilir. Başka sitede görülmediği için dokunulmadı.

## Basış kuralı, v0.7.13 — 5 Kasım 2026

**Kullanıcı kararı:** Sayfada ilk basışa kadar eklenti denetimi olmaz; bir kez basılınca panel küçültülse veya kapatılsa da reklam hızlandırma o sayfada çalışır. Amaç arka planda sürekli izleme hissini kaldırmak.

- **Değişen:** `content.js` basışı `PVC_PAGE_ARMED` ve `NOK_PAGE_ARMED` ile çerçeve ağacına yayar, sonradan yüklenen çerçeveye de bildirir. `injected.js` reklam denetimini, başlangıç işini ve 15 sn CDN okumasını buna bağlar; panel kapatma artık denetimi durdurmaz; video yokken döngü bitmez.
- **Korunan (kullanıcı uyarısı):** Motorun ve kancaların sayfa yüklenirken girmesi değişmedi. Puhu 1080p yolu bu erken yakalamaya bağlıdır; geç basışta çalıştığı gerçek sitede ölçüldü (AD_CONTROL.md). `ad-lifecycle` testi ağ kancasının basıştan önce yerinde olduğunu da sınar.
- **Bilinen sonuç:** Sayfanın ilk reklamı basılana kadar normal oynar.
- **Ayrı bulgu:** Puhu'da bir içerikte `0 levels`; v0.7.12'de de aynı. v0.7.14'te düzeltildi.

## I-04 gerçek reklam, I-09 ve I-10 sınaması, v0.7.12 — 5 Kasım 2026

Kullanıcı Kick'te reklamın nadir olduğunu söyledi; kabul YouTube'da yapıldı. Geçici profil, hesap yok, bot doğrulaması çıkmadı, içerik adı kaydedilmedi.

- **Düzeltilen hatalar:**
  - Reklam bitip hız 1x olunca panel hâlâ `16x` veya reklam öncesi hızı gösteriyordu.
  - Bitişte reklam başındaki ses seviyesi yazılıyor, YouTube'un içerik için seçtiği seviyeyi eziyordu (Firefox'ta 0,47 → 0,56). Artık yalnız seviye 0'a çekildiyse geri yazılır.
  - Panel gerçek sesi kaçırabiliyordu: video hazır olmadan açılınca hiç okunmuyor, Firefox 16x'te sessize alma olayını vermiyordu. Panel açıkken denetim döngüsü artık okuyor.
- **Reddedilen varsayım:** Reklam sonrası 16 saniyelik boş videonun hızlandırmadan kaynaklandığı düşünüldü. Eklentisiz Chromium'da boşluk 7,6 ve 7,8 sn, FilmDeck'le 1,8 sn, Firefox'ta 0,3 sn çıktı. Az örnektir.
- **Karar sorulan durum (v0.7.13'te çözüldü):** Reklam denetimi yalnız panel açıkken veya açılışın ilk saniyesinde video varken başlıyor, panel kapanınca duruyor. Panel hiç açılmayınca gerçek reklam 176 saniye 1x ve sesli oynadı.

**I-09:** Raporlu iframe oynatıcıda tam ekrandan PiP iki motorda açıldı ve çıkışta panel tek kaldı.
**I-10:** YouTube sayfa içi iki geçişte panel açık kaldı, tek panel, oynatıcı geç de olsa bulundu, 1,5x yeni videoya taşındı. Reklam sonrası içerik yüklenirken rozet `GenericAdapter` / 0 seviye gösteriyor; o anda medya yok, içerik başlayınca düzeliyor.

**Kanıt:** Yeni `ad-lifecycle-browser` önce "panelin geri yüklenen hızı göstermesi" adımında kırıldı, düzeltmeyle 5 turda iki motorda geçti (üst sayfa ve iframe). `volume-mirror-browser` geç medya senaryosunda önce kırıldı, sonra geçti. Yeni birim testi seviye yazma hatasında önce kırıldı. 231/231 Node testi. Yeni `youtube-ad-acceptance` iki motorda ikişer gerçek reklamla geçti: en yüksek hız 16x, bitişte 1x ve ses, panel gerçek hız ve sesi gösteriyor. İlk turlarında panel sesi hatasını bu test yakaladı.

**Sınırlar:**
- TRT hız koruması doğrulanamadı: `trtizle.com` tabii'ye yönleniyor, TRT 1'in denenen dizisinin bölüm sayfası YouTube gömmesi kullanıyor ve gömülü oynatıcı test profilinde açılmadı.
- Canlı Kick reklamı görülmedi, `ad-badge` doğrulanmadı.
- YouTube'da reklam kalitesi düşürülmüyor; yol tanımlı değil.
- Art arda reklamlarda YouTube değerleri sıfırlıyor, 750 ms içinde yeniden uygulanıyor; bu aralıkta reklam duyulabilir.

## I-05 erken bağlanan Hls.js, v0.7.11 — 5 Kasım 2026

**Kök neden:** Motor sayfaya `<script src>` ile sonradan yükleniyor. Sayfa Hls.js'i ondan önce bağlarsa `attachMedia` kancası kaçıyor ve Hls.js örneği sonradan bulunamıyor. Aynı sayfa geç bağlanınca sorun yok. Yalnız Firefox'a özgü değil: Chromium'da da iframe içinde 2/2 tekrar etti, gerçek sitede Chromium yarışı kazandığı için görülmüyordu. Mevcut testler motoru bekleyip bağladığından bu yarışı göstermiyordu.

**Düzeltme:** Yeni `early-hooks.js` manifestten `world: "MAIN"` ile sayfa betiklerinden önce çalışır, Hls.js ve Shaka'nın bağlandığı videoyu not eder; motorun zaten okuduğu alanı doldurur. Yeni izin yok, asgari Firefox 121 kalıyor. Paketleme listesi manifestten türediği için yayın deposunda değişiklik gerekmiyor.

**Kanıt:** `hls-early-attach-browser` eski kodda bağlanma adımında başarısız oldu, düzeltmeyle üst sayfa ve ayrı kökenli iframe'de iki motorda geçiyor; Firefox'ta motor bağlanmadan önce hazır değildi, yani yarış gerçekten yaşandı. Raporlu gerçek sitede Firefox `GenericAdapter`/0 seviye yerine `HlsJsAdapter`/1 seviye gösteriyor, Chromium'la aynı. 230/230 Node testi. `ui-smoke`, `hud-state`, `hud-continuity`, `dialog-keyboard`, `volume-mirror`, `cdn-measure`, `pip`, `startup`, `report`, `quality-mapping` iki motorda geçti. Yeni test `Browser media` CI işine eklendi; uzak sonuç commit'ten sonra görülecek.

**Sınırlar:**
- Global `Hls` açmayan, pakete gömülü oynatıcılar bulunmaz; aynı betikte kütüphane ve bağlamayı birlikte yapan satır içi kod da kaçar.
- Erken yakalanan oynatıcıda rapordaki `declaredLevelCount` boş kalabilir, çünkü manifest olayı kaçmıştır. Yalnız teşhis alanıdır, kalite listesini etkilemez.
- Shaka yolu yalnız birim testiyle sınandı, gerçek Shaka çalıştırılmadı.
- Firefox 121–127'de `world` alanının yok sayıldığı çalıştırılarak doğrulanmadı. AMO doğrulayıcısı yayın sırasında uyarı verebilir; yayın hazırlığında bakılmalı.
- Düzeltme kalite eksikliği şikâyetlerinin tamamını çözmez; I-05'in diğer siteleri açık.

## Dört aşamalı araç incelemesi — 5 Kasım 2026

Ürün kodu değil, `D:/NOk-Tools` değişti. Kullanıcı kararıyla yeni adaylar sırayla geçer: indirmeden `preview`, statik tarama, `triage` ile gerekçeli karar, deneme. Bağlantının gittiği alan adı görünür, kapsam eksikleri tek tek çözülebilir, CRITICAL bulgu, veri aktarımı ve okunamayan kod kullanıcı kararı ister. Genel programlar için ayrı `assess-tool` yolu var. Otomatik onay eşiği ve politika değişmedi. Kod çalıştıran deneme için izole ortam kurulmadı.

**Kanıt:** 48/48 guard testi, sekiz onay yerinde, `Test-NOkTools` PASS, hook deny/normal denemeleri geçti. Dokuz adayda ön inceleme çalıştı, hiçbiri onaylanmadı veya kurulmadı. Sonuçlar `reports/security/candidates-2026-11-05/REVIEW.md`.

## I-03 ses kısmı, gerçek Kick sınaması, v0.7.10 — 5 Kasım 2026

Panelde (eklentisiz) ve ayrı geçici profilde kurulu eklentiyle gerçek Kick sınandı. Hesap kullanılmadı, kanal adı kaydedilmedi, bot doğrulaması çıkmadı.

- **Düzeltilen hata:** Site sesi %50'de oynarken panel kaydırıcısı %100 gösteriyordu; ilk dokunuşta ses sıçrayabilirdi. Panel artık gerçek düzeyle açılıyor, sitenin kendi sesi veya sessize alması panele yansıyor. Panelden verilen değer ve %100 üstü güçlendirme korunuyor; reklam döngüsü sırasında panel değeri değişmiyor. Tüm sitelerde geçerlidir.
- **Çalıştığı doğrulananlar:** İki motorda 5 kalite listelendi, panel sesi oynatıcıya ulaştı, 0 sessize aldı, 160p çözülmüş görüntüyle doğrulandı. Panelde oynatıcıya verilen sesten sonra sitenin ses simgesi değişti.
- **Reddedilen varsayımlar:** Eklentisiz panel gözlemi yanıltıcı oldu. "FilmDeck oynatıcıyı bulamıyor" varsayımı kurulu eklentiyle yanlış çıktı; eklenti sayfadan sonra yüklense de oynatıcı bulunuyor. Panelde `#channel-player` yoktu ama adaptörün diğer kökü `#injected-channel-player` var. Kanal değişiminde sesin 0 başlaması eklentisiz de oluyor, sitenin davranışıdır. Reklam döngüsü olay kaydında görülmedi.

**Kanıt:** Yeni `volume-mirror-browser` eski kodda "panel opens at the media level" adımında başarısız oldu, düzeltmeyle üst sayfa ve iframe için iki motorda geçiyor (CI matrisinde). `kick-site-acceptance` Firefox'ta 3/4, Chromium'da 6/7 geçti. Başarısız iki turdan birinde neden "live video plays" zaman aşımıydı, diğerinin nedeni yakalanmadı; canlı siteye bağlı aralıklı sonuçtur. 224/224 Node testi; `ui-smoke`, `hud-state`, `dialog-keyboard`, `report`, `cdn-measure` iki motorda geçti.

**Sınırlar:** Sitenin ses kaydırıcısının ve VOD hız menüsünün görsel kabulü açık. `#channel-player` ve `player-settings-button` gibi seçiciler bu sayfada yoktu; `triggerKickUiQuality` ve hız menüsü yollarının etkisi ayrıca sınanmalı. Gerçek reklam görülmedi; `ad-badge` işareti doğrulanmadı (I-04). Bir sayfa tüm kanalları temsil etmez.

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
