// Real Video.js/VHS with test-owned HLS: playlist labels never replace decoded evidence.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until}=require('./resource-driver.cjs');
const {serveLibraryAsset,libraryHtml}=require('./library-fixtures.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
(async()=>{let driver;const server=http.createServer((req,res)=>{
  if(req.url==='/shared/master.m3u8'){
    res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl'});
    res.end('#EXTM3U\n'+[480,720,1080].map((height,index)=>`#EXT-X-STREAM-INF:BANDWIDTH=${600000+index*1500000},RESOLUTION=${Math.round(height*16/9)}x${height}\n/hls/720.m3u8\n`).join(''));return;
  }
  if(serveLibraryAsset(req,res))return;
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(libraryHtml('videojs').replace("'/hls/master.m3u8'",req.url==='/shared'?"'/shared/master.m3u8'":"'/hls/master.m3u8'"));
});
const parent=http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<iframe style="width:850px;height:550px" allow="autoplay" src="http://127.0.0.1:${server.address().port}/shared"></iframe>`);
});
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true});
  await driver.install();const results=[];
  for(const [kind,embedded] of [['shared',false],['distinct',false],['shared',true]]){
    const page=await driver.open(`http://127.0.0.1:${(embedded?parent:server).address().port}/${kind}`);
    let media=page;
    if(embedded){
      for(const frame of await driver.frames(page))if(await driver.evaluate(frame.target,()=>!!document.querySelector('video'))){media=frame.target;break;}
      assert.notEqual(media,page,'cross-origin child is the media owner');
    }
    await until(driver,media,()=>document.querySelector('video')?.readyState>=2,'synthetic VHS decodes');
    await driver.toolbar(page);
    await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','toolbar opens');
    await driver.evaluate(page,()=>{document.getElementById('pvc-a11y-keepVisible').click();document.getElementById('pvc-tab-player').click();document.querySelector('#pvc-section-quality .pvc-section-header').click();});
    await until(driver,page,()=>document.querySelectorAll('#pvc-dynamic-quality-container button').length===3,'three declared levels');
    const shared=await driver.evaluate(page,()=>document.getElementById('pvc-dynamic-quality-container').textContent.includes('same playlist'));
    assert.equal(shared,kind==='shared');
    await driver.evaluate(page,()=>{const b=[...document.querySelectorAll('#pvc-dynamic-quality-container button')].find(b=>b.textContent==='480p');b.click();});
    if(kind==='distinct')await until(driver,media,()=>document.querySelector('video').videoHeight===480,'distinct playlist decodes requested resolution');
    else await until(driver,page,()=>/Not confirmed/.test(document.getElementById('pvc-quality-status').textContent),'shared playlist stays unconfirmed');
    const result=await driver.evaluate(page,()=>({confirmed:[...document.querySelectorAll('#pvc-dynamic-quality-container [aria-pressed="true"]')].map(n=>n.textContent)}));
    result.height=await driver.evaluate(media,()=>document.querySelector('video').videoHeight);
    if(kind==='shared'){assert.equal(result.height,720);assert.equal(result.confirmed.includes('480p'),false);}
    assert.equal(await driver.evaluate(page,()=>[...document.querySelectorAll('.pvc-quality-inventory-note')].every(n=>n.scrollWidth<=n.clientWidth+1)),true,'quality notes fit their panels');
    await driver.evaluate(page,()=>document.getElementById('pvc-report-err-btn').click());
    await until(driver,page,()=>!!document.getElementById('pvc-modal-code-block')?.textContent,'diagnostic preview arrives');
    const report=await driver.evaluate(page,()=>JSON.parse(document.getElementById('pvc-modal-code-block').textContent));
    assert.equal(report.quality.playlistMapping,kind==='shared'?'shared-playlist':'distinct-playlists');
    assert.equal(JSON.stringify(report).includes('/hls/'),false);
    results.push({kind,embedded,...result});
  }
  console.log(JSON.stringify({engine,browserVersion:driver.version,results,result:'passed'}));
}finally{try{await driver?.close();}finally{for(const host of [parent,server]){host.closeAllConnections();await new Promise(resolve=>host.close(resolve));}}}})().catch(error=>{console.error(error);process.exitCode=1;});
