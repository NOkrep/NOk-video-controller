# Animasyon, filtre ve reklam denetimi maliyeti — D-08

5 Kasım 2026, v0.7.15. Kullanıcı animasyon eklemenin performansı nasıl etkilediğini ve eklentinin kaynak sıkıntısında öneri verip veremeyeceğini sordu. Yeniden çalıştırma: `node tests/animation-performance.cjs --engine=both --label=<etiket>` (TESTING.md).

## Yöntem ve sınır

Geçici görünür profiller, Firefox 159 ve Edge 152. 1080p30 sentetik video, 1600×900 CSS piksel, 4000 sentetik DOM öğesi. Pencere başına 6 sn kare ve rAF, 5 sn CPU ve GPU. Reklam denetimi süresi yalnız test kopyasında ölçülür.

Her durum için turda tek pencere var ve tek donanımdır; zayıf GPU, 4K veya gerçek site karmaşıklığı için sonuç vermez. CPU gürültülüdür: aynı `panel-open` durumu Firefox'ta 0,14 ile 0,65 arasında çıktı. Bu yüzden küçük CPU farkları sonuç sayılmaz. Sıfır kare kaybı ekranın hiç takılmadığını kanıtlamaz. GPU sütunu bu tarayıcının 3D motor örnek ortalamasıdır, cihazın toplam kullanımı değildir.

## Sonuçlar

`önce` v0.7.14, `son` v0.7.15. Düşen kare yaklaşık 180 kare içindedir.

| Durum | Firefox CPU önce → son | Firefox 3D | Edge CPU | Edge 3D | Düşen kare (FF / Edge, son) |
|---|---|---|---|---|---|
| Basılmadı | 0,20 → 0,10 | 0 → 1,0 | 0,63 → 0,35 | 0,2 → 0 | 0 / 3 |
| Basıldı, panel kapalı | 0,08 → 0,16 | 0,4 → 1,2 | 0,41 → 0,35 | 0 → 0 | 0 / 0 |
| Panel açık | 0,58 → 0,65 | 0,4 → 1,0 | 0,49* → 0,36* | 0 → 0 | 0 / 0 |
| Üç filtre | 0,14 → 0,26 | **42,4 → 43** | 0,32 → 0,38 | **5,6 → 6,2** | 0 / 0 |
| Rapor boşta | 0,14* → 0,20 | 0,4 → 3,8 | 0,23 → 0,35 | 0,8 → 1,6 | 0 / 0 |
| Rapor, animasyonlar sürekli | 0,39 → 0,48 | 4 → 6,2 | 0,49* → 0,60* | 2,2 → 5,2 | 1 / 0 |

`*` Süreç kümesi ölçüm sırasında değişti; CPU değeri kesin karşılaştırmaya girmez.

Geniş adaylar yalnız testte eklenen stille, v0.7.15 üzerinde, anahtar 400 ms'de bir değişirken:

| Durum | Firefox CPU | Firefox 3D | Edge CPU | Edge 3D | Düşen kare (FF / Edge) |
|---|---|---|---|---|---|
| Anahtar, mevcut hâli | 0,17 | 2,0 | 0,47 | 0,2 | 0 / 0 |
| Kaynaktaki 0,4 sn geçiş ve 20 px parıltı | 0,16 | 1,4 | 0,31 | 0 | 0 / 0 |
| Tüm düğme ve anahtarlarda sürekli parıltı | 0,14 | 1,4 | 0,34 | 0 | 1 / 0 |
| Azaltılmış hareket, panel boşta | 0,15 | 1,4 | 0,35 | 0 | 0 / 0 |

## Ne anlama geliyor

- **Rapor animasyonları:** Ölçülebilir kare kaybı yok. Kontroller 400 ms'de bir sürekli uyarılırken 3D değeri biraz yükseldi (Firefox 4 → 6,2, Edge 2,2 → 5,2). Gerçek kullanımda bu kadar sık çalışmazlar. Rapor boştayken görülen küçük artış (Firefox 3,8) ara turda 1,2 idi; boşta hareket eden bir şey eklenmedi, gürültüden ayrılamadı.
- **Filtreler asıl maliyet:** Firefox'ta üç filtre 3D değerini yaklaşık 1'den 43'e çıkarıyor, Edge'de 6'ya. Bu makinede kare düşürmedi ama diğer her şeyden çok daha pahalı.
- **Geniş animasyon:** Parıltı dahil denenen hiçbir aday bu makinede farkı ölçülebilir kılmadı. Bu ekleme izni değildir: yalnız güçlü bir GPU'da, tek turda görüldü. Uygulanmadı.
- **Azaltılmış hareket:** Panel boştayken ölçülebilir kazanç yok, çünkü panelde boşta çalışan animasyon yok. Bildirimde "Evet" denince asıl kazanç varsa filtreden gelir. Bildirim ikisini de sunar çünkü kullanıcı öyle istedi; soruda hangisinin değişeceği yazar.

