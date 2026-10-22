const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
function section(from,to){const a=source.indexOf(from),b=source.indexOf(to,a);assert.ok(a>=0&&b>a);return source.slice(a,b);}

test('YouTube-like classes, unrelated player APIs and unready elements never establish YouTube ownership',()=>{
  let candidate=null;
  const video={readyState:4},other={readyState:4};
  const context=vm.createContext({video,document:{getElementById:()=>candidate,querySelector:()=>candidate}});
  vm.runInContext(section('  function findYouTubePlayer','  // SCRIPT load'),context);
  const read=()=>vm.runInContext('findYouTubePlayer(video)',context);
  candidate={querySelector:()=>video};assert.equal(read(),null);
  candidate={getPlayerState:()=>1,getAvailableQualityLevels:()=>[],getVideoElement:()=>other};assert.equal(read(),null);
  candidate.getVideoElement=()=>video;assert.equal(read(),candidate);
  video.readyState=0;assert.equal(read(),null);
});

test('playing decoded video outranks a large unready preview',()=>{
  const context=vm.createContext({document:{},window:{innerWidth:1920,innerHeight:1080}});
  vm.runInContext(section('  function scoreVideoCandidate','  function findVideoAndPlayer'),context);
  const rect={top:0,left:0,bottom:500,right:900,width:900,height:500};
  context.preview={readyState:0,paused:true,muted:false,volume:1,clientWidth:1920,clientHeight:1080,getBoundingClientRect:()=>rect};
  context.playing={readyState:4,paused:false,muted:true,currentTime:5,volume:1,clientWidth:640,clientHeight:360,getBoundingClientRect:()=>rect};
  assert.equal(vm.runInContext('scoreVideoCandidate(playing)>scoreVideoCandidate(preview)',context),true);
});

test('Puhu never fabricates a resolution from an SMIL URL or switches to a guessed CDN',()=>{
  let selected=null,applied=0;
  const levels=[{id:'declared',height:720}];
  const context=vm.createContext({HOSTNAME:'puhutv.com',document:{querySelector:()=>null},
    findVideoJsPlayer:()=>selected,findLibraryPlayer:()=>null,
    VideoJsAdapter:{getQualities:()=>levels,applyQuality:()=>{applied++;return true;}}});
  vm.runInContext(section('  const PuhuTvAdapter','  function simulateFullPointerClick'),context);
  context.video={currentSrc:'https://media.invalid/1080p.smil'};
  assert.equal(vm.runInContext('PuhuTvAdapter.getQualities(video,null).length',context),0);
  assert.equal(vm.runInContext('PuhuTvAdapter.applyQuality({height:1080},video,null)',context),false);
  selected={};assert.equal(vm.runInContext('PuhuTvAdapter.getQualities(video,null)',context),levels);
  assert.equal(vm.runInContext('PuhuTvAdapter.applyQuality({height:720},video,null)',context),true);assert.equal(applied,1);
});

test('removed media releases cached targets, filters, quality context and detached React handlers while HUD is closed',()=>{
  const removed={isConnected:false},live={isConnected:true},restored=[];
  const select={__nokVideos:[removed]};
  const context=vm.createContext({mediaDiscoveryCache:{candidates:[{video:removed},{video:live}]},
    releaseDetachedAudioSources(){},
    controlledVideo:removed,lastFilteredVideo:removed,restoreVideoFilter:video=>restored.push(video),
    qualityControlState:{context:{video:removed}},GenericAdapter:{},
    resetQualityContext(){context.qualityControlState.context=null;},
    document:{getElementById:()=>select},remoteSourceCandidates:[removed,live],
    cachedKickVolOwner:removed,cachedKickVolSetter:()=>{},cachedKickVolHook:{},
    cachedKickSpeedOwner:removed,cachedKickSpeedSetter:()=>{},cachedKickSpeedHook:{}});
  vm.runInContext(section('  function releaseDetachedMediaState','  function scoreVideoCandidate'),context);
  vm.runInContext('releaseDetachedMediaState()',context);
  for(const key of ['controlledVideo','lastFilteredVideo','cachedKickVolOwner','cachedKickSpeedOwner','cachedKickVolSetter','cachedKickSpeedSetter'])assert.equal(context[key],null,key);
  assert.equal(select.__nokVideos,null);assert.equal(context.qualityControlState.context,null);
  assert.deepEqual(restored,[removed]);assert.equal(context.mediaDiscoveryCache.candidates[0].video,live);
  assert.equal(context.remoteSourceCandidates.length,1);
});
