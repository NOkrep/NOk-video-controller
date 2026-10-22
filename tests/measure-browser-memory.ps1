param([Parameter(Mandatory=$true)][int]$RootProcessId)
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
[pscustomobject]@{
    processCount = $testRows.Count
    workingSetBytes = [long](($testRows | Measure-Object WorkingSet64 -Sum).Sum)
    privateBytes = [long](($testRows | Measure-Object PrivateMemorySize64 -Sum).Sum)
} | ConvertTo-Json -Compress
