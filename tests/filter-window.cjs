// Measurement validity is separate from performance: dropped frames never invalidate a sample.
function filterWindowProblems(video,drag,expectedFilter){
  const problems=[];
  if(drag?!(video.styleWrites>0):video.initialFilter!==expectedFilter||video.filter!==expectedFilter)problems.push('filter-not-applied');
  if(!video.sourceStable)problems.push('source-changed');
  if(video.visibility!=='visible')problems.push('hidden');
  if(video.paused||video.rate!==1||!(video.mediaSeconds>4)||!(video.totalFrames>=60))problems.push('playback-not-comparable');
  if(video.waitingEvents!==0||video.minimumReadyState<2)problems.push('buffering');
  return problems;
}
module.exports={filterWindowProblems};
