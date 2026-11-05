const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {state}=require('./frame-fixtures.cjs');
const source=fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
function section(from,to){const a=source.indexOf(from),b=source.indexOf(to,a);assert.ok(a>=0&&b>a);return source.slice(a,b);}
function element(){const classes=new Set(),attributes={};return {style:{},classes,attributes,
  classList:{toggle(name,on){on?classes.add(name):classes.delete(name);},contains:name=>classes.has(name)},
  setAttribute(name,value){attributes[name]=value;}};}

test('remote audio snapshots update selected buttons and accessibility state in both directions',()=>{
  const elements=Object.fromEntries(['pvc-controller-popup','pvc-audio-stereo-btn','pvc-audio-mono-btn','pvc-hdr-audio-badge'].map(id=>[id,element()]));
  const target={tagName:'BODY',appendChild(){}};elements['pvc-controller-popup'].parentElement=target;
  const context=vm.createContext({applyHudPreferences(){},document:{getElementById:id=>elements[id]||null},remotePresentation:state({audioMode:'mono'}),
    remoteRequests:new Map(),getActiveContainer:()=>target,setUiText(el,text){if(el)el.textContent=text;},
    syncRemoteFilters(){},subtitleAppearance:{},updateVolumeSliderVisualGain(){},updateFilterUiBadges(){},
    updateSubtitleAppearanceControls(){},renderRemoteQualities(){},renderRemoteTargets(){},
    setHudCollapsed(){},setNoVideoAlertVisible(){},renderFrameLossNotice(){},updateSubtitleExplanation(){},setUiTipStop(){},adapterTip(){return null;},updatePipButtonsState(){}});
  // Use the real renderer; a new shared helper is loaded when present.
  if(source.includes('  function syncAudioModeUi('))vm.runInContext(section('  function syncAudioModeUi(','  function syncLocalMediaHud'),context);
  vm.runInContext(section('  function renderRemoteHud()','  function renderRemoteQualities'),context);
  for(const mode of ['mono','stereo']){
    context.remotePresentation.audioMode=mode;vm.runInContext('renderRemoteHud()',context);
    for(const value of ['stereo','mono']){
      const button=elements[`pvc-audio-${value}-btn`];
      assert.equal(button.classes.has('pvc-audio-active'),mode===value,`${mode}: ${value} selection`);
      assert.equal(button.attributes['aria-pressed'],String(mode===value));
    }
  }
});
