const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// D-06: the video's own tracks. Real Hls.js, Video.js and <track> paths run in media-tracks-browser.cjs;
// here the selection rules run against small fakes, including Shaka, which has no local runtime.
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'injected.js'), 'utf8').replace(/\r\n/g, '\n');
require(path.join(root, 'frame-protocol.js'));
const protocol = globalThis.NOkFrameProtocol;
const { state } = require('./frame-fixtures.cjs');
function section(from, to) {
  const a = source.indexOf(from), b = source.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `missing section ${from}`); return source.slice(a, b);
}
function harness(libraries = {}) {
  const context = vm.createContext({ uiLanguage: 'en', Intl, uiText: text => text.replace(/^Parça (\d+)$/, 'Track $1'),
    findLibraryPlayer: (_video, kind) => libraries[kind] || null, findVideoJsPlayer: () => libraries.vjs || null });
  vm.runInContext(section('  // MEDIA TRACKS (D-06)', '  // END MEDIA TRACKS'), context);
  return { context, run: (text, values = {}) => { Object.assign(context, values); return vm.runInContext(text, context); } };
}
const plain = value => JSON.parse(JSON.stringify(value));

test('Hls.js tracks come first, with names, languages or a numbered fallback', () => {
  const hls = { audioTracks: [{ name: 'Türkçe', lang: 'tr' }, { name: '', lang: 'en' }, { name: '', lang: '' }], audioTrack: 1,
    subtitleTracks: [{ name: 'English', lang: 'en' }], subtitleTrack: -1, subtitleDisplay: true };
  const h = harness({ hls, vjs: { audioTracks: () => [{}, {}] } });
  const tracks = plain(h.run('readMediaTracks(video, null)', { video: { textTracks: [] } }));
  assert.equal(tracks.source, 'hls');
  assert.deepEqual(tracks.audio, [{ key: 'hls:a:0', label: 'Türkçe', active: false }, { key: 'hls:a:1', label: 'English', active: true }, { key: 'hls:a:2', label: 'Track 3', active: false }]);
  assert.deepEqual(tracks.text, [{ key: 'hls:t:0', label: 'English', active: false }]);
  assert.equal(h.run('selectMediaTrack(video, null, "hls:a:2")'), true); assert.equal(hls.audioTrack, 2);
  hls.subtitleDisplay = false;
  assert.equal(h.run('selectMediaTrack(video, null, "hls:t:0")'), true); assert.equal(hls.subtitleTrack, 0); assert.equal(hls.subtitleDisplay, true);
  assert.equal(h.run('selectMediaTrack(video, null, "hls:t:-1")'), true); assert.equal(hls.subtitleTrack, -1);
});

test('a stale, foreign or malformed key changes nothing', () => {
  const hls = { audioTracks: [{ name: 'A' }, { name: 'B' }], audioTrack: 0, subtitleTracks: [], subtitleTrack: -1 };
  const h = harness({ hls });
  for (const key of ['hls:a:5', 'native:a:1', 'hls:a:-1', 'hls:x:1', 'hls:a:1;alert(1)', '', null]) {
    assert.equal(h.run('selectMediaTrack(video, null, key)', { video: { textTracks: [] }, key }), false, String(key));
  }
  assert.equal(hls.audioTrack, 0);
});

test('a single audio track offers no choice; the browser lists skip FilmDeck\'s own file track', () => {
  const own = { kind: 'subtitles', label: 'NOk Harici Altyazı', mode: 'hidden' };
  const video = { audioTracks: [{ label: 'Main', enabled: true }],
    textTracks: [{ kind: 'subtitles', label: 'Türkçe', language: 'tr', mode: 'disabled' }, { kind: 'metadata', label: 'cues', mode: 'hidden' },
      own, { kind: 'captions', label: '', language: 'en', mode: 'showing' }], __nokSubtitleTrack: own };
  const h = harness();
  const tracks = plain(h.run('readMediaTracks(video, null)', { video }));
  assert.equal(tracks.source, 'native'); assert.deepEqual(tracks.audio, []);
  assert.deepEqual(tracks.text, [{ key: 'native:t:0', label: 'Türkçe', active: false }, { key: 'native:t:1', label: 'English', active: true }]);
  assert.equal(h.run('selectMediaTrack(video, null, "native:t:0")'), true);
  assert.deepEqual(video.textTracks.map(track => track.mode), ['showing', 'hidden', 'hidden', 'disabled'], 'metadata and the own track keep their modes');
  assert.equal(h.run('selectMediaTrack(video, null, "native:t:-1")'), true);
  assert.equal(video.textTracks[0].mode, 'disabled'); assert.equal(own.mode, 'hidden');
});

