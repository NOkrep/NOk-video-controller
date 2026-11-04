// I-07: real Hls.js + installed extension + test-owned flash/beep HLS. Output stays silent: the probe
// reroutes the Web Audio destination through a zero gain. Prepare: prepare-browser-fixtures.cjs --av-fixture
// node tests/av-sync-browser.cjs --engine=firefox|chromium [--scenario=graph-first|native-first] [--label=run] [--headless=true]
// Audio offset is the media position when a beep reaches the graph, relative to the beep's own period.
// Positive means the picture is ahead of the sound. Absolute values include fixture and graph constants, so compare windows.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox',scenario=args.scenario||'graph-first',label=args.label||'run';
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const artifacts=path.join(__dirname,'artifacts'),period=2;
const installProbe=()=>{
  const video=document.querySelector('video'),connect=AudioNode.prototype.connect,state={frames:[],beeps:[],contexts:new Set(),taps:new Map(),silent:new Map()};
  window.__av=state;
  AudioNode.prototype.connect=function(target,...rest){
    if(!(target instanceof AudioDestinationNode))return connect.call(this,target,...rest);
    const ctx=this.context;state.contexts.add(ctx);
    if(!state.silent.has(ctx)){const gain=ctx.createGain();gain.gain.value=0;connect.call(gain,ctx.destination);state.silent.set(ctx,gain);}
    if(!state.taps.has(ctx)){const analyser=ctx.createAnalyser();analyser.fftSize=2048;connect.call(analyser,state.silent.get(ctx));state.taps.set(ctx,{analyser,buffer:new Float32Array(2048),loud:false});}
    connect.call(this,state.taps.get(ctx).analyser);return target;
  };
  const frame=(now,meta)=>{state.frames.push([meta.presentationTime||now,meta.mediaTime]);if(state.frames.length>6000)state.frames.shift();video.requestVideoFrameCallback(frame);};
  video.requestVideoFrameCallback(frame);
  setInterval(()=>{
    for(const [ctx,tap] of state.taps){
      tap.analyser.getFloatTimeDomainData(tap.buffer);
      const index=tap.buffer.findIndex(value=>Math.abs(value)>.2);
      if(index<0){tap.loud=false;continue;}
      if(tap.loud)continue;
      tap.loud=true;
      state.beeps.push({wall:performance.now()-(tap.buffer.length-1-index)/ctx.sampleRate*1000,clock:video.currentTime});
    }
  },5);
};
const readWindow=()=>{
  const state=window.__av,video=document.querySelector('video'),quality=video.getVideoPlaybackQuality?.(),ctx=[...state.contexts].at(-1);
  const result={beeps:state.beeps,frames:state.frames,rate:video.playbackRate,paused:video.paused,seeking:video.seeking,muted:video.muted,volume:video.volume,clock:video.currentTime,
    droppedFrames:quality?.droppedVideoFrames??null,totalFrames:quality?.totalVideoFrames??null,context:ctx?{state:ctx.state,baseLatency:ctx.baseLatency??null,outputLatency:ctx.outputLatency??null,sampleRate:ctx.sampleRate}:null,contextCount:state.contexts.size,now:performance.now()};
  state.beeps=[];state.frames=[];return result;
};
const median=values=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];};
const percentile=(values,p)=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];};
const folded=media=>((media+period/2)%period+period)%period-period/2;
const round=(value,digits=1)=>value===null?null:Number(value.toFixed(digits));
function summarize(name,raw,seconds){
  const {beeps,frames}=raw,offsets=[],clockOffsets=[];
  for(const beep of beeps){
    let index=frames.findIndex(item=>item[0]>beep.wall);
    if(index<=0)continue;
    const [t0,m0]=frames[index-1],[t1,m1]=frames[index];
    if(t1<=t0||Math.abs(m1-m0)>1)continue;
    offsets.push(folded(m0+(m1-m0)*(beep.wall-t0)/(t1-t0))*1000);clockOffsets.push(folded(beep.clock)*1000);
  }
  const intervals=beeps.slice(1).map((beep,i)=>beep.wall-beeps[i].wall).filter(value=>value>200);
  const videoSteps=[];for(let i=20;i<frames.length;i+=20){const dt=frames[i][0]-frames[i-20][0],dm=frames[i][1]-frames[i-20][1];if(dt>0&&dm>0&&dm<2)videoSteps.push(dm/dt*1000);}
  const audioRate=intervals.length?period*1000/median(intervals):null;
  // A hidden or occluded window throttles timers and frames; such a window is not evidence either way.
  return {name,seconds,valid:frames.length>=seconds*15,beeps:beeps.length,offsetMedianMs:round(median(offsets)),offsetP10Ms:round(percentile(offsets,.1)),offsetP90Ms:round(percentile(offsets,.9)),clockOffsetMedianMs:round(median(clockOffsets)),
    requestedRate:raw.rate,audioRate:round(audioRate,3),videoRate:round(median(videoSteps),3),frames:frames.length,droppedFrames:raw.droppedFrames,totalFrames:raw.totalFrames,paused:raw.paused,seeking:raw.seeking,muted:raw.muted,
    context:raw.context&&{state:raw.context.state,baseLatencyMs:raw.context.baseLatency===null?null:round(raw.context.baseLatency*1000),outputLatencyMs:raw.context.outputLatency===null?null:round(raw.context.outputLatency*1000)},contextCount:raw.contextCount};
}
function save(output){
  const directory=path.join(artifacts,`av-sync-${label}`);fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,`${output.engine}-${output.scenario}.json`),JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify(output));
}
async function main(){
  const fixture=path.join(artifacts,'hls-av','av.m3u8'),runtime=path.join(artifacts,'runtime','hls.min.js');
  assert.ok(fs.existsSync(fixture)&&fs.existsSync(runtime),'Run prepare-browser-fixtures.cjs --av-fixture and provide the reviewed Hls.js runtime.');
  const server=http.createServer((req,res)=>{
    const route=req.url.split('?')[0],match=route.match(/^\/(hls-av\/av(?:-\d{3}\.ts|\.m3u8)|runtime\/hls\.min\.js)$/);
    if(match){res.writeHead(200,{'Content-Type':match[1].endsWith('.js')?'application/javascript':match[1].endsWith('.m3u8')?'application/vnd.apple.mpegurl':'video/mp2t'});fs.createReadStream(path.join(artifacts,match[1])).pipe(res);return;}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    res.end(`<!doctype html><html><meta charset="utf-8"><style>body{background:#152330;margin:12px}video{width:640px;height:360px;display:block}</style>
      <button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Controller</button><video autoplay muted playsinline></video><script src="/runtime/hls.min.js"></script><script>
      const start=setInterval(()=>{if(!window.__NOK_VIDEO_CONTROLLER_INJECTED__)return;clearInterval(start);const video=document.querySelector('video'),player=new Hls();player.loadSource('/hls-av/av.m3u8');player.attachMedia(video);player.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));},25);</script></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let driver;const windows=[];
  try{
    driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{viewport:{width:1200,height:950},visible:args.headless!=='true'});
    await driver.install();const page=await driver.open(`http://127.0.0.1:${server.address().port}/`);await driver.activate(page);
    await until(driver,page,()=>document.querySelector('video')?.readyState>=2&&!document.querySelector('video').paused,'Hls.js playback');
    await driver.evaluate(page,installProbe);
    await driver.pointerClick(page,'#open');
    await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','HUD open');
    await driver.evaluate(page,()=>{document.getElementById('pvc-a11y-keepVisible').click();document.getElementById('pvc-tab-player').click();});
    await until(driver,page,()=>document.querySelector('#pvc-active-adapter-badge')?.textContent.startsWith('HlsJsAdapter'),'Hls.js adapter');
    const click=id=>driver.evaluate(page,id=>document.getElementById(id).click(),id);
    const slider=(id,value)=>driver.evaluate(page,(id,value)=>{const input=document.getElementById(id);input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},id,value);
    const settled=()=>until(driver,page,()=>{const video=document.querySelector('video');return !video.seeking&&!video.paused&&video.readyState>=3;},'media settled');
    const measure=async(name,seconds)=>{await settled();await delay(1500);await driver.evaluate(page,readWindow);await delay(seconds*1000);const item=summarize(name,await driver.evaluate(page,readWindow),seconds);windows.push(item);process.stderr.write(JSON.stringify(item)+'\n');return item;};
    const burst=async()=>{ // Order and pace follow the fixed event codes of the #104 report.
      const steps=[['seek','p10'],['seek','p10'],['seek','p10'],['speed',1.5],['speed',2],['speed',1],['speed',2],['speed',1],['speed',1.25],['speed',1.5],['speed',2],['speed',1],['seek','m10'],['seek','p10'],['seek','m10'],['seek','p30'],['seek','m30'],['seek','m30']];
      for(const [kind,value] of steps){if(kind==='seek')await click('pvc-seek-'+value);else await slider('pvc-speed-slider',value);await delay(250);}
    };
    const route=async()=>{await click('pvc-audio-mono-btn');await delay(300);await slider('pvc-volume-slider',100);await delay(300);await click('pvc-audio-stereo-btn');await until(driver,page,()=>window.__av.taps.size>0,'graph tap');};
    if(scenario==='long'){
      await route();
      for(let minute=1;minute<=4;minute++)await measure(`long play minute ${minute}`,58);
      save({engine,browser:driver.version,scenario,windows});return;
    }
    await driver.evaluate(page,()=>{document.querySelector('video').currentTime=60;});await settled();
    if(scenario==='edge'){
      await route();await measure('baseline graph 1x',12);
      await slider('pvc-volume-slider',0);await burst();await delay(500);
      await slider('pvc-volume-slider',100);await measure('burst while volume 0, then 100',12);
      await slider('pvc-volume-slider',200);await measure('boost 200',12);
      await slider('pvc-volume-slider',100);await driver.evaluate(page,()=>document.querySelector('video').pause());await delay(3000);
      await driver.evaluate(page,()=>document.querySelector('video').play());await measure('after pause and resume',12);
      await click('pvc-audio-mono-btn');await measure('mono stays selected',12);await click('pvc-audio-stereo-btn');
      await driver.evaluate(page,()=>document.querySelector('video').currentTime=60);await measure('after direct site seek',12);
    }else if(scenario==='native-first'){await burst();await settled();await route();await measure('after burst, graph created last',16);}
    else{
      await route();await measure('baseline graph 1x',16);
      await burst();await measure('after burst 1x',16);
    }
    await slider('pvc-speed-slider',1.5);await measure('rate 1.5x',12);
    await slider('pvc-speed-slider',2);await measure('rate 2x',12);
    await slider('pvc-speed-slider',1);await measure('back to 1x',16);
    await click('pvc-seek-p30');await measure('after +30 seek 1x',12);
    // Every control must still reach the same selected video once the session is in this state.
    await slider('pvc-speed-slider',1.25);await until(driver,page,()=>document.querySelector('video').playbackRate===1.25,'speed reaches video');
    await slider('pvc-volume-slider',50);await until(driver,page,()=>Math.abs(document.querySelector('video').volume-.5)<.01,'volume reaches video');
    const before=await driver.evaluate(page,()=>document.querySelector('video').currentTime);await click('pvc-seek-p10');
    await until(driver,page,before=>document.querySelector('video').currentTime>=before+9,'seek reaches video',before);
    const controls={speed:true,volume:true,seek:true,hudVisible:await driver.evaluate(page,()=>document.getElementById('pvc-controller-popup').style.display==='block'),
      adapter:await driver.evaluate(page,()=>document.querySelector('#pvc-active-adapter-badge')?.textContent)};
    save({engine,browser:driver.version,scenario,windows,controls});
  }finally{if(driver)await driver.close();server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
