// The compact toolbar preview with the real extension: on a page with its own video and through a cross-origin player frame.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'firefox';
const mediaHtml=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111}video{width:640px;height:360px}</style><video autoplay muted playsinline></video><script>
const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle='#213847';ctx.fillRect(0,0,640,360);},100);
const video=document.querySelector('video');video.srcObject=canvas.captureStream(10);video.play().catch(()=>{});
// A canvas stream may not keep a playback rate, so the requests themselves are recorded.
const rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.rates=[];
Object.defineProperty(video,'playbackRate',{configurable:true,get(){return rate.get.call(this);},set(value){window.rates.push(value);rate.set.call(this,value);}});</script>`;
const lastRate=expected=>window.rates.at(-1)===expected;
// A two-line SRT given to the classic file input, as a file picker would.
const loadSubtitles=()=>{const input=document.getElementById('pvc-sub-file-input'),data=new DataTransfer();
  data.items.add(new File(['1\n00:00:01,000 --> 00:00:03,000\nFirst\n\n2\n00:00:04,000 --> 00:00:06,000\nSecond\n'],'sample.srt',{type:'text/plain'}));
  input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));};
const visible=id=>{const node=document.getElementById(id);if(!node)return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(node).visibility!=='hidden';};
const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};};
// A real double-click: two clicks (detail 1 and 2) and then dblclick.
const dblclickMode=()=>{const mode=document.getElementById('pvc-tb-mode');for(const detail of [1,2])mode.dispatchEvent(new MouseEvent('click',{bubbles:true,detail}));mode.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,detail:2}));};
const wheel=(id,deltaY)=>document.getElementById(id).dispatchEvent(new WheelEvent('wheel',{deltaY,deltaMode:0,bubbles:true,cancelable:true}));
(async()=>{let driver;
// The player page enforces Trusted Types, as some video sites do: the toolbar must not build UI from HTML strings at run time.
// /empty is a page without any video, for the "waiting for a video" strip. It is also served in a legacy
// Turkish encoding (windows-1254), so the injected engine must still be read as UTF-8.
const media=http.createServer((req,res)=>{const empty=req.url==='/empty';
  res.writeHead(200,{'Content-Type':`text/html; charset=${empty?'windows-1254':'utf-8'}`,'Content-Security-Policy':"require-trusted-types-for 'script'"});
  res.end(empty?'<!doctype html><body style="margin:0;background:#111;height:600px"><p style="color:#888">No video here.</p></body>':mediaHtml);});
const parent=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<!doctype html><body style="margin:0"><iframe style="width:700px;height:420px" allow="autoplay" src="http://127.0.0.1:${media.address().port}/"></iframe></body>`);});
try{
  await new Promise(resolve=>media.listen(0,'127.0.0.1',resolve));
  await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  driver=await createDriver(engine,args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),path.resolve(__dirname,'../node_modules'),{toolbarControls:true});
  await driver.install();
  const page=await driver.open(`http://127.0.0.1:${media.address().port}/`);
  await until(driver,page,()=>document.querySelector('video')?.readyState>=2,'video plays');
  await driver.toolbar(page);
  await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel opens');
  await driver.evaluate(page,()=>document.getElementById('pvc-a11y-keepVisible').click());

  // The toolbar is the default layout (user decision, 14 Nov); the classic panel is Easy-read.
  await until(driver,page,()=>document.getElementById('pvc-controller-popup').classList.contains('pvc-layout-toolbar'),'toolbar by default');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-mode'),true,'the toolbar is shown');
  assert.equal(await driver.evaluate(page,visible,'pvc-drag-header'),false,'the classic header is hidden');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-mode-label').textContent),'Player');

  // Speed: preset, chip value, real playback rate, and the mouse wheel.
  await driver.pointerClick(page,'#pvc-tb-speed');
  await until(driver,page,visible,'speed popover opens','pvc-tb-pop-speed');
  const bar=await driver.evaluate(page,()=>{const r=document.querySelector('#pvc-toolbar .pvc-tb-bar').getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left};});
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-pop-speed')).top>bar.bottom,'opens below while the toolbar is in the upper half');
  await driver.pointerClick(page,'[data-pvc-speed="1.5"]');
  await until(driver,page,lastRate,'speed preset reaches the video',1.5);
  await until(driver,page,()=>document.getElementById('pvc-tb-speed-val').textContent==='1.5×','the chip shows 1.5×');
  await driver.evaluate(page,wheel,'pvc-tb-speed',100);
  await until(driver,page,lastRate,'wheel down lowers the speed',1.25);

  // One popover at a time: volume replaces speed.
  await driver.pointerClick(page,'#pvc-tb-volume');
  await until(driver,page,visible,'volume popover opens','pvc-tb-pop-volume');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-pop-speed'),false,'the speed popover closed');
  await driver.pointerClick(page,'[data-pvc-vol="0"]');
  await until(driver,page,()=>document.querySelector('video').muted===true&&document.getElementById('pvc-tb-volume-val').textContent==='0%','volume 0 mutes');
  await driver.pointerClick(page,'[data-pvc-vol="100"]');
  await until(driver,page,()=>document.querySelector('video').muted===false&&document.getElementById('pvc-tb-volume-val').textContent==='100%','volume back to 100');
  // Stereo/Mono switch: icons only on hover or focus, the name always; click, arrow keys and the wheel switch it.
  const channelIcons=()=>getComputedStyle(document.querySelector('#pvc-tb-channel .pvc-tb-channel-mono')).opacity;
  await driver.hover(page,'#pvc-tb-volume-slider');await delay(250);
  assert.equal(await driver.evaluate(page,channelIcons),'0','icons hidden at rest');
  await driver.hover(page,'#pvc-tb-channel');
  await until(driver,page,()=>getComputedStyle(document.querySelector('#pvc-tb-channel .pvc-tb-channel-mono')).opacity==='1','icons on hover');
  await driver.pointerClick(page,'#pvc-tb-channel');
  await until(driver,page,()=>document.getElementById('pvc-audio-mono-btn').classList.contains('pvc-audio-active')
    &&document.getElementById('pvc-tb-channel').getAttribute('aria-checked')==='true'&&document.getElementById('pvc-tb-channel-val').textContent==='Mono','mono reaches the shared state and the name');
  await driver.press(page,'ArrowLeft');
  await until(driver,page,()=>!document.getElementById('pvc-audio-mono-btn').classList.contains('pvc-audio-active')&&document.getElementById('pvc-tb-channel-val').textContent==='Stereo','← chooses stereo');
  await driver.evaluate(page,wheel,'pvc-tb-channel',100);
  await until(driver,page,()=>document.getElementById('pvc-tb-channel').getAttribute('aria-checked')==='true','wheel down chooses mono');
  await driver.press(page,'ArrowLeft');
  await until(driver,page,()=>document.getElementById('pvc-tb-channel').getAttribute('aria-checked')==='false','back to stereo');

  // Seek step: popover choice, wheel stepping and the arrows' label.
  await driver.pointerClick(page,'#pvc-tb-seek-step');
  await until(driver,page,visible,'seek popover opens','pvc-tb-pop-seek');
  await driver.pointerClick(page,'[data-pvc-step="30"]');
  await until(driver,page,()=>document.getElementById('pvc-tb-seek-val').textContent==='30s','step 30s');
  await driver.evaluate(page,wheel,'pvc-tb-seek-step',-100);
  await until(driver,page,()=>document.getElementById('pvc-tb-seek-val').textContent==='60s','wheel up raises the step');
  assert.match(await driver.evaluate(page,()=>document.getElementById('pvc-tb-seek-fwd').getAttribute('data-pvc-tip')),/60/,'arrow hint follows the step');
  await driver.press(page,'Escape');
  await until(driver,page,()=>!document.getElementById('pvc-tb-pop-seek').getClientRects().length,'Escape closes the popover');

  // Quality and the playing strip mirror the classic panel's state.
  await until(driver,page,()=>/Playing \d+×\d+/.test(document.getElementById('pvc-tb-playing').textContent),'playing resolution shown');
  await driver.pointerClick(page,'#pvc-tb-quality');
  await until(driver,page,visible,'quality popover opens','pvc-tb-pop-quality');
  assert.ok(await driver.evaluate(page,()=>document.getElementById('pvc-tb-adapter').textContent.length>0),'adapter mirrored');
  assert.equal(await driver.evaluate(page,()=>document.querySelectorAll('#pvc-tb-target-list [data-pvc-value]').length),
    await driver.evaluate(page,()=>document.getElementById('pvc-video-target').options.length),'video targets mirrored in our own list');
  // B3 link: the open button is marked and the popover carries the accent line under it; no arrows on the bar.
  assert.ok(await driver.evaluate(page,()=>document.getElementById('pvc-tb-quality').getAttribute('aria-expanded')==='true'&&document.getElementById('pvc-tb-pop-quality').hasAttribute('data-pvc-linked')),'popover linked to its button');
  assert.equal(await driver.evaluate(page,()=>[...document.querySelectorAll('#pvc-toolbar .pvc-tb-bar [data-pvc-popover]')].every(button=>button.querySelectorAll(':scope > svg').length<=1)),true,'no arrow icons on the bar buttons (status marks such as the DRM shield sit in their own spans)');
  await driver.pointerClick(page,'#pvc-tb-target-btn');
  await until(driver,page,visible,'our own target list opens','pvc-tb-target-list');
  await driver.press(page,'Escape');

  // Transient states (16 Nov): play/pause and the DRM shield in the Playing strip, the retry mark, the frame-loss strip.
  await driver.pointerClick(page,'#pvc-tb-playpause');
  await until(driver,page,()=>document.querySelector('video').paused&&!document.getElementById('pvc-tb-play-icon').hidden&&document.getElementById('pvc-tb-pause-icon').hidden,'pause from the strip');
  await driver.pointerClick(page,'#pvc-tb-playpause');
  await until(driver,page,()=>!document.querySelector('video').paused&&!document.getElementById('pvc-tb-pause-icon').hidden,'play again from the strip');
  // The panel's own detector decides DRM: the video gets the mark the extension sets when a page attaches media keys.
  await driver.evaluate(page,()=>{document.querySelector('video').__nokHasMediaKeys=true;});
  await until(driver,page,()=>{const on=id=>document.getElementById(id).getClientRects().length>0;return on('pvc-tb-drm')&&on('pvc-tb-volume-limit');},'DRM shield in the strip and on the limited volume control');
  assert.equal(await driver.evaluate(page,()=>document.querySelector('#pvc-tb-drm .pvc-tb-shield-label').getBoundingClientRect().width<2),true,'only the shield shows until hovered');
  await driver.hover(page,'#pvc-tb-drm');
  await until(driver,page,()=>document.querySelector('#pvc-tb-drm .pvc-tb-shield-label').getBoundingClientRect().width>40,'hover reveals "Protected stream"');
  await delay(400);
  assert.ok(await driver.evaluate(page,()=>document.querySelector('#pvc-tb-drm .pvc-tb-shield-label').getBoundingClientRect().width>40),'the name stays open under a still pointer (the shield does not slide away)');
  await driver.pointerClick(page,'#pvc-tb-drm');
  await until(driver,page,()=>!!document.getElementById('pvc-drm-modal'),'the shield opens the DRM explanation');
  await driver.press(page,'Escape');
  await until(driver,page,()=>!document.getElementById('pvc-drm-modal')||!document.getElementById('pvc-drm-modal').getClientRects().length,'explanation closes');
  await driver.evaluate(page,()=>{delete document.querySelector('video').__nokHasMediaKeys;});
  await until(driver,page,()=>!document.getElementById('pvc-tb-drm').getClientRects().length&&!document.getElementById('pvc-tb-volume-limit').getClientRects().length,'shields leave with the protection');
  assert.deepEqual(await driver.evaluate(page,async()=>{const classic=document.getElementById('pvc-puhu-retry-source-btn'),frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    classic.hidden=false;await frames();const shown=[document.getElementById('pvc-tb-quality-retry').hidden,document.getElementById('pvc-tb-retry-source').hidden];classic.hidden=true;await frames();
    return [...shown,document.getElementById('pvc-tb-quality-retry').hidden];}),[false,false,true],'the retry button and its mark follow the classic retry option');
  await driver.evaluate(page,()=>{document.getElementById('pvc-frame-loss-text').textContent='The video is dropping frames. Turn off panel animations?';document.getElementById('pvc-frame-loss-notice').style.display='block';});
  await until(driver,page,()=>{const on=id=>document.getElementById(id).getClientRects().length>0;return on('pvc-tb-frameloss-strip')&&!on('pvc-tb-strip')&&/dropping frames/.test(document.getElementById('pvc-tb-frameloss-text').textContent);},'the frame-loss question takes the strip\'s place');
  await driver.pointerClick(page,'#pvc-tb-frameloss-no');
  await until(driver,page,()=>{const on=id=>document.getElementById(id).getClientRects().length>0;return !on('pvc-tb-frameloss-strip')&&on('pvc-tb-strip')&&document.getElementById('pvc-frame-loss-notice').style.display==='none';},'No answers through the classic panel and the Playing strip returns');

  // Lower half of the screen: the strip and popovers open above the bar.
  await driver.evaluate(page,()=>{const p=document.getElementById('pvc-controller-popup');p.style.setProperty('top',`${innerHeight-70}px`,'important');window.dispatchEvent(new Event('resize'));});
  await driver.pointerClick(page,'#pvc-tb-speed');
  await until(driver,page,visible,'speed popover opens again','pvc-tb-pop-speed');
  const low=await driver.evaluate(page,()=>{const r=document.querySelector('#pvc-toolbar .pvc-tb-bar').getBoundingClientRect();return{top:r.top};});
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-pop-speed')).bottom<low.top,'opens above in the lower half');
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-strip')).bottom<=low.top,'the strip moves above too');
  await driver.press(page,'Escape');
  await driver.evaluate(page,()=>{const p=document.getElementById('pvc-controller-popup');p.style.setProperty('top','16px','important');window.dispatchEvent(new Event('resize'));});

  // Groups: a single click does nothing, a double-click opens the list, the wheel switches without it, Enter opens it.
  await driver.pointerClick(page,'#pvc-tb-mode');
  await delay(300);
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-pop-groups'),false,'a single click opens nothing');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-mode-label').textContent),'Player','a single click does not switch the group');
  await driver.evaluate(page,dblclickMode);
  await until(driver,page,visible,'a double-click opens the group list','pvc-tb-pop-groups');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-mode-label').textContent),'Player','a double-click does not switch the group');
  const list=await driver.evaluate(page,()=>[...document.querySelectorAll('#pvc-tb-pop-groups button')].map(b=>({text:b.textContent.trim(),on:b.getAttribute('aria-current')})));
  assert.deepEqual(list.map(item=>item.text),['Player','Subtitles','Settings','Accessibility']);
  assert.equal(list.find(item=>item.on==='true').text,'Player');
  await driver.pointerClick(page,'[data-pvc-goto="subtitles"]');
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Subtitles'&&!document.getElementById('pvc-tb-pop-groups').getClientRects().length,'the list picks a group and closes');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-speed'),false,'player buttons hidden in another group');
  await driver.evaluate(page,()=>document.getElementById('pvc-tb-mode').focus());
  await driver.press(page,'Enter');
  await until(driver,page,visible,'Enter opens the list from the keyboard','pvc-tb-pop-groups');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-mode-label').textContent),'Subtitles','Enter does not switch the group either');
  await driver.pointerClick(page,'[data-pvc-goto="player"]');
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Player','list picks a group');
  await driver.evaluate(page,wheel,'pvc-tb-mode',-100);
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Accessibility','wheel up goes back past the first group');
  await driver.evaluate(page,wheel,'pvc-tb-mode',100);
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Player','wheel down returns');

  // Subtitles group: load, show/hide, timing step and offset, appearance; the classic tab shows the same state.
  await driver.evaluate(page,wheel,'pvc-tb-mode',100);
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Subtitles','wheel down goes to the next group');
  await until(driver,page,visible,'subtitle status strip','pvc-tb-sub-strip');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-strip'),false,'the playing strip belongs to the Player group');
  assert.match(await driver.evaluate(page,()=>document.getElementById('pvc-tb-sub-status').textContent),/No subtitles loaded/);
  assert.match(await driver.evaluate(page,()=>document.getElementById('pvc-tb-sub-load').getAttribute('data-pvc-tip')),/\.srt and \.vtt/,'file types on hover');
  await driver.evaluate(page,loadSubtitles);
  await until(driver,page,()=>/2 subtitle cues|2 satır/.test(document.getElementById('pvc-tb-sub-status').textContent),'loaded file shown in the strip');
  await driver.pointerClick(page,'#pvc-tb-sub-step');
  await until(driver,page,visible,'timing popover','pvc-tb-pop-subtiming');
  await driver.pointerClick(page,'[data-pvc-substep="250"]');
  await until(driver,page,()=>document.getElementById('pvc-tb-sub-step-val').textContent==='250ms','step 250ms');
  await driver.press(page,'Escape');
  await driver.pointerClick(page,'#pvc-tb-sub-later');
  await until(driver,page,()=>document.getElementById('pvc-sub-offset-badge').textContent==='+250ms','later shifts by the step');
  await until(driver,page,()=>{const shown=id=>document.getElementById(id).getClientRects().length>0;
    return shown('pvc-tb-sub-offset')&&shown('pvc-tb-sub-dot')&&/\+250 ms/.test(document.getElementById('pvc-tb-sub-offset-val').textContent);},'offset shown in the strip with a marker');
  await driver.pointerClick(page,'#pvc-tb-sub-offset-reset');
  await until(driver,page,()=>{const shown=id=>document.getElementById(id).getClientRects().length>0;
    return document.getElementById('pvc-sub-offset-badge').textContent==='0ms'&&!shown('pvc-tb-sub-offset')&&!shown('pvc-tb-sub-dot');},'reset from the strip');
  // Drift: in sync at 0:30, 3 s off at 13:00 (the reported case). The page fakes the video clock, which the
  // engine reads from the element like a real seek; the canvas stream itself cannot seek.
  await driver.evaluate(page,()=>{const video=document.querySelector('video'),real=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'currentTime');
    Object.defineProperty(video,'currentTime',{configurable:true,get(){return window.fakeTime??real.get.call(this);},set(value){real.set.call(this,value);}});window.fakeTime=30;});
  await driver.pointerClick(page,'#pvc-tb-sub-step');
  await until(driver,page,visible,'timing popover with the drift card','pvc-tb-sub-drift-mark');
  assert.match(await driver.evaluate(page,()=>document.getElementById('pvc-tb-sub-drift-text').textContent),/save point 1 while they match/,'the card explains the two points');
  await driver.pointerClick(page,'#pvc-tb-sub-drift-mark');
  await until(driver,page,()=>/Point 1 saved at 0:30/.test(document.getElementById('pvc-tb-sub-drift-text').textContent)
    &&document.getElementById('pvc-tb-sub-drift-mark-val').textContent==='Save point 2'&&document.getElementById('pvc-tb-sub-drift-cancel').getClientRects().length>0,'point 1 is waiting for point 2');
  await driver.pointerClick(page,'[data-pvc-substep="1000"]');
  await driver.press(page,'Escape');
  await driver.evaluate(page,()=>{window.fakeTime=780;});
  for(const expected of ['+1000ms','+2000ms','+3000ms']){await driver.pointerClick(page,'#pvc-tb-sub-later');await until(driver,page,text=>document.getElementById('pvc-sub-offset-badge').textContent===text,`later to ${expected}`,expected);}
  await driver.pointerClick(page,'#pvc-tb-sub-step');
  await until(driver,page,visible,'timing popover again','pvc-tb-sub-drift-mark');
  await driver.pointerClick(page,'#pvc-tb-sub-drift-mark');
  await until(driver,page,()=>/Correction on: \+2\.4 s every 10 minutes/.test(document.getElementById('pvc-tb-sub-drift-text').textContent)
    &&document.getElementById('pvc-tb-sub-drift-cancel-val').textContent==='Remove correction','4 ms a second is 2.4 s every 10 minutes');
  await driver.press(page,'Escape');
  await until(driver,page,()=>/\+3000 ms · drift corrected/.test(document.getElementById('pvc-tb-sub-offset-val').textContent),'the strip says the drift is corrected');
  // The browser's own track follows the line: the 1 s cue now starts at (1 - 0.12) / 0.996 s of video.
  assert.ok(Math.abs(await driver.evaluate(page,()=>document.querySelector('video').textTracks[0].cues[0].startTime)-0.88/0.996)<0.001,'native cue times use the drift line');
  await driver.evaluate(page,()=>{window.fakeTime=2;document.querySelector('video').dispatchEvent(new Event('timeupdate'));});
  await until(driver,page,()=>document.getElementById('pvc-subtitle-overlay')?.textContent==='First'&&getComputedStyle(document.getElementById('pvc-subtitle-overlay')).display==='block','the overlay uses the same line');
  // The report carries the shift and the drift, not where the video is.
  await driver.evaluate(page,()=>document.getElementById('pvc-report-err-btn').click());
  await until(driver,page,()=>!!document.getElementById('pvc-modal-code-block'),'report preview');
  const drifted=await driver.evaluate(page,()=>JSON.parse(document.getElementById('pvc-modal-code-block').textContent));
  assert.equal(drifted.videoState.subtitleOffsetMs,3000);assert.equal(drifted.videoState.subtitleDriftMsPerMinute,240);
  assert.ok(drifted.recentEvents.some(item=>item.event==='SUBTITLE_DRIFT_SET'&&item.details.driftMsPerMinute===240),'drift event');
  const shifts=drifted.recentEvents.filter(item=>item.event==='SUBTITLE_OFFSET_CHANGED').map(item=>item.details.offsetMs);
  assert.equal(shifts.at(-1),3000,'the last shift is in the report');assert.ok(!shifts.includes(1000)&&!shifts.includes(2000),'three quick presses are one event');
  await driver.press(page,'Escape');
  await until(driver,page,()=>!document.getElementById('pvc-modal-code-block'),'report closed');
  // Removing the correction keeps the line where it is now; reset clears everything.
  await driver.evaluate(page,()=>{window.fakeTime=1530;});
  await driver.evaluate(page,()=>document.getElementById('pvc-tb-sub-drift-cancel').click());
  await until(driver,page,()=>document.getElementById('pvc-sub-offset-badge').textContent==='+6000ms'&&/save point 1 while they match/.test(document.getElementById('pvc-tb-sub-drift-text').textContent),'removal keeps the current shift');
  await driver.pointerClick(page,'#pvc-tb-sub-offset-reset');
  await until(driver,page,()=>document.getElementById('pvc-sub-offset-badge').textContent==='0ms'&&document.getElementById('pvc-tb-sub-offset').getClientRects().length===0,'reset after the drift');
  // Large shifts: a typed value (real keys, which must not reach FilmDeck's or the site's shortcuts) and "now this line".
  const ratesBefore=await driver.evaluate(page,()=>window.rates.length);
  // A site listening on the page in the bubble phase must not see what is typed into the panel (N-035 F2).
  await driver.evaluate(page,()=>{window.siteKeys=[];for(const type of ['keydown','keypress','keyup'])document.body.addEventListener(type,event=>window.siteKeys.push(type+':'+event.key));});
  await driver.pointerClick(page,'#pvc-tb-sub-step');
  await until(driver,page,visible,'timing popover for a typed shift','pvc-tb-sub-offset-input');
  await driver.pointerClick(page,'#pvc-tb-sub-offset-input');
  await driver.type(page,'-41:35');await driver.press(page,'Enter');
  await until(driver,page,()=>document.getElementById('pvc-sub-offset-badge').textContent==='-41:35.0'&&document.getElementById('pvc-tb-sub-offset-big').textContent==='-41:35.0','typed -41:35 applies as a clock value');
  assert.equal(await driver.evaluate(page,()=>window.rates.length),ratesBefore,'typing "-" in the field is not the speed shortcut');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-pop-subtiming'),true,'Enter keeps the popover open');
  await driver.pointerClick(page,'#pvc-tb-sub-offset-input');await driver.type(page,'abc');
  await driver.pointerClick(page,'#pvc-tb-sub-offset-apply');
  await until(driver,page,()=>document.getElementById('pvc-tb-sub-offset-input').getAttribute('aria-invalid')==='true'&&document.getElementById('pvc-sub-offset-badge').textContent==='-41:35.0','a wrong value is marked and changes nothing');
  await driver.evaluate(page,()=>{document.getElementById('pvc-tb-sub-offset-input').value='';});
  await driver.evaluate(page,()=>{window.fakeTime=100;});
  await driver.pointerClick(page,'#pvc-tb-sub-line-search');await driver.type(page,'seco');
  await until(driver,page,()=>{const lines=[...document.querySelectorAll('#pvc-tb-sub-lines [data-pvc-cue-start]')];return lines.length===1&&lines[0].textContent==='0:04Second';},'the search finds the line');
  assert.deepEqual(await driver.evaluate(page,()=>window.siteKeys),[],'no keydown, keypress or keyup from the panel fields reaches the page');
  await driver.pointerClick(page,'#pvc-tb-sub-lines [data-pvc-cue-start]');
  await until(driver,page,()=>document.getElementById('pvc-sub-offset-badge').textContent==='+1:36.0','the chosen line starts now: 100 s - 4 s');
  await driver.evaluate(page,()=>{window.fakeTime=101;document.querySelector('video').dispatchEvent(new Event('timeupdate'));});
  await until(driver,page,()=>document.getElementById('pvc-subtitle-overlay')?.textContent==='Second','the overlay continues from that line');
  await until(driver,page,()=>document.querySelectorAll('#pvc-tb-sub-lines [data-pvc-cue-start]').length===2&&document.getElementById('pvc-tb-sub-line-search').value==='','after a choice the list shows the lines around now again');
  await driver.press(page,'Escape');
  // The Easy-read panel has the same two controls.
  await driver.evaluate(page,()=>{document.getElementById('pvc-sub-jump').open=true;const input=document.getElementById('pvc-sub-offset-input');input.value='+2.5';input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});
  await until(driver,page,()=>document.getElementById('pvc-sub-offset-badge').textContent==='+2500ms'&&document.querySelectorAll('#pvc-sub-lines [data-pvc-cue-start]').length===2,'classic typed shift and line list');
  await driver.pointerClick(page,'#pvc-tb-sub-offset-reset');
  await until(driver,page,()=>document.getElementById('pvc-sub-offset-badge').textContent==='0ms','reset after the large shifts');
  await driver.evaluate(page,()=>{delete document.querySelector('video').currentTime;window.fakeTime=undefined;document.querySelector('[data-pvc-substep="250"]').click();});
  assert.match(await driver.evaluate(page,()=>document.getElementById('pvc-tb-sub-count').textContent),/\(2 /,'the cue count stays visible beside a long name');
  assert.match(await driver.evaluate(page,()=>document.getElementById('pvc-tb-sub-status').getAttribute('data-pvc-tip')),/sample\.srt.*2/,'the whole line is in the tooltip');
  const eyes=()=>[document.getElementById('pvc-tb-sub-eye'),document.getElementById('pvc-tb-sub-eye-off')].map(node=>node.getClientRects().length>0&&!!node.querySelector('svg'));
  assert.deepEqual(await driver.evaluate(page,eyes),[true,false],'open eye while shown');
  await driver.pointerClick(page,'#pvc-tb-sub-toggle');
  await until(driver,page,()=>!document.getElementById('pvc-sub-toggle-btn').classList.contains('pvc-active')&&document.getElementById('pvc-tb-sub-toggle-val').textContent==='Hidden','hide reaches the shared state');
  assert.deepEqual(await driver.evaluate(page,eyes),[false,true],'crossed-out eye while hidden');
  await driver.pointerClick(page,'#pvc-tb-sub-toggle');
  await until(driver,page,()=>document.getElementById('pvc-tb-sub-toggle').getAttribute('aria-pressed')==='true','shown again');
  await driver.pointerClick(page,'#pvc-tb-sub-look');
  await until(driver,page,visible,'appearance popover','pvc-tb-pop-sublook');
  assert.ok((await driver.evaluate(page,()=>document.getElementById('pvc-tb-sub-fontSize').getBoundingClientRect().height))<=16,'appearance sliders keep the classic thin track');
  await driver.pointerClick(page,'#pvc-tb-sub-yellow');
  await until(driver,page,()=>document.getElementById('pvc-sub-color').value==='yellow','yellow reaches the classic control');
  await driver.evaluate(page,()=>{const input=document.getElementById('pvc-tb-sub-fontSize');input.value='30';input.dispatchEvent(new Event('input',{bubbles:true}));});
  await until(driver,page,()=>document.getElementById('pvc-sub-fontSize-value').textContent==='30px'&&document.getElementById('pvc-tb-sub-fontSize-value').textContent==='30px','font size reaches the classic control');
  await driver.pointerClick(page,'#pvc-tb-sub-look-reset');
  await until(driver,page,()=>document.getElementById('pvc-sub-color').value==='white'&&document.getElementById('pvc-tb-sub-fontSize-value').textContent==='20px','appearance reset');
  await driver.press(page,'Escape');

  // Settings group: Help stays open at the bar's end; language, picture & night and theme share the classic state.
  const shownNow=id=>document.getElementById(id).getClientRects().length>0;
  await driver.evaluate(page,()=>document.querySelector('[data-pvc-goto="settings"]').click());
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Settings','settings group');
  await until(driver,page,visible,'help is open in Settings','pvc-tb-pop-help');
  const barEnd=await driver.evaluate(page,()=>document.querySelector('#pvc-toolbar .pvc-tb-bar').getBoundingClientRect().right);
  assert.ok(Math.abs((await driver.evaluate(page,rect,'pvc-tb-pop-help')).right-barEnd)<=1,'help lines up with the end of the bar');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-help-cdn-sub').textContent),'Media server response time');
  await driver.pointerClick(page,'#pvc-tb-picture');
  await until(driver,page,visible,'picture popover','pvc-tb-pop-picture');
  assert.ok(await driver.evaluate(page,visible,'pvc-tb-pop-help'),'help stays open beside another popover');
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-pop-picture')).right<=(await driver.evaluate(page,rect,'pvc-tb-pop-help')).left+0.5,'the popover sits beside help, not over it');
  await driver.evaluate(page,wheel,'pvc-tb-filter-brightness',-100);
  await until(driver,page,()=>document.getElementById('pvc-val-brightness').textContent.includes('105')&&document.getElementById('pvc-tb-filter-brightness-value').textContent==='105%','the wheel steps a slider and reaches the classic control');
  await until(driver,page,shownNow,'an adjusted picture is marked on its button','pvc-tb-picture-dot');
  await driver.pointerClick(page,'#pvc-tb-night');
  await until(driver,page,()=>document.getElementById('pvc-btn-night-shield').classList.contains('pvc-active')&&document.getElementById('pvc-tb-night').getAttribute('aria-checked')==='true','night mode is shared');
  await until(driver,page,()=>/sepia/.test(document.querySelector('video').style.filter),'night mode reaches the video');
  await driver.pointerClick(page,'#pvc-tb-filter-reset');
  await until(driver,page,()=>!document.getElementById('pvc-btn-night-shield').classList.contains('pvc-active')&&document.getElementById('pvc-tb-filter-brightness-value').textContent==='100%'&&!document.getElementById('pvc-tb-picture-dot').getClientRects().length,'reset all');
  await driver.pointerClick(page,'#pvc-tb-lang');
  await until(driver,page,visible,'language popover','pvc-tb-pop-language');
  assert.equal(await driver.evaluate(page,visible,'pvc-tb-pop-picture'),false,'one popover at a time');
  await driver.pointerClick(page,'[data-pvc-lang="tr"]');
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Ayarlar'&&document.getElementById('pvc-language-select').value==='tr'&&document.getElementById('pvc-tb-lang-val').textContent==='Türkçe','language switches the whole panel');
  await driver.pointerClick(page,'[data-pvc-lang="en"]');
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Settings','and back');
  await driver.press(page,'Escape');
  await until(driver,page,()=>!document.getElementById('pvc-tb-pop-language').getClientRects().length,'Escape closes the popover');
  assert.ok(await driver.evaluate(page,visible,'pvc-tb-pop-help'),'Escape leaves help open');
  const themeBefore=await driver.evaluate(page,()=>document.getElementById('pvc-theme-select').value);
  await driver.pointerClick(page,'#pvc-tb-theme');
  await until(driver,page,visible,'theme popover','pvc-tb-pop-theme');
  await driver.pointerClick(page,'#pvc-tb-theme-next');
  await until(driver,page,previous=>document.getElementById('pvc-theme-select').value!==previous&&document.getElementById('pvc-tb-theme-val').textContent===document.getElementById('pvc-theme-name').textContent,'next theme is shared',themeBefore);
  await driver.evaluate(page,wheel,'pvc-tb-theme',-100);
  await until(driver,page,previous=>document.getElementById('pvc-theme-select').value===previous,'wheel up goes back a theme',themeBefore);
  // Our own theme list replaces the native select: it opens, marks the current theme and picks another.
  await driver.pointerClick(page,'#pvc-tb-theme-list-btn');
  await until(driver,page,visible,'theme list opens','pvc-tb-theme-list');
  assert.equal(await driver.evaluate(page,()=>document.querySelector('#pvc-tb-theme-list .pvc-tb-on').getAttribute('data-pvc-value')),themeBefore,'the current theme is marked');
  await driver.pointerClick(page,'#pvc-tb-theme-list [data-pvc-value="pine"]');
  await until(driver,page,()=>document.getElementById('pvc-theme-select').value==='pine'&&!document.getElementById('pvc-tb-theme-list').getClientRects().length,'a theme picked from the list is shared and the list closes');
  await driver.evaluate(page,previous=>{const s=document.getElementById('pvc-theme-select');s.value=previous;s.dispatchEvent(new Event('change',{bubbles:true}));},themeBefore);
  await driver.press(page,'Escape');
  await driver.evaluate(page,dblclickMode);
  await until(driver,page,()=>document.getElementById('pvc-tb-pop-groups').getClientRects().length>0&&!document.getElementById('pvc-tb-pop-help').getClientRects().length,'the group list takes help\'s place for a moment');
  await driver.pointerClick(page,'[data-pvc-goto="settings"]');
  await until(driver,page,shownNow,'help returns after the list','pvc-tb-pop-help');
  await driver.pointerClick(page,'#pvc-tb-help-keys');
  await until(driver,page,()=>{const modal=document.getElementById('pvc-permissions-modal');return !!modal&&modal.getClientRects().length>0;},'help opens the shortcuts guide');
  await driver.press(page,'Escape');
  await until(driver,page,()=>{const modal=document.getElementById('pvc-permissions-modal');return !modal||!modal.getClientRects().length;},'guide closes');

  // Accessibility group: one-click switches share the classic checkboxes; Easy-read is the classic panel.
  await driver.evaluate(page,()=>document.querySelector('[data-pvc-goto="accessibility"]').click());
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Accessibility'&&!document.getElementById('pvc-tb-pop-help').getClientRects().length,'accessibility group, help closes');
  await until(driver,page,visible,'the note strip','pvc-tb-a11y-strip');
  assert.equal(await driver.evaluate(page,()=>document.getElementById('pvc-tb-a11y-keepVisible').getAttribute('aria-checked')),'true','keep visible mirrors the classic switch');
  await driver.pointerClick(page,'#pvc-tb-a11y-highContrast');
  await until(driver,page,()=>document.getElementById('pvc-a11y-highContrast').checked&&document.getElementById('pvc-controller-popup').classList.contains('pvc-a11y-contrast')&&document.getElementById('pvc-tb-a11y-highContrast').getAttribute('aria-checked')==='true','high contrast on');
  await driver.pointerClick(page,'#pvc-tb-a11y-highContrast');
  await until(driver,page,()=>!document.getElementById('pvc-a11y-highContrast').checked&&document.getElementById('pvc-tb-a11y-highContrast').getAttribute('aria-checked')==='false','high contrast off');
  const motion=await driver.evaluate(page,()=>document.getElementById('pvc-a11y-reduceMotion').checked);
  await driver.pointerClick(page,'#pvc-tb-a11y-reduceMotion');
  await until(driver,page,previous=>document.getElementById('pvc-a11y-reduceMotion').checked!==previous&&document.getElementById('pvc-controller-popup').classList.contains('pvc-a11y-reduce-motion')!==previous,'reduce motion flips',motion);
  await driver.pointerClick(page,'#pvc-tb-a11y-reduceMotion');
  await until(driver,page,previous=>document.getElementById('pvc-a11y-reduceMotion').checked===previous,'and back',motion);
  await driver.pointerClick(page,'#pvc-tb-a11y-easyRead');
  await until(driver,page,()=>{const p=document.getElementById('pvc-controller-popup');return !p.classList.contains('pvc-layout-toolbar')&&document.getElementById('pvc-layout-easyread-toggle').checked&&document.getElementById('pvc-accessibility').open;},'easy-read shows the classic panel with the way back open');
  // Stepwise enlargement lives in Easy-read: 125% widens the panel and zooms its contents; the toolbar ignores it.
  const panelWidth=()=>Math.round(document.getElementById('pvc-controller-popup').getBoundingClientRect().width);
  const baseWidth=await driver.evaluate(page,panelWidth);
  await driver.evaluate(page,()=>document.querySelector('[data-pvc-scale="125"]').click());
  await until(driver,page,base=>{const p=document.getElementById('pvc-controller-popup');return p.classList.contains('pvc-a11y-scale-125')&&p.getBoundingClientRect().width>base*1.2;},'125% enlarges the Easy-read panel',baseWidth);
  assert.equal(await driver.evaluate(page,()=>document.querySelector('[data-pvc-scale="125"]').getAttribute('aria-checked')),'true');
  assert.equal(await driver.evaluate(page,()=>{const r=document.getElementById('pvc-controller-popup').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),true,'the enlarged panel stays inside the window');
  await driver.evaluate(page,()=>document.getElementById('pvc-layout-easyread-toggle').click());
  await until(driver,page,()=>document.getElementById('pvc-controller-popup').classList.contains('pvc-layout-toolbar')&&document.getElementById('pvc-tb-a11y-easyRead').getAttribute('aria-checked')==='false','back to the toolbar');
  assert.equal(await driver.evaluate(page,()=>{const p=document.getElementById('pvc-controller-popup');return getComputedStyle(p.querySelector('#pvc-toolbar')).zoom;}),'1','the toolbar keeps its own size');
  await driver.evaluate(page,()=>document.querySelector('[data-pvc-scale="100"]').click());
  await driver.evaluate(page,()=>document.querySelector('[data-pvc-goto="player"]').click());
  await until(driver,page,()=>document.getElementById('pvc-tb-mode-label').textContent==='Player'&&!document.getElementById('pvc-tb-a11y-strip').getClientRects().length,'back to Player');

  // Theme palette: the bar's border follows the theme's border colour.
  const borderOf=()=>getComputedStyle(document.querySelector('#pvc-toolbar .pvc-tb-bar')).borderTopColor;
  const before=await driver.evaluate(page,borderOf);
  await driver.evaluate(page,()=>{const select=document.getElementById('pvc-theme-select');select.value='daylight';select.dispatchEvent(new Event('change',{bubbles:true}));});
  await until(driver,page,(previous)=>getComputedStyle(document.querySelector('#pvc-toolbar .pvc-tb-bar')).borderTopColor!==previous,'theme reaches the toolbar',before);

  // Holding the name to drag keeps the bubble closed even if the pointer leaves and re-enters the name.
  assert.equal(await driver.evaluate(page,()=>{const brand=document.getElementById('pvc-tb-brand'),bubble=document.getElementById('pvc-tb-bubble');
    const r=brand.getBoundingClientRect(),at={clientX:r.left+10,clientY:r.top+10,button:0,buttons:1,bubbles:true};
    brand.dispatchEvent(new MouseEvent('mousedown',at));brand.dispatchEvent(new MouseEvent('mouseleave',at));brand.dispatchEvent(new MouseEvent('mouseenter',at));brand.dispatchEvent(new FocusEvent('focus'));
    const shownWhileHeld=!bubble.hidden;window.dispatchEvent(new MouseEvent('mouseup',{...at,buttons:0}));return shownWhileHeld;}),false,'no bubble while the name is held');
  // Close bubble: shown beside the name on hover, to its left, and it closes FilmDeck.
  // The bar resizes when the group changes, so the name may have slid under a still pointer: start from the video.
  await driver.hover(page,'video');
  await driver.hover(page,'#pvc-tb-brand');
  await until(driver,page,visible,'bubble on hover','pvc-tb-bubble');
  assert.ok((await driver.evaluate(page,rect,'pvc-tb-bubble')).right<=(await driver.evaluate(page,()=>document.querySelector('#pvc-toolbar .pvc-tb-bar').getBoundingClientRect().left))+1,'bubble opens to the left');
  await driver.pointerClick(page,'#pvc-tb-close');
  await until(driver,page,()=>document.getElementById('pvc-controller-popup').style.display==='none','close button closes FilmDeck');

  // A page without any video: the red "waiting" strip replaces the group strip, with Scan again and the report.
  const empty=await driver.open(`http://127.0.0.1:${media.address().port}/empty`);
  await driver.toolbar(empty);
  await until(driver,empty,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel opens without a video');
  await driver.evaluate(empty,()=>{document.getElementById('pvc-a11y-keepVisible').click();});
  await until(driver,empty,()=>{const on=id=>document.getElementById(id).getClientRects().length>0;return on('pvc-tb-waiting-strip')&&!on('pvc-tb-strip')&&on('pvc-tb-rescan')&&on('pvc-tb-waiting-report');},'waiting strip with its actions');
  assert.match(await driver.evaluate(empty,()=>document.getElementById('pvc-tb-waiting-strip').textContent),/Waiting for a video/,'translations still found on a windows-1254 page');
  assert.equal(await driver.evaluate(empty,()=>document.getElementById('pvc-tb-speed-val').textContent),'1.0×','non-ASCII text intact on a windows-1254 page');
  assert.equal(await driver.evaluate(empty,()=>document.characterSet.toLowerCase()),'windows-1254','the page really uses the legacy encoding');
  await driver.evaluate(empty,()=>document.querySelector('[data-pvc-goto="settings"]').click());
  assert.equal(await driver.evaluate(empty,()=>document.getElementById('pvc-tb-waiting-strip').getClientRects().length>0),true,'the alert stays in every group');

  // Cross-origin player frame: the top toolbar drives the frame's video.
  const top=await driver.open(`http://127.0.0.1:${parent.address().port}/`);
  let owner=null;
  for(let i=0;i<100&&!owner;i++){await delay(100);for(const frame of await driver.frames(top))if(await driver.evaluate(frame.target,()=>document.querySelector('video')?.readyState>=2).catch(()=>false))owner=frame.target;}
  assert.ok(owner,'frame video plays');
  await driver.toolbar(top);
  await until(driver,top,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','top panel opens');
  await driver.evaluate(top,()=>{document.getElementById('pvc-a11y-keepVisible').click();});
  await until(driver,top,()=>document.getElementById('pvc-controller-popup').classList.contains('pvc-layout-toolbar'),'top toolbar layout');
  // The frame's state can still re-place the panel just after the switch; click once the bar has settled.
  await driver.evaluate(top,async()=>{let last='';for(let i=0;i<20;i++){const r=JSON.stringify(document.getElementById('pvc-tb-speed').getBoundingClientRect());if(r===last)return;last=r;await new Promise(f=>setTimeout(f,150));}});
  await driver.pointerClick(top,'#pvc-tb-speed');
  await until(driver,top,visible,'top speed popover','pvc-tb-pop-speed');
  await driver.pointerClick(top,'[data-pvc-speed="2.0"]');
  await until(driver,owner,lastRate,'speed reaches the frame video',2);
  await until(driver,top,()=>document.getElementById('pvc-tb-speed-val').textContent==='2.0×','top chip shows the frame state');
  // A 250 ms subtitle step crosses the frame bridge and comes back as the frame's own offset.
  await driver.evaluate(top,()=>document.querySelector('[data-pvc-goto="subtitles"]').click());
  await driver.evaluate(top,loadSubtitles);
  await until(driver,top,()=>/2|loaded|yüklü/i.test(document.getElementById('pvc-tb-sub-status').textContent)&&!document.getElementById('pvc-tb-sub-strip').classList.contains('pvc-tb-strip-muted'),'frame reports the loaded file');
  await driver.evaluate(top,()=>document.querySelector('[data-pvc-substep="250"]').click());
  await driver.pointerClick(top,'#pvc-tb-sub-earlier');
  await until(driver,top,()=>document.getElementById('pvc-sub-offset-badge').textContent==='-250ms'&&/-250 ms/.test(document.getElementById('pvc-tb-sub-offset-val').textContent),'frame offset comes back');
  // Drift through the bridge: the frame keeps the points and the line; the top panel only shows them.
  await driver.evaluate(owner,()=>{const video=document.querySelector('video');Object.defineProperty(video,'currentTime',{configurable:true,get(){return window.fakeTime;}});window.fakeTime=100;});
  await driver.evaluate(top,()=>document.getElementById('pvc-tb-sub-drift-mark').click());
  await until(driver,top,()=>/Point 1 saved at 1:40/.test(document.getElementById('pvc-sub-drift-status').textContent),'the frame reports point 1');
  await driver.evaluate(owner,()=>{window.fakeTime=700;});
  for(const expected of ['-500ms','-750ms','-1000ms','-1250ms']){await driver.pointerClick(top,'#pvc-tb-sub-earlier');await until(driver,top,text=>document.getElementById('pvc-sub-offset-badge').textContent===text,`frame earlier to ${expected}`,expected);}
  await driver.evaluate(top,()=>document.getElementById('pvc-tb-sub-drift-mark').click());
  await until(driver,top,()=>/Correction on: -1\.0 s every 10 minutes/.test(document.getElementById('pvc-sub-drift-status').textContent)
    &&/drift corrected/.test(document.getElementById('pvc-tb-sub-offset-val').textContent),'the frame computes the line and the top shows it');
  assert.ok(Math.abs(await driver.evaluate(owner,()=>document.querySelector('video').textTracks[0].cues[0].startTime)-(1+(-1250+1000*700/600)/1000)/(1+1/600))<0.001,'the frame video track follows the line');
  await driver.evaluate(top,()=>document.getElementById('pvc-tb-sub-drift-cancel').click());
  await until(driver,top,()=>/save point 1 while they match/.test(document.getElementById('pvc-sub-drift-status').textContent),'removal crosses the bridge');
  // A typed shift and a chosen line cross the bridge; the frame computes the line from its own video time.
  await driver.evaluate(top,()=>{const input=document.getElementById('pvc-tb-sub-offset-input');input.value='-41:35';document.getElementById('pvc-tb-sub-offset-apply').click();});
  await until(driver,top,()=>document.getElementById('pvc-sub-offset-badge').textContent==='-41:35.0','the frame applies a typed shift');
  await driver.evaluate(owner,()=>{window.fakeTime=300;});
  await driver.evaluate(top,()=>{const search=document.getElementById('pvc-tb-sub-line-search');search.value='first';search.dispatchEvent(new Event('input',{bubbles:true}));});
  await until(driver,top,()=>document.querySelectorAll('#pvc-tb-sub-lines [data-pvc-cue-start]').length===1,'the top panel lists the file it sent');
  await driver.evaluate(top,()=>document.querySelector('#pvc-tb-sub-lines [data-pvc-cue-start]').click());
  await until(driver,top,()=>document.getElementById('pvc-sub-offset-badge').textContent==='+4:59.0','the frame aligns the line to its video time: 300 s - 1 s');
  // Night mode from the top toolbar filters the frame's video.
  await driver.evaluate(top,()=>document.querySelector('[data-pvc-goto="settings"]').click());
  await driver.pointerClick(top,'#pvc-tb-picture');
  await until(driver,top,visible,'top picture popover','pvc-tb-pop-picture');
  await driver.pointerClick(top,'#pvc-tb-night');
  await until(driver,owner,()=>/sepia/.test(document.querySelector('video').style.filter),'night mode reaches the frame video');
  console.log(JSON.stringify({engine,version:driver.version,result:'pass'}));
}finally{await driver?.close();media.close();parent.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
