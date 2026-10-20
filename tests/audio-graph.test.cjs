const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
function harness(){
  let contexts=0,sources=0,routes=0;
  class AudioContext{
    constructor(){contexts++;this.state='running';this.currentTime=0;}
    createMediaElementSource(){sources++;return {};}
    createGain(){return {gain:{value:1,setValueAtTime(value){this.value=value;}}};}createChannelSplitter(){return {};}createChannelMerger(){return {};}
  }
  const video={readyState:4};
  const context=vm.createContext({video,window:{AudioContext},currentAudioVolumePercent:100,currentAudioMode:'stereo',
    audioContextInstance:null,audioGainNodeInstance:null,audioSplitterNodeInstance:null,audioMergerNodeInstance:null,
    audioSourceElementMap:new WeakMap(),detectDrmStatus:video=>({isDrm:!!video.drm}),addDiagnosticLog(){},applyAudioGraphRouting(){routes++;}});
  vm.runInContext(source.slice(source.indexOf('  function initAudioGraphForVideo'),source.indexOf('  function applyAudioGraphRouting')),context);
  return {video,context,run:code=>vm.runInContext(code,context),counts:()=>({contexts,sources,routes})};
}
test('native stereo volume never creates an AudioContext or binds a media element',()=>{
  const h=harness();for(const volume of [0,15,40,100]){h.context.currentAudioVolumePercent=volume;assert.equal(h.run('initAudioGraphForVideo(video)'),null);}
  assert.deepEqual(h.counts(),{contexts:0,sources:0,routes:0});
});
test('boost or mono creates one reusable graph only after metadata; native return reuses the unavoidable binding',()=>{
  const h=harness();h.context.currentAudioVolumePercent=200;h.video.readyState=0;
  assert.equal(h.run('initAudioGraphForVideo(video)'),null);assert.equal(h.counts().sources,0);
  h.video.readyState=4;assert.ok(h.run('initAudioGraphForVideo(video)'));assert.deepEqual(h.counts(),{contexts:1,sources:1,routes:1});
  assert.equal(h.context.audioGainNodeInstance.gain.value,2);
  h.context.currentAudioVolumePercent=100;h.run('initAudioGraphForVideo(video)');assert.equal(h.counts().sources,1);
  const mono=harness();mono.context.currentAudioMode='mono';assert.ok(mono.run('initAudioGraphForVideo(video)'));assert.equal(mono.counts().sources,1);
});
test('explicit audio-less capability and DRM skip the graph even for boost/mono without a browser version check',()=>{
  const h=harness();h.context.currentAudioVolumePercent=300;h.context.currentAudioMode='mono';h.video.mozHasAudio=false;
  assert.equal(h.run('initAudioGraphForVideo(video)'),null);assert.equal(h.counts().contexts,0);
  delete h.video.mozHasAudio;h.video.drm=true;assert.equal(h.run('initAudioGraphForVideo(video)'),null);assert.equal(h.counts().sources,0);
});
test('metadata replay initializes boost only for the currently selected media owner',()=>{
  const calls=[],makeVideo=()=>({listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}});
  const first=makeVideo(),second=makeVideo();let selected=first;
  const context=vm.createContext({first,second,currentAudioVolumePercent:200,currentAudioMode:'stereo',startAdWatch(){},
    findVideoAndPlayer:()=>({video:selected}),initAudioGraphForVideo:video=>calls.push(video),
    updateRealtimeResolutionBadge(){},renderDynamicQualityButtons(){},applyVideoFiltersToElement(){}});
  vm.runInContext(source.slice(source.indexOf('  function monitorVideoResolution'),source.indexOf('  function updatePipButtonsState')),context);
  vm.runInContext('monitorVideoResolution(first)',context);assert.deepEqual(calls,[first]);
  selected=second;first.listeners.loadedmetadata();assert.deepEqual(calls,[first]);
  vm.runInContext('monitorVideoResolution(second)',context);assert.deepEqual(calls,[first,second]);
});
