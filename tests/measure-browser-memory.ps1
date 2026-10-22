param([Parameter(Mandatory=$true)][int]$RootProcessId, [switch]$PerProcess)
$ErrorActionPreference = 'Stop'
# Only the test-owned browser PID and its descendants; no user profiles or command lines.
$testProcessIds = [System.Collections.Generic.HashSet[int]]::new()
$testPending = [System.Collections.Generic.Queue[int]]::new()
$testPending.Enqueue($RootProcessId)
while ($testPending.Count -gt 0) {
    $testCurrent = $testPending.Dequeue()
    if (-not $testProcessIds.Add($testCurrent)) { continue }
    Get-CimInstance Win32_Process -Filter "ParentProcessId = $testCurrent" | ForEach-Object { $testPending.Enqueue([int]$_.ProcessId) }
}
$testRows = @($testProcessIds | ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })
$testResult = [ordered]@{
    processCount = $testRows.Count
    workingSetBytes = [long](($testRows | Measure-Object WorkingSet64 -Sum).Sum)
    privateBytes = [long](($testRows | Measure-Object PrivateMemorySize64 -Sum).Sum)
}
if ($PerProcess) {
    $testResult.rows = @($testRows | ForEach-Object {
        [pscustomobject]@{ id = $_.Id; privateBytes = $_.PrivateMemorySize64; workingSetBytes = $_.WorkingSet64 }
    })
}
$testResult | ConvertTo-Json -Depth 4 -Compress
