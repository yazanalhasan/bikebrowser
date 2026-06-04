[CmdletBinding()]
param(
    [string]$ComfyRoot = "C:\AI\ComfyUI",
    [string]$Url = "http://127.0.0.1:8188"
)

$ErrorActionPreference = "Stop"

$stats = Invoke-RestMethod -Uri "$Url/system_stats" -TimeoutSec 20
$ckptInfo = Invoke-RestMethod -Uri "$Url/object_info/CheckpointLoaderSimple" -TimeoutSec 20

[pscustomobject]@{
    Url = $Url
    ComfyRoot = $ComfyRoot
    Version = $stats.system.comfyui_version
    Python = $stats.system.python_version
    Pytorch = $stats.system.pytorch_version
    Devices = ($stats.devices | ForEach-Object { "$($_.index): $($_.name)" }) -join "; "
    Checkpoints = ($ckptInfo.CheckpointLoaderSimple.input.required.ckpt_name[0]) -join "; "
    OutputExists = Test-Path -LiteralPath (Join-Path $ComfyRoot "output")
    CustomNodesExists = Test-Path -LiteralPath (Join-Path $ComfyRoot "custom_nodes")
}
