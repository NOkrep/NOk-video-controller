// Installed extension in disposable visible profiles; only synthetic media/comments and numerical evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {createFixture}=require('./resource-fixture.cjs'),{createDriver,until,delay}=require('./resource-driver.cjs');
const {instrumentReportSource,installReportProbe}=require('./report-probe.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const label=arg('label')||'baseline',plain=process.argv.includes('--plain');
if(!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Invalid evidence label');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'artifacts','reports-'+label);
const engines=arg('engine')==='both'?['firefox','chromium']:[arg('engine')||'firefox'];
const source=fs.readFileSync(path.join(root,'injected.js'),'utf8'),sourceSha256=crypto.createHash('sha256').update(source).digest('hex');
const styleSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'injected.css'))).digest('hex');
const extensionVersion=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).version;
fs.mkdirSync(dir,{recursive:true});
const extensionRoot=plain?root:path.join(dir,'instrumented-extension');
if(!plain){
  for(const file of ['manifest.json','background.js','content.js','frame-protocol.js','early-hooks.js','injected.css',
    'icons/icon16.png','icons/icon32.png','icons/icon48.png','icons/icon128.png','icons/filmdeck-logo.png','icons/nok-logo.svg',
    '_locales/en/messages.json','_locales/tr/messages.json']){
    const target=path.join(extensionRoot,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
  }
  fs.writeFileSync(path.join(extensionRoot,'injected.js'),instrumentReportSource(source.replace(/\r\n/g,'\n')));
}
function summarize(values){const sorted=[...values].sort((a,b)=>a-b);return{count:sorted.length,medianMs:sorted[Math.floor(sorted.length/2)]??null,
  p95Ms:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]??null,maxMs:sorted.at(-1)??null,totalMs:sorted.reduce((a,b)=>a+b,0)};}
