// I-03: the panel shows the media's real volume and follows the site's own control. Installed extension, local page.
// node tests/volume-mirror-browser.cjs --engine=firefox|chromium
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const video=`const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.volume=0.5;video.muted=false;video.style.cssText='width:640px;height:360px;display:block';
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
  video.srcObject=canvas.captureStream(10);document.body.appendChild(video);video.muted=true;video.play().catch(()=>{});video.muted=false;`;
async function main(){
  const child=http.createServer((_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><meta charset="utf-8"><body><script>${video}</script></body>`);});
  await listen(child);
  const parent=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');const framed=req.url.includes('framed');
    const script=req.url.includes('late')?video.replace('video.srcObject=canvas.captureStream(10);','window.__stream=canvas.captureStream(10);').replace('video.muted=true;video.play().catch(()=>{});video.muted=false;',''):video;
    res.end(`<!doctype html><meta charset="utf-8"><button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Open</button><body><script>${framed?`document.write('<iframe style="width:640px;height:400px" allow="autoplay" src="http://127.0.0.1:${child.address().port}/"></iframe>');`:script}</script></body>`);});
  await listen(parent);let driver;
  const panel=()=>({slider:document.getElementById('pvc-volume-slider').value,badge:document.getElementById('pvc-hdr-volume-badge').textContent.replace(/\D/g,'')});
  try{
    driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{viewport:{width:1200,height:900}});
    await driver.install();
    for(const framed of [false,true]){
      const page=await driver.open(`http://127.0.0.1:${parent.address().port}/${framed?'framed':''}`);await driver.activate(page);
      let media=page;
      if(framed)for(const {target} of await driver.frames(page))if(await driver.evaluate(target,()=>!!document.querySelector('video')))media=target;
      await until(driver,media,()=>document.querySelector('video')?.readyState>=2,'media ready');
      await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'engine');await delay(800);
      await driver.pointerClick(page,'#open');await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel');
      const label=framed?'iframe':'top';
      const expectPanel=(value,step)=>until(driver,page,value=>{const s=document.getElementById('pvc-volume-slider');return s&&s.value===String(value)&&document.getElementById('pvc-hdr-volume-badge').textContent.replace(/\D/g,'')===String(value);},`${label}: ${step}`,value);
      await expectPanel(50,'panel opens at the media level');
      await driver.evaluate(media,()=>{document.querySelector('video').volume=0.7;});await expectPanel(70,'panel follows a site volume change');
      await driver.evaluate(media,()=>{document.querySelector('video').muted=true;});await expectPanel(0,'panel follows a site mute');
      await driver.evaluate(media,()=>{document.querySelector('video').muted=false;});await expectPanel(70,'panel follows a site unmute');
      const slide=value=>driver.evaluate(page,value=>{const s=document.getElementById('pvc-volume-slider');s.value=String(value);s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));},value);
      await slide(40);await until(driver,media,()=>Math.abs(document.querySelector('video').volume-.4)<.01,`${label}: panel reaches the media`);await delay(400);
      assert.equal((await driver.evaluate(page,panel)).slider,'40',`${label}: panel keeps its own change`);
      await slide(150);await until(driver,media,()=>document.querySelector('video').volume===1,`${label}: boost uses full native volume`);await delay(400);
      assert.equal((await driver.evaluate(page,panel)).slider,'150',`${label}: boost is not reset by the media level`);
      await driver.evaluate(media,()=>{document.querySelector('video').volume=0.6;});await expectPanel(60,'a site change ends the boost');
      await page.close?.();
    }
    // A panel opened before the media is ready has nothing to read yet; no event says the level later.
    const page=await driver.open(`http://127.0.0.1:${parent.address().port}/late`);await driver.activate(page);
    await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'engine');await delay(1300);
    await driver.pointerClick(page,'#open');await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel');
    await delay(400);assert.equal((await driver.evaluate(page,panel)).slider,'100','no media level to read yet');
    await driver.evaluate(page,()=>{const video=document.querySelector('video');video.srcObject=window.__stream;video.play().catch(()=>{});return true;});
    await until(driver,page,()=>document.querySelector('video').readyState>=2,'media ready');
    await until(driver,page,()=>document.getElementById('pvc-volume-slider').value==='50','late media: the panel shows the real level');
    console.log(JSON.stringify({engine,browserVersion:driver.version,result:'passed'}));
  }finally{try{await driver?.close();}finally{for(const server of [parent,child]){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
