# v0.7.0 hedefi — Kabul durumu

22 Ekim 2026. Dağıtılabilir son aday **v0.7.0.1**. Bu kayıt bir tamamlanma onayı değildir; kaynak/test kanıtı ile gerçek site kabulünü ayırır. Mevcut ZIP ve çalışma zamanı kodu bu kontrolde değiştirilmedi.

| Gereksinim | Mevcut kanıt | Kabul durumu |
| --- | --- | --- |
| Normal modda iframe dışı tek HUD; fullscreen/kapat-aç; pointer/klavye gizlenmesi | `tests/artifacts/firefox-browser/result.json`: geçici kurulu Firefox eklentisiyle iki kademeli iframe, tek HUD, fullscreen ve yeniden açma; `reflow` klavye/fare kontrolleri geçti. | Yerel tarayıcı kanıtı var; bildirilen gerçek site akışında kabul açık. |
| Kalite listesinin gerçekten oynatıcıya ait olması ve uygulanan kalitenin doğrulanması | Node sahiplik/kaynak/nesil ve doğrulama testleri; Firefox/Edge gerçek Hls.js/Video.js 1080/720/480 envanteri ve decoded 1080→480. Edge önceki zaman aşımı yerel senaryoda giderildi. | Raporlanan site menülerinin tamamını kapsadığı kanıtlanmadı. |
| TRT hızının 1x'e geri dönmesi; Kick ses/hız arayüz eşleşmesi | TRT Shaka yönlendirmesi/element kilidi ve Kick setter/video sahipliği testleri var. Yerel dosyada hız ölçüldü. | Gerçek TRT/Kick akışı ve site arayüzü kabulü açık; çağrılan setter arayüz eşleşmesi kanıtı değildir. |
| SRT/VTT yükleme, görünürlük ve görünüm ayarları | Parser/boşluk/bozuk veri/boş cue testleri; Firefox nested iframe'de SRT ve görünüm aktarımı geçti. | Yerel kanıt var; kullanıcı dosyası, native video fullscreen/PiP sınırları ayrı. |
| Reklamda 16x, mute, gerçek en düşük kalite; bitişte 1x/önceki ses-kalite | Açık ve seçili oynatıcıya ait reklam marker'ı; ad lifecycle sahiplik/ABR/geri yükleme testleri; yerel dosya medya saati ve geri yükleme kanıtı var. | Gerçek Kick reklamı ve SDK/arayüz dönüşü kabulü açık. İşaretsiz reklamlara tahmin eklenmedi. |
| Filtre performansı ve son kullanıcı değerinin korunması | 200 girdide 1 stil yazımı; 36 kare iframe sürüklemede son değer/reset ve en fazla 1 bekleyen komut. Eski snapshot ve oturum iptali testleri; ilgisiz DOM değişiminde keşif önbelleği korunur. | Yerel örnek geçti. Dizipod ve kullanıcının cihazında gerilemenin giderildiği kanıtlanmadı. |
| Sistematik anonim platform raporu; no-video seçimi; isteğe bağlı silme talebi | `tests/diagnostics.test.cjs` ve `tests/frame-protocol.test.cjs`: fixed enum/platformScope, bilinmeyen alanların reddi, no-video, önizleme, opt-in açıklama/silme talebi. | Kaynak/otomatik test kanıtı var. Mutlak anonimlik veya otomatik issue silme iddiası yok. |
| İngilizce başlangıç/Türkçe seçimi; üç sol sekme; adaptör Player'da; görüntü kontrolleri Settings'te | Localization ve HUD-navigation testleri; native input/düğüm/handler korunması. | Uygulandı. Ekran okuyucu ve gerçek %200 tarayıcı zoom kabulü açık. |
| 20 temanın korunması ve Uiverse farklarının açıklanması | HUD-navigation tema/kontrast testleri; `THEME_EVALUATION.md`, `DESIGN_REFERENCES.md`, `ANIMATION_DETAILS.md`, `THIRD_PARTY_NOTICES.md`. Beş uyarlama ve üç ertelenen örnek ayrı belirtilir. | Açıklama/notlandırma tamam; finalist seçimi kullanıcıda. Yeni dekorasyon kapsamı eklenmedi. |
| Sıfır depolama/minimum izin/cascade/DRM/Kick cache/olay izolasyonu | Manifest yalnızca activeTab+scripting, host_permissions boş; mevcut kaynak ve 142 test. Yeni uzak çalışma zamanı bağımlılığı yok. | Kaynak/otomatik test sınırları korundu; bütün siteler için güvenlik/uyumluluk garantisi değildir. |
| Dağıtılabilir ve geri dönülebilir paket | 26 dosyalı allowlist ZIP, her giriş kaynak dosya SHA256'sıyla karşılaştırıldı. Test çıktıları/medya/profil/depolar paket dışında. Önceki 0.7.0 ZIP korundu. | Hazır. Bu çalışmada commit/push/release yapılmadı. |

## Dizipod erişim kontrolü

- Halka açık ana sayfa erişilebilirdi.
- Ana sayfadan seçilmiş tek bir herkese açık bölüm sayfası in-app tarayıcıda açıldı. Oynatıcı alanında `github.com` için “bağlanmayı reddetti” mesajı veren alt çerçeve görüldü; çalışır video/kalite menüsüne ulaşılamadı.
- Bu yalnızca erişim ön kontrolüdür; kurulu Firefox eklentisi testi değildir. İncelenen örnek kullanıcının izlediği içerik olarak kabul edilmedi. Kullanıcının geçmişi veya hesabı okunmadı; giriş/yorum/paylaşım yapılmadı.
- Bu sonuç, kullanıcının Firefox'ta gördüğü gerilemenin nedenini açıklamaz ve bütün Dizipod oynatıcılarının erişilemez olduğunu kanıtlamaz. Çalışır akış ve kısa yeniden üretim adımı olmadan özgün regresyon kapatılamaz.

## Sonuç ve sıradaki kanıt

142 otomatik test ve kayıtlı yerel Firefox/Edge senaryoları geçiyor; **hedefin gerçek site kabulü tamamlanmış değil**. Sonraki anlamlı kanıt, çalışır gerçek oynatıcıda panel kapalı/açık ve filtre varsayılan/değiştirilmiş karşılaştırmasıyla kısa gözlem veya manuel anonim rapordur. Aynı yerel testleri tekrarlamak bu eksiği kapatmaz.

Paket: `dist/NOk-video-controller-v0.7.0.1-test.zip`  
SHA256: `11bc707a397b35848a25dd5996911e1563138b700bf51c54e0d1339c0a712985`  
Sürüm notu: [RELEASE_NOTES_v0.7.0.1.md](./RELEASE_NOTES_v0.7.0.1.md)
