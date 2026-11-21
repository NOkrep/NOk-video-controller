# FilmDeck by NOk v0.8.3.4 — pre-release

Test sürümü. Mağazalarda değildir, kararlı sürüm değildir. Önceki yayın v0.7.18'di.

## Kurulum

ZIP'i önce ayrı bir klasöre açın, kurduktan sonra açık video sayfalarını yenileyin.

- **Firefox (121 ve üstü):** `filmdeck-firefox-0.8.3.4.zip` dosyasını açın. `about:debugging` → Bu Firefox → Geçici Eklenti Yükle → `manifest.json`. Geçici eklenti Firefox kapanınca kalkar.
- **Chrome, Edge ve Chromium tabanlılar:** `filmdeck-chrome-0.8.3.4.zip` dosyasını açın. Uzantılar → Geliştirici modu → Paketlenmemiş öğe yükle → klasörü seçin.

İzinler yalnız `activeTab` ve `scripting`. Ayarlar ve yüklenen altyazı RAM'de tutulur, sayfa yenilenince sıfırlanır. Rapor kendiliğinden gönderilmez.

## v0.7.18'den beri değişenler

**Yeni panel: kompakt araç çubuğu (varsayılan)**
- Panel artık ince bir araç çubuğu olarak açılır. Dört grup var: Oynatıcı, Altyazılar, Ayarlar, Erişilebilirlik. En sağdaki düğme grubu değiştirir; fare tekerleği grupları gezer, çift tıklama listeyi açar.
- Hız, ses, sarma adımı, altyazı zamanlaması ve kaydırıcılar fare tekerleğiyle de değişir; klavye karşılıkları vardır.
- Oynat/duraklat, DRM kalkanı, kare kaybı sorusu ve "video bekleniyor" durumu çubukta görünür.
- Stereo/Mono için kayan anahtar.
- Eski panel **Kolay okunur düzen** olarak duruyor; 100/125/150 yazı boyutu kademeleri var. İki düzen arasında tek anahtarla geçilir.

**Altyazı zamanlaması**
- **Zamanla kayan altyazı:** dosya başka bir kurguya ya da kare hızına göre zamanlanmışsa altyazı bölüm boyunca giderek kayar. Doğruyken 1. noktayı kaydedin, kayınca − / + ile düzeltip 2. noktayı kaydedin; FilmDeck kaymayı kendi sürdürür.
- **Büyük kayma:** kaymayı elle yazın (`-41:35`, `+2.5`, `-2500ms`). Ya da bir satırı arayıp seçin; **Şu an bu satır** o satırı videonun şu anki zamanına getirir. Kayma sınırı 6 saat.
- Rapor artık kayma değerini ve kayma düzeltmesini sayı olarak gösterir. Altyazı metni ve oynatma konumu rapora girmez.

**Videonun kendi ses ve altyazı parçaları**
- Video birden çok ses parçası (örneğin dublaj ve orijinal) ya da hazır altyazı sunuyorsa panelden seçilebilir. Hls.js, Shaka, Video.js ve tarayıcının kendi listeleri desteklenir; gömülü oynatıcılarda da çalışır. Yüklediğiniz altyazı dosyası bu listede görünmez, ayrı kalır.

**Görünüm**
- Simgeler ortak bir çizgide; bildirimlerdeki emojiler kaldırıldı. Bütün sıfırlama düğmeleri aynı geri dönüş okunu kullanır.
- Araç çubuğu ve açılır kutular tamamen opak; arkadaki sayfa yazısı artık içeri sızmaz.

**Düzeltilen**
- Kaydırma çubuğu olan sayfalarda panel ve açılır kutular kaydırma çubuğunun altına kayabiliyordu.
- UTF-8 bildirmeyen sayfalarda Türkçe metinler bozuluyor ve çeviri bulunamıyordu.
- Gömülü oynatıcı aynı sayfada yenilenince panel tercihleri varsayılana dönüyordu.
- Panelde yazarken bazı tuş olayları (`keypress`) sayfaya ulaşabiliyordu.
- Ses ya da altyazı parçası listesi yeniden sıralanınca eski seçim başka bir parçayı seçebiliyordu.
- Altyazının kaydırılmamış hâli `+0ms` yerine `0ms` görünüyor.

## Gerçek sitede sınananlar

Kompakt araç çubuğu kullanıcının seçtiği iki gerçek sitede denendi (site adları kayda alınmadı). Zamanla kayan altyazı, gerçek sitedeki bir kullanıcı raporuna göre yapıldı; düzeltme yerel testlerle doğrulandı, o sitede ayrıca denenmedi. Videonun kendi parçaları gerçek Hls.js ve Video.js ile yerel test akışında sınandı, gerçek sitede denenmedi.

## Bilinen sınırlar

- Videonun kendi parçaları gerçek bir sitede denenmedi. Shaka desteği yalnız birim testinde, gerçek Shaka oynatıcısıyla sınanmadı.
- Zamanı 00:00'dan yeniden başlayan birleşik altyazı dosyaları (iki bölüm tek dosyada) gömülü oynatıcıya aktarılamıyor. Üst sayfada ilk bölümün satırları görünür.
- Kurgu farkı varsa (bir noktada birden atlama) zamanla kayma düzeltmesi uymaz; − / + ile düzeltin.
- Kick'te canlı uçta hız etkisiz kalabiliyor; yayının geçmişinde ses, panelden ilk değişiklikten sonra sitenin arayüzüne yansımıyor.
- Sayfanın ilk reklamı, araç çubuğuna basılana kadar normal hızda ve sesli oynar.
- Kontrolün sonradan kaybolması ve ses-görüntü kayması raporu (#104) ile kalite seçiminin görüntüye yansımaması (#105) çözülmedi.
- DRM'li bir sitede ve gerçek 1080p yeniden deneme sitesinde araç çubuğu denenmedi. DRM korumalı içerikte ses güçlendirme kapalıdır.
- Hesap veya abonelik isteyen sitelerde kalite ve PiP denenmedi. Dokunmatik gerçek telefonda, ekran okuyucu ve %200 yakınlaştırma gerçek ortamda denenmedi.

## Geri bildirim

Sorun görürseniz panelde rapor simgesiyle **Teşhis Raporu**'nu açın, kontrol edip GitHub Issue olarak paylaşın. Rapor otomatik gönderilmez. Site adı isteğe bağlıdır; içerik adı veya tam bağlantı gerekmez.

## Doğrulama

- 312 Node testi. Tarayıcı testleri Edge 152 ve Firefox 160'ta: toolbar, media-tracks, dialog-keyboard, tooltip, hud-continuity, ui-smoke (geniş ve dar).
- Paketler `NOk-Release-Core` ile üretildi. Ürün dosyaları kaynakla bayt bayt aynı, yalnız manifest tarayıcıya göre değişir; fazladan dosya yok. Açılmış iki ZIP de kendi tarayıcısında `ui-smoke` (geniş ve dar, 20 tema, TR/EN) ile kuruldu ve geçti.

SHA-256:

```
edbe64d29b649d43b8f1849dd33c2a3dce35c3aa83e7ee160c92121379c072df  filmdeck-chrome-0.8.3.4.zip
28455a5681b75fa5050211e9c401ab6141d848345f51d10ea4c1b3f0c6564833  filmdeck-firefox-0.8.3.4.zip
```
