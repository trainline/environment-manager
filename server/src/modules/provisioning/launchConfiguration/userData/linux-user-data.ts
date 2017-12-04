import IUserDataParameters from "../../../../models/UserDataParameters";

function createUserData({
  ContactEmail,
  Environment,
  EnvironmentType,
  OwningCluster,
  ProjectCode,
  PuppetRole,
  Role,
  SecurityZone,
}: IUserDataParameters): string {
return `#!/bin/bash -xe
/etc/puppet/tools/machine_boot -t name=,environmenttype=${EnvironmentType},environment=${Environment},securityzone=${SecurityZone},owningcluster=${OwningCluster},role=${Role},contactemail=${ContactEmail},projectcode=${ProjectCode} ${PuppetRole} > /tmp/machine_boot.log`; // tslint:disable-line max-line-length
}

export {createUserData};