test('Shaka audio follows language and role; text tracks follow visibility', () => {
  const calls = [];
  const shaka = { getVariantTracks: () => [{ active: true, language: 'tr', audioRoles: ['main'] }],
    getAudioLanguagesAndRoles: () => [{ language: 'tr', role: 'main' }, { language: 'en', role: 'commentary' }],
    getTextTracks: () => [{ language: 'en', label: 'English SDH', active: true }], isTextTrackVisible: () => false,
    selectAudioLanguage: (...args) => calls.push(['audio', ...args]), selectTextTrack: track => calls.push(['text', track.label]),
    setTextTrackVisibility: on => calls.push(['visible', on]) };
  const h = harness({ shaka });
  const tracks = plain(h.run('readMediaTracks(video, null)', { video: { textTracks: [] } }));
  assert.equal(tracks.source, 'shaka');
  assert.deepEqual(tracks.audio.map(item => [item.label, item.active]), [['Turkish (main)', true], ['English (commentary)', false]]);
  assert.deepEqual(tracks.text, [{ key: 'shaka:t:0', label: 'English SDH', active: false }], 'a hidden text track is not shown as chosen');
  h.run('selectMediaTrack(video, null, "shaka:a:1")'); h.run('selectMediaTrack(video, null, "shaka:t:0")'); h.run('selectMediaTrack(video, null, "shaka:t:-1")');
  assert.deepEqual(calls, [['audio', 'en', 'commentary'], ['text', 'English SDH'], ['visible', true], ['visible', false]]);
});

test('the frame bridge carries the lists and one strict command; reports never see them', () => {
  const tracks = { source: 'hls', audio: [{ key: 'hls:a:0', label: 'Türkçe', active: true }, { key: 'hls:a:1', label: 'English', active: false }], text: [] };
  assert.deepEqual(protocol.cleanState(state({ mediaTracks: tracks })).mediaTracks, tracks);
  for (const bad of [{ ...tracks, source: 'flash' }, { ...tracks, audio: [{ key: 'hls:a:0;x', label: 'x', active: true }] },
    { ...tracks, audio: [{ key: 'hls:a:0', label: 'x'.repeat(91), active: true }] }, { ...tracks, text: [{ key: 'hls:t:0', label: 'x', active: 'yes' }] }]) {
    assert.equal(protocol.cleanState(state({ mediaTracks: bad })), null);
  }
  const command = value => protocol.cleanCommand({ name: 'media-track', owner: 'b'.repeat(32), revision: 1, value });
  assert.equal(command('vjs:t:-1').value, 'vjs:t:-1'); assert.equal(command('hls:a:1000'), null); assert.equal(command({ key: 'hls:a:0' }), null);
  assert.doesNotMatch(section('  function buildDiagnosticPayload', '  function reportAnonymousError'), /mediaTracks|readMediaTracks/);
});

test('both layouts offer the choices and every new text is translated', () => {
  for (const id of ['pvc-tb-sub-tracks', 'pvc-tb-pop-subtracks', 'pvc-tb-subtracks-list', 'pvc-tb-audiotracks-card', 'pvc-tb-audiotracks-list', 'pvc-sub-tracks-select', 'pvc-audio-tracks-select']) {
    assert.match(source, new RegExp(`id="${id}"`), id);
  }
  for (const key of ['Ses parçası', 'Videonun kendi altyazısı', 'Videonun altyazısı', 'Kapalı', 'Parça {0}', 'Oynatıcının sunduğu parçalar; yüklediğiniz dosyadan ayrıdır.',
    'Ses parçası: {0}', 'Videonun altyazısı: {0}', 'Bu parça seçilemedi.']) assert.ok(source.includes(`'${key}':`), `${key} is translated`);
});
