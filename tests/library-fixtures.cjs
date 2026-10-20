const fs=require('node:fs'),path=require('node:path');
const artifactRoot=path.join(__dirname,'artifacts');
function serveLibraryAsset(request,response){
  const route=request.url.split('?')[0];
  const match=route.match(/^\/(runtime\/(?:hls|video)\.min\.js|hls\/(?:master|480|720|1080)\.m3u8|hls\/(?:480|720|1080)-\d{3}\.ts)$/);
  if(!match)return false;
  const file=path.join(artifactRoot,match[1]);
  if(!fs.existsSync(file)){response.writeHead(404);response.end();return true;}
  response.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.m3u8')?'application/vnd.apple.mpegurl':'video/mp2t'});
  fs.createReadStream(file).pipe(response);return true;
}
function libraryHtml(kind,scripts=''){
  const isHls=kind==='hls';
  return `<!doctype html><html><head><meta charset="utf-8">${scripts}<style>body{background:#152330;color:white;margin:24px}.video-js{width:800px}video{width:800px;height:450px}#open{position:relative;z-index:10}.vjs-modal-dialog,.vjs-text-track-display,.vjs-poster,.vjs-loading-spinner{display:none}</style></head><body>
    <h1>Actual ${isHls?'Hls.js 1.6.13':'Video.js 8.23.4 / VHS'} runtime</h1><button id="open" onclick="window.postMessage({type:'PVC_TOOLBAR_TOGGLE'},'*')">Controller</button>
    <video id="sample" class="${isHls?'':'video-js'}" autoplay muted playsinline></video>
    <script src="/runtime/${isHls?'hls':'video'}.min.js"></script><script>
    const start=setInterval(()=>{if(!window.__NOK_VIDEO_CONTROLLER_INJECTED__)return;clearInterval(start);
      const video=document.querySelector('video');
      ${isHls?`const player=new Hls({maxBufferLength:4,maxMaxBufferLength:6});player.loadSource('/hls/master.m3u8');player.attachMedia(video);player.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));`
        :`const player=videojs(video,{controls:true,autoplay:true,muted:true,html5:{vhs:{overrideNative:true,maxPlaylistRetries:1}}});player.src({src:'/hls/master.m3u8',type:'application/x-mpegURL'});player.play().catch(()=>{});`}
    },25);</script></body></html>`;
}
module.exports={serveLibraryAsset,libraryHtml};
