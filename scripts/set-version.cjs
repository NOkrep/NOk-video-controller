const fs = require('node:fs');
const path = require('node:path');
const {versionParts} = require('./check-extension.cjs');

function setVersion(root, version) {
  versionParts(version);
  const plans = [];
  for (const name of ['manifest.json','package.json','package-lock.json']) {
    const file = path.join(root,name), original = fs.readFileSync(file,'utf8'), data = JSON.parse(original);
    data.version = version;
    if (name === 'package-lock.json') data.packages[''].version = version;
    plans.push({file, original, next:JSON.stringify(data,null,2)+'\n'});
  }
  const changes = [
    ['injected.js', /const EXTENSION_VERSION = '[^']+'/, `const EXTENSION_VERSION = '${version}'`],
    ['injected.js', /injected\.js - FilmDeck by NOk v[\d.]+/, `injected.js - FilmDeck by NOk v${version}`],
    ['injected.css', /injected\.css - FilmDeck by NOk v[\d.]+/, `injected.css - FilmDeck by NOk v${version}`],
    ['README.md', /^# FilmDeck by NOk \(v[\d.]+/m, `# FilmDeck by NOk (v${version}`],
    ['PROJECT_MASTER_GUIDE.md', /^> \*\*Sürüm:\*\* v[\d.]+/m, `> **Sürüm:** v${version}`],
    ['ACTIVE_WORK.md', /Kaynak sürümü \*\*v[\d.]+/, `Kaynak sürümü **v${version}`]
  ];
  for (const [name, pattern, replacement] of changes) {
    const file = path.join(root,name);
    let plan = plans.find(item => item.file === file);
    if (!plan) { const original=fs.readFileSync(file,'utf8'); plan={file,original,next:original}; plans.push(plan); }
    if (!pattern.test(plan.next)) throw Error(`Version marker missing in ${name}; nothing written.`);
    plan.next = plan.next.replace(pattern,replacement);
  }
  for (const plan of plans) if (fs.readFileSync(plan.file,'utf8') !== plan.original) throw Error('Source changed during preparation; nothing written.');
  for (const plan of plans) fs.writeFileSync(plan.file,plan.next);
}
if (require.main === module) {
  try { setVersion(path.resolve(__dirname,'..'),process.argv[2] || ''); console.log(`Source version set to ${process.argv[2]}; no commit, tag, package or release created.`); }
  catch (error) { console.error(error.message); process.exitCode=1; }
}
module.exports = {setVersion};
