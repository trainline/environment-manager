/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const proxyquire = require('proxyquire').noCallThru();
require('should');
let sinon = require('sinon');

function createFixture() {
  let launchConfigurationClientMock = {
    post: sinon.stub().returns(Promise.resolve()),
    delete: sinon.stub().returns(Promise.resolve())
  };

  let autoScalingGroupClientMock = {
    put: sinon.stub().returns(Promise.resolve())
  };

  let asgResourceFactory = {
    create: sinon.stub().returns(Promise.resolve(autoScalingGroupClientMock))
  };

  let launchConfigurationResourceFactory = {
    create: sinon.stub().returns(Promise.resolve(launchConfigurationClientMock))
  };

  let sut = proxyquire('../../commands/launch-config/launchConfigUpdater', {
    '../../modules/resourceFactories/asgResourceFactory': asgResourceFactory,
    '../../modules/resourceFactories/launchConfigurationResourceFactory': launchConfigurationResourceFactory
  });

  return {
    asgResourceFactory,
    autoScalingGroupClientMock,
    launchConfigurationClientMock,
    launchConfigurationResourceFactory,
    sut
  };
}

describe('launchConfigUpdater: ', () => {
  let AccountName = 'Sandbox';
  let AutoScalingGroupName = 'pr1-ta-Web';
  function UpdateAction(launchConfiguration) { launchConfiguration.updated = true; }

  let expectedLaunchConfiguration = {
    LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web'
  };

  let autoScalingGroup = {
    getLaunchConfiguration: sinon.stub().returns(Promise.resolve(expectedLaunchConfiguration)),
    $autoScalingGroupName: AutoScalingGroupName
  };

  it('should create LaunchConfiguration and AutoScalingGroup clients by account', () => {
    let { asgResourceFactory, launchConfigurationResourceFactory, sut } = createFixture();
    return sut.set(AccountName, autoScalingGroup, UpdateAction).then(() => {
      sinon.assert.calledWithExactly(asgResourceFactory.create, undefined, { accountName: AccountName });
      sinon.assert.calledWithExactly(launchConfigurationResourceFactory.create, undefined, { accountName: AccountName });
    });
  });

  it('AutoScalingGroup LaunchConfiguration should be copied with a different name', () => {
    let { launchConfigurationClientMock, sut } = createFixture();
    return sut.set(AccountName, autoScalingGroup, UpdateAction).then(() => {
      sinon.assert.calledWith(launchConfigurationClientMock.post, sinon.match({
        LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web_Backup' }));
    });
  });

  it('AutoScalingGroup should be attached to the copied LaunchConfiguration', () => {
    let { autoScalingGroupClientMock, sut } = createFixture();
    return sut.set(AccountName, autoScalingGroup, UpdateAction).then(() => {
      sinon.assert.calledWith(autoScalingGroupClientMock.put, sinon.match({
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web_Backup' }));
    });
  });

  it('Original LaunchConfiguration should be deleted', () => {
    let { launchConfigurationClientMock, sut } = createFixture();
    return sut.set(AccountName, autoScalingGroup, UpdateAction).then(() => {
      sinon.assert.calledWith(launchConfigurationClientMock.delete, sinon.match({
        name: 'LaunchConfig_pr1-ta-Web'
      }));
    });
  });

  it('Original LaunchConfiguration should be created with the updated instance type', () => {
    let { launchConfigurationClientMock, sut } = createFixture();
    return sut.set(AccountName, autoScalingGroup, UpdateAction).then(() => {
      sinon.assert.calledWith(launchConfigurationClientMock.post, sinon.match({
        LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web',
        updated: true
      }));
    });
  });

  it('Original LaunchConfiguration should be attached to the AutoScalingGroup', () => {
    let { autoScalingGroupClientMock, sut } = createFixture();
    return sut.set(AccountName, autoScalingGroup, UpdateAction).then(() => {
      sinon.assert.calledWith(autoScalingGroupClientMock.put, sinon.match({
        name: AutoScalingGroupName,
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
      }));
    });
  });

  it('Backup LaunchConfiguration should be deleted', () => {
    let { launchConfigurationClientMock, sut } = createFixture();
    return sut.set(AccountName, autoScalingGroup, UpdateAction).then(() => {
      sinon.assert.calledWith(launchConfigurationClientMock.delete, sinon.match({
        name: 'LaunchConfig_pr1-ta-Web_Backup'
      }));
    });
  });
});

