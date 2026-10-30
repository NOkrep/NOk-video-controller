const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {checkExtension,versionParts} = require('../scripts/check-extension.cjs');
const {setVersion} = require('../scripts/set-version.cjs');
const root = path.resolve(__dirname,'..');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'filmdeck-contract-'));
  const paths = checkExtension(root).runtimeFiles.concat(['package.json','package-lock.json','README.md','PROJECT_MASTER_GUIDE.md','ACTIVE_WORK.md']);
  for (const name of new Set(paths)) { fs.mkdirSync(path.dirname(path.join(dir,name)),{recursive:true});fs.copyFileSync(path.join(root,name),path.join(dir,name)); }
  t.after(()=>{assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('filmdeck-contract-'));fs.rmSync(dir,{recursive:true});});
  return dir;
}
function editManifest(dir,change) {
  const file=path.join(dir,'manifest.json'),data=JSON.parse(fs.readFileSync(file,'utf8'));change(data);fs.writeFileSync(file,JSON.stringify(data));
}

test('extension contract accepts current source and matching version tags',()=>{
  const version=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).version;
  assert.equal(checkExtension(root,{tag:'v'+version}).version,version);
  assert.throws(()=>checkExtension(root,{tag:'v0.0.1'}),/tag differs/);
});
test('browser version format supports four parts but rejects leading zeroes, all-zero and oversized parts',()=>{
  assert.deepEqual(versionParts('0.7.7.1'),[0,7,7,1]);
  for(const version of ['0.07.7','0.0.0','1.2.3.4.5','1.65536','1.2-beta','']) assert.throws(()=>versionParts(version));
});
test('metadata contract rejects a mismatched engine version and a version downgrade',t=>{
  const dir=fixture(t),file=path.join(dir,'injected.js');
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/const EXTENSION_VERSION = '[^']+'/,"const EXTENSION_VERSION = '0.0.1'"));
  assert.throws(()=>checkExtension(dir),/Engine version differs/);
  assert.throws(()=>checkExtension(root,{baseVersion:'99.0'}),/must not decrease/);
});
test('permission contract rejects storage or host permission expansion',t=>{
  const dir=fixture(t);editManifest(dir,data=>data.permissions.push('storage'));
  assert.throws(()=>checkExtension(dir),/permissions/);
  editManifest(dir,data=>{data.permissions=['activeTab','scripting'];data.host_permissions=['<all_urls>'];});
  assert.throws(()=>checkExtension(dir),/Host permissions/);
});
test('runtime inventory rejects path traversal and malformed icon dimensions',t=>{
  const dir=fixture(t);editManifest(dir,data=>data.web_accessible_resources[0].resources.push('../outside.js'));
  assert.throws(()=>checkExtension(dir),/Unsafe runtime asset path/);
  editManifest(dir,data=>data.web_accessible_resources[0].resources.pop());
  const file=path.join(dir,'icons/icon16.png'),png=fs.readFileSync(file);png.writeUInt32BE(48,16);fs.writeFileSync(file,png);
  assert.throws(()=>checkExtension(dir),/Invalid 16px/);
});
test('private and generated paths cannot enter tracked source',()=>{
  for(const file of ['PRIVATE_TEST_NOTES.md','SITE_COMPATIBILITY.md','tests/artifacts/heap.json','dist/package.zip','.env','keys/example.key'])
    assert.throws(()=>checkExtension(root,{trackedFiles:[file]}),/Private or generated/);
});
test('version command synchronizes current metadata while preserving Firefox identity',t=>{
  const dir=fixture(t),identity=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))).browser_specific_settings;
  setVersion(dir,'0.7.8.1');assert.equal(checkExtension(dir,{tag:'v0.7.8.1'}).version,'0.7.8.1');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))).browser_specific_settings,identity);
});
test('version command validates all inputs and markers before writing',t=>{
  const dir=fixture(t),file=path.join(dir,'manifest.json'),original=fs.readFileSync(file,'utf8');
  assert.throws(()=>setVersion(dir,'0.07.8'));assert.equal(fs.readFileSync(file,'utf8'),original);
  fs.writeFileSync(path.join(dir,'README.md'),'Missing marker');
  assert.throws(()=>setVersion(dir,'0.7.8'),/nothing written/);assert.equal(fs.readFileSync(file,'utf8'),original);
});
