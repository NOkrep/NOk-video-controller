// The compact toolbar preview with the real extension: on a page with its own video and through a cross-origin player frame.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const mediaHtml=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111}video{width:640px;height:360px}</style><video autoplay muted playsinline></video><script>
const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
const video=document.querySelector('video');video.srcObject=canvas.captureStream(10);video.play().catch(()=>{});
// A canvas stream may not keep a playback rate, so the requests themselves are recorded.
const rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.rates=[];
Object.defineProperty(video,'playbackRate',{configurable:true,get(){return rate.get.call(this);},set(value){window.rates.push(value);rate.set.call(this,value);}});</script>`;
const lastRate=expected=>window.rates.at(-1)===expected;
const visible=id=>{const node=document.getElementById(id);if(!node)return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(node).visibility!=='hidden';};
const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};};
const wheel=(id,deltaY)=>document.getElementById(id).dispatchEvent(new WheelEvent('wheel',{deltaY,deltaMode:0,bubbles:true,cancelable:true}));
(async()=>{let driver;
const media=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(mediaHtml);});
const parent=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<!doctype html><body style="margin:0"><iframe style="width:700px;height:420px" allow="autoplay" src="http://127.0.0.1:${media.address().port}/"></iframe></body>`);});
try{
  await new Promise(resolve=>media.listen(0,'127.0.0.1',resolve));
  await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true});
  await driver.install();
  const page=await driver.open(`http://127.0.0.1:${media.address().port}/`);
  await until(driver,page,()=>document.querySelector('video')?.readyState>=2,'video plays');
  await driver.toolbar(page);
  await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel opens');
  await driver.evaluate(page,()=>document.getElementById('pvc-a11y-keepVisible').click());

  // The classic panel stays the default; the preview switch turns the toolbar on.
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-controller-popup').classList.contains('pvc-layout-toolbar')),false,'classic by default');
  await driver.evaluate(page,()=>document.getElementById('pvc-layout-toolbar-toggle').click());
  await until(driver,page,()=>document.getElementById('pvc-controller-popup').classList.contains('pvc-layout-toolbar'),'toolbar layout');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-mode'),true,'the toolbar is shown');
  assert.equal(await driver.evaluate(page,visible,'pvc-drag-header'),false,'the classic header is hidden');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-mode-label').textContent),'Player');

  // Speed: preset, chip value, real playback rate, and the mouse wheel.
  await driver.pointerClick(page,'#pvc-tb-speed');
  await until(driver,page,visible,'speed popover opens','pvc-tb-pop-speed');
  const bar=await driver.evaluate(page,()=>{const r=document.querySelector('#pvc-toolbar .pvc-tb-bar').getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left};});
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-pop-speed')).top>bar.bottom,'opens below while the toolbar is in the upper half');
  await driver.pointerClick(page,'[data-pvc-speed="1.5"]');
  await until(driver,page,lastRate,'speed preset reaches the video',1.5);
  await until(driver,page,()=>document.getElementById('pvc-tb-speed-val').textContent==='1.5×','the chip shows 1.5×');
  await driver.evaluate(page,wheel,'pvc-tb-speed',100);
  await until(driver,page,lastRate,'wheel down lowers the speed',1.25);

  // One popover at a time: volume replaces speed.
  await driver.pointerClick(page,'#pvc-tb-volume');
  await until(driver,page,visible,'volume popover opens','pvc-tb-pop-volume');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-pop-speed'),false,'the speed popover closed');
  await driver.pointerClick(page,'[data-pvc-vol="0"]');
  await until(driver,page,()=>document.querySelector('video').muted===true&&document.getElementById('pvc-tb-volume-val').textContent==='0%','volume 0 mutes');
  await driver.pointerClick(page,'[data-pvc-vol="100"]');
  await until(driver,page,()=>document.querySelector('video').muted===false&&document.getElementById('pvc-tb-volume-val').textContent==='100%','volume back to 100');
  await driver.pointerClick(page,'#pvc-tb-mono');
  await until(driver,page,()=>document.getElementById('pvc-audio-mono-btn').classList.contains('pvc-audio-active')
    &&document.getElementById('pvc-tb-mono').getAttribute('aria-pressed')==='true','mono reaches the shared state');
  await driver.pointerClick(page,'#pvc-tb-stereo');

  // Seek step: popover choice, wheel stepping and the arrows' label.
  await driver.pointerClick(page,'#pvc-tb-seek-step');
  await until(driver,page,visible,'seek popover opens','pvc-tb-pop-seek');
  await driver.pointerClick(page,'[data-pvc-step="30"]');
  await until(driver,page,()=>document.getElementById('pvc-tb-seek-val').textContent==='30s','step 30s');
  await driver.evaluate(page,wheel,'pvc-tb-seek-step',-100);
  await until(driver,page,()=>document.getElementById('pvc-tb-seek-val').textContent==='60s','wheel up raises the step');
  assert.match(await driver.evaluate(page,()=>document.getElementById('pvc-tb-seek-fwd').getAttribute('data-pvc-tip')),/60/,'arrow hint follows the step');
  await driver.press(page,'Escape');
  await until(driver,page,()=>!document.getElementById('pvc-tb-pop-seek').getClientRects().length,'Escape closes the popover');

  // Quality and the playing strip mirror the classic panel's state.
  await until(driver,page,()=>/Playing \d+×\d+/.test(document.getElementById('pvc-tb-playing').textContent),'playing resolution shown');
  await driver.pointerClick(page,'#pvc-tb-quality');
  await until(driver,page,visible,'quality popover opens','pvc-tb-pop-quality');
  assert.ok(await driver.evaluate(page,()=>document.getElementById('pvc-tb-adapter').textContent.length>0),'adapter mirrored');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-target').options.length),
    await driver.evaluate(page,()=>document.getElementById('pvc-video-target').options.length),'video targets mirrored');

  // Lower half of the screen: the strip and popovers open above the bar.
  await driver.evaluate(page,()=>{const p=document.getElementById('pvc-controller-popup');p.style.setProperty('top',`${innerHeight-70}px`,'important');window.dispatchEvent(new Event('resize'));});
  await driver.pointerClick(page,'#pvc-tb-speed');
  await until(driver,page,visible,'speed popover opens again','pvc-tb-pop-speed');
  const low=await driver.evaluate(page,()=>{const r=document.querySelector('#pvc-toolbar .pvc-tb-bar').getBoundingClientRect();return{top:r.top};});
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-pop-speed')).bottom<low.top,'opens above in the lower half');
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-strip')).bottom<=low.top,'the strip moves above too');
  await driver.press(page,'Escape');
  await driver.evaluate(page,()=>{const p=document.getElementById('pvc-controller-popup');p.style.setProperty('top','16px','important');window.dispatchEvent(new Event('resize'));});

  // Groups: click moves on, the double-click list is as wide as its longest name and has no position text.
  await driver.pointerClick(page,'#pvc-tb-mode');
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Subtitles','next group');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-speed'),false,'player buttons hidden in another group');
  await driver.evaluate(page,()=>document.getElementById('pvc-tb-mode').dispatchEvent(new MouseEvent('dblclick',{bubbles:true})));
  await until(driver,page,visible,'group list opens','pvc-tb-pop-groups');
  const list=await driver.evaluate(page,()=>[...document.querySelectorAll('#pvc-tb-pop-groups button')].map(b=>({text:b.textContent.trim(),on:b.getAttribute('aria-current')})));
  assert.deepEqual(list.map(item=>item.text),['Player','Subtitles','Settings','Accessibility']);
  assert.equal(list.find(item=>item.on==='true').text,'Subtitles');
  await driver.pointerClick(page,'[data-pvc-goto="player"]');
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Player','list picks a group');
  await driver.evaluate(page,wheel,'pvc-tb-mode',-100);
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Accessibility','wheel up goes back past the first group');
  await driver.evaluate(page,wheel,'pvc-tb-mode',100);
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Player','wheel down returns');

  // Theme palette: the bar's border follows the theme's border colour.
  const borderOf=()=>getComputedStyle(document.querySelector('#pvc-toolbar .pvc-tb-bar')).borderTopColor;
  const before=await driver.evaluate(page,borderOf);
  await driver.evaluate(page,()=>{const select=document.getElementById('pvc-theme-select');select.value='daylight';select.dispatchEvent(new Event('change',{bubbles:true}));});
  await until(driver,page,(previous)=>getComputedStyle(document.querySelector('#pvc-toolbar .pvc-tb-bar')).borderTopColor!==previous,'theme reaches the toolbar',before);

  // Close bubble: shown beside the name on hover, to its left, and it closes FilmDeck.
  await driver.hover(page,'#pvc-tb-brand');
  await until(driver,page,visible,'bubble on hover','pvc-tb-bubble');
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-bubble')).right<=(await driver.evaluate(page,()=>document.querySelector('#pvc-toolbar .pvc-tb-bar').getBoundingClientRect().left))+1,'bubble opens to the left');
  await driver.pointerClick(page,'#pvc-tb-close');
  await until(driver,page,()=>document.getElementById('pvc-controller-popup').style.display==='none','close button closes FilmDeck');

  // Cross-origin player frame: the top toolbar drives the frame's video.
  const top=await driver.open(`http://127.0.0.1:${parent.address().port}/`);
  let owner=null;
  for(let i=0;i<100&&!owner;i++){await delay(100);for(const frame of await driver.frames(top))if(await driver.evaluate(frame.target,()=>document.querySelector('video')?.readyState>=2).catch(()=>false))owner=frame.target;}
  assert.ok(owner,'frame video plays');
  await driver.toolbar(top);
  await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','top panel opens');
  await driver.evaluate(top,()=>{document.getElementById('pvc-a11y-keepVisible').click();document.getElementById('pvc-layout-toolbar-toggle').click();});
  await until(driver,top,()=>document.getElementById('pvc-controller-popup').classList.contains('pvc-layout-toolbar'),'top toolbar layout');
  await driver.pointerClick(top,'#pvc-tb-speed');
  await until(driver,top,visible,'top speed popover','pvc-tb-pop-speed');
  await driver.pointerClick(top,'[data-pvc-speed="2.0"]');
  await until(driver,owner,lastRate,'speed reaches the frame video',2);
  await until(driver,top,()=>document.getElementById('pvc-tb-speed-val').textContent==='2.0×','top chip shows the frame state');
  console.log(JSON.stringify({engine,version:driver.version,result:'pass'}));
}finally{await driver?.close();media.close();parent.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
