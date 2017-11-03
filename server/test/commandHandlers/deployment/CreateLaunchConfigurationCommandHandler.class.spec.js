/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sinon = require('sinon');
const proxyquire = require('proxyquire');
let _ = require('lodash');

describe('CreateLaunchConfigurationCommandHandler:', () => {
  const ACCOUNT_NAME = 'Prod';


  let launchConfigurationTemplate = {
    launchConfigurationName: 'launch-configuration',
    image: {
      name: 'windows-2012r2-ttl-app-0.0.1',
      type: 'windows-2012r2-ttl-app',
      version: '0.0.1',
      platform: 'Windows'
    },
    instanceType: 't2.small',
    keyName: 'ProdInfra',
    iamInstanceProfile: 'roleTangoWeb',
    securityGroups: [{ GroupId: 'sg-one' }, { GroupId: 'sg-two' }],
    devices: [
      {
        DeviceName: '/dev/sda1',
        Ebs: {
          DeleteOnTermination: true,
          VolumeSize: 50,
          VolumeType: 'gp2'
        }
      },
      {
        DeviceName: '/dev/sda2',
        Ebs: {
          DeleteOnTermination: true,
          VolumeSize: 30,
          VolumeType: 'standard',
          Encrypted: true
        }
      }
    ],
    userData: new Buffer('content').toString('base64')
  };

  it('should be possible to request a LaunchConfiguration creation', () => {
    // Arrange
    let launchConfigurationClientMock = {
      post: sinon.stub().returns(Promise.resolve())
    };

    let launchConfigurationResourceFactory = {
      create: sinon.stub().returns(Promise.resolve(launchConfigurationClientMock))
    };

    let command = {
      name: 'CreateLaunchConfiguration',
      accountName: ACCOUNT_NAME,
      template: launchConfigurationTemplate
    };

    // Act
    let CreateLaunchConfigurationCommandHandler = proxyquire('../../../commands/deployments/CreateLaunchConfiguration', {
      '../../modules/resourceFactories/launchConfigurationResourceFactory': launchConfigurationResourceFactory
    });
    let promise = CreateLaunchConfigurationCommandHandler(command);

    // Assert
    return promise.then(() => {
      sinon.assert.calledOnce(launchConfigurationResourceFactory.create);
      sinon.assert.calledWithExactly(launchConfigurationResourceFactory.create, undefined, { accountName: ACCOUNT_NAME });
      launchConfigurationClientMock.post.called.should.be.true();
      launchConfigurationClientMock.post.getCall(0).args[0].should.match({
        LaunchConfigurationName: launchConfigurationTemplate.launchConfigurationName,
        AssociatePublicIpAddress: false,
        ImageId: launchConfigurationTemplate.image.id,
        InstanceType: launchConfigurationTemplate.instanceType,
        KeyName: launchConfigurationTemplate.keyName,
        IamInstanceProfile: launchConfigurationTemplate.iamInstanceProfile,
        SecurityGroups: _.map(launchConfigurationTemplate.securityGroups, 'GroupId'),
        UserData: launchConfigurationTemplate.userData,
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/sda1',
            Ebs: {
              DeleteOnTermination: true,
              VolumeSize: 50,
              VolumeType: 'gp2'
            }
          },
          {
            DeviceName: '/dev/sda2',
            Ebs: {
              DeleteOnTermination: true,
              VolumeSize: 30,
              VolumeType: 'standard',
              Encrypted: true
            }
          }
        ]
      });
    });
  });
});

