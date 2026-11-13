# Araç çubuğu yeniden tasarımı (Model 5)

Durum: tasarım aşaması, kod değişmedi. Tasarım Figma'da (`FilmDeck MEC523 Wireframes`, son sayfa "Model 5 · rev 3" ve sonrası). Kararların tarihli kaydı [ACTIVE_WORK.md](ACTIVE_WORK.md) içinde. Bu dosya, uygulamaya geçerken uyulacak teknik kuralları ve bugünkü panelin (v0.7.18) her özelliğinin yeni tasarımdaki yerini tutar. Bir özellik yeni tasarımda yer bulmadan eski panel kaldırılmaz.

## 1. Yapı

- Video üzerinde yatay bir araç çubuğu: `FilmDeck` yazısı, her grupta duran simgeler (PiP, klavye kısayolları, rapor), seçili grubun düğmeleri ve en sağda grup düğmesi.
- Dört grup: Player, Subtitles, Settings, Accessibility. Grup düğmesine tıklama sonraki gruba geçer, fare tekerleği ileri/geri gezer, çift tıklama dört grubun listesini açar.
- Grup düğmesi o anki grubun adı kadar geniştir; liste en uzun ada göre açılır.
- Her düğme kendi açılır kutusunu açar; aynı anda tek kutu açıktır. Settings grubunda Help kutusu kendiliğinden açıktır.

## 2. Teknik kurallar

| Kural | Ayrıntı |
|---|---|
| Açılır kutunun yönü | Araç çubuğu ekranın üst yarısındaysa açılır kutular, durum şeritleri ve grup listesi çubuğun **altında**; alt yarısındaysa **üstünde** açılır. Karar araç çubuğunun dikey ortasına göre verilir; sürükleme bitince ve pencere boyutu değişince yeniden hesaplanır. Kutu yine de ekrana sığmazsa mevcut `clampPopupToViewport` kenar payı (12 px) uygulanır. |
| Yatay hizalama | Kutu açan düğmenin altına/üstüne hizalanır; ekran kenarına taşarsa içeri kaydırılır. Kapatma baloncuğu FilmDeck'in solunda açılır; çubuk sol kenara çok yakınsa sağına açılır. |
| İpucu ve baloncuk teması | Bütün ipuçları, baloncuklar ve açılır kutular panelin o anki temasını kullanır; beyaz ipucu yok. D-09 davranışı korunur: fare 400 ms, klavye odağında hemen, dokunmatikte 500 ms basılı tutma, Esc yalnız ipucunu kapatır. |
| Fare tekerleği | Grup düğmesinde grup değiştirir; hız, ses, sarma adımı ve altyazı zamanlamasında değeri değiştirir. Sayfa kaydırması yalnız imleç o denetimin üzerindeyken engellenir. Her tekerlek işleminin klavye karşılığı olur. |
| Açılır kutu içi | Bölümler eski paneldeki gibi biraz daha açık renkli kutulara ayrılır. |
| Konum hafızası | Mevcut oran tabanlı konum (`hudPlacement`), mıknatıslı kenar (16 px) ve tam ekran/gömülü oynatıcı arasında konum aktarımı aynen korunur. |
| Boşta solma | Mevcut iki aşamalı solma (önce yarı saydam, 2 sn sonra gizli; fare üzerindeyken ve klavye odağında solmaz) araç çubuğuna uygulanır. Accessibility › Keep visible bunu kapatır. |
| Sürükleme ve kapatma (14 Kasım) | `FilmDeck` yazısı hem kapatma baloncuğunu hem sürüklemeyi taşır. Üzerine gelince (veya klavye odağında) solunda yalnız X olan baloncuk açılır. Yazıya basılı tutulup imleç kaydırılınca baloncuk kapanır ve araç çubuğu taşınır. Tıklama ile sürükleme küçük bir hareket eşiğiyle ayrılır; X düğmesinin kendisi sürüklemez. |
| Tek açılır kutu (14 Kasım) | Gerekmedikçe aynı anda iki açılır kutu açık olmaz; yenisi açılınca öncekisi kapanır, kutular birbirini itmez. İstisnalar tek tek belirlenir. Bilinen istisna: Settings grubunda Help hep açıktır; o grupta açılan diğer kutu Help'in yanında açılır ve onu itmez. |

## 3. Bugünkü özelliklerin yeni yeri

Durum: **yerinde** = tasarımda yeri var; **karar** = yeri henüz belirlenmedi.

