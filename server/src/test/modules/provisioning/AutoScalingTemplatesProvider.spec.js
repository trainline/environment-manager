/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
const inject = require('inject-loader!../../../modules/provisioning/autoScalingTemplatesProvider');

describe('AutoScalingTemplatesProvider:', () => {
  let expectedAutoScalingGroupName = 'auto-scaling-group';

  let expectedLaunchConfigurationName = 'launch-configuration';

  let expectedSubnets = ['subnet-a', 'subnet-b'];

  let expectedTags = { EnvironmentName: 'pr1' };

  let expectedTopicNotificationMapping = [
    {
      topicArn: 'arn:aws:sns:eu-west-1:000000000001:InfraAsgLambdaScale',
      notificationTypes: []
    }
  ];

  describe('when server role does not create two different ASGs for blue/green deployment', () => {
    let configuration = {
      environmentName: 'pr1',
      serverRole: {
        ServerRoleName: 'Web',
        FleetPerSlice: false,
        AutoScalingSettings: {
          MinCapacity: 1,
          DesiredCapacity: 2,
          MaxCapacity: 3
        }
      },
      cluster: {
        Name: 'Tango',
        ShortName: 'TA'
      }
    };

    let accountName = 'Prod';

    it('should be possible to abtain a single ASG template', () => {
      // Arrange
      let topicNotificationMappingProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedTopicNotificationMapping))
      };

      let namingConventionProviderMock = {
        getAutoScalingGroupName: sinon.stub().returns(expectedAutoScalingGroupName),
        getLaunchConfigurationName: sinon.stub().returns(expectedLaunchConfigurationName)
      };

      let subnetsProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedSubnets))
      };

      let tagsProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedTags))
      };

      // Act
      let target = inject({
        './autoScaling/topicNotificationMappingProvider': topicNotificationMappingProviderMock,
        './namingConventionProvider': namingConventionProviderMock,
        './autoScaling/subnetsProvider': subnetsProviderMock,
        './autoScaling/tagsProvider': tagsProviderMock
      });

      let promise = target.get(configuration, accountName);

      // Assert
      return promise.then((templates) => {
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
          topicNotificationMapping: expectedTopicNotificationMapping
        });

        topicNotificationMappingProviderMock.get.called.should.be.true();
        topicNotificationMappingProviderMock.get.getCall(0).args.should.match([accountName]);

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

  describe('when server role creates two different ASGs for blue/green deployment', () => {
    let configuration = {
      environmentName: 'pr1',
      serverRole: {
        ServerRoleName: 'Web',
        FleetPerSlice: true,
        AutoScalingSettings: {
          MinCapacity: 1,
          DesiredCapacity: 2,
          MaxCapacity: 3
        }
      },
      cluster: {
        Name: 'Tango',
        ShortName: 'TA'
      }
    };

    let accountName = 'Prod';

    it('should be possible to abtain two ASG templates', () => {
      // Arrange
      let topicNotificationMappingProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedTopicNotificationMapping))
      };

      let namingConventionProviderMock = {
        getAutoScalingGroupName: sinon.stub().returns(expectedAutoScalingGroupName),
        getLaunchConfigurationName: sinon.stub().returns(expectedLaunchConfigurationName)
      };

      let subnetsProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedSubnets))
      };

      let tagsProviderMock = {
        get: sinon.stub().returns(Promise.resolve(expectedTags))
      };

      // Act
      let target = inject({
        './autoScaling/topicNotificationMappingProvider': topicNotificationMappingProviderMock,
        './namingConventionProvider': namingConventionProviderMock,
        './autoScaling/subnetsProvider': subnetsProviderMock,
        './autoScaling/tagsProvider': tagsProviderMock
      });

      let promise = target.get(configuration, accountName);

      // Assert
      return promise.then((templates) => {
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
          topicNotificationMapping: expectedTopicNotificationMapping
        });

        topicNotificationMappingProviderMock.get.called.should.be.true();
        topicNotificationMappingProviderMock.get.getCall(0).args.should.match([accountName]);

        namingConventionProviderMock.getAutoScalingGroupName.called.should.be.true();

        namingConventionProviderMock.getAutoScalingGroupName.getCall(0).args.should.match(
          [configuration, 'blue']
        );

        namingConventionProviderMock.getAutoScalingGroupName.getCall(1).args.should.match(
          [configuration, 'green']
        );

        namingConventionProviderMock.getLaunchConfigurationName.called.should.be.true();

        namingConventionProviderMock.getLaunchConfigurationName.getCall(0).args.should.match(
          [configuration, 'blue']
        );

        namingConventionProviderMock.getLaunchConfigurationName.getCall(1).args.should.match(
          [configuration, 'green']
        );

        tagsProviderMock.get.called.should.be.true();
        tagsProviderMock.get.getCall(0).args.should.match([configuration, 'blue']);
        tagsProviderMock.get.getCall(1).args.should.match([configuration, 'green']);
      });
    });
  });
});

