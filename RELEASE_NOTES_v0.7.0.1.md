# v0.7.0.1 — Filtre ve kalite düzeltme adayı

22 Ekim 2026. v0.7.0 üzerine küçük hata düzeltme paketi; GitHub için **Pre-release**. Önceki ZIP korunur. Bu çalışma sırasında commit, push veya release oluşturulmadı.

## Düzeltilenler

- **İframe filtre sürüklemesi:** aynı anda yalnızca bir filtre komutu bekler; kaynak yavaşsa ara değerler yerine en son değer sırada tutulur. Eski iframe durumu, henüz uygulanmamış kullanıcı seçimini geri ezemez. Eşleşen yanıt geldiğinde normal kaynak eşitlemesi sürer. Kapatma/oynatıcı değişiminde eski kuyruk ve gönderilmemiş çizim işi iptal edilir.
- **Gereksiz medya taraması:** medya içermeyen metin/span eklemeleri, bütün medya ağacının önbelleğini bozmaz. Video/iframe kaldırma-ekleme, ilgili Shadow DOM/custom element değişiklikleri ve bir saniyelik keşif yenilemesi korunur.
- **Video.js kalite geçişi:** oynatıcı hedef kaliteyi seçmişken tampon eski çözünürlükte kalabiliyordu. Seçili videoya bağlı VHS instance'ında hem playlist hem segment yükleyicisi aynı hedefi doğruluyorsa, VHS'nin kendi tampon yenileme yolu explicit kalite isteği başına en fazla bir kez denenir. API yoksa veya sahiplik uyuşmazsa zorlanmaz. Gerçek görüntü eşleşmeden başarı gösterilmez.
- **Test kanıtı:** Edge testi başarısız olduğunda eski başarılı sonuç dosyasını bırakmak yerine aşama ve hata anındaki yerel oynatıcı durumunu yazar. Bu kayıt ve test sunucusu istek listesi eklentinin teşhis sistemine veya dağıtımına eklenmez.

VHS davranışı ve kullanılan SDK yolu için birincil kaynak: [playlist-controller.js](https://github.com/videojs/http-streaming/blob/v3.17.2/src/playlist-controller.js) (`fastQualityChange_`, `runFastQualitySwitch_`). Özel API adı sürümler arasında değişebilir; uygulama sürüm numarasını değil yöntem ve sahiplik varlığını kontrol eder. Kaynaklar/MSE buffer'ları eklenti tarafından doğrudan silinmez.

## Doğrulama

- **142 Node testi**: yeni kuyruk, eski durum reddi, oturum/oynatıcı değişimi, tarama, tampon sahipliği, tek deneme ve SDK hata koşulları dahil.
- **Firefox 158, geçici kurulu eklenti:** iki kademeli cross-origin iframe, tek üst HUD, ses, kalite, SRT/görünüm, fullscreen ve kapat/aç geçti. 36 kare boyunca filtre sürükleme, son 120% değerinin uygulanması ve sıfırlama geçti; bekleyen filtre komutu en fazla **1**.
- **Gerçek Hls.js 1.6.13 / Video.js 8.23.4**, yerel HLS dosyalarında hem Firefox hem Edge ile 1080/720/480 envanteri ve decoded 1080→480 geçişi doğrulandı. v0.7.0 notlarındaki Edge zaman aşımı bu yerel senaryoda artık oluşmadı.
- Firefox yerel 720p dosyasında 200 eşzamanlı filtre girdisi **1 stil yazımına** birleşti. Yaklaşık iki saniyelik varsayılan/filtreli örneklerde kare kaybı 0/0 idi. Bu kısa headless örnek gerçek siteler veya cihaz GPU'su için performans garantisi değildir.
- Dosya medyasında hız ve reklam geri yükleme senaryoları, klavye odağı ve fare sonrası gizlenme de geçti. İzin/depolama/DRM/anonim rapor sınırları korunur.

## Açık kalanlar

Kullanıcı Firefox'ta v0.7.0 ile Özel test sitesi'da bozulma/performance gerilemesi gözlediğini bildirdi; belirli adım ve belirti şu anda bilinmiyor. Bu sitenin v0.7.0.1 ile düzeldiği **doğrulanmadı**. Yerel test, site uyumluluğu onayı değildir.

Gerçek Kick/TRT/diğer site kalite ve reklam akışları, cihazda yüksek çözünürlüklü filtre maliyeti, ekran okuyucu ve gerçek %200 tarayıcı zoom kabulü açık kalır. Çerçeveye özgü tema/erişilebilirlik tercihlerinin fullscreen panelinde farklı kalabilmesi ve native fullscreen/PiP altyazı sınırları önceki adayla aynıdır. Uiverse farkları [ANIMATION_DETAILS.md](./ANIMATION_DETAILS.md) içinde; bu pakette animasyon kapsamı genişletilmedi.

## Deneme

ZIP'i ayrı klasöre aç, eklentiyi yeniden yükle ve açık video sayfalarını yenile. Firefox'ta `about:debugging` → geçici eklenti → `manifest.json`; Chromium'da geliştirici modu → paketlenmemiş klasörü yükle. Önceki sürümle karşılaştırırken aynı anda iki eklenti kopyasını etkin bırakma.

İlk fırsatta Özel test sitesi için panel kapalı/açık ve varsayılan/filtreli görünümü karşılaştır; kalan sorunda manuel anonim rapor ve kısa gözlem yeterlidir. İçerik adı veya tam bağlantı gerekmez. Yeni rapor alanı, uzak bağımlılık, otomatik gönderim veya kalıcı depolama eklenmedi.
