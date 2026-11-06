// Cost of the panel's motion, the ad watch after a press and wider decorative candidates.
// Installed extension in disposable visible profiles; synthetic media or, with --url-file, tick timing only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createFixture}=require('./resource-fixture.cjs'),{createDriver,until,delay}=require('./resource-driver.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const label=arg('label')||'baseline',urlFile=arg('url-file');
if(!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Invalid evidence label');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'artifacts','animation-'+label),extensionRoot=path.join(dir,'instrumented-extension');
const engines=arg('engine')==='both'?['firefox','chromium']:[arg('engine')||'firefox'];
const binaries={firefox:'C:/Program Files/Mozilla Firefox/firefox.exe',chromium:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'};
const TICK_BODY=/const selection = findVideoAndPlayer\(\);\s+adLifecycle\.tick\(selection, hasSelectedAdMarker\(selection\.video\)\);/;

// Only this test copy times the ad watch; production stays free of probes.
function prepareExtension(){
  const source=fs.readFileSync(path.join(root,'injected.js'),'utf8');
  if(!TICK_BODY.test(source))throw Error('Ad watch body changed; update the probe');
  for(const file of ['manifest.json','background.js','content.js','frame-protocol.js','early-hooks.js','injected.css',
    'icons/icon16.png','icons/icon32.png','icons/icon48.png','icons/icon128.png','icons/filmdeck-logo.png','icons/nok-logo.svg',
    '_locales/en/messages.json','_locales/tr/messages.json']){
    const target=path.join(extensionRoot,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
  }
  fs.writeFileSync(path.join(extensionRoot,'injected.js'),source.replace(TICK_BODY,
    body=>`const __tickStart = performance.now(); ${body} (window.__nokAdTicks ||= []).push(performance.now() - __tickStart);`));
  return crypto.createHash('sha256').update(source).digest('hex');
}
// Mean of this browser's 3D engine samples; not the whole device's GPU use.
const mean3d=window=>{const rows=(window.gpuSamples||[]).map(row=>Number(row.engines?.['3D'])||0);return rows.length?Math.round(rows.reduce((a,b)=>a+b,0)/rows.length*10)/10:null;};
const summarize=values=>{const sorted=[...values].sort((a,b)=>a-b);return{count:sorted.length,medianMs:sorted[Math.floor(sorted.length/2)]??null,
  p95Ms:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]??null,maxMs:sorted.at(-1)??null,totalMs:sorted.reduce((a,b)=>a+b,0)};};

async function measureSite(driver,engine,url){
  const page=await driver.open(url);await driver.activate(page);await delay(8000);
  const hasVideo=await driver.evaluate(page,()=>!!document.querySelector('video'));
  await driver.toolbar(page);await delay(1000);await driver.toolbar(page);await delay(1000);
  await driver.evaluate(page,()=>{window.__nokAdTicks=[];});await delay(30000);
  const ticks=await driver.evaluate(page,()=>({values:window.__nokAdTicks,nodes:document.querySelectorAll('*').length}));
  const result={engine,browserVersion:driver.version,hasVideo,domNodes:ticks.nodes,tick:summarize(ticks.values)};
  console.log(JSON.stringify(result));return result; // No address, title or page text is read or printed.
}

async function measureFixture(driver,engine,fixture){
  const windows=[];let page;
  const measure=async(stage,during)=>{
    await delay(1000);
    await driver.evaluate(page,()=>{window.__nokAdTicks=[];});
    const stop={now:false},work=during?during(stop):null;
    const [processWindow,video]=await Promise.all([driver.performance(5),driver.evaluate(page,async()=>{
      const video=document.querySelector('video'),before=video.getVideoPlaybackQuality(),start=performance.now();
      const gaps=[];let previous=start;
      await new Promise(resolve=>{const tick=now=>{gaps.push(now-previous);previous=now;if(now-start>=6000)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});
      const after=video.getVideoPlaybackQuality();
      return{frames:after.totalVideoFrames-before.totalVideoFrames,drops:after.droppedVideoFrames-before.droppedVideoFrames,paused:video.paused,
        visibility:document.visibilityState,gaps,ticks:window.__nokAdTicks||[]};
    })]);
    stop.now=true;await work;
    const decorated=await driver.evaluate(page,()=>{const node=document.querySelector('#pvc-controller-popup .pvc-switch-track');return node?getComputedStyle(node).animationName:null;});
    const sample={stage,decorated,processWindow,frames:video.frames,drops:video.drops,comparable:!video.paused&&video.visibility==='visible'&&video.frames>90,
      frameOpportunity:summarize(video.gaps),adTick:summarize(video.ticks)};
    windows.push(sample);
    console.log(JSON.stringify({engine,stage,cpu:processWindow.cpuCoreEquivalent,stable:processWindow.processSetStable,gpu3d:mean3d(processWindow),
      drops:video.drops,frames:video.frames,rafP95:Math.round(sample.frameOpportunity.p95Ms*10)/10,ticks:video.ticks.length,tickP95:sample.adTick.p95Ms,decorated,comparable:sample.comparable}));
  };
  const repeat=(fn,ms)=>driver.evaluate(page,(source,ms)=>{window.__nokMotion=setInterval(new Function(source),ms);},`(${fn})()`,ms);
  const endRepeat=()=>driver.evaluate(page,()=>clearInterval(window.__nokMotion));
  const testCss=css=>driver.evaluate(page,css=>{let style=document.getElementById('nok-test-motion');if(!style){style=document.createElement('style');style.id='nok-test-motion';document.head.appendChild(style);}style.textContent=css;},css);

  page=await driver.open(fixture.url);await driver.activate(page);
  await until(driver,page,()=>document.querySelector('video')?.readyState>=2&&window.__NOK_VIDEO_CONTROLLER_ENGINE_READY__,'playing fixture');
  // The same stable synthetic document as the report benchmark, to exercise discovery cost.
  await driver.evaluate(page,()=>{const root=document.createElement('section');for(let i=0;i<4000;i++){const el=document.createElement('span');el.textContent='Fixture';root.appendChild(el);}document.body.appendChild(root);});
  await delay(2000);
  await measure('unpressed');
  await driver.toolbar(page);await delay(500);await driver.toolbar(page);
  await measure('pressed-panel-closed');
  await driver.toolbar(page);await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','HUD');
  await driver.evaluate(page,()=>{document.querySelector('#pvc-a11y-keepVisible').click();});
  await measure('panel-open');
  // Filters: what the notice's "yes" would remove.
  await driver.evaluate(page,()=>{for(const [id,value] of [['brightness',115],['contrast',110],['saturate',120]]){const input=document.querySelector('#pvc-filter-'+id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}});
  await measure('panel-three-filters');
  await driver.evaluate(page,()=>{for(const id of ['brightness','contrast','saturate']){const input=document.querySelector('#pvc-filter-'+id);input.value=100;input.dispatchEvent(new Event('input',{bubbles:true}));}});
  // Report: idle, then every animated control exercised repeatedly by page clicks and a real pointer.
  await driver.pointerClick(page,'#pvc-tab-settings');await driver.pointerClick(page,'#pvc-report-err-btn');
  await until(driver,page,()=>!!document.querySelector('#pvc-modal-code-block')?.textContent,'report');
  await measure('report-idle');
  await repeat(()=>{const modal=document.querySelector('#pvc-error-modal'),note=modal.querySelector('#pvc-user-feedback-input');
    window.__nokStep=(window.__nokStep||0)+1;modal.querySelector('#pvc-request-deletion').click();
    if(window.__nokStep%2)modal.querySelector('#pvc-include-comment').checked||modal.querySelector('#pvc-include-comment').click();
    if(!note.disabled){if(window.__nokStep%2)note.focus();else note.blur();}},400);
  await measure('report-animating',async stop=>{const targets=['#pvc-include-site','#pvc-request-deletion'];let at=0;
    while(!stop.now){await driver.hover(page,targets[at++%2]).catch(()=>{});await delay(300);}});
  await endRepeat();
  await driver.evaluate(page,()=>{const input=document.querySelector('#pvc-user-feedback-input');input.value='';document.querySelector('#pvc-close-modal-btn').click();});
  // Wider candidates, applied by this test only: the source's slower switch with glow, then continuous decoration.
  await repeat(()=>{document.querySelector('#pvc-a11y-keepVisible').click();},400);
  await measure('switch-current');
  await testCss(`#pvc-controller-popup .pvc-switch-track,#pvc-controller-popup .pvc-switch-track::before{transition:all .4s cubic-bezier(.23,1,.32,1)!important}
    #pvc-controller-popup .pvc-switch input:checked+.pvc-switch-track{box-shadow:0 0 20px var(--pvc-accent)!important}`);
  await measure('switch-source-glow');
  await testCss(`@keyframes nok-test-glow{from{box-shadow:0 0 2px var(--pvc-accent)}to{box-shadow:0 0 20px var(--pvc-accent)}}
    #pvc-controller-popup :is(.pvc-raised-button,.pvc-switch-track){animation:nok-test-glow 1s ease-in-out infinite alternate!important}`);
  await measure('continuous-glow');
  await testCss('');await endRepeat();
  await driver.evaluate(page,()=>{const keep=document.querySelector('#pvc-a11y-keepVisible');if(!keep.checked)keep.click();document.querySelector('#pvc-a11y-reduceMotion').click();});
  await measure('panel-reduced-motion');
  await driver.evaluate(page,()=>document.querySelector('#pvc-a11y-reduceMotion').click());
  await measure('panel-open-return');
  return{engine,browserVersion:driver.version,windows};
}

async function run(engine,sourceSha256){
  let fixture,driver;
  try{
    if(!urlFile)fixture=await createFixture({height:1080,displayWidth:1600});
    driver=await createDriver(engine,binaries[engine],path.join(root,'node_modules'),{visible:true,viewport:{width:1920,height:1080},toolbarControls:true,extensionRoot,allowWeb:!!urlFile});
    await driver.install();
    const result=urlFile?await measureSite(driver,engine,fs.readFileSync(urlFile,'utf8').trim()):await measureFixture(driver,engine,fixture);
    const out=path.join(dir,`${engine}${urlFile?'-site':''}-result.json`);
    fs.writeFileSync(out,JSON.stringify({...result,sourceSha256,styleSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'injected.css'))).digest('hex'),
      version:JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).version},null,2)+'\n');
  }finally{await driver?.close();await fixture?.close();}
}
(async()=>{fs.mkdirSync(dir,{recursive:true});const sha=prepareExtension();for(const engine of engines)await run(engine,sha);})()
  .catch(error=>{console.error(String(error.message).slice(0,400));process.exitCode=1;});
