# FilmDeck by NOk (v0.8.3 — kaynak geliştirmesi)

Sitelerin farklı ve eksik video denetimleri yerine her sitede aynı, tek bir denetim çubuğu. Firefox ve Chromium (Chrome, Edge, Brave, Opera) için Manifest V3 eklentisi.

*One control bar for every video site: speed, volume, quality, subtitles, picture and themes — in Firefox and Chromium.*

## Neler var

- **Araç çubuğu, dört grup:** Player (hız, `« 10s »` sarma, ses %0–300, Stereo/Mono, kalite), Subtitles (SRT/VTT yükleme, zamanlama, görünüm), Settings (dil, görüntü ve gece modu, 20 tema, yardım), Accessibility.
- **Kolay okunur düzen:** klasik panel, 100/125/150% boyut kademeleriyle.
- **Gömülü oynatıcılar:** iframe içindeki videolar üst sayfadaki tek panelden yönetilir; tam ekranda panel videoyla gelir.
- **Resim içinde resim, klavye kısayolları ve gizliliği koruyan teşhis raporu.**

## Kurulum (geliştirici modu)

**Firefox 121+:** `about:debugging#/runtime/this-firefox` → *Geçici Eklenti Yükle* → proje klasöründeki `manifest.json`.

**Chrome / Edge / Brave 121+:** `chrome://extensions` → *Geliştirici modu* → *Paketlenmemiş öğe yükle* → proje klasörü.

Eklentiyi yükledikten sonra açık video sayfalarını yenileyin. Panel, araç çubuğundaki FilmDeck simgesiyle açılır.

## Gizlilik

- **Sıfır depolama:** çerez, `localStorage` veya `chrome.storage` kullanılmaz; tercihler yalnız sayfa açıkken bellekte durur.
- **İzinler:** `activeTab` ve `scripting`; `host_permissions` boş. İçerik betikleri eşleşen sayfa ve çerçevelerde kendiliğinden yüklenir; panel yalnız kullanıcı isteğiyle açılır.
- **Teşhis raporu:** tam adres, alan adı, saat, izleme konumu veya sayfa metni içermez. Otomatik gönderim yoktur; kullanıcı önce önizler, isterse paylaşır.

## Lisans

[MIT](LICENSE) — Copyright (c) 2026 İhsan B. Arıtürk (NOkrep). Üçüncü taraf bileşenlerin bildirimleri: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). İki dosya da dağıtım paketlerinde bulunur.

Geliştirici: NOkrep ([GitHub](https://github.com/NOkrep/NOk-video-controller)).

## Belgeler

- [docs/dev](docs/dev/) — geliştirme: [ana kılavuz](docs/dev/PROJECT_MASTER_GUIDE.md), [devir](docs/dev/PROJECT_HANDOFF.md), [iş kaydı](docs/dev/ACTIVE_WORK.md), [testler](docs/dev/TESTING.md).
- [docs/design](docs/design/) — tasarım: [araç çubuğu](docs/design/TOOLBAR_REDESIGN.md), arayüz incelemesi, temalar, animasyon.
- [docs/measurements](docs/measurements/) — performans ve bellek ölçümleri.
- [docs/history](docs/history/) — iş geçmişi, eski sürüm notları ve [önceki README](docs/history/README_ARCHIVE.md).
