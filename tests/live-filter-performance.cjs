// Disposable public-player benchmark. No accounts, content titles or media URLs in evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const {filterWindowProblems}=require('./filter-window.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
let target=new URL(arg('url'));
if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash)throw Error('Public HTTPS URL without credentials/query required');
const label=arg('label')||'baseline';if(!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Invalid evidence label');
const engines=arg('engine')==='both'?['firefox','chromium']:[arg('engine')||'firefox'];
const rounds=Number(arg('rounds')||2);if(![1,2,3].includes(rounds))throw Error('Expected 1–3 rounds');
const nativeReference=process.argv.includes('--native-reference');
const root=path.resolve(__dirname,'..'),sourceSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'injected.js'))).digest('hex');
const extensionVersion=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).version;
const dir=path.join(__dirname,'artifacts','live-filters-'+label);fs.mkdirSync(dir,{recursive:true});
async function videoProbe(drag){
  const video=[...document.querySelectorAll('video')].find(v=>v.readyState>=2&&v.getBoundingClientRect().width>0);
  if(!video)throw Error('Selected media unavailable');
  const initialSource=video.currentSrc,initialFilter=video.style.filter,before=video.getVideoPlaybackQuality(),start=performance.now(),startMedia=video.currentTime;
  const rect=video.getBoundingClientRect(),metrics={styleWrites:0,videoRectReads:0,animationFrames:0,minimumReadyState:video.readyState,waitingEvents:0};
  const original=video.getBoundingClientRect;
  video.getBoundingClientRect=function(...args){metrics.videoRectReads++;return Reflect.apply(original,this,args);};
  const observer=new MutationObserver(records=>{metrics.styleWrites+=records.length;});observer.observe(video,{attributes:true,attributeFilter:['style']});
  const waiting=()=>metrics.waitingEvents++;video.addEventListener('waiting',waiting);
  try{
    await new Promise(resolve=>{const tick=now=>{metrics.animationFrames++;metrics.minimumReadyState=Math.min(metrics.minimumReadyState,video.readyState);
      if(now-start>=6000)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});
    const after=video.getVideoPlaybackQuality();
    return {seconds:(performance.now()-start)/1000,totalFrames:after.totalVideoFrames-before.totalVideoFrames,droppedFrames:after.droppedVideoFrames-before.droppedVideoFrames,
      mediaSeconds:video.currentTime-startMedia,rate:video.playbackRate,paused:video.paused,readyState:video.readyState,
      decoded:[video.videoWidth,video.videoHeight],displayed:[Math.round(rect.width),Math.round(rect.height)],visibility:document.visibilityState,
      sourceStable:video.isConnected&&initialSource===video.currentSrc,initialFilter,filter:video.style.filter,...metrics};
  }finally{observer.disconnect();video.getBoundingClientRect=original;video.removeEventListener('waiting',waiting);}
}
async function run(engine){
  let driver;const samples=[];
  try{
    driver=await createDriver(engine,engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',path.join(root,'node_modules'),{allowWeb:true,toolbarControls:true,visible:true,viewport:{width:1920,height:1080}});
    if(!nativeReference)await driver.install();let page=await driver.open(target.href);await delay(2500);
    if(process.argv.includes('--discover')&&target.pathname==='/'){
      const next=await driver.evaluate(page,mode=>[...document.querySelectorAll('a[href]')].find(a=>{
        if(a.origin!==location.origin||a.pathname==='/'||a.search||a.hash)return false;
        if(mode!=='poster')return /\d+-bolum/.test(a.pathname);
        const image=a.querySelector('img'),rect=image?.getBoundingClientRect();return rect?.width>80&&rect?.height>100;
      })?.href||null,arg('discover-mode')||'episode');
      if(!next)throw Error('No public sample link found');target=new URL(next);await driver.navigate(page,target.href);await delay(3000);
    }
    let media;
    for(let attempt=0;attempt<30&&!media;attempt++){
      let largest=0;
      for(const frame of await driver.frames(page))try{
        const area=await driver.evaluate(frame.target,()=>Math.max(0,...[...document.querySelectorAll('video')].filter(v=>v.readyState>=2&&v.videoWidth>0)
          .map(v=>{const r=v.getBoundingClientRect();return r.width>=160&&r.height>=90?r.width*r.height:0;})));
        if(area>largest){largest=area;media=frame.target;}
      }catch(_){}
      if(!media)await delay(500);
    }
    if(!media)throw Error('No ready public video; no performance claim');
    if(process.argv.includes('--probe')){
      const result=await driver.evaluate(media,()=>{const v=[...document.querySelectorAll('video')].find(v=>v.readyState>=2);return {decoded:[v.videoWidth,v.videoHeight],ready:v.readyState,hasVideoJs:!!v.closest('.video-js'),sourceKind:v.currentSrc.startsWith('blob:')?'blob':'other'};});
      console.log(JSON.stringify({engine,probe:result}));return;
    }
    await driver.evaluate(page,()=>[...document.querySelectorAll('iframe')].sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height)[0]?.scrollIntoView({block:'center'}));
    await driver.evaluate(media,async()=>{const video=[...document.querySelectorAll('video')].find(v=>v.readyState>=2);video.muted=true;await video.play();video.scrollIntoView({block:'center'});});
    if(!nativeReference){await driver.toolbar(page);await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','top HUD opens');}
    let hud=page;
    if(process.argv.includes('--fullscreen')){
      await driver.evaluate(media,()=>{const video=[...document.querySelectorAll('video')].find(v=>v.readyState>=2);return (video.closest('.video-js')||video.parentElement).requestFullscreen();});
      await until(driver,media,()=>!!document.fullscreenElement,'native player fullscreen');hud=media;
    }
    const control=(selector,value)=>driver.evaluate(nativeReference?media:hud,(selector,value,click,nativeReference)=>{
      if(nativeReference){
        const s=window.__nokNativeFilters||={brightness:100,contrast:100,saturate:100,night:false,invert:false};
        if(selector==='#pvc-btn-reset-filters')Object.assign(s,{brightness:100,contrast:100,saturate:100,night:false,invert:false});
        else if(selector.startsWith('#pvc-filter-'))s[selector.slice('#pvc-filter-'.length)]=value;
        else if(selector==='#pvc-btn-night-shield')s.night=!s.night;
        else if(selector==='#pvc-btn-invert-color')s.invert=!s.invert;
        else return;
        const parts=[];for(const key of ['brightness','contrast','saturate'])if(s[key]!==100)parts.push(key+'('+s[key]+'%)');
        if(s.night)parts.push('sepia(38%) brightness(88%) contrast(95%)');if(s.invert)parts.push('invert(100%) hue-rotate(180deg)');
        const video=[...document.querySelectorAll('video')].find(v=>v.getBoundingClientRect().width>=160);
        if(!video)throw Error('Public player changed during native reference');
        if(parts.length)video.style.setProperty('filter',parts.join(' '),'important');else video.style.removeProperty('filter');return;
      }
      const node=document.querySelector(selector);if(!node)throw Error('Missing test control');if(click)node.click();else{node.value=String(value);node.dispatchEvent(new Event('input',{bubbles:true}));}
    },selector,value??null,value===undefined,nativeReference);
    const show=async()=>{if(nativeReference)return;if(!await driver.evaluate(hud,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block')){
      if(hud===page)await driver.toolbar(page);else await driver.evaluate(hud,()=>window.postMessage({type:'PVC_OPEN_POPUP'},'*'));
      await until(driver,hud,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','active HUD opens');
    }await control('#pvc-tab-settings');await driver.evaluate(hud,()=>{const n=document.querySelector('#pvc-a11y-keepVisible');if(!n.checked)n.click();});};
    const waitFilter=expected=>until(driver,media,expected=>[...document.querySelectorAll('video')].some(v=>v.readyState>=2&&v.style.filter===expected),'requested filter reaches media',expected);
    const closeAfter=async expected=>{await waitFilter(expected);await control('#pvc-close-popup-btn');};
    let timingMode='video-frame';
    async function measure(stage,drag=false,expectedFilter=''){
      await driver.activate(page);
      await delay(1500);
      const profiling=process.argv.includes('--profile')&&typeof driver.profileStart==='function';
      if(profiling)await driver.profileStart(page);
      let drive=true,inputs=0;const dragStart=Date.now();
      // Generate input independently of page rAF: a slow UI must not silently reduce the workload.
      const driving=drag?(async()=>{while(drive){const start=Date.now();await control('#pvc-filter-brightness',90+(inputs%9)*5);inputs++;await delay(Math.max(1,16-(Date.now()-start)));}})():null;
      let processWindow,videoWindow;
      try{[processWindow,videoWindow]=await Promise.all([driver.performance(5),driver.evaluate(media,videoProbe,drag)]);}
      finally{drive=false;await driving;}
      const dragMetrics=drag?{inputs,seconds:(Date.now()-dragStart)/1000,...await driver.evaluate(hud,()=>({focused:document.hasFocus(),visibility:document.visibilityState,rafIsNative:/\[native code\]/.test(String(requestAnimationFrame))}))}:null;
      const profile=profiling?await driver.profileStop(page):null;
      const problems=filterWindowProblems(videoWindow,drag,expectedFilter);
      if(drag&&dragMetrics.inputs/dragMetrics.seconds<20)problems.push('input-workload-throttled');
      const valid=problems.length===0;
      const sample={stage,timingMode,valid,problems,expectedFilter:drag?'changing-brightness':expectedFilter,processWindow,videoWindow,dragMetrics,profile};samples.push(sample);
      fs.writeFileSync(path.join(dir,engine+'-progress.json'),JSON.stringify(samples,null,2)+'\n');
      console.log(JSON.stringify({engine,stage,timingMode,valid,cpuCores:processWindow.cpuCoreEquivalent,cpuStable:processWindow.processSetStable,gpu:processWindow.gpuStatus,
        dropped:videoWindow.droppedFrames,frames:videoWindow.totalFrames,rectReads:videoWindow.videoRectReads,styleWrites:videoWindow.styleWrites}));
    }
    const three='brightness(115%) contrast(110%) saturate(120%)',full=three+' sepia(38%) brightness(88%) contrast(95%) invert(100%) hue-rotate(180deg)';
    const modes=nativeReference?['native-css']:process.argv.includes('--compare-timing')?process.argv.includes('--legacy-first')?['legacy-raf','video-frame']:['video-frame','legacy-raf']:['video-frame'];
    for(const mode of modes){
    timingMode=mode;
    if(mode==='legacy-raf')await driver.evaluate(media,()=>{
      const video=[...document.querySelectorAll('video')].find(v=>v.readyState>=2),original=Object.getOwnPropertyDescriptor(video,'requestVideoFrameCallback');
      Object.defineProperty(video,'requestVideoFrameCallback',{value:undefined,configurable:true});
      window.__nokRestoreTiming=()=>{if(original)Object.defineProperty(video,'requestVideoFrameCallback',original);else delete video.requestVideoFrameCallback;delete window.__nokRestoreTiming;};
    });
    for(let round=1;round<=rounds;round++){
      await show();await control('#pvc-btn-reset-filters');await closeAfter('');await measure('neutral-closed-'+round);
      if(!process.argv.includes('--focus')){
      await show();await control('#pvc-filter-brightness',115);await control('#pvc-filter-contrast',110);await control('#pvc-filter-saturate',120);
      await closeAfter(three);await measure('three-filters-closed-'+round,false,three);
      await show();await control('#pvc-btn-night-shield');await control('#pvc-btn-invert-color');await closeAfter(full);await measure('full-chain-closed-'+round,false,full);
      }
      if(!nativeReference){await show();await control('#pvc-btn-reset-filters');await waitFilter('');await measure('neutral-open-'+round);await measure('brightness-drag-open-'+round,true);}
      await control('#pvc-btn-reset-filters');await closeAfter('');await measure('neutral-return-'+round);
    }
    if(mode==='legacy-raf')await driver.evaluate(media,()=>window.__nokRestoreTiming());
    }
    const result={engine,browserVersion:driver.version,extensionVersion,sourceSha256,actualInstalledExtension:!nativeReference,visible:true,fullscreen:process.argv.includes('--fullscreen'),synthetic:false,samples,
      limitations:['One public player sample, no whole-site or hardware guarantee','CPU is owned-process core-equivalent; GPU values are per-engine sums, not whole-device percent',
        'CPU and page windows overlap but have different boundaries; no GC during measurement','No account, content title, media URL or absolute playback position exported']};
    fs.writeFileSync(path.join(dir,engine+'-result.json'),JSON.stringify(result,null,2)+'\n');
    assert.ok(samples.every(s=>s.valid),'Invalid media windows are recorded; no blanket performance acceptance');
  }finally{await driver?.close();}
}
(async()=>{for(const engine of engines)await run(engine);})().catch(error=>{console.error(String(error.message).replace(/https?:\/\/[^\s"'<>]+/g,'<url>').slice(0,250));process.exitCode=1;});
