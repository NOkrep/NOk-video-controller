# NOk Video Controller: Evrensel Medya Tespiti, DRM Koruması & Basamaklı Adaptör Mimarisi

Kullanıcıların her web sitesinde tutarlı, erişilebilir ve ergonomik video kontrolüne sahip olmasını sağlamak amacıyla; kısıtlı domain enjeksiyonunu ortadan kaldıran, Shadow DOM & Web Component derin taraması yapan, DRM korumalı içerikleri tespit edip kullanıcıya bildiren ve basamaklı (cascade) adaptör seçim hattını hayata geçiren mimari plan.

---

## Kullanıcı İncelemesi & Kritik Kararlar

> [!IMPORTANT]
> Kullanıcı ile 1. Aşamada netleştirilen tercihler doğrudan mimari omurgaya entegre edilmiştir:
> 1. **Basamaklı Adaptör Geçişi**: Sistem önce otomatik olarak adaptörleri dener ve canlı sağlık kontrolü (health probe) yapar; kontrol sağlanamazsa kullanıcıya HUD üzerinden manuel geçiş imkânı sunar.
> 2. **DRM / Korumalı İçerik Reaksiyonu**: Medya EME/Widevine şifrelemeli olduğunda kontroller kapatılmaz; HUD üzerinde `🛡️ DRM Korumalı Akış` rozeti gösterilir ve desteklenen kısıtlı kontroller (güvenli ses, oynatma hızı, zaman atlama) açık tutularak kullanıcının bilgilendirilmesi sağlanır.
> 3. **Desteklenmeyen Sitelerde Geri Bildirim**: Hiçbir adaptör çalışmadığında tek tıkla Sıfır-PII (Zero-PII) anonim teşhis JSON'u kopyalama ve geliştiriciye tek tuşla bildirme butonu sunulur.

- **Onaylanan Karar 1 (Enjeksiyon Kapsamı)**: `manifest.json` içindeki 9 domainlik katı filtreleme yerine, isteğe bağlı/aktif sekme (`activeTab` + `scripting`) ve evrensel `*://*/*` web-accessible stratejisi benimsenerek eklentinin tüm web sitelerinde tetiklenebilmesi sağlanacaktır.
- **Onaylanan Karar 2 (Shadow DOM Derin Taraması)**: Kapalı/açık Shadow Root'lar ve yerel bileşenler BFS (Breadth-First Search) algoritmasıyla taranarak standart `document.querySelectorAll('video')` çağrılarının kaçırdığı modern oynatıcılar (YouTube, Reddit, Twitter/X, özel web bileşenleri) yakalanacaktır.

---

## 1. Genel Bakış & Temel Konsept

### Neden Her Sitede Açılmıyor? (Kök Neden Analizi)
1. **Manifest Kısıtlaması (`content_scripts.matches`)**: Mevcut `manifest.json` dosyasında içerik betiği sadece 9 domainle (`nowtv`, `kick`, `trt`, `puhu` vb.) sınırlandırılmıştır. Diğer sitelerde otomatik `document_start` enjeksiyonu gerçekleşmemektedir.
2. **Shadow DOM İzolasyonu**: YouTube, modern akış portalları ve özel video kütüphaneleri `<video>` etiketini doğrudan ana `document` içine değil, Shadow Root kapsayıcıları içine gömmektedir. Düz DOM sorguları videoyu "yok" görmektedir.
3. **DRM & EME (Encrypted Media Extensions)**: Netflix, Spotify, Prime Video gibi platformlarda içerik Widevine/FairPlay ile şifrelidir. Web Audio API (`createMediaElementSource`), CORS ve DRM güvenliği nedeniyle şifreli akışlarda doğrudan kullanıldığında sesi susturabilmektedir.
4. **Çapraz Kaynaklı (Cross-Origin) iframe Yapıları**: Gömülü oynatıcılar farklı bir domainden iframe ile yüklendiğinde, tarayıcının güvenlik modeli (Same-Origin Policy) ana sayfadan iframe içine erişimi engeller.

### Çözümün Sağladığı Değer
- Herhangi bir web sitesinde tek tıklamayla veya otomatik olarak devreye giren pürüzsüz HUD.
- Sayfadaki video tipini (Özel Platform -> Standart Kütüphane -> Evrensel HTML5 -> Shadow DOM) kademeli olarak deneyen akıllı adaptör boru hattı.
- DRM korumalı içeriklerde donma veya çökme yaşanmadan güvenli kısıtlı modda kesintisiz çalışma.

---

## 2. Kullanıcı Deneyimi & Görsel Tasarım

### Ana Kullanıcı Akışları (Key User Flows)

