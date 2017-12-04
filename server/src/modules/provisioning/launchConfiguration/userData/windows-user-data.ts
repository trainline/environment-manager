import IUserDataParameters from "../../../../models/UserDataParameters";

function createUserData({
  ContactEmail,
  Environment,
  EnvironmentType,
  OwningCluster,
  ProjectCode,
  PuppetRole,
  RemovalDate,
  Role,
  SecurityZone,
}: IUserDataParameters & { RemovalDate: string }): string {
  return `<powershell>
if(test-path "C:\TTLApps\ttl-appbootstrapper\configure.ps1"){
	Powershell.exe -executionpolicy remotesigned -File C:\TTLApps\ttl-appbootstrapper\configure.ps1
} else {
	Powershell.exe -executionpolicy remotesigned -File C:\TTLApps\initial-boot.ps1
}
</powershell>
##Creator:${ContactEmail}
##Environment:${Environment}
##Owner:${OwningCluster}
##Role:${Role}
##PuppetRole:${PuppetRole}
##DeploymentMaps:[]
##OwningCluster:${OwningCluster}
##EnvironmentType:${EnvironmentType}
##SecurityZone:${SecurityZone}
##ContactEmail:${ContactEmail}
##ProjectCode:${ProjectCode}
##RemovalDate:${RemovalDate}`;
}

export {createUserData};
