// Functional guard for the report's measured rendering cost and existing privacy behavior.
const assert=require('node:assert/strict'),path=require('node:path');
const {createFixture}=require('./resource-fixture.cjs'),{createDriver,until}=require('./resource-driver.cjs');
const engine=process.argv.find(arg=>arg.startsWith('--engine='))?.slice(9)||'firefox';
async function main(){
  let fixture,driver;
  try{
    fixture=await createFixture({canvasVideo:true});
    driver=await createDriver(engine,engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',path.resolve(__dirname,'../node_modules'),{visible:!process.argv.includes('--headless=true'),toolbarControls:true});
    await driver.install();const page=await driver.open(fixture.url);
    await until(driver,page,()=>document.querySelector('video')?.readyState>=2,'video ready');await driver.toolbar(page);
    await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','HUD opens');
    await driver.pointerClick(page,'#pvc-tab-settings');await driver.pointerClick(page,'#pvc-report-err-btn');
    await until(driver,page,()=>!!document.querySelector('#pvc-modal-code-block')?.textContent,'report preview');
    assert.equal(await driver.evaluate(page,()=>getComputedStyle(document.querySelector('#pvc-error-modal')).backdropFilter),'none','report must not continuously blur playing content');
    // Motion: hover halo on the row, delayed check, focus lines, none of it changing layout or the control's own hit area.
    const motion=selector=>driver.evaluate(page,selector=>{
      const modal=document.querySelector('#pvc-error-modal'),visual=modal.querySelector(selector+' + .pvc-check-visual'),halo=getComputedStyle(visual,'::before');
      const frame=modal.querySelector('.pvc-feedback-frame'),input=modal.querySelector(selector).getBoundingClientRect(),body=modal.querySelector('.pvc-modal-body');
      return{halo:Number(halo.opacity),haloSize:halo.width,check:getComputedStyle(visual.querySelector('polyline')).transitionDelay,
        top:getComputedStyle(frame,'::before').transform,bottom:getComputedStyle(frame,'::after').transform,hit:[input.width,input.height],overflowX:body.scrollWidth-body.clientWidth};},selector);
    // A short window scrolls the body: the invisible native box must travel with its row.
    const aligned=await driver.evaluate(page,()=>{const card=document.querySelector('#pvc-error-modal .pvc-modal-card'),body=card.querySelector('.pvc-modal-body');
      card.style.setProperty('max-height','260px','important');body.scrollTop=body.scrollHeight;
      const box=document.querySelector('#pvc-include-site'),gap=Math.abs(box.getBoundingClientRect().top-box.nextElementSibling.getBoundingClientRect().top),scrolled=body.scrollTop>0;
      card.style.removeProperty('max-height');body.scrollTop=0;return{scrolled,gap};});
    assert.ok(aligned.scrolled,'the test scrolled the report');assert.ok(aligned.gap<=4,'native checkbox stays on its row after scrolling');
    const rest=await motion('#pvc-include-site');
    assert.equal(rest.haloSize,'48px');assert.equal(rest.check,'0s','unchecked rows have no pending delay');
    assert.equal(rest.top,'matrix(0, 0, 0, 1, 0, 0)','lines rest hidden');assert.deepEqual(rest.hit,[20,20]);assert.ok(rest.overflowX<=0,'the halo adds no sideways scroll');
    // A runner without a hover-capable pointer correctly never shows it.
    if(await driver.evaluate(page,()=>matchMedia('(hover: hover)').matches)){
      await driver.hover(page,'#pvc-include-site');
      await until(driver,page,()=>Number(getComputedStyle(document.querySelector('#pvc-include-site + .pvc-check-visual'),'::before').opacity)===1,'hover halo shows');
    }
    await driver.pointerClick(page,'#pvc-include-comment');
    assert.equal((await motion('#pvc-include-comment')).check,'0.15s','the check draws after the circle starts');
    await driver.evaluate(page,()=>{const box=document.querySelector('#pvc-include-comment');if(!box.checked)box.click();document.querySelector('#pvc-user-feedback-input').focus();});
    await until(driver,page,()=>getComputedStyle(document.querySelector('.pvc-feedback-frame'),'::after').transform==='matrix(1, 0, 0, 1, 0, 0)','focus lines grow');
    await driver.evaluate(page,()=>{const field=document.querySelector('#pvc-user-feedback-input');field.style.height='180px';});
    assert.ok(await driver.evaluate(page,()=>{const frame=document.querySelector('.pvc-feedback-frame').getBoundingClientRect(),field=document.querySelector('#pvc-user-feedback-input').getBoundingClientRect();return Math.abs(frame.bottom-field.bottom)<1;}),'the bottom line follows a resized field');
    await driver.evaluate(page,()=>{document.querySelector('#pvc-user-feedback-input').style.height='';document.querySelector('#pvc-user-feedback-input').blur();document.querySelector('#pvc-a11y-reduceMotion').click();});
    const reduced=await driver.evaluate(page,()=>{const modal=document.querySelector('#pvc-error-modal');return[getComputedStyle(modal.querySelector('.pvc-check-visual'),'::before').transitionDuration,getComputedStyle(modal.querySelector('.pvc-feedback-frame'),'::after').transitionDuration,getComputedStyle(modal.querySelector('.pvc-check-visual polyline')).transitionDuration];});
    assert.deepEqual(reduced,['0s','0s','0s'],'reduced motion covers the new pseudo-elements');
    await driver.evaluate(page,()=>{document.querySelector('#pvc-a11y-reduceMotion').click();const box=document.querySelector('#pvc-include-comment');if(box.checked)box.click();});
    const checks=await driver.evaluate(page,async()=>{
      const modal=document.querySelector('#pvc-error-modal'),input=modal.querySelector('textarea'),code=modal.querySelector('pre');
      const parsed=()=>JSON.parse(code.textContent),assert=(value,label)=>{if(!value)throw Error(label);};
      assert(parsed().platform==='other'&&!('siteDomain'in parsed())&&!('userComments'in parsed()),'private defaults');
      const comment=modal.querySelector('#pvc-include-comment');comment.click();
      input.value='Synthetic <script> text, not markup.';input.dispatchEvent(new Event('input',{bubbles:true}));
      assert(parsed().userComments===input.value&&!modal.querySelector('script'),'live text-only preview');
      const deletion=modal.querySelector('#pvc-request-deletion');deletion.click();
      assert(parsed().deleteAfterResolutionRequested===true,'deletion opt-in');
      for(const link of modal.querySelectorAll('a'))assert(!decodeURIComponent(link.href).includes(input.value)&&!link.href.includes('reportSchemaVersion'),'safe sharing URLs');
      let copied;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value;}}});
      await modal.querySelector('#pvc-copy-payload-btn').onclick({stopPropagation(){}});assert(copied===code.textContent,'copy matches preview');
      const select=document.querySelector('#pvc-language-select');select.value='tr';select.dispatchEvent(new Event('change',{bubbles:true}));
      assert(modal.lang==='tr'&&parsed().userComments===input.value,'TR keeps machine payload and comment');
      select.value='en';select.dispatchEvent(new Event('change',{bubbles:true}));assert(modal.lang==='en','EN report');
      comment.click();assert(!('userComments'in parsed())&&input.value===''&&input.disabled,'comment withdrawal');
      deletion.click();assert(!('deleteAfterResolutionRequested'in parsed()),'deletion withdrawal');
      assert(!document.querySelector('video').paused,'video continues');return['no backdrop blur','private defaults','live text-only preview','safe draft links','copy equals preview','EN/TR','opt-in withdrawal','playing video'];
    });
    await driver.pointerClick(page,'#pvc-close-modal-btn');
    assert.equal(await driver.evaluate(page,()=>document.querySelectorAll('#pvc-error-modal').length),0);
    console.log(JSON.stringify({engine,browserVersion:driver.version,result:'passed',checks}));
  }finally{await driver?.close();await fixture?.close();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