## Basış sonrası reklam denetimi

v0.7.13'te ölçülmemiş kalan iş. Döngü 750 ms'de bir çalışır.

| Sayfa | Medyan | p95 | En yüksek | 30 sn'de toplam |
|---|---|---|---|---|
| Gerçek sayfa, Firefox (yaklaşık 5900 DOM öğesi) | 2 ms | 9 ms | 17 ms | 139 ms |
| Gerçek sayfa, Edge (yaklaşık 6000 DOM öğesi) | 0,2 ms | 6 ms | 7,3 ms | 85 ms |
| Sentetik 4000 öğe, iki motor | 0-3 ms | en çok 8 ms | | |

Gerçek sayfada ana iş parçacığının yaklaşık binde 3-5'i. CPU penceresinde basılmış ve basılmamış durum arasında gürültüden ayrılan fark yok. Firefox zamanlayıcısı 1 ms çözünürlüklüdür. Gerçek sayfa olarak YouTube kullanıldı; adres ve içerik kaydedilmedi.

## Kare kaybı bildirimi

**Kural:** Son 4 pencerede (her biri yaklaşık 3 sn) toplam kayıp en az %15 ve en az 2 pencere kötü. Kötü pencere en az 10 kare içerir. Duraklatma, atlama, video sonu, 2x üstü hız, hızlandırılan reklam, gizli sekme ve yeni kaynak baştan başlatır. Tampon dolumu kanıt sayılmaz.

**Eşik neden böyle:** Normal oynatmada kayıp 180 karede 0-4 (en çok %2,2), 3 sn'lik tek pencerede en çok %10 görüldü. İlk kural "art arda 4 kötü pencere" idi. Gerçek yük altında kayıp dalgalı geldi ve o kural Edge'de hiç sormadı, bu yüzden değiştirildi.

**Maliyet:** Yeni zamanlayıcı ve ek video araması yoktur; reklam denetiminin mevcut döngüsünde kare sayaçları okunur. Panel kapalıyken okuma olmaz, tarayıcı testiyle doğrulandı. CPU ve RAM okunmaz. Sonuç rapora ve depolamaya girmez.

**Gerçek sayaçlarla ağır yük denemesi** (taklit yok; 1080p üzerinde bulanıklık katmanları, meşgul sayfa ve 24 ek hızlı video):

- **Firefox:** Pencerelerde %21-99 kayıp, bildirim yaklaşık 12 sn'de çıktı. Panel boşta gizliydi ve uyanmadı.
- **Edge:** Bildirim 36 sn içinde **çıkmadı**. Video 3 sn'de 90 kare yerine 1-42 kare üretti, yani ağır takıldı, ama tarayıcı bunların çoğunu düşen kare saymadı (dışarıdan okunan 3 sn'lik pencerelerde %0-46). Sayaç hiç üretilmeyen kareyi görmez. Kuralın neden tetiklenmediği ayrıca ayrıştırılmadı: motorun pencere sınırları dış okumadan farklıdır ve tampon durumundaki anlar sayılmaz.
- **Sadece blur ve meşgul sayfa:** İki motorda kayıp en çok %10, bildirim çıkmadı. Sayaçlar buna duyarlı değil.

**Sonuç:** Bildirim tarayıcının bildirdiği kaybı yakalar, kullanıcının hissettiği her takılmayı değil. Edge'de eşiği aşan gerçek kayıp bu makinede üretilemedi; Edge'de sorma yolu sayaçlar test içinde değiştirilerek doğrulandı. Düşük kare üretimini de saymak ayrı bir iş olur, kare hızını bilmek gerekir; yapılmadı.

**"Tekrar sormaz" sınırı:** Eklenti RAM dışında bir şey saklamadığı için "Hayır" sayfa yenilenene kadar geçerlidir. Panel kapatmak yanıt sayılmaz; yeniden açınca ölçüm baştan başlar.

## Yan bulgu

Rapordaki görünmez native checkbox'lar kaydırma alanının dışındaki kapsayıcıya göre konumlanıyordu. Rapor kaydırılınca tıklama alanı yerinde kalıp başka alanların üstüne binebiliyordu. Satıra `position: relative` eklendi; `report-browser` testi önce Firefox'ta kırmızı oldu.
