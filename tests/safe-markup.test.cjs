const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','injected.js'),'utf8');
const start=source.indexOf('  function setUiMarkup'),end=source.indexOf('  function setUiText',start);
const context=vm.createContext({});vm.runInContext(source.slice(start,end),context);
test('UI markup renders through native sanitization without calling a blocked HTML sink',()=>{
  let markup,options;context.element={setHTML(value,config){markup=value;options=config;},set innerHTML(_value){throw Error('TrustedHTML required');}};
  vm.runInContext('setUiMarkup(element,"<button data-speed=1>1x</button>")',context);
  assert.equal(markup,'<button data-speed=1>1x</button>');assert.equal(typeof options.sanitizer,'object');
});
test('legacy browsers retain the existing markup path when the native safe API is absent',()=>{
  context.element={};vm.runInContext('setUiMarkup(element,"<span>FilmDeck</span>")',context);assert.equal(context.element.innerHTML,'<span>FilmDeck</span>');
});
test('clearing a UI list removes its children without an HTML parser or Trusted Types sink',()=>{
  let cleared=false;context.element={replaceChildren(){cleared=true;},setHTML(){throw Error('unnecessary parse');},set innerHTML(_value){throw Error('blocked');}};
  vm.runInContext('setUiMarkup(element,"")',context);assert.equal(cleared,true);
});
