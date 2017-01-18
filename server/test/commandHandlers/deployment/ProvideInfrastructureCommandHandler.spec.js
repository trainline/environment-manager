/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let sinonHelper = require('test/utils/sinonHelper');
let guid = require('node-uuid');

let proxyquire = require('proxyquire');

let LaunchConfigurationAlreadyExistsError = require('modules/errors/LaunchConfigurationAlreadyExistsError.class');
let AutoScalingGroupAlreadyExistsError = require('modules/errors/AutoScalingGroupAlreadyExistsError.class');
let Deployment = require('models/Deployment');

let ENVIRONMENT_NAME = 'pr1';
let SERVICE_NAME = 'MyService';
let ACCOUNT_NAME = 'Prod';

var deployment = new Deployment({
  id: '00000000-0000-0000-0000-000000000001',
  environmentName: ENVIRONMENT_NAME,
  environmentTypeName: 'Prod',
  serverRole: 'Web',
  serverRoleName: 'Web',
  serviceName: SERVICE_NAME,
  serviceVersion: '1.2.3',
  serviceSlice: '',
  clusterName: 'Tango',
  accountName: ACCOUNT_NAME,
  username: 'test-user',
});

var COMMAND = {
  name: 'ProvideInfrastructure',
  deployment: deployment,
  accountName: ACCOUNT_NAME,
};

var expectedConfiguration = {
  environmentName: ENVIRONMENT_NAME,
};

