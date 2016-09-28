. "$PSScriptRoot\Include.ps1"

Write-Output "Starting $($MyInvocation.MyCommand.Name) at $(Get-Date)."

try
{
    Write-Output "Finishing $($LifeCycleEvent) at $(Get-Date)"
}
catch
{
	Write-Output "== Exception caught== $($_.Exception.Message)"
	Write-Output "DeploymentMapName = $DeploymentMapName"
	Write-Output "DeploymentMapVersion = $DeploymentMapVersion"
	$errorLevel = 1
}
finally
{
	exit $errorLevel
}
