# NOk Video Controller (v0.5.2)

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
- **Sıfır Kişisel Veri (Zero-PII):** Teşhis ve hata raporlama paneli tüm kimlik doğrulama tokenlarını maskeler.