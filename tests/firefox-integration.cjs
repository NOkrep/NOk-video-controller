// Installed temporary extension + stock Firefox BiDi. No user browser profile is read.
// node tests/firefox-integration.cjs --browser=<firefox.exe>
// References: MDN Create_BiDi_connection; W3C WebDriver BiDi webExtension.install.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const http = require('node:http'), {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const {serveMedia,mediaHtml,exerciseFileMedia}=require('./file-media-checks.cjs');
const {serveLibraryAsset,libraryHtml}=require('./library-fixtures.cjs');
const root = path.resolve(__dirname, '..');
const browserPath = process.argv.find(arg => arg.startsWith('--browser='))?.slice(10);
const mediaPath=process.argv.find(arg=>arg.startsWith('--media='))?.slice(8);
const testLibraries=process.argv.includes('--libraries');
const scale=Number(process.argv.find(arg=>arg.startsWith('--scale='))?.slice(8)||1);
if(![1,2].includes(scale))throw new Error('Test scale must be 1 or 2.');
if (!browserPath) throw new Error('Provide --browser=<firefox.exe>. No browser or driver is downloaded.');
const artifactDir = path.join(__dirname, 'artifacts', scale===1?'firefox-browser':'firefox-browser-scale2');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let processHandle, socket, profile, nextId = 0;
const pending = new Map(), servers = [], errors = [];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  const timer = setTimeout(() => {pending.delete(id);reject(new Error(`BiDi timeout: ${method}`));},15000);
  pending.set(id,{resolve,reject,timer}); socket.send(JSON.stringify({id,method,params}));
});
async function evaluate(context, expression, userActivation = false) {
  const result = await send('script.evaluate',{target:{context},expression:`(async()=>JSON.stringify(await (${expression})))()`,awaitPromise:true,userActivation});
  if (result.type === 'exception') throw new Error(`Page exception: ${result.exceptionDetails?.text}`);
  return result.result?.value === undefined ? undefined : JSON.parse(result.result.value);
}
async function until(context, expression, label, timeout=12000) {
  const deadline = Date.now()+timeout;
  while (Date.now()<deadline) {if (await evaluate(context,expression)) return; await delay(100);}
  process.stderr.write(JSON.stringify(await evaluate(context,`(()=>{const video=document.querySelector('video');return {label:${JSON.stringify(label)},
    media:video?{volume:video.volume,muted:video.muted,rate:video.playbackRate,ready:video.readyState,height:video.videoHeight,paused:video.paused,time:video.currentTime,
      buffered:Array.from({length:video.buffered.length},(_,i)=>[video.buffered.start(i),video.buffered.end(i)])}:null,
    sdk:window.videojs?(()=>{const p=videojs.getAllPlayers()[0],v=p?.tech_?.vhs,s=v?.stats;return {error:p?.error()?.code,selected:p?.qualityLevels?.()?.selectedIndex,
      levels:v?.representations?.().map(q=>({height:q.height,enabled:q.enabled()})),stats:s?{requests:s.mediaRequests,appends:s.mediaAppends,errors:s.mediaRequestsErrored}:null}})():null,
    status:document.querySelector('#pvc-quality-status')?.textContent,messages:window.__fixtureMessages,toast:document.querySelector('#pvc-quick-toast')?.textContent};})()`))+'\n');
  process.stderr.write(JSON.stringify({browserErrors:errors})+'\n');
  throw new Error(`Timeout: ${label}`);
}
function serve(handler) {
  return new Promise(resolve => {const server=http.createServer(handler);servers.push(server);
    server.listen(0,'127.0.0.1',()=>resolve(`http://127.0.0.1:${server.address().port}`));});
}
function html(response, body) {response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(body);}
async function start() {
  profile=fs.mkdtempSync(path.join(os.tmpdir(),'nok-firefox-test-'));
  const prefs={'browser.shell.checkDefaultBrowser':false,'browser.startup.homepage_override.mstone':'ignore',
    'browser.startup.page':0,'browser.startup.homepage':'about:blank','browser.newtabpage.enabled':false,
    'datareporting.policy.dataSubmissionEnabled':false,'toolkit.telemetry.enabled':false,'extensions.update.enabled':false};
  if(scale!==1)prefs['layout.css.devPixelsPerPx']=scale.toFixed(1);
  fs.writeFileSync(path.join(profile,'user.js'),Object.entries(prefs).map(([key,value])=>`user_pref(${JSON.stringify(key)},${JSON.stringify(value)});`).join('\n'));
  processHandle=spawn(browserPath,['--headless','--width','1280','--height','800','--no-remote','--profile',profile,'--remote-debugging-port','0','about:blank'],
    {windowsHide:true,stdio:['ignore','pipe','pipe']});
  const endpoint = await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(new Error('Firefox BiDi startup timeout')),20000);
    processHandle.once('error',error=>{clearTimeout(timer);reject(error);});
    processHandle.once('exit',code=>{clearTimeout(timer);reject(new Error(`Firefox exited during startup (${code})`));});
    processHandle.stderr.on('data',chunk=>{output+=chunk;const match=output.match(/WebDriver BiDi listening on (ws:\/\/127\.0\.0\.1:\d+)/);
      if(match){clearTimeout(timer);resolve(match[1]+'/session');}});
  });
  socket=new WebSocket(endpoint);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',async event=>{
    const message=JSON.parse(event.data), request=pending.get(message.id);
    if(request){clearTimeout(request.timer);pending.delete(message.id);
      if(message.type==='error') request.reject(new Error(`${message.error}: ${message.message}`));else request.resolve(message.result);return;}
    if(message.method==='log.entryAdded' && message.params.level==='error') errors.push(message.params.text);
    if(message.method==='network.beforeRequestSent' && message.params.isBlocked){
      const request=message.params.request;
      const allowed=/^(?:about:|blob:|data:|moz-extension:)/.test(request.url) || /^http:\/\/127\.0\.0\.1:\d+\//.test(request.url);
      try{await send(allowed?'network.continueRequest':'network.failRequest',{request:request.request});}catch(_){}
    }
  });
  return send('session.new',{capabilities:{alwaysMatch:{acceptInsecureCerts:false}}});
}
(async()=>{
  try {
    const session=await start();
    await send('session.subscribe',{events:['log.entryAdded','network.beforeRequestSent']});
    await send('network.addIntercept',{phases:['beforeRequestSent']});
    await send('script.addPreloadScript',{functionDeclaration:`function(){window.__fixtureMessages=[];window.addEventListener('message',event=>{
      const data=event.data;if(typeof data?.type!=='string'||!data.type.startsWith('PVC_'))return;
      window.__fixtureMessages.push({type:data.type,self:event.source===window,id:data.payload?.id,revision:data.payload?.state?.revision,
        name:data.payload?.command?.name,value:typeof data.payload?.command?.value==='number'?data.payload.command.value:undefined,
        ok:data.payload?.reply?.ok,code:data.payload?.reply?.code});if(window.__fixtureMessages.length>40)window.__fixtureMessages.shift();});}`});
    const installed=await send('webExtension.install',{extensionData:{type:'path',path:root}});
    assert.equal(installed.extension,'nok-video-controller@nokrep.local');
    const leafOrigin=await serve((_request,response)=>html(response,`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#091820;color:white}.plyr{width:100%}video{display:block;width:100%}</style></head><body>
      <div class="plyr"><video autoplay muted playsinline></video><button data-plyr="quality" value="1080" aria-checked="true">1080p</button><button data-plyr="quality" value="720">720p</button><button data-plyr="quality" value="480">480p</button></div>
      <script>const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d');
      const paint=()=>{ctx.fillStyle='#19405a';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='white';ctx.font='60px sans-serif';ctx.fillText('Firefox '+canvas.height+'p',50,100);};paint();
      const video=document.querySelector('video');video.srcObject=canvas.captureStream(10);video.play();setInterval(paint,100);
      document.querySelectorAll('[data-plyr]').forEach(button=>button.onclick=()=>{canvas.height=Number(button.value);canvas.width=Math.round(canvas.height*16/9);document.querySelectorAll('[data-plyr]').forEach(item=>item.setAttribute('aria-checked',String(item===button)));paint();});</script></body></html>`));
    const middleOrigin=await serve((_request,response)=>html(response,`<!doctype html><html><body style="margin:0;background:#152330"><iframe src="${leafOrigin}/leaf" style="width:100%;height:100vh;border:0" allow="fullscreen;autoplay;picture-in-picture"></iframe></body></html>`));
    const topOrigin=await serve((_request,response)=>html(response,`<!doctype html><html><body style="margin:24px;background:#152330;color:white;font:16px sans-serif"><h1>Installed extension / nested cross-origin fixture</h1><button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Controller</button><iframe id="player-frame" src="${middleOrigin}/middle" style="display:block;width:700px;height:450px;margin-top:24px" allow="fullscreen;autoplay;picture-in-picture"></iframe></body></html>`));
    const tab=(await send('browsingContext.create',{type:'tab'})).context;
    await send('browsingContext.navigate',{context:tab,url:topOrigin+'/',wait:'complete'});
    const tree=await send('browsingContext.getTree',{root:tab});
    const middle=tree.contexts[0].children[0].context, leaf=tree.contexts[0].children[0].children[0].context;
    await until(leaf,`window.__NOK_VIDEO_CONTROLLER_INJECTED__ && document.querySelector('video').readyState>=2`,'native extension injection in leaf');
    await evaluate(tab,`document.getElementById('open').click()`,true);
    await until(tab,`document.querySelector('#pvc-controller-popup')?.style.display==='block' && document.querySelector('#pvc-active-adapter-badge')?.textContent.includes('GenericAdapter')
      && document.querySelector('#pvc-no-video-alert')?.style.display==='none'`,'top presentation with a media owner');
    assert.equal(await evaluate(leaf,`document.querySelector('#pvc-controller-popup')?.style.display==='block'`),false);
    assert.equal(await evaluate(middle,`document.querySelector('#pvc-controller-popup')?.style.display==='block'`),false);
    // Exercise the real cross-frame slider path, not only synchronous local inputs.
    await evaluate(tab,`(()=>{window.__fixtureFilterTraffic={sent:0,maxPending:0,pending:new Set()};
      window.addEventListener('message',event=>{const data=event.data,t=window.__fixtureFilterTraffic;
        if(event.source!==window)return;
        if(data?.type==='PVC_REMOTE_COMMAND'&&data.payload?.command?.name==='filters'){
          t.sent++;t.pending.add(data.payload.id);t.maxPending=Math.max(t.maxPending,t.pending.size);
        }else if(data?.type==='PVC_REMOTE_REPLY')t.pending.delete(data.payload?.reply?.id);
      });})()`);
    await evaluate(tab,`new Promise(resolve=>{let frame=0;const input=document.querySelector('#pvc-filter-brightness');
      const step=()=>{input.value=String(100+(frame%3)*5);input.dispatchEvent(new Event('input',{bubbles:true}));
        if(++frame===36){input.value='120';input.dispatchEvent(new Event('input',{bubbles:true}));resolve();}else requestAnimationFrame(step);};step();})`);
    await until(leaf,`document.querySelector('video').style.filter.includes('brightness(120%)')`,'latest iframe slider value');
    const iframeFilterTraffic=await evaluate(tab,`({sent:__fixtureFilterTraffic.sent,maxPending:__fixtureFilterTraffic.maxPending})`);
    assert.equal(iframeFilterTraffic.maxPending,1,'filter relay must never build a backlog');
    await evaluate(tab,`(()=>{const input=document.querySelector('#pvc-filter-brightness');input.value='100';input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await until(leaf,`document.querySelector('video').style.filter===''`,'iframe filter reset');
    assert.ok(await evaluate(tab,`(()=>{const popup=document.querySelector('#pvc-controller-popup').getBoundingClientRect(),frame=document.querySelector('iframe').getBoundingClientRect();
      return innerWidth<frame.right+popup.width+16 || popup.left>=frame.right;})()`));
    await evaluate(tab,`(()=>{const input=document.querySelector('#pvc-volume-slider');input.value='40';input.dispatchEvent(new Event('input',{bubbles:true}));})()`,true);
    await until(leaf,`Math.abs(document.querySelector('video').volume-.4)<.01 && !document.querySelector('video').muted`,'nested volume');
    await evaluate(tab,`[...document.querySelectorAll('#pvc-dynamic-quality-container button')].find(button=>button.textContent==='720p').click()`,true);
    await until(leaf,`document.querySelector('video').videoHeight===720`,'nested native quality');
    await until(tab,`document.querySelector('#pvc-quality-status').textContent.includes('Confirmed')`,'decoded quality confirmation');
    fs.mkdirSync(artifactDir,{recursive:true});
    const cuePath=path.join(artifactDir,'synthetic.srt');fs.writeFileSync(cuePath,'1\n00:00:00,000 --> 00:10:00,000\nSynthetic Firefox caption\n');
    const fileInput=await send('script.evaluate',{target:{context:tab},expression:`document.querySelector('#pvc-sub-file-input')`,awaitPromise:false});
    await send('input.setFiles',{context:tab,element:{sharedId:fileInput.result.sharedId},files:[cuePath]});
    await until(leaf,`document.querySelector('#pvc-subtitle-overlay')?.textContent==='Synthetic Firefox caption'`,'nested subtitle transfer');
    assert.equal(await evaluate(tab,`document.querySelector('#pvc-subtitle-overlay')!==null`),false);
    await evaluate(tab,`(()=>{const input=document.querySelector('#pvc-sub-fontSize');input.value='28';input.dispatchEvent(new Event('input',{bubbles:true}));})()`,true);
    await until(leaf,`getComputedStyle(document.querySelector('#pvc-subtitle-overlay')).fontSize==='28px'`,'nested subtitle appearance');
    await evaluate(tab,`document.querySelector('iframe').requestFullscreen()`,true);
    await until(leaf,`document.querySelector('#pvc-controller-popup')?.style.display==='block'`,'nested fullscreen leaf HUD');
    assert.equal(await evaluate(tab,`document.querySelector('#pvc-controller-popup').style.display`),'none');
    assert.equal(await evaluate(leaf,`document.querySelector('#pvc-volume-slider').value`),'40');
    fs.mkdirSync(artifactDir,{recursive:true});
    const screenshot=await send('browsingContext.captureScreenshot',{context:tab,origin:'viewport',format:{type:'image/png'}});
    fs.writeFileSync(path.join(artifactDir,'nested-fullscreen.png'),Buffer.from(screenshot.data,'base64'));
    await evaluate(tab,`document.exitFullscreen()`,true);
    await until(tab,`document.querySelector('#pvc-controller-popup').style.display==='block'`,'fullscreen exit');
    const reflow=await evaluate(tab,`(()=>{const r=document.querySelector('#pvc-controller-popup').getBoundingClientRect();return {width:innerWidth,height:innerHeight,ratio:devicePixelRatio,
      bounds:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},scrollHeight:document.querySelector('#pvc-controller-popup').scrollHeight};})()`);
    assert.ok(reflow.bounds.left>=0&&reflow.bounds.top>=0&&reflow.bounds.right<=reflow.width+1&&reflow.bounds.bottom<=reflow.height+1,'HUD exceeds scaled viewport');
    if(scale===2)assert.ok(reflow.ratio>=1.9,'Native CSS pixel scaling was not applied');
    await send('browsingContext.activate',{context:tab});
    const keyActions=async(actions)=>send('input.performActions',{context:tab,actions:[{type:'key',id:'keyboard',actions}]});
    await evaluate(tab,`document.querySelector('#pvc-tab-player').focus()`,true);
    await keyActions([{type:'keyDown',value:'\uE015'},{type:'keyUp',value:'\uE015'}]);
    assert.equal(await evaluate(tab,`document.querySelector('#pvc-tab-subtitles').getAttribute('aria-selected')`),'true');
    await delay(4300);
    assert.equal(await evaluate(tab,`document.querySelector('#pvc-controller-popup').classList.contains('pvc-idle-hidden')`),false,'Keyboard focus must protect the HUD');
    const pointer=await evaluate(tab,`(()=>{const r=document.querySelector('#pvc-tab-player').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};})()`);
    await send('input.performActions',{context:tab,actions:[{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[
      {type:'pointerMove',x:pointer.x,y:pointer.y},{type:'pointerDown',button:0},{type:'pointerUp',button:0},{type:'pointerMove',x:0,y:0}]}]});
    await until(tab,`document.querySelector('#pvc-controller-popup').classList.contains('pvc-idle-hidden')`,'pointer idle hiding',6000);
    reflow.keyboardArrowNavigation=true;reflow.keyboardFocusProtected=true;reflow.pointerIdleHidden=true;
    await evaluate(tab,`document.querySelector('#pvc-close-popup-btn').click()`,true);
    await until(tab,`document.querySelector('#pvc-controller-popup').style.display==='none'`,'close');
    await evaluate(tab,`document.getElementById('open').click()`,true);
    await until(tab,`document.querySelector('#pvc-controller-popup').style.display==='block'`,'reopen');
    for(const volume of [45,50,40]){
      await until(tab,`document.querySelector('#pvc-no-video-alert')?.style.display==='none'`,'reopened source ready');
      await evaluate(tab,`(()=>{const input=document.querySelector('#pvc-volume-slider');input.value='${volume}';input.dispatchEvent(new Event('input',{bubbles:true}));})()`,true);
      await until(leaf,`Math.abs(document.querySelector('video').volume-${volume}/100)<.01`,'reopened source volume '+volume);
      await evaluate(tab,`document.querySelector('#pvc-close-popup-btn').click()`,true);
      await until(tab,`document.querySelector('#pvc-controller-popup').style.display==='none'`,'repeated close');
      await evaluate(tab,`document.getElementById('open').click()`,true);
      await until(tab,`document.querySelector('#pvc-no-video-alert')?.style.display==='none' && document.querySelector('#pvc-controller-popup').style.display==='block'`,'repeated reopen source ready');
    }
    let fileMedia;
    if(mediaPath){
      const mediaOrigin=await serve((request,response)=>{
        if(request.url==='/synthetic.webm'){serveMedia(request,response,path.resolve(mediaPath));return;}
        html(response,mediaHtml());
      });
      await send('browsingContext.navigate',{context:tab,url:mediaOrigin+'/',wait:'complete'});
      await until(tab,`window.__NOK_VIDEO_CONTROLLER_INJECTED__ && document.querySelector('video').readyState>=2`,'file page injection');
      fileMedia=await evaluate(tab,`(${exerciseFileMedia.toString()})()`,true);
    }
    const libraries=[];
    if(testLibraries){
      const libraryOrigin=await serve((request,response)=>{if(serveLibraryAsset(request,response))return;
        html(response,libraryHtml(request.url==='/hls'?'hls':'videojs'));});
      for(const kind of ['hls','videojs']){
        await send('browsingContext.navigate',{context:tab,url:libraryOrigin+'/'+kind,wait:'complete'});
        await until(tab,`document.querySelector('video')?.readyState>=2`,'actual '+kind+' media',20000);
        await evaluate(tab,`document.querySelector('#open').click()`,true);
        const adapter=kind==='hls'?'HlsJsAdapter':'VideoJsAdapter';
        await until(tab,`document.querySelector('#pvc-active-adapter-badge')?.textContent.includes('${adapter}')`,'actual '+kind+' adapter');
        const heights=await evaluate(tab,`[...document.querySelectorAll('#pvc-dynamic-quality-container button')].map(button=>button.textContent)`);
        for(const height of [1080,720,480])assert.ok(heights.some(text=>text.includes(height+'p')),`${kind} inventory missing ${height}p`);
        const transitions=[];
        for(const height of [1080,480]){
          await evaluate(tab,`[...document.querySelectorAll('#pvc-dynamic-quality-container button')].find(button=>button.textContent.includes('${height}p')).click()`,true);
          await until(tab,`document.querySelector('video').videoHeight===${height}`,'actual '+kind+' decoded '+height,12000);
          await until(tab,`document.querySelector('#pvc-quality-status').textContent.includes('decoded ${height}p') && document.querySelector('#pvc-quality-status').textContent.includes('Confirmed')`,'actual '+kind+' confirmation '+height);
          transitions.push({height,status:await evaluate(tab,`document.querySelector('#pvc-quality-status').textContent`)});
        }
        libraries.push({kind,adapter,inventory:heights,transitions});
      }
    }
    const result={browser:session.capabilities.browserName,version:session.capabilities.browserVersion,installedExtension:true,synthetic:true,
      checks:['temporary extension install','native content/Main World injection','nested cross-origin top HUD','single visible HUD',
        'nested volume','native quality and decoded confirmation','nested subtitle transfer','nested subtitle appearance',
        'ancestor fullscreen to leaf','fullscreen values','fullscreen exit','close/reopen','three reopened-session volume changes'],iframeFilterTraffic,reflow,fileMedia,libraries,errors};
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(artifactDir,'result.json'),JSON.stringify(result,null,2)+'\n');
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  } finally {
    if(socket?.readyState===WebSocket.OPEN){try{await send('browser.close');}catch(_){} socket.close();}
    for(const request of pending.values()){clearTimeout(request.timer);request.reject(new Error('Test ended'));}pending.clear();
    if(processHandle && processHandle.exitCode===null){processHandle.kill();await Promise.race([new Promise(resolve=>processHandle.once('exit',resolve)),delay(3000)]);}
    await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));
    // Only this test's freshly-created temp directory is eligible for recursive cleanup.
    if(profile){const resolved=path.resolve(profile),base=path.resolve(os.tmpdir())+path.sep;
      if(!resolved.startsWith(base)||!path.basename(resolved).startsWith('nok-firefox-test-'))throw new Error('Unsafe test profile cleanup path');
      try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:100});}catch(_){process.stderr.write('Temporary Firefox test profile remains locked.\n');}}
  }
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
