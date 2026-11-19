// D-06: the video's own audio and subtitle tracks, with the installed extension.
// Real Hls.js (tests/artifacts/runtime, checksum-verified by prepare-browser-fixtures.cjs) plays the committed
// tests/fixtures/hls-tracks stream (two audio and two subtitle renditions). A plain <video> with two <track>
// elements covers the browser's own lists, and a cross-origin frame covers the top panel driving the frame.
// node tests/media-tracks-browser.cjs --engine=firefox|chromium
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const {createDriver,until}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const root=path.join(__dirname,'fixtures'),runtime=path.join(__dirname,'artifacts','runtime','hls.min.js'),vjsRuntime=path.join(__dirname,'artifacts','runtime','video.min.js');
if(!fs.existsSync(runtime)||!fs.existsSync(vjsRuntime))throw new Error('Hls.js or Video.js runtime missing: node tests/prepare-browser-fixtures.cjs --runtimes-only --download-runtimes');
const vjsPage=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111}.video-js{width:640px;height:360px}</style><video id="v" class="video-js" muted autoplay playsinline></video>
<script src="/runtime/video.min.js"></script><script>const player=videojs('v');window.player=player;player.src({src:'/fixtures/hls-tracks/master.m3u8',type:'application/x-mpegURL'});player.play()?.catch?.(()=>{});</script>`;
const types={'.m3u8':'application/vnd.apple.mpegurl','.ts':'video/mp2t','.vtt':'text/vtt; charset=utf-8'};
const hlsPage=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111}video{width:640px;height:360px}</style><video muted autoplay playsinline></video>
<script src="/runtime/hls.min.js"></script><script>const video=document.querySelector('video');const hls=new Hls();window.hls=hls;hls.attachMedia(video);hls.loadSource('/fixtures/hls-tracks/master.m3u8');video.play().catch(()=>{});</script>`;
const nativePage=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111}video{width:640px;height:360px}</style><video muted autoplay playsinline>
<track kind="subtitles" srclang="tr" label="Türkçe" src="/fixtures/hls-tracks/sub-tr.vtt"><track kind="subtitles" srclang="en" label="English" src="/fixtures/hls-tracks/sub-en.vtt"></video><script>
const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
const video=document.querySelector('video');video.srcObject=canvas.captureStream(10);video.play().catch(()=>{});</script>`;
const serve=(req,res)=>{const url=new URL(req.url,'http://x');
  if(url.pathname==='/runtime/hls.min.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(fs.readFileSync(runtime));return;}
  if(url.pathname==='/runtime/video.min.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(fs.readFileSync(vjsRuntime));return;}
  if(url.pathname==='/vjs'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(vjsPage);return;}
  if(url.pathname.startsWith('/fixtures/')){const file=path.join(root,path.normalize(url.pathname.slice(10)));
    if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Access-Control-Allow-Origin':'*'});res.end(fs.readFileSync(file));return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(url.pathname==='/native'?nativePage:hlsPage);};
const media=http.createServer(serve),parent=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<!doctype html><body style="margin:0"><iframe style="width:700px;height:420px" allow="autoplay" src="http://127.0.0.1:${media.address().port}/hls"></iframe></body>`);});
const visible=id=>{const node=document.getElementById(id);return !!node&&node.getClientRects().length>0;};
const options=id=>[...document.querySelectorAll(`#${id} [data-pvc-value]`)].map(node=>({label:node.textContent,on:node.classList.contains('pvc-tb-on')}));
const pick=([id,label])=>{const node=[...document.querySelectorAll(`#${id} [data-pvc-value]`)].find(item=>item.textContent===label);if(!node)return false;node.click();return true;};
(async()=>{let driver;
try{
  await new Promise(resolve=>media.listen(0,'127.0.0.1',resolve));await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true});
  await driver.install();
  // Hls.js: two audio and two subtitle renditions.
  const page=await driver.open(`http://127.0.0.1:${media.address().port}/hls`);
  await until(driver,page,()=>window.hls?.audioTracks?.length===2&&window.hls.subtitleTracks?.length===2&&document.querySelector('video').readyState>=2,'Hls.js lists its tracks and plays');
  await driver.toolbar(page);
  await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel opens');
  await driver.evaluate(page,()=>document.getElementById('pvc-a11y-keepVisible').click());
  await driver.pointerClick(page,'#pvc-tb-volume');
  await until(driver,page,visible,'the volume popover shows the audio tracks','pvc-tb-audiotracks-card');
  assert.deepEqual(await driver.evaluate(page,options,'pvc-tb-audiotracks-list'),[{label:'Türkçe',on:true},{label:'English',on:false}],'audio tracks with the playing one marked');
  assert.equal(await driver.evaluate(page,pick,['pvc-tb-audiotracks-list','English']),true);
  await until(driver,page,()=>window.hls.audioTrack===1,'English audio reaches Hls.js');
  await until(driver,page,()=>document.querySelector('#pvc-tb-audiotracks-list .pvc-tb-on')?.textContent==='English','the list follows the choice');
  await driver.press(page,'Escape');
  await driver.evaluate(page,()=>document.querySelector('[data-pvc-goto="subtitles"]').click());
  await until(driver,page,visible,'the subtitle tracks chip appears','pvc-tb-sub-tracks');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-sub-tracks-val').textContent),'Video subtitles','no track shown yet');
  await driver.pointerClick(page,'#pvc-tb-sub-tracks');
  await until(driver,page,visible,'subtitle tracks popover','pvc-tb-pop-subtracks');
  assert.deepEqual(await driver.evaluate(page,options,'pvc-tb-subtracks-list'),[{label:'Off',on:true},{label:'Türkçe',on:false},{label:'English',on:false}]);
  assert.equal(await driver.evaluate(page,pick,['pvc-tb-subtracks-list','English']),true);
  await until(driver,page,()=>window.hls.subtitleTrack===1&&window.hls.subtitleDisplay===true,'English subtitles reach Hls.js');
  await until(driver,page,()=>document.getElementById('pvc-tb-sub-tracks-val').textContent==='English','the chip names the shown track');
  await until(driver,page,()=>[...document.querySelector('video').textTracks].some(track=>track.mode==='showing'&&/English/.test(track.label)),'the browser shows the English track');
  assert.equal(await driver.evaluate(page,pick,['pvc-tb-subtracks-list','Off']),true);
  await until(driver,page,()=>window.hls.subtitleTrack===-1,'Off turns the subtitles off');
  await driver.press(page,'Escape');
  // The Easy-read panel has the same choices as selects.
  await driver.evaluate(page,()=>{const select=document.getElementById('pvc-audio-tracks-select');select.value=[...select.options].find(option=>option.textContent==='Türkçe').value;select.dispatchEvent(new Event('change',{bubbles:true}));});
  await until(driver,page,()=>window.hls.audioTrack===0,'the classic select changes the audio track');
  assert.deepEqual(await driver.evaluate(page,()=>[...document.getElementById('pvc-sub-tracks-select').options].map(option=>option.textContent)),['Off','Türkçe','English']);

  // The browser's own lists: two <track> elements; FilmDeck's track for a loaded file is never listed.
  const native=await driver.open(`http://127.0.0.1:${media.address().port}/native`);
  await until(driver,native,()=>document.querySelector('video').readyState>=2,'native video plays');
  await driver.toolbar(native);
  await until(driver,native,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','native panel opens');
  await driver.evaluate(native,()=>{document.getElementById('pvc-a11y-keepVisible').click();document.querySelector('[data-pvc-goto="subtitles"]').click();
    const input=document.getElementById('pvc-sub-file-input'),data=new DataTransfer();data.items.add(new File(['1\n00:00:01,000 --> 00:00:03,000\nOwn\n'],'own.srt',{type:'text/plain'}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));});
  await until(driver,native,()=>[...document.querySelector('video').textTracks].some(track=>track.label==='NOk Harici Altyazı'),'the loaded file adds FilmDeck\'s own track');
  await until(driver,native,visible,'native subtitle tracks chip','pvc-tb-sub-tracks');
  await driver.pointerClick(native,'#pvc-tb-sub-tracks');
  await until(driver,native,visible,'native subtitle tracks popover','pvc-tb-pop-subtracks');
  assert.deepEqual(await driver.evaluate(native,options,'pvc-tb-subtracks-list'),[{label:'Off',on:true},{label:'Türkçe',on:false},{label:'English',on:false}],'FilmDeck\'s own track is not listed');
  assert.equal(await driver.evaluate(native,pick,['pvc-tb-subtracks-list','Türkçe']),true);
  await until(driver,native,()=>{const tracks=[...document.querySelector('video').textTracks];return tracks.find(track=>track.label==='Türkçe').mode==='showing'&&tracks.find(track=>track.label==='English').mode==='disabled';},'the chosen native track shows');
  assert.equal(await driver.evaluate(native,()=>[...document.querySelector('video').textTracks].find(track=>track.label==='NOk Harici Altyazı').mode),'hidden','FilmDeck\'s own track keeps its own mode');
  assert.equal(await driver.evaluate(native,visible,'pvc-tb-audiotracks-card'),false,'no audio card for a single audio track');

  // Video.js with VHS: its own audio and text track lists.
  const vjs=await driver.open(`http://127.0.0.1:${media.address().port}/vjs`);
  await until(driver,vjs,()=>window.player?.audioTracks?.().length===2&&Array.from(window.player.textTracks()).filter(track=>track.kind==='subtitles').length===2&&document.querySelector('video').readyState>=2,'Video.js lists its tracks and plays');
  await driver.toolbar(vjs);
  await until(driver,vjs,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','Video.js panel opens');
  await driver.evaluate(vjs,()=>document.getElementById('pvc-a11y-keepVisible').click());
  await until(driver,vjs,()=>document.querySelectorAll('#pvc-tb-audiotracks-list [data-pvc-value]').length===2,'Video.js audio tracks listed');
  assert.equal(await driver.evaluate(vjs,pick,['pvc-tb-audiotracks-list','English']),true);
  await until(driver,vjs,()=>window.player.audioTracks()[1].enabled===true&&window.player.audioTracks()[0].enabled===false,'Video.js switches the audio track');
  assert.equal(await driver.evaluate(vjs,pick,['pvc-tb-subtracks-list','English']),true);
  await until(driver,vjs,()=>Array.from(window.player.textTracks()).find(track=>track.kind==='subtitles'&&/English/.test(track.label))?.mode==='showing','Video.js shows the English text track');

  // Cross-origin frame: the top panel lists the frame's tracks and the frame applies the choice.
  const top=await driver.open(`http://127.0.0.1:${parent.address().port}/`);
  let owner=null;
  for(let i=0;i<100&&!owner;i++){await new Promise(resolve=>setTimeout(resolve,100));for(const frame of await driver.frames(top))if(await driver.evaluate(frame.target,()=>window.hls?.audioTracks?.length===2).catch(()=>false))owner=frame.target;}
  assert.ok(owner,'frame Hls.js ready');
  await driver.toolbar(top);
  await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','top panel opens');
  await driver.evaluate(top,()=>document.getElementById('pvc-a11y-keepVisible').click());
  await until(driver,top,()=>document.querySelectorAll('#pvc-tb-audiotracks-list [data-pvc-value]').length===2,'the frame reports its audio tracks');
  await driver.evaluate(top,()=>document.getElementById('pvc-tb-volume').click());
  assert.equal(await driver.evaluate(top,pick,['pvc-tb-audiotracks-list','English']),true);
  await until(driver,owner,()=>window.hls.audioTrack===1,'the frame applies the top panel\'s choice');
  await until(driver,top,()=>document.querySelector('#pvc-tb-audiotracks-list .pvc-tb-on')?.textContent==='English','the top list follows the frame');
  console.log(JSON.stringify({engine,version:driver.version,result:'pass'}));
}finally{await driver?.close();media.close();parent.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
