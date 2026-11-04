
<!-- filmdeck-agent-handoff-2026-11-04 -->
## FilmDeck ortak ajan devri

- Önce [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md), ardından [PROJECT_MASTER_GUIDE.md](PROJECT_MASTER_GUIDE.md) ve [ACTIVE_WORK.md](ACTIVE_WORK.md) başındaki en yeni kayıtları oku.
- Yerelde varsa [LOCAL_AGENT_PROCEDURE.md](LOCAL_AGENT_PROCEDURE.md) ortak NOk/Codex/Claude kararlarını oku. Bu Git dışı dosya başka checkout'ta olmayabilir; yoksa mevcut proje/ortam kuralları ve aşağıdaki merkez yönlendirmesi geçerlidir.
- Branch/HEAD/dirty kapsamı, sürüm ve son kanıtı kendin doğrula. Codex sohbetine, özel belleğine, araçlarına veya kotasına eriştiğini varsayma. Öneri ile kullanıcı tarafından etkinleştirilmiş hedefi ayır.
- Kısa başlangıç özeti ver: mevcut sürüm/dal, tamamlanan son iş, açık hedef, korunacak sınırlar ve ilk güvenli adım. Aynı dosyayı iki ajan eşzamanlı düzenlemeden sahipliği belirle.
- Her sürüm artışında kullanıcıya sürüm/değişiklik/kanıt/açık işler bildir. Bitişte devir ve iş kaydını güncelle; geçmiş kanıtları silme. İlgili testleri çalıştırmadan başarı iddiası yapma.
- **Yetki (kullanıcı, 4 Kasım 2026):** ajan kapsamı belli işi kendi dalına commit'ler ve o dalı push eder; bunlar için ayrıca onay istemez. **PR'ı ve merge'ü kullanıcı yapar;** ajan iş bitince özeti ve PR bağlantısını bildirir. `gh` kurulmaz. Tag, ZIP/release ve mağaza/canlı yayın ayrıca istenmedikçe yapılmaz; verilmiş aynı kapsamlı yetkiyi gereksiz tekrar onaylatma.
- **Sırlar:** SSH anahtarı ve diğer üretim sırları GitHub'a hiç girmez. Ajan gerekmedikçe bunlara erişmez. Gerekirse ve iş kullanıcının kendi yürütebileceğini aşıyorsa nedenini açıklayıp o işlem için izin ister; karar kullanıcınındır.
- **Dal düzeni:** her ajanın `main`'den açılmış **tek bir uzun ömürlü dalı** vardır: Codex `codex/…`, Claude `claude/…`. İş veya düzeltme başına yeni dal açılmaz; güncellik için `main` bu dala merge edilir. Kullanıcı ajan değiştirirken dal ve temiz durum doğrulanır; ilerleme PR/merge ile paylaşılır. Karşı ajanın dalına doğrudan commit atılmaz. Merge kullanıcı kararıdır.
- **Ortak araç sistemi:** Sistem birlikte düzenlenir, ama her ajan yalnız kendi istemcisine ait alana dokunur. Diğerinin alanında eksik görürse düzeltmez; `D:/NOk-Tools/AGENT_NOTES.md` dosyasına not bırakır ve kullanıcıya bildirir. Her ajan işe başlarken kendine açık notları okur. Ayrıntı yerel prosedür §3–4.
- **Sürüm düzeni:** `1.0.0` ilk stabil çıkış; `0.x.0` milestone; `0.0.x` küçük geliştirme; `0.0.0.x` çok küçük değişiklik. Üçüncü ve dördüncü bölüm **en fazla 9**. `0.7.7.9` sonrası küçük adım `0.7.8`, `0.7.9` sonrası küçük adım `0.8.0`'dır; `0.7.7.10` veya `0.7.10` olmaz. Ayrıntı: PROJECT_HANDOFF.md §5.

<!-- nok-release-routing-2026-11-02 -->
## NOk site ve eklenti yayin merkezi

Bu kural yalniz NOk web sitesi / tarayici eklentisi projeleri icindir. Ortak yayin merkezi:
`C:/Users/ihsan/Desktop/Projelerimiz_NOkrep/NOk_Sites&Extensions`.

- Yayin hazirlama, paketleme, dagitim veya yeni NOk site/eklenti projesi kurma gorevinde once merkezin `NOk-Release-Core/AGENTS.md`, `README.md` ve `registry.json` dosyalarini oku. Kurulum suruyorsa kullanima hazir varsayma.
- Yeni projeyi merkezde kendi ayri private yayin deposu ve gozden gecirilmis profiliyle kaydet; mevcut kaydi varsa tekrar olusturma. Merkezdeki yeni-proje sablonunu ve `register` komutunu kullan. Projeye kisa AGENTS.md/CLAUDE.md baglantisi ekle. Kaynak uygulamayi tasima veya baska projenin adaptorunu korlemesine kopyalama.
- Uygulama ve yayin depolari ayri kalir. Ortak motorun tek kaynagi NOk-Release-Core; proje profili, veri koruma, yedek, saglik ve geri donus kurallari hedefe ozeldir. Mevcut D:/NOk-Tools kurulumunu dogrulamasiz degistirme.
- Yayin kodu kurmak canli yayin izni degildir. Canli gecis veya gercek magaza basvurusu kullanicinin o surum/hedef icin acik onayini gerektirir. Operator tarafindan baslatilan akis komut/sonuc kopyalama gerektirmeden teknik adimlari yurutmelidir; baglanti kopunca mevcut islemin durumunu oku, korlemesine tekrar baslatma.
- C:/Users/ihsan/Desktop/Projelerimiz_NOkrep/SSH_Keys ve altina listeleme, metadata, okuma, arama veya SSH/SCP anahtari kullanimi dahil her erisimden once tam islem/amaci acikla, yeni acik izin al ve bekle. Bu agaci genis taramalardan disla. Kullanici terminalinden operator akisinin baslatilmasi ajanin anahtara erisim yetkisi degildir.
- Gercek .env, parola/token, sunucu adresi, kullanici verisi, yedek ve ozel anahtar Git'e veya workflow loguna girmez. Eski sunucu adreslerini kurtarma/yeniden kullanma. Kaynak depo gorunurlugunu kendiliginden degistirme.
- Ilgili proje kurallarini ve kisisel kayitlari koru; dosya kapsamini once sun, verilmis kapsami tekrar onaylatma. Mevcut commitlenmemis uygulama degisikliklerini otomasyon kurulumu sirasinda topluca commit/push etme.
