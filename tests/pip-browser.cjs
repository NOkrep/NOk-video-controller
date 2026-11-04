// Real native PiP requests through installed-extension UI, isolated local cross-origin frames.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const {createDriver,until,delay}=require('./resource-driver.cjs');
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
      window.__pipProbes=[];
      const original=HTMLVideoElement.prototype.requestPictureInPicture;
      if(original)HTMLVideoElement.prototype.requestPictureInPicture=function(){
        const probe={active:navigator.userActivation?.isActive};window.__pipProbes.push(probe);
        return original.call(this).then(result=>{probe.result='ok';return result;},error=>{probe.result=error.name;throw error;});
      };
      </script></html>`);
  });await listen(child);
  const parent=http.createServer((_req,res)=>{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><html><meta charset="utf-8"><style>body{margin:20px}iframe{display:block;width:640px;height:400px}button{padding:12px}</style>
      <button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Open</button>
      <button id="fullscreen" onclick="document.querySelector('iframe').requestFullscreen().then(()=>window.__fsResult='ok',error=>window.__fsResult=error.name)">Fullscreen</button>
      <iframe src="http://127.0.0.1:${child.address().port}/" allow="autoplay; fullscreen; picture-in-picture"></iframe></html>`);
  });await listen(parent);let driver;
  try{
    driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{viewport:{width:1200,height:900}});
    await driver.install();const page=await driver.open(`http://127.0.0.1:${parent.address().port}/`);
    let media;for(const {target} of await driver.frames(page))if(await driver.evaluate(target,()=>!!document.querySelector('video')))media=target;
    await until(driver,media,()=>document.querySelector('video').readyState>=2,'media ready');
    await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'top engine');
    await driver.pointerClick(page,'#open');
    await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block'
      &&document.querySelector('#pvc-active-adapter-badge')?.textContent==='GenericAdapter','remote HUD');
    // Isolate PiP activation from idle visibility; this setting changes only the top HUD.
    await driver.evaluate(page,()=>{const input=document.getElementById('pvc-a11y-keepVisible');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));});
    // Driver evaluations can grant user activation. Let that expire in the media frame.
    await delay(6000);
    await driver.hover(page,'#pvc-pip-btn');
    await driver.pointerClick(page,'#pvc-pip-btn');await delay(400);
    const normal=await driver.evaluate(media,()=>({calls:window.__pipProbes,api:typeof document.querySelector('video').requestPictureInPicture,enabled:document.pictureInPictureEnabled===true,pip:!!document.pictureInPictureElement,prompt:!!document.getElementById('pvc-pip-activation')}));
    if(args.probeNormal){console.log(JSON.stringify({engine,browserVersion:driver.version,normal}));return;}
    if(normal.api!=='function'){
      assert.equal(normal.pip,false);assert.equal(normal.prompt,false);
      console.log(JSON.stringify({engine,browserVersion:driver.version,result:'unsupported-handled',nativePiPTested:false}));return;
    }
    assert.ok(normal.pip||normal.prompt,'remote PiP must open or offer a real click in its source frame');
    if(normal.prompt){
      assert.equal(await driver.evaluate(media,()=>document.getElementById('pvc-pip-activation').textContent),'Open PiP');
      if(args.screenshots&&engine==='chromium'){
        const dir=path.resolve(__dirname,'artifacts/pip-browser');fs.mkdirSync(dir,{recursive:true});
        await page.screenshot({path:path.join(dir,'activation-prompt.png')});
      }
      await driver.pointerClick(media,'#pvc-pip-activation');
      await until(driver,media,()=>!!document.pictureInPictureElement,'PiP after source activation');
    }
    await until(driver,page,()=>document.getElementById('pvc-pip-btn')?.getAttribute('aria-pressed')==='true','remote PiP active state');
    await driver.pointerClick(page,'#pvc-pip-btn');
    await until(driver,media,()=>!document.pictureInPictureElement,'remote PiP exit');
    await until(driver,page,()=>document.getElementById('pvc-pip-btn')?.getAttribute('aria-pressed')==='false','remote PiP inactive state');
    // Closing Firefox's native PiP window leaves its opener unfocused in automation.
    await driver.activate(page);
    await driver.pointerClick(page,'#fullscreen');
    try{await until(driver,media,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','fullscreen HUD');}
    catch(error){console.log(JSON.stringify({fullscreenFailure:await driver.evaluate(page,()=>({fullscreen:!!document.fullscreenElement,result:window.__fsResult,focused:document.hasFocus()})),source:await driver.evaluate(media,()=>({fullscreen:!!document.fullscreenElement,popupDisplay:document.querySelector('#pvc-controller-popup')?.style.display}))}));throw error;}
    await driver.pointerClick(media,'#pvc-pip-btn');
    await until(driver,media,()=>!!document.pictureInPictureElement,'direct fullscreen PiP');
    console.log(JSON.stringify({engine,browserVersion:driver.version,result:'passed',sourceActivationPrompt:normal.prompt}));
  }finally{
    try{await driver?.close();}finally{for(const server of [parent,child]){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
