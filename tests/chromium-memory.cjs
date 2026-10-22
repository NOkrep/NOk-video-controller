// Real unpacked extension in a fresh Chromium profile. No user profile is opened.
// Uses CDP Extensions.loadUnpacked, not page-script mocks or extension security policy changes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const packages=arg('packages'),executablePath=arg('browser');
if(!packages||!executablePath)throw Error('Provide --packages and --browser. Nothing is downloaded.');
const {chromium}=require(path.join(packages,'playwright'));
const root=path.resolve(__dirname,'..'),artifactDir=path.join(__dirname,'artifacts','chromium-memory');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const servers=[],samples=[];let browser;
function serve(body){return new Promise(resolve=>{const server=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(body);});servers.push(server);server.listen(0,'127.0.0.1',()=>resolve(`http://127.0.0.1:${server.address().port}`));});}
(async()=>{try{
  const leafOrigin=await serve(`<!doctype html><html><body style="margin:0;background:#193b52"><video autoplay muted playsinline style="width:100%"></video><script>
    const c=document.createElement('canvas');c.width=1920;c.height=1080;const ctx=c.getContext('2d'),v=document.querySelector('video');
    const paint=()=>{ctx.fillStyle='#193b52';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='white';ctx.font='60px sans-serif';ctx.fillText('Synthetic Chromium video',50,100);};
    paint();v.srcObject=c.captureStream(10);v.play();setInterval(paint,100);</script></body></html>`);
  const middleOrigin=await serve(`<!doctype html><html><body style="margin:0"><iframe src="${leafOrigin}" style="width:100%;height:100vh;border:0" allow="autoplay;fullscreen"></iframe></body></html>`);
  const topOrigin=await serve(`<!doctype html><html><body style="margin:24px;background:#152330;color:white"><button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Controller</button><iframe src="${middleOrigin}" style="display:block;width:700px;height:450px" allow="autoplay;fullscreen"></iframe></body></html>`);
  const context=await chromium.launchPersistentContext('',{executablePath,headless:true,viewport:{width:1280,height:800},ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging']});
  browser=context.browser();
  await context.addInitScript(()=>{window.__fixtureMessages=[];window.addEventListener('message',event=>{
    if(typeof event.data?.type==='string'&&/^(PVC_|NOK_)/.test(event.data.type)){
      if(event.source===window&&event.data.type==='PVC_REMOTE_STATE')window.__fixturePresentationSession=event.data.payload?.session;
      window.__fixtureMessages.push({type:event.data.type,ok:event.data.payload?.reply?.ok,code:event.data.payload?.reply?.code,hasVideo:event.data.payload?.state?.hasVideo});
      if(window.__fixtureMessages.length>20)window.__fixtureMessages.shift();
    }
  });});
  await context.route('**/*',route=>route.request().url().startsWith('chrome-extension://')||[topOrigin,middleOrigin,leafOrigin].some(origin=>route.request().url().startsWith(origin+'/'))?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await browser.newBrowserCDPSession();
  const pid=(await cdp.send('SystemInfo.getProcessInfo')).processInfo.find(p=>p.type==='browser').id;
  async function snapshot(stage,cycles=0){
    const totals=JSON.parse(execFileSync('pwsh.exe',['-NoProfile','-File',path.join(__dirname,'measure-browser-memory.ps1'),'-RootProcessId',String(pid)],{encoding:'utf8',windowsHide:true}));
    const frames=[];
    for(const frame of page.frames()){
      let session;
      try{session=await context.newCDPSession(frame);}catch(error){
        // Same-process child frames are already counted by their parent's isolate.
        if(error.message.includes('part of the parent frame'))continue;
        throw error;
      }
      try{frames.push({heap:await session.send('Runtime.getHeapUsage'),dom:await session.send('Memory.getDOMCounters')});}finally{await session.detach();}
    }
    samples.push({stage,cycles,...totals,frames});
  }
  const ready=async()=>{const leaf=page.frames().find(frame=>frame.url().startsWith(leafOrigin+'/'));assert.ok(leaf);await leaf.waitForFunction(()=>document.querySelector('video').readyState>=2);return leaf;};
  await page.goto(topOrigin);await ready();await wait(1500);await snapshot('same-video-without-extension');
  const installed=await cdp.send('Extensions.loadUnpacked',{path:root});assert.ok(installed.id,'extension must really be installed');
  await page.reload();let leaf=await ready();await leaf.waitForFunction(()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__);
  await wait(1500);await snapshot('installed-never-opened');
  assert.equal(await page.locator('#pvc-controller-popup:visible').count(),0);
  await page.locator('#open').click();
  await page.waitForFunction(()=>window.__fixturePresentationSession&&document.querySelector('#pvc-no-video-alert')?.style.display==='none'&&document.querySelector('#pvc-realtime-res-badge')?.textContent.includes('1920x1080'));
  await snapshot('open');
  for(let cycle=1;cycle<=30;cycle++){
    await page.locator('#pvc-volume-slider').evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},cycle%2?45:55);
    try{await leaf.waitForFunction(value=>Math.abs(document.querySelector('video').volume-value)<.01,cycle%2?.45:.55,{timeout:5000});}catch(error){
      for(const frame of page.frames())process.stderr.write(JSON.stringify(await frame.evaluate(()=>({messages:window.__fixtureMessages,volume:document.querySelector('video')?.volume,alert:document.querySelector('#pvc-no-video-alert')?.style.display,toast:document.querySelector('#pvc-quick-toast')?.textContent})))+'\n');
      throw error;
    }
    const previousSession=await page.evaluate(()=>window.__fixturePresentationSession);
    await page.locator('#pvc-close-popup-btn').click();await page.locator('#pvc-controller-popup').waitFor({state:'hidden'});
    await page.locator('#open').click();await page.waitForFunction(previous=>window.__fixturePresentationSession!==previous&&document.querySelector('#pvc-no-video-alert')?.style.display==='none'&&document.querySelector('#pvc-realtime-res-badge')?.textContent.includes('1920x1080'),previousSession);
    if(cycle%10===0){await wait(1000);await snapshot('repeated-open-close',cycle);}
  }
  assert.equal(await page.locator('#pvc-controller-popup').count(),1);
  await page.locator('#pvc-close-popup-btn').click();await wait(5000);await snapshot('closed-settled',30);
  assert.deepEqual(errors,[]);
  const result={browser:browser.version(),installedExtension:true,synthetic:true,privateProfile:true,
    description:'Process totals include browser, video and extension; page heaps include host-page JS. No forced GC. No extension-only allocation claim.',samples,errors};
  fs.mkdirSync(artifactDir,{recursive:true});fs.writeFileSync(path.join(artifactDir,'result.json'),JSON.stringify(result,null,2)+'\n');
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}finally{await browser?.close();await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));}})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
