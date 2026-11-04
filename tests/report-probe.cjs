// Test-only timing/weak-reference probes. No comments, URLs, raw heap or callbacks are retained.
function installReportProbe(){
  if(globalThis.__nokReportProbe)return;
  const probe=globalThis.__nokReportProbe={functions:{},inputs:[],roots:[],listeners:[],previewWrites:0,phase:'setup'};
  probe.measure=(name,run)=>{const start=performance.now();try{return run();}finally{
    const samples=probe.functions[name]||=[];if(samples.length<4000)samples.push(performance.now()-start);
  }};
  probe.reset=phase=>{probe.phase=phase;probe.functions={};probe.inputs=[];probe.previewWrites=0;};
  const add=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(...args){
    if(this instanceof Element&&(this.id==='pvc-error-modal'||this.closest('#pvc-error-modal')))probe.listeners.push(new WeakRef(this));
    return Reflect.apply(add,this,args);
  };
  document.addEventListener('input',event=>{
    if(event.target.id!=='pvc-user-feedback-input')return;
    const start=performance.now(),trusted=event.isTrusted,phase=probe.phase;
    requestAnimationFrame(()=>{if(probe.phase===phase)probe.inputs.push({ms:performance.now()-start,trusted});});
  },true);
  // One document observer; discarded with this isolated page. It never stores MutationRecords.
  new MutationObserver(records=>{for(const record of records)if(record.target.id==='pvc-modal-code-block')probe.previewWrites++;})
    .observe(document,{childList:true,subtree:true});
}
function instrumentReportSource(source){
  const replace=(from,to)=>{if(source.split(from).length!==2)throw Error('Report probe anchor must occur once');source=source.replace(from,to);};
  for(const [name,metric] of [['buildDiagnosticPayload','collect'],['showErrorModal','modalSync']]){
    replace(`function ${name}(`,`function ${name}(...args) { return globalThis.__nokReportProbe.measure('${metric}', () => {
      const result=__nokProbe_${name}(...args);
      ${name==='showErrorModal'?"globalThis.__nokReportProbe.roots.push(new WeakRef(document.getElementById('pvc-error-modal')));":''}
      return result;
    }); }
  function __nokProbe_${name}(`);
  }
  replace('const updatePayloadJson = () => {',"const updatePayloadJson = () => globalThis.__nokReportProbe.measure('jsonOptions', () => {");
  replace('return JSON.stringify(payload, null, 2);\n    };',"return globalThis.__nokReportProbe.measure('stringify', () => JSON.stringify(payload, null, 2));\n    });");
  replace('const refreshLinks = () => {',"const refreshLinks = () => globalThis.__nokReportProbe.measure('previewAndLinks', () => {");
  replace("};\n\n    feedbackInput.addEventListener('input'", "});\n\n    feedbackInput.addEventListener('input'");
  return `;(${installReportProbe})();\n`+source;
}
module.exports={installReportProbe,instrumentReportSource};
