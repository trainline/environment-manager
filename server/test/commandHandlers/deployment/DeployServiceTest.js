/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');
const _ = require('lodash');

describe('DeployService', function () {
  let sut;
  let s3PackageLocator;
  let EnvironmentHelper;
  let environment;
  let environmentType;
  let infrastructureConfigurationProvider;
  let namingConventionProvider;
  let DeploymentContract;
  let packagePathProvider;
  let sender;
  let deploymentLogger;
  let autoScalingTemplatesProvider;
  let environmentTable;
  let DynamoHelper;
  let DynamoHelperLoader;
  let getAsg;

  const S3_PACKAGE = 's3://acme-bucket/em/binaries/package-3.1.0.tar';
  const ACCOUNT_NAME = 'acmeAccount';

  const configuration = {
    environmentTypeName: 'acmeEnvName',
    cluster: {
      Name: 'acmeClusterName'
    }
  };

  function createRequiredProps() {
    return {
      environmentName: 'env-name',
      serviceName: 'AcmeWidget',
      serviceVersion: '3.1.0',
      serviceSlice: 'none',
      mode: 'overwrite',
      serverRoleName: 'AcmeServer'
    };
  }

  function createCommand() {
    let command = createRequiredProps();
    command.commandId = 'abc123';
    command.username = 'roadrunner';
    return command;
  }

  beforeEach(() => {
    sut = rewire('commands/deployments/DeployService');

    environmentType = {
      AWSAccountName: ACCOUNT_NAME
    };
    environment = {
      getEnvironmentType: sinon.stub().returns(Promise.resolve(environmentType))
    };
    EnvironmentHelper = {
      getByName: sinon.stub().returns(Promise.resolve(environment))
    };
    s3PackageLocator = {
      findDownloadUrl: sinon.stub().returns(Promise.resolve(S3_PACKAGE))
    };
    infrastructureConfigurationProvider = {
      get: sinon.stub().returns(Promise.resolve(configuration))
    };
    namingConventionProvider = {
      getRoleName: () => 'acmeRoleName'
    };
    DeploymentContract = function (deployment) {
      this.validate = () => deployment;
      _.assign(this, deployment);
    };
    packagePathProvider = {
      getS3Path: sinon.stub().returns(Promise.resolve(''))
    };
    sender = {
      sendCommand: sinon.stub().returns(Promise.resolve({}))
    };
    deploymentLogger = {
      inProgress: sinon.stub(),
      updateStatus: sinon.stub(),
      started: sinon.stub().returns(Promise.resolve({}))
    };
    autoScalingTemplatesProvider = {
      get: sinon.stub().returns(Promise.resolve([{
        autoScalingGroupName: 'Name'
      }]))
    };
    environmentTable = {
      getByKey: sinon.stub().returns(Promise.resolve(''))
    };
    DynamoHelper = sinon.stub().returns(environmentTable);
    DynamoHelperLoader = {
      load: sinon.stub().returns(DynamoHelper)
    };
    getAsg = sinon.stub().returns(Promise.resolve(''));

    sut.__set__({ // eslint-disable-line no-underscore-dangle
      s3PackageLocator,
      EnvironmentHelper,
      infrastructureConfigurationProvider,
      namingConventionProvider,
      DeploymentContract,
      packagePathProvider,
      sender,
      deploymentLogger,
      autoScalingTemplatesProvider,
      DynamoHelperLoader,
      getAsg
    });
  });

  describe('required properties', function () {
    let requiredProps = createRequiredProps();

    Object.keys(requiredProps).forEach((p) => {
      it(`should throw if ${p} is missing`, () => {
        let invalidProps = Object.assign({}, requiredProps);
        delete invalidProps[p];
        assert.throws(sut.bind(this, invalidProps));
      });
    });
  });

  describe('if the packagePath is a valid URL', function () {
    beforeEach(function () {
      sender.sendCommand = sinon.stub().returns(Promise.resolve());
    });
    it('should mark it as a CodeDeploy Revision', function () {
      let cmd = createCommand();
      cmd.packagePath = 'http://localhost';
      return sut(cmd).then(() => sinon.assert.calledWith(sender.sendCommand,
        sinon.match({ command: { name: 'PreparePackage', source: { type: 'CodeDeployRevision' } } })));
    });
  });

  describe('if the packagePath is NOT a valid URL', function () {
    beforeEach(function () {
      sender.sendCommand = sinon.stub().returns(Promise.resolve());
    });
    it('should mark it as a DeploymentMap', function () {
      let cmd = createCommand();
      cmd.packagePath = 'NOT A URL';
      return sut(cmd).then(() => sinon.assert.calledWith(sender.sendCommand,
        sinon.match({ command: { name: 'PreparePackage', source: { type: 'DeploymentMap' } } })));
    });
  });

  describe('overwrite mode', function () {
    let command = createRequiredProps();
    command.mode = 'overwrite';
    command.serviceSlice = 'blue';

    it('should throw if slice is not \'none\'', (done) => {
      sut(command).catch((error) => {
        assert.equal(error.message, 'Slice must be set to \'none\' in overwrite mode.');
        done();
      });
    });
  });

  describe('blue/green mode', function () {
    let command = createRequiredProps();
    command.mode = 'bg';
    command.serviceSlice = 'none';

    it('should throw if slice is \'none\'', (done) => {
      sut(command).catch((error) => {
        assert.ok(error.message.indexOf('Unknown slice') === 0);
        done();
      });
    });
  });

  describe('when package path is not set', function () {
    let command;

    beforeEach(() => {
      command = createCommand();
    });

    it('should be obtained from S3 locator', (done) => {
      sut(command).then(() => {
        assert.equal(s3PackageLocator.findDownloadUrl.calledOnce, true);
        done();
      });
    });

    describe('if the package is found in S3', function () {
      beforeEach(function () {
        sender.sendCommand = sinon.stub().returns(Promise.resolve());
        s3PackageLocator.findDownloadUrl = sinon.stub().returns(Promise.resolve('https://s3-eu-west-1.amazonaws.com/tl-deployment-prod/PACKAGES/MyPackage/0.0.1/MyPackage-0.0.1.zip'));
      });
      it('should mark it as a CodeDeploy revision, not a DeploymentMap', function () {
        let cmd = createCommand();
        cmd.packagePath = undefined;
        return sut(cmd).then(() => sinon.assert.calledWith(sender.sendCommand, sinon.match({ command: { name: 'PreparePackage', source: { type: 'CodeDeployRevision' } } })));
      });
    });

    describe('if the package is found in S3', function () {
      beforeEach(() => {
        s3PackageLocator.findDownloadUrl = sinon.stub().returns(Promise.resolve(null));
      });

      it('should throw', (done) => {
        sut(command).catch((error) => {
          assert.ok(error.message.indexOf('Deployment package was not found') === 0);
          done();
        });
      });
    });
  });

  describe('deployments', function () {
    let command;
    let expectedPayload;

    /**
     * Note: Because the deployment is asynchronous (ie, we don't wait for
     * the 'deploy()' method to return), any tests that depend on sub-calls
     * of 'deploy 'should not rely on the sut().then() promise to guarantee completion.
     */
    beforeEach(() => {
      command = createCommand();
      expectedPayload = Object.assign({
        packagePath: S3_PACKAGE,
        accountName: ACCOUNT_NAME,
        packageType: 'CodeDeployRevision'
      }, command);
    });

    function createdExpectedCommandSpy(cmdName, done) {
      return function (arg) {
        if (arg.command.name === cmdName) {
          try {
            assert.deepEqual(arg.parent, expectedPayload);
            done();
          } catch (error) {
            done(error);
          }
        }
        return expectedPayload;
      };
    }

    it('should provide infrastructure', (done) => {
      sender.sendCommand = createdExpectedCommandSpy('ProvideInfrastructure', done);
      sut(command);
    });

    it('should prepare packages', (done) => {
      sender.sendCommand = createdExpectedCommandSpy('PreparePackage', done);
      sut(command);
    });

    it('should push to consul', (done) => {
      sender.sendCommand = createdExpectedCommandSpy('PushDeployment', done);
      sut(command);
    });

    it('should start the deployment logger', (done) => {
      sut(command).then(() => {
        assert.equal(deploymentLogger.started.calledOnce, true);
        done();
      });
    });

    it('should pass deployment to logger.inProgress', (done) => {
      deploymentLogger.inProgress = function (id, accountName) {
        assert.equal(id, command.commandId);
        assert.equal(accountName, ACCOUNT_NAME);
        done();
      };
      sut(command);
    });

    it('should throw when asg schedule is "OFF"', (done) => {
      // eslint-disable-next-line
      sut.__with__({
        getScheduleStateByAsg: sinon.stub().returns('off'),
        getAsg: sinon.stub().returns(Promise.resolve('something truthy!'))
      })(() => {
        let cmd = createCommand();
        return sut(cmd);
      })
      .catch(() => {
        assert.ok(true);
        done();
      });
    });

    describe('locked environments', function () {
      beforeEach(() => { environment.IsLocked = true; });

      it('should not allow deployments', (done) => {
        sut(command).catch((error) => {
          assert.equal(error.message.indexOf(
            `The environment ${command.environmentName} is currently locked for deployments`), 0);
          done();
        });
      });
    });
  });

  describe('dry run deployments', function () {
    let command;

    beforeEach(() => {
      command = createCommand();
      command.isDryRun = true;
    });

    it('should not call any sub commands', (done) => {
      sut(command).then(() => {
        assert.equal(sender.sendCommand.callCount, 0);
        done();
      });
    });

    it('should return a dry run result', (done) => {
      sut(command).then((result) => {
        assert.ok(result.isDryRun);
        assert.equal(result.packagePath, S3_PACKAGE);
        done();
      });
    });
  });
});

