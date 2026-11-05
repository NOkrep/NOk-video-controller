// The panel tooltip with a real pointer and keyboard; touch uses synthetic pointer events, on a page and through a cross-origin player frame.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const mediaHtml=`<!doctype html><meta charset="utf-8"><style>video{width:640px;height:360px}</style><video autoplay muted playsinline></video><script>
const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
const video=document.querySelector('video');video.srcObject=canvas.captureStream(10);video.play().catch(()=>{});</script>`;
const state=()=>{const tip=document.getElementById('pvc-tooltip'),describedBy=document.querySelector('[aria-describedby="pvc-tooltip"]');
  return{open:!!tip&&!tip.hidden,text:tip?.textContent||'',owner:describedBy?.id||null,panel:document.getElementById('pvc-controller-popup').style.display};};
const opened=(driver,page,label)=>until(driver,page,()=>{const tip=document.getElementById('pvc-tooltip');return !!tip&&!tip.hidden;},label);
const closed=(driver,page,label)=>until(driver,page,()=>{const tip=document.getElementById('pvc-tooltip');return !tip||tip.hidden;},label);
const touch=(driver,page,id,type)=>driver.evaluate(page,(id,type)=>{const node=document.getElementById(id),r=node.getBoundingClientRect();
  node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,composed:true,pointerType:'touch',pointerId:5,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));},id,type);
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
  await driver.evaluate(page,()=>document.getElementById('pvc-a11y-keepVisible').click());
  await until(driver,page,()=>!!document.getElementById('pvc-active-adapter-badge')?.getAttribute('data-pvc-tip'),'adapter has its explanation');

  // Pointer: a delay first, on-screen and unclipped although the panel scrolls, no native tip beside it.
  const hoverable=await driver.evaluate(page,()=>matchMedia('(hover: hover)').matches);
  const results=[];
  if(hoverable){
    await driver.hover(page,'#pvc-active-adapter-badge');
    assert.equal((await driver.evaluate(page,state)).open,false,'no tooltip before its delay');
    await opened(driver,page,'hover opens it');
    const shown=await driver.evaluate(page,state);
    assert.match(shown.text,/video element|Universal/,'the adapter level is explained');
    assert.equal(shown.owner,'pvc-active-adapter-badge','screen readers get it as a description');
    assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-active-adapter-badge').hasAttribute('title')),false,'no native tip on top');
    const box=await driver.evaluate(page,()=>{const tip=document.getElementById('pvc-tooltip'),r=tip.getBoundingClientRect(),style=getComputedStyle(tip);
      return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.id,role:tip.getAttribute('role'),duration:style.transitionDuration};});
    assert.ok(box.left>=0&&box.right<=box.w&&box.top>=0&&box.bottom<=box.h,'inside the viewport');
    assert.equal(box.hit,'pvc-tooltip','not clipped by the scrolling panel');assert.equal(box.role,'tooltip');
    // The next neighbour opens at once, and the pointer may travel onto the text to read it.
    await driver.evaluate(page,()=>document.getElementById('pvc-change-adapter-btn').setAttribute('data-pvc-tip','Neighbour'));
    await driver.hover(page,'#pvc-change-adapter-btn');
    await until(driver,page,()=>document.getElementById('pvc-tooltip').textContent==='Neighbour','the neighbour switches');
    await driver.hover(page,'#pvc-tooltip');await delay(500);
    assert.equal((await driver.evaluate(page,state)).open,true,'stays open under the pointer');
    // Escape only closes the tooltip, and it stays closed until the pointer leaves.
    await driver.press(page,'Escape');await closed(driver,page,'Escape closes it');
    assert.equal((await driver.evaluate(page,state)).panel,'block','the panel stays');
    await driver.hover(page,'#pvc-video-target');await closed(driver,page,'leaving keeps it closed');
    // A press closes it: the action's own result takes over.
    await driver.hover(page,'#pvc-change-adapter-btn');await opened(driver,page,'hover again');
    await driver.hover(page,'#pvc-video-target');await closed(driver,page,'leaving closes it');
    await driver.evaluate(page,()=>document.getElementById('pvc-change-adapter-btn').removeAttribute('data-pvc-tip'));
    results.push('pointer');
  }

  // Keyboard: Tab reaches the status badge, opens at once, Escape and moving on close it.
  await driver.evaluate(page,()=>{document.getElementById('pvc-tab-player').focus();});
  let reached=false;
  for(let step=0;step<40&&!reached;step++){await driver.press(page,'Tab');reached=await driver.evaluate(page,()=>document.activeElement?.id==='pvc-active-adapter-badge');}
  assert.ok(reached,'Tab reaches the adapter badge');
  await opened(driver,page,'focus opens it');
  assert.equal((await driver.evaluate(page,state)).owner,'pvc-active-adapter-badge');
  await driver.press(page,'Escape');await closed(driver,page,'Escape closes the keyboard tooltip');
  assert.equal(await driver.evaluate(page,()=>document.activeElement?.id),'pvc-active-adapter-badge','focus stays');
  assert.equal((await driver.evaluate(page,state)).panel,'block');
  await driver.press(page,'Shift+Tab');await driver.press(page,'Tab');await opened(driver,page,'coming back opens it');
  await driver.press(page,'Tab');await closed(driver,page,'moving on closes it');

  // Panel settings apply while it is open; the language changes the open text.
  await driver.evaluate(page,()=>document.getElementById('pvc-active-adapter-badge').focus());
  await opened(driver,page,'focus for settings');
  const english=(await driver.evaluate(page,state)).text;
  await driver.evaluate(page,()=>{const language=document.querySelector('#pvc-language-select');language.value='tr';language.dispatchEvent(new Event('change',{bubbles:true}));});
  await until(driver,page,english=>document.getElementById('pvc-tooltip').textContent!==english,'the open text follows the language',english);
  await driver.evaluate(page,()=>{const language=document.querySelector('#pvc-language-select');language.value='en';language.dispatchEvent(new Event('change',{bubbles:true}));});
  // Keyboard opens without the entrance; the entrance itself must still obey the setting.
  const motion=await driver.evaluate(page,()=>{document.getElementById('pvc-tooltip').removeAttribute('data-instant');const before=getComputedStyle(document.getElementById('pvc-tooltip')).transitionDuration;document.getElementById('pvc-a11y-reduceMotion').click();
    const during=getComputedStyle(document.getElementById('pvc-tooltip')).transitionDuration;document.getElementById('pvc-a11y-reduceMotion').click();return{before,during};});
  assert.match(motion.before,/0\.125s/);assert.match(motion.during,/^0s/);
  await driver.evaluate(page,()=>document.getElementById('pvc-active-adapter-badge').blur());await closed(driver,page,'blur closes it');

  // Touch: a long press explains a button without running it; a tap explains a status; a tap elsewhere closes.
  await driver.pointerClick(page,'#pvc-tab-settings');
  await until(driver,page,()=>document.getElementById('pvc-ping-btn')?.getClientRects().length>0,'settings shows CDN');
  const tip=await driver.evaluate(page,()=>document.getElementById('pvc-ping-btn').getAttribute('data-pvc-tip'));
  assert.ok(tip,'CDN has its explanation');
  await touch(driver,page,'pvc-ping-btn','pointerdown');await delay(200);
  await touch(driver,page,'pvc-ping-btn','pointerup');await delay(100);
  assert.equal((await driver.evaluate(page,state)).open,false,'a short tap on a button does not open it');
  await touch(driver,page,'pvc-ping-btn','pointerdown');await opened(driver,page,'a long press opens it');
  await touch(driver,page,'pvc-ping-btn','pointerup');
  await driver.evaluate(page,()=>document.getElementById('pvc-ping-btn').click());
  assert.notEqual(await driver.evaluate(page,()=>document.getElementById('pvc-ping-btn').getAttribute('aria-busy')),'true','the release does not start a measurement');
  assert.equal((await driver.evaluate(page,state)).open,true,'it stays to be read');
  await driver.evaluate(page,()=>document.getElementById('pvc-tab-player').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,composed:true,pointerType:'touch',pointerId:6})));
  await closed(driver,page,'a tap elsewhere closes it');
  await delay(600);
  await driver.evaluate(page,()=>document.getElementById('pvc-ping-btn').click());
  await until(driver,page,()=>document.getElementById('pvc-ping-btn').getAttribute('aria-busy')!=='true','the next real tap measures');
  // Removing what it explains closes it.
  await driver.evaluate(page,()=>document.getElementById('pvc-tab-player').click());
  await driver.evaluate(page,()=>document.getElementById('pvc-active-adapter-badge').focus());await touch(driver,page,'pvc-active-adapter-badge','pointerdown');await touch(driver,page,'pvc-active-adapter-badge','pointerup');
  await opened(driver,page,'a tap explains a status');
  await driver.evaluate(page,()=>document.getElementById('pvc-tab-settings').click());
  await closed(driver,page,'a hidden target closes it');
  results.push('keyboard','touch');

  // The panel at the top of a page explains the state its player frame reports.
  const top=await driver.open(`http://127.0.0.1:${parent.address().port}/`);
  await delay(1500);
  await driver.toolbar(top);
  await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','embedded panel opens');
  await until(driver,top,()=>!!document.getElementById('pvc-active-adapter-badge')?.getAttribute('data-pvc-tip'),'the frame state explains the adapter');
  await driver.evaluate(top,()=>{document.getElementById('pvc-a11y-keepVisible').click();document.getElementById('pvc-active-adapter-badge').focus();});
  await opened(driver,top,'embedded focus opens it');
  assert.match((await driver.evaluate(top,state)).text,/video element|Universal/);
  results.push('embedded');
  console.log(JSON.stringify({engine,browserVersion:driver.version,hoverable,results,result:'passed'}));
}finally{try{await driver?.close();}finally{for(const host of [parent,media]){host.closeAllConnections();await new Promise(resolve=>host.close(resolve));}}}})().catch(error=>{console.error(error);process.exitCode=1;});
