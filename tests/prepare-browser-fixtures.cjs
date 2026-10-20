// Generates test-owned media. Runtime downloads require the explicit --download-runtimes flag.
// node tests/prepare-browser-fixtures.cjs [--ffmpeg=<ffmpeg>] [--download-runtimes] [--force]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const output=path.join(__dirname,'artifacts'),mediaDir=path.join(output,'media'),hlsDir=path.join(output,'hls'),runtimeDir=path.join(output,'runtime');
const ffmpeg=process.argv.find(arg=>arg.startsWith('--ffmpeg='))?.slice(9)||'ffmpeg';
const force=process.argv.includes('--force');
const runtimes=[
  {file:'hls.min.js',version:'Hls.js 1.6.13',url:'https://cdn.jsdelivr.net/npm/hls.js@1.6.13/dist/hls.min.js',sha256:'7c47cd97d7a6e7b98d9623dd8ed9a6d45af4be4085e0c2001cd7175c2b4cfb07'},
  {file:'video.min.js',version:'Video.js 8.23.4',url:'https://cdn.jsdelivr.net/npm/video.js@8.23.4/dist/video.min.js',sha256:'acd0a81a4cc78928f1530598762ed783ee916674bf3a0bf2a6c26a6c0b16ed4b'}
];
function run(args){const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error',...args],{windowsHide:true,encoding:'utf8',timeout:120000});
  if(result.error||result.status!==0)throw result.error||new Error(result.stderr||'FFmpeg failed');}
function digest(data){return crypto.createHash('sha256').update(data).digest('hex');}
(async()=>{
  for(const directory of [mediaDir,hlsDir,runtimeDir])fs.mkdirSync(directory,{recursive:true});
  const media=path.join(mediaDir,'synthetic-720p.webm');
  if(force||!fs.existsSync(media))run(['-f','lavfi','-i','testsrc2=size=1280x720:rate=30','-t','30','-an','-c:v','libvpx','-deadline','realtime','-cpu-used','8','-b:v','700k','-y',media]);
  for(const height of [480,720,1080]){
    const playlist=path.join(hlsDir,height+'.m3u8');
    if(force||!fs.existsSync(playlist))run(['-i',media,'-t','24','-vf',`scale=-2:${height}`,'-an','-c:v','libx264','-preset','ultrafast','-crf','30','-pix_fmt','yuv420p',
      '-g','60','-keyint_min','60','-sc_threshold','0','-hls_time','2','-hls_playlist_type','vod','-hls_segment_filename',path.join(hlsDir,height+'-%03d.ts'),'-y',playlist]);
  }
  fs.writeFileSync(path.join(hlsDir,'master.m3u8'),'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=600000,RESOLUTION=854x480\n480.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720\n720.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080\n1080.m3u8\n');
  const status=[];
  for(const runtime of runtimes){
    const file=path.join(runtimeDir,runtime.file);
    if(!fs.existsSync(file)&&process.argv.includes('--download-runtimes')){
      const response=await fetch(runtime.url,{signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw new Error(`Runtime download failed: ${response.status}`);
      const data=Buffer.from(await response.arrayBuffer());
      if(digest(data)!==runtime.sha256)throw new Error(`Runtime checksum mismatch: ${runtime.version}`);
      fs.writeFileSync(file,data);
    }
    if(fs.existsSync(file)){
      if(digest(fs.readFileSync(file))!==runtime.sha256)throw new Error(`Existing runtime checksum mismatch: ${runtime.version}`);
      status.push({version:runtime.version,sha256:runtime.sha256,available:true});
    }else status.push({version:runtime.version,available:false});
  }
  const manifest={generatedMedia:'synthetic 1280x720 30fps WebM / 3-level HLS',runtimes:status};
  fs.writeFileSync(path.join(output,'fixtures.json'),JSON.stringify(manifest,null,2)+'\n');
  process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
})().catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
