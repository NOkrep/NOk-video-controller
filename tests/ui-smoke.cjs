// Installed-extension smoke checks on synthetic local media. No personal profile or site traffic.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {createDriver, until} = require('./resource-driver.cjs');
const root = path.resolve(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split(/=(.*)/s).slice(0,2)));
const engine = args.engine || 'firefox';
if (!['firefox','chromium'].includes(engine)) throw Error('Use --engine=firefox or --engine=chromium');
const browser = args.browser || (engine === 'firefox'
  ? 'C:/Program Files/Mozilla Firefox/firefox.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const packages = args.packages || path.join(root, 'node_modules');
const version = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'))).version;

async function main() {
  assert.ok(fs.existsSync(browser), 'Browser missing; specify --browser=absolute/path');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>FilmDeck local UI check</title>
    <style>body{margin:24px;background:#152330;color:white;font:16px system-ui}video{display:block;width:640px;height:360px}</style>
    <button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Open FilmDeck</button>
    <video autoplay muted playsinline></video><script>
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
    const ctx=canvas.getContext('2d');let frame=0;
    setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);ctx.fillStyle='#edf2f3';ctx.fillText('Local synthetic media '+frame++,24,40);},200);
    document.querySelector('video').srcObject=canvas.captureStream(5);
    </script></html>`;
  const server = http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let driver;
  try {
    driver = await createDriver(engine,browser,packages,{viewport:{width:args.narrow?560:1100,height:args.narrow?760:850}});
    await driver.install();
    const page = await driver.open(`http://127.0.0.1:${server.address().port}/`);
    await until(driver,page,()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__===true,'content-script injection');
    await until(driver,page,()=>document.querySelector('video').readyState >= 2,'synthetic video');
    assert.equal(await driver.evaluate(page,()=>!!document.querySelector('#pvc-controller-popup')),false,'HUD must wait for user action');
    await driver.pointerClick(page,'#open');
    await until(driver,page,()=>!!document.querySelector('.pvc-product-ready'),'product logo loaded');
    const evaluate = fn=>driver.evaluate(page,fn);
    assert.equal(await evaluate(()=>document.querySelector('#pvc-language-select').value),'en');
    assert.equal(await evaluate(()=>document.querySelector('#pvc-collapse-btn svg')?.getAttribute('aria-hidden')),'true');
    assert.equal(await evaluate(()=>document.querySelector('#pvc-panel-settings').hidden),true);
    // Changing a setting must retain native video control and current state through localization.
    await evaluate(()=>{const input=document.querySelector('#pvc-volume-slider');input.value='40';input.dispatchEvent(new Event('input',{bubbles:true}));});
    await until(driver,page,()=>Math.abs(document.querySelector('video').volume-.4)<.01,'native volume');
    await driver.pointerClick(page,'#pvc-tab-settings');
    await evaluate(()=>{const input=document.querySelector('#pvc-a11y-keepVisible');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));});
    const themes = await evaluate(()=>[...document.querySelector('#pvc-theme-select').options].map(option=>option.value));
    assert.equal(themes.length,20);
    for (const theme of themes) {
      const state = await driver.evaluate(page,theme=>{
        const select=document.querySelector('#pvc-theme-select');select.value=theme;select.dispatchEvent(new Event('change',{bubbles:true}));
        const brand=document.querySelector('.pvc-menu-brand'),style=getComputedStyle(brand),mask=getComputedStyle(brand,'::before');
        return {mask:mask.maskImage||mask.webkitMaskImage,ink:mask.backgroundColor,text:style.color,plate:style.backgroundColor};
      },theme);
      assert.ok(state.mask && state.mask !== 'none',`${theme}: product mask`);
      assert.equal(state.ink,state.text,`${theme}: logo follows theme text`);
      assert.equal(state.plate,'rgba(0, 0, 0, 0)',`${theme}: no white logo plate`);
    }
    for (const language of ['tr','en']) {
      await driver.evaluate(page,language=>{const input=document.querySelector('#pvc-language-select');input.value=language;input.dispatchEvent(new Event('change',{bubbles:true}));},language);
      const state = await evaluate(()=>{
        document.querySelector('#pvc-about').open=true;
        return {about:document.querySelector('#pvc-about').textContent,volume:document.querySelector('#pvc-volume-slider').value,
          svg:!!document.querySelector('#pvc-ping-btn svg'),close:document.querySelector('#pvc-close-popup-btn').getAttribute('aria-label')};
      });
      assert.match(state.about,new RegExp(`${language==='en'?'Version':'Sürüm'} ${version.replaceAll('.','\\.')}`));
      assert.equal(state.volume,'40');assert.equal(state.svg,true);assert.ok(state.close);
    }
    // Keyboard navigation keeps the ARIA selection and panel in sync.
    await evaluate(()=>{for(const key of ['largeText','highContrast','reduceMotion']){const input=document.querySelector('#pvc-a11y-'+key);input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));}});
    await evaluate(()=>document.querySelector('#pvc-tab-settings').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true})));
    assert.equal(await evaluate(()=>document.querySelector('#pvc-panel-player').hidden),false);
    const bounds=await evaluate(()=>{const p=document.querySelector('#pvc-controller-popup'),r=p.getBoundingClientRect();return {width:r.width,left:r.left,right:r.right,top:r.top,bottom:r.bottom,vw:innerWidth,vh:innerHeight,overflow:p.scrollWidth-p.clientWidth};});
    assert.ok(bounds.left>=0 && bounds.right<=bounds.vw+1 && bounds.top>=0 && bounds.bottom<=bounds.vh+1,'HUD within viewport');
    assert.ok(bounds.overflow<=1,'HUD has no horizontal overflow');
    await evaluate(()=>{for(const key of ['largeText','highContrast','reduceMotion']){const input=document.querySelector('#pvc-a11y-'+key);input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));}});
    await driver.pointerClick(page,'#pvc-collapse-btn');
    assert.equal(await evaluate(()=>document.querySelector('#pvc-controller-popup').classList.contains('pvc-collapsed')),true);
    assert.equal(await evaluate(()=>!!document.querySelector('#pvc-collapse-btn svg')),true);
    await driver.pointerClick(page,'#pvc-mini-play-pause');
    assert.equal(await evaluate(()=>document.querySelector('video').paused),true);
    assert.equal(await evaluate(()=>document.querySelector('#pvc-mini-play-pause').textContent),'Play');
    await driver.pointerClick(page,'#pvc-mini-play-pause');
    await until(driver,page,()=>!document.querySelector('video').paused,'mini play control');
    assert.equal(await evaluate(()=>document.querySelector('#pvc-mini-play-pause').textContent),'Pause');
    await driver.pointerClick(page,'#pvc-collapse-btn');
    if (args.screenshots && engine==='chromium') {
      const dir=path.join(__dirname,'artifacts','ui-smoke');fs.mkdirSync(dir,{recursive:true});
      await until(driver,page,()=>!document.querySelector('#pvc-quick-toast'),'transient feedback dismissed');
      await evaluate(()=>{const select=document.querySelector('#pvc-theme-select');select.value='atlas';select.dispatchEvent(new Event('change',{bubbles:true}));});
      await page.screenshot({path:path.join(dir,'player.png')});
      await driver.pointerClick(page,'#pvc-tab-settings');
      await evaluate(()=>{document.querySelector('#pvc-about').open=true;document.querySelector('#pvc-theme-select').closest('details').open=true;});
      await page.screenshot({path:path.join(dir,'settings.png')});
      await evaluate(()=>{const select=document.querySelector('#pvc-theme-select');select.value='daylight';select.dispatchEvent(new Event('change',{bubbles:true}));});
      await page.screenshot({path:path.join(dir,'settings-light.png')});
    }
    await evaluate(()=>{document.querySelector('.pvc-product-logo').src='data:image/png;base64,broken';});
    await until(driver,page,()=>!document.querySelector('.pvc-menu-brand').classList.contains('pvc-product-ready'),'logo error fallback');
    assert.equal(await evaluate(()=>getComputedStyle(document.querySelector('#pvc-brand-text')).display !== 'none'),true);
    console.log(JSON.stringify({engine,browserVersion:driver.version,extensionVersion:version,themesChecked:themes.length,languages:['en','tr'],narrow:!!args.narrow,result:'passed'}));
  } finally {
    try { await driver?.close(); } finally { server.closeAllConnections();await new Promise(resolve=>server.close(resolve)); }
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
