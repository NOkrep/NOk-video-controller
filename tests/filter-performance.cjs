// Local synthetic media and real installed extension. No profile, URL or GPU identity export.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {createFixture}=require('./resource-fixture.cjs'),{createDriver,until,delay}=require('./resource-driver.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const engine=arg('engine'),executable=arg('browser'),packages=arg('packages'),label=arg('label')||'v072';
if(!engine||!executable||!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Provide --engine, --browser and safe --label');
const dir=path.join(__dirname,'artifacts',`filters-${engine}-${label}`),samples=[];
const sourceSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..','injected.js'))).digest('hex');
const extensionVersion=JSON.parse(fs.readFileSync(path.join(__dirname,'..','manifest.json'))).version;
const focus=process.argv.includes('--focus');
let driver,fixture,page;
const control=(selector,value)=>driver.evaluate(page,(selector,value,click)=>{
  const node=document.querySelector(selector);if(!node)throw Error('Missing '+selector);
  if(click)node.click();else{node.value=String(value);node.dispatchEvent(new Event('input',{bubbles:true}));}
},selector,value??null,value===undefined);
async function measure(stage,drag=false){
  await delay(1500);
  // Counters start inside the page, so process-launch latency is not attributed to frames.
  const [processWindow,videoWindow]=await Promise.all([driver.performance(5),driver.evaluate(page,async(drag)=>{
    const video=document.querySelector('video'),before=video.getVideoPlaybackQuality(),start=performance.now();
    const metrics={styleWrites:0,videoRectReads:0,inputEvents:0,animationFrames:0};
    const original=HTMLVideoElement.prototype.getBoundingClientRect;
    HTMLVideoElement.prototype.getBoundingClientRect=function(...args){metrics.videoRectReads++;return Reflect.apply(original,this,args);};
    const observer=new MutationObserver(records=>{metrics.styleWrites+=records.length;});
    observer.observe(video,{attributes:true,attributeFilter:['style']});
    try{
      await new Promise(resolve=>{
        function tick(now){
          metrics.animationFrames++;
          if(drag){const slider=document.querySelector('#pvc-filter-brightness');slider.value=String(90+(metrics.inputEvents%9)*5);slider.dispatchEvent(new Event('input',{bubbles:true}));metrics.inputEvents++;}
          if(now-start>=5000)resolve();else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      const after=video.getVideoPlaybackQuality();
      return {seconds:(performance.now()-start)/1000,totalFrames:after.totalVideoFrames-before.totalVideoFrames,
        droppedFrames:after.droppedVideoFrames-before.droppedVideoFrames,paused:video.paused,readyState:video.readyState,
        decoded:[video.videoWidth,video.videoHeight],viewport:[innerWidth,innerHeight],filter:video.style.filter,...metrics};
    }finally{observer.disconnect();HTMLVideoElement.prototype.getBoundingClientRect=original;}
  },drag)]);
  assert.equal(videoWindow.paused,false);assert.deepEqual(videoWindow.decoded,[1920,1080]);
  assert.ok(videoWindow.totalFrames>=90,'Playback must advance during measurement');
  const sample={stage,processWindow,videoWindow};samples.push(sample);
  fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'progress.json'),JSON.stringify(samples,null,2)+'\n');
  process.stdout.write(JSON.stringify({stage,cpuCores:processWindow.cpuCoreEquivalent,gpu:processWindow.gpuStatus,
    frames:videoWindow.totalFrames,dropped:videoWindow.droppedFrames,rectReads:videoWindow.videoRectReads,styleWrites:videoWindow.styleWrites})+'\n');
}
async function show(){
  if(!await driver.evaluate(page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block'))await control('#open');
  await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','HUD');
  await control('#pvc-tab-settings');
  await driver.evaluate(page,()=>{const node=document.querySelector('#pvc-a11y-keepVisible');if(!node.checked)node.click();});
}
(async()=>{try{
  fixture=await createFixture({height:1080,displayWidth:1600});
  driver=await createDriver(engine,executable,packages,{viewport:{width:1920,height:1080}});
  page=await driver.open(fixture.url);
  await until(driver,page,()=>document.querySelector('video')?.readyState>=2,'video decoded');await delay(2000);
  if(!focus)await measure('without-extension');
  await driver.install();await driver.reload(page);
  await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__&&document.querySelector('video')?.readyState>=2,'installed engine');
  if(!focus)await measure('installed-never-opened');
  for(let round=1;round<=2;round++){
    await show();await control('#pvc-btn-reset-filters');await control('#pvc-close-popup-btn');
    await measure('neutral-closed-'+round);
    if(!focus){
      await show();await control('#pvc-filter-brightness',115);await control('#pvc-filter-contrast',110);await control('#pvc-filter-saturate',120);
      await control('#pvc-close-popup-btn');await measure('three-filters-closed-'+round);
      await show();await control('#pvc-btn-night-shield');await control('#pvc-btn-invert-color');await control('#pvc-close-popup-btn');
      await measure('full-chain-closed-'+round);
    }
    await show();await control('#pvc-btn-reset-filters');await measure('neutral-open-'+round);
    await measure('brightness-drag-open-'+round,true);
    await control('#pvc-btn-reset-filters');await control('#pvc-close-popup-btn');await measure('neutral-return-'+round);
  }
  const result={engine,browserVersion:driver.version,extensionVersion,
    sourceSha256,actualInstalledExtension:true,headless:true,synthetic:true,gpuMode:await driver.gpuMode(page),samples,
    limitations:['One machine and synthetic VP8/Opus 1080p30, not site compatibility',
      'CPU core-equivalent is CPU seconds / elapsed seconds across owned browser processes, not whole-PC percentage',
      'GPU counters are per-engine sums, not overall GPU utilization; absent counters do not mean zero load',
      'CPU and page frame windows overlap but differ in start and actual duration; no GC during windows',
      'Headless rendering may not represent a visible desktop browser; no hardware efficiency claim']};
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2)+'\n');
}finally{await driver?.close();await fixture?.close();}})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
