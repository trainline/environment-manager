/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
const injectSecurityGroup = require('inject-loader!../../../../models/SecurityGroup');
const injectSecurityGroupsProvider = require('inject-loader!../../../../modules/provisioning/launchConfiguration/securityGroupsProvider');

describe('SecurityGroupsProvider:', () => {
  let loggerMock = {
    warn: () => { },
    info: () => { },
    error: () => { }
  };

  describe('when server role configuration has "SecurityZone" set to "Other"', () => {
    let configuration = {
      serverRole: {
        SecurityZone: 'Other',
        ServerRoleName: 'Web'
      },
      environmentType: {
        VpcId: 'vpc-id'
      },
      cluster: {
        Name: 'Tango'
      }
    };

    let accountName = 'Sandbox';

    describe('and instances image is "Windows" based', () => {
      let image = {
        name: 'windows-2012r2-ttl-app-0.0.1',
        type: 'windows-2012r2-ttl-app',
        version: '0.0.1',
        platform: 'Windows'
      };

      describe('and all security groups exist in AWS', () => {
        let expectedOSSecurityGroup = {
          GroupId: 'sg-os-windows',
          Tags: [{ Key: 'Name', Value: 'sgOSWindows' }]
        };

        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup
          ]))
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {
          // Act
          let SecurityGroup = injectSecurityGroup({ '../modules/sender': senderMock });
          let target = injectSecurityGroupsProvider({ '../../../models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);
        });

        it('should be possible to check security group existance in AWS', () => {
          return promise.then(() => {
            senderMock.sendQuery.called.should.be.true();
            senderMock.sendQuery.getCall(0).args[1].should.match({
              query: {
                name: 'ScanSecurityGroups',
                accountName,
                vpcId: configuration.environmentType.VpcId
              }
            });
          });
        });

        it('should be possible to get a security group for Windows platform', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.matchAny(
              'sgOSWindows'
            );
          });
        });

        it('should be possible to get a security group for role and cluster', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.matchAny(
              `sgRole${configuration.cluster.Name}${configuration.serverRole.ServerRoleName}`
            );
          });
        });

        it('should not return any unexpected security group', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            securityGroupIds.should.have.length(2);
          });
        });
      });
    });

    describe('and instances image is "Linux" based', () => {
      let image = {
        name: 'oel-7-ttl-nodejs-0.0.1',
        type: 'oel-7-ttl-nodejs',
        version: '0.0.1',
        platform: 'Linux'
      };

      describe('and all security groups exist in AWS', () => {
        let expectedOSSecurityGroup = {
          GroupId: 'sg-os-linux',
          Tags: [{ Key: 'Name', Value: 'sgOSLinux' }]
        };

        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup
          ]))
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {
          // Act
          let SecurityGroup = injectSecurityGroup({ '../modules/sender': senderMock });
          let target = injectSecurityGroupsProvider({ '../../../models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);
        });

        it('should be possible to get a security group for Linux platform', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.matchAny(
              'sgOSLinux'
            );
          });
        });
      });

      describe('and linux platform related group does not exist in AWS', () => {
        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
          ]))
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {
          // Act
          let SecurityGroup = injectSecurityGroup({ '../modules/sender': senderMock });
          let target = injectSecurityGroupsProvider({ '../../../models/SecurityGroup': SecurityGroup });
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
    let configuration = {
      serverRole: {
        SecurityZone: 'Secure',
        ServerRoleName: 'Web'
      },
      environmentType: {
        VpcId: 'vpc-id'
      },
      cluster: {
        Name: 'Tango'
      }
    };

    let accountName = 'Sandbox';

    describe('and instances image is "Windows" based', () => {
      let image = {
        name: 'windows-2012r2-ttl-app-0.0.1',
        type: 'windows-2012r2-ttl-app',
        version: '0.0.1',
        platform: 'Windows'
      };

      describe('and all security groups exist in AWS', () => {
        let expectedOSSecurityGroup = {
          GroupId: 'sg-os-windows-secure',
          Tags: [{ Key: 'Name', Value: 'sgOSWindowsSecure' }]
        };

        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let expectedSecurityZoneSecurityGroup = {
          GroupId: 'sg-zone-secure',
          Tags: [{ Key: 'Name', Value: 'sgZoneSecure' }]
        };

        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup,
            expectedSecurityZoneSecurityGroup
          ]))
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {
          // Act
          let SecurityGroup = injectSecurityGroup({ '../modules/sender': senderMock });
          let target = injectSecurityGroupsProvider({ '../../../models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);
        });

        it('should be possible to get a security group for Windows secure platform', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.matchAny(
              'sgOSWindowsSecure'
            );
          });
        });

        it('should be possible to get a security group for secure SecurityZone', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();


            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedSecurityZoneSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.matchAny(
              'sgZoneSecure'
            );
          });
        });

        it('should not return any unexpected security group', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            securityGroupIds.should.have.length(3);
          });
        });
      });
    });

    describe('and instances image is "Linux" based', () => {
      let image = {
        name: 'oel-7-ttl-nodejs-0.0.1',
        type: 'oel-7-ttl-nodejs',
        version: '0.0.1',
        platform: 'Linux'
      };

      describe('and all security groups exist in AWS', () => {
        let expectedOSSecurityGroup = {
          GroupId: 'sg-os-linux-secure',
          Tags: [{ Key: 'Name', Value: 'sgOSLinuxSecure' }]
        };

        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let expectedSecurityZoneSecurityGroup = {
          GroupId: 'sg-zone-secure',
          Tags: [{ Key: 'Name', Value: 'sgZoneSecure' }]
        };

        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.resolve([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup,
            expectedSecurityZoneSecurityGroup
          ]))
        };

        let promise = null;

        before('getting security groups by configuration, image and account', () => {
          // Act
          let SecurityGroup = injectSecurityGroup({ '../modules/sender': senderMock });
          let target = injectSecurityGroupsProvider({ '../../../models/SecurityGroup': SecurityGroup });
          promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);
        });

        it('should be possible to get a security group for Linux secure platform', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.matchAny(
              'sgOSLinuxSecure'
            );
          });
        });
      });
    });
  });

  describe('when server role configuration has "SecurityGroups" set to a list of additional security groups', () => {
    let configuration = {
      serverRole: {
        SecurityZone: 'Other',
        SecurityGroups: [
          'sgCustomOne',
          'sgCustomTwo'
        ],
        ServerRoleName: 'Web'
      },
      environmentType: {
        VpcId: 'vpc-id'
      },
      cluster: {
        Name: 'Tango'
      }
    };

    let image = {
      name: 'windows-2012r2-ttl-app-0.0.1',
      type: 'windows-2012r2-ttl-app',
      version: '0.0.1',
      platform: 'Windows'
    };

    describe('and all security groups exist in AWS', () => {
      let accountName = 'Sandbox';

      let expectedOSSecurityGroup = {
        GroupId: 'sg-os-windows',
        Tags: [{ Key: 'Name', Value: 'sgOSWindows' }]
      };

      let expectedCustomOneSecurityGroup = {
        GroupId: 'sg-custom-one',
        Tags: [{ Key: 'Name', Value: 'sgCustomOne' }]
      };

      let expectedCustomTwoSecurityGroup = {
        GroupId: 'sg-custom-two',
        Tags: [{ Key: 'Name', Value: 'sgCustomTwo' }]
      };

      let senderMock = {
        sendQuery: sinon.stub().returns(Promise.resolve([
          expectedOSSecurityGroup,
          expectedCustomOneSecurityGroup,
          expectedCustomTwoSecurityGroup
        ]))
      };

      let promise = null;

      before('getting security groups by configuration, image and account', () => {
        // Act
        let SecurityGroup = injectSecurityGroup({ '../modules/sender': senderMock });
        let target = injectSecurityGroupsProvider({ '../../../models/SecurityGroup': SecurityGroup });
        promise = target.getFromConfiguration(configuration, image, accountName, loggerMock);
      });

      it('should be possible to get the security groups specified in configuration', () => {
        // Assert
        return promise.then((securityGroupIds) => {
          should(securityGroupIds).be.Array();

          securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedCustomOneSecurityGroup.GroupId));
          securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedCustomTwoSecurityGroup.GroupId));


          senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.matchAny(
            'sgCustomOne'
          );

          senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.matchAny(
            'sgCustomTwo'
          );
        });
      });

      it('should not return any unexpected security group', () => {
        // Assert
        return promise.then((securityGroupIds) => {
          securityGroupIds.should.have.length(3);

          senderMock.sendQuery.getCall(0).args[1].query.groupNames.should.not.matchAny(
            'sgRoleTangoWeb'
          );
        });
      });
    });
  });
});

