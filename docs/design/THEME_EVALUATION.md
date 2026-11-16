# Tema değerlendirmesi

19 Ekim 2026 · v0.5.10

Kaynak: [SevenGrid tema demosu](https://sevengrid.app/?ref=grave). Tarayıcıda görünen 20 tema adı ve CSS renk değişkenleri incelendi: 7 standart/koyu, 7 açık, 6 OLED. Tablo renk hesabına ve palet yapısına dayalı değerlendirmedir; her temanın eklenti içinde gerçek tarayıcıda görsel veya ekran okuyucu onayı değildir. Finalist seçimi kullanıcıya bırakılmıştır; tüm seçenekler etkin durumdadır.

Settings → Themes altında aileye göre seçim, Previous/Next ile sıra ve renk örnekleri bulunur. Sayfa yenilendiğinde Atlas geri gelir. Yüksek kontrast açıkken etkin tema adı korunur fakat yüksek kontrast renkleri önceliklidir; alan bunu açıklar.

## Paletlerin karşılaştırması

“Kaynak min.”, kaynak ikincil metninin üç opak zemin üzerindeki en düşük kontrastıdır. “HUD min.” uyarlanmış ikincil metnin aynı üç zemindeki en düşük kontrastıdır. Eşik en az 4.5:1 seçildi. Tema adı, ana/kart yüzeyleri ve ana vurgu korunur; küçük metin, sınır, durum rengi ve seçili kontrol yazısı HUD için uyarlanır.

| Tema | Aile | Ana zemin | Kaynak vurgu | Kaynak min. | HUD min. | Değerlendirme |
| --- | --- | --- | --- | ---: | ---: | --- |
| Aurora | Standart/koyu | #0A0F12 | #1DC7B7 | 5.21 | 5.21 | Turkuaz; dengeli, belirgin etkin kontrol. |
| Mocha | Standart/koyu | #15110D | #B5876F | 4.92 | 4.92 | Kahverengi koyu yüzey; ikincil metin uyarlaması önemli. |
| Forge | Standart/koyu | #06171E | #FD7D00 | 6.38 | 6.38 | Petrol yüzey, turuncu vurgu; etkin kontrol dikkat çekici. |
| Ember | Standart/koyu | #0F1014 | #D4AF37 | 4.76 | 4.76 | Koyu nötr yüzey, altın vurgu. |
| Pine | Standart/koyu | #0C1611 | #5BA66E | 4.76 | 4.76 | Koyu yeşil yüzey ve yeşil vurgu. |
| Atlas | Standart/koyu | #0A1418 | #5F99B9 | 4.83 | 4.83 | Mevcut petrol/mavi görünümün karşılaştırma noktası ve varsayılan. |
| Plum | Standart/koyu | #150D14 | #C084FC | 4.99 | 4.99 | Koyu erik/mor yüzeyler. |
| Daylight | Açık | #FBFAF7 | #0A6E63 | 5.09 | 5.09 | Sıcak açık zemin ve yeşil; gündüz karşılaştırması. |
| Daybreak | Açık | #FEF9F6 | #A34F1E | 5.10 | 5.10 | Şeftali yüzeyler ve bakır vurgu. |
| Cream | Açık | #F9F6EA | #6B4423 | 4.96 | 4.96 | Krem kâğıt ve kahverengi; sıcak açık seçenek. |
| Sage | Açık | #F6FCF6 | #2F6B47 | 5.09 | 5.09 | Açık yeşil; sakin yüzey gruplaması. |
| Glacier | Açık | #F5FBFF | #2F6B8F | 5.10 | 5.10 | Soğuk açık mavi; gündüz için Atlas karşılaştırması. |
| Paper | Açık | #FAFAFA | #4F46E5 | 5.12 | 5.12 | Nötr gri/açık yüzeyler, mor vurgu. |
| Blossom | Açık | #FFF9FB | #8E2F73 | 5.08 | 5.08 | Açık pembe yüzeyler, mürdüm vurgu. |
| Cinder | OLED | #000000 | #C98F6B | 5.34 | 5.34 | Siyah zemin, sıcak toprak vurgu. |
| Onyx | OLED | #000000 | #D4AF37 | 5.34 | 5.34 | Siyah zemin, altın vurgu. |
| Obsidian | OLED | #000000 | #5BA66E | 5.34 | 5.34 | Siyah zemin, yeşil vurgu. |
| Eclipse | OLED | #000000 | #1DC7B7 | 5.34 | 5.34 | Siyah zemin, turkuaz vurgu. |
| Midnight | OLED | #000000 | #A5B4FC | 5.34 | 5.34 | Siyah zemin, açık lavanta vurgu. |
| Nocturne | OLED | #000000 | #C084FC | 5.34 | 5.34 | Siyah zemin, mor vurgu. |

## Uyarlama sınırı

- Renkler eklentide yerel sabitlerdir; kullanım sırasında SevenGrid veya Uiverse isteği yapılmaz.
- İkincil/vurgu metni, başarı/uyarı/hata metni üç ana opak yüzeyde 4.5:1; kontrol kenarlığı 3:1 hedefine doğru en küçük %1 RGB adımlarıyla açılır/koyulaştırılır. Hesap bir kez katalog kurulurken yapılır. Seçili dolgu üzerinde siyah/beyaz seçeneklerden yüksek kontrastlı olan seçilir.
- Ana zeminler/ana vurgu kaynakla aynıdır; bu nedenle uyarlama birebir website CSS kopyası değildir. Kaynak kodunda alfası olan hover/gölge, gerçek yazı boyutu, focus, devre dışı alan ve animasyon durumları ayrıca canlı incelenmelidir.
- Tema medya renk filtresini, DRM/ses yolunu, hızı veya kalite isteğini değiştirmez. Tema kimliği raporlanmaz ve kalıcı saklanmaz. Mevcut çerçevedeki HUD/pencere/toast birlikte boyanır; başka çerçeveye tema tercihi aktarılmaz.

## Kullanıcı denemesi

Önce Atlas ile bir referans al; sonra bir açık (örneğin Daylight/Glacier), bir sıcak (Mocha/Cream) ve bir siyah zeminli seçeneği aynı video üzerinde karşılaştır. Finalistleri bu dosyaya otomatik işaretlemedik; beş tema seçimi sonraki kullanıcı geri bildiriminde kaydedilebilir.

Her adayda Player, Settings, altyazı dosya durumu ve teşhis önizlemesini kontrol et. Normal/büyük yazı, hareket azaltma, yüksek kontrast aç/kapat, iki dil, dar iframe ve 200% zoom ile seçili/boş/hover/focus durumlarını dene. Node renk hesabı bu canlı kontrolün yerine geçmez.
