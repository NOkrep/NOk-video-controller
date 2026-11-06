// The subtitles tab's explanation and a replaced video, on a page and through a cross-origin player frame. Synthetic stream and file only.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const mediaHtml=`<!doctype html><meta charset="utf-8"><style>video{width:640px;height:360px}</style><video autoplay muted playsinline></video><script>
const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
window.__stream=canvas.captureStream(10);const video=document.querySelector('video');video.srcObject=window.__stream;video.play().catch(()=>{});
window.__replace=()=>{const old=document.querySelector('video'),next=document.createElement('video');next.muted=true;next.autoplay=true;next.playsInline=true;next.srcObject=window.__stream;old.replaceWith(next);next.play().catch(()=>{});};
</script>`;
const stamp=seconds=>{const whole=Math.floor(seconds);return `${String(Math.floor(whole/3600)).padStart(2,'0')}:${String(Math.floor(whole/60)%60).padStart(2,'0')}:${String(whole%60).padStart(2,'0')},${String(Math.round((seconds-whole)*1000)).padStart(3,'0')}`;};
const srt=list=>list.map(([from,to,text],index)=>`${index+1}\n${stamp(from)} --> ${stamp(to)}\n${text}\n`).join('\n');
const load=(driver,page,text)=>driver.evaluate(page,text=>{const input=document.getElementById('pvc-sub-file-input'),data=new DataTransfer();
  data.items.add(new File([text],'synthetic.srt',{type:'text/plain'}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));},text);
const why=()=>{const line=document.getElementById('pvc-sub-why');return line.hidden?null:line.textContent;};
const overlay=()=>{const node=document.getElementById('pvc-subtitle-overlay');return node?getComputedStyle(node).display:'none';};
const waitWhy=(driver,page,pattern,label)=>until(driver,page,source=>{const line=document.getElementById('pvc-sub-why');return !line.hidden&&new RegExp(source).test(line.textContent);},label,pattern.source);
(async()=>{let driver;
const media=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(mediaHtml);});
const parent=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<!doctype html><iframe style="width:700px;height:420px" allow="autoplay" src="http://127.0.0.1:${media.address().port}/"></iframe>`);});
try{
  await new Promise(resolve=>media.listen(0,'127.0.0.1',resolve));
  await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true});
  await driver.install();
  const page=await driver.open(`http://127.0.0.1:${media.address().port}/`);
  await until(driver,page,()=>document.querySelector('video')?.readyState>=2,'video plays');
  await driver.toolbar(page);
  await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel opens');
  await driver.evaluate(page,()=>{document.getElementById('pvc-a11y-keepVisible').click();document.getElementById('pvc-tab-subtitles').click();});
  assert.equal(await driver.evaluate(page,why),null,'no file, nothing to explain');

  // A gap in the file names the next line, in the panel's language.
  const now=await driver.evaluate(page,()=>document.querySelector('video').currentTime);
  await load(driver,page,srt([[now+95,now+97,'Private line text']]));
  await waitWhy(driver,page,/Next line in 1:[23]\d/,'a gap names the next line');
  assert.equal(await driver.evaluate(page,overlay),'none');
  assert.doesNotMatch(await driver.evaluate(page,why),/Private/,'never the text of a line');
  await driver.evaluate(page,()=>{const language=document.querySelector('#pvc-language-select');language.value='tr';language.dispatchEvent(new Event('change',{bubbles:true}));});
  await waitWhy(driver,page,/Sıradaki satır/,'it follows the panel language');
  await driver.evaluate(page,()=>{const language=document.querySelector('#pvc-language-select');language.value='en';language.dispatchEvent(new Event('change',{bubbles:true}));});

  // A stalled video is not reported as a gap, and a paused one is not reported as loading.
  await driver.evaluate(page,()=>Object.defineProperty(document.querySelector('video'),'readyState',{configurable:true,get:()=>1}));
  await waitWhy(driver,page,/video is loading/,'a stalled video says so');
  await driver.evaluate(page,()=>{document.querySelector('video').pause();});
  await waitWhy(driver,page,/Next line in/,'a paused video is not loading');
  await driver.evaluate(page,()=>{const video=document.querySelector('video');delete video.readyState;video.play();});

  // Hidden on request.
  await driver.evaluate(page,()=>document.getElementById('pvc-sub-toggle-btn').click());
  await waitWhy(driver,page,/hidden/,'hidden says hidden');
  await driver.evaluate(page,()=>document.getElementById('pvc-sub-toggle-btn').click());

  // The file's end.
  await load(driver,page,srt([[0,0.1,'Short']]));
  await waitWhy(driver,page,/no more lines/,'past the last line');

  // A line on screen needs no explanation.
  await load(driver,page,srt([[0,7200,'Long line']]));
  await until(driver,page,()=>getComputedStyle(document.getElementById('pvc-subtitle-overlay')).display==='block','the line shows');
  await until(driver,page,()=>document.getElementById('pvc-sub-why').hidden,'nothing to explain');

  // The site replaces its video while the panel is closed: subtitles follow, and go when the video goes.
  await driver.evaluate(page,()=>document.getElementById('pvc-close-popup-btn').click());
  await driver.evaluate(page,()=>window.__replace());
  await until(driver,page,()=>document.querySelector('video').__nokMonitored===true,'the new element is watched with the panel closed');
  await until(driver,page,()=>getComputedStyle(document.getElementById('pvc-subtitle-overlay')).display==='block','the line stays with the new video');
  await driver.evaluate(page,()=>document.querySelector('video').remove());
  await until(driver,page,()=>getComputedStyle(document.getElementById('pvc-subtitle-overlay')).display==='none','no video, no leftover line');

  // Through a cross-origin frame the panel explains from the frame's numbers.
  const top=await driver.open(`http://127.0.0.1:${parent.address().port}/`);
  await delay(1500);
  await driver.toolbar(top);
  await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','embedded panel opens');
  await driver.evaluate(top,()=>{document.getElementById('pvc-a11y-keepVisible').click();document.getElementById('pvc-tab-subtitles').click();});
  let owner=top;
  for(let attempt=0;attempt<60&&owner===top;attempt++){
    for(const frame of await driver.frames(top))if(await driver.evaluate(frame.target,()=>!!document.querySelector('video')))owner=frame.target;
    if(owner===top)await delay(100);
  }
  assert.notEqual(owner,top,'the child owns the media');
  const inFrame=await driver.evaluate(owner,()=>document.querySelector('video').currentTime);
  await load(driver,top,srt([[inFrame+95,inFrame+97,'Private line text']]));
  await waitWhy(driver,top,/Next line in 1:[23]\d/,'the embedded gap names the next line');
  assert.doesNotMatch(await driver.evaluate(top,why),/Private/);
  await driver.evaluate(top,()=>document.getElementById('pvc-sub-toggle-btn').click());
  await waitWhy(driver,top,/hidden/,'embedded hidden says hidden');
  console.log(JSON.stringify({engine,browserVersion:driver.version,result:'passed',checks:['gap','language','stalled','paused','hidden','end','showing','replaced with panel closed','removed','embedded']}));
}finally{try{await driver?.close();}finally{for(const host of [parent,media]){host.closeAllConnections();await new Promise(resolve=>host.close(resolve));}}}})().catch(error=>{console.error(error);process.exitCode=1;});
