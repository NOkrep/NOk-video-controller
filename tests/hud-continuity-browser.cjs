// I-08: installed extension, isolated profile, local synthetic media. Measures HUD position, visible panel count and control reach.
// node tests/hud-continuity-browser.cjs --engine=firefox|chromium [--report=true]
// --report prints observations without failing; the default mode asserts the accepted behaviour.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox',reportOnly=args.report==='true';
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const videoScript=`function startVideo(host){const video=document.createElement('video');video.muted=true;video.autoplay=true;video.playsInline=true;video.style.cssText='width:640px;height:360px;display:block';
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
  video.srcObject=canvas.captureStream(10);host.appendChild(video);video.play().catch(()=>{});return video;}`;
const hudState=()=>{
  const popup=document.getElementById('pvc-controller-popup'),rect=popup?.getBoundingClientRect(),visible=!!popup&&popup.style.display==='block'&&rect.width>0;
  return {visible,huds:document.querySelectorAll('#pvc-controller-popup').length,collapsed:popup?.classList.contains('pvc-collapsed')??null,left:visible?Math.round(rect.left):null,top:visible?Math.round(rect.top):null,
    rightGap:visible?Math.round(innerWidth-rect.right):null,bottomGap:visible?Math.round(innerHeight-rect.bottom):null,viewport:[innerWidth,innerHeight],noVideoAlert:popup?getComputedStyle(popup.querySelector('#pvc-no-video-alert')).display!=='none':null,
    adapter:popup?.querySelector('#pvc-active-adapter-badge')?.textContent??null,video:!!document.querySelector('video'),engine:window.__NOK_VIDEO_CONTROLLER_INJECTED__===true};
};
const dragBy=(dx,dy)=>{
  const header=document.querySelector('#pvc-drag-header'),rect=header.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
  const fire=(target,type,cx,cy,buttons)=>target.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,clientX:cx,clientY:cy,button:0,buttons}));
  fire(header,'mousedown',x,y,1);fire(window,'mousemove',x+dx,y+dy,1);fire(window,'mouseup',x+dx,y+dy,0);
};
async function main(){
  const child=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');
    const late=Number(new URL(req.url,'http://x').searchParams.get('late')||0),none=req.url.includes('none=1');
    res.end(`<!doctype html><html><meta charset="utf-8"><style>body{margin:0}</style><body><script>${videoScript}${none?'':`setTimeout(()=>startVideo(document.body),${late});`}</script></body></html>`);});
  await listen(child);const childOrigin=`http://127.0.0.1:${child.address().port}`;
  const parent=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');
    const mode=new URL(req.url,'http://x').searchParams.get('mode');
    res.end(`<!doctype html><html><meta charset="utf-8"><style>body{margin:12px;height:1500px}iframe{display:block;width:640px;height:400px;border:0}</style>
      <button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Open</button><button id="fullscreen" onclick="document.getElementById('stage').firstElementChild.requestFullscreen()">Fullscreen</button><button id="wrapfull" onclick="document.getElementById('stage').requestFullscreen()">Wrap</button>
      <div id="stage"></div><script>${videoScript}
      const stage=document.getElementById('stage'),origin=${JSON.stringify(childOrigin)};
      window.addFrame=(query='')=>{const frame=document.createElement('iframe');frame.allow='autoplay; fullscreen';frame.src=origin+'/?'+query;stage.appendChild(frame);return true;};
      window.route=name=>history.pushState({},'','/'+name+location.search);
      ${mode==='iframe'?"addFrame();":mode==='top'?"startVideo(stage);":mode==='adthenplayer'?"addFrame('none=1');addFrame();":mode==='late-iframe'?"addFrame('late=4000');":mode==='late-top'?"setTimeout(()=>startVideo(stage),4000);":''}
      </script></html>`);});
  await listen(parent);let driver;const results={};
  const open=async mode=>{const page=await driver.open(`http://127.0.0.1:${parent.address().port}/?mode=${mode}`);await driver.activate(page);await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'top engine');return page;};
  const scan=async page=>{const rows=[];for(const {target} of await driver.frames(page)){try{rows.push({target,...await driver.evaluate(target,hudState)});}catch(_){}}return rows;};
  const shown=rows=>rows.filter(row=>row.visible);
  const place=row=>row?{left:row.left,top:row.top,rightGap:row.rightGap,bottomGap:row.bottomGap,viewport:row.viewport,collapsed:row.collapsed}:null;
  const clean=row=>row?{visible:row.visible,noVideoAlert:row.noVideoAlert,adapter:row.adapter,left:row.left,top:row.top}:null;
  const watch=async(page,ms)=>{let maxVisible=0,zero=0,samples=0;const deadline=Date.now()+ms;while(Date.now()<deadline){const count=shown(await scan(page)).length;maxVisible=Math.max(maxVisible,count);if(count===0)zero++;samples++;await delay(150);}return {maxVisible,hiddenSamples:zero,samples};};
  const visibleHud=async page=>{for(let i=0;i<60;i++){const row=shown(await scan(page))[0];if(row)return row;await delay(100);}throw Error('No visible HUD');};
  const setVolume=async(page,value)=>{const row=await visibleHud(page);await driver.evaluate(row.target,value=>{const input=document.getElementById('pvc-volume-slider');input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);};
  const volumeReached=async(page,value)=>{const deadline=Date.now()+8000;while(Date.now()<deadline){for(const row of await scan(page)){if(row.video&&await driver.evaluate(row.target,value=>Math.abs(document.querySelector('video').volume-value/100)<.01,value))return true;}await delay(150);}return false;};
  const controlCheck=async(page,value)=>{await setVolume(page,value);return volumeReached(page,value);};
  const openHud=async page=>{await driver.pointerClick(page,'#open');return visibleHud(page);};
  const keepVisible=async page=>{const row=await visibleHud(page);await driver.evaluate(row.target,()=>{const box=document.getElementById('pvc-a11y-keepVisible');if(box&&!box.checked)box.click();});};
  const inFullscreen=(page,selector)=>driver.pointerClick(page,selector);
  const exitFullscreen=async page=>{for(const {target} of await driver.frames(page)){try{await driver.evaluate(target,()=>document.fullscreenElement&&document.exitFullscreen());}catch(_){}}};
  try{
    driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{viewport:{width:1200,height:800},visible:args.headless!=='true'});
    await driver.install();

    // Position across fullscreen, both layouts (#110). A wrapper keeps one HUD; an iframe hands over to the source frame's HUD.
    for(const [layout,mode,selector] of [['top wrapper','top','#wrapfull'],['iframe','iframe','#fullscreen']]){
      const page=await open(mode);await delay(800);await openHud(page);await keepVisible(page);
      const initial=await visibleHud(page);
      await driver.evaluate(initial.target,dragBy,-500,40);await delay(200); // Not at the edge: a headless fullscreen viewport can be shorter than the window.
      const dragged=await visibleHud(page);
      await inFullscreen(page,selector);await delay(1200);
      const inside=await visibleHud(page);const insideCount=shown(await scan(page)).length;
      await exitFullscreen(page);await delay(1200);
      const after=await visibleHud(page);const afterCount=shown(await scan(page)).length;
      results[`fullscreen position: ${layout}`]={initial:place(initial),dragged:place(dragged),inFullscreen:place(inside),insideCount,afterExit:place(after),afterCount,control:await controlCheck(page,35)};
    }

    // Navigation while the HUD stays open (#97) and late discovery (#94).
    const route=async(name,mode,swap)=>{
      const page=await open(mode);await delay(800);await openHud(page);await keepVisible(page);
      const before=await visibleHud(page);await driver.evaluate(before.target,dragBy,-300,200);await delay(200);
      const dragged=await visibleHud(page);
      await swap(page);
      const timeline=await watch(page,5000);
      const after=shown(await scan(page))[0]||null;
      results[name]={draggedPlace:place(dragged),afterPlace:place(after),timeline,after:clean(after),control:after?await controlCheck(page,45):false};
    };
    await route('spa: iframe replaced by new iframe','iframe',page=>driver.evaluate(page,()=>{stage.replaceChildren();route('next');setTimeout(()=>addFrame(),800);}));
    await route('spa: same iframe navigates','iframe',page=>driver.evaluate(page,()=>{route('next');stage.firstElementChild.src=stage.firstElementChild.src.split('?')[0]+'?next=1';}));
    await route('spa: top video replaced later','top',page=>driver.evaluate(page,()=>{stage.replaceChildren();route('next');setTimeout(()=>startVideo(stage),1200);}));
    await route('spa: top video becomes iframe','top',page=>driver.evaluate(page,()=>{stage.replaceChildren();route('next');setTimeout(()=>addFrame(),800);}));
    await route('spa: iframe becomes top video','iframe',page=>driver.evaluate(page,()=>{stage.replaceChildren();route('next');setTimeout(()=>startVideo(stage),800);}));
    await route('spa: video removed, nothing follows','iframe',page=>driver.evaluate(page,()=>{stage.replaceChildren();route('next');}));

    for(const [name,mode] of [['late video: iframe','late-iframe'],['late video: top','late-top'],['empty iframe beside player','adthenplayer']]){
      const page=await open(mode);await delay(400);await openHud(page);await keepVisible(page);
      const before=await visibleHud(page);await driver.evaluate(before.target,dragBy,-300,200);await delay(200);
      const dragged=await visibleHud(page);
      const timeline=await watch(page,7000);
      const after=shown(await scan(page))[0]||null;
      results[name]={draggedPlace:place(dragged),afterPlace:place(after),timeline,after:clean(after),control:after?await controlCheck(page,55):false};
    }

    // Close and reopen is documented to start at the default corner.
    {const page=await open('top');await delay(800);await openHud(page);const first=await visibleHud(page);await driver.evaluate(first.target,dragBy,-300,200);await delay(200);
      await driver.pointerClick(page,'#open');await delay(400);await driver.pointerClick(page,'#open');await delay(400);
      results['close and reopen']={first:place(first),reopened:place(await visibleHud(page))};}
    console.log(JSON.stringify({engine,browser:driver.version,results},null,1));
    if(!reportOnly){
      const near=(a,b,slack=2)=>Math.abs(a-b)<=slack;
      for(const [name,row] of Object.entries(results)){
        if(name.startsWith('fullscreen position')){
          assert.equal(row.insideCount,1,name+': one HUD inside fullscreen');assert.equal(row.afterCount,1,name+': one HUD after exit');assert.ok(row.control,name+': control');
          assert.ok(near(row.afterExit.left,row.dragged.left)&&near(row.afterExit.top,row.dragged.top),name+': normal position returns after exit');
          if(name.endsWith('iframe')){ // Two documents with different viewports: the panel keeps its relative place.
            const ratio=(start,gap)=>(start-12)/(start+gap-24);
            assert.ok(Math.abs(ratio(row.inFullscreen.left,row.inFullscreen.rightGap)-ratio(row.dragged.left,row.dragged.rightGap))<.03,name+': horizontal place carries into fullscreen');
            assert.ok(Math.abs(ratio(row.inFullscreen.top,row.inFullscreen.bottomGap)-ratio(row.dragged.top,row.dragged.bottomGap))<.03,name+': vertical place carries into fullscreen');
          }else assert.ok(near(row.inFullscreen.left,row.dragged.left)&&near(row.inFullscreen.top,row.dragged.top),name+': same element keeps its place');
        }else if(name==='close and reopen')assert.ok(near(row.reopened.rightGap,16,4)&&near(row.reopened.top,16,4),name+': default corner');
        else{
          assert.ok(row.timeline.maxVisible<=1,name+': never two visible HUDs');assert.equal(row.timeline.hiddenSamples,0,name+': HUD stays open');
          assert.ok(row.afterPlace.bottomGap>=0,name+': panel stays inside the viewport');
          assert.ok(near(row.afterPlace.left,row.draggedPlace.left),name+': horizontal position survives');
          // While the missing-video alert stays visible a low panel may sit higher; it returns when the alert clears.
          if(name!=='spa: video removed, nothing follows')assert.ok(near(row.afterPlace.top,row.draggedPlace.top),name+': vertical position survives');
          if(name!=='spa: video removed, nothing follows'){assert.ok(row.control,name+': control reaches the new video');assert.equal(row.after.noVideoAlert,false,name+': no stale missing-video alert');}
          else assert.equal(row.after.noVideoAlert,true,name+': missing video is reported');
        }
      }
      console.log(JSON.stringify({engine,result:'passed'}));
    }
  }finally{
    try{await driver?.close();}finally{for(const server of [parent,child]){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
