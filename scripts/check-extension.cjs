const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

function versionParts(value) {
  if (!/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/.test(value)) throw Error('Version must contain 1–4 canonical numeric parts.');
  const parts = value.split('.').map(Number);
  if (parts.some(part => part > 65535) || parts.every(part => part === 0)) throw Error('Version is outside the shared browser range.');
  return [...parts, ...Array(4 - parts.length).fill(0)];
}

function checkExtension(root, {tag, baseVersion, trackedFiles = []} = {}) {
  const read = name => fs.readFileSync(path.join(root, name), 'utf8');
  const manifest = JSON.parse(read('manifest.json'));
  const version = manifest.version;
  const parts = versionParts(version);
  if (JSON.parse(read('package.json')).version !== version) throw Error('package.json version differs from manifest.');
  const lock = JSON.parse(read('package-lock.json'));
  if (lock.version !== version || lock.packages?.['']?.version !== version) throw Error('Dependency lock version differs from manifest.');
  if (read('injected.js').match(/const EXTENSION_VERSION = '([^']+)'/)?.[1] !== version) throw Error('Engine version differs from manifest.');
  if (!read('README.md').split('\n')[0].includes(`(v${version} `)) throw Error('README version differs from manifest.');
  if (tag && tag !== `v${version}`) throw Error('Version tag differs from manifest.');
  if (baseVersion) {
    const base = versionParts(baseVersion);
    const first = parts.findIndex((part, i) => part !== base[i]);
    if (first >= 0 && parts[first] < base[first]) throw Error('Version must not decrease relative to the checked Git base.');
  }
  if (JSON.stringify([...(manifest.permissions || [])].sort()) !== JSON.stringify(['activeTab', 'scripting'])) throw Error('Unexpected extension permissions.');
  if (manifest.host_permissions?.length !== 0) throw Error('Host permissions must stay empty.');
  if (manifest.browser_specific_settings?.gecko?.id !== 'nok-video-controller@nokrep.local') throw Error('Stable Firefox extension ID changed.');

  const payload = new Set(['manifest.json']);
  const include = name => {
    if (typeof name !== 'string' || name.includes('\\') || name.split('/').some(part => part === '..') || path.isAbsolute(name)) throw Error('Unsafe runtime asset path.');
    const resolved = path.resolve(root, name);
    if (!resolved.startsWith(path.resolve(root) + path.sep) || !fs.statSync(resolved).isFile()) throw Error('Runtime asset is missing or outside the extension.');
    payload.add(name);
  };
  for (const name of Object.values(manifest.icons || {})) include(name);
  for (const name of Object.values(manifest.action?.default_icon || {})) include(name);
  for (const item of manifest.content_scripts || []) for (const name of [...(item.js || []), ...(item.css || [])]) include(name);
  for (const name of [...(manifest.background?.scripts || []), manifest.background?.service_worker].filter(Boolean)) include(name);
  for (const group of manifest.web_accessible_resources || []) for (const name of group.resources) include(name);
  for (const language of ['en', 'tr']) {
    const name = `_locales/${language}/messages.json`;
    if (!JSON.parse(read(name)).extensionDescription?.message) throw Error('Missing extension description locale.');
    include(name);
  }
  for (const size of [16, 48, 128]) {
    const name = manifest.icons[size];
    if (manifest.action.default_icon[size] !== name) throw Error('Toolbar and extension icon mapping differ.');
    const png = fs.readFileSync(path.join(root, name));
    if (png.length < 24 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== size || png.readUInt32BE(20) !== size) throw Error(`Invalid ${size}px PNG icon.`);
  }
  for (const name of trackedFiles) {
    if (/^(?:tests\/artifacts\/|tmp\/|dist\/|node_modules\/)|^(?:SITE_COMPATIBILITY|ACCEPTANCE_STATUS|PRIVATE_TEST_NOTES)\.md$|(?:^|\/)\.env(?:\.|$)|\.(?:pem|key)$/i.test(name)) throw Error(`Private or generated file is tracked: ${name}`);
  }
  return {version, runtimeFiles:[...payload].sort()};
}

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '..');
    const trackedFiles = execFileSync('git', ['ls-files', '-z'], {cwd:root, encoding:'utf8'}).split('\0').filter(Boolean);
    const base = process.env.CI_CHECK_BASE;
    let baseVersion;
    if (base && !/^0+$/.test(base)) {
      if (!/^[a-f0-9]{40}$/i.test(base)) throw Error('Invalid Git base SHA.');
      baseVersion = JSON.parse(execFileSync('git', ['show', `${base}:manifest.json`], {cwd:root, encoding:'utf8'})).version;
    }
    const ref = process.env.GITHUB_REF || '';
    const result = checkExtension(root, {trackedFiles, baseVersion, tag:ref.startsWith('refs/tags/v') ? ref.slice('refs/tags/'.length) : undefined});
    for (const file of ['injected.js','content.js','background.js','frame-protocol.js']) execFileSync(process.execPath, ['--check', path.join(root,file)], {stdio:'inherit'});
    console.log(`FilmDeck ${result.version}: version, permissions, locales, icons and ${result.runtimeFiles.length} runtime files verified.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {checkExtension, versionParts};
