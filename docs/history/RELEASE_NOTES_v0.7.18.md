# FilmDeck by NOk v0.7.18 — pre-release

Test sürümü. Mağazalarda değildir, kararlı sürüm değildir. Önceki yayın v0.7.0'dı; eklentinin adı o zaman NOk Video Controller'dı.

## Kurulum

ZIP'i önce ayrı bir klasöre açın, kurduktan sonra açık video sayfalarını yenileyin.

- **Firefox (121 ve üstü):** `filmdeck-firefox-0.7.18.zip` dosyasını açın. `about:debugging` → Bu Firefox → Geçici Eklenti Yükle → `manifest.json`. Geçici eklenti Firefox kapanınca kalkar.
- **Chrome, Edge ve Chromium tabanlılar:** `filmdeck-chrome-0.7.18.zip` dosyasını açın. Uzantılar → Geliştirici modu → Paketlenmemiş öğe yükle → klasörü seçin.

İzinler yalnız `activeTab` ve `scripting`. Ayarlar ve yüklenen altyazı RAM'de tutulur, sayfa yenilenince sıfırlanır. Rapor kendiliğinden gönderilmez.

## v0.7.0'dan beri değişenler

**Yeni**
- FilmDeck adı, logosu ve yeni simgeler.
- Reklam denetimi artık araç çubuğuna ilk basışla başlar. O zamana kadar sayfada hız ve sese dokunulmaz; basıştan sonra panel kapatılsa da o sayfada sürer.
- Video süreli kare kaybederse panel, animasyonları kapatmayı ve filtreleri sıfırlamayı önerir. Kendiliğinden bir şey değiştirmez.
- Adaptör, CDN ve kalite durumları için fare, klavye ve dokunmatikle açılan açıklama balonu.
- Altyazı sekmesi, ekranda satır yoksa nedenini söyler: gizli, video yükleniyor, sıradaki satırın süresi, dosya bitti.
- Pencereler klavyeyle tam kullanılır: odak, Tab döngüsü, Esc, odağın geri dönmesi.
- Rapor penceresinde yeni onay kutusu ve metin alanı animasyonları.

**Düzeltilen**
- Panel konumu ve video bulma sayfa geçişlerinde korunuyor.
- Panel, gerçek ses düzeyini ve reklam sırasında kullanıcının kendi hızını gösteriyor.
- Sayfa Hls.js'i eklentiden önce bağladığında oynatıcı bulunuyor.
- Puhu'nun eski oynatıcısında boş kalan kalite listesi.
- CDN ölçülemediğinde nedeni yazıyor.
- Tema ve erişilebilirlik ayarları gömülü oynatıcının tam ekranına geçiyor.
- Filtre sürüklerken yük azaltıldı, rapor penceresinin sürekli bulanıklık yükü kaldırıldı.
- Panel kapalıyken video öğesi değişince altyazı duruyordu.
- Rapor kaydırılınca onay kutularının tıklama alanı yerinde kalıyordu.

## Gerçek sitede sınananlar

Geçici profil, hesap yok, Firefox 159 ve Edge 152. Tek makine, kısa oturumlar.

| Site | Görülen |
|---|---|
| YouTube | Gerçek reklam 16x ve sessiz geçti, bitişte 1x ve ses geldi; kapalı panelde de |
| TRT, kendi oynatıcısı | 5 kalite, 480p görüntüde doğrulandı; 2x atlama ve kalite değişiminden sonra da tuttu |
| Puhu | Yeni oynatıcıda 5 kalite, 1080p görüntüde doğrulandı; eski oynatıcıda 1 kalite (sitenin kendi listesi de tek) |
| Kick | 5 kalite, 160p görüntüde doğrulandı; ses paneli gerçek düzeyi gösteriyor |

## Bilinen sınırlar

- Sayfanın ilk reklamı, araç çubuğuna basılana kadar normal hızda ve sesli oynar.
- Art arda iki reklam arasında çok kısa süre normal hızda ses duyulabilir.
- Canlı Kick reklamı hiç görülmedi; Kick'te reklam hızlandırma doğrulanmadı.
- Puhu'nun yeni oynatıcısında 1080p seçince görüntü ilk 5-10 saniye 240p görünebilir, sonra 1080p'ye çıkar.
- Görüntü filtreleri animasyonlardan çok daha pahalı; Firefox'ta GPU yükünü belirgin artırıyor.
- Kare kaybı önerisi yalnız tarayıcının bildirdiği kaybı görür, her takılmayı yakalamaz. Edge'de gerçek kayıpla çıktığı görülmedi.
- Kontrolün sonradan kaybolması ve ses-görüntü kayması raporu (#104) çözülmedi, nedeni bulunmadı.
- Bazı sitelerde kalite seçimi uygulanıyor görünse de görüntü değişmeyebilir (#105). Panel bunu "doğrulanamadı" diye gösterir.
- Hesap veya abonelik isteyen sitelerde kalite ve PiP denenmedi.
- Dokunmatik gerçek telefonda, ekran okuyucu ve %200 yakınlaştırma gerçek ortamda denenmedi.
- DRM korumalı içerikte ses güçlendirme kapalıdır.

## Geri bildirim

Sorun görürseniz panelde **Ayarlar → Teşhis** ile raporu açın, kontrol edip GitHub Issue olarak paylaşın. Rapor otomatik gönderilmez. Site adı isteğe bağlıdır; içerik adı veya tam bağlantı gerekmez.

## Doğrulama

- 281 Node testi; 15 tarayıcı testi Firefox ve Chromium'da; aynı içerikteki commit'te GitHub CI'daki 7 işin hepsi başarılı.
- Paketler `NOk-Release-Core` ile üretildi. Ürün dosyaları kaynakla bayt bayt aynı, yalnız manifest tarayıcıya göre değişir. İki ZIP de açılıp kurularak denendi; panel, sürüm, hız ve filtre çalıştı.

SHA-256:

```
82afaecad66340e03ef5f843d5ecce7814954e585d37ebc30b0c24a468c2e204  filmdeck-chrome-0.7.18.zip
5180fe802e710bf4d1bd989a4a4171083950e4fc9d8b7397ab4caf19e68ea1c2  filmdeck-firefox-0.7.18.zip
```
