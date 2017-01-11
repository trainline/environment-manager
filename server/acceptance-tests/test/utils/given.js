/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var helper = require('./testHelper');

module.exports = {
  infraOpsEnvironmentDynamoDBTable: (environments) => {
    before('Configuring [InfraOpsEnvironmentDynamoDBTable] DynamoDB table', (done) => {
      helper.dynamo.resetTable({
        table: 'InfraOpsEnvironment',
        key: 'EnvironmentName',
        auditing: true,
        items: environments
      }, done);
    });
  },
  environmentsInDynamoDB: (environments) => {
    before('Configuring Environments DynamoDB table', (done) => {
      helper.dynamo.resetTable({
        table: 'ConfigEnvironments',
        key: 'EnvironmentName',
        auditing: true,
        items: environments
      }, done);
    });
  },
  servicesInDynamoDB: (services) => {
    before('Configuring Services DynamoDB table', (done) => {
      helper.dynamo.resetTable({
        table: 'ConfigServices',
        key: 'ServiceName',
        range: 'OwningCluster',
        auditing: true,
        items: services
      }, done);
    });
  },
  deploymentMapsInDynamoDB: (deploymentMaps) => {
    before('Configuring DeploymentMaps DynamoDB table', (done) => {
      helper.dynamo.resetTable({
        table: 'ConfigDeploymentMaps',
        key: 'DeploymentMapName',
        auditing: true,
        items: deploymentMaps
      }, done);
    });
  },
  upstreamsInDynamoDB: (upstreams) => {
    before('Configuring LoadBalancer Upstream DynamoDB table', (done) => {
      helper.dynamo.resetTable({
        table: 'ConfigLBUpstream',
        key: 'key',
        auditing: true,
        items: upstreams
      }, done);
    });
  },
  lbSettingsInDynamoDB: (settings) => {
    before('Configuring LoadBalancer settings DynamoDB table', (done) => {
      helper.dynamo.resetTable({
        table: 'ConfigLBSettings',
        key: 'EnvironmentName',
        range: 'VHostName',
        auditing: true,
        items: settings
      }, done);
    });
  },
};
