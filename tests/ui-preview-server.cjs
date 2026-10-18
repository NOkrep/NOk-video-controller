// Local, synthetic UI fixture. node tests/ui-preview-server.cjs
// No real media, accounts, third-party scripts or uploaded user files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = `<!doctype html><html lang="tr"><meta charset="utf-8"><title>NOk yerel altyazı / HLS testi</title>
<link rel="stylesheet" href="/injected.css"><style>body{background:#17202b;color:white;font:16px system-ui;margin:24px}video{display:block;width:640px;height:360px;background:#020617}button{margin:12px 6px 12px 0;padding:10px}</style>
<h1>Yerel sentetik oynatıcı</h1><video id="sample" controls></video>
<button id="load-sample">Örnek altyazıyı yükle</button><button id="multi">İki kalite bildir</button><button id="gap">Altyazısız zamana git</button>
<p id="result">Test dosyası yüklenmedi.</p>
<script>
class Hls {
  constructor(){this.levels=[{height:0,width:0,name:'',attrs:{}}];this.currentLevel=0;this.events={};}
  attachMedia(media){this.media=media;}
  on(name,callback){(this.events[name] ||= []).push(callback);}
  emit(name,data){for(const callback of this.events[name] || [])callback(name,data);}
}
window.Hls=Hls;
const sample=document.getElementById('sample');
for(const [key,value] of Object.entries({readyState:4,videoWidth:1280,videoHeight:720,currentTime:2,duration:12,paused:true}))
  Object.defineProperty(sample,key,{value,writable:true,configurable:true});
const hls=new Hls();
document.getElementById('load-sample').onclick=()=>{
  const input=document.getElementById('pvc-sub-file-input');
  const transfer=new DataTransfer();
  transfer.items.add(new File(['1\\n00:00:01,000 --> 00:00:08,000\\nGörünür altyazı — yerel test'], 'sample.srt', {type:'text/plain'}));
  input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
};
document.getElementById('multi').onclick=()=>{
  hls.levels=[{height:720,width:1280},{height:1080,width:1920}];
  hls.emit('hlsManifestLoaded',{levels:hls.levels});hls.emit('hlsLevelsUpdated',{});
};
document.getElementById('gap').onclick=()=>{sample.currentTime=10;sample.dispatchEvent(new Event('timeupdate'));};
setInterval(()=>{
  const overlay=document.getElementById('pvc-subtitle-overlay');
  document.getElementById('result').textContent=overlay
    ? 'Altyazı display: '+getComputedStyle(overlay).display+'; metin: '+overlay.textContent : 'Katman henüz oluşturulmadı.';
},250);
</script>
<script src="/injected.js" onload="hls.attachMedia(sample);hls.emit('hlsManifestLoaded',{levels:hls.levels});window.postMessage({type:'PVC_OPEN_POPUP'},'*');"></script></html>`;
const assets = { '/injected.js': ['injected.js', 'application/javascript'], '/injected.css': ['injected.css', 'text/css'] };
const server = http.createServer((request, response) => {
  if (request.url === '/') { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(html); return; }
  const asset = assets[request.url];
  if (!asset) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8' });
  response.end(fs.readFileSync(path.join(root, asset[0])));
});
server.listen(4817, '127.0.0.1', () => process.stdout.write('UI fixture: http://127.0.0.1:4817/\n'));
