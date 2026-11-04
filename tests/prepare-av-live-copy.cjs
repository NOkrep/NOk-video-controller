// Builds a Git-ignored measurement copy for one user-run live session. Source files are not changed.
// node tests/prepare-av-live-copy.cjs   -> tests/artifacts/av-live-copy/manifest.json
const fs=require('node:fs'),path=require('node:path');
const {checkExtension}=require('../scripts/check-extension.cjs');
const root=path.resolve(__dirname,'..'),target=path.join(__dirname,'artifacts','av-live-copy');
const base=path.resolve(__dirname,'artifacts')+path.sep;
if(!(target+path.sep).startsWith(base))throw Error('Unsafe measurement copy path.');
fs.rmSync(target,{recursive:true,force:true});
for(const file of checkExtension(root).runtimeFiles){const out=path.join(target,file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(root,file),out);}
const engine=path.join(target,'injected.js');
fs.writeFileSync(engine,fs.readFileSync(engine,'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'av-live-probe.js'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(target,'manifest.json'),'utf8'));
manifest.name='FilmDeck I-07 ölçüm kopyası';
fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(path.join(target,'manifest.json'));
