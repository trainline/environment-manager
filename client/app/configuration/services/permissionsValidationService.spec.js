/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

describe('permissions validation', function () {
  beforeEach(module('EnvironmentManager.configuration'));

  var validatePermissions;
  beforeEach(inject(function (permissionsValidation) {
    validatePermissions = permissionsValidation;
  }));

  var validAccessTypes = ['POST', 'PUT', 'DELETE', 'ADMIN'];

  it('should only accept an array of permissions', function () {
    var errors = validatePermissions({});
    expect(errors.length).toBe(1);
    expect(errors[0]).toBe('Must be a javascript array');
  });

  it('should accept an empty array', function () {
    var errors = validatePermissions([]);
    expect(errors).not.toBeDefined();
  });

  validAccessTypes.forEach(function (access) {
    it('should accept access ' + access, function () {
      var errors = validatePermissions([{
        Resource: '*',
        Access: access
      }]);
      expect(errors).not.toBeDefined();
    });
  });

  it('should not accept invalid other access values', function () {
    var errors = validatePermissions([{
      Resource: '*',
      Access: 'rubbish'
    }]);
    expect(errors[0]).toBe('"Access" of permission 1 must be one of ' + validAccessTypes);
  });

  it('should not accept resource permissions without an access value', function () {
    var errors = validatePermissions([{
      Resource: '*'
    }]);
    expect(errors[0]).toBe('"Access" value of permission 1 is missing');
  });

  it('should validate more than one permission', function () {
    var errors = validatePermissions([{
      Resource: '*',
      Access: 'POST'
    }, {
      Resource: '*'
    }]);
    expect(errors[0]).toBe('"Access" value of permission 2 is missing');
  });

  it('should return multiple errors', function () {
    var errors = validatePermissions([{
      Resource: '*'
    }, {
      Resource: '*'
    }]);
    expect(errors[0]).toBe('"Access" value of permission 1 is missing');
    expect(errors[1]).toBe('"Access" value of permission 2 is missing');
  });

  it('should accept cluster permissions', function () {
    var errors = validatePermissions([{
      Cluster: 'tango'
    }]);
    expect(errors).not.toBeDefined();
  });

  it('should accept environment type permissions', function () {
    var errors = validatePermissions([{
      EnvironmentType: 'staging'
    }]);
    expect(errors).not.toBeDefined();
  });

  it('should not accept unknown attributes', function () {
    var errors = validatePermissions([{
      Rubbish: 'something'
    }]);
    expect(errors).toContain('Unknown attribute "Rubbish" on permission 1');
  });

  it('should not throw given parsing errors', function () {
    var errors = validatePermissions(['not an object']);
    expect(errors[0]).toBe('An error occurred evaluating permission 1');
  });

  it('should not accept an unknown permission type', function () {
    var errors = validatePermissions([{}]);
    expect(errors).toContain('Permission 1 is not a known type (should contain a Resource, Cluster, or EnvironmentType attribute)');
  });

  it('should accept resource permissions with restrictions', function () {
    var errors = validatePermissions([{
      Resource: '*',
      Access: 'PUT',
      Clusters: [''],
      EnvironmentTypes: ['']
    }]);
    expect(errors).not.toBeDefined();
  });

  it('should accept resource permissions with restrictions with "all" values', function () {
    var errors = validatePermissions([{
      Resource: '*',
      Access: 'PUT',
      Clusters: 'all',
      EnvironmentTypes: 'all'
    }]);
    expect(errors).not.toBeDefined();
  });

  it('should not accept resource permissions with Clusters restriction unless EnvironmentTypes restriction is also present', function () {
    var errors = validatePermissions([{
      Resource: '*',
      Access: 'PUT',
      Clusters: ['']
    }]);
    expect(errors).toContain('Permission 1 must contain both "Clusters" and "EnvironmentTypes" attributes or neither');
  });

  it('should not accept resource permissions with EnvironmentTypes restriction unless Clusters restriction is also present', function () {
    var errors = validatePermissions([{
      Resource: '*',
      Access: 'PUT',
      EnvironmentTypes: ['']
    }]);
    expect(errors).toContain('Permission 1 must contain both "Clusters" and "EnvironmentTypes" attributes or neither');
  });

  it('should not accept invalid Cluster restrictions', function () {
    var errors = validatePermissions([{
      Resource: '*',
      Access: 'PUT',
      Clusters: 'rubbish',
      EnvironmentTypes: ['']
    }]);
    expect(errors).toContain('Clusters attribute on permission 1 must be a javascript array or "all"');
  });

  it('should not accept invalid EnvironmentType restrictions', function () {
    var errors = validatePermissions([{
      Resource: '*',
      Access: 'PUT',
      Clusters: [''],
      EnvironmentTypes: 'rubbish'
    }]);
    expect(errors).toContain('EnvironmentTypes attribute on permission 1 must be a javascript array or "all"');
  });
});

