
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
