// Test-only instrumentation. Weak references and numeric summaries; no production report fields.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {serveMedia}=require('./file-media-checks.cjs');
function instrumentResources(){
  const state={videos:[],sources:[],contexts:[],gains:[],addedVideoListeners:0};
  const nodeKinds=new WeakMap(),videoListenerCounts=new WeakMap();
  const add=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(...args){
    if(this instanceof HTMLVideoElement){state.addedVideoListeners++;videoListenerCounts.set(this,(videoListenerCounts.get(this)||0)+1);}
    return Reflect.apply(add,this,args);
  };
  const trackConnect=(record,original)=>function(target,...args){
    const result=Reflect.apply(original,this,[target,...args]);
    record.targets.push(nodeKinds.get(target)||'destination');return result;
  };
  const trackDisconnect=(record,original)=>function(...args){
    const result=Reflect.apply(original,this,args);record.targets=[];return result;
  };
  const NativeContext=window.AudioContext;
  window.AudioContext=class extends NativeContext{
    constructor(...args){super(...args);state.contexts.push(new WeakRef(this));nodeKinds.set(this.destination,'destination');}
    createMediaElementSource(video){
      const node=super.createMediaElementSource(video),record={ref:new WeakRef(node),video:new WeakRef(video),targets:[]};
      state.sources.push(record);node.connect=trackConnect(record,node.connect);node.disconnect=trackDisconnect(record,node.disconnect);return node;
    }
    createGain(){const node=super.createGain();nodeKinds.set(node,'gain');state.gains.push(new WeakRef(node));return node;}
    createChannelSplitter(...args){const node=super.createChannelSplitter(...args);nodeKinds.set(node,'splitter');return node;}
    createChannelMerger(...args){const node=super.createChannelMerger(...args);nodeKinds.set(node,'merger');return node;}
  };
  function trackVideo(video){video.__resourceVideoId='video-'+state.videos.length;state.videos.push(new WeakRef(video));}
  window.resourceSnapshot=()=>{
    const video=document.querySelector('video'),live=state.videos.map(ref=>ref.deref()).filter(Boolean);
    return {dimensions:[video?.videoWidth,video?.videoHeight],readyState:video?.readyState,hasAudio:video?.mozHasAudio??null,
      domVideos:document.querySelectorAll('video').length,domNodes:document.querySelectorAll('*').length,
      videosCreated:state.videos.length,liveVideos:live.length,detachedLiveVideos:live.filter(v=>!v.isConnected).length,
      contextsCreated:state.contexts.length,liveContexts:state.contexts.filter(ref=>ref.deref()).length,
      contextStates:state.contexts.map(ref=>ref.deref()?.state||'collected'),
      sourcesCreated:state.sources.length,liveSources:state.sources.filter(record=>record.ref.deref()).length,
      connectedSources:state.sources.filter(record=>record.ref.deref()&&record.targets.length).length,
      detachedConnectedSources:state.sources.filter(record=>record.ref.deref()&&record.targets.length&&record.video.deref()?.isConnected===false).length,
      sourceTargets:state.sources.map(record=>record.targets),gainValues:state.gains.map(ref=>ref.deref()?.gain.value??null),
      addedVideoListeners:state.addedVideoListeners,liveVideoListeners:live.reduce((sum,video)=>sum+(videoListenerCounts.get(video)||0),0),hudCount:document.querySelectorAll('#pvc-controller-popup').length};
  };
  window.resourceReplaceVideo=async()=>{
    const previous=document.querySelector('video'),next=previous.cloneNode();
    previous.pause();previous.replaceWith(next);previous.removeAttribute('src');previous.load();
    trackVideo(next);await next.play();
  };
  window.resourceSuspendContexts=async()=>{
    for(const ref of state.contexts){const context=ref.deref();if(context?.state==='running')await context.suspend();}
  };
  window.resourceTemporarilyDetachVideo=async()=>{
    const video=document.querySelector('video');video.pause();video.remove();
    await new Promise(resolve=>setTimeout(resolve,100));
    document.body.appendChild(video);await video.play();
  };
  document.addEventListener('DOMContentLoaded',()=>{trackVideo(document.querySelector('video'));});
}
async function createFixture(){
  const media=path.join(__dirname,'artifacts','media','synthetic-av-720p.webm');
  if(!fs.existsSync(media))throw Error('Generate the local audio fixture with prepare-browser-fixtures.cjs --audio-fixture.');
  const body=`<!doctype html><html><head><meta charset="utf-8"><script>(${instrumentResources})();</script><style>
  body{margin:24px;background:#152330;color:white}video{display:block;width:800px;height:450px}</style></head><body>
  <button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Controller</button>
  <video src="/synthetic.webm" autoplay muted loop playsinline></video></body></html>`;
  const server=http.createServer((request,response)=>{
    if(request.url==='/synthetic.webm'){serveMedia(request,response,media);return;}
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(body);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {url:`http://127.0.0.1:${server.address().port}/`,close:()=>new Promise(resolve=>server.close(resolve))};
}
module.exports={createFixture};
