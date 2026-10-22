// Operator-driven real-site acceptance in a disposable browser profile.
// Only stdout / ignored artifacts; never loads a user's profile or sends an issue.
const readline=require('node:readline');
const fs=require('node:fs'),path=require('node:path');
const {createDriver,delay}=require('./resource-driver.cjs');
const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
let driver,page;
function snapshot(){
  const visible=node=>{const box=node.getBoundingClientRect();return box.width>0&&box.height>0;};
  return {domain:location.hostname,text:document.body?.innerText.slice(0,1300),
    engine:!!window.__NOK_VIDEO_CONTROLLER_INJECTED__,hud:document.querySelector('#pvc-controller-popup')?.style.display,
    media:[...document.querySelectorAll('video')].map(v=>({readyState:v.readyState,paused:v.paused,muted:v.muted,volume:v.volume,rate:v.playbackRate,
      dimensions:[v.videoWidth,v.videoHeight],finiteDuration:Number.isFinite(v.duration),visible:visible(v)})),
    controls:[...document.querySelectorAll('button,[role="button"],[role="slider"],input[type="range"]')].filter(visible).slice(0,100).map(n=>({tag:n.tagName,id:n.id,
      role:n.getAttribute('role'),class:n.className,testid:n.getAttribute('data-testid'),label:n.getAttribute('aria-label'),text:n.textContent.trim().slice(0,100),title:n.title,
      value:n.value??n.getAttribute('aria-valuenow'),min:n.min||n.getAttribute('aria-valuemin'),max:n.max||n.getAttribute('aria-valuemax')})),
    links:[...document.querySelectorAll('a[href]')].filter(visible).filter(n=>/-izle|videos\//.test(n.href)).slice(0,8).map(n=>({text:n.textContent.trim().slice(0,40),href:n.href})),
    frames:[...document.querySelectorAll('iframe')].map(n=>{let domain;try{domain=new URL(n.src).hostname;}catch(_){}return {domain,visible:visible(n)};})};
}
(async()=>{
 try{
  driver=await createDriver(arg('engine')||'firefox',arg('browser'),arg('packages'),{allowWeb:true});
  await driver.install();process.stdout.write(JSON.stringify({ready:true,browserVersion:driver.version})+'\n');
  for await(const line of readline.createInterface({input:process.stdin,crlfDelay:Infinity})){
    if(!line.trim())continue;
    try{
      const command=JSON.parse(line);let result;
      if(command.action==='quit')break;
      if(command.action==='open'){
        const target=new URL(command.url);if(target.protocol!=='https:')throw Error('HTTPS pages only');
        if(page)await driver.navigate(page,target.href);else page=await driver.open(target.href);
        await delay(3000);result=await driver.evaluate(page,snapshot);
      }else if(command.action==='snapshot')result=await driver.evaluate(page,snapshot);
      else if(command.action==='toolbar')result=await driver.evaluate(page,()=>{window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*');return true;});
      else if(command.action==='hover')result=await driver.hover(page,command.selector);
      else if(command.action==='click')result=await driver.evaluate(page,selector=>{
        const node=document.querySelector(selector);if(!node)throw Error('Missing control');node.click();return true;
      },command.selector);
      else if(command.action==='input')result=await driver.evaluate(page,(selector,value)=>{
        const node=document.querySelector(selector);if(!node)throw Error('Missing control');node.value=String(value);node.dispatchEvent(new Event('input',{bubbles:true}));return true;
      },command.selector,command.value);
      else if(command.action==='play')result=await driver.evaluate(page,async()=>{const video=document.querySelector('video');if(!video)return false;await video.play();return true;});
      else if(command.action==='inspect'){
        const file=require.resolve('./live-player-inspect.cjs');delete require.cache[file];
        result=await driver.evaluate(page,require(file),command.selector||'video');
      }
      else throw Error('Unknown operator action');
      const dir=path.join(__dirname,'artifacts','live-console');fs.mkdirSync(dir,{recursive:true});
      fs.appendFileSync(path.join(dir,'session.jsonl'),JSON.stringify({action:command.action,result})+'\n');
      process.stdout.write(JSON.stringify({action:command.action,result})+'\n');
    }catch(error){process.stdout.write(JSON.stringify({error:error.message})+'\n');}
  }
 }finally{await driver?.close();process.stdin.pause();process.stdin.unref?.();}
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
