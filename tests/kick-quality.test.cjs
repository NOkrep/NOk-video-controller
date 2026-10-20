const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
function section(a,b) {return source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));}
function harness() {
  const video={closest:()=>null}, window={}, applied=[];
  const levels=[{name:'source',height:1080,bitrate:5000000},{name:'low',height:480,bitrate:600000}];
  const ivs={getHTMLVideoElement:()=>video,getQualities:()=>levels.map(item=>({...item})),setQuality:q=>applied.push(q)};
  const context=vm.createContext({video,window,ivs,globalCapturedIvsPlayer:null,HOSTNAME:'kick.com',document:{querySelector:()=>null},applied});
  vm.runInContext(section('  function isIvsBoundToVideo','  function hookIvsInstance')+section('  const KickAdapter =','  const NowTvAdapter ='),context);
  return {video,window,ivs,levels,applied,run:code=>vm.runInContext(code,context)};
}
test('Kick does not invent qualities or borrow an unbound global IVS instance',()=>{
  const h=harness(); h.window.player={getHTMLVideoElement:()=>({}),getQualities:()=>h.levels};
  assert.equal(h.run('KickAdapter.getQualities(video).length'),0);
  h.run('globalCapturedIvsPlayer=window.player'); assert.equal(h.run('KickAdapter.findIvsPlayer(video)'),null);
});
test('Kick keys real qualities by their values and applies the right rendition after SDK wrapper recreation/reordering',()=>{
  const h=harness(); h.video.__ivsPlayer=h.ivs;
  h.run('const choices=KickAdapter.getQualities(video)');
  h.levels.reverse();
  assert.equal(h.run('KickAdapter.applyQuality(choices.find(item=>item.height===480),video)'),true);
  assert.equal(h.applied[0].height,480);
  assert.equal(h.run('choices.find(item=>item.height===480).id === KickAdapter.getQualities(video).find(item=>item.height===480).id'),true);
  h.levels.splice(0,1); assert.equal(h.run('KickAdapter.applyQuality(choices.find(item=>item.height===480),video)'),false);
});
test('a previously bound IVS player cannot be reused after attaching to another video',()=>{
  const h=harness(); h.video.__ivsPlayer=h.ivs;
  assert.equal(h.run('KickAdapter.getQualities(video).length'),2);
  h.ivs.getHTMLVideoElement=()=>({}); assert.equal(h.run('KickAdapter.getQualities(video).length'),0);
});
