const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
function harness(){
  const elements=new Map(),timers=new Map(),logs=[],toasts=[];let next=0;
  const document={getElementById:id=>elements.get(id)||null,createElement:()=>({style:{},classList:{toggle(){}},setAttribute(){},
    append(...children){for(const child of children)if(child.id)elements.set(child.id,child);},addEventListener(){},remove(){elements.delete(this.id);}})};
  document.body={appendChild(node){elements.set(node.id,node);}};
  const video={readyState:4,isConnected:true,currentSrc:'blob:PRIVATE_SOURCE',ownerDocument:document,removeAttribute(){}};
  const context=vm.createContext({document,video,selected:video,remotePresentation:null,remoteSourceSession:'session',navigator:{userAgent:'Firefox'},
    findVideoAndPlayer:()=>({video:context.selected}),showToast:text=>toasts.push(text),setUiText(el,text){if(el)el.textContent=text;},
    applyUiTheme(){},applyUiAccessibility(){},publishRemoteSourceState(){},
    addDiagnosticLog:(level,event,details)=>logs.push({level,event,details}),
    setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(source.slice(source.indexOf('  function updatePipButtonsState'),source.indexOf('  const appliedVideoFilters')),context);
  return {context,video,document,elements,timers,logs,toasts,run:code=>vm.runInContext(code,context)};
}
test('iframe activation rejection offers a source click and never retries automatically',async()=>{
  const h=harness();let calls=0;
  h.video.requestPictureInPicture=async()=>{calls++;throw {name:'NotAllowedError',message:'PRIVATE_SOURCE'};};
  assert.equal((await h.run('toggleLocalPictureInPicture()')).code,'activation-required');
  assert.equal(calls,1);assert.ok(h.elements.has('pvc-pip-activation'));
  assert.equal(h.logs.at(-1).event,'PIP_ACTIVATION_REQUIRED');assert.equal(JSON.stringify(h.logs).includes('PRIVATE'),false);
  h.video.requestPictureInPicture=async()=>{calls++;h.document.pictureInPictureElement=h.video;};
  await h.elements.get('pvc-pip-activation').onclick({stopPropagation(){}});
  assert.equal(calls,2);assert.equal(h.elements.has('pvc-pip-activation-container'),false);assert.equal(h.timers.size,0);
});
test('PiP exit uses the selected video owning document rather than the HUD document',async()=>{
  const h=harness();let exited=0;
  h.video.ownerDocument={pictureInPictureElement:h.video,exitPictureInPicture:async()=>{exited++;}};
  assert.equal((await h.run('toggleLocalPictureInPicture()')).ok,true);assert.equal(exited,1);
});
test('policy, readiness and unsupported failures are distinct and do not offer an activation retry',async()=>{
  for(const [name,code,event]of [['SecurityError','policy-blocked','PIP_POLICY_BLOCKED'],['InvalidStateError','not-ready','PIP_NOT_READY'],['NotSupportedError','unsupported','PIP_UNSUPPORTED'],['OtherError','failed','PIP_FAILED'],['__proto__','failed','PIP_FAILED']]){
    const h=harness();h.video.requestPictureInPicture=async()=>{throw {name,message:'PRIVATE_TOKEN'};};
    assert.equal((await h.run('toggleLocalPictureInPicture()')).code,code);assert.equal(h.logs.at(-1).event,event);
    assert.equal(h.elements.size,0);assert.equal(h.timers.size,0);
  }
});
test('an activation prompt cannot operate on a replaced target, source or closed session',async()=>{
  for(const change of ['selected={}','video.currentSrc="other"','remoteSourceSession=null']){
    const h=harness();let calls=0;h.video.requestPictureInPicture=async()=>{calls++;throw {name:'NotAllowedError'};};
    await h.run('toggleLocalPictureInPicture()');h.run(change);
    await h.elements.get('pvc-pip-activation').onclick({stopPropagation(){}});
    assert.equal(calls,1);assert.equal(h.elements.has('pvc-pip-activation-container'),false);assert.equal(h.timers.size,0);
  }
});
test('cancelling or expiring a PiP prompt releases its target and timer',async()=>{
  const h=harness();h.video.requestPictureInPicture=async()=>{throw {name:'NotAllowedError'};};
  await h.run('toggleLocalPictureInPicture()');assert.equal(h.timers.size,1);
  [...h.timers.values()][0]();assert.equal(h.run('pipActivationPrompt'),null);assert.equal(h.timers.size,0);
});
