# v0.7.0 iframe panel sunumu

> 20 Ekim 2026 paket durumu: Güncel paket kanıtı: **135 Node testi** geçti. Firefox 158 üzerinde geçici kurulu eklentiyle nested iframe, fullscreen, altyazı, odak/gizlenme ve yerel gerçek Hls.js/Video.js kalite geçişleri doğrulandı. Son genişletilmiş Edge Video.js kalite geçişi zaman aşımı açık sorundur. Gerçek site kabulü bekliyor; ayrıntılı sınırlar ve deneme sırası [RELEASE_NOTES_v0.7.0.md](./RELEASE_NOTES_v0.7.0.md) içinde.

20 Ekim 2026 · test adayı. Amaç normal sayfada gömülü videonun kontrollerini kapatmayan tek paneldir. Medya, altyazı katmanı ve SDK işlemleri videonun bulunduğu belgede kalır; üst belge yalnızca HUD'u sunar. Top sayfada video varsa normal yerel kontrol tercih edilir.

## Hat ve sahiplik

`frame-protocol.js` manifest/background içerik betiklerinden önce yüklenir; içerik betiği aynı yardımcıyı Main World'e, ardından `injected.js` motorunu ekler. Ek izin yoktur. Yardımcı engellenirse eski yerel çerçeve kontrolü fallback'tir; bu durumda üst sunum garanti edilmez.

İçerik betiği ilk çalışan çocuk dalını WindowProxy ile sabitler. Sadece bu dal durum/yanıt gönderebilir; komutlar aynı daldan aşağı iner. Nested iframe'lerde aracı çerçeve medyaya sahipmiş gibi davranmaz. Her açılışta yeni RAM oturumu, kaynak motorunda ayrı sahiplik tokenı ve envanter değişim sayacı vardır. Bunlar kullanıcı kimliği veya kimlik doğrulama sırrı değildir; önceki oturumun/gecikmiş listenin yanlış videoyu yönetmesini önler. Kapatma, dal kopması veya sahip değişimi bekleyen istekleri iptal eder. Komut bekleme süresi 5s; manuel ölçüm/rapor için 10s.

Kaynak veya üst iframe tam ekrana alınırsa tek görünür HUD kaynak çerçeveye geçer; çıkışta üst sunum geri gelir. Tarayıcının doğrudan `video` elementine ait yerel tam ekranı/PiP'si DOM paneli desteklemeyebilir. Kullanıcı etkinleştirmesi isteyen PiP çağrıları çapraz çerçevede reddedilebilir; başarı uydurulmaz.

## Veri sınırı

- Otomatik durum yalnızca sabit adaptör/durum kodları, teknik medya değerleri, boyutlar, sayısal kalite seçenekleri, sıra/yükseklik tabanlı video adayları ve yerel kontrol değerlerinden oluşur. URL, başlık, kaynak adresi, izleme konumu, dosya adı veya cue metni yoktur.
- En fazla 128 kalite ve 32 video adayı aktarılır. Bu sınırın üstü listelenmez; tüm kaynağın bulunduğu iddiası yapılmaz. Ham envanter kimlikleri/SDK nesneleri yalnızca kaynak çerçevenin RAM'inde kalır.
- Kullanıcı dosyayı seçerse altyazı cue'ları açık `subtitle-load` komutuyla seçili kaynak dalına aktarılır; otomatik durumla geri taşınmaz ve rapora girmez. Dosya üstte 4MB, aktarımda 20.000 cue/2 milyon metin karakteri ile sınırlıdır. Metin DOM'a `textContent` ile çizilir.
- Teşhis sadece kullanıcı isterse kaynaktan üstteki önizlemeye gelir. Tekrar allowlist süzgecinden geçer; açıklama ve silme tercihi daha sonra üst önizlemede kullanıcı tarafından eklenir. Ağla otomatik gönderim yoktur.
- Aktif olmayan/idle-hidden üst panel kaynağın 750ms envanter taramasını/durum aktarımını durdurur. Bekleyen doğrulama, mevcut video referansında kontrol edilebilir. Yeniden etkileşim/tam ekran aktarımı tekrar açar. Reklam denetimi bağımsızdır.

Sıfır kalıcı depolama korunur. `postMessage` ve sayfa DOM'u gizli iletişim kanalı değildir: sayfa betikleri Main World verilerini gözleyebilir/etkileyebilir. Token/şema kontrolü kötü niyetli sayfaya karşı izolasyon veya mutlak anonimlik garantisi değildir. Yeni ağ/uzak kod/depolama yetkisi verilmez. Tema ve erişilebilirlik tercihleri halen çerçeveye özeldir; tam ekran geçişinde bunların iki ayrı panel arasında eşitlenmesi kapsam dışındaki bilinen sunum sınırıdır. Dil sabit sinyallerle eşitlenir.

## Kanıt

Node testleri protokol sınırları, tek/nested/sibling dal, eski oturum/sahip/sayaç reddi, iptal/zaman aşımı ve fullscreen yönlendirmesini sınar. `tests/browser-integration.cjs`, iki farklı localhost kökeninde gerçek Edge DOM/medya ile üst panel sınırını, tek HUD'u, ses/kalite/altyazı/filtreyi, iframe fullscreen giriş/çıkışını, kaynak raporunu ve kapat/açı sınar.

Bu senaryo production betiklerini sayfa betikleri olarak yükler; tarayıcıya kurulmuş eklenti/isolated-world izin testi değildir. Ayrı tests/firefox-integration.cjs senaryosu Firefox 158 üzerinde geçici kurulu eklentiyle iki kademeli nested iframe, fullscreen ve yeniden açmayı geçti. Mağaza paketi, ekran okuyucu, gerçek tarayıcı zoom ve gerçek site doğrulaması ayrıca gereklidir. Test çıktıları `tests/artifacts/iframe-browser/` altında üretilir, Git'e alınmaz.
