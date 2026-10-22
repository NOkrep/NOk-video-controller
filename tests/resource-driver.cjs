const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn,execFileSync,execFile}=require('node:child_process');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const root=path.resolve(__dirname,'..');
function processMemory(pid){return JSON.parse(execFileSync('pwsh.exe',['-NoProfile','-File',path.join(__dirname,'measure-browser-memory.ps1'),'-RootProcessId',String(pid)],{encoding:'utf8',windowsHide:true}));}
function performanceWindow(pid,seconds){return new Promise((resolve,reject)=>execFile('pwsh.exe',['-NoProfile','-File',path.join(__dirname,'measure-browser-performance.ps1'),'-RootProcessId',String(pid),'-DurationSeconds',String(seconds)],{encoding:'utf8',windowsHide:true},(error,stdout)=>error?reject(error):resolve(JSON.parse(stdout))));}
async function createDriver(engine,executablePath,packages,options={}){
  if(engine==='chromium'){
    const {chromium}=require(path.join(packages,'playwright'));
    const context=await chromium.launchPersistentContext('',{executablePath,headless:true,viewport:options.viewport||{width:1280,height:800},
      ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging']});
    const browser=context.browser(),cdp=await browser.newBrowserCDPSession();
    await context.route('**/*',route=>/^(?:chrome-extension:|http:\/\/127\.0\.0\.1:\d+\/)/.test(route.request().url())?route.continue():route.abort());
    const pid=(await cdp.send('SystemInfo.getProcessInfo')).processInfo.find(p=>p.type==='browser').id;
    const sessions=new Map();
    const session=async page=>{if(!sessions.has(page))sessions.set(page,await context.newCDPSession(page));return sessions.get(page);};
    return {engine,version:browser.version(),
      install:()=>cdp.send('Extensions.loadUnpacked',{path:root}),
      open:async url=>{const page=await context.newPage();await page.goto(url);return page;},
      reload:page=>page.reload(),
      evaluate:(page,fn,...args)=>page.evaluate(({code,args})=>(0,eval)(`(${code})(...${JSON.stringify(args)})`),{code:String(fn),args}),
      gc:async page=>{await(await session(page)).send('HeapProfiler.collectGarbage');await delay(250);await(await session(page)).send('HeapProfiler.collectGarbage');await delay(100);return 'CDP HeapProfiler.collectGarbage twice, with finalizer turn';},
      memory:async page=>({process:processMemory(pid),heap:await(await session(page)).send('Runtime.getHeapUsage'),dom:await(await session(page)).send('Memory.getDOMCounters')}),
      performance:seconds=>performanceWindow(pid,seconds),
      gpuMode:async()=>{const info=await cdp.send('SystemInfo.getInfo');const renderer=info.gpu?.auxAttributes?.glRenderer;return {rendererReported:!!renderer,softwareRenderer:renderer?/swiftshader|llvmpipe|software|warp/i.test(renderer):null};},
      close:()=>context.close()};
  }
  if(engine!=='firefox')throw Error('Expected --engine=firefox or chromium');
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nok-resource-firefox-'));
  fs.writeFileSync(path.join(profile,'user.js'),[
    'user_pref("browser.shell.checkDefaultBrowser",false);','user_pref("browser.startup.homepage_override.mstone","ignore");',
    'user_pref("browser.startup.page",0);','user_pref("browser.newtabpage.enabled",false);',
    'user_pref("datareporting.policy.dataSubmissionEnabled",false);','user_pref("toolkit.telemetry.enabled",false);',
    'user_pref("extensions.update.enabled",false);'].join('\n'));
  // Mozilla's documented switch is process-local; only this isolated test gets it.
  const size=options.viewport?['--width',String(options.viewport.width),'--height',String(options.viewport.height)]:[];
  const child=spawn(executablePath,['--headless','--no-remote','--new-instance','--profile',profile,'--remote-debugging-port','0',...size,'about:blank'],
    {windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,...(options.memoryControls?{MOZ_REMOTE_ALLOW_SYSTEM_ACCESS:'1'}:{})}});
  const requests=new Map();let socket,id=0;
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const request=++id,timer=setTimeout(()=>{requests.delete(request);reject(Error('BiDi timeout: '+method));},20000);
    requests.set(request,{resolve,reject,timer});socket.send(JSON.stringify({id:request,method,params}));
  });
  try{
    const endpoint=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Firefox startup timeout: '+output.slice(-1000))),20000);
      child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Firefox startup exit: '+code));});
      child.stderr.on('data',chunk=>{output+=chunk;const match=output.match(/WebDriver BiDi listening on (ws:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timer);resolve(match[1]+'/session');}});
    });
    socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    socket.addEventListener('message',async event=>{
      const message=JSON.parse(event.data),pending=requests.get(message.id);
      if(pending){clearTimeout(pending.timer);requests.delete(message.id);message.type==='error'?pending.reject(Error(message.message)):pending.resolve(message.result);}
      else if(message.method==='network.beforeRequestSent'&&message.params.isBlocked){
        const request=message.params.request;
        try{await send(/^(?:about:|blob:|data:|moz-extension:|chrome:|resource:|http:\/\/127\.0\.0\.1:\d+\/)/.test(request.url)?'network.continueRequest':'network.failRequest',{request:request.request});}catch(_){}
      }
    });
    const session=await send('session.new',{capabilities:{alwaysMatch:{acceptInsecureCerts:false}}});
    await send('session.subscribe',{events:['network.beforeRequestSent']});await send('network.addIntercept',{phases:['beforeRequestSent']});
    const open=async url=>{const page=(await send('browsingContext.create',{type:'tab'})).context;await send('browsingContext.navigate',{context:page,url,wait:'complete'});return page;};
    const evaluate=async(page,fn,...args)=>{
      const result=await send('script.evaluate',{target:{context:page},expression:`(async()=>JSON.stringify(await (${fn})(...${JSON.stringify(args)})))()`,awaitPromise:true,userActivation:true});
      if(result.type==='exception')throw Error('Page exception: '+result.exceptionDetails?.text);
      return result.result?.value===undefined?undefined:JSON.parse(result.result.value);
    };
    let memoryPage;
    return {engine,version:session.capabilities.browserVersion,
      install:()=>send('webExtension.install',{extensionData:{type:'path',path:root}}),open,evaluate,
      reload:async page=>{const url=(await send('browsingContext.getTree',{root:page})).contexts[0].url;await send('browsingContext.navigate',{context:page,url,wait:'complete'});},
      gc:async page=>{
        memoryPage ||= await open('about:memory');
        const found=await evaluate(memoryPage,()=>{
          const buttons=[...document.querySelectorAll('button,input[type="button"]')];
          const button=buttons.find(item=>(item.textContent||item.value).trim()==='Minimize memory usage');
          if(!button)return buttons.map(item=>({id:item.id,label:(item.textContent||item.value).trim()}));
          window.__resourceMinimizeFinished=false;
          const observer=new MutationObserver(()=>{
            if(document.documentElement.textContent.includes('Memory minimization completed')){
              window.__resourceMinimizeFinished=true;observer.disconnect();
            }
          });
          observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
          button.click();return true;
        });
        if(found!==true)throw Error('Cannot find Firefox minimize control: '+JSON.stringify(found));
        const deadline=Date.now()+15000;
        while(!await evaluate(memoryPage,()=>window.__resourceMinimizeFinished)){
          if(Date.now()>deadline)throw Error('Firefox memory minimization did not complete');await delay(100);
        }
        await send('browsingContext.activate',{context:page});await delay(250);
        return 'about:memory Minimize memory usage (GC/CC + cache pressure)';
      },
      memory:async()=>({process:processMemory(child.pid)}),
      performance:seconds=>performanceWindow(child.pid,seconds),
      gpuMode:async page=>page?evaluate(page,()=>{
        const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl');
        if(!gl)return {rendererReported:false,softwareRenderer:null};
        try{
          const extension=gl.getExtension('WEBGL_debug_renderer_info');
          const renderer=extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):null;
          return {rendererReported:!!renderer,softwareRenderer:renderer?/swiftshader|llvmpipe|software|warp|basic render/i.test(renderer):null};
        }finally{gl.getExtension('WEBGL_lose_context')?.loseContext();}
      }):({rendererReported:false,softwareRenderer:null}),
      close:async()=>{
        try{await send('browser.close');}catch(_){}socket.close();if(child.exitCode===null)child.kill();
        await delay(500);
        const resolved=path.resolve(profile),base=path.resolve(os.tmpdir())+path.sep;
        if(!resolved.startsWith(base)||!path.basename(resolved).startsWith('nok-resource-firefox-'))throw Error('Unsafe profile cleanup');
        try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:100});}catch(_){process.stderr.write('Test profile remains locked.\n');}
      }};
  }catch(error){child.kill();throw error;}
}
async function until(driver,page,fn,label,...args){
  const deadline=Date.now()+15000;while(Date.now()<deadline){if(await driver.evaluate(page,fn,...args))return;await delay(100);}throw Error('Timeout: '+label);
}
module.exports={createDriver,until,delay};
