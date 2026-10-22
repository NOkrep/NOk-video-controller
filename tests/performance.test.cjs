const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'injected.js'), 'utf8');
function section(from, to) {
  const a = source.indexOf(from), b = source.indexOf(to, a);
  assert.ok(a >= 0 && b > a); return source.slice(a, b);
}
function mediaStyle(value = '', priority = '') {
  const properties = new Map(value ? [['filter', { value, priority }]] : []), writes = [];
  return {
    writes,
    getPropertyValue: key => properties.get(key)?.value || '',
    getPropertyPriority: key => properties.get(key)?.priority || '',
    setProperty(key, value, priority = '') { properties.set(key, { value, priority }); writes.push({ key, value, priority }); },
    removeProperty(key) { properties.delete(key); writes.push({ remove: key }); }
  };
}
function filters(value = '', priority = '') {
  const frames = new Map(); let frameId = 0, discoveries = 0;
  const video = { style: mediaStyle(value, priority), isConnected: true };
  const context = vm.createContext({ video, remotePresentation: null, videoFilterState: { brightness: 100, contrast: 100, saturate: 100, nightShield: false, invert: false },
    clock: 0, performance: { now: () => context.clock }, mediaDiscoveryCache: { at: 0 }, controlledVideo: null,
    document: { getElementById: () => null },
    findVideoAndPlayer() { discoveries++; return { video: context.video }; },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    showToast() {}, setUiText() {}
  });
  vm.runInContext(section('  const appliedVideoFilters', '  function parseTimecodeToSeconds'), context);
  return { video, context, frames, run: code => vm.runInContext(code, context), get discoveries() { return discoveries; },
    flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); } };
}

test('200 picture input updates coalesce to one discovery and one final style write', () => {
  const h = filters();
  h.run('for (let i = 0; i < 200; i++) { videoFilterState.brightness = 50 + i % 101; scheduleVideoFilterUpdate(); }');
  assert.equal(h.frames.size, 1); assert.equal(h.discoveries, 0); assert.equal(h.video.style.writes.length, 0);
  h.flush();
  assert.equal(h.discoveries, 1); assert.equal(h.video.style.writes.length, 1);
  assert.equal(h.video.style.getPropertyValue('filter'), 'brightness(148%)');
});

test('unchanged filters do not rewrite CSS and neutral defaults leave site filters intact', () => {
  const h = filters('grayscale(1)', 'important');
  h.run('applyVideoFiltersToElement(video)'); assert.equal(h.video.style.writes.length, 0);
  h.run('videoFilterState.contrast = 110; applyVideoFiltersToElement(video); applyVideoFiltersToElement(video);');
  assert.equal(h.video.style.writes.length, 1);
  h.run('resetVideoFilters()'); h.flush();
  assert.equal(h.video.style.getPropertyValue('filter'), 'grayscale(1)');
  assert.equal(h.video.style.getPropertyPriority('filter'), 'important');
});

test('switching the active video restores the previous video; reset respects a later site write', () => {
  const h = filters();
  h.run('videoFilterState.saturate = 70; applyVideoFiltersToElement(video);');
  const first = h.video; h.context.video = { style: mediaStyle() };
  h.run('applyVideoFiltersToElement(video)');
  assert.equal(first.style.getPropertyValue('filter'), '');
  h.context.video.style.setProperty('filter', 'blur(1px)');
  h.run('resetVideoFilters()'); h.flush();
  assert.equal(h.context.video.style.getPropertyValue('filter'), 'blur(1px)');
});

test('night shield preserves filter ordering instead of assuming noncommuting operations can merge', () => {
  const h = filters();
  h.run('videoFilterState.nightShield = true; videoFilterState.brightness = 125; applyVideoFiltersToElement(video);');
  const filter = h.video.style.getPropertyValue('filter');
  assert.equal(filter, 'brightness(125%) sepia(38%) brightness(88%) contrast(95%)');
});

test('continuous filter changes reuse a weak target; media invalidation, selection, detachment and expiry reselect immediately', () => {
  const h = filters();
  const nextFrame = () => { h.run('videoFilterState.brightness++; scheduleVideoFilterUpdate()'); h.flush(); };
  nextFrame();
  for(let i=1;i<=11;i++){h.context.clock=i*16;nextFrame();}
  assert.equal(h.discoveries,1,'drag frames within the short window reuse the selected target');
  h.context.mediaDiscoveryCache.at=-Infinity;nextFrame();assert.equal(h.discoveries,2);
  h.context.controlledVideo=h.video;nextFrame();assert.equal(h.discoveries,3);
  const previous=h.video;previous.isConnected=false;
  h.context.video={style:mediaStyle(),isConnected:true};nextFrame();assert.equal(h.discoveries,4);
  assert.equal(previous.style.getPropertyValue('filter'),'','old media filter is restored');
  h.context.clock+=201;nextFrame();assert.equal(h.discoveries,5,'auto ownership is periodically rechecked');
});

