const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {state,session,owner} = require('./frame-fixtures.cjs');
const source = fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
function harness() {
  const posts = [], calls = [], timers = new Map(), cancelledFrames=[]; let next = 0;
  const window = {postMessage: message => posts.push(message)}; window.top = window;
  const context = vm.createContext({window, qualityWatchTimer:null, filterUpdateFrame:null, document:{getElementById:()=>null,addEventListener(){}},
    setTimeout: callback => {timers.set(++next,callback);return next;}, clearTimeout:id=>timers.delete(id),
    cancelAnimationFrame:id=>cancelledFrames.push(id),
    stopAdWatch(){}, showToast(){}, findVideoAndPlayer:()=>({video:{},player:null}), setSpeed:value=>{calls.push(value);return true;},
    inputState:state(), session, owner, calls });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','frame-protocol.js'),'utf8'),context);
  vm.runInContext(source.slice(source.indexOf('  // FRAME PRESENTATION'),source.indexOf('  // END FRAME PRESENTATION')),context);
  // Exercise production request/controller functions; DOM rendering is covered by the browser fixture.
  context.buildRemoteSourceState=()=>context.inputState; context.publishRemoteSourceState=()=>{};
  context.renderRemoteHud=()=>{}; context.resetPopupToDefaultPosition=()=>{}; context.clampPopupToViewport=()=>{}; context.resetIdleTimer=()=>{};
  return {context,posts,calls,timers,cancelledFrames,run:code=>vm.runInContext(code,context)};
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

test('unready source waits and retries the same session when metadata arrives',()=>{
  const h=harness(),video={readyState:0};
  h.context.findVideoAndPlayer=()=>({video});
  h.context.monitorVideoResolution=()=>{};h.context.startQualityWatch=()=>{};h.context.syncRemoteFullscreen=()=>{};
  h.run('startRemoteSource(session)');
  assert.equal(h.run('remoteSourceSession'),null);
  assert.equal(h.run('pendingRemoteSourceSession'),session);
  assert.equal(h.posts.at(-1).type,'PVC_OPEN_IN_CHILD_FRAMES');
  video.readyState=4;h.run('retryPendingRemoteSource()');
  assert.equal(h.run('remoteSourceSession'),session);
  assert.equal(h.run('pendingRemoteSourceSession'),null);
  assert.equal(h.posts.at(-1).type,'PVC_HUD_OPENED');
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

test('slow iframe filters keep one request in flight and send only the newest queued value',async()=>{
  const h=harness();h.run('remotePresentation=inputState;remotePresentationSession=session');
  h.run('queueRemoteFilters({brightness:110,contrast:100,saturate:100,nightShield:false,invert:false})');
  for(let i=0;i<200;i++)h.run(`queueRemoteFilters({brightness:${100+i%51},contrast:100,saturate:100,nightShield:false,invert:false})`);
  assert.equal(h.posts.length,1);assert.equal(h.timers.size,1);
  h.context.reply={id:h.posts[0].payload.id,owner,ok:true,code:'ok'};
  h.run('acceptRemoteReply({session,reply})');await Promise.resolve();
  assert.equal(h.posts.length,2);assert.equal(h.posts[1].payload.command.value.brightness,146);
  assert.equal(h.run('remoteRequests.size'),1);assert.equal(h.timers.size,1);
});

test('queued filters cannot cross an owner replacement or a close/reopen session',async()=>{
  for(const replacement of ['acceptRemoteState({session,state:{...inputState,owner:"e".repeat(32)}})','clearRemoteSession()']){
    const h=harness();h.run('remotePresentation=inputState;remotePresentationSession=session');
    h.run('queueRemoteFilters(inputState.filters);queueRemoteFilters({...inputState.filters,brightness:120})');
    const first=h.posts[0].payload.id;h.run(replacement);
    h.context.reply={id:first,owner,ok:true,code:'ok'};h.run('acceptRemoteReply({session,reply})');
    await Promise.resolve();assert.equal(h.posts.length,1);
  }
});

test('old iframe snapshots cannot overwrite a slider intent before dispatch or before its matching acknowledgement',async()=>{
  const h=harness();h.run('remotePresentation=inputState;remotePresentationSession=session;videoFilterState={...inputState.filters,brightness:120};rememberRemoteFilterIntent(videoFilterState);filterUpdateFrame=1');
  h.run('syncRemoteFilters(inputState)');assert.equal(h.run('videoFilterState.brightness'),120);
  h.run('filterUpdateFrame=null;queueRemoteFilters(videoFilterState);syncRemoteFilters(inputState)');assert.equal(h.run('videoFilterState.brightness'),120);
  h.context.reply={id:h.posts[0].payload.id,owner,ok:true,code:'ok'};
  h.run('acceptRemoteReply({session,reply})');await Promise.resolve();
  h.run('syncRemoteFilters(inputState)');assert.equal(h.run('videoFilterState.brightness'),120);
  h.run('syncRemoteFilters({...inputState,filters:{...inputState.filters,brightness:120}})');
  assert.equal(h.run('remoteFilterIntent'),null);
  h.run('syncRemoteFilters(inputState)');assert.equal(h.run('videoFilterState.brightness'),100,'source controls resume after the matching echo');
});

test('closing a remote session cancels an unsent animation-frame filter update',()=>{
  const h=harness();h.run('remotePresentation=inputState;remotePresentationSession=session;filterUpdateFrame=7;clearRemoteSession()');
  assert.deepEqual(h.cancelledFrames,[7]);assert.equal(h.run('filterUpdateFrame'),null);
});
