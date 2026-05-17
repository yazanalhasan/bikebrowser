param(
  [int]$PingCount = 200,
  [int]$UploadBytes = 50000000,
  [int]$DownloadBytes = 50000000,
  [string]$Gateway = "",
  [string]$OutDir = ""
)

$ErrorActionPreference = "Continue"

function New-ReportDir {
  param([string]$Requested)
  if ($Requested) {
    New-Item -ItemType Directory -Force -Path $Requested | Out-Null
    return (Resolve-Path $Requested).Path
  }
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $path = Join-Path (Resolve-Path ".").Path "reports\network\$stamp"
  New-Item -ItemType Directory -Force -Path $path | Out-Null
  return $path
}

function Write-Section {
  param([string]$Title)
  "`n=== $Title ==="
}

function Invoke-Logged {
  param(
    [string]$Name,
    [scriptblock]$Script
  )
  $file = Join-Path $script:ReportDir "$Name.txt"
  & $Script 2>&1 | Tee-Object -FilePath $file
}

function Measure-DnsQuery {
  param([string]$Server, [string]$Name)
  $sw = [Diagnostics.Stopwatch]::StartNew()
  try {
    $result = Resolve-DnsName $Name -Server $Server -Type A -ErrorAction Stop |
      Where-Object IPAddress |
      Select-Object -First 3 -ExpandProperty IPAddress
    $sw.Stop()
    [pscustomobject]@{
      Server = $Server
      Name = $Name
      Ms = $sw.ElapsedMilliseconds
      Result = ($result -join ", ")
      Error = ""
    }
  } catch {
    $sw.Stop()
    [pscustomobject]@{
      Server = $Server
      Name = $Name
      Ms = $sw.ElapsedMilliseconds
      Result = ""
      Error = $_.Exception.Message
    }
  }
}

