. "$PSScriptRoot\ScriptArguments.ps1"

#AWS DEPLOYMENT DETAILS
$ApplicationId=$env:APPLICATION_ID
$LifeCycleEvent=$env:LIFECYCLE_EVENT
$DeploymentId=$env:DEPLOYMENT_ID
$DeploymentBaseDirectory=$env:DEPLOYMENT_BASE_DIR
Set-StrictMode -Version Latest
$errorLevel=0

function Execute-Stage($label, $batchFile) {
  cd $DeploymentBaseDirectory
  $role = $DeploymentMapName.split('.')[-1]
  $stageBatchFile = [io.path]::combine($DeploymentBaseDirectory, "DM", $role, $batchFile)
  Write-Output "Will run $stageBatchFile at $(Get-Date)"
  & $stageBatchFile 2>&1 | Write-Output
  if($LastExitCode -ne 0){
    throw ("ERROR: $($DeploymentMapName).$($DeploymentMapVersion) FAILED in $($label) stage.")
  }
}
