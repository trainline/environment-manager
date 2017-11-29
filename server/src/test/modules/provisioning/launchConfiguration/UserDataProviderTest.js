/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
const inject = require('inject-loader!../../../../modules/provisioning/launchConfiguration/userDataProvider');

describe('UserDataProvider:', () => {
  context('given a configuration for \'Web\' server role', () => {
    let configuration = {
      environmentTypeName: 'Prod',
      environmentName: 'pr1',
      serverRole: {
        ServerRoleName: 'Web',
        SecurityZone: 'Secure',
        ContactEmailTag: 'test@email.com',
        ProjectCodeTag: '001',
        PuppetRole: 'PuppetRole'
      },
      cluster: {
        Name: 'Tango'
      }
    };

    let expectedLinuxContent = 'linux-content';
    let expectedWindowsContent = 'windows-content';
    let expecterRoleName = 'role-name';

    context('when image is linux based', () => {
      let image = {
        name: 'oel-7-ttl-nodejs-0.0.1',
        type: 'oel-7-ttl-nodejs',
        version: '0.0.1',
        platform: 'Linux'
      };

      it('should be possible to call userdata builder with proper linux userdata', () => {
        // Arrange
        let userDataBuilderMock = {
          buildLinuxUserData: sinon.stub().returns(Promise.resolve(expectedLinuxContent)),
          buildWindowsUserData: sinon.stub().returns(Promise.resolve(expectedWindowsContent))
        };

        let namingConventionProviderMock = {
          getRoleName: sinon.stub().returns(expecterRoleName)
        };

        // Act
        let target = inject({
          '../namingConventionProvider': namingConventionProviderMock,
          './UserDataBuilder': userDataBuilderMock
        });
        let promise = target.get(configuration, image);

        // Assert
        return promise.then((result) => {
          should(result).be.equal(expectedLinuxContent);

          userDataBuilderMock.buildLinuxUserData.called.should.be.true();
          userDataBuilderMock.buildLinuxUserData.getCall(0).args[0].should.match({
            EnvironmentType: configuration.environmentTypeName,
            Environment: configuration.environmentName,
            SecurityZone: configuration.serverRole.SecurityZone,
            OwningCluster: configuration.cluster.Name,
            Role: expecterRoleName,
            ContactEmail: configuration.serverRole.ContactEmailTag,
            ProjectCode: configuration.serverRole.ProjectCodeTag,
            PuppetRole: configuration.serverRole.PuppetRole
          });
        });
      });

      context('and a slice name is provided', () => {
        it('should be possible to get the role tag from namingConventionProvider service', () => {
          // Arrange
          let userDataBuilderMock = {
            buildLinuxUserData: sinon.stub().returns(Promise.resolve()),
            buildWindowsUserData: sinon.stub().returns(Promise.resolve())
          };

          let namingConventionProviderMock = {
            getRoleName: sinon.stub().returns(expecterRoleName)
          };

          let sliceName = 'blue';

          // Act
          let target = inject({
            '../namingConventionProvider': namingConventionProviderMock,
            './UserDataBuilder': userDataBuilderMock
          });
          let promise = target.get(configuration, image, sliceName);

          // Assert
          return promise.then(() => {
            namingConventionProviderMock.getRoleName.called.should.be.true();
            namingConventionProviderMock.getRoleName.getCall(0).args.should.match(
              [configuration, sliceName]
            );
          });
        });
      });
    });

    context('when image is windows based', () => {
      let image = {
        name: 'windows-2012r2-ttl-app-0.0.1',
        type: 'windows-2012r2-ttl-app',
        version: '0.0.1',
        platform: 'Windows'
      };

      it('should be possible to call userdata builder with proper windows userdata', () => {
        // Arrange
        let userDataBuilderMock = {
          buildLinuxUserData: sinon.stub().returns(Promise.resolve(expectedLinuxContent)),
          buildWindowsUserData: sinon.stub().returns(Promise.resolve(expectedWindowsContent))
        };

        let namingConventionProviderMock = {
          getRoleName: sinon.stub().returns(expecterRoleName)
        };

        // Act
        let target = inject({
          '../namingConventionProvider': namingConventionProviderMock,
          './UserDataBuilder': userDataBuilderMock
        });
        let promise = target.get(configuration, image);

        // Assert
        return promise.then((result) => {
          should(result).be.equal(expectedWindowsContent);

          userDataBuilderMock.buildWindowsUserData.called.should.be.true();
          userDataBuilderMock.buildWindowsUserData.getCall(0).args[0].should.match({
            ContactEmail: configuration.serverRole.ContactEmailTag,
            Environment: configuration.environmentName,
            OwningCluster: configuration.cluster.Name,
            Role: expecterRoleName,
            EnvironmentType: configuration.environmentTypeName,
            SecurityZone: configuration.serverRole.SecurityZone,
            ProjectCode: configuration.serverRole.ProjectCodeTag,
            PuppetRole: configuration.serverRole.PuppetRole,
            RemovalDate: configuration.serverRole.RemovalDateTag
          });
        });
      });

      context('and a slice name is provided', () => {
        it('should be possible to get the role tag from namingConventionProvider service', () => {
          // Arrange
          let userDataBuilderMock = {
            buildLinuxUserData: sinon.stub().returns(Promise.resolve()),
            buildWindowsUserData: sinon.stub().returns(Promise.resolve())
          };

          let namingConventionProviderMock = {
            getRoleName: sinon.stub().returns(expecterRoleName)
          };

          let sliceName = 'blue';

          // Act
          let target = inject({
            '../namingConventionProvider': namingConventionProviderMock,
            './UserDataBuilder': userDataBuilderMock
          });
          let promise = target.get(configuration, image, sliceName);

          // Assert
          return promise.then(() => {
            namingConventionProviderMock.getRoleName.called.should.be.true();
            namingConventionProviderMock.getRoleName.getCall(0).args.should.match(
              [configuration, sliceName]
            );
          });
        });
      });
    });
  });
});

