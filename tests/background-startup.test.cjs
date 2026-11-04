const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function harness(supportsMain=true){
  let clicked;const calls=[],posts=[];
  const pageWindow={location:{hostname:'example.invalid'},fetch:async()=>({ok:true}),addEventListener(){},postMessage:message=>posts.push(message)};
  pageWindow.parent=pageWindow;pageWindow.top=pageWindow;
  const main=vm.createContext({window:pageWindow,document:{currentScript:null,addEventListener(){}},navigator:{userAgent:'Firefox'},
    XMLHttpRequest:class{open(){}},HTMLMediaElement:class{},console:{log(){},warn(){},error(){}},
    setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},performance:{now:()=>1}});
  const isolated=vm.createContext({window:{}});
  const api={runtime:{getURL:file=>'extension:///'+file},action:{onClicked:{addListener:fn=>{clicked=fn;}}},scripting:{
    insertCSS:async()=>{},executeScript:async request=>{
      calls.push(request);
      if(request.world==='MAIN'&&!supportsMain)throw Error('unsupported');
      const context=request.world==='MAIN'?main:isolated;
      if(request.func)return [{result:vm.runInContext(`(${request.func})(...${JSON.stringify(request.args||[])})`,context)}];
      if(request.world==='MAIN')for(const file of request.files)vm.runInContext(read(file),context);
      return [{result:undefined}];
    }}};
  vm.runInContext(read('background.js'),vm.createContext({chrome:api,console:{log(){},warn(){},error(){}}}));
  return {click:()=>clicked({id:7,url:'https://example.invalid/'}),main,isolated,calls,posts};
}
test('a toolbar click boots the actual MAIN engine before signaling the isolated relay, without a DOM script',async()=>{
  const h=harness();await h.click();
  assert.equal(h.main.window.__NOK_VIDEO_CONTROLLER_ENGINE_READY__,true);
  assert.equal(h.main.window.__NOK_VIDEO_CONTROLLER_ASSETS__,undefined);
  assert.equal(h.isolated.window.__NOK_VIDEO_CONTROLLER_MAIN_READY__,true);
  assert.equal(h.isolated.window.__NOK_VIDEO_CONTROLLER_TOOLBAR_REQUEST__,true);
  await h.click();assert.equal(h.calls.filter(call=>call.world==='MAIN'&&call.files).length,1,'ready engine is reused');
});
test('an unsupported MAIN world preserves the existing isolated/DOM startup path',async()=>{
  const h=harness(false);await h.click();
  assert.equal(h.isolated.window.__NOK_VIDEO_CONTROLLER_MAIN_READY__,undefined);
  assert.equal(h.isolated.window.__NOK_VIDEO_CONTROLLER_TOOLBAR_REQUEST__,true);
  assert.ok(h.calls.some(call=>call.files?.includes('content.js')));
});
