// Fixed fields, normally read-only. Explicit vhs-probe-start/restore wrap SDK calls in the test profile only.
// No playlist URLs, account data, source tokens or full player dumps.
module.exports=async function(selector){
 if(selector==='quality-state'){
   const container=document.querySelector('#pvc-dynamic-quality-container');
   return {version:document.querySelector('.pvc-menu-brand')?.title,
     choices:container?.__nokQualities?.map(q=>({height:q.height,api:q.qualityApi||'library'})),
     selected:[...(container?.querySelectorAll('[aria-pressed="true"]')||[])].map(n=>n.textContent),
     status:document.querySelector('#pvc-quality-status')?.textContent};
 }
 if(selector==='player-structure'){
   const video=document.querySelector('video'),ancestors=[];let node=video;
   while(node&&ancestors.length<7){const props=node[Object.keys(node).find(k=>k.startsWith('__reactProps$'))];ancestors.push({tag:node.tagName,id:node.id,testid:node.getAttribute('data-testid'),class:node.className,
     events:props?Object.keys(props).filter(k=>/^on(?:Mouse|Pointer|Touch|Click)/.test(k)):[],
     shadow:!!node.shadowRoot});node=node.parentElement;}
   const rect=video?.getBoundingClientRect(),hit=rect?document.elementFromPoint(rect.left+rect.width/4,rect.top+rect.height/4):null;
   const root=video?.closest('#injected-channel-player, #channel-player')||video?.parentElement;
   const shadowRoots=[...(root?.querySelectorAll('*')||[])].filter(n=>n.shadowRoot).map(n=>({tag:n.tagName,id:n.id,
     buttons:n.shadowRoot.querySelectorAll('button,[role="slider"]').length}));
   return {ancestors,shadowRoots,hit:hit?{tag:hit.tagName,id:hit.id,class:hit.className,isVideo:hit===video}:null,
    videoCount:document.querySelectorAll('video').length,engine:!!window.__NOK_VIDEO_CONTROLLER_INJECTED__,
    hudCount:document.querySelectorAll('#pvc-controller-popup').length,srcKind:video?.src?.startsWith('blob:')?'blob':'other',
    hoverMedia:matchMedia('(hover:hover)').matches,pointerFine:matchMedia('(pointer:fine)').matches,hidden:document.hidden,focused:document.hasFocus()};
 }
 if(selector==='puhu-cdn-comparison'){
   if(!/(^|\.)puhutv\.com$/.test(location.hostname))return {status:'wrong-site'};
   const entry=performance.getEntriesByType('resource').find(e=>{
     try{const u=new URL(e.name);return u.hostname==='dygvideo.dygdigital.com'&&u.pathname==='/api/video_info'&&u.searchParams.has('akamai');}catch(_){return false;}
   });
   if(!entry)return {status:'no-observed-api'};
   const url=new URL(entry.name);url.searchParams.set('akamai','false');
   const response=await fetch(url.href,{method:'POST',signal:AbortSignal.timeout(10000)});
   if(!response.ok)return {status:'http-error',code:response.status};
   const json=await response.json(),data=json?.data;
   const source=data?.video_url||data?.hls_url||data?.files?.[0]?.url;
   if(typeof source!=='string')return {status:'no-source-field',rootFields:Object.keys(json),dataFields:data&&typeof data==='object'?Object.keys(data):[],
    mediaFields:data&&typeof data==='object'?Object.fromEntries(Object.entries(data).filter(([key])=>/video|file|url|hls|stream|source|cdn/i.test(key)).map(([key,value])=>[key,
      Array.isArray(value)?{kind:'array',itemFields:value[0]&&typeof value[0]==='object'?Object.keys(value[0]):[]}:
      value&&typeof value==='object'?{kind:'object',fields:Object.keys(value)}:{kind:typeof value}])):null};
   const alternative=new URL(source),video=document.querySelector('video');
   const player=video?.player||video?.vjsPlayer||video?.parentElement?.player;
   let current;try{current=new URL(player?.currentSrc?.()||'');}catch(_){}
   return {status:'observed-source-returned',domain:alternative.hostname,https:alternative.protocol==='https:',
    sameMediaPath:current?current.origin===alternative.origin&&current.pathname===alternative.pathname:null,
    heightHint:(alternative.pathname.match(/(?:^|\/)(\d{3,4})p\.smil/i)||[])[1]||null,
    decoded:[video?.videoWidth,video?.videoHeight]};
 }
 if(selector==='puhu-source-shape'){
   const video=document.querySelector('video'),entries=performance.getEntriesByType('resource');
   const urls=entries.map(e=>{try{return new URL(e.name);}catch(_){return null;}}).filter(Boolean);
   return {media:video?{width:video.videoWidth,height:video.videoHeight,readyState:video.readyState}:null,
    api:urls.filter(u=>/dyg|dogus/i.test(u.hostname)).map(u=>({domain:u.hostname,pathKind:/video/i.test(u.pathname)?'video':'other',akamai:u.searchParams.get('akamai'),keys:[...u.searchParams.keys()]})),
    manifests:urls.filter(u=>/\.m3u8$/i.test(u.pathname)).map(u=>({domain:u.hostname,smil:/\.smil/i.test(u.pathname),heightHint:(u.pathname.match(/(?:^|\/)(\d{3,4})p\.smil/i)||[])[1]||null}))};
 }
 const waitHeight=selector.match(/^wait-decoded-(\d{3,4})$/);
 if(waitHeight){
   const requested=Number(waitHeight[1]),started=performance.now();
   let video=document.querySelector('video');
   while(performance.now()-started<15000&&video?.isConnected&&!(video.readyState>=2&&video.videoHeight===requested)){
     await new Promise(resolve=>setTimeout(resolve,250));video=document.querySelector('video');
   }
   return {requested,reached:video?.readyState>=2&&video.videoHeight===requested,elapsedMs:Math.round(performance.now()-started),
     readyState:video?.readyState,paused:video?.paused,dimensions:[video?.videoWidth,video?.videoHeight],
     nativeSelected:document.querySelector('.vjs-quality-item.selected')?.id,
     extensionSelected:[...document.querySelectorAll('#pvc-dynamic-quality-container [aria-pressed="true"]')].map(n=>n.textContent)};
 }
 const video=document.querySelector('video'),node=selector==='navigation'?null:document.querySelector(selector);
 const players=[...Object.values(window.videojs?.players||{}),...(window.videojs?.getAllPlayers?.()||[])];
 const vjs=players.find(p=>{try{return p.el?.()?.contains(video);}catch(_){return false;}})
   ||video?.player||video?.vjsPlayer||video?.parentElement?.player;
 const call=(name)=>{try{return typeof vjs?.[name]==='function'?vjs[name]():null;}catch(_){return null;}};
 const groups=call('getGroupedSrc')?.label;
 const ql=call('qualityLevels');
 const vhs=vjs?.tech_?.vhs;
 const reps=vhs?.representations?.();
 const current=vhs?.playlists?.media?.();
 if(selector==='vhs-probe-start'){
   window.__nokVhsProbe?.restore();
   const controller=vhs?.playlistController_||vhs?.masterPlaylistController_,tech=vjs?.tech_;
   if(!controller||tech?.el?.()!==video)return {status:'unbound'};
   const counts={resets:0,resetCallbacks:0,seeks:0},restorers=[];
   const wrap=(owner,key,build)=>{const original=owner?.[key];if(typeof original!=='function')return;
     const replacement=build(original);owner[key]=replacement;restorers.push(()=>{if(owner[key]===replacement)owner[key]=original;});};
   wrap(controller.mainSegmentLoader_,'resetEverything',original=>function(...args){
     counts.resets++;if(typeof args[0]==='function'){const callback=args[0];args[0]=function(...values){counts.resetCallbacks++;return Reflect.apply(callback,this,values);};}
     return Reflect.apply(original,this,args);
   });
   wrap(tech,'setCurrentTime',original=>function(...args){counts.seeks++;return Reflect.apply(original,this,args);});
   window.__nokVhsProbe={counts,restore(){restorers.forEach(fn=>fn());delete window.__nokVhsProbe;}};
   return {status:'watching',counts};
 }
 if(selector==='vhs-probe-restore'){window.__nokVhsProbe?.restore();return {status:'restored'};}
 if(selector==='vhs-probe')return window.__nokVhsProbe?.counts||{status:'not-watching'};
 const resolution=call('currentResolution');
 const ivs=video?.__ivsPlayer||video?._ivsPlayer;
 const ivsCall=name=>{try{return ivs?.getHTMLVideoElement?.()===video&&typeof ivs[name]==='function'?ivs[name]():null;}catch(_){return null;}};
 const copy=node?.cloneNode(true);
 if(copy){
   copy.querySelectorAll('script,style').forEach(n=>n.remove());
   for(const n of [copy,...copy.querySelectorAll('*')])for(const attr of [...n.attributes]){
     if(!/^(?:class|id|role|title|type|value|data-testid|aria-[a-z-]+)$/.test(attr.name))n.removeAttribute(attr.name);
   }
 }
 return {html:copy?.outerHTML.slice(0,12000),
  navigation:selector==='navigation'?[...document.querySelectorAll('a[href]')].filter(n=>n.getClientRects().length).map(n=>{
    try{const u=new URL(n.href);return u.origin===location.origin?{path:u.pathname,text:n.textContent.trim().slice(0,50)}:null;}catch(_){return null;}
  }).filter(Boolean).slice(0,60):undefined,
  ivs:ivs?{bound:ivs?.getHTMLVideoElement?.()===video,state:ivsCall('getState'),rate:ivsCall('getPlaybackRate'),volume:ivsCall('getVolume'),
    auto:ivsCall('isAutoQualityMode'),height:ivsCall('getQuality')?.height,qualities:ivsCall('getQualities')?.map(q=>({height:q.height,bitrate:q.bitrate}))}:null,
  video:{readyState:video?.readyState,paused:video?.paused,ended:video?.ended,dimensions:[video?.videoWidth,video?.videoHeight]},
  playerBound:!!vjs,keys:vjs?Object.keys(vjs).filter(key=>/qual|src|source|resol|hls|tech/i.test(key)):[],
  sources:call('currentSources')?.map(s=>({type:s.type,label:s.label,res:s.res})),
  groups:groups?Object.fromEntries(Object.entries(groups).map(([label,sources])=>[label,sources.map(s=>({res:s.res,type:s.type}))])):null,
  currentResolution:typeof resolution==='string'?resolution:resolution?.label,
  qualitySelectorKeys:vjs?.qualitySelector?Object.keys(vjs.qualitySelector):[],
  vhsFeatures:vhs?{version:vhs.version||window.videojs?.Vhs?.VERSION,videojsVersion:window.videojs?.VERSION,controller:!!vhs.playlistController_,masterController:!!vhs.masterPlaylistController_,
    fastSwitch:typeof vhs.playlistController_?.runFastQualitySwitch_,fastQualityChange:typeof (vhs.playlistController_||vhs.masterPlaylistController_)?.fastQualityChange_,
    legacyReset:typeof vhs.masterPlaylistController_?.mainSegmentLoader_?.resetEverything,
    legacyTechBound:vhs.masterPlaylistController_?.tech_===vjs?.tech_,
    legacyElementBound:vjs?.tech_?.el?.()===video,bufferedRangeCount:video?.buffered?.length,
    distinctRenditionSources:reps?new Set(reps.map(r=>r.playlist?.resolvedUri).filter(Boolean)).size:null,
    resolvedRenditionSourceCount:reps?.filter(r=>typeof r.playlist?.resolvedUri==='string').length,
    legacyHasSegmentPlaylist:!!vhs.masterPlaylistController_?.mainSegmentLoader_?.playlist_,
    legacyLoaderMatches:vhs.masterPlaylistController_?.masterPlaylistLoader_?.media?.()?.id===current?.id,
    legacySegmentIdMatches:vhs.masterPlaylistController_?.mainSegmentLoader_?.playlist_?.id===current?.id}:null,
  levels:ql?Array.from(ql).map(q=>({height:q.height,width:q.width,bitrate:q.bitrate,enabled:typeof q.enabled==='function'?q.enabled():q.enabled})):null,
  representations:reps?.map(r=>({height:r.height,width:r.width,bandwidth:r.bandwidth,enabled:r.enabled?.(),
    idAvailable:r.id!=null,playlistAvailable:!!r.playlist,selectedId:r.id!=null&&current?.id!=null?r.id===current.id:null})),
  currentRendition:current?.attributes?{resolution:current.attributes.RESOLUTION,bandwidth:current.attributes.BANDWIDTH}:null};
};
