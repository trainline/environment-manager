"use strict";

let should = require("should");
let path = require('path');
let renderer = require("modules/renderer");

describe("compiling Linux and Windows userdata", () => {

  it("should be possible to build Windows userdata", () => {

    // Arrange
    var userData = {
      EnvironmentType: "<EnvironmentType>",
      Environment: "<Environment>",
      SecurityZone: "<SecurityZone>",
      OwningCluster: "<OwningCluster>",
      Role: "<Role>",
      ContactEmail: "<ContactEmail>",
      ProjectCode: "<ProjectCode>",
      RemovalDate: "<RemovalDate>",
      PuppetRole: "<PuppetRole>"
    };

    var expectedResult = `<script>
Powershell.exe -executionpolicy remotesigned -File C:\\TTLApps\\ttl-appbootstrapper\\configure.ps1
</script>
##Creator:<ContactEmail>
##Environment:<Environment>
##Owner:<OwningCluster>
##Role:<Role>
##PuppetRole:<PuppetRole>
##DeploymentMaps:[]
##OwningCluster:<OwningCluster>
##EnvironmentType:<EnvironmentType>
##SecurityZone:<SecurityZone>
##ContactEmail:<ContactEmail>
##ProjectCode:<ProjectCode>
##RemovalDate:<RemovalDate>
<persist>true</persist>
`;

    // Act
    var target = require("modules/provisioning/launchConfiguration/UserDataBuilder");
    var promise = target.buildWindowsUserData(userData);

    // Assert
    return promise.then(result => {
      should(result).not.be.undefined();
      should(new Buffer(result, "base64").toString()).be.equal(expectedResult);
      should(result).be.equal(new Buffer(expectedResult).toString("base64"));
    });

  });

  context("When a puppet role is supplied", function() {
    // Arrange
    let userData = {
      EnvironmentType: "<EnvironmentType>",
      Environment: "<Environment>",
      SecurityZone: "<SecurityZone>",
      OwningCluster: "<OwningCluster>",
      Role: "<Role>",
      ContactEmail: "<ContactEmail>",
      ProjectCode: "<ProjectCode>",
      PuppetRole: "<PuppetRole>"
    };

    it("should be possible to build Linux userdata", () => {

      var expectedResult = `#!/bin/bash -xe
/etc/puppet/tools/machine_boot -t name=,environmenttype=<EnvironmentType>,environment=<Environment>,securityzone=<SecurityZone>,owningcluster=<OwningCluster>,role=<Role>,contactemail=<ContactEmail>,projectcode=<ProjectCode> -r <PuppetRole> > /tmp/machine_boot.log
`;

      // Act
      var target = require("modules/provisioning/launchConfiguration/UserDataBuilder");
      var promise = target.buildLinuxUserData(userData);

      // Assert
      return promise.then(result => {
        should(result).not.be.undefined();
        should(new Buffer(result, "base64").toString()).be.equal(expectedResult);
        should(result).be.equal(new Buffer(expectedResult).toString("base64"));
      });
    });
  });

  context("When a puppet role is not supplied", function() {
    // Arrange
    let userData = {
      EnvironmentType: "<EnvironmentType>",
      Environment: "<Environment>",
      SecurityZone: "<SecurityZone>",
      OwningCluster: "<OwningCluster>",
      Role: "<Role>",
      ContactEmail: "<ContactEmail>",
      ProjectCode: "<ProjectCode>",
      PuppetRole: ""
    };

    it("Linux userdata should not contain an empty '-r' option", () => {

      // Act
      var target = require("modules/provisioning/launchConfiguration/UserDataBuilder");
      var promise = target.buildLinuxUserData(userData);

      // Assert
      return promise.then(result => new Buffer(result, "base64").toString()).should.finally.not.match(/-r\s+[>-]\s+/);
    });
  });
});
