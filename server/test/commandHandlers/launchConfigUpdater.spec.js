/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
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

  let launchConfigurationClientFactoryMock = {
    create: sinon.stub().returns(Promise.resolve(launchConfigurationClientMock)),
  };

  let autoScalingGroupClientMock = {
    put: sinon.stub().returns(Promise.resolve()),
  };

  let autoScalingGroupClientFactoryMock = {
    create: sinon.stub().returns(Promise.resolve(autoScalingGroupClientMock)),
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

    target.__set__('launchConfigurationClientFactory', launchConfigurationClientFactoryMock);
    target.__set__('autoScalingGroupClientFactory', autoScalingGroupClientFactoryMock);

    promise = target.set(AccountName, autoScalingGroup, UpdateAction);

  });

  it('should create LaunchConfiguration and AutoScalingGroup clients by account', () =>

    promise.then(() => {

      launchConfigurationClientFactoryMock.create.called.should.be.true();
      launchConfigurationClientFactoryMock.create.getCall(0).args.should.match([
        { accountName: AccountName },
      ]);

      launchConfigurationClientFactoryMock.create.called.should.be.true();
      launchConfigurationClientFactoryMock.create.getCall(0).args.should.match([
        { accountName: AccountName },
      ]);

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
