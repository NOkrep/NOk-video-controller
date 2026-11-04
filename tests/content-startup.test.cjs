const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const content=fs.readFileSync(path.join(__dirname,'..','content.js'),'utf8');
function harness(){
  const listeners=[],scripts=[],posts=[];let ready=false;
  const window={postMessage(message){posts.push({message,ready});},addEventListener(type,callback){if(type==='message')listeners.push(callback);}};
  window.parent=window;
  const context=vm.createContext({window,document:{head:{appendChild(script){scripts.push(script);}},
    createElement:()=>({dataset:{},remove(){}}),querySelectorAll:()=>[]},
    chrome:{runtime:{getURL:file=>'extension:///'+file}},console:{error(){}}});
  const run=()=>vm.runInContext(content,context);
  const click=()=>{window.__NOK_VIDEO_CONTROLLER_TOOLBAR_REQUEST__=true;run();};
  const finish=()=>{scripts[0].onload();ready=true;scripts[1].onload();};
  return {run,click,finish,window,listeners,posts,scripts};
}
test('toolbar intent arriving during main-world load opens once after the engine is ready',()=>{
  const h=harness();h.run();h.click();h.finish();
  const delivered=h.posts.filter(p=>p.ready&&['PVC_OPEN_POPUP','PVC_TOOLBAR_TOGGLE'].includes(p.message.type));
  assert.equal(delivered.length,1);assert.equal(h.listeners.length,1);assert.equal(h.scripts.length,2);
});
test('automatic initialization stays silent and repeated loading-time clicks can cancel pending open',()=>{
  const silent=harness();silent.run();silent.finish();assert.equal(silent.posts.length,0);
  const h=harness();h.run();h.click();h.click();h.finish();
  assert.equal(h.posts.filter(p=>p.ready&&['PVC_OPEN_POPUP','PVC_TOOLBAR_TOGGLE'].includes(p.message.type)).length,0);
});

test('a failed script load can be retried by the next toolbar click without adding listeners',()=>{
  const h=harness();h.run();h.scripts[0].onload();h.scripts[1].onerror();h.click();
  assert.equal(h.scripts.length,3);h.scripts[2].onload();h.scripts[3].onload();
  assert.equal(h.posts.at(-1).message.type,'PVC_OPEN_POPUP');assert.equal(h.listeners.length,1);
});
