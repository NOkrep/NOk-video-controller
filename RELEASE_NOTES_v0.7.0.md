# v0.7.0 — Site testi için ön sürüm

20 Ekim 2026. Bu paket test adayıdır; raporlanan bütün siteler için kararlılık onayı değildir. GitHub'da **Pre-release** olarak paylaşılabilir. Commit, push, tag veya GitHub release oluşturulmadı.

## Başlıca değişiklikler

- İframe içindeki video için normal modda üst sayfada tek panel; fullscreen giriş/çıkışı, kapat/aç ve eski oturumların reddi.
- Filtre girişlerini çizim turunda birleştirme, değişmeyen stili tekrar yazmama ve medya adaylarını RAM'de önbellekleme.
- Altyazı boyutu, alt mesafe, zemin opaklığı ve renk; dosya yüklerken görünürlüğü açma.
- Kalite listesini seçili video/oynatıcı/kaynağa bağlama; gerçek kaynak menüleri, Video.js temsil listeleri ve istek/görüntü doğrulamasını ayırma. Tahmini kaliteler gösterilmez.
- Açık reklam işaretinde 16x isteği, sessizleştirme ve geri getirilebilir en düşük kalite; bitişte 1x, önceki ses/mute ve eşleşen kalite/otomatik mod.
- Firefox hızını etkileyebilen gereksiz Web Audio bağlantısını önlemek için ses grafiğini yalnızca gerektiğinde kurma; Video.js kalite seçimi ve sayısal etiket düzeltmeleri.
- Sabit anonim platform sınıfına `platformScope` ekleme; ham alan adı eklenmez. Rapor önizlemesi, isteğe bağlı açıklama ve çözülünce silme talebi korunur.
- İngilizce başlangıç, Türkçe seçimi ve 20 tema korunur. Animasyon uyarlamaları ve ertelenen örnekler [ANIMATION_DETAILS.md](./ANIMATION_DETAILS.md) içinde açıklanır.

## Doğrulananlar

- **135 Node testi** geçti; JavaScript sözdizimi ve diff kontrolleri geçti.
- **Firefox 158**, geçici olarak kurulan gerçek eklentiyle, yerel ve iki kademeli cross-origin iframe senaryosunda 13 kontrolü geçti: enjeksiyon, tek üst panel, ses, kalite, altyazı aktarımı/görünümü, fullscreen ve yeniden açma. Klavye odağının korunması ve fare sonrası otomatik gizlenme de geçti.
- Yerel HLS dosyalarında gerçek **Hls.js 1.6.13 / Video.js 8.23.4** ile 1080/720/480 listesi ve 1080→480 decoded geçişi Firefox'ta doğrulandı.
- Üretilmiş yerel WebM'de Firefox medya saati 2x isteğinde yaklaşık 1.94x, 16x isteğinde 16x ölçüldü. Reklam fixture'ında yaklaşık 15.97x ve ardından 1x / %40 ses dönüşü doğrulandı.
- 200 filtre girdisi tek stil yazımına birleşti. İki saniyelik yerel örneklerde varsayılan ve filtreli videoda kare kaybı görülmedi; bu, kullanıcının GPU'su veya gerçek siteler için performans garantisi değildir.
- Edge'de önceki 14 temel sentetik kontrol geçti. **Son genişletilmiş Edge denemesinde gerçek Video.js kalite geçişi zaman aşımına uğradı; bu açık sorun çözülmüş sayılmıyor.**

Tarayıcı kanıtı son küçük seçili-video metadata korumasından önce alındı; bu son değişiklik 135 Node testiyle denetlendi. Test medyası, indirilen test kütüphaneleri, profiller ve tarayıcı çıktıları dağıtım ZIP'ine dahil değildir.

## Açık kabul koşulları

- Gerçek Kick/TRT ve raporlanan diğer sitelerde kalite envanteri, hız/ses arayüz eşleşmesi ve reklam geri yüklemesi kullanıcı testi bekliyor. Dizipod kesin rapor kaynağı olarak kabul edilmedi.
- Gerçek ekran okuyucu, tarayıcıda %200 zoom ve cihazda yüksek çözünürlüklü filtre performansı ayrıca denenmeli. Firefox CSS piksel ölçeği deneyi gerçek %200 tarayıcı zoom doğrulaması değildir.
- Tema/erişilebilirlik tercihleri çerçeveye özgü olduğundan fullscreen panelinde farklı kalabilir. Native video fullscreen/PiP altyazı görünümünü tarayıcı sınırlayabilir.

## Kurulum ve kısa deneme sırası

1. ZIP'i ayrı bir klasöre aç. Firefox'ta `about:debugging` üzerinden geçici eklenti olarak `manifest.json` seç; Chromium'da geliştirici modunda klasörü paketlenmemiş yükle.
2. Önceki eklentiyi yeniden yükledikten sonra açık video sayfalarını da yenile. Yeni ses grafiği ve erken oynatıcı kancaları için bu gereklidir.
3. Önce panel konumu/gizlenme ve fullscreen; ardından sitenin kendi menüsüyle kalite karşılaştırması, hız/ses, altyazı ve filtreleri dene. Kick reklamını ayrıca kontrol et.
4. Kalan sorunlarda panelin manuel anonim raporunu paylaş; içerik adı veya tam bağlantı gerekmez.

Kalıcı depolama veya yeni izin eklenmedi. Site uyumluluk listesinde hiçbir site bu testlere dayanarak “Tam Çalışıyor” durumuna yükseltilmedi.
