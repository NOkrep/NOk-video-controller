// D-01: long play and many video replacements, compared across native, passive and active extension runs.
// Test-owned local file, isolated profile, numbers only. Unforced samples show real accumulation; forced samples show what is collectable.
// node tests/memory-soak.cjs --engine=firefox|chromium --condition=native|passive|active [--label=run] [--minutes=4] [--replacements=60] [--no-forced] [--quick]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createFixture}=require('./resource-fixture.cjs'),{createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox',condition=args.condition||'active',label=args.label||'run',quick=process.argv.includes('--quick');
const noForced=process.argv.includes('--no-forced'); // Only the browser's own collection runs during replacements.
const minutes=quick?.5:Number(args.minutes||4),replacements=quick?6:Number(args.replacements||60),step=quick?3:15;
if(!['native','passive','active'].includes(condition)||!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Unsafe condition or label.');
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const packages=args.packages||path.resolve(__dirname,'../node_modules'),samples=[];
const dir=path.join(__dirname,'artifacts',`memory-soak-${label}`);
const mib=bytes=>bytes===undefined||bytes===null?null:Math.round(bytes/10485.76)/100;
let driver,fixture,page;
const control=(selector,value)=>driver.evaluate(page,(selector,value,click)=>{
  const node=document.querySelector(selector);if(!node)throw Error('Missing control '+selector);
  if(click)node.click();else{node.value=String(value);node.dispatchEvent(new Event('input',{bubbles:true}));}
},selector,value??null,value===undefined);
const ready=()=>until(driver,page,()=>document.querySelector('video')?.readyState>=2,'decoded file');
async function snapshot(stage,{forced=false,categories=false}={}){
  const collection=forced?await driver.gc(page):null,metrics=await driver.memory(page),resources=await driver.evaluate(page,()=>{
    const row=resourceSnapshot(),states=row.contextStates,count=name=>states.filter(state=>state===name).length;
    const video=document.querySelector('video');
    return {clock:video.currentTime,paused:video.paused,rate:video.playbackRate,domNodes:row.domNodes,videosCreated:row.videosCreated,liveVideos:row.liveVideos,detachedLiveVideos:row.detachedLiveVideos,
      contextsCreated:row.contextsCreated,liveContexts:row.liveContexts,runningContexts:count('running'),suspendedContexts:count('suspended'),closedContexts:count('closed'),
      sourcesCreated:row.sourcesCreated,liveSources:row.liveSources,connectedSources:row.connectedSources,detachedConnectedSources:row.detachedConnectedSources,
      latestGain:row.gainValues.at(-1)??null,latestTargets:row.sourceTargets.at(-1)??null,liveVideoListeners:row.liveVideoListeners,hudCount:row.hudCount};
  });
  const roles=categories?await driver.memoryCategories(page):undefined;
  const sample={stage,forced,seconds:Math.round((Date.now()-started)/1000),privateMiB:mib(metrics.process.privateBytes),workingSetMiB:mib(metrics.process.workingSetBytes),processes:metrics.process.processCount,
    heapMiB:mib(metrics.heap?.usedSize),domCounters:metrics.dom?{nodes:metrics.dom.nodes,listeners:metrics.dom.jsEventListeners,documents:metrics.dom.documents}:undefined,collection,categories:roles,resources};
  samples.push(sample);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,`${engine}-${condition}.progress.json`),JSON.stringify(samples,null,2)+'\n');
  const r=resources;process.stdout.write(JSON.stringify({stage,forced,privateMiB:sample.privateMiB,heapMiB:sample.heapMiB,videos:r.videosCreated,liveVideos:r.liveVideos,detached:r.detachedLiveVideos,contexts:r.contextsCreated,live:r.liveContexts,running:r.runningContexts,suspended:r.suspendedContexts,sources:r.sourcesCreated,listeners:sample.domCounters?.listeners??null})+'\n');
  return sample;
}
let started=Date.now();
(async()=>{try{
  fixture=await createFixture();driver=await createDriver(engine,executable,packages,{memoryControls:true});
  if(condition!=='native')await driver.install();
  page=await driver.open(fixture.url);await ready();
  if(condition!=='native')await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'installed engine');
  if(condition==='active'){
    await control('#open');await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','HUD open');
    await control('#pvc-volume-slider',200);await control('#pvc-audio-mono-btn');await until(driver,page,()=>resourceSnapshot().sourcesCreated===1,'real audio graph');
  }
  await delay(1500);started=Date.now();
  await snapshot('warm',{forced:true,categories:true});
  const samplesInPlay=quick?2:minutes;
  for(let i=1;i<=samplesInPlay;i++){await delay(minutes*60000/samplesInPlay);await snapshot(`play-${i}`);}
  await snapshot('play-end',{forced:true,categories:true});
  for(let i=1;i<=replacements;i++){
    await driver.evaluate(page,()=>resourceReplaceVideo());await ready();
    if(condition==='active'){await control('#pvc-volume-slider',200);await control(i%2?'#pvc-audio-stereo-btn':'#pvc-audio-mono-btn');}
    if(i%step===0){await snapshot(`replace-${i}`);if(!noForced)await snapshot(`replace-${i}-collected`,{forced:true,categories:true});}
  }
  if(condition==='active'){await control('#pvc-volume-slider',100);await control('#pvc-audio-stereo-btn');await control('#pvc-close-popup-btn');}
  await delay(5000);await snapshot('settled',{forced:true,categories:true});
  const collected=samples.filter(sample=>sample.forced&&sample.stage.startsWith('replace-'));
  const half=collected.slice(Math.floor(collected.length/2));
  const slope=key=>half.length>1?Math.round((key(half.at(-1))-key(half[0]))/(replacements/2)*1000)/1000:null;
  const summary={privateSlopeMiBPerReplacementSecondHalf:slope(sample=>sample.privateMiB),heapSlopeMiBPerReplacementSecondHalf:samples[0].heapMiB===null?null:slope(sample=>sample.heapMiB??0),
    peakUncollectedContexts:Math.max(...samples.map(sample=>sample.resources.liveContexts)),peakRunningContexts:Math.max(...samples.map(sample=>sample.resources.runningContexts)),peakDetachedVideos:Math.max(...samples.map(sample=>sample.resources.detachedLiveVideos)),
    final:samples.at(-1).resources,graphBindingsMissing:condition==='active'?samples.at(-1).resources.videosCreated-samples.at(-1).resources.sourcesCreated:null};
  fs.writeFileSync(path.join(dir,`${engine}-${condition}.json`),JSON.stringify({engine,browserVersion:driver.version,condition,minutes,replacements,quick,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..','injected.js'))).digest('hex'),summary,samples},null,2)+'\n');
  process.stdout.write(JSON.stringify({engine,condition,summary})+'\n');
}finally{await driver?.close();await fixture?.close();}})().catch(error=>{process.stderr.write(String(error.stack)+'\n');process.exitCode=1;});
