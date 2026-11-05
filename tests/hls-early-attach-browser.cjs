// Real Hls.js attached inside a closure as soon as the page can: the engine loads later and must still find the player.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until}=require('./resource-driver.cjs');
const {serveLibraryAsset}=require('./library-fixtures.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const startup=`(function(){const video=document.querySelector('video');const player=new Hls({maxBufferLength:4,maxMaxBufferLength:6});
  window.__probe={engineReady:!!window.__NOK_VIDEO_CONTROLLER_INJECTED__};player.loadSource('/hls/master.m3u8');player.attachMedia(video);
  window.__probe.boundAtAttach=video.__nokHlsPlayer===player;player.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));})();`;
const page=`<!doctype html><html><head><meta charset="utf-8"><style>video{width:800px;height:450px}</style></head><body><video autoplay muted playsinline></video><script src="/runtime/hls.min.js"></script><script>${startup}</script></body></html>`;
(async()=>{let driver;const media=http.createServer((req,res)=>{
  if(serveLibraryAsset(req,res,{committedHls:true}))return;
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(page);
});
const parent=http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<iframe style="width:850px;height:550px" allow="autoplay" src="http://127.0.0.1:${media.address().port}/"></iframe>`);
});
try{
  await new Promise(resolve=>media.listen(0,'127.0.0.1',resolve));
  await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true});
  await driver.install();const results=[];
  for(const embedded of [false,true]){
    const top=await driver.open(`http://127.0.0.1:${(embedded?parent:media).address().port}/`);
    let owner=top;
    if(embedded){
      await until(driver,top,()=>!!document.querySelector('iframe')?.contentWindow,'child frame exists');
      for(let attempt=0;attempt<40&&owner===top;attempt++){
        for(const frame of await driver.frames(top))if(await driver.evaluate(frame.target,()=>!!document.querySelector('video')))owner=frame.target;
        if(owner===top)await new Promise(resolve=>setTimeout(resolve,100));
      }
      assert.notEqual(owner,top,'cross-origin child owns the media');
    }
    await until(driver,owner,()=>document.querySelector('video')?.readyState>=2,'Hls.js decodes');
    const probe=await driver.evaluate(owner,()=>window.__probe);
    assert.equal(probe.boundAtAttach,true,'the player is remembered at attach time, before the engine may exist');
    await driver.toolbar(top);
    await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','toolbar opens');
    await until(driver,top,()=>/HlsJsAdapter/.test(document.getElementById('pvc-active-adapter-badge')?.textContent||''),'Hls.js adapter selected');
    await until(driver,top,()=>/^3\b/.test(document.getElementById('pvc-quality-count-badge')?.textContent||''),'three declared levels');
    results.push({embedded,engineReadyAtAttach:probe.engineReady});
  }
  console.log(JSON.stringify({engine,browserVersion:driver.version,results,result:'passed'}));
}finally{try{await driver?.close();}finally{for(const host of [parent,media]){host.closeAllConnections();await new Promise(resolve=>host.close(resolve));}}}})().catch(error=>{console.error(error);process.exitCode=1;});