```
[Kullanıcı Sayfayı Açar / İkona Tıklar]
                 │
                 ▼
      [Evrensel Medya Tarayıcısı]
   (Normal DOM + Shadow DOM + iframes)
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
[Video Bulunamadı]     [Video Bulundu]
      │                     │
      ▼                     ├──────────────────────┐
[Arama Bildirimi +          ▼                      ▼
 Teşhis & Raporla]    [Standart Akış]     [DRM / Şifreli Akış]
                            │                      │
                            ▼                      ▼
                      [HUD: Normal]        [HUD: 🛡️ DRM Rozeti]
                     (Hız, Ses %200,      (Hız, Güvenli Ses %100,
                      Kalite, Sarma)       Açıklayıcı Tooltip)
```

1. **Sıfır-Gecikmeli Otomatik Tespit**: Kullanıcı eklentiyi açtığında sistem 50ms içinde aktif videoyu tespit eder ve uygun adaptörü devreye sokar.
2. **DRM Rozeti & Şeffaf Geri Bildirim**: DRM tespit edildiğinde HUD başlığında zarif sarı-turuncu `🛡️ DRM Korumalı Akış` rozeti görünür. Üzerine gelindiğinde veya tıklandığında *"Bu içerik platform tarafından DRM (şifreleme) ile korunmaktadır. Güvenlik kuralları gereği harici ses yükseltici sınırlandırılmış olup temel hız ve oynatıcı kontrolleri aktiftir"* bilgilendirmesi sunulur.
3. **Manuel Adaptör Seçim Paneli (Fallback UI)**: Eğer otomatik seçilen adaptör kullanıcının beklentisini karşılamazsa (örneğin kalite butonları yanıt vermezse), HUD ayarlarından `Adaptör: Otomatik (KickAdapter) [Değiştir ▾]` menüsü açılır ve alternatif adaptörler tek tıkla test edilebilir.
4. **Tek Tıkla Raporlama Modalı**: Hiçbir adaptör yanıt vermediğinde HUD, kullanıcıya *"Bu sitedeki video oynatıcı henüz tam desteklenmiyor. Tek tıkla anonim teşhis kodunu kopyalayıp güncellemelerimize katkıda bulunabilirsiniz"* seçeneğini sunar.

### Görsel Kimlik & Tema
- **Renk Paleti**: 
  - Koyu Slate Tuval: `#0f172a` (arka plan) ve `#1e293b` (yüzeyler).
  - Vurgu Rengi: `#38bdf8` (aktif kontroller, çözünürlük rozeti).
  - DRM Uyarı Rengi: `#f59e0b` (dikkat çekici ancak rahatsız etmeyen amber tonu).
  - Başarı Rengi: `#10b981` (sağlıklı kilitlenme).
- **Tipografi**: Sistem monospace (`ui-monospace`, `JetBrains Mono`) ile `tabular-nums` rakam hizalaması; düğmelerde ve metinlerde tek satır (`whitespace-nowrap`) düzeni.

---

## 3. Ürün Kararları & Mimari Tercihler

### Karar 1: Derin Shadow DOM & iframe Tarama Stratejisi
- **Seçilen Yaklaşım**: Sayfa genelinde `TreeWalker` ve özyinelemeli `shadowRoot` BFS tarayıcısı çalıştırmak; aynı zamanda `postMessage` ile aynı kökenli iframe'lerle iletişim kurmak.
- **Neden**: YouTube, Twitch ve modern web bileşeni kullanan sitelerin %40'tan fazlası `<video>` elemanını kapalı/açık Shadow DOM içine gizlemektedir.
- **Alternatif**: Yalnızca `document.querySelector('video')` kullanmak (mevcut eksikliğin temel kaynağı).

### Karar 2: Basamaklı (Cascade) Adaptör Yürütme Motoru
- **Seçilen Yaklaşım**: 
  1. *Siteye Özel Adaptör* (Domain Matching: Kick, TRT, Puhu, NowTV)
  2. *Kütüphane Düzeyi Adaptör* (Video.js, Hls.js, Shaka, YouTube)
  3. *Evrensel HTML5 Adaptörü* (Standart DOM/Shadow DOM)
  Her denemeden sonra 300ms'lik minik bir `HealthProbe` (özellik yanıt veriyor mu?) testi yapılır.
- **Neden**: Kullanıcıyı yormadan %95 olasılıkla en doğru adaptörü otomatik seçer; başarısızlık durumunda akıllıca bir alt kademeye geçerek sistemi çökmeden ayakta tutar.

