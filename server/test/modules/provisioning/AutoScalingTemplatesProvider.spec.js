/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require("should");
let sinon = require("sinon");
let rewire = require('rewire');
const autoScalingTemplatesProvider = rewire('modules/provisioning/autoScalingTemplatesProvider');

describe("AutoScalingTemplatesProvider:", () => {

  var expectedAutoScalingGroupName = "auto-scaling-group";

  var expectedLaunchConfigurationName = "launch-configuration";  

  var expectedSubnets = ["subnet-a", "subnet-b"];

  var expectedTags = { EnvironmentName: "pr1" };

  var expectedTopicNotificationMapping = [
    {
      topicArn: "arn:aws:sns:eu-west-1:000000000001:InfraAsgLambdaScale",
      notificationTypes: []
    }
  ]; 

  var expectedLifecycleHooks = [
    {
      name: "10min-draining"
    }
  ]; 

  describe("when server role does not create two different ASGs for blue/green deployment", () => {

    var configuration = {
      environmentName: "pr1",
      serverRole: {
        ServerRoleName: "Web",
        FleetPerSlice: false,
        AutoScalingSettings: {
          MinCapacity: 1,
          DesiredCapacity: 2,
          MaxCapacity: 3
        }
      },
      cluster: {
        Name: "Tango",
        ShortName: "TA"
      }
    };

    var accountName = "Prod";

    it("should be possible to abtain a single ASG template", () => {

      // Arrange
      var lifecycleHooksProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedLifecycleHooks))
      };

      var topicNotificationMappingProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedTopicNotificationMapping))
      };

      var namingConventionProviderMock = {
        getAutoScalingGroupName: sinon.stub().returns(expectedAutoScalingGroupName),
        getLaunchConfigurationName: sinon.stub().returns(expectedLaunchConfigurationName)
      };

      var subnetsProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedSubnets))
      };

      var tagsProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedTags))
      };

      // Act
      autoScalingTemplatesProvider.__set__({
        topicNotificationMappingProvider: topicNotificationMappingProviderMock,
        namingConventionProvider: namingConventionProviderMock,
        lifecycleHooksProvider: lifecycleHooksProviderMock,
        subnetsProvider: subnetsProviderMock,
        tagsProvider: tagsProviderMock,
      })
      var target = autoScalingTemplatesProvider;

      var promise = target.get(configuration, accountName);

      // Assert
      return promise.then(templates => {

        should(templates).be.Array();
        should(templates).have.length(1);

        should(templates).matchEach({
          autoScalingGroupName: expectedAutoScalingGroupName,
          launchConfigurationName: expectedLaunchConfigurationName,
          size: {
            min: 1,
            desired: 2,
            max: 3
          },
          subnets: expectedSubnets,
          tags: expectedTags,
          topicNotificationMapping: expectedTopicNotificationMapping,
          lifecycleHooks: expectedLifecycleHooks
        });

        topicNotificationMappingProviderMock.get.called.should.be.true();
        topicNotificationMappingProviderMock.get.getCall(0).args.should.match([accountName]);

        lifecycleHooksProviderMock.get.called.should.be.true();
        lifecycleHooksProviderMock.get.getCall(0).args.should.match([accountName]);

        namingConventionProviderMock.getAutoScalingGroupName.called.should.be.true();
        namingConventionProviderMock.getAutoScalingGroupName.getCall(0).args.should.match(
          [configuration]
        );

        namingConventionProviderMock.getLaunchConfigurationName.called.should.be.true();
        namingConventionProviderMock.getLaunchConfigurationName.getCall(0).args.should.match(
          [configuration]
        );

        subnetsProviderMock.get.called.should.be.true();
        subnetsProviderMock.get.getCall(0).args[0].should.be.equal(configuration);

        tagsProviderMock.get.called.should.be.true();
        tagsProviderMock.get.getCall(0).args.should.match(
          [configuration]
        );

      });

    });

  });

  describe("when server role creates two different ASGs for blue/green deployment", () => {

    var configuration = {
      environmentName: "pr1",
      serverRole: {
        ServerRoleName: "Web",
        FleetPerSlice: true,
        AutoScalingSettings: {
          MinCapacity: 1,
          DesiredCapacity: 2,
          MaxCapacity: 3
        }
      },
      cluster: {
        Name: "Tango",
        ShortName: "TA"
      }
    };

    var accountName = "Prod";

    it("should be possible to abtain two ASG templates", () => {

      // Arrange
      var lifecycleHooksProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedLifecycleHooks))
      };

      var topicNotificationMappingProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedTopicNotificationMapping))
      };

      var namingConventionProviderMock = {
        getAutoScalingGroupName: sinon.stub().returns(expectedAutoScalingGroupName),
        getLaunchConfigurationName: sinon.stub().returns(expectedLaunchConfigurationName)
      };

      var subnetsProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedSubnets))
      };

      var tagsProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedTags))
      };

      // Act
      autoScalingTemplatesProvider.__set__({
        topicNotificationMappingProvider: topicNotificationMappingProviderMock,
        namingConventionProvider: namingConventionProviderMock,
        lifecycleHooksProvider: lifecycleHooksProviderMock,
        subnetsProvider: subnetsProviderMock,
        tagsProvider: tagsProviderMock,
      })
      var target = autoScalingTemplatesProvider;

      var promise = target.get(configuration, accountName);

      // Assert
      return promise.then(templates => {

        should(templates).be.Array();
        should(templates).have.length(2);

        should(templates).matchEach({
          autoScalingGroupName: expectedAutoScalingGroupName,
          launchConfigurationName: expectedLaunchConfigurationName,
          size: {
            min: 1,
            desired: 2,
            max: 3
          },
          subnets: expectedSubnets,
          tags: expectedTags,
          topicNotificationMapping: expectedTopicNotificationMapping,
          lifecycleHooks: expectedLifecycleHooks          
        });

        topicNotificationMappingProviderMock.get.called.should.be.true();
        topicNotificationMappingProviderMock.get.getCall(0).args.should.match([accountName]);

        lifecycleHooksProviderMock.get.called.should.be.true();
        lifecycleHooksProviderMock.get.getCall(0).args.should.match([accountName]);

        namingConventionProviderMock.getAutoScalingGroupName.called.should.be.true();

        namingConventionProviderMock.getAutoScalingGroupName.getCall(0).args.should.match(
          [configuration, "blue"]
        );

        namingConventionProviderMock.getAutoScalingGroupName.getCall(1).args.should.match(
          [configuration, "green"]
        );

        namingConventionProviderMock.getLaunchConfigurationName.called.should.be.true();

        namingConventionProviderMock.getLaunchConfigurationName.getCall(0).args.should.match(
          [configuration, "blue"]
        );

        namingConventionProviderMock.getLaunchConfigurationName.getCall(1).args.should.match(
          [configuration, "green"]
        );

        tagsProviderMock.get.called.should.be.true();
        tagsProviderMock.get.getCall(0).args.should.match([configuration, "blue"]);
        tagsProviderMock.get.getCall(1).args.should.match([configuration, "green"]);

      });

    });

  });

});
