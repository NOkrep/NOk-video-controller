// I-04: installed extension against real YouTube ads. Disposable profile, no account, no consent accepted, local run only.
// Flow: wait unpressed, press once and close the panel, then follow links inside the same document until ads appear.
// node tests/youtube-ad-acceptance.cjs --engine=firefox|chromium [--minutes=4] [--ads=2] [--unpressed=15] [--query=...] [--visible=true]
// Prints numbers and labels only, never video names or addresses. An ad may not appear in a run: that is "no-ad-seen", not a pass.
const assert=require('node:assert/strict'),path=require('node:path');
const {createDriver,delay}=require('./resource-driver.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
const engine=args.engine||'chromium',limitMs=Number(args.minutes||4)*60000,wantedAds=Number(args.ads||2),perVideoMs=30000,unpressedMs=Number(args.unpressed||15)*1000;
const executable=args.browser||(engine==='firefox'?'C:/Program Files/Mozilla Firefox/firefox.exe':'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const challenged=()=>/just a moment|verify you are human|checking your browser|captcha|confirm you.re not a bot|robot olmad/i.test(document.title+' '+(document.body?.innerText||'').slice(0,800));
const refuseConsent=()=>{if(!/consent\./.test(location.hostname)&&!document.querySelector('ytd-consent-bump-v2-lightbox'))return 'none';const button=[...document.querySelectorAll('button,[role=button]')].find(node=>/reject all|tümünü reddet/i.test(node.textContent||node.getAttribute('aria-label')||''));button?.click();return button?'rejected':'present-no-reject';};
const watchLinks=()=>[...new Set([...document.querySelectorAll('a[href*="/watch?v="]')].map(link=>new URL(link.href).searchParams.get('v')).filter(Boolean))].slice(0,25).map(id=>'https://www.youtube.com/watch?v='+id);
const nextVideo=()=>{const current=new URLSearchParams(location.search).get('v');const link=[...document.querySelectorAll('a[href*="/watch?v="]')].find(node=>{const rect=node.getBoundingClientRect();return rect.width>0&&rect.height>0&&new URL(node.href).searchParams.get('v')!==current;});link?.click();return !!link;};
const sample=()=>{const video=document.querySelector('.html5-video-player video'),root=video?.closest('.html5-video-player');
  return {ad:!!root?.classList.contains('ad-showing'),panelOpen:document.getElementById('pvc-controller-popup')?.style.display==='block',rate:video?.playbackRate??null,muted:video?.muted??null,volume:video?+video.volume.toFixed(2):null,paused:video?.paused??null,panelSpeed:document.getElementById('pvc-speed-slider')?.value??null,badge:document.getElementById('pvc-hdr-speed-badge')?.textContent??null,panelVolume:document.getElementById('pvc-volume-slider')?.value??null};};
(async()=>{
  const out={engine,videos:0,unpressedAdSamples:0,unpressedPeakRate:0,ads:0,adSeconds:0,peakRate:0,panelOpenInAd:false,after:[],status:'running'};
  const finish=status=>{out.status=status;console.log(JSON.stringify(out));};
  const watchdog=setTimeout(()=>{finish('watchdog');process.exit(3);},limitMs+150000);
  const driver=await createDriver(engine,executable,args.packages||path.resolve(__dirname,'../node_modules'),{allowWeb:true,toolbarControls:true,visible:args.visible==='true',viewport:{width:1400,height:900}});
  try{
    out.browserVersion=driver.version;await driver.install();
    const page=await driver.open('https://www.youtube.com/results?search_query='+encodeURIComponent(args.query||'official music video'));await delay(5000);
    const consent=await driver.evaluate(page,refuseConsent);
    if(consent==='present-no-reject'){finish('consent-required');return;}
    if(consent==='rejected')await delay(4000);
    if(await driver.evaluate(page,challenged)){finish('verification-required');return;}
    const list=await driver.evaluate(page,watchLinks),started=Date.now();
    if(!list.length){finish('no-video-link');return;}
    await driver.navigate(page,list[0]);out.videos++;await delay(1000);
    if(await driver.evaluate(page,challenged)){finish('verification-required');return;}
    // Before the first press nothing may act on the page, even during an ad.
    for(const end=Date.now()+unpressedMs;Date.now()<end;await delay(700)){
      const state=await driver.evaluate(page,sample);
      if(state.ad){out.unpressedAdSamples++;out.unpressedPeakRate=Math.max(out.unpressedPeakRate,state.rate);}
    }
    await driver.evaluate(page,()=>{window.__nokSameDocument=true;return true;});
    // One press, then a closed panel for the rest of the run. Next videos stay in the same document.
    await driver.toolbar(page);await delay(1000);
    await driver.evaluate(page,()=>{document.getElementById('pvc-close-popup-btn')?.click();return true;});
    while(Date.now()-started<limitMs&&out.ads<wantedAds){
      const entered=Date.now();let inAd=false;
      while((inAd||Date.now()-entered<perVideoMs)&&Date.now()-started<limitMs+90000){
        const state=await driver.evaluate(page,sample);
        if(state.ad){if(!inAd)out.ads++;inAd=true;out.adSeconds++;out.peakRate=Math.max(out.peakRate,state.rate);out.panelOpenInAd||=state.panelOpen;}
        else if(inAd){
          // The content can take seconds to load after an ad.
          for(let i=0;i<40;i++){if((await driver.evaluate(page,()=>document.querySelector('.html5-video-player video')?.readyState))>=2)break;await delay(500);}
          await delay(2000);const after=await driver.evaluate(page,sample);if(!after.ad)out.after.push(after);break;
        }
        await delay(700);
      }
      if(out.ads>=wantedAds)break;
      if(await driver.evaluate(page,challenged)){finish('verification-required');return;}
      if(!await driver.evaluate(page,nextVideo)){finish('no-next-link');return;}
      out.videos++;await delay(1500);
    }
    if(!out.after.length){finish('no-ad-seen');return;}
    assert.equal(await driver.evaluate(page,()=>window.__nokSameDocument===true),true,'the run stayed in the pressed document');
    assert.equal(out.unpressedPeakRate<=1,true,'no speed change before the first press');
    assert.equal(out.panelOpenInAd,false,'the ads ran with a closed panel');
    assert.equal(out.peakRate,16,'the ad marker requests 16x');
    for(const after of out.after){
      assert.equal(after.rate,1,'the speed returns to 1x');
      assert.equal(after.muted,false,'sound returns');
    }
    // A reopened panel shows the real values.
    await driver.toolbar(page);await delay(2500);
    const panel=await driver.evaluate(page,sample);out.reopened=panel;
    if(!panel.ad){
      assert.equal(Number(panel.panelSpeed),1,'the panel slider shows 1x');
      assert.match(panel.badge,/^1(\.0+)?x/,'the panel badge shows 1x');
      assert.ok(Math.abs(Number(panel.panelVolume)-panel.volume*100)<=2,'the panel shows the real level');
    }
    finish('passed');
  }catch(error){out.error=error.message.slice(0,200);finish('failed');process.exitCode=1;}
  finally{clearTimeout(watchdog);setTimeout(()=>process.exit(process.exitCode||0),15000);await driver.close().catch(()=>{});process.exit(process.exitCode||0);}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
