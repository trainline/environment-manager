"use strict";

let should = require("should");
let sinon = require("sinon");
let proxyquire = require('proxyquire');

describe("LaunchConfigurationTemplatesProvider:", () => {

  var accountName = "Sandbox";

  var expectedLaunchConfigurationName = "launch-configuration-name";
  var expectedKeyName = "key-name";
  var expectedIamInstanceProfileName = "instance-profile";
  var expectedSecurityGroups = ["sg-one", "sg-two"];
  var expectedDevices = { name: "/dev/sda1" };
  var expectedUserData = "user-data";

  var expectedImage = {
    name: "windows-2012r2-ttl-app-0.0.1",
    type: "windows-2012r2-ttl-app",
    version: "0.0.1",
    platform: "Windows"
  };

  let namingConventionProviderMock;
  let userDataProviderMock;
  let imageProviderMock;
  let keyNameProviderMock;
  let instanceDevicesProviderMock;
  let securityGroupsProviderMock;
  let iamInstanceProfileNameProviderMock;


  function getTemplate(configuration) {

    // Arrange
    namingConventionProviderMock = {
      getLaunchConfigurationName: sinon.stub().returns(expectedLaunchConfigurationName)
    };

    imageProviderMock = {
      get: sinon.stub().returns(Promise.resolve(expectedImage))
    };

    keyNameProviderMock = {
      get: sinon.stub().returns(Promise.resolve(expectedKeyName))
    };

    instanceDevicesProviderMock = {
      toAWS: sinon.stub().returns(Promise.resolve(expectedDevices))
    };

    userDataProviderMock = {
      get: sinon.stub().returns(Promise.resolve(expectedUserData))
    };

    securityGroupsProviderMock = {
      getFromConfiguration: sinon.stub().returns(Promise.resolve(expectedSecurityGroups))
    };

    iamInstanceProfileNameProviderMock = {
      get: sinon.stub().returns(Promise.resolve(expectedIamInstanceProfileName))
    };

    var mapStubs = {};
    mapStubs['modules/provisioning/namingConventionProvider'] = namingConventionProviderMock;
    mapStubs['modules/provisioning/launchConfiguration/imageProvider'] = imageProviderMock;
    mapStubs['modules/provisioning/launchConfiguration/keyNameProvider'] = keyNameProviderMock;
    mapStubs['modules/provisioning/launchConfiguration/instanceDevicesProvider'] = instanceDevicesProviderMock;
    mapStubs['modules/provisioning/launchConfiguration/userDataProvider'] = userDataProviderMock;
    mapStubs['modules/provisioning/launchConfiguration/securityGroupsProvider'] = securityGroupsProviderMock;
    mapStubs['modules/provisioning/launchConfiguration/iamInstanceProfileNameProvider'] = iamInstanceProfileNameProviderMock;
    var launchConfigurationTemplatesProvider = proxyquire('modules/provisioning/launchConfigurationTemplatesProvider', mapStubs);


    // Act
    var target = launchConfigurationTemplatesProvider;

    return target.get(configuration, accountName);
  }


  describe("when server role does not create two different ASGs for blue/green deployment", () => {

    var configuration = {
      environmentName: "pr1",
      serverRole: {
        ServerRoleName: "Web",
        FleetPerSlice: false,
        InstanceType: "t2.medium",
        AMI: "windows-2012r2-ttl-app",
        Volumes: ['a', 'b'],
      },
      cluster: {
        Name: "Tango"
      }
    };

    it("should be possible to abtain a single LaunchConfiguration template", () => {

      var promise = getTemplate(configuration);

      // Assert
      return promise.then(templates => {

        should(templates).be.Array();
        should(templates).have.length(1);

        should(templates).matchEach({
          launchConfigurationName: expectedLaunchConfigurationName,
          image: expectedImage,
          instanceType: configuration.serverRole.InstanceType,
          keyName: expectedKeyName,
          iamInstanceProfile: expectedIamInstanceProfileName,
          securityGroups: expectedSecurityGroups
        });

        namingConventionProviderMock.getLaunchConfigurationName.called.should.be.true();
        namingConventionProviderMock.getLaunchConfigurationName.getCall(0).args.should.match(
          [configuration]
        );

        imageProviderMock.get.called.should.be.true();
        imageProviderMock.get.getCall(0).args.should.match([configuration.serverRole.AMI]);

        keyNameProviderMock.get.called.should.be.true();
        keyNameProviderMock.get.getCall(0).args.should.match([configuration, accountName]);

        instanceDevicesProviderMock.toAWS.called.should.be.true();
        instanceDevicesProviderMock.toAWS.getCall(0).args.should.match([configuration.serverRole.Volumes]);

        userDataProviderMock.get.called.should.be.true();
        userDataProviderMock.get.getCall(0).args.should.match([configuration, expectedImage]);

        securityGroupsProviderMock.getFromConfiguration.called.should.be.true();
        securityGroupsProviderMock.getFromConfiguration.getCall(0).args.should.match([configuration, expectedImage, accountName]);

        iamInstanceProfileNameProviderMock.get.called.should.be.true();
        iamInstanceProfileNameProviderMock.get.getCall(0).args.should.match([configuration, accountName]);

      });

    });

  });

  describe("when server role creates two different ASGs for blue/green deployment", () => {

    var configuration = {
      environmentName: "pr1",
      serverRole: {
        ServerRoleName: "Web",
        FleetPerSlice: true,
        InstanceType: "t2.medium",
        AMI: "windows-2012r2-ttl-app"
      },
      cluster: {
        Name: "Tango"
      }
    };

    it("should be possible to obtain a couple of LaunchConfiguration templates", () => {

      var promise = getTemplate(configuration);

      // Assert
      return promise.then(templates => {

        should(templates).be.Array();
        should(templates).have.length(2);

        should(templates).matchEach({
          launchConfigurationName: expectedLaunchConfigurationName,
          image: expectedImage,
          instanceType: configuration.serverRole.InstanceType,
          keyName: expectedKeyName,
          iamInstanceProfile: expectedIamInstanceProfileName,
          securityGroups: expectedSecurityGroups
        });

        namingConventionProviderMock.getLaunchConfigurationName.called.should.be.true();

        namingConventionProviderMock.getLaunchConfigurationName.getCall(0).args.should.match(
          [configuration, "blue"]
        );

        namingConventionProviderMock.getLaunchConfigurationName.getCall(1).args.should.match(
          [configuration, "green"]
        );

        userDataProviderMock.get.getCall(0).args.should.match([configuration, expectedImage, "blue"]);
        userDataProviderMock.get.getCall(1).args.should.match([configuration, expectedImage, "green"]);

      });

    });

  });

  describe("when target environment type is production", () => {

    var configuration = {
      environmentName: "pr1",
      environmentTypeName: "Prod",
      serverRole: { },
      cluster: {
        Name: "Tango"
      }
    };

    it("detailed monitoring should be enabled", () => {

      var promise = getTemplate(configuration);

      // Assert
      return promise.then(templates => {

        templates.should.matchEach({
          detailedMonitoring: true
        });

      });

    });

  });

  describe("when target environment type is not production", () => {

    var configuration = {
      environmentName: "c01",
      environmentTypeName: "Cluster",
      serverRole: { },
      cluster: {
        Name: "Tango"
      }
    };

    it("detailed monitoring should be disabled", () => {

      var promise = getTemplate(configuration);

      // Assert
      return promise.then(templates => {

        templates.should.matchEach({
          detailedMonitoring: false
        });

      });

    });

  });

});
