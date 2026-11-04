// D-02: real keyboard events on the installed extension, local synthetic media, isolated profile.
// node tests/dialog-keyboard-browser.cjs --engine=firefox|chromium [--report=true]
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox',reportOnly=args.report==='true';
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const video=`const video=document.createElement('video');video.muted=true;video.autoplay=true;video.playsInline=true;video.style.cssText='width:640px;height:360px;display:block';
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
  video.srcObject=canvas.captureStream(10);document.body.appendChild(video);video.play().catch(()=>{});`;
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const probeDialog=(modalId,selector)=>{
  const modal=document.getElementById(modalId),title=document.getElementById(modal?.getAttribute('aria-labelledby')||'');
  return modal?{role:modal.getAttribute('role'),ariaModal:modal.getAttribute('aria-modal'),titled:!!title?.textContent.trim(),focusInside:modal.contains(document.activeElement),focusables:modal.querySelectorAll(selector).length,unnamedButtons:[...modal.querySelectorAll('button')].filter(b=>!(b.getAttribute('aria-label')||/[\p{L}\p{N}]/u.test(b.textContent))).length}:null;
};
async function main(){
  const child=http.createServer((_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><body><script>${video}</script></body>`);});
  await listen(child);
  const parent=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');
    const framed=req.url.includes('framed');
    res.end(`<!doctype html><meta charset="utf-8"><style>body{margin:12px}iframe{width:640px;height:400px;border:0}</style><button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Open</button><button id="site-button">Site</button>
      <body><script>window.siteKeys=0;document.addEventListener('keydown',()=>window.siteKeys++);${framed?`document.write('<iframe allow="autoplay" src="http://127.0.0.1:${child.address().port}/"></iframe>');`:video}</script></body>`);});
  await listen(parent);let driver;const results={};
  try{
    driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{viewport:{width:1200,height:900},visible:args.headless==='false'});
    await driver.install();
    const open=async query=>{const page=await driver.open(`http://127.0.0.1:${parent.address().port}/${query}`);await driver.activate(page);await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'engine');await delay(800);
      await driver.pointerClick(page,'#open');await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','HUD');await driver.evaluate(page,()=>document.getElementById('pvc-a11y-keepVisible')?.click());return page;};
    const inspect=async(page,name,{openerId,modalId,prep})=>{
      if(prep)await prep(page);
      const focused=await driver.evaluate(page,id=>{const opener=document.getElementById(id);opener.scrollIntoView({block:'center'});opener.focus();return {active:document.activeElement===opener,tag:opener.tagName};},openerId);
      await driver.press(page,'Enter');await delay(500);
      let opened=await driver.evaluate(page,id=>!!document.getElementById(id),modalId);const keyboardOpens=opened;
      if(!opened){await driver.evaluate(page,id=>document.getElementById(id).click(),openerId);await until(driver,page,id=>!!document.getElementById(id),'dialog opened by click',modalId);opened=true;}
      await delay(200);
      const dialog=await driver.evaluate(page,probeDialog,modalId,FOCUSABLE);
      let escapedTab=0;
      await driver.evaluate(page,(id,selector)=>{const modal=document.getElementById(id);modal.querySelector(selector)?.focus();},modalId,FOCUSABLE);
      for(let i=0;i<dialog.focusables+2;i++){await driver.press(page,'Tab');if(!await driver.evaluate(page,id=>document.getElementById(id)?.contains(document.activeElement),modalId))escapedTab++;}
      const wraps=await (async()=>{await driver.evaluate(page,(id,selector)=>document.getElementById(id).querySelector(selector).focus(),modalId,FOCUSABLE);await driver.press(page,'Shift+Tab');
        return driver.evaluate(page,(id,selector)=>{const items=[...document.getElementById(id).querySelectorAll(selector)];return items.at(-1)===document.activeElement;},modalId,FOCUSABLE);})();
      await driver.evaluate(page,(id,selector)=>document.getElementById(id).querySelector(selector).focus(),modalId,FOCUSABLE);
      const siteBefore=await driver.evaluate(page,()=>window.siteKeys);
      await driver.press(page,'m');await delay(150);
      const hotkeyLeak=await driver.evaluate(page,()=>document.getElementById('pvc-audio-mono-btn')?.getAttribute('aria-pressed')==='true');
      const siteKeyLeak=await driver.evaluate(page,before=>window.siteKeys-before,siteBefore);
      if(hotkeyLeak)await driver.evaluate(page,()=>document.getElementById('pvc-audio-stereo-btn').click());
      await driver.press(page,'Escape');await delay(250);
      const escapeCloses=!await driver.evaluate(page,id=>!!document.getElementById(id),modalId);
      if(!escapeCloses)await driver.evaluate(page,id=>document.getElementById(id).remove(),modalId);
      const focusReturned=await driver.evaluate(page,id=>document.activeElement===document.getElementById(id),openerId);
      results[name]={openerFocusable:focused.active,openerTag:focused.tag,keyboardOpens,...dialog,escapedTab,wraps,hotkeyLeak,siteKeyLeak,escapeCloses,focusReturned};
    };
    const settings=page=>driver.evaluate(page,()=>document.getElementById('pvc-tab-settings').click());
    const player=page=>driver.evaluate(page,()=>document.getElementById('pvc-tab-player').click());
    const page=await open('');
    await inspect(page,'report',{openerId:'pvc-report-err-btn',modalId:'pvc-error-modal',prep:settings});
    await inspect(page,'permissions',{openerId:'pvc-perms-btn',modalId:'pvc-permissions-modal',prep:settings});
    await inspect(page,'adapter',{openerId:'pvc-change-adapter-btn',modalId:'pvc-adapter-modal',prep:player});
    await inspect(page,'drm',{openerId:'pvc-drm-status-badge',modalId:'pvc-drm-modal',prep:async page=>{await player(page);await driver.evaluate(page,()=>{const style=document.createElement('style');style.textContent='#pvc-drm-status-badge{display:block!important}';document.head.appendChild(style);});}}); // No real DRM here: keep the badge shown as it would be for protected media.

    // A typed report comment must survive Escape.
    await settings(page);await driver.evaluate(page,()=>document.getElementById('pvc-report-err-btn').click());
    await until(driver,page,()=>!!document.getElementById('pvc-error-modal'),'report for comment');
    await driver.evaluate(page,()=>{const box=document.getElementById('pvc-include-comment');box.click();const input=document.getElementById('pvc-user-feedback-input');input.focus();input.value='synthetic note';input.dispatchEvent(new Event('input',{bubbles:true}));});
    await driver.press(page,'Escape');await delay(250);
    results['report comment']={keptOpen:await driver.evaluate(page,()=>!!document.getElementById('pvc-error-modal')),value:await driver.evaluate(page,()=>document.getElementById('pvc-user-feedback-input')?.value??null)};
    await driver.evaluate(page,()=>document.getElementById('pvc-error-modal')?.remove());

    // Adapter choice by keyboard, in the page and through an embedded player's top panel.
    const choose=async(page,name)=>{
      await player(page);
      await driver.evaluate(page,()=>{const opener=document.getElementById('pvc-change-adapter-btn');opener.scrollIntoView({block:'center'});opener.focus();opener.click();});
      await until(driver,page,()=>!!document.getElementById('pvc-adapter-modal'),'adapter dialog');
      const before=await driver.evaluate(page,()=>document.querySelector('#pvc-active-adapter-badge')?.textContent);
      const row=await driver.evaluate(page,()=>{const options=[...document.querySelectorAll('.pvc-adapter-option')],target=options.find(o=>o.getAttribute('data-adapter')==='VideoJsAdapter')||options.at(-1);target.focus?.();
        return {count:options.length,tags:[...new Set(options.map(o=>o.tagName))],focused:document.activeElement===target,pressed:options.filter(o=>o.getAttribute('aria-pressed')==='true').length,target:target.getAttribute('data-adapter')};});
      await driver.press(page,'Enter');await delay(500);
      results[name]={...row,before,closed:!await driver.evaluate(page,()=>!!document.getElementById('pvc-adapter-modal')),focusReturned:await driver.evaluate(page,()=>document.activeElement===document.getElementById('pvc-change-adapter-btn'))};
      await driver.evaluate(page,()=>document.getElementById('pvc-adapter-modal')?.remove());
    };
    if(args.screenshots==='true'&&engine==='chromium'){ // Local synthetic page only; written to the ignored artifacts folder.
      const dir=path.join(__dirname,'artifacts','dialog-keyboard');require('node:fs').mkdirSync(dir,{recursive:true});
      await player(page);await driver.evaluate(page,()=>document.getElementById('pvc-controller-popup').scrollIntoView());await page.screenshot({path:path.join(dir,'panel-drm-badge.png')});
      await driver.evaluate(page,()=>document.getElementById('pvc-change-adapter-btn').click());await until(driver,page,()=>!!document.getElementById('pvc-adapter-modal'),'adapter shot');await delay(200);
      await page.screenshot({path:path.join(dir,'adapter-dialog.png')});await driver.press(page,'Escape');await delay(200);
    }
    await choose(page,'adapter choice: page');
    const framed=await open('?framed');
    await until(driver,framed,()=>document.querySelector('#pvc-active-adapter-badge')?.textContent.startsWith('Generic'),'remote adapter');
    await choose(framed,'adapter choice: embedded player');
    console.log(JSON.stringify({engine,browser:driver.version,results},null,1));
    if(!reportOnly){
      for(const name of ['report','permissions','adapter','drm']){
        const row=results[name];
        assert.ok(row.openerFocusable&&row.keyboardOpens,name+': opener works from the keyboard');
        assert.equal(row.role,'dialog',name+': role');assert.equal(row.ariaModal,'true',name+': aria-modal');assert.ok(row.titled,name+': named by its title');
        assert.equal(row.unnamedButtons,0,name+': every button has a name');
        assert.ok(row.focusInside,name+': focus starts inside');assert.equal(row.escapedTab,0,name+': Tab stays inside');assert.ok(row.wraps,name+': Shift+Tab wraps');
        assert.equal(row.hotkeyLeak,false,name+': extension shortcuts stay off');assert.equal(row.siteKeyLeak,0,name+': site does not get keys');
        assert.ok(row.escapeCloses,name+': Escape closes');assert.ok(row.focusReturned,name+': focus returns');
      }
      assert.ok(results['report comment'].keptOpen,'Escape keeps a typed comment');assert.equal(results['report comment'].value,'synthetic note');
      for(const name of ['adapter choice: page','adapter choice: embedded player']){
        const row=results[name];assert.deepEqual(row.tags,['BUTTON'],name+': native buttons');assert.ok(row.focused,name+': focusable');assert.equal(row.pressed,1,name+': one selected');
        assert.ok(row.closed,name+': Enter selects and closes');assert.ok(row.focusReturned,name+': focus returns');
      }
      console.log(JSON.stringify({engine,result:'passed'}));
    }
  }finally{
    try{await driver?.close();}finally{for(const server of [parent,child]){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
