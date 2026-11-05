const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const content=fs.readFileSync(path.join(__dirname,'..','content.js'),'utf8');
function harness({frames=[],parent=null,NOkFrameProtocol}={}){
  const listeners=[],scripts=[],posts=[];let ready=false;
  const window={postMessage(message){posts.push({message,ready});},addEventListener(type,callback){if(type==='message')listeners.push(callback);}};
  window.parent=parent||window;
  const context=vm.createContext({window,NOkFrameProtocol,document:{head:{appendChild(script){scripts.push(script);}},
    createElement:()=>({dataset:{},remove(){}}),querySelectorAll:()=>frames.map(contentWindow=>({contentWindow}))},
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

// The page stays untouched until the toolbar is pressed; from then on the whole frame tree is armed.
const frameWindow=()=>{const received=[];return {received,postMessage(message){received.push(message.type);}};};
const armedPosts=h=>h.posts.filter(p=>p.message.type==='PVC_PAGE_ARMED').length;
test('loading a page arms nothing and a toolbar press arms this frame and its children once',()=>{
  const child=frameWindow(),h=harness({frames:[child]});h.run();h.finish();
  assert.equal(armedPosts(h),0);assert.deepEqual(child.received.filter(type=>type==='NOK_PAGE_ARMED'),[]);
  for(const type of ['PVC_TOOLBAR_TOGGLE','PVC_TOOLBAR_TOGGLE'])h.listeners[0]({source:h.window,data:{type}});
  assert.equal(armedPosts(h),1);assert.deepEqual(child.received.filter(type=>type==='NOK_PAGE_ARMED'),['NOK_PAGE_ARMED']);
});
test('the first open during engine load arms the page',()=>{
  const h=harness();h.run();h.listeners[0]({source:h.window,data:{type:'PVC_OPEN_POPUP'}});
  assert.equal(armedPosts(h),1);
});
test('a frame that loads later learns the page was pressed, and only then',()=>{
  const child=frameWindow(),h=harness({frames:[child],NOkFrameProtocol:{}});h.run();
  h.listeners[0]({source:child,data:{type:'NOK_FRAME_READY'}});
  assert.deepEqual(child.received.filter(type=>type==='NOK_PAGE_ARMED'),[]);
  h.listeners[0]({source:h.window,data:{type:'PVC_TOOLBAR_TOGGLE'}});child.received.length=0;
  h.listeners[0]({source:child,data:{type:'NOK_FRAME_READY'}});
  assert.deepEqual(child.received.filter(type=>type==='NOK_PAGE_ARMED'),['NOK_PAGE_ARMED']);
});
test('a child frame accepts arming only from its parent and passes it to an engine that loads afterwards',()=>{
  const parent=frameWindow(),stranger=frameWindow(),h=harness({parent});h.run();
  h.listeners[0]({source:stranger,data:{type:'NOK_PAGE_ARMED'}});
  assert.equal(armedPosts(h),0);
  h.listeners[0]({source:parent,data:{type:'NOK_PAGE_ARMED'}});
  assert.equal(armedPosts(h),1);
  h.finish();
  assert.equal(h.posts.filter(p=>p.ready&&p.message.type==='PVC_PAGE_ARMED').length,1,'the engine loaded after arming still hears it');
});
