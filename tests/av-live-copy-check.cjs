// Verifies the measurement copy on the local synthetic HLS fixture: fields, marks, command log and export shape.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox',artifacts=path.join(__dirname,'artifacts');
const executable=engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
(async()=>{
  const server=http.createServer((req,res)=>{
    const match=req.url.split('?')[0].match(/^\/(hls-av\/av(?:-\d{3}\.ts|\.m3u8)|runtime\/hls\.min\.js)$/);
    if(match){res.writeHead(200,{'Content-Type':match[1].endsWith('.js')?'application/javascript':match[1].endsWith('.m3u8')?'application/vnd.apple.mpegurl':'video/mp2t'});fs.createReadStream(path.join(artifacts,match[1])).pipe(res);return;}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    res.end(`<!doctype html><title>private-title-marker</title><meta charset="utf-8"><video autoplay muted playsinline style="width:640px;height:360px"></video><button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Open</button><script src="/runtime/hls.min.js"></script><script>
      const start=setInterval(()=>{if(!window.__NOK_VIDEO_CONTROLLER_INJECTED__)return;clearInterval(start);const video=document.querySelector('video'),player=new Hls();player.loadSource('/hls-av/av.m3u8');player.attachMedia(video);player.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));},25);</script>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let driver;
  try{
    driver=await createDriver(engine,executable,path.resolve(__dirname,'../node_modules'),{viewport:{width:1100,height:800},visible:args.headless!=='true',extensionRoot:path.join(artifacts,'av-live-copy')});
    await driver.install();const page=await driver.open(`http://127.0.0.1:${server.address().port}/secret-path-marker?token=private-query-marker`);await driver.activate(page);
    await until(driver,page,()=>document.querySelector('video')?.readyState>=2&&!!document.getElementById('nok-i07-probe'),'probe panel');
    await driver.pointerClick(page,'#open');
    await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','HUD still opens in the copy');
    await driver.evaluate(page,()=>{const input=document.getElementById('pvc-speed-slider');input.value='1.5';input.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('pvc-seek-p10').click();});
    await delay(11000);
    await driver.evaluate(page,()=>[...document.querySelectorAll('#nok-i07-probe button')][0].click());
    const report=await driver.evaluate(page,()=>window.__NOK_AV_PROBE__.report());
    const text=JSON.stringify(report);
    for(const marker of ['private-title-marker','secret-path-marker','private-query-marker','127.0.0.1','http'])assert.ok(!text.includes(marker),'export must not contain '+marker);
    assert.equal(report.kind,'filmdeck-i07-measurement');
    assert.ok(report.windows.length>=2,'periodic windows');
    assert.equal(report.marks[0].kind,'sync');
    assert.ok(report.changes.some(row=>row.kind==='rate'&&row.rate===1.5),'rate command observed');
    assert.ok(report.changes.some(row=>row.kind==='seek'),'seek command observed');
    const row=report.windows.at(-1);
    assert.equal(row.blob,true);assert.ok(row.frames>0,'frames sampled');assert.ok(row.lagMedianMs!==null,'lag sampled');
    console.log(JSON.stringify({engine,browser:driver.version,bytes:text.length,changes:report.changes.length,windows:report.windows.map(item=>({rate:item.rate,clockRate:item.clockRate,frameRate:item.frameRate,lagMedianMs:item.lagMedianMs,lagP90Ms:item.lagP90Ms,frames:item.frames,dropped:item.dropped}))}));
  }finally{if(driver)await driver.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