function Test-TcpPortFast {
  param([string]$Ip, [int]$Port, [int]$TimeoutMs = 700)
  $client = [Net.Sockets.TcpClient]::new()
  try {
    $iar = $client.BeginConnect($Ip, $Port, $null, $null)
    if (-not $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) { return $false }
    $client.EndConnect($iar)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function New-UploadPayload {
  param(
    [int64]$RequestedBytes,
    [string]$ReportDir
  )

  $attemptSizes = @(
    $RequestedBytes,
    [Math]::Min($RequestedBytes, 134217728),
    [Math]::Min($RequestedBytes, 67108864),
    [Math]::Min($RequestedBytes, 33554432)
  ) | Where-Object { $_ -gt 0 } | Select-Object -Unique

  $log = Join-Path $ReportDir "payload-allocation.log"
  $tempRoots = @($env:TEMP, "$env:LOCALAPPDATA\Temp") |
    Where-Object { $_ -and (Test-Path $_) } |
    Select-Object -Unique

  foreach ($root in $tempRoots) {
    foreach ($size in $attemptSizes) {
      $path = Join-Path $root "network-upload-$([guid]::NewGuid()).bin"
      try {
        "Attempting payload: path=$path bytes=$size" | Add-Content -Encoding UTF8 $log
        $bufferSize = 1048576
        $buffer = New-Object byte[] $bufferSize
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($buffer)
        $stream = [System.IO.FileStream]::new(
          $path,
          [System.IO.FileMode]::CreateNew,
          [System.IO.FileAccess]::Write,
          [System.IO.FileShare]::None,
          $bufferSize,
          [System.IO.FileOptions]::SequentialScan
        )
        try {
          $remaining = [int64]$size
          while ($remaining -gt 0) {
            $write = [int][Math]::Min($bufferSize, $remaining)
            $stream.Write($buffer, 0, $write)
            $remaining -= $write
          }
        } finally {
          $stream.Dispose()
          $rng.Dispose()
        }
        "Payload created: path=$path bytes=$size" | Add-Content -Encoding UTF8 $log
        return [pscustomobject]@{ Path = $path; Bytes = [int64]$size }
      } catch {
        "Payload allocation failed: path=$path bytes=$size error=$($_.Exception.Message)" |
          Add-Content -Encoding UTF8 $log
        Remove-Item $path -Force -ErrorAction SilentlyContinue
      }
    }
  }

  "All payload allocation attempts failed; upload tests will be skipped, analysis continues." |
    Add-Content -Encoding UTF8 $log
  return $null
}

$script:ReportDir = New-ReportDir $OutDir
$summaryFile = Join-Path $script:ReportDir "summary.txt"

$activeConfig = Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
  Select-Object -First 1
if (-not $Gateway -and $activeConfig) {
  $Gateway = $activeConfig.IPv4DefaultGateway.NextHop
}
if (-not $Gateway) {
  $Gateway = "192.168.68.1"
}

Write-Section "Network Diagnostics"
"Output: $script:ReportDir"
"Gateway: $Gateway"
"PingCount: $PingCount"
"DownloadBytes: $DownloadBytes"
"UploadBytes: $UploadBytes"

Invoke-Logged "inventory" {
  Write-Section "Get-NetAdapter"
  Get-NetAdapter | Format-List *
  Write-Section "Get-NetIPConfiguration"
  Get-NetIPConfiguration | Format-List *
  Write-Section "Get-DnsClientServerAddress"
  Get-DnsClientServerAddress | Format-List *
  Write-Section "netsh wlan show interfaces"
  netsh wlan show interfaces
  Write-Section "netsh wlan show drivers"
  netsh wlan show drivers
  Write-Section "netsh wlan show networks mode=bssid"
  netsh wlan show networks mode=bssid
}

Invoke-Logged "tcp-settings" {
  Write-Section "netsh int tcp show global"
  netsh int tcp show global
  Write-Section "Get-NetTCPSetting"
  Get-NetTCPSetting | Format-List *
}

Invoke-Logged "dns" {
  Write-Section "Current resolver"
  Resolve-DnsName google.com
  Resolve-DnsName cloudflare.com
  nslookup google.com
  nslookup pi.hole
  Write-Section "Resolver timing matrix"
  $servers = @($Gateway, "68.105.28.11", "68.105.29.11", "68.105.28.12", "1.1.1.1", "8.8.8.8", "9.9.9.9") |
    Where-Object { $_ } |
    Select-Object -Unique
  $names = @("google.com", "cloudflare.com", "github.com", "microsoft.com", "pi.hole", "doubleclick.net")
  $rows = foreach ($server in $servers) {
    foreach ($name in $names) {
      Measure-DnsQuery -Server $server -Name $name
    }
  }
  $rows | Format-Table -Auto
  $rows | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $script:ReportDir "dns.json")
}

Invoke-Logged "pihole-lan-scan" {
  Write-Section "ARP cache"
  arp -a
  Write-Section "Fast TCP probes for DNS and web admin ports"
  $ips = (arp -a |
    Select-String -Pattern "^\s+(\d+\.\d+\.\d+\.\d+)\s+" |
    ForEach-Object { $_.Matches[0].Groups[1].Value }) |
    Sort-Object -Unique
  if ($Gateway -and $ips -notcontains $Gateway) { $ips = @($Gateway) + $ips }
  $rows = foreach ($ip in $ips) {
    [pscustomobject]@{
      IP = $ip
      DNS53 = Test-TcpPortFast $ip 53
      HTTP80 = Test-TcpPortFast $ip 80
      HTTPS443 = Test-TcpPortFast $ip 443
    }
  }
  $rows | Format-Table -Auto
  $rows | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $script:ReportDir "pihole-lan-scan.json")
}

Invoke-Logged "idle-ping-gateway" { ping $Gateway -n $PingCount }
Invoke-Logged "idle-ping-cloudflare" { ping 1.1.1.1 -n $PingCount }
Invoke-Logged "idle-ping-google" { ping 8.8.8.8 -n $PingCount }

Invoke-Logged "trace" {
  Write-Section "tracert 1.1.1.1"
  tracert -d 1.1.1.1
  Write-Section "tracert google.com"
  tracert google.com
  Write-Section "pathping 1.1.1.1"
  pathping -n -q 25 -w 500 1.1.1.1
}

Invoke-Logged "throughput-download" {
  $urls = @(
    "https://speed.cloudflare.com/__down?bytes=$DownloadBytes",
    "https://proof.ovh.net/files/10Mb.dat",
    "https://speed.hetzner.de/10MB.bin",
    "https://download.microsoft.com/download/8/8/5/885c7af0-873a-4a9f-b7c5-0f64b3b59588/VC_redist.x64.exe"
  )
  foreach ($url in $urls) {
    Write-Section "curl download $url"
    curl.exe -L -o NUL -w "url=$url total=%{time_total}s speed_download=%{speed_download}Bps dns=%{time_namelookup}s connect=%{time_connect}s tls=%{time_appconnect}s ttfb=%{time_starttransfer}s remote=%{remote_ip}`n" $url
  }
}

