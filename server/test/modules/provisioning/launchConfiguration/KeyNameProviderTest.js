/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');
let KeyPairNotFoundError = require('modules/errors/KeyPairNotFoundError.class');

describe('KeyNameProvider:', () => {

  describe('when server role configuration has "ClusterKeyName" set', () => {

    it('should be possible to obtain it if really exists on AWS', () => {

      // Arrange
      var expectedKeyPair = { KeyName: 'CustomKeyPair' };

      var senderMock = {
        sendQuery: sinon.stub().returns(Promise.resolve(expectedKeyPair)),
      };

      var configuration = {
        serverRole: {
          ClusterKeyName: 'CustomKeyPair',
        },
        cluster: {
          Name: 'Tango',
        },
        environmentType: {
          AWSAccountName: 'Prod',
        },
      };

      var accountName = 'Sandbox';

      // Act
      var target = proxyquire('modules/provisioning/launchConfiguration/keyNameProvider', {
        'modules/sender': senderMock
      });
      var promise = target.get(configuration, accountName);

      // Assert
      return promise.then(keyName => {

        should(keyName).be.equal(expectedKeyPair.KeyName);

        senderMock.sendQuery.called.should.be.true();
        senderMock.sendQuery.getCall(0).args[0].should.match({
          query: {
            name: 'GetKeyPair',
            accountName: accountName,
            keyName: configuration.serverRole.ClusterKeyName,
          },
        });

      });

    });

    describe('and it does not exist in AWS', () => {

      it('should be possible to understand the error', () => {

        // Arrange
        var senderMock = {
          sendQuery: sinon.stub().returns(Promise.reject(new KeyPairNotFoundError(
            `Key pair "CustomKeyPair" not found.`
          ))),
        };

        var configuration = {
          serverRole: {
            ClusterKeyName: 'CustomKeyPair',
          },
          cluster: {
            Name: 'Tango',
          },
          environmentType: {
            AWSAccountName: 'Prod',
          },
        };

        var accountName = 'Sandbox';

        // Act
        var target = proxyquire('modules/provisioning/launchConfiguration/keyNameProvider', {
          'modules/sender': senderMock
        });
        var promise = target.get(configuration, accountName);

        // Assert
        return promise.catch(error =>
          error.toString().should.be.containEql('key pair specified in configuration') &&
          error.toString().should.be.containEql('Key pair "CustomKeyPair" not found')
        );

      });

    });

  });

  describe('when server role configuration has no "ClusterKeyName" set', () => {

    it('should be possible to obtain the one by convention if really exists on AWS', () => {

      // Arrange
      var expectedKeyPair = { KeyName: 'TangoProd' };

      var senderMock = {
        sendQuery: sinon.stub().returns(Promise.resolve(expectedKeyPair)),
      };

      var configuration = {
        serverRole: {
          ClusterKeyName: null,
        },
        cluster: {
          Name: 'Tango',
          KeyPair: 'ProdTango'
        },
        environmentType: {
          AWSAccountName: 'Prod',
        },
      };

      var accountName = 'Sandbox';

      // Act
      var target = proxyquire('modules/provisioning/launchConfiguration/keyNameProvider', {
        'modules/sender': senderMock
      });
      var promise = target.get(configuration, accountName);

      // Assert
      return promise.then(keyName => {

        should(keyName).be.equal(expectedKeyPair.KeyName);

        senderMock.sendQuery.called.should.be.true();
        senderMock.sendQuery.getCall(0).args[0].should.match({
          query: {
            name: 'GetKeyPair',
            accountName: accountName,
            keyName: configuration.cluster.KeyPair,
          },
        });

      });

    });

  });

  it('when neither server role configuration nor Cluster have key pair set,'
   + 'should be possible to understand the error', () => {

    // Arrange
    var senderMock = {
      sendQuery: sinon.stub().returns(Promise.reject(new KeyPairNotFoundError())),
    };

    var configuration = {
      serverRole: {
        ClusterKeyName: null,
      },
      cluster: {
        Name: 'Tango',
      },
      environmentType: {
        AWSAccountName: 'Prod',
      },
    };

    var accountName = 'Sandbox';

    // Act
    var target = proxyquire('modules/provisioning/launchConfiguration/keyNameProvider', {
      'modules/sender': senderMock
    });
    var promise = target.get(configuration, accountName);

    // Assert
    return promise.catch(error =>
      error.toString().should.be.containEql('Server role EC2 key pair set to cluster EC2 key pair, but this is empty. Please fix your configuration')
    );

  });

});

