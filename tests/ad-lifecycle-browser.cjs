// Real Video.js/VHS playback with the player's own ad marker: entry and full restoration, top page and cross-origin iframe.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const {serveLibraryAsset,libraryHtml}=require('./library-fixtures.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const mediaState=()=>({rate:document.querySelector('video').playbackRate,muted:document.querySelector('video').muted});
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
    // Nothing acts on the page before the first toolbar press, even during an ad.
    await driver.evaluate(owner,()=>document.querySelector('.video-js').classList.add('vjs-ad-playing'));
    await delay(2000);
    assert.deepEqual(await driver.evaluate(owner,mediaState),{rate:1,muted:false},'no ad control before the first toolbar press');
    // The capture that source and quality work depends on must stay at page load, not at the press.
    assert.equal(await driver.evaluate(owner,()=>/\[native code\]/.test(XMLHttpRequest.prototype.open.toString())||/\[native code\]/.test(window.fetch.toString())),false,'network capture is in place before the press');
    await driver.toolbar(top);
    await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','toolbar opens');
    await until(driver,owner,()=>document.querySelector('video').playbackRate===16,'the press handles an ad already running');
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

    // After the press, minimising or closing the panel leaves ad control running on this page.
    const adCycle=async(frame,label)=>{
      await driver.evaluate(frame,()=>document.querySelector('.video-js').classList.add('vjs-ad-playing'));
      await until(driver,frame,()=>document.querySelector('video').playbackRate===16&&document.querySelector('video').muted,`${label}: 16x and mute`);
      await driver.evaluate(frame,()=>document.querySelector('.video-js').classList.remove('vjs-ad-playing'));
      await until(driver,frame,()=>document.querySelector('video').playbackRate===1&&!document.querySelector('video').muted,`${label}: 1x and sound`);
    };
    await driver.evaluate(top,()=>document.getElementById('pvc-collapse-btn').click());
    await adCycle(owner,'minimised panel');
    await driver.evaluate(top,()=>document.getElementById('pvc-collapse-btn').click());
    await driver.evaluate(top,()=>document.getElementById('pvc-close-popup-btn').click());
    assert.equal(await driver.evaluate(top,()=>document.getElementById('pvc-controller-popup').style.display),'none','the panel is closed');
    await adCycle(owner,'closed panel');

    if(embedded){
      // A new document in the frame belongs to the same pressed page.
      await driver.evaluate(top,()=>{const frame=document.querySelector('iframe');frame.src=frame.src+'?next';});
      let next=null;
      for(let attempt=0;attempt<80&&!next;attempt++){
        for(const frame of await driver.frames(top))if(await driver.evaluate(frame.target,()=>location.search==='?next'&&document.querySelector('video')?.readyState>=2).catch(()=>false))next=frame.target;
        if(!next)await delay(100);
      }
      assert.ok(next,'the frame reloads its player');
      await driver.evaluate(next,()=>{videojs.getAllPlayers()[0].loop(true);document.querySelector('video').muted=false;document.querySelector('video').play().catch(()=>{});return true;});
      await adCycle(next,'reloaded frame');
    }

    // A reopened panel shows the real values.
    await driver.toolbar(top);
    await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','toolbar reopens');
    await until(driver,top,()=>Number(document.getElementById('pvc-speed-slider').value)===1,'the reopened panel shows 1x');
    results.push({embedded});
  }
  console.log(JSON.stringify({engine,browserVersion:driver.version,results,result:'passed'}));
}finally{try{await driver?.close();}finally{for(const host of [parent,media]){host.closeAllConnections();await new Promise(resolve=>host.close(resolve));}}}})().catch(error=>{console.error(error);process.exitCode=1;});