test('candidate cache expires, invalidates on media events and immediately replaces a detached video', () => {
  let now = 0, scans = 0; const events = {}, video = { isConnected: true };
  const context = vm.createContext({ performance: { now: () => now },
    deepFindMediaElements: () => { scans++; return [{ video }]; },
    document: { addEventListener(type, callback) { events[type] = callback; } }
  });
  vm.runInContext(section('  let mediaDiscoveryCache', '  // END MEDIA DISCOVERY CACHE'), context);
  const run = () => vm.runInContext('getMediaCandidates()', context);
  run(); run(); assert.equal(scans, 1);
  now = 1001; run(); assert.equal(scans, 2);
  events.playing(); run(); assert.equal(scans, 3);
  video.isConnected = false; run(); assert.equal(scans, 4);
});

test('discovery observer ignores HUD and filter style changes, but invalidates a replaced media node', () => {
  let observer, scans = 0;
  const context = vm.createContext({ performance: { now: () => 0 },
    retryPendingRemoteSource() {}, releaseDetachedMediaState() {},
    deepFindMediaElements: () => { scans++; return []; },
    MutationObserver: class { constructor(callback) { observer = callback; } observe(_target, options) { assert.equal(options.attributes, undefined); } },
    document: { documentElement: {}, addEventListener() {} }
  });
  vm.runInContext(section('  let mediaDiscoveryCache', '  // END MEDIA DISCOVERY CACHE'), context);
  const run = () => vm.runInContext('getMediaCandidates()', context);
  run();
  observer([{ target: { nodeType: 1, id: 'pvc-theme-name' }, addedNodes: [{}], removedNodes: [] }]); run();
  assert.equal(scans, 1);
  for(let i=0;i<200;i++){
    observer([{target:{},addedNodes:[{nodeType:3},{nodeType:1,tagName:'SPAN',querySelector:()=>null}],removedNodes:[]}]);run();
  }
  assert.equal(scans,1,'unrelated text/chat DOM churn must not rescan the entire media tree');
  observer([{ target: {}, addedNodes: [{ nodeType: 1, tagName: 'VIDEO' }], removedNodes: [] }]); run();
  assert.equal(scans, 2);
});

test('normal-mode viewport clamp preserves horizontal placement instead of locking to the right rail', () => {
  const style = mediaStyle();
  const popup = { style, getBoundingClientRect: () => ({ left: 100, top: 60, width: 320, height: 200 }) };
  const context = vm.createContext({ popup, window: { innerWidth: 1200, innerHeight: 800, addEventListener() {} }, document: {} });
  vm.runInContext(section('  const SNAP_THRESHOLD', '  function makeDraggable'), context);
  vm.runInContext('clampPopupToViewport(popup)', context);
  assert.equal(style.getPropertyValue('left'), '100px'); assert.equal(style.getPropertyValue('right'), 'auto');
});

test('explicit video target survives a higher-scoring sibling and releases a detached or absent target', () => {
  const main = { isConnected: true }, preview = { isConnected: true };
  const candidates = [{ video: main }, { video: preview }];
  const context = vm.createContext({ controlledVideo: main, getMediaCandidates: () => candidates,
    scoreVideoCandidate: video => video === preview ? 300 : 100, detectDrmStatus() {},
    findLibraryPlayer: () => null, findVideoJsPlayer: () => null, findYouTubePlayer:()=>null,
    HOSTNAME: 'example.invalid', globalCapturedIvsPlayer: null, activeDrmState: { isDrm: false }, isMediaInShadowDom: false
  });
  vm.runInContext(section('  function findVideoAndPlayer()', '  let smoothSwitchInterval'), context);
  const selected = () => vm.runInContext('findVideoAndPlayer().video', context);
  assert.equal(selected(), main);
  main.isConnected = false; assert.equal(selected(), preview);
  assert.equal(context.controlledVideo, null);
  context.controlledVideo = preview; candidates.length = 0;
  assert.equal(selected(), null); assert.equal(context.controlledVideo, null);
});

