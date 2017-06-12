/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

describe('SecurityGroupsProvider:', () => {

  var loggerMock = {
    warn: () => {},
    info: () => {},
    error: () => {}
  };

  describe('when server role configuration has "SecurityZone" set to "Other"', () => {

    var configuration = {
      serverRole: {
        SecurityZone: 'Other',
        ServerRoleName: 'Web',
      },
      environmentType: {
        VpcId: 'vpc-id',
      },
      cluster: {
        Name: 'Tango',
      },
    };

    var accountName = 'Sandbox';

    describe('and instances image is "Windows" based', () => {

      var image = {
        name: 'windows-2012r2-ttl-app-0.0.1',
        type: 'windows-2012r2-ttl-app',
        version: '0.0.1',
        platform: 'Windows',
      };

      describe('and all security groups exist in AWS', () => {

        var expectedOSSecurityGroup = {
          GroupId: 'sg-os-windows',
          Tags: [{ Key: 'Name', Value: 'sgOSWindows' }],
        };

        var expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }],
        };

        var senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup,
          ])),
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {

          // Act
          let SecurityGroup = proxyquire('models/SecurityGroup', { 'modules/sender': senderMock });
          var target = proxyquire('modules/provisioning/launchConfiguration/securityGroupsProvider', { 'models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);

        });

        it('should be possible to check security group existance in AWS', () => {

          return promise.then(securityGroupIds => {

            senderMock.sendQuery.called.should.be.true();
            senderMock.sendQuery.getCall(0).args[0].should.match({
              query: {
                name: 'ScanSecurityGroups',
                accountName: accountName,
                vpcId: configuration.environmentType.VpcId,
              },
            });

          });

        });

        it('should be possible to get a security group for Windows platform', () => {

          // Assert
          return promise.then(securityGroupIds => {

            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny((it) => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.matchAny(
              'sgOSWindows'
            );

          });

        });

        it('should be possible to get a security group for role and cluster', () => {

          // Assert
          return promise.then(securityGroupIds => {

            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny((it) => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.matchAny(
              `sgRole${configuration.cluster.Name}${configuration.serverRole.ServerRoleName}`
            );

          });

        });

        it('should not return any unexpected security group', () => {

          // Assert
          return promise.then(securityGroupIds => {

            securityGroupIds.should.have.length(2);

          });

        });

      });
    });

    describe('and instances image is "Linux" based', () => {

      var image = {
        name: 'oel-7-ttl-nodejs-0.0.1',
        type: 'oel-7-ttl-nodejs',
        version: '0.0.1',
        platform: 'Linux',
      };

      describe('and all security groups exist in AWS', () => {

        var expectedOSSecurityGroup = {
          GroupId: 'sg-os-linux',
          Tags: [{ Key: 'Name', Value: 'sgOSLinux' }],
        };

        var expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }],
        };

        var senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup,
          ])),
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {

          // Act
          let SecurityGroup = proxyquire('models/SecurityGroup', { 'modules/sender': senderMock });
          var target = proxyquire('modules/provisioning/launchConfiguration/securityGroupsProvider', { 'models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);

        });

        it('should be possible to get a security group for Linux platform', () => {

          // Assert
          return promise.then(securityGroupIds => {

            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny((it) => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.matchAny(
              'sgOSLinux'
            );

          });

        });

      });

      describe('and linux platform related group does not exist in AWS', () => {

        var expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }],
        };

        var senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
          ])),
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {

          // Act
          let SecurityGroup = proxyquire('models/SecurityGroup', { 'modules/sender': senderMock });
          var target = proxyquire('modules/provisioning/launchConfiguration/securityGroupsProvider', { 'models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);

        });

        it('should be possible to understand the error', () => {
          // Assert
          return promise.then(
            () => should.ok(false, 'Promise should fail'),
            error =>
            error.name.should.be.equal('Error') &&
            error.toString().should.be.containEql('Error: Security group "sgRoleTangoWeb" not found in "vpc-id" VPC. It is assigned by default given server role and cluster. It can be overwritten by specifying one or more security groups in the server role configuration.')
          );

        });

      });

    });

  });

  describe('when server role configuration has "SecurityZone" set to "Secure"', () => {

    var configuration = {
      serverRole: {
        SecurityZone: 'Secure',
        ServerRoleName: 'Web',
      },
      environmentType: {
        VpcId: 'vpc-id',
      },
      cluster: {
        Name: 'Tango',
      },
    };

    var accountName = 'Sandbox';

    describe('and instances image is "Windows" based', () => {

      var image = {
        name: 'windows-2012r2-ttl-app-0.0.1',
        type: 'windows-2012r2-ttl-app',
        version: '0.0.1',
        platform: 'Windows',
      };

      describe('and all security groups exist in AWS', () => {

        var expectedOSSecurityGroup = {
          GroupId: 'sg-os-windows-secure',
          Tags: [{ Key: 'Name', Value: 'sgOSWindowsSecure' }],
        };

        var expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }],
        };

        var expectedSecurityZoneSecurityGroup = {
          GroupId: 'sg-zone-secure',
          Tags: [{ Key: 'Name', Value: 'sgZoneSecure' }],
        };

        var senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup,
            expectedSecurityZoneSecurityGroup,
          ])),
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {

          // Act
          let SecurityGroup = proxyquire('models/SecurityGroup', { 'modules/sender': senderMock });
          var target = proxyquire('modules/provisioning/launchConfiguration/securityGroupsProvider', { 'models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);

        });

        it('should be possible to get a security group for Windows secure platform', () => {

          // Assert
          return promise.then(securityGroupIds => {

            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny((it) => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));            

            senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.matchAny(
              'sgOSWindowsSecure'
            );

          });

        });

        it('should be possible to get a security group for secure SecurityZone', () => {

          // Assert
          return promise.then(securityGroupIds => {

            should(securityGroupIds).be.Array();


            securityGroupIds.should.matchAny((it) => it.GroupId.should.equal(expectedSecurityZoneSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.matchAny(
              'sgZoneSecure'
            );

          });

        });

        it('should not return any unexpected security group', () => {

          // Assert
          return promise.then(securityGroupIds => {

            securityGroupIds.should.have.length(3);

          });

        });

      });
    });

    describe('and instances image is "Linux" based', () => {

      var image = {
        name: 'oel-7-ttl-nodejs-0.0.1',
        type: 'oel-7-ttl-nodejs',
        version: '0.0.1',
        platform: 'Linux',
      };

      describe('and all security groups exist in AWS', () => {

        var expectedOSSecurityGroup = {
          GroupId: 'sg-os-linux-secure',
          Tags: [{ Key: 'Name', Value: 'sgOSLinuxSecure' }],
        };

        var expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }],
        };

        var expectedSecurityZoneSecurityGroup = {
          GroupId: 'sg-zone-secure',
          Tags: [{ Key: 'Name', Value: 'sgZoneSecure' }],
        };

        var senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup,
            expectedSecurityZoneSecurityGroup,
          ])),
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {

          // Act
          let SecurityGroup = proxyquire('models/SecurityGroup', { 'modules/sender': senderMock });
          var target = proxyquire('modules/provisioning/launchConfiguration/securityGroupsProvider', { 'models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);

        });

        it('should be possible to get a security group for Linux secure platform', () => {

          // Assert
          return promise.then(securityGroupIds => {

            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny((it) => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.matchAny(
              'sgOSLinuxSecure'
            );

          });

        })

      });

    });

  });

  describe('when server role configuration has "SecurityGroups" set to a list of additional security groups', () => {

    var configuration = {
      serverRole: {
        SecurityZone: 'Other',
        SecurityGroups: [
          'sgCustomOne',
          'sgCustomTwo',
        ],
        ServerRoleName: 'Web',
      },
      environmentType: {
        VpcId: 'vpc-id',
      },
      cluster: {
        Name: 'Tango',
      },
    };

    var image = {
      name: 'windows-2012r2-ttl-app-0.0.1',
      type: 'windows-2012r2-ttl-app',
      version: '0.0.1',
      platform: 'Windows',
    };

    describe('and all security groups exist in AWS', () => {

      var accountName = 'Sandbox';

      var expectedOSSecurityGroup = {
        GroupId: 'sg-os-windows',
        Tags: [{ Key: 'Name', Value: 'sgOSWindows' }],
      };

      var expectedCustomOneSecurityGroup = {
        GroupId: 'sg-custom-one',
        Tags: [{ Key: 'Name', Value: 'sgCustomOne' }],
      };

      var expectedCustomTwoSecurityGroup = {
        GroupId: 'sg-custom-two',
        Tags: [{ Key: 'Name', Value: 'sgCustomTwo' }],
      };

      var senderMock = {
        sendQuery: sinon.stub().returns(Promise.resolve([
          expectedOSSecurityGroup,
          expectedCustomOneSecurityGroup,
          expectedCustomTwoSecurityGroup,
        ])),
      };

      let promise = null;

      before('getting security groups by configuration, image and account', () => {

        // Act
        let SecurityGroup = proxyquire('models/SecurityGroup', { 'modules/sender': senderMock });
        var target = proxyquire('modules/provisioning/launchConfiguration/securityGroupsProvider', { 'models/SecurityGroup': SecurityGroup });
        promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);

      });

      it('should be possible to get the security groups specified in configuration', () => {

        // Assert
        return promise.then(securityGroupIds => {

          should(securityGroupIds).be.Array();

          securityGroupIds.should.matchAny((it) => it.GroupId.should.equal(expectedCustomOneSecurityGroup.GroupId));
          securityGroupIds.should.matchAny((it) => it.GroupId.should.equal(expectedCustomTwoSecurityGroup.GroupId));


          senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.matchAny(
            'sgCustomOne'
          );

          senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.matchAny(
            'sgCustomTwo'
          );

        });

      });

      it('should not return any unexpected security group', () => {

        // Assert
        return promise.then(securityGroupIds => {

          securityGroupIds.should.have.length(3);

          senderMock.sendQuery.getCall(0).args[0].query.groupNames.should.not.matchAny(
            'sgRoleTangoWeb'
          );

        });

      });

    });

  });

});