async function run(engine){
  let fixture,driver,page;const windows=[],operations=[];
  try{
    fixture=await createFixture({height:1080,displayWidth:1600});
    driver=await createDriver(engine,engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      path.join(root,'node_modules'),{visible:true,viewport:{width:1920,height:1080},toolbarControls:true,memoryControls:true,extensionRoot});
    await driver.install();page=await driver.open(fixture.url);await driver.activate(page);
    await until(driver,page,()=>document.querySelector('video')?.readyState>=2&&window.__NOK_VIDEO_CONTROLLER_ENGINE_READY__,'playing installed fixture');
    if(plain)await driver.evaluate(page,installReportProbe);
    // A stable synthetic document to exercise discovery cost; no account/site content.
    await driver.evaluate(page,()=>{const root=document.createElement('section');for(let i=0;i<4000;i++){const el=document.createElement('span');el.textContent='Fixture';root.appendChild(el);}document.body.appendChild(root);});
    await driver.toolbar(page);await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','HUD');
    await driver.evaluate(page,()=>{document.querySelector('#pvc-a11y-keepVisible').click();});await delay(2000);
    const reset=phase=>driver.evaluate(page,phase=>window.__nokReportProbe.reset(phase),phase);
    const snapshot=()=>driver.evaluate(page,()=>{const p=window.__nokReportProbe;return{functions:p.functions,inputs:p.inputs,previewWrites:p.previewWrites};});
    const open=async()=>{
      const ms=await driver.evaluate(page,async plain=>{const start=performance.now();document.querySelector('#pvc-report-err-btn').click();
        if(!document.querySelector('#pvc-modal-code-block')?.textContent)throw Error('Empty report');
        if(plain)window.__nokReportProbe.roots.push(new WeakRef(document.querySelector('#pvc-error-modal')));
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return performance.now()-start;},plain);return ms;
    };
    const close=()=>driver.evaluate(page,()=>document.querySelector('#pvc-close-modal-btn').click());
    async function measure(stage){
      await delay(1000);
      const [processWindow,videoWindow]=await Promise.all([driver.performance(5),driver.evaluate(page,async()=>{
        const video=document.querySelector('video'),before=video.getVideoPlaybackQuality(),start=performance.now(),time=video.currentTime;
        const gaps=[];let previous=start;
        await new Promise(resolve=>{const tick=now=>{gaps.push(now-previous);previous=now;if(now-start>=6000)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});
        const after=video.getVideoPlaybackQuality();return{seconds:(performance.now()-start)/1000,frames:after.totalVideoFrames-before.totalVideoFrames,
          drops:after.droppedVideoFrames-before.droppedVideoFrames,mediaProgress:(video.currentTime-time+video.duration)%video.duration,
          paused:video.paused,readyState:video.readyState,visibility:document.visibilityState,decoded:[video.videoWidth,video.videoHeight],gaps,
          backdrop:document.querySelector('#pvc-error-modal')?getComputedStyle(document.querySelector('#pvc-error-modal')).backdropFilter:null};
      })]);
      const {gaps,...video}=videoWindow;
      const sample={stage,processWindow,video:{...video,frameOpportunities:summarize(gaps)}};windows.push(sample);
      fs.writeFileSync(path.join(dir,engine+'-progress.json'),JSON.stringify({windows,operations},null,2)+'\n');
      console.log(JSON.stringify({engine,stage,cpu:processWindow.cpuCoreEquivalent,stable:processWindow.processSetStable,gpu:processWindow.gpuStatus,drops:video.drops,frames:video.frames}));
      assert.ok(!video.paused&&video.visibility==='visible'&&video.readyState>=2&&video.frames>90,'Comparable video window required');
    }
    await measure('hud-only');
    await reset('cold-open');operations.push({stage:'cold-open',frameOpportunityMs:await open(),probe:await snapshot()});
    await measure('report-idle');
    if(process.argv.includes('--compare-blur')){
      const original=await driver.evaluate(page,()=>getComputedStyle(document.querySelector('#pvc-error-modal')).backdropFilter);
      const alternate=original==='none'?'blur(6px)':'none';
      await driver.evaluate(page,value=>document.querySelector('#pvc-error-modal').style.setProperty('backdrop-filter',value,'important'),alternate);
      await measure(alternate==='none'?'report-idle-no-blur':'report-idle-forced-blur');
      await driver.evaluate(page,()=>document.querySelector('#pvc-error-modal').style.removeProperty('backdrop-filter'));
      await measure('report-idle-original-return');
    }
    await driver.evaluate(page,()=>{const checkbox=document.querySelector('#pvc-include-comment');checkbox.click();const input=document.querySelector('#pvc-user-feedback-input');input.scrollIntoView({block:'center'});input.focus();});
    for(const nearLimit of [false,true]){
      await driver.evaluate(page,near=>{const input=document.querySelector('#pvc-user-feedback-input');input.value=near?'s'.repeat(3900):'';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();},nearLimit);
      await reset(nearLimit?'typing-long':'typing-short');
      await driver.type(page,'Synthetic report text for timing only. No personal data.');await delay(100);
      operations.push({stage:nearLimit?'typing-long':'typing-short',probe:await snapshot()});
      assert.ok(await driver.evaluate(page,()=>JSON.parse(document.querySelector('#pvc-modal-code-block').textContent).userComments===document.querySelector('#pvc-user-feedback-input').value),'Preview follows synthetic input');
    }
    await close();await reset('warm-open');const opens=[];
    for(let index=0;index<5;index++){opens.push(await open());await close();}
    operations.push({stage:'warm-open',frameOpportunity:summarize(opens),probe:await snapshot()});
    const resources=[];
    for(const cycles of [0,10,20]){
      if(cycles)for(let index=0;index<10;index++){await open();await close();}
      const gc=await driver.gc(page);await delay(100);
      const held=await driver.evaluate(page,()=>{const p=window.__nokReportProbe;return{reportElements:document.querySelectorAll('#pvc-error-modal').length,
        liveReportRoots:p.roots.filter(ref=>ref.deref()).length,liveDetachedReportRoots:p.roots.filter(ref=>{const node=ref.deref();return node&&!node.isConnected;}).length,
        liveReportListenerTargets:p.listeners.filter(ref=>ref.deref()).length,domNodes:document.querySelectorAll('*').length};});
      const memory=await driver.memory(page);resources.push({cycles,gc,held,memory});
    }
    await measure('after-cycles');
    for(const sample of resources){
      assert.equal(sample.held.reportElements,0,'closed report removed from document');
      assert.ok(sample.held.liveReportRoots<=resources[0].held.liveReportRoots,'no accumulating report roots in this cycle test');
      assert.ok(sample.held.liveReportListenerTargets<=resources[0].held.liveReportListenerTargets,'no accumulating report listener targets');
      assert.equal(sample.held.domNodes,resources[0].held.domNodes,'stable connected document after cycles');
    }
    const result={engine,browserVersion:driver.version,extensionVersion,sourceSha256,styleSha256,instrumented:!plain,visible:true,synthetic:true,windows,operations,resources};
    for(const op of operations){op.functionSummary=Object.fromEntries(Object.entries(op.probe?.functions||{}).map(([key,values])=>[key,summarize(values)]));
      if(op.probe){op.inputFrameOpportunity=summarize(op.probe.inputs.map(v=>v.ms));op.trustedInputCount=op.probe.inputs.filter(v=>v.trusted).length;}}
    fs.writeFileSync(path.join(dir,engine+'-result.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({engine,result:'measured',resources:resources.map(r=>({cycles:r.cycles,...r.held}))}));
  }finally{await driver?.close();await fixture?.close();}
}
(async()=>{for(const engine of engines)await run(engine);})().catch(error=>{console.error(String(error.message).slice(0,400));process.exitCode=1;});
