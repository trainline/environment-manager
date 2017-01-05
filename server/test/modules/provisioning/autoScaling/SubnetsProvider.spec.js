/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var should = require('should');
var sinon = require('sinon');

var subnetsProvider = require('modules/provisioning/autoScaling/subnetsProvider');

describe('SubnetsProvider:', () => {

  function provideConfiguration() {

    return {
      environmentTypeName: 'Test',
      serverRole: {
        SecurityZone: null,
        SubnetTypeName: null,
        AvailabilityZoneName: null,
      },
      environmentType: {
        Subnets: {
          PublicSecure: {
            AvailabilityZoneA: 'public-secure-a',
            AvailabilityZoneB: 'public-secure-b',
          },
          PrivateSecure: {
            AvailabilityZoneA: 'private-secure-a',
            AvailabilityZoneB: 'private-secure-b',
          },
          PrivateApp: {
            AvailabilityZoneA: 'private-app-a',
            AvailabilityZoneB: 'private-app-b',
          },
          PrivateLB: {
            AvailabilityZoneA: 'private-lb-a',
            AvailabilityZoneB: 'private-lb-b',
          },
          PublicLB: {
            AvailabilityZoneA: 'public-lb-a',
            AvailabilityZoneB: 'public-lb-b',
          },
          Public: {
            AvailabilityZoneA: 'public-a',
            AvailabilityZoneB: 'public-b',
          },
          PrivateShared: {
            AvailabilityZoneA: 'public-shared-a',
            AvailabilityZoneB: 'public-shared-b',
          },
        },
      },
    };

  }

  describe('when Subnet type is set to "foo"', () => {

    it('should throw not found error', () => {

      // Arrange
      var configuration = provideConfiguration();
      configuration.serverRole.SubnetTypeName = 'foo';

      // Act
      var target = subnetsProvider;
      var promise = target.get(configuration);

      // Assert
      return promise.then(result => should(result).be.deepEqual([
        configuration.environmentType.Subnets.PrivateApp.AvailabilityZoneA,
        configuration.environmentType.Subnets.PrivateApp.AvailabilityZoneB,
      ])).should.be.rejectedWith('Error retrieving subnet from "Test": Couldn\'t find Subnet Type foo in environment type config');

    });

  });


  describe('when server role configuration has "SubnetTypeName" set to "Public"', () => {

    it('should be possible to obtain "Public" subnets', () => {

      // Arrange
      var configuration = provideConfiguration();
      configuration.serverRole.SubnetTypeName = 'Public';

      // Act
      var target = subnetsProvider;
      var promise = target.get(configuration);

      // Assert
      return promise.then(result => should(result).be.deepEqual([
        configuration.environmentType.Subnets.Public.AvailabilityZoneA,
        configuration.environmentType.Subnets.Public.AvailabilityZoneB,
      ]));

    });

  });

  describe('when server role configuration has "AvailabilityZoneName" set to "A"', () => {

    it('should be possible to obtain only subnet in the Availability zone "A"', () => {

      // Arrange
      var configuration = provideConfiguration();
      configuration.serverRole.SubnetTypeName = 'Public';
      configuration.serverRole.AvailabilityZoneName = 'A';

      // Act
      var target = subnetsProvider;
      var promise = target.get(configuration);

      // Assert
      return promise.then(result => should(result).be.deepEqual([
        configuration.environmentType.Subnets.Public.AvailabilityZoneA,
      ]));

    });

  });

  describe('when server role configuration has "AvailabilityZoneName" set to "B"', () => {

    it('should be possible to obtain only subnet in the Availability zone "B"', () => {

      // Arrange
      var configuration = provideConfiguration();
      configuration.serverRole.SubnetTypeName = 'Public';
      configuration.serverRole.AvailabilityZoneName = 'B';

      // Act
      var target = subnetsProvider;
      var promise = target.get(configuration);

      // Assert
      return promise.then(result => should(result).be.deepEqual([
        configuration.environmentType.Subnets.Public.AvailabilityZoneB,
      ]));

    });

  });

  describe('when server role configuration has "AvailabilityZoneName" set to "*"', () => {

    it('should be possible to obtain both subnets', () => {

      // Arrange
      var configuration = provideConfiguration();
      configuration.serverRole.SubnetTypeName = 'Public';
      configuration.serverRole.AvailabilityZoneName = '*';

      // Act
      var target = subnetsProvider;
      var promise = target.get(configuration);

      // Assert
      return promise.then(result => should(result).be.deepEqual([
        configuration.environmentType.Subnets.Public.AvailabilityZoneA,
        configuration.environmentType.Subnets.Public.AvailabilityZoneB,
      ]));

    });

  });

  describe('when server role configuration has "AvailabilityZoneName" set to an invalid value', () => {

    it('should be possible to understand the error', () => {

      // Arrange
      var configuration = provideConfiguration();
      configuration.serverRole.SubnetTypeName = 'Public';
      configuration.serverRole.AvailabilityZoneName = '#';

      // Act
      var target = subnetsProvider;
      var promise = target.get(configuration);

      // Assert
      return promise.catch(function (error) {
        error.toString().should.be.containEql('Unknown "#" availability zone');
      });

    });

  });

  describe('when server role configuration has "SubnetTypeName" set to "Public"', () => {

    describe('but environment type does not contain any "Public" subnet', () => {

      it('should be possible to understand the error', () => {

        // Arrange
        var configuration = provideConfiguration();
        configuration.serverRole.SubnetTypeName = 'Public';
        configuration.environmentType.Subnets.Public = null;

        // Act
        var target = subnetsProvider;
        var promise = target.get(configuration);

        // Assert
        return promise.catch(error => {
          error.toString().should.be.containEql('"Public" subnet type not found');
        });

      });

    });

    describe('but environment type does not contain any availability zone for "Public" subnet', () => {

      it('should be possible to understand the error', () => {

        // Arrange
        var configuration = provideConfiguration();
        configuration.serverRole.SubnetTypeName = 'Public';
        configuration.environmentType.Subnets.Public.AvailabilityZoneA = ' ';
        configuration.environmentType.Subnets.Public.AvailabilityZoneB = ' ';

        // Act
        var target = subnetsProvider;
        var promise = target.get(configuration);

        // Assert
        return promise.catch(error => {
          error.toString().should.be.containEql('"Public" subnet type does not contain the expected availability zones');
        });

      });

    });

  });

});