| Bugünkü özellik | Yeni yeri | Durum |
|---|---|---|
| Panel başlığından sürükleme | `FilmDeck` yazısına basılı tutup sürükleme (bkz. bölüm 2) | yerinde |
| PiP (Alt+P) | Her grupta solda simge | yerinde |
| Klavye kısayolları aç/kapa | Her grupta solda simge | yerinde |
| Teşhis raporu | Her grupta solda uyarı simgesi; Settings › Help içinde de | yerinde |
| Küçült (mini çubuk: çözünürlük, hız, ses, adaptör; −10 sn, oynat/duraklat, +10 sn, PiP) | Kaldırıldı (kullanıcı kararı) | yerinde |
| Oynat/duraklat (bugün yalnız küçültülmüş çubukta) | Ne olacağına henüz karar verilmedi (kullanıcı, 14 Kasım) | karar verilmedi |
| Kapat (Ctrl+Shift+S, kısayollar kapalıyken de çalışır) | FilmDeck üzerine gelince soldaki X baloncuğu | yerinde |
| Dil (TR/EN) | Settings › English | yerinde |
| Oynatılan çözünürlük ve yenile | Player grubunda araç çubuğu altındaki şerit | yerinde |
| Adaptör rozeti, değiştir penceresi, video hedefi | Player › kalite kutusu › Player detection | yerinde (alternatif: Settings) |
| DRM korumalı akış rozeti ve bilgi penceresi | — | sonra bakılacak (kullanıcı, 14 Kasım) |
| Kare kaybı bildirimi (Evet/Hayır, D-08) | — | ertelendi (Claude önerisi: araç çubuğu altında şerit) |
| "Etkin oynatıcı bekleniyor" uyarısı, Yeniden tara, Teşhis raporu | — | ertelendi (Claude önerisi: araç çubuğu altında şerit) |
| Hız kaydırıcısı ve hazır değerler; `[` `]` ±0.25x, `R` 1x | Player › hız kutusu | yerinde |
| Sarma −30/−10/+10/+30 sn | Player › `« 10s »` ve açılan kutu | yerinde |
| Ses %0–300, hazır değerler; Shift+↑/↓ ±%10 | Player › ses kutusu | yerinde |
| Stereo/Mono; `M` | Ses kutusu başlığının sağı | yerinde (görünümü kullanıcı araştırmasıyla belirlenecek) |
| Kalite düğmeleri, istek/oynatılan durumu; Alt+Q | Player › kalite kutusu | yerinde |
| Siteye özel "kaynağı yeniden dene" düğmesi | — | ertelendi (Claude önerisi: kalite kutusu veya şerit) |
| Altyazı yükle (.srt/.vtt), aç/kapa, durum, "neden satır yok" | Subtitles; durum şeridi; zamanlama kutusu | yerinde |
| Altyazı zamanlaması −100/0/+100 ms | Subtitles › `− 100ms +` ve kutu | yerinde |
| Altyazı görünümü (boyut, alttan uzaklık, arka plan, renk, sıfırla) | Subtitles › Appearance | yerinde |
| Temalar (20 tema, önceki/sonraki, örnek renkler, kontrast notu) | Settings › tema adı düğmesi | yerinde |
| Görüntü filtreleri ve gece modu, ters renk, sıfırla | Settings › Picture & night | yerinde |
| CDN yanıtı, kısayol ve izin rehberi, teşhis raporu, Hakkında | Settings › Help (açık); rapor ayrıca her grupta simge | yerinde |
| Paneli açık tut, büyük yazı, yüksek kontrast, hareketi azalt | Accessibility grubunda tek tıkla açılıp kapanan düğmeler | yerinde |
| Gömülü oynatıcıda üst sayfada tek panel ve durum köprüsü | Araç çubuğu aynı köprüyü kullanır | yerinde (uygulamada denetlenecek) |
| Reklam işaretinde otomatik denetim (I-04) | Panel denetimi yok; bildirimleri aynı kalır | yerinde |
| Bildirim (toast) ve iletişim pencereleri (odak tuzağı, Esc) | Aynı sistem, panel teması | yerinde |

## 4. Açık noktalar

- **Ertelenen anlık durumlar:** kare kaybı bildirimi, "etkin oynatıcı bekleniyor" uyarısı ve kaynağı yeniden dene düğmesi. Bunlar o ana özgü olduğu için görselleriyle karşılaştırılarak karar verilecek (kullanıcı, 14 Kasım). Claude önerisi: Player grubundaki "Playing" şeridi gibi, yalnız gerektiğinde araç çubuğunun altında (alt yarıda üstünde) beliren bir durum şeridi.
- **Karar verilmedi:** oynat/duraklat.
- **Sonra bakılacak:** DRM rozeti ve bilgi penceresi.
- **Kullanıcıda:** Stereo/Mono denetiminin görünümü (başka sitelerdeki örnekler incelenecek).
- Kısayol aç/kapa şu an yalnız soldaki simgede.

## 5. Denemeden önce kapanması gerekenler

- **Genişlik ve taşma kuralı.** Çizimlerdeki araç çubukları, numara rozetleri çıkarıldığında yaklaşık şu genişlikte: Player 760 px, Subtitles 810 px, Settings 740 px, Accessibility 1020 px. Bugünkü panel 388 px. Pencere daraldığında, gömülü küçük bir oynatıcıda veya "Larger text" açıkken çubuk ekrana sığmayabilir. Taşma olduğunda ne olacağı (yazıların kısalması, düğmelerin yalnız simgeye inmesi, ikinci satır ya da "daha fazla" düğmesi) belirlenmeli.
- **Açık temalar.** Bütün çizimler koyu temada. 20 temanın 7'si açık renkli; araç çubuğu, açılır kutular ve şeritlerin en az bir açık temada ve yüksek kontrastta görünümü kontrol edilmeli.
- **Eski panelle ilişki.** Yeni araç çubuğu eski panelin yerine mi geçecek, yanında seçimli mi duracak (geçiş dönemi için öneri: ayarla seçilebilen ikinci arayüz, eski panel varsayılan kalır).
