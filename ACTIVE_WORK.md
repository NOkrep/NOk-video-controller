# Etkin çalışma kapsamı

22 Ekim 2026. Kaynak sürümü **v0.7.3**. Önceki v0.7.0.1 çalışması korunur; yeni kullanıcı raporları mevcut hedefin devamıdır. Tamamlanmış dil/tema/iframe filtre kuyruğu işleri yeniden yapılmaz. Kullanıcı istemeden ZIP, pre-release, normal release veya push hazırlanmaz. Kaynak klasörü esas alınır.

1. **Bellek:** ayrı Firefox test profilinde eklentisiz/kapalı/açık ve tekrarlı aç-kapat/video değiştirme ölçümü; süreç belleği ile JS/nesne tutulması ayrımı; kişisel tarayıcı geçmişi ve ham heap rapora girmez.
2. **Yanlış video ve geç keşif:** yüklenmemiş veya görünmeyen gömülü oynatıcıların çalışan videonun önüne geçmesini engelle; gerçek API/video sahipliğiyle adaptör seç; kullanıcı seçimini koru.
3. **HUD yaşam döngüsü:** kullanıcı açmadan görünme; video sonradan hazır olunca panel kapanmasın; çerçeve/sayfa değişiminde eski hedeften çıkıp yeniden bulsun.
4. **Rapor:** platform varsayılan other; kullanıcı seçerse önizlemede sayfanın alan adı ve platform adı. Oynatıcı türü site adı değildir. Yorum sınırını görünür sayaçla genişlet; serbest açıklama otomatik anonimleştirilmez. Site test kayıtları yalnızca yerelde.
5. **UI:** german_7619 brown-sloth-50 birleşik etiket/seçili yüzey yaklaşımını dikey sekmelere uyarla; klavye/ARIA/native button korunur. Uzun işlem yazıları ve iframe ses çubuğu görseli düzgün sığsın.
6. **Altyazı:** zemin opaklığı 0 iken zemin kenarlığı/gölgesi kalmasın; metin okunurluğu ayrı korunur.
7. **Kick:** gerçek SDK sesi/hızı ile sitenin görünür kontrol durumunu ayrı doğrula; UI eşleşmesi olmadan başarı iddiası üretme; setter önbelleği korunur.
8. **Kalite:** Video.js'te seçilen seviye ile decoded görüntü ayrımı açık; Puhu'da uydurma sayısal kalite listesi yerine gerçek oynatıcı envanteri/kontrolü; başarısız veya desteklenmeyen kontrol dürüst gösterilir.

Özel alan adları ve rapor gözlemleri `PRIVATE_TEST_NOTES.md` / `SITE_COMPATIBILITY.md` içindedir; Git'e alınmaz. Kabul kanıtı kaynak, anlamlı regresyon testi ve Firefox tarayıcı kontrolüyle ayrı kaydedilir; gerçek site başarısı yerel testten türetilmez.

## Bu turdaki sonuç ve sonraki kabul

- 2–6 için kaynak düzeltmeleri ve regresyon kontrolleri uygulandı. Firefox kurulu eklentide geç medya/iframe değişimi ve 2.0 CSS piksel ölçeği kontrolleri geçti. Ayrıntılar DEVELOPMENT_STATUS.md.
- 1 için Firefox ve **gerçek kurulu eklentiyle Chromium tabanlı Edge** ilk bellek turları tamamlandı: aynı yerel video, eklentisiz/hiç açılmamış/açık ve 30 aç-kapat/kapalı aşamaları. Edge'de heap/DOM/listener sayıları da ölçüldü. MEMORY_MEASUREMENTS.md.
- 7–8 kaynak düzeltmeleri ve kontrollü oynatıcı testleri tamamlandı; güncel Kick UI ve Puhu isimli kalite menüsü gerçek site kabulü açık. Bunları yerel testten “çözüldü” olarak işaretleme.
- Sonraki bellek/performance turu: uzun oynatma ve SPA/video değiştirme, gerçek sesli medyada boost/mono, görüntü filtreleri açık/kapalı CPU/GPU/kare kaybı ve gerektiğinde kontrollü GC ile tutulmuş heap karşılaştırması. İlk turdaki süreç RAM'i eklentinin tek başına tüketimi olarak sunulmaz.
- Eski uygulama hedefi tamamlanmış olarak işaretlenmez; yeni raporların uygulama kapsamı bu dosyadan izlenir. ZIP/yayın/push istenmedi ve yapılmadı.

## Kullanıcının yeni dört parçalı hedefi — v0.7.2 kontrol noktası

1. **Bellek: ilerledi, bütünü açık.** Sesli dosya, 30 aç/kapat, 20 boost/mono video değişimi ve zorlanmış toplama ile ölçüm yapıldı. Chromium'da kaldırılmış 20 video/kaynak tutulması düzeltildi; iki motorda artık bir canlı video/kaynak/bağlam kaldı. Yeniden eklenen aynı medya öğesi kendi binding'ini kullanabiliyor. Önceki Firefox 34 MiB farkı sabit dosya + GC/CC ölçümünde tekrar edilmedi; tekil native tahsis nedeni belirlenmiş sayılmaz. Toplam native RAM/cache payının sınıflandırılması hâlâ açıktır.
2. **Filtre performansı: açık.** CPU/GPU ölçüm yardımcıları hazırlandı; henüz filtreli/filtersiz karşılaştırmanın kanıtı değildir. İki motorda işlemci, GPU ve düşen kare ölçümleri yapılmalıdır.
3. **Kick UI/reklam: açık.** Bu turda yeni gerçek site doğrulaması yapılmadı.
4. **Puhu/Video.js/medya keşfi gerçek site kabulü: açık.** Önceki yerel testler korunur; güncel site başarısı iddia edilmez.

**Sürüm bildirim kuralı:** her kaynak sürümü artışında kullanıcıya sürüm, değişiklik, doğrulanan kanıtlar ve açık hedefler bildirilir; hedef kartını kullanıcı güncelleyebilir. v0.7.2, 158 Node testi ve gerçek Firefox/Edge laboratuvar kontrolleriyle kaynak kontrol noktasıdır; release/ZIP/push yoktur.

## v0.7.3 kontrol noktası — hedef kartına aktarılacak durum

- **1 Bellek: kısmen tamamlandı.** v0.7.2 nesne temizliği kanıtı korunur; toplam native/cache RAM payı henüz sınıflandırılmadı.
- **2 Filtreler: ölçüm ve hedef araması düzeltmesi tamamlandı; render kabulü açık.** 1080p30 yerel videoda Firefox/Edge CPU, GPU sayaç durumu ve kare kaybı iki tekrarla kaydedildi. 200 ms WeakRef hedef önbelleğiyle sürükleme video konumu sorgusu Firefox 199/202 → 94/93, Edge 386/386 → 98/88. 159 Node testi geçti. Firefox ağır statik zincir kare kaybı ve görünür tarayıcı/GPU doğrulaması tamamlanmadı. FILTER_PERFORMANCE.md.
- **3 Kick UI/reklam: açık.** Bu kontrol noktasında yeni canlı site kanıtı yok.
- **4 Gerçek site kalite/medya keşfi: açık.** Puhu/Video.js ve bildirilen gömülü oynatıcılar için canlı kabul sürer.

Kaynak klasörü v0.7.3; kullanıcı sürüm artışından ve kalan kapsamdan haberdar edildi. Hedefin bütünü tamamlandı işaretlenmez. Yayın/ZIP/push istenmedi ve yapılmadı.
