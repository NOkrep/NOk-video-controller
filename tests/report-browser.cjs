// Functional guard for the report's measured rendering cost and existing privacy behavior.
const assert=require('node:assert/strict'),path=require('node:path');
const {createFixture}=require('./resource-fixture.cjs'),{createDriver,until}=require('./resource-driver.cjs');
const engine=process.argv.find(arg=>arg.startsWith('--engine='))?.slice(9)||'firefox';
async function main(){
  let fixture,driver;
  try{
    fixture=await createFixture();
    driver=await createDriver(engine,engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',path.resolve(__dirname,'../node_modules'),{visible:true,toolbarControls:true});
    await driver.install();const page=await driver.open(fixture.url);
    await until(driver,page,()=>document.querySelector('video')?.readyState>=2,'video ready');await driver.toolbar(page);
    await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','HUD opens');
    await driver.pointerClick(page,'#pvc-tab-settings');await driver.pointerClick(page,'#pvc-report-err-btn');
    await until(driver,page,()=>!!document.querySelector('#pvc-modal-code-block')?.textContent,'report preview');
    assert.equal(await driver.evaluate(page,()=>getComputedStyle(document.querySelector('#pvc-error-modal')).backdropFilter),'none','report must not continuously blur playing content');
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
