param([Parameter(Mandatory=$true)][int]$RootProcessId,[int]$DurationSeconds=5)
$ErrorActionPreference='Stop'
function Get-TaskIds {
$taskIds=[System.Collections.Generic.HashSet[int]]::new()
$taskQueue=[System.Collections.Generic.Queue[int]]::new()
$taskQueue.Enqueue($RootProcessId)
while($taskQueue.Count -gt 0){
    $taskCurrent=$taskQueue.Dequeue()
    if(-not $taskIds.Add($taskCurrent)){continue}
    Get-CimInstance Win32_Process -Filter "ParentProcessId = $taskCurrent" | ForEach-Object { $taskQueue.Enqueue([int]$_.ProcessId) }
}
return ,$taskIds
}
$taskIds=Get-TaskIds
function Read-TaskCpu {
    $taskMap=@{}
    foreach($taskId in $taskIds){
        $taskProcess=Get-Process -Id $taskId -ErrorAction SilentlyContinue
        if($taskProcess){$taskMap[$taskId]=@{ ticks=$taskProcess.StartTime.Ticks; cpu=$taskProcess.TotalProcessorTime.TotalSeconds }}
    }
    return $taskMap
}
$taskBefore=Read-TaskCpu
$taskClock=[System.Diagnostics.Stopwatch]::StartNew()
$taskGpuSamples=[System.Collections.Generic.List[object]]::new()
$taskGpuAvailable=$false
$taskFilter=($taskIds | ForEach-Object { "Name LIKE 'pid[_]$($_)[_]%'" }) -join ' OR '
while($taskClock.Elapsed.TotalSeconds -lt $DurationSeconds){
    try{
        $taskRows=@(Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -Filter $taskFilter -OperationTimeoutSec 2 -ErrorAction Stop)
        $taskKinds=@{}
        foreach($taskRow in $taskRows){
            if($taskRow.Name -notmatch '^pid_(\d+)_'){continue}
            if(-not $taskIds.Contains([int]$Matches[1])){continue}
            $taskKind=if($taskRow.Name -match 'engtype_(3D|VideoDecode|VideoProcessing|Copy|Compute)'){$Matches[1]}else{'other'}
            if(-not $taskKinds.ContainsKey($taskKind)){$taskKinds[$taskKind]=0.0}
            $taskKinds[$taskKind]+=[double]$taskRow.UtilizationPercentage
        }
        if($taskRows.Count -gt 0){$taskGpuAvailable=$true}
        $taskGpuSamples.Add([pscustomobject]@{ elapsedSeconds=[math]::Round($taskClock.Elapsed.TotalSeconds,3); engines=$taskKinds })
    }catch{}
    Start-Sleep -Milliseconds 900
}
$taskAfter=Read-TaskCpu
$taskClock.Stop()
$taskFinalIds=Get-TaskIds
$taskCpu=0.0
$taskStable=($taskBefore.Count -eq $taskAfter.Count) -and $taskIds.SetEquals($taskFinalIds)
foreach($taskId in $taskBefore.Keys){
    if(-not $taskAfter.ContainsKey($taskId) -or $taskBefore[$taskId].ticks -ne $taskAfter[$taskId].ticks){$taskStable=$false;continue}
    $taskCpu += $taskAfter[$taskId].cpu-$taskBefore[$taskId].cpu
}
[pscustomobject]@{
    durationSeconds=$taskClock.Elapsed.TotalSeconds
    cpuSeconds=$taskCpu
    cpuCoreEquivalent=$taskCpu/$taskClock.Elapsed.TotalSeconds
    processSetStable=$taskStable
    gpuStatus=if($taskGpuAvailable){'observed'}else{'unavailable-or-not-observed'}
    gpuSamples=$taskGpuSamples
} | ConvertTo-Json -Depth 6 -Compress
