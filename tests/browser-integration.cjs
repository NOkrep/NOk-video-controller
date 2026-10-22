// Synthetic browser integration, not a store-installed extension or real-site compatibility test.
// node tests/browser-integration.cjs --packages=<node_modules> --browser=<headless-capable Chromium executable>
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {serveMedia,mediaHtml,exerciseFileMedia}=require('./file-media-checks.cjs');
const {serveLibraryAsset,libraryHtml}=require('./library-fixtures.cjs');
const root = path.resolve(__dirname, '..');
const arg = name => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const packages = arg('packages'), browserPath = arg('browser');
const mediaPath=arg('media');
const testLibraries=process.argv.includes('--libraries');
if (!packages || !browserPath) throw new Error('Provide --packages=<node_modules> and --browser=<Chromium executable>. No dependencies are downloaded.');
const { chromium } = require(path.join(packages, 'playwright'));
const assets = new Set(['frame-protocol.js', 'content.js', 'injected.js', 'injected.css', 'icons/nok-logo.svg']);
const artifactDir = path.join(__dirname, 'artifacts', 'iframe-browser');
const servers = [];
const mediaRequests=[];
let mainOrigin, childOrigin;
const scripts = () => `<link rel="stylesheet" href="${mainOrigin}/injected.css"><script src="${mainOrigin}/frame-protocol.js"></script><script src="${mainOrigin}/content.js"></script>`;
function parentHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>NOk synthetic iframe test</title>${scripts()}
  <style>body{margin:28px;font:16px system-ui;background:#18212b;color:white}iframe{display:block;margin-top:32px;width:700px;height:450px;border:2px solid #567}button{padding:12px;margin-right:8px}</style></head>
  <body><h1>Cross-origin player fixture</h1><button id="open">Open controller</button><button id="fullscreen">Fullscreen iframe</button>
  <iframe id="player-frame" src="${childOrigin}/child" allow="fullscreen; autoplay; picture-in-picture"></iframe>
  <script>document.getElementById('open').onclick=()=>window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*');
  document.getElementById('fullscreen').onclick=()=>document.getElementById('player-frame').requestFullscreen();</script></body></html>`;
}
function childHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Synthetic player frame</title>${scripts()}
  <style>body{margin:0;background:#020c14;color:white;font:14px system-ui}.plyr{width:100%}video{display:block;width:100%;max-height:80vh}button{padding:8px}</style></head>
  <body><div class="plyr video-js"><video id="sample" autoplay muted playsinline></video><div id="quality-menu">
  <button data-plyr="quality" value="1080" aria-checked="true">1080p</button><button data-plyr="quality" value="720">720p</button><button data-plyr="quality" value="480">480p</button></div></div>
  <script>const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d');
  function paint(){ctx.fillStyle='#193b52';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#d4e4ef';ctx.font='64px system-ui';ctx.fillText('Synthetic media '+canvas.height+'p',60,110);}
  paint();const sample=document.getElementById('sample');sample.srcObject=canvas.captureStream(5);sample.play().catch(()=>{});setInterval(paint,200);
  const rateProperty=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.fixtureRateRequests=[];
  Object.defineProperty(sample,'playbackRate',{configurable:true,get(){return rateProperty.get.call(this);},set(value){window.fixtureRateRequests.push(value);rateProperty.set.call(this,value);}});
  document.querySelectorAll('[data-plyr="quality"]').forEach(button=>button.onclick=()=>{const h=Number(button.value);canvas.width=Math.round(h*16/9);canvas.height=h;
  document.querySelectorAll('[data-plyr="quality"]').forEach(item=>item.setAttribute('aria-checked',String(item===button)));paint();});</script></body></html>`;
}
function listen(handler) {
  return new Promise(resolve => { const server = http.createServer(handler); servers.push(server); server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)); });
}
(async () => {
  let browser;
  let stage = 'startup', testPage;
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'result.json'), JSON.stringify({status:'running',testLibraries})+'\n');
  try {
    childOrigin = await listen((_request, response) => { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(childHtml()); });
    mainOrigin = await listen((request, response) => {
      if(/^\/hls\//.test(request.url))mediaRequests.push(request.url);
      if(testLibraries&&serveLibraryAsset(request,response))return;
      if(testLibraries&&['/library/hls','/library/videojs'].includes(request.url)){
        response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(libraryHtml(request.url.endsWith('/hls')?'hls':'videojs',scripts()));return;}
      if(mediaPath && request.url==='/synthetic.webm'){serveMedia(request,response,path.resolve(mediaPath));return;}
      if(mediaPath && request.url==='/file'){response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(mediaHtml(scripts()));return;}
      if (request.url === '/') { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(parentHtml()); return; }
      const asset = request.url.slice(1);
      if (!assets.has(asset)) { response.writeHead(404); response.end(); return; }
      response.writeHead(200, { 'Content-Type': asset.endsWith('.css') ? 'text/css' : asset.endsWith('.svg') ? 'image/svg+xml' : 'application/javascript' });
      response.end(fs.readFileSync(path.join(root, asset)));
    });
    browser = await chromium.launch({ executablePath: browserPath, headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    context.setDefaultTimeout(10000);
    await context.route('**/*', route => [mainOrigin, childOrigin].some(origin => route.request().url().startsWith(origin + '/')) ? route.continue() : route.abort());
    await context.addInitScript(origin => { window.chrome = { runtime: { getURL: file => origin + '/' + file } }; }, mainOrigin);
    const page = await context.newPage(), errors = [];
    testPage = page;
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(mainOrigin);
    const frame = await (await page.locator('#player-frame').elementHandle()).contentFrame();
    await frame.waitForFunction(() => window.__NOK_VIDEO_CONTROLLER_INJECTED__ && document.querySelector('video').readyState >= 2);
    await page.waitForFunction(() => window.__NOK_VIDEO_CONTROLLER_INJECTED__);
    await page.locator('#open').click();
    await page.locator('#pvc-active-adapter-badge').filter({ hasText: 'GenericAdapter' }).waitFor();
    await page.waitForFunction(() => !document.querySelector('#pvc-no-video-alert') || document.querySelector('#pvc-no-video-alert').style.display === 'none');
    const normal = await page.locator('#pvc-controller-popup').boundingBox(), frameBox = await page.locator('#player-frame').boundingBox();
    assert.ok(normal.x >= frameBox.x + frameBox.width, 'Normal HUD must live outside the iframe bounds in the parent document');
    assert.equal(await frame.locator('#pvc-controller-popup:visible').count(), 0);
    fs.mkdirSync(artifactDir, { recursive: true }); await page.screenshot({ path: path.join(artifactDir, 'normal.png') });
    await page.locator('#pvc-tab-player').click();
    await page.locator('#pvc-volume-slider').evaluate(input => { input.value = '40'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    await frame.waitForFunction(() => Math.abs(document.querySelector('video').volume - 0.4) < 0.01);
    await page.locator('#pvc-section-quality .pvc-section-header').click();
    await page.locator('#pvc-dynamic-quality-container button').filter({ hasText: /^720p$/ }).click();
    await frame.waitForFunction(() => document.querySelector('video').videoHeight === 720);
    await page.waitForFunction(() => document.querySelector('#pvc-quality-status').textContent.includes('Confirmed'));
    await page.locator('#pvc-tab-subtitles').click();
    await page.locator('#pvc-sub-file-input').setInputFiles({ name: 'synthetic.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('1\n00:00:00,000 --> 00:10:00,000\nSynthetic caption\n') });
    await frame.waitForFunction(() => document.querySelector('#pvc-subtitle-overlay')?.textContent === 'Synthetic caption');
    await page.locator('.pvc-sub-appearance summary').click();
    await page.locator('#pvc-sub-fontSize').evaluate(input => { input.value = '28'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    await frame.waitForFunction(() => getComputedStyle(document.querySelector('#pvc-subtitle-overlay')).fontSize === '28px');
    assert.equal(await page.locator('#pvc-subtitle-overlay').count(), 0, 'Caption text stays in the selected media frame');
    await page.locator('#pvc-tab-settings').click();
    await page.locator('#pvc-section-filters .pvc-section-header').click();
    await page.locator('#pvc-filter-brightness').evaluate(input => { input.value = '120'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    await frame.waitForFunction(() => document.querySelector('video').style.filter.includes('brightness(120%)'));
    await page.locator('#fullscreen').click();
    await frame.locator('#pvc-controller-popup:visible').waitFor();
    await page.locator('#pvc-controller-popup').waitFor({ state: 'hidden' });
    assert.equal(await frame.locator('#pvc-volume-slider').inputValue(), '40');
    assert.match(await frame.locator('#pvc-realtime-res-badge').textContent(), /1280x720/);
    await frame.locator('#pvc-tab-subtitles').click();
    assert.match(await frame.locator('#pvc-sub-status-text').textContent(), /Subtitles loaded/);
    assert.equal(await frame.locator('#pvc-sub-fontSize').inputValue(), '28');
    await page.screenshot({ path: path.join(artifactDir, 'fullscreen.png') });
    await page.evaluate(() => document.exitFullscreen());
    await page.locator('#pvc-controller-popup:visible').waitFor();
    await frame.locator('#pvc-controller-popup').waitFor({ state: 'hidden' });
    await page.locator('#pvc-report-err-btn').click();
    await page.locator('#pvc-error-modal').waitFor({ state: 'visible' });
    const diagnostic = JSON.parse(await page.locator('#pvc-modal-code-block').textContent());
    assert.equal(diagnostic.frame.context, 'iframe'); assert.equal(diagnostic.quality.verification, 'confirmed');
    assert.equal(JSON.stringify(diagnostic).includes('Synthetic caption'), false);
    await page.locator('#pvc-close-modal-btn').click();
    await page.locator('#pvc-close-popup-btn').click();
    await page.locator('#pvc-controller-popup').waitFor({ state: 'hidden' });
    await page.locator('#open').click();
    await page.locator('#pvc-controller-popup:visible').waitFor();
    assert.equal(await frame.locator('#pvc-controller-popup:visible').count(), 0);
    // Explicit player-owned Video.js ad marker, never inferred from URL, text or duration.
    await frame.evaluate(() => document.querySelector('.video-js').classList.add('vjs-ad-playing'));
    try { await frame.waitForFunction(() => window.fixtureRateRequests.includes(16) && document.querySelector('video').muted && document.querySelector('video').videoHeight === 480); }
    catch (error) {
      process.stderr.write(JSON.stringify(await frame.evaluate(() => { const v = document.querySelector('video'), r = document.querySelector('.video-js');
        return {rate:v.playbackRate,muted:v.muted,height:v.videoHeight,volume:v.volume,marker:r.matches('.video-js.vjs-ad-playing'),rootVisible:r.getBoundingClientRect().width > 0}; })) + '\n');
      process.stderr.write(JSON.stringify(errors) + '\n'); throw error;
    }
    await frame.evaluate(() => document.querySelector('.video-js').classList.remove('vjs-ad-playing'));
    await frame.waitForFunction(() => document.querySelector('video').playbackRate === 1 && !document.querySelector('video').muted && document.querySelector('video').videoHeight === 720);
    assert.ok(Math.abs(await frame.locator('video').evaluate(video => video.volume) - .4) < .01);
    assert.deepEqual(errors, []);
    let fileMedia;
    if(mediaPath){await page.goto(mainOrigin+'/file');await page.waitForFunction(()=>window.__NOK_VIDEO_CONTROLLER_INJECTED__);
      fileMedia=await page.evaluate(exerciseFileMedia);}
    const libraries=[];
    if(testLibraries)for(const kind of ['hls','videojs']){
      stage = kind + ':load';
      await page.goto(mainOrigin+'/library/'+kind);
      await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2,undefined,{timeout:20000});
      await page.locator('#open').click();
      const adapter=kind==='hls'?'HlsJsAdapter':'VideoJsAdapter';
      await page.locator('#pvc-active-adapter-badge').filter({hasText:adapter}).waitFor();
      const heights=await page.locator('#pvc-dynamic-quality-container button').allTextContents();
      for(const height of [1080,720,480])assert.ok(heights.some(text=>text.includes(height+'p')),`${kind} inventory missing ${height}p`);
      await page.locator('#pvc-section-quality .pvc-section-header').click();
      const transitions=[];
      for(const height of [1080,480]){
        stage = kind + ':quality:' + height;
        await page.locator('#pvc-dynamic-quality-container button').filter({hasText:new RegExp('^'+height+'p')}).click();
        await page.waitForFunction(height=>document.querySelector('video').videoHeight===height,height,{timeout:12000});
        await page.waitForFunction(height=>document.querySelector('#pvc-quality-status').textContent.includes('decoded '+height+'p') && document.querySelector('#pvc-quality-status').textContent.includes('Confirmed'),height);
        transitions.push({height,status:await page.locator('#pvc-quality-status').textContent()});
      }
      libraries.push({kind,adapter,inventory:heights,transitions});
    }
    assert.deepEqual(errors,[]);
    const result = { status:'passed', browser: 'Chromium-family executable', installedExtension: false, synthetic: true,
      checks: ['parent HUD bounds', 'single HUD', 'remote volume', 'menu and decoded quality', 'subtitle in owning frame', 'subtitle appearance', 'remote filter', 'ancestor fullscreen', 'fullscreen state persistence', 'exit fullscreen', 'source diagnostic relay', 'close/reopen', 'player-owned ad entry: 16x requested, muted, lowest quality', 'ad quality/rate/audio restore'],
      limitations: ['Iframe MediaStream fixture ignores playback rate; optional file fixture separately measures actual speed', 'Not an installed-extension or Firefox/real-site test'], fileMedia,libraries,pageErrors: errors };
    fs.writeFileSync(path.join(artifactDir, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch(error) {
    const state = await testPage?.evaluate(() => {
      const video=document.querySelector('video'),player=window.videojs?.getAllPlayers?.()[0],vhs=player?.tech_?.vhs;
      return {
        media:video?{height:video.videoHeight,ready:video.readyState,paused:video.paused,time:video.currentTime,ended:video.ended,
          buffered:Array.from({length:video.buffered.length},(_,i)=>[video.buffered.start(i),video.buffered.end(i)])}:null,
        qualityStatus:document.querySelector('#pvc-quality-status')?.textContent,
        vhs:vhs?{representations:vhs.representations?.().map(r=>({height:r.height,enabled:r.enabled(),id:r.id,playlistId:r.playlist?.id})),
          playlist:vhs.playlistController_?.mainPlaylistLoader_?.media?.()?.id,
          segmentPlaylist:vhs.playlistController_?.mainSegmentLoader_?.playlist_?.id,
          waiting:vhs.playlistController_?.waitingForFastQualityPlaylistReceived_,
          segments:vhs.playlistController_?.mainPlaylistLoader_?.media?.()?.segments?.length,
          selected:player.qualityLevels?.().selectedIndex,requests:vhs.stats?.mediaRequests,appends:vhs.stats?.mediaAppends,
          playerError:player.error()?.code}:null
      };
    }).catch(()=>null);
    const failure={status:'failed',stage,error:error.message,state,mediaRequests};
    fs.writeFileSync(path.join(artifactDir,'result.json'),JSON.stringify(failure,null,2)+'\n');
    process.stderr.write(JSON.stringify(failure,null,2)+'\n');
    throw error;
  } finally {
    await browser?.close();
    await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
  }
})().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
