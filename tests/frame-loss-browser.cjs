// Sustained frame loss: the notice, its answers and its limits, on a page and through a cross-origin player frame.
// The browser's frame counters are replaced in the page so the loss is exact; the media itself is a real playing stream.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const LOSS_MS=20000; // Four 3 s windows, one tick for the baseline and room for a slow runner.
const mediaHtml=`<!doctype html><meta charset="utf-8"><style>video{width:640px;height:360px}</style><video autoplay muted playsinline></video><script>
const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
const video=document.querySelector('video');video.srcObject=canvas.captureStream(10);video.play().catch(()=>{});
window.__frames={total:0,dropped:0,loss:0,reads:0};setInterval(()=>{window.__frames.total+=2;window.__frames.dropped+=2*window.__frames.loss;},83);
video.getVideoPlaybackQuality=()=>{window.__frames.reads++;return{totalVideoFrames:window.__frames.total,droppedVideoFrames:window.__frames.dropped};};
</script>`;
const notice=()=>document.getElementById('pvc-frame-loss-notice')?.style.display;
const noticeText=()=>document.getElementById('pvc-frame-loss-text').textContent;
const setLoss=(driver,frame,loss)=>driver.evaluate(frame,loss=>{window.__frames.loss=loss;},loss);
const waitFor=async(driver,page,fn,label)=>{const deadline=Date.now()+LOSS_MS;while(Date.now()<deadline){if(await driver.evaluate(page,fn))return;await delay(200);}throw Error('Timeout: '+label);};
(async()=>{let driver;
const media=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(mediaHtml);});
const parent=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<!doctype html><iframe style="width:700px;height:420px" allow="autoplay" src="http://127.0.0.1:${media.address().port}/"></iframe>`);});
try{
  await new Promise(resolve=>media.listen(0,'127.0.0.1',resolve));
  await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true});
  await driver.install();
  const open=async embedded=>{
    const top=await driver.open(`http://127.0.0.1:${(embedded?parent:media).address().port}/`);
    let owner=top;
    if(embedded){
      for(let attempt=0;attempt<60&&owner===top;attempt++){
        for(const frame of await driver.frames(top))if(await driver.evaluate(frame.target,()=>!!document.querySelector('video')))owner=frame.target;
        if(owner===top)await delay(100);
      }
      assert.notEqual(owner,top,'cross-origin child owns the media');
    }
    await until(driver,owner,()=>document.querySelector('video')?.readyState>=2,'video plays');
    await driver.toolbar(top);
    await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel opens');
    // The panel starts from the operating system's setting, which a CI machine may have on.
    await driver.evaluate(top,()=>{const box=document.getElementById('pvc-a11y-reduceMotion');if(box.checked)box.click();});
    return{top,owner};
  };
  const results=[];

  // Closed after the press: the ad watch runs but the frame counters are not read.
  {
    const {top,owner}=await open(false);
    await driver.evaluate(top,()=>document.getElementById('pvc-close-popup-btn').click());
    await delay(1000);
    await driver.evaluate(owner,()=>{window.__frames.reads=0;window.__frames.loss=.5;});
    await delay(4000);
    assert.equal(await driver.evaluate(owner,()=>window.__frames.reads),0,'a closed panel reads nothing');
    assert.equal(await driver.evaluate(top,notice),'none');
    results.push('closed panel reads nothing');
  }

  for(const embedded of [false,true]){
    const {top,owner}=await open(embedded);
    await driver.evaluate(top,()=>document.getElementById('pvc-a11y-keepVisible').click());
    await delay(1500);
    // Healthy playback never asks; light loss neither.
    await setLoss(driver,owner,.05);
    await delay(13000);
    assert.equal(await driver.evaluate(top,notice),'none','normal loss does not ask');
    await setLoss(driver,owner,.3);
    await waitFor(driver,top,()=>document.getElementById('pvc-frame-loss-notice').style.display==='block','sustained loss asks');
    assert.match(await driver.evaluate(top,noticeText),/dropping frames/,'English by default');
    assert.equal(await driver.evaluate(top,()=>document.getElementById('pvc-a11y-reduceMotion').checked),false,'asking changes nothing');
    const panelBox=await driver.evaluate(top,()=>{const r=document.getElementById('pvc-controller-popup').getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:innerHeight};});
    assert.ok(panelBox.top>=0&&panelBox.bottom<=panelBox.height,'the taller panel stays on screen');
    // No is final for this page.
    await driver.pointerClick(top,'#pvc-frame-loss-no');
    await until(driver,top,()=>document.getElementById('pvc-frame-loss-notice').style.display==='none','no closes it');
    await delay(14000);
    assert.equal(await driver.evaluate(top,notice),'none','no is not asked again');
    assert.equal(await driver.evaluate(top,()=>document.getElementById('pvc-a11y-reduceMotion').checked),false,'no changes nothing');
    await driver.evaluate(top,()=>{document.getElementById('pvc-close-popup-btn').click();});

    // Yes uses the existing setting, resets filters in the frame that owns the media, and says so first.
    const next=await open(embedded);
    await driver.evaluate(next.top,()=>{document.getElementById('pvc-a11y-keepVisible').click();
      const slider=document.getElementById('pvc-filter-brightness');slider.value='120';slider.dispatchEvent(new Event('input',{bubbles:true}));});
    await until(driver,next.owner,()=>document.querySelector('video').style.filter.includes('brightness'),'filter reaches the media');
    await delay(1000);
    await setLoss(driver,next.owner,.3);
    await waitFor(driver,next.top,()=>document.getElementById('pvc-frame-loss-notice').style.display==='block','asks again on a new page');
    assert.match(await driver.evaluate(next.top,noticeText),/animations.*filters/,'names both changes');
    const select=()=>{const language=document.querySelector('#pvc-language-select');language.value='tr';language.dispatchEvent(new Event('change',{bubbles:true}));return document.getElementById('pvc-frame-loss-text').textContent;};
    assert.match(await driver.evaluate(next.top,select),/kare atlıyor/,'the open question follows the panel language');
    await driver.pointerClick(next.top,'#pvc-frame-loss-yes');
    await until(driver,next.top,()=>document.getElementById('pvc-frame-loss-notice').style.display==='none','yes closes it');
    await until(driver,next.owner,()=>document.querySelector('video').style.filter==='','filters reset on the media');
    assert.equal(await driver.evaluate(next.top,()=>document.getElementById('pvc-a11y-reduceMotion').checked),true,'the settings switch shows it');
    assert.equal(await driver.evaluate(next.top,()=>document.getElementById('pvc-controller-popup').classList.contains('pvc-a11y-reduce-motion')),true);
    results.push({embedded,asked:true,no:'final',yes:'applied'});
  }
  console.log(JSON.stringify({engine,browserVersion:driver.version,results,result:'passed'}));
}finally{try{await driver?.close();}finally{for(const host of [parent,media]){host.closeAllConnections();await new Promise(resolve=>host.close(resolve));}}}})().catch(error=>{console.error(error);process.exitCode=1;});
