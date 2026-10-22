const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
function harness(){
  let contexts=0,sources=0,routes=0;
  const nodes=[];
  const node=kind=>{const item={kind,connections:new Set(),connect(target){this.connections.add(target);if(kind==='source')routes++;},disconnect(){this.connections.clear();}};nodes.push(item);return item;};
  class AudioContext{
    constructor(){contexts++;this.state='running';this.currentTime=0;this.destination={kind:'destination'};}
    createMediaElementSource(video){if(video.failSource)throw Error('Cannot bind');sources++;return Object.assign(node('source'),{context:this});}
    suspend(){this.state='suspended';return Promise.resolve();}resume(){this.state='running';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
    createGain(){return Object.assign(node('gain'),{gain:{value:1,setValueAtTime(value){this.value=value;}}});}createChannelSplitter(){return node('splitter');}createChannelMerger(){return node('merger');}
  }
  const video={readyState:4,isConnected:true};
  const context=vm.createContext({video,document:{},window:{AudioContext},currentAudioVolumePercent:100,currentAudioMode:'stereo',
    audioContextInstance:null,audioGainNodeInstance:null,audioSplitterNodeInstance:null,audioMergerNodeInstance:null,
    audioSourceElementMap:new WeakMap(),detectDrmStatus:video=>({isDrm:!!video.drm}),addDiagnosticLog(){},findVideoAndPlayer:()=>({video:context.video})});
  vm.runInContext(source.slice(source.indexOf('  // AUDIO SOURCE LIFETIME'),source.indexOf('  function updateVolumeSliderVisualGain')),context);
  return {video,context,nodes,run:code=>vm.runInContext(code,context),counts:()=>({contexts,sources,routes})};
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

test('changing the controlled player gives the old connected player a native route, never the new shared boost',()=>{
  const h=harness();h.context.currentAudioVolumePercent=200;h.run('initAudioGraphForVideo(video)');
  const first=h.nodes.find(node=>node.kind==='source');
  const previousContext=first.context;
  h.context.video={readyState:4,isConnected:true};h.run('initAudioGraphForVideo(video)');
  assert.deepEqual([...first.connections],[previousContext.destination]);
  const second=h.nodes.filter(node=>node.kind==='source')[1];assert.deepEqual([...second.connections],[h.context.audioGainNodeInstance]);
  h.video.isConnected=false;h.run('releaseDetachedAudioSources()');
  assert.equal(previousContext.state,'suspended');assert.equal(second.context.state,'running','removing one owner must not pause another player');
});

test('removal disconnects every old source and output without making a reinserted video impossible to reuse',()=>{
  const h=harness();h.context.currentAudioVolumePercent=200;h.run('initAudioGraphForVideo(video)');
  const first=h.video,firstSource=h.nodes.find(node=>node.kind==='source');
  h.context.video={readyState:4,isConnected:true};h.run('initAudioGraphForVideo(video)');
  first.isConnected=false;h.run('releaseDetachedAudioSources()');assert.equal(firstSource.connections.size,0);
  h.context.video.isConnected=false;h.run('releaseDetachedAudioSources()');
  assert.equal(h.context.audioGainNodeInstance,null);assert.equal(h.run('activeAudioSource'),null);
  first.isConnected=true;h.context.video=first;h.run('initAudioGraphForVideo(video)');
  assert.equal(h.counts().sources,2,'do not bind an already-bound media element twice');assert.equal(firstSource.connections.size,1);
  assert.equal(firstSource.context.state,'running','a reinserted media element can resume its original context');
});

test('failed source creation cannot return another player gain as a successful binding',()=>{
  const h=harness();h.context.currentAudioVolumePercent=200;h.run('initAudioGraphForVideo(video)');
  const first=h.nodes.find(node=>node.kind==='source');
  const previousContext=first.context;
  h.context.video={readyState:4,isConnected:true,failSource:true};
  assert.equal(h.run('initAudioGraphForVideo(video)'),null);
  assert.deepEqual([...first.connections],[previousContext.destination]);
});

test('changing gain reuses the route; only a changed audio mode rebuilds its connections',()=>{
  const h=harness();h.context.currentAudioVolumePercent=200;h.run('initAudioGraphForVideo(video)');
  for(const volume of [150,250,100,200]){h.context.currentAudioVolumePercent=volume;h.run('initAudioGraphForVideo(video)');}
  assert.equal(h.counts().routes,1);assert.equal(h.context.audioGainNodeInstance.gain.value,2);
  h.context.currentAudioMode='mono';h.run('initAudioGraphForVideo(video);initAudioGraphForVideo(video)');
  assert.equal(h.counts().routes,2);
});

test('rapid gain requests keep the latest target even when AudioParam.value still reflects the previous audio quantum',()=>{
  const h=harness(),scheduled=[];h.context.currentAudioVolumePercent=200;h.run('initAudioGraphForVideo(video)');
  const param=h.context.audioGainNodeInstance.gain;param.value=1.5;param.setValueAtTime=value=>scheduled.push(value);
  h.context.currentAudioVolumePercent=250;h.run('initAudioGraphForVideo(video)');
  h.context.currentAudioVolumePercent=150;h.run('initAudioGraphForVideo(video)');
  assert.deepEqual(scheduled,[2.5,1.5]);assert.equal(h.counts().routes,1);
});

test('same-origin frame and shadow roots observe removals; detached frame documents cannot keep an audio owner alive',()=>{
  for(const shadow of [true,false]){
    const h=harness();let onMutation;
    h.context.MutationObserver=class{constructor(callback){onMutation=callback;}observe(){}};
    const frame={isConnected:true},view={parent:{},frameElement:frame},root={nodeType:shadow?11:9,defaultView:view,...(shadow?{host:{}}:{})};
    h.video.ownerDocument={defaultView:view};h.video.getRootNode=()=>root;
    h.context.currentAudioVolumePercent=200;h.run('initAudioGraphForVideo(video)');assert.equal(typeof onMutation,'function');
    frame.isConnected=false;onMutation([{removedNodes:[{}]}]);
    assert.equal(h.nodes.find(node=>node.kind==='source').connections.size,0);assert.equal(h.context.audioContextInstance,null);
  }
});
