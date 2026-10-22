const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require('node:path').join(__dirname, '..', 'injected.js'), 'utf8');
function section(from, to) { return source.slice(source.indexOf(from), source.indexOf(to, source.indexOf(from))); }
function harness(extra = {}) {
  const logs = [], calls = [];
  const video = { isConnected: true, ended: false, playbackRate: 2, defaultPlaybackRate: 2, muted: false, volume: .35, currentSrc: 'content', srcObject: null };
  const context = vm.createContext({ video, logs, calls, trtRateGuards: new WeakMap(),
    findVideoAndPlayer: () => ({ video, player: null }), KickAdapter: { findIvsPlayer: () => null },
    findLibraryPlayer: () => null, findVideoJsPlayer: () => null, getNativeQualityMenuOptions: () => [], ...extra });
  vm.runInContext(section('  function ivsQualityKey', '  function hookIvsInstance'), context);
  vm.runInContext(section('  function applyVideoJsEnabledSelection','  const VideoJsAdapter'),context);
  vm.runInContext(section('  function createAdLifecycle', '  const adLifecycle ='), context);
  vm.runInContext(`const controller = createAdLifecycle({capture: captureAdControls, log: e => logs.push(e), resetRequestedRate: () => calls.push('reset')});`, context);
  return { video, context, logs, calls, run: code => vm.runInContext(code, context) };
}
test('ad lifecycle requests 16x and mute, then restores 1x and the original volume/mute once', () => {
  const h = harness();
  h.run('controller.tick({video, player:null}, false)'); assert.equal(h.video.playbackRate, 2);
  h.run('controller.tick({video, player:null}, true)'); assert.equal(h.video.playbackRate, 16); assert.equal(h.video.muted, true);
  h.video.volume = 0; h.run('controller.tick({video, player:null}, true)');
  h.run('controller.tick({video, player:null}, false)');
  assert.equal(h.video.playbackRate, 1); assert.equal(h.video.defaultPlaybackRate, 1);
  assert.equal(h.video.volume, .35); assert.equal(h.video.muted, false);
  h.run('controller.stop()'); assert.deepEqual(h.logs, ['AD_CONTROL_STARTED', 'AD_CONTROL_ENDED']);
});
test('prior mute survives completion and a rejected 16x setter does not prevent muting', () => {
  const h = harness(); h.video.muted = true;
  h.run('controller.tick({video, player:null}, true); controller.stop()'); assert.equal(h.video.muted, true);
  h.video.muted = false;
  Object.defineProperty(h.video, 'playbackRate', { configurable: true, get: () => 1, set() { throw new Error('unsupported'); } });
  h.run('controller.tick({video, player:null}, true)'); assert.equal(h.video.muted, true);
  h.run('controller.stop()'); assert.equal(h.video.muted, false);
});
test('replacement/detachment never applies captured SDK state to another video', () => {
  const h = harness();
  h.run(`const c = createAdLifecycle({ capture: () => ({setRate: n => calls.push(n), restoreQuality: () => calls.push('quality')}), resetRequestedRate(){}, log(){} });
    c.tick({video,player:null},true); c.tick({video:{isConnected:true,ended:false,playbackRate:2,muted:false},player:null},false)`);
  assert.deepEqual(h.calls, [16]); assert.equal(h.video.playbackRate, 1); assert.equal(h.video.muted, false);
});
test('HLS lowest declared level and previous automatic/manual mode restore only on the same source and inventory', () => {
  const levels = [{height:1080}, {height:480}, {height:720}];
  const hls = {levels, manualLevel:-1, currentLevel:0};
  const h = harness({ findLibraryPlayer: () => hls });
  h.run('controller.tick({video,player:null},true)'); assert.equal(hls.currentLevel, 1);
  h.run('controller.stop()'); assert.equal(hls.currentLevel, -1);
  hls.manualLevel = 2; h.run('controller.tick({video,player:null},true); controller.stop()'); assert.equal(hls.currentLevel, 2);
  h.run('controller.tick({video,player:null},true)'); h.video.currentSrc = 'another-content';
  h.run('controller.stop()'); assert.equal(hls.currentLevel, 1);
  h.video.currentSrc = 'content'; h.run('controller.tick({video,player:null},true)');
  hls.levels = levels.map(level => ({...level})); h.run('controller.stop()'); assert.equal(hls.currentLevel, 1);
});
test('IVS restores ABR or exact prior quality; a shared or unknown instance never receives commands', () => {
  const levels = [{name:'high',height:1080,bitrate:5000000}, {name:'low',height:360,bitrate:500000}, {name:'mid',height:720,bitrate:2000000}], calls = [];
  const ivs = {getQualities: () => levels, getQuality: () => levels[2], isAutoQualityMode: () => true,
    setQuality: q => calls.push(q.height), setAutoQualityMode: flag => calls.push(flag), setPlaybackRate: rate => calls.push(rate), setMuted: flag => calls.push(flag)};
  const h = harness({KickAdapter:{findIvsPlayer:()=>ivs}, isIvsBoundToVideo: () => true});
  h.run('controller.tick({video,player:null},true); controller.stop()');
  assert.deepEqual(calls, [360,16,true,1,false,true]);
  calls.length = 0; ivs.isAutoQualityMode = () => false;
  h.run('controller.tick({video,player:null},true); controller.stop()'); assert.equal(calls.at(-1),720);
  calls.length = 0; h.context.isIvsBoundToVideo = () => false;
  h.run('controller.tick({video,player:null},true); controller.stop()'); assert.deepEqual(calls, []);
});
test('an ad marker must be visible, unambiguous and inside the selected single-video player', () => {
  const h = harness({HOSTNAME:'kick.com', getComputedStyle: node => node.style});
  const marker = {isConnected:true,style:{display:'block',visibility:'visible',opacity:'1'},getBoundingClientRect:()=>({width:20,height:20})};
  const root = {...marker, querySelectorAll: selector => selector === 'video' ? [h.video] : [marker], contains: () => true, matches: () => false};
  h.video.closest = () => root;
  assert.equal(h.run('hasSelectedAdMarker(video)'), true);
  marker.style.display = 'none'; assert.equal(h.run('hasSelectedAdMarker(video)'), false);
  marker.style.display = 'block'; root.querySelectorAll = selector => selector === 'video' ? [h.video, {}] : [marker];
  assert.equal(h.run('hasSelectedAdMarker(video)'), false);
  h.video.closest = () => null; assert.equal(h.run('hasSelectedAdMarker(video)'), false);
});
test('ended media restores native values without starting another ad lifecycle', () => {
  const h = harness(); h.run('controller.tick({video,player:null},true)'); h.video.ended = true;
  h.run('controller.tick({video,player:null},true)'); assert.equal(h.video.playbackRate,1); assert.equal(h.video.muted,false);
  assert.equal(h.run('controller.isActive(video)'),false);
});

