const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// The toolbar's placement and stepping rules are pure; the browser test covers the DOM and real input.
const source = fs.readFileSync(path.join(__dirname, '..', 'injected.js'), 'utf8');
const start = source.indexOf('// BEGIN TOOLBAR GEOMETRY'), end = source.indexOf('// END TOOLBAR GEOMETRY');
assert.ok(start > 0 && end > start, 'geometry section is marked');
const context = {};
vm.runInNewContext(`${source.slice(start, end)}
  Object.assign(globalThis, { TOOLBAR_SEEK_STEPS, TOOLBAR_SUBTITLE_STEPS, toolbarOpensBelow, toolbarFitsViewport, toolbarPopoverLeft, toolbarStepAfter, toolbarGroupAfter });`, context);

test('popovers open below in the upper half of the screen and above in the lower half', () => {
  assert.equal(context.toolbarOpensBelow({ top: 16, height: 44 }, 900), true);
  assert.equal(context.toolbarOpensBelow({ top: 420, height: 44 }, 900), true, 'centre 442 is still above the middle');
  assert.equal(context.toolbarOpensBelow({ top: 440, height: 44 }, 900), false, 'centre 462 is below the middle');
  assert.equal(context.toolbarOpensBelow({ top: 840, height: 44 }, 900), false);
});

test('a window narrower than the toolbar falls back to the classic panel, with a wider way back', () => {
  const margin = 12;
  assert.equal(context.toolbarFitsViewport(760, 1280, true, margin), true);
  assert.equal(context.toolbarFitsViewport(760, 780, true, margin), false, 'no room once margins are counted');
  assert.equal(context.toolbarFitsViewport(760, 784, true, margin), true, 'exactly fits while shown');
  assert.equal(context.toolbarFitsViewport(760, 784, false, margin), false, 'returning needs the extra room');
  assert.equal(context.toolbarFitsViewport(760, 832, false, margin), true);
  assert.equal(context.toolbarFitsViewport(0, 300, false, margin), true, 'an unmeasured toolbar is not ruled out');
});

test('a popover stays inside the window and is placed relative to the toolbar', () => {
  assert.equal(context.toolbarPopoverLeft(500, 280, 400, 1280, 12), 100);
  assert.equal(context.toolbarPopoverLeft(1100, 280, 400, 1280, 12), 588, 'pulled in from the right edge');
  assert.equal(context.toolbarPopoverLeft(-50, 280, 0, 1280, 12), 12, 'pulled in from the left edge');
});

test('the seek step and the group stepper stop or wrap as designed', () => {
  assert.deepEqual([...context.TOOLBAR_SEEK_STEPS], [5, 10, 30, 60]);
  assert.equal(context.toolbarStepAfter(context.TOOLBAR_SEEK_STEPS, 10, 1), 30);
  assert.equal(context.toolbarStepAfter(context.TOOLBAR_SEEK_STEPS, 60, 1), 60, 'stops at the largest step');
  assert.equal(context.toolbarStepAfter(context.TOOLBAR_SEEK_STEPS, 5, -1), 5, 'stops at the smallest step');
  assert.equal(context.toolbarStepAfter(context.TOOLBAR_SEEK_STEPS, 7, 1, 10), 30, 'an unknown step restarts from the given default');
  assert.deepEqual([...context.TOOLBAR_SUBTITLE_STEPS], [50, 100, 250, 500, 1000]);
  assert.equal(context.toolbarStepAfter(context.TOOLBAR_SUBTITLE_STEPS, 100, 1, 100), 250);
  assert.equal(context.toolbarStepAfter(context.TOOLBAR_SUBTITLE_STEPS, 1000, 1, 100), 1000, 'stops at one second');
  assert.equal(context.toolbarStepAfter(context.TOOLBAR_SUBTITLE_STEPS, 3, -1, 100), 50, 'an unknown subtitle step restarts from 100');
  const groups = ['player', 'subtitles', 'settings', 'accessibility'];
  assert.equal(context.toolbarGroupAfter(groups, 'player', 1), 'subtitles');
  assert.equal(context.toolbarGroupAfter(groups, 'accessibility', 1), 'player', 'click wraps to the first group');
  assert.equal(context.toolbarGroupAfter(groups, 'player', -1), 'accessibility', 'the wheel can go back past the first group');
});

test('every new toolbar label has an English translation', () => {
  const markupStart = source.indexOf('function toolbarMarkup()'), markupEnd = source.indexOf('function toolbarPopoverAnchor');
  const markup = source.slice(markupStart, markupEnd);
  assert.equal(markup.includes('Klasik panelde aç'), false, 'every group has its own controls now');
  for (const label of ['Ok adımı', 'Bu tercihler sayfa yenilenince sıfırlanır · klavye kısayolları: soldaki tuş simgesi', 'Hemen atla', 'Ses ve kanallar',
    'Oynatıcının bildirdiği seçenekler', 'Oynatıcı tespiti', 'Adaptör', 'Değiştir', 'Çözünürlük bekleniyor', 'Yenile',
    'Dosya yükle', 'Görünür', 'Görünüm', '− ve + adımı', 'Şu anki kayma', 'Altyazı zamanlaması', 'Altyazıyı erken göster', 'Altyazıyı geç göster',
    'Görüntü ve gece', 'Görüntü ve gece modu', 'Tümünü sıfırla', 'Filtreler', 'Gece modu', 'Ters renk', 'Tema', 'Tüm temalar', 'Yardım',
    'Medya sunucusunun yanıt süresi', 'Kısayollar ve izinler', 'Tuşlar ve site erişimi rehberi', 'Gizliliği koruyan teşhis raporu', 'Kaynak kodu',
    'Dil seçimi yalnızca bu sayfa açıkken tutulur.', 'Önceki', 'Sonraki', 'Sorun bildir', 'FilmDeck Hakkında']) {
    assert.ok(markup.includes(label), `${label} is used`);
    assert.ok(source.includes(`'${label}': '`), `${label} is translated`);
  }
  for (const key of ['FilmDeck araç çubuğu', 'Kompakt araç çubuğu (önizleme)', 'Grup: {0} · tıkla: sonraki · çift tıkla: liste · tekerlek: değiştir',
    'Geri sar: {0} sn', 'İleri sar: {0} sn', 'Oynatılıyor {0}', 'Klavye kısayolları açık', 'Klavye kısayolları kapalı',
    'Gizli', 'Kayma {0}', 'Altyazıyı {0} ms erken göster', 'Altyazıyı {0} ms geç göster', 'Zamanlama adımı (fare tekerleği)',
    'Altyazı dosyası yükle · .srt ve .vtt · yalnız bu sayfada tutulur', 'Altyazıyı göster veya gizle',
    'Görüntü filtreleri ve gece modu', 'Tema (fare tekerleği: önceki/sonraki)', 'Sürüm {0} · MIT', 'Parlaklık', 'Kontrast', 'Doygunluk',
    'Açık tut', 'Kolay okunur düzen', 'Yüksek kontrast', 'Hareketi azalt', 'Araç çubuğu izlerken solmadan ekranda kalır',
    'Klasik paneli gösterir; araç çubuğuna oradaki Erişilebilirlik bölümünden dönülür', 'Tema renklerini geçici olarak yüksek kontrastlı renklerle değiştirir', 'Panel animasyonlarını kapatır']) {
    assert.ok(source.includes(`'${key}': '`), `${key} is translated`);
  }
});