describe('ProvideInfrastructureCommandHandler:', () => {
  let mocks;

  function createTarget() {
    mocks = {
      infrastructureConfigurationProvider: {
        get: sinon.stub().returns(Promise.resolve()),
      },
      launchConfigurationTemplatesProvider: {
        get: sinon.stub().returns(Promise.resolve()),
      },
      autoScalingTemplatesProvider: {
        get: sinon.stub().returns(Promise.resolve()),
      },
      sender: {
        sendQuery: sinon.stub().returns(Promise.resolve()),
        sendCommand: sinon.stub().returns(Promise.resolve()),
      },
    };

    var mod = proxyquire('commands/deployments/ProvideInfrastructure', {
      'modules/provisioning/autoScalingTemplatesProvider': mocks.autoScalingTemplatesProvider,
      'modules/sender': mocks.sender,
      'modules/provisioning/infrastructureConfigurationProvider': mocks.infrastructureConfigurationProvider,
      'modules/provisioning/launchConfigurationTemplatesProvider': mocks.launchConfigurationTemplatesProvider,
    });
    return mod;
  }

  describe('when an AutoScalingGroup and its LaunchConfiguration are expected', () => {

    describe('and AutoScalingGroup already exists on AWS', () => {
      var promise = null;

      var expectedLaunchConfigurationTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      };

      // Mocking AutoScalingTemplatesProvider

      var expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      };

      before('Providing the infrastructure', () => {
        var target = createTarget();

        // Mocking ConfigurationProvider
        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));


        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        // Mocking LaunchConfigurationTemplatesProvider
        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        // Mocking Sender
        var expectedAutoScalingGroup = {
          AutoScalingGroupName: 'pr1-ta-Web',
        };

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanAutoScalingGroups' } }))
          .returns(Promise.resolve([expectedAutoScalingGroup]));

        mocks.sender.sendCommand
          .returns(Promise.resolve());

        promise = target(COMMAND);

      });

      beforeEach(() => {
        return promise;
      })

      it('should get configuration for environment and service', () => {
          mocks.infrastructureConfigurationProvider.get
            .called.should.be.true();

          mocks.infrastructureConfigurationProvider.get
            .getCall(0).args.should.match([ENVIRONMENT_NAME, SERVICE_NAME]);
      });

      it('should get AutoScaling templates for configuration', () => {
        mocks.autoScalingTemplatesProvider.get
          .called.should.be.true();

        mocks.autoScalingTemplatesProvider.get
          .getCall(0).args.should.match([expectedConfiguration, ACCOUNT_NAME]);
      });

      it('should not get LaunchConfiguration templates', () => {
        mocks.launchConfigurationTemplatesProvider.get
          .called.should.be.false()
      });

      it('should check the AutoScalingGroup presence', () => {
          let calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanAutoScalingGroups',
              accountName: ACCOUNT_NAME,
              autoScalingGroupNames: [expectedAutoScalingTemplate.autoScalingGroupName],
            },
          });
      });

      it('should not check the LaunchConfiguration presence', () => {
        let calls = sinonHelper.getCalls(mocks.sender.sendQuery);
        calls.map(call => call.args[0]).should.not.matchAny({
          query: { name: 'ScanLaunchConfigurations' },
        });
      });

      it('should not provide any AutoScalingGroup or LaunchConfiguration', () => {
        let calls = sinonHelper.getCalls(mocks.sender.sendCommand);
        let commands = calls.map(call => call.args[0]);

        commands.should.not.matchAny({ command: { name: 'CreateAutoScalingGroup' } });
        commands.should.not.matchAny({ command: { name: 'CreateLaunchConfiguration' } });
      });

    });

    describe('and AutoScalingGroup and its LaunchConfiguration do not exist on AWS', () => {
      let promise = null;

      let expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      };

      let expectedLaunchConfigurationTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      };

      before('Providing the infrastructure', () => {

        var target = createTarget();
        // Mocking ConfigurationProvider

        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        // Mocking AutoScalingTemplatesProvider

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        // Mocking LaunchConfigurationTemplatesProvider

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        // Mocking Sender

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanAutoScalingGroups' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanLaunchConfigurations' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendCommand.returns(Promise.resolve());

        promise = target(COMMAND);

      });

      it('should get AutoScaling templates for configuration', () =>
        promise.then(() => {
          mocks.autoScalingTemplatesProvider.get.called.should.be.true();
          mocks.autoScalingTemplatesProvider.get.getCall(0).args
            .should.match([expectedConfiguration, ACCOUNT_NAME]);

        })

      );

      it('should check the AutoScalingGroup presence', () =>
        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanAutoScalingGroups',
              accountName: ACCOUNT_NAME,
              autoScalingGroupNames: [expectedAutoScalingTemplate.autoScalingGroupName],
            },
          });

        })

      );

      it('should check the LaunchConfiguration presence', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanLaunchConfigurations',
              accountName: ACCOUNT_NAME,
              launchConfigurationNames: [expectedAutoScalingTemplate.launchConfigurationName],
            },
          });

        })

      );

      it('should get LaunchConfiguration templates for configuration', () =>
        promise.then(() => {
          mocks.launchConfigurationTemplatesProvider.get.called.should.be.true();
          mocks.launchConfigurationTemplatesProvider.get.getCall(0).args
            .should.match([expectedConfiguration, ACCOUNT_NAME]);
        })
      );

      it('should provide a new LaunchConfiguration by template', () =>
        promise.then(() => {
          mocks.sender.sendCommand.getCall(0).args[0]
            .should.match({
              command: {
                name: 'CreateLaunchConfiguration',
                accountName: ACCOUNT_NAME,
                template: expectedLaunchConfigurationTemplate,
              },
              parent: COMMAND,
            });
        })
      );

      it('should provide a new AutoScalingGroup by template', () =>

        promise.then(() => {
          mocks.sender.sendCommand.getCall(1).args[0]
            .should.match({
              command: {
                name: 'CreateAutoScalingGroup',
                accountName: ACCOUNT_NAME,
                template: expectedAutoScalingTemplate,
              },
            });
        })

      );
    });

    describe('and AutoScalingGroup does not exist but its LaunchConfiguration does', () => {
      var promise = null;

      var expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      };

      before('Providing the infrastructure', () => {
        var target = createTarget();

        // Mocking ConfigurationProvider
        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        // Mocking AutoScalingTemplatesProvider
        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        // Mocking LaunchConfigurationTemplatesProvider
        var expectedLaunchConfigurationTemplate = {
          launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
        };

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        // Mocking Sender
        var expectedLaunchConfiguration = {
          LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web',
        };

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanAutoScalingGroups' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanLaunchConfigurations' } }))
          .returns(Promise.resolve([expectedLaunchConfiguration]));

        mocks.sender.sendCommand.returns(Promise.resolve());

        promise = target(COMMAND);

      });

      it('should get AutoScaling templates for configuration', () =>

        promise.then(() => {

          mocks.autoScalingTemplatesProvider.get.called.should.be.true();

          mocks.autoScalingTemplatesProvider.get.getCall(0).args
            .should.match([expectedConfiguration, ACCOUNT_NAME]);

        })

      );

      it('should check the AutoScalingGroup presence', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanAutoScalingGroups',
              accountName: ACCOUNT_NAME,
              autoScalingGroupNames: [expectedAutoScalingTemplate.autoScalingGroupName],
            },
          });

        })

      );

      it('should check the LaunchConfiguration presence', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanLaunchConfigurations',
              accountName: ACCOUNT_NAME,
              launchConfigurationNames: [expectedAutoScalingTemplate.launchConfigurationName],
            },
          });

        })

      );

      it('should not get LaunchConfiguration templates', () =>

        promise.then(() =>
          mocks.launchConfigurationTemplatesProvider.get.called.should.be.false()
        )

      );

      it('should provide a new AutoScalingGroup by template', () =>

        promise.then(() =>

          mocks.sender.sendCommand.getCall(0).args[0].should.match({
            command: {
              name: 'CreateAutoScalingGroup',
              accountName: ACCOUNT_NAME,
              template: expectedAutoScalingTemplate,
            },
            parent: COMMAND,
          })

        )

      );

      it('should not provide any new LaunchConfiguration', () =>

        promise.then(() => {

          var commands = sinonHelper.getCalls(mocks.sender.sendCommand).map(call => call.args[0]);

          commands.should.not.matchAny({ command: { name: 'CreateLaunchConfiguration' } });

        })

      );

    });

    describe('and AutoScalingGroup and its LaunchConfiguration do not exist but a LaunchConfigurationAlreadyExistsError has thrown', () => {

      var promise = null;

      var expectedLaunchConfigurationTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      };

      var expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      };

      before('Providing the infrastructure', () => {

        var target = createTarget();

        // Mocking ConfigurationProvider

        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        // Mocking AutoScalingTemplatesProvider


        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        // Mocking LaunchConfigurationTemplatesProvider

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        // Mocking Sender

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanAutoScalingGroups' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanLaunchConfigurations' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendCommand.returns(Promise.resolve());

        mocks.sender.sendCommand
          .withArgs(sinon.match({ command: { name: 'CreateLaunchConfiguration' } }))
          .returns(Promise.reject(new LaunchConfigurationAlreadyExistsError()));

        promise = target(COMMAND);

      });

      it('should ignore the error and provide a new AutoScalingGroup anyway', () =>

        promise.then(() =>

          mocks.sender.sendCommand.getCall(1).args[0].should.match({
            command: {
              name: 'CreateAutoScalingGroup',
              accountName: ACCOUNT_NAME,
              template: expectedAutoScalingTemplate,
            },
            parent: COMMAND,
          })

        )

      );

    });

    describe('and AutoScalingGroup and its LaunchConfiguration do not exist but an AutoScalingGroupAlreadyExistsError has thrown', () => {

      var promise = null;

      var expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
      };

      before('Providing the infrastructure', () => {

        var target = createTarget();

        // Mocking ConfigurationProvider

        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        // Mocking AutoScalingTemplatesProvider

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        // Mocking LaunchConfigurationTemplatesProvider

        var expectedLaunchConfigurationTemplate = {
          launchConfigurationName: 'LaunchConfig_pr1-ta-Web',
        };

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        // Mocking Sender

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanAutoScalingGroups' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanLaunchConfigurations' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendCommand.returns(Promise.resolve());

        mocks.sender.sendCommand
          .withArgs(sinon.match({ command: { name: 'CreateAutoScalingGroup' } }))
          .returns(Promise.reject(new AutoScalingGroupAlreadyExistsError()));

        promise = target(COMMAND);

      });

      it('should ignore the error and return a fulfilled promise anyway', () => promise);

    });

  });

  describe('when blue/green AutoScalingGroups and their LaunchConfigurations are expected', () => {

    describe('and both AutoScalingGroups already exist on AWS', () => {
      var promise = null;


      // Mocking LaunchConfigurationTemplatesProvider

      var expectedLaunchConfigurationBlueTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue',
      };

      var expectedLaunchConfigurationGreenTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green',
      };


      var expectedAutoScalingBlueTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-blue',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue',
      };

      var expectedAutoScalingGreenTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-green',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green',
      };

      before('Providing the infrastructure', () => {

        var target = createTarget();

        // Mocking ConfigurationProvider

        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        // Mocking AutoScalingTemplatesProvider


        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingBlueTemplate, expectedAutoScalingGreenTemplate]));

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([
            expectedLaunchConfigurationBlueTemplate,
            expectedLaunchConfigurationGreenTemplate,
          ]));

        // Mocking Sender

        var expectedAutoScalingGroupBlue = {
          AutoScalingGroupName: 'pr1-ta-Web-blue',
        };

        var expectedAutoScalingGroupGreen = {
          AutoScalingGroupName: 'pr1-ta-Web-green',
        };

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanAutoScalingGroups' } }))
          .returns(Promise.resolve([
            expectedAutoScalingGroupBlue,
            expectedAutoScalingGroupGreen,
          ]));

        mocks.sender.sendCommand.returns(Promise.resolve());

        promise = target(COMMAND);

      });

      it('should check the AutoScalingGroup presence', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanAutoScalingGroups',
              accountName: ACCOUNT_NAME,
              autoScalingGroupNames: [
                expectedAutoScalingBlueTemplate.autoScalingGroupName,
                expectedAutoScalingGreenTemplate.autoScalingGroupName,
              ],
            },
          });

        })

      );

      it('should not check the LaunchConfiguration presence', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.not.matchAny({
            query: { name: 'ScanLaunchConfigurations' },
          });

        })

      );

      it('should not provide any AutoScalingGroup or LaunchConfiguration', () =>

        promise.then(() => {

          var commands = sinonHelper.getCalls(mocks.sender.sendCommand).map(call => call.args[0]);

          commands.should.not.matchAny({ command: { name: 'CreateAutoScalingGroup' } });
          commands.should.not.matchAny({ command: { name: 'CreateLaunchConfiguration' } });

        })

      );

    });

    describe('and only blue AutoScalingGroup and blue LaunchConfiguration exist on AWS', () => {

      var promise = null;

      // Mocking LaunchConfigurationTemplatesProvider

      var expectedLaunchConfigurationBlueTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue',
      };

      var expectedLaunchConfigurationGreenTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green',
      };


      // Mocking AutoScalingTemplatesProvider

      var expectedAutoScalingBlueTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-blue',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue',
      };

      var expectedAutoScalingGreenTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-green',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green',
      };

      before('Providing the infrastructure', () => {

        var target = createTarget();

        // Mocking ConfigurationProvider

        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([
            expectedAutoScalingBlueTemplate,
            expectedAutoScalingGreenTemplate,
          ]));

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([
            expectedLaunchConfigurationBlueTemplate,
            expectedLaunchConfigurationGreenTemplate,
          ]));

        // Mocking Sender

        var expectedAutoScalingGroupBlue = {
          AutoScalingGroupName: 'pr1-ta-Web-blue',
        };

        var expectedLaunchConfigurationBlue = {
          LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue',
        };

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanAutoScalingGroups' } }))
          .returns(Promise.resolve([expectedAutoScalingGroupBlue]));

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanLaunchConfigurations' } }))
          .returns(Promise.resolve([expectedLaunchConfigurationBlue]));

        mocks.sender.sendCommand.returns(Promise.resolve());

        promise = target(COMMAND);

      });

      it('should check the AutoScalingGroups presence', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanAutoScalingGroups',
              accountName: ACCOUNT_NAME,
              autoScalingGroupNames: [
                expectedAutoScalingBlueTemplate.autoScalingGroupName,
                expectedAutoScalingGreenTemplate.autoScalingGroupName,
              ],
            },
          });

        })

      );

      it('should check green LaunchConfiguration presence only', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanLaunchConfigurations',
              accountName: ACCOUNT_NAME,
              launchConfigurationNames: [expectedAutoScalingGreenTemplate.launchConfigurationName],
            },
          });

        })

      );

      it('should provide green LaunchConfiguration only', () =>

        promise.then(() =>

          mocks.sender.sendCommand.getCall(0).args[0]
          .should.match({
            command: {
              name: 'CreateLaunchConfiguration',
              accountName: ACCOUNT_NAME,
              template: expectedLaunchConfigurationGreenTemplate,
            },
            parent: COMMAND,
          })

        )

      );

      it('should provide green AutoScalingGroup only', () =>

        promise.then(() =>

          mocks.sender.sendCommand.getCall(1).args[0]
          .should.match({
            command: {
              name: 'CreateAutoScalingGroup',
              accountName: ACCOUNT_NAME,
              template: expectedAutoScalingGreenTemplate,
            },
            parent: COMMAND,
          })

        )

      );

    });

    describe('and both AutoScalingGroups do not exist on AWS', () => {
      var promise = null;

      // Mocking AutoScalingTemplatesProvider
      var expectedAutoScalingBlueTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-blue',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue',
      };

      var expectedAutoScalingGreenTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-green',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green',
      };


      // Mocking LaunchConfigurationTemplatesProvider
      var expectedLaunchConfigurationBlueTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue',
      };

      var expectedLaunchConfigurationGreenTemplate = {
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green',
      };

      before('Providing the infrastructure', () => {
        var target = createTarget();

        // Mocking ConfigurationProvider
        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([
            expectedAutoScalingBlueTemplate,
            expectedAutoScalingGreenTemplate,
          ]));

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([
            expectedLaunchConfigurationBlueTemplate,
            expectedLaunchConfigurationGreenTemplate,
          ]));

        // Mocking Sender

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanAutoScalingGroups' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendQuery
          .withArgs(sinon.match({ query: { name: 'ScanLaunchConfigurations' } }))
          .returns(Promise.resolve([]));

        mocks.sender.sendCommand.returns(Promise.resolve());
        promise = target(COMMAND);
      });

      it('should check the AutoScalingGroup presence', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanAutoScalingGroups',
              accountName: ACCOUNT_NAME,
              autoScalingGroupNames: [
                expectedAutoScalingBlueTemplate.autoScalingGroupName,
                expectedAutoScalingGreenTemplate.autoScalingGroupName,
              ],
            },
          });

        })

      );

      it('should check the LaunchConfiguration presence', () =>

        promise.then(() => {

          var calls = sinonHelper.getCalls(mocks.sender.sendQuery);
          calls.map(call => call.args[0]).should.matchAny({
            query: {
              name: 'ScanLaunchConfigurations',
              accountName: ACCOUNT_NAME,
              launchConfigurationNames: [
                expectedAutoScalingBlueTemplate.launchConfigurationName,
                expectedAutoScalingGreenTemplate.launchConfigurationName,
              ],
            },
          });

        })

      );

      it('should provide both LaunchConfigurations', () =>

        promise.then(() => {

          mocks.sender.sendCommand.getCall(0).args[0].should.match({
            command: {
              name: 'CreateLaunchConfiguration',
              accountName: ACCOUNT_NAME,
              template: expectedLaunchConfigurationBlueTemplate,
            },
            parent: COMMAND,
          });

          mocks.sender.sendCommand.getCall(1).args[0].should.match({
            command: {
              name: 'CreateLaunchConfiguration',
              accountName: ACCOUNT_NAME,
              template: expectedLaunchConfigurationGreenTemplate,
            },
            parent: COMMAND,
          });

        })

      );

      it('should provide both AutoScalingGroups', () =>

        promise.then(() => {

          mocks.sender.sendCommand.getCall(2).args[0].should.match({
            command: {
              name: 'CreateAutoScalingGroup',
              accountName: ACCOUNT_NAME,
              template: expectedAutoScalingBlueTemplate,
            },
            parent: COMMAND,
          });

          mocks.sender.sendCommand.getCall(3).args[0].should.match({
            command: {
              name: 'CreateAutoScalingGroup',
              accountName: ACCOUNT_NAME,
              template: expectedAutoScalingGreenTemplate,
            },
            parent: COMMAND,
          });

        })

      );

    });

  });

});
