// Exercise the real extension toolbar with strict CSP and no permitted Trusted Types policies.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
async function main(){
  const server=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"script-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'"});res.end('<!doctype html><html lang="en"><meta charset="utf-8"><title>FilmDeck CSP startup fixture</title><body>Local startup fixture</body></html>');});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let driver;
  try{
    driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true,blockDomEngine:engine==='chromium'});
    await driver.install();const page=await driver.open(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(await driver.evaluate(page,()=>!!document.getElementById('pvc-controller-popup')),false,'automatic startup stays silent');
    const before=await driver.evaluate(page,()=>window.__NOK_VIDEO_CONTROLLER_ENGINE_READY__===true);
    if(engine==='chromium')assert.equal(before,false,'fault injection keeps the DOM engine unavailable before toolbar action');
    await driver.evaluate(page,()=>{window.__toolbarEvents=[];window.addEventListener('message',event=>{
      if(event.source===window&&/^PVC_(OPEN|TOOLBAR|TOGGLE|ENGINE|HUD|HIDE)/.test(event.data?.type||''))window.__toolbarEvents.push(event.data.type);
    });});
    await driver.toolbar(page);
    try{await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','native toolbar opens CSP page');}
    catch(error){console.log(JSON.stringify(await driver.evaluate(page,()=>{
      const probe=document.createElement('div');probe.setHTML('<button id="probe" data-speed="1">Open</button><input id="input"><svg viewBox="0 0 20 20"><path d="M0 0 L1 1"/></svg>',{sanitizer:{}});
      const popup=document.getElementById('pvc-controller-popup');
      return {probeButton:!!probe.querySelector('button'),probeInput:!!probe.querySelector('input'),probeSvg:!!probe.querySelector('svg'),popup:!!popup,buttons:popup?.querySelectorAll('button').length,display:popup?.style.display};
    })));throw error;}
    await until(driver,page,()=>document.querySelector('.pvc-product-logo')?.naturalWidth>0,'native injection keeps logo assets');
    assert.equal(await driver.evaluate(page,()=>!!document.querySelector('#pvc-collapse-btn svg path')),true,'sanitizer keeps inline SVG icons');
    assert.ok(await driver.evaluate(page,()=>document.querySelector('[data-speed]')?.getAttribute('data-speed')),'sanitizer keeps control attributes');
    await driver.evaluate(page,()=>document.getElementById('pvc-report-err-btn').click());
    await until(driver,page,()=>!!document.getElementById('pvc-modal-code-block')?.textContent,'diagnostic modal under Trusted Types');
    await driver.evaluate(page,()=>document.getElementById('pvc-error-modal').remove());
    await driver.toolbar(page);
    try{await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='none','toolbar closes');}
    catch(error){console.log(JSON.stringify(await driver.evaluate(page,()=>({events:window.__toolbarEvents.slice(-30),display:document.getElementById('pvc-controller-popup')?.style.display,ready:window.__NOK_VIDEO_CONTROLLER_ENGINE_READY__}))));throw error;}
    await driver.toolbar(page);await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','toolbar reopens');
    assert.equal(await driver.evaluate(page,()=>document.querySelectorAll('#pvc-controller-popup').length),1);
    console.log(JSON.stringify({engine,browserVersion:driver.version,domEngineBeforeToolbar:before,result:'passed'}));
  }finally{try{await driver?.close();}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
