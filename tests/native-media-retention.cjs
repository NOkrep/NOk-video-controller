// Matched native-media control: same fixture/replacement/collection, no extension installed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createFixture}=require('./resource-fixture.cjs'),{createDriver,until,delay}=require('./resource-driver.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const engine=arg('engine'),executable=arg('browser'),packages=arg('packages'),label=arg('label')||'current';
if(!engine||!executable||!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Provide --engine, --browser and safe --label');
const dir=path.join(__dirname,'artifacts',`native-media-${engine}-${label}`),samples=[];
let driver,fixture,page;
(async()=>{try{
  fixture=await createFixture();driver=await createDriver(engine,executable,packages,{memoryControls:true});
  page=await driver.open(fixture.url);
  const ready=()=>until(driver,page,()=>document.querySelector('video')?.readyState>=2,'native decoded A/V file');
  const snapshot=async stage=>{
    const collection=await driver.gc(page),metrics=await driver.memory(page);
    const resources=await driver.evaluate(page,()=>resourceSnapshot()),categories=await driver.memoryCategories(page);
    assert.equal(resources.liveVideos,1);assert.equal(resources.detachedLiveVideos,0);assert.equal(resources.liveContexts,0);
    assert.equal(resources.hudCount,0);assert.equal(await driver.evaluate(page,()=>!!window.__NOK_VIDEO_CONTROLLER_INJECTED__),false);
    samples.push({stage,collection,...metrics,categories,resources});
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'progress.json'),JSON.stringify(samples,null,2)+'\n');
    process.stdout.write(JSON.stringify({stage,privateMiB:Math.round(metrics.process.privateBytes/1048576)})+'\n');
  };
  await ready();await delay(1500);await snapshot('native-warmed');
  for(let i=1;i<=20;i++){
    await driver.evaluate(page,()=>resourceReplaceVideo());await ready();
    if(i%5===0)await snapshot('replace-native-video-'+i);
  }
  await delay(5000);await snapshot('native-settled');
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({engine,browserVersion:driver.version,label,
    actualInstalledExtension:false,synthetic:true,instrumented:true,samples,
    limitations:['Separate test profile and timing, not an exactly paired subtraction',
      'Same media replacement and GC helpers as installed-extension experiment; no HUD/boost/mono',
      'Process private bytes, reporter allocations and JS heap describe different accounting scopes']},null,2)+'\n');
}finally{await driver?.close();await fixture?.close();}})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
