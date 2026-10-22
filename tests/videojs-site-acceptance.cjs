// Real native-menu evidence. A decoded mismatch is recorded as incomplete acceptance, never success.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const engine=arg('engine'),browser=arg('browser'),packages=arg('packages'),label=arg('label')||'reported-player';
const target=new URL(arg('url'));
if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||!/^[a-z0-9-]{1,40}$/.test(label))throw Error('HTTPS URL without query/credentials and safe label required');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'artifacts',`videojs-site-${engine}-${label}`);
const sourceSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'injected.js'))).digest('hex');
const extensionVersion=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).version;
let driver,page,mediaFrame;
function mediaState(){
 const video=[...document.querySelectorAll('.video-js video')].find(v=>v.readyState>=2);
 const players=Object.values(window.videojs?.players||{}),player=players.find(p=>p?.el?.()?.contains(video));
 const reps=player?.tech_?.vhs?.representations?.()||[],selected=player?.tech_?.vhs?.playlists?.media?.();
 const native=document.querySelector('.vjs-quality-button .item-quality.vjs-checked');
 const caption=native?[...native.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim():'';
 const match=caption.match(/^(\d{3,4})p$/),version=String(window.videojs?.VERSION||'');
 return {readyState:video?.readyState,paused:video?.paused,volume:video?.volume,rate:video?.playbackRate,
   dimensions:video?[video.videoWidth,video.videoHeight]:null,nativeSelectedHeight:match?Number(match[1]):null,
   renditionHeight:selected?.attributes?.RESOLUTION?.height||null,
   declaredHeights:reps.map(r=>r.height),resolvedSourceCount:reps.filter(r=>typeof r.playlist?.resolvedUri==='string').length,
   uniqueResolvedSourceCount:new Set(reps.map(r=>r.playlist?.resolvedUri).filter(Boolean)).size,
   libraryVersion:/^\d+\.\d+\.\d+$/.test(version)?version:null};
}
const click=selector=>driver.evaluate(page,selector=>{const n=document.querySelector(selector);if(!n)throw Error('Missing test control');n.click();},selector);
(async()=>{try{
 driver=await createDriver(engine,browser,packages,{allowWeb:true,visible:true});await driver.install();
 page=await driver.open(target.href);await delay(3000);
 await driver.evaluate(page,()=>document.querySelector('iframe')?.scrollIntoView({block:'center'}));
 const readyDeadline=Date.now()+20000;
 while(!mediaFrame&&Date.now()<readyDeadline){
   for(const frame of await driver.frames(page)){
     try{if(await driver.evaluate(frame.target,()=>[...document.querySelectorAll('.video-js video')].some(v=>v.readyState>=2
       && v.getBoundingClientRect().width>0))){
       mediaFrame=frame.target;break;
     }}catch(_){/* A transient ad frame may disappear during discovery. */}
   }
   if(!mediaFrame)await delay(300);
 }
 if(!mediaFrame){
   const states=[];
   for(const frame of await driver.frames(page))try{states.push(await driver.evaluate(frame.target,()=>({
     videos:[...document.querySelectorAll('video')].map(v=>({readyState:v.readyState,width:v.getBoundingClientRect().width,
       inVideoJs:!!v.closest('.video-js'),dimensions:[v.videoWidth,v.videoHeight]})),
     nativeItems:document.querySelectorAll('.vjs-quality-button .item-quality').length,
     securityCheckpoint:/captcha|verify you are human|checking your browser/i.test(document.body?.innerText||'')
   })));}catch(_){states.push({frameUnavailable:true});}
   fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'unavailable.json'),JSON.stringify({ready:false,states},null,2)+'\n');
   process.stdout.write(JSON.stringify({ready:false,states})+'\n');
 }
 assert.ok(mediaFrame,'A ready real Video.js frame must exist');
 const initial=await driver.evaluate(mediaFrame,mediaState);
 if(await driver.evaluate(mediaFrame,()=>{const b=document.querySelector('.vjs-big-play-button');return !!b&&b.getBoundingClientRect().width>0;}))
   await driver.pointerClick(mediaFrame,'.vjs-big-play-button');
 await driver.evaluate(mediaFrame,async()=>{const v=document.querySelector('.video-js video');await v.play();});
 await until(driver,mediaFrame,()=>document.querySelectorAll('.vjs-quality-button .item-quality').length>=2,'native quality controls mount after playback');
 await driver.evaluate(page,()=>window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*'));
 await until(driver,page,()=>document.querySelector('#pvc-controller-popup')?.style.display==='block','top HUD opens');
 await click('#pvc-tab-settings');await click('#pvc-a11y-keepVisible');await click('#pvc-tab-player');
 await click('#pvc-section-quality .pvc-section-header');
 const inventory=await driver.evaluate(page,()=>document.querySelector('#pvc-dynamic-quality-container').__nokQualities.map(q=>({height:q.height,api:q.qualityApi})));
 assert.ok(inventory.length>=2);assert.ok(inventory.every(q=>q.api==='native-menu'),'Owned native menu should own matching heights');
 const requests=[];
 for(const height of [1080,480]){
   assert.ok(inventory.some(q=>q.height===height));
   await driver.evaluate(page,height=>{const n=[...document.querySelectorAll('#pvc-dynamic-quality-container button')].find(n=>n.textContent===`${height}p`);if(!n)throw Error('Missing quality button');n.click();},height);
   const deadline=Date.now()+15000;let observed;
   do{await delay(250);observed=await driver.evaluate(mediaFrame,mediaState);}while(Date.now()<deadline&&!(observed.nativeSelectedHeight===height&&observed.dimensions?.[1]===height));
   const hud=await driver.evaluate(page,()=>({status:document.querySelector('#pvc-quality-status').textContent,
     selected:[...document.querySelectorAll('#pvc-dynamic-quality-container [aria-pressed="true"]')].map(n=>Number(n.textContent.match(/^\d+/)?.[0]))}));
   const decodedMatch=observed.dimensions?.[1]===height;
   assert.equal(observed.nativeSelectedHeight,height,'Site must actually select requested native option');
   assert.equal(observed.renditionHeight,height,'SDK rendition must agree');
   if(!decodedMatch)assert.equal(hud.selected.includes(height),false,'No false decoded-success highlight');
   requests.push({requestedHeight:height,observed,hud,decodedMatch});
   process.stdout.write(JSON.stringify({requestedHeight:height,nativeMatches:true,decodedMatch})+'\n');
 }
 await driver.evaluate(page,()=>{const speed=document.querySelector('#pvc-speed-slider');speed.value='1.5';speed.dispatchEvent(new Event('input',{bubbles:true}));
   const volume=document.querySelector('#pvc-volume-slider');volume.value='40';volume.dispatchEvent(new Event('input',{bubbles:true}));});
 await until(driver,mediaFrame,()=>{const v=document.querySelector('.video-js video');return v.playbackRate===1.5&&Math.abs(v.volume-.4)<.01;},'ready iframe receives actual controls');
 const controlled=await driver.evaluate(mediaFrame,mediaState);
 const result={engine,browserVersion:driver.version,extensionVersion,sourceSha256,actualInstalledExtension:true,visible:true,
   initial,inventory,requests,controlled,decodedAcceptance:requests.every(r=>r.decodedMatch),
   limitations:['Specific public player sample, not whole-site compatibility','Declared heights/native selection/decoded video are separate evidence','No source URLs, content titles or absolute playback position exported']};
 fs.mkdirSync(dir,{recursive:true});fs.rmSync(path.join(dir,'unavailable.json'),{force:true});
 fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(result,null,2)+'\n');
 process.stdout.write(JSON.stringify({evidenceCollected:true,decodedAcceptance:result.decodedAcceptance,actualIframeControls:true})+'\n');
 if(!result.decodedAcceptance)process.exitCode=2; // Evidence collected, but full image-change acceptance failed.
}finally{await driver?.close();}})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
