// Installed extension, isolated profiles and local cross-origin synthetic media only.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
async function main(){
  const child=http.createServer((_req,res)=>{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><html><meta charset="utf-8"><style>body{margin:0}video{width:100%;height:360px}</style>
      <video autoplay muted playsinline></video><script>
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
      const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
      document.querySelector('video').srcObject=canvas.captureStream(10);
      </script></html>`);
  });
  await listen(child);
  const parent=http.createServer((_req,res)=>{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><html><meta charset="utf-8"><style>body{margin:20px}iframe{display:block;width:640px;height:400px}button{padding:12px}</style>
      <button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Open</button>
      <button id="fullscreen" onclick="document.querySelector('iframe').requestFullscreen()">Fullscreen</button>
      <iframe src="http://127.0.0.1:${child.address().port}/" allow="autoplay; fullscreen"></iframe></html>`);
  });
  await listen(parent);let driver;
  try{
    driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{viewport:{width:1200,height:900}});
    await driver.install();const page=await driver.open(`http://127.0.0.1:${parent.address().port}/`);
    const frames=await driver.frames(page);let media;
    for(const {target} of frames)if(await driver.evaluate(target,()=>!!document.querySelector('video')))media=target;
    assert.ok(media,'media frame discovered');
    await until(driver,media,()=>document.querySelector('video').readyState>=2,'media ready');
    await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'top engine');
    await driver.pointerClick(page,'#open');
    await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block'
      &&document.querySelector('#pvc-active-adapter-badge')?.textContent==='GenericAdapter','remote HUD');
    const click=(target,id)=>driver.evaluate(target,id=>document.getElementById(id).click(),id);
    const audioMatches=()=>document.querySelector('#pvc-audio-mono-btn')?.getAttribute('aria-pressed')==='true'
      &&document.querySelector('#pvc-audio-mono-btn').classList.contains('pvc-audio-active')
      &&!document.querySelector('#pvc-audio-stereo-btn').classList.contains('pvc-audio-active');
    await click(page,'pvc-audio-mono-btn');await until(driver,page,audioMatches,'remote mono selected');
    await driver.evaluate(media,()=>window.addEventListener('message',event=>{
      if(event.source===window&&event.data?.type==='PVC_SOURCE_STATE')window.__testHudCollapsed=event.data.payload.state.hudCollapsed;
    }));
    await click(page,'pvc-collapse-btn');
    await until(driver,media,()=>window.__testHudCollapsed===true,'source collapse acknowledgement');
    await driver.pointerClick(page,'#fullscreen');
    await until(driver,media,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block'
      &&document.querySelector('#pvc-controller-popup').classList.contains('pvc-collapsed'),'fullscreen keeps collapsed');
    await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='none','top hidden in fullscreen');
    await click(media,'pvc-collapse-btn');await until(driver,media,audioMatches,'fullscreen mono selected');
    await click(media,'pvc-audio-stereo-btn');
    await driver.evaluate(page,()=>document.exitFullscreen());
    await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block'
      &&!document.querySelector('#pvc-controller-popup').classList.contains('pvc-collapsed')
      &&document.querySelector('#pvc-audio-stereo-btn')?.getAttribute('aria-pressed')==='true','normal state restored');
    await driver.evaluate(page,()=>window.addEventListener('message',event=>{
      if(event.source===window&&event.data?.type==='PVC_REMOTE_STATE')window.__testOwner=event.data.payload.state.owner;
    }));
    await until(driver,page,()=>typeof window.__testOwner==='string','current owner snapshot');
    await driver.evaluate(page,()=>window.__testOldOwner=window.__testOwner);
    await driver.evaluate(media,()=>{
      const old=document.querySelector('video'),next=old.cloneNode(false);next.srcObject=old.srcObject;
      window.__testRemovedVideo=old;old.replaceWith(next);next.play();
    });
    await until(driver,page,()=>window.__testOwner!==window.__testOldOwner,'replacement has a new media owner');
    await driver.evaluate(page,()=>{const input=document.getElementById('pvc-volume-slider');input.value='30';input.dispatchEvent(new Event('input',{bubbles:true}));});
    await until(driver,media,()=>Math.abs(document.querySelector('video').volume-.3)<.01,'control reaches replacement video');
    assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-controller-popup').style.display),'block','HUD stays open across replacement');
    await click(page,'pvc-tab-settings');
    const brightness=value=>driver.evaluate(page,value=>{const input=document.getElementById('pvc-filter-brightness');input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
    await brightness(115);await until(driver,media,()=>document.querySelector('video').style.filter==='brightness(115%)','remote frame-scheduled filter reaches the selected media');
    await driver.evaluate(media,()=>window.addEventListener('message',event=>{if(event.source===window&&event.data?.type==='PVC_SOURCE_STATE')window.__testFilterRequest=event.data.payload.state.filters.brightness;}));
    await brightness(125);await until(driver,media,()=>window.__testFilterRequest===125,'source accepts the final filter');
    await click(page,'pvc-close-popup-btn');
    await until(driver,media,()=>document.querySelector('video').style.filter==='brightness(125%)','accepted filter survives session close');
    await driver.evaluate(page,()=>{window.__testOwner=null;});
    await driver.pointerClick(page,'#open');await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','filter controls reopen');
    // The panel opens before the iframe session is back; controls act on the source only after that.
    const reopenStarted=Date.now();await until(driver,page,()=>typeof window.__testOwner==='string','reopened panel reaches the source');const reopenToSourceMs=Date.now()-reopenStarted;
    await click(page,'pvc-tab-settings');await click(page,'pvc-btn-reset-filters');
    await until(driver,media,()=>document.querySelector('video').style.filter==='','reset restores native CSS');
    await driver.evaluate(media,()=>document.querySelector('video').pause());
    await brightness(120);await until(driver,media,()=>document.querySelector('video').style.filter==='brightness(120%)','paused media stays responsive');
    await click(page,'pvc-btn-reset-filters');await until(driver,media,()=>document.querySelector('video').style.filter==='','paused reset');
    await driver.evaluate(media,()=>document.querySelector('video').play());
    for(const target of [page,media])assert.equal(await driver.evaluate(target,()=>document.querySelectorAll('#pvc-controller-popup').length),1,'one HUD per document');
    console.log(JSON.stringify({engine,browserVersion:driver.version,result:'passed',reopenToSourceMs,checks:['remote mono/stereo','collapse into fullscreen','expand out of fullscreen','media replacement keeps HUD/control','filter frame/close/reset/paused','single visible HUD']}));
  }finally{
    try{await driver?.close();}finally{for(const server of [parent,child]){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
