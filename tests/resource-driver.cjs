const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn,execFileSync,execFile}=require('node:child_process');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const root=path.resolve(__dirname,'..');
function processMemory(pid,perProcess=false){return JSON.parse(execFileSync('pwsh.exe',['-NoProfile','-File',path.join(__dirname,'measure-browser-memory.ps1'),'-RootProcessId',String(pid),...(perProcess?['-PerProcess']:[])],{encoding:'utf8',windowsHide:true}));}
function performanceWindow(pid,seconds){return new Promise((resolve,reject)=>execFile('pwsh.exe',['-NoProfile','-File',path.join(__dirname,'measure-browser-performance.ps1'),'-RootProcessId',String(pid),'-DurationSeconds',String(seconds)],{encoding:'utf8',windowsHide:true},(error,stdout)=>error?reject(error):resolve(JSON.parse(stdout))));}
async function createDriver(engine,executablePath,packages,options={}){
  if(engine==='chromium'){
    const {chromium}=require(path.join(packages,'playwright'));
    const context=await chromium.launchPersistentContext('',{executablePath,headless:true,viewport:options.viewport||{width:1280,height:800},
      ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging']});
    const browser=context.browser(),cdp=await browser.newBrowserCDPSession();
    await context.route('**/*',route=>(/^(?:chrome-extension:|http:\/\/127\.0\.0\.1:\d+\/)/.test(route.request().url())
      ||options.allowWeb&&/^https?:/.test(route.request().url()))?route.continue():route.abort());
    const pid=(await cdp.send('SystemInfo.getProcessInfo')).processInfo.find(p=>p.type==='browser').id;
    const sessions=new Map();
    const session=async page=>{if(!sessions.has(page))sessions.set(page,await context.newCDPSession(page));return sessions.get(page);};
    return {engine,version:browser.version(),
      install:()=>cdp.send('Extensions.loadUnpacked',{path:root}),
      open:async url=>{const page=await context.newPage();await page.goto(url,{waitUntil:options.allowWeb?'domcontentloaded':'load'});return page;},
      navigate:(page,url)=>page.goto(url,{waitUntil:options.allowWeb?'domcontentloaded':'load'}),
      hover:(page,selector)=>page.locator(selector).hover({timeout:5000}),
      reload:page=>page.reload(),
      evaluate:(page,fn,...args)=>page.evaluate(({code,args})=>(0,eval)(`(${code})(...${JSON.stringify(args)})`),{code:String(fn),args}),
      gc:async page=>{await(await session(page)).send('HeapProfiler.collectGarbage');await delay(250);await(await session(page)).send('HeapProfiler.collectGarbage');await delay(100);return 'CDP HeapProfiler.collectGarbage twice, with finalizer turn';},
      memory:async page=>({process:processMemory(pid),heap:await(await session(page)).send('Runtime.getHeapUsage'),dom:await(await session(page)).send('Memory.getDOMCounters')}),
      memoryCategories:async()=>{
        const types=new Map((await cdp.send('SystemInfo.getProcessInfo')).processInfo.map(p=>[p.id,p.type]));
        const measured=processMemory(pid,true),roles={};
        for(const row of measured.rows){
          const type=types.get(row.id),role=['browser','renderer','GPU'].includes(type)?type:'other';
          roles[role]||={processCount:0,privateBytes:0,workingSetBytes:0};
          roles[role].processCount++;roles[role].privateBytes+=row.privateBytes;roles[role].workingSetBytes+=row.workingSetBytes;
        }
        return {method:'owned-process-roles',roles}; // Never export PIDs or process command lines.
      },
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
        const allowed=/^(?:about:|blob:|data:|moz-extension:|chrome:|resource:|http:\/\/127\.0\.0\.1:\d+\/)/.test(request.url)
          ||options.allowWeb&&/^https?:/.test(request.url);
        try{await send(allowed?'network.continueRequest':'network.failRequest',{request:request.request});}catch(_){}
      }
    });
    const session=await send('session.new',{capabilities:{alwaysMatch:{acceptInsecureCerts:false}}});
    await send('session.subscribe',{events:['network.beforeRequestSent']});await send('network.addIntercept',{phases:['beforeRequestSent']});
    const navigate=(page,url)=>send('browsingContext.navigate',{context:page,url,wait:options.allowWeb?'interactive':'complete'});
    const open=async url=>{const page=(await send('browsingContext.create',{type:'tab'})).context;await navigate(page,url);return page;};
    const evaluate=async(page,fn,...args)=>{
      const result=await send('script.evaluate',{target:{context:page},expression:`(async()=>JSON.stringify(await (${fn})(...${JSON.stringify(args)})))()`,awaitPromise:true,userActivation:true});
      if(result.type==='exception')throw Error('Page exception: '+result.exceptionDetails?.text);
      return result.result?.value===undefined?undefined:JSON.parse(result.result.value);
    };
    let memoryPage;
    return {engine,version:session.capabilities.browserVersion,
      install:()=>send('webExtension.install',{extensionData:{type:'path',path:root}}),open,navigate,evaluate,
      hover:async(page,selector)=>{
        const point=await evaluate(page,selector=>{
          const node=document.querySelector(selector);if(!node)throw Error('Missing hover target');
          node.scrollIntoView({block:'center'});const rect=node.getBoundingClientRect();
          if(!(rect.width>0&&rect.height>0))throw Error('Hidden hover target');
          return {x:Math.round(rect.left+rect.width/4),y:Math.round(rect.top+rect.height/4)};
        },selector);
        return send('input.performActions',{context:page,actions:[{type:'pointer',id:'nok-test-pointer',parameters:{pointerType:'mouse'},
          actions:[{type:'pointerMove',origin:'viewport',duration:100,...point}]}]});
      },
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
      memoryCategories:async page=>{
        if(!options.memoryControls)throw Error('Memory categories require the isolated privileged test profile');
        memoryPage ||= await open('about:memory');
        const result=await evaluate(memoryPage,()=>new Promise((resolve,reject)=>{
          const manager=Cc['@mozilla.org/memory-reporter-manager;1'].getService(Ci.nsIMemoryReporterManager);
          const groups={windowObjects:0,jsNonWindow:0,heapOverhead:0,images:0,gfx:0,media:0,other:0};
          const standalone={},processes=new Map();let reports=0;
          const timer=setTimeout(()=>reject(Error('Memory reporter completion timeout')),15000);
          manager.getReports((process,path,kind,units,amount)=>{
            reports++;if(units!==Ci.nsIMemoryReporter.UNITS_BYTES||amount<0)return;
            let totals=processes.get(process);if(!totals){totals={heapAllocated:null,reportedHeap:0};processes.set(process,totals);}
            if(path.startsWith('explicit/')){
              const top=path.split('/',2)[1],key=({'window-objects':'windowObjects','js-non-window':'jsNonWindow','heap-overhead':'heapOverhead',images:'images',gfx:'gfx',media:'media'})[top]||'other';
              groups[key]+=amount;if(kind===Ci.nsIMemoryReporter.KIND_HEAP)totals.reportedHeap+=amount;
            }else if(['resident','resident-unique','heap-allocated','heap-committed','vsize'].includes(path)){
              standalone[path]=(standalone[path]||0)+amount;if(path==='heap-allocated')totals.heapAllocated=amount;
            }
          },null,()=>{
            clearTimeout(timer);let unclassified=0,heapProcesses=0;
            for(const totals of processes.values())if(totals.heapAllocated!==null){unclassified+=totals.heapAllocated-totals.reportedHeap;heapProcesses++;}
            resolve({method:'anonymized-memory-reporters',reportedProcessCount:processes.size,reports,
              explicitReportedBytes:Object.values(groups).reduce((a,b)=>a+b,0),explicitGroups:groups,
              heapUnclassifiedBytes:unclassified,heapReportingProcessCount:heapProcesses,standalone});
          },null,true); // Raw paths, process labels, descriptions and reports never leave this realm.
        }));
        await send('browsingContext.activate',{context:page});return result;
      },
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