test('the current Kick injected player root still requires one owned video and a visible supported ad badge',()=>{
  const h=harness({HOSTNAME:'kick.com',getComputedStyle:node=>node.style});
  const marker={isConnected:true,style:{display:'block',visibility:'visible',opacity:'1'},getBoundingClientRect:()=>({width:20,height:20})};
  const root={...marker,querySelectorAll:selector=>selector==='video'?[h.video]:[marker],contains:node=>node===h.video,matches:()=>false};
  h.video.closest=selector=>selector.split(',').map(s=>s.trim()).includes('#injected-channel-player')?root:null;
  assert.equal(h.run('hasSelectedAdMarker(video)'),true);
  marker.style.visibility='hidden';assert.equal(h.run('hasSelectedAdMarker(video)'),false);
  marker.style.visibility='visible';root.querySelectorAll=selector=>selector==='video'?[h.video,{}]:[marker];
  assert.equal(h.run('hasSelectedAdMarker(video)'),false);
  root.querySelectorAll=selector=>selector==='video'?[h.video]:[marker];h.context.HOSTNAME='other.invalid';
  assert.equal(h.run('hasSelectedAdMarker(video)'),false);
});
test('Video.js enabled flags restore exactly; VHS wrapper objects may be recreated with stable IDs', () => {
  const levels = [{height:1080,enabled:true}, {height:480,enabled:true}, {height:720,enabled:false}];
  const vjs = {qualityLevels:()=>levels};
  const h = harness({findVideoJsPlayer:()=>vjs});
  h.run('controller.tick({video,player:null},true)'); assert.deepEqual(levels.map(item=>item.enabled),[false,true,false]);
  h.run('controller.stop()'); assert.deepEqual(levels.map(item=>item.enabled),[true,true,false]);
  const flags = [true,true,false];
  vjs.qualityLevels = () => [];
  vjs.tech_ = {vhs:{representations:()=>levels.map((level,index)=>({id:String(index),height:level.height,
    enabled(value){if (value !== undefined) flags[index]=value; return flags[index];}}))}};
  h.run('controller.tick({video,player:null},true)'); assert.deepEqual(flags,[false,true,false]);
  h.run('controller.stop()'); assert.deepEqual(flags,[true,true,false]);
});
test('SDK setter failure cannot prevent native muting or rate changes; ad controls create no audio graph', () => {
  const h=harness();
  h.run(`const fail = () => { throw new Error('SDK failed'); };
    const c = createAdLifecycle({capture:()=>({setRate:fail,setMuted:fail}),resetRequestedRate(){},log(){}});
    c.tick({video,player:null},true)`);
  assert.equal(h.video.playbackRate,16); assert.equal(h.video.muted,true);
  assert.equal(section('  // AD LIFECYCLE','  // END AD LIFECYCLE').includes('initAudioGraph'),false);
});
test('Video.js ad restoration enables saved choices before disabling the temporary lowest choice',()=>{
  const enabled=[true,false],levels=enabled.map((_,index)=>{
    const level={height:[1080,480][index]};
    Object.defineProperty(level,'enabled',{get:()=>enabled[index],set:value=>{enabled[index]=value;assert.ok(enabled.some(Boolean));}});return level;
  });
  const h=harness({findVideoJsPlayer:()=>({qualityLevels:()=>levels})});
  h.run('controller.tick({video,player:null},true)');assert.deepEqual(enabled,[false,true]);
  h.run('controller.stop()');assert.deepEqual(enabled,[true,false]);
});
