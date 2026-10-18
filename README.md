# NOk Video Controller (v0.5.4 — geliştirme)

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

`node --test tests/diagnostics.test.cjs tests/player-controls.test.cjs` gizlilik sınırını, sorun seçimini, SRT/VTT ayrıştırmasını, seçili videoya ait oynatıcı/kalite çağrılarını, TRT hız korumasını, iframe sinyallerini ve HTTP ölçümünü Node ortamında sınar. `node --check injected.js` sözdizimini denetler. Bu kontroller Firefox/Chromium veya gerçek sitelerde çalışma onayı değildir; v0.5.4 için canlı doğrulama beklenmektedir.

v0.5.4'te gerçek kalite API'si bulunmayan oynatıcılarda göstermelik çözünürlük seçenekleri sunulmaz. TRT'de ulaşılabilen Shaka instance'ı üzerinden kalite/hız isteği iletilir. Standart SRT/VTT dosyalarındaki `-->` sonrası boşluk hatası giderildi. Eklentiyi yeniden yükledikten sonra açık medya sayfalarını da yenileyin; erken instance kancaları ve iframe stilleri ancak yeni sayfa yüklemesinde devreye girer.
