// I-03 / I-05: installed extension on the real Kick site. Disposable profile, no account, local run only.
// node tests/kick-site-acceptance.cjs --engine=firefox|chromium [--visible=true]
// Picks a public channel from the browse page and never prints channel names or addresses.
const assert=require('node:assert/strict'),path=require('node:path');
const {createDriver,until,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'chromium';
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const challenged=()=>/just a moment|verify you are human|checking your browser|captcha/i.test(document.title+' '+(document.body?.innerText||'').slice(0,500));
const playerState=()=>{
  const video=[...document.querySelectorAll('video')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
  if(!video)return null;
  const isPlayer=value=>{try{return value&&typeof value==='object'&&typeof value.getQualities==='function';}catch(_){return false;}};
  const unwrap=(value,depth=0)=>{
    if(!value||typeof value!=='object'||depth>3)return null;
    if(isPlayer(value))return value;
    for(const key of ['current','value','player']){let found=null;try{found=unwrap(value[key],depth+1);}catch(_){}if(found)return found;}
    return null;
  };
  const key=Object.keys(video).find(name=>name.startsWith('__reactFiber$'));let root=key?video[key]:null;while(root?.return)root=root.return;
  const stack=root?[root]:[];let player=null,visited=0;
  while(stack.length&&!player&&visited<20000){
    const node=stack.pop();visited++;let hook=node.memoizedState,depth=0;
    while(hook&&typeof hook==='object'&&depth<40&&!player){player=unwrap(hook.memoizedState);hook=hook.next;depth++;}
    if(node.sibling)stack.push(node.sibling);if(node.child)stack.push(node.child);
  }
  const box=video.getBoundingClientRect();
  return {readyState:video.readyState,paused:video.paused,volume:+video.volume.toFixed(2),muted:video.muted,rate:video.playbackRate,height:video.videoHeight,width:Math.round(box.width),
    ivs:player?{bound:player.getHTMLVideoElement?.()===video,volume:+player.getVolume().toFixed(2),muted:player.isMuted(),rate:player.getPlaybackRate(),quality:player.getQuality?.()?.height,auto:player.isAutoQualityMode?.(),levels:player.getQualities().length}:null};
};
async function main(){
  const driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{allowWeb:true,toolbarControls:true,visible:args.visible==='true',viewport:{width:1400,height:900}});
  const result={engine,browserVersion:driver.version};
  try{
    await driver.install();
    const browse=await driver.open('https://kick.com/browse');await delay(5000);
    if(await driver.evaluate(browse,challenged)){result.status='verification-required';console.log(JSON.stringify(result));return;}
    // Same browse-page pick as a person would make: a card with a thumbnail, no name leaves the page.
    const moved=await driver.evaluate(browse,()=>{
      const skip=/^\/(browse|categories|following|search|terms|privacy|dmca|community|login|signup|cookies|transparency|careers|brand|help|legal|blog|about|safety|policy)/i;
      const card=[...document.querySelectorAll('a[href]')].find(link=>{const route=new URL(link.href).pathname;return /^\/[a-z0-9_-]{3,}$/i.test(route)&&!skip.test(route)&&link.querySelector('img,video');});
      if(card)location.href=card.href;return !!card;
    });
    assert.ok(moved,'a public channel card is available');
    await delay(9000);const page=browse;
    if(await driver.evaluate(page,challenged)){result.status='verification-required';console.log(JSON.stringify(result));return;}
    await until(driver,page,()=>[...document.querySelectorAll('video')].some(video=>video.readyState>=2&&video.videoWidth>0),'live video plays');
    result.before=await driver.evaluate(page,playerState);
    await driver.toolbar(page);
    await until(driver,page,()=>document.getElementById('pvc-controller-popup')?.style.display==='block','panel opens');await delay(1500);
    await driver.evaluate(page,()=>document.getElementById('pvc-a11y-keepVisible')?.click());
    result.adapter=await driver.evaluate(page,()=>document.getElementById('pvc-active-adapter-badge')?.textContent);
    result.panelAtOpen=await driver.evaluate(page,()=>document.getElementById('pvc-volume-slider')?.value);
    result.mediaAtOpen=await driver.evaluate(page,playerState);
    // Stale player selectors would silently disable the ad marker and the site's own controls.
    result.playerRoots=await driver.evaluate(page,()=>{const video=[...document.querySelectorAll('video')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];const chain=[];for(let node=video;node&&chain.length<7;node=node.parentElement)chain.push({id:/^(?:channel-player|injected-channel-player|video-player)/.test(node.id)?node.id:node.id?'other':'',testid:node.getAttribute('data-testid'),videos:node.querySelectorAll('video').length});return {chain,adapterRoot:!!video.closest('#channel-player, #injected-channel-player, [data-testid="video-player"]'),adBadges:document.querySelectorAll('[data-testid="ad-badge"]').length,adLike:[...new Set([...document.querySelectorAll('[data-testid]')].map(n=>n.getAttribute('data-testid')).filter(t=>/(^|-)ad(s|-|$)/i.test(t)))]};});
    await driver.evaluate(page,()=>{document.getElementById('pvc-tab-player').click();const quality=document.getElementById('pvc-section-quality');if(quality.classList.contains('pvc-section-collapsed'))quality.querySelector('.pvc-section-header').click();});
    await delay(1000);
    result.choices=await driver.evaluate(page,()=>[...document.querySelectorAll('#pvc-dynamic-quality-container button')].map(button=>button.textContent.trim()));
    const sliderTo=value=>driver.evaluate(page,value=>{const slider=document.getElementById('pvc-volume-slider');slider.value=String(value);slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));},value);
    await sliderTo(30);await delay(800);result.afterVolume30=await driver.evaluate(page,playerState);
    await sliderTo(0);await delay(800);result.afterVolume0=await driver.evaluate(page,playerState);
    await sliderTo(10);await delay(500);
    const target=await driver.evaluate(page,()=>{const buttons=[...document.querySelectorAll('#pvc-dynamic-quality-container button')].filter(button=>/^\d+p/.test(button.textContent.trim()));const pick=buttons[buttons.length-1];pick?.click();return pick?.textContent.trim()||null;});
    result.qualityTarget=target;await delay(9000);result.afterQuality=await driver.evaluate(page,playerState);
    result.qualityStatus=await driver.evaluate(page,()=>document.getElementById('pvc-quality-status')?.textContent?.trim()||null);
    assert.equal(result.adapter?.startsWith('KickAdapter'),true,'Kick adapter selected');
    const realLevel=result.mediaAtOpen.muted?0:Math.round(result.mediaAtOpen.volume*100);
    assert.ok(Math.abs(Number(result.panelAtOpen)-realLevel)<=5,'the panel opens at the real media volume');
    assert.ok(result.choices.length>=2,'the panel lists the player qualities');
    assert.equal(result.afterVolume30.ivs?.volume,0.3,'panel volume reaches the player');
    assert.equal(result.afterVolume0.ivs?.muted,true,'zero volume mutes the player');
    if(target)assert.equal(`${result.afterQuality.ivs?.quality}p`,target.replace(/p.*/,'p'),'the player reports the requested quality');
    result.status='passed';
    console.log(JSON.stringify(result));
  }catch(error){result.status='failed';result.error=error.message;console.log(JSON.stringify(result));process.exitCode=1;}
  finally{await driver.close();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
