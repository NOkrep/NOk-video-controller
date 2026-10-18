# NOk Video Controller (v0.5.8 — geliştirme)

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

`node --test tests/diagnostics.test.cjs tests/player-controls.test.cjs tests/frame-coordination.test.cjs tests/kick-ui.test.cjs tests/localization.test.cjs tests/hud-navigation.test.cjs` gizlilik sınırını, altyazıları, kalite/hız çağrılarını, çok çerçeveli HUD koordinasyonunu ve Kick UI işleyicilerini Node ortamında sınar. `node --check injected.js` sözdizimini denetler. Bu kontroller Firefox/Chromium veya gerçek sitelerde çalışma onayı değildir; v0.5.8 için canlı doğrulama beklenmektedir.

v0.5.4'te gerçek kalite API'si bulunmayan oynatıcılarda göstermelik çözünürlük seçenekleri sunulmaz. TRT'de ulaşılabilen Shaka instance'ı üzerinden kalite/hız isteği iletilir. Standart SRT/VTT dosyalarındaki `-->` sonrası boşluk hatası giderildi. Eklentiyi yeniden yükledikten sonra açık medya sayfalarını da yenileyin; erken instance kancaları ve iframe stilleri ancak yeni sayfa yüklemesinde devreye girer.

v0.5.5'te altyazıyı gizli tutan CSS önceliği düzeltildi; metin seçili videoya konumlandırılır. HLS çözünürlük metadatası eksikse boş `p` gösterilmez: örneğin `720p · oynatılan` yalnızca videodan ölçülen değerdir. Tek seviye görülmesi, kaynakta başka kalite olmadığı garantisi değildir. Yeni manifest/seviye olaylarında liste yenilenir; rapor yalnızca sınırlı adet ve durum kodları içerir.

İsteğe bağlı sentetik manuel önizleme: `node tests/ui-preview-server.cjs`, ardından yerel tarayıcıda `http://127.0.0.1:4817/`. Örnek düğmeler sahte HLS metadatası ve üretilmiş SRT kullanır; gerçek site/HLS entegrasyon testi değildir. Otomatik tarayıcı önizlemesi bu ortamda doğrulanamadı.

v0.5.6'da çalışan iframe paneli seçildiğinde üstteki boş panel ve diğer dallar kapanır. TRT hız kilidi yalnızca seçili video elementindeki otomatik 1x yazımlarını yönlendirir; **panelden 1x seçmek veya hız çubuğuna çift tıklamak kilidi kapatır**. Video.js'te kalite eklentisi yoksa VHS'nin kendi temsil listesi kullanılır. Kick'te Radix ses işleyicisi önbelleğe alınır; hız için gerektiğinde gerçek menü seçeneği kullanılır. Bu yolların çağrılması canlı arayüzün eşleştiğini kanıtlamaz. Eklentiyi yeniden yükleyin ve sayfaları yenileyin.


## Türkçe / English arayüz (v0.5.8)

Panelin **Settings → Language** alanından Türkçe veya English seçilebilir. Her yeni sayfada ilk dil **İngilizcedir**, tarayıcı dili bunu değiştirmez. Seçim yalnızca sayfa belleğinde tutulur; panel kapatılıp açıldığında korunur, sayfa yenilenince sıfırlanır. Çocuk/ebeveyn çerçevelere yalnızca sabit dil sinyalleri gider. Site metni, dosya adları, altyazılar ve teşhis JSON kodları çevrilmez; rapora dil/yerel ayar alanı eklenmez. Tarayıcının eklenti yönetim ekranındaki açıklama kendi tarayıcı dilini kullanır.

**English:** Use **Settings → Language** to choose **Türkçe / English**. Every new page starts in English, regardless of the browser language. The choice stays in page memory and resets on reload. It does not change subtitles, filenames or diagnostic JSON.

Rapor ekranındaki **“Sorun çözüldüğünde bu issue’nun / raporun silinmesini talep ediyorum”** kutusu isteğe bağlı ve varsayılan olarak kapalıdır. Seçilirse JSON’a yalnızca `deleteAfterResolutionRequested: true`, GitHub/e-posta taslağına sabit İngilizce talep metni eklenir. Özel açıklama ve rapor URL’ye eklenmez. Bu bir taleptir; otomatik silme veya kopyaların kaldırılması garantisi değildir. Manuel GitHub şablonunda da aynı seçenek bulunur.

Arayüzün güçlü yanları, kalan sorunları ve öncelikler: **[HMI_REVIEW.md](./HMI_REVIEW.md)**. Bu sürümde bölüm başlıklarına klavye desteği, kaydırıcılara erişilebilir adlar ve dil kontrolüne odak görünürlüğü eklendi. Bu kaynak ve Node denetimleri gerçek tarayıcıda erişilebilirlik/görsel onayı değildir.


## Sekmeler ve erişilebilirlik (v0.5.8)

- **Player / Oynatıcı:** Hız, ses, kalite. İlk açılan sekmedir.
- **Picture / Görüntü:** Görüntü filtreleri ve gece modu.
- **Subtitles / Altyazı:** Dosya yükleme, görünürlük ve zamanlama.
- **Settings / Ayarlar:** Dil, açılır **Accessibility / Erişilebilirlik**, adaptör ve yardım/teşhis araçları.

Sekmeler fareyle veya odak sekme üzerindeyken **← / → / Home / End** ile değişir. Yalnızca seçili sekmenin içeriği görünür; kontrol DOM'u yeniden oluşturulmadığı için hız/ses, dosya ve olay dinleyicileri korunur. Küçültülmüş modda sekmeler de gizlenir.

**Erişilebilirlik** alanı varsayılan olarak kapalıdır: paneli açık tutma (otomatik gizlemeyi durdurur), büyük yazı/kontroller, yüksek kontrast ve panel hareketlerini azaltma seçenekleri içerir. Kısayol açma/kapama düğmesi de burada bulunur. Hareket azaltma başlangıç değeri işletim sisteminin `prefers-reduced-motion` tercihine uyar; panelden değiştirilebilir. Bu sunum tercihleri çerçeve belleğindedir, rapora veya diğer çerçevelere aktarılmaz ve sayfa yenilemede sıfırlanır. Dil, önceki sabit sinyalli çerçeve eşitlemesini korur.

**English:** Tabs group Player, Picture, Subtitles and Settings. Settings contains a collapsed Accessibility section: keep the panel visible, larger text/controls, high contrast, reduced panel motion and the keyboard-shortcut toggle. Preferences are temporary; tab switching preserves player controls and the loaded subtitle input. Live Firefox/Chromium layout and screen-reader testing are still pending.
