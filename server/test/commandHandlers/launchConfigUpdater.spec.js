/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon  = require('sinon');
let rewire = require('rewire');
let target = rewire('commands/launch-config/launchConfigUpdater');

describe('launchConfigUpdater: ', () => {

  let AccountName = 'Sandbox';
  let AutoScalingGroupName = 'pr1-ta-Web';
  let UpdateAction = (launchConfiguration) => launchConfiguration.updated = true;

  let launchConfigurationClientMock = {
    post: sinon.stub().returns(Promise.resolve()),
    delete: sinon.stub().returns(Promise.resolve()),
  };

  let index;

  let resourceProvider = { getInstanceByName: () => null };

  sinon.stub(resourceProvider, 'getInstanceByName', () => {
    if (index++ === 0) {
      return Promise.resolve(launchConfigurationClientMock);
    } else {
      return Promise.resolve(autoScalingGroupClientMock)
    }
  });

  let autoScalingGroupClientMock = {
    put: sinon.stub().returns(Promise.resolve()),
  };

  let expectedLaunchConfiguration = {
    LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web',
  };

  let autoScalingGroup = {
    getLaunchConfiguration: sinon.stub().returns(Promise.resolve(expectedLaunchConfiguration)),
    $autoScalingGroupName: AutoScalingGroupName,
  };


  let promise = null;

  before('Setting the launch configuration', () => {
    index = 0;

    target.__set__('resourceProvider', resourceProvider);

    promise = target.set(AccountName, autoScalingGroup, UpdateAction);

  });

  it('should create LaunchConfiguration and AutoScalingGroup clients by account', () =>

    promise.then(() => {

      resourceProvider.getInstanceByName.called.should.be.true();
      resourceProvider.getInstanceByName.getCall(0).args.should.match([ 'launchconfig', { accountName: AccountName }]);

      resourceProvider.getInstanceByName.called.should.be.true();
      resourceProvider.getInstanceByName.getCall(0).args.should.match([ 'launchconfig', { accountName: AccountName }]);

    })

  );

  it('AutoScalingGroup LaunchConfiguration should be copied with a different name', () =>

    promise.then(() => {

      launchConfigurationClientMock.post.called.should.be.true();
      launchConfigurationClientMock.post.getCall(0).args[0].should.match({
        LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web_Backup',
      });

    })

  );

  it('AutoScalingGroup should be attached to the copied LaunchConfiguration', () =>

    promise.then(() => {

      autoScalingGroupClientMock.put.called.should.be.true();
      autoScalingGroupClientMock.put.getCall(0).args[0].should.match({
        name: AutoScalingGroupName,
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web_Backup',
      });

    })

  );

  it('Original LaunchConfiguration should be deleted', () =>

    promise.then(() => {

      launchConfigurationClientMock.delete.called.should.be.true();
      launchConfigurationClientMock.delete.getCall(0).args[0].should.match({
        name: 'LaunchConfig_pr1-ta-Web',
      });

    })

  );

  it('Original LaunchConfiguration should be created with the updated instance type', () =>

    promise.then(() => {

      launchConfigurationClientMock.post.getCall(1).args[0].should.match({
        LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web',
        updated: true,
      });

    })

  );

  it('Original LaunchConfiguration should attached to the AutoScalingGroup', () =>

    promise.then(() => {

      autoScalingGroupClientMock.put.called.should.be.true();
      autoScalingGroupClientMock.put.getCall(1).args[0].should.match({
        name: AutoScalingGroupName,
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      });

    })

  );

  it('Backup LaunchConfiguration should be deleted', () =>

    promise.then(() => {

      launchConfigurationClientMock.delete.getCall(1).args[0].should.match({
        name: 'LaunchConfig_pr1-ta-Web_Backup',
      });

    })

  );

});
