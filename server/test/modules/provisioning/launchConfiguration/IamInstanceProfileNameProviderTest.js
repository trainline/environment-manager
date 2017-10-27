/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');
let InstanceProfileNotFoundError = require('../../../../modules/errors/InstanceProfileNotFoundError.class');

const accountName = 'Sandbox';

describe('IamInstanceProfileNameProvider:', () => {
  describe('when server role configuration has "InstanceProfileName" set', () => {
    it('should be possible to obtain it if really exists on AWS', () => {
      // Arrange
      let expectedInstanceProfile = { InstanceProfileName: 'ExistingIamRole' };

      let senderMock = {
        sendQuery: sinon.stub().returns(Promise.resolve(expectedInstanceProfile)),
      };

      let configuration = {
        serverRole: {
          ServerRoleName: 'Web',
          InstanceProfileName: 'existingiamrole',
        },
        cluster: {
          Name: 'Tango',
        },
      };

      // Act
      let target = proxyquire('../../../../modules/provisioning/launchConfiguration/iamInstanceProfileNameProvider', { '../../sender': senderMock });
      let promise = target.get(configuration, accountName);

      // Assert
      return promise.then(instanceProfileName => {
        instanceProfileName.should.be.equal(expectedInstanceProfile.InstanceProfileName);

        senderMock.sendQuery.called.should.be.true();
        senderMock.sendQuery.getCall(0).args[1].should.match({
          query: {
            name: 'GetInstanceProfile',
            accountName: accountName,
            instanceProfileName: configuration.serverRole.InstanceProfileName,
          },
        });
      });
    });

    describe('and it does not exist in AWS', () => {
      it('should be possible to understand the error', () => {
        // Arrange
        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.reject(new InstanceProfileNotFoundError(
            `Instance profile "existingiamrole" not found.`
          ))),
        };

        let configuration = {
          serverRole: {
            ServerRoleName: 'Web',
            InstanceProfileName: 'existingiamrole',
          },
          cluster: {
            Name: 'Tango',
          },
        };

        // Act
        let target = proxyquire('../../../../modules/provisioning/launchConfiguration/iamInstanceProfileNameProvider', { '../../sender': senderMock });
        let promise = target.get(configuration, accountName);

        // Assert
        return promise.catch(error =>
          error.toString().should.be.containEql('instance profile specified in configuration') &&
          error.toString().should.be.containEql('Instance profile "existingiamrole" not found')
        );

      });

    });

  });

  describe('when server role configuration has no "InstanceProfileName" set', () => {
    it('should be possible to obtain the one by convention if really exists in AWS', () => {
      // Arrange
      let expectedInstanceProfile = { InstanceProfileName: 'roleTangoWeb' };

      let senderMock = {
        sendQuery: sinon.stub().returns(Promise.resolve(expectedInstanceProfile)),
      };

      let configuration = {
        serverRole: {
          ServerRoleName: 'Web',
          InstanceProfileName: null,
        },
        cluster: {
          Name: 'Tango',
        },
      };

      // Act
      let target = proxyquire('../../../../modules/provisioning/launchConfiguration/iamInstanceProfileNameProvider', { '../../sender': senderMock });
      let promise = target.get(configuration, accountName);

      // Assert
      return promise.then(instanceProfileName => {

        instanceProfileName.should.be.equal(expectedInstanceProfile.InstanceProfileName);

        senderMock.sendQuery.called.should.be.true();
        senderMock.sendQuery.getCall(0).args[1].should.match({
          query: {
            name: 'GetInstanceProfile',
            accountName: accountName,
            instanceProfileName: 'roleTangoWeb',
          },
        });
      });
    });

    describe('and the one by convention does not exist in AWS', () => {
      it('should be possible to understand the error', () => {

        // Arrange
        let senderMock = {
          sendQuery: sinon.stub().returns(Promise.reject(new InstanceProfileNotFoundError(
            `Instance profile "roleTangoWeb" not found.`
          ))),
        };

        let configuration = {
          serverRole: {
            ServerRoleName: 'Web',
            InstanceProfileName: null,
          },
          cluster: {
            Name: 'Tango',
          },
        };

        // Act
        let target = proxyquire('../../../../modules/provisioning/launchConfiguration/iamInstanceProfileNameProvider', { '../../sender': senderMock });
        let promise = target.get(configuration, accountName);

        // Assert
        return promise.catch(error => {
          error.toString().should.be.containEql('instance profile defined by convention') &&
            error.toString().should.be.containEql('Instance profile "roleTangoWeb" not found');
        });
      });
    });

  });
});

