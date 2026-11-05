// I-12: the installed extension explains each CDN measurement outcome. Local synthetic servers, isolated profile.
// node tests/cdn-measure-browser.cjs --engine=firefox|chromium
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const video=`const video=document.createElement('video');video.muted=true;video.autoplay=true;video.playsInline=true;video.style.cssText='width:640px;height:360px;display:block';
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
  video.srcObject=canvas.captureStream(10);document.body.appendChild(video);video.play().catch(()=>{});`;
async function main(){
  const heads=new Map(),hanging=new Set();
  const media=http.createServer((req,res)=>{
    const kind=req.url.split('/')[1];
    if(req.method==='HEAD')heads.set(kind,(heads.get(kind)||0)+1);
    if(kind!=='cors')res.setHeader('Access-Control-Allow-Origin','*');
    if(kind==='tao')res.setHeader('Timing-Allow-Origin','*');
    if(req.method==='HEAD'&&kind==='hang'){hanging.add(res);return;}
    if(req.method==='HEAD'&&kind==='reject'){res.writeHead(405);res.end();return;}
    res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl'});res.end(req.method==='HEAD'?undefined:'#EXTM3U\n');
  });
  await listen(media);
  const mediaUrl=kind=>`http://127.0.0.1:${media.address().port}/${kind}/synthetic.m3u8`;
  const script=kind=>`${video}${kind==='none'?'':`fetch('${mediaUrl(kind)}',{mode:'${kind==='cors'?'no-cors':'cors'}'}).catch(()=>{});`}`;
  const child=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><body><script>${script(new URL(req.url,'http://x').searchParams.get('kind'))}</script></body>`);});
  await listen(child);
  const parent=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');
    const query=new URL(req.url,'http://x').searchParams,kind=query.get('kind'),framed=query.get('framed')==='1';
    res.end(`<!doctype html><meta charset="utf-8"><style>body{margin:12px}iframe{width:640px;height:400px;border:0}</style><button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Open</button>
      <body><script>${framed?`document.write('<iframe allow="autoplay" src="http://127.0.0.1:${child.address().port}/?kind=${kind}"></iframe>');`:script(kind)}</script></body>`);});
  await listen(parent);
  let driver;const results={};
  try{
    driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{viewport:{width:Number(args.width)||1200,height:900}});
    await driver.install();
    const measure=async(kind,framed=false)=>{
      const page=await driver.open(`http://127.0.0.1:${parent.address().port}/?kind=${kind}&framed=${framed?1:0}`);await driver.activate(page);
      await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'engine');await delay(framed?1500:800);
      await driver.pointerClick(page,'#open');await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','HUD');
      await delay(framed?1500:600);
      await driver.evaluate(page,()=>document.getElementById('pvc-tab-settings').click());
      assert.ok(await driver.evaluate(page,()=>document.getElementById('pvc-ping-btn').getBoundingClientRect().width>0),'CDN button is visible');
      await driver.evaluate(page,()=>{document.getElementById('pvc-quick-toast')?.remove();document.getElementById('pvc-ping-btn').click();});
      await until(driver,page,()=>{const b=document.getElementById('pvc-ping-btn');return b.getAttribute('aria-busy')==='false'&&!b.disabled;},'measurement finished');
      const read=await driver.evaluate(page,()=>{const b=document.getElementById('pvc-ping-btn'),t=document.getElementById('pvc-quick-toast'),r=t?.getBoundingClientRect();
        return {label:b.textContent.trim(),title:b.title,color:b.style.color,toast:t?.textContent||'',buttonFits:b.scrollWidth<=b.clientWidth+1,labelLines:b.querySelector('[data-pvc-ui-label]').getClientRects().length,toastFits:!!r&&r.left>=0&&r.right<=innerWidth};});
      assert.equal(read.buttonFits,true,`${kind} button text overflows: ${read.label}`);assert.equal(read.labelLines,1,`${kind} button label wraps: ${read.label}`);assert.equal(read.toastFits,true,`${kind} toast leaves the viewport: ${read.toast}`);
      await page.close?.();
      return read;
    };
    const cases=[
      ['tao',false,{label:/^\S*\s*\d+ ms$/,title:/last media request/,toast:/last request/,heads:0}],
      ['head',false,{label:/^\S*\s*\d+ ms$/,title:/separate HEAD/,toast:/\(HEAD\)/,heads:1}],
      ['reject',false,{label:/No result/,title:/rejected/,toast:/rejected/}],
      ['cors',false,{label:/No result/,title:/does not allow/,toast:/does not allow/}],
      ['hang',false,{label:/No result/,title:/did not answer/,toast:/did not answer/}],
      ['none',false,{label:/No result/,title:/No measurable/,toast:/No measurable/}],
      ['head',true,{label:/^\S*\s*\d+ ms$/,title:/separate HEAD/,toast:/\(HEAD\)/}],
      ['cors',true,{label:/No result/,title:/does not allow/,toast:/does not allow/}]
    ];
    for(const [kind,framed,expected] of cases){
      heads.clear();
      const name=`${kind}${framed?'-iframe':''}`,read=await measure(kind,framed);results[name]=read;
      assert.match(read.label,expected.label,`${name} label: ${read.label}`);
      assert.match(read.title,expected.title,`${name} title: ${read.title}`);
      assert.match(read.toast,expected.toast,`${name} toast: ${read.toast}`);
      if(expected.heads!==undefined)assert.equal(heads.get(kind)||0,expected.heads,`${name} HEAD requests`);
      if(/No result/.test(read.label))assert.match(read.color,/muted/,`${name} does not keep a result colour`);
    }
    console.log(JSON.stringify({engine,browserVersion:driver.version,cases:Object.keys(results).length,result:'passed'}));
  }catch(error){console.log(JSON.stringify(results));throw error;}
  finally{
    for(const res of hanging)res.destroy();
    try{await driver?.close();}finally{for(const server of [media,child,parent]){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
