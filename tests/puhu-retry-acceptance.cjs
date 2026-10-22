// Bounded manual-button acceptance on an explicitly supplied public Puhu page.
// No content URL, title, API key or watch position is saved in the result.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const url=new URL(arg('url')),attempts=Number(arg('attempts')||3);
if(url.protocol!=='https:'||url.hostname!=='puhutv.com'||url.search||url.hash||url.username||url.password||!url.pathname.endsWith('-izle'))throw Error('An explicit public Puhu player page without query is required');
if(![1,2,3].includes(attempts))throw Error('Use one to three manual attempts');
const output=path.join(__dirname,'artifacts','puhu-legacy-retry'),samples=[];
let driver,page;
async function openHud(){
  await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__&&document.querySelector('video')?.readyState>0,'ready Puhu media');
  await driver.evaluate(page,()=>{if(document.querySelector('#pvc-controller-popup')?.style.display!=='block')window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*');});
  await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','open HUD');
  return driver.evaluate(page,()=>{
    const section=document.querySelector('#pvc-section-quality');
    if(section.classList.contains('pvc-section-collapsed'))section.querySelector('.pvc-section-header').click();
    const button=document.querySelector('#pvc-puhu-retry-source-btn'),video=document.querySelector('video');
    return {label:button?.textContent.trim(),hidden:button?.hidden,disabled:button?.disabled,
      displayed:!!button&&button.getBoundingClientRect().width>0,readyState:video?.readyState,dimensions:[video?.videoWidth,video?.videoHeight],
      qualityChoices:document.querySelectorAll('#pvc-dynamic-quality-container button').length};
  });
}
(async()=>{try{
 driver=await createDriver('firefox',arg('browser'),null,{allowWeb:true});await driver.install();page=await driver.open(url.href);
 for(let i=1;i<=attempts;i++){
   const before=await openHud();assert.equal(before.hidden,false);assert.equal(before.displayed,true);assert.equal(before.disabled,false);
   assert.equal(before.label,'🚀 Retry 1080p source');assert.ok(before.qualityChoices>=1);
   await driver.evaluate(page,()=>{
     window.__nokManualRetryMarker=true;window.__nokManualRetryOriginalSource=document.querySelector('video').currentSrc;
     window.__nokManualRetryBubbles=0;window.addEventListener('click',()=>window.__nokManualRetryBubbles++);
     document.querySelector('#pvc-puhu-retry-source-btn').click();
     if(window.__nokManualRetryBubbles!==0)throw Error('HUD click propagated');
   });
   const started=Date.now();let outcome;
   while(Date.now()-started<18000){
     try{
       outcome=await driver.evaluate(page,()=>({reloaded:!window.__nokManualRetryMarker,
         sourceChanged:!!window.__nokManualRetryMarker&&document.querySelector('video')?.currentSrc!==window.__nokManualRetryOriginalSource,
         engine:!!window.__NOK_VIDEO_CONTROLLER_INJECTED__}));
       if(outcome.engine&&(outcome.reloaded||outcome.sourceChanged))break;
     }catch(error){if(!/navigat|realm|context|document|unload/i.test(error.message))throw error;}
     await delay(200);
   }
   assert.ok(outcome?.reloaded||outcome?.sourceChanged,'The requested legacy retry must actually reload or switch source');
   const after=await openHud();assert.equal(after.hidden,false);assert.equal(after.displayed,true);assert.equal(after.disabled,false);
   const sample={attempt:i,before,outcome,after};samples.push(sample);
   process.stdout.write(JSON.stringify(sample)+'\n');
 }
 await driver.evaluate(page,async()=>{await document.querySelector('video').play();});await delay(5000);
 const final=await driver.evaluate(page,()=>{const video=document.querySelector('video');return {dimensions:[video.videoWidth,video.videoHeight],readyState:video.readyState,paused:video.paused};});
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify({extensionVersion:JSON.parse(fs.readFileSync(path.join(__dirname,'..','manifest.json'))).version,
   browserVersion:driver.version,installedExtension:true,manualAttempts:attempts,samples,final,
   limitation:'Button visibility, isolated click and repeatability are verified; reload/source change is not proof of higher decoded quality'},null,2)+'\n');
}finally{await driver?.close();}})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
