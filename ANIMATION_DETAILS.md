# Uiverse animasyonları: kaynak ile mevcut uyarlama farkları

20 Ekim 2026 · v0.6.0. Kullanıcının istediği karşılaştırma; bu sürüm animasyonları genişletmez. Kaynaklar Uiverse'in [resmî Galaxy arşivinden](https://github.com/uiverse-io/galaxy) yeniden okundu. Çalışan eklentiye uzak kod/font/ağ bağımlılığı eklenmedi. Yazarlar ve MIT metni THIRD_PARTY_NOTICES.md içindedir.

Önceki uygulama bazı örneklerin etkileşim yaklaşımını uyarladı; tüm dekorları ve süreleri birebir taşımadı. Bunlar uygulama tercihleriydi. Glow veya uzun geçişin her cihazda yavaş olduğuna dair ölçüm yapılmadı; bu belge böyle bir sonuç iddia etmez. Her kontrolün tam kaynak animasyonuna daha yakın bir sürümü ileride ayrı denenebilir.

## Uygulanan beş örneğin ayrıntısı

| Bileşen / kaynak | Kaynaktaki hareket | Mevcut eklenti | Taşınmayan / değiştirilen |
| --- | --- | --- | --- |
| [Voxybuns düğme](https://github.com/uiverse-io/galaxy/blob/main/Buttons/Voxybuns_lucky-fireant-71.html) | Sabit dış button üzerinde ayrı `.button_top` yükselir: normal -0.2em, hover -0.33em, basılınca 0; 0.1s ease. | Normal -2px, hover -3px, basılı +1px; 0.1s ease. Alt kenar gölgesi basılınca sıfırlanır. Mevcut native button'un kendisi hareket eder. | Ayrı iç kapak yok; dolgu, 17px metin, siyah/beyaz sabit renkler aynen alınmadı. İç metni tekrar sarmalamak yerine mevcut çeviri/handler düğümleri korundu. Bu yüzden iki katmanlı kaynak görünümü birebir değil. |
| [WhiteNervosa checkbox](https://github.com/uiverse-io/galaxy/blob/main/Checkboxes/WhiteNervosa_green-donkey-82.html) | Daire konturu 0.3s linear ile silinir; check çizgisi 0.2s linear ile, 0.15s gecikmeyle çizilir. Hover'da 48px dairesel halo belirir ve çizgi rengi değişir. | Daire/check dash hareketleri 0.3s ve 0.2s ile vardır; native checkbox görünmez ama odaklanabilir, yanında dekoratif SVG bulunur. Tema vurgu rengi kullanılır. | 0.15s sıralama gecikmesi, 48px halo ve hover renk geçişi alınmadı. Kaynak input'u display:none yapıyordu; burada klavye erişimi korunur. Halo, geometri ve gecikme native kontrolü gizlemeden yeniden eklenebilir. |
| [gharsh11032000 switch](https://github.com/uiverse-io/galaxy/blob/main/Toggle-switches/gharsh11032000_brave-pug-20.html) | 0.4s cubic-bezier geçişleri; yuvarlak başlık 1.5em kayar, seçiliyken 20px mavi glow ve mavi sınır belirir. | 44×26px kontrol, 16px başlık, 18px kayma; 0.2s ease. Sınır ve başlık tema rengine döner; görünür klavye odak halkası vardır. | Kaynak eğrileri/süreleri ve mavi glow alınmadı. Boyut HUD için küçültüldü. Glow ve 0.4s eğriler yeniden denenebilir; tema ve yüksek kontrast koşulları ayrıca kontrol edilmeli. |
| [eslam-hany input](https://github.com/uiverse-io/galaxy/blob/main/Inputs/eslam-hany_strange-goose-48.html) | 0.5s geçiş; 7px ofset gölge odakta kaybolur. Üst çizgi %35, alt çizgi %100 genişliğe uzar. Başta gizli etiket küçülüp yukarı çıkar. | Rapor textarea'sında 3px ofset gölge 0.2s ile kaybolur; alt sınır odakta vurgu rengi olur. Açıklama/etiket sürekli görünür kalır. | Hareketli üst/alt çizgi ve floating label yok. Mevcut alt sınır renk değişimi, kaynaktaki çizgi uzamasıyla aynı animasyon değildir. Kaynak tek satırlı input, bizim alan textarea. Çizgiler dekoratif katmanlarla yeniden eklenebilir; yönergeyi gizlemek gerekmez. |
| [Nawsome loader](https://github.com/uiverse-io/galaxy/blob/main/loaders/Nawsome_slimy-tiger-93.html) | Beş karenin 2.4s döngüsü, 0.2s gecikme ve 0.4s giriş; kare26px, adım30px. | Beş karenin tüm hareket yolları ve süreleri taşındı. Kare4px/adım5px; renk temadan. Yalnızca gerçek CDN ölçümü sürerken görünür ve işlem bitince kaldırılır. | Tam boyut, turuncu renk ve geniş dış boşluklar alınmadı. Reduced motion açıkken loader gizlenir; yazılı “Measuring…” durumu kalır. |

Mevcut sınıflar: `pvc-raised-button`, `pvc-check-input`/`pvc-check-visual`, `pvc-switch-track`, `pvc-feedback-field`, `pvc-loading-grid`. Hepsi injected.css içinde yereldir. Düğme sınıfı ana eylem/chip/rapor eylemlerine uygulanır; tüm simge, sekme ve kalite düğmeleri aynı yükselme stiline çevrilmemiştir.

## Henüz kullanılmayanlar

- [german_7619 radio](https://uiverse.io/german_7619/brown-sloth-50): 20 Ekim'de kullanılmıyordu. **22 Ekim güncellemesi:** sayfa/görsel tekrar doğrulandı; seçili etiketle içeriği birleştiren yüzey ve içbükey dış köşeler dikey HUD sekmelerine uyarlandı. Etiket kaydırma/radio DOM'u taşınmadı; native button/ARIA ve klavye gezinmesi korunur. Geçiş için sürekli çalışan animasyon yoktur; selected/focus durumları CSS ile güncellenir. Spacious74 kredisi THIRD_PARTY_NOTICES.md dosyasına eklendi.
- [zanina-yassine form](https://uiverse.io/zanina-yassine/angry-shrimp-34): checkout yerleşimi incelendi; mevcut HUD'a uygun bir form görevi oluşmadığı için uygulanmadı.
- [vinodjangid07 tooltip](https://uiverse.io/vinodjangid07/funny-panther-79): kullanılmadı; kesin kaynak kodu doğrulanmadı. Mevcut native title, bu örneğin tooltip animasyonu değildir.

## v0.7.15 rapor penceresi güncellemesi (D-08)

Kullanıcı kararıyla rapor penceresindeki iki bileşen kaynağa yaklaştırıldı. Yukarıdaki tablo 20 Ekim durumunun kaydıdır ve değiştirilmedi. Ölçümler [ANIMATION_PERFORMANCE.md](./ANIMATION_PERFORMANCE.md) içindedir.

| Bileşen | Eklenen | Kaynaktan farkı |
| --- | --- | --- |
| Checkbox | Check çizgisi 0.15s gecikmeli; 48px dairesel halo ve hover'da çizgi rengi, satırın üzerine gelince. | Halo rengi temadan ve %14; kaynaktaki %3 koyu temada görünmüyor. Hover yalnız `hover: hover` cihazlarda: dokunmatikte halo takılı kalmaz. Hit alanı 20×20 kaldı, satır etiketi de tıklanır. |
| Textarea | Odakta üst çizgi %35, alt çizgi %100; ikisi de sağdan büyür. | 0.5s yerine 0.3s, güçlü ease-out: yazmaya başlarken beklenmesin diye. `width` yerine `scaleX` ile. Yuvarlak köşeden taşmasın diye 6px içeride. Etiket sürekli görünür kalır, floating label yok. |

Odak halkası metin alanında soluklaştırıldı, tam güçteki halka çizgileri örtüyordu. Odak göstergesi artık çizgiler ve soluk halkadır; yüksek kontrast kendi sarı halkasını korur. Alt sınırın odakta renk değiştirmesi kaldırıldı, çizgiyle aynı işi yapıyordu.

Sıradaki denemeler (anahtar eğrileri ve parıltı, düğmenin iç kapağı) uygulanmadı. Ölçümde sorun çıkmadı ama tek donanım örneğidir ve kullanıcı yalnız rapor penceresini seçti.

## v0.7.16 panel tooltip'i (D-09)

Kaynak: [vinodjangid07 tooltip](https://uiverse.io/vinodjangid07/funny-panther-79) kaynak kodu doğrulanamadığı için kullanılmadı; tooltip projenin kendi kodudur, bu yüzden THIRD_PARTY_NOTICES.md değişmedi. Tek öğe panelin içindedir, tema ve erişilebilirlik ayarlarını oradan alır. Yalnız Adaptör, CDN ve kalite durumlarında kullanılır; diğer ipuçları tarayıcının `title` ipucu olarak kaldı. Form örneği hâlâ uygulanmadı.

Hareket: 125 ms opacity ve `scale(0.97)`, hedefe bakan çıkış noktası. Yan öğeye geçişte ve klavyede giriş hareketi yoktur. Kapanış anlıktır.

## Hareket azaltma ve sonraki tasarım denemesi

Settings → Accessibility → Reduce motion başlangıçta işletim sistemi tercihini izler ve RAM'de değiştirilebilir. Açıkken düğmenin yer değiştirmesi, switch/check geçişleri ve loader animasyonu devre dışıdır. Kontroller çalışmayı sürdürür. Bu nedenle animasyon görülmediğinde önce bu tercih kontrol edilmelidir.

Önerilen ayrı deneme sırası: önce checkbox'ın 0.15s gecikmesi/halo'su, sonra switch eğrileri/temaya bağlı glow, ardından textarea'nın dekoratif çizgileri ve düğmenin sabit tabanlı iç kapağı. Bunlar henüz uygulanmış değişiklikler değildir. Her aday normal/reduced-motion/high-contrast, iki dil, klavye ve %200 zoom ile denenmeli; ekran okuyucu adı, focus ve hit alanı değişmemelidir. Gerçek video kare kaybı ölçülmeden performans kazanımı/kaybı yüzdesi ilan edilmemeli.