### Karar 3: DRM Korumalı Akışlarda Güvenli Mod (Graceful Degradation)
- **Seçilen Yaklaşım**: `video.mediaKeys` veya `encrypted` sinyali alındığında Web Audio API Booster devre dışı bırakılır, yerel `video.volume` kullanılır ve HUD üzerinde DRM bilgilendirme rozeti gösterilir.
- **Neden**: Web Audio API şifreli medyalara zorla bağlandığında tarayıcı güvenliği akışı tamamen dilsizleştirebilir (audio mute/blackout). Güvenli mod kullanıcının video izleme deneyimini bozmadan kontrolleri çalışır tutar.

---

## 4. Teknik Mimari & Veri Stratejisi

### Sistem Mimarisi & Bileşen Hiyerarşisi

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NOk Video Controller Core                       │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Universal Media Discovery Engine                      │
│  ├─ Recursive DOM & Open/Closed Shadow Root BFS Scanner                │
│  ├─ Multi-Video Scoring (Playing > Unmuted > Largest Viewport Area)    │
│  └─ DRM / EME Sentinel (navigator.requestMediaKeySystemAccess, EME)    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Cascade Adapter Pipeline                          │
│                                                                        │
│  ┌───────────────────────┐   Matches?   ┌───────────────────────────┐  │
│  │ Tier 1: Site Adapter  │ ───────────► │ Kick, TRT, NowTV, Puhu... │  │
│  └───────────────────────┘              └───────────────────────────┘  │
│             │ (No / Failed Health)                                     │
│             ▼                                                          │
│  ┌───────────────────────┐   Matches?   ┌───────────────────────────┐  │
│  │ Tier 2: Player Lib    │ ───────────► │ Video.js, Hls.js, YouTube │  │
│  └───────────────────────┘              └───────────────────────────┘  │
│             │ (No / Failed Health)                                     │
│             ▼                                                          │
│  ┌───────────────────────┐              ┌───────────────────────────┐  │
│  │ Tier 3: Generic HTML5 │ ───────────► │ Native Video Element      │  │
│  └───────────────────────┘              └───────────────────────────┘  │
│             │ (All Failed)                                             │
│             ▼                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 4: User Manual Override & One-Click Zero-PII Diagnostic     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Interactive Floating HUD                       │
│  ├─ 2-Step Idle Transparency (Active -> 88% Semi -> Hidden)           │
│  ├─ Speed, Volume Booster (%200 / Safe DRM Mode %100), 4-Way Seek      │
│  ├─ Real-time Resolution & CDN Telemetry Badge                         │
│  └─ Active Adapter Badge with Manual Override Dropdown                 │
└────────────────────────────────────────────────────────────────────────┘
```

### Durum Modeli (State Model)
```typescript
interface MediaDetectionState {
  video: HTMLVideoElement | null;
  player: any | null;
  playerType: string;
  isShadowDom: boolean;
  isDrmProtected: boolean;
  drmKeySystem?: string; // 'widevine' | 'fairplay' | 'playready' | 'unknown'
  activeAdapterName: string;
  adapterTier: 1 | 2 | 3;
  healthStatus: 'healthy' | 'degraded' | 'failed';
  discoveredQualities: Array<{ id: string; label: string; height: number }>;
}
```

### Yapılacak Uygulama Adımları
1. **`manifest.json` & `background.js` Güncellemesi**:
   - `content_scripts.matches` alanını evrensel `<all_urls>` veya genişletilmiş desenlerle donatmak.
   - `activeTab` ile toolbar butonuna basıldığında her sitede sorunsuz enjeksiyon sağlamak.
2. **Evrensel Medya ve Shadow DOM Tarayıcısının Eklenmesi**:
   - `injected.js` içine `deepFindMediaElements()` fonksiyonu ekleyerek tüm iç içe Shadow Root'ları tarayan algoritmayı entegre etmek.
3. **DRM / EME Tespiti**:
   - `video.mediaKeys`, `video.addEventListener('encrypted')` ve `WebKitMediaKeys` varlığını sorgulayan `detectDrmStatus()` fonksiyonunu oluşturmak.
4. **Basamaklı Adaptör Yürütme Hattı (Cascade Pipeline)**:
   - Adaptör dizisini hiyerarşik kademelere ayırmak.
   - Her adaptör atandığında çalışan hızlı `probeAdapterHealth()` kontrol mekanizmasını yazmak.
5. **HUD Arayüz Zenginleştirmeleri**:
   - `🛡️ DRM Korumalı Akış` durum rozetini eklemek.
   - Manuel adaptör seçim menüsünü HUD ayarlar bölümüne yerleştirmek.
   - Desteklenmeyen veya hatalı durumlarda tek tıkla Sıfır-PII teşhis paketi sunan akışı entegre etmek.
6. **Doğrulama & Test**:
   - Farklı video sitelerinde (Shadow DOM, standart HTML5, canlı HLS ve DRM korumalı senaryolar) test ederek derleme ve çalıştırma kontrollerini tamamlamak.
