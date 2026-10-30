# Etkin çalışma kapsamı

## v0.7.7.2 — 30 Ekim 2026, görünür amblem ve About FilmDeck

Son kontrol: 180 Node testi ve ikon/sürüm sözleşmesi geçti. Firefox 159.0 ve Chromium tabanlı Edge 152.0.4191.53'te 20 tema, EN/TR, dar pencere, görünür logo ve About FilmDeck yerleşimi geçti. Tam deck'in gerçek boyutlu açık/koyu PNG önizlemesi incelendi; canlı araç çubuğu/HiDPI kabulü ayrıca kullanıcıda doğrulanmalıdır. Kaynak v0.7.7.2, uygulama commit/push/PR yapılmadı.

Çalışma dalı `codex/filmdeck-cassette-icon`, `main` ile aynı `ad90ae4` v0.7.7 commit'inden açılmıştır; önceki HUD/CI değişiklikleri eksik değildir. Gizli IMG + CSS maskesi yolu kaldırıldı; özgün yatay logo görünür IMG ve tema filtresiyle çizilir. Önceki maske tanımı kontrolü gerçek çizimi kanıtlamıyordu; yeni görünür IMG kontrolü eski kaynakta başarısız oldu, düzeltmeden sonra Firefox/Chromium'da geçti. Kullanıcının sitesindeki kesin CSP/çizim nedeni doğrudan ölçülmüş sayılmaz. NOk imzası ve sürüm yalnız Settings → About FilmDeck içindedir. 16/32/48/128 px simgeler tüm kaset deck ve arka katmanları korunarak, ek iç boşluk olmadan boyutlandırıldı; özgün 4096 px dosya değişmedi. Eklentiyi yeniden yükledikten sonra açık sayfa da yenilenmelidir: eski motor aynı sayfanın RAM'inde kalabilir.

`HMI_lessons` ve `others-Puhu` dallarının her birinde yalnız bir ek merge commit'i vardı; tree'leri main geçmişindeki sırasıyla `4d71a35` ve `d79dabb` ile aynıydı. SHA lease ile uzak dallar, ardından yerel dallar silindi. `main` ve çalışma dalı korundu. Uygulama değişiklikleri henüz commit/push/PR yapılmadı; önceki gerçek site/performans hedefleri açık kaldıkları kapsamda korunur.

## v0.7.7.1 — 30 Ekim 2026, kaset simgesi

Kullanıcının `icons/filmdeck_kaset_tam_radyus_4096.png` çiziminden saydam 16/32/48/128 px simgeler üretildi; görünür çizim oranı korunup kareye ortalandı ve dış saydam boşluk azaltıldı. Özgün dosyanın SHA-256 özeti değişmedi. Manifest eklenti/toolbar eşlemelerine 32 px boyutu ve CI denetimine aynı boyut eklendi. 179 Node testi ve ikon sözleşmesi geçti; açık/koyu zeminde gerçek boyutlu PNG önizlemesi incelendi. Tarayıcı araç çubuğundaki canlı görünüm ayrıca doğrulanmadı. Çalışma dalı `codex/filmdeck-cassette-icon`; commit/push/PR/yayın yok. Önceki hedeflerin kabul durumu değişmez.

## v0.7.7 — 30 Ekim 2026, simgeler ve otomatik kalite kontrolleri

HUD'da ortak SVG çizgi simgeleri, tema rengini izleyen FilmDeck logo maskesi ve alt `by NOk` imzası uygulandı. Sürüm Ayarlar → Hakkında bölümüne taşındı; kullanıcının araç çubuğu ikonları ve özgün çizimleri korunur. 179 Node testi ve Firefox/Chromium normal/dar pencere HUD kontrolleri geçti. GitHub push/PR için kaynak/sürüm/izin/çalışma dosyaları ile iki motorlu sentetik HUD kontrol akışı hazır; uzak işçide ilk çalışma push sonrasıdır. Komutlar ve kanıt sınırları TESTING.md içinde. Önceki gerçek site/performans hedefleri bu UI/CI işiyle kapatılmadı. Commit, push, ZIP veya release yapılmadı.

30 Ekim 2026. Kaynak sürümü **v0.7.7.2 — FilmDeck by NOk**. Önceki v0.7.0.1 çalışması korunur; yeni kullanıcı raporları mevcut hedefin devamıdır. Tamamlanmış dil/tema/iframe filtre kuyruğu işleri yeniden yapılmaz. Kullanıcı istemeden ZIP, pre-release, normal release veya push hazırlanmaz. Kaynak klasörü esas alınır.

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
