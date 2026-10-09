# NOk Video Controller (v0.5.0)

> Gelişmiş Video Oynatıcı Kontrolü, Ağ Seviyesinde HLS / SMIL Kalite Kilitleri, Web Audio API Ses Güçlendirici (%400), Kick.com 0ms React Fiber Entegrasyonu ve TRT 1 Özel Adaptörü.

**Geliştirici:** NOkrep ([GitHub](https://github.com/NOkrep/NOk-video-controller) | `ihsanartrk07@gmail.com`)  
**Lisans:** MIT  
**Platform:** Chromium & Firefox Manifest V3 WebExtension

---

## ⚡ Hızlı Başlangıç

1. Projeyi ZIP olarak indirin veya klonlayın.
2. Chrome / Brave / Edge tarayıcınızda `chrome://extensions` adresine gidin.
3. Sağ üstteki **Geliştirici Modu (Developer Mode)** seçeneğini açın.
4. **Paketlenmemiş Öğe Yükle (Load Unpacked)** butonuna basarak bu klasörü seçin.
5. Kick.com, TRT 1, TRT İzle, Now TV veya herhangi bir video platformunu açıp tarayıcı araç çubuğundaki **NOk Video Controller** ikonuna tıklayın!

---

## 📚 Kapsamlı Proje & Mimari Dokümantasyonu

Projenin tüm iç çalışma mekanizması, mimarisi, teknik tercihleri, yol haritası ve geliştirici devir kılavuzu için lütfen ana dokümantasyon dosyasını inceleyin:

👉 **[PROJECT_MASTER_GUIDE.md](./PROJECT_MASTER_GUIDE.md)**

### Dokümantasyon İçeriği:
- **Bölüm 1:** Yönetici Özeti & Temel Misyon
- **Bölüm 2:** Mimari Tasarım (Manifest V3 Hibrit Enjeksiyon & Katmanlar)
- **Bölüm 3:** Tasarım ve Mühendislik Tercihleri (Neyi Neden Tercih Ettik?)
- **Bölüm 4:** Bileşenler ve Derinlemesine Çalışma Detayları (Ağ Kancaları, Web Audio, Kick/TRT Adaptörleri)
- **Bölüm 5:** Sürüm Evrimi ve Çözülen Kritik Problemler (v0.5.0 Kararlı)
- **Bölüm 6:** Güncel Zorluklar, Bilinen Sınırlar ve Edge Cases
- **Bölüm 7:** Gelecek Yol Haritası ve Eklenecek Özellikler (Klavye kısayolları, PiP, filtreler)
- **Bölüm 8:** Dosya Ağacı ve Sorumluluk Matrisi
- **Bölüm 9:** Geliştirici Devir & Yeni Konuşmaya Taşıma Kılavuzu (Handoff Prompts & Rules)

---

## 🛡️ Temel İlkeler

- **Sıfır Depolama (Zero Storage):** Çerez, localStorage veya persistent arka plan depolaması kullanılmaz; %100 bellek içi (stateless) çalışır.
- **Minimum İzinler:** Yalnızca `activeTab` ve `scripting` izinleri kullanılır; gizlilik dostudur.
- **Sıfır Kişisel Veri (Zero-PII):** Teşhis ve hata raporlama paneli tüm kimlik doğrulama tokenlarını maskeler.

