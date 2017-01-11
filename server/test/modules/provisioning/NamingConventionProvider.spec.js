/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let namingConventionProvider = require('modules/provisioning/namingConventionProvider');

describe('NamingConventionProvider:', () => {

  describe('getting AutoScalingGroup name given a configuration and slice name', () => {

    it('should contain environment, cluster code (lowercase) and server role', () => {

      // Arrange
      var configuration = {
        environmentName: 'pr1',
        serverRole: {
          ServerRoleName: 'Web',
        },
        cluster: {
          ShortName: 'IN',
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getAutoScalingGroupName(configuration);

      // Assert
      should(result).be.equal('pr1-in-Web');

    });

    it("should expose the slice name when configuration 'FleetPerSlice' property is set to true", () => {

      // Arrange
      var configuration = {
        environmentName: 'pr1',
        serverRole: {
          ServerRoleName: 'Web',
          FleetPerSlice: true,
        },
        cluster: {
          ShortName: 'IN',
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getAutoScalingGroupName(configuration, 'blue');

      // Assert
      should(result).be.equal('pr1-in-Web-blue');

    });

    it("should not expose the slice name when configuration 'FleetPerSlice' property is set to false", () => {

      // Arrange
      var configuration = {
        environmentName: 'pr1',
        serverRole: {
          ServerRoleName: 'Web',
          FleetPerSlice: false,
        },
        cluster: {
          ShortName: 'IN',
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getAutoScalingGroupName(configuration, 'blue');

      // Assert
      should(result).be.equal('pr1-in-Web');

    });

  });

  describe('getting LaunchConfiguration name given a configuration and slice name', () => {

    it('should contain environment, cluster code (lowercase) and server role', () => {

      // Arrange
      var configuration = {
        environmentName: 'pr1',
        serverRole: {
          ServerRoleName: 'Web',
        },
        cluster: {
          ShortName: 'IN',
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getLaunchConfigurationName(configuration);

      // Assert
      should(result).be.equal('LaunchConfig_pr1-in-Web');

    });

    it("should expose the slice name when configuration 'FleetPerSlice' property is set to true", () => {

      // Arrange
      var configuration = {
        environmentName: 'pr1',
        serverRole: {
          ServerRoleName: 'Web',
          FleetPerSlice: true,
        },
        cluster: {
          ShortName: 'IN',
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getLaunchConfigurationName(configuration, 'blue');

      // Assert
      should(result).be.equal('LaunchConfig_pr1-in-Web-blue');

    });

    it("should not expose the slice name when configuration 'FleetPerSlice' property is set to false", () => {

      // Arrange
      var configuration = {
        environmentName: 'pr1',
        serverRole: {
          ServerRoleName: 'Web',
          FleetPerSlice: false,
        },
        cluster: {
          ShortName: 'IN',
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getLaunchConfigurationName(configuration, 'blue');

      // Assert
      should(result).be.equal('LaunchConfig_pr1-in-Web');

    });

  });

  describe('getting Role name given a configuration and slice name', () => {

    it("should match the configuration 'ServerRoleName' property", () => {

      // Arrange
      var configuration = {
        serverRole: {
          ServerRoleName: 'Web',
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getRoleName(configuration);

      // Assert
      should(result).be.equal('Web');

    });

    it("should expose the slice name when configuration 'FleetPerSlice' property is set to true", () => {

      // Arrange
      var configuration = {
        serverRole: {
          ServerRoleName: 'Web',
          FleetPerSlice: true,
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getRoleName(configuration, 'blue');

      // Assert
      should(result).be.equal('Web-blue');

    });

    it("should not expose the slice name when configuration 'FleetPerSlice' property is set to false", () => {

      // Arrange
      var configuration = {
        serverRole: {
          ServerRoleName: 'Web',
          FleetPerSlice: false,
        },
      };

      // Act
      var target = namingConventionProvider;
      var result = target.getRoleName(configuration, 'blue');

      // Assert
      should(result).be.equal('Web');

    });

  });

});
