const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {state,session,owner} = require('./frame-fixtures.cjs');
const source = fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
function harness() {
  const posts = [], calls = [], timers = new Map(); let next = 0;
  const window = {postMessage: message => posts.push(message)}; window.top = window;
  const context = vm.createContext({window, qualityWatchTimer:null, document:{getElementById:()=>null},
    setTimeout: callback => {timers.set(++next,callback);return next;}, clearTimeout:id=>timers.delete(id),
    stopAdWatch(){}, showToast(){}, findVideoAndPlayer:()=>({video:{},player:null}), setSpeed:value=>{calls.push(value);return true;},
    inputState:state(), session, owner, calls });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','frame-protocol.js'),'utf8'),context);
  vm.runInContext(source.slice(source.indexOf('  // FRAME PRESENTATION'),source.indexOf('  // END FRAME PRESENTATION')),context);
  // Exercise production request/controller functions; DOM rendering is covered by the browser fixture.
  context.buildRemoteSourceState=()=>context.inputState; context.publishRemoteSourceState=()=>{};
  context.renderRemoteHud=()=>{}; context.resetPopupToDefaultPosition=()=>{}; context.clampPopupToViewport=()=>{}; context.resetIdleTimer=()=>{};
  return {context,posts,calls,timers,run:code=>vm.runInContext(code,context)};
}
test('source controller rejects stale owner or inventory revision before invoking a setter',async()=>{
  const h=harness(); h.run('remoteSourceSession=session; remoteSourceOwner=owner');
  h.context.command={name:'speed',owner,revision:0,value:1.5};
  await h.run('executeRemoteCommand({session,id:1,command})');
  assert.deepEqual(h.calls,[]); assert.equal(h.posts.at(-1).payload.reply.code,'stale');
  h.context.command={name:'speed',owner:'c'.repeat(32),revision:1,value:1.5};
  await h.run('executeRemoteCommand({session,id:2,command})'); assert.deepEqual(h.calls,[]);
  h.context.command={name:'speed',owner,revision:1,value:1.5};
  await h.run('executeRemoteCommand({session,id:3,command})'); assert.deepEqual(h.calls,[1.5]); assert.equal(h.posts.at(-1).payload.reply.ok,true);
});
test('source controller drops a previous session and malformed commands without a reply or action',async()=>{
  const h=harness(); h.run('remoteSourceSession=session; remoteSourceOwner=owner');
  h.context.command={name:'speed',owner,revision:1,value:16};
  await h.run('executeRemoteCommand({session,id:1,command})');
  h.context.command.value=1.5;
  await h.run('executeRemoteCommand({session:"d".repeat(32),id:1,command})');
  assert.deepEqual(h.posts,[]); assert.deepEqual(h.calls,[]);
});
test('presentation resolves only its own owner/session request; close cancels outstanding timers',async()=>{
  const h=harness(); h.run('remotePresentation=inputState; remotePresentationSession=session');
  const result=h.run('remoteControl("speed",1.5)'), id=h.posts.at(-1).payload.id;
  h.context.reply={id,owner:'c'.repeat(32),ok:true,code:'ok'};
  h.run('acceptRemoteReply({session,reply})'); assert.equal(h.timers.size,1);
  h.context.reply.owner=owner; h.run('acceptRemoteReply({session,reply})');
  assert.equal((await result).ok,true); assert.equal(h.timers.size,0);
  const abandoned=h.run('remoteControl("speed",2)'); h.run('clearRemoteSession()');
  assert.equal((await abandoned).code,'stale'); assert.equal(h.timers.size,0);
  h.run('acceptRemoteState({session,state:inputState})'); assert.equal(h.run('remotePresentation'),null);
});
test('presentation timeout reports timeout and a late reply cannot resurrect the request',async()=>{
  const h=harness(); h.run('remotePresentation=inputState; remotePresentationSession=session');
  const pending=h.run('remoteControl("speed",1.5)');
  [...h.timers.values()][0]();
  assert.equal((await pending).code,'timeout'); assert.equal(h.run('remoteRequests.size'),0);
  h.context.reply={id:h.posts.at(-1).payload.id,owner,ok:true,code:'ok'};
  h.run('acceptRemoteReply({session,reply})'); assert.equal(h.run('remoteRequests.size'),0);
});
