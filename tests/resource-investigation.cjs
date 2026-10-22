// Real installed-extension retention scenarios, local generated A/V file only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {createFixture}=require('./resource-fixture.cjs'),{createDriver,until,delay}=require('./resource-driver.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const engine=arg('engine'),executable=arg('browser'),packages=arg('packages'),label=arg('label')||'current';
const quick=process.argv.includes('--quick'),openCycles=quick?3:30,replacements=quick?3:20;
if(!engine||!executable||!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Provide --engine, --browser and a safe --label.');
const dir=path.join(__dirname,'artifacts','resource-'+engine+'-'+label),samples=[];
const sourceSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..','injected.js'))).digest('hex');
let driver,fixture,page;
const control=async(selector,value)=>driver.evaluate(page,(selector,value,click)=>{
  const node=document.querySelector(selector);if(!node)throw Error('Missing control '+selector);
  if(click)node.click();else{node.value=String(value);node.dispatchEvent(new Event('input',{bubbles:true}));}
},selector,value??null,value===undefined);
(async()=>{try{
  fixture=await createFixture();driver=await createDriver(engine,executable,packages,{memoryControls:true});
  page=await driver.open(fixture.url);
  const ready=()=>until(driver,page,()=>document.querySelector('video')?.readyState>=2,'decoded A/V file');
  const snapshot=async(stage,gc=false)=>{
    const collection=gc?await driver.gc(page):null;
    const metrics=await driver.memory(page),resources=await driver.evaluate(page,()=>resourceSnapshot());
    const categories=process.argv.includes('--categories')?await driver.memoryCategories(page):undefined;
    samples.push({stage,collection,...metrics,categories,resources});
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'progress.json'),JSON.stringify(samples,null,2)+'\n');
    process.stdout.write(JSON.stringify({stage,privateMiB:Math.round(metrics.process.privateBytes/1048576),resources})+'\n');
  };
  await ready();await delay(1500);await snapshot('without-extension');
  await driver.install();await driver.reload(page);await ready();
  await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__,'installed engine');
  await snapshot('installed-never-opened',true);
  await control('#open');await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','open HUD');
  await control('#pvc-volume-slider',100);await snapshot('open-warmed',true);
  for(let i=0;i<openCycles;i++){
    await control('#pvc-close-popup-btn');await control('#open');
    await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','reopened HUD');
    if((i+1)%10===0||i===openCycles-1)await snapshot('native-open-close-'+(i+1),true);
  }
  await control('#pvc-volume-slider',200);await control('#pvc-audio-mono-btn');
  await until(driver,page,()=>resourceSnapshot().sourcesCreated===1,'real audio graph');
  for(let i=0;i<20;i++){
    await control('#pvc-audio-stereo-btn');await control('#pvc-audio-mono-btn');
    await control('#pvc-volume-slider',i%2?150:250);
  }
  await until(driver,page,()=>Math.abs(resourceSnapshot().gainValues.at(-1)-1.5)<.01,'latest rapid gain target');
  await snapshot('boost-mono-same-video',true);
  await driver.evaluate(page,()=>resourceTemporarilyDetachVideo());await ready();
  await until(driver,page,()=>resourceSnapshot().contextStates.at(-1)==='running','reinserted source resumes');
  await snapshot('reinserted-original-video',true);
  assert.equal(samples.at(-1).resources.contextsCreated,1);assert.equal(samples.at(-1).resources.sourcesCreated,1);
  for(let i=0;i<replacements;i++){
    await driver.evaluate(page,()=>resourceReplaceVideo());await ready();
    await control('#pvc-volume-slider',200);await control(i%2?'#pvc-audio-mono-btn':'#pvc-audio-stereo-btn');
    if((i+1)%5===0||i===replacements-1)await snapshot('replace-boosted-video-'+(i+1),true);
  }
  await control('#pvc-volume-slider',100);await control('#pvc-audio-stereo-btn');await control('#pvc-close-popup-btn');
  await delay(5000);await snapshot('closed-settled',true);
  if(process.argv.includes('--probe-suspend')){
    await driver.evaluate(page,()=>resourceSuspendContexts());await snapshot('suspended-context-probe',true);
  }
  const final=samples.at(-1).resources;
  assert.equal(final.domVideos,1);assert.equal(final.hudCount,1);
  assert.equal(samples.find(sample=>sample.stage==='boost-mono-same-video').resources.contextsCreated,1,'one context for repeated controls on one media element');
  if(process.argv.includes('--assert-clean')){
    assert.equal(final.detachedConnectedSources,0,'removed videos must have no live audio connection');
    assert.equal(final.detachedLiveVideos,0,'removed video objects must become collectable');
    assert.equal(final.liveSources,1,'only the current media source remains live after collection');
    assert.equal(final.liveContexts,1,'only the current audio context remains live after collection');
  }
  const result={engine,browserVersion:driver.version,extensionVersion:JSON.parse(fs.readFileSync(path.join(__dirname,'..','manifest.json'))).version,
    actualInstalledExtension:true,synthetic:true,instrumented:true,label,sourceSha256,samples,
    findings:{detachedConnectedSources:final.detachedConnectedSources,detachedLiveVideos:final.detachedLiveVideos},
    limitations:['Forced collection lab scenario, not production RAM prediction','Firefox minimize also pressures caches; CDP GC is a different operation','Heap/node instrumentation includes test code; counts are compared within each run']};
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2)+'\n');
}finally{await driver?.close();await fixture?.close();}})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
