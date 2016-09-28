. "$PSScriptRoot\Include.ps1"

#TLPK Pre-Assert and Install

Write-Output "Starting $($MyInvocation.MyCommand.Name) at $(Get-Date)."

try
{
  Execute-Stage "Pre-Assert" "preassert.bat"
  Execute-Stage "Install" "install.bat"
  Write-Output "Finishing $($LifeCycleEvent) at $(Get-Date)"
}
catch
{
  $errorLevel = 1
  Write-Output "== Exception caught== $($_.Exception.Message)"
  Write-Output "DeploymentMapName = $DeploymentMapName"
  Write-Output "DeploymentMapVersion = $DeploymentMapVersion"
}
finally
{
  exit $errorLevel
}
