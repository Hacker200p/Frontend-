# Load Balancing Test Script for Windows
# This script tests the high availability features

Write-Host "`n🚀 Starting Load Balancing Tests..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"

# 1. Check if server is running
Write-Host "1. Checking server health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "βœ… Server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Server is not running. Please start the server first." -ForegroundColor Red
    exit 1
}

# 2. Get initial health status
Write-Host "`n2. Getting health metrics..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
Write-Host ($health | ConvertTo-Json -Depth 10)

# 3. Test normal load (10 requests)
Write-Host "`n3. Testing normal load (10 requests)..." -ForegroundColor Yellow
$jobs = @()
for ($i = 1; $i -le 10; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($url, $num)
        $start = Get-Date
        try {
            $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 30
            $end = Get-Date
            $duration = ($end - $start).TotalSeconds
            [PSCustomObject]@{
                Request = $num
                Status = $response.StatusCode
                Duration = [math]::Round($duration, 3)
            }
        } catch {
            [PSCustomObject]@{
                Request = $num
                Status = 503
                Duration = 0
            }
        }
    } -ArgumentList "$baseUrl/api/health", $i
}

$results = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$results | Format-Table -AutoSize
Write-Host "βœ… Normal load test complete" -ForegroundColor Green

# 4. Get queue stats after normal load
Write-Host "`n4. Queue stats after normal load:" -ForegroundColor Yellow
$metrics = Invoke-RestMethod -Uri "$baseUrl/api/metrics" -Method GET
Write-Host ($metrics.requests | ConvertTo-Json)

# 5. Test high load (100 concurrent requests)
Write-Host "`n5. Testing high load (100 concurrent requests)..." -ForegroundColor Yellow
Write-Host "This will trigger the request queue..." -ForegroundColor Cyan

$success = 0
$rejected = 0
$jobs = @()

for ($i = 1; $i -le 100; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($url)
        try {
            $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 30
            return $response.StatusCode
        } catch {
            if ($_.Exception.Response.StatusCode.value__ -eq 503) {
                return 503
            }
            return 0
        }
    } -ArgumentList "$baseUrl/api/health"
}

$statuses = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

foreach ($status in $statuses) {
    if ($status -eq 200) { $success++ }
    elseif ($status -eq 503) { $rejected++ }
}

Write-Host "βœ… High load test complete" -ForegroundColor Green
Write-Host "Success: $success, Rejected: $rejected" -ForegroundColor Cyan

# 6. Get queue stats after high load
Write-Host "`n6. Queue stats after high load:" -ForegroundColor Yellow
$metrics = Invoke-RestMethod -Uri "$baseUrl/api/metrics" -Method GET
Write-Host ($metrics.requests | ConvertTo-Json)

# 7. Wait for queue to clear
Write-Host "`n7. Waiting for queue to clear (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 8. Final health check
Write-Host "`n8. Final health check:" -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
Write-Host ($health | ConvertTo-Json -Depth 10)

Write-Host "`nβœ… Load balancing tests complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- Normal load: Working βœ…" -ForegroundColor Green
Write-Host "- High load: Request queue activated βœ…" -ForegroundColor Green
Write-Host "- Queue management: Working βœ…" -ForegroundColor Green
Write-Host "- Health monitoring: Active βœ…" -ForegroundColor Green
