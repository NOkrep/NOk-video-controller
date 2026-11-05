// Real Video.js/VHS playback with the player's own ad marker: entry and full restoration, top page and cross-origin iframe.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until}=require('./resource-driver.cjs');
const {serveLibraryAsset,libraryHtml}=require('./library-fixtures.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
(async()=>{let driver;const media=http.createServer((req,res)=>{
  if(serveLibraryAsset(req,res,{committedHls:true}))return;
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(libraryHtml('videojs'));
});
const parent=http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<iframe style="width:850px;height:550px" allow="autoplay" src="http://127.0.0.1:${media.address().port}/"></iframe>`);
});
const setSlider=(driver,page,id,value)=>driver.evaluate(page,(id,value)=>{const slider=document.getElementById(id);slider.value=String(value);slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));},id,value);
try{
  await new Promise(resolve=>media.listen(0,'127.0.0.1',resolve));
  await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true});
  await driver.install();const results=[];
  for(const embedded of [false,true]){
    const top=await driver.open(`http://127.0.0.1:${(embedded?parent:media).address().port}/`);
    let owner=top;
    if(embedded){
      for(let attempt=0;attempt<60&&owner===top;attempt++){
        for(const frame of await driver.frames(top))if(await driver.evaluate(frame.target,()=>!!document.querySelector('video')))owner=frame.target;
        if(owner===top)await new Promise(resolve=>setTimeout(resolve,100));
      }
      assert.notEqual(owner,top,'cross-origin child owns the media');
    }
    await until(driver,owner,()=>document.querySelector('video')?.readyState>=2,'Video.js decodes');
    // The fixture lasts 12 seconds; at 16x it would end during the ad without a loop.
    await driver.evaluate(owner,()=>{videojs.getAllPlayers()[0].loop(true);const video=document.querySelector('video');video.muted=false;video.volume=.4;video.play().catch(()=>{});return true;});
    // A page can already be in an ad when the panel opens (a pre-roll): the startup watch is running.
    await driver.evaluate(owner,()=>document.querySelector('.video-js').classList.add('vjs-ad-playing'));
    await until(driver,owner,()=>document.querySelector('video').playbackRate===16,'the startup watch handles a pre-roll before the panel opens');
    await driver.toolbar(top);
    await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','toolbar opens');
    await driver.evaluate(top,()=>{document.getElementById('pvc-a11y-keepVisible').click();document.getElementById('pvc-tab-player').click();});
    await until(driver,top,()=>/^1(\.0+)?x/.test(document.getElementById('pvc-hdr-speed-badge').textContent)&&Number(document.getElementById('pvc-speed-slider').value)===1,'a panel opened during an ad shows the user speed');
    await driver.evaluate(owner,()=>document.querySelector('.video-js').classList.remove('vjs-ad-playing'));
    await until(driver,owner,()=>document.querySelector('video').playbackRate===1&&!document.querySelector('video').muted,'pre-roll end restores 1x and sound');
    await until(driver,top,()=>document.getElementById('pvc-volume-slider')?.value==='40','panel opens at the media volume');
    await setSlider(driver,top,'pvc-speed-slider',2);
    await until(driver,owner,()=>document.querySelector('video').playbackRate===2,'panel speed reaches the media');
    await until(driver,owner,()=>videojs.getAllPlayers()[0].qualityLevels().length===3,'three declared levels');
    const enabled=()=>Array.from(videojs.getAllPlayers()[0].qualityLevels()).filter(level=>level.enabled).map(level=>level.height);
    assert.deepEqual((await driver.evaluate(owner,enabled)).length,3);

    await driver.evaluate(owner,()=>document.querySelector('.video-js').classList.add('vjs-ad-playing'));
    await until(driver,owner,()=>document.querySelector('video').playbackRate===16&&document.querySelector('video').muted,'marker requests 16x and mute');
    assert.deepEqual(await driver.evaluate(owner,enabled),[480],'marker selects the lowest real level');
    assert.equal(await driver.evaluate(top,()=>document.getElementById('pvc-volume-slider').value),'40','the temporary ad mute does not replace the panel volume');

    await driver.evaluate(owner,()=>document.querySelector('.video-js').classList.remove('vjs-ad-playing'));
    await until(driver,owner,()=>document.querySelector('video').playbackRate===1&&!document.querySelector('video').muted,'marker removal restores 1x and sound');
    assert.equal((await driver.evaluate(owner,enabled)).length,3,'the prior quality choice returns');
    assert.ok(Math.abs(await driver.evaluate(owner,()=>document.querySelector('video').volume)-.4)<.01,'the prior volume returns');
    await until(driver,top,()=>Number(document.getElementById('pvc-speed-slider').value)===1&&/^1(\.0+)?x/.test(document.getElementById('pvc-hdr-speed-badge').textContent),'the panel shows the restored speed');
    assert.equal(await driver.evaluate(top,()=>document.getElementById('pvc-volume-slider').value),'40','the panel keeps the restored volume');
    results.push({embedded});
  }
  console.log(JSON.stringify({engine,browserVersion:driver.version,results,result:'passed'}));
}finally{try{await driver?.close();}finally{for(const host of [parent,media]){host.closeAllConnections();await new Promise(resolve=>host.close(resolve));}}}})().catch(error=>{console.error(error);process.exitCode=1;});
