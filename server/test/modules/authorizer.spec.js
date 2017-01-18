/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let authorize = require('modules/authorizer');
let should = require('should');
let assert = require('assert');

describe('authorizer', () => {

  describe('basic resource requirements', () => {

    it('should authorize if permission matches', () => {
      var requirements = [{ resource: '/something', access: 'put' }];
      var permissions = [{ Resource: '/something', Access: 'put' }];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should not authorize if permission has different path', () => {
      var requirements = [{ resource: '/something', access: 'put' }];
      var permissions = [{ Resource: '/somethingElse', Access: 'put' }];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

    it('should not authorize if permission has different access', () => {
      var requirements = [{ resource: '/something', access: 'put' }];
      var permissions = [{ Resource: '/something', Access: 'post' }];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

    it('should authorize if permission has admin access', () => {
      var requirements = [{ resource: '/something', access: 'put' }];
      var permissions = [{ Resource: '/something', Access: 'ADMIN' }];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize if any permission matches', () => {
      var requirements = [{ resource: '/something', access: 'put' }];
      var permissions = [
        { Resource: '/somethingElse', Access: 'put' },
        { Resource: '/something', Access: 'put' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize if wildcard permission matches', () => {
      var requirements = [{ resource: '/something', access: 'put' }];
      var permissions = [{ Resource: '**', Access: 'put' }];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize if permission matches wildcarded resource path', () => {
      var requirements = [{ resource: '/some/thing/*', access: 'put' }];
      var permissions = [{ Resource: '/*/thing/*', Access: 'put' }];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize legacy cluster permissions', () => {
      var requirements = [
        { resource: '/something', access: 'put' },
        { resource: '/permissions/clusters/cluster1', access: 'put' }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Resource: '/permissions/clusters/cluster1', Access: 'put' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize legacy environment type permissions', () => {
      var requirements = [
        { resource: '/something', access: 'put' },
        { resource: '/permissions/environmenttypes/et1', access: 'put' }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Resource: '/permissions/environmenttypes/et1', Access: 'put' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize if permission matches but resource is the wrong case', () => {
      var requirements = [{ resource: '/something', access: 'put' }];
      var permissions = [{ Resource: '/Something', Access: 'put' }];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize if permission matches but access is the wrong case', () => {
      var requirements = [{ resource: '/something', access: 'put' }];
      var permissions = [{ Resource: '/something', Access: 'Put' }];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

  });

  describe('resources restricted to clusters', () => {

    it('should not authorize if no cluster permissions', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

    it('should authorize with permission to a cluster', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Cluster: 'cluster1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to a cluster but the permitted cluster case is wrong', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Cluster: 'CluSter1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to a cluster but the required cluster case is wrong', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['ClusTer1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Cluster: 'cluster1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to a cluster (legacy syntax)', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Resource: '/permissions/clusters/cluster1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to a cluster (legacy syntax) but the permitted resource case is wrong', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Resource: '/permissions/clusters/CluSter1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permissions to all clusters', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Cluster: 'all' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permissions to all clusters (different case)', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Cluster: 'ALL' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permissions to all clusters (legacy syntax)', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Resource: '/permissions/clusters/*' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with cluster-limited permission', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', Clusters: ['cluster1'] }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should not authorize toggle on environment-type when permission is limited', () => {
      var requirements = [
        { resource: '/toggle', access: 'put', environmentTypes: ['cluster'] }
      ];
      var permissions = [
        { Resource: '/toggle', Access: 'put', EnvironmentTypes: ['prod'] },
        { Resource: '/resize', Access: 'put' }, 
        { EnvironmentType: 'cluster' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

    it('should authorize with cluster-limited permission specifying all clusters', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', Clusters: 'all' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with cluster-limited permission specifying all clusters (different case)', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', Clusters: 'ALL' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with cluster-limited permission when no cluster required (permission mistake)', () => {
      var requirements = [
        { resource: '/something', access: 'put' }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', Clusters: ['cluster1'] }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to multiple clusters', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Cluster: 'cluster1' },
        { Cluster: 'cluster2' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should not authorize when multiple clusters are required', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1', 'cluster2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Cluster: 'cluster1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

    it('should authorize with permission to multiple clusters in any order', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1', 'cluster2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Cluster: 'cluster2' },
        { Cluster: 'cluster1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission with multiple cluster limitations', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1', 'cluster2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', Clusters: ['cluster1', 'cluster3', 'cluster2'] }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should not authorize with a mix of cluster permissions and cluster-limited resource permissions', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1', 'cluster2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', Clusters: ['cluster3', 'cluster2'] },
        { Cluster: 'cluster1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

  });

  describe('resources restricted to environment types', () => {

    it('should not authorize if no environment type permissions', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

    it('should authorize with permission to an environment type', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { EnvironmentType: 'environmenttype1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to a environmenttype but the permitted environmenttype case is wrong', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { EnvironmentType: 'EnviroNmentType1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to a environmenttype but the required environmenttype case is wrong', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['EnvirOnmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { EnvironmentType: 'environmenttype1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to a environmenttype (legacy syntax)', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Resource: '/permissions/environmenttypes/environmenttype1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to a environmenttype (legacy syntax) but the permitted resource case is wrong', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Resource: '/permissions/environmenttypes/EnVironmentTYpe1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permissions to all environmenttypes', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { EnvironmentType: 'all' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permissions to all environmenttypes (different case)', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { EnvironmentType: 'ALL' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permissions to all environmenttypes (legacy syntax)', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { Resource: '/permissions/environmenttypes/*' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with environmenttype-limited permission', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', EnvironmentTypes: ['environmenttype1'] }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should not authorize toggle on cluster when permission is limited', () => {
      var requirements = [
        { resource: '/toggle', access: 'put', clusters: ['tango'] }
      ];
      var permissions = [
        { Resource: '/toggle', Access: 'put', Clusters: ['vulcan'] },
        { Resource: '/resize', Access: 'put' }, 
        { Cluster: 'tango' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

    it('should authorize with environmenttype-limited permission specifying all environmenttypes', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', EnvironmentTypes: 'all' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with environmenttype-limited permission specifying all environmenttypes (different case)', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', EnvironmentTypes: 'ALL' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with environmenttype-limited permission when no environmenttype required (permission mistake)', () => {
      var requirements = [
        { resource: '/something', access: 'put' }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', EnvironmentTypes: ['environmenttype1'] }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission to multiple environmenttypes', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { EnvironmentType: 'environmenttype1' },
        { EnvironmentType: 'environmenttype2' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should not authorize when multiple environmenttypes are required', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1', 'environmenttype2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { EnvironmentType: 'environmenttype1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

    it('should authorize with permission to multiple environmenttypes in any order', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1', 'environmenttype2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put' },
        { EnvironmentType: 'environmenttype2' },
        { EnvironmentType: 'environmenttype1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize with permission with multiple environmenttype limitations', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1', 'environmenttype2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', EnvironmentTypes: ['environmenttype1', 'environmenttype3', 'environmenttype2'] }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should not authorize with a mix of environmenttype permissions and environmenttype-limited resource permissions', () => {
      var requirements = [
        { resource: '/something', access: 'put', environmentTypes: ['environmenttype1', 'environmenttype2'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', EnvironmentTypes: ['environmenttype3', 'environmenttype2'] },
        { EnvironmentType: 'environmenttype1' }
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(false);
    });

  });

  describe('resources restricted to both clusters and environment types', () => {

    it('should authorize with a combination of environmenttype, cluster, and limited resource permissions', () => {
      var requirements = [
        { resource: '/something', access: 'put', clusters: ['cluster1'], environmentTypes: ['environmenttype1'] }
      ];
      var permissions = [
        { Resource: '/something', Access: 'put', Clusters: ['cluster1'], EnvironmentTypes: ['environmenttype1'] },
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

    it('should authorize anything when permission is permission and legacy cluster / ET permission', () => {
      var requirements = [
        { resource: '/config/environments/c50', access: 'PUT', clusters: ['infra'], environmentTypes: ['cluster'] }
      ];
      var permissions = [
        { Resource: '**', Access: 'ADMIN' },
      ];
      should(isAuthorized(permissions, requirements)).be.exactly(true);
    });

  });

  describe('permissions with protected actions', function() {
    const PROTECTED_TEST_ACTION = 'PROTECTED_TEST_ACTION';
    const TEST_ENVIRONMENT_TYPE = 'TEST_ENVIRONMENT_TYPE';

    let requiredPermissions = [{
      protectedAction:PROTECTED_TEST_ACTION,
      environmentTypes: [TEST_ENVIRONMENT_TYPE]
    }];

    it('should not be authorized',
      () => assert.equal(authorize({}, requiredPermissions).authorized, false));

    it('should describe the action',
      () => assert.equal(authorize({}, requiredPermissions).protectedAction, PROTECTED_TEST_ACTION));

    it('should describe the environment Type',
      () => assert.equal(authorize({}, requiredPermissions).environmentType, TEST_ENVIRONMENT_TYPE));
  });
});

function isAuthorized(permissions, requirements) {
    return authorize(permissions, requirements).authorized;
}