test('quality polling performs no discovery while idle-hidden and terminates when the HUD is closed', () => {
  const timers = new Map(); let timerId = 0, discoveries = 0, updates = 0, hidden = true;
  const popup = { style: { display: 'block' }, classList: { contains: () => hidden } };
  const context = vm.createContext({ remotePresentation: null, remoteSourceSession: null, qualityWatchTimer: null, qualityControlState: { context: null, request: null },
    document: { hidden: false, getElementById: () => popup },
    findVideoAndPlayer() { discoveries++; return { video: null }; }, monitorVideoResolution() {},
    renderDynamicQualityButtons() { updates++; }, updateRealtimeResolutionBadge() {}, updateVideoTargetControls() {},
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; }, clearTimeout: id => timers.delete(id)
  });
  vm.runInContext(section('  function startQualityWatch()', '  function updateVideoTargetControls'), context);
  vm.runInContext('startQualityWatch()', context);
  const flush = () => { const next = [...timers.values()]; timers.clear(); next.forEach(fn => fn()); };
  flush(); flush(); assert.equal(discoveries, 0); assert.equal(updates, 0);
  hidden = false; flush(); assert.equal(discoveries, 1); assert.equal(updates, 1);
  popup.style.display = 'none'; flush(); assert.equal(timers.size, 0);
});

test('closed HUD with a completed quality request skips timeupdate scans; pending quality and captions keep working',()=>{
  const listeners={};let scans=0,captions=0;
  const video={addEventListener:(type,callback)=>{listeners[type]=callback;}};
  const context=vm.createContext({video,document:{getElementById:()=>({style:{display:'none'}})},
    qualityControlState:{request:{status:'confirmed'}},customSubtitleCues:[],remoteSourceSession:null,
    currentAudioVolumePercent:100,currentAudioMode:'stereo',pendingQualityLabel:'',lastObservedResolution:'',
    startAdWatch(){},findVideoAndPlayer(){scans++;return {video};},updateQualityVerification(){},
    updateRealtimeResolutionBadge(){},renderDynamicQualityButtons(){},applyVideoFiltersToElement(){},
    renderCustomSubtitleCue(){captions++;}});
  vm.runInContext(section('  function monitorVideoResolution','  function updatePipButtonsState'),context);
  vm.runInContext('monitorVideoResolution(video)',context);scans=0;
  for(let i=0;i<100;i++)listeners.timeupdate();assert.equal(scans,0);
  context.qualityControlState.request.status='pending';listeners.timeupdate();assert.equal(scans,1);
  context.qualityControlState.request.status='confirmed';context.customSubtitleCues.push({});listeners.timeupdate();assert.equal(scans,2);assert.equal(captions,2);
});
test('inactive iframe presentation suspends discovery/publication and resumes when active or fullscreen', () => {
  const timers = new Map(); let next=0, discoveries=0, publications=0, fullscreen=false;
  const context = vm.createContext({remotePresentation:null,remoteSourceSession:'session',remoteSourceActive:false,qualityWatchTimer:null,
    qualityControlState:{context:null,request:null},document:{hidden:false},remoteFullscreen:()=>fullscreen,
    findVideoAndPlayer(){discoveries++;return {video:null};},monitorVideoResolution(){},publishRemoteSourceState(){publications++;},
    setTimeout(fn){timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(section('  function startQualityWatch()', '  function updateVideoTargetControls'),context);
  vm.runInContext('startQualityWatch()',context);
  const tick=()=>{const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());};
  tick();tick();assert.equal(discoveries,0);assert.equal(publications,0);
  context.remoteSourceActive=true;tick();assert.equal(discoveries,1);assert.equal(publications,1);
  context.remoteSourceActive=false;fullscreen=true;tick();assert.equal(publications,2);
  context.document.hidden=true;tick();assert.equal(publications,2);
});
test('selection rejects a stale IVS attachment before reporting a player or building quality context', () => {
  const video = {isConnected:true,__ivsPlayer:{getHTMLVideoElement:()=>({})}};
  const context = vm.createContext({controlledVideo:null,getMediaCandidates:()=>[{video}],scoreVideoCandidate:()=>100,
    detectDrmStatus(){},findLibraryPlayer:()=>null,findVideoJsPlayer:()=>null,findYouTubePlayer:()=>null,
    HOSTNAME:'example.invalid',globalCapturedIvsPlayer:null,activeDrmState:{isDrm:false},isMediaInShadowDom:false});
  vm.runInContext(section('  function isIvsBoundToVideo','  function ivsQualityKey')+section('  function findVideoAndPlayer()', '  let smoothSwitchInterval'),context);
  assert.equal(vm.runInContext('findVideoAndPlayer().player',context),null);
  assert.equal(vm.runInContext('findVideoAndPlayer().playerType',context),'native-html5');
});