Invoke-Logged "load-download-latency" {
  $url = "https://speed.cloudflare.com/__down?bytes=$DownloadBytes"
  Write-Section "Download load latency"
  $downloadJob = Start-Job -ScriptBlock { param($u) curl.exe -L -o NUL $u 2>$null } -ArgumentList $url
  Start-Sleep -Seconds 2
  $gatewayPing = Start-Job -ScriptBlock { param($g) ping $g -n 50 } -ArgumentList $Gateway
  $internetPing = Start-Job -ScriptBlock { ping 1.1.1.1 -n 50 }
  Wait-Job @($gatewayPing, $internetPing) -Timeout 90 | Out-Null
  Write-Section "Gateway ping during download"
  Receive-Job $gatewayPing
  Write-Section "Internet ping during download"
  Receive-Job $internetPing
  Wait-Job $downloadJob -Timeout 120 | Out-Null
  Receive-Job $downloadJob | Out-Null
  Remove-Job @($downloadJob, $gatewayPing, $internetPing) -Force -ErrorAction SilentlyContinue
}

Invoke-Logged "throughput-upload" {
  $payload = New-UploadPayload -RequestedBytes $UploadBytes -ReportDir $script:ReportDir
  if (-not $payload) {
    "Upload throughput skipped: payload allocation failed."
  } else {
    try {
      "Using payload: $($payload.Path) bytes=$($payload.Bytes)"
      curl.exe -X POST --data-binary "@$($payload.Path)" -o NUL -w "url=https://speed.cloudflare.com/__up total=%{time_total}s speed_upload=%{speed_upload}Bps dns=%{time_namelookup}s connect=%{time_connect}s tls=%{time_appconnect}s ttfb=%{time_starttransfer}s remote=%{remote_ip}`n" https://speed.cloudflare.com/__up
    } finally {
      Remove-Item $payload.Path -Force -ErrorAction SilentlyContinue
    }
  }
}

Invoke-Logged "load-upload-latency" {
  $payload = New-UploadPayload -RequestedBytes $UploadBytes -ReportDir $script:ReportDir
  if (-not $payload) {
    "Upload load latency skipped: payload allocation failed. Analysis continues."
  } else {
    try {
    Write-Section "Upload load latency"
    "Using payload: $($payload.Path) bytes=$($payload.Bytes)"
    $uploadJob = Start-Job -ScriptBlock { param($p) curl.exe -X POST --data-binary "@$p" -o NUL https://speed.cloudflare.com/__up 2>$null } -ArgumentList $payload.Path
    Start-Sleep -Seconds 2
    $gatewayPing = Start-Job -ScriptBlock { param($g) ping $g -n 50 } -ArgumentList $Gateway
    $internetPing = Start-Job -ScriptBlock { ping 1.1.1.1 -n 50 }
    Wait-Job @($gatewayPing, $internetPing) -Timeout 90 | Out-Null
    Write-Section "Gateway ping during upload"
    Receive-Job $gatewayPing
    Write-Section "Internet ping during upload"
    Receive-Job $internetPing
    Wait-Job $uploadJob -Timeout 180 | Out-Null
    Receive-Job $uploadJob | Out-Null
    Remove-Job @($uploadJob, $gatewayPing, $internetPing) -Force -ErrorAction SilentlyContinue
    } finally {
      Remove-Item $payload.Path -Force -ErrorAction SilentlyContinue
    }
  }
}

Invoke-Logged "local-congestion" {
  Write-Section "Top processes by TCP connection count"
  Get-NetTCPConnection |
    Group-Object OwningProcess |
    Sort-Object Count -Descending |
    Select-Object -First 30 @{n="PID";e={$_.Name}}, Count,
      @{n="Process";e={(Get-Process -Id ([int]$_.Name) -ErrorAction SilentlyContinue).ProcessName}} |
    Format-Table -Auto
  Write-Section "Established external TCP connections"
  Get-NetTCPConnection -State Established |
    ForEach-Object {
      $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
      [pscustomobject]@{
        Local = "$($_.LocalAddress):$($_.LocalPort)"
        Remote = "$($_.RemoteAddress):$($_.RemotePort)"
        PID = $_.OwningProcess
        Process = $p.ProcessName
      }
    } |
    Sort-Object Process, Remote |
    Format-Table -Auto
  Write-Section "Network interface byte counters"
  Get-NetAdapterStatistics | Format-List *
}

"Report directory: $script:ReportDir" | Set-Content -Encoding UTF8 $summaryFile
"Completed: $(Get-Date -Format o)" | Add-Content -Encoding UTF8 $summaryFile
"Network diagnostic capture complete. Raw files are in $script:ReportDir"
