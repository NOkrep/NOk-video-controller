# Etkin çalışma kapsamı

## Güncel durum

5 Kasım 2026. Ayrıntılı envanter PROJECT_HANDOFF.md §6-8, aşağıdakiler en yeni kayıtlardır. Daha eski kayıtlar değişmeden [WORK_HISTORY.md](WORK_HISTORY.md) içindedir.

- **Sürüm:** Kaynak sürümü **v0.7.18**, `claude/workTogether` dalında; `main` de `0.7.18` (#119). PR ve merge kullanıcıda. Sürüm `node scripts/set-version.cjs <sürüm>` ile değiştirilir; araç bu satırı günceller. Geçici düzen `0.milestone.düzeltme.küçük`: üçüncü bölüm sınırsız, dördüncü en fazla 9; kesin karar (B5) bekliyor.
- **Yerel kapsamı biten:** I-08, I-12, D-01 (dar hedef), D-02, D-04, D-08 (rapor kapsamı), D-09 (tooltip), D-10, D-11, I-11.
- **Seçildi, Claude'da (sıra):** B6-C, I-03, I-04, I-05, I-09 ve I-10, D-06.
- **Codex'te:** I-13.
- **Kapandı:** D-07; finalist seçilmeyecek, 20 tema kalıyor.
- **Karar bekliyor:** B5 kesin sürüm kuralı.
- **Seçilmedi:** I-06, D-03, D-05, D-12, D-13, D-14, kalan gerçek site kabulleri.
- **Askıda:** I-07.
- **Araç sistemi:** `D:/NOk-Tools` açık iş notu yok; beceri onayları 11 Kasım akşamı dolar. Yeni adaylar için dört aşamalı inceleme kuruldu (aşağıda).

## v0.7.18 pre-release hazırlığı — 6 Kasım 2026

Kullanıcı istedi; `main` `faa9f8d` üzerinden. Mağazaya gönderilmedi (`storeStatus: not-submitted`). Notlar: RELEASE_NOTES_v0.7.18.md.

- **Paketler:** `NOk-Release-Core` `package filmdeck` ile Chrome ve Firefox ayrı ZIP; `npm run check` komut içinde geçti. Git dışı `NOk-FilmDeck-Release/artifacts/` altında (`0.7.18-3f8f631d97fd`, `0.7.18-db738b2012e3`); eski arşivlere dokunulmadı, o depoya commit atılmadı.
- **Denetim:** Ürün dosyaları ve lisans bildirimleri kaynakla bayt bayt aynı. Fazla dosya yok. Taramada çıkan tek kişisel veri raporun e-posta seçeneğindeki geliştirici adresi; v0.7.0'dan beri kaynakta açık. İki ZIP açılıp kurularak denendi: panel, sürüm, rapor, gerçek videoda hız ve filtre.
- **Yayın:** GitHub pre-release'i kullanıcı kendi hesabıyla oluşturur (`gh` yok, ajan hesaba girmez). Tag `v0.7.18-pre_release`, hedef `main`.

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
