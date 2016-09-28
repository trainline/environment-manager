. "$PSScriptRoot\Include.ps1"

#TLPK Test
Write-Output "Starting $($MyInvocation.MyCommand.Name) at $(Get-Date)."

try
{
    Execute-Stage "Test" "test.bat"
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
