# NOk Video Controller (v0.7.0.1 — düzeltme adayı)

> 22 Ekim 2026 paket durumu: **v0.7.0.1 düzeltme adayı**, 142 Node testi. Firefox kurulu geçici eklentide sürekli iframe filtresi ve en son değer koruması geçti; Firefox/Edge yerel gerçek HLS ve Video.js kalite geçişleri doğrulandı. Dizipod dahil gerçek site kabulü açıktır. Güncel kanıt: [RELEASE_NOTES_v0.7.0.1.md](./RELEASE_NOTES_v0.7.0.1.md).

> Evrensel Medya & Shadow DOM Tespiti, 3-Kademeli Basamaklı Adaptör Mimarisi, Ağ Seviyesinde HLS / SMIL Kalite Kilitleri, Web Audio API Ses Güçlendirici (%300), Görüntü Filtreleri, Bellek İçi Harici Altyazı Motoru ve İzole Klavye Kısayolları.

**Geliştirici:** NOkrep ([GitHub](https://github.com/NOkrep/NOk-video-controller) | `ihsanartrk07@gmail.com`)  
**Lisans:** MIT  
**Platform:** Firefox (Gecko) & Chromium (Chrome, Brave, Edge, Opera) Manifest V3 WebExtension

---

## ⚡ Hızlı Başlangıç

### 🦊 Firefox (Gecko) Kurulumu (Firefox 121+)
1. Tarayıcınızda `about:debugging#/runtime/this-firefox` adresine gidin.
2. **Geçici Eklenti Yükle (Load Temporary Add-on...)** butonuna tıklayın.
3. Proje klasöründeki `manifest.json` dosyasını seçin.

### 🌐 Chrome / Brave / Edge Kurulumu (Chrome 121+)
1. Tarayıcınızda `chrome://extensions` adresine gidin.
2. Sağ üstteki **Geliştirici Modu (Developer Mode)** seçeneğini açın.
3. **Paketlenmemiş Öğe Yükle (Load Unpacked)** butonuna basarak proje klasörünü seçin.

---

## 📚 Kapsamlı Proje & Mimari Dokümantasyonu

- 👉 **[PROJECT_MASTER_GUIDE.md](./PROJECT_MASTER_GUIDE.md)**: Mimari tasarım, basamaklı adaptör hattı, ses/filtre/altyazı motorları ve geliştirici devir kılavuzu.
- 👉 **[SITE_COMPATIBILITY.md](./SITE_COMPATIBILITY.md)**: Platform bazlı çalışma durumu ve uyumluluk takip tablosu.

---

## 🛡️ Temel İlkeler

- **Sıfır Depolama (Zero Storage):** Çerez, `localStorage`, `sessionStorage` veya `chrome.storage` kullanılmaz; %100 bellek içi (in-memory stateless) çalışır.
- **Minimum İzinler:** Yalnızca `activeTab` ve `scripting` izinleri kullanılır; `host_permissions` talep edilmez.
- **Gizlilik Odaklı Teşhis:** Rapor şeması v2 tam URL, alan adı/IP, kesin saat, izleme konumu ve sayfa konsolu metni içermez. Desteklenen siteler yalnızca sabit platform adıyla, diğer siteler `other` olarak belirtilir. Tarayıcı ailesi, sınırlı oynatıcı durumu ve sabit olay kodları kullanılır.
- **Kullanıcı Kontrollü Paylaşım:** Otomatik rapor gönderimi yoktur. Açıklama varsayılan olarak kapalıdır; kullanıcı eklerse bu metin otomatik anonimleştirilmez. Rapor önce önizlenir, ardından kullanıcı isterse kopyalayıp paylaşır. E-posta/GitHub hesabı ve sayfa içi panel nedeniyle mutlak anonimlik garantisi verilmez.

## Geliştirme Doğrulaması

`node --test tests/*.test.cjs` gizlilik sınırını, altyazıları, kalite/hız çağrılarını, çok çerçeveli HUD koordinasyonunu, filtre iş birleştirmesini ve Kick UI işleyicilerini Node ortamında sınar. `node --check injected.js` sözdizimini denetler. v0.7.0.1 için 142 test geçer. Firefox 158 kurulu geçici eklentiyle yerel nested iframe, sürekli filtre sürükleme ve gerçek oynatıcı kütüphanelerini geçti. Önceki Edge Video.js zaman aşımı yerel senaryoda giderildi; Hls.js ve Video.js decoded geçişleri her iki tarayıcıda doğrulandı. Bunlar gerçek site veya cihaz GPU/FPS onayı değildir.

## v0.7.0.1 — Küçük düzeltme paketi

İframe filtrelerinde tek bekleyen komut, son kullanıcı seçimini eski kaynak durumundan koruma ve oturum kapatmada kuyruk iptali; ilgisiz metin değişimlerinde medya önbelleğini koruma; doğrulanmış VHS sahipliğiyle eski kalite tamponunu bir kez yenileme. [Sürüm notları](./RELEASE_NOTES_v0.7.0.1.md) ve açık gerçek site koşulları geçerlidir.

## v0.7.0 — Tek iframe paneli ve reklam yaşam döngüsü

- Normal modda HUD üst sayfada sunulur; video, altyazı katmanı ve SDK işlemleri seçili iframe'de kalır. Fullscreen'de görünür panel kaynak çerçeveye geçer. Kapat/aç, eski oturum/sahip reddi ve bounded komutlar: [FRAME_PRESENTATION.md](./FRAME_PRESENTATION.md).
- Görünür, seçili oynatıcıya bağlı açık reklam işaretinde 16x istenir, mute açılır, geri getirilebilir gerçek en düşük kalite seçilir. Bitişte 1x, önceki ses/mute ve güvenle eşleştirilen önceki kalite/otomatik mod geri gelir: [AD_CONTROL.md](./AD_CONTROL.md). İşaretsiz reklamlar tahmin edilmez; gerçek 16x destek garantisi yoktur.
- Kick kalitesi gerçek SDK listesinden gelir; tahmini fallback kaldırıldı. Başka videoya bağlı IVS instance'ı kullanılamaz. SDK wrapper'larının yeniden oluşturulması/sıra değişimi yanlış kalite seçtirmez.
- 20 tema, İngilizce başlangıç, Türkçe seçim, rapor önizlemesi/silme talebi ve sıfır kalıcı depolama korunur. Canlı kabul listesi [RELEASE_ROADMAP.md](./RELEASE_ROADMAP.md) içindedir.

Sentetik tarayıcı testi mevcut Playwright paketi ve Chromium yürütülebilir dosyasını argüman olarak alır; kurulum veya indirme yapmaz:

```powershell
node tests/browser-integration.cjs --packages="C:/path/to/node_modules" --browser="C:/path/to/msedge.exe"
```

Geçici tarayıcı profili ve yalnızca iki yerel test sunucusu kullanılır; dış istekler engellenir. `tests/artifacts/iframe-browser/` altında sonuç JSON'u ve görseller üretilir. MediaStream fixture 16x isteğini kaydeder ama gerçek hızlanmayı doğrulamaz. Eklentiyi yeniden yükleyip açık video sayfalarını yenileyerek canlı test yapılmalıdır.

## v0.6.1 — Kalite bağlamı ve doğrulaması

- Kalite listesi seçili video, oynatıcı, kaynak ve medya yükleme nesline bağlıdır. Eski düğme yeni videonun/yeniden sıralanan seviyenin kontrolüne dönüşmez. Teşhis de eski adaptör/listeyi yeni video için raporlamaz.
- Plyr, Video.js ve JW Player'ın belirli kalite menülerindeki gerçek sayısal seçenekler, tek videoya ait oldukları doğrulanabiliyorsa listeye eklenir. Video.js resolution-switcher kaynak grupları ayrı desteklenir; ham kaynak adresleri UI'ya/rapora çıkmaz. Her özel site menüsünün kapsandığı veya tüm kaynakların bulunduğu iddia edilmez.
- Kalite isteği, oynatıcının seçimi ve decoded video eşleşmesi ayrıdır. 12s sonunda doğrulanamayan geçiş belirtilir. Başarı vurgusu için en az video boyutu eşleşmelidir; istek kabulü tek başına yeterli değildir. Kaynak değiştiren menüde işlemi sitenin kendi kontrolü yürütür; eklenti URL tahmin etmez.
- Player → Video target, çoklu videoda açık seçim sağlar. Sayfa adresi/başlığı yerine yalnızca sıra ve video yüksekliği gösterilir. Gecikmeli envanter yalnızca açık HUD'da güncellenir; gizlenen HUD'da geniş tarama durur. Düğme kimliği ve klavye odağı doğrulama güncellemelerinde korunur.
- Uygulama/kanıt sınırları [QUALITY_CONTROL.md](./QUALITY_CONTROL.md) içinde. Cross-origin HUD sunumu ve reklam yaşam döngüsü v0.7.0 test adayında uygulanmıştır; gerçek site kabulü açıktır.

## v0.6.0 — İlk iyileştirme aşaması

- Filtre kaydırıcıları aynı çizim turunda birleştirilir; değişmeyen CSS tekrar yazılmaz. Varsayılan filtre site stilini ezmez; sıfırlamada önceki inline stil/öncelik geri gelir.
- Medya adayları bir saniyelik, medya/DOM olaylarında geçersizleşen RAM önbelleğindedir. Adaylar her seçimde yalnızca bir kez puanlanır. GPU filtre maliyeti ve gerçek video kare kaybı cihazda ayrıca ölçülmelidir.
- Fare tıklaması sonrası kalan odak otomatik gizlenmeyi kilitlemez; klavye odağı ve “Paneli açık tut” korunur. Normal modda yatay sürükleme kullanılabilir.
- Subtitles → Subtitle appearance: 12–48px, alt mesafe, arka plan opaklığı ve beyaz/sarı yazı. Yeni dosya yükleme altyazıyı açar. Yerel fullscreen/PiP yazı boyutunu tarayıcı yönetir.
- Raporun `platformScope` alanı `player/page/unlisted` ayrımını gösterir. Tanınan üst sayfanın yalnızca sabit platform etiketi iframe'e iner; URL/alan adı taşınmaz. Listelenmeyen siteler gizlilik nedeniyle `other` kalır.
- 20 tema korunur. Bu aşamanın ardından uygulanan iframe/reklam işleri ve kalan canlı kabul koşulları [RELEASE_ROADMAP.md](./RELEASE_ROADMAP.md); animasyon farkları [ANIMATION_DETAILS.md](./ANIMATION_DETAILS.md) içindedir.

v0.5.4'te gerçek kalite API'si bulunmayan oynatıcılarda göstermelik çözünürlük seçenekleri sunulmaz. TRT'de ulaşılabilen Shaka instance'ı üzerinden kalite/hız isteği iletilir. Standart SRT/VTT dosyalarındaki `-->` sonrası boşluk hatası giderildi. Eklentiyi yeniden yükledikten sonra açık medya sayfalarını da yenileyin; erken instance kancaları ve iframe stilleri ancak yeni sayfa yüklemesinde devreye girer.

v0.5.5'te altyazıyı gizli tutan CSS önceliği düzeltildi; metin seçili videoya konumlandırılır. HLS çözünürlük metadatası eksikse boş `p` gösterilmez: örneğin `720p · oynatılan` yalnızca videodan ölçülen değerdir. Tek seviye görülmesi, kaynakta başka kalite olmadığı garantisi değildir. Yeni manifest/seviye olaylarında liste yenilenir; rapor yalnızca sınırlı adet ve durum kodları içerir.

İsteğe bağlı sentetik manuel önizleme: `node tests/ui-preview-server.cjs`, ardından yerel tarayıcıda `http://127.0.0.1:4817/`. Örnek düğmeler sahte HLS metadatası ve üretilmiş SRT kullanır; gerçek site/HLS entegrasyon testi değildir. v0.7.0'da ayrı `tests/browser-integration.cjs` sentetik Edge testi çalıştırıldı; ayrıntılar aşağıdadır.

v0.5.6'da çalışan iframe paneli seçildiğinde üstteki boş panel ve diğer dallar kapanır. TRT hız kilidi yalnızca seçili video elementindeki otomatik 1x yazımlarını yönlendirir; **panelden 1x seçmek veya hız çubuğuna çift tıklamak kilidi kapatır**. Video.js'te kalite eklentisi yoksa VHS'nin kendi temsil listesi kullanılır. Kick'te Radix ses işleyicisi önbelleğe alınır; hız için gerektiğinde gerçek menü seçeneği kullanılır. Bu yolların çağrılması canlı arayüzün eşleştiğini kanıtlamaz. Eklentiyi yeniden yükleyin ve sayfaları yenileyin.


## Türkçe / English arayüz (v0.5.10)

Panelin **Settings → Language** alanından Türkçe veya English seçilebilir. Her yeni sayfada ilk dil **İngilizcedir**, tarayıcı dili bunu değiştirmez. Seçim yalnızca sayfa belleğinde tutulur; panel kapatılıp açıldığında korunur, sayfa yenilenince sıfırlanır. Çocuk/ebeveyn çerçevelere yalnızca sabit dil sinyalleri gider. Site metni, dosya adları, altyazılar ve teşhis JSON kodları çevrilmez; rapora dil/yerel ayar alanı eklenmez. Tarayıcının eklenti yönetim ekranındaki açıklama kendi tarayıcı dilini kullanır.

**English:** Use **Settings → Language** to choose **Türkçe / English**. Every new page starts in English, regardless of the browser language. The choice stays in page memory and resets on reload. It does not change subtitles, filenames or diagnostic JSON.

Rapor ekranındaki **“Sorun çözüldüğünde bu issue’nun / raporun silinmesini talep ediyorum”** kutusu isteğe bağlı ve varsayılan olarak kapalıdır. Seçilirse JSON’a yalnızca `deleteAfterResolutionRequested: true`, GitHub/e-posta taslağına sabit İngilizce talep metni eklenir. Özel açıklama ve rapor URL’ye eklenmez. Bu bir taleptir; otomatik silme veya kopyaların kaldırılması garantisi değildir. Manuel GitHub şablonunda da aynı seçenek bulunur.

Arayüzün güçlü yanları, kalan sorunları ve öncelikler: **[HMI_REVIEW.md](./HMI_REVIEW.md)**. Bu sürümde bölüm başlıklarına klavye desteği, kaydırıcılara erişilebilir adlar ve dil kontrolüne odak görünürlüğü eklendi. Bu kaynak ve Node denetimleri gerçek tarayıcıda erişilebilirlik/görsel onayı değildir.


## Sol sekmeler, tema ve erişilebilirlik (v0.5.9)

- **Player / Oynatıcı:** Hız, ses, kalite ve adaptör seçimi. İlk açılan sekmedir.
- **Subtitles / Altyazı:** Dosya yükleme, görünürlük ve zamanlama.
- **Settings / Ayarlar:** Dil, açılır **Accessibility / Erişilebilirlik**, katlanır görüntü/video renk kontrolleri ve yardım/teşhis.

Üç sekme solda simge ve görünür kısa adla yer alır. Fareyle veya sekme odaktayken **↑ / ↓ / Home / End** ile geçilir. Kontroller yeniden oluşturulmadığı için hız/ses, dosya ve olay dinleyicileri korunur. Küçültülmüş modda sol şerit ve içerik gizlenir. Yan şerit için panel 388px genişliğindedir; viewport sınırı korunur. 380px altındaki ekranlarda şerit daralır ve sarma düğmeleri iki sütuna geçer. Gerçek zoom/yerleşim testi beklenir.

Tema kullanıcı referansındaki koyu petrol **#0A1418**, kart **#1B2A33**, mavi vurgu **#6099B9** üzerine kurulur. Ana metin **#EDF2F3**, ikincil metin **#A2B6C0**, küçük vurgu metni **#92BFD5**. Ortak CSS değişkenleri HUD ve pencerelerde kullanılır; panel zemini opaktır, neon parlama azaltılmıştır. Videonun renkleri ve altyazı katmanının stili tema tarafından değiştirilmez. Yüksek kontrast ayrı değişkenlerle korunur.

**Erişilebilirlik** alanı varsayılan olarak kapalıdır: paneli açık tutma, büyük yazı/kontroller, yüksek kontrast ve panel hareketlerini azaltma seçenekleri içerir. Kısayol düğmesi de buradadır. Hareket azaltma başlangıç değeri `prefers-reduced-motion` tercihine uyar; panelden değiştirilebilir. Sunum tercihleri yalnızca çerçeve belleğinde tutulur; rapora veya diğer çerçevelere aktarılmaz, yenilemede sıfırlanır. Dil, önceki sabit sinyalli eşitlemeyi korur.

**English:** Three vertical tabs on the left: Player (including adapter selection), Subtitles, Settings (including picture controls). Use Up/Down/Home/End while a tab is focused. Petrol surfaces and a muted blue accent follow the supplied references. Existing controls, inputs and listeners are moved intact. Preferences remain temporary; live Firefox/Chromium layout and screen-reader testing are pending.


## 20 tema ve bileşenler (v0.5.10)

**Settings → Themes** alanında SevenGrid'in herkese açık demosunda incelenen 20 tema bulunur: 7 standart/koyu, 7 açık, 6 OLED. Aileye göre seçici, Previous/Next ve renk örnekleriyle karşılaştırılabilir. Başlangıç **Atlas**; seçim yalnızca mevcut çerçevenin RAM'inde tutulur. Paneli kapat/aç korur, sayfa yenileme Atlas'a döner. Kullanıcı finalist beş temayı henüz seçmedi; tüm adaylar korunur.

Seçim HUD, açık pencereler ve toast'a uygulanır; sonradan açılan pencereler de seçimi kullanır. Yüksek kontrast ayrı önceliğini korur ve tema alanı bunu açıklar. Tema adı rapora eklenmez; tema için uzak çağrı veya ek izin yoktur. SevenGrid'in ana yüzeyleri/vurgusu korunur, küçük metin, durum renkleri ve kenarlıklar HUD için kontrast hedefine uyarlanır. Renk hesabı gerçek tarayıcı doğrulaması değildir.

Seçilen Uiverse örneklerinden düğme, rapor checkbox'ı, erişilebilirlik switch'i, açıklama input'u ve gerçek CDN ölçümünün beş kareli loader'ı uyarlandı. Native kontrol davranışları ve kullanıcı kontrollü rapor paylaşımı korunur. Hareket azaltmada basılma yer değiştirmesi/animasyon devre dışıdır. Radio, form ve tooltip örnekleri sonraki uygun kullanım için kaydedildi.

- [DESIGN_REFERENCES.md](./DESIGN_REFERENCES.md): sekiz referans, kullanıldığı yer, ertelenenler ve gerekçeleri.
- [THEME_EVALUATION.md](./THEME_EVALUATION.md): 20 temanın kaynak ve HUD renk değerlendirmesi, karşılaştırma notları.
- [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md): kullanılan bileşenlerin MIT bildirimleri ve yazarları.

**English:** Settings → Themes includes all 20 inspected SevenGrid palettes. Atlas is the default; Previous/Next cycles the grouped list. The preference is temporary, local to the frame, omitted from diagnostics and reset on reload. High contrast overrides the palette without discarding the selection. Component provenance and deferred designs are recorded in the linked documents. Live layout and assistive-technology checks are still pending.
