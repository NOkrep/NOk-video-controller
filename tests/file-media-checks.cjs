// Test-owned generated file, not user media. Browser-side probes never enter production reports.
const fs=require('node:fs');
function serveMedia(request,response,file) {
  const size=fs.statSync(file).size, range=request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  const start=range?Number(range[1]):0, end=range&&range[2]?Math.min(Number(range[2]),size-1):size-1;
  if(start>=size||start>end){response.writeHead(416,{'Content-Range':`bytes */${size}`});response.end();return;}
  response.writeHead(range?206:200,{'Content-Type':'video/webm','Accept-Ranges':'bytes','Content-Length':end-start+1,
    ...(range?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});
  fs.createReadStream(file,{start,end}).pipe(response);
}
function mediaHtml(scripts='') {
  return `<!doctype html><html><head><meta charset="utf-8">${scripts}<style>body{background:#152330;color:white;margin:24px}.video-js{width:800px}video{width:100%}</style></head>
    <body><h1>Generated 720p file fixture</h1><button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Controller</button>
    <div class="video-js"><video src="/synthetic.webm" autoplay muted loop playsinline></video></div></body></html>`;
}
async function exerciseFileMedia() {
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const until=async(predicate,label)=>{const deadline=performance.now()+10000;while(performance.now()<deadline){if(predicate())return;await wait(50);}throw new Error(label);};
  const video=document.querySelector('video');
  await until(()=>video.readyState>=2,'file media ready');await video.play();
  document.querySelector('#open').click();
  await until(()=>document.querySelector('#pvc-volume-slider') && document.querySelector('#pvc-controller-popup').style.display==='block','file HUD ready');
  const volume=document.querySelector('#pvc-volume-slider');volume.value='40';volume.dispatchEvent(new Event('input',{bubbles:true}));
  await until(()=>Math.abs(video.volume-.4)<.01&&!video.muted,'initial file volume');
  const measure=async()=>{
    const before=video.getVideoPlaybackQuality(),started=performance.now();await wait(2000);
    const after=video.getVideoPlaybackQuality();return {wallMs:Math.round(performance.now()-started),
      totalFrames:after.totalVideoFrames-before.totalVideoFrames,droppedFrames:after.droppedVideoFrames-before.droppedVideoFrames};
  };
  const baseline=await measure();
  let filterWrites=0;
  const observer=new MutationObserver(records=>{filterWrites+=records.filter(record=>record.attributeName==='style').length;});
  observer.observe(video,{attributes:true,attributeFilter:['style']});
  const input=document.querySelector('#pvc-filter-brightness');
  for(let i=0;i<200;i++){input.value=String(100+(i%3)*5);input.dispatchEvent(new Event('input',{bubbles:true}));}
  await until(()=>video.style.filter.includes('brightness(105%)'),'coalesced file filter');
  await wait(100);observer.disconnect();
  if(filterWrites!==1)throw new Error(`Expected 1 filter write, observed ${filterWrites}`);
  const filtered=await measure();
  const nativeClock=[];
  for(const rate of [2,16]){
    video.playbackRate=rate;await wait(250);const before=video.currentTime,clock=performance.now();await wait(400);
    nativeClock.push({requested:rate,observed:video.playbackRate,measured:Math.round(((video.currentTime-before+video.duration)%video.duration)/((performance.now()-clock)/1000)*100)/100});
  }
  video.playbackRate=1;await wait(250);
  const root=video.closest('.video-js');root.classList.add('vjs-ad-playing');
  await until(()=>video.playbackRate===16&&video.muted,'actual file ad speed and mute');
  await wait(500); // Allow the decoder clock to settle after the native ratechange task.
  const started=performance.now(),time=video.currentTime;
  await wait(400);
  const mediaDelta=(video.currentTime-time+video.duration)%video.duration, wall=(performance.now()-started)/1000;
  const measuredRate=mediaDelta/wall;
  if(measuredRate<6)throw new Error(`File playback clock did not accelerate: ${JSON.stringify({measuredRate,nativeClock,rate:video.playbackRate,paused:video.paused,ready:video.readyState,baseline,filtered})}`);
  root.classList.remove('vjs-ad-playing');
  await until(()=>video.playbackRate===1&&!video.muted&&Math.abs(video.volume-.4)<.01,'file ad restoration');
  return {source:'locally generated 1280x720 30fps WebM',filterInputCount:200,filterWrites,baseline,filtered,nativeClock,
    ad:{observedPlaybackRate:16,measuredMediaClockRate:Math.round(measuredRate*100)/100,restoredRate:video.playbackRate,restoredVolume:video.volume},
    limitations:['Headless synthetic decoding/rendering sample; no claim about real-site ads or the user GPU','Two-second frame samples are not a hardware performance benchmark']};
}
module.exports={serveMedia,mediaHtml,exerciseFileMedia};
